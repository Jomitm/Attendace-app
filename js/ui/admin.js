/**
 * Admin Panel Component
 * Handles rendering of the administrative dashboard, performance trends, and staff management.
 */

import { safeHtml } from './helpers.js';
import { AppConfig } from '../config.js';

const ADMIN_MAX_OVERLAY_ID = 'admin-card-max-overlay';
const ADMIN_MAX_TITLE_ID = 'admin-card-max-title';
const ADMIN_MAX_BODY_ID = 'admin-card-max-body';
const ADMIN_CARD_MODE_TILE = 'tile';
const ADMIN_CARD_MODE_ORIGINAL = 'original';
const ADMIN_CARD_MODE_FULLSCREEN = 'fullscreen';
const ADMIN_CARD_MODES = new Set([ADMIN_CARD_MODE_TILE, ADMIN_CARD_MODE_ORIGINAL, ADMIN_CARD_MODE_FULLSCREEN]);

const ensureAdminMaxOverlay = () => {
    let overlay = document.getElementById(ADMIN_MAX_OVERLAY_ID);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = ADMIN_MAX_OVERLAY_ID;
        overlay.className = 'admin-max-overlay';
        overlay.innerHTML = `
            <div class="admin-max-window" role="dialog" aria-modal="true" aria-labelledby="${ADMIN_MAX_TITLE_ID}">
                <div class="admin-max-header">
                    <h2 id="${ADMIN_MAX_TITLE_ID}"></h2>
                    <button type="button" class="admin-max-close" onclick="window.app_closeAdminCardMaximize?.()" aria-label="Close maximized card">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="${ADMIN_MAX_BODY_ID}" class="admin-max-body"></div>
            </div>
        `;
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                window.app_closeAdminCardMaximize?.();
            }
        });
        document.body.appendChild(overlay);
    }

    if (!window.__adminMaxKeyHandlerBound) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && document.body.classList.contains('admin-max-open')) {
                window.app_closeAdminCardMaximize?.();
            }
        });
        window.__adminMaxKeyHandlerBound = true;
    }

    return overlay;
};

const setAdminBodyScrollLock = (isLocked) => {
    if (!document?.body) return;
    document.body.classList.toggle('admin-max-open', !!isLocked);
};

const closeAdminMaxOverlay = () => {
    const closingCardId = window._adminMaxCardId ? String(window._adminMaxCardId) : '';
    const overlay = document.getElementById(ADMIN_MAX_OVERLAY_ID);
    if (overlay) {
        overlay.classList.remove('open');
        overlay.remove();
    }

    const body = document.getElementById(ADMIN_MAX_BODY_ID);
    if (body) body.innerHTML = '';

    setAdminBodyScrollLock(false);

    const trigger = window._adminMaxTriggerEl;
    window._adminMaxTriggerEl = null;
    window._adminMaxCardId = null;
    if (closingCardId) {
        const cardEl = getAdminCardElementById(closingCardId);
        if (cardEl) {
            setAdminCardModeClass(cardEl, ADMIN_CARD_MODE_TILE);
            cardEl.dataset.adminCardMode = ADMIN_CARD_MODE_TILE;
        }
        if (window._adminCardModeState) {
            window._adminCardModeState[closingCardId] = ADMIN_CARD_MODE_TILE;
        }
    }
    if (trigger && typeof trigger.focus === 'function') {
        try { trigger.focus(); } catch { /* ignore */ }
    }
};

const openAdminMaxOverlay = (cardId, triggerEl = null) => {
    closeAdminMaxOverlay();
    const templates = window._adminCardTemplates || {};
    const template = templates[cardId];
    if (!template) return;

    const overlay = ensureAdminMaxOverlay();
    const titleEl = document.getElementById(ADMIN_MAX_TITLE_ID);
    const bodyEl = document.getElementById(ADMIN_MAX_BODY_ID);
    if (!titleEl || !bodyEl) return;

    titleEl.textContent = template.title || 'Admin Card';
    bodyEl.innerHTML = `<div class="admin-max-card-content" data-admin-card-max="${safeHtml(cardId)}">${template.expandedHtml || template.originalHtml || template.tileHtml || ''}</div>`;

    window._adminMaxTriggerEl = triggerEl;
    window._adminMaxCardId = cardId;

    setAdminBodyScrollLock(true);
    overlay.classList.add('open');

    const closeBtn = overlay.querySelector('.admin-max-close');
    if (closeBtn) {
        try { closeBtn.focus(); } catch { /* ignore */ }
    }
};

const getAdminCardElementById = (cardId) => {
    if (!cardId) return null;
    return document.querySelector(`.dashboard-admin-view .admin-card-compact[data-admin-card="${cardId}"]`);
};

const setAdminCardModeClass = (cardEl, mode) => {
    if (!cardEl) return;
    cardEl.classList.remove('admin-card-mode-tile', 'admin-card-mode-original');
    if (mode === ADMIN_CARD_MODE_ORIGINAL) {
        cardEl.classList.add('admin-card-mode-original');
        if (cardEl.dataset.adminOriginalFullWidth === '1') {
            cardEl.classList.add('full-width');
        }
    } else {
        cardEl.classList.add('admin-card-mode-tile');
        cardEl.classList.remove('full-width');
    }
};

const applyAdminCardMode = (cardId, mode, triggerEl = null) => {
    if (!ADMIN_CARD_MODES.has(mode)) return;
    const cards = document.querySelectorAll('.dashboard-admin-view .admin-card-compact[data-admin-card]');
    if (!cards.length) return;
    cards.forEach((card) => {
        const isTarget = card.getAttribute('data-admin-card') === String(cardId);
        const nextMode = isTarget ? mode : ADMIN_CARD_MODE_TILE;
        setAdminCardModeClass(card, nextMode);
        card.dataset.adminCardMode = nextMode;
    });
    window._adminCardModeState = window._adminCardModeState || {};
    window._adminCardModeState[cardId] = mode;
    window._adminActiveCardModeId = cardId;
    if (mode === ADMIN_CARD_MODE_FULLSCREEN) {
        openAdminMaxOverlay(cardId, triggerEl || getAdminCardElementById(cardId));
    } else {
        closeAdminMaxOverlay();
    }
};

const buildAdminOriginalTemplate = (compactHtml) => {
    return String(compactHtml || '')
        .replace(/<div[^>]*class="[^"]*admin-card-mode-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
};

if (typeof window !== 'undefined') {
    window.app_closeAdminCardFullscreen = closeAdminMaxOverlay;
    window.app_closeAdminCardMaximize = closeAdminMaxOverlay;
    window.app_toggleAdminCardMode = (cardId, mode = ADMIN_CARD_MODE_TILE, triggerEl = null) => {
        if (!cardId) return;
        const safeMode = ADMIN_CARD_MODES.has(mode) ? mode : ADMIN_CARD_MODE_TILE;
        const cardEl = getAdminCardElementById(cardId);
        const currentMode = String(cardEl?.dataset?.adminCardMode || ADMIN_CARD_MODE_TILE);
        if (currentMode === safeMode && safeMode !== ADMIN_CARD_MODE_TILE) {
            applyAdminCardMode(cardId, ADMIN_CARD_MODE_TILE, triggerEl || null);
            return;
        }
        if (safeMode === ADMIN_CARD_MODE_FULLSCREEN && window._adminMaxCardId === cardId) {
            closeAdminMaxOverlay();
            applyAdminCardMode(cardId, ADMIN_CARD_MODE_TILE);
            return;
        }
        applyAdminCardMode(cardId, safeMode, triggerEl || null);
    };
    window.app_toggleAdminCardMaximize = (cardId, triggerEl = null) => {
        window.app_toggleAdminCardMode?.(cardId, ADMIN_CARD_MODE_FULLSCREEN, triggerEl || null);
    };
}

export async function renderAdmin(auditStartDate = null, auditEndDate = null) {
    let allUsers = [];
    let pendingLeaves = [];
    let attendanceLogs = [];
    let performance = { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0], labels: [] };
    let audits = [];
    let simulationCleanupAudits = [];

    try {
        const today = new Date().toISOString().split('T')[0];
        auditStartDate = auditStartDate || today;
        auditEndDate = auditEndDate || today;

        const results = await Promise.allSettled([
            window.AppDB.getCached
                ? window.AppDB.getCached(window.AppDB.getCacheKey('adminUsers', 'users', {}), (AppConfig?.READ_CACHE_TTLS?.users || 60000), () => window.AppDB.getAll('users'))
                : window.AppDB.getAll('users'),
            window.AppAnalytics.getSystemPerformance(),
            window.AppDB.queryMany
                ? window.AppDB.queryMany('location_audits', [], { orderBy: [{ field: 'timestamp', direction: 'desc' }], limit: 300 }).catch(() => window.AppDB.getAll('location_audits'))
                : window.AppDB.getAll('location_audits'),
            window.AppLeaves.getPendingLeaves(),
            window.AppDB.queryMany
                ? window.AppDB.queryMany('system_audit_logs', [], { orderBy: [{ field: 'createdAt', direction: 'desc' }], limit: 80 }).catch(() => window.AppDB.getAll('system_audit_logs'))
                : window.AppDB.getAll('system_audit_logs')
        ]);

        const readSettled = (idx, fallback, label) => {
            const result = results[idx];
            if (result && result.status === 'fulfilled') return result.value;
            if (result && result.status === 'rejected') {
                console.warn(`Admin data fetch failed for ${label}:`, result.reason);
            }
            return fallback;
        };

        allUsers = readSettled(0, [], 'users');
        performance = readSettled(1, { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0], labels: [] }, 'performance');
        audits = readSettled(2, [], 'location_audits');
        pendingLeaves = readSettled(3, [], 'pending_leaves');
        simulationCleanupAudits = readSettled(4, [], 'system_audit_logs');

        audits = audits.filter(a => {
            const d = new Date(a.timestamp).toISOString().split('T')[0];
            return d >= auditStartDate && d <= auditEndDate;
        }).sort((a, b) => b.timestamp - a.timestamp);

        simulationCleanupAudits = (simulationCleanupAudits || [])
            .filter((row) => row && row.module === 'simulation' && String(row.type || '').startsWith('legacy_dummy_cleanup_'))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
            .slice(0, 25);

        const currentUser = window.AppAuth?.getUser?.();
        const currentAdmin = currentUser ? allUsers.find((user) => String(user.id) === String(currentUser.id)) || currentUser : null;
        const pendingNotifications = (Array.isArray(currentAdmin?.notifications) ? currentAdmin.notifications : [])
            .filter((notif) =>
                notif
                && notif.type === 'missed-checkout-reason'
                && String(notif.status || 'pending').toLowerCase() === 'pending'
                && notif.logId);
        const pendingLogIds = Array.from(new Set(
            pendingNotifications.map((notif) => String(notif.logId || '')).filter(Boolean)
        ));

        attendanceLogs = pendingLogIds.length
            ? (window.AppDB.getManyByIds
                ? await window.AppDB.getManyByIds('attendance', pendingLogIds)
                : (await Promise.all(pendingLogIds.map((id) => window.AppDB.get('attendance', id)))).filter(Boolean))
            : [];
    } catch (e) {
        console.error('Failed to fetch admin data', e);
    }

    const activeCount = allUsers.filter(u => u.status === 'in').length;
    const adminCount = allUsers.filter(u => u.role === 'Administrator' || u.isAdmin === true).length;
    const birthdayManagedCount = allUsers.filter(u => Number(u.birthMonth || 0) >= 1 && Number(u.birthDay || 0) >= 1).length;
    const upcomingBirthdayUsers = [...allUsers]
        .filter(u => Number(u.birthMonth || 0) >= 1)
        .sort((a, b) => {
            const aKey = `${String(Number(a.birthMonth || 99)).padStart(2, '0')}-${String(Number(a.birthDay || 99)).padStart(2, '0')}-${String(a.name || '').toLowerCase()}`;
            const bKey = `${String(Number(b.birthMonth || 99)).padStart(2, '0')}-${String(Number(b.birthDay || 99)).padStart(2, '0')}-${String(b.name || '').toLowerCase()}`;
            return aKey.localeCompare(bKey);
        })
        .slice(0, 5);
    const currentUser = window.AppAuth?.getUser?.();
    const currentAdmin = currentUser ? allUsers.find((user) => String(user.id) === String(currentUser.id)) || currentUser : null;
    const adminNotifications = Array.isArray(currentAdmin?.notifications) ? currentAdmin.notifications : [];
    const usersById = new Map(allUsers.map((user) => [String(user.id), user]));
    const missedCheckoutItems = (attendanceLogs || [])
        .filter((log) => log
            && log.missedCheckoutReasonRequired
            && log.missedCheckoutReasonSubmittedAt
            && String(log.missedCheckoutReasonStatus || '').toLowerCase() === 'pending')
        .map((log) => {
            const staff = usersById.get(String(log.user_id));
            const notification = adminNotifications.find((notif) =>
                notif
                && notif.type === 'missed-checkout-reason'
                && String(notif.logId || '') === String(log.id || '')
                && String(notif.status || 'pending').toLowerCase() === 'pending'
            );
            return {
                ...log,
                staffName: staff?.name || 'Staff',
                staffRole: staff?.role || 'Employee',
                notificationId: notification?.id || ''
            };
        })
        .sort((a, b) => new Date(b.missedCheckoutReasonSubmittedAt || b.systemClosedAt || b.date || 0) - new Date(a.missedCheckoutReasonSubmittedAt || a.systemClosedAt || a.date || 0));

    const formatCleanupSummary = (row) => {
        const payload = row && row.payload ? row.payload : {};
        const deleted = payload.deleted || {};
        const configuredTargets = payload.configuredTargets || {};

        if (row.type === 'legacy_dummy_cleanup_completed') {
            return [
                `users=${Number(deleted.users || 0)}`,
                `attendance=${Number(deleted.attendance || 0)}`,
                `leaves=${Number(deleted.leaves || 0)}`,
                `workPlans=${Number(deleted.workPlans || 0)}`
            ].join(', ');
        }

        if (row.type === 'legacy_dummy_cleanup_skipped') {
            const reason = payload.reason || 'unknown';
            const ids = Array.isArray(configuredTargets.ids) ? configuredTargets.ids.length : 0;
            const usernames = Array.isArray(configuredTargets.usernames) ? configuredTargets.usernames.length : 0;
            return `reason=${reason}, targetIds=${ids}, targetUsernames=${usernames}`;
        }

        if (row.type === 'legacy_dummy_cleanup_failed') {
            return String(payload.message || 'Unknown error');
        }

        return '-';
    };

    const renderDataManagementBlock = (isExpanded = false) => {
        const startId = isExpanded ? 'staff-reset-start-date-max' : 'staff-reset-start-date';
        const endId = isExpanded ? 'staff-reset-end-date-max' : 'staff-reset-end-date';
        const fromRead = `document.getElementById('${startId}')?.value || ''`;
        const toRead = `document.getElementById('${endId}')?.value || ''`;

        return `
            <p class="text-muted">Create a full backup before running a staff activity reset.</p>
            <div class="admin-data-actions">
                <button class="action-btn secondary" onclick="(typeof window.app_backupStaffData === 'function') ? window.app_backupStaffData() : alert('Backup tools are not loaded yet. Please refresh this page.')">
                    <i class="fa-solid fa-download"></i> Backup Staff Data
                </button>
                <button class="action-btn secondary" onclick="(typeof window.app_backupStaffDataCSV === 'function') ? window.app_backupStaffDataCSV() : alert('Backup tools are not loaded yet. Please refresh this page.')">
                    <i class="fa-solid fa-file-csv"></i> Backup Staff Data (CSV)
                </button>
            </div>
            <div class="admin-data-range">
                <label>
                    <span>From Date</span>
                    <input type="date" id="${startId}">
                </label>
                <label>
                    <span>To Date</span>
                    <input type="date" id="${endId}">
                </label>
                <button class="action-btn danger" onclick="(typeof window.app_resetStaffData === 'function') ? window.app_resetStaffData({ startDate: ${fromRead}, endDate: ${toRead} }) : alert('Reset tools are not loaded yet. Please refresh this page.')">
                    <i class="fa-solid fa-triangle-exclamation"></i> Reset Staff Data
                </button>
            </div>
            <div class="admin-card-note">
                Choose a date range to delete only that period. Keep both dates empty to reset all staff activity data. User accounts are always kept.
            </div>
        `;
    };

    const renderSecurityAuditsBlock = (isExpanded = false) => {
        const startId = isExpanded ? 'audit-start-max' : 'audit-start';
        const endId = isExpanded ? 'audit-end-max' : 'audit-end';
        const startRead = `document.getElementById('${startId}')?.value || ''`;
        const endRead = `document.getElementById('${endId}')?.value || ''`;
        return `
            <div class="admin-audit-filter-row">
                <input type="date" id="${startId}" value="${auditStartDate}" style="font-size:0.75rem;">
                <input type="date" id="${endId}" value="${auditEndDate}" style="font-size:0.75rem;">
                <button onclick="window.app_applyAuditFilter(${startRead}, ${endRead})" class="action-btn">Filter</button>
            </div>
            <div class="table-container ${isExpanded ? 'admin-table-expanded' : ''}">
                <table>
                    <thead><tr><th>Staff</th><th>Slot</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>
                        ${audits.length ? audits.map(a => `
                            <tr>
                                <td>${safeHtml(a.userName)}</td>
                                <td>${safeHtml(a.slot)}</td>
                                <td>${new Date(a.timestamp).toLocaleTimeString()}</td>
                                <td style="color:${a.status === 'Success' ? 'green' : 'red'}">${a.status}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" class="text-center">No audits found</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    };

    const renderSimulationAuditBlock = (isExpanded = false) => `
        <span class="text-muted" style="font-size:0.75rem;">Last ${simulationCleanupAudits.length} entries</span>
        <div class="table-container ${isExpanded ? 'admin-table-expanded' : ''}">
            <table>
                <thead><tr><th>Time</th><th>Event</th><th>Summary</th></tr></thead>
                <tbody>
                    ${simulationCleanupAudits.length ? simulationCleanupAudits.map(row => `
                        <tr>
                            <td>${new Date(Number(row.createdAt || 0)).toLocaleString()}</td>
                            <td>${safeHtml(row.type || '-')}</td>
                            <td>${safeHtml(formatCleanupSummary(row))}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="3" class="text-center">No simulation cleanup audit entries found</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    const renderStaffBlock = (isExpanded = false) => `
        <div class="admin-staff-head">
            <div class="admin-staff-head-actions">
                ${(window.app_isAdminUser?.() || window.app_canManageBirthdays?.()) ? `<button class="action-btn secondary" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Birthday Calendar</button>` : ''}
                ${window.app_hasPerm('users', 'admin') ? `<button class="action-btn" onclick="document.getElementById('add-user-modal').style.display='flex'"><i class="fa-solid fa-user-plus"></i> Add Staff</button>` : ''}
            </div>
        </div>
        <div class="table-container ${isExpanded ? 'admin-table-expanded' : ''} mobile-table-card">
            <table>
                <thead>
                    <tr><th>Staff Member</th><th>Status</th><th>In / Out</th><th>Role / Dept</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${allUsers.map(u => {
        const isLive = u.lastSeen && (Date.now() - u.lastSeen < 120000);
        return `
                        <tr>
                            <td>
                                <div class="admin-user-cell">
                                    <img src="${u.avatar}" class="admin-user-avatar">
                                    <div>
                                        <div class="admin-user-name-row">${safeHtml(u.name)} ${isLive ? '<span class="admin-user-live-tag">LIVE</span>' : ''}</div>
                                        <div class="admin-user-id">${safeHtml(u.username)}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="status-badge ${u.status === 'in' ? 'in' : 'out'}">${u.status?.toUpperCase()}</span></td>
                            <td>${u.lastCheckIn ? new Date(u.lastCheckIn).toLocaleTimeString() : '--'} / ${u.lastCheckOut ? new Date(u.lastCheckOut).toLocaleTimeString() : '--'}</td>
                            <td>${safeHtml(u.role)} / ${safeHtml(u.dept || '--')}</td>
                            <td>
                                <div class="admin-row-actions">
                                    <button onclick="window.app_viewLogs('${u.id}')" class="admin-icon-btn"><i class="fa-solid fa-list-check"></i></button>
                                    ${window.app_hasPerm('users', 'admin') ? `<button onclick="window.app_editUser('${u.id}')" class="admin-icon-btn"><i class="fa-solid fa-pen"></i></button>` : ''}
                                </div>
                            </td>
                        </tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    const pendingLeaveGroups = Array.from(
        (pendingLeaves || []).reduce((map, leave) => {
            const userId = String(leave?.userId || leave?.id || 'unknown');
            const existing = map.get(userId) || {
                userId,
                userName: leave?.userName || 'Staff',
                latestAppliedOn: leave?.appliedOn || leave?.startDate || '',
                totalDays: 0,
                requests: []
            };
            existing.userName = existing.userName || leave?.userName || 'Staff';
            existing.latestAppliedOn = [existing.latestAppliedOn, leave?.appliedOn, leave?.startDate]
                .filter(Boolean)
                .sort((a, b) => new Date(b) - new Date(a))[0] || existing.latestAppliedOn;
            existing.totalDays += Number(leave?.daysCount || 0);
            existing.requests.push(leave);
            map.set(userId, existing);
            return map;
        }, new Map()).values()
    ).sort((a, b) => new Date(b.latestAppliedOn || 0) - new Date(a.latestAppliedOn || 0));

    const formatPendingLeaveRange = (leave) => {
        const start = String(leave?.startDate || '').trim();
        const end = String(leave?.endDate || '').trim();
        if (!start && !end) return '--';
        if (start && end && start !== end) {
            return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
        }
        return new Date(start || end).toLocaleDateString();
    };

    const renderPendingLeavesBlock = (isExpanded = false) => pendingLeaveGroups.length === 0
        ? '<p class="text-muted">No pending requests.</p>'
        : `
            <div class="table-container ${isExpanded ? 'admin-table-expanded' : ''}">
                <table class="compact-table">
                    <thead>
                        <tr><th>Staff</th><th>Requests</th><th>Total Days</th></tr>
                    </thead>
                    <tbody>
                        ${pendingLeaveGroups.map((group) => `
                            <tr>
                                <td>
                                    <div style="font-weight:700; color:#0f172a;">${safeHtml(group.userName)}</div>
                                    <div class="text-muted" style="font-size:0.78rem;">${group.requests.length} request${group.requests.length === 1 ? '' : 's'}</div>
                                </td>
                                <td>
                                    <div style="display:flex; flex-direction:column; gap:0.7rem;">
                                        ${group.requests
        .sort((a, b) => new Date(b.appliedOn || b.startDate || 0) - new Date(a.appliedOn || a.startDate || 0))
        .map((l) => `
                                                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:0.7rem 0.8rem; background:rgba(248,250,252,0.92);">
                                                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem 0.9rem; align-items:center; margin-bottom:0.45rem;">
                                                        <span style="font-weight:700; color:#334155;">${safeHtml(formatPendingLeaveRange(l))}</span>
                                                        <span class="admin-leave-type-badge">${safeHtml(l.type)}</span>
                                                        <span style="font-size:0.78rem; color:#475569;">${safeHtml(String(l.daysCount || 0))} day${Number(l.daysCount || 0) === 1 ? '' : 's'}</span>
                                                    </div>
                                                    <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start; flex-wrap:wrap;">
                                                        <div class="text-muted" style="font-size:0.75rem;">
                                                            Applied ${safeHtml(l.appliedOn ? new Date(l.appliedOn).toLocaleDateString() : '--')}
                                                        </div>
                                                        <div class="admin-leave-actions">
                                                            ${window.app_hasPerm('leaves', 'admin') ? `
                                                                <button onclick="window.AppLeaves.updateLeaveStatus('${l.id}', 'Approved', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-success">Approve</button>
                                                                <button onclick="window.AppLeaves.updateLeaveStatus('${l.id}', 'Rejected', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-danger">Reject</button>
                                                            ` : '<span class="text-muted" style="font-size:0.7rem;">View Only</span>'}
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                    </div>
                                </td>
                                <td>${group.totalDays}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

    const renderMissedCheckoutBlock = (isExpanded = false) => missedCheckoutItems.length === 0
        ? '<p class="text-muted">No missed checkout reasons waiting for review.</p>'
        : `
            <div class="dashboard-tagged-list ${isExpanded ? 'admin-list-expanded' : ''}">
                ${missedCheckoutItems.map((log) => `
                    <div class="dashboard-tagged-item">
                        <div>
                            <div class="dashboard-tagged-title">${safeHtml(log.staffName)}</div>
                            <div class="dashboard-tagged-desc">${safeHtml(log.missedCheckoutReason || 'Reason not submitted yet.')}</div>
                            <div class="dashboard-tagged-meta">
                                ${safeHtml(log.date || '--')} | ${safeHtml(log.staffRole || 'Employee')}
                                ${log.missedCheckoutReasonSubmittedAt ? ` | Submitted ${safeHtml(new Date(log.missedCheckoutReasonSubmittedAt).toLocaleString())}` : ''}
                            </div>
                        </div>
                        <div class="dashboard-tagged-status">
                            <span class="dashboard-tagged-pill pending">Pending</span>
                            ${log.notificationId ? `
                                <div class="dashboard-tagged-actions">
                                    <button class="dashboard-tagged-btn accept" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(log.notificationId))}, "approved")'>Approve</button>
                                    <button class="dashboard-tagged-btn reject" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(log.notificationId))}, "rejected")'>Reject</button>
                                </div>
                            ` : '<span class="text-muted" style="font-size:0.7rem;">Notification sync pending</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    const renderBirthdayBlock = () => `
        <p class="text-muted">${birthdayManagedCount} staff with reminder-ready birthdays</p>
        <div style="display:flex; flex-direction:column; gap:0.55rem; margin-bottom:0.65rem;">
            ${upcomingBirthdayUsers.length
        ? upcomingBirthdayUsers.map((user) => `
                    <div style="display:flex; justify-content:space-between; gap:0.75rem; border:1px solid #fdba74; border-radius:12px; padding:0.7rem 0.8rem; background:rgba(255,255,255,0.72);">
                        <div>
                            <div style="font-weight:700; color:#7c2d12;">${safeHtml(user.name || 'Staff')}</div>
                            <div style="font-size:0.8rem; color:#9a3412;">${safeHtml(user.role || 'Employee')} / ${safeHtml(user.dept || 'General')}</div>
                        </div>
                        <div style="text-align:right; color:#9a3412; font-weight:700;">${safeHtml(String(user.birthDay || '--'))}/${safeHtml(String(user.birthMonth || '--'))}${user.birthYear ? `/${safeHtml(String(user.birthYear))}` : ''}</div>
                    </div>
                `).join('')
        : '<div style="color:#9a3412; font-size:0.85rem;">No birthdays saved yet.</div>'}
        </div>
        <button class="action-btn" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Open</button>
    `;

    const cards = [];
    const cardTemplates = {};

    const buildAdminCardModeControls = (id, title) => `
        <div class="admin-card-mode-controls" role="group" aria-label="${safeHtml(title)} view controls">
            <button type="button" class="admin-card-mode-btn admin-card-mode-btn-original" onclick="window.app_toggleAdminCardMode('${id}', 'original', this)" aria-label="Show original size ${safeHtml(title)}">
                <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
            </button>
            <button type="button" class="admin-card-mode-btn admin-card-mode-btn-fullscreen" onclick="window.app_toggleAdminCardMode('${id}', 'fullscreen', this)" aria-label="Show fullscreen ${safeHtml(title)}">
                <i class="fa-solid fa-expand"></i>
            </button>
        </div>
    `;

    const pushCard = ({ id, title, compactHtml, expandedHtml = '', className = '', accentClass = '' }) => {
        if (!id || !title) return;
        const controlsHtml = buildAdminCardModeControls(id, title);
        cardTemplates[id] = {
            title,
            tileHtml: `${controlsHtml}${compactHtml}`,
            originalHtml: `${controlsHtml}${buildAdminOriginalTemplate(compactHtml)}`,
            expandedHtml: expandedHtml || compactHtml
        };

        cards.push(`
            <section class="card admin-card-compact admin-card-mode-tile ${className} ${accentClass}" data-admin-card="${id}" data-admin-card-mode="tile" data-admin-original-full-width="0">
                <div class="admin-card-header-row">
                    <h3 class="admin-card-title">${safeHtml(title)}</h3>
                    ${buildAdminCardModeControls(id, title)}
                </div>
                <div class="admin-card-content">
                    ${compactHtml}
                </div>
            </section>
        `);
    };

    pushCard({
        id: 'staff-kpi',
        title: 'Staff Snapshot',
        className: 'admin-kpi-card',
        compactHtml: `
            <span class="admin-kpi-label">Total Registered Staff</span>
            <h2 class="admin-kpi-value">${allUsers.length}</h2>
            <div class="admin-kpi-grid">
                <div class="admin-kpi-pill">
                    <div class="admin-kpi-pill-value">${activeCount}</div>
                    <div class="admin-kpi-pill-label">Active</div>
                </div>
                <div class="admin-kpi-pill">
                    <div class="admin-kpi-pill-value">${adminCount}</div>
                    <div class="admin-kpi-pill-label">Admins</div>
                </div>
            </div>
        `
    });

    if (window.app_hasPerm('users', 'admin')) {
        pushCard({
            id: 'data-management',
            title: 'Data Management',
            className: 'admin-performance-card',
            accentClass: 'admin-card-accent-blue',
            compactHtml: renderDataManagementBlock(false),
            expandedHtml: renderDataManagementBlock(true)
        });
    }

    if (window.app_hasPerm('leaves', 'view')) {
        pushCard({
            id: 'pending-leaves',
            title: `Pending Leave Requests (${pendingLeaveGroups.length} staff / ${pendingLeaves.length} requests)`,
            className: 'admin-section-card',
            compactHtml: renderPendingLeavesBlock(false),
            expandedHtml: renderPendingLeavesBlock(true)
        });
    }

    if (window.app_hasPerm('dashboard', 'admin')) {
        pushCard({
            id: 'missed-checkout',
            title: `Missed Checkout Requests (${missedCheckoutItems.length})`,
            className: 'dashboard-tagged-card',
            compactHtml: renderMissedCheckoutBlock(false),
            expandedHtml: renderMissedCheckoutBlock(true)
        });
    }

    if ((window.app_isAdminUser?.() || window.app_canManageBirthdays?.())) {
        pushCard({
            id: 'birthday-calendar',
            title: 'Birthday Calendar',
            className: 'admin-performance-card',
            accentClass: 'admin-card-accent-amber',
            compactHtml: renderBirthdayBlock(),
            expandedHtml: renderBirthdayBlock()
        });
    }

    if (window.app_hasPerm('users', 'view')) {
        pushCard({
            id: 'staff-management',
            title: 'Staff Management',
            compactHtml: renderStaffBlock(false),
            expandedHtml: renderStaffBlock(true)
        });
    }

    pushCard({
        id: 'security-audits',
        title: 'Security Audits',
        compactHtml: renderSecurityAuditsBlock(false),
        expandedHtml: renderSecurityAuditsBlock(true)
    });

    pushCard({
        id: 'simulation-audit',
        title: 'Simulation Cleanup Audit (Debug)',
        compactHtml: renderSimulationAuditBlock(false),
        expandedHtml: renderSimulationAuditBlock(true)
    });

    window._adminCardTemplates = cardTemplates;
    window._adminCardModeState = {};

    // UI Handlers
    window.app_applyAuditFilter = async (startDate = '', endDate = '') => {
        const start = String(startDate || '').trim() || document.getElementById('audit-start')?.value || document.getElementById('audit-start-max')?.value;
        const end = String(endDate || '').trim() || document.getElementById('audit-end')?.value || document.getElementById('audit-end-max')?.value;
        const contentArea = document.getElementById('page-content');
        window.app_closeAdminCardMaximize?.();
        if (contentArea) contentArea.innerHTML = await renderAdmin(start, end);
    };

    window.app_refreshAdminPage = async () => {
        const start = document.getElementById('audit-start')?.value || document.getElementById('audit-start-max')?.value || auditStartDate;
        const end = document.getElementById('audit-end')?.value || document.getElementById('audit-end-max')?.value || auditEndDate;
        const contentArea = document.getElementById('page-content');
        window.app_closeAdminCardMaximize?.();
        if (contentArea) contentArea.innerHTML = await renderAdmin(start, end);
    };

    return `
        <div class="dashboard-grid dashboard-modern dashboard-admin-view admin-grid-compact">
            ${cards.join('')}
        </div>`;
}
