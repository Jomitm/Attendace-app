import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { staffProfileSnapshot, saveStaffAccountChanges } from '../../js/utils/staff-account-edit.js';

const source = readFileSync(new URL('../../js/app.js', import.meta.url), 'utf8');
const start = source.indexOf('window.app_submitEditUser = async (e) => {');
const submitSource = source.slice(start, source.indexOf('// --- Helpers ---', start));

function harness(profileChanged) {
    const original = new Map([['id', 'staff'], ['name', 'Staff'], ['username', 'staff'], ['phone', '111'], ['password', '']]);
    const values = new Map(original);
    values.set('password', 'new-secret');
    if (profileChanged) values.set('phone', '222');
    const submit = { disabled: false };
    const form = {
        tagName: 'FORM', dataset: { profileSnapshot: staffProfileSnapshot(original.entries()) },
        querySelector: (selector) => selector === '[type="submit"]' ? submit : { checked: false }
    };
    const calls = [];
    const alerts = [];
    const modal = { style: { display: 'block' } };
    const auth = {
        updateUser: async () => { calls.push('profile'); throw new Error('Missing or insufficient permissions.'); },
        setPassword: async () => { calls.push('password'); return true; }
    };
    const context = {
        window: { AppAuth: auth, app_getPermissionsFromUI: () => ({}) },
        document: { getElementById: (id) => id === 'edit-user-modal' ? modal : null },
        FormData: class { get(name) { return values.get(name) ?? null; } entries() { return values.entries(); } },
        app_extractBirthdayFields: () => ({ birthDay: null, birthMonth: null, birthYear: null }),
        staffProfileSnapshot, saveStaffAccountChanges,
        alert: (message) => alerts.push(message),
        console: { log() {}, error() {} }
    };
    vm.runInNewContext(submitSource, context);
    return { run: () => context.window.app_submitEditUser({ target: form, preventDefault() {} }), calls, alerts, submit, modal };
}

test('actual admin Update handler saves a password without invoking the denied profile write', async () => {
    const fixture = harness(false);
    await fixture.run();
    assert.deepEqual(fixture.calls, ['password']);
    assert.match(fixture.alerts[0], /Password for 'Staff' has been changed/);
    assert.equal(fixture.modal.style.display, 'none');
    assert.equal(fixture.submit.disabled, false);
});

test('actual admin Update handler leaves the password unchanged when edited profile is denied', async () => {
    const fixture = harness(true);
    await fixture.run();
    assert.deepEqual(fixture.calls, ['profile']);
    assert.match(fixture.alerts[0], /Missing or insufficient permissions/);
    assert.equal(fixture.modal.style.display, 'block');
    assert.equal(fixture.submit.disabled, false);
});
