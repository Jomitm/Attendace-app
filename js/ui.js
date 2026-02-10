/**
 * UI Module
 * Handles all purely visual rendering.
 * (Converted to IIFE for file:// support)
 */
(function () {
    // --- Helper Functions (Local to IIFE) ---
    const renderWorkLog = (logs, collabs = []) => {
        const today = new Date();
        const startDefault = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDefault = today.toISOString().split('T')[0];

        return `
                <div class="card" style="padding: 0.6rem; display:flex; flex-direction:column; height:100%;">
                    <div style="margin-bottom:0.5rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.3rem;">
                         <h4 style="margin:0; color:#1f2937; font-size: 0.9rem;">Work Log</h4>
                         <span style="font-size:0.65rem; color:#6b7280;">Ongoing & Historical Tasks</span>
                    </div>
                     <div style="display:flex; gap:0.4rem; margin-bottom:0.75rem; align-items:center;">
                        <input type="date" id="act-start" value="${startDefault}" style="border:1px solid #e5e7eb; border-radius:4px; padding:3px; font-size:0.75rem; width:100px;">
                        <span style="color:#9ca3af; font-size:0.75rem;">to</span>
                        <input type="date" id="act-end" value="${endDefault}" style="border:1px solid #e5e7eb; border-radius:4px; padding:3px; font-size:0.75rem; width:100px;">
                        <button onclick="window.app_filterActivity()" style="background:var(--primary); color:white; border:none; border-radius:4px; padding:3px 6px; font-size:0.75rem; cursor:pointer;">Go</button>
                    </div>
                    <div id="activity-list" style="flex:1; overflow-y:auto; min-height: 120px; max-height: 180px; font-size:0.75rem; padding-right:5px;">
                        ${renderActivityList(logs, startDefault, endDefault, collabs)}
                    </div>
                </div>
            `;
    };

    window.app_filterActivity = () => {
        const s = document.getElementById('act-start').value;
        const e = document.getElementById('act-end').value;
        const list = document.getElementById('activity-list');
        const staffId = window.app_selectedSummaryStaffId || window.AppAuth.getUser().id;

        Promise.all([
            window.AppAttendance.getLogs(staffId),
            window.AppCalendar ? window.AppCalendar.getCollaborations(staffId) : Promise.resolve([])
        ]).then(([logs, collabs]) => {
            list.innerHTML = renderActivityList(logs, s, e, collabs);
        });
    };

    const renderActivityList = (allLogs, startStr, endStr, targetStaffId, collabs = []) => {
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

        const merged = [...logEntries, ...collabEntries].sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return b._sortTime.localeCompare(a._sortTime);
        });

        if (merged.length === 0) return '<div style="color:#9ca3af; text-align:center; padding:1rem;">No activity descriptions found.</div>';

        let html = '';
        let lastDate = '';
        const currentUser = window.AppAuth.getUser();
        const isAdminUser = currentUser && (currentUser.role === 'Administrator' || currentUser.isAdmin);

        merged.forEach(log => {
            const showDate = log.date !== lastDate;
            if (showDate) {
                html += `<div style="font-weight:600; color:#374151; background:#f9fafb; padding:4px 8px; border-radius:4px; margin-top:0.75rem; margin-bottom:0.25rem; font-size:0.8rem;">${log.date}</div>`;
                lastDate = log.date;
            }
            const borderColor = log._isCollab ? '#10b981' : '#e5e7eb';
            const bgStyle = log._isCollab ? 'background: #f0fdf4;' : '';
            let statusBadge = '';
            if (log._isCollab || log.status) {
                const status = window.AppCalendar.getSmartTaskStatus(log.date, log.status);
                statusBadge = `<div style="margin-top: 4px; display:flex; align-items:center; gap:8px;">${window.AppUI.renderTaskStatusBadge(status)}${isAdminUser ? `<div style="display:flex; gap:4px;"><button onclick="window.app_openDayPlan('${log.date}', '${targetStaffId}')" style="background:none; border:1px solid #e2e8f0; border-radius:4px; padding:2px 4px; font-size:0.6rem; color:#64748b; cursor:pointer;" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>` : ''}</div>`;
            }
            html += `<div style="margin-left:0.5rem; padding-left:0.75rem; border-left:3px solid ${borderColor}; margin-bottom:0.5rem; ${bgStyle} padding-top:4px; padding-bottom:4px; border-radius:0 4px 4px 0;"><div style="white-space: pre-wrap; color:#4b5563; font-size:0.85rem;">${log._displayDesc}</div>${statusBadge}<div style="font-size:0.7rem; color:#9ca3af; margin-top:2px;">${log.checkOut || (log.status === 'completed' ? 'Completed' : 'Planned Activity')}</div></div>`;
        });
        return html;
    };

    const renderActivityLog = (allStaffLogs) => {
        setTimeout(() => {
            const container = document.getElementById('staff-activity-list');
            if (container) initStaffActivityScroll(container);
        }, 500);
        return `
            <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column; height: 100%;">
                <div style="margin-bottom:0.5rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.3rem;"><h4 style="margin:0; color:#1f2937; font-size: 0.9rem;">Activity Log</h4><span style="font-size:0.65rem; color:#6b7280;">Team Activities (Weekly Roll)</span></div>
                <div style="display:flex; gap:0.4rem; margin-bottom:0.75rem;"><button onclick="window.app_filterStaffActivity(7)" class="chip-btn" style="font-size:0.7rem; padding:0.3rem 0.6rem;">Last 7 Days</button><button onclick="window.app_filterStaffActivity(30)" class="chip-btn" style="font-size:0.7rem; padding:0.3rem 0.6rem;">Monthly</button></div>
                <div id="staff-activity-list" style="flex:1; overflow-y:auto; font-size:0.75rem; padding-right:5px; scroll-behavior: smooth; max-height: 180px;">${renderStaffActivityList(allStaffLogs, 7)}</div>
            </div>`;
    };

    window.app_filterStaffActivity = (daysBack) => {
        const list = document.getElementById('staff-activity-list');
        if (!list) return;
        window.AppAnalytics.getAllStaffActivities(daysBack).then(logs => {
            list.innerHTML = renderStaffActivityList(logs, daysBack);
            initStaffActivityScroll(list);
        });
    };

    const initStaffActivityScroll = (container) => {
        if (!container) return;
        if (window.staffActivityScrollInterval) { clearInterval(window.staffActivityScrollInterval); window.staffActivityScrollInterval = null; }
        let scrollInterval;
        let isPaused = false;
        let direction = 1;
        let isWaiting = false;
        const startAutoScroll = () => {
            scrollInterval = setInterval(() => {
                if (!isPaused && !isWaiting && container) {
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    if (maxScroll <= 0) return;
                    container.scrollTop += direction;
                    if (direction === 1 && container.scrollTop >= maxScroll) { isWaiting = true; setTimeout(() => { direction = -1; isWaiting = false; }, 2000); }
                    else if (direction === -1 && container.scrollTop <= 0) { isWaiting = true; setTimeout(() => { direction = 1; isWaiting = false; }, 1500); }
                }
            }, 50);
        };
        const onMouseEnter = () => isPaused = true;
        const onMouseLeave = () => isPaused = false;
        container.removeEventListener('mouseenter', onMouseEnter);
        container.removeEventListener('mouseleave', onMouseLeave);
        container.addEventListener('mouseenter', onMouseEnter);
        container.addEventListener('mouseleave', onMouseLeave);
        startAutoScroll();
        window.staffActivityScrollInterval = scrollInterval;
    };

    const renderStaffActivityList = (allLogs, daysBack) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        cutoffDate.setHours(0, 0, 0, 0);
        const filtered = allLogs.filter(log => {
            const logDate = new Date(log.date);
            return log.date !== todayStr && logDate >= cutoffDate;
        });
        if (filtered.length === 0) return '<div style="color:#9ca3af; text-align:center; padding:1rem;">No team activities found for the requested period.</div>';
        let html = '';
        let lastDate = '';
        const currentUser = window.AppAuth.getUser();
        const isAdminUser = currentUser && (currentUser.role === 'Administrator' || currentUser.isAdmin);
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
            const showDate = log.date !== lastDate;
            if (showDate) { html += `<div style="font-weight:600; color:#374151; background:#f9fafb; padding:4px 8px; border-radius:4px; margin-top:0.75rem; margin-bottom:0.25rem; font-size:0.8rem;">${log.date}</div>`; lastDate = log.date; }
            let statusBadge = '';
            if (log.status || log.type === 'work') {
                const status = window.AppCalendar.getSmartTaskStatus(log.date, log.status);
                statusBadge = `<div style="margin-top: 4px; display:flex; align-items:center; gap:8px;">${window.AppUI.renderTaskStatusBadge(status)}${isAdminUser ? `<div style="display:flex; gap:4px;"><button onclick="window.app_openDayPlan('${log.date}', '${log.userId}')" style="background:none; border:1px solid #e2e8f0; border-radius:4px; padding:2px 4px; font-size:0.6rem; color:#64748b; cursor:pointer;" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>` : ''}</div>`;
            }
            html += `<div style="margin-left:0.5rem; padding-left:0.75rem; border-left:2px solid #e5e7eb; margin-bottom:0.5rem;"><div style="font-weight:600; color:var(--primary); font-size:0.8rem;">${log.staffName}</div><div style="white-space: pre-wrap; color:#4b5563; font-size:0.85rem; margin-top:2px;">${log._displayDesc}</div>${statusBadge}<div style="font-size:0.7rem; color:#9ca3af; margin-top:2px;">${log.checkOut || (log.status === 'completed' ? 'Completed' : 'Work Plan')}</div></div>`;
        });
        return html;
    };

    const renderBreakdown = (breakdown) => {
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
                <div style="display:flex; flex-direction:column; align-items:center; justifyContent:center; padding:0.4rem; background:${style.bg}; border-radius:8px; min-width:60px; text-align:center;">
                    <span style="font-weight:700; font-size:1rem; color:${style.color}">${count}</span>
                    <span style="font-size:0.6rem; color:${style.color}; font-weight:500; line-height:1.2; margin-top:1px;">${style.label}</span>
                </div>
             `;
        }).join('');
    };

    const renderStatsCard = (title, subtitle, statsObj) => {
        const penaltyBadge = statsObj.penalty > 0
            ? `<span style="font-size:0.65rem; background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:12px; font-weight:600;">Penalty Applies</span>`
            : '';

        return `
            <div class="card" style="padding: 1rem; display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <h4 style="margin:0; font-size:1rem; color:#1f2937;">${title}</h4>
                        <span style="font-size:0.7rem; color:#6b7280; margin-top:0.15rem; display:block;">${subtitle}</span>
                    </div>
                    ${penaltyBadge}
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                     <div style="background:#fef2f2; padding:0.6rem; border-radius:8px; text-align:center; border:1px solid #fee2e2;">
                        <div style="color:#b91c1c; font-weight:700; font-size:1rem;">${statsObj.totalLateDuration}</div>
                        <div style="color:#7f1d1d; font-size:0.6rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Late</div>
                     </div>
                     <div style="background:#ecfdf5; padding:0.6rem; border-radius:8px; text-align:center; border:1px solid #d1fae5;">
                        <div style="color:#047857; font-weight:700; font-size:1rem;">${statsObj.totalExtraDuration}</div>
                        <div style="color:#064e3b; font-size:0.6rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Extra</div>
                     </div>
                </div>

                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: start;">
                    ${renderBreakdown(statsObj.breakdown)}
                </div>
            </div>
        `;
    };

    const renderYearlyPlan = (plans) => {
        const today = new Date();
        const currentUser = window.AppAuth.getUser();
        if (window.app_calMonth === undefined) window.app_calMonth = today.getMonth();
        if (window.app_calYear === undefined) window.app_calYear = today.getFullYear();

        const year = window.app_calYear;
        const month = window.app_calMonth;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const getDayEvents = (d) => {
            // Use LOCAL date construction
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const evs = [];

            // 1. Add Automatic Day Types (Saturdays, Sundays)
            if (window.AppAnalytics) {
                const dayType = window.AppAnalytics.getDayType(new Date(year, month, d));
                if (dayType === 'Holiday') {
                    evs.push({ title: 'Company Holiday (Weekend)', type: 'holiday' });
                } else if (dayType === 'Half Day') {
                    evs.push({ title: 'Half Working Day (Sat)', type: 'event' });
                }
            }

            plans.leaves.forEach(l => {
                if (dStr >= l.startDate && dStr <= l.endDate) {
                    evs.push({ title: `${l.userName || 'Staff'} (Leave)`, type: 'leave', userId: l.userId });
                }
            });
            plans.events.forEach(e => {
                if (e.date === dStr) evs.push({ title: e.title, type: e.type || 'event' });
            });
            plans.workPlans.forEach(p => {
                if (p.date === dStr) {
                    let title = '';
                    if (p.plans && p.plans.length > 0) {
                        title = `${p.userName}: ${p.plans.map(pl => pl.task).join('; ')}`;
                    } else {
                        title = `${p.userName}: ${p.plan || 'Work Plan'}`;
                    }
                    evs.push({ title: title, type: 'work', userId: p.userId, plans: p.plans });
                }
            });
            return evs;
        };

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let calendarHTML = '';
        for (let i = 0; i < firstDay; i++) calendarHTML += '<div class="cal-day empty"></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const evs = getDayEvents(d);
            const hasLeave = evs.some(e => e.type === 'leave');
            const hasEvent = evs.some(e => e.type === 'event');
            const hasWork = evs.some(e => e.type === 'work');
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            // Detect automatic day type
            const dayType = window.AppAnalytics ? window.AppAnalytics.getDayType(new Date(year, month, d)) : 'Work Day';

            calendarHTML += `
                <div class="cal-day ${isToday ? 'today' : ''} ${hasLeave ? 'has-leave' : ''} ${hasEvent ? 'has-event' : ''} ${hasWork ? 'has-work' : ''} ${dayType === 'Holiday' ? 'is-holiday' : ''} ${dayType === 'Half Day' ? 'is-half-day' : ''}" 
                        onclick="window.app_openDayPlan('${dStr}')" style="cursor:pointer;" title="${dayType}">
                    ${d}
                </div>
            `;
        }

        // Global data for the handlers in app.js
        window._currentPlans = plans;
        window._getDayEvents = getDayEvents; // Helper for modal

        return `
            <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column;">
                <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                        <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Team Schedule</h4>
                        <span style="font-size:0.7rem; color:#6b7280;">Planned Leaves & Events</span>
                </div>

                <div style="margin-bottom:0.6rem; padding-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:0.4rem;">
                        <button onclick="window.app_changeCalMonth(-1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-left"></i></button>
                        <div style="text-align:center; min-width:70px;">
                            <h4 style="margin:0; color:#1f2937; font-size:0.9rem;">${monthNames[month]} ${year}</h4>
                        </div>
                        <button onclick="window.app_changeCalMonth(1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                        ${currentUser && (currentUser.role === 'Administrator' || currentUser.isAdmin) ? `<button onclick="window.app_openEventModal()" style="background:none; border:none; color:var(--primary); cursor:pointer;"><i class="fa-solid fa-plus-circle"></i></button>` : ''}
                </div>
                <div class="calendar-grid-mini" style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align:center; font-size: 0.65rem;">
                    <div style="font-weight:700; color:#9ca3af;">S</div>
                    <div style="font-weight:700; color:#9ca3af;">M</div>
                    <div style="font-weight:700; color:#9ca3af;">T</div>
                    <div style="font-weight:700; color:#9ca3af;">W</div>
                    <div style="font-weight:700; color:#9ca3af;">T</div>
                    <div style="font-weight:700; color:#9ca3af;">F</div>
                    <div style="font-weight:700; color:#9ca3af;">S</div>
                    ${calendarHTML}
                </div>
                <div style="margin-top:0.6rem; display:flex; flex-wrap:wrap; gap:0.4rem; font-size:0.55rem; color:#6b7280; justify-content:center;">
                    <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#b91c1c; border-radius:50%;"></span> Leave</span>
                    <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#166534; border-radius:50%;"></span> Event</span>
                    <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#eee; border-radius:50%; border:0.5px solid #ccc;"></span> Holiday</span>
                    <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#fffbeb; border-radius:50%; border:0.5px solid #d97706;"></span> Half</span>
                </div>
                <style>
                    .cal-day { padding: 4px; border-radius: 4px; position: relative; transition: all 0.2s; border: 1px solid transparent; }
                    .cal-day:hover:not(.empty) { background: #f3f4f6; }
                    .cal-day.today { background: var(--primary) !important; color: white !important; font-weight: 700; border-color: transparent !important; }
                    .cal-day.has-leave { background: #fee2e2; color: #b91c1c; }
                    .cal-day.has-event { background: #dcfce7; color: #166534; }
                    .cal-day.has-work { border-color: #818cf8; }
                    .cal-day.is-holiday { background: #f9fafb; color: #9ca3af; opacity: 0.8; }
                    .cal-day.is-half-day { background: #fffbeb; color: #d97706; border-color: #fde68a; }
                    .cal-day.empty { visibility: hidden; }
                </style>
            </div>
        `;
    };

    window.AppUI = {
        renderLogin: () => {
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 1rem;">
                    <div class="card" style="width: 100%; max-width: 360px; text-align: center; padding: 1.5rem;">
                        <button onclick="window.AppAuth.resetData()" style="position: absolute; top: 0.75rem; right: 0.75rem; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.75rem;">
                             <i class="fa-solid fa-rotate-right"></i> Reset
                        </button>
                        <div class="logo-circle" style="width: 48px; height: 48px; margin: 0 auto 1rem auto;">
                            <img src="https://ui-avatars.com/api/?name=CRWI&background=random" alt="Logo">
                        </div>
                        <h2 style="margin-bottom: 0.25rem; font-size: 1.5rem;">CRWI</h2>
                        <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Sign in to continue</p>
                        
                        <form id="login-form" style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left;">
                            <div>
                                <label style="font-size: 0.85rem; font-weight: 500; margin-bottom: 0.4rem; display: block;">Login ID / Email</label>
                                <input type="text" name="username" placeholder="Enter Login ID" required style="width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9rem;">
                            </div>
                            <div>
                                <label style="font-size: 0.85rem; font-weight: 500; margin-bottom: 0.4rem; display: block;">Password</label>
                                <input type="password" name="password" placeholder="Enter Password" required style="width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9rem;">
                            </div>
                            
                            <button type="submit" class="action-btn" style="margin-top: 0.5rem; width: 100%; padding: 0.75rem;">Sign In</button>
                        </form>
                        
                        <p style="margin-top: 1.5rem; font-size: 0.75rem; color: #6b7280;">
                            Contact Admin for credentials.
                        </p>
                    </div>
                </div>
             `;
        },

        renderModals() {
            const user = window.AppAuth.getUser();
            if (!user) return '';

            return `
                <!-- Check-Out Modal -->
                <div id="checkout-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="width: 100%; max-width: 450px;">
                        <h3 style="margin-bottom: 1rem;">Check Out</h3>
                        <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">Please summarize your work for today before checking out.</p>
                        <div id="checkout-plan-ref" style="display:none; background:#f9fafb; padding:0.75rem; border-radius:8px; border:1px solid #e5e7eb; margin-bottom:1rem; font-size:0.85rem;">
                            <div style="font-weight:600; color:#4f46e5; margin-bottom:4px;">Today's Plan:</div>
                            <div id="checkout-plan-text" style="color:#374151; margin-bottom:8px; line-height:1.4;"></div>
                            <button type="button" onclick="window.app_useWorkPlan()" style="background:#4f46e5; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:500;">
                                <i class="fa-solid fa-file-import"></i> Use this Plan
                            </button>
                        </div>

                        <form onsubmit="window.app_submitCheckOut(event)">
                            <div id="checkout-location-loading" style="display:none; margin-bottom: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 8px; text-align: center; font-size: 0.8rem; color: #6b7280;">
                                <i class="fa-solid fa-spinner fa-spin"></i> Verifying location...
                            </div>
                            <div id="checkout-location-mismatch" style="display:none; margin-bottom: 1rem; padding: 0.75rem; background: #fff1f2; border: 1px solid #fda4af; border-radius: 8px;">
                                <label style="display:block; font-size: 0.85rem; font-weight: 600; color: #991b1b; margin-bottom: 0.5rem;">
                                    <i class="fa-solid fa-triangle-exclamation"></i> Different Location Detected
                                </label>
                                <textarea name="locationExplanation" placeholder="Please explain why you are checking out from a different location..." style="width: 100%; height: 60px; padding: 0.5rem; border: 1px solid #fda4af; border-radius: 0.5rem; resize: none; font-size: 0.85rem; font-family: inherit;"></textarea>
                            </div>
                            <textarea name="description" required placeholder="- Completed monthly report&#10;- Fixed login bug..." style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; resize: none; font-family: inherit; margin-bottom: 1.5rem;"></textarea>
                            <div style="display: flex; gap: 1rem;">
                                <button type="button" onclick="document.getElementById('checkout-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                                <button type="submit" class="action-btn" style="flex: 1; justify-content: center;">Complete Check-Out</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Add Log Modal (Modern) -->
                <div id="log-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="width: 100%; max-width: 500px; padding: 0;">
                        <div style="padding: 1.5rem; border-bottom: 1px solid #f3f4f6;">
                            <h3 style="margin: 0;">New Time Entry</h3>
                            <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem;">Log past or off-site work</p>
                        </div>
                        
                        <form id="manual-log-form" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Date</label>
                                <input type="date" name="date" id="log-date" required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #f9fafb; font-family: inherit;">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Start Time</label>
                                    <input type="time" name="checkIn" id="log-start-time" required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #fff; font-family: inherit;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">End Time</label>
                                    <input type="time" name="checkOut" id="log-end-time" required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #fff; font-family: inherit;">
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Quick Duration</label>
                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 30}))">30m</button>
                                    <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 60}))">1h</button>
                                    <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 240}))">4h</button>
                                    <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 480}))">8h</button>
                                </div>
                            </div>

                             <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Activity Type</label>
                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                                    <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Work - Home'">🏠 Work - Home</button>
                                    <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Training'">🎓 Training</button>
                                    <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Client Visit'">🤝 Client Visit</button>
                                    <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Field Work'">🚧 Field Work</button>
                                </div>
                                <input type="text" name="location" id="log-location" placeholder="Or type activity description..." required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                            </div>

                            <div style="display: flex; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
                                <button type="button" onclick="document.getElementById('log-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #e5e7eb; background: white; border-radius: 0.5rem; cursor: pointer; color: #374151; font-weight: 500;">Cancel</button>
                                <button type="submit" class="action-btn" style="flex: 2; padding: 0.75rem; border-radius: 0.5rem;">
                                    <i class="fa-solid fa-check"></i> Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Request Leave Modal -->
                <div id="leave-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="width: 100%; max-width: 500px;">
                        <h3>Request Leave</h3>
                        <form id="leave-request-form" method="POST" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <div style="display: flex; gap: 1rem;">
                                <label style="flex:1">From
                                    <input type="date" name="startDate" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                </label>
                                <label style="flex:1">To
                                    <input type="date" name="endDate" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                </label>
                            </div>
                            <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                                <label style="flex:1">Start Time (Optional)
                                    <input type="time" name="startTime" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                </label>
                                <label style="flex:1">End Time (Optional)
                                    <input type="time" name="endTime" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                </label>
                            </div>
                            <label>Type
                                <select name="type" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                    <option value="Annual Leave">Annual Leave</option>
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Medical Leave">Medical Leave</option>
                                    <option value="Short Leave">Short Leave (Emergency - 2h)</option>
                                    <option value="Maternity Leave">Maternity Leave</option>
                                    <option value="Paternity Leave">Paternity Leave</option>
                                    <option value="Study Leave">Study Leave</option>
                                    <option value="Compassionate Leave">Compassionate Leave</option>
                                    <option value="Other Holiday">Holiday (Regional/National)</option>
                                    <option value="Absent">Absent</option>
                                </select>
                            </label>
                            <label id="short-leave-hours" style="display:none;">Duration (Hours)
                                <input type="number" name="durationHours" min="0.5" max="2" step="0.5" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                <span style="font-size:0.7rem; color:#6b7280;">Max 2 hours per month.</span>
                            </label>
                            <script>
                                (function() {
                                    const select = document.querySelector('#leave-request-form select[name="type"]');
                                    if(select) {
                                        select.addEventListener('change', function(e) {
                                            const hourField = document.getElementById('short-leave-hours');
                                            if(hourField) {
                                                if(e.target.value === 'Short Leave') {
                                                    hourField.style.display = 'block';
                                                    hourField.querySelector('input').required = true;
                                                } else {
                                                    hourField.style.display = 'none';
                                                    hourField.querySelector('input').required = false;
                                                }
                                            }
                                        });
                                    }
                                })();
                            </script>
                            <label>Reason
                                <textarea name="reason" rows="3" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;"></textarea>
                            </label>
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button type="button" onclick="document.getElementById('leave-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                                <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem; background: #be123c;">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Edit User Modal -->
                <div id="edit-user-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <h3>Edit Staff Details</h3>
                        <form id="edit-user-form" method="POST" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <input type="hidden" name="id" id="edit-user-id">
                            <label>
                                Full Name
                                <input type="text" name="name" id="edit-user-name" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            
                            <div style="display: flex; gap: 1rem; background: #fffbeb; padding: 1rem; border-radius: 0.5rem; border: 1px dashed #f59e0b;">
                                <label style="flex:1">
                                    Login ID
                                    <input type="text" name="username" id="edit-user-username" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                                <label style="flex:1">
                                    Password
                                    <input type="text" name="password" id="edit-user-password" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                            </div>

                            <label>
                                Role / Designation
                                <select name="role" id="edit-user-role" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;" onchange="const cb = document.getElementById('edit-user-isAdmin'); cb.checked = (this.value === 'Administrator');">
                                    <option value="Employee">Employee</option>
                                    <option value="Administrator">Administrator</option>
                                    <option value="Guest">Guest</option>
                                    <option value="Intern">Intern</option>
                                </select>
                            </label>
                            <label>
                                Department
                                <select name="dept" id="edit-user-dept" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                    <option value="Administration">Administration</option>
                                    <option value="IT Department">IT Department</option>
                                    <option value="HR">HR</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Operations">Operations</option>
                                    <option value="General">General</option>
                                </select>
                            </label>
                            
                            <label style="display: flex; align-items: center; gap: 0.5rem; background: #f0f7ff; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="isAdmin" id="edit-user-isAdmin" style="width: 1.2rem; height: 1.2rem;" onchange="const sel = document.getElementById('edit-user-role'); if(this.checked) sel.value = 'Administrator'; else if(sel.value === 'Administrator') sel.value = 'Employee';">
                                <div style="font-weight: 600; color: #1e40af;">Grant Administrative Privileges</div>
                            </label>
                             <div style="display: flex; gap: 1rem;">
                                <label style="flex:1">
                                    Email
                                    <input type="email" name="email" id="edit-user-email" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                                <label style="flex:1">
                                    Phone
                                    <input type="tel" name="phone" id="edit-user-phone" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                            </div>

                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button type="button" onclick="document.getElementById('edit-user-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                                <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem;">Update Details</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- User Details Modal (Logs) -->
                <div id="user-details-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="max-width: 700px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <h3>Staff Attendance Record</h3>
                            <button onclick="document.getElementById('user-details-modal').style.display='none'" style="background:none; border:none; cursor:pointer; font-size:1.2rem;"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div id="user-details-content">
                            <!-- Injected by JS -->
                        </div>
                    </div>
                </div>

                <!-- Send Notification Modal -->
                 <div id="notify-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <h3>Send Notification</h3>
                        <form id="notify-form" method="POST" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <input type="hidden" name="toUserId" id="notify-user-id">
                            <label>
                                Message
                                <textarea name="message" required rows="4" placeholder="Type your message here..." style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem; font-family: inherit;"></textarea>
                            </label>
                            
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button type="button" onclick="document.getElementById('notify-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                                <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem;">Send Message</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                 <!-- Add User Modal -->
                <div id="add-user-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <h3>Create New Account</h3>
                        <form id="add-user-form" method="POST" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <label>
                                Full Name
                                <input type="text" name="name" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            
                            <div style="display: flex; gap: 1rem; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px dashed #d1d5db;">
                                <label style="flex:1">
                                    Login ID
                                    <input type="text" name="username" placeholder="e.g. jomit" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                                <label style="flex:1">
                                    Password
                                    <input type="text" name="password" placeholder="e.g. secret123" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                            </div>

                            <label>
                                Role / Designation
                                <select name="role" id="add-user-role" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;" onchange="const cb = document.getElementById('add-user-isAdmin'); cb.checked = (this.value === 'Administrator');">
                                    <option value="Employee">Employee</option>
                                    <option value="Administrator">Administrator</option>
                                    <option value="Guest">Guest</option>
                                    <option value="Intern">Intern</option>
                                </select>
                            </label>
                            <label>
                                Department
                                <select name="dept" id="add-user-dept" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                    <option value="Administration">Administration</option>
                                    <option value="IT Department">IT Department</option>
                                    <option value="HR">HR</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Operations">Operations</option>
                                    <option value="General">General</option>
                                </select>
                            </label>

                            <label style="display: flex; align-items: center; gap: 0.5rem; background: #f0f7ff; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; margin-top: 0.5rem;">
                                <input type="checkbox" name="isAdmin" id="add-user-isAdmin" style="width: 1.2rem; height: 1.2rem;" onchange="const sel = document.getElementById('add-user-role'); if(this.checked) sel.value = 'Administrator'; else if(sel.value === 'Administrator') sel.value = 'Employee';">
                                <div style="font-weight: 600; color: #1e40af;">Grant Administrative Privileges</div>
                            </label>
                             <div style="display: flex; gap: 1rem;">
                                <label style="flex:1">
                                    Email
                                    <input type="email" name="email" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                                <label style="flex:1">
                                    Phone
                                    <input type="tel" name="phone" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                                </label>
                            </div>
                            <label>
                                Joining Date
                                <input type="date" name="joinDate" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button type="button" onclick="document.getElementById('add-user-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                            <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem;">Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        },

        /**
         * Render star rating display (1-5 stars)
         * @param {number} rating - Rating value (1-5)
         * @param {boolean} showNumber - Whether to show numeric rating
         * @returns {string} - HTML for star rating
         */
        renderStarRating: (rating, showNumber = true) => {
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

            let starsHTML = '';

            // Full stars
            for (let i = 0; i < fullStars; i++) {
                starsHTML += '<i class="fa-solid fa-star" style="color:#fbbf24; font-size:0.9rem;"></i>';
            }

            // Half star
            if (hasHalfStar) {
                starsHTML += '<i class="fa-solid fa-star-half-stroke" style="color:#fbbf24; font-size:0.9rem;"></i>';
            }

            // Empty stars
            for (let i = 0; i < emptyStars; i++) {
                starsHTML += '<i class="fa-regular fa-star" style="color:#d1d5db; font-size:0.9rem;"></i>';
            }

            if (showNumber) {
                starsHTML += ` <span style="font-size:0.75rem; color:#6b7280; font-weight:600; margin-left:4px;">${rating.toFixed(1)}</span>`;
            }

            return starsHTML;
        },

        /**
         * Render task status badge with color coding
         * @param {string} status - Task status (to-be-started, in-process, completed, overdue, not-completed)
         * @param {boolean} showIcon - Whether to show status icon
         * @returns {string} - HTML for status badge
         */
        renderTaskStatusBadge: (status, showIcon = true) => {
            const statusConfig = {
                'to-be-started': {
                    color: '#3b82f6',
                    bg: '#dbeafe',
                    icon: '📅',
                    label: 'To Be Started'
                },
                'in-process': {
                    color: '#eab308',
                    bg: '#fef3c7',
                    icon: '⏳',
                    label: 'In Process'
                },
                'completed': {
                    color: '#22c55e',
                    bg: '#dcfce7',
                    icon: '✅',
                    label: 'Completed'
                },
                'overdue': {
                    color: '#ef4444',
                    bg: '#fee2e2',
                    icon: '⚠️',
                    label: 'Overdue'
                },
                'not-completed': {
                    color: '#6b7280',
                    bg: '#f3f4f6',
                    icon: '❌',
                    label: 'Not Completed'
                }
            };

            const config = statusConfig[status] || statusConfig['in-process'];
            const icon = showIcon ? config.icon + ' ' : '';

            return `<span style="background: ${config.bg}; color: ${config.color}; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-block;">${icon}${config.label}</span>`;
        },

        renderHeroCard: (heroData) => {
            if (!heroData) return '';
            const { user, stats, reason } = heroData;
            return `
                <div class="card hero-of-the-week" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border: none; overflow: hidden; position: relative; padding: 1rem;">
                    <!-- Decorative Elements -->
                    <div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -10px; width: 80px; height: 80px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
                    <i class="fa-solid fa-crown" style="position: absolute; top: 0.75rem; right: 0.75rem; font-size: 2rem; color: #fbbf24; opacity: 0.3; transform: rotate(15deg);"></i>
    
                    <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 1rem;">
                        <div style="position: relative;">
                             <div class="logo-circle" style="width: 60px; height: 60px; border: 2px solid #fbbf24; box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);">
                                <img src="${user.avatar}" alt="${user.name}">
                            </div>
                            <div style="position: absolute; bottom: -3px; right: -3px; background: #fbbf24; color: #1e1b4b; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800; border: 2px solid #1e1b4b;">
                                <i class="fa-solid fa-trophy"></i>
                            </div>
                        </div>
    
                        <div style="flex: 1;">
                            <span style="font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #fbbf24;">Hero of the Week</span>
                            <h3 style="margin: 0.15rem 0; font-size: 1.25rem; letter-spacing: -0.5px;">${user.name}</h3>
                            <div style="display: flex; gap: 0.75rem; align-items: center; margin-top: 0.25rem;">
                                <div style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 20px; backdrop-filter: blur(4px);">
                                    <i class="fa-solid fa-star" style="color: #fbbf24; margin-right: 4px;"></i> ${reason}
                                </div>
                                <div style="font-size: 0.75rem; opacity: 0.9;">
                                     <i class="fa-solid fa-clock" style="margin-right: 4px;"></i> ${stats.hours}h
                                </div>
                            </div>
                        </div>
    
                        <div style="text-align: center; padding-left: 0.75rem; border-left: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">${Math.round(stats.finalScore)}</div>
                            <div style="font-size: 0.55rem; text-transform: uppercase; opacity: 0.7; font-weight: 600;">Power Score</div>
                        </div>
                    </div>
                </div>
            `;
        },

        renderLeaveRequests: (leaves) => {
            if (!leaves || leaves.length === 0) return '';

            return `
                <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column; margin-bottom: 0; height: 100%;">
                    <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Leave Requests</h4>
                            <span style="font-size:0.7rem; color:#6b7280;">Pending Approval</span>
                        </div>
                        <button onclick="window.app_exportLeaves()" class="chip-btn" style="font-size:0.7rem; background:#f0fdf4; color:#166534; border-color:#bbf7d0;">
                            <i class="fa-solid fa-file-csv"></i> Export All
                        </button>
                    </div>

                    <div style="flex:1; overflow-y:auto; max-height: 300px; font-size:0.8rem; padding-right:5px;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead style="position:sticky; top:0; background:white; z-index:1;">
                                <tr style="text-align:left; border-bottom:1px solid #f3f4f6;">
                                    <th style="padding:0.5rem 0.25rem;">Staff</th>
                                    <th style="padding:0.5rem 0.25rem;">Period</th>
                                    <th style="padding:0.5rem 0.25rem;">Type</th>
                                    <th style="padding:0.5rem 0.25rem;">Reason</th>
                                    <th style="padding:0.5rem 0.25rem; text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${leaves.map(l => {
                const warningHtml = (l.policyWarnings && l.policyWarnings.length > 0)
                    ? `<div style="margin-top:4px; font-size:0.65rem; color:#b91c1c; background:#fee2e2; padding:2px 4px; border-radius:4px;">
                                            <i class="fa-solid fa-triangle-exclamation"></i> ${l.policyWarnings.join('<br>')}
                                           </div>`
                    : '';
                return `
                                        <tr style="border-bottom:1px solid #f9fafb;">
                                            <td style="padding:0.5rem 0.25rem; font-weight:600; color:var(--primary);">${l.userName || 'Staff'}</td>
                                            <td style="padding:0.5rem 0.25rem; font-size:0.75rem; color:#4b5563;">
                                                ${l.startDate} ${l.startTime ? `(${l.startTime})` : ''}
                                                <br>
                                                ${l.endDate} ${l.endTime ? `(${l.endTime})` : ''}
                                            </td>
                                            <td style="padding:0.5rem 0.25rem;"><span style="background:#f3f4f6; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${l.type}</span>${warningHtml}</td>
                                            <td style="padding:0.5rem 0.25rem; font-size:0.75rem; color:#6b7280; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.reason}">${l.reason}</td>
                                            <td style="padding:0.5rem 0.25rem; text-align:right;">
                                                <div style="display:flex; gap:0.25rem; justify-content:flex-end;">
                                                    <button onclick="window.app_addLeaveComment('${l.id}')" title="Add Comment" style="background:#fefce8; color:#854d0e; border:none; border-radius:4px; padding:4px 6px; cursor:pointer;"><i class="fa-solid fa-comment-dots"></i></button>
                                                    <button onclick="window.app_approveLeave('${l.id}')" title="Approve" style="background:#f0fdf4; color:#166534; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                                                    <button onclick="window.app_rejectLeave('${l.id}')" title="Reject" style="background:#fff1f2; color:#991b1b; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },



        async renderDashboard() {
            const user = window.AppAuth.getUser();
            const isAdmin = user.role === 'Administrator' || user.isAdmin;

            // Current Staff for Summary (Admins can select others)
            const targetStaffId = (isAdmin && window.app_selectedSummaryStaffId) ? window.app_selectedSummaryStaffId : user.id;

            console.time('DashboardFetch');
            // Parallel Fetch
            const [status, logs, monthlyStats, yearlyStats, heroData, calendarPlans, staffActivities, pendingLeaves, allUsers, collaborations] = await Promise.all([
                window.AppAttendance.getStatus(),
                window.AppAttendance.getLogs(targetStaffId),
                window.AppAnalytics.getUserMonthlyStats(targetStaffId),
                window.AppAnalytics.getUserYearlyStats(targetStaffId),
                window.AppAnalytics.getHeroOfTheWeek(),
                window.AppCalendar ? window.AppCalendar.getPlans() : { leaves: [], events: [] },
                window.AppAnalytics.getAllStaffActivities(7),
                isAdmin ? window.AppLeaves.getPendingLeaves() : Promise.resolve([]),
                isAdmin ? window.AppDB.getAll('users') : Promise.resolve([]),
                window.AppCalendar ? window.AppCalendar.getCollaborations(targetStaffId) : Promise.resolve([])
            ]);
            console.timeEnd('DashboardFetch');
            const heroHTML = this.renderHeroCard(heroData);

            // Auto-calculate rating if not exists (run in background)
            if (window.AppRating && user.rating === undefined) {
                window.AppRating.updateUserRating(user.id).then(updatedUser => {
                    // Update the user object with the new rating
                    Object.assign(user, updatedUser);
                    console.log('Rating calculated:', user.rating);
                }).catch(err => {
                    console.error('Failed to calculate rating:', err);
                });
            }

            const isCheckedIn = status.status === 'in';
            const notifications = user.notifications || [];

            // Helper for Admin Data Indicators
            const targetStaff = (allUsers || []).find(u => u.id === targetStaffId);
            const isViewingSelf = targetStaffId === user.id;

            // Rename for clarity in template
            const recentLogs = logs;
            const statusData = status; // prevent conflict

            let timerHTML = '00 : 00 : 00';
            let btnText = 'Check-in';
            let btnClass = 'action-btn';
            let statusText = 'Yet to check-in';
            let statusClass = 'out';

            if (isCheckedIn) {
                btnText = 'Check-out';
                btnClass = 'action-btn checkout';
                statusText = 'Checked In';
                statusClass = 'in';
            }

            // Notification Card HTML
            let notifHTML = '';
            if (notifications.length > 0) {
                notifHTML = `
                    <div class="card full-width" style="background: linear-gradient(to right, #fef3c7, #fff7ed); border-left: 5px solid #f59e0b;">
                        <h4 style="color: #b45309; margin-bottom: 0.5rem;"><i class="fa-solid fa-bell"></i> Notifications</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${notifications.map((n, idx) => {
                    const isMention = n.type === 'mention';
                    return `
                                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; padding-bottom: 0.5rem; ${idx !== notifications.length - 1 ? 'border-bottom: 1px solid rgba(0,0,0,0.05);' : ''}">
                                    <div style="flex:1;">
                                        <p style="font-size: 0.95rem; color: #78350f;">${n.message}</p>
                                        <small style="color: #92400e; font-size: 0.75rem;">${n.date}</small>
                                        ${isMention ? `
                                            <div style="display:flex; gap:0.5rem; margin-top:0.4rem;">
                                                <button onclick="window.app_handleTagResponse('${n.planId}', ${n.taskIndex}, 'accepted', ${idx})" style="background:#10b981; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:600;"><i class="fa-solid fa-check"></i> Accept</button>
                                                <button onclick="window.app_handleTagResponse('${n.planId}', ${n.taskIndex}, 'rejected', ${idx})" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:600;"><i class="fa-solid fa-xmark"></i> Reject</button>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <button onclick="document.dispatchEvent(new CustomEvent('dismiss-notification', {detail: ${idx}}))" style="background: none; border: none; color: #b45309; cursor: pointer; padding: 4px;">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            `;
                }).join('')}
                        </div>
                    </div>
                `;
            }

            // Stats fetched in parallel above, variables ready.

            let summaryHTML = '';
            if (isAdmin) {
                summaryHTML = `
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; grid-column: 1 / -1; margin-bottom: 1rem;">
                    <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${this.renderLeaveRequests(pendingLeaves)}</div>
                    <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${renderYearlyPlan(calendarPlans)}${heroHTML}</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; align-items: start; grid-column: 1 / -1;">
                    ${renderStatsCard(isViewingSelf ? monthlyStats.label : `${monthlyStats.label} - ${targetStaff?.name || 'Staff'}`, isViewingSelf ? 'Monthly Stats' : 'Viewing Staff Monthly Stats', monthlyStats)}
                    ${renderStatsCard('Yearly Summary', isViewingSelf ? yearlyStats.label : `${yearlyStats.label} for ${targetStaff?.name || 'Staff'}`, yearlyStats)}
                </div>`;
            } else {
                summaryHTML = `<div style="display: flex; flex-wrap: wrap; gap: 1rem; grid-column: 1 / -1; margin-bottom: 2rem; align-items: stretch;"><div style="flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 1rem;"><div style="flex: 1; display: flex; flex-direction: column;">${renderStatsCard(monthlyStats.label, 'Monthly Stats', monthlyStats)}</div><div style="flex: 1; display: flex; flex-direction: column;">${renderStatsCard('Yearly Summary', yearlyStats.label, yearlyStats)}</div></div><div style="flex: 1.5; min-width: 320px; display: flex; flex-direction: column;">${renderWorkLog(logs, collaborations)}</div><div style="flex: 1.2; min-width: 320px; display: flex; flex-direction: column;">${renderYearlyPlan(calendarPlans)}<div style="margin-top: 1rem;">${heroHTML}</div></div></div>`;
            }
            return `
                <div class="dashboard-grid">
                    ${notifHTML}
                    <div class="card full-width" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: white; padding: 1.5rem; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -30px; left: -20px; width: 150px; height: 150px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
                        <div style="position: relative; z-index: 1;"><div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;"><div style="flex: 1; min-width: 200px;"><h2 style="margin: 0; font-size: 1.75rem; font-weight: 700; letter-spacing: -0.5px;">Welcome back, ${user.name.split(' ')[0]}! 👋</h2><p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 0.95rem;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>${user.rating !== undefined ? `<div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;"><div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 20px; backdrop-filter: blur(10px);"><span style="font-size: 0.75rem; font-weight: 600; opacity: 0.9;">Your Rating:</span>${window.AppUI.renderStarRating(user.rating, true)}</div>${user.completionStats ? `<div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 20px; backdrop-filter: blur(10px);"><i class="fa-solid fa-check-circle" style="color: #86efac; font-size: 0.9rem;"></i><span style="font-size: 0.85rem; font-weight: 600;">${(user.completionStats.completionRate * 100).toFixed(0)}% Complete</span></div>` : ''}</div>` : ''}</div>${isAdmin ? `<div style="position: relative; z-index: 10; flex: 1.2; display: flex; justify-content: center; min-width: 250px;"><div style="background: #f1f5f9; padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.75rem; width: 100%; max-width: 320px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"><i class="fa-solid fa-users-viewfinder" style="color: #4f46e5; font-size: 1.1rem;"></i><div style="flex: 1;"><div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;"><div style="font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Viewing Summary For</div>${targetStaffId !== user.id ? '<span style="font-size:0.55rem; color:#c2410c; background:#fff7ed; padding:1px 6px; border-radius:10px; font-weight:800; border:1px solid #ffedd5;">STAFF VIEW ACTIVE</span>' : ''}</div><select onchange="window.app_changeSummaryStaff(this.value)" style="width: 100%; background: transparent; color: #1e1b4b; border: none; font-size: 0.85rem; font-weight: 700; outline: none; cursor: pointer; padding: 0;"><option value="${user.id}">My Own Summary</option><optgroup label="Staff Members">${(allUsers || []).filter(u => u.id !== user.id).sort((a, b) => a.name.localeCompare(b.name)).map(u => `<option value="${u.id}" ${u.id === targetStaffId ? 'selected' : ''}>${u.name}</option>`).join('')}</optgroup></select></div></div></div>` : ''}<div class="welcome-icon" style="position: relative; z-index: 1;"><i class="fa-solid fa-cloud-sun" style="font-size: 3rem; color: #fbbf24; filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));"></i></div></div></div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; grid-column: 1 / -1; margin-bottom: 0.75rem; align-items: stretch;">
                        <div class="card check-in-widget" style="flex: 1; min-width: 210px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; background: white; border: 1px solid #eef2ff;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;"><div style="position: relative;"><img src="${user.avatar}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;"><div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: ${isCheckedIn ? '#10b981' : '#94a3b8'}; border: 2px solid white;"></div></div><div style="text-align: left;"><h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${user.name}</h4><p class="text-muted" style="font-size: 0.75rem; margin: 0;">${user.role}</p></div></div>
                            <div style="text-align:center; padding: 0.5rem 0;"><div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">${timerHTML}</div><div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div></div>
                            <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;"><div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;"><span id="countdown-label">Time to checkout</span><span id="countdown-value" style="font-weight: 600;">--:--:--</span></div><div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;"><div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div></div></div>
                            <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;"><div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div><div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div></div>
                            <button class="${btnClass}" id="attendance-btn" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease;">${btnText} <i class="fa-solid fa-fingerprint"></i></button>
                            <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;"><i class="fa-solid fa-location-dot"></i><span>${isCheckedIn && user.currentLocation ? `Lat: ${Number(user.currentLocation.lat).toFixed(4)}, Lng: ${Number(user.currentLocation.lng).toFixed(4)}` : 'Waiting for location...'}</span></div>
                        </div>
                        <div class="card" style="flex: 1; min-width: 210px; padding: 1rem; margin-bottom: 0; display: flex; flex-direction: column; background: white; position: relative;">${!isViewingSelf ? `<div style="position: absolute; top: -8px; right: 10px; background: #fff7ed; color: #c2410c; padding: 2px 8px; border-radius: 10px; font-size: 0.6rem; font-weight: 800; border: 1px solid #ffedd5; box-shadow: 0 2px 4px rgba(0,0,0,0.05); z-index: 5;"><i class="fa-solid fa-user-clock"></i> ${targetStaff?.name || 'Staff'}'s Activity</div>` : ''}<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;"><h4 style="margin: 0; font-size: 0.95rem; color: #1e1b4b;"><i class="fa-solid fa-history" style="color: #6366f1; margin-right: 6px;"></i> Recent Activity</h4><a href="#timesheet" onclick="window.location.hash = 'timesheet'; return false;" style="font-size: 0.7rem; color: #4338ca; text-decoration: none; font-weight: 600;">View All</a></div><div style="display: flex; flex-direction: column; gap: 0.75rem; flex: 1; overflow-y: auto; max-height: 250px; padding-right: 4px;">${recentLogs.length > 0 ? recentLogs.slice(0, 3).map(log => `<div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid #f8fafc;"><div><div style="font-size: 0.8rem; font-weight: 600; color: #334155;">${log.date}</div><div style="font-size: 0.7rem; color: #64748b;">${log.checkIn} - ${log.checkOut || '<span style="color:#10b981;">Active</span>'}</div></div><div style="font-size: 0.8rem; font-weight: 700; color: #4338ca; background: #eef2ff; padding: 2px 8px; border-radius: 6px;">${log.duration || '--'}</div></div>`).join('') : '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin-top: 1rem;">No recent sessions</p>'}</div></div>
                        <div style="flex: 1.2; min-width: 210px; display: flex; flex-direction: column;">${renderWorkLog(logs, collaborations)}</div>
                        ${isAdmin ? `<div style="flex: 1.2; min-width: 210px; display: flex; flex-direction: column;">${renderActivityLog(staffActivities)}</div>` : ''}
                    </div>
                    ${summaryHTML}
                </div>`;
        },

        async renderAnnualPlan() {
            const today = new Date();
            const year = window.app_annualYear || today.getFullYear();
            const user = window.AppAuth.getUser();
            const plans = await window.AppCalendar.getPlans();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            const getDayMarkers = (d, m, y) => {
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const hasLeave = (plans.leaves || []).some(l => dateStr >= l.startDate && dateStr <= l.endDate);
                const hasEvent = (plans.events || []).some(e => e.date === dateStr);
                const hasWork = (plans.workPlans || []).some(p => p.date === dateStr);
                let workStatus = '';
                if (hasWork) {
                    const daily = plans.workPlans.filter(p => p.date === dateStr);
                    let worst = 'to-be-started';
                    daily.forEach(p => {
                        (p.plans || []).forEach(task => {
                            const s = window.AppCalendar.getSmartTaskStatus(dateStr, task.status);
                            if (s === 'overdue') worst = 'overdue';
                            else if (s === 'in-process' && worst !== 'overdue') worst = 'in-process';
                            else if (s === 'completed' && worst !== 'overdue' && worst !== 'in-process') worst = 'completed';
                        });
                    });
                    workStatus = worst;
                }
                return { hasLeave, hasEvent, hasWork, workStatus };
            };

            let monthsHTML = '';
            for (let m = 0; m < 12; m++) {
                const firstDay = new Date(year, m, 1).getDay();
                const daysInMonth = new Date(year, m + 1, 0).getDate();
                let daysHTML = '';
                for (let i = 0; i < firstDay; i++) daysHTML += '<div class="annual-day empty"></div>';
                for (let d = 1; d <= daysInMonth; d++) {
                    const markers = getDayMarkers(d, m, year);
                    const isToday = d === today.getDate() && m === today.getMonth() && year === today.getFullYear();
                    const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    let bgClass = markers.hasWork ? `has-work work-${markers.workStatus}` : '';
                    daysHTML += `
                        <div class="annual-day ${isToday ? 'today' : ''} ${bgClass}" onclick="window.app_openDayPlan('${dateStr}')">
                            ${d}
                            <div class="dot-container">
                                ${markers.hasLeave ? '<span class="status-dot dot-leave"></span>' : ''}
                                ${markers.hasEvent ? '<span class="status-dot dot-event"></span>' : ''}
                                ${markers.hasWork ? '<span class="status-dot dot-work"></span>' : ''}
                            </div>
                        </div>`;
                }
                monthsHTML += `
                    <div class="annual-month-card">
                        <h4 style="margin-top:0; margin-bottom:1rem; color:var(--primary); font-size:1rem; border-bottom:1px solid #f1f5f9; padding-bottom:0.5rem; display:flex; justify-content:space-between;">
                            ${monthNames[m]}
                            <span style="font-size:0.7rem; color:#94a3b8; font-weight:400;">${year}</span>
                        </h4>
                        <div class="annual-cal-mini">
                            <div style="font-weight:700; color:#9ca3af; text-align:center;">S</div>
                            <div style="font-weight:700; color:#9ca3af; text-align:center;">M</div>
                            <div style="font-weight:700; color:#9ca3af; text-align:center;">T</div>
                            <div style="font-weight:700; color:#9ca3af; text-align:center;">W</div>
                            <div style="font-weight:700; color:#9ca3af; text-align:center;">T</div>
                            <div style="font-weight:700; color:#9ca3af; text-align:center;">F</div>
                            <div style="font-weight:700; color:#9ca3af; text-align:center;">S</div>
                            ${daysHTML}
                        </div>
                    </div>`;
            }

            return `
                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    <div class="card" style="padding:1.5rem; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h2 style="margin:0; color:#1e1b4b; font-size:1.5rem;">NGO Annual Planning</h2>
                            <p style="margin:0.25rem 0 0 0; color:#64748b; font-size:0.9rem;">Overview of all staff activities, leaves, and shared events for ${year}.</p>
                        </div>
                        <div style="display:flex; gap:1rem; align-items:center;">
                            <div style="display:flex; background:#f1f5f9; border-radius:10px; padding:4px;">
                                <button onclick="window.app_changeAnnualYear(-1)" style="border:none; background:none; padding:8px 12px; cursor:pointer; color:#475569;"><i class="fa-solid fa-chevron-left"></i></button>
                                <div style="display:flex; align-items:center; padding:0 1rem; font-weight:700; color:#1e1b4b;">${year}</div>
                                <button onclick="window.app_changeAnnualYear(1)" style="border:none; background:none; padding:8px 12px; cursor:pointer; color:#475569;"><i class="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="card" style="padding:1rem; display:flex; gap:2rem; flex-wrap:wrap; font-size:0.8rem; color:#475569; justify-content:center; background:#f8fafc; border:none; box-shadow:none;">
                        <span style="display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:#ef4444;"></span> Staff Leave</span>
                        <span style="display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:#10b981;"></span> Company Event</span>
                        <span style="display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:#6366f1;"></span> Work Plan</span>
                        <span style="display:flex; align-items:center; gap:6px; margin-left:1rem; border-left:1px solid #e2e8f0; padding-left:1rem;">
                            <span style="font-weight:700; color:#94a3b8; margin-right:4px;">BORDERS:</span>
                            <span style="display:flex; align-items:center; gap:4px; padding:2px 8px; border:1.5px solid #fecaca; border-radius:4px; font-size:0.7rem;">Overdue</span>
                            <span style="display:flex; align-items:center; gap:4px; padding:2px 8px; border:1.5px solid #bbf7d0; border-radius:4px; font-size:0.7rem;">Completed</span>
                        </span>
                    </div>
                    <div class="annual-plan-grid">
                        ${monthsHTML}
                    </div>
                </div>`;
        },


        async renderTimesheet() {
            const user = window.AppAuth.getUser();
            const logs = await window.AppAttendance.getLogs();

            // Calculate Monthly Summary Stats (from logs shown)
            let totalMins = 0;
            let lateCount = 0;
            const uniqueDays = new Set();

            logs.forEach(log => {
                if (log.durationMs) totalMins += (log.durationMs / (1000 * 60));
                if (log.type === 'Late') lateCount++;
                if (log.date) uniqueDays.add(log.date);
            });

            const totalHoursFormatted = `${Math.floor(totalMins / 60)}h ${Math.round(totalMins % 60)}m`;

            // Helper for updating descriptions
            window.app_editWorkSummary = async (logId) => {
                const logs = await window.AppAttendance.getLogs();
                const log = logs.find(l => l.id === logId);
                const currentDesc = log ? log.workDescription : "";

                const newDesc = prompt("Update Work Summary:", currentDesc || "");
                if (newDesc !== null) {
                    await window.AppAttendance.updateLog(logId, { workDescription: newDesc });
                    window.location.reload(); // Refresh to show update
                }
            };

            return `
                <div class="card full-width" style="border: none; box-shadow: var(--shadow-md);">
                    <!-- Header Actions -->
                    <div class="timesheet-controls">
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem;">My Timesheet</h3>
                            <p style="margin: 4px 0 0; font-size: 0.8rem; color: var(--text-muted);">View and manage your attendance logs</p>
                        </div>
                        <div style="display: flex; gap: 0.75rem;">
                            <button class="action-btn secondary" style="padding: 0.5rem 1rem; font-size: 0.8rem; border-color: #fda4af; color: #be123c; background: #fff1f2;" onclick="document.getElementById('leave-modal').style.display = 'flex'">
                                <i class="fa-solid fa-calendar-xmark"></i> Request Leave
                            </button>
                            <button class="action-btn" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="document.dispatchEvent(new CustomEvent('open-log-modal'))">
                                <i class="fa-solid fa-plus"></i> Manual Log
                            </button>
                        </div>
                    </div>

                    <!-- Monthly Quick Stats -->
                    <div class="stat-grid" style="margin-top: 1rem;">
                        <div class="stat-card">
                            <div class="label">Total Hours</div>
                            <div class="value">${totalHoursFormatted}</div>
                        </div>
                        <div class="stat-card">
                            <div class="label">Days Present</div>
                            <div class="value">${uniqueDays.size} <span style="font-size: 0.7rem; color: #6b7280;">Days</span></div>
                        </div>
                        <div class="stat-card">
                            <div class="label">Late Entries</div>
                            <div class="value" style="color: ${lateCount > 2 ? 'var(--accent)' : 'var(--text-main)'}">${lateCount}</div>
                        </div>
                        <div class="stat-card">
                            <div class="label">Grace Used</div>
                            <div class="value">${lateCount}/3 <span style="font-size: 0.7rem; color: #6b7280;">Lates</span></div>
                        </div>
                    </div>

                    <!-- Workflow Filter Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0;">
                        <div class="filter-group">
                            <i class="fa-solid fa-filter" style="color: #64748b; font-size: 0.8rem;"></i>
                            <select style="border: none; background: transparent; font-weight: 600; color: #1e293b; font-size: 0.85rem; outline: none; cursor: pointer;">
                                <option>February 2026</option>
                                <option>January 2026</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="window.AppReports?.exportUserLogs('${user.id}')" style="background: white; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #475569; cursor: pointer;">
                                <i class="fa-solid fa-download"></i> Export CSV
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-container mobile-table-card">
                        <table class="compact-table">
                            <thead style="background: #f1f5f9;">
                                    <tr>
                                        <th style="border-radius: 8px 0 0 0;">Date</th>
                                        <th>Timings</th>
                                        <th>In/Out Status</th>
                                        <th>Work Summary</th>
                                        <th style="text-align: right; border-radius: 0 8px 0 0;">Detail</th>
                                    </tr>
                            </thead>
                            <tbody>
                                    ${logs.length ? logs.map(log => `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td data-label="Date" style="white-space: nowrap;">
                                                <div style="font-weight: 700;">${log.date || 'Active Session'}</div>
                                                <div style="font-size: 0.7rem; color: #94a3b8;">Log ID: ${log.id === 'active_now' ? 'N/A' : log.id.slice(-4)}</div>
                                            </td>
                                            <td data-label="Timings">
                                                <div class="time-badge">
                                                    <span class="in"><i class="fa-solid fa-caret-right" style="font-size: 0.6rem;"></i> ${log.checkIn}</span>
                                                    <span class="out"><i class="fa-solid fa-caret-left" style="font-size: 0.6rem;"></i> ${log.checkOut || '--:--'}</span>
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                                    <span class="badge" style="background: ${log.type === 'Late' ? '#fff1f2' : '#f0fdf4'}; color: ${log.type === 'Late' ? '#be123c' : '#15803d'}; font-size: 0.7rem; padding: 2px 6px; width: fit-content; border: 1px solid ${log.type === 'Late' ? '#fecaca' : '#dcfce7'};">${log.type || 'Present'}</span>
                                                    <div style="font-size: 0.65rem; font-weight: 700; color: var(--primary);">${log.duration || '--'}</div>
                                                </div>
                                            </td>
                                            <td data-label="Work Summary" style="max-width: 300px;">
                                                <div style="display: flex; gap: 8px; align-items: flex-start;">
                                                    <div style="flex: 1;">
                                                        <div style="font-size: 0.8rem; color: #334155; line-height: 1.4; white-space: pre-wrap;">${log.workDescription || '<span style="color:#94a3b8; font-style:italic;">No summary provided</span>'}</div>
                                                        ${log.location ? `<div style="font-size: 0.65rem; color: #94a3b8; margin-top: 4px;"><i class="fa-solid fa-location-dot"></i> ${log.location}</div>` : ''}
                                                    </div>
                                                    ${log.id !== 'active_now' ? `<button onclick="window.app_editWorkSummary('${log.id}')" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='#94a3b8'"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
                                                </div>
                                            </td>
                                            <td data-label="Detail" style="text-align: right;">
                                                ${log.id !== 'active_now' ? `
                                                    <button class="icon-btn" style="background: #f8fafc; color: #64748b; width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-flex; justify-content: center; align-items: center;" title="View Detailed Log" onclick="alert('Detailed analysis for log ${log.id} coming soon!')">
                                                        <i class="fa-solid fa-circle-info"></i>
                                                    </button>
                                                ` : '<span style="font-size: 0.7rem; color: var(--success); font-weight: 700; animation: pulse 2s infinite;">SESSION LIVE</span>'}
                                            </td>
                                        </tr>
                                    `).join('') : `<tr><td colspan="5" style="text-align:center; padding: 3rem; color: #94a3b8;">No attendance records found for this period.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>

                <style>
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.4; }
                        100% { opacity: 1; }
                    }
                </style>
            `;
        },
        async renderProfile() {
            try {
                const user = window.AppAuth.getUser();
                if (!user) return '<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';

                // Fetch Stats concurrently
                const [monthlyStats, yearlyStats, leaves] = await Promise.all([
                    window.AppAnalytics.getUserMonthlyStats(user.id),
                    window.AppAnalytics.getUserYearlyStats(user.id),
                    window.AppLeaves.getUserLeaves(user.id)
                ]);

                // Helper functions (attached to window)
                window.app_triggerUpload = () => document.getElementById('profile-upload').click();
                window.app_handlePhotoUpload = async (input) => {
                    if (input.files && input.files[0]) {
                        const file = input.files[0];
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            const base64 = e.target.result;
                            const success = await window.AppAuth.updateUser({ id: user.id, avatar: base64 });
                            if (success) {
                                alert("Profile photo updated!");
                                window.location.reload();
                            } else {
                                alert("Failed to save photo.");
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                };

                return `
                <div class="dashboard-grid">
                    <div class="card full-width" style="padding: 0; overflow: hidden; border: none; box-shadow: var(--shadow-lg);">
                        <!-- Compact Header -->
                        <div class="profile-header-compact">
                            <div class="profile-avatar-container">
                                <img src="${user.avatar}" alt="Profile">
                                <button onclick="window.app_triggerUpload()" style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; border: 2px solid #1E1B4B; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" title="Change Photo">
                                    <i class="fa-solid fa-camera" style="font-size: 0.7rem;"></i>
                                </button>
                                <input type="file" id="profile-upload" accept="image/*" style="display: none;" onchange="window.app_handlePhotoUpload(this)">
                            </div>
                            <div>
                                <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">${user.name}</h2>
                                <p style="margin: 4px 0 0; opacity: 0.8; font-size: 0.9rem; font-weight: 500;">
                                    ${user.role} <span style="margin: 0 0.5rem; opacity: 0.5;">|</span> ${user.dept || 'General'}
                                </p>
                                <div style="margin-top: 10px; display: flex; gap: 8px;">
                                    <span class="badge ${user.status === 'in' ? 'in' : 'out'}" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); font-size: 0.7rem;">
                                        ${user.status === 'in' ? '● Online' : '○ Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Information Grid -->
                        <div style="padding: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <!-- Left: Stats -->
                            <div style="border-right: 1px solid #f3f4f6; padding-right: 1rem;">
                                <h3 style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">Performance Stats</h3>
                                <div class="stat-grid" style="grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                                    <div class="stat-card">
                                        <div class="label">Monthly Attendance</div>
                                        <div class="value">${monthlyStats.present} <span style="font-size: 0.7rem; color: #6b7280;">Days</span></div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="label">Total Leaves (FY)</div>
                                        <div class="value">${yearlyStats.leaves} <span style="font-size: 0.7rem; color: #6b7280;">Days</span></div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="label">Late Arrivals</div>
                                        <div class="value">${monthlyStats.late}</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="label">Policy Rating</div>
                                        <div class="value">${(user.rating || 5.0).toFixed(1)} <i class="fa-solid fa-star" style="color: #eab308; font-size: 0.7rem;"></i></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Contact / Bio -->
                            <div>
                                <h3 style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">Employment Details</h3>
                                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b;">
                                            <i class="fa-solid fa-envelope"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">EMAIL ADDRESS</div>
                                            <div style="font-size: 0.85rem; color: #1e293b; font-weight: 500;">${user.username || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b;">
                                            <i class="fa-solid fa-id-card"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">STAFF ID</div>
                                            <div style="font-size: 0.85rem; color: #1e293b; font-weight: 500;">${user.id.toUpperCase()}</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b;">
                                            <i class="fa-solid fa-calendar-check"></i>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">JOINING DATE</div>
                                            <div style="font-size: 0.85rem; color: #1e293b; font-weight: 500;">${user.joinDate || 'Jan 01, 2024'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Leaves Overview -->
                    <div class="card full-width" style="padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0; font-size: 1rem;">Leave History</h3>
                            <button onclick="document.getElementById('leave-modal').style.display='flex'" class="action-btn secondary" style="font-size: 0.75rem; padding: 4px 12px;">Request New</button>
                        </div>
                        <div class="table-container" style="max-height: 200px; overflow-y: auto;">
                            <table class="compact-table">
                                <thead style="background: #f8fafc; position: sticky; top: 0; z-index: 1;">
                                    <tr>
                                        <th>Date Range</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${leaves.length ? leaves.map(l => `
                                        <tr>
                                            <td style="font-size: 0.8rem; font-weight: 500;">${l.startDate} ${l.endDate !== l.startDate ? `to ${l.endDate}` : ''}</td>
                                            <td><span style="font-size: 0.75rem; color: #475569; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${l.type}</span></td>
                                            <td>
                                                <span class="badge" style="
                                                    background: ${l.status === 'approved' ? '#f0fdf4' : (l.status === 'rejected' ? '#fff1f2' : '#fefce8')};
                                                    color: ${l.status === 'approved' ? '#166534' : (l.status === 'rejected' ? '#991b1b' : '#854d0e')};
                                                    border: 1px solid ${l.status === 'approved' ? '#dcfce7' : (l.status === 'rejected' ? '#fecaca' : '#fef08a')};
                                                ">
                                                    ${l.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style="font-size: 0.75rem; color: #64748b; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${l.reason}">${l.reason}</td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 2rem;">No leave requests yet.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>`;
            } catch (e) {
                console.error("Profile Render Error", e);
                return `<div style="padding: 2rem; color: red;">Error loading profile: ${e.message}</div>`;
            }
        },

        async renderMasterSheet(month = null, year = null) {
            const users = await window.AppDB.getAll('users');

            const now = new Date();
            const currentMonth = month !== null ? parseInt(month) : now.getMonth();
            const currentYear = year !== null ? parseInt(year) : now.getFullYear();

            // Filtered Query for Logs
            const startDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
            const endDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`;
            const logs = await window.AppDB.query('attendance', 'date', '>=', startDateStr);
            const filteredLogs = logs.filter(l => l.date <= endDateStr);

            // Days in selected month
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            return `
                <div class="dashboard-grid">
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
                                <button onclick="window.app_exportMasterSheet()" class="action-btn secondary" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
                                    <i class="fa-solid fa-file-excel"></i> Export Excel
                                </button>
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
                                                    <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${u.name}</span>
                                                    <span style="font-size:0.65rem; color:#666; font-weight:400;">${u.dept || 'General'}</span>
                                                </div>
                                            </td>
                                            ${daysArray.map(day => {
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayLogs = filteredLogs.filter(l => (l.userId === u.id || l.user_id === u.id) && l.date === dateStr);

                    let cellContent = '-';
                    let cellStyle = '';
                    let tooltip = 'No log';

                    if (dayLogs.length > 0) {
                        const log = dayLogs[0];
                        const type = log.type || 'Present';
                        cellContent = type.charAt(0).toUpperCase();
                        tooltip = `${log.checkIn} - ${log.checkOut || 'Active'}\n${type}`;

                        if (type === 'Present') { cellStyle = 'color: #10b981; font-weight: bold; font-size: 0.9rem;'; }
                        else if (type === 'Late') { cellStyle = 'color: #f59e0b; font-weight: bold;'; cellContent = 'L'; }
                        else if (type === 'Absent') { cellStyle = 'color: #ef4444; font-weight: bold;'; cellContent = 'A'; }
                        else if (type.includes('Leave')) { cellStyle = 'color: #8b5cf6; font-weight: bold;'; cellContent = 'C'; }
                        else if (type === 'Work - Home') { cellStyle = 'color: #0ea5e9; font-weight: bold;'; cellContent = 'W'; }

                        if (log.isManualOverride) {
                            cellStyle = 'color: #be185d; font-weight: bold; background: #fdf2f8;';
                        }
                    }

                    return `
                                                    <td style="text-align:center; cursor:pointer; border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${cellStyle}" 
                                                        title="${tooltip}"
                                                        onclick="window.app_openCellOverride('${u.id}', '${dateStr}')">
                                                        ${cellContent}
                                                    </td>
                                                `;
                }).join('')}
                                        </tr>
                                    `;
            }).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div style="margin-top: 1rem; display: flex; gap: 1.5rem; font-size: 0.8rem; color: #666;">
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#10b981; font-weight:bold;">P</span> Present</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#f59e0b; font-weight:bold;">L</span> Late</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#ef4444; font-weight:bold;">A</span> Absent</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#8b5cf6; font-weight:bold;">C</span> Leave</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#0ea5e9; font-weight:bold;">W</span> WFH</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#be185d; font-weight:bold; background:#fdf2f8; padding:0 3px;">P/A</span> Manual Override</div>
                        </div>
                    </div>
                </div>`;
        },

        async renderAdmin() {
            let allUsers = [];
            let performance = { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0], labels: [] };

            try {
                [allUsers, performance] = await Promise.all([
                    window.AppDB.getAll('users'),
                    window.AppAnalytics.getSystemPerformance()
                ]);
            } catch (e) {
                console.error("Failed to fetch admin data", e);
            }

            const activeCount = allUsers.filter(u => u.status === 'in').length;
            const adminCount = allUsers.filter(u => u.role === 'Administrator' || u.isAdmin).length;
            const perfStatus = performance.avgScore > 70 ? 'Optimal' : (performance.avgScore > 40 ? 'Good' : 'Low');
            const perfColor = performance.avgScore > 70 ? '#166534' : (performance.avgScore > 40 ? '#854d0e' : '#991b1b');
            const perfBg = performance.avgScore > 70 ? '#f0fdf4' : (performance.avgScore > 40 ? '#fefce8' : '#fef2f2');

            return `
                <div class="dashboard-grid">
                    <!-- Stats Overview -->
                    <div class="card" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border: none; padding: 1.25rem;">
                        <span style="font-size: 0.75rem; opacity: 0.8; font-weight: 500;">Total Registered Staff</span>
                        <h2 style="font-size: 2rem; margin: 0.25rem 0;">${allUsers.length}</h2>
                        <div style="display: flex; gap: 0.75rem; margin-top: 0.75rem;">
                            <div style="flex: 1; background: rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 0.75rem;">
                                <div style="font-size: 1.1rem; font-weight: 700;">${activeCount}</div>
                                <div style="font-size: 0.65rem; opacity: 0.7; text-transform: uppercase;">Active</div>
                            </div>
                            <div style="flex: 1; background: rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 0.75rem;">
                                <div style="font-size: 1.1rem; font-weight: 700;">${adminCount}</div>
                                <div style="font-size: 0.65rem; opacity: 0.7; text-transform: uppercase;">Admins</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <div>
                                <h4 style="margin:0;">System Performance</h4>
                                <p class="text-muted" style="font-size: 0.8rem; margin-top:2px;">Avg. Activity: ${performance.avgScore}%</p>
                            </div>
                            <div style="background: ${perfBg}; color: ${perfColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${perfStatus}</div>
                        </div>
                        
                        <div style="height: 80px; display: flex; align-items: flex-end; gap: 5px; margin-bottom: 6px;">
                            ${performance.trendData.map((h, i) => {
                const barColor = h > 70 ? 'var(--primary)' : (h > 40 ? '#f59e0b' : '#ef4444');
                return `
                                    <div style="flex: 1; display: flex; flex-direction: column; height: 100%; justify-content: flex-end; align-items: center; gap: 3px;">
                                        <div style="font-size: 0.55rem; font-weight: 700; color: ${barColor};">${h}%</div>
                                        <div style="width: 100%; background: ${barColor}; height: ${Math.max(h, 5)}%; border-radius: 4px 4px 0 0; opacity: 0.8;" title="Score: ${h}%"></div>
                                    </div>
                                `;
            }).join('')}
                        </div>
                        
                        <div style="display: flex; gap: 6px; border-top: 1px solid #f3f4f6; padding-top: 4px; margin-bottom: 1rem;">
                             ${(performance.labels || []).map(label => `<div style="flex: 1; text-align: center; font-size: 0.65rem; color: #9ca3af; font-weight: 600;">${label}</div>`).join('')}
                        </div>

                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.65rem; color: #6b7280; font-weight: 500;">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: var(--primary);"></span> Optimal (>70%)
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: #f59e0b;"></span> Good (40-70%)
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: #ef4444;"></span> Low (<40%)
                            </div>
                        </div>
                    </div>

                    <div class="card full-width">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                            <h3 style="font-size: 1.1rem; margin: 0;">Staff Management</h3>
                            <div style="display: flex; gap: 0.5rem; width: 100%; justify-content: space-between;">
                                <button class="action-btn secondary" style="flex: 1; padding: 0.4rem; font-size: 0.8rem;" onclick="window.app_exportReports()">
                                    <i class="fa-solid fa-file-export"></i> CSV
                                </button>
                                <button class="action-btn" style="flex: 1; padding: 0.4rem; font-size: 0.8rem;" onclick="document.getElementById('add-user-modal').style.display = 'flex'">
                                    <i class="fa-solid fa-user-plus"></i> Add Staff
                                </button>
                            </div>
                        </div>
                         <div class="table-container mobile-table-card">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Staff Member</th>
                                        <th>Status</th>
                                        <th>In / Out</th>
                                        <th>Role / Dept</th>
                                        <th>Location</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${allUsers.map(u => {
                const isLive = u.lastSeen && (Date.now() - u.lastSeen < 120000);
                const lastIn = u.lastCheckIn ? new Date(u.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
                const lastOut = u.lastCheckOut ? new Date(u.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

                return `
                                        <tr>
                                            <td data-label="Staff">
                                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                    <div style="position: relative;">
                                                        <img src="${u.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                                                        ${isLive ? `<div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid white; border-radius: 50%;"></div>` : ''}
                                                    </div>
                                                    <div>
                                                        <div style="font-weight: 600; display: flex; align-items: center; gap: 4px;">
                                                            ${u.name}
                                                            ${isLive ? `<span style="font-size: 0.6rem; background: #f0fdf4; color: #166534; padding: 1px 4px; border-radius: 4px; font-weight: 700;">LIVE</span>` : ''}
                                                        </div>
                                                        <div style="font-size: 0.75rem; color: #6b7280;">ID: ${u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <span class="status-badge ${u.status === 'in' ? 'in' : 'out'}">
                                                    ${u.status === 'in' ? 'In' : 'Out'}
                                                </span>
                                            </td>
                                            <td data-label="Logged">
                                                <div style="font-size: 0.85rem; color: #374151;">
                                                    <div style="display: flex; align-items: center; gap: 4px;">
                                                        <i class="fa-solid fa-arrow-right-to-bracket" style="color: #10b981; font-size: 0.7rem;"></i>
                                                        <span>${lastIn}</span>
                                                    </div>
                                                    <div style="display: flex; align-items: center; gap: 4px;">
                                                        <i class="fa-solid fa-arrow-right-from-bracket" style="color: #ef4444; font-size: 0.7rem;"></i>
                                                        <span>${lastOut}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Role">
                                                <div style="font-weight: 500; font-size: 0.85rem;">${u.role}</div>
                                                <div style="font-size: 0.75rem; color: #6b7280;">${u.dept || '--'}</div>
                                            </td>
                                            <td data-label="Location">
                                                <div style="font-size: 0.75rem;">
                                                    ${(() => {
                        const loc = u.currentLocation || u.lastLocation;
                        if (loc && loc.lat && loc.lng) {
                            return `<a href="https://www.google.com/maps?q=${loc.lat},${loc.lng}" target="_blank" style="color:var(--primary); text-decoration:none;">Map</a>`;
                        }
                        return loc?.address || 'N/A';
                    })()}
                                                </div>
                                            </td>
                                             <td data-label="Actions">
                                                 <div style="display: flex; gap: 0.3rem;">
                                                      <button onclick="window.app_viewLogs('${u.id}')" style="padding: 0.3rem; background: #eef2ff; color: #4338ca; border: none; border-radius: 6px; cursor: pointer;" title="Logs"><i class="fa-solid fa-list-check"></i></button>
                                                      <button onclick="window.app_notifyUser('${u.id}')" style="padding: 0.3rem; background: #fff7ed; color: #c2410c; border: none; border-radius: 6px; cursor: pointer;" title="Notify"><i class="fa-solid fa-bell"></i></button>
                                                      <button onclick="window.app_editUser('${u.id}')" style="padding: 0.3rem; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer;" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                                      <button onclick="window.app_deleteUser('${u.id}')" style="padding: 0.3rem; background: #fef2f2; color: #b91c1c; border: none; border-radius: 6px; cursor: pointer;" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                                 </div>
                                             </td>
                                         </tr>
                                     `;
            }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card full-width">
                        <h3>Attendance Trends</h3>
                        <div style="height: 300px; width: 100%; margin-top: 1rem;">
                            <canvas id="admin-stats-chart"></canvas>
                        </div>
                    </div>
                </div>`;
        },

        async renderSalaryProcessing() {
            const summary = await window.AppAnalytics.getSystemMonthlySummary();
            const today = new Date();
            const monthLabel = today.toLocaleDateString('default', { month: 'long', year: 'numeric' });

            return `
                <div class="card full-width">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.75rem;">
                        <div>
                            <h3 style="font-size: 1.15rem;">Salary Processing</h3>
                            <p class="text-muted" style="font-size: 0.8rem;">Period: ${monthLabel}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="background: #f8fafc; padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.5rem;">
                                <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">Global TDS:</label>
                                <input type="number" id="global-tds-percent" value="0" min="0" max="100" 
                                    style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;"
                                    onchange="window.app_recalculateAllSalaries()" />
                                <span style="font-weight: 600; color: #64748b;">%</span>
                            </div>
                            <button class="action-btn" onclick="window.app_exportSalaryCSV()" style="background: #10b981; padding: 0.5rem 1rem; font-size: 0.85rem;">
                                <i class="fa-solid fa-file-csv"></i> CSV
                            </button>
                            <button class="action-btn" onclick="window.app_saveAllSalaries()" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                                <i class="fa-solid fa-save"></i> Save All
                            </button>
                        </div>
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Base Salary</th>
                                    <th>Attendance Summary</th>
                                    <th>Deductions</th>
                                    <th>Adjusted Salary</th>
                                    <th>TDS Amount</th>
                                    <th>Final Net</th>
                                    <th>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${summary.map(item => {
                const { user, stats } = item;
                const base = user.baseSalary || 0;
                const dailyRate = base / 22;

                const totalDeductionDays = stats.unpaidLeaves + stats.penalty;
                const deductionAmount = Math.round(dailyRate * totalDeductionDays);
                const calculatedSalary = Math.max(0, base - deductionAmount);

                return `
                                        <tr data-user-id="${user.id}" data-base-salary="${base}">
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                    <img src="${user.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                                                    <div style="font-weight: 600;">${user.name}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <input type="number" class="base-salary-input" value="${base}" 
                                                    style="width: 90px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"
                                                    onchange="window.app_recalculateRow(this.closest('tr'))" />
                                            </td>
                                            <td style="font-size: 0.85rem;">
                                                <span style="color: #10b981;">P: ${stats.present}</span> | 
                                                <span style="color: #f59e0b;">L: ${stats.late}</span> | 
                                                <span style="color: #991b1b;">ED: ${stats.earlyDepartures}</span> |
                                                <span style="color: #ef4444;">UL: <span class="unpaid-leaves-count">${stats.unpaidLeaves}</span></span>
                                            </td>
                                            <td style="color: #ef4444; font-weight: 600;" class="deduction-amount">-₹${deductionAmount.toLocaleString()}</td>
                                            <td>
                                                <input type="number" class="salary-input" value="${calculatedSalary}" 
                                                    style="width: 100px; padding: 4px; border: 1px solid #ddd; border-radius: 10px;"
                                                    onchange="this.dataset.manual = 'true'; window.app_recalculateRow(this.closest('tr'))" />
                                            </td>
                                            <td style="color: #64748b;" class="tds-amount">₹0</td>
                                            <td style="font-weight: 700; color: #1e40af;" class="final-net-salary">₹${calculatedSalary.toLocaleString()}</td>
                                            <td>
                                                <input type="text" class="comment-input" placeholder="Required if adjusted..."
                                                    style="width: 150px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;" />
                                            </td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        }
    };
})();
