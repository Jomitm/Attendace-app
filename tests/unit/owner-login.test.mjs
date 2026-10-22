import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AppAuth } from '../../js/modules/auth.js';
import { AppDB } from '../../js/modules/db.js';
import { AppConfig } from '../../js/config.js';

const store = new Map();
const firestoreUsers = new Map();
const firestore = {
    collection: (collection) => ({
        doc: (id) => ({ collection, id: String(id), onSnapshot: () => () => {} })
    }),
    runTransaction: async (callback) => {
        const writes = [];
        const transaction = {
            get: async (ref) => {
                const data = firestoreUsers.get(`${ref.collection}/${ref.id}`);
                return { exists: !!data, data: () => data };
            },
            set: (ref, data) => writes.push({ ref, data })
        };
        const result = await callback(transaction);
        writes.forEach(({ ref, data }) => {
            const key = `${ref.collection}/${ref.id}`;
            firestoreUsers.set(key, { ...(firestoreUsers.get(key) || {}), ...data });
        });
        return result;
    }
};
globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
};
globalThis.window = { AppFirestore: firestore, location: { reload() {} }, dispatchEvent() {}, addEventListener() {} };
globalThis.document = { visibilityState: 'visible', addEventListener() {} };

let putCalls = [];
AppDB.put = async (coll, data) => { putCalls.push({ coll, data }); };
AppDB.getCached = async (key, ttl, loader) => (typeof loader === 'function' ? loader() : undefined);

AppConfig.OWNER_USERNAMES = ['jomit'];

// Mock Firebase Auth
globalThis.firebase = { auth: () => ({ signInWithCustomToken: async () => {}, signOut: async () => {}, currentUser: null }) };
AppAuth._getFirebaseAuth = () => globalThis.firebase.auth();

beforeEach(() => {
    store.clear();
    firestoreUsers.clear();
    putCalls = [];
    AppAuth.currentUser = null;
    AppAuth.localToken = null;
});

afterEach(() => AppAuth._clearSessionExpiry());

function mockFetch(user, options = {}) {
    const response = (body, status = 200) => ({
        ok: status >= 200 && status < 300,
        status,
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(body)
    });

    globalThis.fetch = async (url, _opts) => {
        if (url === '/api/auth-login') {
            if (options.fail) {
                const status = options.status || 401;
                return response({ error: options.error || 'Invalid credentials' }, status);
            }
            return response({ customToken: 'mock-custom-token', user });
        }
        return response({ error: 'Not found' }, 404);
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

    it('allows the owner to add a second device and schedules the older session for 10 PM', async () => {
        firestoreUsers.set('users/u_jomit', {
            activeSessionToken: 'tok_jomit',
            activeSessionStartedAt: Date.now() - 1000
        });
        mockFetch({
            id: 'u_jomit', username: 'jomit',
            activeSessionToken: 'tok_jomit', activeSessionStartedAt: Date.now()
        });

        const result = await AppAuth.loginOwner('jomit', 'pass');
        assert.equal(result, true);
        assert.notEqual(AppAuth.localToken, 'tok_jomit', 'the second device gets its own token');
        assert.equal(AppAuth.currentUser.id, 'u_jomit');
        const sessions = firestoreUsers.get('users/u_jomit').activeSessions;
        assert.equal(sessions.length, 2);
        assert.equal(sessions[0].token, 'tok_jomit');
        assert.ok(sessions[0].logoutAt > Date.now());
        assert.equal(sessions[1].token, AppAuth.localToken);
        assert.equal(sessions[1].logoutAt, null);
    });

    it('establishes a token for the owner on first login', async () => {
        firestoreUsers.set('users/u_jomit', { id: 'u_jomit', username: 'jomit' });
        mockFetch({ id: 'u_jomit', username: 'jomit' });
        const result = await AppAuth.loginOwner('jomit', 'pass');
        assert.equal(result, true);
        const savedUser = firestoreUsers.get('users/u_jomit');
        assert.ok(savedUser.activeSessionToken, 'first owner login should establish a token');
        assert.equal(savedUser.activeSessions.length, 1);
        assert.equal(savedUser.activeSessions[0].token, AppAuth.localToken);
    });
});
