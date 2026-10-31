import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { validateProgramme, canViewProgramme, upcomingProgrammes, programmeInRange, programmeCalendarEntry, programmeToday, addProgrammeDays } from '../../js/utils/programmes.js';
import { canSeeAdminPanel } from '../../js/modules/permissions.js';
const require = createRequire(import.meta.url);
const valid = () => ({ title: 'Programme', startDate: '2026-11-02', endDate: '2026-11-03', allDay: true, startTime: '', endTime: '', venue: 'CRWI', meetingUrl: '', description: '', coordinatorId: 'coordinator', audience: 'selected', participantIds: ['staff'] });
test('programme validates real dates, ranges, times, participants and secure links', () => {
    assert.equal(validateProgramme(valid()).title, 'Programme');
    for (const patch of [{ startDate: '2026-02-30' }, { endDate: '2026-10-01' }, { title: '' }, { title: 'Title\rInjected' }, { participantIds: [] }, { meetingUrl: 'javascript:alert(1)' }, { allDay: false, startTime: '25:00', endTime: '17:00' }, { allDay: false, startDate: '2026-11-03', startTime: '17:00', endTime: '09:00' }, { participantIds: ['bad/id'] }]) assert.throws(() => validateProgramme({ ...valid(), ...patch }));
    assert.equal(validateProgramme({ ...valid(), allDay: false, startTime: '09:00', endTime: '17:00' }).allDay, false);
});
test('programme visibility does not confuse unrelated administrative access with programme access', () => {
    assert.equal(canSeeAdminPanel({ permissions: { programmes: 'admin' } }), false);
    const row = { ...valid(), createdById: 'creator' };
    for (const id of ['creator', 'coordinator', 'staff']) assert.equal(canViewProgramme(row, { id }), true);
    assert.equal(canViewProgramme(row, { id: 'outsider', permissions: { attendance: 'admin' } }), false);
    assert.equal(canViewProgramme(row, { uid: 'manager', isAdmin: true }), true);
    assert.equal(canViewProgramme(row, { uid: 'outsider', permissions: { programmes: 'admin' } }), false);
    assert.equal(canViewProgramme({ ...row, audience: 'all' }, null), false);
});
test('upcoming programmes include ongoing spans, omit cancelled/past, and sort consistently', () => {
    const rows = [
        { ...valid(), id: 'future', title: 'Future', startDate: '2026-11-02', endDate: '2026-11-02' },
        { ...valid(), id: 'ongoing', title: 'Ongoing', startDate: '2026-10-29', endDate: '2026-11-01' },
        { ...valid(), id: 'cancelled', status: 'cancelled' },
        { ...valid(), id: 'past', startDate: '2026-10-01', endDate: '2026-10-02' }
    ];
    assert.deepEqual(upcomingProgrammes(rows, '2026-10-30').map(r => r.id), ['ongoing', 'future']);
    assert.equal(programmeInRange(rows[1], '2026-10-30', '2026-10-30'), true);
    assert.equal(programmeToday(new Date('2026-10-29T20:00:00Z')), '2026-10-30');
    assert.equal(addProgrammeDays('2028-02-28', 1), '2028-02-29');
});
test('Outlook programme dates use exclusive all-day ends and actual multi-day timed ends', () => {
    const all = programmeCalendarEntry({ ...valid(), id: 'abc' });
    assert.equal(all.dtstart, '20261102'); assert.equal(all.dtend, '20261104');
    const timed = programmeCalendarEntry({ ...valid(), id: 'abc', allDay: false, startTime: '09:30', endTime: '16:00' });
    assert.equal(timed.dtstart, '20261102T093000'); assert.equal(timed.dtend, '20261103T160000'); assert.equal(timed.uid, all.uid);
});

let actor, allowed, records, staff;
const db = { collection(name) {
    const collection = {
        doc(id) { return { id, async get() { const value = name === 'users' ? staff.get(id) : records.get(id); return { id, exists: !!value, data: () => value }; } }; },
        where() { return collection; }, limit() { return collection; },
        async get() { return { docs: [...records].map(([id, data]) => ({ id, data: () => data })) }; }
    }; return collection;
}, async runTransaction(fn) { return fn({ get: ref => ref.get(), set: (ref, data) => records.set(ref.id, data) }); } };
const authPath = require.resolve('../../api/_api-auth.js'), dbPath = require.resolve('../../api/_firebase-admin.js');
require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: {
    authenticateRequest: async () => allowed ? { ok: true, user: actor } : { ok: false, status: 401, error: 'Sign in' },
    sendAuthError: (res, auth) => res.status(auth.status).json({ error: auth.error })
} };
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { getDb: () => db } };
const handler = require('../../api/_programmes.js');
async function call(body, method = 'POST') { const result = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(data) { this.body = data; return this; } }; await handler({ method, body }, result); return result; }
beforeEach(() => { actor = { uid: 'manager', isAdmin: true }; allowed = true; records = new Map(); staff = new Map([['coordinator', {}], ['staff', {}]]); });
test('programme API rejects unauthenticated requests and lets staff create their own programmes', async () => {
    allowed = false; assert.equal((await call({ action: 'list' })).code, 401);
    assert.equal((await call({ action: 'save', id: 'one', data: valid() })).code, 401);
    allowed = true; actor = { uid: 'staff', permissions: { attendance: 'admin' } };
    const created = await call({ action: 'save', id: 'one', data: { ...valid(), createdById: 'forged' } });
    assert.equal(created.code, 200); assert.equal(created.body.data.createdById, 'staff');
    assert.equal(records.size, 1); assert.equal((await call({}, 'GET')).code, 405);
});

test('ordinary staff can edit and cancel their own programmes but cannot change another creator record', async () => {
    actor = { uid: 'staff', permissions: {} };
    const created = await call({ action: 'save', id: 'one', data: valid() });
    assert.equal(created.code, 200);
    const edited = await call({ action: 'save', id: 'one', expectedUpdatedAt: created.body.data.updatedAt, data: { ...valid(), title: 'Updated programme' } });
    assert.equal(edited.code, 200);
    actor = { uid: 'coordinator', permissions: {} };
    for (const action of ['save', 'cancel']) assert.equal((await call({ action, id: 'one', expectedUpdatedAt: edited.body.data.updatedAt, data: valid() })).code, 403);
    assert.equal(records.get('one').title, 'Updated programme');
    actor = { uid: 'staff', permissions: {} };
    assert.equal((await call({ action: 'cancel', id: 'one', expectedUpdatedAt: edited.body.data.updatedAt })).code, 200);
});
test('programme API saves with server ownership, rejects stale updates and retains cancelled history', async () => {
    const first = await call({ action: 'save', id: 'one', data: { ...valid(), createdById: 'forged' } });
    assert.equal(first.code, 200); assert.equal(first.body.data.createdById, 'manager');
    assert.equal((await call({ action: 'save', id: 'one', data: valid() })).code, 409);
    const cancelled = await call({ action: 'cancel', id: 'one', expectedUpdatedAt: first.body.data.updatedAt });
    assert.equal(cancelled.code, 200); assert.equal(records.get('one').status, 'cancelled');
    assert.equal((await call({ action: 'save', id: 'one', data: valid(), expectedUpdatedAt: cancelled.body.data.updatedAt })).code, 409);
});
test('programme API filters selected audiences and cancellation before returning records', async () => {
    records.set('one', { ...valid(), status: 'scheduled', createdById: 'manager' });
    records.set('two', { ...valid(), audience: 'all', status: 'cancelled' });
    actor = { uid: 'outsider', permissions: {} };
    const body = { action: 'list', from: '2026-10-30', to: '2026-11-30', includeCancelled: true };
    assert.deepEqual((await call(body)).body.data, []);
    assert.equal((await call({ action: 'get', id: 'one' })).code, 404);
    actor = { uid: 'staff' }; assert.equal((await call(body)).body.data.length, 1);
    actor = { uid: 'manager', isAdmin: true }; assert.equal((await call(body)).body.data.length, 2);
});
test('programme API rejects former staff participants and invalid date-range reads', async () => {
    staff.set('staff', { employmentStatus: 'former' });
    assert.equal((await call({ action: 'save', id: 'one', data: valid() })).code, 400);
    assert.equal((await call({ action: 'list', from: 'not-a-date' })).code, 400);
    assert.equal(records.size, 0);
});

test('localhost middleware replaces a cached old permission handler and loads current shared rules', async () => {
    const devRequire = createRequire(new URL('../../vite.config.js', import.meta.url));
    const handlerPath = devRequire.resolve('./api/_programmes.js');
    devRequire.cache[handlerPath] = { id: handlerPath, filename: handlerPath, loaded: true, exports: (_req, res) => res.status(403).json({ error: 'Manage Programmes permission is required.' }) };
    const source = readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8');
    const factory = source.slice(source.indexOf('function createProgrammesDevPlugin()'), source.indexOf('function createFeastDevPlugin()'));
    const plugin = new Function('require', 'readBody', 'sendJson', `${factory}; return createProgrammesDevPlugin();`)(devRequire, async req => req.body, (res, code, body) => { res.code = code; res.body = body; });
    let middleware, loadedRules = false;
    plugin.configureServer({ middlewares: { use(_path, callback) { middleware = callback; } }, async ssrLoadModule(path) {
        assert.equal(path, '/js/utils/programmes.js'); loadedRules = true;
        return import('../../js/utils/programmes.js');
    } });
    actor = { uid: 'staff', permissions: {} };
    const response = { setHeader() {} };
    await middleware({ method: 'POST', body: { action: 'save', id: 'from-dev', data: valid() } }, response);
    assert.equal(loadedRules, true); assert.equal(response.code, 200);
    assert.equal(response.body.data.createdById, 'staff');
});
