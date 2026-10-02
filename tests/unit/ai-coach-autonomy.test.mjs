import { test } from 'node:test';
import assert from 'node:assert/strict';

// Map-backed localStorage — installed before import (module reads at call time).
const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
};
globalThis.window = { AppAuth: { getUser: () => ({ id: 'u1', role: 'admin' }) } };

const { runDailyPerformanceAI, _aiRunsKey, _perfFingerprint } =
    await import('../../js/modules/ai-performance-coach.js');

const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();
const runsKey = _aiRunsKey('u1');
const cacheKey = `crwi_perf_ai_v3_u1_${today}_week`;
const HOUR = 3600000;

const payload = (taskCompleted = 2) => ({
    composite: 70,
    windowDays: 7,
    dimensions: {
        punctuality: { label: 'Punctuality', score: 70 },
        attendance: { label: 'Attendance', score: 70 },
        taskExecution: { label: 'Task Execution', score: 70 },
        productivity: { label: 'Productivity', score: 70 },
        planning: { label: 'Planning', score: 70 },
        compliance: { label: 'Compliance', score: 70 }
    },
    details: {
        taskCompleted, taskMissed: 0, taskPostponed: 0, taskInProgress: 0,
        daysWorked: 4, lateDays: 0, extraHours: 1, avgActivity: 60
    },
    trend: []
});

const setRuns = (count, lastAt) => store.set(runsKey, JSON.stringify({ count, lastAt }));
const getRuns = () => JSON.parse(store.get(runsKey) || '{}');
const getCache = () => JSON.parse(store.get(cacheKey) || 'null');

test('first run of the day generates the narrative and counts 1 of 3', async () => {
    store.clear();
    const r = await runDailyPerformanceAI(payload(), 'week');
    assert.equal(r.fromCache, false, 'fresh generation');
    assert.equal(getRuns().count, 1);
    assert.ok(getCache()?.fp, 'fingerprint stored for change detection');
});

test('unchanged data on re-render is served from cache without a run', async () => {
    const r = await runDailyPerformanceAI(payload(), 'week');
    assert.equal(r.fromCache, true);
    assert.equal(getRuns().count, 1, 'budget not consumed');
});

test('changed data within the min gap stays cached (occasional, not every render)', async () => {
    const r = await runDailyPerformanceAI(payload(9), 'week');
    assert.equal(r.fromCache, true, 'gap blocks the re-check');
    assert.equal(getRuns().count, 1);
});

test('changed data after the gap regenerates and counts run 2', async () => {
    setRuns(1, Date.now() - 2 * HOUR);
    const changed = payload(9);
    const r = await runDailyPerformanceAI(changed, 'week');
    assert.equal(r.fromCache, false, 'autonomous re-check ran');
    assert.equal(getRuns().count, 2);
    assert.equal(getCache().fp, _perfFingerprint(changed), 'fingerprint refreshed');
});

test('budget exhausted (3/3) keeps the cached score even when data changed', async () => {
    setRuns(3, Date.now() - 5 * HOUR);
    const r = await runDailyPerformanceAI(payload(12), 'week');
    assert.equal(r.fromCache, true, 'no run past the daily cap');
    assert.equal(getRuns().count, 3, 'budget untouched');
});

test('a stale (0/100) narrative regenerates even at the budget cap', async () => {
    const c = getCache();
    store.set(cacheKey, JSON.stringify({ ...c, narrative: 'You scored 0/100 this week.' }));
    const r = await runDailyPerformanceAI(payload(12), 'week');
    assert.equal(r.fromCache, false, 'correctness repair bypasses the budget');
});

test('cache hit with a null aiScore is healed in place without burning the budget', async () => {
    store.clear();
    const p = payload();
    store.set(cacheKey, JSON.stringify({
        narrative: 'You scored 70/100 this week.',
        aiScore: null,
        scoreReason: '',
        composite: 70,
        fp: _perfFingerprint(p),
        at: Date.now()
    }));
    setRuns(3, Date.now()); // budget exhausted — the heal must not need a run
    const r = await runDailyPerformanceAI(p, 'week');
    assert.equal(r.fromCache, true, 'still served from cache');
    assert.ok(Number.isInteger(r.aiScore), 'healed score returned');
    assert.equal(getRuns().count, 3, 'no run consumed');
    assert.ok(getCache()?.aiScore != null, 'cache rewritten with a numeric score');
});

test('a model response missing its AI Score line is healed before caching', async () => {
    store.clear();
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({ insight: '### Fact\nEverything checks out.', model: 'stub-model', source: 'ai' })
    });
    try {
        const r = await runDailyPerformanceAI(payload(), 'week');
        assert.equal(r.fromCache, false);
        assert.match(r.narrative, /Everything checks out/);
        assert.ok(Number.isInteger(r.aiScore), 'healed score returned from a scoreless insight');
        assert.ok(getCache()?.aiScore != null, 'cache never written scoreless');
    } finally {
        globalThis.fetch = realFetch;
    }
});
