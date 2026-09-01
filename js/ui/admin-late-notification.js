/**
 * Admin Late Notification Recipients Widget
 * Allows admins to configure which users receive late check-in notifications.
 */

import { safeHtml } from './helpers.js';
import { AppDB } from '../modules/db.js';
import { onAction } from '../utils/action-router.js';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'lateNotificationRecipients';

let cachedRecipients = null;

async function loadRecipients() {
    if (cachedRecipients) return cachedRecipients;
    try {
        const doc = await AppDB.get(SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        cachedRecipients = Array.isArray(doc?.recipients) ? doc.recipients : [];
    } catch {
        cachedRecipients = [];
    }
    return cachedRecipients;
}

async function saveRecipients(recipients) {
    const cleaned = recipients
        .map((r) => String(r || '').trim().toLowerCase())
        .filter(Boolean);
    const unique = [...new Set(cleaned)];
    await AppDB.put(SETTINGS_COLLECTION, {
        id: SETTINGS_DOC_ID,
        recipients: unique,
        updatedAt: Date.now()
    });
    cachedRecipients = unique;
    return unique;
}

async function addRecipient(username) {
    const current = await loadRecipients();
    const name = String(username || '').trim().toLowerCase();
    if (!name || current.includes(name)) return current;
    return saveRecipients([...current, name]);
}

async function removeRecipient(username) {
    const current = await loadRecipients();
    const name = String(username || '').trim().toLowerCase();
    return saveRecipients(current.filter((r) => r !== name));
}

async function fetchAllUsernames() {
    try {
        const users = await AppDB.getAll('users');
        return users
            .map((u) => String(u.username || '').trim().toLowerCase())
            .filter(Boolean)
            .sort();
    } catch {
        return [];
    }
}

export async function renderLateNotificationBody(isExpanded = false) {
    const recipients = await loadRecipients();
    const allUsernames = await fetchAllUsernames();

    const recipientChips = recipients.length
        ? recipients.map((r) => `
            <span class="admin-chip">
                ${safeHtml(r)}
                <button type="button" class="admin-chip-remove" data-ts-action="remove-recipient" data-username="${safeHtml(r)}" title="Remove">&times;</button>
            </span>`).join('')
        : '<span class="text-muted" style="font-size:0.8rem;">No recipients configured</span>';

    const optionsHtml = allUsernames
        .filter((u) => !recipients.includes(u))
        .map((u) => `<option value="${safeHtml(u)}">${safeHtml(u)}</option>`)
        .join('');

    const wrapperClass = isExpanded ? 'admin-card-expanded-inner' : 'admin-card-compact-inner';

    return `
        <div class="${wrapperClass}">
            <p class="admin-card-description" style="margin-bottom: 0.75rem; font-size: 0.8rem; color: #6b7280;">
                Users listed here receive a Telegram notification when any staff checks in late.
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                ${recipientChips}
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <select id="late-notif-add-select" class="gm-input" style="flex: 1; padding: 0.4rem 0.6rem; font-size: 0.8rem; border-radius: 0.375rem;">
                    <option value="">Select a user...</option>
                    ${optionsHtml}
                </select>
                <button type="button" class="action-btn" data-ts-action="add-late-recipient" data-select-id="late-notif-add-select" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; white-space: nowrap;">
                    <i class="fa-solid fa-plus"></i> Add
                </button>
            </div>
        </div>
    `;
}

export function bindLateNotificationListeners() {
    onAction('remove-recipient', async (el) => {
        const username = el.dataset.username;
        if (username && confirm(`Remove "${username}" from late notification recipients?`)) {
            await removeRecipient(username);
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                const { renderAdmin } = await import('./admin.js');
                contentArea.innerHTML = await renderAdmin();
            }
        }
    });

    onAction('add-late-recipient', async (el) => {
        const selectId = el.dataset.selectId || 'late-notif-add-select';
        const select = document.getElementById(selectId);
        const username = select?.value;
        if (username) {
            await addRecipient(username);
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                const { renderAdmin } = await import('./admin.js');
                contentArea.innerHTML = await renderAdmin();
            }
        }
    });
}

export async function getLateNotificationRecipients() {
    return loadRecipients();
}
