import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = {};
globalThis.document = {
    addEventListener() {},
    getElementById() { return null; },
    querySelectorAll() { return []; }
};
globalThis.MutationObserver = class {
    observe() {}
};
globalThis.FormData = class {
    constructor(source = {}) { this.values = source.values || {}; }
    get(name) { return this.values[name] ?? null; }
    set(name, value) { this.values[name] = value; }
};

const birthdayFeature = await import('../../js/features/birthdays.js');

test('date-of-birth input validates real dates and rejects future birthdays', () => {
    assert.deepEqual(birthdayFeature.app_extractBirthdayDate('1988-02-29', new Date(2026, 9, 22)), {
        birthDay: 29,
        birthMonth: 2,
        birthYear: 1988
    });
    assert.throws(() => birthdayFeature.app_extractBirthdayDate('2025-02-29', new Date(2026, 9, 22)), /valid date of birth/);
    assert.throws(() => birthdayFeature.app_extractBirthdayDate('2026-10-23', new Date(2026, 9, 22)), /cannot be in the future/);
});

test('external birthday form asks only for name and date of birth', async () => {
    const currentUser = { id: 'manager-2' };
    let modalHtml = '';
    let savedPerson = null;
    Object.assign(window, {
        AppAuth: { getUser: () => currentUser },
        app_canAdminBirthdays: () => true,
        AppDB: {
            getIstNow: () => new Date(2026, 9, 22),
            put: async (collection, person) => {
                assert.equal(collection, 'birthday_people');
                savedPerson = person;
            }
        },
        app_showModal: (html) => { modalHtml = html; },
        app_showSyncToast() {}
    });

    await window.app_openExternalBirthdayPersonModal();
    assert.match(modalHtml, /name="name" required/);
    assert.match(modalHtml, /name="dateOfBirth" required/);
    assert.doesNotMatch(modalHtml, /name="position"|name="location"|name="birthDay"/);

    const formData = new FormData();
    formData.set('name', 'External Collaborator');
    formData.set('dateOfBirth', '1988-02-29');
    await window.app_submitExternalBirthdayPerson({ preventDefault() {}, target: formData });
    assert.equal(savedPerson.name, 'External Collaborator');
    assert.deepEqual(
        { birthDay: savedPerson.birthDay, birthMonth: savedPerson.birthMonth, birthYear: savedPerson.birthYear },
        { birthDay: 29, birthMonth: 2, birthYear: 1988 }
    );
    assert.equal(Object.hasOwn(savedPerson, 'position'), false);
    assert.equal(Object.hasOwn(savedPerson, 'location'), false);
});

test('external birthday reminders are saved to the signed-in manager and open in the popup once', async () => {
    const now = new Date(2026, 9, 22, 12);
    const manager = {
        id: 'manager-1',
        name: 'Birthday Manager',
        notifications: [{ id: 'existing', type: 'reminder', read: false }]
    };
    const staff = {
        id: 'staff-1',
        name: 'Staff Member',
        birthDay: 5,
        birthMonth: 3
    };
    const externalPerson = {
        id: 'person-1',
        name: 'External Collaborator',
        position: 'Trustee',
        location: 'Bengaluru',
        birthDay: 23,
        birthMonth: 10,
        birthdaySource: 'external'
    };
    const users = [manager, staff];
    const savedWrites = [];
    let popupHtml = '';

    Object.assign(window, {
        AppAuth: { getUser: () => manager },
        app_canManageBirthdays: () => true,
        app_canAdminBirthdays: () => false,
        AppAnalytics: { getDayType: () => 'Work Day' },
        AppDB: {
            getIstNow: () => new Date(now),
            getAll: async (collection) => collection === 'users' ? users : [externalPerson],
            get: async (collection, id) => collection === 'users' && id === manager.id ? manager : null,
            put: async (collection, value) => {
                savedWrites.push({ collection, value });
                if (collection === 'users' && value.id === manager.id) {
                    Object.assign(manager, value);
                    users[0] = manager;
                }
            }
        },
        app_showModal: (html) => { popupHtml = html; }
    });

    await window.app_syncBirthdayReminders();
    await window.app_syncBirthdayReminders();

    assert.equal(savedWrites.length, 1, 'only the current manager record is written, once');
    assert.equal(savedWrites[0].collection, 'users');
    assert.equal(savedWrites[0].value.id, manager.id);
    assert.equal(manager.notifications.filter((item) => item.type === 'birthday-reminder').length, 1);
    assert.equal(manager.notifications.find((item) => item.type === 'birthday-reminder').birthdaySource, 'external');

    await window.app_maybeOpenBirthdayPopup();
    assert.match(popupHtml, /Upcoming Collaborator Birthday/);
    assert.match(popupHtml, /External Collaborator/);
    assert.doesNotMatch(popupHtml, /Edit Details/);
    assert.match(popupHtml, /View Birthday Calendar/);
});
