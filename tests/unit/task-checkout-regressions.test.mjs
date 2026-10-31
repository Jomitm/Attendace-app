import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'acorn';
import { Database } from '../../js/modules/db.js';
import { Calendar } from '../../js/modules/calendar.js';
import { AppAuth } from '../../js/modules/auth.js';
import { getLocalISO } from '../../js/utils/date-helpers.js';
import { createFirestoreMock } from '../helpers/firestore-mock.mjs';

test('staff can create their first daily plan when rules deny reading a missing document', async () => {
    const oldWindow = globalThis.window;
    globalThis.window = { AppFirebaseAuth: { currentUser: { uid: 'vijo', getIdToken() {} } } };
    try {
        const firestore = createFirestoreMock();
        const originalCollection = firestore.collection;
        const denied = Object.assign(new Error('Missing or insufficient permissions'), { code: 'permission-denied' });
        firestore.collection = name => {
            const collection = originalCollection(name);
            const originalDoc = collection.doc;
            collection.doc = id => ({ ...originalDoc(id), get: async () => { throw denied; } });
            return collection;
        };
        const db = new Database();
        db.db = firestore;
        const id = 'plan_vijo_2026-10-31';
        let confirmed = false;
        db.readStaffData = async (collection, query, options) => {
            assert.equal(collection, 'work_plans');
            assert.equal(query.id, id);
            assert.equal(options.source, 'server');
            confirmed = true;
            return [];
        };
        await db.putWorkPlan({ id, userId: 'vijo', date: '2026-10-31', plans: [{ task: 'First daily task' }] });
        assert.equal(confirmed, true);
        assert.equal(firestore._data.work_plans[id].createdById, 'vijo');
        assert.equal(firestore._data.work_plans[id].plans[0].task, 'First daily task');
        // A denied existing document must never be treated as an empty plan.
        db.readStaffData = async () => [{ id }];
        await assert.rejects(db.putWorkPlan({ id, userId: 'vijo', date: '2026-10-31', plans: [] }), error => error === denied);
        // The workaround cannot be used for another owner or arbitrary doc ID.
        db.readStaffData = async () => { throw new Error('Must not use the missing-plan fallback'); };
        await assert.rejects(db.putWorkPlan({ id: 'plan_other_2026-10-31', userId: 'other', date: '2026-10-31' }), error => error === denied);
        await assert.rejects(db.putWorkPlan({ id: 'arbitrary', userId: 'vijo', date: '2026-10-31' }), error => error === denied);
    } finally { globalThis.window = oldWindow; }
});

test('staff can append work to an admin-created plan without changing its creator', async () => {
    const oldWindow = globalThis.window;
    const oldUser = AppAuth.currentUser;
    const user = { id: 'vijo', name: 'Vijo' };
    globalThis.window = { AppAuth: { getUser: () => user } };
    AppAuth.currentUser = user;
    try {
        const id = 'plan_vijo_2026-10-31';
        const firestore = createFirestoreMock({ work_plans: {
            [id]: { id, userId: user.id, createdById: 'admin', createdByName: 'Administrator',
                date: '2026-10-31', plans: [{ task: 'Assigned work' }] }
        } });
        const db = new Database();
        db.db = firestore;
        const calendar = new Calendar();
        calendar.db = db;
        // setWorkPlan sends the logged-in editor as creator. Storage must
        // preserve attribution required by the existing owner-update rule.
        await calendar.setWorkPlan('2026-10-31', [
            { task: 'Assigned work', planScope: 'personal' },
            { task: 'New staff task', planScope: 'personal' }
        ]);
        assert.equal(firestore._data.work_plans[id].createdById, 'admin');
        assert.equal(firestore._data.work_plans[id].createdByName, 'Administrator');
        assert.equal(firestore._data.work_plans[id].plans.length, 2);
    } finally {
        globalThis.window = oldWindow;
        AppAuth.currentUser = oldUser;
    }
});

test('a legacy plan receives its owner as creator on first edit', async () => {
    const oldWindow = globalThis.window;
    globalThis.window = { AppAuth: { getUser: () => ({ id: 'vijo' }) } };
    try {
        const firestore = createFirestoreMock({ work_plans: { p: { userId: 'vijo', plans: [] } } });
        const db = new Database();
        db.db = firestore;
        await db.put('work_plans', { id: 'p', userId: 'vijo', createdById: 'other', plans: [{ task: 'Work' }] });
        assert.equal(firestore._data.work_plans.p.createdById, 'vijo');
    } finally { globalThis.window = oldWindow; }
});

test('checkout collaboration lookup reads only the requested day and keeps accepted tags', async () => {
    const calendar = new Calendar();
    let requestedDate;
    calendar.db = {
        getDayPlansByDate: async date => {
            requestedDate = date;
            return [
                { id: 'accepted', date, plans: [{ tags: [{ id: 'vijo', status: 'accepted' }] }] },
                { id: 'pending', date, plans: [{ tags: [{ id: 'vijo', status: 'pending' }] }] },
                { id: 'other', date, plans: [{ tags: [{ id: 'other', status: 'accepted' }] }] }
            ];
        },
        getAll: async () => { throw new Error('Must not read the full work-plan collection'); }
    };
    assert.deepEqual((await calendar.getCollaborations('vijo', '2026-10-31')).map(p => p.id), ['accepted']);
    assert.equal(requestedDate, '2026-10-31');
});

const appSource = readFileSync(new URL('../../js/app.js', import.meta.url), 'utf8');
const ast = parse(appSource, { ecmaVersion: 'latest', sourceType: 'module' });
const submitNode = ast.body.find(node => node.type === 'ExpressionStatement'
    && node.expression.type === 'AssignmentExpression'
    && node.expression.left.object?.name === 'window'
    && node.expression.left.property?.name === 'app_submitCheckOut');
assert.ok(submitNode);
const submitSource = appSource.slice(submitNode.start, submitNode.end);

function checkoutFixture({ taskSave, checkoutResult, checkoutError, user = { id: 'vijo' } } = {}) {
    const calls = [];
    const notices = [];
    const button = { disabled: false, innerHTML: '' };
    const modal = { style: { display: 'flex' } };
    const form = {
        tagName: 'FORM', description: { value: 'Finished work' },
        tomorrowGoal: { value: 'Tomorrow work' },
        querySelector: () => button,
        querySelectorAll: () => [{ value: 'Extra work' }]
    };
    const context = vm.createContext({
        console: { error() {} }, Date, getLocalISO,
        attendanceActionInFlight: false,
        document: { getElementById: id => id === 'checkout-modal' ? modal : null },
        alert: message => notices.push(message),
        app_normalizeBudgetHeadId: value => value || 'UNALLOCATED',
        app_getCheckoutSubmitLocation: async () => ({ lat: 12, lng: 77 }),
        app_resetCheckoutLocationSession() {},
        markLocalAttendanceMutation: () => calls.push('mutation'),
        refreshAICenterIfActive: async () => {},
        refreshDashboardAfterAttendance: async () => { calls.push('refresh'); },
        window: {
            AppAuth: { getUser: () => user },
            AppAttendance: { checkOut: async (...args) => {
                calls.push('checkout');
                context.savedOptions = args[6];
                if (checkoutError) throw checkoutError;
                return checkoutResult || { ok: true };
            } },
            AppCalendar: { addWorkPlanTask: async (...args) => {
                calls.push('task');
                if (taskSave) await taskSave(...args);
            } },
            app_collectCheckoutTaskUpdates: () => ({ updates: [], errors: [] }),
            app_renderCheckoutActionPreview() {},
            app_showSyncToast: message => notices.push(message)
        }
    });
    vm.runInContext(submitSource, context);
    return { context, calls, notices, modal,
        submit: () => context.window.app_submitCheckOut({ preventDefault() {}, target: form, submitter: button }) };
}

test('attendance and dashboard complete before optional tasks, even when task saving stalls', async () => {
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const f = checkoutFixture({ taskSave: () => pending });
    const submission = f.submit();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(f.calls, ['checkout', 'mutation', 'refresh', 'task']);
    assert.equal(f.modal.style.display, 'none');
    assert.equal(f.context.savedOptions.tomorrowGoal, 'Tomorrow work');
    release();
    await submission;
});

test('optional task failure reports successful checkout with a task warning', async () => {
    const f = checkoutFixture({ taskSave: async () => { throw new Error('permission denied'); } });
    await f.submit();
    assert.equal(f.calls[0], 'checkout');
    assert.ok(f.calls.includes('refresh'));
    assert.equal(f.modal.style.display, 'none');
    assert.match(f.notices[0], /^Checked out, but some task updates need review/);
    assert.equal(f.context.attendanceActionInFlight, false);
});

test('a conflict or attendance save failure creates no optional tasks', async () => {
    for (const options of [
        { checkoutResult: { conflict: true, message: 'Already checked out' } },
        { checkoutError: new Error('Network unavailable') }
    ]) {
        const f = checkoutFixture(options);
        await f.submit();
        assert.equal(f.calls.includes('task'), false);
        assert.equal(f.context.attendanceActionInFlight, false);
    }
});

if (process.env.STAFF_TASK_AUDIT_PATH) test('checkout is not blocked by optional task failure for every audited active account', async t => {
    const audit = JSON.parse(readFileSync(process.env.STAFF_TASK_AUDIT_PATH, 'utf8'));
    assert.equal(audit.projectId, 'crwiattendance');
    for (const user of audit.staff) {
        const f = checkoutFixture({ user, taskSave: async () => { throw new Error('Task service unavailable'); } });
        await f.submit();
        assert.equal(f.calls[0], 'checkout', user.name);
        assert.ok(f.calls.includes('refresh'), user.name);
        assert.equal(f.modal.style.display, 'none', user.name);
        assert.match(f.notices[0], /^Checked out, but some task updates need review/);
        t.diagnostic(user.name + ': checkout recorded despite optional task failure');
    }
});
