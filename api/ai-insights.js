// api/ai-insights.js
// Vercel serverless function: generates AI insights from metrics data.
//
// Security: requires a valid Firebase ID token (Authorization: Bearer <idToken>).
// The client sends it via window.AppFirebaseAuth.currentUser.getIdToken().
// Local dev (Vite plugin) skips this because the dev endpoint is same-origin
// and the dev login fallback has no Firebase user.
//
// Uses the shared provider in api/_ai-provider.js (model fallback chain,
// timeout, retries). Falls back to a rule-based summary when AI is unavailable.

import { getAdmin, getDb } from './_firebase-admin.js';
import { callAI, callAIStream, planToolAction, trimMetrics, classifyTaskBatch, generatePerformanceFallback } from './_ai-provider.js';
import { validatePerfSnapshot } from './_perf-snapshot.js';
import { quotaLimit, isQuotaRequest, quotaDocId, nextUtcMidnight, quotaMessage, quotaContext } from './_ai-quota.js';

function providersAvailable() {
    return Boolean(process.env.OPENROUTER_API_KEY || process.env.XAI_API_KEY);
}

const ALLOWED_ORIGIN = process.env.APP_ORIGIN || 'https://crwiattendance.vercel.app';

function applyCors(req, res) {
    const origin = req.headers.origin || '';
    const isDev = process.env.ALLOW_DEV_CORS === 'true';
    const allowed = origin === ALLOWED_ORIGIN || isDev;
    res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return allowed;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const corsOk = applyCors(req, res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (!corsOk) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    // ── Auth: verify Firebase ID token ──
    let authUid = null;
    const admin = getAdmin();
    if (!admin) return res.status(500).json({ error: 'Server configuration error' });
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        if (!token) return res.status(401).json({ error: 'Missing auth token' });
        const decoded = await admin.auth().verifyIdToken(token);
        authUid = decoded.uid;
    } catch (err) {
        console.warn('ai-insights auth failed:', err?.message || err);
        return res.status(401).json({ error: 'Invalid auth token' });
    }

    try {
        const { question, history, mode, tasks, stream, text } = req.body || {};
        let metrics = req.body && req.body.metrics;

        // ── Daily chat-question quota (per user, UTC day — api/_ai-quota.js) ──
        const limit = quotaLimit();
        const chargeable = isQuotaRequest({ mode, question });
        let quotaUsed = null;
        if (chargeable || mode === 'tool_plan') {
            quotaUsed = await readQuota(authUid);
            if (quotaUsed >= limit) {
                if (mode === 'tool_plan') {
                    // Limit hit: skip the LLM pre-check (no provider call).
                    // The client falls through to the answer request below, which 429s.
                    return res.status(200).json({ plan: { action: 'none' }, source: 'none', limited: true });
                }
                const resetsAt = nextUtcMidnight();
                return res.status(429).json({
                    error: 'daily_limit',
                    limit,
                    used: quotaUsed,
                    resetsAt,
                    message: quotaMessage(limit, resetsAt)
                });
            }
        }
        // Give the model the user's real quota so it answers "how many
        // questions can I ask?" truthfully instead of guessing "no limit".
        if (chargeable) metrics = { ...(metrics || {}), quota: quotaContext(limit, quotaUsed) };

        // Tool planning: LLM converts free text into an action plan (validated).
        if (mode === 'tool_plan') {
            const plan = await planToolAction({ text, today: metrics?.today });
            return res.status(200).json({ plan: plan || { action: 'none' }, source: plan ? 'ai' : 'none' });
        }

        // Streaming chat: pipe provider deltas straight to the client.
        if (stream) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('X-Accel-Buffering', 'no');
            let any = false;
            try {
                for await (const delta of callAIStream({ metrics, question, history })) {
                    any = true;
                    res.write(delta);
                }
            } catch (e) {
                console.warn('ai-insights stream error:', e?.message || e);
            }
            if (!any) {
                // Streaming unsupported/failed — fall back to non-streaming, then rule-based.
                const ai = await callAI({ metrics, question, history });
                if (ai) {
                    if (chargeable) await chargeQuota(admin, authUid);
                    res.write(ai.insight);
                } else {
                    // No AI available — mark the reply so the client can show
                    // an "offline answers" note instead of pretending.
                    res.setHeader('X-AI-Source', 'rule-based');
                    res.write(generateFallbackInsight(trimMetrics(metrics)));
                }
            } else if (chargeable) {
                await chargeQuota(admin, authUid);
            }
            return res.end();
        }

        // Task classification mode — returns strict JSON classifications
        if (mode === 'classify') {
            const results = await classifyTaskBatch(tasks);
            return res.status(200).json({ source: providersAvailable() ? 'ai' : 'heuristic', classifications: results });
        }

        // Performance mode — reject malformed snapshots before they reach the
        // model or the rule-based fallback (both assume this exact shape).
        if (mode === 'performance') {
            const check = validatePerfSnapshot(metrics);
            if (!check.ok) {
                return res.status(400).json({ error: 'Invalid performance snapshot', details: check.errors });
            }
        }

        if (!metrics && !question) {
            return res.status(400).json({ error: 'metrics or question is required' });
        }

        const ai = await callAI({ metrics, question, history, mode });
        if (ai) {
            if (chargeable) await chargeQuota(admin, authUid);
            return res.status(200).json({
                insight: ai.insight,
                source: 'ai',
                model: ai.model,
                degraded: ai.degraded,
                uid: authUid
            });
        }

        // Performance mode gets a performance-specific fallback (never the
        // generic team one, which produced wrong-context output).
        if (mode === 'performance') {
            return res.status(200).json({
                insight: generatePerformanceFallback(trimMetrics(metrics)),
                source: 'rule-based',
                model: 'fallback'
            });
        }

        // No key configured, or every provider/model failed → rule-based fallback.
        return res.status(200).json({
            insight: generateFallbackInsight(trimMetrics(metrics)),
            source: 'rule-based',
            model: 'fallback'
        });
    } catch (err) {
        console.error('AI insights error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── Daily chat-question quota I/O (Firestore collection `ai_usage`) ──
// Read and charge both fail-open: a Firestore hiccup must not block chat or
// fail an answer that already went out. Overshoot from in-flight requests is
// acceptable (small team), the counter self-heals at the next UTC day key.

async function readQuota(uid) {
    try {
        const snap = await getDb().collection('ai_usage').doc(quotaDocId(uid)).get();
        return snap.exists ? Number(snap.data()?.chats || 0) : 0;
    } catch (e) {
        console.warn('ai-quota read failed:', e?.message || e);
        return 0;
    }
}

async function chargeQuota(admin, uid) {
    try {
        await admin.firestore()
            .collection('ai_usage')
            .doc(quotaDocId(uid))
            .set(
                { chats: admin.firestore.FieldValue.increment(1), updatedAt: new Date().toISOString() },
                { merge: true }
            );
    } catch (e) {
        console.warn('ai-quota charge failed:', e?.message || e);
    }
}

// Rule-based fallback when AI is unavailable — layman
function generateFallbackInsight(metrics) {
    if (!metrics) return 'No data to show right now.';

    const lines = [];
    const today = metrics.today || (metrics.myAttendance ? { present: metrics.myAttendance ? 1 : 0, attendanceRate: metrics.myAttendance ? '100' : '0' } : null);

    if (metrics.myIssues && metrics.myIssues.length > 0) {
        const top = metrics.myIssues[0];
        lines.push(`### Fact\nYou have ${metrics.myIssues.length} pending item(s) today. Top: ${top.title} (source: attendance/tasks)`);
        lines.push(`### Observation\n${top.observation || top.detail}`);
        lines.push(`### Recommendation\n${top.recommendation} — Tap "${top.actionLabel || 'Take action'}"`);
        return lines.join('\n\n');
    }

    if (today) {
        const { present, absent, late, attendanceRate } = today;
        lines.push(`### Fact\nToday: ${present ?? 0} present, ${absent ?? 0} absent, ${late ?? 0} late — ${attendanceRate ?? 0}% came on time`);
        lines.push(`### Observation\n${Number(attendanceRate) >= 80 ? 'Attendance looks good today.' : 'A few people are missing today.'}`);
    }
    if (metrics.pendingLeaves > 0) {
        lines.push(`### Fact\n${metrics.pendingLeaves} leave request(s) waiting for approval`);
        lines.push(`### Recommendation\nIf one is yours, check with HR.`);
    }
    if (metrics.taskMetrics) {
        const { completionRate, total, completed } = metrics.taskMetrics;
        lines.push(`### Fact\nYour tasks: ${completed || 0}/${total || 0} done — ${completionRate || 0}% complete this month`);
        lines.push(`### Recommendation\n${Number(completionRate) >= 70 ? 'Nice — keep the same pace.' : 'Try to finish 2-3 tasks today to catch up.'}`);
    }
    if (metrics.trend && metrics.trend.length > 1) {
        const recent = metrics.trend.slice(-3);
        const avgRate = recent.reduce((s, t) => s + parseFloat(t.attendanceRate || 0), 0) / recent.length;
        lines.push(`### Fact\nLast 3 days average attendance: ${avgRate.toFixed(1)}%`);
    }
    return lines.length > 0 ? lines.join('\n\n') : 'All good — no pending items right now.';
}
