// Notification bell & history drawer.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml, escapeJsSingleQuote as app_escapeJsSingleQuote } from '../utils/html-escape.js';

const toSafeNotifStatus = (notif) => String(notif?.status || 'pending').toLowerCase();
const isPendingNotif = (notif) => {
    if (notif?.type === 'birthday-reminder') {
        return notif?.read !== true;
    }
    return toSafeNotifStatus(notif) === 'pending';
};

const isAutoSystemPostponedNotification = (notif) => {
    if (!notif) return false;
    if (notif.autoPostponed === true || notif.isAutoForwarded === true) return true;
    const type = String(notif.type || '').toLowerCase();
    if (type.includes('auto-forward') || type.includes('carry-forward') || type.includes('system-postponed')) return true;
    const hay = `${notif.title || ''} ${notif.message || ''} ${notif.description || ''}`.toLowerCase();
    return /postponed from|auto[- ]?forward|carried forward|carry forward|system postponed/.test(hay);
};

const getNotifSource = (notif) => {
    if (notif?.type === 'birthday-reminder') return 'Birthday';
    if (notif?.type === 'minute-access-request') return 'Minutes';
    if (String(notif?.type || '').includes('missed-checkout')) return 'Attendance';
    if (notif?.type === 'task') return 'Task';
    if (notif?.type === 'tag' || notif?.type === 'mention') return 'Tag';
    if (notif?.type === 'reminder') return 'Reminder';
    return 'Notification';
};

const canRespondToNotification = (notif, user) => {
    if (!notif) return false;
    if (notif.type === 'minute-access-request') {
        return !!(
            user?.isAdmin === true
            || user?.role === 'Administrator'
            || window.app_hasPerm?.('minutes', 'admin', user)
        );
    }
    if (String(notif.type || '').includes('missed-checkout')) {
        return !!(user?.isAdmin === true || user?.role === 'Administrator');
    }
    return notif.type === 'tag' || notif.type === 'mention';
};

const getNotifPreview = (notif) => {
    return String(
        notif?.description
        || notif?.message
        || notif?.title
        || ''
    ).trim();
};

const getNotifTimeLabel = (notif) => {
    const raw = notif?.respondedAt || notif?.taggedAt || notif?.date;
    const ts = new Date(raw).getTime();
    if (!ts) return 'Unknown time';
    const diffMins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    const age = diffMins < 1
        ? 'just now'
        : diffMins < 60
            ? `${diffMins} mins ago`
            : diffMins < 1440
                ? `${Math.floor(diffMins / 60)} hrs ago`
                : `${Math.floor(diffMins / 1440)} days ago`;
    return `${new Date(ts).toLocaleString()} (${age})`;
};

window.app_refreshNotificationBell = async () => {
    const buttons = document.querySelectorAll('.top-notification-btn');
    if (!buttons.length) return;

    const user = window.AppAuth.getUser();
    const notificationsRaw = Array.isArray(user?.notifications) ? user.notifications : [];
    const notifications = notificationsRaw.filter(n => !isAutoSystemPostponedNotification(n));
    const pendingCount = notifications.filter(isPendingNotif).length;
    if (user && notifications.length !== notificationsRaw.length) {
        try {
            const updatedUser = await window.AppDB.get('users', user.id).catch(() => null);
            if (updatedUser && Array.isArray(updatedUser.notifications)) {
                updatedUser.notifications = updatedUser.notifications.filter(n => !isAutoSystemPostponedNotification(n));
                await window.AppDB.put('users', updatedUser);
                Object.assign(user, { notifications: updatedUser.notifications });
            }
        } catch (err) {
            console.warn('Failed to clean postponed notifications during bell refresh:', err);
        }
    }

    buttons.forEach((btn) => {
        const badge = btn.querySelector('.top-notification-badge');
        if (!user) {
            btn.classList.remove('has-pending');
            if (badge) badge.style.display = 'none';
            return;
        }
        btn.classList.toggle('has-pending', pendingCount > 0);
        btn.setAttribute('title', pendingCount > 0
            ? `${pendingCount} pending notification${pendingCount > 1 ? 's' : ''}`
            : 'Notification history');
        if (badge) {
            if (pendingCount > 0) {
                badge.textContent = pendingCount > 99 ? '99+' : String(pendingCount);
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        }
    });
};

window.app_closeNotificationHistory = () => {
    const drawer = document.getElementById('notification-history-modal');
    const backdrop = document.getElementById('notif-drawer-backdrop');
    if (drawer) drawer.classList.remove('notif-drawer-open');
    if (backdrop) backdrop.classList.remove('notif-drawer-backdrop-visible');
    setTimeout(() => document.getElementById('notif-drawer-root')?.remove(), 320);
};

window.app_recordNotifError = (err, context = {}) => {
    try {
        const payload = {
            message: String(err?.message || err || 'Unknown error'),
            time: new Date().toISOString(),
            context
        };
        localStorage.setItem('notif_last_error', JSON.stringify(payload));
    } catch {
        // no-op
    }
};

window.app_showLastNotifError = () => {
    try {
        const raw = localStorage.getItem('notif_last_error');
        if (!raw) return;
        localStorage.removeItem('notif_last_error');
        const data = JSON.parse(raw);
        const html = `
            <div class="modal-overlay" id="notif-error-modal" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                        <h3 style="margin:0;">Notification Error</h3>
                        <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style="font-size:0.85rem; color:#64748b; margin-bottom:0.6rem;">
                        The last notification action failed. Details below:
                    </div>
                    <div style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:0.65rem; border-radius:8px; font-size:0.85rem;">
                        ${escapeDialogHtml(data?.message || 'Unknown error')}
                    </div>
                    <div style="margin-top:0.6rem; font-size:0.78rem; color:#64748b;">
                        Time: ${escapeDialogHtml(data?.time || '')}
                    </div>
                </div>
            </div>
        `;
        window.app_showModal(html, 'notif-error-modal');
    } catch {
        // no-op
    }
};

window.app_markNotificationResponded = async (notifId, notifIndex, response) => {
    const user = window.AppAuth.getUser();
    if (!user) return false;
    const updatedUser = await window.AppDB.get('users', user.id).catch(() => null);
    if (!updatedUser || !Array.isArray(updatedUser.notifications)) return false;
    let notif = null;
    if (Number.isInteger(notifIndex) && notifIndex >= 0 && updatedUser.notifications[notifIndex]) {
        notif = updatedUser.notifications[notifIndex];
    } else if (notifId) {
        notif = updatedUser.notifications.find(n => String(n.id || '') === String(notifId));
    }
    if (!notif) return false;
    const nowIso = new Date().toISOString();
    notif.status = response;
    notif.respondedAt = nowIso;
    notif.read = true;
    notif.dismissedAt = nowIso;
    await window.AppDB.put('users', updatedUser);
    await window.app_refreshNotificationBell?.();
    return true;
};

window.app_respondNotificationFromHistory = async (notifIndex, notifId, action) => {
    const currentUser = window.AppAuth.getUser();
    if (!currentUser) return;

    const decision = action === 'approve' ? 'approve' : 'reject';
    const freshUser = await window.AppDB.get('users', currentUser.id);
    if (!freshUser || !Array.isArray(freshUser.notifications)) {
        alert('Notification not found.');
        return;
    }

    let notif = null;
    let resolvedIndex = -1;
    if (Number.isInteger(notifIndex) && notifIndex >= 0 && freshUser.notifications[notifIndex]) {
        notif = freshUser.notifications[notifIndex];
        resolvedIndex = notifIndex;
    }
    if (!notif && notifId) {
        resolvedIndex = freshUser.notifications.findIndex(n => String(n.id) === String(notifId));
        if (resolvedIndex >= 0) notif = freshUser.notifications[resolvedIndex];
    }
    if (!notif) {
        alert('This notification is no longer available.');
        return;
    }
    if (!isPendingNotif(notif)) {
        alert('This notification has already been responded.');
        await window.app_refreshNotificationBell();
        return;
    }

    window.app_closeNotificationHistory();

    try {
        if (notif.type === 'minute-access-request') {
            const canReviewMinutes = currentUser.isAdmin === true
                || currentUser.role === 'Administrator'
                || window.app_hasPerm?.('minutes', 'admin', currentUser);
            if (!canReviewMinutes) {
                alert('You do not have permission to review minutes access requests.');
                return;
            }
            await window.app_reviewMinuteAccessFromNotification(resolvedIndex, notif.id, decision === 'approve' ? 'approved' : 'rejected');
            return;
        }
        if (notif.type === 'missed-checkout-reason') {
            if (!(currentUser.isAdmin === true || currentUser.role === 'Administrator')) {
                alert('Only administrators can review missed checkout reasons.');
                return;
            }
            await window.app_reviewMissedCheckoutReasonFromNotification(resolvedIndex, notif.id, decision === 'approve' ? 'approved' : 'rejected');
            return;
        }

        const taskIndex = Number(notif.taskIndex);
        if (notif.planId && Number.isInteger(taskIndex) && taskIndex >= 0) {
            await window.app_handleTagResponse(notif.planId, taskIndex, decision === 'approve' ? 'accepted' : 'rejected', resolvedIndex);
            return;
        }

        if (notif.id) {
            await window.app_handleTagDecision(notif.id, decision === 'approve' ? 'accepted' : 'rejected');
            return;
        }

        const fallbackUpdated = await window.app_markNotificationResponded(notif.id, resolvedIndex, decision === 'approve' ? 'accepted' : 'rejected');
        if (!fallbackUpdated) {
            alert('This notification cannot be approved or rejected from history.');
        }
    } catch (err) {
        console.error('Notification response error:', err);
        window.app_recordNotifError(err, { notifId: notif?.id || '', action: decision });
        const fallbackUpdated = await window.app_markNotificationResponded(notif?.id, resolvedIndex, decision === 'approve' ? 'accepted' : 'rejected');
        if (fallbackUpdated) {
            alert('Action recorded in notifications, but the full workflow failed. Please refresh.');
            return;
        }
        alert('Failed to process notification: ' + err.message);
    }
};

window.app_openNotificationHistory = async () => {
    const currentUser = window.AppAuth.getUser();
    if (!currentUser) return;

    const freshUser = await window.AppDB.get('users', currentUser.id).catch(() => currentUser);
    const notificationsRaw = Array.isArray(freshUser?.notifications) ? freshUser.notifications : [];
    const cleanedNotifications = notificationsRaw.filter(n => !isAutoSystemPostponedNotification(n));
    if (cleanedNotifications.length !== notificationsRaw.length && freshUser) {
        try {
            freshUser.notifications = cleanedNotifications;
            await window.AppDB.put('users', freshUser);
            if (window.AppAuth?.getUser) Object.assign(window.AppAuth.getUser(), { notifications: cleanedNotifications });
            if (window.app_refreshNotificationBell) await window.app_refreshNotificationBell();
        } catch (err) {
            console.warn('Failed to clean postponed notifications:', err);
        }
    }
    const notifications = cleanedNotifications;
    const tagHistory = Array.isArray(freshUser?.tagHistory) ? freshUser.tagHistory : [];
    const rows = [
        ...notifications.map((n, index) => ({ ...n, _source: 'live', _index: index })),
        ...tagHistory.map((h) => ({ ...h, _source: 'history', _index: -1 }))
    ];

    const getNotifTimeMs = (notif) => new Date(notif.respondedAt || notif.taggedAt || notif.date || 0).getTime() || 0;
    const normalizeText = (value) => String(value || '').trim().toLowerCase();
    const availableSources = Array.from(new Set(rows.map(r => getNotifSource(r)))).filter(Boolean).sort((a, b) => a.localeCompare(b));
    const sourceOptionsHtml = ['<option value="all">All Sources</option>', ...availableSources.map(src => `<option value="${escapeDialogHtml(src.toLowerCase())}">${escapeDialogHtml(src)}</option>`)].join('');

    const drawerState = {
        search: '',
        status: 'all',
        source: 'all',
        sort: 'newest'
    };

    const renderRow = (row) => {
        const status = toSafeNotifStatus(row);
        const isPending = status === 'pending' && row._source === 'live';
        const source = getNotifSource(row);
        const sender = row.taggedByName || 'System';
        const title = row.title || `${source} from ${sender}`;
        const summary = getNotifPreview(row);
        const notifIdArg = app_escapeJsSingleQuote(String(row.id || ''));
        const statusColors = {
            pending: { bg: '#fff7ed', border: '#fdba74', badge: '#f97316' },
            accepted: { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a' },
            rejected: { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626' },
            default: { bg: '#f8fafc', border: '#e2e8f0', badge: '#6b7280' }
        };
        const colors = statusColors[status] || statusColors.default;

        const approveRejectBtns = (isPending && canRespondToNotification(row, currentUser)) ? `
            <div class="notif-drawer-actions">
                <button type="button" class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${Number(row._index)}, '${notifIdArg}', 'approve')">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button type="button" class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${Number(row._index)}, '${notifIdArg}', 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>` : '';

        return `
            <div class="notif-drawer-item ${isPending ? 'is-pending' : ''}" style="border-color:${colors.border}; background:${colors.bg};" data-notif-id="${escapeDialogHtml(String(row.id || ''))}">
                <div class="notif-drawer-item-head">
                    <div class="notif-drawer-item-left">
                        <div class="notif-drawer-source-icon">
                            <i class="fa-solid ${row.type === 'tag' || row.type === 'mention'
                                ? 'fa-at'
                                : row.type === 'birthday-reminder'
                                    ? 'fa-cake-candles'
                                : row.type === 'task'
                                    ? 'fa-list-check'
                                    : row.type === 'minute-access-request'
                                        ? 'fa-file-lines'
                                        : String(row.type || '').includes('missed-checkout')
                                            ? 'fa-user-clock'
                                            : 'fa-bell'}"></i>
                        </div>
                        <div>
                            <div class="notif-drawer-title">${escapeDialogHtml(title)}</div>
                            <div class="notif-drawer-meta">${escapeDialogHtml(source)} • ${escapeDialogHtml(sender)} • ${escapeDialogHtml(getNotifTimeLabel(row))}</div>
                        </div>
                    </div>
                    <div class="notif-drawer-item-right">
                        <span class="notif-drawer-badge" style="background:${colors.badge}">${escapeDialogHtml(status)}</span>
                    </div>
                </div>
                ${summary ? `<div class="notif-drawer-text">${escapeDialogHtml(summary)}</div>` : ''}
                ${approveRejectBtns}
            </div>`;
    };

    const getFilteredRows = () => {
        const filtered = rows.filter((row) => {
            const status = toSafeNotifStatus(row);
            const source = getNotifSource(row);
            const sender = row.taggedByName || 'System';
            const title = row.title || `${source} from ${sender}`;
            const summary = getNotifPreview(row);
            const searchBlob = `${title} ${summary} ${source} ${sender} ${status}`;

            if (drawerState.status !== 'all' && status !== drawerState.status) return false;
            if (drawerState.source !== 'all' && normalizeText(source) !== drawerState.source) return false;
            if (drawerState.search && !normalizeText(searchBlob).includes(drawerState.search)) return false;
            return true;
        });

        if (drawerState.sort === 'oldest') {
            filtered.sort((a, b) => getNotifTimeMs(a) - getNotifTimeMs(b));
        } else if (drawerState.sort === 'pending') {
            filtered.sort((a, b) => {
                const pendingA = isPendingNotif(a) ? 1 : 0;
                const pendingB = isPendingNotif(b) ? 1 : 0;
                if (pendingA !== pendingB) return pendingB - pendingA;
                return getNotifTimeMs(b) - getNotifTimeMs(a);
            });
        } else {
            filtered.sort((a, b) => getNotifTimeMs(b) - getNotifTimeMs(a));
        }

        return filtered;
    };

    const unreadCount = notifications.filter(isPendingNotif).length;

    const html = `
        <div class="notif-drawer-backdrop" id="notif-drawer-backdrop" onclick="window.app_closeNotificationHistory()"></div>
        <div class="notif-drawer" id="notification-history-modal">
            <div class="notif-drawer-header">
                <div class="notif-drawer-header-left">
                    <i class="fa-solid fa-bell notif-drawer-header-icon"></i>
                    <div>
                        <div class="notif-drawer-header-title">Notifications</div>
                        <div class="notif-drawer-header-sub">${unreadCount > 0 ? `${unreadCount} pending action${unreadCount > 1 ? 's' : ''}` : 'All caught up'}</div>
                    </div>
                </div>
            </div>
            <div class="notif-drawer-tools">
                <div class="notif-drawer-search-wrap">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="search" id="notif-drawer-search" class="notif-drawer-search-input" placeholder="Search title, sender, message">
                </div>
                <div class="notif-drawer-controls">
                    <div class="notif-drawer-status-tabs" id="notif-drawer-status-tabs">
                        <button type="button" class="notif-drawer-status-tab is-active" data-notif-status="all">All</button>
                        <button type="button" class="notif-drawer-status-tab" data-notif-status="pending">Pending</button>
                        <button type="button" class="notif-drawer-status-tab" data-notif-status="accepted">Accepted</button>
                        <button type="button" class="notif-drawer-status-tab" data-notif-status="rejected">Rejected</button>
                    </div>
                    <div class="notif-drawer-selects">
                        <select id="notif-drawer-source">${sourceOptionsHtml}</select>
                        <select id="notif-drawer-sort">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="pending">Pending First</option>
                        </select>
                    </div>
                </div>
                <div class="notif-drawer-results" id="notif-drawer-results"></div>
            </div>
            <div class="notif-drawer-list" id="notif-drawer-list"></div>
        </div>`;

    // Inject into body (not modal-container) so it can slide in from the right
    const wrapper = document.createElement('div');
    wrapper.id = 'notif-drawer-root';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    // Trigger slide-in animation
    requestAnimationFrame(() => {
        const drawer = document.getElementById('notification-history-modal');
        if (drawer) drawer.classList.add('notif-drawer-open');
        const backdrop = document.getElementById('notif-drawer-backdrop');
        if (backdrop) backdrop.classList.add('notif-drawer-backdrop-visible');
    });

    const listEl = document.getElementById('notif-drawer-list');
    const resultsEl = document.getElementById('notif-drawer-results');
    const searchEl = document.getElementById('notif-drawer-search');
    const sourceEl = document.getElementById('notif-drawer-source');
    const sortEl = document.getElementById('notif-drawer-sort');
    const tabsEl = document.getElementById('notif-drawer-status-tabs');

    const renderFilteredList = () => {
        if (!listEl) return;
        const filteredRows = getFilteredRows();
        listEl.innerHTML = filteredRows.length
            ? filteredRows.map(renderRow).join('')
            : `<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>No notifications match your search/filter.</p></div>`;

        if (resultsEl) {
            resultsEl.textContent = `Showing ${filteredRows.length} of ${rows.length}`;
        }
    };

    searchEl?.addEventListener('input', (event) => {
        drawerState.search = normalizeText(event.target.value);
        renderFilteredList();
    });

    sourceEl?.addEventListener('change', (event) => {
        drawerState.source = normalizeText(event.target.value) || 'all';
        renderFilteredList();
    });

    sortEl?.addEventListener('change', (event) => {
        drawerState.sort = normalizeText(event.target.value) || 'newest';
        renderFilteredList();
    });

    tabsEl?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-notif-status]');
        if (!btn) return;
        drawerState.status = normalizeText(btn.getAttribute('data-notif-status')) || 'all';
        tabsEl.querySelectorAll('.notif-drawer-status-tab').forEach(tab => tab.classList.remove('is-active'));
        btn.classList.add('is-active');
        renderFilteredList();
    });

    renderFilteredList();

    await window.app_refreshNotificationBell();
};



// Initialize notification system
export const initNotifications = () => {
    // No load-time init needed for notifications currently
    // app_refreshNotificationBell is called from initAppSetup
};


// Re-export window functions as local exports
export const app_refreshNotificationBell = window.app_refreshNotificationBell;
export const app_closeNotificationHistory = window.app_closeNotificationHistory;
export const app_recordNotifError = window.app_recordNotifError;
export const app_showLastNotifError = window.app_showLastNotifError;
export const app_markNotificationResponded = window.app_markNotificationResponded;
export const app_respondNotificationFromHistory = window.app_respondNotificationFromHistory;
export const app_openNotificationHistory = window.app_openNotificationHistory;
