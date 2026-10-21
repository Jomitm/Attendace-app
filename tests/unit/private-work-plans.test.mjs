import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    hydrateWorkPlanFromStorage,
    splitWorkPlanForStorage
} from '../../js/utils/private-work-plans.js';
import { isTaskVisibleToViewer } from '../../js/utils/task-visibility.js';
import { serializeTaskProvenance, deserializeTaskProvenance } from '../../js/utils/task-provenance.js';
import { Database } from '../../js/modules/db.js';
import { createFirestoreMock } from '../helpers/firestore-mock.mjs';

describe('private work-plan storage boundary', () => {
    it('keeps private task content out of the shared plan document', () => {
        const result = splitWorkPlanForStorage({
            id: 'plan_owner_2026-10-21',
            userId: 'owner',
            plans: [
                { task: 'Public task' },
                { id: 'task-2', task: 'Payroll follow-up', notes: 'sensitive detail', isPrivate: true, assignedTo: 'assignee' }
            ]
        }, () => 'private-id');

        assert.deepEqual(result.publicPlan.plans, [
            { task: 'Public task' },
            { id: 'task-2', privateTaskId: 'private-id', isPrivate: true, assignedTo: 'assignee' }
        ]);
        assert.equal(JSON.stringify(result.publicPlan).includes('Payroll follow-up'), false);
        assert.equal(JSON.stringify(result.publicPlan).includes('sensitive detail'), false);
        assert.deepEqual(result.privateTasks, [{
            id: 'private-id',
            ownerId: 'owner',
            createdById: 'owner',
            assignedTo: 'assignee',
            planId: 'plan_owner_2026-10-21',
            taskIndex: 1,
            task: { id: 'task-2', task: 'Payroll follow-up', notes: 'sensitive detail', isPrivate: true, assignedTo: 'assignee' }
        }]);
    });

    it('preserves pointer-only tasks without overwriting the protected task body', () => {
        const pointer = { id: 't', privateTaskId: 'private-id', isPrivate: true, assignedTo: 'assignee' };
        const result = splitWorkPlanForStorage({ id: 'p', userId: 'owner', plans: [pointer] });
        assert.deepEqual(result.publicPlan.plans, [pointer]);
        assert.deepEqual(result.privateTasks, []);
    });

    it('hydrates private task bodies only for the owner or assigned user', async () => {
        const publicPlan = {
            id: 'plan_owner_2026-10-21',
            userId: 'owner',
            plans: [{ id: 'task-2', privateTaskId: 'private-id', isPrivate: true, assignedTo: 'assignee' }]
        };
        const stored = {
            id: 'private-id',
            ownerId: 'owner',
            assignedTo: 'assignee',
            planId: publicPlan.id,
            task: { id: 'task-2', task: 'Sensitive task', isPrivate: true, assignedTo: 'assignee' }
        };
        let reads = 0;
        const read = async () => { reads += 1; return stored; };

        const ownerPlan = await hydrateWorkPlanFromStorage(publicPlan, 'owner', read);
        assert.equal(ownerPlan.plans[0].task, 'Sensitive task');
        const assigneePlan = await hydrateWorkPlanFromStorage(publicPlan, 'assignee', read);
        assert.equal(assigneePlan.plans[0].task, 'Sensitive task');
        const otherPlan = await hydrateWorkPlanFromStorage(publicPlan, 'other-user', read);
        assert.deepEqual(otherPlan.plans, []);
        assert.equal(reads, 2, 'unauthorized viewers never request the private document');
        assert.equal(isTaskVisibleToViewer({ isPrivate: true }, { userId: 'annual_shared', createdById: 'owner' }, 'owner'), true);
    });

    it('rejects mismatched private records and supports legacy tasks during migration', async () => {
        const plan = {
            id: 'plan_owner_2026-10-21',
            userId: 'owner',
            plans: [
                { id: 'legacy', task: 'Legacy task', isPrivate: true },
                { id: 'pointer', privateTaskId: 'private-id', isPrivate: true, assignedTo: 'assignee' }
            ]
        };
        const hydrated = await hydrateWorkPlanFromStorage(plan, 'owner', async () => ({
            ownerId: 'someone-else',
            assignedTo: 'assignee',
            planId: plan.id,
            task: { task: 'Must not appear' }
        }));
        assert.deepEqual(hydrated.plans, [{ id: 'legacy', task: 'Legacy task', isPrivate: true }]);
    });

    it('fails a plan read on transient private-record errors instead of returning a lossy plan', async () => {
        const plan = { id: 'p', userId: 'owner', plans: [{ privateTaskId: 'secret', isPrivate: true }] };
        await assert.rejects(
            hydrateWorkPlanFromStorage(plan, 'owner', async () => { throw new Error('temporary read failure'); }),
            (error) => error.cause?.message === 'temporary read failure'
        );
    });

    it('round-trips private task identity through the editor provenance payload', () => {
        const task = { id: 'stable-task', privateTaskId: 'private-doc', isPrivate: true };
        assert.deepEqual(deserializeTaskProvenance(serializeTaskProvenance(task)), { id: task.id, privateTaskId: task.privateTaskId });
    });

    it('routes database writes through separate private documents and hydrates by viewer', async () => {
        global.window = { AppAuth: { getUser: () => ({ id: 'owner' }) } };
        const firestore = createFirestoreMock();
        const db = new Database();
        db.db = firestore;
        await db.put('work_plans', {
            id: 'plan-owner-day',
            userId: 'owner',
            plans: [{ task: 'Hidden task body', isPrivate: true, assignedTo: 'assignee' }]
        });

        const publicPlan = firestore._data.work_plans['plan-owner-day'];
        const placeholder = publicPlan.plans[0];
        assert.equal(Object.hasOwn(placeholder, 'task'), false);
        assert.equal(firestore._data.private_work_plan_tasks[placeholder.privateTaskId].task.task, 'Hidden task body');

        const ownerRead = await db.get('work_plans', 'plan-owner-day');
        assert.equal(ownerRead.plans[0].task, 'Hidden task body');
        global.window.AppAuth.getUser = () => ({ id: 'other-user' });
        db.cache.clear();
        const unauthorizedRead = await db.get('work_plans', 'plan-owner-day');
        assert.deepEqual(unauthorizedRead.plans, []);
    });

    it('lets a collaborator update public tasks without deleting or replacing private task data', async () => {
        global.window = { AppAuth: { getUser: () => ({ id: 'owner' }) } };
        const firestore = createFirestoreMock();
        const db = new Database();
        db.db = firestore;
        await db.put('work_plans', {
            id: 'plan-owner-day', userId: 'owner',
            plans: [
                { task: 'Public task' },
                { id: 'secret', task: 'Protected task', isPrivate: true, assignedTo: 'assignee' }
            ]
        });
        const before = JSON.stringify(firestore._data.private_work_plan_tasks);
        const placeholder = firestore._data.work_plans['plan-owner-day'].plans[1];
        global.window.AppAuth.getUser = () => ({ id: 'collaborator' });
        await db.put('work_plans', {
            id: 'plan-owner-day', userId: 'owner',
            plans: [{ task: 'Public task updated' }]
        });
        assert.equal(JSON.stringify(firestore._data.private_work_plan_tasks), before);
        assert.deepEqual(firestore._data.work_plans['plan-owner-day'].plans[1], placeholder);
    });

    it('hydrates date-indexed plan reads with private task bodies', async () => {
        global.window = { AppAuth: { getUser: () => ({ id: 'owner' }) } };
        const firestore = createFirestoreMock({
            work_plans: { p: { id: 'p', userId: 'owner', date: '2026-10-21', plans: [{ id: 't', privateTaskId: 's', isPrivate: true }] } },
            private_work_plan_tasks: { s: { id: 's', ownerId: 'owner', assignedTo: '', planId: 'p', task: { id: 't', task: 'private body' } } }
        });
        const db = new Database();
        db.db = firestore;
        const rows = await db.getDayPlansByDate('2026-10-21');
        assert.equal(rows[0].plans[0].task, 'private body');
    });

    it('applies filters in the read-optimization fallback path', () => {
        const db = new Database();
        const rows = [{ id: 'a', userId: 'u1' }, { id: 'b', userId: 'u2' }];
        assert.deepEqual(db.filterRows(rows, [{ field: 'userId', operator: '==', value: 'u1' }]), [rows[0]]);
    });
});
