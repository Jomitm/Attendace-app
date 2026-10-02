// tests/unit/perf-snapshot.test.mjs
// A5: the server-side performance snapshot contract. ai-insights
// mode:'performance' must 400 on malformed payloads instead of feeding garbage
// to the model or the rule-based fallback — and must never 400 the real shape
// the client builds (mirror of _buildSnapshot in ai-performance-coach.js).

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { validatePerfSnapshot } = await import('../../api/_perf-snapshot.js');

const validSnapshot = () => ({
    today: '2026-09-30',
    composite: 82,
    dimensions: {
        punctuality: { label: 'Punctuality', score: 100 },
        attendance: { label: 'Attendance', score: 76 },
        taskExecution: { label: 'Task Execution', score: 91 },
        productivity: { label: 'Productivity', score: 80 },
        planning: { label: 'Planning', score: 70 },
        compliance: { label: 'Compliance', score: 90 }
    },
    details: { lateDays: 0, totalDays: 5, daysWorked: 5, taskPlanned: 6, taskCompleted: 5 },
    stats: null,
    trend: [{ week: 'W1', score: 74 }, { week: 'W2', score: 78 }, { week: 'W3', score: 82 }],
    dataCheck: { ranAt: 1790764800000, allOk: true, checks: [{ dimension: 'Attendance', ok: true, expected: '~71', note: null }] }
});

test('accepts the exact snapshot the client builds', () => {
    const res = validatePerfSnapshot(validSnapshot());
    assert.equal(res.ok, true, `expected ok, got errors: ${JSON.stringify(res.errors)}`);
    assert.deepEqual(res.errors, []);
});

test('accepts score boundaries 0 and 100', () => {
    const snap = validSnapshot();
    snap.composite = 0;
    snap.dimensions.punctuality.score = 100;
    assert.equal(validatePerfSnapshot(snap).ok, true);
});

test('trend and stats are optional; trend must be an array when present', () => {
    const noTrend = validSnapshot();
    delete noTrend.trend;
    assert.equal(validatePerfSnapshot(noTrend).ok, true);

    const noStats = validSnapshot();
    delete noStats.stats;
    assert.equal(validatePerfSnapshot(noStats).ok, true);

    const badTrend = validSnapshot();
    badTrend.trend = { week: 'W1', score: 74 };
    const res = validatePerfSnapshot(badTrend);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('trend')));
});

test('rejects non-object metrics', () => {
    for (const bad of [undefined, null, 'x', 42, [], true]) {
        const res = validatePerfSnapshot(bad);
        assert.equal(res.ok, false, `must reject ${JSON.stringify(bad)}`);
        assert.ok(res.errors[0].includes('object'));
    }
});

test('rejects a malformed today', () => {
    for (const bad of [undefined, '09/30/2026', '2026-9-30', 20260930, null]) {
        const snap = validSnapshot();
        snap.today = bad;
        const res = validatePerfSnapshot(snap);
        assert.equal(res.ok, false, `must reject today=${JSON.stringify(bad)}`);
        assert.ok(res.errors.some((e) => e.includes('today')));
    }
});

test('rejects composite outside 0–100 or non-numeric', () => {
    for (const bad of [-1, 101, NaN, '82', null, undefined, {}]) {
        const snap = validSnapshot();
        snap.composite = bad;
        const res = validatePerfSnapshot(snap);
        assert.equal(res.ok, false, `must reject composite=${JSON.stringify(bad)}`);
        assert.ok(res.errors.some((e) => e.includes('composite')));
    }
});

test('rejects missing, empty, or non-object dimensions', () => {
    for (const bad of [undefined, null, {}, [], 'dims', 7]) {
        const snap = validSnapshot();
        if (bad !== undefined) snap.dimensions = bad;
        else delete snap.dimensions;
        const res = validatePerfSnapshot(snap);
        assert.equal(res.ok, false, `must reject dimensions=${JSON.stringify(bad)}`);
        assert.ok(res.errors.some((e) => e.includes('dimensions')));
    }
});

test('rejects a dimension with a bad score and names it', () => {
    for (const bad of [-5, 101, NaN, '90', null, undefined, { label: 'No score' }, 'flat']) {
        const snap = validSnapshot();
        snap.dimensions.attendance = { label: 'Attendance', score: bad };
        const res = validatePerfSnapshot(snap);
        assert.equal(res.ok, false, `must reject score=${JSON.stringify(bad)}`);
        assert.ok(res.errors.some((e) => e.includes('dimensions.attendance.score')),
            `error must name dimensions.attendance.score, got ${JSON.stringify(res.errors)}`);
    }
});

test('rejects missing or non-object details', () => {
    for (const bad of [undefined, null, [], 'details', 3]) {
        const snap = validSnapshot();
        if (bad !== undefined) snap.details = bad;
        else delete snap.details;
        const res = validatePerfSnapshot(snap);
        assert.equal(res.ok, false, `must reject details=${JSON.stringify(bad)}`);
        assert.ok(res.errors.some((e) => e.includes('details')));
    }
});

test('collects every violation in one response', () => {
    const res = validatePerfSnapshot({
        today: 'bad',
        composite: 250,
        dimensions: { attendance: { score: NaN } },
        trend: 'not-an-array'
        // details missing too
    });
    assert.equal(res.ok, false);
    assert.ok(res.errors.length >= 4, `expected >= 4 errors, got ${JSON.stringify(res.errors)}`);
    assert.ok(res.errors.some((e) => e.includes('today')));
    assert.ok(res.errors.some((e) => e.includes('composite')));
    assert.ok(res.errors.some((e) => e.includes('dimensions.attendance.score')));
    assert.ok(res.errors.some((e) => e.includes('details')));
    assert.ok(res.errors.some((e) => e.includes('trend')));
});
