import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppAuth } from '../../js/modules/auth.js';
import { AppDB } from '../../js/modules/db.js';

test('profile saves never restore credential fields or stale attendance from a loaded record', async () => {
    globalThis.window = {};
    const get = AppDB.get;
    const put = AppDB.put;
    const actor = AppAuth.currentUser;
    const writes = [];
    AppAuth.currentUser = { id: 'admin', permissions: { users: 'admin' } };
    AppDB.get = async () => ({ id: 'staff', name: 'Staff', role: 'Employee', isAdmin: false, password: 'old-secret', passwordSetupRequired: true, authMigrated: false, status: 'in' });
    AppDB.put = async (collection, data) => { writes.push({ collection, data }); };
    try {
        assert.equal(await AppAuth.updateUser({ id: 'staff', phone: '123', password: 'stale-secret', authMigrated: false }), true);
        const patch = writes.find((write) => write.collection === 'users').data;
        assert.equal(patch.phone, '123');
        for (const field of ['password', 'passwordSetupRequired', 'authMigrated', 'status']) {
            assert.equal(Object.hasOwn(patch, field), false, field + ' must not be rewritten');
        }
    } finally {
        AppDB.get = get; AppDB.put = put; AppAuth.currentUser = actor;
    }
});

test('local endpoint 404 is reported as a service error rather than a network error', async () => {
    const originalFetch = globalThis.fetch;
    const originalAuth = AppAuth._getFirebaseAuth;
    AppAuth._getFirebaseAuth = () => ({ currentUser: { getIdToken: async () => 'token' } });
    globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => { throw new SyntaxError('Empty response'); } });
    try {
        const result = await AppAuth.setPassword('staff', 'new-secret');
        assert.match(result.error, /Password service is unavailable/);
    } finally {
        globalThis.fetch = originalFetch;
        AppAuth._getFirebaseAuth = originalAuth;
    }
});
