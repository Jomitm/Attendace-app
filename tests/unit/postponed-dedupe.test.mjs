// tests/unit/postponed-dedupe.test.mjs
// Verifies that postpone lineage shells (source task + multiple postponed
// copies created by checkout postpones) collapse to ONE logical task in
// MetricsService._dedupeTaskInstances — the root cause of postponed counts
// ballooning over time.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Browser-ish globals before import.
globalThis.window = {
    AppAuth: { getUser: () => ({ id: 'u1', name: 'Tester' }) },
    AppDB: { getAll: async () => [], get: async () => null, put: async () => {} }
};

const { AppMetricsService } = await import('../../js/services/metrics-service.js');

const mk = (task, wpDate, status = '', extra = {}) => ({
    task,
    status,
    _wpDate: wpDate,
    _ownerId: 'u1',
    ...extra
});

test('source + postponed copies collapse to the latest instance', () => {
    const tasks = [
        mk('Prepare report', '2026-09-20', 'postponed'),
        mk('Prepare report (Postponed from 2026-09-20)', '2026-09-22', 'postponed'),
        mk('Prepare report (Postponed from 2026-09-22)', '2026-09-25', 'postponed'),
        mk('Prepare report (Postponed from 2026-09-25)', '2026-09-29', 'postponed')
    ];
    const out = AppMetricsService._dedupeTaskInstances(tasks);
    assert.equal(out.length, 1, 'four shells = one logical task');
    assert.equal(out[0]._wpDate, '2026-09-29', 'keeps the latest instance');
});

test('completed latest instance hides earlier postponed shells', () => {
    const tasks = [
        mk('Send invoice', '2026-09-10', 'postponed'),
        mk('Send invoice (Postponed from 2026-09-10)', '2026-09-12', 'completed', { completed: true })
    ];
    const out = AppMetricsService._dedupeTaskInstances(tasks);
    assert.equal(out.length, 1);
    const n = String(out[0].status).toLowerCase();
    assert.ok(n === 'completed' || out[0].completed === true, 'latest (completed) wins');
});

test('distinct tasks are never merged', () => {
    const tasks = [
        mk('Prepare report', '2026-09-20', 'postponed'),
        mk('Call vendor', '2026-09-21', '')
    ];
    const out = AppMetricsService._dedupeTaskInstances(tasks);
    assert.equal(out.length, 2);
});

test('carry-forward lineage roots keep carry-copies deduped even if text diverges', () => {
    const tasks = [
        mk('Site inspection', '2026-09-18', '', { carryForwardRootId: 'plan_u1_2026-09-18::2' }),
        mk('Site inspection', '2026-09-19', '', { carryForwardRootId: 'plan_u1_2026-09-18::2' })
    ];
    const out = AppMetricsService._dedupeTaskInstances(tasks);
    assert.equal(out.length, 1);
    assert.equal(out[0]._wpDate, '2026-09-19');
});

test('simulated month of postpones counts as 1 postponed, not many', () => {
    // Source + 5 shells, all in the past
    const tasks = [
        mk('Quarterly audit', '2026-09-01', 'postponed'),
        mk('Quarterly audit (Postponed from 2026-09-01)', '2026-09-05', 'postponed'),
        mk('Quarterly audit (Postponed from 2026-09-05)', '2026-09-09', 'postponed'),
        mk('Quarterly audit (Postponed from 2026-09-09)', '2026-09-13', 'postponed'),
        mk('Quarterly audit (Postponed from 2026-09-13)', '2026-09-18', 'postponed'),
        mk('Quarterly audit (Postponed from 2026-09-18)', '2026-09-24', 'postponed')
    ];
    const live = AppMetricsService._dedupeTaskInstances(tasks);
    const postponed = live.filter(t => String(t.status).toLowerCase() === 'postponed');
    assert.equal(postponed.length, 1, 'one logical postponed task');
});
