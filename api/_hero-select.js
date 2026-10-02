// api/_hero-select.js
// Vercel serverless function: AI Hero of the Week selection (routed via
// api/index.js).
//
// The deterministic ranking (js/modules/analytics.js) owns eligibility; this
// endpoint only picks a winner from the eligible candidates it is given and
// remembers the pick per ranking period so every device agrees.
//
// Fallback contract: whenever the AI is unavailable (no key, provider chain
// failure, invalid answer), the endpoint responds { pick: null } WITHOUT
// persisting — the client keeps its normal top-ranked eligible winner and the
// next load retries. Stored picks are only ever validated AI picks.
//
// Security: requires a valid Firebase ID token (Authorization: Bearer <idToken>).
// Local dev (Vite plugin) skips this because the dev endpoint is same-origin.

import { getAdmin, getDb } from './_firebase-admin.js';
import { callAI } from './_ai-provider.js';
import { buildHeroPeriodKey, heroSelectionDocId, parseHeroAiResponse, sanitizeCandidates } from './_hero-select-core.js';

// Origins allowed to POST (custom domain + deployment domains). APP_ORIGIN
// extends this list (comma-separated) so a misconfigured env can never lock
// the live site out.
const ALLOWED_ORIGINS = new Set(
    [
        'https://staff.crwi.org.in',
        'https://crwi-staff-management-system.vercel.app',
        'https://crwiattendance.vercel.app',
        ...String(process.env.APP_ORIGIN || '').split(',')
    ].map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean)
);
const MAX_BODY_BYTES = 64 * 1024;
const PERIOD_RE = /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/;

function providersAvailable() {
    return Boolean(process.env.OPENROUTER_API_KEY || process.env.XAI_API_KEY);
}

function applyCors(req, res) {
    const origin = req.headers.origin || '';
    const isDev = process.env.ALLOW_DEV_CORS === 'true';
    const allowed = ALLOWED_ORIGINS.has(origin) || isDev;
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
    const admin = getAdmin();
    if (!admin) return res.status(500).json({ error: 'Server configuration error' });
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        if (!token) return res.status(401).json({ error: 'Missing auth token' });
        await admin.auth().verifyIdToken(token);
    } catch (err) {
        console.warn('hero-select auth failed:', err?.message || err);
        return res.status(401).json({ error: 'Invalid auth token' });
    }

    try {
        const rawLen = Number(req.headers['content-length']) || 0;
        if (rawLen > MAX_BODY_BYTES) {
            return res.status(413).json({ error: 'Payload too large' });
        }
        const { periodKey, startDate, endDate, candidates } = req.body || {};
        const period = String(periodKey || '').trim() || buildHeroPeriodKey(startDate, endDate);
        if (!period || !PERIOD_RE.test(period)) {
            return res.status(400).json({ error: 'Invalid period key' });
        }
        const sanitized = sanitizeCandidates(candidates);
        if (!sanitized.length) {
            // Nothing eligible → the client's normal path already yields no hero.
            return res.status(200).json({ pick: null, source: 'no_candidates' });
        }
        const allowIds = sanitized.map((c) => c.id);
        const docId = heroSelectionDocId(period);

        const db = getDb();
        const ref = db.collection('hero_selections').doc(docId);

        // ── 1. Stored pick for this period (idempotent across devices) ──
        let stored = null;
        try {
            const snap = await ref.get();
            stored = snap.exists ? snap.data() : null;
        } catch (err) {
            console.warn('hero-select store read failed:', err?.message || err);
        }
        if (stored && allowIds.includes(String(stored.userId))) {
            return res.status(200).json({
                pick: {
                    userId: String(stored.userId),
                    rationale: String(stored.rationale || ''),
                    by: 'ai',
                    model: String(stored.model || '')
                },
                source: 'stored'
            });
        }

        // ── 2. New AI pick ──
        if (!providersAvailable()) {
            return res.status(200).json({ pick: null, source: 'unavailable' });
        }
        const ai = await callAI({ metrics: { periodKey: period, candidates: sanitized }, mode: 'hero' });
        const parsed = ai?.insight ? parseHeroAiResponse(ai.insight, allowIds) : null;
        if (!parsed) {
            // Invalid/absent answer — do NOT persist, client falls back to the
            // deterministic winner and the next load retries.
            return res.status(200).json({ pick: null, source: ai ? 'invalid_answer' : 'ai_unavailable' });
        }

        const record = {
            periodKey: period,
            userId: parsed.userId,
            rationale: parsed.rationale,
            model: String(ai?.model || ''),
            pickedBy: 'ai',
            createdAt: new Date().toISOString()
        };
        try {
            await db.runTransaction(async (tx) => {
                const existing = await tx.get(ref);
                if (!existing.exists) tx.set(ref, record);
            });
        } catch (err) {
            console.warn('hero-select store write failed:', err?.message || err);
        }

        return res.status(200).json({
            pick: { userId: record.userId, rationale: record.rationale, by: 'ai', model: record.model },
            source: 'ai'
        });
    } catch (err) {
        console.error('hero-select error:', err);
        // Never 500 for pick failures — the client treats any error as "no AI".
        return res.status(200).json({ pick: null, source: 'error' });
    }
}
