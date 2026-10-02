// api/_ai-quota.js
// Pure helpers for the per-user daily chat-question quota.
//
// Policy: N chat questions (default 5) per user per UTC day. The UTC day key
// aligns with OpenRouter's own free-model daily counter (resets at UTC
// midnight), so our fairness cap and their provider cap stay in sync.
//
// Only chat answers are charged (float panel + AI Center). The internal
// tool_plan pre-check, classify, performance mode and Generate Insights
// (question: null) are exempt — but tool_plan is *blocked* when the limit is
// hit so a capped-out user can't still burn provider calls on the pre-check.
//
// No Firestore/firebase imports here — I/O lives in api/ai-insights.js so
// these stay unit-testable (tests/unit/ai-quota.test.mjs).

const LIMIT_ENV = 'AI_DAILY_QUESTION_LIMIT';
const DEFAULT_LIMIT = 5;
const EXEMPT_MODES = new Set(['tool_plan', 'classify', 'performance']);

// Configured limit. Env wins when it's a positive integer; anything else
// (missing, 0, -3, "abc") falls back to the default.
export function quotaLimit(env = process.env) {
    const n = Number(env && env[LIMIT_ENV]);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_LIMIT;
}

// True only for requests that answer a user-typed chat question.
export function isQuotaRequest(body = {}) {
    const { mode, question } = body || {};
    if (mode && EXEMPT_MODES.has(mode)) return false;
    return typeof question === 'string' && question.trim() !== '';
}

// Firestore doc id for a user's counter on a UTC day: "<uid>_YYYY-MM-DD".
export function quotaDocId(uid, dateIso) {
    const day = (dateIso || new Date().toISOString()).slice(0, 10);
    return `${uid}_${day}`;
}

// Next UTC midnight after `now` (ISO date the counter resets on).
export function nextUtcMidnight(now = new Date()) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return d.toISOString().slice(0, 10);
}

// User-facing 429 message — the client surfaces this verbatim when present.
export function quotaMessage(limit, resetsAt) {
    const reset = resetsAt ? `resets at midnight UTC on ${resetsAt}` : 'resets at midnight UTC';
    return `Daily question limit reached — ${limit} AI question(s) per day. Your limit ${reset}. Local answers still work meanwhile.`;
}

// Per-request quota facts injected into the AI's data context so it can
// answer "how many questions can I ask?" truthfully. `used` is the count
// BEFORE the current question is charged; `remaining` counts what is left
// AFTER it (the current one is being spent now).
export function quotaContext(limit, used) {
    const u = Number(used) || 0;
    return { limit, used: u, remaining: Math.max(0, limit - u - 1) };
}
