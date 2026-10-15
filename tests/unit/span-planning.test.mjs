//! /tests/unit/span-planning.test.mjs
// Multi-day (spanning) task helpers (js/utils/span-planning.js):
//   1. Span bounds resolve from explicit dates with plan-date fallback.
//   2. Coverage + "Day X of N" follow the inclusive span; completed dates hide.
//   3. Effort spreads evenly across working days; overload is flagged.
//   4. End-date suggestions skip weekends; duration phrases parse.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const span = await import('../../js/utils/span-planning.js');

describe('date basics', () => {
    it('validates ISO keys and shifts days', () => {
        assert.equal(span.asIsoDate('2026-10-14'), '2026-10-14');
        assert.equal(span.asIsoDate('14 Oct'), '');
        assert.equal(span.asIsoDate(''), '');
        assert.equal(span.addDaysStr('2026-10-14', 3), '2026-10-17');
        assert.equal(span.addDaysStr('2026-10-31', 1), '2026-11-01');
        assert.equal(span.diffDaysStr('2026-10-14', '2026-10-16'), 2);
    });
});

describe('getTaskSpan', () => {
    it('uses explicit dates', () => {
        assert.deepEqual(
            span.getTaskSpan({ startDate: '2026-10-14', endDate: '2026-10-16' }, '2026-10-14'),
            { startDate: '2026-10-14', endDate: '2026-10-16' }
        );
    });

    it('falls back to the plan date and clamps inverted ranges', () => {
        assert.deepEqual(span.getTaskSpan({}, '2026-10-14'), { startDate: '2026-10-14', endDate: '2026-10-14' });
        assert.deepEqual(
            span.getTaskSpan({ startDate: '2026-10-16', endDate: '2026-10-14' }, '2026-10-14'),
            { startDate: '2026-10-16', endDate: '2026-10-16' }
        );
        assert.equal(span.getTaskSpan({}, ''), null);
    });
});

describe('taskCoversDate', () => {
    const t = { startDate: '2026-10-14', endDate: '2026-10-16' };
    it('covers every date inside the inclusive span', () => {
        assert.equal(span.taskCoversDate(t, '2026-10-14', '2026-10-14'), true);
        assert.equal(span.taskCoversDate(t, '2026-10-14', '2026-10-15'), true);
        assert.equal(span.taskCoversDate(t, '2026-10-14', '2026-10-16'), true);
        assert.equal(span.taskCoversDate(t, '2026-10-14', '2026-10-13'), false);
        assert.equal(span.taskCoversDate(t, '2026-10-14', '2026-10-17'), false);
    });

    it('hides dates after completedDate', () => {
        const done = { ...t, completedDate: '2026-10-14' };
        assert.equal(span.taskCoversDate(done, '2026-10-14', '2026-10-14'), true);
        assert.equal(span.taskCoversDate(done, '2026-10-14', '2026-10-15'), false);
    });
});

describe('spanDayLabel', () => {
    it('labels position inside the span', () => {
        assert.deepEqual(
            span.spanDayLabel({ startDate: '2026-10-14', endDate: '2026-10-16' }, '2026-10-14', '2026-10-15'),
            { dayIndex: 2, dayCount: 3, label: 'Day 2 of 3' }
        );
        assert.equal(span.spanDayLabel({ startDate: '2026-10-14', endDate: '2026-10-16' }, '2026-10-14', '2026-10-20'), null);
    });
});

describe('effort and capacity', () => {
    it('maps sizes to hours with a quick-task default', () => {
        assert.equal(span.taskEffortHours({ sizeCategory: 'small-task' }), 4);
        assert.equal(span.taskEffortHours({ sizeCategory: 'major-project' }), 40);
        assert.equal(span.taskEffortHours({}), 1);
        assert.equal(span.taskEffortHours({ sizeCategory: 'nope' }), 1);
    });

    it('spreads effort evenly and flags overload', () => {
        const tasks = [
            { task: 'Big', startDate: '2026-10-14', endDate: '2026-10-15', sizeCategory: 'large-task', status: '' },
            { task: 'Small', startDate: '2026-10-14', endDate: '2026-10-14', sizeCategory: 'small-task', status: '' }
        ];
        // Oct 14 2026 is a Wednesday; Oct 15 Thursday — both working days.
        const load = span.computeSpanLoad(tasks, '2026-10-14', '2026-10-15', { dailyCapacity: 8 });
        assert.equal(load.perDay.length, 2);
        // 16h/2 days = 8 + 4h single-day = 12h on day one → over.
        assert.equal(load.perDay[0].hours, 12);
        assert.equal(load.perDay[0].over, true);
        assert.equal(load.perDay[1].hours, 8);
        assert.equal(load.perDay[1].over, false);
        assert.equal(load.fits, false);
        assert.ok(load.shortfallHours > 0);
    });

    it('ignores completed and removed tasks', () => {
        const tasks = [
            { task: 'Done', startDate: '2026-10-14', endDate: '2026-10-14', sizeCategory: 'major-project', status: 'completed' },
            { task: 'Gone', startDate: '2026-10-14', endDate: '2026-10-14', sizeCategory: 'major-project', status: '', isRemoved: true }
        ];
        const load = span.computeSpanLoad(tasks, '2026-10-14', '2026-10-14', { dailyCapacity: 8 });
        assert.equal(load.totalHours, 0);
        assert.equal(load.fits, true);
    });
});

describe('working-day helpers', () => {
    it('counts Mon–Fri only', () => {
        // Mon 2026-10-12 → Sun 2026-10-18 = 5 working days.
        assert.equal(span.countSpanWorkingDays('2026-10-12', '2026-10-18'), 5);
        assert.equal(span.countSpanWorkingDays('2026-10-17', '2026-10-18'), 0);
    });

    it('advances over weekends', () => {
        // Fri + 2 working days = Mon.
        assert.equal(span.addWorkingDays('2026-10-16', 2), '2026-10-19');
        assert.equal(span.addWorkingDays('2026-10-14', 1), '2026-10-14');
    });

    it('suggests an end date from size', () => {
        assert.equal(span.suggestEndDate('2026-10-14', 'quick-task'), '2026-10-14');
        assert.equal(span.suggestEndDate('2026-10-14', 'large-task'), '2026-10-15');
        // 40h = 5 working days: Wed → Tue (skips weekend).
        assert.equal(span.suggestEndDate('2026-10-14', 'major-project'), '2026-10-20');
    });
});

describe('collectSpanningTasks', () => {
    const plans = [
        {
            id: 'plan_u1_2026-10-14', userId: 'u1', date: '2026-10-14',
            plans: [
                { task: 'Span job', status: '', startDate: '2026-10-14', endDate: '2026-10-16' },
                { task: 'Single', status: '', startDate: '2026-10-14', endDate: '2026-10-14' },
                { task: 'Done span', status: 'completed', startDate: '2026-10-14', endDate: '2026-10-16' },
                { task: 'Gone', status: '', startDate: '2026-10-14', endDate: '2026-10-16', isRemoved: true }
            ]
        },
        {
            id: 'plan_u1_2026-10-15', userId: 'u1', date: '2026-10-15',
            plans: [{ task: 'Home task', status: '' }]
        }
    ];

    it('projects multi-day tasks from earlier docs, skipping single/completed/removed', () => {
        const out = span.collectSpanningTasks(plans, '2026-10-15', 'u1');
        assert.equal(out.length, 1);
        assert.equal(out[0].task, 'Span job');
        assert.equal(out[0]._spannedVirtual, true);
        assert.equal(out[0]._homeDate, '2026-10-14');
        assert.equal(out[0]._spanLabel, 'Day 2 of 3');
    });

    it('never projects onto the home date itself', () => {
        const out = span.collectSpanningTasks(plans, '2026-10-14', 'u1');
        assert.equal(out.length, 0);
    });

    it('hides a finished span from later dates even when status lags', () => {
        const base = {
            id: 'plan_u1_2026-10-14', userId: 'u1', date: '2026-10-14',
            plans: [{ task: 'Finished early', status: 'in-process', startDate: '2026-10-14', endDate: '2026-10-16', completedDate: '2026-10-14' }]
        };
        // Home date never virtualizes (renders from its own doc)...
        assert.equal(span.collectSpanningTasks([base], '2026-10-14', 'u1').length, 0);
        // ...and the finished span stays hidden afterwards despite the lagging status.
        assert.equal(span.collectSpanningTasks([base], '2026-10-15', 'u1').length, 0);
        // Sanity: without completedDate the same span WOULD project.
        const live = JSON.parse(JSON.stringify(base));
        delete live.plans[0].completedDate;
        assert.equal(span.collectSpanningTasks([live], '2026-10-15', 'u1').length, 1);
    });

    it('hides dates after completedDate and filters other users', () => {
        const done = [{
            id: 'plan_u1_2026-10-14', userId: 'u1', date: '2026-10-14',
            plans: [{ task: 'Finished early', status: 'completed', startDate: '2026-10-14', endDate: '2026-10-16', completedDate: '2026-10-14' }]
        }];
        assert.equal(span.collectSpanningTasks(done, '2026-10-15', 'u1').length, 0);
        assert.equal(span.collectSpanningTasks(plans, '2026-10-15', 'u2').length, 0);
    });
});

describe('computeDayLoad', () => {
    const dayTasks = [
        { task: 'Big', startDate: '2026-10-14', endDate: '2026-10-15', sizeCategory: 'large-task', status: '' },
        { task: 'Small', startDate: '2026-10-14', endDate: '2026-10-14', sizeCategory: 'small-task', status: '' },
        { task: 'Done', startDate: '2026-10-14', endDate: '2026-10-14', sizeCategory: 'major-project', status: 'completed' },
        { task: 'Future', startDate: '2026-10-20', endDate: '2026-10-20', sizeCategory: 'major-project', status: '' }
    ];

    it('sums spread effort for covering tasks only', () => {
        // Big spans 2 working days: 16/2 = 8, plus Small 4 = 12h → over 8h.
        const load = span.computeDayLoad(dayTasks, '2026-10-14', { dailyCapacity: 8 });
        assert.equal(load.hours, 12);
        assert.equal(load.over, true);
    });

    it('counts only the overlapping slice on later span days', () => {
        // Oct 15: Big contributes 8h only → exactly at capacity, not over.
        const load = span.computeDayLoad(dayTasks, '2026-10-15', { dailyCapacity: 8 });
        assert.equal(load.hours, 8);
        assert.equal(load.over, false);
    });

    it('ignores completed, removed and out-of-range tasks', () => {
        const load = span.computeDayLoad(dayTasks, '2026-10-20', { dailyCapacity: 8 });
        // Future (major-project 40h single day) → over.
        assert.equal(load.hours, 40);
        assert.equal(load.over, true);
        const empty = span.computeDayLoad([], '2026-10-14', { dailyCapacity: 8 });
        assert.deepEqual(empty, { date: '2026-10-14', hours: 0, over: false });
    });
});

describe('parseDurationPhrase', () => {
    it('parses N-day phrases relative to a reference date', () => {
        assert.deepEqual(
            span.parseDurationPhrase('3-day task', '2026-10-14'),
            { startDate: '2026-10-14', endDate: '2026-10-16' }
        );
        assert.deepEqual(
            span.parseDurationPhrase('takes 4 days', '2026-10-14'),
            { startDate: '2026-10-14', endDate: '2026-10-17' }
        );
        assert.equal(span.parseDurationPhrase('call Ravi', '2026-10-14'), null);
        assert.equal(span.parseDurationPhrase('99-day task', '2026-10-14'), null);
    });
});
