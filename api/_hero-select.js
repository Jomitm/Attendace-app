// api/_hero-select.js
// Pure helpers for AI-based Hero of the Week selection (api/hero-select.js).
//
// The deterministic ranking (js/modules/analytics.js buildHeroRanking) stays
// the source of truth for eligibility — the AI only picks a winner from the
// eligible candidates it is handed. Any parse/validation failure returns null
// so callers fall back to the normal top-ranked eligible row.
//
// No Firestore/firebase/provider imports here — I/O lives in api/hero-select.js
// so these stay unit-testable (tests/unit/hero-ai-select.test.mjs).

const MAX_CANDIDATES = 100;
const MAX_RATIONALE_CHARS = 200;

// Firestore doc id for a hero selection period: "<startDate>_<endDate>".
export function heroSelectionDocId(periodKey) {
    return String(periodKey || '').replace(/[^0-9A-Za-z_-]/g, '_').slice(0, 120);
}

// Defensive re-shape of client-supplied candidates: ids as strings, numeric
// stats coerced, unknown fields dropped (what actually reaches the prompt).
// Shared by api/hero-select.js and the Vite dev middleware.
export function sanitizeCandidates(input) {
    if (!Array.isArray(input)) return [];
    return input.slice(0, MAX_CANDIDATES).map((c) => ({
        id: String(c?.id || '').trim(),
        name: String(c?.name || '').trim().slice(0, 80),
        rank: Number.isFinite(Number(c?.rank)) ? Number(c.rank) : null,
        score: Number(c?.score) || 0,
        days: Number(c?.days) || 0,
        hours: Number(c?.hours) || 0,
        planned: Number(c?.planned) || 0,
        completed: Number(c?.completed) || 0,
        inProgress: Number(c?.inProgress) || 0,
        postponed: Number(c?.postponed) || 0,
        missed: Number(c?.missed) || 0,
        punctuality: Number(c?.punctuality) || 0
    })).filter((c) => c.id);
}

// Period key from the effective ranking window (local date keys, inclusive).
export function buildHeroPeriodKey(startDate, endDate) {
    const start = String(startDate || '').trim().slice(0, 10);
    const end = String(endDate || '').trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
    return `${start}_${end}`;
}

// Compact candidate list for the prompt + validation allow-list.
// Input rows are buildHeroRanking rows ({ user, stats, rank, isEligible }).
// Owners are already excluded upstream; only eligible rows become candidates.
export function buildHeroCandidates(rows = []) {
    if (!Array.isArray(rows)) return [];
    return rows
        .filter((row) => row && row.isEligible && row.user && row.stats)
        .slice(0, MAX_CANDIDATES)
        .map((row) => {
            const s = row.stats || {};
            return {
                id: String(row.user.id || '').trim(),
                name: String(row.user.name || row.user.username || '').trim(),
                rank: Number.isFinite(Number(row.rank)) ? Number(row.rank) : null,
                score: Number(s.finalScore) || 0,
                days: Number(s.days) || 0,
                hours: Math.round((Number(s.hours) || 0) * 10) / 10,
                planned: Number(s.taskPlanned) || 0,
                completed: Number(s.taskCompleted) || 0,
                inProgress: Number(s.taskInProgress) || 0,
                postponed: Number(s.taskPostponed) || 0,
                missed: Number(s.taskMissed) || 0,
                punctuality: Number(s.punctuality) || 0
            };
        })
        .filter((c) => c.id);
}

// Extract the first balanced JSON object from arbitrary model output
// (tolerates ```json fences and surrounding prose).
function extractJsonObject(text) {
    const src = String(text || '');
    const start = src.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < src.length; i++) {
        const ch = src[i];
        if (inStr) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inStr = false;
            continue;
        }
        if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return src.slice(start, i + 1);
        }
    }
    return null;
}

// Validate the model's answer. Returns { userId, rationale } only when the
// pick is one of `allowedIds`; otherwise null → caller uses normal ranking.
export function parseHeroAiResponse(text, allowedIds = []) {
    const allowed = new Set((Array.isArray(allowedIds) ? allowedIds : []).map((id) => String(id)));
    if (!allowed.size) return null;
    const raw = extractJsonObject(text);
    if (!raw) return null;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }
    const userId = String(parsed?.userId || '').trim();
    if (!userId || !allowed.has(userId)) return null;
    const rationale = String(parsed?.rationale || '').trim().slice(0, MAX_RATIONALE_CHARS);
    return { userId, rationale: rationale || 'Selected by AI from the eligible candidates.' };
}
