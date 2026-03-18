/**
 * Team Activities Page
 * Full page view for team activity management.
 */

import { safeHtml } from './helpers.js';

const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 250;

function getDefaultRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
        startIso: start.toISOString().split('T')[0],
        endIso: end.toISOString().split('T')[0]
    };
}

function getTeamActivitiesState() {
    if (!window.app_teamActivitiesState) {
        const range = getDefaultRange();
        window.app_teamActivitiesState = {
            startIso: range.startIso,
            endIso: range.endIso,
            staffIds: [],
            status: 'all',
            type: 'all',
            search: '',
            sortKey: 'date-desc',
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            columnVisibility: {
                type: true,
                status: true,
                sourceTime: true
            },
            users: [],
            data: [],
            filtered: [],
            lastRefreshed: null
        };
    }
    return window.app_teamActivitiesState;
}

function normalizeActivityRows(rows) {
    return (rows || []).map(row => {
        const type = row.type || (row.workDescription ? 'attendance' : 'work');
        const description = row._displayDesc || row.workDescription || row.task || 'Activity';
        const sourceTime = row.checkOut || row._sortTime || '00:00';
        const statusSeed = row.status || (type === 'attendance' ? 'completed' : '');
        const status = window.AppCalendar
            ? window.AppCalendar.getSmartTaskStatus(row.date, statusSeed)
            : (statusSeed || 'to-be-started');
        return {
            date: row.date || '',
            staffName: row.staffName || row.userName || 'Unknown Staff',
            type,
            description,
            status,
            sourceTime,
            userId: row.userId || row.user_id || '',
            planId: row.planId || row.id || '',
            taskIndex: Number.isInteger(row.taskIndex) ? row.taskIndex : null,
            planScope: row.planScope || 'personal'
        };
    });
}

function isIncompleteStatus(status) {
    const key = String(status || '').toLowerCase();
    return ['overdue', 'not-completed', 'to-be-started', 'in-process'].includes(key);
}

function nextDateIso(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

function isValidIsoDate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

function openPostponePicker(anchorEl, defaultDate) {
    return new Promise((resolve) => {
        if (!anchorEl) {
            resolve(null);
            return;
        }

        const existing = document.getElementById('team-activities-postpone-popover');
        if (existing) existing.remove();

        const popover = document.createElement('div');
        popover.id = 'team-activities-postpone-popover';
        popover.className = 'team-activities-postpone-popover';
        popover.innerHTML = `
            <div class="team-activities-postpone-head">Postpone to</div>
            <input type="date" class="team-activities-postpone-input" value="${defaultDate}">
            <div class="team-activities-postpone-actions">
                <button type="button" class="team-activities-row-btn warn" data-postpone-cancel>Cancel</button>
                <button type="button" class="team-activities-row-btn success" data-postpone-confirm>Confirm</button>
            </div>
        `;

        document.body.appendChild(popover);

        const rect = anchorEl.getBoundingClientRect();
        const top = rect.bottom + window.scrollY + 8;
        const left = Math.min(rect.left + window.scrollX, window.innerWidth - 260);
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;

        const input = popover.querySelector('.team-activities-postpone-input');
        if (input) input.focus();

        const cleanup = (value) => {
            document.removeEventListener('click', onDocClick, true);
            popover.remove();
            resolve(value);
        };

        const onDocClick = (event) => {
            if (!popover.contains(event.target) && event.target !== anchorEl) {
                cleanup(null);
            }
        };

        document.addEventListener('click', onDocClick, true);

        popover.addEventListener('click', (event) => {
            const target = event.target;
            if (target.closest('[data-postpone-cancel]')) {
                cleanup(null);
            }
            if (target.closest('[data-postpone-confirm]')) {
                const value = input ? input.value : '';
                cleanup(value || null);
            }
        });
    });
}

function applyFilters(state) {
    const search = state.search.trim().toLowerCase();
    const staffIds = new Set(state.staffIds || []);
    const status = state.status;
    const type = state.type;

    let filtered = state.data.filter(row => {
        if (staffIds.size && !staffIds.has(row.userId)) return false;
        if (type !== 'all' && row.type !== type) return false;
        if (status !== 'all' && String(row.status || '').toLowerCase() !== status) return false;
        if (search) {
            const hay = `${row.date} ${row.staffName} ${row.description} ${row.status} ${row.type}`.toLowerCase();
            if (!hay.includes(search)) return false;
        }
        return true;
    });

    filtered = sortRows(filtered, state.sortKey);
    state.filtered = filtered;
    return filtered;
}

function sortRows(rows, sortKey) {
    const copy = [...rows];
    copy.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        const timeDiff = String(b.sourceTime || '').localeCompare(String(a.sourceTime || ''));
        const nameCmp = String(a.staffName || '').localeCompare(String(b.staffName || ''));
        if (sortKey === 'date-asc') return (new Date(a.date) - new Date(b.date)) || timeDiff;
        if (sortKey === 'staff-asc') return nameCmp || dateDiff;
        if (sortKey === 'staff-desc') return (-nameCmp) || dateDiff;
        if (sortKey === 'status') return String(a.status || '').localeCompare(String(b.status || '')) || dateDiff;
        if (sortKey === 'type') return String(a.type || '').localeCompare(String(b.type || '')) || dateDiff;
        if (sortKey === 'time') return String(a.sourceTime || '').localeCompare(String(b.sourceTime || '')) || dateDiff;
        return dateDiff || timeDiff;
    });
    return copy;
}

function paginate(rows, page, pageSize) {
    const safePage = Math.max(1, page);
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
}

function renderSummary(state) {
    const total = state.filtered.length;
    const staffSet = new Set(state.filtered.map(r => r.userId).filter(Boolean));
    const completed = state.filtered.filter(r => String(r.status).toLowerCase() === 'completed').length;
    const incomplete = total - completed;
    return `
        <div class="team-activities-chip">Total: <strong>${total}</strong></div>
        <div class="team-activities-chip">Staff: <strong>${staffSet.size}</strong></div>
        <div class="team-activities-chip">Completed: <strong>${completed}</strong></div>
        <div class="team-activities-chip">Incomplete: <strong>${incomplete}</strong></div>
    `;
}

function renderStaffFilter(state) {
    const allUsers = state.users || [];
    const selected = new Set(state.staffIds || []);
    const label = selected.size ? `${selected.size} selected` : 'All staff';
    const items = allUsers.map(u => `
        <label class="team-activities-checkbox">
            <input type="checkbox" data-staff-id="${u.id}" ${selected.has(u.id) ? 'checked' : ''}>
            <span>${safeHtml(u.name || 'Staff')}</span>
        </label>
    `).join('');

    return `
        <div class="team-activities-dropdown">
            <button class="team-activities-dropdown-btn" type="button" data-team-activities-staff-toggle>
                <i class="fa-solid fa-users"></i>
                <span>Staff: ${safeHtml(label)}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="team-activities-dropdown-panel" id="team-activities-staff-panel">
                <div class="team-activities-dropdown-actions">
                    <button type="button" class="team-activities-link" data-staff-select-all>Select all</button>
                    <button type="button" class="team-activities-link" data-staff-clear>Clear</button>
                </div>
                <div class="team-activities-dropdown-list">
                    ${items || '<div class="team-activities-empty">No staff found.</div>'}
                </div>
            </div>
        </div>
    `;
}

function renderColumnsPanel(state) {
    const vis = state.columnVisibility;
    return `
        <div class="team-activities-columns-popover" id="team-activities-columns-popover">
            <label class="team-activities-checkbox">
                <input type="checkbox" data-column="type" ${vis.type ? 'checked' : ''}>
                <span>Type</span>
            </label>
            <label class="team-activities-checkbox">
                <input type="checkbox" data-column="status" ${vis.status ? 'checked' : ''}>
                <span>Status</span>
            </label>
            <label class="team-activities-checkbox">
                <input type="checkbox" data-column="sourceTime" ${vis.sourceTime ? 'checked' : ''}>
                <span>Time</span>
            </label>
        </div>
    `;
}

function renderTable(state) {
    const vis = state.columnVisibility;
    const rows = paginate(state.filtered, state.page, state.pageSize);
    if (!rows.length) {
        return `<div class="team-activities-empty">No activities found for the selected filters.</div>`;
    }

    const headCols = `
        <th data-sort="date-desc">Date</th>
        <th data-sort="staff-asc">Staff</th>
        ${vis.type ? '<th data-sort="type">Type</th>' : ''}
        ${vis.status ? '<th data-sort="status">Status</th>' : ''}
        <th>Description</th>
        ${vis.sourceTime ? '<th data-sort="time">Time</th>' : ''}
        <th>Actions</th>
    `;

    const currentUserId = window.AppAuth?.getUser ? window.AppAuth.getUser()?.id : null;
    const body = rows.map(row => {
        const statusClass = String(row.status || '').toLowerCase().replace(/\s+/g, '-');
        const isOwner = currentUserId && row.userId && currentUserId === row.userId;
        return `
        <tr>
            <td>${safeHtml(row.date)}</td>
            <td>${safeHtml(row.staffName)}</td>
            ${vis.type ? `<td class="team-activities-type">${safeHtml(row.type)}</td>` : ''}
            ${vis.status ? `<td><span class="team-activities-status status-${safeHtml(statusClass)}">${safeHtml(row.status)}</span></td>` : ''}
            <td class="team-activities-desc">${safeHtml(row.description)}</td>
            ${vis.sourceTime ? `<td>${safeHtml(row.sourceTime || '--')}</td>` : ''}
            <td>
                <div class="team-activities-row-actions">
                    <button class="team-activities-row-btn" data-view-date="${safeHtml(row.date)}" data-view-user="${safeHtml(row.userId)}">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                    ${row.type === 'work' && isOwner && isIncompleteStatus(row.status) && row.planId && Number.isInteger(row.taskIndex) ? `
                        <button class="team-activities-row-btn warn" data-action="postpone" data-plan-id="${safeHtml(row.planId)}" data-task-index="${row.taskIndex}" data-plan-scope="${safeHtml(row.planScope)}" data-user-id="${safeHtml(row.userId)}" data-date="${safeHtml(row.date)}">
                            <i class="fa-solid fa-clock"></i> Postpone
                        </button>
                        <button class="team-activities-row-btn success" data-action="complete" data-plan-id="${safeHtml(row.planId)}" data-task-index="${row.taskIndex}" data-user-id="${safeHtml(row.userId)}">
                            <i class="fa-solid fa-check"></i> Complete
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `; }).join('');

    return `
        <table class="team-activities-table">
            <thead><tr>${headCols}</tr></thead>
            <tbody>${body}</tbody>
        </table>
    `;
}

function renderPagination(state) {
    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const current = Math.min(state.page, totalPages);
    return `
        <div class="team-activities-pagination">
            <button class="team-activities-page-btn" data-page="prev" ${current <= 1 ? 'disabled' : ''}>Prev</button>
            <span>Page ${current} of ${totalPages}</span>
            <button class="team-activities-page-btn" data-page="next" ${current >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
    `;
}

function updateUI() {
    const state = getTeamActivitiesState();
    applyFilters(state);
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    const summaryEl = document.getElementById('team-activities-summary');
    const tableWrap = document.getElementById('team-activities-table-wrap');
    const paginationWrap = document.getElementById('team-activities-pagination-wrap');
    const lastRef = document.getElementById('team-activities-last-updated');
    const columnsWrap = document.getElementById('team-activities-columns-wrap');
    const staffWrap = document.getElementById('team-activities-staff-wrap');

    if (summaryEl) summaryEl.innerHTML = renderSummary(state);
    if (tableWrap) tableWrap.innerHTML = renderTable(state);
    if (paginationWrap) paginationWrap.innerHTML = renderPagination(state);
    if (columnsWrap) columnsWrap.innerHTML = renderColumnsPanel(state);
    if (staffWrap) staffWrap.innerHTML = renderStaffFilter(state);
    if (lastRef && state.lastRefreshed) {
        lastRef.textContent = new Date(state.lastRefreshed).toLocaleString();
    }
}

async function refreshData() {
    const state = getTeamActivitiesState();
    const loading = document.getElementById('team-activities-loading');
    if (loading) loading.style.display = 'block';

    try {
        const rows = await window.AppAnalytics.getAllStaffActivities({
            mode: 'range',
            startIso: state.startIso,
            endIso: state.endIso,
            scope: 'all'
        });
        state.data = normalizeActivityRows(rows);
        state.lastRefreshed = Date.now();
        state.page = 1;
    } catch (err) {
        console.error('Team Activities fetch failed', err);
    } finally {
        if (loading) loading.style.display = 'none';
    }
    updateUI();
}

function updateStateFromFilters() {
    const state = getTeamActivitiesState();
    const startInput = document.getElementById('team-activities-start');
    const endInput = document.getElementById('team-activities-end');
    const typeSelect = document.getElementById('team-activities-type');
    const statusSelect = document.getElementById('team-activities-status');
    const searchInput = document.getElementById('team-activities-search');
    const pageSizeSelect = document.getElementById('team-activities-page-size');

    if (startInput) state.startIso = startInput.value || state.startIso;
    if (endInput) state.endIso = endInput.value || state.endIso;
    if (typeSelect) state.type = typeSelect.value || 'all';
    if (statusSelect) state.status = statusSelect.value || 'all';
    if (searchInput) state.search = searchInput.value || '';
    if (pageSizeSelect) state.pageSize = Number(pageSizeSelect.value) || DEFAULT_PAGE_SIZE;

    state.page = 1;
    updateUI();
}

function bindEvents() {
    const state = getTeamActivitiesState();
    if (state.bound) return;
    state.bound = true;

    let searchTimer = null;

    document.addEventListener('click', async (event) => {
        const target = event.target;
        const staffToggle = target.closest('[data-team-activities-staff-toggle]');
        const staffPanel = document.getElementById('team-activities-staff-panel');
        const columnsButton = target.closest('[data-team-activities-columns-toggle]');
        const columnsPopover = document.getElementById('team-activities-columns-popover');

        if (staffToggle && staffPanel) {
            staffPanel.classList.toggle('open');
        } else if (staffPanel && !staffPanel.contains(target)) {
            staffPanel.classList.remove('open');
        }

        if (columnsButton && columnsPopover) {
            columnsPopover.classList.toggle('open');
        } else if (columnsPopover && !columnsPopover.contains(target)) {
            columnsPopover.classList.remove('open');
        }

        const pageBtn = target.closest('.team-activities-page-btn');
        if (pageBtn) {
            const dir = pageBtn.dataset.page;
            const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
            if (dir === 'prev') state.page = Math.max(1, state.page - 1);
            if (dir === 'next') state.page = Math.min(totalPages, state.page + 1);
            updateUI();
        }

        const viewBtn = target.closest('[data-view-date]');
        if (viewBtn) {
            const date = viewBtn.getAttribute('data-view-date');
            const userId = viewBtn.getAttribute('data-view-user');
            if (window.app_openDayPlan) {
                window.app_openDayPlan(date, userId || '');
            }
        }

        const actionBtn = target.closest('[data-action]');
        if (actionBtn) {
            const action = actionBtn.getAttribute('data-action');
            if (action === 'complete' && window.app_teamActivitiesCompleteTask) {
                await window.app_teamActivitiesCompleteTask(actionBtn);
            }
            if (action === 'postpone' && window.app_teamActivitiesPostponeTask) {
                await window.app_teamActivitiesPostponeTask(actionBtn);
            }
        }

        const tableHead = target.closest('th[data-sort]');
        if (tableHead) {
            const key = tableHead.dataset.sort;
            if (key) {
                state.sortKey = key;
                updateUI();
            }
        }

        const selectAll = target.closest('[data-staff-select-all]');
        if (selectAll) {
            state.staffIds = (state.users || []).map(u => u.id);
            updateUI();
        }
        const clear = target.closest('[data-staff-clear]');
        if (clear) {
            state.staffIds = [];
            updateUI();
        }
    });

    document.addEventListener('change', (event) => {
        const target = event.target;
        if (target.matches('#team-activities-start, #team-activities-end')) {
            updateStateFromFilters();
            refreshData();
        } else if (target.matches('#team-activities-type, #team-activities-status, #team-activities-page-size')) {
            updateStateFromFilters();
        }
        if (target.matches('#team-activities-columns-popover input[type="checkbox"]')) {
            const col = target.getAttribute('data-column');
            if (col) state.columnVisibility[col] = target.checked;
            updateUI();
        }
        if (target.matches('#team-activities-staff-panel input[type="checkbox"]')) {
            const id = target.getAttribute('data-staff-id');
            if (!id) return;
            if (target.checked) {
                if (!state.staffIds.includes(id)) state.staffIds.push(id);
            } else {
                state.staffIds = state.staffIds.filter(x => x !== id);
            }
            updateUI();
        }
    });

    document.addEventListener('input', (event) => {
        if (!event.target.matches('#team-activities-search')) return;
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => updateStateFromFilters(), SEARCH_DEBOUNCE_MS);
    });
}

function buildCSV(rows) {
    const headers = ['Date', 'Staff', 'Type', 'Status', 'Description', 'Time'];
    const lines = rows.map(r => [
        r.date,
        r.staffName,
        r.type,
        r.status,
        r.description,
        r.sourceTime
    ].map(val => `"${String(val || '').replace(/\"/g, '""')}"`).join(','));
    return [headers.join(','), ...lines].join('\n');
}

// --- Global Actions ---
if (typeof window !== 'undefined') {
    window.app_initTeamActivities = async function () {
        const state = getTeamActivitiesState();
        const users = await window.AppAnalytics.getUsersCached();
        state.users = users || [];
        bindEvents();
        updateUI();
        await refreshData();
    };

    window.app_teamActivitiesRefresh = async function () {
        updateStateFromFilters();
        await refreshData();
    };

    window.app_teamActivitiesResetFilters = function () {
        const state = getTeamActivitiesState();
        const range = getDefaultRange();
        state.startIso = range.startIso;
        state.endIso = range.endIso;
        state.staffIds = [];
        state.status = 'all';
        state.type = 'all';
        state.search = '';
        state.sortKey = 'date-desc';
        state.page = 1;
        state.pageSize = DEFAULT_PAGE_SIZE;
        const startInput = document.getElementById('team-activities-start');
        const endInput = document.getElementById('team-activities-end');
        const typeSelect = document.getElementById('team-activities-type');
        const statusSelect = document.getElementById('team-activities-status');
        const searchInput = document.getElementById('team-activities-search');
        const pageSizeSelect = document.getElementById('team-activities-page-size');
        if (startInput) startInput.value = state.startIso;
        if (endInput) endInput.value = state.endIso;
        if (typeSelect) typeSelect.value = 'all';
        if (statusSelect) statusSelect.value = 'all';
        if (searchInput) searchInput.value = '';
        if (pageSizeSelect) pageSizeSelect.value = String(DEFAULT_PAGE_SIZE);
        updateUI();
        refreshData();
    };

    window.app_teamActivitiesCopyCSV = async function () {
        const state = getTeamActivitiesState();
        const csv = buildCSV(state.filtered);
        try {
            await navigator.clipboard.writeText(csv);
            alert('Table copied to clipboard.');
        } catch (err) {
            console.warn('Clipboard copy failed', err);
            alert('Copy failed. Please use Export Excel instead.');
        }
    };

    window.app_teamActivitiesExportXLSX = function () {
        const state = getTeamActivitiesState();
        if (window.AppReports?.exportTeamActivitiesXLSX) {
            window.AppReports.exportTeamActivitiesXLSX(state.filtered, {
                start: state.startIso,
                end: state.endIso
            });
        } else {
            alert('Export module not available.');
        }
    };

    window.app_teamActivitiesCompleteTask = async function (btn) {
        try {
            const currentUserId = window.AppAuth?.getUser ? window.AppAuth.getUser()?.id : null;
            const planId = btn.getAttribute('data-plan-id');
            const taskIndex = Number(btn.getAttribute('data-task-index'));
            const ownerId = btn.getAttribute('data-user-id') || '';
            if (!currentUserId || currentUserId !== ownerId) {
                alert('Only the assigned staff member can complete this task.');
                return;
            }
            if (!planId || !Number.isInteger(taskIndex) || !window.AppCalendar?.updateTaskStatus) return;
            btn.disabled = true;
            await window.AppCalendar.updateTaskStatus(planId, taskIndex, 'completed');
            await refreshData();
            if (window.app_showSyncToast) {
                window.app_showSyncToast('Task marked as completed.');
            }
        } catch (err) {
            console.error('Complete task failed', err);
            alert('Failed to complete task.');
        }
    };

    window.app_teamActivitiesPostponeTask = async function (btn) {
        try {
            const currentUserId = window.AppAuth?.getUser ? window.AppAuth.getUser()?.id : null;
            const planId = btn.getAttribute('data-plan-id');
            const taskIndex = Number(btn.getAttribute('data-task-index'));
            const planScope = btn.getAttribute('data-plan-scope') || 'personal';
            const userId = btn.getAttribute('data-user-id') || '';
            const dateStr = btn.getAttribute('data-date') || '';
            if (!currentUserId || currentUserId !== userId) {
                alert('Only the assigned staff member can postpone this task.');
                return;
            }
            if (!planId || !Number.isInteger(taskIndex) || !window.AppDB || !window.AppCalendar) return;

            btn.disabled = true;
            const plan = await window.AppDB.get('work_plans', planId);
            if (!plan || !Array.isArray(plan.plans) || !plan.plans[taskIndex]) {
                throw new Error('Plan or task not found');
            }

            const defaultDate = nextDateIso(dateStr);
            const pickedDate = await openPostponePicker(btn, defaultDate);
            if (!pickedDate) {
                btn.disabled = false;
                return;
            }
            const normalizedDate = String(pickedDate).trim();
            if (!isValidIsoDate(normalizedDate)) {
                alert('Invalid date. Please use YYYY-MM-DD.');
                btn.disabled = false;
                return;
            }

            const [task] = plan.plans.splice(taskIndex, 1);
            plan.updatedAt = new Date().toISOString();
            await window.AppDB.put('work_plans', plan);

            const nextDate = normalizedDate;
            const scope = planScope || plan.planScope || 'personal';
            const targetUserId = scope === 'annual' ? 'annual_shared' : (plan.userId || userId);
            const targetPlanId = window.AppCalendar.getWorkPlanId(nextDate, targetUserId, scope);
            const movedTask = {
                ...task,
                status: '',
                startDate: nextDate,
                endDate: nextDate
            };
            delete movedTask.completedDate;

            const targetPlan = await window.AppDB.get('work_plans', targetPlanId);
            if (targetPlan) {
                targetPlan.plans = Array.isArray(targetPlan.plans) ? targetPlan.plans : [];
                targetPlan.plans.push(movedTask);
                targetPlan.updatedAt = new Date().toISOString();
                await window.AppDB.put('work_plans', targetPlan);
            } else {
                const safeUserId = scope === 'annual' ? null : targetUserId;
                await window.AppCalendar.setWorkPlan(nextDate, [movedTask], safeUserId, { planScope: scope });
            }

            await refreshData();
            if (window.app_showSyncToast) {
                window.app_showSyncToast(`Task postponed to ${nextDate}.`);
            }
        } catch (err) {
            console.error('Postpone task failed', err);
            alert('Failed to postpone task.');
        }
    };
}

export async function renderTeamActivitiesPage() {
    const state = getTeamActivitiesState();
    return `
        <div class="team-activities-page">
            <div class="team-activities-header">
                <div>
                    <h2>Team Activities</h2>
                    <div class="team-activities-meta">Last updated: <span id="team-activities-last-updated">--</span></div>
                </div>
                <div class="team-activities-actions">
                    <button class="action-btn" onclick="window.app_teamActivitiesRefresh()"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    <button class="action-btn secondary" onclick="window.app_teamActivitiesResetFilters()"><i class="fa-solid fa-filter-circle-xmark"></i> Reset</button>
                    <button class="action-btn secondary" onclick="window.app_teamActivitiesCopyCSV()"><i class="fa-solid fa-copy"></i> Copy</button>
                    <button class="action-btn secondary" onclick="window.app_teamActivitiesExportXLSX()"><i class="fa-solid fa-file-excel"></i> Export Excel</button>
                    <div class="team-activities-columns">
                        <button class="action-btn secondary" data-team-activities-columns-toggle><i class="fa-solid fa-table-columns"></i> Columns</button>
                        <div id="team-activities-columns-wrap">${renderColumnsPanel(state)}</div>
                    </div>
                </div>
            </div>
            <div class="team-activities-summary" id="team-activities-summary">${renderSummary(state)}</div>
            <div class="team-activities-filters">
                <div class="team-activities-filter-group">
                    <label>Date range</label>
                    <div class="team-activities-date-range">
                        <input type="date" id="team-activities-start" value="${state.startIso}">
                        <span>to</span>
                        <input type="date" id="team-activities-end" value="${state.endIso}">
                    </div>
                </div>
                <div class="team-activities-filter-group" id="team-activities-staff-wrap">
                    ${renderStaffFilter(state)}
                </div>
                <div class="team-activities-filter-group">
                    <label>Type</label>
                    <select id="team-activities-type">
                        <option value="all" ${state.type === 'all' ? 'selected' : ''}>All</option>
                        <option value="attendance" ${state.type === 'attendance' ? 'selected' : ''}>Attendance</option>
                        <option value="work" ${state.type === 'work' ? 'selected' : ''}>Work Plan</option>
                    </select>
                </div>
                <div class="team-activities-filter-group">
                    <label>Status</label>
                    <select id="team-activities-status">
                        <option value="all" ${state.status === 'all' ? 'selected' : ''}>All</option>
                        <option value="completed" ${state.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="in-process" ${state.status === 'in-process' ? 'selected' : ''}>In Process</option>
                        <option value="overdue" ${state.status === 'overdue' ? 'selected' : ''}>Overdue</option>
                        <option value="not-completed" ${state.status === 'not-completed' ? 'selected' : ''}>Not Completed</option>
                        <option value="to-be-started" ${state.status === 'to-be-started' ? 'selected' : ''}>To Be Started</option>
                    </select>
                </div>
                <div class="team-activities-filter-group">
                    <label>Search</label>
                    <input type="text" id="team-activities-search" placeholder="Search by staff, description, date...">
                </div>
                <div class="team-activities-filter-group">
                    <label>Page size</label>
                    <select id="team-activities-page-size">
                        <option value="25" ${state.pageSize === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${state.pageSize === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${state.pageSize === 100 ? 'selected' : ''}>100</option>
                    </select>
                </div>
            </div>
            <div id="team-activities-loading" class="team-activities-loading">Loading data...</div>
            <div class="team-activities-table-wrap" id="team-activities-table-wrap"></div>
            <div id="team-activities-pagination-wrap"></div>
        </div>
    `;
}
