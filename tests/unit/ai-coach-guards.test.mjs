import { test } from 'node:test';
import assert from 'node:assert/strict';

// Browser-ish globals before importing: staff-performance.js assigns
// window.app_* handlers at module top level.
globalThis.window = {
    AppAuth: { getUser: () => ({ id: 'u1', role: 'admin' }) }
};

const {
    _extractAiScore,
    _clampAiScore,
    _isStaleNarrative,
    _heuristicClassify
} = await import('../../js/modules/ai-performance-coach.js');
const { renderStaffPerformance } = await import('../../js/ui/staff-performance.js');
const { executeAddTask } = await import('../../js/modules/ai-actions.js');

// ── AI Score bounds (Phase 3b) ────────────────────────────────────────────

test('_clampAiScore bounds a score to ±AI_SCORE_MAX_DELTA of the composite', () => {
    // Overclaim: model says 145, composite is 70 → 70 + 15 = 85.
    assert.equal(_clampAiScore(145, 70), 85);
    // Underclaim: model says 5, composite is 40 → 40 − 15 = 25.
    assert.equal(_clampAiScore(5, 40), 25);
    // Never exceeds 0–100 either.
    assert.equal(_clampAiScore(145, 95), 100);
    assert.equal(_clampAiScore(0, 5), 0);
    // No composite → legacy 0–100 clamp only.
    assert.equal(_clampAiScore(145), 100);
    assert.equal(_clampAiScore(50), 50);
    // Garbage → null (UI hides the chip instead of showing junk).
    assert.equal(_clampAiScore(null, 70), null);
    assert.equal(_clampAiScore('abc', 70), null);
});

test('_extractAiScore strips the score line and bounds the extracted value', () => {
    const over = _extractAiScore('Solid week overall.\nAI Score: 145 — crushed it', 70);
    assert.equal(over.aiScore, 85);
    assert.equal(over.narrative, 'Solid week overall.');
    assert.equal(over.scoreReason, 'crushed it');

    const under = _extractAiScore('Rough week.\nAI Score: 5 — slipped', 40);
    assert.equal(under.aiScore, 25);

    // Legacy behaviour without a composite: plain 0–100 clamp.
    assert.equal(_extractAiScore('AI Score: 145 — x').aiScore, 100);

    // No score line at all.
    const none = _extractAiScore('Just a narrative.');
    assert.equal(none.aiScore, null);
    assert.equal(none.narrative, 'Just a narrative.');
});

// ── Narrative staleness / drift (Phase 3a) ────────────────────────────────

test('cached narrative goes stale when the composite drifts ≥5 points', () => {
    const narr = 'You scored well this week.';

    // No drift (and old caches without a stored composite stay valid).
    assert.equal(_isStaleNarrative(narr, 70, 2, 70), false);
    assert.equal(_isStaleNarrative(narr, 66, 2, 70), false, 'drift 4 < 5 stays fresh');
    assert.equal(_isStaleNarrative(narr, 70, 2, undefined), false);

    // Drift ≥ 5 → regenerate.
    assert.equal(_isStaleNarrative(narr, 60, 2, 70), true, 'drift 10 ≥ 5 → stale');
    assert.equal(_isStaleNarrative(narr, 75, 2, 70), true, 'drift 5 ≥ 5 → stale');

    // Original sanity guards still hold.
    assert.equal(_isStaleNarrative('', 70, 2, 70), true);
    assert.equal(_isStaleNarrative('You scored 0/100 this week.', 70, 2, 70), true);
    assert.equal(_isStaleNarrative('No significant activity recorded.', 70, 2, 70), true);
});

test('real scores like 70/100 and 100/100 are not mistaken for 0/100 claims', () => {
    assert.equal(_isStaleNarrative('You scored 70/100 this week.', 70, 2, 70), false);
    assert.equal(_isStaleNarrative('Perfect 100/100 performance.', 100, 5, 100), false);
    assert.equal(_isStaleNarrative('Currently at 0 / 100.', 70, 2, 70), true);
});

// ── Error vs genuine zero (Phase 3c) ──────────────────────────────────────

test('renderStaffPerformance shows a retry card on error, never a zero ring', () => {
    const html = renderStaffPerformance(
        { error: true, userId: 'u1', composite: 0 },
        { period: 'week' }
    );
    assert.match(html, /load performance data/i);
    assert.match(html, /app_switchPersonalPerf\('week'\)/, 'Retry button wired to the switch handler');
    assert.ok(!html.includes('perf-score-ring'), 'no fabricated score ring');
    assert.ok(!html.includes('perf-radar-canvas'), 'no radar canvas mounted');
});

test('renderStaffPerformance still renders the normal card for a healthy payload', () => {
    const html = renderStaffPerformance(
        {
            userId: 'u1',
            composite: 72,
            dimensions: null, // skips the radar (needs DOM)
            details: {},
            trend: [],
            insights: []
        },
        { period: 'week', windowDays: 7 }
    );
    assert.ok(!html.includes('load performance data'), 'not the error card');
    assert.match(html, /perf-score-ring/);
    assert.match(html, /Your Performance/);
});

// ── sizeCategory at creation (Phase 3d) ───────────────────────────────────

test('_heuristicClassify classifies task text', () => {
    assert.deepEqual(
        _heuristicClassify('Prepare the quarterly audit report'),
        { sizeCategory: 'large-task', priorityLevel: 'standard' }
    );
    assert.deepEqual(
        _heuristicClassify('Deploy the payment service migration today'),
        { sizeCategory: 'major-project', priorityLevel: 'urgent' }
    );
});

test('chat-added tasks carry aiSizeCategory/aiPriorityLevel from creation', async () => {
    const calls = [];
    globalThis.window.AppCalendar = {
        addWorkPlanTask: async (...args) => { calls.push(args); return { ok: true }; },
        invalidateCarryForwardCache: () => {}
    };
    globalThis.window.AppDB = { invalidateCache: () => {} };

    const res = await executeAddTask({ task: 'Prepare the quarterly audit report', date: '2026-09-30' });
    assert.equal(res.ok, true);
    assert.equal(calls.length, 1);

    const [argDate, argUserId, argTask, argSubPlans, meta] = calls[0];
    assert.equal(argDate, '2026-09-30');
    assert.equal(argUserId, 'u1');
    assert.equal(argTask, 'Prepare the quarterly audit report');
    assert.deepEqual(argSubPlans, []);
    assert.equal(meta.addedFrom, 'ai_agent');
    assert.equal(meta.aiSizeCategory, 'large-task', 'classification set at creation');
    assert.equal(meta.aiPriorityLevel, 'standard');
});
