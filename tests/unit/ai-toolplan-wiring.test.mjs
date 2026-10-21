import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchToolPlan, executeToolPlan } from '../../js/modules/ai-actions.js';
import { Calendar } from '../../js/modules/calendar.js';

// Integration: tool-plan gate -> action dispatch -> Calendar storage.
// Pins the contract across the seam unit tests cover only one side of:
// fetchToolPlan (gate + server round-trip) and executeToolPlan /
// executePostponeTask (matching + move), ending in the real
// Calendar.addWorkPlanTask. window singletons and fetch are stubbed;
// everything else is production code.

global.window = global.window || {};

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

function stubFetch(planPayload, { ok = true, calls = null } = {}) {
    global.fetch = async (_url, opts) => {
        if (calls) calls.push(JSON.parse(String(opts && opts.body ? opts.body : '{}')));
        return { ok, json: async () => planPayload };
    };
}

describe('ai wiring - tool-plan gate', () => {
    beforeEach(() => {
        global.window.AppFirebaseAuth = undefined;
    });

    it('plain questions skip the server round-trip entirely', async () => {
        let called = 0;
        global.fetch = async () => { called += 1; throw new Error('must not be called'); };
        const plan = await fetchToolPlan('what should I do first today?');
        assert.equal(plan, null);
        assert.equal(called, 0, 'no fetch without an action verb');
    });

    it('action phrasing reaches the server as a tool_plan request', async () => {
        const calls = [];
        stubFetch({ plan: { action: 'postpone_task', query: 'report', date: '2026-03-05' } }, { calls });
        const plan = await fetchToolPlan('postpone my report to Friday');
        assert.equal(calls.length, 1);
        assert.equal(calls[0].mode, 'tool_plan');
        assert.match(String(calls[0].text), /postpone/i);
        assert.deepEqual(plan, { action: 'postpone_task', query: 'report', date: '2026-03-05' });
    });

    it('server "none" and failures resolve to null, never throw', async () => {
        stubFetch({ plan: { action: 'none' } });
        assert.equal(await fetchToolPlan('postpone my report'), null);
        stubFetch({}, { ok: false });
        assert.equal(await fetchToolPlan('postpone my report'), null);
        global.fetch = async () => { throw new Error('offline'); };
        assert.equal(await fetchToolPlan('move my tasks'), null);
    });
});

describe('ai wiring - postpone plan executes the move end to end', () => {
    it('matching task hides on the old day and lands on the target', async () => {
        const appDb = makeFakeDb();
        await appDb.put('work_plans', {
            id: 'plan_u1_2026-03-01',
            userId: 'u1',
            userName: 'Test User',
            date: '2026-03-01',
            plans: [{ task: 'Write report', status: 'in-process', assignedTo: 'u1' }],
            updatedAt: '2026-03-01T00:00:00.000Z'
        });
        const cal = new Calendar();
        cal.db = makeFakeDb({ u1: { id: 'u1', name: 'Test User' } });
        global.window.AppAuth = { getUser: () => ({ id: 'u1' }) };
        global.window.AppDB = appDb;
        global.window.AppCalendar = cal;
        global.window.AppAnalyticsService = undefined;

        const result = await executeToolPlan({ action: 'postpone_task', query: 'report', date: '2026-03-05' });
        assert.equal(result.ok, true);
        assert.deepEqual(result.moved, [{ task: 'Write report', from: '2026-03-01', to: '2026-03-05' }]);

        const source = await appDb.get('work_plans', 'plan_u1_2026-03-01');
        assert.equal(source.plans[0].isRemoved, true, 'source hidden on the old day');

        const target = await cal.db.get('work_plans', 'plan_u1_2026-03-05');
        assert.ok(target, 'target plan created');
        assert.equal(target.plans.length, 1);
        assert.equal(target.plans[0].task, 'Write report');
        assert.equal(target.plans[0].addedFrom, 'ai_agent');

        const visible = cal.sanitizePlanTasks(source.plans);
        assert.deepEqual(visible, [], 'hidden source never resurfaces through the storage filter');
    });

    it('unknown tasks and unknown actions fail loudly, not silently', async () => {
        global.window.AppAuth = { getUser: () => ({ id: 'u1' }) };
        global.window.AppDB = makeFakeDb();
        global.window.AppCalendar = new Calendar();
        global.window.AppCalendar.db = makeFakeDb();
        await assert.rejects(
            executeToolPlan({ action: 'postpone_task', query: 'nothing matches this', date: '2026-03-05' }),
            /No open task found/
        );
        await assert.rejects(executeToolPlan({ action: 'teleport_task' }), /Unknown action/);
    });

    it('refuses an empty task query before it can match or change tasks', async () => {
        global.window.AppAuth = { getUser: () => ({ id: 'u1' }) };
        await assert.rejects(
            executeToolPlan({ action: 'postpone_task', query: '', date: '2026-03-05' }),
            /task name is required/
        );
        await assert.rejects(
            executeToolPlan({ action: 'complete_task', query: '' }),
            /task name is required/
        );
        await assert.rejects(executeToolPlan({ action: 'add_task', task: '  ' }), /task name is required/);
    });
});
