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

describe('owner account session exemption', () => {
    it('a normal user with a recent foreign session is asked to confirm takeover', async () => {
        AppDB.getAll = async () => ([{
            id: 'u_alice', username: 'alice', password: 'pass',
            activeSessionToken: 'tok_alice', activeSessionStartedAt: Date.now()
        }]);
        store.set('crwi_session_token', 'some-other-device-token');

        const result = await AppAuth.login('alice', 'pass');
        assert.equal(result && result.needsConflictConfirmation, true);
    });

    it('the owner with a recent foreign session is NOT prompted and reuses the token', async () => {
        AppDB.getAll = async () => ([{
            id: 'u_jomit', username: 'jomit', password: 'pass',
            activeSessionToken: 'tok_jomit', activeSessionStartedAt: Date.now()
        }]);
        store.set('crwi_session_token', 'some-other-device-token');

        const result = await AppAuth.login('jomit', 'pass');
        assert.equal(result, true, 'owner should log in without a prompt');
        assert.equal(AppAuth.localToken, 'tok_jomit', 'owner should reuse the existing shared token');
        assert.equal(AppAuth.currentUser.id, 'u_jomit');
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.equal(wroteToken, undefined, 'owner login must not overwrite the shared token');
    });

    it('the owner logging in for the first time still creates a token', async () => {
        AppDB.getAll = async () => ([{
            id: 'u_jomit', username: 'jomit', password: 'pass'
            // no activeSessionToken yet
        }]);

        const result = await AppAuth.login('jomit', 'pass');
        assert.equal(result, true);
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.ok(wroteToken, 'first owner login should establish a token');
    });
});
