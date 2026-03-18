/**
 * Dashboard Component
 * Handles rendering of the main dashboard and its sub-widgets.
 */

import { safeHtml, safeUrl, timeAgo } from './helpers.js';
import { renderStarRating, renderTaskStatusBadge } from './common.js';
import { renderYearlyPlan } from './team-schedule.js';
import { AppConfig } from '../config.js';

// --- Local State for Dashboard ---

const teamActivityAutoScroll = {
    controllers: new WeakMap(),
    elements: new Set()
};

function getStaffActivityState() {
    if (!window.app_staffActivityState) {
        window.app_staffActivityState = {
            selectedMonth: new Date().toISOString().slice(0, 7),
            sortKey: 'date-desc',
            logs: []
        };
    }
    return window.app_staffActivityState;
}

let dashboardActionDelegatesBound = false;

function ensureDashboardActionDelegates() {
    if (dashboardActionDelegatesBound || typeof document === 'undefined') return;
    dashboardActionDelegatesBound = true;

    document.addEventListener('click', async (event) => {
        const btn = event.target && event.target.closest
            ? event.target.closest('.dashboard-leave-btn[data-action][data-leave-id]')
            : null;
        if (!btn) return;

        event.preventDefault();
        const action = String(btn.dataset.action || '');
        const leaveId = String(btn.dataset.leaveId || '');
        if (!leaveId) return;

        try {
            if (action === 'export') {
                if (window.AppLeaves?.exportLeave) await window.AppLeaves.exportLeave(leaveId);
                return;
            }
            if (action === 'comment') {
                if (window.AppLeaves?.commentLeave) await window.AppLeaves.commentLeave(leaveId);
                return;
            }
            if (action === 'approve' || action === 'reject') {
                const status = action === 'approve' ? 'Approved' : 'Rejected';
                if (window.AppLeaves?.updateLeaveStatus) await window.AppLeaves.updateLeaveStatus(leaveId, status);
                if (window.app_refreshCurrentPage) await window.app_refreshCurrentPage();
            }
        } catch (err) {
            console.error('Dashboard leave action failed:', err);
        }
    });
}

// --- Dashboard Components ---

export function renderHeroCard(heroData, heroMeta = {}) {
    if (!heroData) {
        return `
            <div class="card dashboard-hero-stats-card hero-slot">
                <div class="dashboard-hero-stats-head">
                    <div class="hero-label-badge">Hero of the Week</div>
                </div>
                <div class="dashboard-activity-empty">
                    ${heroMeta.lowRead ? 'Loading stats...' : 'No hero data available.'}
                </div>
            </div>`;
    }

    const { user, stats } = heroData;
    const daysPresent = Number(stats?.daysPresent ?? stats?.days ?? 0);
    const totalHours = Number(stats?.totalHours ?? stats?.hours ?? 0);
    const lateCount = Number(stats?.lateCount ?? stats?.late ?? 0);
    const isNew = heroMeta.source === 'generated';

    return `
        <div class="card dashboard-hero-stats-card hero-slot ${isNew ? 'is-new-summary' : ''}">
            <div class="dashboard-hero-stats-head">
                <div class="hero-label-badge">Hero of the Week</div>
                ${heroMeta.generatedAt ? `<span class="hero-sync-time" title="Source: ${heroMeta.source}">Synced ${timeAgo(heroMeta.generatedAt)}</span>` : ''}
            </div>
            <div class="dashboard-hero-stats-body">
                <div class="hero-profile">
                    <img src="${safeUrl(user.avatar)}" alt="${safeHtml(user.name)}" class="hero-avatar">
                    <div class="hero-info">
                        <div class="hero-name">${safeHtml(user.name)}</div>
                        <div class="hero-role">${safeHtml(user.role || 'Staff')}</div>
                    </div>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <div class="hero-metric-value">${daysPresent}</div>
                        <div class="hero-metric-label">Days</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${totalHours}h</div>
                        <div class="hero-metric-label">Hours</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${lateCount}</div>
                        <div class="hero-metric-label">Lates</div>
                    </div>
                </div>
            </div>
        </div>`;
}

export function renderWorkLog(logs, collabs = [], targetStaff = null, minutes = []) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 180);
    const startDefault = startDate.toISOString().split('T')[0];
    const endDefault = today.toISOString().split('T')[0];
    const targetUserId = targetStaff ? targetStaff.id : window.AppAuth.getUser().id;
    const workLogStaffName = (targetStaff && targetStaff.name) || window.AppAuth.getUser().name;

    return `
        <div class="card dashboard-worklog-card">
            <div class="dashboard-worklog-head">
                 <h4>Work Log <span class="dashboard-worklog-staff">(${safeHtml(workLogStaffName)})</span></h4>
                 <span>Ongoing & Historical Tasks</span>
            </div>
             <div class="dashboard-worklog-filter-row">
                <input type="date" id="act-start" value="${startDefault}" class="dashboard-worklog-date-input">
                <span class="dashboard-worklog-to">to</span>
                <input type="date" id="act-end" value="${endDefault}" class="dashboard-worklog-date-input">
                <button onclick="window.app_filterActivity()" class="dashboard-worklog-go-btn">Go</button>
            </div>
            <div id="activity-list" class="dashboard-worklog-list">
                ${renderActivityList(logs, startDefault, endDefault, targetUserId, collabs, minutes)}
            </div>
        </div>
    `;
}

export function renderActivityList(allLogs, startStr, endStr, targetStaffId, collabs = [], minutes = []) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);

    const logEntries = allLogs.filter(l => {
        const d = new Date(l.date);
        const desc = l.workDescription || (l.location && !l.location.startsWith('Lat:') ? l.location : 'Standard Activity');
        l._displayDesc = desc;
        l._isCollab = false;
        l._sortTime = l.checkOut || '00:00';
        return d >= start && d <= end;
    });

    const collabEntries = [];
    collabs.forEach(cp => {
        const cpDate = new Date(cp.date);
        if (cpDate < start || cpDate > end) return;
        const dailyCollabPlans = cp.plans.filter(p => p.tags && p.tags.some(t => t.id === targetStaffId && t.status === 'accepted'));
        dailyCollabPlans.forEach(p => {
            collabEntries.push({
                date: cp.date,
                workDescription: `🤝 Collaborated with ${cp.userName}: ${p.task}${p.subPlans && p.subPlans.length > 0 ? ` (Sub-tasks: ${p.subPlans.join(', ')})` : ''}`,
                checkOut: 'Planned / Accepted',
                _displayDesc: `🤝 Collaborated with ${cp.userName}: ${p.task}${p.subPlans && p.subPlans.length > 0 ? ` (Sub-tasks: ${p.subPlans.join(', ')})` : ''}`,
                _isCollab: true,
                _sortTime: '23:59'
            });
        });
    });

    const minuteEntries = [];
    minutes.forEach(m => {
        (m.actionItems || []).forEach(ai => {
            if (ai.assignedTo !== targetStaffId) return;
            const aiDate = ai.dueDate || m.date; // Use due date if available, else meeting date
            const d = new Date(aiDate);
            if (d < start || d > end) return;

            minuteEntries.push({
                date: aiDate,
                workDescription: `📋 Meeting Task: ${ai.task} (from ${m.title})`,
                status: ai.status || 'pending',
                checkOut: 'Action Item',
                _displayDesc: `📋 Meeting Task: ${ai.task} (from ${m.title})`,
                _isCollab: false,
                _isMinute: true,
                _meetingId: m.id,
                _sortTime: '09:00' // Show at start of day
            });
        });
    });

    const merged = [...logEntries, ...collabEntries, ...minuteEntries].sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b._sortTime.localeCompare(a._sortTime);
    });

    if (merged.length === 0) return '<div class="dashboard-activity-empty">No activity descriptions found.</div>';

    let html = '';
    let lastDate = '';
    const currentUser = window.AppAuth.getUser();
    const isAdminUser = window.app_hasPerm('dashboard', 'admin', currentUser);

    merged.forEach(log => {
        const showDate = log.date !== lastDate;
        if (showDate) {
            html += `<div class="dashboard-activity-date">${log.date}</div>`;
            lastDate = log.date;
        }
        const borderColor = log._isCollab ? '#10b981' : (log._isMinute ? '#6366f1' : '#e5e7eb');
        const collabClass = log._isCollab ? 'dashboard-activity-item-collab' : (log._isMinute ? 'dashboard-activity-item-minute' : '');
        const progressMeta = renderProgressMeta(log);
        let statusBadge = '';
        if (log._isCollab || log.status || log._isMinute) {
            const status = window.AppCalendar ? window.AppCalendar.getSmartTaskStatus(log.date, log.status) : (log.status || 'to-be-started');
            statusBadge = `
                <div class="dashboard-activity-status-row">
                    ${renderTaskStatusBadge(status)}
                    ${isAdminUser || log._isMinute ? `<div class="dashboard-activity-edit-wrap"><button onclick="${log._isMinute ? `window.app_openMinuteDetails('${log._meetingId}')` : `window.app_openDayPlan('${log.date}', '${targetStaffId}')`}" class="dashboard-activity-edit-btn" title="View/Edit"><i class="fa-solid fa-${log._isMinute ? 'eye' : 'pen-to-square'}"></i></button></div>` : ''}
                </div>`;
        }
        html += `<div class="dashboard-activity-item ${collabClass}" style="border-left-color:${borderColor};"><div class="dashboard-activity-desc">${safeHtml(log._displayDesc)}</div>${progressMeta}${statusBadge}<div class="dashboard-activity-meta">${safeHtml(log.checkOut || (log.status === 'completed' ? 'Completed' : 'Planned Activity'))}</div></div>`;
    });
    return html;
}

export function renderActivityLog(allStaffLogs) {
    const state = getStaffActivityState();
    state.logs = Array.isArray(allStaffLogs) ? allStaffLogs : [];

    // Defer side effects
    setTimeout(() => {
        const list = document.getElementById('staff-activity-list');
        if (list) initTeamActivityAutoScroll(list);
    }, 0);

    const monthOptions = buildStaffActivityMonthOptions(8);
    const selectedMonthLabel = formatMonthLabel(state.selectedMonth);

    return `
        <div class="card dashboard-team-activity-card">
            <div class="dashboard-team-activity-head">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <h4>Team Activity</h4>
                    <button onclick="window.app_expandTeamActivity()" title="Expand" style="background:none; border:none; cursor:pointer; color:#6b7280;"><i class="fa-solid fa-expand"></i></button>
                </div>
                <span id="staff-activity-range-label">${safeHtml(selectedMonthLabel)}</span>
            </div>
            <div class="dashboard-team-activity-filters dashboard-team-activity-filters-compact">
                <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value)">
                    ${monthOptions.map(opt => `<option value="${opt.key}" ${opt.key === state.selectedMonth ? 'selected' : ''}>${safeHtml(opt.label)}</option>`).join('')}
                </select>
                <select class="dashboard-team-select" onchange="window.app_setStaffActivitySort(this.value)">
                    <option value="date-desc" ${state.sortKey === 'date-desc' ? 'selected' : ''}>Date (Newest)</option>
                    <option value="date-asc" ${state.sortKey === 'date-asc' ? 'selected' : ''}>Date (Oldest)</option>
                    <option value="completed-first" ${state.sortKey === 'completed-first' ? 'selected' : ''}>Completed First</option>
                    <option value="incomplete-first" ${state.sortKey === 'incomplete-first' ? 'selected' : ''}>Incomplete First</option>
                    <option value="status-priority" ${state.sortKey === 'status-priority' ? 'selected' : ''}>Status Priority</option>
                    <option value="staff-asc" ${state.sortKey === 'staff-asc' ? 'selected' : ''}>Staff (A-Z)</option>
                    <option value="staff-desc" ${state.sortKey === 'staff-desc' ? 'selected' : ''}>Staff (Z-A)</option>
                </select>
            </div>
            <div id="staff-activity-list" class="dashboard-team-activity-list dashboard-team-activity-list-split">
                ${renderStaffActivityListSplit(state.logs, state.sortKey)}
            </div>
        </div>`;
}

export function renderStaffActivityListSplit(allLogs, sortKey) {
    const normalized = normalizeStaffActivityLogs(allLogs);
    if (normalized.length === 0) {
        return '<div class="dashboard-activity-empty">No team activities found for the selected month.</div>';
    }
    const sorted = sortStaffActivityLogs(normalized, sortKey);
    const completed = sorted.filter(log => log._taskStatus === 'completed');
    const incomplete = sorted.filter(log => log._taskStatus !== 'completed');
    return `
        <div class="dashboard-team-activity-split-grid">
            ${renderStaffActivityColumn('Completed', completed, 'No completed tasks in this month.')}
            ${renderStaffActivityColumn('In Progress / Incomplete', incomplete, 'No in-progress or incomplete tasks in this month.')}
        </div>
    `;
}

export function renderStaffActivityColumn(title, logs, emptyMsg) {
    const currentUser = window.AppAuth.getUser();
    const isAdminUser = window.app_hasPerm('dashboard', 'admin', currentUser);
    const body = logs.length === 0
        ? `<div class="dashboard-activity-empty">${emptyMsg}</div>`
        : logs.map(log => {
            const isOwner = currentUser && log.userId === currentUser.id;
            const canEdit = isAdminUser || isOwner;
            const progressMeta = renderProgressMeta(log);
            const statusBadge = `
                <div class="dashboard-activity-status-row">
                    ${renderTaskStatusBadge(log._taskStatus)}
                    ${canEdit ? `<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${log.date}', '${log.userId || ''}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>` : ''}
                </div>`;
            return `
                <div class="dashboard-staff-activity-item dashboard-staff-activity-item-compact">
                    <div class="dashboard-staff-name">${safeHtml(log.staffName || 'Unknown Staff')}<span class="dashboard-team-activity-item-date">${log.date || ''}</span></div>
                    <div class="dashboard-activity-desc dashboard-staff-activity-desc">${safeHtml(log._displayDesc || 'Work Plan Task')}</div>
                    ${progressMeta}
                    ${statusBadge}
                    <div class="dashboard-activity-meta">${log._taskStatus === 'completed' ? 'Completed' : 'Work Plan'}</div>
                </div>`;
        }).join('');
    return `
        <div class="dashboard-team-activity-col">
            <div class="dashboard-team-activity-col-head">
                <span>${safeHtml(title)}</span>
                <span class="dashboard-team-activity-count">${logs.length}</span>
            </div>
            <div class="dashboard-team-activity-col-list">${body}</div>
        </div>
    `;
}

function renderProgressMeta(log) {
    if (!log) return '';
    const hasPercent = Number.isFinite(Number(log.progressPercent));
    const status = log.progressStatus ? String(log.progressStatus).replace(/_/g, ' ') : '';
    const note = String(log.progressNote || '').trim();
    if (!hasPercent && !status && !note && Array.isArray(log.taskUpdates) && log.taskUpdates.length > 0) {
        const first = log.taskUpdates[0] || {};
        const derivedPercent = Number.isFinite(Number(first.progressPercent)) ? `${Number(first.progressPercent)}%` : '';
        const derivedStatus = first.progressStatus ? String(first.progressStatus).replace(/_/g, ' ') : '';
        const derivedNote = String(first.progressNote || '').trim();
        if (!derivedPercent && !derivedStatus && !derivedNote) return '';
        const derivedTitle = derivedNote ? ` title="${safeHtml(derivedNote)}"` : '';
        const derivedLabel = `${derivedPercent}${derivedPercent && derivedStatus ? ' • ' : ''}${safeHtml(derivedStatus)}`;
        return `<div class="dashboard-progress-chip"${derivedTitle}>${derivedLabel}</div>`;
    }
    if (!hasPercent && !status && !note) return '';
    const percent = hasPercent ? `${Number(log.progressPercent)}%` : '';
    const title = note ? ` title="${safeHtml(note)}"` : '';
    const label = `${percent}${percent && status ? ' • ' : ''}${safeHtml(status)}`;
    return `<div class="dashboard-progress-chip"${title}>${label}</div>`;
}

export function renderStatsCard(title, subtitle, statsObj, statType = '') {
    const penaltyDays = Number(statsObj.penalty ?? statsObj.penaltyLeaves ?? 0);
    const penaltyBadge = penaltyDays > 0
        ? `<span class="dashboard-penalty-badge">Penalty Applies</span>`
        : '';
    const dataAttr = statType ? ` data-stats-type="${safeHtml(statType)}"` : '';
    return `
        <div class="card dashboard-stats-card" ${dataAttr} role="button" tabindex="0" aria-label="Open ${safeHtml(title)} details">
            <div class="dashboard-stats-card-head">
                <div>
                    <h4 class="dashboard-stats-card-title">${safeHtml(title)}</h4>
                    <span class="dashboard-stats-card-subtitle">${safeHtml(subtitle)}</span>
                </div>
                ${penaltyBadge}
            </div>

            <div class="dashboard-stats-metric-grid">
                 <div class="dashboard-stats-metric dashboard-stats-metric-late">
                    <div class="dashboard-stats-metric-value">${safeHtml(statsObj.totalLateDuration)}</div>
                    <div class="dashboard-stats-metric-label">Late</div>
                 </div>
                 <div class="dashboard-stats-metric dashboard-stats-metric-extra">
                    <div class="dashboard-stats-metric-value">${safeHtml(statsObj.totalExtraDuration)}</div>
                    <div class="dashboard-stats-metric-label">Extra</div>
                 </div>
            </div>

            <div class="dashboard-breakdown-grid">
                ${renderBreakdown(statsObj.breakdown)}
            </div>
        </div>
    `;
}

export function renderBreakdown(breakdown) {
    const items = Object.entries(breakdown);
    const meta = {
        'Present': { color: '#166534', bg: '#f0fdf4', label: 'Office' },
        'Work - Home': { color: '#0369a1', bg: '#e0f2fe', label: 'WFH' },
        'Training': { color: '#4338ca', bg: '#eef2ff', label: 'Training' },
        'Late': { color: '#c2410c', bg: '#fff7ed', label: 'Late' },
        'Sick Leave': { color: '#991b1b', bg: '#fef2f2', label: 'Sick' },
        'Casual Leave': { color: '#9d174d', bg: '#fce7f3', label: 'Casual' },
        'Earned Leave': { color: '#be185d', bg: '#fdf2f8', label: 'Earned' },
        'Paid Leave': { color: '#be123c', bg: '#ffe4e6', label: 'Paid' },
        'Maternity Leave': { color: '#a21caf', bg: '#fae8ff', label: 'Maternity' },
        'Absent': { color: '#7f1d1d', bg: '#fee2e2', label: 'Absent' },
        'Early Departure': { color: '#991b1b', bg: '#fff1f2', label: 'Early Exit' },
        'Holiday': { color: '#1e293b', bg: '#f1f5f9', label: 'Holiday' },
        'National Holiday': { color: '#334155', bg: '#f8fafc', label: 'Nat. Hol' },
        'Regional Holidays': { color: '#475569', bg: '#f8fafc', label: 'Reg. Hol' }
    };

    return items.map(([key, count]) => {
        const style = meta[key] || { color: '#374151', bg: '#f3f4f6', label: key };
        if (count === 0 && !['Present', 'Late', 'Absent', 'Early Departure'].includes(key)) return '';

        return `
            <div class="dashboard-breakdown-item" style="background:${style.bg};">
                <span class="dashboard-breakdown-count" style="color:${style.color}">${count}</span>
                <span class="dashboard-breakdown-label" style="color:${style.color};">${style.label}</span>
            </div>
         `;
    }).join('');
}

function attachStatsCardHandlers() {
    document.querySelectorAll('.dashboard-stats-card[data-stats-type]').forEach(card => {
        if (card.dataset.bound === '1') return;
        card.dataset.bound = '1';
        const type = card.getAttribute('data-stats-type') || '';
        card.addEventListener('click', () => {
            if (window.app_openStatsDetailModal) window.app_openStatsDetailModal(type);
        });
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (window.app_openStatsDetailModal) window.app_openStatsDetailModal(type);
            }
        });
    });
}

function parseTimeToMinutesLocal(value) {
    const raw = String(value || '').trim();
    if (!raw || raw.toLowerCase().includes('active')) return null;
    const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3] ? match[3].toUpperCase() : '';
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return (hours * 60) + minutes;
}

function buildStatsDetailBuckets(logs, range) {
    const buckets = {
        late: new Set(),
        early: new Set(),
        extra: new Set(),
        breakdown: {
            'Present': new Set(),
            'Work - Home': new Set(),
            'Training': new Set(),
            'Sick Leave': new Set(),
            'Casual Leave': new Set(),
            'Earned Leave': new Set(),
            'Paid Leave': new Set(),
            'Maternity Leave': new Set(),
            'Absent': new Set(),
            'Holiday': new Set(),
            'National Holiday': new Set(),
            'Regional Holidays': new Set(),
            'Late': new Set(),
            'Early Departure': new Set()
        }
    };

    const startDate = range?.start ? new Date(range.start) : new Date('1970-01-01');
    const endDate = range?.end ? new Date(range.end) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let canonical = Array.isArray(logs) ? logs : [];
    if (window.AppAnalytics && window.AppAnalytics.pickBestAttendanceLogPerDay) {
        try {
            canonical = window.AppAnalytics.pickBestAttendanceLogPerDay(canonical, startDate, endDate);
        } catch (err) {
            console.warn('pickBestAttendanceLogPerDay failed', err);
        }
    } else {
        const byDate = new Map();
        canonical.forEach(log => {
            const key = log.date || '';
            if (!key) return;
            if (!byDate.has(key)) byDate.set(key, log);
        });
        canonical = Array.from(byDate.values());
    }

    const lateCutoff = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_CUTOFF_MINUTES : 555) || 555;
    const earlyDeparture = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.EARLY_DEPARTURE_MINUTES : 1020) || 1020;

    canonical.forEach(log => {
        const logDate = log.date ? new Date(log.date) : null;
        if (!logDate || Number.isNaN(logDate.getTime())) return;
        if (logDate < startDate || logDate > endDate) return;
        const dateStr = log.date;
        const type = String(log.type || '');
        const inMinutes = parseTimeToMinutesLocal(log.checkIn);
        const outMinutes = parseTimeToMinutesLocal(log.checkOut);

        const isManual = log.isManualOverride === true;
        const isLateCountable = log.lateCountable === true || (!Object.prototype.hasOwnProperty.call(log, 'lateCountable') && inMinutes !== null && inMinutes > lateCutoff);
        if (isLateCountable) {
            buckets.late.add(dateStr);
            buckets.breakdown['Late'].add(dateStr);
        }
        if (!isManual) {
            if (outMinutes !== null && outMinutes < earlyDeparture && !String(type).includes('Leave') && type !== 'Absent') {
                buckets.early.add(dateStr);
                buckets.breakdown['Early Departure'].add(dateStr);
            }
        } else if (type === 'Early Departure') {
            buckets.early.add(dateStr);
            buckets.breakdown['Early Departure'].add(dateStr);
        }

        const storedExtraMinutes = typeof log.extraWorkedMs === 'number'
            ? Math.max(0, Math.round(log.extraWorkedMs / (1000 * 60)))
            : 0;
        const allowExtra = !(log.autoCheckout && !log.autoCheckoutExtraApproved);
        const hasExtra = storedExtraMinutes > 0 || (allowExtra && ((inMinutes !== null && inMinutes < lateCutoff) || (outMinutes !== null && outMinutes > earlyDeparture)));
        if (hasExtra) buckets.extra.add(dateStr);

        if (type === 'Work - Home') buckets.breakdown['Work - Home'].add(dateStr);
        else if (type === 'Training') buckets.breakdown['Training'].add(dateStr);
        else if (type === 'Sick Leave') buckets.breakdown['Sick Leave'].add(dateStr);
        else if (type === 'Casual Leave') buckets.breakdown['Casual Leave'].add(dateStr);
        else if (type === 'Earned Leave') buckets.breakdown['Earned Leave'].add(dateStr);
        else if (type === 'Paid Leave') buckets.breakdown['Paid Leave'].add(dateStr);
        else if (type === 'Maternity Leave') buckets.breakdown['Maternity Leave'].add(dateStr);
        else if (type === 'Absent') buckets.breakdown['Absent'].add(dateStr);
        else if (type === 'National Holiday') buckets.breakdown['National Holiday'].add(dateStr);
        else if (type === 'Regional Holidays') buckets.breakdown['Regional Holidays'].add(dateStr);
        else if (String(type).includes('Holiday')) buckets.breakdown['Holiday'].add(dateStr);
        else if (log.checkIn) buckets.breakdown['Present'].add(dateStr);
    });

    const toSortedArray = (set) => Array.from(set || []).sort((a, b) => new Date(a) - new Date(b));
    return {
        late: toSortedArray(buckets.late),
        early: toSortedArray(buckets.early),
        extra: toSortedArray(buckets.extra),
        breakdown: Object.fromEntries(Object.entries(buckets.breakdown).map(([k, v]) => [k, toSortedArray(v)]))
    };
}

export function renderLeaveRequests(leaves) {
    if (!leaves || leaves.length === 0) {
        return `
            <div class="card dashboard-leave-requests-card">
                <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
                <div class="dashboard-leave-requests-list">
                    <div class="dashboard-activity-empty">No pending leave requests.</div>
                </div>
            </div>`;
    }

    return `
        <div class="card dashboard-leave-requests-card">
            <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
            <div class="dashboard-leave-requests-list">
                ${leaves.slice(0, 5).map(l => `
                    <div class="dashboard-leave-row">
                        <div class="dashboard-leave-info">
                            <div class="dashboard-leave-name">${safeHtml(l.userName || 'Staff')}</div>
                            <div class="dashboard-leave-type">${safeHtml(l.type)} • ${l.daysCount} days</div>
                            <div class="dashboard-leave-date">${l.startDate} to ${l.endDate}</div>
                        </div>
                        <div class="dashboard-leave-actions">
                            <button class="dashboard-leave-btn export" data-action="export" data-leave-id="${l.id}" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                            <button class="dashboard-leave-btn comment" data-action="comment" data-leave-id="${l.id}" title="Add Comment"><i class="fa-solid fa-comment-dots"></i></button>
                            <button class="dashboard-leave-btn approve" data-action="approve" data-leave-id="${l.id}" title="Approve"><i class="fa-solid fa-check"></i></button>
                            <button class="dashboard-leave-btn reject" data-action="reject" data-leave-id="${l.id}" title="Reject"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${leaves.length > 5 ? `<div class="dashboard-leave-footer"><button onclick="window.location.hash = 'leaves'">View all ${leaves.length} requests</button></div>` : ''}
        </div>`;
}

export function renderLeaveHistory(leaves, options = {}) {
    const title = options.title || 'Leave History';
    const subtitle = options.subtitle || 'Past records';

    if (!leaves || leaves.length === 0) {
        return `
            <div class="card dashboard-leave-history-card">
                <div class="dashboard-leave-history-head"><h4>${safeHtml(title)}</h4><span>${safeHtml(subtitle)}</span></div>
                <div class="dashboard-activity-empty">No leave history found.</div>
            </div>`;
    }

    const statusColor = (status) => {
        if (status === 'Approved') return '#166534';
        if (status === 'Rejected') return '#b91c1c';
        return '#854d0e';
    };

    return `
        <div class="card dashboard-leave-history-card">
            <div class="dashboard-leave-history-head">
                <h4>${safeHtml(title)}</h4>
                <span>${safeHtml(subtitle)}</span>
            </div>
            <div class="dashboard-leave-history-list">
                ${leaves.map(l => `
                    <div class="dashboard-leave-history-row">
                        <div class="dashboard-leave-history-main">
                            <div class="dashboard-leave-history-user">${safeHtml(l.userName || 'Staff')}</div>
                            <div class="dashboard-leave-history-type">${safeHtml(l.type)} • ${l.daysCount} days</div>
                            <div class="dashboard-leave-history-date">${l.startDate} to ${l.endDate}</div>
                        </div>
                        <div class="dashboard-leave-history-status">
                            <span class="status-pill" style="background: ${statusColor(l.status)}15; color: ${statusColor(l.status)}">${safeHtml(l.status)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

// Notifications are now exclusively inside the bell icon panel.
// This function intentionally returns '' to keep the dashboard clean.
// Only @mention / tag items (renderTaggedItems) are shown on the dashboard as they require action.
export function renderNotificationPanel(_notifications, _history) {
    return '';
}

export function renderTaggedItems(notifications) {
    const tagged = (notifications || []).filter(n => {
        if (!(n.type === 'tag' || n.type === 'task' || n.type === 'mention')) return false;
        if (n.dismissedAt || n.read) return false;
        const status = String(n.status || 'pending').toLowerCase();
        return status === 'pending';
    });
    if (tagged.length === 0) return '';
    return `
        <div class="card full-width dashboard-tagged-card">
            <div class="dashboard-tagged-head"><h4>Tagged Items</h4><span>Pending approvals</span></div>
            <div class="dashboard-tagged-list">
                ${tagged.map(n => `
                    <div class="dashboard-tagged-item">
                        <div class="dashboard-tagged-main">
                            <div class="dashboard-tagged-title">${safeHtml(n.title || 'Tagged item')}</div>
                            <div class="dashboard-tagged-desc">${safeHtml(n.description || n.message || '')}</div>
                            <div class="dashboard-tagged-meta">Tagged by ${safeHtml(n.taggedByName || 'Staff')} • ${timeAgo(n.taggedAt || n.date)}</div>
                        </div>
                        <div class="dashboard-tagged-status">
                            <span class="dashboard-tagged-pill ${n.status || 'pending'}">${(n.status || 'pending').toUpperCase()}</span>
                            ${n.status === 'pending' ? `
                                <div class="dashboard-tagged-actions">
                                    ${n.planId ? `
                                        <button class="dashboard-tagged-btn accept" onclick="window.app_handleTagResponse('${n.planId}', ${n.taskIndex}, 'accepted', ${notifications.indexOf(n)})">Approve</button>
                                        <button class="dashboard-tagged-btn reject" onclick="window.app_handleTagResponse('${n.planId}', ${n.taskIndex}, 'rejected', ${notifications.indexOf(n)})">Reject</button>
                                    ` : `
                                        <button class="dashboard-tagged-btn accept" onclick="window.app_handleTagDecision('${n.id}', 'accepted')">Approve</button>
                                        <button class="dashboard-tagged-btn reject" onclick="window.app_handleTagDecision('${n.id}', 'rejected')">Reject</button>
                                    `}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function renderStaffDirectory(allUsers, notifications, currentUser) {
    if (!allUsers || allUsers.length === 0) {
        return `
            <div class="card dashboard-staff-directory-card">
                <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Quick actions</span></div>
                <div class="dashboard-staff-directory-list">
                    <div class="dashboard-activity-empty">No staff loaded.</div>
                </div>
            </div>`;
    }

    const nowMs = Date.now();
    const getNewestNotifTime = (u) => {
        const items = (u.notifications || []).map(n => new Date(n.taggedAt || n.date || n.respondedAt || 0).getTime()).filter(Boolean);
        return items.length ? Math.max(...items) : 0;
    };

    const staffList = allUsers
        .filter(u => u.id !== currentUser.id)
        .sort((a, b) => getNewestNotifTime(b) - getNewestNotifTime(a) || a.name.localeCompare(b.name))
        .map(u => {
            const newest = getNewestNotifTime(u);
            const isNew = newest && (nowMs - newest < 120000);
            return `
                <div class="dashboard-staff-row ${isNew ? 'dashboard-staff-row-new' : ''}">
                    <div class="dashboard-staff-meta">
                        <div class="dashboard-staff-avatar">
                            <img src="${safeUrl(u.avatar)}" alt="${safeHtml(u.name)}">
                        </div>
                        <div class="dashboard-staff-text">
                            <div class="dashboard-staff-name">${safeHtml(u.name)}</div>
                            <div class="dashboard-staff-role">${safeHtml(u.role || 'Staff')}</div>
                        </div>
                    </div>
                    <div class="dashboard-staff-actions">
                        <button class="dashboard-staff-btn" onclick="window.location.hash = 'staff-directory'; window.app_openStaffThread('${u.id}')" title="Message"><i class="fa-solid fa-message"></i></button>
                    </div>
                </div>
            `;
        }).join('');

    return `
        <div class="card dashboard-staff-directory-card">
            <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Message or assign</span></div>
            <div class="dashboard-staff-directory-list">
                ${staffList}
            </div>
        </div>`;
}

export async function renderDashboard() {
    const user = window.AppAuth.getUser();
    const isAdmin = window.app_hasPerm('dashboard', 'view', user);
    const isFullAdmin = window.app_hasPerm('dashboard', 'admin', user);
    const staffActivityState = getStaffActivityState();
    const selectedMonth = staffActivityState.selectedMonth;
    const dateKeys = window.AppDB?.getISTDateKeys ? window.AppDB.getISTDateKeys() : {
        todayKey: new Date().toISOString().split('T')[0],
        yesterdayKey: new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    };
    const todayStr = dateKeys.todayKey;
    const yesterdayStr = dateKeys.yesterdayKey;
    const sharedSummaryEnabled = !!AppConfig?.READ_OPT_FLAGS?.FF_SHARED_DAILY_SUMMARY;

    const targetStaffId = (isAdmin && window.app_selectedSummaryStaffId) ? window.app_selectedSummaryStaffId : user.id;

    console.time('DashboardFetch');
    const heroPromise = sharedSummaryEnabled
        ? Promise.resolve(null)
        : window.AppDB.getOrGenerateSummary(
            `hero_stats_${todayStr}`,
            () => window.AppAnalytics.getHeroOfTheWeek(),
            24 * 60 * 60 * 1000
        );

    const staffActivityPromise = sharedSummaryEnabled
        ? Promise.resolve([])
        : window.AppDB.getOrGenerateSummary(
            `team_activity_${selectedMonth}_${todayStr}`,
            () => window.AppAnalytics.getAllStaffActivities({ mode: 'month', month: selectedMonth, scope: 'work' })
        );

    const sharedSummaryTask = sharedSummaryEnabled && window.AppDB.getOrCreateDailySummary
        ? window.AppDB.getOrCreateDailySummary({
            dateKey: todayStr,
            yesterdayKey: yesterdayStr,
            staleAfterMs: AppConfig?.SUMMARY_POLICY?.STALENESS_MS,
            lockTtlMs: AppConfig?.SUMMARY_POLICY?.LOCK_TTL_MS,
            generatorFn: () => window.AppAnalytics.buildDailyDashboardSummary({ dateKey: todayStr, selectedMonth })
        }).catch(err => {
            console.warn('Daily summary fetch/generation failed:', err);
            return null;
        })
        : null;

    const dailySummaryPromise = sharedSummaryTask
        ? Promise.race([
            sharedSummaryTask,
            new Promise(resolve => setTimeout(() => resolve(null), 1500))
        ])
        : Promise.resolve(null);

    // Refresh at midnight
    if (!window._dashboardRefreshScheduled) {
        window._dashboardRefreshScheduled = true;
        try {
            const istNow = window.AppDB.getIstNow();
            const tom = new Date(istNow);
            tom.setDate(tom.getDate() + 1);
            tom.setHours(0, 0, 5, 0);
            const msUntil = tom.getTime() - istNow.getTime();
            setTimeout(() => {
                renderDashboard().then(html => {
                    const content = document.getElementById('page-content');
                    if (content) content.innerHTML = html;
                });
                window._dashboardRefreshScheduled = false;
            }, Math.max(0, msUntil));
        } catch (err) {
            console.warn('failed to schedule dashboard refresh', err);
        }
    }

    // Parallel Fetch
    const [status, logs, monthlyStats, yearlyStats, heroDataRaw, calendarPlans, staffActivitiesRaw, pendingLeaves, allUsers, collaborations, allLeaves, dailySummary, minutesData] = await Promise.all([
        window.AppAttendance.getStatus(),
        window.AppAttendance.getLogs(targetStaffId),
        window.AppAnalytics.getUserMonthlyStats(targetStaffId),
        window.AppAnalytics.getUserYearlyStats(targetStaffId),
        heroPromise,
        window.AppCalendar ? window.AppCalendar.getPlans() : { leaves: [], events: [] },
        staffActivityPromise,
        window.app_hasPerm('leaves', 'view') ? window.AppLeaves.getPendingLeaves() : Promise.resolve([]),
        window.AppDB.getCached
            ? window.AppDB.getCached(window.AppDB.getCacheKey('dashboardUsers', 'users', {}), (AppConfig?.READ_CACHE_TTLS?.users || 60000), () => window.AppDB.getAll('users'))
            : window.AppDB.getAll('users'),
        window.AppCalendar ? window.AppCalendar.getCollaborations(targetStaffId) : Promise.resolve([]),
        window.app_hasPerm('leaves', 'view')
            ? (window.AppDB.queryMany
                ? window.AppDB.queryMany('leaves', [{ field: 'status', operator: '==', value: 'Pending' }]).catch(() => window.AppDB.getAll('leaves'))
                : window.AppDB.getAll('leaves'))
            : Promise.resolve([]),
        dailySummaryPromise,
        window.AppMinutes ? window.AppMinutes.getMinutes() : Promise.resolve([])
    ]);
    console.timeEnd('DashboardFetch');

    const heroMeta = sharedSummaryEnabled
        ? {
            lowRead: true,
            generatedAt: dailySummary?.generatedAt || dailySummary?.meta?.generatedAt || 0,
            source: dailySummary?._source || ''
        }
        : {};
    let heroData = sharedSummaryEnabled ? (dailySummary?.hero || null) : heroDataRaw;
    let staffActivities = sharedSummaryEnabled ? (Array.isArray(dailySummary?.teamActivityPreview) ? dailySummary.teamActivityPreview : []) : staffActivitiesRaw;

    if (sharedSummaryEnabled && (!dailySummary || !Array.isArray(dailySummary.teamActivityPreview))) {
        setTimeout(() => refreshStaffActivityWidget(true), 0);
    }

    const heroHTML = renderHeroCard(heroData, heroMeta);

    // Update hero card if sharedSummaryTask was slow
    if (sharedSummaryEnabled && heroData == null && sharedSummaryTask) {
        sharedSummaryTask.then(ds => {
            const latestHero = ds && ds.hero ? ds.hero : null;
            if (latestHero) {
                const updatedMeta = { ...heroMeta, generatedAt: ds.generatedAt || heroMeta.generatedAt, source: ds._source || heroMeta.source };
                const newHtml = renderHeroCard(latestHero, updatedMeta);
                const slot = document.querySelector('.hero-slot');
                if (slot) slot.innerHTML = newHtml;
            }
        }).catch(() => { });
    }

    if (window.AppRating && user.rating === undefined) {
        window.AppRating.updateUserRating(user.id).then(updatedUser => {
            Object.assign(user, updatedUser);
        }).catch(() => { });
    }

    const targetStaff = (allUsers || []).find(u => u.id === targetStaffId);

    const isViewingSelf = targetStaffId === user.id;
    const displayUser = (!isViewingSelf && targetStaff) ? targetStaff : user;
    const isReadOnlyView = isAdmin && !isViewingSelf && !isFullAdmin;
    const now = new Date();
    const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fyDates = (window.AppAnalytics && window.AppAnalytics.getFinancialYearDates)
        ? window.AppAnalytics.getFinancialYearDates()
        : { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
    window.app_dashboardStatsStore = {
        monthly: monthlyStats || {},
        yearly: yearlyStats || {},
        monthlyTitle: isViewingSelf ? monthlyStats.label : `${monthlyStats.label} - ${targetStaff?.name || 'Staff'}`,
        monthlySubtitle: isViewingSelf ? 'Monthly Stats' : 'Viewing Staff Monthly Stats',
        yearlyTitle: 'Yearly Summary',
        yearlySubtitle: isViewingSelf ? yearlyStats.label : `${yearlyStats.label} for ${targetStaff?.name || 'Staff'}`,
        logs: Array.isArray(logs) ? logs : [],
        ranges: {
            monthly: {
                start: monthlyStart.toISOString().split('T')[0],
                end: monthlyEnd.toISOString().split('T')[0]
            },
            yearly: {
                start: fyDates.start.toISOString().split('T')[0],
                end: fyDates.end.toISOString().split('T')[0]
            }
        }
    };

    const statusData = isReadOnlyView ? { status: displayUser.status || 'out', lastCheckIn: displayUser.lastCheckIn || null } : status;
    const isCheckedIn = statusData.status === 'in';
    const notifications = user.notifications || [];
    const tagHistory = user.tagHistory || [];

    let timerHTML = '00 : 00 : 00';
    let btnText = 'Check-in';
    let btnClass = 'action-btn';

    if (isCheckedIn) {
        btnText = 'Check-out';
        btnClass = 'action-btn checkout';
    }

    const formatElapsed = (ms) => {
        const safeMs = Math.max(0, ms || 0);
        let hrs = Math.floor(safeMs / (1000 * 60 * 60));
        let mins = Math.floor((safeMs / (1000 * 60)) % 60);
        let secs = Math.floor((safeMs / 1000) % 60);
        return `${String(hrs).padStart(2, '0')} : ${String(mins).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
    };

    if (isCheckedIn && statusData.lastCheckIn) {
        const lastTs = new Date(statusData.lastCheckIn).getTime();
        timerHTML = formatElapsed(Date.now() - lastTs);
    }

    const notifHTML = renderNotificationPanel(notifications, tagHistory);
    const taggedHTML = renderTaggedItems(notifications);

    let staffViewBannerHTML = '';
    if (isAdmin && !isViewingSelf && targetStaff) {
        staffViewBannerHTML = `
            <div class="card full-width" style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 1rem 1.5rem; border-left: 5px solid #ea580c; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="position: relative;">
                            <img src="${safeUrl(targetStaff.avatar)}" alt="${safeHtml(targetStaff.name)}" style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3);">
                            <div style="position: absolute; bottom: -2px; right: -2px; background: #ea580c; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; border: 2px solid white;">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.7rem; font-weight: 600; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Currently Viewing</div>
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">${safeHtml(targetStaff.name)}'s Dashboard</h3>
                            <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">${safeHtml(targetStaff.role)} • ${safeHtml(targetStaff.dept || 'General')}</div>
                        </div>
                    </div>
                    <button onclick="window.app_changeSummaryStaff('${user.id}')" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); padding: 0.6rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; backdrop-filter: blur(10px); transition: all 0.2s;">
                        <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                    </button>
                </div>
            </div>`;
    }

    let summaryHTML = '';
    const renderYearlyPlanHTML = renderYearlyPlan(calendarPlans);

    if (isAdmin) {
        const hasExplicitSelection = !!window.app_selectedSummaryStaffId && window.app_selectedSummaryStaffId !== user.id;
        const leaveHistoryItems = (allLeaves || []).slice().sort((a, b) => new Date(b.appliedOn || 0) - new Date(a.appliedOn || 0));
        const filteredHistory = hasExplicitSelection ? leaveHistoryItems.filter(l => (l.userId || l.user_id) === targetStaffId).slice(0, 8) : leaveHistoryItems.slice(0, 8);

        const historyHTML = renderLeaveHistory(filteredHistory, {
            title: hasExplicitSelection ? `${targetStaff?.name || 'Staff'} Leave History` : 'Leave Request History',
            subtitle: hasExplicitSelection ? 'Based on selected staff summary' : 'Latest requests (all staff)'
        });

        summaryHTML = `
            <div class="dashboard-summary-row">
                <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${renderLeaveRequests(pendingLeaves)}${historyHTML}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${renderYearlyPlanHTML}${heroHTML}</div>
            </div>
            <div class="dashboard-stats-row">
                ${renderStatsCard(isViewingSelf ? monthlyStats.label : `${monthlyStats.label} - ${targetStaff?.name || 'Staff'}`, isViewingSelf ? 'Monthly Stats' : 'Viewing Staff Monthly Stats', monthlyStats, 'monthly')}
                ${renderStatsCard('Yearly Summary', isViewingSelf ? yearlyStats.label : `${yearlyStats.label} for ${targetStaff?.name || 'Staff'}`, yearlyStats, 'yearly')}
            </div>`;
    } else {
        summaryHTML = `
            <div class="dashboard-summary-row">
                <div class="dashboard-summary-col dashboard-summary-col-wide">${renderYearlyPlanHTML}</div>
                <div class="dashboard-summary-col dashboard-summary-col-narrow">${heroHTML}</div>
            </div>
            <div class="dashboard-stats-row">
                ${renderStatsCard(monthlyStats.label, 'Monthly Stats', monthlyStats, 'monthly')}
                ${renderStatsCard('Yearly Summary', yearlyStats.label, yearlyStats, 'yearly')}
            </div>`;
    }

    const updateState = (window.app_getReleaseUpdateState && window.app_getReleaseUpdateState()) || { active: false, countdownLabel: '00:00' };
    setTimeout(() => ensureDashboardActionDelegates(), 0);

    return `
        <div class="dashboard-grid dashboard-modern dashboard-staff-view">
            ${notifHTML}
            ${taggedHTML}
            ${staffViewBannerHTML}
            <div class="card full-width dashboard-hero-card">
                <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                <div class="dashboard-hero-content">
                    <div class="dashboard-hero-row">
                        <div class="dashboard-hero-copy">
                            <h2 class="dashboard-hero-title">Welcome back, ${user.name.split(' ')[0]}! 👋</h2>
                            <p class="dashboard-hero-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            ${user.rating !== undefined ? `<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${renderStarRating(user.rating, true)}</div>${user.completionStats ? `<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(user.completionStats.completionRate * 100).toFixed(0)}% Complete</span></div>` : ''}</div>` : ''}
                        </div>
                        ${isAdmin ? `<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${targetStaffId !== user.id ? '<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>' : ''}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${user.id}">My Own Summary</option><optgroup label="Staff Members">${(allUsers || []).filter(u => u.id !== user.id).sort((a, b) => a.name.localeCompare(b.name)).map(u => `<option value="${u.id}" ${u.id === targetStaffId ? 'selected' : ''}>${u.name}</option>`).join('')}</optgroup></select></div></div></div>` : ''}
                        <div class="welcome-icon dashboard-hero-weather"><i class="fa-solid fa-cloud-sun dashboard-hero-weather-icon"></i></div>
                    </div>
                </div>
                <button class="${updateState.active ? 'dashboard-refresh-link is-update-pending' : 'dashboard-refresh-link'}" onclick="window.app_showSystemUpdatePopup()" title="${updateState.active ? `Update available. Auto-refresh in ${updateState.countdownLabel}` : 'Check for System Update'}">
                    ${updateState.active ? `System update available <span class="dashboard-refresh-countdown">(${updateState.countdownLabel})</span>` : 'Check for System Update'}
                </button>
            </div>
            <div class="dashboard-primary-row">
                <div class="card check-in-widget dashboard-primary-card" style="padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; background: white; border: 1px solid #eef2ff;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;"><div style="position: relative;"><img src="${safeUrl(displayUser.avatar)}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;"><div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: ${isCheckedIn ? '#10b981' : '#94a3b8'}; border: 2px solid white;"></div></div><div style="text-align: left;"><h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${safeHtml(displayUser.name)}</h4><p class="text-muted" style="font-size: 0.75rem; margin: 0;">${safeHtml(displayUser.role)}</p></div></div>
                    <div style="text-align:center; padding: 0.5rem 0;"><div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">${timerHTML}</div><div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div></div>
                    <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;"><div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;"><span id="countdown-label">Time to checkout</span><span id="countdown-value" style="font-weight: 600;">--:--:--</span></div><div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;"><div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div></div></div>
                    <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;"><div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div><div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div></div>
                    <button class="${btnClass}" id="attendance-btn" ${isReadOnlyView ? 'disabled' : ''} title="${isReadOnlyView ? 'View only' : ''}" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; ${isReadOnlyView ? 'opacity:0.6; cursor:not-allowed;' : ''}">${btnText} <i class="fa-solid fa-fingerprint"></i></button>
                    <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;"><i class="fa-solid fa-location-dot"></i><span>${isCheckedIn && displayUser.currentLocation ? `Lat: ${Number(displayUser.currentLocation.lat).toFixed(4)}, Lng: ${Number(displayUser.currentLocation.lng).toFixed(4)}` : 'Waiting for location...'}</span></div>
                </div>
                <div class="dashboard-primary-col ${!isViewingSelf ? 'dashboard-primary-col-highlight' : ''}">${renderWorkLog(logs, collaborations, targetStaff, minutesData)}</div>
                <div class="dashboard-primary-col">${renderActivityLog(staffActivities)}</div>
            </div>
            ${summaryHTML}
        </div>`;
}

// --- Internal Helper Functions (Local) ---

function formatMonthLabel(monthKey) {
    const [yearStr, monthStr] = String(monthKey || '').split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) return monthKey || 'Current Month';
    return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildStaffActivityMonthOptions(count = 8) {
    const opts = [];
    const base = new Date();
    base.setDate(1);
    for (let i = 0; i < count; i++) {
        const d = new Date(base);
        d.setMonth(base.getMonth() - i);
        const key = d.toISOString().slice(0, 7);
        opts.push({ key, label: formatMonthLabel(key) });
    }
    return opts;
}

function normalizeStaffActivityLogs(allLogs) {
    const deduped = [];
    const seen = new Map();
    (allLogs || []).forEach(log => {
        const desc = (log._displayDesc || '').trim();
        const key = `${log.staffName || ''}|${log.date || ''}|${desc}`;
        if (!seen.has(key)) {
            seen.set(key, log);
            deduped.push(log);
        }
    });
    return deduped.map(log => {
        const taskStatus = window.AppCalendar ? window.AppCalendar.getSmartTaskStatus(log.date, log.status || '') : (log.status || 'to-be-started');
        return { ...log, _taskStatus: taskStatus, _taskGroup: taskStatus === 'completed' ? 'completed' : 'incomplete' };
    });
}

function sortStaffActivityLogs(logs, sortKey) {
    const copy = [...logs];
    const statusRank = { completed: 0, 'in-process': 1, overdue: 2, 'not-completed': 3, 'to-be-started': 4 };
    copy.sort((a, b) => {
        const dateDiffDesc = new Date(b.date) - new Date(a.date);
        const nameCmp = String(a.staffName || '').toLowerCase().localeCompare(String(b.staffName || '').toLowerCase());
        if (sortKey === 'date-asc') return (new Date(a.date) - new Date(b.date)) || nameCmp;
        if (sortKey === 'staff-asc') return nameCmp || dateDiffDesc;
        if (sortKey === 'staff-desc') return (-nameCmp) || dateDiffDesc;
        if (sortKey === 'completed-first') return a._taskGroup.localeCompare(b._taskGroup) || dateDiffDesc;
        if (sortKey === 'incomplete-first') return b._taskGroup.localeCompare(a._taskGroup) || dateDiffDesc;
        if (sortKey === 'status-priority') return (statusRank[a._taskStatus] ?? 99) - (statusRank[b._taskStatus] ?? 99) || dateDiffDesc || nameCmp;
        return dateDiffDesc || nameCmp;
    });
    return copy;
}

function clearTeamActivityController(el) {
    if (!el) return;
    const state = teamActivityAutoScroll.controllers.get(el);
    if (!state) return;
    if (state.intervalId) clearInterval(state.intervalId);
    if (state.pauseTimeoutId) clearTimeout(state.pauseTimeoutId);
    if (state.resumeTimeoutId) clearTimeout(state.resumeTimeoutId);
    el.removeEventListener('mouseenter', state.onMouseEnter);
    el.removeEventListener('mouseleave', state.onMouseLeave);
    el.removeEventListener('touchstart', state.onTouchStart);
    el.removeEventListener('touchend', state.onTouchEnd);
    el.removeEventListener('touchcancel', state.onTouchCancel);
    teamActivityAutoScroll.controllers.delete(el);
    teamActivityAutoScroll.elements.delete(el);
}

function disposeTeamActivityAutoScroll() {
    Array.from(teamActivityAutoScroll.elements).forEach(el => clearTeamActivityController(el));
}

function initTeamActivityAutoScroll(container) {
    if (!container) return;
    disposeTeamActivityAutoScroll();
    const columns = container.querySelectorAll('.dashboard-team-activity-col-list');
    columns.forEach((el) => {
        const state = { intervalId: null, pauseTimeoutId: null, resumeTimeoutId: null, direction: 1, isPausedByUser: false, isWaitingAtEdge: false };
        const waitAtEdge = (nextDirection, waitMs) => {
            state.isWaitingAtEdge = true;
            if (state.pauseTimeoutId) clearTimeout(state.pauseTimeoutId);
            state.pauseTimeoutId = setTimeout(() => { state.direction = nextDirection; state.isWaitingAtEdge = false; }, waitMs);
        };
        const tick = () => {
            if (state.isPausedByUser || state.isWaitingAtEdge || !el.isConnected) return;
            const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
            if (maxScroll <= 0) return;
            el.scrollTop += state.direction;
            if (state.direction === 1 && el.scrollTop >= maxScroll) { el.scrollTop = maxScroll; waitAtEdge(-1, 1500); }
            else if (state.direction === -1 && el.scrollTop <= 0) { el.scrollTop = 0; waitAtEdge(1, 1000); }
        };
        state.onMouseEnter = () => { state.isPausedByUser = true; };
        state.onMouseLeave = () => { state.isPausedByUser = false; };
        state.onTouchStart = () => { state.isPausedByUser = true; if (state.resumeTimeoutId) clearTimeout(state.resumeTimeoutId); };
        state.onTouchEnd = () => { if (state.resumeTimeoutId) clearTimeout(state.resumeTimeoutId); state.resumeTimeoutId = setTimeout(() => { state.isPausedByUser = false; }, 400); };
        el.addEventListener('mouseenter', state.onMouseEnter);
        el.addEventListener('mouseleave', state.onMouseLeave);
        el.addEventListener('touchstart', state.onTouchStart, { passive: true });
        el.addEventListener('touchend', state.onTouchEnd, { passive: true });
        state.intervalId = setInterval(tick, 50);
        teamActivityAutoScroll.controllers.set(el, state);
        teamActivityAutoScroll.elements.add(el);
    });
}

const refreshStaffActivityWidget = async (fetchLogs = true) => {
    const state = getStaffActivityState();
    const list = document.getElementById('staff-activity-list');
    const modalList = document.getElementById('staff-activity-list-modal');
    if (!list && !modalList) return;
    disposeTeamActivityAutoScroll();
    if (fetchLogs) {
        if (window.AppAnalytics) {
            state.logs = await window.AppAnalytics.getAllStaffActivities({ mode: 'month', month: state.selectedMonth, scope: 'work' });
        }
    }
    const html = renderStaffActivityListSplit(state.logs, state.sortKey);
    if (list) { list.innerHTML = html; initTeamActivityAutoScroll(list); }
    if (modalList) { modalList.innerHTML = html; }
    const subtitle = document.getElementById('staff-activity-range-label');
    if (subtitle) subtitle.textContent = formatMonthLabel(state.selectedMonth);
};

// --- Export to Window (Global) ---
if (typeof window !== 'undefined') {
    window.app_expandTeamActivity = function () {
        if (window.app_closeTeamActivityExpanded) {
            window.app_closeTeamActivityExpanded();
        }
        if (window.location) {
            window.location.hash = '#team-activities';
        }
    };

    window.app_openStatsDetailModal = function (type) {
        const store = window.app_dashboardStatsStore || {};
        const stats = type === 'yearly' ? store.yearly : store.monthly;
        if (!stats) return;
        const title = type === 'yearly' ? store.yearlyTitle : store.monthlyTitle;
        const subtitle = type === 'yearly' ? store.yearlySubtitle : store.monthlySubtitle;
        const breakdown = stats.breakdown || {};
        const range = store.ranges ? (type === 'yearly' ? store.ranges.yearly : store.ranges.monthly) : null;
        const buckets = buildStatsDetailBuckets(store.logs || [], range);
        const items = Object.entries(breakdown).filter(([, v]) => Number(v || 0) > 0);
        const existing = document.getElementById('dashboard-stats-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'dashboard-stats-modal';
        modal.className = 'modal-overlay dashboard-stats-modal';
        modal.innerHTML = `
            <div class="modal-content dashboard-stats-modal-content">
                <div class="dashboard-stats-modal-head">
                    <div>
                        <div class="dashboard-stats-modal-title">${safeHtml(title || 'Attendance Summary')}</div>
                        <div class="dashboard-stats-modal-sub">${safeHtml(subtitle || '')}</div>
                    </div>
                    <button class="dashboard-stats-modal-close" type="button" onclick="window.app_closeStatsDetailModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="dashboard-stats-modal-grid">
                    <div class="dashboard-stats-modal-tile" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Late Count</span>
                        <span class="value">${safeHtml(stats.late ?? 0)}</span>
                        <span class="hint">Total late entries</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Late Duration</span>
                        <span class="value">${safeHtml(stats.totalLateDuration || '0h 0m')}</span>
                        <span class="hint">Summed lateness time</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="early" role="button" tabindex="0">
                        <span class="label">Early Departures</span>
                        <span class="value">${safeHtml(stats.earlyDepartures ?? 0)}</span>
                        <span class="hint">Left before cutoff</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="extra" role="button" tabindex="0">
                        <span class="label">Extra Hours</span>
                        <span class="value">${safeHtml(stats.extraWorkedHours ?? 0)}h</span>
                        <span class="hint">Counted extra time</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Penalty</span>
                        <span class="value">${safeHtml(stats.penalty ?? stats.penaltyLeaves ?? 0)}</span>
                        <span class="hint">Leave deductions</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="extra" role="button" tabindex="0">
                        <span class="label">Penalty Offset</span>
                        <span class="value">${safeHtml(stats.penaltyOffset ?? 0)}</span>
                        <span class="hint">Extra hours offset</span>
                    </div>
                    <div class="dashboard-stats-modal-tile highlight" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Effective Penalty</span>
                        <span class="value">${safeHtml(stats.effectivePenalty ?? 0)}</span>
                        <span class="hint">Final deduction</span>
                    </div>
                </div>
                <div class="dashboard-stats-modal-section">
                    <div class="dashboard-stats-modal-section-title">Breakdown</div>
                    <div class="dashboard-stats-modal-breakdown">
                        ${(items.length ? items : [['No data', 0]]).map(([k, v]) => `
                            <div class="dashboard-stats-modal-row" data-breakdown-key="${safeHtml(k)}" role="button" tabindex="0">
                                <span>${safeHtml(k)}</span>
                                <strong>${safeHtml(v)}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="dashboard-stats-modal-section">
                    <div class="dashboard-stats-modal-section-title" id="dashboard-stats-detail-title">Details</div>
                    <div class="dashboard-stats-modal-dates" id="dashboard-stats-date-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        window._dashboardStatsDetailData = { type, buckets };
        const defaultKey = buckets.late.length ? 'late' : (buckets.early.length ? 'early' : (buckets.extra.length ? 'extra' : 'Present'));
        window.app_updateStatsDetailView(defaultKey);
        modal.addEventListener('click', (event) => {
            const detailTile = event.target.closest('[data-stat-detail]');
            if (detailTile) {
                window.app_updateStatsDetailView(detailTile.getAttribute('data-stat-detail'));
                return;
            }
            const breakdownRow = event.target.closest('[data-breakdown-key]');
            if (breakdownRow) {
                window.app_updateStatsDetailView(breakdownRow.getAttribute('data-breakdown-key'));
            }
        });
        modal.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const detailTile = event.target.closest('[data-stat-detail]');
            const breakdownRow = event.target.closest('[data-breakdown-key]');
            if (detailTile || breakdownRow) {
                event.preventDefault();
                window.app_updateStatsDetailView((detailTile ? detailTile.getAttribute('data-stat-detail') : breakdownRow.getAttribute('data-breakdown-key')));
            }
        });
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                window.app_closeStatsDetailModal();
            }
        });
        window._dashboardStatsEscHandler = (e) => {
            if (e.key === 'Escape') window.app_closeStatsDetailModal();
        };
        window.addEventListener('keydown', window._dashboardStatsEscHandler);
    };

    window.app_closeStatsDetailModal = function () {
        const modal = document.getElementById('dashboard-stats-modal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
        window._dashboardStatsDetailData = null;
        if (window._dashboardStatsEscHandler) {
            window.removeEventListener('keydown', window._dashboardStatsEscHandler);
            window._dashboardStatsEscHandler = null;
        }
    };

    window.app_updateStatsDetailView = function (key) {
        const data = window._dashboardStatsDetailData || {};
        const buckets = data.buckets || {};
        let label = '';
        let dates = [];
        if (key === 'late') {
            label = 'Late Dates';
            dates = buckets.late || [];
        } else if (key === 'early') {
            label = 'Early Departure Dates';
            dates = buckets.early || [];
        } else if (key === 'extra') {
            label = 'Extra Hours Dates';
            dates = buckets.extra || [];
        } else if (buckets.breakdown && Object.prototype.hasOwnProperty.call(buckets.breakdown, key)) {
            label = `${key} Dates`;
            dates = buckets.breakdown[key] || [];
        } else {
            label = 'Details';
            dates = [];
        }
        const titleEl = document.getElementById('dashboard-stats-detail-title');
        const listEl = document.getElementById('dashboard-stats-date-list');
        if (titleEl) titleEl.textContent = label;
        if (listEl) {
            listEl.innerHTML = dates.length
                ? dates.map(d => `<div class="dashboard-stats-date-item">${safeHtml(d)}</div>`).join('')
                : `<div class="dashboard-stats-date-empty">No dates available.</div>`;
        }
        document.querySelectorAll('.dashboard-stats-modal-tile, .dashboard-stats-modal-row').forEach(el => {
            const tileKey = el.getAttribute('data-stat-detail');
            const rowKey = el.getAttribute('data-breakdown-key');
            el.classList.toggle('is-active', (tileKey && tileKey === key) || (rowKey && rowKey === key));
        });
    };

    window.app_attachStatsCardHandlers = function () {
        attachStatsCardHandlers();
    };

    window.app_expandTeamActivityRefresh = function () {
        const state = getStaffActivityState();
        const modalBody = document.getElementById('staff-activity-list-modal');
        const modalLabel = document.getElementById('staff-activity-range-label-modal');
        if (modalBody) {
            modalBody.innerHTML = renderStaffActivityListSplit(state.logs, state.sortKey);
        }
        if (modalLabel) {
            modalLabel.textContent = formatMonthLabel(state.selectedMonth);
        }
    };

    window.app_closeTeamActivityExpanded = function () {
        const modal = document.getElementById('team-activity-modal-overlay');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
            window.removeEventListener('keydown', window._teamActivityEscHandler);
        }
    };
}

