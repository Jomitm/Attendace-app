// Birthday feature: editors, calendar, reminders, sync.
// Extracted verbatim from js/app.js during the decomposition refactor.
// Helpers are exported because the work-plan code in app.js also calls them.

import { escapeDialogHtml } from '../utils/html-escape.js';
import AppUI from '../ui.js';

export const app_daysInMonth = (year, month) => new Date(year, month, 0).getDate();

export const app_getBirthdayFieldValue = (raw, min, max) => {
    const value = String(raw ?? '').trim();
    if (!value) return null;
    if (!/^\d+$/.test(value)) throw new Error('Birthday fields must be numeric.');
    const num = Number(value);
    if (!Number.isInteger(num) || num < min || num > max) {
        throw new Error(`Birthday value must be between ${min} and ${max}.`);
    }
    return num;
};

export const app_extractBirthdayFields = (formData) => {
    const currentYear = new Date().getFullYear() + 1;
    const birthDay = app_getBirthdayFieldValue(formData.get('birthDay'), 1, 31);
    const birthMonth = app_getBirthdayFieldValue(formData.get('birthMonth'), 1, 12);
    const birthYear = app_getBirthdayFieldValue(formData.get('birthYear'), 1900, currentYear);

    if (birthDay && birthMonth) {
        const validationYear = birthYear || 2024;
        const maxDay = app_daysInMonth(validationYear, birthMonth);
        if (birthDay > maxDay) {
            throw new Error(`Birthday day is not valid for month ${birthMonth}.`);
        }
    }

    return { birthDay, birthMonth, birthYear };
};

export const app_extractBirthdayDate = (rawValue, today = app_getISTNowDate()) => {
    const value = String(rawValue ?? '').trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new Error('Please enter a valid date of birth.');

    const birthYear = Number(match[1]);
    const birthMonth = Number(match[2]);
    const birthDay = Number(match[3]);
    if (birthYear < 1900 || birthMonth < 1 || birthMonth > 12
        || birthDay < 1 || birthDay > app_daysInMonth(birthYear, birthMonth)) {
        throw new Error('Please enter a valid date of birth.');
    }
    if (value > app_toDateKey(today)) {
        throw new Error('Date of birth cannot be in the future.');
    }

    return { birthDay, birthMonth, birthYear };
};

export const app_formatBirthdayDate = (birthDay, birthMonth, birthYear = null) => {
    const day = Number(birthDay || 0);
    const month = Number(birthMonth || 0);
    const year = Number(birthYear || 0);
    const monthLabel = month >= 1 && month <= 12
        ? new Date(2026, month - 1, 1).toLocaleString('en-US', { month: 'long' })
        : '--';
    const dayLabel = day ? String(day).padStart(2, '0') : '--';
    const yearLabel = year ? ` ${year}` : '';
    return `${dayLabel} ${monthLabel}${yearLabel}`.trim();
};

export const app_getBirthdaySourceConfig = (source = 'user') => {
    const normalizedSource = String(source || 'user').trim().toLowerCase() === 'external' ? 'external' : 'user';
    return normalizedSource === 'external'
        ? {
            source: 'external',
            collection: 'birthday_people',
            label: 'Birthday Person',
            emptyMessage: 'Birthday person not found.',
            roleLabel: 'Position',
            deptLabel: 'Location'
        }
        : {
            source: 'user',
            collection: 'users',
            label: 'Staff',
            emptyMessage: 'Staff member not found.',
            roleLabel: 'Role',
            deptLabel: 'Department'
        };
};

export const app_getBirthdayEditorMeta = (record, source = 'user') => {
    const config = app_getBirthdaySourceConfig(source);
    if (config.source === 'external') {
        return {
            title: record?.name || 'Birthday Person',
            subtitle: record?.relationshipToCrwi || record?.position || 'External collaborator'
        };
    }
    return {
        title: record?.name || 'Staff',
        subtitle: `${record?.role || 'Employee'} • ${record?.dept || 'General'}`
    };
};

export const app_buildBirthdayReminderPayload = (record, source, birthdayDate, reminderDate) => {
    const config = app_getBirthdaySourceConfig(source);
    const birthdayKey = app_toDateKey(birthdayDate);
    const reminderKey = app_toDateKey(reminderDate);
    const reminderReason = app_getBirthdayReminderReason(birthdayDate, reminderDate);
    const isExternal = config.source === 'external';
    const role = isExternal ? (record?.relationshipToCrwi || record?.position || '') : (record?.role || '');
    const dept = isExternal ? (record?.location || '') : (record?.dept || '');
    const label = isExternal ? 'Birthday Person' : 'Staff';
    const metadata = isExternal
        ? [role, dept].filter(Boolean).join(' • ') || 'External collaborator'
        : `${role || 'Employee'} • ${dept || 'General'}`;
    return {
        id: `birthday_${config.source}_${birthdayKey}_${record.id}_${reminderKey}`,
        type: 'birthday-reminder',
        title: `Upcoming Birthday: ${record.name || label}`,
        message: `${record.name || label} has a birthday on ${app_formatBirthdayDate(record.birthDay, record.birthMonth)}.`,
        description: `${reminderReason}. ${metadata}`,
        status: 'pending',
        date: new Date().toISOString(),
        read: false,
        taggedByName: 'Birthday Calendar',
        birthdayStaffId: record.id,
        birthdayStaffName: record.name || label,
        birthdaySource: config.source,
        birthdayDate: birthdayKey,
        reminderDate: reminderKey,
        birthdayDisplay: app_formatBirthdayDate(record.birthDay, record.birthMonth, record.birthYear),
        birthdayReason: reminderReason,
        role,
        dept
    };
};

export const app_getISTNowDate = () => {
    if (window.AppDB && typeof window.AppDB.getIstNow === 'function') {
        return window.AppDB.getIstNow();
    }
    return new Date();
};

export const app_getPostponeDefaultDate = () => {
    const istNow = app_getISTNowDate();
    const tomorrowDate = new Date(istNow);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    return app_toDateKey(tomorrowDate);
};

export const app_toDateKey = (dateObj) => {
    const d = dateObj instanceof Date ? new Date(dateObj) : new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const app_getBirthdayOccurrence = (user, baseDate = app_getISTNowDate()) => {
    const birthDay = Number(user?.birthDay || 0);
    const birthMonth = Number(user?.birthMonth || 0);
    if (!birthDay || !birthMonth) return null;

    const base = new Date(baseDate);
    const buildOccurrence = (year) => {
        const maxDay = app_daysInMonth(year, birthMonth);
        const safeDay = Math.min(birthDay, maxDay);
        return new Date(year, birthMonth - 1, safeDay);
    };

    let occurrence = buildOccurrence(base.getFullYear());
    occurrence.setHours(0, 0, 0, 0);
    const baseKey = app_toDateKey(base);
    if (app_toDateKey(occurrence) < baseKey) {
        occurrence = buildOccurrence(base.getFullYear() + 1);
        occurrence.setHours(0, 0, 0, 0);
    }
    return occurrence;
};

export const app_isWorkingDay = (dateObj) => {
    const dayType = window.AppAnalytics?.getDayType?.(dateObj);
    return dayType !== 'Holiday';
};

export const app_getPreviousWorkingDay = (dateObj) => {
    const cursor = new Date(dateObj);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - 1);
    while (!app_isWorkingDay(cursor)) {
        cursor.setDate(cursor.getDate() - 1);
    }
    return cursor;
};

export const app_getBirthdayReminderReason = (birthdayDate, reminderDate) => {
    const diffDays = Math.round((birthdayDate.getTime() - reminderDate.getTime()) / 86400000);
    return diffDays <= 1 ? 'Birthday is tomorrow' : 'Birthday is on the next working day';
};

window.app_submitBirthdayMonthForm = async (event, month) => {
    event.preventDefault();
    const currentUser = window.AppAuth?.getUser?.();
    if (!window.app_canAdminBirthdays(currentUser)) {
        alert('You do not have permission to manage birthdays.');
        return;
    }

    const targetMonth = Number(month || 0);
    if (!targetMonth || targetMonth < 1 || targetMonth > 12) {
        alert('Invalid birthday month.');
        return;
    }

    const formData = new FormData(event.target);
    const userId = String(formData.get('userId') || '').trim();
    if (!userId) {
        alert('Please select a staff member.');
        return;
    }

    try {
        const birthdayFields = app_extractBirthdayFields(formData);
        const existing = await window.AppDB.get('users', userId);
        if (!existing) throw new Error('Staff member not found.');

        const updatePayload = {
            id: userId,
            birthMonth: targetMonth,
            birthDay: birthdayFields.birthDay,
            birthYear: birthdayFields.birthYear
        };

        const success = await window.AppAuth.updateUser(updatePayload);
        if (!success) throw new Error('Unable to save birthday details.');

        event.target.reset();
        const page = document.getElementById('page-content');
        if (page) page.innerHTML = await AppUI.renderBirthdayCalendar();
        window.app_showSyncToast(`Birthday updated for ${existing.name || 'staff member'}.`);
    } catch (err) {
        alert(`Failed to save birthday details: ${err.message}`);
    }
};

window.app_dismissBirthdayPopup = async ({ openCalendar = false } = {}) => {
    const currentUser = window.AppAuth?.getUser?.();
    if (!currentUser) return;
    const freshUser = await window.AppDB.get('users', currentUser.id).catch(() => currentUser);
    if (!freshUser || !Array.isArray(freshUser.notifications)) return;

    let changed = false;
    freshUser.notifications = freshUser.notifications.map((notif) => {
        if (notif?.type === 'birthday-reminder' && notif?.read !== true) {
            changed = true;
            return {
                ...notif,
                read: true,
                status: 'seen',
                dismissedAt: new Date().toISOString()
            };
        }
        return notif;
    });

    if (changed) {
        await window.AppAuth.updateUser(freshUser);
    }
    document.getElementById('birthday-reminder-modal')?.remove();
    if (window.app_refreshNotificationBell) {
        await window.app_refreshNotificationBell();
    }
    if (openCalendar) {
        window.location.hash = 'birthday-calendar';
    }
};

window.app_openBirthdayEditor = async (sourceOrId, maybeId) => {
    const currentUser = window.AppAuth?.getUser?.();
    if (!window.app_canAdminBirthdays(currentUser)) {
        alert('You do not have permission to manage birthdays.');
        return;
    }
    const source = maybeId ? sourceOrId : 'user';
    const recordId = maybeId || sourceOrId;
    const config = app_getBirthdaySourceConfig(source);
    const record = await window.AppDB.get(config.collection, recordId);
    if (!record) {
        alert(config.emptyMessage);
        return;
    }
    const editorMeta = app_getBirthdayEditorMeta(record, config.source);
    const extraFields = config.source === 'external' ? `
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.75rem; margin-bottom:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Name</span>
                            <input type="text" name="name" value="${escapeDialogHtml(record.name || '')}" placeholder="Full name" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Relationship to CRWI</span>
                            <input type="text" name="relationshipToCrwi" value="${escapeDialogHtml(record.relationshipToCrwi || record.position || '')}" placeholder="Partner, vendor, consultant..." style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
    ` : '';
    const html = `
        <div class="modal-overlay" id="birthday-details-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Birthday Details</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">${escapeDialogHtml(editorMeta.title)}</h3>
                        <div style="font-size:0.84rem; color:#64748b;">${escapeDialogHtml(editorMeta.subtitle)}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-details-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-details-form">
                    <input type="hidden" name="birthdaySource" value="${escapeDialogHtml(config.source)}">
                    <input type="hidden" name="recordId" value="${escapeDialogHtml(record.id)}">
                    ${extraFields}
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" value="${escapeDialogHtml(record.birthDay || '')}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${escapeDialogHtml(record.birthMonth || '')}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" value="${escapeDialogHtml(record.birthYear || '')}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Save one field, two fields, or all three. Reminders need day and month.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-details-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;
    window.app_showModal(html, 'birthday-details-modal');
};

window.app_submitBirthdayDetails = async (event) => {
    event.preventDefault();
    const currentUser = window.AppAuth?.getUser?.();
    if (!window.app_canAdminBirthdays(currentUser)) {
        alert('You do not have permission to manage birthdays.');
        return;
    }
    const formData = new FormData(event.target);
    const source = String(formData.get('birthdaySource') || 'user').trim().toLowerCase();
    const recordId = String(formData.get('recordId') || '').trim();
    const config = app_getBirthdaySourceConfig(source);
    if (!recordId) {
        alert(`Missing ${config.label.toLowerCase()} record.`);
        return;
    }
    try {
        const birthdayFields = app_extractBirthdayFields(formData);
        const existing = await window.AppDB.get(config.collection, recordId);
        if (!existing) throw new Error(config.emptyMessage);
        if (config.source === 'external') {
            const name = String(formData.get('name') || '').trim();
            if (!name) throw new Error('Name is required.');
            await window.AppDB.put(config.collection, {
                ...existing,
                name,
                relationshipToCrwi: String(formData.get('relationshipToCrwi') || '').trim(),
                birthDay: birthdayFields.birthDay,
                birthMonth: birthdayFields.birthMonth,
                birthYear: birthdayFields.birthYear,
                updatedAt: new Date().toISOString(),
                updatedById: currentUser?.id || ''
            });
        } else {
            const success = await window.AppAuth.updateUser({
                id: recordId,
                birthDay: birthdayFields.birthDay,
                birthMonth: birthdayFields.birthMonth,
                birthYear: birthdayFields.birthYear
            });
            if (!success) throw new Error('Unable to save birthday details.');
        }
        document.getElementById('birthday-details-modal')?.remove();
        window.app_showSyncToast(`Birthday details saved for ${existing.name || config.label.toLowerCase()}.`);
        if ((window.location.hash.slice(1) || 'dashboard') === 'birthday-calendar') {
            const page = document.getElementById('page-content');
            if (page) page.innerHTML = await AppUI.renderBirthdayCalendar();
        } else if (window.app_refreshAdminPage) {
            await window.app_refreshAdminPage();
        }
    } catch (err) {
        alert(`Failed to save birthday details: ${err.message}`);
    }
};

window.app_openExternalBirthdayPersonModal = async () => {
    const currentUser = window.AppAuth?.getUser?.();
    if (!window.app_canAdminBirthdays(currentUser)) {
        alert('Birthday Calendar admin access is required to add external birthdays.');
        return;
    }
    const html = `
        <div class="modal-overlay" id="birthday-external-modal" style="display:flex;">
            <div class="modal-content" style="max-width:460px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">External Collaborator</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">Add a birthday</h3>
                        <div style="font-size:0.84rem; color:#64748b;">Add a name and date of birth; relationship to CRWI is optional. This does not create a staff account.</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-external-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-external-form">
                    <div style="display:grid; gap:0.85rem;">
                        <label>
                            <span style="display:block; font-size:0.82rem; font-weight:700; color:#64748b; margin-bottom:0.3rem;">Name</span>
                            <input type="text" name="name" required maxlength="120" autocomplete="name" placeholder="Full name" style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.82rem; font-weight:700; color:#64748b; margin-bottom:0.3rem;">Date of birth</span>
                            <input type="date" name="dateOfBirth" required min="1900-01-01" max="${escapeDialogHtml(app_toDateKey(app_getISTNowDate()))}" style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.82rem; font-weight:700; color:#64748b; margin-bottom:0.3rem;">Relationship to CRWI <span style="font-weight:400;">(optional)</span></span>
                            <input type="text" name="relationshipToCrwi" maxlength="80" placeholder="Partner, vendor, consultant..." style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-external-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Add Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;
    window.app_showModal(html, 'birthday-external-modal');
};

window.app_submitExternalBirthdayPerson = async (event) => {
    event.preventDefault();
    const currentUser = window.AppAuth?.getUser?.();
    if (!window.app_canAdminBirthdays(currentUser)) {
        alert('Birthday Calendar admin access is required to add external birthdays.');
        return;
    }
    const formData = new FormData(event.target);
    const name = String(formData.get('name') || '').trim();
    if (!name) {
        alert('Please enter a name.');
        return;
    }
    try {
        const birthdayFields = app_extractBirthdayDate(formData.get('dateOfBirth'));
        const person = {
            id: `birthday_person_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            birthDay: birthdayFields.birthDay,
            birthMonth: birthdayFields.birthMonth,
            birthYear: birthdayFields.birthYear,
            relationshipToCrwi: String(formData.get('relationshipToCrwi') || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: currentUser?.id || '',
            updatedById: currentUser?.id || ''
        };
        await window.AppDB.put('birthday_people', person);
        document.getElementById('birthday-external-modal')?.remove();
        const page = document.getElementById('page-content');
        if (page && (window.location.hash.slice(1) || 'dashboard') === 'birthday-calendar') {
            page.innerHTML = await AppUI.renderBirthdayCalendar();
        }
        window.app_showSyncToast(`Birthday person saved for ${name}.`);
    } catch (err) {
        alert(`Failed to save birthday person: ${err.message}`);
    }
};

window.app_refreshBirthdayCalendar = async () => {
    if ((window.location.hash.slice(1) || 'dashboard') !== 'birthday-calendar') return;
    const page = document.getElementById('page-content');
    if (page) page.innerHTML = await AppUI.renderBirthdayCalendar();
};

window.app_setBirthdayCalendarView = async (view) => {
    const state = window.app_birthdayCalendarState || {};
    window.app_birthdayCalendarState = {
        ...state,
        view: String(view || 'month').toLowerCase() === 'year' ? 'year' : 'month'
    };
    await window.app_refreshBirthdayCalendar();
};

window.app_goToBirthdayCalendarMonth = async (month, year = null) => {
    const targetMonth = Number(month || 0);
    if (!targetMonth || targetMonth < 1 || targetMonth > 12) return;
    const now = app_getISTNowDate();
    const state = window.app_birthdayCalendarState || {};
    window.app_birthdayCalendarState = {
        ...state,
        selectedMonth: targetMonth,
        selectedYear: Number(year || state.selectedYear || now.getFullYear()),
        view: 'month'
    };
    await window.app_refreshBirthdayCalendar();
};

window.app_changeBirthdayCalendarMonth = async (delta) => {
    const step = Number(delta || 0);
    if (!step) return;
    const now = app_getISTNowDate();
    const state = window.app_birthdayCalendarState || {};
    const selectedMonth = Number(state.selectedMonth || now.getMonth() + 1);
    const selectedYear = Number(state.selectedYear || now.getFullYear());
    const cursor = new Date(selectedYear, selectedMonth - 1 + step, 1);
    window.app_birthdayCalendarState = {
        ...state,
        selectedMonth: cursor.getMonth() + 1,
        selectedYear: cursor.getFullYear(),
        view: 'month'
    };
    await window.app_refreshBirthdayCalendar();
};

window.app_syncBirthdayReminders = async () => {
    const currentUser = window.AppAuth?.getUser?.();
    if (!window.app_canManageBirthdays(currentUser)) return;

    const [allUsers, externalPeople] = await Promise.all([
        window.AppDB.getAll('users').catch(() => []),
        window.AppDB.getAll('birthday_people', { silentPermissionDenied: true }).catch(() => [])
    ]);
    const birthdayEntries = [
        ...(Array.isArray(allUsers) ? allUsers.map((user) => ({ ...user, birthdaySource: 'user' })) : []),
        ...(Array.isArray(externalPeople) ? externalPeople.map((person) => ({ ...person, birthdaySource: 'external' })) : [])
    ];
    if (!birthdayEntries.length) return;

    const today = app_getISTNowDate();
    today.setHours(0, 0, 0, 0);
    const todayKey = app_toDateKey(today);
    const manager = allUsers.find((user) => String(user.id) === String(currentUser.id)) || currentUser;
    let notifications = Array.isArray(manager?.notifications) ? [...manager.notifications] : [];
    let changed = false;

    for (const entry of birthdayEntries) {
        const birthdayDate = app_getBirthdayOccurrence(entry, today);
        if (!birthdayDate) continue;
        const reminderDate = app_getPreviousWorkingDay(birthdayDate);
        const reminderKey = app_toDateKey(reminderDate);
        if (reminderKey !== todayKey) continue;

        const birthdayKey = app_toDateKey(birthdayDate);
        const exists = notifications.some((notif) =>
            notif?.type === 'birthday-reminder'
            && String(notif.birthdayStaffId || '') === String(entry.id || '')
            && String(notif.birthdaySource || 'user') === String(entry.birthdaySource || 'user')
            && String(notif.birthdayDate || '') === birthdayKey
            && String(notif.reminderDate || '') === reminderKey
        );
        if (exists) continue;

        notifications.unshift(app_buildBirthdayReminderPayload(entry, entry.birthdaySource || 'user', birthdayDate, reminderDate));
        changed = true;
    }

    if (!changed) return;

    try {
        await window.AppDB.put('users', { ...manager, notifications });
        currentUser.notifications = notifications;
    } catch (err) {
        console.warn('Birthday reminders could not be saved for the signed-in manager:', err);
    }
};

window.app_maybeOpenBirthdayPopup = async () => {
    const currentUser = window.AppAuth?.getUser?.();
    if (!window.app_canManageBirthdays(currentUser)) return;
    if (document.getElementById('birthday-reminder-modal')) return;

    const freshUser = await window.AppDB.get('users', currentUser.id).catch(() => currentUser);
    const birthdayRows = Array.isArray(freshUser?.notifications)
        ? freshUser.notifications.filter((notif) => notif?.type === 'birthday-reminder' && notif?.read !== true)
        : [];
    if (!birthdayRows.length) return;

    const canEditBirthdays = window.app_canAdminBirthdays(currentUser);
    const cards = birthdayRows.map((notif) => `
        <div style="border:1px solid #fed7aa; background:linear-gradient(135deg, #fff7ed, #fffbeb); border-radius:16px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start;">
                <div>
                    <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Upcoming ${notif.birthdaySource === 'external' ? 'Collaborator' : 'Staff'} Birthday</div>
                    <h4 style="margin:0.35rem 0 0.2rem 0; color:#7c2d12;">${escapeDialogHtml(notif.birthdayStaffName || 'Staff')}</h4>
                    <div style="font-size:0.84rem; color:#9a3412;">${escapeDialogHtml(notif.birthdayDisplay || notif.birthdayDate || '')}</div>
                    <div style="font-size:0.8rem; color:#7c2d12; margin-top:0.35rem;">${escapeDialogHtml(notif.birthdayReason || 'Upcoming birthday')}</div>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.25rem;">${escapeDialogHtml(notif.birthdaySource === 'external' ? ([notif.role, notif.dept].filter(Boolean).join(' • ') || 'External collaborator') : `${notif.role || 'Employee'} • ${notif.dept || 'General'}`)}</div>
                </div>
                ${canEditBirthdays ? `<button type="button" class="action-btn secondary" style="padding:0.45rem 0.7rem;" onclick="window.app_openBirthdayEditor('${escapeDialogHtml(notif.birthdaySource || 'user')}', '${escapeDialogHtml(notif.birthdayStaffId || '')}')">Edit Details</button>` : ''}
            </div>
        </div>
    `).join('');

    const html = `
        <div class="modal-overlay" id="birthday-reminder-modal" style="display:flex;">
            <div class="modal-content" style="max-width:720px; border-radius:22px; padding:0; overflow:hidden;">
                <div style="padding:1.35rem 1.4rem; background:linear-gradient(135deg, #9a3412, #f97316); color:#fff;">
                    <div style="display:flex; justify-content:space-between; gap:1rem; align-items:flex-start;">
                        <div>
                            <div style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; opacity:0.9;">Birthday Reminder</div>
                            <h3 style="margin:0.35rem 0 0.2rem 0;">Birthdays are coming up</h3>
                            <p style="margin:0; opacity:0.92;">Review the upcoming birthdays and update any missing details before the next working day.</p>
                        </div>
                        <button type="button" onclick="window.app_dismissBirthdayPopup()" style="background:none; border:none; color:#fff; font-size:1.3rem; cursor:pointer;">&times;</button>
                    </div>
                </div>
                <div style="padding:1.2rem 1.4rem; display:flex; flex-direction:column; gap:0.85rem; max-height:60vh; overflow:auto;">
                    ${cards}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.4rem 1.3rem; border-top:1px solid #e5e7eb; background:#fff;">
                    <button type="button" class="action-btn secondary" onclick="window.app_dismissBirthdayPopup()">Dismiss</button>
                    <button type="button" class="action-btn" onclick="window.app_dismissBirthdayPopup({ openCalendar: true })">View Birthday Calendar</button>
                </div>
            </div>
        </div>`;
    window.app_showModal(html, 'birthday-reminder-modal');
};
