import { safeHtml } from './helpers.js';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (value) => String(value).padStart(2, '0');

const getNow = () => {
    if (window.AppDB?.getIstNow) return new Date(window.AppDB.getIstNow());
    return new Date();
};

const getCalendarState = () => {
    const now = getNow();
    const state = window.app_birthdayCalendarState || {};
    const selectedMonth = Number(state.selectedMonth || now.getMonth() + 1);
    const selectedYear = Number(state.selectedYear || now.getFullYear());
    const view = state.view === 'year' ? 'year' : 'month';
    window.app_birthdayCalendarState = { view, selectedMonth, selectedYear };
    return window.app_birthdayCalendarState;
};

const toBirthdayText = (entry) => {
    const day = Number(entry?.birthDay || 0);
    const month = Number(entry?.birthMonth || 0);
    const year = Number(entry?.birthYear || 0);
    const dayText = day ? pad(day) : '--';
    const monthText = month ? MONTH_NAMES[month - 1] : '--';
    return `${dayText} ${monthText}${year ? ` ${year}` : ''}`.trim();
};

const toSortKey = (entry) => {
    const month = Number(entry?.birthMonth || 99);
    const day = Number(entry?.birthDay || 99);
    const name = String(entry?.name || '').toLowerCase();
    return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${name}`;
};

const toStaffOptionLabel = (user) => {
    const role = user?.role || 'Employee';
    const dept = user?.dept || user?.department || 'General';
    return `${user?.name || 'Staff'} - ${role} / ${dept}`;
};

const toSourceBadge = (entry) => entry?.source === 'external'
    ? '<span class="birthday-source-pill external">External</span>'
    : '<span class="birthday-source-pill staff">Staff</span>';

const toMetaLine = (entry) => {
    if (entry?.source === 'external') {
        return `${entry?.position || 'Position not set'} • ${entry?.location || 'Location not set'}`;
    }
    return `${entry?.role || 'Employee'} • ${entry?.dept || 'General'}`;
};

const toReminderLabel = (entry) => Number(entry?.birthDay || 0) > 0
    ? '<span class="birthday-status ok">Reminder eligible</span>'
    : '<span class="birthday-status warn">Add day to enable reminder</span>';

const toEditAction = (entry, canEdit) => {
    if (!canEdit) return '';
    return `<button type="button" class="action-btn secondary" style="margin-top:0.55rem; padding:0.42rem 0.72rem;" onclick="window.app_openBirthdayEditor('${safeHtml(entry?.source || 'user')}', '${safeHtml(entry?.id || '')}')">Edit</button>`;
};

const groupEntriesByMonth = (entries) => {
    const map = new Map();
    for (let month = 1; month <= 12; month += 1) map.set(month, []);
    entries.forEach((entry) => {
        const month = Number(entry?.birthMonth || 0);
        if (month >= 1 && month <= 12) map.get(month).push(entry);
    });
    for (let month = 1; month <= 12; month += 1) {
        map.get(month).sort((a, b) => toSortKey(a).localeCompare(toSortKey(b)));
    }
    return map;
};

const buildMonthGrid = (month, year) => {
    const firstDate = new Date(year, month - 1, 1);
    const firstWeekday = firstDate.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push({ type: 'empty', key: `e-${month}-${i}` });
    for (let day = 1; day <= daysInMonth; day += 1) cells.push({ type: 'day', day, key: `d-${month}-${day}` });
    while (cells.length % 7 !== 0) cells.push({ type: 'empty', key: `tail-${month}-${cells.length}` });
    return cells;
};

const renderAgendaCard = (entry, canEdit) => `
    <article class="birthday-agenda-card">
        <div class="birthday-agenda-head">
            <div>
                <div class="birthday-agenda-name">${safeHtml(entry.name || 'Staff')}</div>
                <div class="birthday-agenda-meta">${safeHtml(toMetaLine(entry))}</div>
            </div>
            ${toSourceBadge(entry)}
        </div>
        <div class="birthday-agenda-date">${safeHtml(toBirthdayText(entry))}</div>
        <div class="birthday-agenda-foot">
            ${toReminderLabel(entry)}
            ${toEditAction(entry, canEdit)}
        </div>
    </article>
`;

const renderMiniMonth = (month, entries, selectedMonth) => {
    const chips = entries.slice(0, 3).map((entry) => `
        <div class="birthday-mini-chip">
            <span>${safeHtml(String(entry.birthDay || '--'))}</span>
            <span>${safeHtml(entry.name || 'Staff')}</span>
        </div>
    `).join('');
    return `
        <button type="button" class="birthday-mini-month ${selectedMonth === month ? 'is-selected' : ''}" onclick="window.app_goToBirthdayCalendarMonth(${month})">
            <div class="birthday-mini-month-head">
                <span>${safeHtml(MONTH_NAMES[month - 1])}</span>
                <strong>${entries.length}</strong>
            </div>
            <div class="birthday-mini-month-body">
                ${chips || '<div class="birthday-mini-empty">No birthdays saved</div>'}
            </div>
        </button>
    `;
};

export async function renderBirthdayCalendar() {
    const currentUser = window.AppAuth?.getUser?.();
    const canManage = window.app_canManageBirthdays?.(currentUser);
    const canEdit = window.app_canAdminBirthdays?.(currentUser);
    const canSeeAdmin = window.app_canSeeAdminPanel?.(currentUser);
    if (!currentUser || !canManage) {
        return `
            <div class="card" style="max-width:720px; margin:1rem auto;">
                <h3 style="margin-top:0;">Birthday Calendar</h3>
                <p style="color:#64748b; margin-bottom:0;">You do not have permission to view the birthday calendar.</p>
            </div>
        `;
    }

    const [users, externalPeople] = await Promise.all([
        window.AppDB.getAll('users').catch(() => []),
        window.AppDB.getAll('birthday_people', { silentPermissionDenied: true }).catch(() => [])
    ]);

    const sortedUsers = [...users].sort((a, b) => toSortKey(a).localeCompare(toSortKey(b)));
    const allEntries = [
        ...sortedUsers.map((user) => ({ ...user, source: 'user' })),
        ...externalPeople.map((person) => ({ ...person, source: 'external' }))
    ].sort((a, b) => toSortKey(a).localeCompare(toSortKey(b)));

    const entriesWithMonth = allEntries.filter((entry) => Number(entry?.birthMonth || 0) >= 1 && Number(entry?.birthMonth || 0) <= 12);
    const incompleteEntries = allEntries.filter((entry) => !(Number(entry?.birthMonth || 0) >= 1 && Number(entry?.birthMonth || 0) <= 12));
    const entriesByMonth = groupEntriesByMonth(entriesWithMonth);
    const calendarState = getCalendarState();
    const selectedMonth = calendarState.selectedMonth;
    const selectedYear = calendarState.selectedYear;
    const now = getNow();
    const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
    const selectedEntries = entriesByMonth.get(selectedMonth) || [];
    const availableStaffOptions = sortedUsers.map((user) => `
        <option value="${safeHtml(user.id)}">${safeHtml(toStaffOptionLabel(user))}</option>
    `).join('');
    const gridCells = buildMonthGrid(selectedMonth, selectedYear);
    const monthEntryMap = new Map();
    selectedEntries.forEach((entry) => {
        const day = Number(entry?.birthDay || 0);
        if (!day) return;
        const existing = monthEntryMap.get(day) || [];
        existing.push(entry);
        monthEntryMap.set(day, existing);
    });

    const monthlyGrid = gridCells.map((cell) => {
        if (cell.type === 'empty') return '<div class="birthday-day-cell empty"></div>';
        const dayEntries = monthEntryMap.get(cell.day) || [];
        const isToday = isCurrentMonth && cell.day === now.getDate();
        const preview = dayEntries.slice(0, 2).map((entry) => `
            <div class="birthday-day-chip ${entry.source === 'external' ? 'external' : 'staff'}">
                <span>${safeHtml(entry.name || 'Staff')}</span>
            </div>
        `).join('');
        return `
            <div class="birthday-day-cell ${dayEntries.length ? 'has-birthday' : ''} ${isToday ? 'is-today' : ''}">
                <div class="birthday-day-number">${cell.day}</div>
                <div class="birthday-day-stack">
                    ${preview || '<div class="birthday-day-placeholder">No birthdays</div>'}
                    ${dayEntries.length > 2 ? `<div class="birthday-day-more">+${dayEntries.length - 2} more</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    const monthTabs = MONTH_NAMES.map((monthName, index) => `
        <button type="button" class="birthday-month-tab ${selectedMonth === index + 1 ? 'is-active' : ''}" onclick="window.app_goToBirthdayCalendarMonth(${index + 1})">${safeHtml(monthName.slice(0, 3))}</button>
    `).join('');

    const monthlyAgenda = selectedEntries.length
        ? selectedEntries.map((entry) => renderAgendaCard(entry, canEdit)).join('')
        : '<div class="birthday-empty-panel">No birthdays have been assigned to this month yet.</div>';

    const yearlyGrid = MONTH_NAMES.map((monthName, index) => renderMiniMonth(index + 1, entriesByMonth.get(index + 1) || [], selectedMonth)).join('');

    const incompleteRows = incompleteEntries.length
        ? incompleteEntries.map((entry) => `
            <article class="birthday-incomplete-row">
                <div>
                    <div class="birthday-incomplete-name-wrap">
                        <strong>${safeHtml(entry.name || 'Staff')}</strong>
                        ${toSourceBadge(entry)}
                    </div>
                    <div class="birthday-incomplete-meta">${safeHtml(toMetaLine(entry))}</div>
                </div>
                <div style="text-align:right;">
                    <div class="birthday-incomplete-date">${safeHtml(toBirthdayText(entry))}</div>
                    <div class="birthday-status warn">Month missing or incomplete</div>
                    ${toEditAction(entry, canEdit)}
                </div>
            </article>
        `).join('')
        : '<div class="birthday-empty-panel">All saved birthday records already have a month assigned.</div>';

    const actionsPanel = canEdit ? `
        <section class="birthday-side-card birthday-actions-card">
            <div class="birthday-section-kicker">Manage This Month</div>
            <h3>${safeHtml(MONTH_NAMES[selectedMonth - 1])} Actions</h3>
            <form id="birthday-month-form-${selectedMonth}" onsubmit="window.app_submitBirthdayMonthForm(event, ${selectedMonth})" class="birthday-add-form">
                <label>
                    <span>Add staff to ${safeHtml(MONTH_NAMES[selectedMonth - 1])}</span>
                    <select name="userId" required>
                        <option value="">Select staff</option>
                        ${availableStaffOptions}
                    </select>
                </label>
                <div class="birthday-add-grid">
                    <label>
                        <span>Day</span>
                        <input type="number" name="birthDay" min="1" max="31" placeholder="DD">
                    </label>
                    <label>
                        <span>Year</span>
                        <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY">
                    </label>
                </div>
                <button type="submit" class="action-btn">Save Staff Birthday</button>
            </form>
            <button type="button" class="action-btn secondary" onclick="window.app_openExternalBirthdayPersonModal(${selectedMonth})">Add Person Not In System</button>
        </section>
    ` : '';

    return `
        <style>
            .birthday-modern { --birthday-bg: linear-gradient(180deg, #f5f8ff 0%, #fcfdff 100%); --birthday-border: rgba(107, 133, 194, 0.24); --birthday-surface: rgba(255,255,255,0.92); display:grid; gap:1rem; }
            .birthday-shell { background:var(--birthday-bg); border:1px solid var(--birthday-border); border-radius:28px; box-shadow:0 18px 48px rgba(40, 63, 124, 0.14); overflow:hidden; position:relative; }
            .birthday-shell::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at top right, rgba(147, 197, 253, 0.3), transparent 28%), radial-gradient(circle at bottom left, rgba(191, 219, 254, 0.28), transparent 34%); pointer-events:none; }
            .birthday-shell>* { position:relative; z-index:1; }
            .birthday-hero { padding:1.2rem 1.2rem 1rem; display:grid; gap:0.85rem; background:linear-gradient(135deg, #19376d, #284b9b 56%, #4f7cff); color:#f8fbff; }
            .birthday-hero-top, .birthday-toolbar, .birthday-panel-head, .birthday-agenda-head, .birthday-mini-month-head, .birthday-incomplete-row { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
            .birthday-kicker, .birthday-section-kicker { font-size:0.72rem; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; }
            .birthday-title { margin:0.25rem 0 0.15rem; font-size:1.55rem; line-height:1.1; }
            .birthday-copy { margin:0; max-width:780px; opacity:0.92; font-size:0.9rem; }
            .birthday-hero-actions, .birthday-period-nav { display:flex; gap:0.55rem; flex-wrap:wrap; align-items:center; }
            .birthday-view-switch { display:inline-flex; padding:0.28rem; border-radius:999px; background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.18); gap:0.28rem; }
            .birthday-view-switch button, .birthday-nav-btn, .birthday-month-tab, .birthday-mini-month { cursor:pointer; }
            .birthday-view-switch button { border:none; border-radius:999px; padding:0.55rem 0.9rem; font-weight:700; font-size:0.88rem; background:transparent; color:rgba(255,255,255,0.82); }
            .birthday-view-switch button.is-active { background:#f8fbff; color:#1f3f83; }
            .birthday-nav-btn { border:none; width:2.15rem; height:2.15rem; border-radius:999px; background:rgba(255,255,255,0.18); color:#fff; font-size:0.92rem; }
            .birthday-period-label { padding:0.62rem 0.9rem; border-radius:16px; background:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.2); min-width:210px; }
            .birthday-period-title { display:block; font-size:0.98rem; font-weight:800; }
            .birthday-period-sub, .birthday-panel-sub, .birthday-agenda-meta, .birthday-incomplete-meta, .birthday-empty-panel, .birthday-mini-empty { display:block; font-size:0.84rem; color:#78716c; }
            .birthday-period-sub { font-size:0.8rem; color:rgba(248, 251, 255, 0.96); font-weight:600; }
            .birthday-month-tabs { display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.35rem; }
            .birthday-month-tab { border:none; border-radius:14px; background:rgba(255,255,255,0.14); color:rgba(255,255,255,0.86); padding:0.45rem 0; font-weight:700; font-size:0.82rem; }
            .birthday-month-tab.is-active { background:#f8fbff; color:#1f3f83; }
            .birthday-body { padding:1rem; display:grid; gap:0.9rem; }
            .birthday-month-layout { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(300px,0.95fr); gap:1rem; align-items:start; }
            .birthday-panel, .birthday-side-card, .birthday-year-panel { background:var(--birthday-surface); border:1px solid var(--birthday-border); border-radius:24px; box-shadow:0 12px 28px rgba(40, 63, 124, 0.08); backdrop-filter:blur(14px); }
            .birthday-panel, .birthday-side-card, .birthday-year-panel, .birthday-incomplete-wrap { padding:0.9rem; }
            .birthday-panel-head h3, .birthday-side-card h3, .birthday-year-panel h3 { margin:0; color:#1f3f83; font-size:1.05rem; }
            .birthday-weekdays, .birthday-calendar-grid { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:0.6rem; }
            .birthday-weekdays { margin-bottom:0.6rem; }
            .birthday-weekdays span { text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:#5d77b0; font-weight:800; }
            .birthday-day-cell { min-height:110px; padding:0.55rem; border-radius:18px; border:1px solid rgba(134, 157, 214, 0.16); background:linear-gradient(180deg,#ffffff,#f6f9ff); display:flex; flex-direction:column; gap:0.45rem; overflow:hidden; }
            .birthday-day-cell.empty { background:rgba(148,163,184,0.08); border-style:dashed; min-height:90px; }
            .birthday-day-cell.has-birthday { border-color:rgba(79, 124, 255, 0.26); box-shadow:inset 0 0 0 1px rgba(147, 197, 253, 0.22); }
            .birthday-day-cell.is-today { outline:2px solid rgba(40, 75, 155, 0.26); }
            .birthday-day-number, .birthday-agenda-name, .birthday-mini-month-head, .birthday-incomplete-name-wrap strong { font-weight:800; color:#0f172a; }
            .birthday-day-number { font-size:0.82rem; }
            .birthday-day-stack, .birthday-agenda, .birthday-actions-card, .birthday-add-form, .birthday-add-grid, .birthday-mini-month-body { display:grid; gap:0.5rem; }
            .birthday-day-stack { align-content:start; min-height:0; overflow:hidden; }
            .birthday-day-chip, .birthday-mini-chip { display:flex; align-items:center; justify-content:space-between; gap:0.35rem; border-radius:10px; padding:0.28rem 0.42rem; font-size:0.68rem; font-weight:700; background:#e8f0ff; color:#21418b; min-width:0; }
            .birthday-day-chip span, .birthday-mini-chip span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            .birthday-day-chip.external { background:#eef4ff; color:#4c67a1; }
            .birthday-day-placeholder { color:#94a3b8; font-size:0.68rem; }
            .birthday-day-more { font-size:0.66rem; color:#5d77b0; font-weight:700; }
            .birthday-side { display:grid; gap:1rem; }
            .birthday-agenda { max-height:520px; overflow:auto; }
            .birthday-agenda-card { border-radius:18px; padding:0.85rem; background:linear-gradient(180deg,#fff,#f6f9ff); border:1px solid rgba(107, 133, 194, 0.18); display:grid; gap:0.45rem; }
            .birthday-agenda-date, .birthday-incomplete-date { font-size:0.84rem; font-weight:800; color:#21418b; }
            .birthday-source-pill, .birthday-status { display:inline-flex; align-items:center; border-radius:999px; padding:0.2rem 0.48rem; font-size:0.66rem; font-weight:800; }
            .birthday-source-pill.external { background:#eef4ff; color:#4c67a1; }
            .birthday-source-pill.staff, .birthday-status.ok { background:#e7f0ff; color:#21418b; }
            .birthday-status.warn { background:#eef2ff; color:#4f5f9c; }
            .birthday-add-grid { grid-template-columns:repeat(2, minmax(0,1fr)); }
            .birthday-add-form label { display:grid; gap:0.32rem; }
            .birthday-add-form span { font-size:0.72rem; font-weight:700; color:#36548f; }
            .birthday-add-form select, .birthday-add-form input { width:100%; padding:0.65rem 0.75rem; border-radius:14px; border:1px solid #c6d4f7; background:#fff; font-size:0.88rem; }
            .birthday-year-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:0.9rem; }
            .birthday-mini-month { border:1px solid rgba(107, 133, 194, 0.18); border-radius:22px; background:linear-gradient(180deg,#fff,#f6f9ff); padding:0.85rem; display:grid; gap:0.7rem; text-align:left; }
            .birthday-mini-month.is-selected { border-color:rgba(40, 75, 155, 0.35); box-shadow:inset 0 0 0 1px rgba(79, 124, 255, 0.18); }
            .birthday-mini-month-head strong { font-size:1.05rem; color:#1f3f83; }
            .birthday-incomplete-wrap { background:var(--birthday-surface); border:1px solid var(--birthday-border); border-radius:24px; box-shadow:0 12px 28px rgba(40, 63, 124, 0.08); }
            .birthday-incomplete-row { padding:0.8rem 0; border-bottom:1px solid rgba(226,232,240,0.8); }
            .birthday-incomplete-row:last-child { border-bottom:none; }
            .birthday-incomplete-name-wrap { display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; }
            @media (max-width:1100px) { .birthday-month-layout { grid-template-columns:1fr; } .birthday-year-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
            @media (max-width:780px) { .birthday-hero, .birthday-body, .birthday-incomplete-wrap { padding:0.85rem; } .birthday-month-tabs { grid-template-columns:repeat(4, minmax(0,1fr)); } .birthday-weekdays, .birthday-calendar-grid { gap:0.35rem; } .birthday-day-cell { min-height:88px; padding:0.45rem; } .birthday-year-grid { grid-template-columns:1fr; } }
        </style>
        <div class="birthday-modern">
            <section class="birthday-shell">
                <div class="birthday-hero">
                    <div class="birthday-hero-top">
                        <div>
                            <div class="birthday-kicker">Birthday Calendar</div>
                            <h2 class="birthday-title">Birthday planner</h2>
                            <p class="birthday-copy">Start from the current month, move through the year only when you need to, and manage staff plus outside people from one calendar view.</p>
                        </div>
                        <div class="birthday-hero-actions">
                            ${canEdit ? `<button type="button" class="action-btn" onclick="window.app_openExternalBirthdayPersonModal(${selectedMonth})">Add Person Not In System</button>` : ''}
                            <button type="button" class="action-btn secondary" onclick="window.location.hash='${canSeeAdmin ? 'admin' : 'dashboard'}'">${canSeeAdmin ? 'Back to Admin' : 'Back to Dashboard'}</button>
                        </div>
                    </div>
                    <div class="birthday-toolbar">
                        <div class="birthday-period-nav">
                            <button type="button" class="birthday-nav-btn" onclick="window.app_changeBirthdayCalendarMonth(-1)">&larr;</button>
                            <div class="birthday-period-label">
                                <span class="birthday-period-title">${safeHtml(MONTH_NAMES[selectedMonth - 1])} ${selectedYear}</span>
                                <span class="birthday-period-sub">${selectedEntries.length} birthdays this month</span>
                            </div>
                            <button type="button" class="birthday-nav-btn" onclick="window.app_changeBirthdayCalendarMonth(1)">&rarr;</button>
                        </div>
                        <div class="birthday-view-switch">
                            <button type="button" class="${calendarState.view === 'month' ? 'is-active' : ''}" onclick="window.app_setBirthdayCalendarView('month')">Monthly View</button>
                            <button type="button" class="${calendarState.view === 'year' ? 'is-active' : ''}" onclick="window.app_setBirthdayCalendarView('year')">Yearly View</button>
                        </div>
                    </div>
                    <div class="birthday-month-tabs">${monthTabs}</div>
                </div>
                <div class="birthday-body">
                    ${calendarState.view === 'month' ? `
                        <div class="birthday-month-layout">
                            <section class="birthday-panel">
                                <div class="birthday-panel-head">
                                    <div>
                                        <h3>${safeHtml(MONTH_NAMES[selectedMonth - 1])} Calendar</h3>
                                        <div class="birthday-panel-sub">Default focus is the current month. Switch month whenever you need another view.</div>
                                    </div>
                                    <div class="birthday-status ok">${selectedEntries.length} saved</div>
                                </div>
                                <div class="birthday-weekdays">${WEEKDAY_NAMES.map((name) => `<span>${name}</span>`).join('')}</div>
                                <div class="birthday-calendar-grid">${monthlyGrid}</div>
                            </section>
                            <div class="birthday-side">
                                <section class="birthday-side-card">
                                    <div class="birthday-section-kicker">This Month</div>
                                    <h3>${safeHtml(MONTH_NAMES[selectedMonth - 1])} Birthdays</h3>
                                    <div class="birthday-agenda">${monthlyAgenda}</div>
                                </section>
                                ${actionsPanel}
                            </div>
                        </div>
                    ` : `
                        <section class="birthday-year-panel">
                            <div class="birthday-panel-head">
                                <div>
                                    <h3>Yearly Birthday View</h3>
                                    <div class="birthday-panel-sub">See all 12 months together, then open any month for detail.</div>
                                </div>
                                <div class="birthday-status ok">${entriesWithMonth.length} annual records</div>
                            </div>
                            <div class="birthday-year-grid">${yearlyGrid}</div>
                        </section>
                    `}
                </div>
            </section>
            <section class="birthday-incomplete-wrap">
                <div class="birthday-panel-head">
                    <div>
                        <h3>Incomplete Birthday Records</h3>
                        <div class="birthday-panel-sub">These entries still need a birth month or fuller details before they can behave like normal calendar records.</div>
                    </div>
                    <div class="birthday-status warn">${incompleteEntries.length} incomplete</div>
                </div>
                ${incompleteRows}
            </section>
            <section class="birthday-incomplete-wrap">
                <div class="birthday-panel-head">
                    <div>
                        <h3>How Birthday Reminder Works</h3>
                        <div class="birthday-panel-sub">Quick guide for admins and birthday managers.</div>
                    </div>
                    <div class="birthday-status ok">Reminder guide</div>
                </div>
                <div style="display:grid; gap:0.85rem; color:#475569; line-height:1.6;">
                    <div><strong style="color:#7c2d12;">1. Required details:</strong> the reminder works when a person has both birthday day and birthday month saved. Year is optional.</div>
                    <div><strong style="color:#7c2d12;">2. When it appears:</strong> the system checks the birthday date for the current year and shows the reminder on the previous working day.</div>
                    <div><strong style="color:#7c2d12;">3. Weekend or holiday case:</strong> if the birthday comes after a weekend or holiday, the reminder moves back to the last working day before it.</div>
                    <div><strong style="color:#7c2d12;">4. Who receives it:</strong> admins and users with birthday permission receive the personalized birthday popup and notification.</div>
                    <div><strong style="color:#7c2d12;">5. Who is included:</strong> reminders work for both staff in the system and people added separately in the birthday planner.</div>
                    <div><strong style="color:#7c2d12;">6. Duplicate protection:</strong> reopening or refreshing the app does not keep creating the same reminder again.</div>
                </div>
            </section>
        </div>
    `;
}
