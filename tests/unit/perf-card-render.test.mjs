// tests/unit/perf-card-render.test.mjs
// A6: render-level guarantees for the "Your Performance" card:
//   1. Healthy payload → score ring, period tabs, dimension bars, detail chips,
//      trend, insights, data-check verdict, and the AI-coach placeholder.
//   2. error:true payload → retry card only — never a fabricated zero-score
//      ring or radar canvas (analytics sets error:true on read failure).
//   3. hydrateAICoach early-returns on error/null/missing-container without
//      touching the DOM beyond the initial container lookup.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Browser-ish globals BEFORE importing the module (it assigns window.* at
// top level and the radar renderer queries document from a deferred timer).
globalThis.window = {};
const docStub = () => ({
    getElementById: () => null,
    querySelector: () => null
});
globalThis.document = docStub();

const { renderStaffPerformance, hydrateAICoach } = await import('../../js/ui/staff-performance.js');

const healthyFixture = () => ({
    userId: 'u1',
    composite: 82,
    windowDays: 7,
    dimensions: {
        punctuality: { label: 'Punctuality', score: 100, icon: 'fa-solid fa-clock', color: '#3b82f6' },
        attendance: { label: 'Attendance', score: 76, icon: 'fa-solid fa-calendar-check', color: '#10b981' },
        taskExecution: { label: 'Task Execution', score: 91, icon: 'fa-solid fa-list-check', color: '#f59e0b' },
        productivity: { label: 'Productivity', score: 80, icon: 'fa-solid fa-bolt', color: '#8b5cf6' },
        planning: { label: 'Planning', score: 70, icon: 'fa-solid fa-clipboard-list', color: '#06b6d4' },
        compliance: { label: 'Compliance', score: 90, icon: 'fa-solid fa-shield-halved', color: '#22c55e' }
    },
    details: {
        lateDays: 0, totalDays: 5, daysWorked: 5,
        attendanceDenom: 5, requiredDays: 5, requiredDaysElapsed: 5,
        taskCompleted: 5, taskInProgress: 1, taskMissed: 0, taskPostponed: 0,
        classifiedCount: 6, classificationBonus: 3, avgActivity: 80, extraHours: 2.5,
        locationMismatches: 0, autoCheckouts: 0
    },
    trend: [{ week: 'Sep 21', score: 74 }, { week: 'Sep 28', score: 82 }],
    insights: [{ type: 'positive', text: 'Strong week overall' }],
    stats: null
});

test('healthy payload renders ring, tabs, dims, chips, trend, insights, data check, coach', () => {
    const html = renderStaffPerformance(healthyFixture(), { windowDays: 7, period: 'week' });

    // Score ring carries the real composite, green at ≥80.
    assert.ok(html.includes('perf-score-ring-value'), 'score ring rendered');
    assert.ok(html.includes('perf-score-row'), 'formula ring + AI chip share one row');
    assert.ok(html.includes('perf-score-ring-value" style="color:#16a34a">82'),
        'ring shows composite 82 in green');
    assert.ok(html.includes('perf-radar-canvas'), 'radar canvas placeholder present');

    // Period tabs, week active.
    for (const key of ['week', 'month', 'year']) {
        assert.ok(html.includes(`window.app_switchPersonalPerf('${key}')`), `tab ${key} wired`);
    }
    assert.ok(html.includes('perf-team-tab active'), 'active tab marked');

    // All six dimension bars with labels.
    assert.equal((html.match(/perf-dim-row/g) || []).length, 6, 'six dimension rows');
    for (const label of ['Punctuality', 'Attendance', 'Task Execution', 'Productivity', 'Planning', 'Compliance']) {
        assert.ok(html.includes(label), `dimension label ${label} shown`);
    }

    // Detail chips from details/stats.
    assert.ok(html.includes('5 days worked'), 'days-worked chip');
    assert.ok(html.includes('+3 bonus'), 'classification bonus chip');

    // Trend + insights.
    assert.ok(html.includes('↗ Improving'), 'rising trend arrow');
    assert.ok(html.includes('Strong week overall'), 'insight text rendered');

    // Deterministic data-check verdict (fixture is internally consistent).
    assert.ok(html.includes('perf-datacheck'), 'data-check section rendered');
    assert.ok(html.includes('Data check passed'), 'consistent fixture passes the verdict');

    // AI coach placeholder in pending state for this period.
    assert.ok(html.includes('class="perf-ai-coach'), 'coach container rendered');
    assert.ok(html.includes('perf-ai-coach--pending'), 'coach starts pending until hydrated');
    assert.ok(html.includes('data-perf-period="week"'), 'coach tagged with its period');
});

test('error payload renders a retry card, never a zero-score ring or canvas', () => {
    const html = renderStaffPerformance(
        { userId: 'u1', composite: 0, dimensions: {}, details: {}, trend: [], error: true },
        { period: 'week' }
    );

    assert.ok(html.includes('perf-perf-error'), 'error block rendered');
    assert.ok(html.includes('Retry'), 'retry button offered');
    assert.ok(html.includes('window.app_switchPersonalPerf(\'week\')'), 'period tabs survive on the error card');
    assert.ok(!html.includes('perf-score-ring'), 'no fabricated score ring');
    assert.ok(!html.includes('perf-radar-canvas'), 'no radar canvas without data');
});

test('null perfData renders a hidden empty card', () => {
    const html = renderStaffPerformance(null, {});
    assert.ok(html.includes('display:none'), 'hidden placeholder, no crash');
});

// ── hydrateAICoach guards ───────────────────────────────────────────────────
const makeContainer = () => ({
    innerHTML: '<div class="perf-ai-coach__collapsible">placeholder</div>',
    classList: { contains: () => false, toggle() {}, remove() {}, add() {} },
    style: {}
});

const trackDocument = (container) => {
    const queries = [];
    globalThis.document = {
        getElementById: () => null, // deferred radar timer stays inert
        querySelector(sel) {
            queries.push(sel);
            if (sel === '.perf-ai-coach') return container;
            return null;
        }
    };
    return queries;
};

test('hydrateAICoach on an error payload performs only the container lookup', async () => {
    const container = makeContainer();
    const before = container.innerHTML;
    const queries = trackDocument(container);

    await hydrateAICoach({ userId: 'u1', composite: 0, error: true }, 'week');

    assert.deepEqual(queries, ['.perf-ai-coach'],
        'error payload must return before any ring/coach DOM work');
    assert.equal(container.innerHTML, before, 'error payload must not re-render the coach');
});

test('hydrateAICoach without perfData resolves after a single lookup', async () => {
    const container = makeContainer();
    const queries = trackDocument(container);

    await hydrateAICoach(null, 'week');
    await hydrateAICoach(undefined, 'week');

    assert.deepEqual(queries, ['.perf-ai-coach', '.perf-ai-coach'], 'no further DOM access per call');
    assert.equal(container.innerHTML, makeContainer().innerHTML, 'coach untouched');
});

test('hydrateAICoach without a coach container resolves cleanly', async () => {
    const queries = trackDocument(null);

    await hydrateAICoach(healthyFixture(), 'week');

    assert.deepEqual(queries, ['.perf-ai-coach'], 'stops at the missing container');
});
