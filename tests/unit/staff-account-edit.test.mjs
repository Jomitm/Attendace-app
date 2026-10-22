import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staffProfileSnapshot, saveStaffAccountChanges } from '../../js/utils/staff-account-edit.js';

const userData = { id: 'staff-1', name: 'Staff' };

test('editing only the password preserves the original profile snapshot', () => {
    assert.equal(staffProfileSnapshot([['name', 'Staff'], ['password', '']]),
        staffProfileSnapshot([['name', 'Staff'], ['password', 'new-secret']]));
    assert.notEqual(staffProfileSnapshot([['name', 'Staff']]), staffProfileSnapshot([['name', 'Changed']]));
});

test('password-only save performs no browser Firestore profile write', async () => {
    const calls = [];
    const auth = {
        updateUser: async () => { throw new Error('Missing or insufficient permissions.'); },
        setPassword: async (...args) => { calls.push(args); return true; }
    };
    const result = await saveStaffAccountChanges({ auth, userData, newPassword: 'new-secret', profileChanged: false });
    assert.deepEqual(calls, [['staff-1', 'new-secret']]);
    assert.equal(result.passwordSaved, true);
    assert.equal(result.profileSaved, false);
    assert.equal(result.error, '');
});

test('rejected profile changes never change the password', async () => {
    let passwordCalled = false;
    const auth = {
        updateUser: async () => { throw new Error('Missing or insufficient permissions.'); },
        setPassword: async () => { passwordCalled = true; return true; }
    };
    const result = await saveStaffAccountChanges({ auth, userData, newPassword: 'new-secret', profileChanged: true });
    assert.equal(passwordCalled, false);
    assert.match(result.error, /insufficient permissions/);
});

test('profile saved but password rejected is reported explicitly', async () => {
    const auth = { updateUser: async () => true, setPassword: async () => ({ error: 'Account policy rejected password.' }) };
    const result = await saveStaffAccountChanges({ auth, userData, newPassword: 'new-secret', profileChanged: true });
    assert.equal(result.profileSaved, true);
    assert.equal(result.passwordSaved, false);
    assert.match(result.error, /Staff details were saved. Password change failed/);
});

test('invalid passwords are rejected before either save', async () => {
    const auth = { updateUser: async () => assert.fail('must not save profile'), setPassword: async () => assert.fail('must not save password') };
    const result = await saveStaffAccountChanges({ auth, userData, newPassword: '12345', profileChanged: true });
    assert.match(result.error, /6 and 4096/);
});
