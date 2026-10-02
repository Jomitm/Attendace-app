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
AppDB.getCached = async (key, ttl, loader) => (typeof loader === 'function' ? loader() : undefined);

AppConfig.OWNER_USERNAMES = ['jomit'];

// Mock Firebase Auth
globalThis.firebase = { auth: () => ({ signInWithCustomToken: async () => {}, signOut: async () => {}, currentUser: null }) };
AppAuth._getFirebaseAuth = () => globalThis.firebase.auth();

beforeEach(() => {
    store.clear();
    putCalls = [];
    AppAuth.currentUser = null;
    AppAuth.localToken = null;
});

function mockFetch(user, options = {}) {
    globalThis.fetch = async (url, _opts) => {
        if (url === '/api/auth-login') {
            if (options.fail) {
                return {
                    ok: false,
                    status: options.status || 401,
                    json: async () => ({ error: options.error || 'Invalid credentials' })
                };
            }
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    customToken: 'mock-custom-token',
                    user
                })
            };
        }
        return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) };
    };
}

describe('owner-only login', () => {
    it('rejects a valid non-owner credential without writing a session token', async () => {
        mockFetch({
            id: 'u_alice', username: 'alice',
            activeSessionToken: 'tok_alice', activeSessionStartedAt: Date.now()
        });

        const result = await AppAuth.loginOwner('alice', 'pass');
        assert.deepEqual(result, { denied: 'not-owner' });
        assert.equal(AppAuth.currentUser, null, 'no session should be established');
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.equal(wroteToken, undefined, 'non-owner login must not write a token');
    });

    it('returns false for invalid credentials', async () => {
        mockFetch(null, { fail: true });
        const result = await AppAuth.loginOwner('alice', 'wrong');
        assert.equal(result, false);
    });

    it('login() maps a 401 to false but a 5xx to serverError', async () => {
        mockFetch(null, { fail: true, status: 401 });
        assert.equal(await AppAuth.login('alice', 'wrong'), false);

        mockFetch(null, { fail: true, status: 503, error: 'Internal server error' });
        const result = await AppAuth.login('alice', 'pass');
        assert.ok(result && result.serverError, 'server failure must not look like bad credentials');
    });

    it('loginOwner() maps a 5xx to serverError', async () => {
        mockFetch(null, { fail: true, status: 500, error: 'Internal server error' });
        const result = await AppAuth.loginOwner('alice', 'pass');
        assert.ok(result && result.serverError);
    });

    it('logs the owner in and reuses the shared token', async () => {
        mockFetch({
            id: 'u_jomit', username: 'jomit',
            activeSessionToken: 'tok_jomit', activeSessionStartedAt: Date.now()
        });

        const result = await AppAuth.loginOwner('jomit', 'pass');
        assert.equal(result, true);
        assert.equal(AppAuth.localToken, 'tok_jomit', 'owner should reuse the existing token');
        assert.equal(AppAuth.currentUser.id, 'u_jomit');
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.equal(wroteToken, undefined, 'owner login must not overwrite the shared token');
    });

    it('establishes a token for the owner on first login', async () => {
        mockFetch({ id: 'u_jomit', username: 'jomit' });
        const result = await AppAuth.loginOwner('jomit', 'pass');
        assert.equal(result, true);
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.ok(wroteToken, 'first owner login should establish a token');
    });
});
