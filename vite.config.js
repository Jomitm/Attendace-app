import { defineConfig, loadEnv } from 'vite';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
// Same pure quota rules the production function uses (api/_ai-insights.js).
import { quotaLimit, isQuotaRequest, nextUtcMidnight, quotaMessage, quotaContext } from './api/_ai-quota.js';
// Same pure hero-selection rules the production function uses (api/hero-select.js).
import { parseHeroAiResponse, sanitizeCandidates } from './api/_hero-select-core.js';

const require = createRequire(import.meta.url);
const { readBuildMeta } = require('./scripts/build-meta.cjs');
const buildMeta = readBuildMeta(process.cwd());
const __dirname = dirname(fileURLToPath(import.meta.url));

// Shared AI provider (prompt, policy facts, model fallback chain) — same file
// the production Vercel function uses, so dev and prod behave identically.
const { callAI, callAIStream, planToolAction, trimMetrics, classifyTaskBatch, generatePerformanceFallback } = require('./api/_ai-provider.cjs');

function generateFallbackInsight(metrics) {
    if (!metrics) return 'No data to show right now.';
    const lines = [];
    const today = metrics.today || (metrics.myAttendance ? { present: metrics.myAttendance ? 1 : 0, attendanceRate: metrics.myAttendance ? '100' : '0' } : null);
    if (metrics.myIssues && metrics.myIssues.length > 0) {
        const top = metrics.myIssues[0];
        lines.push(`### Fact\nYou have ${metrics.myIssues.length} pending item(s) today. Top: ${top.title}`);
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
    return lines.length > 0 ? lines.join('\n\n') : 'All good — no pending items right now.';
}

function readBody(req) {
    return new Promise((resolveBody, rejectBody) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8').trim();
            if (!raw) {
                resolveBody({});
                return;
            }
            try {
                resolveBody(JSON.parse(raw));
            } catch (err) {
                rejectBody(err);
            }
        });
        req.on('error', rejectBody);
    });
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

function createFeastDevPlugin() {
    let cachedIcal = null;
    let cacheTime = 0;
    const CACHE_TTL = 86400000;
    async function fetchIcal() {
        const upstream = await fetch('https://gcatholic.org/calendar/ics/2026-en-IN.ics', {
            headers: { 'Accept': 'text/calendar' },
            signal: AbortSignal.timeout(10000)
        });
        if (!upstream.ok) throw new Error('Upstream status ' + upstream.status);
        cachedIcal = await upstream.text();
        cacheTime = Date.now();
    }
    return {
        name: 'feast-dev-proxy',
        configureServer(server) {
            fetchIcal().catch(() => {}); // pre-warm cache on startup
            server.middlewares.use('/api/feast-proxy', async (req, res) => {
                try {
                    const now = Date.now();
                    if (!cachedIcal || (now - cacheTime) > CACHE_TTL) {
                        await fetchIcal();
                    }
                    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    res.end(cachedIcal);
                } catch (err) {
                    if (cachedIcal) {
                        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.end(cachedIcal);
                        return;
                    }
                    res.statusCode = 502;
                    res.end('Feast proxy error: ' + (err?.message || err));
                }
            });
        }
    };
}

// Local dev plugin for /api/ai-insights — same shared provider as production
// (api/_ai-provider.js): same layman prompt, policy facts and model fallback chain.
// Skips Firebase auth (local dev fallback login has no Firebase user).
function createAiInsightsDevPlugin() {
    // In-memory chat quota — same rules as api/_ai-quota.js, keyed by IP +
    // UTC day because dev skips Firebase auth. Makes the 429 flow testable
    // locally without a Firestore project.
    let usage = new Map();
    let usageDay = '';
    return {
        name: 'ai-insights-dev',
        configureServer(server) {
            server.middlewares.use('/api/ai-insights', async (req, res) => {
                if (req.method === 'OPTIONS') {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    return res.status(200).end();
                }
                if (req.method !== 'POST') {
                    return sendJson(res, 405, { error: 'Method not allowed' });
                }
                try {
                    const body = await readBody(req);
                    const { question, history, mode, tasks, stream, text } = body;
                    let metrics = body.metrics;

                    // ── Daily chat-question quota (dev mirror) ──
                    const limit = quotaLimit();
                    const day = new Date().toISOString().slice(0, 10);
                    if (day !== usageDay) { usage = new Map(); usageDay = day; }
                    const quotaKey = `${req.ip || req.socket?.remoteAddress || 'local'}_${day}`;
                    const chargeable = isQuotaRequest({ mode, question });
                    const charge = () => usage.set(quotaKey, (usage.get(quotaKey) || 0) + 1);
                    let quotaUsed = null;
                    if (chargeable || mode === 'tool_plan') {
                        quotaUsed = usage.get(quotaKey) || 0;
                        if (quotaUsed >= limit) {
                            if (mode === 'tool_plan') {
                                // Skip the LLM pre-check once capped; the answer
                                // request below returns the 429.
                                return sendJson(res, 200, { plan: { action: 'none' }, source: 'none', limited: true });
                            }
                            const resetsAt = nextUtcMidnight();
                            return sendJson(res, 429, {
                                error: 'daily_limit', limit, used: quotaUsed, resetsAt,
                                message: quotaMessage(limit, resetsAt)
                            });
                        }
                    }
                    // Tell the model its real quota (parity with production).
                    if (chargeable) metrics = { ...(metrics || {}), quota: quotaContext(limit, quotaUsed) };

                    if (mode === 'tool_plan') {
                        const plan = await planToolAction({ text, today: metrics?.today });
                        return sendJson(res, 200, { plan: plan || { action: 'none' }, source: plan ? 'ai' : 'none' });
                    }

                    // Streaming chat — pipe provider deltas to the client
                    if (stream) {
                        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                        res.setHeader('Cache-Control', 'no-store');
                        let any = false;
                        try {
                            for await (const delta of callAIStream({ metrics, question, history })) {
                                any = true;
                                res.write(delta);
                            }
                        } catch (e) {
                            console.warn('[ai-dev] stream error:', e?.message || e);
                        }
                        if (!any) {
                            const ai = await callAI({ metrics, question, history });
                            if (ai) {
                                if (chargeable) charge();
                                res.write(ai.insight);
                            } else {
                                // Mark rule-based replies so the client can show
                                // an "offline answers" note instead of pretending.
                                res.setHeader('X-AI-Source', 'rule-based');
                                res.write(generateFallbackInsight(trimMetrics(metrics)));
                            }
                        } else if (chargeable) {
                            charge();
                        }
                        return res.end();
                    }

                    if (mode === 'classify') {
                        const results = await classifyTaskBatch(tasks);
                        return sendJson(res, 200, { source: (process.env.OPENROUTER_API_KEY || process.env.XAI_API_KEY) ? 'ai' : 'heuristic', classifications: results });
                    }

                    if (!metrics && !question) {
                        return sendJson(res, 400, { error: 'metrics or question is required' });
                    }

                    console.log('[ai-dev] Keys loaded — OpenRouter:', process.env.OPENROUTER_API_KEY ? 'yes' : 'no', 'XAI:', process.env.XAI_API_KEY ? 'yes' : 'no');

                    const ai = await callAI({ metrics, question, history, mode });
                    if (ai) {
                        if (chargeable) charge();
                        console.log('[ai-dev] Using:', ai.model);
                        return sendJson(res, 200, {
                            insight: ai.insight,
                            source: 'ai',
                            model: ai.model,
                            degraded: ai.degraded
                        });
                    }

                    // No key configured, or every provider/model failed.
                    // Performance mode gets its own snapshot-aware fallback.
                    // Pass metrics as-is: trimMetrics()' chat whitelist would
                    // strip composite/dimensions and yield a 0/100 score.
                    if (mode === 'performance') {
                        return sendJson(res, 200, {
                            insight: generatePerformanceFallback(metrics || {}),
                            source: 'rule-based',
                            model: 'fallback'
                        });
                    }
                    return sendJson(res, 200, {
                        insight: generateFallbackInsight(trimMetrics(metrics)),
                        source: 'rule-based',
                        model: 'fallback'
                    });
                } catch (err) {
                    console.error('AI insights dev error:', err);
                    return sendJson(res, 500, { error: 'Internal server error' });
                }
            });
        }
    };
}

// Local dev plugin for /api/hero-select — same shared provider and validation
// as production (api/hero-select.js). Skips Firebase auth (dev fallback login
// has no Firebase user) and keeps picks in memory per period instead of the
// Firestore `hero_selections` collection.
function createHeroSelectDevPlugin() {
    const selections = new Map();
    return {
        name: 'hero-select-dev',
        configureServer(server) {
            server.middlewares.use('/api/hero-select', async (req, res) => {
                if (req.method === 'OPTIONS') {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    return res.status(200).end();
                }
                if (req.method !== 'POST') {
                    return sendJson(res, 405, { error: 'Method not allowed' });
                }
                try {
                    const body = await readBody(req);
                    const periodKey = String(body?.periodKey || '').trim();
                    if (!/^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(periodKey)) {
                        return sendJson(res, 400, { error: 'Invalid period key' });
                    }
                    const candidates = sanitizeCandidates(body?.candidates);
                    if (!candidates.length) {
                        return sendJson(res, 200, { pick: null, source: 'no_candidates' });
                    }
                    const allowIds = candidates.map((c) => c.id);

                    const stored = selections.get(periodKey);
                    if (stored && allowIds.includes(stored.userId)) {
                        return sendJson(res, 200, { pick: stored, source: 'stored' });
                    }

                    if (!(process.env.OPENROUTER_API_KEY || process.env.XAI_API_KEY)) {
                        return sendJson(res, 200, { pick: null, source: 'unavailable' });
                    }
                    const ai = await callAI({ metrics: { periodKey, candidates }, mode: 'hero' });
                    const parsed = ai?.insight ? parseHeroAiResponse(ai.insight, allowIds) : null;
                    if (!parsed) {
                        return sendJson(res, 200, { pick: null, source: ai ? 'invalid_answer' : 'ai_unavailable' });
                    }
                    const pick = { userId: parsed.userId, rationale: parsed.rationale, by: 'ai', model: String(ai?.model || '') };
                    selections.set(periodKey, pick);
                    return sendJson(res, 200, { pick, source: 'ai' });
                } catch (err) {
                    console.error('[hero-select-dev] error:', err);
                    return sendJson(res, 200, { pick: null, source: 'error' });
                }
            });
        }
    };
}

export default defineConfig({
    root: './',
    plugins: (() => {
        const runtimeEnv = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
        Object.assign(process.env, runtimeEnv);

        // Load raw .env vars without VITE_ prefix (for server-side use in dev plugins)
        try {
            const envPath = resolvePath(process.cwd(), '.env');
            const envContent = readFileSync(envPath, 'utf8');
            for (const line of envContent.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx < 1) continue;
                const key = trimmed.slice(0, eqIdx).trim();
                if (!process.env[key]) {
                    process.env[key] = trimmed.slice(eqIdx + 1).trim();
                }
            }
        } catch { /* no .env file, that's fine */ }

        return [createFeastDevPlugin(), createAiInsightsDevPlugin(), createHeroSelectDevPlugin()];
    })(),
    define: {
        __APP_BUILD_META__: JSON.stringify(buildMeta)
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: './index.html',
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});
