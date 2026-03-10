/**
 * Master Sheet Component
 * Handles rendering of the administrative attendance grid for all staff.
 */

import { safeHtml } from './helpers.js';

export async function renderMasterSheet(month = null, year = null) {
    const currentUser = window.AppAuth.getUser();
    const canAdminAttendance = window.app_hasPerm('attendance', 'admin', currentUser);
    const users = await window.AppDB.getAll('users');

    const now = new Date();
    const currentMonth = month !== null ? parseInt(month) : now.getMonth();
    const currentYear = year !== null ? parseInt(year) : now.getFullYear();

    // Filtered Query for Logs
    const startDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const endDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`;

    // Fallback if query() doesn't exist or work as expected
    let filteredLogs = [];
    try {
        const logs = await window.AppDB.query('attendance', 'date', '>=', startDateStr);
        filteredLogs = logs.filter(l => l.date <= endDateStr);
    } catch (e) {
        console.warn("MasterSheet: query failed, fetching all attendance logs", e);
        const allLogs = await window.AppDB.getAll('attendance');
        filteredLogs = allLogs.filter(l => l.date >= startDateStr && l.date <= endDateStr);
    }

    // Days in selected month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const getWeekendPolicy = (dateStr) => {
        const d = new Date(`${dateStr}T00:00:00`);
        const day = d.getDay(); // 0=Sun, 6=Sat
        if (day === 0) return 'holiday';
        if (day === 6) {
            const nthSaturday = Math.floor((d.getDate() - 1) / 7) + 1;
            if (nthSaturday === 2 || nthSaturday === 4) return 'holiday';
            if (nthSaturday === 1 || nthSaturday === 3 || nthSaturday === 5) return 'halfday';
        }
        return 'working';
    };

    const isLeaveLog = (log) => {
        const t = String(log?.type || '');
        return t.includes('Leave') || log?.location === 'On Leave';
    };

    const isActualCheckoutLog = (log) => {
        if (!log || !log.checkOut || log.checkOut === 'Active Now') return false;
        return (
            typeof log.activityScore !== 'undefined' ||
            typeof log.locationMismatched !== 'undefined' ||
            !!log.checkOutLocation ||
            typeof log.outLat !== 'undefined' ||
            typeof log.outLng !== 'undefined'
        );
    };

    const getLogPriority = (log) => {
        if (log?.isManualOverride) return 4;
        if (isLeaveLog(log)) return 3;
        if (isActualCheckoutLog(log)) return 2;
        return 1;
    };

    const isAttendanceEligibleLog = (log) => {
        if (Object.prototype.hasOwnProperty.call(log || {}, 'attendanceEligible')) {
            return log.attendanceEligible === true;
        }
        const src = String(log?.entrySource || '');
        if (src === 'staff_manual_work') return false;
        if (src === 'admin_override' || src === 'checkin_checkout') return true;
        if (log?.isManualOverride) return true;
        if (log?.location === 'Office (Manual)' || log?.location === 'Office (Override)') return true;
        const hasSystemSignals =
            typeof log?.activityScore !== 'undefined' ||
            typeof log?.locationMismatched !== 'undefined' ||
            typeof log?.autoCheckout !== 'undefined' ||
            !!log?.checkOutLocation ||
            typeof log?.outLat !== 'undefined' ||
            typeof log?.outLng !== 'undefined';
        if (hasSystemSignals) return true;
        const type = String(log?.type || '');
        return type.includes('Leave') || log?.location === 'On Leave';
    };

    const todayIso = new Date().toISOString().split('T')[0];
    const toLocalIso = (value) => {
        const d = new Date(value);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // UI Handlers attached to window
    window.app_refreshMasterSheet = async () => {
        const m = document.getElementById('sheet-month')?.value;
        const y = document.getElementById('sheet-year')?.value;
        const contentArea = document.getElementById('page-content');
        if (contentArea) contentArea.innerHTML = await renderMasterSheet(m, y);
    };

    return `
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:0.1rem;">Attendance Sheet</h2>
                        <p style="color:var(--text-muted); font-size:0.75rem;">Master grid view for all staff logs.</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            ${monthNames.map((m, i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-year" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            <option value="${currentYear}" selected>${currentYear}</option>
                            <option value="${currentYear - 1}">${currentYear - 1}</option>
                        </select>
                        ${canAdminAttendance ? `
                        <button onclick="window.app_exportMasterSheet()" class="action-btn secondary" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
                            <i class="fa-solid fa-file-excel"></i> Export Excel
                        </button>
                        ` : ''}
                    </div>
                </div>

                <div class="table-container" style="max-height: 70vh; overflow: auto; border: 1px solid #eee; border-radius: 8px;">
                    <table style="font-size:0.85rem; border-collapse: separate; border-spacing: 0;">
                        <thead>
                            <tr style="position: sticky; top: 0; z-index: 10; background: #f8fafc;">
                                <th style="border-right: 1px solid #eee; padding:6px; position: sticky; left: 0; background: #f8fafc; z-index: 20; font-size:0.75rem;">S.No</th>
                                <th style="border-right: 2px solid #ddd; padding:6px; position: sticky; left: 35px; background: #f8fafc; z-index: 20; min-width: 120px; font-size:0.75rem;">Staff Name</th>
                                ${daysArray.map(d => `<th style="text-align:center; min-width: 28px; padding:4px; border-right: 1px solid #eee; font-size:0.75rem;">${d}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${users.sort((a, b) => a.name.localeCompare(b.name)).map((u, index) => {
        return `
                                <tr>
                                    <td style="text-align:center; border-right: 1px solid #eee; position: sticky; left: 0; background: #fff; z-index: 5; padding:4px; font-size:0.75rem;">${index + 1}</td>
                                    <td style="border-right: 2px solid #ddd; position: sticky; left: 35px; background: #fff; z-index: 5; font-weight: 500; padding:4px;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${safeHtml(u.name)}</span>
                                            <span style="font-size:0.65rem; color:#666; font-weight:400;">${safeHtml(u.dept || 'General')}</span>
                                        </div>
                                    </td>
                                    ${daysArray.map(day => {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLogs = filteredLogs.filter(l => (l.userId === u.id || l.user_id === u.id) && l.date === dateStr);
            const dayAttendanceLogs = dayLogs.filter(isAttendanceEligibleLog);
            const dayPolicy = getWeekendPolicy(dateStr);

            let cellContent = '-';
            let cellStyle = '';
            let tooltip = 'No log';

            if (dayAttendanceLogs.length > 0) {
                const log = dayAttendanceLogs.slice().sort((a, b) => getLogPriority(b) - getLogPriority(a))[0];
                const type = (window.AppAttendance && window.AppAttendance.normalizeType) ? window.AppAttendance.normalizeType(log.type) : log.type;
                cellContent = type.charAt(0).toUpperCase();
                tooltip = `${log.checkIn} - ${log.checkOut || 'Active'}\n${type}`;

                if (type === 'Present') { cellStyle = 'color: #10b981; font-weight: bold; font-size: 0.9rem;'; }
                else if (type === 'Late') { cellStyle = 'color: #f59e0b; font-weight: bold;'; cellContent = 'L'; }
                else if (type === 'Half Day') { cellStyle = 'color: #c2410c; font-weight: bold;'; cellContent = 'HD'; }
                else if (type === 'Absent') { cellStyle = 'color: #ef4444; font-weight: bold;'; cellContent = 'A'; }
                else if (type.includes('Leave')) { cellStyle = 'color: #8b5cf6; font-weight: bold;'; cellContent = 'C'; }
                else if (type === 'Work - Home') { cellStyle = 'color: #0ea5e9; font-weight: bold;'; cellContent = 'W'; }
                else if (type === 'On Duty') { cellStyle = 'color: #0369a1; font-weight: bold;'; cellContent = 'D'; }

                if (log.isManualOverride) {
                    cellStyle = 'color: #be185d; font-weight: bold; background: #fdf2f8;';
                }
            } else {
                const isCheckedInToday = (dateStr === todayIso && u.status === 'in' && u.lastCheckIn && toLocalIso(u.lastCheckIn) === dateStr);
                const isBeforeJoinDate = (typeof u.joinDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(u.joinDate)) ? dateStr < u.joinDate : false;
                const isFutureDate = dateStr > todayIso;

                if (isCheckedInToday) {
                    cellContent = 'P'; cellStyle = 'color: #10b981; font-weight: bold; font-size: 0.9rem;'; tooltip = 'Checked in (pending checkout)';
                } else if (isFutureDate || isBeforeJoinDate) {
                    cellContent = '-'; cellStyle = 'color: #94a3b8; font-weight: 600;'; tooltip = isFutureDate ? 'Future date' : `Before joining date (${u.joinDate})`;
                } else if (dayPolicy === 'holiday') {
                    cellContent = 'H'; cellStyle = 'color: #64748b; font-weight: 700;'; tooltip = 'Holiday';
                } else {
                    cellContent = 'A'; cellStyle = 'color: #ef4444; font-weight: bold;'; tooltip = 'Absent';
                }
            }

            return `<td style="text-align:center; ${canAdminAttendance ? 'cursor:pointer;' : ''} border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${cellStyle}" title="${tooltip}" ${canAdminAttendance ? `onclick="window.app_openCellOverride('${u.id}', '${dateStr}')"` : ''}>${cellContent}</td>`;
        }).join('')}
                                </tr>`;
    }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
}

