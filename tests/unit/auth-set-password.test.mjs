import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let profiles;
let claims;
let authMissing;
let changes;
let created;
let firestoreWrites;
const deleted = Symbol('delete');
const admin = {
    auth: () => ({
        verifyIdToken: async () => claims,
        updateUser: async (id, data) => {
            if (authMissing) throw Object.assign(new Error('not found'), { code: 'auth/user-not-found' });
            changes.push({ id, data });
        },
        createUser: async (data) => { created.push(data); }
    }),
    firestore: { FieldValue: { delete: () => deleted } }
};
const db = { collection: () => ({ doc: (id) => ({
    get: async () => ({ exists: profiles.has(id), data: () => profiles.get(id) }),
    update: async (data) => { firestoreWrites.push({ id, data }); }
}) }) };
const helperPath = require.resolve('../../api/_firebase-admin.js');
require.cache[helperPath] = { id: helperPath, filename: helperPath, loaded: true, exports: { getAdmin: () => admin, getDb: () => db } };
const handler = require('../../api/_auth-set-password.js');
async function post(body, headers = { authorization: 'Bearer token' }) {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(payload) { this.body = payload; return this; } };
    await handler({ method: 'POST', body, headers }, res);
    return res;
}
beforeEach(() => {
    profiles = new Map([['admin', { isAdmin: true }], ['staff', { name: 'Staff', password: 'old-password' }]]);
    claims = { uid: 'admin', isAdmin: false };
    authMissing = false;
    changes = []; created = []; firestoreWrites = [];
});
test('current admin profile authorizes a reset despite an old token claim', async () => {
    const res = await post({ userId: 'staff', newPassword: 'new-password' });
    assert.equal(res.statusCode, 200);
    assert.equal(changes.length, 1);
    assert.deepEqual(firestoreWrites, [{ id: 'staff', data: { password: deleted, passwordSetupRequired: false, authMigrated: true } }]);
});
test('users manager can reset staff passwords without global admin', async () => {
    profiles.set('admin', { permissions: { users: 'admin' } });
    assert.equal((await post({ userId: 'staff', newPassword: 'new-password' })).statusCode, 200);
});

test('scoped users managers cannot reset global administrators, including migration fallback', async () => {
    profiles.set('manager', { permissions: { users: 'admin' }, isAdmin: false });
    claims = { uid: 'manager' };
    for (const missing of [false, true]) {
        authMissing = missing;
        assert.equal((await post({ userId: 'admin', newPassword: 'chosen-password' })).statusCode, 403);
        assert.equal(changes.length, 0);
        assert.equal(created.length, 0);
        assert.equal(firestoreWrites.length, 0);
    }
});
test('revoked admin privileges cannot be recovered using a stale token claim', async () => {
    profiles.set('admin', { isAdmin: false });
    claims.isAdmin = true;
    assert.equal((await post({ userId: 'staff', newPassword: 'new-password' })).statusCode, 403);
    assert.equal(changes.length, 0);
});
test('staff can change their own password, but not another staff password', async () => {
    claims = { uid: 'staff' };
    assert.equal((await post({ userId: 'admin', newPassword: 'new-password' })).statusCode, 403);
    assert.equal((await post({ userId: 'staff', newPassword: 'new-password' })).statusCode, 200);
});
test('missing staff profile is rejected before Auth is changed', async () => {
    assert.equal((await post({ userId: 'missing', newPassword: 'new-password' })).statusCode, 404);
    assert.equal(changes.length, 0);
});
test('legacy staff without an Auth account is migrated', async () => {
    authMissing = true;
    assert.equal((await post({ userId: 'staff', newPassword: 'new-password' })).statusCode, 200);
    assert.equal(created[0].uid, 'staff');
    assert.equal(created[0].email, 'staff@crwi.placeholder');
});
test('short passwords and unauthenticated requests do not write credentials', async () => {
    assert.equal((await post({ userId: 'staff', newPassword: '12345' })).statusCode, 400);
    assert.equal((await post({ userId: 'staff', newPassword: 'new-password' }, {})).statusCode, 401);
    assert.equal(changes.length, 0);
});
