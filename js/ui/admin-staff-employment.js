import { safeHtml } from './helpers.js';
import { onAction } from '../utils/action-router.js';
import { canManageStaff, isFormerStaff } from '../utils/staff-employment.js';
import { attendanceToday } from '../utils/attendance-sheet.js';
import '../../css/admin-staff-employment.css';

let statusFilter = 'active';
let searchFilter = '';
let bound = false;
const current = () => window.AppAuth?.getUser?.();

export function staffEmploymentControls(users) {
    const former = users.filter(isFormerStaff).length;
    return `<div class="staff-employment-filters"><label>Show <select data-staff-employment-filter><option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active (${users.length-former})</option><option value="former" ${statusFilter === 'former' ? 'selected' : ''}>Former staff (${former})</option><option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All (${users.length})</option></select></label><label>Search <input type="search" data-staff-employment-search value="${safeHtml(searchFilter)}" placeholder="Name, username or department"></label><span data-staff-employment-count role="status"></span></div>`;
}
export function staffEmploymentRow(user) {
    const state = isFormerStaff(user) ? 'former' : 'active';
    const search = `${user.name || ''} ${user.username || ''} ${user.dept || ''}`.toLowerCase();
    const visible = (statusFilter === 'all' || statusFilter === state) && search.includes(searchFilter.toLowerCase());
    return `data-staff-employment-row="${state}" data-staff-search="${safeHtml(search)}" ${visible ? '' : 'hidden'}`;
}
export function employmentBadge(user) {
    return `<span class="staff-employment-badge ${isFormerStaff(user) ? 'former' : 'active'}">${isFormerStaff(user) ? 'Former staff' : 'Active'}</span>${user.employmentEndedAt ? `<small class="staff-employment-date">Last day: ${safeHtml(user.employmentEndedAt)}</small>` : ''}`;
}
export function employmentActions(user) {
    if (!canManageStaff(current())) return '';
    const own = String(user.id) === String(current().id);
    return `<button type="button" class="admin-icon-btn" data-ts-action="staff-employment-history" data-user-id="${safeHtml(user.id)}" title="Attendance, leave and work history" aria-label="History for ${safeHtml(user.name)}">History</button><button type="button" class="admin-icon-btn" data-ts-action="staff-employment-change" data-user-id="${safeHtml(user.id)}" ${own ? 'disabled title="You cannot change your own employment status"' : ''}>${isFormerStaff(user) ? 'Restore' : 'Mark as former'}</button>`;
}
function applyFilters() {
    document.querySelectorAll('[data-staff-employment-filter]').forEach(input => { input.value = statusFilter; });
    document.querySelectorAll('[data-staff-employment-search]').forEach(input => { if (input.value !== searchFilter) input.value = searchFilter; });
    document.querySelectorAll('.admin-staff-table-wrap').forEach(wrap => {
        let shown = 0;
        wrap.querySelectorAll('[data-staff-employment-row]').forEach(row => {
            row.hidden = !(statusFilter === 'all' || row.dataset.staffEmploymentRow === statusFilter) || !row.dataset.staffSearch.includes(searchFilter.toLowerCase());
            if (!row.hidden) shown++;
        });
        const count = wrap.previousElementSibling?.querySelector('[data-staff-employment-count]');
        if (count) count.textContent = `${shown} shown`;
    });
}
function openDialog(title, body) {
    document.getElementById('staff-employment-dialog')?.remove();
    const dialog = document.createElement('dialog');
    dialog.id = 'staff-employment-dialog';
    dialog.className = 'staff-employment-dialog';
    dialog.setAttribute('aria-label', title);
    dialog.innerHTML = `<header><h3>${safeHtml(title)}</h3><button type="button" data-employment-close aria-label="Close">×</button></header>${body}`;
    dialog.addEventListener('click', event => { if (event.target.closest('[data-employment-close]')) dialog.close(); });
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
    return dialog;
}
async function changeEmployment(id) {
    if (!canManageStaff(current()) || String(current().id) === String(id)) return;
    const user = await window.AppDB.get('users', id, { includeFormer: true });
    if (!user) return;
    const restore = isFormerStaff(user);
    const dialog = openDialog(`${restore ? 'Restore' : 'Mark as former staff'}: ${user.name}`, `<form class="staff-employment-form"><p>${restore ? 'Restore this person to active staff. They will sign in again with their existing account.' : 'Their account will be signed out and hidden from staff pages. Their records will stay available here in Admin.'}</p>
    ${restore ? '' : `<label>Last working date<input name="lastWorkingDate" type="date" max="${attendanceToday()}" value="${attendanceToday()}" required></label><label>Reason<select name="reason" required><option value="Resigned">Resigned</option><option value="Retired">Retired</option><option value="Contract ended">Contract ended</option><option value="Other">Other</option></select></label>`}
    <label>Admin note (optional)<textarea name="note" rows="2" maxlength="1000"></textarea></label><p data-employment-error role="alert"></p><footer><button type="button" class="action-btn secondary" data-employment-close>Cancel</button><button type="submit" class="action-btn">${restore ? 'Restore to active staff' : 'Mark as former staff'}</button></footer></form>`);
    dialog.querySelector('form').addEventListener('submit', async event => {
        event.preventDefault();
        const button = dialog.querySelector('[type="submit"]');
        const error = dialog.querySelector('[data-employment-error]');
        button.disabled = true;
        error.textContent = '';
        try {
            const firebaseUser = window.AppFirebaseAuth?.currentUser;
            if (!firebaseUser) throw new Error('Please sign in again before changing staff status.');
            const token = await firebaseUser.getIdToken();
            const values = Object.fromEntries(new FormData(event.target));
            const response = await fetch('/api/staff-employment', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId: id, action: restore ? 'restore' : 'archive', ...values }) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Could not change staff status.');
            window.AppDB.cache?.clear();
            window.AppDB.employmentUsers = null;
            window.AppAnalytics?.memo?.clear();
            statusFilter = restore ? 'active' : 'former';
            dialog.close();
            if (result.warning) alert(result.warning);
            await window.app_refreshAdminPage?.({ preserveCardId: 'staff-management' });
        } catch (err) { error.textContent = err.message; button.disabled = false; }
    });
}
async function showHistory(id) {
    if (!canManageStaff(current())) return;
    const user = await window.AppDB.get('users', id, { includeFormer: true });
    if (!user) return;
    const dialog = openDialog(`Staff history: ${user.name}`, '<p role="status">Loading staff records…</p>');
    const collections = ['attendance', 'leaves', 'work_plans', 'staff_employment'];
    if (current().isAdmin || current().permissions?.reports === 'admin') collections.push('salaries');
    const results = await Promise.allSettled(collections.map(name => name === 'staff_employment'
        ? window.AppDB.get(name, id, { includeFormer: true })
        : window.AppDB.getAll(name, { includeFormer: true })));
    const failures = [];
    const data = {};
    collections.forEach((name,index) => {
        const result=results[index];
        if (result.status==='rejected') { failures.push(name.replaceAll('_',' ')); data[name]=[]; }
        else data[name] = name === 'staff_employment' ? result.value : result.value.filter(row => String(row.user_id || row.userId || row.staffId)===String(id));
    });
    const tasks = (data.work_plans || []).flatMap(plan => (plan.plans || []).map((task,index) => ({...task, planId:plan.id,index,date:plan.date}))).filter(task => !task.isRemoved && !task.isPrivate && task.status!=='completed' && !task.completed);
    const employment = data.staff_employment || {};
    dialog.innerHTML = `<header><h3>${safeHtml(user.name)} · Staff history</h3><button type="button" data-employment-close aria-label="Close">×</button></header>${employmentBadge(user)}
    ${employment.reason ? `<p>${safeHtml(employment.reason)}${employment.note ? ` · ${safeHtml(employment.note)}` : ''}</p>` : ''}
    ${failures.length ? `<p role="alert">Could not load: ${safeHtml(failures.join(', '))}. Please retry.</p>` : ''}
    <details open><summary>Unfinished work (${tasks.length})</summary><ul>${tasks.map(task => `<li>${safeHtml(task.date)} · ${safeHtml(task.task || 'Task')} ${current().isAdmin ? `<button type="button" data-reassign-plan="${safeHtml(task.planId)}" data-task-index="${task.index}">Reassign</button>` : ''}</li>`).join('') || '<li>No unfinished public tasks found.</li>'}</ul></details>
    ${['attendance','leaves','salaries'].filter(name => data[name]).map(name => `<details><summary>${safeHtml(name[0].toUpperCase()+name.slice(1))} (${data[name].length})</summary><ul>${data[name].slice().sort((a,b)=>String(b.date||b.startDate||'').localeCompare(String(a.date||a.startDate||''))).slice(0,100).map(row=>`<li>${safeHtml(row.date || row.startDate || row.month || '')} · ${safeHtml(row.type || row.status || 'Saved record')}${row.checkIn ? ` · ${safeHtml(row.checkIn)} → ${safeHtml(row.checkOut || 'No checkout')}` : ''}</li>`).join('') || '<li>No saved records.</li>'}</ul>${data[name].length>100 ? '<p>Showing the latest 100 records.</p>' : ''}</details>`).join('')}`;
    dialog.querySelectorAll('[data-reassign-plan]').forEach(button => button.addEventListener('click', () => {
        dialog.close(); window.app_openDelegateModal?.(button.dataset.reassignPlan, Number(button.dataset.taskIndex));
    }));
}
export function bindStaffEmployment() {
    if (bound) return;
    bound = true;
    onAction('staff-employment-change', el => { changeEmployment(el.dataset.userId).catch(err => alert(err.message)); });
    onAction('staff-employment-history', el => { showHistory(el.dataset.userId).catch(err => alert(err.message)); });
    document.addEventListener('change', event => {
        if (event.target.matches('[data-staff-employment-filter]')) { statusFilter = event.target.value; applyFilters(); }
    });
    document.addEventListener('input', event => {
        if (event.target.matches('[data-staff-employment-search]')) { searchFilter = event.target.value; applyFilters(); }
    });
}
