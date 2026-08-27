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
globalThis.window = {
    location: { reload() {} },
    dispatchEvent() {},
    addEventListener() {},
    AppFirestore: undefined
};

let putCalls = [];
AppDB.put = async (coll, data) => { putCalls.push({ coll, data }); };
AppDB.getCached = async (key, ttl, loader) => (typeof loader === 'function' ? loader() : undefined);

AppConfig.OWNER_USERNAMES = ['jomit'];

const owner = { id: 'u_jomit', username: 'jomit', password: 'pass', activeSessionToken: 'tok_jomit' };
const alice = { id: 'u_alice', username: 'alice', password: 'pass', activeSessionToken: 'tok_alice' };

beforeEach(() => {
    store.clear();
    putCalls = [];
    AppAuth.currentUser = null;
    AppAuth.localToken = null;
    AppAuth.isImpersonating = false;
    AppAuth._realUser = null;
    AppAuth._realToken = null;
    AppDB.get = async (coll, id) => (id === 'u_alice' ? alice : (id === 'u_jomit' ? owner : null));
});

describe('owner impersonation (Login as user)', () => {
    it('lets the owner switch to a staff account without writing their token', async () => {
        AppAuth.currentUser = owner;
        AppAuth.localToken = 'tok_jomit';

        const ok = await AppAuth.impersonate('u_alice');
        assert.equal(ok, true);
        assert.equal(AppAuth.isImpersonating, true);
        assert.equal(AppAuth.currentUser.id, 'u_alice', 'view should switch to the target');
        const wroteToken = putCalls.find((c) => c.data && c.data.activeSessionToken);
        assert.equal(wroteToken, undefined, 'impersonation must not overwrite the target token');
    });

    it('restores the owner session on stopImpersonating', async () => {
        AppAuth.currentUser = owner;
        AppAuth.localToken = 'tok_jomit';
        await AppAuth.impersonate('u_alice');

        const ok = await AppAuth.stopImpersonating();
        assert.equal(ok, true);
        assert.equal(AppAuth.isImpersonating, false);
        assert.equal(AppAuth.currentUser.id, 'u_jomit', 'owner session restored');
        assert.equal(AppAuth.localToken, 'tok_jomit');
    });

    it('refuses to impersonate self', async () => {
        AppAuth.currentUser = owner;
        const ok = await AppAuth.impersonate('u_jomit');
        assert.equal(ok, false);
        assert.equal(AppAuth.isImpersonating, false);
    });

    it('refuses impersonation for a non-owner', async () => {
        AppAuth.currentUser = alice; // not in OWNER_USERNAMES
        const ok = await AppAuth.impersonate('u_jomit');
        assert.equal(ok, false);
        assert.equal(AppAuth.isImpersonating, false);
    });
});
