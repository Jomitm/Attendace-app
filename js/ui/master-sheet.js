import { safeHtml } from './helpers.js';
import { patchContent } from '../utils/page-updates.js';
import { canManageAttendanceSheet } from '../modules/permissions.js';
import { attendanceToday, buildAttendanceSheet, filterAttendanceRows, attendanceSheetCSV } from '../utils/attendance-sheet.js';
import '../../css/attendance-sheet.css';

let activeSheet = null;
let filters = { scope: 'team', search: '', department: '', attention: false };
let requestVersion = 0;
let loadVersion = 0;
let selectedPeriod = null;
let viewerId = '';
const monthNames = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleString('en', { month: 'long' }));
const departmentOf = user => user.dept || user.department || 'General';
const sourceLabel = log => log.leaveGenerated ? 'Approved leave entry' : log.isManualOverride || log.entrySource === 'admin_override'
    ? 'Manual override' : log.entrySource === 'checkin_checkout' ? 'Check-in / checkout' : log.entrySource === 'staff_manual_work' ? 'Work log' : 'Saved record';

function visibleRows() {
    return activeSheet ? filterAttendanceRows(activeSheet.rows, { ...filters, viewerId }) : [];
}

function renderResults() {
    if (!activeSheet) return '';
    const rows = visibleRows();
    const total = rows.reduce((sum, row) => {
        Object.keys(sum).forEach(key => { sum[key] += row.totals[key]; });
        return sum;
    }, { present: 0, late: 0, half: 0, leave: 0, absent: 0, review: 0 });
    return `<div class="attendance-summary" role="status" aria-label="Totals for displayed staff" title="Present includes late, WFH and duty; late is a subset. Counts are dates, not payable days. Today is provisional.">
        ${[['Staff', rows.length], ['Present', total.present], ['Late', total.late], ['Half days', total.half], ['Leave', total.leave], ['Absent', total.absent], ['Review', total.review]].map(([label, value]) => `<span><strong>${value}</strong> ${label}</span>`).join('')}
        </div>
        <div class="attendance-scroll" tabindex="0" role="region" aria-label="Monthly attendance grid, scroll horizontally for all dates">
        <table class="attendance-grid"><caption>${monthNames[activeSheet.month]} ${activeSheet.year} attendance</caption><thead><tr><th scope="col" class="attendance-name">Staff member</th>
        ${Array.from({ length: activeSheet.days }, (_, i) => {
            const d = new Date(activeSheet.year, activeSheet.month, i + 1);
            return `<th scope="col" class="${activeSheet.today.endsWith(`-${String(i + 1).padStart(2, '0')}`) && activeSheet.today.startsWith(`${activeSheet.year}-${String(activeSheet.month + 1).padStart(2, '0')}`) ? 'attendance-today' : ''}">${i + 1}<small>${d.toLocaleDateString('en', { weekday: 'short' })}</small></th>`;
        }).join('')}<th scope="col">Present</th><th scope="col">Late</th><th scope="col">Half</th><th scope="col">Leave</th><th scope="col">Absent</th><th scope="col">Review</th></tr></thead><tbody>
        ${rows.length ? rows.map(({ user, cells, totals }) => `<tr><th scope="row" class="attendance-name">${safeHtml(user.name)}<small>${safeHtml(departmentOf(user))}${String(user.id) === viewerId ? ' · You' : ''}</small></th>
            ${cells.map(cell => `<td class="attendance-${cell.kind}"><button type="button" data-attendance-day="${cell.date}" data-staff-id="${safeHtml(user.id)}" aria-label="${safeHtml(`${user.name}, ${cell.date}: ${cell.label}${cell.review ? ', needs review' : ''}`)}" title="${safeHtml(`${cell.label}${cell.note ? ` — ${cell.note}` : ''}`)}">${cell.code}${cell.review ? '<sup aria-hidden="true">!</sup>' : ''}</button></td>`).join('')}
            ${Object.values(totals).map(value => `<td class="attendance-total">${value}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${activeSheet.days + 7}" class="attendance-empty">No staff match these filters. Clear the search or change the view.</td></tr>`}
        </tbody></table></div>`;
}

function showDay(userId, date) {
    const row = visibleRows().find(r => String(r.user.id) === userId);
    const cell = row?.cells.find(c => c.date === date);
    if (!cell) return;
    document.getElementById('attendance-day-dialog')?.remove();
    const dialog = document.createElement('dialog');
    dialog.id = 'attendance-day-dialog';
    dialog.className = 'attendance-dialog';
    dialog.setAttribute('aria-label', `${row.user.name} attendance on ${date}`);
    const mayEdit = canManageAttendanceSheet(window.AppAuth.getUser());
    dialog.innerHTML = `<header><div><h3>${safeHtml(row.user.name)}</h3><p>${safeHtml(date)} · ${safeHtml(cell.label)}</p></div><button type="button" data-sheet-action="close" aria-label="Close day details">×</button></header>
        ${cell.note ? `<p class="attendance-callout">${safeHtml(cell.note)}</p>` : ''}
        <p>${cell.log ? 'Attendance record used for this day is marked below.' : 'This status comes from the calendar or current check-in state; there is no saved attendance record for this day.'}</p>
        ${cell.evidence.length ? `<ul class="attendance-evidence">${cell.evidence.map(log => `<li><strong>${safeHtml(log.type || 'Work log')}${log === cell.log ? ' · Used in sheet' : ''}</strong><p>${safeHtml(log.checkIn || 'No check-in')} → ${safeHtml(log.checkOut || 'No checkout')}${log.duration ? ` · ${safeHtml(log.duration)}` : ''}</p><small>${safeHtml(sourceLabel(log))}</small></li>`).join('')}</ul>` : ''}
        <footer><a class="action-btn secondary" href="#timesheet" data-sheet-action="timesheet">My detailed timesheet</a>${mayEdit ? `<button type="button" class="action-btn" data-sheet-action="edit" data-staff-id="${safeHtml(userId)}" data-attendance-date="${date}">Edit attendance</button>` : ''}<button type="button" class="action-btn secondary" data-sheet-action="close">Close</button></footer>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
}

export async function renderMasterSheet(month = null, year = null) {
    const version = ++loadVersion;
    const user = window.AppAuth.getUser();
    if (!user) return '<div class="card">Please sign in to view attendance.</div>';
    const nextViewer = String(user.id);
    if (viewerId !== nextViewer) filters = { scope: 'team', search: '', department: '', attention: false };
    viewerId = nextViewer;
    const today = attendanceToday();
    const selectedMonth = month === null ? Number(today.slice(5, 7)) - 1 : Number(month);
    const selectedYear = year === null ? Number(today.slice(0, 4)) : Number(year);
    if (!Number.isInteger(selectedMonth) || selectedMonth < 0 || selectedMonth > 11 || !Number.isInteger(selectedYear) || selectedYear < 2000 || selectedYear > 2100) return '<div class="card">Invalid attendance period.</div>';
    selectedPeriod = { month: selectedMonth, year: selectedYear };
    const start = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const end = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${new Date(selectedYear, selectedMonth + 1, 0).getDate()}`;
    const range = [{ field: 'date', operator: '>=', value: start }, { field: 'date', operator: '<=', value: end }];
    const queryRange = collection => window.AppDB.queryManyStrict
        ? window.AppDB.queryManyStrict(collection, range)
        : window.AppDB.queryMany(collection, range);
    let users, logs;
    try {
        [users, logs] = await Promise.all([window.AppUserService.getAll(), queryRange('attendance')]);
    } catch (error) {
        if (version !== loadVersion) return '';
        console.error('Attendance sheet could not load attendance records', error);
        activeSheet = null;
        return '<div class="card"><h2>Attendance unavailable</h2><p>Attendance records could not be loaded. Please refresh and try again. No absence totals have been calculated.</p><button type="button" class="action-btn" data-sheet-action="refresh">Try again</button></div>';
    }
    const warnings = [];
    const [events, configured] = await Promise.all([
        queryRange('events').catch(() => { warnings.push('Calendar holidays could not be loaded.'); return []; }),
        (async () => {
            try {
                const settings = await window.AppDB.get('settings', 'holidays');
                const saved = settings?.byYear?.[String(selectedYear)];
                return Array.isArray(saved) && saved.length ? saved : (window.AppPolicies?.buildYearFromBaseline?.(selectedYear) || []);
            } catch { warnings.push('Configured holidays could not be loaded.'); return []; }
        })()
    ]);
    const holidays = [...(configured || []), ...(events || []).filter(event => /holiday/i.test(`${event.type || ''} ${event.title || ''}`))];
    if (version !== loadVersion || String(window.AppAuth.getUser()?.id) !== nextViewer) return '';
    activeSheet = buildAttendanceSheet({ users, logs, month: selectedMonth, year: selectedYear, holidays, today, calendarComplete: warnings.length === 0 });
    const departments = [...new Set(activeSheet.rows.map(row => departmentOf(row.user)))].sort();
    window.app_refreshMasterSheet = refreshSheet;
    // Export the same loaded snapshot and filters as the visible grid.
    return `<section class="card attendance-sheet"><header class="attendance-header"><h2>Attendance Sheet</h2><div class="attendance-period">
        <button type="button" class="action-btn secondary" data-sheet-action="previous" aria-label="Previous month">←</button>
        <label>Month<select id="sheet-month">${monthNames.map((name, i) => `<option value="${i}" ${i === selectedMonth ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
        <label>Year<input id="sheet-year" type="number" min="2000" max="2100" value="${selectedYear}"></label>
        <button type="button" class="action-btn secondary" data-sheet-action="next" aria-label="Next month">→</button>
        <button type="button" class="action-btn secondary" data-sheet-action="today">This month</button><button type="button" class="action-btn secondary" data-sheet-action="refresh">Refresh</button><button type="button" class="action-btn secondary" data-sheet-action="export">Download CSV</button></div></header>
        <div class="attendance-controls"><label>View<select data-sheet-filter="scope"><option value="team" ${filters.scope === 'team' ? 'selected' : ''}>All staff</option><option value="mine" ${filters.scope === 'mine' ? 'selected' : ''}>My attendance</option></select></label>
        <label>Find staff<input type="search" data-sheet-filter="search" placeholder="Name or staff ID" value="${safeHtml(filters.search)}"></label>
        <label>Department<select data-sheet-filter="department"><option value="">All departments</option>${departments.map(dept => `<option value="${safeHtml(dept)}" ${filters.department === dept ? 'selected' : ''}>${safeHtml(dept)}</option>`).join('')}</select></label>
        <label class="attendance-checkbox"><input type="checkbox" data-sheet-filter="attention" ${filters.attention ? 'checked' : ''}> Needs attention</label></div>
        ${warnings.length ? `<p class="attendance-callout" role="alert">${safeHtml(warnings.join(' '))} Missing weekday records are shown as unknown until holidays can be loaded.</p>` : ''}
        <div id="attendance-sheet-results">${renderResults()}</div>
        <details class="attendance-legend"><summary>Attendance codes · Select a day for details</summary><p>P Present · L Late · HD Half day · LV Leave · SL Short leave · RL Retreat · SDL Staff development · W WFH · D On duty · H Holiday · IN Checked in · ? Pending/unknown · — No record/future · ! Needs review. Present includes late, WFH and duty; late is a subset. Counts are dates, not payable days.</p></details>
        </section>`;
}

export function exportCurrentAttendanceSheet() {
    const user = window.AppAuth.getUser();
    if (!activeSheet || !user || String(user.id) !== viewerId || location.hash !== '#master-sheet') return;
    window.AppReports.downloadFile(attendanceSheetCSV(activeSheet, visibleRows()), `Attendance_${activeSheet.year}_${String(activeSheet.month + 1).padStart(2, '0')}_${filters.scope}.csv`, 'text/csv;charset=utf-8');
}

async function refreshSheet(month, year) {
    const m = month ?? Number(document.getElementById('sheet-month')?.value ?? selectedPeriod?.month);
    const y = year ?? Number(document.getElementById('sheet-year')?.value ?? selectedPeriod?.year);
    const version = ++requestVersion;
    const html = await renderMasterSheet(m, y);
    if (html && version === requestVersion && location.hash === '#master-sheet') {
        const content = document.getElementById('page-content');
        if (content) patchContent(content, html);
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('input', event => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || target.dataset.sheetFilter !== 'search') return;
        filters.search = target.value;
        const results = document.getElementById('attendance-sheet-results');
        if (results) results.innerHTML = renderResults();
    });
    document.addEventListener('change', event => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
        if (target.id === 'sheet-month' || target.id === 'sheet-year') { void refreshSheet(); return; }
        const key = target.dataset.sheetFilter;
        if (!key || key === 'search') return;
        filters[key] = key === 'attention' ? target.checked : target.value;
        const results = document.getElementById('attendance-sheet-results');
        if (results) results.innerHTML = renderResults();
    });
    document.addEventListener('click', async event => {
        const target = event.target instanceof Element ? event.target.closest('[data-sheet-action], [data-attendance-day]') : null;
        if (!target) return;
        if (target.dataset.attendanceDay) { showDay(target.dataset.staffId, target.dataset.attendanceDay); return; }
        const action = target.dataset.sheetAction;
        if (action === 'close' || action === 'timesheet') { document.getElementById('attendance-day-dialog')?.close(); return; }
        if (action === 'edit') {
            document.getElementById('attendance-day-dialog')?.close();
            await window.app_openCellOverride(target.dataset.staffId, target.dataset.attendanceDate);
        } else if (action === 'export') window.app_exportMasterSheet();
        else if (action === 'refresh') await refreshSheet();
        else if (action === 'today') await refreshSheet(Number(attendanceToday().slice(5, 7)) - 1, Number(attendanceToday().slice(0, 4)));
        else if ((action === 'previous' || action === 'next') && activeSheet) {
            const date = new Date(activeSheet.year, activeSheet.month + (action === 'next' ? 1 : -1), 1);
            await refreshSheet(date.getMonth(), date.getFullYear());
        }
    });
}
