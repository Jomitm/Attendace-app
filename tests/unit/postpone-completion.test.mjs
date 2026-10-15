import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCheckoutTaskMutation } from '../../js/modules/checkout-task-updates.js';
import { RatingSystem } from '../../js/modules/rating.js';
import { AppConfig } from '../../js/config.js';

// rating.js reads window.AppConfig.POSTPONE_WORK_STATUS_POINTS.
global.window = global.window || {};
global.window.AppConfig = AppConfig;

describe('checkout task mutation - completion comment', () => {
    it('carries completionComment on complete', () => {
        const task = { task: 'Write report', status: 'in-process', progressPercent: 50 };
        const update = {
            action: 'complete',
            planId: 'p1',
            taskIndex: 0,
            actionMeta: { completionComment: '  Done with appendix  ' }
        };
        const mutation = buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
        assert.equal(mutation.nextTask.status, 'completed');
        assert.equal(mutation.nextTask.completionComment, 'Done with appendix');
    });

    it('falls back to stored comment when none provided in the action', () => {
        const task = { task: 'Task', status: 'in-process', completionComment: 'Previously noted' };
        const update = { action: 'complete', planId: 'p1', taskIndex: 0, actionMeta: {} };
        const mutation = buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
        assert.equal(mutation.nextTask.completionComment, 'Previously noted');
    });

    it('defaults comment to empty string on complete', () => {
        const task = { task: 'Task', status: 'in-process' };
        const update = { action: 'complete', planId: 'p1', taskIndex: 0, actionMeta: {} };
        const mutation = buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
        assert.equal(mutation.nextTask.completionComment, '');
    });
});

describe('checkout task mutation - postpone work status', () => {
    it('carries postponeWorkStatus on the source task and the postponed copy', () => {
        const task = { task: 'Task', status: 'in-process', progressPercent: 30 };
        const update = {
            action: 'postpone',
            planId: 'p1',
            taskIndex: 0,
            actionMeta: { postponeDate: '2026-01-02', postponeWorkStatus: 'in_progress' }
        };
        const mutation = buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
        assert.equal(mutation.nextTask.status, 'postponed');
        assert.equal(mutation.nextTask.postponeWorkStatus, 'in_progress');
        assert.ok(mutation.postponedTask, 'should create a next-day copy');
        assert.equal(mutation.postponedTask.meta.postponeWorkStatus, 'in_progress');
    });

    it('defaults postponeWorkStatus to not_started when omitted', () => {
        const task = { task: 'Task', status: 'in-process', progressPercent: 10 };
        const update = {
            action: 'postpone',
            planId: 'p1',
            taskIndex: 0,
            actionMeta: { postponeDate: '2026-01-02' }
        };
        const mutation = buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
        assert.equal(mutation.nextTask.postponeWorkStatus, 'not_started');
    });
});

describe('checkout postpone - move semantics', () => {
    it('hides the source on the old date and keeps history on the copy', () => {
        const task = { task: 'Write report', status: 'in-process' };
        const update = {
            action: 'postpone',
            planId: 'p1',
            taskIndex: 2,
            actionMeta: { postponeDate: '2026-01-05' }
        };
        const mutation = buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
        assert.equal(mutation.nextTask.isRemoved, true, 'source hidden on old date');
        assert.equal(mutation.nextTask.status, 'postponed', 'status kept for lineage');
        assert.equal(mutation.nextTask.postponedToDate, '2026-01-05');
        assert.ok(mutation.postponedTask, 'copy created on target date');
        assert.equal(mutation.postponedTask.date, '2026-01-05');
        assert.equal(mutation.postponedTask.meta.postponedFromDate, '2026-01-01');
        assert.equal(mutation.postponedTask.meta.sourcePlanId, 'p1');
        assert.equal(mutation.postponedTask.meta.sourceTaskIndex, 2);
    });

    it('never hides the source when the postpone date is invalid', () => {
        const task = { task: 'Write report', status: 'in-process' };
        const update = {
            action: 'postpone',
            planId: 'p1',
            taskIndex: 0,
            actionMeta: { postponeDate: '2026-01-01' }
        };
        const mutation = buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
        assert.ok(mutation.postponeError, 'invalid date rejected');
        assert.equal(mutation.postponedTask, null, 'no copy created');
        assert.ok(!mutation.nextTask.isRemoved, 'failed postpone must not hide the original');
        assert.equal(mutation.nextTask.status, 'in-process', 'status reverted');
    });
});

describe('postpone points by work status', () => {
    const rs = new RatingSystem();
    const compute = (ws) => rs.calculateTaskPoints({ status: 'postponed', postponeWorkStatus: ws }, '2026-01-01');

    it('awards 0 for not_started', () => assert.equal(compute('not_started'), 0));
    it('awards 3 for work_started', () => assert.equal(compute('work_started'), 3));
    it('awards 5 for in_progress', () => assert.equal(compute('in_progress'), 5));
    it('awards 0 when work status is missing', () => assert.equal(compute(undefined), 0));
});
