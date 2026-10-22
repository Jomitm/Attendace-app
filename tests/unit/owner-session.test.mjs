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
globalThis.window = { AppFirestore: firestore, location: { hostname: 'app.example.com', reload() {} }, dispatchEvent() {}, addEventListener() {} };
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
    window.location.hostname = 'app.example.com';
    putCalls = [];
    AppAuth.currentUser = null;
    AppAuth.localToken = null;
});

afterEach(() => AppAuth._clearSessionExpiry());

function mockFetch(user) {
    const response = (body, status = 200) => ({
        ok: status >= 200 && status < 300,
        status,
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(body)
    });

    globalThis.fetch = async (url, _opts) => {
        if (url === '/api/auth-login') {
            return response({ customToken: 'mock-custom-token', user });
        }
        return response({ error: 'Not found' }, 404);
    };
}

describe('two-device session registration', () => {
    it('does not register or release a device session on localhost', async () => {
        window.location.hostname = 'localhost';
        firestoreUsers.set('users/u_alice', {
            activeSessionToken: 'tok_alice',
            activeSessionStartedAt: Date.now() - 1000
        });
        mockFetch({ id: 'u_alice', username: 'alice' });

        const result = await AppAuth.login('alice', 'pass');
        assert.equal(result, true);
        assert.notEqual(AppAuth.localToken, 'tok_alice');
        assert.equal(firestoreUsers.get('users/u_alice').activeSessionToken, 'tok_alice');
        assert.equal(firestoreUsers.get('users/u_alice').activeSessions, undefined);

        await AppAuth.logout();
        assert.equal(firestoreUsers.get('users/u_alice').activeSessionToken, 'tok_alice');
        assert.equal(firestoreUsers.get('users/u_alice').activeSessions, undefined);
    });

    it('allows a normal user to keep the old session until the 10 PM cutoff', async () => {
        firestoreUsers.set('users/u_alice', {
            activeSessionToken: 'tok_alice',
            activeSessionStartedAt: Date.now() - 1000
        });
        mockFetch({
            id: 'u_alice', username: 'alice',
            activeSessionToken: 'tok_alice', activeSessionStartedAt: Date.now()
        });
        store.set('crwi_session_token', 'some-other-device-token');

        const result = await AppAuth.login('alice', 'pass');
        assert.equal(result, true);
        const sessions = firestoreUsers.get('users/u_alice').activeSessions;
        assert.equal(sessions.length, 2);
        assert.equal(sessions[0].token, 'tok_alice');
        assert.ok(sessions[0].logoutAt > Date.now());
        assert.equal(sessions[1].token, AppAuth.localToken);
        assert.equal(sessions[1].logoutAt, null);
    });

    it('applies the same independent-device behavior to the owner account', async () => {
        firestoreUsers.set('users/u_jomit', {
            activeSessionToken: 'tok_jomit',
            activeSessionStartedAt: Date.now() - 1000
        });
        mockFetch({
            id: 'u_jomit', username: 'jomit',
            activeSessionToken: 'tok_jomit', activeSessionStartedAt: Date.now()
        });
        store.set('crwi_session_token', 'some-other-device-token');

        const result = await AppAuth.login('jomit', 'pass');
        assert.equal(result, true, 'owner should log in without a takeover prompt');
        assert.notEqual(AppAuth.localToken, 'tok_jomit', 'the owner device receives its own token');
        assert.equal(AppAuth.currentUser.id, 'u_jomit');
        assert.equal(firestoreUsers.get('users/u_jomit').activeSessions.length, 2);
    });

    it('the owner logging in for the first time still creates a token', async () => {
        firestoreUsers.set('users/u_jomit', { id: 'u_jomit', username: 'jomit' });
        mockFetch({ id: 'u_jomit', username: 'jomit' });

        const result = await AppAuth.login('jomit', 'pass');
        assert.equal(result, true);
        const savedUser = firestoreUsers.get('users/u_jomit');
        assert.ok(savedUser.activeSessionToken, 'first owner login should establish a token');
        assert.equal(savedUser.activeSessions.length, 1);
        assert.equal(savedUser.activeSessions[0].token, AppAuth.localToken);
    });

    it('signs out the oldest device when a third device logs in', async () => {
        firestoreUsers.set('users/u_alice', {
            activeSessions: [
                { token: 'older-device', signedInAt: Date.now() - 2000, logoutAt: Date.now() + 100000 },
                { token: 'newer-device', signedInAt: Date.now() - 1000, logoutAt: null }
            ]
        });
        mockFetch({ id: 'u_alice', username: 'alice' });

        const result = await AppAuth.login('alice', 'pass');
        assert.equal(result, true);
        const sessions = firestoreUsers.get('users/u_alice').activeSessions;
        assert.equal(sessions.length, 2);
        assert.deepEqual(sessions.map((session) => session.token), ['newer-device', AppAuth.localToken]);
        assert.equal(sessions[0].logoutAt > Date.now(), true);
        assert.equal(sessions[1].logoutAt, null);
        assert.equal(AppAuth.currentUser.id, 'u_alice');
    });
});
