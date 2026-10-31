// api/_hero-select.js
// Vercel serverless function: AI Hero of the Week selection (routed via
// api/index.js).
//
// The deterministic ranking (js/modules/analytics.js) owns eligibility; this
// endpoint rebuilds eligible candidates from trusted records before selecting and
// remembers the pick per ranking period so every device agrees.
//
// Fallback contract: whenever the AI is unavailable (no key, provider chain
// failure, invalid answer), the endpoint responds { pick: null } WITHOUT
// persisting — the client keeps its normal top-ranked eligible winner and the
// next load retries. Stored picks are only ever validated AI picks.
//
// Security: requires a valid Firebase ID token (Authorization: Bearer <idToken>).
// Local dev uses this same authenticated handler and trusted ranking boundary.

import { getDb } from './_firebase-admin.js';
import { authenticateRequest, sendAuthError } from './_api-auth.js';
import { currentHeroPeriod, loadTrustedHeroCandidates } from './_hero-ranking.js';
import { callAI } from './_ai-provider.js';
import { buildHeroPeriodKey, heroSelectionDocId, parseHeroAiResponse } from './_hero-select-core.js';

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
// 128 KB — candidates now carry a per-person evidence digest
// (js/utils/hero-digest.js, ≤520 chars each); 100 candidates still fit.
const MAX_BODY_BYTES = 128 * 1024;
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

    const auth = await authenticateRequest(req);
    if (!auth.ok) return sendAuthError(res, auth);

    try {
        const rawLen = Number(req.headers['content-length']) || 0;
        if (rawLen > MAX_BODY_BYTES) {
            return res.status(413).json({ error: 'Payload too large' });
        }
        const { periodKey, startDate, endDate } = req.body || {};
        const period = String(periodKey || '').trim() || buildHeroPeriodKey(startDate, endDate);
        if (!period || !PERIOD_RE.test(period)) {
            return res.status(400).json({ error: 'Invalid period key' });
        }
        const currentPeriod = currentHeroPeriod();
        if (period !== currentPeriod.periodKey) return res.status(200).json({ pick: null, source: 'period_changed' });
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
        // Existing selections remain stable. Browsers still check current
        // eligibility before displaying the stored pick.
        if (stored) {
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
        const trusted = await loadTrustedHeroCandidates(db, currentPeriod);
        if (trusted.periodKey !== period) return res.status(200).json({ pick: null, source: 'period_changed' });
        const sanitized = trusted.candidates;
        if (!sanitized.length) return res.status(200).json({ pick: null, source: 'no_candidates' });
        const allowIds = sanitized.map(candidate => candidate.id);
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
        let persisted;
        try {
            persisted = await db.runTransaction(async (tx) => {
                const existing = await tx.get(ref);
                if (existing.exists) return existing.data();
                tx.set(ref, record);
                return record;
            });
        } catch (err) {
            console.warn('hero-select store write failed:', err?.message || err);
            return res.status(200).json({ pick: null, source: 'error' });
        }

        return res.status(200).json({
            pick: { userId: persisted.userId, rationale: persisted.rationale, by: 'ai', model: persisted.model },
            source: persisted === record ? 'ai' : 'stored'
        });
    } catch (err) {
        console.error('hero-select error:', err);
        // Never 500 for pick failures — the client treats any error as "no AI".
        return res.status(200).json({ pick: null, source: 'error' });
    }
}
