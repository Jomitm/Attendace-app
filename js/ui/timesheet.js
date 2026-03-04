/**
 * Timesheet Component
 * Handles rendering of the user's personal timesheet, calendar view, and manual logs.
 */

import { safeHtml } from './helpers.js';

export async function renderTimesheet() {
    // Initialize global helpers if not present
    if (typeof window.app_setTimesheetView !== 'function') {
        window.app_setTimesheetView = async (mode) => {
            window.app_timesheetViewMode = mode === 'calendar' ? 'calendar' : 'list';
            const contentArea = document.getElementById('page-content');
            if (contentArea) contentArea.innerHTML = await renderTimesheet();
        };
    }
    if (typeof window.app_changeTimesheetMonth !== 'function') {
        window.app_changeTimesheetMonth = async (delta) => {
            const now = new Date();
            const currentMonth = Number.isInteger(window.app_timesheetMonth) ? window.app_timesheetMonth : now.getMonth();
            const currentYear = Number.isInteger(window.app_timesheetYear) ? window.app_timesheetYear : now.getFullYear();
            const d = new Date(currentYear, currentMonth, 1);
            d.setMonth(d.getMonth() + delta);
            window.app_timesheetMonth = d.getMonth();
            window.app_timesheetYear = d.getFullYear();
            const contentArea = document.getElementById('page-content');
            if (contentArea) contentArea.innerHTML = await renderTimesheet();
        };
    }
    if (typeof window.app_jumpTimesheetToday !== 'function') {
        window.app_jumpTimesheetToday = async () => {
            const now = new Date();
            window.app_timesheetMonth = now.getMonth();
            window.app_timesheetYear = now.getFullYear();
            const contentArea = document.getElementById('page-content');
            if (contentArea) contentArea.innerHTML = await renderTimesheet();
        };
    }

    const user = window.AppAuth.getUser();
    const logs = await window.AppAttendance.getLogs();
    const plansData = await window.AppCalendar.getPlans().catch(() => ({ workPlans: [] }));
    const today = new Date();
    const viewMode = window.app_timesheetViewMode || 'list';
    const viewMonth = Number.isInteger(window.app_timesheetMonth) ? window.app_timesheetMonth : today.getMonth();
    const viewYear = Number.isInteger(window.app_timesheetYear) ? window.app_timesheetYear : today.getFullYear();

    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
    const monthEnd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-31`;

    const monthLogs = logs.filter(l => l.date && l.date >= monthStart && l.date <= monthEnd);
    const userMonthPlans = (plansData.workPlans || []).filter(p => {
        return p.userId === user.id && p.date && p.date >= monthStart && p.date <= monthEnd;
    });

    const logsByDate = {};
    monthLogs.forEach(log => {
        if (!logsByDate[log.date]) logsByDate[log.date] = [];
        logsByDate[log.date].push(log);
    });

    const plansByDate = {};
    userMonthPlans.forEach(plan => {
        if (!plansByDate[plan.date]) plansByDate[plan.date] = [];
        if (Array.isArray(plan.plans) && plan.plans.length) {
            plan.plans.forEach(task => {
                plansByDate[plan.date].push(task.task || 'Planned task');
            });
        } else if (plan.plan) {
            plansByDate[plan.date].push(plan.plan);
        }
    });

    window._timesheetLogsByDate = logsByDate;
    window._timesheetPlansByDate = plansByDate;

    let totalMins = 0;
    let lateCount = 0;
    const uniqueDays = new Set();

    monthLogs.forEach(log => {
        if (log.durationMs) totalMins += (log.durationMs / (1000 * 60));
        if (log.lateCountable || (window.AppAttendance && window.AppAttendance.normalizeType(log.type) === 'Late')) lateCount++;
        if (log.date) uniqueDays.add(log.date);
    });

    const totalHoursFormatted = `${Math.floor(totalMins / 60)}h ${Math.round(totalMins % 60)}m`;
    const lateDeductionDays = Math.floor(lateCount / (window.AppConfig?.LATE_GRACE_COUNT || 3)) * (window.AppConfig?.LATE_DEDUCTION_PER_BLOCK || 0.5);

    const displayLogType = (rawType) => {
        return (window.AppAttendance && window.AppAttendance.normalizeType) ? window.AppAttendance.normalizeType(rawType) : rawType;
    };

    // Attach local event handlers to window for HTML accessibility
    window.app_editWorkSummary = async (logId) => {
        const logs = await window.AppAttendance.getLogs();
        const log = logs.find(l => l.id === logId);
        const currentDesc = log ? log.workDescription : "";
        const newDesc = await window.appPrompt("Update Work Summary:", currentDesc || "", { title: 'Update Work Summary', confirmText: 'Save' });
        if (newDesc !== null) {
            await window.AppAttendance.updateLog(logId, { workDescription: newDesc });
            const contentArea = document.getElementById('page-content');
            if (contentArea) contentArea.innerHTML = await renderTimesheet();
        }
    };

    window.app_switchTimesheetPanel = (mode, btn) => {
        const selectedMode = mode === 'calendar' ? 'calendar' : 'list';
        window.app_timesheetViewMode = selectedMode;
        const listPanel = document.getElementById('timesheet-list-panel');
        const calendarPanel = document.getElementById('timesheet-calendar-panel');
        const viewSelect = document.getElementById('timesheet-view-select');
        if (listPanel) listPanel.style.display = selectedMode === 'list' ? 'block' : 'none';
        if (calendarPanel) calendarPanel.style.display = selectedMode === 'calendar' ? 'block' : 'none';
        if (viewSelect) viewSelect.value = selectedMode;
        const wrap = btn && btn.closest ? btn.closest('.timesheet-view-toggle') : null;
        const buttons = wrap ? wrap.querySelectorAll('.annual-toggle-btn') : [];
        buttons.forEach(b => b.classList.remove('active'));
        if (btn && btn.classList) btn.classList.add('active');
    };

    window.app_openTimesheetDayDetail = (dateStr) => {
        const dayLogs = (window._timesheetLogsByDate && window._timesheetLogsByDate[dateStr]) || [];
        const dayPlans = (window._timesheetPlansByDate && window._timesheetPlansByDate[dateStr]) || [];
        const logsHtml = dayLogs.length
            ? dayLogs.map(l => `
                <div class="timesheet-day-detail-item">
                    <div class="timesheet-day-detail-head">
                        <span>${safeHtml(l.checkIn || '--')} - ${safeHtml(l.checkOut || '--')}</span>
                        <span class="timesheet-day-status-chip">${safeHtml(displayLogType(l.type))}</span>
                    </div>
                    <div class="timesheet-day-detail-text">${safeHtml(l.workDescription || l.location || 'No summary')}</div>
                    ${l.id && l.id !== 'active_now' ? `<button type="button" class="action-btn secondary" onclick="window.app_editWorkSummary('${l.id}')">Edit</button>` : ''}
                </div>
            `).join('')
            : `<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>`;
        const plansHtml = dayPlans.length
            ? dayPlans.map(p => `<div class="timesheet-day-plan-item">${safeHtml(p)}</div>`).join('')
            : `<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>`;
        const modalId = `timesheet-day-detail-${Date.now()}`;
        const html = `
            <div class="modal-overlay" id="${modalId}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h3 style="margin:0;">${safeHtml(dateStr)} Details</h3>
                        <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div style="display:grid; gap:0.9rem;">
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Logged Work</h4>
                            ${logsHtml}
                        </div>
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Planned Tasks</h4>
                            ${plansHtml}
                        </div>
                    </div>
                </div>
            </div>`;
        if (typeof window.app_showModal === 'function') window.app_showModal(html, modalId);
        else (document.getElementById('modal-container') || document.body).insertAdjacentHTML('beforeend', html);
    };

    const renderCalendar = () => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        let grid = '';
        for (let i = 0; i < firstDay; i++) {
            grid += `<div class="timesheet-cal-day empty"></div>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLogs = logsByDate[dateStr] || [];
            const dayLog = dayLogs.length
                ? dayLogs.slice().sort((a, b) => {
                    const score = (log) => {
                        const t = displayLogType(log.type);
                        if (t === 'Absent') return 4;
                        if (t === 'Half Day') return 3;
                        if (t === 'Late') return 2;
                        if (t === 'Present (Late Waived)') return 1;
                        return 0;
                    };
                    return score(b) - score(a);
                })[0]
                : null;
            const dayPlans = plansByDate[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const dayType = dayLog ? displayLogType(dayLog.type) : '';
            const attendanceClass = dayLog
                ? (dayType === 'Absent' ? 'absent' : (dayType === 'Half Day' || dayType === 'Late' ? 'late' : 'present'))
                : 'none';
            const attendanceText = dayLog ? dayType : 'No log';

            const logSummaries = dayLogs.map(l => (l.workDescription || l.location || '').trim()).filter(Boolean);
            const plansHTML = logSummaries.length
                ? logSummaries.slice(0, 2).map(text => `<div class="timesheet-cal-plan">${safeHtml(text)}</div>`).join('') + (logSummaries.length > 2 ? `<div class="timesheet-cal-more">+${logSummaries.length - 2} more logs</div>` : '')
                : dayPlans.length
                    ? dayPlans.slice(0, 2).map(task => `<div class="timesheet-cal-plan">${safeHtml(task)}</div>`).join('') + (dayPlans.length > 2 ? `<div class="timesheet-cal-more">+${dayPlans.length - 2} more</div>` : '')
                    : `<div class="timesheet-cal-empty">No plans</div>`;

            grid += `
                <div class="timesheet-cal-day ${isToday ? 'today' : ''}" onclick="window.app_openTimesheetDayDetail('${dateStr}')" style="cursor:pointer;">
                    <div class="timesheet-cal-day-head">
                        <span class="timesheet-cal-date">${day}</span>
                        <span class="timesheet-cal-attendance ${attendanceClass}">${attendanceText}</span>
                    </div>
                    <div class="timesheet-cal-plans">${plansHTML}</div>
                </div>`;
        }
        return `
            <div class="timesheet-calendar-wrap">
                <div class="timesheet-calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="timesheet-calendar-grid">${grid}</div>
            </div>`;
    };

    return `
        <div class="card full-width timesheet-modern">
            <div class="timesheet-modern-head">
                <div>
                    <h3>My Timesheet</h3>
                    <p>View and manage your attendance logs</p>
                </div>
                <div class="timesheet-modern-actions">
                    <button class="action-btn secondary timesheet-modern-btn-secondary" onclick="document.getElementById('leave-modal').style.display = 'flex'">
                        <i class="fa-solid fa-calendar-xmark"></i> Request Leave
                    </button>
                    <button class="action-btn timesheet-modern-btn-primary" onclick="document.dispatchEvent(new CustomEvent('open-log-modal'))">
                        <i class="fa-solid fa-plus"></i> Manual Log
                    </button>
                </div>
            </div>

            <div class="stat-grid timesheet-modern-stats">
                <div class="stat-card">
                    <div class="label">Total Hours</div>
                    <div class="value">${totalHoursFormatted}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Days Present</div>
                    <div class="value">${uniqueDays.size} <span class="timesheet-stat-sub">Days</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Count</div>
                    <div class="value" style="color:${lateCount > 2 ? 'var(--accent)' : 'var(--text-main)'}">${lateCount}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Deduction</div>
                    <div class="value">${lateDeductionDays.toFixed(1)} <span class="timesheet-stat-sub">Days</span></div>
                </div>
            </div>

            <div class="timesheet-modern-toolbar">
                <div class="timesheet-view-mode-wrap">
                    <label for="timesheet-view-select" class="timesheet-view-label">View</label>
                    <select id="timesheet-view-select" class="timesheet-view-select" onchange="window.app_toggleTimesheetViewSelect(this.value)">
                        <option value="list" ${viewMode === 'list' ? 'selected' : ''}>List View</option>
                        <option value="calendar" ${viewMode === 'calendar' ? 'selected' : ''}>Calendar View</option>
                    </select>
                </div>
                <div class="timesheet-month-switch">
                    <button type="button" onclick="window.app_changeTimesheetMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="timesheet-month-label">${monthLabel}</div>
                    <button type="button" onclick="window.app_changeTimesheetMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
                    <button type="button" class="timesheet-today-btn" onclick="window.app_jumpTimesheetToday()">Today</button>
                </div>
                <button class="timesheet-export-btn" onclick="window.AppReports?.exportUserLogs('${user.id}')">
                    <i class="fa-solid fa-download"></i> Export CSV
                </button>
            </div>

            <div id="timesheet-list-panel" class="table-container mobile-table-card timesheet-modern-table-wrap" style="display:${viewMode === 'list' ? 'block' : 'none'};">
                <table class="compact-table timesheet-modern-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Timings</th>
                            <th>Status</th>
                            <th>Work Summary</th>
                            <th class="text-right">Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthLogs.length ? monthLogs.map(log => `
                            <tr>
                                <td data-label="Date">
                                    <div class="timesheet-log-date">${log.date || 'Active Session'}</div>
                                    <div class="timesheet-log-id">Log ID: ${log.id === 'active_now' ? 'N/A' : log.id.slice(-4)}</div>
                                </td>
                                <td data-label="Timings">
                                    <div class="time-badge">
                                        <span class="in"><i class="fa-solid fa-caret-right"></i> ${log.checkIn}</span>
                                        <span class="out"><i class="fa-solid fa-caret-left"></i> ${log.checkOut || '--:--'}</span>
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <div class="timesheet-status-col">
                                        <span class="badge" style="background:${displayLogType(log.type) === 'Absent' ? '#fef2f2' : (displayLogType(log.type) === 'Half Day' || displayLogType(log.type) === 'Late') ? '#fff7ed' : '#f0fdf4'}; color:${displayLogType(log.type) === 'Absent' ? '#991b1b' : (displayLogType(log.type) === 'Half Day' || displayLogType(log.type) === 'Late') ? '#c2410c' : '#15803d'}; border:1px solid ${displayLogType(log.type) === 'Absent' ? '#fecaca' : (displayLogType(log.type) === 'Half Day' || displayLogType(log.type) === 'Late') ? '#fed7aa' : '#dcfce7'};">${displayLogType(log.type)}</span>
                                        <div class="timesheet-duration">${log.duration || '--'}</div>
                                    </div>
                                </td>
                                <td data-label="Work Summary" class="timesheet-summary-cell">
                                    <div class="timesheet-summary-wrap">
                                        <div class="dashboard-viewing-meta">
                                            <div class="timesheet-summary-text">${safeHtml(log.workDescription) || '<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                            ${log.location ? `<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${safeHtml(log.location)}</div>` : ''}
                                        </div>
                                        ${log.id !== 'active_now' ? `<button onclick="window.app_editWorkSummary('${log.id}')" class="timesheet-edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
                                    </div>
                                </td>
                                <td data-label="Detail" class="text-right">
                                    ${log.id !== 'active_now'
            ? `<button class="icon-btn timesheet-detail-btn" title="View Detailed Log" onclick="alert('Detailed analysis for log ${log.id} coming soon!')"><i class="fa-solid fa-circle-info"></i></button>`
            : '<span class="timesheet-live">SESSION LIVE</span>'}
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="5" class="timesheet-empty-row">No attendance records found for this period.</td></tr>`}
                    </tbody>
                </table>
            </div>

            <div id="timesheet-calendar-panel" style="display:${viewMode === 'calendar' ? 'block' : 'none'};">
                ${renderCalendar()}
            </div>
        </div>
    `;
}

// Global Exports
if (typeof window !== 'undefined') {
    if (!window.AppUI) window.AppUI = {};
    window.AppUI.renderTimesheet = renderTimesheet;
}
