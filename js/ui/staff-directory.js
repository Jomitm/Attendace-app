/**
 * Staff Directory Component
 * Handles rendering of the full-page staff thread, messages, and tasks.
 */

import { safeHtml, safeAttr, safeContentUrl } from './helpers.js';
import { onAction } from '../utils/action-router.js';
import { AppConfig } from '../config.js';

/**
 * Render the Staff Directory Page
 */
export async function renderStaffDirectoryPage() {
    if (typeof document !== 'undefined') {
        onAction('staff-open-thread', el => window.app_openStaffThread(el.dataset.staffId));
        onAction('staff-send-message', el => window.app_openStaffMessageModal(el.dataset.staffId, el.dataset.staffName));
        onAction('staff-send-task', el => window.app_openStaffTaskModal(el.dataset.staffId, el.dataset.staffName));
        onAction('staff-respond-task', el => window.app_respondStaffTask(el.dataset.messageId, el.dataset.response));
    }
    const currentUser = window.AppAuth.getUser();

    // Fetch data (using cache where possible)
    const allUsers = await window.AppUserService.getAll();

    const messages = window.app_getMyMessages
        ? await window.app_getMyMessages()
        : await window.AppSettingsService.getStaffMessages();

    const others = allUsers
        .filter(u => u.id !== currentUser.id && !AppConfig.isDemoUser(u))
        .sort((a, b) => a.name.localeCompare(b.name));

    if (!window.app_staffThreadId && others.length > 0) {
        window.app_staffThreadId = others[0].id;
    }

    const selected = allUsers.find(u => u.id === window.app_staffThreadId);

    const linkify = text => String(text || '').split(/(https?:\/\/[^\s]+)/g).map(part =>
        /^https?:\/\//i.test(part)
            ? `<a href="${safeAttr(safeContentUrl(part))}" target="_blank" rel="noopener noreferrer">${safeHtml(part)}</a>`
            : safeHtml(part)).join('');

    const conversation = messages
        .filter(m => (m.fromId === currentUser.id && m.toId === window.app_staffThreadId)
            || (m.fromId === window.app_staffThreadId && m.toId === currentUser.id))
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    const textMessages = conversation.filter(m => m.type === 'text');
    const taskMessages = conversation.filter(m => m.type === 'task');

    const unreadByUser = {};
    messages.forEach(m => {
        if (m.toId === currentUser.id && !m.read) {
            unreadByUser[m.fromId] = (unreadByUser[m.fromId] || 0) + 1;
        }
    });

    const staffList = others.map(u => {
        const unread = unreadByUser[u.id] || 0;
        const isActive = u.id === window.app_staffThreadId;
        return `
            <button class="staff-directory-item ${isActive ? 'active' : ''}" data-ts-action="staff-open-thread" data-staff-id="${safeAttr(u.id)}">
                <div class="staff-directory-avatar">
                    <img src="${safeAttr(safeContentUrl(u.avatar, { image: true }))}" alt="${safeHtml(u.name)}">
                </div>
                <div class="staff-directory-info">
                    <div class="staff-directory-name">${safeHtml(u.name)}</div>
                    <div class="staff-directory-role">${safeHtml(u.role || 'Staff')}</div>
                </div>
                ${unread ? `<span class="staff-directory-badge">${unread}</span>` : ''}
            </button>
        `;
    }).join('');

    const textHistoryHTML = selected ? (textMessages.length ? textMessages.map(m => `
        <div class="staff-message ${m.fromId === currentUser.id ? 'outgoing' : 'incoming'}">
            <div class="staff-message-meta">${safeHtml(m.fromName)} • ${new Date(m.createdAt).toLocaleString()}</div>
            <div class="staff-message-body">${linkify(m.message || '')}</div>
            ${m.link ? `<div class="staff-message-link"><a href="${safeAttr(safeContentUrl(m.link))}" target="_blank" rel="noopener noreferrer">${safeHtml(m.link)}</a></div>` : ''}
        </div>
    `).join('') : '<div class="staff-message-empty">No messages yet.</div>') : '<div class="staff-message-empty">Select a staff member to view messages.</div>';

    const taskHistoryHTML = selected ? (taskMessages.length ? taskMessages.map(m => `
        <div class="staff-task-card">
            <div class="staff-task-head">
                <div>
                    <div class="staff-task-title">${safeHtml(m.title || 'Task')}</div>
                    <div class="staff-task-meta">From ${safeHtml(m.fromName)} • Due ${safeHtml(m.dueDate || 'No date')}</div>
                </div>
                <span class="staff-task-status ${safeAttr(m.status || 'pending')}">${safeHtml(String(m.status || 'pending').toUpperCase())}</span>
            </div>
            <div class="staff-task-desc">${safeHtml(m.description || '')}</div>
            ${m.status === 'pending' && m.toId === currentUser.id ? `
                <div class="staff-task-actions">
                    <button data-ts-action="staff-respond-task" data-message-id="${safeAttr(m.id)}" data-response="approved" class="staff-task-btn approve">Approve</button>
                    <button data-ts-action="staff-respond-task" data-message-id="${safeAttr(m.id)}" data-response="rejected" class="staff-task-btn reject">Reject</button>
                </div>
            ` : ''}
            ${m.rejectReason ? `<div class="staff-task-reason">Reason: ${safeHtml(m.rejectReason)}</div>` : ''}
        </div>
    `).join('') : '<div class="staff-message-empty">No tasks yet.</div>') : '<div class="staff-message-empty">Select a staff member to view tasks.</div>';

    return `
        <div class="staff-directory-page">
            <aside class="staff-directory-panel">
                <div class="staff-directory-panel-head">
                    <h3>Staff Directory</h3>
                    <span>Messages & tasks</span>
                </div>
                <div class="staff-directory-list">
                    ${staffList || '<div class="staff-message-empty">No staff found.</div>'}
                </div>
            </aside>
            <section class="staff-thread-panel">
                <div class="staff-thread-head">
                    <div>
                        <h3>${selected ? safeHtml(selected.name) : 'Select a staff member'}</h3>
                        <span>${selected ? safeHtml(selected.role || 'Staff') : ''}</span>
                    </div>
                    <div class="staff-thread-actions">
                        <button class="staff-thread-action-btn" ${selected ? '' : 'disabled'} data-ts-action="staff-send-message" data-staff-id="${safeAttr(selected?.id || '')}" data-staff-name="${safeAttr(selected?.name || '')}">
                            <i class="fa-solid fa-message"></i> Send Message
                        </button>
                        <button class="staff-thread-action-btn secondary" ${selected ? '' : 'disabled'} data-ts-action="staff-send-task" data-staff-id="${safeAttr(selected?.id || '')}" data-staff-name="${safeAttr(selected?.name || '')}">
                            <i class="fa-solid fa-list-check"></i> Send Task
                        </button>
                    </div>
                </div>
                <div class="staff-thread-columns">
                    <div class="staff-thread-column">
                        <div class="staff-thread-column-head">Text Messages</div>
                        <div class="staff-thread-history">
                            ${textHistoryHTML}
                        </div>
                    </div>
                    <div class="staff-thread-column">
                        <div class="staff-thread-column-head">Tasks</div>
                        <div class="staff-thread-history">
                            ${taskHistoryHTML}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

