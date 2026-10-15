import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCheckoutTaskMutation } from '../../js/modules/checkout-task-updates.js';
import { Calendar } from '../../js/modules/calendar.js';

// Integration: checkout postpone mutation -> Calendar storage.
// Pins the producer/consumer contract across the seam that unit tests
// cover only one side of: buildCheckoutTaskMutation (producer) and
// Calendar.addWorkPlanTask (consumer), joined exactly the way
// js/app.js applyCheckoutUpdates joins them.

function makeFakeDb(seedUsers = {}) {
    const store = new Map();
    return {
        store,
        async get(collection, id) {
            const key = `${collection}/${id}`;
            if (store.has(key)) return JSON.parse(JSON.stringify(store.get(key)));
            if (collection === 'users') return seedUsers[id] || null;
            return null;
        },
        async put(collection, doc) {
            const key = `${collection}/${doc.id}`;
            store.set(key, JSON.parse(JSON.stringify(doc)));
            return doc;
        },
        async getAll(collection) {
            const out = [];
            for (const [key, doc] of store) {
                if (key.startsWith(`${collection}/`)) out.push(JSON.parse(JSON.stringify(doc)));
            }
            return out;
        }
    };
}

function makeCalendar(userMap) {
    const cal = new Calendar();
    cal.db = makeFakeDb(userMap);
    return cal;
}

// Keep in sync with js/app.js applyCheckoutUpdates (postponedTask branch):
// the exact 5-argument handoff into Calendar.addWorkPlanTask.
async function applyPostponedCopy(cal, postponedTask, fallbackUserId) {
    const assigneeId = String(postponedTask.meta.assignedTo || postponedTask.userId || '').trim() || fallbackUserId;
    await cal.addWorkPlanTask(postponedTask.date, assigneeId, postponedTask.taskDescription, [], {
        ...postponedTask.meta,
        subPlans: postponedTask.subPlans || [],
        assignedTo: assigneeId
    });
    return assigneeId;
}

function postponeMutation(overrides = {}) {
    const task = { task: 'Write report', status: 'in-process', subPlans: ['Draft', 'Review'], assignedTo: 'u1', ...(overrides.task || {}) };
    const update = {
        action: 'postpone',
        planId: 'p1',
        taskIndex: 2,
        actionMeta: { postponeDate: '2026-01-03', ...(overrides.actionMeta || {}) }
    };
    return buildCheckoutTaskMutation(task, update, { planDate: '2026-01-01', currentUserId: 'u1' });
}

describe('postpone wiring - mutation reaches storage intact', () => {
    it('stores a faithful copy on the target date', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' } });
        const mutation = postponeMutation();
        assert.ok(mutation.postponedTask, 'producer created the copy');

        const assigneeId = await applyPostponedCopy(cal, mutation.postponedTask, 'u1');
        assert.equal(assigneeId, 'u1');

        const plan = await cal.db.get('work_plans', 'plan_u1_2026-01-03');
        assert.ok(plan, 'target plan created');
        assert.equal(plan.plans.length, 1);
        const [stored] = plan.plans;
        assert.match(stored.task, /\(Postponed from 2026-01-01\)/, 'lineage in title');
        assert.equal(stored.status, 'postponed');
        assert.equal(stored.addedFrom, 'postponed');
        assert.equal(stored.postponedFromDate, '2026-01-01');
        assert.equal(stored.postponedToDate, '2026-01-03');
        assert.equal(stored.sourcePlanId, 'p1');
        assert.equal(stored.sourceTaskIndex, 2);
        assert.equal(stored.assignedTo, 'u1');
        assert.deepEqual(stored.subPlans, ['Draft', 'Review'], 'sub-plans survive structurally, not as tags');
        assert.deepEqual(stored.tags, [], 'tags stay tags');
    });

    it('re-postpone updates the existing copy instead of duplicating', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' } });
        const first = postponeMutation();
        await applyPostponedCopy(cal, first.postponedTask, 'u1');
        const second = postponeMutation();
        await applyPostponedCopy(cal, second.postponedTask, 'u1');

        const plan = await cal.db.get('work_plans', 'plan_u1_2026-01-03');
        assert.equal(plan.plans.length, 1, 'dedup on (sourcePlanId, sourceTaskIndex, addedFrom)');
    });

    it('source stays hidden: producer flag + storage filter agree', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' } });
        const mutation = postponeMutation();
        assert.equal(mutation.nextTask.isRemoved, true, 'producer hides the source');
        assert.deepEqual(cal.sanitizePlanTasks([mutation.nextTask]), [], 'storage filter honors the flag');
        assert.deepEqual(cal.sanitizePlanTasks([{ task: 'Live' }]), [{ task: 'Live' }], 'live tasks pass through');
    });

    it('assignee falls back to the mutation user id', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' }, u9: { id: 'u9', name: 'Fallback User' } });
        const mutation = postponeMutation({ task: { assignedTo: '' } });
        assert.equal(mutation.postponedTask.userId, 'u1', 'producer falls back to currentUserId');
        const assigneeId = await applyPostponedCopy(cal, mutation.postponedTask, 'u9');
        assert.equal(assigneeId, 'u1', 'meta/userId win over the call-site fallback');
        const plan = await cal.db.get('work_plans', 'plan_u1_2026-01-03');
        assert.ok(plan, 'copy lands on the resolved assignee plan');
    });
});
