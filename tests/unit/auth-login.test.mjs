// tests/unit/auth-login.test.mjs
// Covers the server login handler: method/body guards, the case-insensitive
// identifier match (Firestore `==` is case-sensitive, identifiers arrive
// lowercased), the Firebase Auth fallback for passwords migrated by
// auth-set-password, and the 401/200 outcomes.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Stub firebase-admin before the handler module is loaded so its internal
// require() resolves to our mock instead of reading env config.
let userDocs = [];
let createdUsers = [];
const claimsCalls = [];

const dbMock = {
    collection: (_name) => ({
        select: () => ({
            limit: () => ({
                get: async () => ({
                    docs: userDocs.map((d) => ({ id: d.id, data: () => ({ ...d }) }))
                })
            })
        }),
        doc: (_id) => ({
            get: async () => ({ exists: false, data: () => null }),
            update: async () => {}
        })
    })
};

const adminMock = {
    auth: () => ({
        getUser: async (uid) => ({ uid }),
        createUser: async (user) => { createdUsers.push(user); return user; },
        setCustomUserClaims: async (uid, claims) => { claimsCalls.push({ uid, claims }); },
        createCustomToken: async (uid) => `tok_${uid}`
    }),
    firestore: { FieldValue: { delete: () => '__delete__' } }
};

const faPath = require.resolve('../../api/_firebase-admin.js');
require.cache[faPath] = {
    id: faPath,
    filename: faPath,
    loaded: true,
    exports: { getAdmin: () => adminMock, getDb: () => dbMock }
};

const handlerModule = await import('../../api/_auth-login.js');
const handler = handlerModule.default;
const { matchUserByIdentifier } = handlerModule;

function mockRes() {
    const res = { statusCode: null, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (payload) => { res.body = payload; return res; };
    return res;
}

async function post(body) {
    const res = mockRes();
    await handler({ method: 'POST', body }, res);
    return res;
}

beforeEach(() => {
    userDocs = [];
    createdUsers = [];
    claimsCalls.length = 0;
});

describe('auth-login handler guards', () => {
    test('rejects non-POST with 405', async () => {
        const res = mockRes();
        await handler({ method: 'GET' }, res);
        assert.equal(res.statusCode, 405);
    });

    test('returns 400 when identifier or password is missing', async () => {
        const res = await post({});
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, 'Missing identifier or password');
    });

    test('returns 400 (not 500) when the runtime body getter throws', async () => {
        const res = mockRes();
        const req = { method: 'POST' };
        Object.defineProperty(req, 'body', { get() { throw new Error('Invalid JSON'); } });
        await handler(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, 'Invalid JSON body');
    });
});

describe('matchUserByIdentifier', () => {
    const entries = [
        { id: 'u1', data: { username: 'JomitM', email: 'Jomit@CRWI.org' } },
        { id: 'u2', data: { username: 'alice', email: 'alice@example.com' } }
    ];

    test('matches mixed-case stored username against lowercased identifier', () => {
        const hit = matchUserByIdentifier(entries, 'jomitm');
        assert.equal(hit && hit.id, 'u1');
    });

    test('matches stored email regardless of case', () => {
        assert.equal(matchUserByIdentifier(entries, 'jomit@crwi.org').id, 'u1');
        assert.equal(matchUserByIdentifier(entries, 'ALICE@EXAMPLE.COM').id, 'u2');
    });

    test('trims whitespace around the identifier', () => {
        assert.equal(matchUserByIdentifier(entries, '  Alice  ').id, 'u2');
    });

    test('returns null for unknown or empty identifiers', () => {
        assert.equal(matchUserByIdentifier(entries, 'nobody'), null);
        assert.equal(matchUserByIdentifier(entries, ''), null);
        assert.equal(matchUserByIdentifier(entries, undefined), null);
    });
});

describe('auth-login credential outcomes', () => {
    const jamie = {
        id: 'u1',
        username: 'JomitM',
        email: 'jomit@crwi.org',
        password: 'pw123',
        name: 'Jomit',
        role: 'Staff',
        isAdmin: false,
        avatar: '',
        permissions: {}
    };

    test('401 for an unknown user', async () => {
        userDocs = [jamie];
        const res = await post({ identifier: 'nobody', password: 'pw123' });
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.error, 'Invalid credentials');
    });

    test('401 for a wrong password', async () => {
        userDocs = [jamie];
        const res = await post({ identifier: 'jomitm', password: 'wrong' });
        assert.equal(res.statusCode, 401);
    });

    test('200 with a custom token for case-insensitive identifier + right password', async () => {
        userDocs = [jamie];
        const res = await post({ identifier: 'JOMITM', password: 'pw123' });
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.customToken, 'tok_u1');
        assert.equal(res.body.user.username, 'JomitM');
        assert.deepEqual(claimsCalls[0], { uid: 'u1', claims: { role: 'Staff', isAdmin: false } });
    });

    test('falls back to Firebase Auth when the Firestore password was migrated away', async () => {
        const migrated = { ...jamie, id: 'u2' };
        delete migrated.password;
        userDocs = [migrated];

        const originalFetch = globalThis.fetch;
        const calls = [];
        globalThis.fetch = async (url, opts) => {
            calls.push({ url: String(url), body: JSON.parse(opts.body) });
            return { ok: true, json: async () => ({ localId: 'u2' }) };
        };
        try {
            const res = await post({ identifier: 'jomitm', password: 'newpass' });
            assert.equal(res.statusCode, 200);
            assert.equal(res.body.customToken, 'tok_u2');
            assert.equal(calls.length, 1);
            assert.match(calls[0].url, /accounts:signInWithPassword/);
            assert.equal(calls[0].body.email, 'jomit@crwi.org');
            assert.equal(calls[0].body.password, 'newpass');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('401 when Firebase Auth rejects the migrated password', async () => {
        const migrated = { ...jamie, id: 'u3' };
        delete migrated.password;
        userDocs = [migrated];

        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { code: 'INVALID_PASSWORD' } }) });
        try {
            const res = await post({ identifier: 'jomitm', password: 'nope' });
            assert.equal(res.statusCode, 401);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('401 when Firebase Auth returns a different account', async () => {
        const migrated = { ...jamie, id: 'u4' };
        delete migrated.password;
        userDocs = [migrated];

        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => ({ ok: true, json: async () => ({ localId: 'someone-else' }) });
        try {
            const res = await post({ identifier: 'jomitm', password: 'pw' });
            assert.equal(res.statusCode, 401);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
