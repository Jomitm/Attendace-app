import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AppAuth } from '../../js/modules/auth.js';
import { AppDB } from '../../js/modules/db.js';
import { AppConfig } from '../../js/config.js';

const store = new Map();
globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
};
globalThis.window = { location: { reload() {} }, dispatchEvent() {}, addEventListener() {} };

let putCalls = [];
AppDB.put = async (coll, data) => { putCalls.push({ coll, data }); };
// Force a fresh getAll on every call (avoid the in-memory read cache under Node,
// which would otherwise serve the first test's users to later tests).
AppDB.getCached = async (key, ttl, loader) => (typeof loader === 'function' ? loader() : undefined);

AppConfig.OWNER_USERNAMES = ['jomit'];

beforeEach(() => {
    store.clear();
    putCalls = [];
    AppAuth.currentUser = null;
    AppAuth.localToken = null;
});

describe('owner-only login', () => {
    it('rejects a valid non-owner credential without writing a session token', async () => {
        AppDB.getAll = async () => ([{
            id: 'u_alice', username: 'alice', password: 'pass',
            activeSessionToken: 'tok_alice', activeSessionStartedAt: Date.now()
        }]);

        const result = await AppAuth.loginOwner('alice', 'pass');
        assert.deepEqual(result, { denied: 'not-owner' });
        assert.equal(AppAuth.currentUser, null, 'no session should be established');
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.equal(wroteToken, undefined, 'non-owner login must not write a token');
    });

    it('returns false for invalid credentials', async () => {
        AppDB.getAll = async () => ([{ id: 'u_alice', username: 'alice', password: 'pass' }]);
        const result = await AppAuth.loginOwner('alice', 'wrong');
        assert.equal(result, false);
    });

    it('logs the owner in and reuses the shared token', async () => {
        AppDB.getAll = async () => ([{
            id: 'u_jomit', username: 'jomit', password: 'pass',
            activeSessionToken: 'tok_jomit', activeSessionStartedAt: Date.now()
        }]);

        const result = await AppAuth.loginOwner('jomit', 'pass');
        assert.equal(result, true);
        assert.equal(AppAuth.localToken, 'tok_jomit', 'owner should reuse the existing token');
        assert.equal(AppAuth.currentUser.id, 'u_jomit');
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.equal(wroteToken, undefined, 'owner login must not overwrite the shared token');
    });

    it('establishes a token for the owner on first login', async () => {
        AppDB.getAll = async () => ([{ id: 'u_jomit', username: 'jomit', password: 'pass' }]);
        const result = await AppAuth.loginOwner('jomit', 'pass');
        assert.equal(result, true);
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.ok(wroteToken, 'first owner login should establish a token');
    });
});
