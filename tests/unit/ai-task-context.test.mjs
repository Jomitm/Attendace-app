//! /tests/unit/ai-task-context.test.mjs
// Task-context personalization for the AI assistant.
//
// The chat/briefing prompts only get personal when the context carries real
// task detail. These tests pin the pure builders in js/services/metrics-service.js
// (imported directly — no window/Firestore needed) and the trimMetrics
// whitelist in api/_ai-provider.js:
//   1. summarizeTaskWorkload counts open tasks only and points at concrete items.
//   2. recapTaskYesterday reports planned vs completed for the given date.
//   3. buildTaskTodayPlan orders overdue-oldest → urgent-today → rest, capped at 3.
//   4. trimMetrics keeps the new keys, caps todayPlan, drops unknown keys.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { summarizeTaskWorkload, recapTaskYesterday, buildTaskTodayPlan } =
    await import('../../js/services/metrics-service.js');
const { trimMetrics } = await import('../../api/_ai-provider.js');

const TASKS = [
    { task: 'Old report', date: '2026-10-10', status: 'pending', bucket: 'overdue-or-postponed', size: 'large-task', pri: 'important', cf: false },
    { task: 'Urgent call', date: '2026-10-14', status: 'pending', bucket: 'today', size: 'quick-task', pri: 'urgent', cf: false },
    { task: 'Big deck', date: '2026-10-14', status: 'pending', bucket: 'today', size: 'major-project', pri: 'standard', cf: true },
    { task: 'Small note', date: '2026-10-14', status: 'pending', bucket: 'today', size: 'small-task', pri: '', cf: false },
    { task: 'Future plan', date: '2026-10-20', status: 'pending', bucket: 'upcoming', size: '', pri: '', cf: false },
    { task: 'Done yesterday', date: '2026-10-13', status: 'completed', bucket: 'upcoming', size: '', pri: '', cf: false },
    { task: 'Missed yesterday', date: '2026-10-13', status: 'pending', bucket: 'upcoming', size: '', pri: '', cf: false },
    { task: 'Postponed item', date: '2026-10-12', status: 'postponed', bucket: 'overdue-or-postponed', size: '', pri: '', cf: true }
];

describe('summarizeTaskWorkload', () => {
    it('counts open tasks by bucket and flags', () => {
        const w = summarizeTaskWorkload(TASKS);
        assert.equal(w.overdue, 2);
        assert.equal(w.today, 3);
        assert.equal(w.upcoming, 2);
        assert.equal(w.urgent, 2);
        assert.equal(w.postponed, 1);
        assert.equal(w.carryForward, 2);
    });

    it('ignores completed tasks everywhere', () => {
        const w = summarizeTaskWorkload(TASKS);
        assert.equal(w.today + w.overdue + w.upcoming, 7);
    });

    it('points at the oldest overdue and biggest today item', () => {
        const w = summarizeTaskWorkload(TASKS);
        assert.deepEqual(w.oldestOverdue, { task: 'Old report', date: '2026-10-10' });
        assert.deepEqual(w.biggestToday, { task: 'Big deck', size: 'major-project' });
    });

    it('returns empty shape for missing input', () => {
        const w = summarizeTaskWorkload(null);
        assert.deepEqual(w, {
            overdue: 0, today: 0, upcoming: 0, urgent: 0, postponed: 0, carryForward: 0,
            oldestOverdue: null, biggestToday: null
        });
    });
});

describe('recapTaskYesterday', () => {
    it('reports planned vs completed for the given date', () => {
        const r = recapTaskYesterday(TASKS, '2026-10-13');
        assert.deepEqual(r, { date: '2026-10-13', planned: 2, completed: 1 });
    });

    it('returns zeros for a date with no tasks', () => {
        const r = recapTaskYesterday(TASKS, '2026-01-01');
        assert.deepEqual(r, { date: '2026-01-01', planned: 0, completed: 0 });
    });
});

describe('buildTaskTodayPlan', () => {
    it('orders overdue-oldest, then urgent-today, then rest — capped at 3', () => {
        const plan = buildTaskTodayPlan(TASKS);
        assert.equal(plan.length, 3);
        assert.deepEqual(plan[0], { task: 'Old report', date: '2026-10-10', why: 'overdue since 2026-10-10' });
        assert.deepEqual(plan[1], { task: 'Postponed item', date: '2026-10-12', why: 'overdue since 2026-10-12' });
        assert.deepEqual(plan[2], { task: 'Urgent call', date: '2026-10-14', why: 'urgent, due today' });
    });

    it('falls back to today items when nothing is overdue', () => {
        const onlyToday = TASKS.filter((t) => t.bucket === 'today');
        const plan = buildTaskTodayPlan(onlyToday);
        assert.equal(plan.length, 3);
        assert.equal(plan[0].task, 'Urgent call');
        assert.equal(plan[0].why, 'urgent, due today');
        assert.equal(plan[1].task, 'Big deck');
        assert.equal(plan[2].task, 'Small note');
    });

    it('returns an empty plan for empty input', () => {
        assert.deepEqual(buildTaskTodayPlan([]), []);
        assert.deepEqual(buildTaskTodayPlan(null), []);
    });
});

describe('trimMetrics task-context keys', () => {
    it('keeps workload, yesterday and todayPlan; caps todayPlan at 3', () => {
        const out = trimMetrics({
            user: { name: 'Asha' },
            workload: { overdue: 2, today: 3 },
            yesterday: { date: '2026-10-13', planned: 2, completed: 1 },
            todayPlan: [1, 2, 3, 4, 5].map((n) => ({ task: 't' + n, date: '2026-10-14', why: 'due today' })),
            unknownKey: 'drop me'
        });
        assert.deepEqual(out.workload, { overdue: 2, today: 3 });
        assert.deepEqual(out.yesterday, { date: '2026-10-13', planned: 2, completed: 1 });
        assert.equal(out.todayPlan.length, 3);
        assert.equal(out.unknownKey, undefined);
    });
});
