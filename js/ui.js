/**
 * UI Module
 * Handles all purely visual rendering.
 * (Converted to IIFE for file:// support)
 */
(function () {
    // --- Helper Functions (Local to IIFE) ---
    const renderWorkLog = (logs, collabs = [], targetStaff = null, isViewingSelf = true) => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 180);
        const startDefault = startDate.toISOString().split('T')[0];
        const endDefault = today.toISOString().split('T')[0];
        const targetStaffId = targetStaff ? targetStaff.id : window.AppAuth.getUser().id;

        return `
                <div class="card dashboard-worklog-card">
                    <div class="dashboard-worklog-head">
                         <h4>Work Log${!isViewingSelf && targetStaff ? ` <span class="dashboard-worklog-staff">(${targetStaff.name})</span>` : ''}</h4>
                         <span>Ongoing & Historical Tasks</span>
                    </div>
                     <div class="dashboard-worklog-filter-row">
                        <input type="date" id="act-start" value="${startDefault}" class="dashboard-worklog-date-input">
                        <span class="dashboard-worklog-to">to</span>
                        <input type="date" id="act-end" value="${endDefault}" class="dashboard-worklog-date-input">
                        <button onclick="window.app_filterActivity()" class="dashboard-worklog-go-btn">Go</button>
                    </div>
                    <div id="activity-list" class="dashboard-worklog-list">
                        ${renderActivityList(logs, startDefault, endDefault, targetStaffId, collabs)}
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

    window.app_changeSummaryStaff = (staffId) => {
        window.app_selectedSummaryStaffId = staffId;
        window.AppUI.renderDashboard().then(html => {
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = html;
                if (window.setupDashboardEvents) window.setupDashboardEvents();
            }
        });
    };

    let dailyPlanReminderResolve = null;
    const showDailyPlanReminderModal = ({ dateStr, userId, hasPlan, planItems = [], legacyPlan = '' }) => {
        return new Promise((resolve) => {
            dailyPlanReminderResolve = resolve;
            const modalId = 'daily-plan-reminder-modal';
            document.getElementById(modalId)?.remove();
            const hour = new Date().getHours();
            const dayPart = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
            const greeting = dayPart === 'morning'
                ? 'Good Morning'
                : dayPart === 'afternoon'
                    ? 'Good Afternoon'
                    : 'Good Evening';
            const iconClass = dayPart === 'evening' ? 'fa-cloud-moon' : 'fa-sun';

            const taskListHTML = hasPlan
                ? `<div class="daily-plan-reminder-list">
                        ${(planItems || []).slice(0, 6).map((p, idx) => `
                            <div class="daily-plan-reminder-item">
                                <span class="daily-plan-reminder-index">${idx + 1}</span>
                                <span>${p.task || 'Planned task'}</span>
                            </div>
                        `).join('') || `<div class="daily-plan-reminder-item"><span class="daily-plan-reminder-index">1</span><span>${legacyPlan || 'Planned task'}</span></div>`}
                        ${(planItems || []).length > 6 ? `<div class="daily-plan-reminder-more">+ ${(planItems || []).length - 6} more task(s)</div>` : ''}
                   </div>`
                : `<div class="daily-plan-reminder-empty">No tasks planned yet for today.</div>`;

            const html = `
                <div class="modal-overlay" id="${modalId}" style="display:flex;">
                    <div class="modal-content daily-plan-reminder-modal daily-theme-${dayPart}">
                        <div class="daily-plan-reminder-head">
                            <div class="daily-plan-reminder-badge"><i class="fa-solid ${iconClass}"></i></div>
                            <div>
                                <h3>${greeting}</h3>
                                <p>You are checked in for ${dateStr}</p>
                            </div>
                        </div>
                        <div class="daily-plan-reminder-body">
                            <p class="daily-plan-reminder-note">${hasPlan ? "Here is your plan for today:" : "Start your day with a clear plan to stay focused."}</p>
                            ${taskListHTML}
                        </div>
                        <div class="daily-plan-reminder-actions">
                            <button type="button" class="action-btn secondary" onclick="window.app_handleDailyPlanReminderAction('later')">Later</button>
                            <button type="button" class="action-btn" onclick="window.app_handleDailyPlanReminderAction('open', '${dateStr}', '${userId}')">${hasPlan ? 'Open Plan' : 'Create Plan'}</button>
                        </div>
                    </div>
                </div>
            `;

            if (typeof window.app_showModal === 'function') {
                window.app_showModal(html, modalId);
            } else {
                const container = document.getElementById('modal-container') || document.body;
                container.insertAdjacentHTML('beforeend', html);
            }
        });
    };

    window.app_handleDailyPlanReminderAction = (action, dateStr, userId) => {
        document.getElementById('daily-plan-reminder-modal')?.remove();
        if (action === 'open' && typeof window.app_openDayPlan === 'function') {
            window.app_openDayPlan(dateStr, userId);
        }
        if (dailyPlanReminderResolve) {
            dailyPlanReminderResolve(action);
            dailyPlanReminderResolve = null;
        }
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

        if (merged.length === 0) return '<div class="dashboard-activity-empty">No activity descriptions found.</div>';

        let html = '';
        let lastDate = '';
        const currentUser = window.AppAuth.getUser();
        const isAdminUser = currentUser && (currentUser.role === 'Administrator' || currentUser.isAdmin);

        merged.forEach(log => {
            const showDate = log.date !== lastDate;
            if (showDate) {
                html += `<div class="dashboard-activity-date">${log.date}</div>`;
                lastDate = log.date;
            }
            const borderColor = log._isCollab ? '#10b981' : '#e5e7eb';
            const collabClass = log._isCollab ? 'dashboard-activity-item-collab' : '';
            let statusBadge = '';
            if (log._isCollab || log.status) {
                const status = window.AppCalendar.getSmartTaskStatus(log.date, log.status);
                statusBadge = `<div class="dashboard-activity-status-row">${window.AppUI.renderTaskStatusBadge(status)}${isAdminUser ? `<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${log.date}', '${targetStaffId}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>` : ''}</div>`;
            }
            html += `<div class="dashboard-activity-item ${collabClass}" style="border-left-color:${borderColor};"><div class="dashboard-activity-desc">${log._displayDesc}</div>${statusBadge}<div class="dashboard-activity-meta">${log.checkOut || (log.status === 'completed' ? 'Completed' : 'Planned Activity')}</div></div>`;
        });
        return html;
    };

    const renderActivityLog = (allStaffLogs) => {
        setTimeout(() => {
            const container = document.getElementById('staff-activity-list');
            if (container) initStaffActivityScroll(container);
        }, 500);
        return `
            <div class="card dashboard-team-activity-card">
                <div class="dashboard-team-activity-head"><h4>Team Activity</h4><span>Last 6 Months (Rolling)</span></div>
                <div class="dashboard-team-activity-filters"><button onclick="window.app_filterStaffActivity(14)" class="chip-btn dashboard-team-chip">Last 2 Weeks</button><button onclick="window.app_filterStaffActivity(30)" class="chip-btn dashboard-team-chip">Monthly</button></div>
                <div id="staff-activity-list" class="dashboard-team-activity-list">${renderStaffActivityList(allStaffLogs, 180)}</div>
            </div>`;
    };

    const renderStaffDirectory = (allUsers, notifications, currentUser) => {
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
        const mentionNotifs = (notifications || [])
            .map((n, idx) => ({ n, idx }))
            .filter(item => item.n.type === 'mention' || item.n.type === 'tag' || item.n.type === 'task');

        const pendingByName = {};
        mentionNotifs.forEach(({ n, idx }) => {
            const msg = String(n.message || '');
            const name = n.taggedByName || (msg.includes(' tagged you') ? msg.split(' tagged you')[0].trim() : '');
            if (!name) return;
            if (!pendingByName[name]) pendingByName[name] = [];
            pendingByName[name].push({ notif: n, idx });
        });

        const getNewestNotifTime = (u) => {
            const items = (u.notifications || []).map(n => new Date(n.taggedAt || n.date || n.respondedAt || 0).getTime()).filter(Boolean);
            return items.length ? Math.max(...items) : 0;
        };

        const isOnline = (u) => {
            const lastSeen = u.lastSeen ? Number(u.lastSeen) : 0;
            return lastSeen && (Date.now() - lastSeen < 60000);
        };
        const staffList = allUsers
            .filter(u => u.id !== currentUser.id)
            .sort((a, b) => getNewestNotifTime(b) - getNewestNotifTime(a) || a.name.localeCompare(b.name))
            .map(u => {
                const pending = pendingByName[u.name] || [];
                const firstPending = pending[0];
                const newest = getNewestNotifTime(u);
                const isNew = newest && (nowMs - newest < 120000);
                const statusClass = u.status === 'in' ? 'checkedin' : (isOnline(u) ? 'online' : 'offline');
                return `
                    <div class="dashboard-staff-row ${isNew ? 'dashboard-staff-row-new' : ''}">
                        <div class="dashboard-staff-meta">
                            <div class="dashboard-staff-avatar">
                                <img src="${u.avatar}" alt="${u.name}">
                                <span class="staff-status-dot ${statusClass}"></span>
                            </div>
                            <div class="dashboard-staff-text">
                                <div class="dashboard-staff-name">${u.name}</div>
                                <div class="dashboard-staff-role">${u.role || 'Staff'}</div>
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
    };

    const timeAgo = (isoOrDate) => {
        const ts = new Date(isoOrDate).getTime();
        if (!ts) return '';
        const diff = Math.max(0, Date.now() - ts);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} mins ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hrs ago`;
        const days = Math.floor(hrs / 24);
        return `${days} days ago`;
    };

    const renderTaggedItems = (notifications) => {
        const tagged = (notifications || []).filter(n => n.type === 'tag' || n.type === 'task' || n.type === 'mention');
        if (tagged.length === 0) return '';
        return `
            <div class="card full-width dashboard-tagged-card">
                <div class="dashboard-tagged-head"><h4>Tagged Items</h4><span>Pending approvals</span></div>
                <div class="dashboard-tagged-list">
                    ${tagged.map(n => `
                        <div class="dashboard-tagged-item">
                            <div class="dashboard-tagged-main">
                                <div class="dashboard-tagged-title">${n.title || 'Tagged item'}</div>
                                <div class="dashboard-tagged-desc">${n.description || n.message || ''}</div>
                                <div class="dashboard-tagged-meta">Tagged by ${n.taggedByName || 'Staff'} • ${timeAgo(n.taggedAt || n.date)}</div>
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
    };

    const renderNotificationPanel = (notifications, history) => {
        const currentUser = window.AppAuth.getUser();
        const isAdmin = currentUser && (currentUser.isAdmin || currentUser.role === 'Administrator');
        const items = [
            ...(notifications || []).map((n, notifIndex) => ({
                id: n.id,
                notifIndex,
                source: 'live',
                type: n.type,
                minuteId: n.minuteId || '',
                requesterId: n.taggedById || n.requesterId || '',
                name: n.taggedByName || 'System',
                summary: n.message || (n.type === 'task' ? 'sent you a task' : 'sent you a reminder'),
                snippet: n.title || n.description || '',
                time: n.taggedAt || n.date,
                status: n.status
            })),
            ...(history || []).map(h => ({
                id: h.id,
                notifIndex: null,
                source: 'history',
                name: h.taggedByName || 'System',
                summary: `Tag ${h.status}`,
                snippet: h.title || '',
                time: h.date,
                status: h.status
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time));
        if (items.length === 0) return '';
        return `
            <div class="card full-width dashboard-notifications-card">
                <h4><i class="fa-solid fa-bell"></i> Notifications</h4>
                <div class="dashboard-notifications-grid">
                    ${items.map((n, idx) => `
                        <div class="dashboard-notif-row">
                            <div class="dashboard-notif-col">
                                <div class="dashboard-notif-name">${n.name}</div>
                                <div class="dashboard-notif-summary">${n.summary}</div>
                            </div>
                            <div class="dashboard-notif-col right">
                                ${n.source === 'live' && Number.isInteger(n.notifIndex) ? `
                                    <button class="dashboard-notif-close" title="Dismiss" onclick="document.dispatchEvent(new CustomEvent('dismiss-notification', { detail: ${n.notifIndex} }))">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                ` : ''}
                                ${isAdmin && n.source === 'live' && n.type === 'minute-access-request' ? `
                                    <div style="display:flex; gap:0.4rem; justify-content:flex-end; margin-bottom:0.3rem;">
                                        <button type="button" onclick="window.app_reviewMinuteAccessFromNotification(${n.notifIndex}, '${n.id}', 'approved')" style="background:#10b981; color:#fff; border:none; border-radius:6px; padding:0.28rem 0.55rem; font-size:0.72rem; cursor:pointer;">Approve</button>
                                        <button type="button" onclick="window.app_reviewMinuteAccessFromNotification(${n.notifIndex}, '${n.id}', 'rejected')" style="background:#ef4444; color:#fff; border:none; border-radius:6px; padding:0.28rem 0.55rem; font-size:0.72rem; cursor:pointer;">Reject</button>
                                    </div>
                                ` : ''}
                                <div class="dashboard-notif-snippet">${n.snippet || '--'}</div>
                                <div class="dashboard-notif-time">${timeAgo(n.time)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
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
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        cutoffDate.setHours(0, 0, 0, 0);
        const filtered = allLogs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= cutoffDate;
        });
        if (filtered.length === 0) return '<div class="dashboard-activity-empty">No team activities found for the requested period.</div>';
        const deduped = [];
        const seen = new Map();
        filtered.forEach(log => {
            const desc = (log._displayDesc || '').trim();
            const key = `${log.staffName || ''}|${log.date || ''}|${desc}`;
            if (!seen.has(key)) {
                seen.set(key, log);
                deduped.push(log);
                return;
            }
            const existing = seen.get(key);
            const isAttendance = log.type === 'attendance';
            const existingIsAttendance = existing.type === 'attendance';
            if (isAttendance && !existingIsAttendance) {
                seen.set(key, log);
                const idx = deduped.indexOf(existing);
                if (idx >= 0) deduped[idx] = log;
            }
        });
        let html = '';
        let lastDate = '';
        const currentUser = window.AppAuth.getUser();
        const isAdminUser = currentUser && (currentUser.role === 'Administrator' || currentUser.isAdmin);
        deduped.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
            const showDate = log.date !== lastDate;
            if (showDate) { html += `<div class="dashboard-activity-date">${log.date}</div>`; lastDate = log.date; }
            let statusBadge = '';
            const effectiveStatus = log.status || (log.type === 'attendance' ? 'completed' : '');
            if (effectiveStatus || log.type === 'work') {
                const status = window.AppCalendar.getSmartTaskStatus(log.date, effectiveStatus);
                statusBadge = `<div class="dashboard-activity-status-row">${window.AppUI.renderTaskStatusBadge(status)}${isAdminUser ? `<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${log.date}', '${log.userId}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>` : ''}</div>`;
            }
            html += `<div class="dashboard-staff-activity-item"><div class="dashboard-staff-name">${log.staffName}</div><div class="dashboard-activity-desc dashboard-staff-activity-desc">${log._displayDesc}</div>${statusBadge}<div class="dashboard-activity-meta">${log.checkOut || (effectiveStatus === 'completed' ? 'Completed' : 'Work Plan')}</div></div>`;
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
                <div class="dashboard-breakdown-item" style="background:${style.bg};">
                    <span class="dashboard-breakdown-count" style="color:${style.color}">${count}</span>
                    <span class="dashboard-breakdown-label" style="color:${style.color};">${style.label}</span>
                </div>
             `;
        }).join('');
    };

    const renderStatsCard = (title, subtitle, statsObj) => {
        const penaltyBadge = statsObj.penalty > 0
            ? `<span class="dashboard-penalty-badge">Penalty Applies</span>`
            : '';

        return `
            <div class="card dashboard-stats-card">
                <div class="dashboard-stats-card-head">
                    <div>
                        <h4 class="dashboard-stats-card-title">${title}</h4>
                        <span class="dashboard-stats-card-subtitle">${subtitle}</span>
                    </div>
                    ${penaltyBadge}
                </div>

                <div class="dashboard-stats-metric-grid">
                     <div class="dashboard-stats-metric dashboard-stats-metric-late">
                        <div class="dashboard-stats-metric-value">${statsObj.totalLateDuration}</div>
                        <div class="dashboard-stats-metric-label">Late</div>
                     </div>
                     <div class="dashboard-stats-metric dashboard-stats-metric-extra">
                        <div class="dashboard-stats-metric-value">${statsObj.totalExtraDuration}</div>
                        <div class="dashboard-stats-metric-label">Extra</div>
                     </div>
                </div>

                <div class="dashboard-breakdown-grid">
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

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let calendarHTML = '';
        for (let i = 0; i < firstDay; i++) calendarHTML += '<div class="cal-day empty"></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const evs = window.app_getDayEvents(dStr, plans);
            const hasLeave = evs.some(e => e.type === 'leave');
            const hasEvent = evs.some(e => e.type === 'event');
            const hasWork = evs.some(e => e.type === 'work');
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

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
                <!-- Check-Out Modal (Redesigned) -->
                <div id="checkout-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="width: 100%; max-width: 550px; padding: 1.5rem; border-radius: 16px;">
                        
                        <!-- Redesigned Header -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
                                    <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
                                        <i class="fa-solid fa-door-open" style="color:white; font-size:1.1rem;"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.3rem; margin:0; font-weight:700; color:#111827;">Wrap Up Your Day</h3>
                                        <p id="checkout-date-display" style="font-size:0.875rem; color:#64748b; margin:0.25rem 0 0 0;">Review your accomplishments and check out</p>
                                    </div>
                                </div>
                            </div>
                            <button onclick="document.getElementById('checkout-modal').style.display = 'none'" title="Close without checking out" style="background:#f1f5f9; border:none; width:36px; height:36px; border-radius:8px; font-size:1.3rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">&times;</button>
                        </div>

                        <!-- How to Check Out Panel (Collapsible) -->
                        <div id="checkout-intro-panel" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1px solid #bbf7d0; border-radius:12px; padding:1rem; margin-bottom:1.5rem; display:none;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <i class="fa-solid fa-circle-info" style="color:#059669; font-size:1rem;"></i>
                                    <h4 style="margin:0; font-size:0.95rem; font-weight:700; color:#059669;">How to Check Out</h4>
                                </div>
                                <button onclick="window.app_hideCheckoutIntro()" title="Hide this guide" style="background:transparent; border:none; color:#059669; cursor:pointer; font-size:1.2rem; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(5, 150, 105, 0.1)'" onmouseout="this.style.background='transparent'">&times;</button>
                            </div>
                            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:0.75rem;">
                                <div style="display:flex; gap:0.5rem;">
                                    <div style="background:#10b981; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">1</div>
                                    <div>
                                        <p style="margin:0; font-size:0.8rem; font-weight:600; color:#065f46;">📝 Summarize Work</p>
                                        <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#047857; line-height:1.3;">List accomplishments</p>
                                    </div>
                                </div>
                                <div style="display:flex; gap:0.5rem;">
                                    <div style="background:#10b981; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">2</div>
                                    <div>
                                        <p style="margin:0; font-size:0.8rem; font-weight:600; color:#065f46;">✅ Review Plan</p>
                                        <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#047857; line-height:1.3;">Check completed tasks</p>
                                    </div>
                                </div>
                                <div style="display:flex; gap:0.5rem;">
                                    <div style="background:#10b981; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">3</div>
                                    <div>
                                        <p style="margin:0; font-size:0.8rem; font-weight:600; color:#065f46;">📍 Verify Location</p>
                                        <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#047857; line-height:1.3;">Confirm checkout spot</p>
                                    </div>
                                </div>
                                <div style="display:flex; gap:0.5rem;">
                                    <div style="background:#10b981; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">4</div>
                                    <div>
                                        <p style="margin:0; font-size:0.8rem; font-weight:600; color:#065f46;">🎉 You're Done!</p>
                                        <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#047857; line-height:1.3;">Have a great evening</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form id="checkout-form" onsubmit="window.app_submitCheckOut(event)">
                            <!-- Task Checklist Section -->
                            <div id="checkout-task-checklist" style="margin-bottom:1.5rem; background:linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding:1rem; border-radius:12px; border:2px solid #e9d5ff;">
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
                                    <div style="background:#a78bfa; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem;">2</div>
                                    <label style="font-size:0.85rem; font-weight:700; color:#6b21a8; margin:0;">&#9989; Your Planned Tasks for Today</label>
                                </div>
                                <div id="checkout-plan-text" style="display:none;"></div>
                                <div class="checkout-task-layout">
                                    <div id="checkout-task-list" style="display:block; background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:0.75rem;">
                                        <!-- Populated dynamically -->
                                        <div style="font-size:0.8rem; color:#6b7280;">Loading tasks...</div>
                                    </div>
                                    <div id="delegate-panel" style="display:none; background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:0.75rem;">
                                        <div style="font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.5rem;">Available Staff</div>
                                        <div id="delegate-list" style="display:flex; flex-direction:column; gap:0.4rem; margin-bottom:0.75rem;"></div>
                                        <div style="font-size:0.75rem; font-weight:700; color:#64748b; margin-bottom:0.35rem;">Selected Task</div>
                                        <div id="delegate-selected-task" style="font-size:0.85rem; color:#475569;"></div>
                                    </div>
                                </div>
                                <button type="button" onclick="window.app_useWorkPlan()" style="background:#8b5cf6; color:white; border:none; padding:8px 14px; border-radius:10px; font-size:0.95rem; cursor:pointer; font-weight:700; display:flex; align-items:center; gap:0.5rem; margin-top:0.85rem;">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i> <span>&#10024; Use Plan as My Summary</span>
                                </button>
                            </div>

                            <!-- Work Summary Section (Enhanced) -->
                            <div style="margin-bottom:1.5rem;">
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
                                    <div style="background:#3b82f6; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem;">1</div>
                                    <label style="font-size:0.85rem; font-weight:700; color:#1e40af; margin:0;">📝 Summarize What You Accomplished Today</label>
                                </div>
                                <p style="font-size:0.75rem; color:#64748b; margin:0 0 0.75rem 0; font-style:italic; line-height:1.4;">Be specific! This helps track your progress and generates your timesheet.</p>
                                
                                <textarea name="description" id="checkout-work-summary" required placeholder="• Finalized Q1 budget report and sent to finance team&#10;• Fixed authentication bug in user login module&#10;• Attended team standup and project planning meeting" 
                                    style="width:100%; min-height:150px; padding:0.85rem; border:2px solid #e2e8f0; border-radius:10px; font-family:inherit; resize:vertical; margin-bottom:0.5rem; font-size:0.95rem; line-height:1.5; background:#fcfdfe; transition: border-color 0.2s;" 
                                    onfocus="this.style.borderColor='#3b82f6'; this.style.background='#ffffff'" 
                                    onblur="this.style.borderColor='#e2e8f0'; this.style.background='#fcfdfe'"
                                    oninput="window.app_updateCharCounter && window.app_updateCharCounter(this)"></textarea>
                                
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span id="char-counter" style="font-size:0.75rem; color:#94a3b8;">0 / 500 recommended</span>
                                    <div style="display:flex; gap:0.5rem;">
                                        <span style="font-size:0.7rem; background:#dbeafe; color:#1e40af; padding:4px 8px; border-radius:6px; font-weight:600;">💡 Tip: Use bullet points</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Plan for Tomorrow (New) -->
                            <div style="margin-bottom:1.5rem; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding:1.25rem; border-radius:12px; border:2px solid #6ee7b7;">
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
                                    <div style="background:#059669; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem;">3</div>
                                    <label style="font-size:0.85rem; font-weight:700; color:#064e3b; margin:0;">🗓️ What's your top goal for tomorrow?</label>
                                </div>
                                <p style="font-size:0.75rem; color:#065f46; margin:0 0 0.75rem 0; font-style:italic;">Quickly set a goal for your next shift. We'll show this to you when you check in!</p>
                                <textarea name="tomorrowGoal" placeholder="e.g., Finalize the project report, Follow up with client X..." 
                                    style="width:100%; min-height:80px; padding:0.75rem; border:2px solid #6ee7b7; border-radius:10px; font-family:inherit; resize:none; font-size:0.9rem; line-height:1.4; background:white; transition: all 0.2s;" 
                                    onfocus="this.style.borderColor='#059669'; this.style.boxShadow='0 0 0 3px rgba(5, 150, 105, 0.1)'" 
                                    onblur="this.style.borderColor='#6ee7b7'; this.style.boxShadow='none'"></textarea>
                            </div>

                            <!-- Location Update Warning Index Adjustment -->
                            <div id="checkout-location-loading" style="display:none; margin-bottom: 1rem; padding: 0.75rem; background: #f0f9ff; border:1px solid #bae6fd; border-radius: 10px; text-align: center; font-size: 0.85rem; color: #0369a1;">
                                <i class="fa-solid fa-spinner fa-spin"></i> <span style="margin-left:0.5rem;">Verifying your location...</span>
                            </div>
                            
                            <!-- Location Mismatch (Redesigned - Friendly) -->
                            <div id="checkout-location-mismatch" style="display:none; margin-bottom: 1.5rem;">
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
                                    <div style="background:#0ea5e9; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem;">4</div>
                                    <label style="font-size:0.85rem; font-weight:700; color:#0c4a6e; margin:0;">📍 Location Update Notice</label>
                                </div>
                                <div style="padding: 0.85rem; background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 10px; margin-bottom:0.75rem;">
                                    <p style="font-size:0.8rem; color:#075985; margin:0; line-height:1.5;">
                                        <i class="fa-solid fa-circle-info" style="color:#0ea5e9; margin-right:0.5rem;"></i>
                                        You're checking out from a different location than check-in. <strong>This is perfectly fine!</strong> Just let us know why:
                                    </p>
                                </div>
                                
                                <!-- Quick Reason Selectors -->
                                <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                                    <button type="button" class="location-reason-btn" onclick="window.app_selectLocationReason('Went home early')" style="background:#e0f2fe; border:1px solid #7dd3fc; color:#0c4a6e; padding:6px 12px; border-radius:8px; font-size:0.8rem; cursor:pointer; font-weight:600; transition: all 0.2s;" onmouseover="this.style.background='#bae6fd'" onmouseout="this.style.background='#e0f2fe'">
                                        🏠 Went home early
                                    </button>
                                    <button type="button" class="location-reason-btn" onclick="window.app_selectLocationReason('Doctor appointment')" style="background:#e0f2fe; border:1px solid #7dd3fc; color:#0c4a6e; padding:6px 12px; border-radius:8px; font-size:0.8rem; cursor:pointer; font-weight:600; transition: all 0.2s;" onmouseover="this.style.background='#bae6fd'" onmouseout="this.style.background='#e0f2fe'">
                                        🏥 Doctor appointment
                                    </button>
                                    <button type="button" class="location-reason-btn" onclick="window.app_selectLocationReason('Client meeting')" style="background:#e0f2fe; border:1px solid #7dd3fc; color:#0c4a6e; padding:6px 12px; border-radius:8px; font-size:0.8rem; cursor:pointer; font-weight:600; transition: all 0.2s;" onmouseover="this.style.background='#bae6fd'" onmouseout="this.style.background='#e0f2fe'">
                                        🤝 Client meeting
                                    </button>
                                    <button type="button" class="location-reason-btn" onclick="window.app_selectLocationReason('Field work')" style="background:#e0f2fe; border:1px solid #7dd3fc; color:#0c4a6e; padding:6px 12px; border-radius:8px; font-size:0.8rem; cursor:pointer; font-weight:600; transition: all 0.2s;" onmouseover="this.style.background='#bae6fd'" onmouseout="this.style.background='#e0f2fe'">
                                        🚧 Field work
                                    </button>
                                </div>
                                
                                <textarea name="locationExplanation" id="location-explanation" placeholder="Or explain here... (optional)" style="width: 100%; height: 70px; padding: 0.75rem; border: 2px solid #bae6fd; border-radius: 10px; resize: none; font-size: 0.85rem; font-family: inherit; transition: border-color 0.2s;" onfocus="this.style.borderColor='#0ea5e9'" onblur="this.style.borderColor='#bae6fd'"></textarea>
                            </div>

                            <!-- Action Buttons -->
                            <div style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap:wrap;">
                                <button type="button" onclick="document.getElementById('checkout-modal').style.display = 'none'" style="flex: 1; min-width:180px; padding: 0.85rem; background: white; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-weight:600; color:#64748b; font-size:0.95rem; transition: all 0.2s; display:flex; align-items:center; justify-content:center; gap:0.5rem;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'">
                                    <span>✕ Stay Checked In</span>
                                </button>
                                <button type="submit" style="flex: 2; min-width:220px; padding: 0.85rem; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color:white; border:none; border-radius: 10px; cursor: pointer; font-weight:700; font-size:0.95rem; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3); transition: all 0.2s; display:flex; align-items:center; justify-content:center; gap:0.5rem;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 10px -1px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(16, 185, 129, 0.3)'">
                                    <i class="fa-solid fa-circle-check"></i> <span>🎉 Complete & Check Out</span>
                                </button>
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
                    <div class="modal-content notify-combined-modal">
                        <h3>Send Reminder / Task</h3>
                        <form id="notify-form" method="POST" class="notify-form">
                            <input type="hidden" name="toUserId" id="notify-user-id">
                            <div class="notify-columns">
                                <div class="notify-col">
                                    <h4>Send Reminder</h4>
                                    <label>
                                        Message
                                        <textarea name="reminderMessage" rows="5" placeholder="Type your reminder here..."></textarea>
                                    </label>
                                    <label>
                                        Link (optional)
                                        <input type="url" name="reminderLink" placeholder="https://example.org">
                                    </label>
                                </div>
                                <div class="notify-col">
                                    <h4>Send Task</h4>
                                    <label>
                                        Task Title
                                        <input type="text" name="taskTitle" placeholder="Short task title">
                                    </label>
                                    <label>
                                        Task Details
                                        <textarea name="taskDescription" rows="3" placeholder="Optional details..."></textarea>
                                    </label>
                                    <label>
                                        Task Due Date
                                        <input type="date" name="taskDueDate">
                                    </label>
                                </div>
                            </div>
                            <div class="notify-actions">
                                <button type="button" onclick="document.getElementById('notify-modal').style.display = 'none'" class="notify-cancel-btn">Cancel</button>
                                <button type="submit" class="action-btn notify-send-btn">Send</button>
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
        async checkDailyPlanReminder() {
            try {
                const user = window.AppAuth.getUser();
                if (!user || !window.AppCalendar) return;

                const today = new Date();
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const plan = await window.AppCalendar.getWorkPlan(user.id, dateStr, { includeAnnual: true, mergeAnnual: true });
                const planItems = Array.isArray(plan?.plans) ? plan.plans : [];
                const hasModernPlans = planItems.length > 0;
                const hasLegacyPlan = !!plan?.plan;

                await showDailyPlanReminderModal({
                    dateStr,
                    userId: user.id,
                    hasPlan: hasModernPlans || hasLegacyPlan,
                    planItems: planItems,
                    legacyPlan: plan?.plan || ''
                });
            } catch (err) {
                console.warn('Daily plan reminder failed:', err);
            }
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
    
                        <div class="dashboard-viewing-meta" style="color:#ffffff;">
                            <span style="font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #fbbf24;">Hero of the Week</span>
                            <h3 style="margin: 0.15rem 0; font-size: 1.25rem; letter-spacing: -0.5px; color:#ffffff;">${user.name}</h3>
                            <div style="display: flex; gap: 0.75rem; align-items: center; margin-top: 0.25rem;">
                                <div style="font-size: 0.75rem; background: rgba(255,255,255,0.12); padding: 3px 8px; border-radius: 20px; backdrop-filter: blur(4px); color:#ffffff;">
                                    <i class="fa-solid fa-star" style="color: #fbbf24; margin-right: 4px;"></i> ${reason}
                                </div>
                                <div style="font-size: 0.75rem; opacity: 0.9; color:#ffffff;">
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

        renderLeaveHistory: (leaves, options = {}) => {
            const title = options.title || 'Leave Request History';
            const subtitle = options.subtitle || 'Latest submissions';

            if (!leaves || leaves.length === 0) {
                return `
                    <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column; margin-bottom: 0; margin-top: 0.75rem;">
                        <div style="margin-bottom:0.5rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                            <h4 style="margin:0; color:#1f2937; font-size: 0.95rem;">${title}</h4>
                            <span style="font-size:0.7rem; color:#6b7280;">${subtitle}</span>
                        </div>
                        <p style="margin:0.5rem 0; color:#94a3b8; font-size:0.8rem;">No leave request history found.</p>
                    </div>
                `;
            }

            const statusColor = (status) => {
                if (status === 'Approved') return 'background:#ecfdf5;color:#166534;';
                if (status === 'Rejected') return 'background:#fef2f2;color:#991b1b;';
                return 'background:#fffbeb;color:#92400e;';
            };

            return `
                <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column; margin-bottom: 0; margin-top: 0.75rem;">
                    <div style="margin-bottom:0.5rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                        <h4 style="margin:0; color:#1f2937; font-size: 0.95rem;">${title}</h4>
                        <span style="font-size:0.7rem; color:#6b7280;">${subtitle}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow:auto; padding-right:4px;">
                        ${leaves.map((l) => `
                            <div style="border:1px solid #eef2f7; border-radius:10px; padding:0.55rem 0.65rem; background:#fff;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                                    <div style="font-size:0.82rem; font-weight:700; color:#0f172a;">${l.userName || 'Staff'}</div>
                                    <span style="padding:2px 8px; border-radius:999px; font-size:0.68rem; font-weight:700; ${statusColor(l.status)}">${l.status || 'Pending'}</span>
                                </div>
                                <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                                    ${l.type || 'Leave'} • ${l.startDate}${l.endDate && l.endDate !== l.startDate ? ` to ${l.endDate}` : ''}
                                </div>
                                <div style="font-size:0.7rem; color:#64748b; margin-top:0.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${l.reason || ''}">
                                    ${l.reason || 'No reason provided'}
                                </div>
                            </div>
                        `).join('')}
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
            const [status, logs, monthlyStats, yearlyStats, heroData, calendarPlans, staffActivities, pendingLeaves, allUsers, collaborations, allLeaves] = await Promise.all([
                window.AppAttendance.getStatus(),
                window.AppAttendance.getLogs(targetStaffId),
                window.AppAnalytics.getUserMonthlyStats(targetStaffId),
                window.AppAnalytics.getUserYearlyStats(targetStaffId),
                window.AppAnalytics.getHeroOfTheWeek(),
                window.AppCalendar ? window.AppCalendar.getPlans() : { leaves: [], events: [] },
                window.AppAnalytics.getAllStaffActivities(14),
                isAdmin ? window.AppLeaves.getPendingLeaves() : Promise.resolve([]),
                window.AppDB.getAll('users'),
                window.AppCalendar ? window.AppCalendar.getCollaborations(targetStaffId) : Promise.resolve([]),
                isAdmin ? window.AppDB.getAll('leaves') : Promise.resolve([])
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

            // Helper for Admin Data Indicators
            const targetStaff = (allUsers || []).find(u => u.id === targetStaffId);
            const isViewingSelf = targetStaffId === user.id;
            const displayUser = (!isViewingSelf && targetStaff) ? targetStaff : user;
            const isReadOnlyView = isAdmin && !isViewingSelf;
            window.app_dashboardTargetUser = isReadOnlyView ? displayUser : null;
            window.app_dashboardReadOnly = isReadOnlyView;

            const statusData = isReadOnlyView
                ? { status: displayUser.status || 'out', lastCheckIn: displayUser.lastCheckIn || null }
                : status;
            const isCheckedIn = statusData.status === 'in';
            const notifications = user.notifications || [];
            const tagHistory = user.tagHistory || [];

            // Rename for clarity in template
            const recentLogs = logs;
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

            const formatElapsed = (ms) => {
                const safeMs = Math.max(0, ms || 0);
                let hrs = Math.floor(safeMs / (1000 * 60 * 60));
                let mins = Math.floor((safeMs / (1000 * 60)) % 60);
                let secs = Math.floor((safeMs / 1000) % 60);
                hrs = (hrs < 10) ? "0" + hrs : hrs;
                mins = (mins < 10) ? "0" + mins : mins;
                secs = (secs < 10) ? "0" + secs : secs;
                return `${hrs} : ${mins} : ${secs}`;
            };

            if (isCheckedIn && statusData.lastCheckIn) {
                const lastTs = new Date(statusData.lastCheckIn).getTime();
                timerHTML = formatElapsed(Date.now() - lastTs);
            }

            const notifHTML = renderNotificationPanel(notifications, tagHistory);
            const taggedHTML = renderTaggedItems(notifications);

            // Stats fetched in parallel above, variables ready.

            // Staff View Indicator Banner (for admins viewing other staff)
            let staffViewBannerHTML = '';
            if (isAdmin && !isViewingSelf && targetStaff) {
                staffViewBannerHTML = `
                    <div class="card full-width" style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 1rem 1.5rem; border-left: 5px solid #ea580c; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="position: relative;">
                                    <img src="${targetStaff.avatar}" alt="${targetStaff.name}" style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3);">
                                    <div style="position: absolute; bottom: -2px; right: -2px; background: #ea580c; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; border: 2px solid white;">
                                        <i class="fa-solid fa-eye"></i>
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 0.7rem; font-weight: 600; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Currently Viewing</div>
                                    <h3 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">${targetStaff.name}'s Dashboard</h3>
                                    <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">${targetStaff.role} • ${targetStaff.dept || 'General'}</div>
                                </div>
                            </div>
                            <button onclick="window.app_changeSummaryStaff('${user.id}')" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); padding: 0.6rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; backdrop-filter: blur(10px); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                            </button>
                        </div>
                    </div>
                `;
            }

            let summaryHTML = '';
            if (isAdmin) {
                const hasExplicitSelection = !!window.app_selectedSummaryStaffId && window.app_selectedSummaryStaffId !== user.id;
                const sortedLeaves = (allLeaves || [])
                    .slice()
                    .sort((a, b) => {
                        const da = new Date(b.appliedOn || b.startDate || '1970-01-01').getTime();
                        const db = new Date(a.appliedOn || a.startDate || '1970-01-01').getTime();
                        return da - db;
                    });

                const leaveHistoryItems = hasExplicitSelection
                    ? sortedLeaves.filter((l) => (l.userId || l.user_id) === targetStaffId).slice(0, 8)
                    : sortedLeaves.slice(0, 8);

                const leaveHistoryHTML = this.renderLeaveHistory(leaveHistoryItems, {
                    title: hasExplicitSelection
                        ? `${targetStaff?.name || 'Staff'} Leave History`
                        : 'Leave Request History',
                    subtitle: hasExplicitSelection
                        ? 'Based on selected staff summary'
                        : 'Latest requests (all staff)'
                });

                summaryHTML = `
                <div class="dashboard-summary-row">
                    <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${this.renderLeaveRequests(pendingLeaves)}${leaveHistoryHTML}</div>
                    <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${renderYearlyPlan(calendarPlans)}${heroHTML}</div>
                </div>
                <div class="dashboard-stats-row">
                    ${renderStatsCard(isViewingSelf ? monthlyStats.label : `${monthlyStats.label} - ${targetStaff?.name || 'Staff'}`, isViewingSelf ? 'Monthly Stats' : 'Viewing Staff Monthly Stats', monthlyStats)}
                    ${renderStatsCard('Yearly Summary', isViewingSelf ? yearlyStats.label : `${yearlyStats.label} for ${targetStaff?.name || 'Staff'}`, yearlyStats)}
                </div>`;
            } else {
                summaryHTML = `
                <div class="dashboard-summary-row">
                    <div style="flex: 2; min-width: 320px; display: flex; flex-direction: column;">${renderActivityLog(staffActivities)}</div>
                    <div style="flex: 1.2; min-width: 240px; display: flex; flex-direction: column;">${renderStaffDirectory(allUsers, notifications, user)}</div>
                    <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 1rem;">${renderYearlyPlan(calendarPlans)}${heroHTML}</div>
                </div>
                <div class="dashboard-stats-row">
                    ${renderStatsCard(monthlyStats.label, 'Monthly Stats', monthlyStats)}
                    ${renderStatsCard('Yearly Summary', yearlyStats.label, yearlyStats)}
                </div>`;
            }
            return `
                <div class="dashboard-grid dashboard-modern dashboard-staff-view">
                    ${notifHTML}
                    ${taggedHTML}
                    ${staffViewBannerHTML}
                    <div class="card full-width dashboard-hero-card">
                        <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                        <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                        <div class="dashboard-hero-content"><div class="dashboard-hero-row"><div class="dashboard-hero-copy"><h2 class="dashboard-hero-title">Welcome back, ${user.name.split(' ')[0]}! 👋</h2><p class="dashboard-hero-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>${user.rating !== undefined ? `<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${window.AppUI.renderStarRating(user.rating, true)}</div>${user.completionStats ? `<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(user.completionStats.completionRate * 100).toFixed(0)}% Complete</span></div>` : ''}</div>` : ''}</div>${isAdmin ? `<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${targetStaffId !== user.id ? '<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>' : ''}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${user.id}">My Own Summary</option><optgroup label="Staff Members">${(allUsers || []).filter(u => u.id !== user.id).sort((a, b) => a.name.localeCompare(b.name)).map(u => `<option value="${u.id}" ${u.id === targetStaffId ? 'selected' : ''}>${u.name}</option>`).join('')}</optgroup></select></div></div></div>` : ''}<div class="welcome-icon dashboard-hero-weather"><i class="fa-solid fa-cloud-sun dashboard-hero-weather-icon"></i></div></div></div>
                        <button class="dashboard-refresh-link" onclick="window.app_forceRefresh()" title="Check for System Update">
                            Check for System Update
                        </button>
                    </div>
                    <div class="dashboard-primary-row">
                        <div class="card check-in-widget" style="flex: 1; min-width: 210px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; background: white; border: 1px solid #eef2ff;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;"><div style="position: relative;"><img src="${displayUser.avatar}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;"><div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: ${isCheckedIn ? '#10b981' : '#94a3b8'}; border: 2px solid white;"></div></div><div style="text-align: left;"><h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${displayUser.name}</h4><p class="text-muted" style="font-size: 0.75rem; margin: 0;">${displayUser.role}</p></div></div>
                            <div style="text-align:center; padding: 0.5rem 0;"><div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">${timerHTML}</div><div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div></div>
                            <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;"><div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;"><span id="countdown-label">Time to checkout</span><span id="countdown-value" style="font-weight: 600;">--:--:--</span></div><div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;"><div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div></div></div>
                            <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;"><div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div><div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div></div>
                            <button class="${btnClass}" id="attendance-btn" ${isReadOnlyView ? 'disabled' : ''} title="${isReadOnlyView ? 'View only: switch back to your dashboard to check in/out.' : ''}" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; ${isReadOnlyView ? 'opacity:0.6; cursor:not-allowed;' : ''}">${btnText} <i class="fa-solid fa-fingerprint"></i></button>
                            <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;"><i class="fa-solid fa-location-dot"></i><span>${isCheckedIn && displayUser.currentLocation ? `Lat: ${Number(displayUser.currentLocation.lat).toFixed(4)}, Lng: ${Number(displayUser.currentLocation.lng).toFixed(4)}` : 'Waiting for location...'}</span></div>
                        </div>
                        <div class="card dashboard-recent-activity-card" style="flex: 1; min-width: 210px; padding: 1rem; margin-bottom: 0; display: flex; flex-direction: column; background: white; position: relative; ${!isViewingSelf ? 'border: 2px solid #fb923c;' : ''}"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;"><h4 style="margin: 0; font-size: 0.95rem; color: #1e1b4b;"><i class="fa-solid fa-history" style="color: #6366f1; margin-right: 6px;"></i> Recent Activity${!isViewingSelf ? ` <span style="font-size: 0.75rem; color: #f97316; font-weight: 800;">(${targetStaff?.name || 'Staff'})</span>` : ''}</h4><a href="#timesheet" onclick="window.location.hash = 'timesheet'; return false;" style="font-size: 0.7rem; color: #4338ca; text-decoration: none; font-weight: 600;">View All</a></div><div class="dashboard-recent-activity-list">${recentLogs.length > 0 ? recentLogs.map(log => `<div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.35rem; border-bottom: 1px solid #f8fafc;"><div><div style="font-size: 0.76rem; font-weight: 600; color: #334155;">${log.date}</div><div style="font-size: 0.66rem; color: #64748b;">${log.checkIn} - ${log.checkOut || '<span style="color:#10b981;">Active</span>'}</div></div><div style="font-size: 0.75rem; font-weight: 700; color: #4338ca; background: #eef2ff; padding: 2px 6px; border-radius: 6px;">${log.duration || '--'}</div></div>`).join('') : '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin-top: 1rem;">No recent sessions</p>'}</div></div>
                        <div style="flex: 1.2; min-width: 210px; display: flex; flex-direction: column; ${!isViewingSelf ? 'border: 2px solid #fb923c; border-radius: 12px;' : ''}">${renderWorkLog(logs, collaborations, targetStaff, isViewingSelf)}</div>
                        ${isAdmin ? `
                            <div style="flex: 1.2; min-width: 210px; display: flex; flex-direction: column;">${renderActivityLog(staffActivities)}</div>
                            <div style="flex: 1.2; min-width: 210px; display: flex; flex-direction: column;">${renderStaffDirectory(allUsers, notifications, user)}</div>
                        ` : ''}
                    </div>
                    ${summaryHTML}
                </div>`;
        },

        async renderStaffDirectoryPage() {
            const currentUser = window.AppAuth.getUser();
            const allUsers = await window.AppDB.getAll('users');
            const messages = await window.AppDB.getAll('staff_messages');
            const others = allUsers.filter(u => u.id !== currentUser.id).sort((a, b) => a.name.localeCompare(b.name));
            if (!window.app_staffThreadId && others.length > 0) {
                window.app_staffThreadId = others[0].id;
            }
            const selected = allUsers.find(u => u.id === window.app_staffThreadId);

            const escapeHtml = (str) => String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            const linkify = (text) => escapeHtml(text).replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
            );

            const conversation = messages
                .filter(m => (m.fromId === currentUser.id && m.toId === window.app_staffThreadId)
                    || (m.fromId === window.app_staffThreadId && m.toId === currentUser.id))
                .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

            const textMessages = conversation.filter(m => m.type === 'text');
            const taskMessages = conversation.filter(m => m.type === 'task');

            const unreadByUser = {};
            messages.forEach(m => {
                if (m.toId === currentUser.id && !m.read) {
                    unreadByUser[m.fromId] = (unreadByUser[m.fromId] || 0) + 1;
                }
            });

            const isOnline = (u) => {
                const lastSeen = u.lastSeen ? Number(u.lastSeen) : 0;
                return lastSeen && (Date.now() - lastSeen < 60000);
            };

            const staffList = others.map(u => {
                const unread = unreadByUser[u.id] || 0;
                const isActive = u.id === window.app_staffThreadId;
                const statusClass = u.status === 'in' ? 'checkedin' : (isOnline(u) ? 'online' : 'offline');
                return `
                    <button class="staff-directory-item ${isActive ? 'active' : ''}" onclick="window.app_openStaffThread('${u.id}')">
                        <div class="staff-directory-avatar">
                            <img src="${u.avatar}" alt="${u.name}">
                            <span class="staff-status-dot ${statusClass}"></span>
                        </div>
                        <div class="staff-directory-info">
                            <div class="staff-directory-name">${u.name}</div>
                            <div class="staff-directory-role">${u.role || 'Staff'}</div>
                        </div>
                        ${unread ? `<span class="staff-directory-badge">${unread}</span>` : ''}
                    </button>
                `;
            }).join('');

            const textHistory = selected ? (textMessages.length ? textMessages.map(m => `
                <div class="staff-message ${m.fromId === currentUser.id ? 'outgoing' : 'incoming'}">
                    <div class="staff-message-meta">${m.fromName} • ${new Date(m.createdAt).toLocaleString()}</div>
                    <div class="staff-message-body">${linkify(m.message || '')}</div>
                    ${m.link ? `<div class="staff-message-link"><a href="${m.link}" target="_blank" rel="noopener noreferrer">${m.link}</a></div>` : ''}
                </div>
            `).join('') : '<div class="staff-message-empty">No messages yet.</div>') : '<div class="staff-message-empty">Select a staff member to view messages.</div>';

            const taskHistory = selected ? (taskMessages.length ? taskMessages.map(m => `
                <div class="staff-task-card">
                    <div class="staff-task-head">
                        <div>
                            <div class="staff-task-title">${escapeHtml(m.title || 'Task')}</div>
                            <div class="staff-task-meta">From ${m.fromName} • Due ${m.dueDate || 'No date'}</div>
                        </div>
                        <span class="staff-task-status ${m.status || 'pending'}">${(m.status || 'pending').toUpperCase()}</span>
                    </div>
                    <div class="staff-task-desc">${escapeHtml(m.description || '')}</div>
                    ${m.status === 'pending' && m.toId === currentUser.id ? `
                        <div class="staff-task-actions">
                            <button onclick="window.app_respondStaffTask('${m.id}', 'approved')" class="staff-task-btn approve">Approve</button>
                            <button onclick="window.app_respondStaffTask('${m.id}', 'rejected')" class="staff-task-btn reject">Reject</button>
                        </div>
                    ` : ''}
                    ${m.rejectReason ? `<div class="staff-task-reason">Reason: ${escapeHtml(m.rejectReason)}</div>` : ''}
                </div>
            `).join('') : '<div class="staff-message-empty">No tasks yet.</div>') : '<div class="staff-message-empty">Select a staff member to view tasks.</div>';

            return `
                <div class="staff-directory-page">
                    <aside class="staff-directory-panel">
                        <div class="staff-directory-panel-head">
                            <h3>Staff Directory</h3>
                            <span>Messages & tasks</span>
                        </div>
                        <div class="staff-directory-list">
                            ${staffList || '<div class="staff-message-empty">No staff found.</div>'}
                        </div>
                    </aside>
                    <section class="staff-thread-panel">
                        <div class="staff-thread-head">
                            <div>
                                <h3>${selected ? selected.name : 'Select a staff member'}</h3>
                                <span>${selected ? (selected.role || 'Staff') : ''}</span>
                            </div>
                            <div class="staff-thread-actions">
                                <button class="staff-thread-action-btn" ${selected ? '' : 'disabled'} onclick="window.app_openStaffMessageModal('${selected ? selected.id : ''}', '${selected ? escapeHtml(selected.name) : ''}')">
                                    <i class="fa-solid fa-message"></i> Send Message
                                </button>
                                <button class="staff-thread-action-btn secondary" ${selected ? '' : 'disabled'} onclick="window.app_openStaffTaskModal('${selected ? selected.id : ''}', '${selected ? escapeHtml(selected.name) : ''}')">
                                    <i class="fa-solid fa-list-check"></i> Send Task
                                </button>
                            </div>
                        </div>
                        <div class="staff-thread-columns">
                            <div class="staff-thread-column">
                                <div class="staff-thread-column-head">Text Messages</div>
                                <div class="staff-thread-history">
                                    ${textHistory}
                                </div>
                            </div>
                            <div class="staff-thread-column">
                                <div class="staff-thread-column-head">Tasks</div>
                                <div class="staff-thread-history">
                                    ${taskHistory}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            `;
        },

        async renderAnnualPlan() {
            if (typeof window.app_setAnnualStaffFilter !== 'function') {
                window.app_setAnnualStaffFilter = async (value) => {
                    window.app_annualStaffFilter = String(value || '').trim();
                    const contentArea = document.getElementById('page-content');
                    if (!contentArea) return;
                    contentArea.innerHTML = await window.AppUI.renderAnnualPlan();
                };
            }
            if (typeof window.app_toggleAnnualView !== 'function') {
                window.app_toggleAnnualView = async (mode) => {
                    window.app_annualViewMode = mode;
                    const contentArea = document.getElementById('page-content');
                    if (!contentArea) return;
                    contentArea.innerHTML = await window.AppUI.renderAnnualPlan();
                };
            }
            if (typeof window.app_setAnnualListSearch !== 'function') {
                window.app_setAnnualListSearch = async (value) => {
                    window.app_annualListSearch = String(value || '').trim();
                    const contentArea = document.getElementById('page-content');
                    if (!contentArea) return;
                    contentArea.innerHTML = await window.AppUI.renderAnnualPlan();
                };
            }
            if (typeof window.app_setAnnualListSort !== 'function') {
                window.app_setAnnualListSort = async (value) => {
                    window.app_annualListSort = String(value || 'date-asc').trim();
                    const contentArea = document.getElementById('page-content');
                    if (!contentArea) return;
                    contentArea.innerHTML = await window.AppUI.renderAnnualPlan();
                };
            }

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const year = window.app_annualYear || today.getFullYear();
            const plans = await window.AppCalendar.getPlans();
            const users = await window.AppDB.getAll('users').catch(() => []);
            const attendanceLogs = await window.AppDB.getAll('attendance').catch(() => []);
            window._currentPlans = plans;
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const userMap = {};
            (users || []).forEach(u => { userMap[u.id] = u.name; });
            window._annualUserMap = userMap;
            const resolveName = (id, fallback) => userMap[id] || fallback || 'Staff';
            const escapeHtml = (str) => String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            const filters = window.app_annualLegendFilters || {
                leave: true,
                event: true,
                work: true,
                overdue: true,
                completed: true
            };
            window.app_annualLegendFilters = filters;

            let selectedDate = window.app_selectedAnnualDate || (year === today.getFullYear() ? todayStr : null);
            if (selectedDate && !selectedDate.startsWith(`${year}-`)) selectedDate = null;
            window.app_selectedAnnualDate = selectedDate;
            const annualStaffFilter = String(window.app_annualStaffFilter || '').trim();
            const staffNeedle = annualStaffFilter.toLowerCase();
            const annualListSearch = String(window.app_annualListSearch || '').trim();
            const annualListNeedle = annualListSearch.toLowerCase();
            const annualListSort = String(window.app_annualListSort || 'date-asc');
            const staffOptions = (users || []).map(u => `<option value="${escapeHtml(u.name)}"></option>`).join('');
            const matchesStaff = (name) => {
                if (!staffNeedle) return true;
                return String(name || '').toLowerCase().includes(staffNeedle);
            };
            const getTaskRangeBounds = (task, planDate) => {
                const startDate = task?.startDate || planDate;
                const endDate = task?.endDate || task?.startDate || planDate;
                return { startDate, endDate };
            };
            const taskAppliesOnDate = (task, planDate, dateStr) => {
                const { startDate, endDate } = getTaskRangeBounds(task, planDate);
                if (!startDate || !endDate) return planDate === dateStr;
                if (dateStr < startDate || dateStr > endDate) return false;
                if (task?.completedDate && task.completedDate < dateStr) return false;
                return true;
            };
            const filteredWorkPlans = (plans.workPlans || []).filter(p => {
                const isAnnualPlan = (p.planScope || 'personal') === 'annual';
                if (isAnnualPlan) return true;
                if (!staffNeedle) return true;
                const ownerName = resolveName(p.userId, p.userName);
                if (matchesStaff(ownerName)) return true;
                return (p.plans || []).some(task => {
                    const assigneeName = resolveName(task.assignedTo || p.userId, ownerName);
                    const tagNames = (task.tags || []).map(t => t.name || t).join(' ');
                    return matchesStaff(assigneeName) || matchesStaff(tagNames);
                });
            });
            const filteredLeaves = (plans.leaves || []).filter(l => matchesStaff(resolveName(l.userId, l.userName)));
            const filteredAttendanceLogs = (attendanceLogs || []).filter(l => {
                const dt = String(l.date || '');
                if (!dt.startsWith(String(year))) return false;
                const logUserId = l.user_id || l.userId;
                const logUserName = resolveName(logUserId, '');
                if (!staffNeedle) return true;
                return matchesStaff(logUserName);
            });

            const getDayMarkers = (d, m, y) => {
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const hasLeave = filteredLeaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);
                const hasEvent = !staffNeedle && (plans.events || []).some(e => e.date === dateStr);
                const hasLogWork = filteredAttendanceLogs.some(l => l.date === dateStr);
                const hasWork = filteredWorkPlans.some(p => {
                    if (!Array.isArray(p.plans) || !p.plans.length) return p.date === dateStr;
                    return p.plans.some(task => taskAppliesOnDate(task, p.date, dateStr));
                }) || hasLogWork;
                let workStatus = '';
                let hasRangeEnd = false;
                if (hasWork) {
                    const daily = filteredWorkPlans.filter(p => {
                        if (!Array.isArray(p.plans) || !p.plans.length) return p.date === dateStr;
                        return p.plans.some(task => taskAppliesOnDate(task, p.date, dateStr));
                    });
                    let worst = 'to-be-started';
                    daily.forEach(p => {
                        (p.plans || []).forEach(task => {
                            if (!taskAppliesOnDate(task, p.date, dateStr)) return;
                            const { endDate } = getTaskRangeBounds(task, p.date);
                            if (endDate === dateStr) hasRangeEnd = true;
                            const statusDate = task.completedDate || endDate || p.date || dateStr;
                            const s = window.AppCalendar.getSmartTaskStatus(statusDate, task.status);
                            if (s === 'overdue') worst = 'overdue';
                            else if (s === 'in-process' && worst !== 'overdue') worst = 'in-process';
                            else if (s === 'completed' && worst !== 'overdue' && worst !== 'in-process') worst = 'completed';
                        });
                    });
                    if (hasLogWork && worst === 'to-be-started') worst = 'completed';
                    workStatus = worst;
                }
                return { hasLeave, hasEvent, hasWork, workStatus, hasRangeEnd };
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
                    const showLeave = markers.hasLeave && filters.leave;
                    const showEvent = markers.hasEvent && filters.event;
                    const showWorkByStatus = markers.hasWork && filters.work && (
                        markers.workStatus === 'overdue' ? filters.overdue :
                            markers.workStatus === 'completed' ? filters.completed : true
                    );
                    const hasAnyVisible = showLeave || showEvent || showWorkByStatus;
                    const bgClass = showWorkByStatus ? `has-work work-${markers.workStatus}` : '';
                    const selectedClass = selectedDate === dateStr ? 'selected' : '';
                    const mutedClass = hasAnyVisible ? '' : 'annual-day-muted';

                    daysHTML += `
                        <div class="annual-day ${isToday ? 'today' : ''} ${bgClass} ${selectedClass} ${mutedClass}" onclick="window.app_openAnnualDayPlan('${dateStr}')" onmouseenter="window.app_showAnnualHoverPreview(event, '${dateStr}')" onmouseleave="window.app_hideAnnualHoverPreview()">
                            ${d}
                            <div class="dot-container">
                                ${showLeave ? '<span class="status-dot dot-leave"></span>' : ''}
                                ${showEvent ? '<span class="status-dot dot-event"></span>' : ''}
                                ${showWorkByStatus ? '<span class="status-dot dot-work"></span>' : ''}
                                ${markers.hasRangeEnd ? '<span class="status-dot" title="Task ends today" style="background:#f97316;"></span>' : ''}
                            </div>
                        </div>`;
                }
                monthsHTML += `
                    <div class="annual-month-card">
                        <div class="annual-month-head">
                            <span class="annual-month-title">${monthNames[m]}</span>
                            <span class="annual-month-year">${year}</span>
                        </div>
                        <div class="annual-cal-mini">
                            <div class="annual-weekday">S</div>
                            <div class="annual-weekday">M</div>
                            <div class="annual-weekday">T</div>
                            <div class="annual-weekday">W</div>
                            <div class="annual-weekday">T</div>
                            <div class="annual-weekday">F</div>
                            <div class="annual-weekday">S</div>
                            ${daysHTML}
                        </div>
                    </div>`;
            }

            const viewMode = window.app_annualViewMode || 'grid';
            const detailEvents = selectedDate ? window.app_getDayEvents(selectedDate, plans, { includeAuto: false }) : [];
            const detailManualEvents = selectedDate
                ? filteredAttendanceLogs
                    .filter(l => l.date === selectedDate)
                    .map(l => {
                        const uid = l.user_id || l.userId;
                        const uname = resolveName(uid, 'Staff');
                        const summary = (l.workDescription || l.location || '').trim() || 'Manual log entry';
                        return { type: 'work', title: `${uname}: ${summary}` };
                    })
                : [];
            const filteredDetailEvents = [...detailEvents, ...detailManualEvents].filter(ev => {
                if (!staffNeedle) return true;
                if (ev.type === 'work') {
                    if ((ev.planScope || 'personal') === 'annual') return true;
                    const title = ev.title || '';
                    if (matchesStaff(title)) return true;
                    return (ev.plans || []).some(task => {
                        const assigneeName = resolveName(task.assignedTo || ev.userId, ev.userName);
                        const tagNames = (task.tags || []).map(t => t.name || t).join(' ');
                        return matchesStaff(assigneeName) || matchesStaff(tagNames) || matchesStaff(task.task || '');
                    });
                }
                if (ev.type === 'leave') {
                    return matchesStaff(ev.title || '');
                }
                return false;
            });
            const detailCards = filteredDetailEvents.length ? filteredDetailEvents.map(ev => {
                const type = ev.type || 'event';
                const tagStyle = type === 'leave' ? 'background:#fee2e2;color:#991b1b;' : type === 'work' ? 'background:#e0e7ff;color:#3730a3;' : 'background:#dcfce7;color:#166534;';
                return `<div class="annual-detail-item"><span class="annual-detail-tag" style="${tagStyle}">${type.toUpperCase()}</span><div class="annual-detail-title">${ev.title}</div></div>`;
            }).join('') : '<div class="annual-detail-empty">No visible items for this date with current filters.</div>';

            const listItems = (() => {
                const items = [];
                const pushItem = (item) => items.push(item);
                const toStatusLabel = (status) => {
                    if (!status) return '';
                    const clean = String(status).replace(/_/g, '-').toLowerCase();
                    const map = {
                        'in-process': 'In Process',
                        'to-be-started': 'To Be Started',
                        'not-completed': 'Not Completed',
                        'completed': 'Completed',
                        'overdue': 'Overdue',
                        'pending': 'Pending',
                        'approved': 'Approved',
                        'holiday': 'Holiday',
                        'event': 'Event'
                    };
                    return map[clean] || clean.replace(/\b\w/g, c => c.toUpperCase());
                };
                const normalizeStatus = (date, status) => {
                    if (status) return status;
                    if (window.AppCalendar && date) {
                        return window.AppCalendar.getSmartTaskStatus(date, status);
                    }
                    return 'pending';
                };

                if (!staffNeedle && window.AppAnalytics) {
                    const start = new Date(year, 0, 1);
                    const end = new Date(year, 11, 31);
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const dt = d.toISOString().split('T')[0];
                        const dayType = window.AppAnalytics.getDayType(d);
                        if (dayType === 'Holiday') {
                            pushItem({
                                date: dt,
                                type: 'holiday',
                                title: 'Company Holiday (Weekend)',
                                staffName: 'All Staff',
                                assignedBy: 'System',
                                assignedTo: 'All Staff',
                                selfAssigned: false,
                                dueDate: dt,
                                status: 'holiday',
                                comments: '',
                                scope: 'Shared'
                            });
                        } else if (dayType === 'Half Day') {
                            pushItem({
                                date: dt,
                                type: 'event',
                                title: 'Half Working Day (Sat)',
                                staffName: 'All Staff',
                                assignedBy: 'System',
                                assignedTo: 'All Staff',
                                selfAssigned: false,
                                dueDate: dt,
                                status: 'event',
                                comments: '',
                                scope: 'Shared'
                            });
                        }
                    }
                }

                filteredLeaves.forEach(l => {
                    const startDate = new Date(l.startDate);
                    const endDate = new Date(l.endDate || l.startDate);
                    const staffName = resolveName(l.userId, l.userName);
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dt = d.toISOString().split('T')[0];
                        if (!dt.startsWith(String(year))) continue;
                        pushItem({
                            date: dt,
                            type: 'leave',
                            title: `${staffName} (${l.type || 'Leave'})`,
                            staffName,
                            assignedBy: staffName,
                            assignedTo: staffName,
                            selfAssigned: true,
                            dueDate: l.endDate || l.startDate || dt,
                            status: (l.status || 'approved').toLowerCase(),
                            comments: l.reason || '',
                            scope: 'Personal'
                        });
                    }
                });

                (plans.events || []).forEach(e => {
                    if (!staffNeedle && String(e.date || '').startsWith(String(year))) {
                        pushItem({
                            date: e.date,
                            type: e.type || 'event',
                            title: e.title || 'Company Event',
                            staffName: 'All Staff',
                            assignedBy: e.createdByName || 'Admin',
                            assignedTo: 'All Staff',
                            selfAssigned: false,
                            dueDate: e.date,
                            status: 'event',
                            comments: e.description || '',
                            scope: 'Shared'
                        });
                    }
                });

                filteredWorkPlans.forEach(p => {
                    if (String(p.date || '').startsWith(String(year))) {
                        const isAnnualPlan = (p.planScope || 'personal') === 'annual';
                        const planOwner = isAnnualPlan ? 'All Staff' : resolveName(p.userId, p.userName);
                        const scopeLabel = isAnnualPlan ? 'Annual' : 'Personal';
                        const planDate = p.date;
                        if (p.plans && p.plans.length > 0) {
                            p.plans.forEach(task => {
                                const assignedBy = isAnnualPlan
                                    ? (p.createdByName || task.taggedByName || 'Admin')
                                    : (task.taggedByName || planOwner);
                                const assignedToId = task.assignedTo || p.userId;
                                const assignedTo = isAnnualPlan ? 'All Staff' : resolveName(assignedToId, planOwner);
                                const tags = (task.tags || []).map(t => t.name || t).filter(Boolean);
                                const { startDate, endDate } = getTaskRangeBounds(task, planDate);
                                const statusDate = task.completedDate || endDate || planDate;
                                const status = normalizeStatus(statusDate, task.status);
                                const endedEarly = !!(task.completedDate && endDate && task.completedDate < endDate);
                                const rangeNote = (startDate && endDate && startDate !== endDate)
                                    ? `Range: ${startDate} to ${endDate}${endedEarly ? ` | Completed Early: ${task.completedDate}` : ''}`
                                    : '';
                                const comments = (task.subPlans && task.subPlans.length)
                                    ? task.subPlans.join('; ')
                                    : (task.comment || task.notes || '');
                                pushItem({
                                    date: startDate || planDate,
                                    type: 'work',
                                    title: task.task || 'Work Plan Task',
                                    staffName: assignedTo,
                                    assignedBy,
                                    assignedTo,
                                    selfAssigned: assignedBy === assignedTo,
                                    dueDate: task.dueDate || endDate || planDate,
                                    status,
                                    comments: [rangeNote, comments].filter(Boolean).join(' | '),
                                    tags,
                                    scope: scopeLabel
                                });
                            });
                        } else {
                            const status = normalizeStatus(planDate, null);
                            pushItem({
                                date: planDate,
                                type: 'work',
                                title: p.plan || 'Work Plan',
                                staffName: planOwner,
                                assignedBy: planOwner,
                                assignedTo: planOwner,
                                selfAssigned: true,
                                dueDate: planDate,
                                status,
                                comments: '',
                                tags: [],
                                scope: scopeLabel
                            });
                        }
                    }
                });

                filteredAttendanceLogs.forEach(l => {
                    const logUserId = l.user_id || l.userId;
                    const staffName = resolveName(logUserId, 'Staff');
                    const summary = (l.workDescription || l.location || '').trim() || 'Manual log entry';
                    pushItem({
                        date: l.date,
                        type: 'work',
                        title: summary,
                        staffName,
                        assignedBy: staffName,
                        assignedTo: staffName,
                        selfAssigned: true,
                        dueDate: l.date,
                        status: 'completed',
                        comments: summary,
                        tags: ['Manual Log'],
                        scope: 'Personal'
                    });
                });

                items.sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    return a.type.localeCompare(b.type);
                });
                items.forEach(item => {
                    item.statusLabel = toStatusLabel(item.status);
                    item.statusClass = String(item.status || 'pending').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
                });
                let filteredItems = items;
                if (annualListNeedle) {
                    filteredItems = items.filter(item => {
                        const haystack = [
                            item.date,
                            item.staffName,
                            item.title,
                            item.assignedBy,
                            item.assignedTo,
                            item.statusLabel,
                            item.comments,
                            item.scope,
                            Array.isArray(item.tags) ? item.tags.join(' ') : ''
                        ].join(' ').toLowerCase();
                        return haystack.includes(annualListNeedle);
                    });
                }

                const comparators = {
                    'date-asc': (a, b) => String(a.date || '').localeCompare(String(b.date || '')),
                    'date-desc': (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
                    'staff-asc': (a, b) => String(a.staffName || '').localeCompare(String(b.staffName || '')),
                    'staff-desc': (a, b) => String(b.staffName || '').localeCompare(String(a.staffName || '')),
                    'status-asc': (a, b) => String(a.statusLabel || '').localeCompare(String(b.statusLabel || '')),
                    'status-desc': (a, b) => String(b.statusLabel || '').localeCompare(String(a.statusLabel || ''))
                };
                const sorter = comparators[annualListSort] || comparators['date-asc'];
                return filteredItems.slice().sort(sorter);
            })();
            window._annualListItems = listItems;

            return `
                <div class="annual-plan-shell">
                    <div class="card annual-plan-header">
                        <div class="annual-plan-title-wrap">
                            <h2 class="annual-plan-title">NGO Annual Planning</h2>
                            <p class="annual-plan-subtitle">Overview of all staff activities, leaves, and shared events for ${year}.</p>
                        </div>
                        <div class="annual-plan-controls">
                            <div class="annual-staff-filter">
                                <i class="fa-solid fa-user"></i>
                                <input type="text" list="annual-staff-names" value="${escapeHtml(annualStaffFilter)}" placeholder="Filter by staff name" oninput="window.app_setAnnualStaffFilter(this.value)">
                                <datalist id="annual-staff-names">${staffOptions}</datalist>
                            </div>
                            <div class="annual-view-toggle">
                                <button onclick="window.app_toggleAnnualView('grid')" class="annual-toggle-btn ${viewMode === 'grid' ? 'active' : ''}">
                                    <i class="fa-solid fa-calendar-days"></i> Grid
                                </button>
                                <button onclick="window.app_toggleAnnualView('list')" class="annual-toggle-btn ${viewMode === 'list' ? 'active' : ''}">
                                    <i class="fa-solid fa-list"></i> List
                                </button>
                            </div>

                            <button onclick="window.app_jumpToAnnualToday()" class="annual-today-btn" title="Jump to current year and today">
                                <i class="fa-solid fa-bullseye"></i> Today
                            </button>

                            <div class="annual-year-switch">
                                <button onclick="window.app_changeAnnualYear(-1)" aria-label="Previous year"><i class="fa-solid fa-chevron-left"></i></button>
                                <div class="annual-year-label">${year}</div>
                                <button onclick="window.app_changeAnnualYear(1)" aria-label="Next year"><i class="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                    </div>

                    <div id="annual-grid-view" style="display:${viewMode === 'grid' ? 'block' : 'none'};">
                        <div class="card annual-legend-bar">
                            <button class="annual-legend-chip ${filters.leave ? 'active' : ''}" onclick="window.app_toggleAnnualLegendFilter('leave')"><span class="annual-dot leave"></span> Staff Leave</button>
                            <button class="annual-legend-chip ${filters.event ? 'active' : ''}" onclick="window.app_toggleAnnualLegendFilter('event')"><span class="annual-dot event"></span> Company Event</button>
                            <button class="annual-legend-chip ${filters.work ? 'active' : ''}" onclick="window.app_toggleAnnualLegendFilter('work')"><span class="annual-dot work"></span> Work Plan</button>
                            <button class="annual-legend-chip ${filters.overdue ? 'active' : ''}" onclick="window.app_toggleAnnualLegendFilter('overdue')">Overdue Border</button>
                            <button class="annual-legend-chip ${filters.completed ? 'active' : ''}" onclick="window.app_toggleAnnualLegendFilter('completed')">Completed Border</button>
                        </div>
                        <div class="annual-grid-layout">
                            <div class="annual-plan-grid">
                                ${monthsHTML}
                            </div>
                            <aside class="card annual-day-detail">
                                <div class="annual-day-detail-head">
                                    <h4>Day Details</h4>
                                    <span>${selectedDate || 'No date selected'}</span>
                                </div>
                                <div class="annual-detail-list">${detailCards}</div>
                                ${selectedDate ? `<button class="action-btn" style="width:100%; margin-top:0.75rem;" onclick="window.app_openDayPlan('${selectedDate}')"><i class="fa-solid fa-pen-to-square"></i> Open Day Plan</button>` : ''}
                            </aside>
                        </div>
                    </div>

                    <div id="annual-list-view" style="display:${viewMode === 'list' ? 'block' : 'none'};">
                        <div class="card annual-list-card">
                            <div class="annual-list-head">
                                <h4>Annual Timeline</h4>
                                <div class="annual-list-actions">
                                    <div class="annual-list-search-wrap">
                                        <i class="fa-solid fa-magnifying-glass"></i>
                                        <input type="text" value="${escapeHtml(annualListSearch)}" placeholder="Search date, staff, status, comments, tags, assigned task" oninput="window.app_setAnnualListSearch(this.value)">
                                    </div>
                                    <select class="annual-list-sort-select" onchange="window.app_setAnnualListSort(this.value)">
                                        <option value="date-asc" ${annualListSort === 'date-asc' ? 'selected' : ''}>Date: Oldest First</option>
                                        <option value="date-desc" ${annualListSort === 'date-desc' ? 'selected' : ''}>Date: Newest First</option>
                                        <option value="staff-asc" ${annualListSort === 'staff-asc' ? 'selected' : ''}>Staff: A-Z</option>
                                        <option value="staff-desc" ${annualListSort === 'staff-desc' ? 'selected' : ''}>Staff: Z-A</option>
                                        <option value="status-asc" ${annualListSort === 'status-asc' ? 'selected' : ''}>Status: A-Z</option>
                                        <option value="status-desc" ${annualListSort === 'status-desc' ? 'selected' : ''}>Status: Z-A</option>
                                    </select>
                                    <span>${year}</span>
                                    <button class="annual-export-btn" onclick="window.AppReports.exportAnnualListViewCSV(window._annualListItems || [])" data-export="annual-list">
                                        <i class="fa-solid fa-file-export"></i> Export Excel
                                    </button>
                                </div>
                            </div>
                            ${listItems.length === 0 ? `
                                <div class="annual-list-empty">No items found for this year.</div>
                            ` : `
                                <div class="annual-list-table-wrap">
                                    <div class="annual-list-table">
                                        <div class="annual-list-header">
                                            <div>Date</div>
                                            <div>Staff Name</div>
                                            <div>Assigned Task</div>
                                            <div>Assigned By</div>
                                            <div>Assigned To</div>
                                            <div>Self Assigned</div>
                                            <div>Due Date</div>
                                            <div>Status</div>
                                            <div>Comments</div>
                                            <div>Tags</div>
                                            <div>Scope</div>
                                        </div>
                                        ${listItems.map(item => {
                                            const comments = escapeHtml(item.comments || '') || '--';
                                            const tags = item.tags && item.tags.length ? escapeHtml(item.tags.join(', ')) : '--';
                                            return `
                                                <div class="annual-list-row">
                                                    <div class="annual-list-cell">${escapeHtml(item.date || '--')}</div>
                                                    <div class="annual-list-cell">${escapeHtml(item.staffName || '--')}</div>
                                                    <div class="annual-list-cell annual-list-task">${escapeHtml(item.title || '--')}</div>
                                                    <div class="annual-list-cell">${escapeHtml(item.assignedBy || '--')}</div>
                                                    <div class="annual-list-cell">${escapeHtml(item.assignedTo || item.staffName || '--')}</div>
                                                    <div class="annual-list-cell">${item.selfAssigned ? 'Yes' : 'No'}</div>
                                                    <div class="annual-list-cell">${escapeHtml(item.dueDate || item.date || '--')}</div>
                                                    <div class="annual-list-cell"><span class="annual-list-status status-${item.statusClass}">${item.statusLabel || 'Pending'}</span></div>
                                                    <div class="annual-list-cell annual-list-comments">${comments}</div>
                                                    <div class="annual-list-cell annual-list-tags">${tags}</div>
                                                    <div class="annual-list-cell">${escapeHtml(item.scope || '--')}</div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `}
                        </div>
                    </div>
                </div>`;
        },


        async renderTimesheet() {
            if (typeof window.app_setTimesheetView !== 'function') {
                window.app_setTimesheetView = async (mode) => {
                    window.app_timesheetViewMode = mode === 'calendar' ? 'calendar' : 'list';
                    const contentArea = document.getElementById('page-content');
                    if (!contentArea) return;
                    contentArea.innerHTML = await window.AppUI.renderTimesheet();
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
                    if (!contentArea) return;
                    contentArea.innerHTML = await window.AppUI.renderTimesheet();
                };
            }
            if (typeof window.app_jumpTimesheetToday !== 'function') {
                window.app_jumpTimesheetToday = async () => {
                    const now = new Date();
                    window.app_timesheetMonth = now.getMonth();
                    window.app_timesheetYear = now.getFullYear();
                    const contentArea = document.getElementById('page-content');
                    if (!contentArea) return;
                    contentArea.innerHTML = await window.AppUI.renderTimesheet();
                };
            }

            const user = window.AppAuth.getUser();
            const logs = await window.AppAttendance.getLogs();
            const plansData = await window.AppCalendar.getPlans().catch(() => ({ workPlans: [] }));
            const today = new Date();
            const viewMode = window.app_timesheetViewMode || 'list';
            const viewMonth = Number.isInteger(window.app_timesheetMonth) ? window.app_timesheetMonth : today.getMonth();
            const viewYear = Number.isInteger(window.app_timesheetYear) ? window.app_timesheetYear : today.getFullYear();
            window.app_timesheetMonth = viewMonth;
            window.app_timesheetYear = viewYear;
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
            const esc = (s) => String(s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            // Calculate Monthly Summary Stats (from logs shown)
            let totalMins = 0;
            let lateCount = 0;
            const uniqueDays = new Set();

            monthLogs.forEach(log => {
                if (log.durationMs) totalMins += (log.durationMs / (1000 * 60));
                if (log.lateCountable || window.AppAttendance.normalizeType(log.type) === 'Late') lateCount++;
                if (log.date) uniqueDays.add(log.date);
            });

            const totalHoursFormatted = `${Math.floor(totalMins / 60)}h ${Math.round(totalMins % 60)}m`;
            const lateDeductionDays = Math.floor(lateCount / (window.AppConfig.LATE_GRACE_COUNT || 3)) * (window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5);
            const displayLogType = (rawType) => {
                return window.AppAttendance.normalizeType(rawType);
            };

            // Helper for updating descriptions
            window.app_editWorkSummary = async (logId) => {
                const logs = await window.AppAttendance.getLogs();
                const log = logs.find(l => l.id === logId);
                const currentDesc = log ? log.workDescription : "";

                const newDesc = await window.appPrompt("Update Work Summary:", currentDesc || "", { title: 'Update Work Summary', confirmText: 'Save' });
                if (newDesc !== null) {
                    await window.AppAttendance.updateLog(logId, { workDescription: newDesc });
                    window.location.reload(); // Refresh to show update
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
            window.app_toggleTimesheetViewSelect = (mode) => {
                window.app_switchTimesheetPanel(mode, null);
            };
            window.app_openTimesheetDayDetail = (dateStr) => {
                const dayLogs = (window._timesheetLogsByDate && window._timesheetLogsByDate[dateStr]) || [];
                const dayPlans = (window._timesheetPlansByDate && window._timesheetPlansByDate[dateStr]) || [];
                const logsHtml = dayLogs.length
                    ? dayLogs.map(l => `
                        <div class="timesheet-day-detail-item">
                            <div class="timesheet-day-detail-head">
                                <span>${esc(l.checkIn || '--')} - ${esc(l.checkOut || '--')}</span>
                                <span class="timesheet-day-status-chip">${esc(displayLogType(l.type))}</span>
                            </div>
                            <div class="timesheet-day-detail-text">${esc(l.workDescription || l.location || 'No summary')}</div>
                            ${l.id && l.id !== 'active_now' ? `<button type="button" class="action-btn secondary" onclick="window.app_editWorkSummary('${l.id}')">Edit</button>` : ''}
                        </div>
                    `).join('')
                    : `<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>`;
                const plansHtml = dayPlans.length
                    ? dayPlans.map(p => `<div class="timesheet-day-plan-item">${esc(p)}</div>`).join('')
                    : `<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>`;
                const modalId = `timesheet-day-detail-${Date.now()}`;
                const html = `
                    <div class="modal-overlay" id="${modalId}" style="display:flex;">
                        <div class="modal-content" style="max-width:560px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                                <h3 style="margin:0;">${esc(dateStr)} Details</h3>
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
                        ? (dayType === 'Absent'
                            ? 'absent'
                            : dayType === 'Half Day'
                                ? 'late'
                                : dayType === 'Late'
                                    ? 'late'
                                    : 'present')
                        : 'none';
                    const attendanceText = dayLog
                        ? dayType
                        : 'No log';
                    const logSummaries = dayLogs
                        .map(l => (l.workDescription || l.location || '').trim())
                        .filter(Boolean);
                    const plansHTML = logSummaries.length
                        ? logSummaries.slice(0, 2).map(text => `<div class="timesheet-cal-plan">${esc(text)}</div>`).join('') + (logSummaries.length > 2 ? `<div class="timesheet-cal-more">+${logSummaries.length - 2} more logs</div>` : '')
                        : dayPlans.length
                            ? dayPlans.slice(0, 2).map(task => `<div class="timesheet-cal-plan">${esc(task)}</div>`).join('') + (dayPlans.length > 2 ? `<div class="timesheet-cal-more">+${dayPlans.length - 2} more</div>` : '')
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
                                ${logs.length ? logs.map(log => `
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
                                                    <div class="timesheet-summary-text">${log.workDescription || '<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                                    ${log.location ? `<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${log.location}</div>` : ''}
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
                                `).join('')
                    : `<tr><td colspan="5" class="timesheet-empty-row">No attendance records found for this period.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                    <div id="timesheet-calendar-panel" style="display:${viewMode === 'calendar' ? 'block' : 'none'};">
                        ${renderCalendar()}
                    </div>
                </div>
            `;
        },
        async renderProfile() {
            try {
                const user = window.AppAuth.getUser();
                if (!user) return '<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';

                const [monthlyStats, yearlyStats, leaves] = await Promise.all([
                    window.AppAnalytics.getUserMonthlyStats(user.id),
                    window.AppAnalytics.getUserYearlyStats(user.id),
                    window.AppLeaves.getUserLeaves(user.id)
                ]);

                window.app_triggerUpload = () => document.getElementById('profile-upload').click();
                window.app_handlePhotoUpload = async (input) => {
                    if (input.files && input.files[0]) {
                        const file = input.files[0];
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            const base64 = e.target.result;
                            const success = await window.AppAuth.updateUser({ id: user.id, avatar: base64 });
                            if (success) {
                                alert('Profile photo updated!');
                                window.location.reload();
                            } else {
                                alert('Failed to save photo.');
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                };

                return `
                <div class="dashboard-grid dashboard-modern dashboard-admin-view profile-modern">
                    <div class="card full-width profile-modern-shell">
                        <div class="profile-header-compact profile-modern-header">
                            <div class="profile-avatar-container">
                                <img src="${user.avatar}" alt="Profile">
                                <button onclick="window.app_triggerUpload()" class="profile-avatar-upload-btn" title="Change Photo">
                                    <i class="fa-solid fa-camera"></i>
                                </button>
                                <input type="file" id="profile-upload" accept="image/*" style="display:none;" onchange="window.app_handlePhotoUpload(this)">
                            </div>
                            <div class="profile-meta">
                                <div class="profile-top-row">
                                    <div>
                                        <h2 class="profile-name">${user.name}</h2>
                                        <p class="profile-roleline">${user.role} <span>|</span> ${user.dept || 'General'}</p>
                                    </div>
                                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end;">
                                        <button onclick="window.AppAuth.logout()" class="action-btn secondary profile-signout-btn">
                                            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
                                        </button>
                                    </div>
                                </div>
                                <div class="profile-presence-wrap">
                                    <span class="badge ${user.status === 'in' ? 'in' : 'out'} profile-presence-badge">${user.status === 'in' ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="profile-info-grid">
                            <div class="profile-stats-col">
                                <h3 class="profile-section-title">Performance Stats</h3>
                                <div class="stat-grid profile-stat-grid">
                                    <div class="stat-card">
                                        <div class="label">Monthly Attendance</div>
                                        <div class="value">${monthlyStats.present} <span class="profile-stat-sub">Days</span></div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="label">Total Leaves (FY)</div>
                                        <div class="value">${yearlyStats.leaves} <span class="profile-stat-sub">Days</span></div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="label">Late Arrivals</div>
                                        <div class="value">${monthlyStats.late}</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="label">Policy Rating</div>
                                        <div class="value">${(user.rating || 5.0).toFixed(1)} <i class="fa-solid fa-star profile-star"></i></div>
                                    </div>
                                </div>
                            </div>

                            <div class="profile-employment-col">
                                <h3 class="profile-section-title">Employment Details</h3>
                                <div class="profile-detail-list">
                                    <div class="profile-detail-row">
                                        <div class="profile-detail-icon"><i class="fa-solid fa-envelope"></i></div>
                                        <div>
                                            <div class="profile-detail-label">Email Address</div>
                                            <div class="profile-detail-value">${user.username || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div class="profile-detail-row">
                                        <div class="profile-detail-icon"><i class="fa-solid fa-id-card"></i></div>
                                        <div>
                                            <div class="profile-detail-label">Staff ID</div>
                                            <div class="profile-detail-value">${user.id.toUpperCase()}</div>
                                        </div>
                                    </div>
                                    <div class="profile-detail-row">
                                        <div class="profile-detail-icon"><i class="fa-solid fa-calendar-check"></i></div>
                                        <div>
                                            <div class="profile-detail-label">Joining Date</div>
                                            <div class="profile-detail-value">${user.joinDate || 'Jan 01, 2024'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card full-width profile-leave-card">
                        <div class="profile-leave-head">
                            <h3>Leave History</h3>
                            <button onclick="document.getElementById('leave-modal').style.display='flex'" class="action-btn secondary profile-leave-request-btn">Request New</button>
                        </div>
                        <div class="table-container profile-leave-table">
                            <table class="compact-table">
                                <thead class="profile-leave-thead">
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
                                            <td class="profile-leave-range">${l.startDate} ${l.endDate !== l.startDate ? `to ${l.endDate}` : ''}</td>
                                            <td><span class="profile-leave-type">${l.type}</span></td>
                                            <td>
                                                <span class="badge" style="
                                                    background:${l.status === 'approved' ? '#f0fdf4' : (l.status === 'rejected' ? '#fff1f2' : '#fefce8')};
                                                    color:${l.status === 'approved' ? '#166534' : (l.status === 'rejected' ? '#991b1b' : '#854d0e')};
                                                    border:1px solid ${l.status === 'approved' ? '#dcfce7' : (l.status === 'rejected' ? '#fecaca' : '#fef08a')};
                                                ">${l.status.toUpperCase()}</span>
                                            </td>
                                            <td class="profile-leave-reason" title="${l.reason}">${l.reason}</td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="4" class="profile-leave-empty">No leave requests yet.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>`;
            } catch (e) {
                console.error('Profile Render Error', e);
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
                if (log?.isManualOverride) return 4; // Manual Override
                if (isLeaveLog(log)) return 3; // Leave
                if (isActualCheckoutLog(log)) return 2; // Actual Check-out
                return 1; // Manual Log / other fallback
            };
            const todayIso = new Date().toISOString().split('T')[0];
            const toLocalIso = (value) => {
                const d = new Date(value);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
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
                    const dayPolicy = getWeekendPolicy(dateStr);

                    let cellContent = '-';
                    let cellStyle = '';
                    let tooltip = 'No log';

                    if (dayLogs.length > 0) {
                        const log = dayLogs
                            .slice()
                            .sort((a, b) => getLogPriority(b) - getLogPriority(a))[0];
                        const type = window.AppAttendance.normalizeType(log.type);
                        cellContent = type.charAt(0).toUpperCase();
                        tooltip = `${log.checkIn} - ${log.checkOut || 'Active'}\n${type}`;

                        if (type === 'Present') { cellStyle = 'color: #10b981; font-weight: bold; font-size: 0.9rem;'; }
                        else if (type === 'Present (Late Waived)') { cellStyle = 'color: #059669; font-weight: bold;'; cellContent = 'P'; }
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
                        const isCheckedInToday = (
                            dateStr === todayIso &&
                            u.status === 'in' &&
                            u.lastCheckIn &&
                            toLocalIso(u.lastCheckIn) === dateStr
                        );
                        const hasIsoJoinDate = typeof u.joinDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(u.joinDate);
                        const isBeforeJoinDate = hasIsoJoinDate ? dateStr < u.joinDate : false;
                        const isFutureDate = dateStr > todayIso;

                        if (isCheckedInToday) {
                            cellContent = 'P';
                            cellStyle = 'color: #10b981; font-weight: bold; font-size: 0.9rem;';
                            tooltip = 'Checked in (pending checkout)';
                        } else if (isFutureDate) {
                            cellContent = '-';
                            cellStyle = 'color: #94a3b8; font-weight: 600;';
                            tooltip = 'Future date';
                        } else if (isBeforeJoinDate) {
                            cellContent = '-';
                            cellStyle = 'color: #94a3b8; font-weight: 600;';
                            tooltip = `Before joining date (${u.joinDate})`;
                        } else if (dayPolicy === 'holiday') {
                        cellContent = 'H';
                        cellStyle = 'color: #64748b; font-weight: 700;';
                        tooltip = 'Holiday';
                        } else {
                            // Auto-derive Absent only for eligible working/half-day past dates with no log.
                            cellContent = 'A';
                            cellStyle = 'color: #ef4444; font-weight: bold;';
                            tooltip = dayPolicy === 'halfday'
                                ? 'Absent (Half-Day Working Saturday)'
                                : 'Absent (No attendance log)';
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
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#c2410c; font-weight:bold;">HD</span> Half Day</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#ef4444; font-weight:bold;">A</span> Absent</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#64748b; font-weight:bold;">H</span> Holiday</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#8b5cf6; font-weight:bold;">C</span> Leave</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#0ea5e9; font-weight:bold;">W</span> WFH</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#0369a1; font-weight:bold;">D</span> On Duty</div>
                            <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#be185d; font-weight:bold; background:#fdf2f8; padding:0 3px;">P/A</span> Manual Override</div>
                        </div>
                    </div>
                </div>`;
        },

        async renderAdmin(auditStartDate = null, auditEndDate = null) {
            let allUsers = [];
            let pendingLeaves = [];
            let performance = { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0], labels: [] };
            let audits = [];

            try {
                // Default to current day if no range provided
                if (!auditStartDate || !auditEndDate) {
                    const today = new Date().toISOString().split('T')[0];
                    auditStartDate = auditStartDate || today;
                    auditEndDate = auditEndDate || today;
                }

                [allUsers, performance, audits, pendingLeaves] = await Promise.all([
                    window.AppDB.getAll('users'),
                    window.AppAnalytics.getSystemPerformance(),
                    window.AppDB.getAll('location_audits'),
                    window.AppDB.getAll('leaves').then(leaves => leaves.filter(l => l.status === 'Pending').sort((a, b) => new Date(a.appliedOn) - new Date(b.appliedOn)))
                ]);

                // Filter audits by date
                audits = audits.filter(a => {
                    const d = new Date(a.timestamp).toISOString().split('T')[0];
                    return d >= auditStartDate && d <= auditEndDate;
                });

                // Sort audits by timestamp descending
                audits.sort((a, b) => b.timestamp - a.timestamp);
            } catch (e) {
                console.error("Failed to fetch admin data", e);
            }

            const activeCount = allUsers.filter(u => u.status === 'in').length;
            const adminCount = allUsers.filter(u => u.role === 'Administrator' || u.isAdmin).length;
            const perfStatus = performance.avgScore > 70 ? 'Optimal' : (performance.avgScore > 40 ? 'Good' : 'Low');
            const perfColor = performance.avgScore > 70 ? '#166534' : (performance.avgScore > 40 ? '#854d0e' : '#991b1b');
            const perfBg = performance.avgScore > 70 ? '#f0fdf4' : (performance.avgScore > 40 ? '#fefce8' : '#fef2f2');

            return `
                <div class="dashboard-grid dashboard-modern dashboard-admin-view">
                    <!-- Stats Overview -->
                    <div class="card admin-kpi-card">
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
                    </div>

                    <!-- Pending Leave Requests Section -->
                    <div class="card full-width admin-section-card">
                         <h3 class="admin-section-title">Pending Leave Requests (${pendingLeaves.length})</h3>
                         ${pendingLeaves.length === 0 ? '<p class="text-muted">No pending requests.</p>' : `
                            <div class="table-container">
                                <table class="compact-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Staff</th>
                                            <th>Type</th>
                                            <th>Days/Hrs</th>
                                            <th>Warnings</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pendingLeaves.map(l => {
                const hasWarnings = l.policyWarnings && l.policyWarnings.length > 0;
                return `
                                                <tr class="${hasWarnings ? 'admin-warn-row' : ''}">
                                                    <td>${new Date(l.startDate).toLocaleDateString()}</td>
                                                    <td>${l.userName || 'Unknown'}</td>
                                                    <td>
                                                        <span class="admin-leave-type-badge">${l.type}</span>
                                                    </td>
                                                    <td>${l.daysCount}</td>
                                                    <td>
                                                        ${hasWarnings ?
                        l.policyWarnings.map(w => `<div class="admin-leave-warning"><i class="fa-solid fa-triangle-exclamation"></i> ${w}</div>`).join('')
                        : '<span class="admin-leave-valid"><i class="fa-solid fa-check"></i> Valid</span>'
                    }
                                                    </td>
                                                    <td>
                                                        <div class="admin-leave-actions">
                                                            ${hasWarnings ?
                        `<button onclick="window.app_approveLeaveWithWarning('${l.id}')" class="admin-btn admin-btn-warning">Approve</button>`
                        : `<button onclick="window.AppLeaves.updateLeaveStatus('${l.id}', 'Approved', '${window.AppAuth.getUser().id}').then(() => window.location.reload())" class="admin-btn admin-btn-success">Approve</button>`
                    }
                                                            <button onclick="window.AppLeaves.updateLeaveStatus('${l.id}', 'Rejected', '${window.AppAuth.getUser().id}').then(() => window.location.reload())" class="admin-btn admin-btn-danger">Reject</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
            }).join('')}
                                    </tbody>
                                </table>
                            </div>
                         `}
                    </div>

                    <div class="card admin-performance-card">
                        <div class="admin-performance-head">
                            <div>
                                <h4 class="admin-performance-title">System Performance</h4>
                                <p class="text-muted admin-performance-subtitle">Avg. Activity: ${performance.avgScore}%</p>
                            </div>
                            <div class="admin-performance-status" style="background:${perfBg}; color:${perfColor};">${perfStatus}</div>
                        </div>
                        
                        <div class="admin-performance-bars">
                            ${performance.trendData.map((h, i) => {
                const barColor = h > 70 ? 'var(--primary)' : (h > 40 ? '#f59e0b' : '#ef4444');
                return `
                                    <div class="admin-performance-bar-item">
                                        <div class="admin-performance-bar-val" style="color:${barColor};">${h}%</div>
                                        <div class="admin-performance-bar-fill" style="background:${barColor}; height:${Math.max(h, 5)}%;" title="Score: ${h}%"></div>
                                    </div>
                                `;
            }).join('')}
                        </div>
                        
                        <div class="admin-performance-labels">
                             ${(performance.labels || []).map(label => `<div class="admin-performance-label-item">${label}</div>`).join('')}
                        </div>

                        <div class="admin-performance-legend">
                            <div class="admin-performance-legend-item">
                                <span class="admin-performance-legend-dot admin-performance-legend-dot-optimal"></span> Optimal (>70%)
                            </div>
                            <div class="admin-performance-legend-item">
                                <span class="admin-performance-legend-dot admin-performance-legend-dot-good"></span> Good (40-70%)
                            </div>
                            <div class="admin-performance-legend-item">
                                <span class="admin-performance-legend-dot admin-performance-legend-dot-low"></span> Low (<40%)
                            </div>
                        </div>
                    </div>

                    <!-- Live Security Audits (Stealth Check Log) -->
                    <div class="card full-width">
                        <div class="admin-staff-head">
                            <h3 class="admin-staff-title">Staff Management</h3>
                            <div class="admin-staff-head-actions">
                                <button class="action-btn secondary admin-staff-head-btn" onclick="window.app_exportReports()">
                                    <i class="fa-solid fa-file-export"></i> CSV
                                </button>
                                <button class="action-btn admin-staff-head-btn" onclick="document.getElementById('add-user-modal').style.display = 'flex'">
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
                                                <div class="admin-user-cell">
                                                    <div class="admin-user-avatar-wrap">
                                                        <img src="${u.avatar}" class="admin-user-avatar">
                                                        ${isLive ? `<div class="admin-user-live-dot"></div>` : ''}
                                                    </div>
                                                    <div>
                                                        <div class="admin-user-name-row">
                                                            ${u.name}
                                                            ${isLive ? `<span class="admin-user-live-tag">LIVE</span>` : ''}
                                                        </div>
                                                        <div class="admin-user-id">ID: ${u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <span class="status-badge ${u.status === 'in' ? 'in' : 'out'}">
                                                    ${u.status === 'in' ? 'In' : 'Out'}
                                                </span>
                                            </td>
                                            <td data-label="Logged">
                                                <div class="admin-io-cell">
                                                    <div class="admin-io-row">
                                                        <i class="fa-solid fa-arrow-right-to-bracket admin-io-icon-in"></i>
                                                        <span>${lastIn}</span>
                                                    </div>
                                                    <div class="admin-io-row">
                                                        <i class="fa-solid fa-arrow-right-from-bracket admin-io-icon-out"></i>
                                                        <span>${lastOut}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Role">
                                                <div class="admin-role-main">${u.role}</div>
                                                <div class="admin-role-sub">${u.dept || '--'}</div>
                                            </td>
                                            <td data-label="Location">
                                                <div class="admin-location-cell">
                                                    ${(() => {
                        const loc = u.currentLocation || u.lastLocation;
                        if (loc && loc.lat && loc.lng) {
                            return `<a href="https://www.google.com/maps?q=${loc.lat},${loc.lng}" target="_blank" class="admin-location-link">Map</a>`;
                        }
                        return loc?.address || 'N/A';
                    })()}
                                                </div>
                                            </td>
                                             <td data-label="Actions">
                                                 <div class="admin-row-actions">
                                                      <button onclick="window.app_viewLogs('${u.id}')" class="admin-icon-btn admin-icon-btn-indigo" title="Logs"><i class="fa-solid fa-list-check"></i></button>
                                                      <button onclick="window.app_notifyUser('${u.id}')" class="admin-icon-btn admin-icon-btn-amber" title="Notify"><i class="fa-solid fa-bell"></i></button>
                                                      <button onclick="window.app_editUser('${u.id}')" class="admin-icon-btn admin-icon-btn-slate" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                                      <button onclick="window.app_deleteUser('${u.id}')" class="admin-icon-btn admin-icon-btn-red" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                                 </div>
                                             </td>
                                         </tr>
                                     `;
            }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Live Security Audits (Stealth Check Log) -->
                    <div class="card full-width">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                            <div>
                                <h3 style="font-size: 1.1rem; margin: 0;">Live Security Audits</h3>
                                <p class="text-muted" style="font-size: 0.8rem; margin-top:2px;">Background checks & manual triggers</p>
                            </div>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; padding: 0.4rem 0.75rem; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
                                    <input type="date" id="audit-start" value="${auditStartDate}" style="font-size: 0.75rem; border: none; background: transparent;">
                                    <span style="color: #94a3b8;">to</span>
                                    <input type="date" id="audit-end" value="${auditEndDate}" style="font-size: 0.75rem; border: none; background: transparent;">
                                    <button onclick="window.app_applyAuditFilter()" style="background: var(--primary); color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                                        Filter
                                    </button>
                                </div>
                                <button onclick="window.app_exportAudits()" class="action-btn secondary" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;">
                                    <i class="fa-solid fa-file-csv"></i> Export
                                </button>
                                <button onclick="window.app_triggerManualAudit()" class="action-btn" style="padding: 0.4rem 0.75rem; font-size: 0.75rem; background: #6366f1;">
                                    <i class="fa-solid fa-radar"></i> Audit Now
                                </button>
                            </div>
                        </div>

                        <div class="table-container mobile-table-card">
                            <table>
                                <thead style="background: #f9fafb;">
                                    <tr>
                                        <th>Staff Member</th>
                                        <th>Audit Slot</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                        <th>Coordinates</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${audits.length ? audits.map(a => {
                const auditTime = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const auditDate = new Date(a.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                const isSuccess = a.status === 'Success';

                return `
                                        <tr>
                                            <td data-label="Staff">
                                                <div style="font-weight: 600;">${a.userName || 'Unknown'}</div>
                                                <div style="font-size: 0.7rem; color: #6b7280;">${auditDate}</div>
                                            </td>
                                            <td data-label="Slot">
                                                <div style="font-size: 0.85rem; font-weight: 500; color: #4f46e5;">${a.slot}</div>
                                            </td>
                                            <td data-label="Time">
                                                <div style="font-size: 0.85rem;">${auditTime}</div>
                                            </td>
                                            <td data-label="Status">
                                                <span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: ${isSuccess ? '#f0fdf4' : '#fef2f2'}; color: ${isSuccess ? '#166534' : '#991b1b'};">
                                                    ${isSuccess ? '<i class="fa-solid fa-check"></i> Verified' : '<i class="fa-solid fa-triangle-exclamation"></i> ' + a.status}
                                                </span>
                                            </td>
                                            <td data-label="Coordinates">
                                                <div style="font-family: monospace; font-size: 0.8rem; color: #4b5563;">
                                                    ${isSuccess ? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}` : '--'}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
            }).join('') : `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #9ca3af;">No recent security audits recorded for this range.</td></tr>`}
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
                                    <th>Deduction Days</th>
                                    <th>Deductions</th>
                                    <th>Adjusted Salary</th>
                                    <th>TDS %</th>
                                    <th>TDS Amount</th>
                                    <th>Final Net</th>
                                    <th>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${summary.map(item => {
                const { user, stats } = item;
                const base = user.baseSalary || 0;
                const userTds = typeof user.tdsPercent === 'number' ? user.tdsPercent : null;
                const dailyRate = base / 22;

                const rawLateDeductionDays = Math.floor((stats.late || 0) / (window.AppConfig.LATE_GRACE_COUNT || 3)) * (window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5);
                const extraWorkedHours = Number(stats.extraWorkedHours || 0);
                const lateOffsetDays = Math.floor(extraWorkedHours / (window.AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET || 4)) * (window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5);
                const lateDeductionDays = Math.max(0, rawLateDeductionDays - lateOffsetDays);
                const totalDeductionDays = (stats.unpaidLeaves || 0) + lateDeductionDays;
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
                                                <span style="color: #10b981;">P: <span class="present-count">${stats.present}</span></span> |
                                                <span style="color: #f59e0b;">L: <span class="late-count">${stats.late}</span></span> |
                                                <span style="color: #991b1b;">ED: ${stats.earlyDepartures}</span> |
                                                <span style="color: #ef4444;">UL: <span class="unpaid-leaves-count">${stats.unpaidLeaves}</span></span> |
                                                <span style="color: #0f766e;">XH: <span class="extra-work-hours">${extraWorkedHours.toFixed(2)}</span></span>
                                            </td>
                                            <td style="font-size: 0.82rem;">
                                                <div>Late Raw: <span class="late-deduction-raw">${rawLateDeductionDays.toFixed(1)}</span></div>
                                                <div>Offset: <span class="penalty-offset-days">${lateOffsetDays.toFixed(1)}</span></div>
                                                <div>Late Ded: <span class="late-deduction-days">${lateDeductionDays.toFixed(1)}</span></div>
                                                <div>Total: <span class="deduction-days">${totalDeductionDays.toFixed(1)}</span></div>
                                            </td>
                                            <td style="color: #ef4444; font-weight: 600;" class="attendance-deduction-amount deduction-amount">-Rs ${deductionAmount.toLocaleString()}</td>
                                            <td>
                                                <input type="number" class="salary-input" value="${calculatedSalary}" 
                                                    style="width: 100px; padding: 4px; border: 1px solid #ddd; border-radius: 10px;"
                                                    onchange="this.dataset.manual = 'true'; window.app_recalculateRow(this.closest('tr'))" />
                                            </td>
                                            <td>
                                                <input type="number" class="tds-input" value="${userTds !== null ? userTds : ''}" min="0" max="100"
                                                    style="width: 60px; padding: 4px; border: 1px solid #ddd; border-radius: 6px;"
                                                    placeholder="${typeof userTds === 'number' ? '' : 'Global'}"
                                                    onchange="this.dataset.manual = 'true'; window.app_recalculateRow(this.closest('tr'))" />
                                            </td>
                                            <td style="color: #64748b;" class="tds-amount">Rs 0</td>
                                            <td style="font-weight: 700; color: #1e40af;" class="final-net-salary">Rs ${calculatedSalary.toLocaleString()}</td>
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
        },

        async renderPolicyTest() {
            if (typeof window.app_runPolicyTest !== 'function') {
                window.app_runPolicyTest = () => {
                    const date = document.getElementById('policy-test-date')?.value;
                    const checkIn = document.getElementById('policy-test-checkin')?.value;
                    const checkOut = document.getElementById('policy-test-checkout')?.value;
                    const priorLateRaw = document.getElementById('policy-test-prior-late')?.value || '0';
                    const output = document.getElementById('policy-test-output');
                    if (!output) return;

                    const priorLate = Math.max(0, parseInt(priorLateRaw, 10) || 0);
                    const inDt = window.AppAttendance.buildDateTime(date, checkIn);
                    const outDt = window.AppAttendance.buildDateTime(date, checkOut);

                    if (!inDt || !outDt) {
                        output.innerHTML = `<div style="color:#b91c1c; font-weight:600;">Enter valid date and times.</div>`;
                        return;
                    }

                    const durationMs = outDt - inDt;
                    if (durationMs <= 0) {
                        output.innerHTML = `<div style="color:#b91c1c; font-weight:600;">Check-out must be after check-in.</div>`;
                        return;
                    }

                    const result = window.AppAttendance.evaluateAttendanceStatus(inDt, durationMs);
                    const graceCount = window.AppConfig.LATE_GRACE_COUNT || 3;
                    const blockValue = window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5;
                    const todaysLate = result.lateCountable ? 1 : 0;
                    const totalLate = priorLate + todaysLate;
                    const blocks = Math.floor(totalLate / graceCount);
                    const rawDeductionDays = blocks * blockValue;
                    const netHours = durationMs / (1000 * 60 * 60);
                    const extraWorkedHours = Number(((result.extraWorkedMs || 0) / (1000 * 60 * 60)).toFixed(2));
                    const offsetStepHours = window.AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET || 4;
                    const offsetDays = Math.floor(extraWorkedHours / offsetStepHours) * blockValue;
                    const deductionDays = Math.max(0, rawDeductionDays - offsetDays);

                    output.innerHTML = `
                        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:0.7rem;">
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Final Status</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${result.status}</div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Net Hours</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${netHours.toFixed(2)}h</div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Late Countable</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${result.lateCountable ? 'Yes' : 'No'}</div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Day Credit</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${result.dayCredit.toFixed(1)}</div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Extra Worked</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${extraWorkedHours.toFixed(2)}h</div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Late Blocks</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${blocks}</div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Penalty Offset</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${offsetDays.toFixed(1)} day(s)</div>
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.7rem;">
                                <div style="font-size:0.75rem; color:#64748b;">Late Deduction</div>
                                <div style="font-size:1rem; font-weight:800; color:#0f172a;">${deductionDays.toFixed(1)} day(s)</div>
                            </div>
                        </div>
                        <div style="margin-top:0.7rem; font-size:0.82rem; color:#475569;">
                            Rule used: every ${graceCount} late marks = ${blockValue} day deduction, offset by each ${offsetStepHours} extra worked hours.
                        </div>
                    `;
                };
            }

            if (typeof window.app_fillPolicySample !== 'function') {
                window.app_fillPolicySample = (inTime, outTime, priorLate = 0) => {
                    const inEl = document.getElementById('policy-test-checkin');
                    const outEl = document.getElementById('policy-test-checkout');
                    const priorEl = document.getElementById('policy-test-prior-late');
                    if (inEl) inEl.value = inTime;
                    if (outEl) outEl.value = outTime;
                    if (priorEl) priorEl.value = String(priorLate);
                    if (typeof window.app_runPolicyTest === 'function') window.app_runPolicyTest();
                };
            }

            setTimeout(() => {
                if (typeof window.app_runPolicyTest === 'function') window.app_runPolicyTest();
            }, 0);

            const today = new Date().toISOString().split('T')[0];
            return `
                <div class="card full-width">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.8rem;">
                        <div>
                            <h3 style="font-size:1.15rem; margin:0;">Policy Test Utility</h3>
                            <p class="text-muted" style="font-size:0.82rem; margin-top:0.2rem;">Simulate attendance outcome and mandatory late deduction blocks.</p>
                        </div>
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                            <button class="action-btn secondary" style="padding:0.45rem 0.7rem; font-size:0.78rem;" onclick="window.app_fillPolicySample('09:05', '18:05', 0)">On Time Full Day</button>
                            <button class="action-btn secondary" style="padding:0.45rem 0.7rem; font-size:0.78rem;" onclick="window.app_fillPolicySample('09:35', '18:10', 2)">Late Waived</button>
                            <button class="action-btn secondary" style="padding:0.45rem 0.7rem; font-size:0.78rem;" onclick="window.app_fillPolicySample('10:30', '14:35', 2)">Half Day</button>
                            <button class="action-btn secondary" style="padding:0.45rem 0.7rem; font-size:0.78rem;" onclick="window.app_fillPolicySample('13:40', '17:10', 5)">Absent</button>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:0.75rem; margin-bottom:0.9rem;">
                        <div>
                            <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Date</label>
                            <input id="policy-test-date" type="date" value="${today}" style="width:100%; padding:0.5rem; border:1px solid #d1d5db; border-radius:8px;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Check-In</label>
                            <input id="policy-test-checkin" type="time" value="09:15" style="width:100%; padding:0.5rem; border:1px solid #d1d5db; border-radius:8px;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Check-Out</label>
                            <input id="policy-test-checkout" type="time" value="18:00" style="width:100%; padding:0.5rem; border:1px solid #d1d5db; border-radius:8px;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.2rem;">Prior Late Count (month)</label>
                            <input id="policy-test-prior-late" type="number" min="0" step="1" value="0" style="width:100%; padding:0.5rem; border:1px solid #d1d5db; border-radius:8px;">
                        </div>
                    </div>

                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem;">
                        <button class="action-btn" onclick="window.app_runPolicyTest()">Run Simulation</button>
                        <button class="action-btn secondary" onclick="window.app_runAttendancePolicyMigration()">
                            Recalculate Existing Logs
                        </button>
                    </div>

                    <div id="policy-test-output" style="border:1px solid #e2e8f0; border-radius:10px; padding:0.8rem; background:#fafafa;"></div>
                </div>
            `;
        },

        async renderMinutes() {
            const minutes = await window.AppMinutes.getMinutes();
            const allUsers = await window.AppDB.getAll('users');
            const currentUser = window.AppAuth.getUser();

            const isAdminUser = currentUser.isAdmin || currentUser.role === 'Administrator';
            const hasMinuteDetailAccess = (minute, user = currentUser) => {
                if (!minute || !user) return false;
                if (user.isAdmin || user.role === 'Administrator') return true;
                if ((minute.restrictedFrom || []).includes(user.id)) return false;
                if (minute.createdBy === user.id) return true;
                if ((minute.attendeeIds || []).includes(user.id)) return true;
                if ((minute.allowedViewers || []).includes(user.id)) return true;
                return false;
            };
            const getMinuteRequestStatus = (minute, userId = currentUser.id) => {
                const req = (minute.accessRequests || []).find(r => r.userId === userId);
                return req ? req.status : '';
            };
            const visibleMinutes = (minutes || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

            // Setup Global Handlers for Minutes
            window.app_openMinuteDetails = async (id) => {
                const minute = await (window.AppDB ? window.AppDB.get('minutes', id) : window.AppFirestore.collection('minutes').doc(id).get().then(d => d.data()));
                if (!minute) return alert("Minute not found");
                if (!hasMinuteDetailAccess(minute, currentUser)) {
                    return alert("You can view subject and attendees. Request admin access to open full minutes.");
                }

                const isAttendee = (minute.attendeeIds || []).includes(currentUser.id);
                const isAuthor = minute.createdBy === currentUser.id;
                const isAdmin = currentUser.isAdmin || currentUser.role === 'Administrator';
                const canEdit = (isAttendee || isAuthor || isAdmin) && !minute.locked;
                const pendingAccessRequests = (minute.accessRequests || []).filter(r => r.status === 'pending');

                const modal = document.createElement('div');
                modal.id = 'minute-detail-modal';
                modal.className = 'modal';
                modal.style.cssText = 'display: flex; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);';
                modal.innerHTML = `
                    <div class="modal-content full-screen-modal minutes-detail-modal" style="width: 100vw; height: 100vh; max-width: none; margin: 0; display: flex; flex-direction: column; padding: 0; overflow: hidden; border-radius: 0; background: white;">
                        <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;">
                            <div>
                                <h2 style="margin: 0; font-size: 1.25rem;">${minute.title}</h2>
                                <p style="margin: 4px 0 0; font-size: 0.85rem; color: #64748b;">${new Date(minute.date).toLocaleDateString()} • Recorded by ${minute.createdByName}</p>
                                <p style="margin: 4px 0 0; font-size: 0.8rem; color: #475569;">Attendees: ${(minute.attendeeIds || []).map(uid => allUsers.find(u => u.id === uid)?.name || 'Unknown').join(', ') || 'None'}</p>
                            </div>
                            <div style="display: flex; gap: 0.75rem; align-items: center;">
                                ${minute.locked ? '<span class="badge in" style="background:#f0fdf4; color:#166534; border:1px solid #dcfce7; padding: 4px 12px;"><i class="fa-solid fa-lock"></i> LOCKED</span>' : ''}
                                <button onclick="this.closest('.modal').remove()" class="icon-btn" style="background: white; border: 1px solid #e2e8f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 1.2rem;">
                                    <i class="fa-solid fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="modal-body-grid" style="flex: 1; display: grid; grid-template-columns: 1fr 350px; overflow: hidden;">
                            <!-- Main Content Area -->
                            <div style="overflow-y: auto; padding: 2rem; background: white;">
                                <div style="margin-bottom: 2rem;">
                                    <label style="display: block; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem;">Discussion & Decisions</label>
                                    ${canEdit ? `
                                        <textarea id="edit-minute-content" style="width: 100%; min-height: 250px; padding: 1rem; border: 1px solid #cbd5e1; border-radius: 12px; font-family: inherit; line-height: 1.6; font-size: 1rem;" placeholder="Start typing...">${minute.content || ''}</textarea>
                                    ` : `
                                        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; color: #334155; font-size: 1rem; white-space: pre-wrap; line-height: 1.7; border: 1px solid #e2e8f0;">${minute.content || 'No content recorded.'}</div>
                                    `}
                                </div>

                                <div style="margin-bottom: 2rem;">
                                    <label style="display: block; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem;">Action Items</label>
                                    <div id="modal-action-items-container">
                                        ${(minute.actionItems || []).map((item, idx) => {
                    const status = item.status || 'pending';
                    const isAssignee = item.assigneeId === currentUser.id;
                    const statusStyle = status === 'approved'
                        ? 'background:#ecfdf5;color:#166534;border:1px solid #dcfce7;'
                        : status === 'rejected'
                            ? 'background:#fef2f2;color:#991b1b;border:1px solid #fee2e2;'
                            : 'background:#fffbeb;color:#92400e;border:1px solid #fde68a;';
                    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                    return `
                                            <div class="action-item-row" data-status="${status}" data-approved-by="${item.approvedBy || ''}" data-approved-at="${item.approvedAt || ''}" data-rejected-by="${item.rejectedBy || ''}" data-rejected-at="${item.rejectedAt || ''}" data-calendar-synced="${item.calendarSynced ? 'true' : 'false'}" data-assignee="${item.assigneeId}" style="display:grid; grid-template-columns: 1fr auto auto auto auto; gap:0.5rem; margin-bottom:0.5rem; align-items:center;">
                                                <input type="text" class="ai-task" value="${item.task}" ${!canEdit ? 'disabled' : ''} placeholder="Task..." style="padding:0.5rem; border:1px solid #cbd5e1; border-radius:6px;">
                                                <input type="date" class="ai-date" value="${item.dueDate}" ${!canEdit ? 'disabled' : ''} style="padding:0.5rem; border:1px solid #cbd5e1; border-radius:6px; width: 130px;">
                                                <select class="ai-assignee" ${!canEdit ? 'disabled' : ''} style="padding:0.5rem; border:1px solid #cbd5e1; border-radius:6px;">
                                                    ${allUsers.map(u => `<option value="${u.id}" ${u.id === item.assigneeId ? 'selected' : ''}>${u.name}</option>`).join('')}
                                                </select>
                                                <div style="display:flex; align-items:center; gap:0.35rem; justify-content:flex-end;">
                                                    ${isAssignee && status === 'pending' ? `
                                                        <button onclick="window.app_updateActionItemStatus('${id}', ${idx}, 'approved')" title="Approve" style="background:#ecfdf5; color:#166534; border:1px solid #dcfce7; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:0.75rem; font-weight:700;">Approve</button>
                                                        <button onclick="window.app_updateActionItemStatus('${id}', ${idx}, 'rejected')" title="Reject" style="background:#fef2f2; color:#991b1b; border:1px solid #fee2e2; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:0.75rem; font-weight:700;">Reject</button>
                                                    ` : `<span style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; ${statusStyle}">${statusLabel}</span>`}
                                                </div>
                                                ${canEdit ? `<button onclick="this.parentElement.remove()" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                                            </div>
                                        `;
                }).join('')}
                                    </div>
                                    ${canEdit ? `
                                        <button onclick="window.app_addModalActionRow()" style="font-size:0.8rem; color:var(--primary); background:none; border:none; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem; margin-top: 1rem;">
                                            <i class="fa-solid fa-plus-circle"></i> Add Task
                                        </button>
                                    ` : ''}
                                </div>

                                <div style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px dashed #e2e8f0;">
                                    ${canEdit ? `
                                        <button onclick="window.app_saveUpdatedMinute('${id}')" class="action-btn" style="padding: 0.75rem 2rem;">
                                            <i class="fa-solid fa-check"></i> Save Changes
                                        </button>
                                    ` : ''}
                                    ${isAttendee && !minute.approvals?.[currentUser.id] && !minute.locked ? `
                                        <button onclick="window.app_approveMinute('${id}')" class="action-btn" style="background: #10b981; padding: 0.75rem 2rem;">
                                            <i class="fa-solid fa-thumbs-up"></i> Approve Minutes
                                        </button>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Sidebar -->
                            <div style="background: #f1f5f9; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden;">
                                <!-- Approvals -->
                                <div style="padding: 1.5rem; border-bottom: 1px solid #e2e8f0;">
                                    <label style="display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem;">Approvals</label>
                                    ${(minute.attendeeIds || []).length > 0 ? (minute.attendeeIds || []).map(uid => {
                    const user = allUsers.find(u => u.id === uid);
                    const approvalDate = minute.approvals?.[uid];
                    return `
                                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; background: ${approvalDate ? '#f0fdf4' : 'white'}; padding: 0.5rem; border-radius: 8px; border: 1px solid ${approvalDate ? '#dcfce7' : '#e2e8f0'};">
                                                <img src="${user?.avatar || 'https://via.placeholder.com/24'}" style="width: 24px; height: 24px; border-radius: 50%;">
                                                <div class="dashboard-viewing-meta">
                                                    <div style="font-size: 0.8rem; font-weight: 600;">${user?.name || 'Unknown'}</div>
                                                    ${approvalDate ? `<div style="font-size: 0.65rem; color: #166534;">Approved: ${new Date(approvalDate).toLocaleDateString()}</div>` : '<div style="font-size: 0.65rem; color: #94a3b8;">Pending</div>'}
                                                </div>
                                                ${approvalDate ? '<i class="fa-solid fa-circle-check" style="color: #22c55e;"></i>' : '<i class="fa-regular fa-circle" style="color: #cbd5e1;"></i>'}
                                            </div>
                                        `;
                }).join('') : '<div style="font-size: 0.8rem; color: #94a3b8; text-align: center; padding: 1rem;">No attendees assigned for approval.</div>'}
                                </div>

                                <!-- Audit Log -->
                                <div style="padding: 1.5rem; flex: 1; overflow-y: auto;">
                                    <label style="display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem;">Audit Trail</label>
                                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                                        ${(minute.auditLog || []).slice().reverse().map(log => `
                                            <div style="position: relative; padding-left: 1rem; border-left: 2px solid #cbd5e1;">
                                                <div style="position: absolute; left: -5px; top: 0; width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; border: 2px solid #f1f5f9;"></div>
                                                <div style="font-size: 0.75rem; font-weight: 700; color: #334155;">${log.userName}</div>
                                                <div style="font-size: 0.8rem; color: #475569; margin: 2px 0;">${log.action}</div>
                                                <div style="font-size: 0.65rem; color: #94a3b8;">${new Date(log.timestamp).toLocaleString()}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                ${isAdmin ? `
                                    <div style="padding: 1.5rem; background: #fffbeb; border-top: 1px solid #fef3c7;">
                                        <label style="display: block; font-size: 0.7rem; font-weight: 700; color: #92400e; text-transform: uppercase; margin-bottom: 0.5rem;"><i class="fa-solid fa-user-check"></i> Access Requests</label>
                                        ${pendingAccessRequests.length > 0 ? pendingAccessRequests.map(req => `
                                            <div style="background:#fff; border:1px solid #fde68a; border-radius:8px; padding:0.6rem; margin-bottom:0.55rem;">
                                                <div style="font-size:0.8rem; font-weight:700; color:#1f2937;">${req.userName || req.userId}</div>
                                                <div style="font-size:0.7rem; color:#6b7280; margin-bottom:0.45rem;">Requested: ${new Date(req.requestedAt).toLocaleString()}</div>
                                                <div style="display:flex; gap:0.45rem;">
                                                    <button type="button" onclick="window.app_reviewMinuteAccess('${id}','${req.userId}','approved')" style="background:#10b981; color:#fff; border:none; border-radius:6px; padding:0.3rem 0.55rem; font-size:0.72rem; cursor:pointer;">Approve</button>
                                                    <button type="button" onclick="window.app_reviewMinuteAccess('${id}','${req.userId}','rejected')" style="background:#ef4444; color:#fff; border:none; border-radius:6px; padding:0.3rem 0.55rem; font-size:0.72rem; cursor:pointer;">Reject</button>
                                                </div>
                                            </div>
                                        `).join('') : '<div style="font-size:0.8rem; color:#9a3412;">No pending requests.</div>'}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            };

            window.app_addModalActionRow = () => {
                const container = document.getElementById('modal-action-items-container');
                const div = document.createElement('div');
                div.className = 'action-item-row';
                div.style.cssText = "display:grid; grid-template-columns: 1fr auto auto auto auto; gap:0.5rem; margin-bottom:0.5rem; align-items:center;";
                div.dataset.status = 'pending';
                div.dataset.calendarSynced = 'false';
                div.dataset.assignee = '';
                div.innerHTML = `
                    <input type="text" class="ai-task" placeholder="Task description..." required style="padding:0.5rem; border:1px solid #cbd5e1; border-radius:6px; width:100%;">
                    <input type="date" class="ai-date" required style="padding:0.5rem; border:1px solid #cbd5e1; border-radius:6px; width: 130px;">
                    <select class="ai-assignee" required style="padding:0.5rem; border:1px solid #cbd5e1; border-radius:6px;">
                        ${allUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                    </select>
                    <div style="display:flex; align-items:center; justify-content:flex-end;">
                        <span style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; background:#fffbeb;color:#92400e;border:1px solid #fde68a;">Pending</span>
                    </div>
                    <button type="button" onclick="this.parentElement.remove()" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
                `;
                container.appendChild(div);
            };

            window.app_saveUpdatedMinute = async (id) => {
                const content = document.getElementById('edit-minute-content').value;
                const rows = document.querySelectorAll('#modal-action-items-container .action-item-row');
                const actionItems = Array.from(rows).map(row => {
                    const assigneeId = row.querySelector('.ai-assignee').value;
                    const previousAssignee = row.dataset.assignee || assigneeId;
                    const assigneeChanged = previousAssignee && previousAssignee !== assigneeId;
                    const status = assigneeChanged ? 'pending' : (row.dataset.status || 'pending');
                    return {
                        task: row.querySelector('.ai-task').value,
                        dueDate: row.querySelector('.ai-date').value,
                        assigneeId,
                        status,
                        approvedBy: status === 'approved' ? (row.dataset.approvedBy || '') : '',
                        approvedAt: status === 'approved' ? (row.dataset.approvedAt || '') : '',
                        rejectedBy: status === 'rejected' ? (row.dataset.rejectedBy || '') : '',
                        rejectedAt: status === 'rejected' ? (row.dataset.rejectedAt || '') : '',
                        calendarSynced: row.dataset.calendarSynced === 'true'
                    };
                });

                try {
                    await window.AppMinutes.updateMinute(id, { content, actionItems }, "Edited discussion content and action items");
                    alert("Changes saved!");
                    document.getElementById('minute-detail-modal').remove();
                    window.location.reload();
                } catch (err) {
                    alert(err.message);
                }
            };

            window.app_approveMinute = async (id) => {
                if (await window.appConfirm("I confirm that I have reviewed these minutes and approve them as an accurate record.")) {
                    try {
                        await window.AppMinutes.approveMinute(id);
                        alert("Minutes approved!");
                        document.getElementById('minute-detail-modal').remove();
                        window.location.reload();
                    } catch (err) {
                        alert(err.message);
                    }
                }
            };

            window.app_requestMinuteAccess = async (id) => {
                try {
                    const minute = await (window.AppDB ? window.AppDB.get('minutes', id) : window.AppFirestore.collection('minutes').doc(id).get().then(d => d.data()));
                    if (!minute) throw new Error('Meeting minute not found');
                    if (hasMinuteDetailAccess(minute, currentUser)) {
                        alert('You already have access to full minutes.');
                        return;
                    }

                    const now = new Date().toISOString();
                    const accessRequests = Array.isArray(minute.accessRequests) ? minute.accessRequests.slice() : [];
                    const existingIndex = accessRequests.findIndex(r => r.userId === currentUser.id);
                    if (existingIndex >= 0 && accessRequests[existingIndex].status === 'pending') {
                        alert('Your request is already pending admin review.');
                        return;
                    }

                    const nextRequest = {
                        userId: currentUser.id,
                        userName: currentUser.name,
                        requestedAt: now,
                        status: 'pending',
                        reviewedAt: '',
                        reviewedBy: ''
                    };
                    if (existingIndex >= 0) accessRequests[existingIndex] = nextRequest;
                    else accessRequests.push(nextRequest);

                    await window.AppMinutes.updateMinute(id, { accessRequests }, "Access requested by non-attendee");

                    if (window.AppDB) {
                        const admins = allUsers.filter(u => u.isAdmin || u.role === 'Administrator');
                        await Promise.all(admins.map(async (admin) => {
                            const adminUser = await window.AppDB.get('users', admin.id);
                            if (!adminUser) return;
                            if (!adminUser.notifications) adminUser.notifications = [];
                            adminUser.notifications.unshift({
                                id: Date.now() + Math.random(),
                                type: 'minute-access-request',
                                title: 'Minutes Access Request',
                                message: `${currentUser.name} requested access to "${minute.title}".`,
                                minuteId: id,
                                taggedById: currentUser.id,
                                taggedByName: currentUser.name,
                                status: 'pending',
                                taggedAt: now,
                                date: now
                            });
                            await window.AppDB.put('users', adminUser);
                        }));
                    }

                    alert('Access request sent to admin.');
                    window.location.reload();
                } catch (err) {
                    alert(err.message);
                }
            };

            window.app_reviewMinuteAccess = async (minuteId, requesterId, decision) => {
                try {
                    if (!isAdminUser) return alert('Only admin can review requests.');
                    const minute = await (window.AppDB ? window.AppDB.get('minutes', minuteId) : window.AppFirestore.collection('minutes').doc(minuteId).get().then(d => d.data()));
                    if (!minute) throw new Error('Meeting minute not found');

                    const accessRequests = Array.isArray(minute.accessRequests) ? minute.accessRequests.slice() : [];
                    const reqIndex = accessRequests.findIndex(r => r.userId === requesterId);
                    if (reqIndex < 0) throw new Error('Request not found');

                    accessRequests[reqIndex] = {
                        ...accessRequests[reqIndex],
                        status: decision,
                        reviewedAt: new Date().toISOString(),
                        reviewedBy: currentUser.name
                    };

                    let allowedViewers = Array.isArray(minute.allowedViewers) ? minute.allowedViewers.slice() : [];
                    if (decision === 'approved') {
                        if (!allowedViewers.includes(requesterId)) allowedViewers.push(requesterId);
                    } else {
                        allowedViewers = allowedViewers.filter(uid => uid !== requesterId);
                    }

                    await window.AppMinutes.updateMinute(minuteId, { accessRequests, allowedViewers }, decision === 'approved' ? 'Admin approved minutes access' : 'Admin rejected minutes access');

                    if (window.AppDB) {
                        const requester = await window.AppDB.get('users', requesterId);
                        if (requester) {
                            if (!requester.notifications) requester.notifications = [];
                            requester.notifications.unshift({
                                id: Date.now() + Math.random(),
                                type: 'minute-access-reviewed',
                                title: 'Minutes Access Update',
                                message: `Your request for "${minute.title}" was ${decision}.`,
                                minuteId,
                                taggedById: currentUser.id,
                                taggedByName: currentUser.name,
                                status: decision,
                                taggedAt: new Date().toISOString(),
                                date: new Date().toISOString()
                            });
                            await window.AppDB.put('users', requester);
                        }
                    }

                    alert(`Request ${decision}.`);
                    document.getElementById('minute-detail-modal')?.remove();
                    window.location.reload();
                } catch (err) {
                    alert(err.message);
                }
            };

            window.app_updateActionItemStatus = async (minuteId, itemIndex, newStatus) => {
                try {
                    const currentUser = window.AppAuth.getUser();
                    const minute = await (window.AppDB ? window.AppDB.get('minutes', minuteId) : window.AppFirestore.collection('minutes').doc(minuteId).get().then(d => d.data()));
                    if (!minute) throw new Error('Meeting minute not found');

                    const actionItems = minute.actionItems || [];
                    const item = actionItems[itemIndex];
                    if (!item) throw new Error('Action item not found');
                    if (item.assigneeId !== currentUser.id) {
                        alert('Only the assigned staff can approve or reject this task.');
                        return;
                    }
                    if (item.status === 'approved' || item.status === 'rejected') return;

                    const nowIso = new Date().toISOString();
                    item.status = newStatus;
                    if (newStatus === 'approved') {
                        item.approvedBy = currentUser.id;
                        item.approvedAt = nowIso;
                        item.rejectedBy = '';
                        item.rejectedAt = '';
                        if (!item.calendarSynced && window.AppCalendar) {
                            await window.AppCalendar.addWorkPlanTask(item.dueDate, item.assigneeId, item.task);
                            item.calendarSynced = true;
                        }
                    } else if (newStatus === 'rejected') {
                        item.rejectedBy = currentUser.id;
                        item.rejectedAt = nowIso;
                        item.approvedBy = '';
                        item.approvedAt = '';
                    }

                    await window.AppMinutes.updateMinute(minuteId, { actionItems }, `Action item ${newStatus}`);
                    document.getElementById('minute-detail-modal')?.remove();
                    window.location.reload();
                } catch (err) {
                    alert(err.message);
                }
            };

            window.app_toggleMinuteVisibility = async (id, userId, isRestricted) => {
                try {
                    const minute = await (window.AppDB ? window.AppDB.get('minutes', id) : window.AppFirestore.collection('minutes').doc(id).get().then(d => d.data()));
                    let restrictedFrom = minute.restrictedFrom || [];
                    if (isRestricted) {
                        if (!restrictedFrom.includes(userId)) restrictedFrom.push(userId);
                    } else {
                        restrictedFrom = restrictedFrom.filter(uid => uid !== userId);
                    }
                    await window.AppMinutes.updateMinute(id, { restrictedFrom }, isRestricted ? `Restricted visibility for staff member` : `Restored visibility for staff member`);
                } catch (err) {
                    alert(err.message);
                }
            };

            window.app_toggleNewMinuteForm = () => {
                const form = document.getElementById('new-minute-form');
                if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
            };

            window.app_filterAttendees = (query) => {
                const q = String(query || '').toLowerCase().trim();
                const rows = document.querySelectorAll('.minutes-attendee-list .minutes-attendee-item');
                rows.forEach(row => {
                    const name = row.dataset.name || '';
                    row.style.display = name.includes(q) ? 'flex' : 'none';
                });
            };

            window.app_toggleAttendeePick = (checkbox, name) => {
                const chipWrap = document.getElementById('minutes-attendee-chips');
                if (!chipWrap) return;
                const existing = chipWrap.querySelector(`[data-id="${checkbox.value}"]`);
                if (checkbox.checked) {
                    if (existing) return;
                    const chip = document.createElement('div');
                    chip.className = 'minutes-attendee-chip';
                    chip.dataset.id = checkbox.value;
                    chip.innerHTML = `<span>${name}</span><button type="button" onclick="window.app_removeAttendeeChip('${checkbox.value}')">&times;</button>`;
                    chipWrap.appendChild(chip);
                } else if (existing) {
                    existing.remove();
                }
            };

            window.app_removeAttendeeChip = (id) => {
                const input = document.querySelector(`.minutes-attendee-list input[value="${id}"]`);
                if (input) input.checked = false;
                const chip = document.querySelector(`#minutes-attendee-chips [data-id="${id}"]`);
                if (chip) chip.remove();
            };

            window.app_addActionItemRow = () => {
                const container = document.getElementById('action-items-container');
                const div = document.createElement('div');
                div.className = 'action-item-row';
                div.innerHTML = `
                    <input type="text" class="ai-task" placeholder="Task description..." required>
                    <input type="date" class="ai-date" required>
                    <select class="ai-assignee" required>
                        <option value="">Assign To...</option>
                        ${allUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                    </select>
                    <button type="button" onclick="this.parentElement.remove()" class="minutes-remove-task-btn" title="Remove task"><i class="fa-solid fa-times"></i></button>
                `;
                container.appendChild(div);
            };

            window.app_saveMinute = async (e) => {
                e.preventDefault();
                const title = e.target.title.value;
                const date = e.target.date.value;
                const content = e.target.content.value;

                // Get attendee IDs from multi-select or comma list? 
                // Let's use the attendees input for now and convert names to IDs if possible, 
                // but better to have a multi-select for staff. 
                // For simplicity, let's treat the attendees field as a list of staff IDs for logic.
                // WE SHOULD CHANGE THIS TO A SELECT.
                const attendeeIds = Array.from(document.querySelectorAll('.minutes-attendee-list input[type="checkbox"]:checked'))
                    .map(cb => cb.value);

                const actionItems = [];
                const rows = document.querySelectorAll('#new-minute-form .action-item-row');
                rows.forEach(row => {
                    actionItems.push({
                        task: row.querySelector('.ai-task').value,
                        dueDate: row.querySelector('.ai-date').value,
                        assigneeId: row.querySelector('.ai-assignee').value,
                        status: 'pending',
                        calendarSynced: false
                    });
                });

                try {
                    await window.AppMinutes.addMinute({ title, date, attendeeIds, content, actionItems });
                    alert("Meeting minutes recorded!");
                    window.location.reload();
                } catch (err) {
                    alert(err.message);
                }
            };

            window.app_deleteMinute = async (id) => {
                if (await window.appConfirm("Are you sure you want to delete this meeting record?")) {
                    try {
                        await window.AppMinutes.deleteMinute(id);
                        window.location.reload();
                    } catch (err) {
                        alert(err.message);
                    }
                }
            };

            return `
                <div class="dashboard-grid minutes-modern">
                    <div class="card full-width minutes-modern-shell">
                        <div class="minutes-head">
                            <div>
                                <h2>Meeting Minutes</h2>
                                <p class="text-muted">Track meetings, decisions, and action items in one clean timeline.</p>
                            </div>
                            <button onclick="window.app_toggleNewMinuteForm()" class="action-btn minutes-add-btn">
                                <i class="fa-solid fa-plus"></i> Record Meeting
                            </button>
                        </div>

                        <div id="new-minute-form" class="minutes-form-wrap" style="display:none;">
                            <h4>Create New Meeting Record</h4>
                            <p class="minutes-form-subtitle">Capture key decisions quickly and assign clear follow-ups.</p>
                            <form onsubmit="window.app_saveMinute(event)">
                                <div class="minutes-grid-two">
                                    <div>
                                        <label>Meeting Title</label>
                                        <input type="text" name="title" required placeholder="e.g. Monthly Performance Review">
                                    </div>
                                    <div>
                                        <label>Date</label>
                                        <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                                    </div>
                                </div>
                                <div class="minutes-field">
                                    <label>Required Approvers (Attendees)</label>
                                    <div class="minutes-attendee-picker">
                                        <div class="minutes-attendee-search">
                                            <i class="fa-solid fa-magnifying-glass"></i>
                                            <input type="text" placeholder="Search staff..." oninput="window.app_filterAttendees(this.value)">
                                        </div>
                                        <div id="minutes-attendee-chips" class="minutes-attendee-chips"></div>
                                        <div class="minutes-attendee-list">
                                            ${allUsers.map(u => {
                    const displayName = String(u.name || u.username || 'Unknown');
                    return `
                                                <label class="minutes-attendee-item" data-name="${displayName.toLowerCase()}">
                                                    <input type="checkbox" value="${u.id}" onchange="window.app_toggleAttendeePick(this, '${displayName.replace(/'/g, "\\'")}')">
                                                    <span class="minutes-attendee-name">${displayName}</span>
                                                    <span class="minutes-attendee-role">${u.role || 'Staff'}</span>
                                                </label>
                                            `;
                }).join('')}
                                        </div>
                                    </div>
                                    <p class="minutes-help">Select staff who must approve these minutes.</p>
                                </div>
                                <div class="minutes-field">
                                    <label>Discussion Points and Decisions</label>
                                    <textarea name="content" required rows="6" placeholder="Document key decisions and outcomes..."></textarea>
                                </div>

                                <div class="minutes-actions-box">
                                    <label>Immediate Action Items</label>
                                    <div id="action-items-container"></div>
                                    <button type="button" onclick="window.app_addActionItemRow()" class="minutes-add-task-btn">
                                        <i class="fa-solid fa-plus-circle"></i> Add Task
                                    </button>
                                </div>

                                <div class="minutes-form-actions">
                                    <button type="button" onclick="window.app_toggleNewMinuteForm()" class="minutes-cancel-btn">Cancel</button>
                                    <button type="submit" class="action-btn minutes-save-btn">Save and Notify Attendees</button>
                                </div>
                            </form>
                        </div>

                        <div class="minutes-list">
                            <div class="table-container minutes-table-wrap">
                                <table class="compact-table minutes-table">
                                    <thead>
                                        <tr>
                                            <th style="width:150px;">Date</th>
                                            <th>Meeting Title</th>
                                            <th style="width:120px; text-align:center;">Status</th>
                                            <th style="width:110px; text-align:right;">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${visibleMinutes.length > 0 ? visibleMinutes.map(m => `
                                            <tr class="minutes-row" onclick="if(!event.target.closest('button') && ${hasMinuteDetailAccess(m) ? 'true' : 'false'}) window.app_openMinuteDetails('${m.id}')">
                                                <td class="minutes-date-cell">${new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                <td>
                                                    <div class="minutes-title-cell">${m.title}</div>
                                                    <div class="minutes-meta-cell">Attendees: ${(m.attendeeIds || []).map(uid => allUsers.find(u => u.id === uid)?.name || 'Unknown').join(', ') || 'None'}</div>
                                                </td>
                                                <td style="text-align:center;">
                                                    ${m.locked
                    ? '<span class="badge in minutes-status-locked">Locked</span>'
                    : '<span class="badge out minutes-status-open">Open</span>'}
                                                </td>
                                                <td class="minutes-action-cell">
                                                    ${(currentUser.isAdmin || m.createdBy === currentUser.id) ? `
                                                        <button onclick="event.stopPropagation(); window.app_deleteMinute('${m.id}')" class="icon-btn minutes-delete-btn" title="Delete">
                                                            <i class="fa-solid fa-trash-can"></i>
                                                        </button>
                                                    ` : ''}
                                                    ${hasMinuteDetailAccess(m) ? `
                                                        <button class="icon-btn minutes-open-btn" title="Open Details">
                                                            <i class="fa-solid fa-chevron-right"></i>
                                                        </button>
                                                    ` : `
                                                        ${getMinuteRequestStatus(m) ? `<span style="display:inline-block; padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; margin-right:6px; ${getMinuteRequestStatus(m) === 'approved' ? 'background:#ecfdf5;color:#166534;border:1px solid #bbf7d0;' : getMinuteRequestStatus(m) === 'rejected' ? 'background:#fef2f2;color:#991b1b;border:1px solid #fecaca;' : 'background:#fffbeb;color:#92400e;border:1px solid #fde68a;'}">${getMinuteRequestStatus(m)}</span>` : ''}
                                                        <button onclick="event.stopPropagation(); window.app_requestMinuteAccess('${m.id}')" class="icon-btn" title="Request Access" style="width:auto; padding:0 10px; border-radius:8px; border:1px solid #f59e0b; color:#92400e;">
                                                            Request
                                                        </button>
                                                    `}
                                                </td>
                                            </tr>
                                        `).join('') : `
                                            <tr>
                                                <td colspan="4" class="minutes-empty-cell">
                                                    <i class="fa-solid fa-clipboard-list"></i>
                                                    <p>No meeting records accessible to you.</p>
                                                </td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        renderCheckInModal(existingPlans = []) {
            let plansHtml = '';
            if (existingPlans && existingPlans.length > 0) {
                const list = existingPlans.map(p =>
                    `<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                        <span style="font-weight:600;">•</span> ${p.task}
                        ${p.subPlans && p.subPlans.length > 0 ? `<div style="font-size:0.8rem; color:#0369a1; margin-left:12px; margin-top:2px;">+ ${p.subPlans.length} sub-tasks</div>` : ''}
                     </div>`
                ).join('');

                plansHtml = `
                    <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                         <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                         <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                            ${list}
                         </div>
                    </div>
                `;
            }

            const promptText = (existingPlans && existingPlans.length > 0)
                ? "✨ Add another task? (Optional)"
                : "📝 What's your main focus today?";

            const requiredAttr = (existingPlans && existingPlans.length > 0) ? '' : 'required';

            return `
            <div class="modal-overlay" id="checkin-modal" style="display:flex;">
                <div class="modal-content" style="max-width: 500px; width: 95%; padding: 1.5rem; border-radius: 16px;">
                     <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);">
                                <i class="fa-solid fa-user-check" style="color:white; font-size:1.1rem;"></i>
                            </div>
                            <div>
                                <h3 style="font-size: 1.2rem; margin:0; font-weight:700; color:#111827;">Start Your Day</h3>
                                <p style="font-size:0.8rem; color:#64748b; margin:0.25rem 0 0 0;">Set your goal and check in</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('checkin-modal').remove()" style="background:#f1f5f9; border:none; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition: all 0.2s;" onmouseover="this.style.background='#e2e8f0'; this.style.color='#1e293b'" onmouseout="this.style.background='#f1f5f9'; this.style.color='#64748b'">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>

                    <form onsubmit="window.app_submitCheckIn(event)">
                        ${plansHtml}

                        <div style="margin-bottom:1.25rem;">
                             <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.5rem;">${promptText}</label>
                             <div style="position:relative;">
                                <textarea id="checkin-task" ${requiredAttr} placeholder="e.g. Complete the monthly financial report..." style="width:100%; height:80px; padding:0.75rem; border:2px solid #e2e8f0; border-radius:10px; font-family:inherit; resize:none; font-size:0.95rem; line-height:1.5; transition: border-color 0.2s;" onfocus="this.style.borderColor='#22c55e'"></textarea>
                                <div style="position:absolute; bottom:8px; right:8px; font-size:0.7rem; color:#94a3b8; background:rgba(255,255,255,0.8); padding:2px 6px; border-radius:4px;">Type @ to tag</div>
                             </div>
                        </div>

                        <!-- Tagging Area (Simplified) -->
                        <div style="margin-bottom:1.5rem;">
                             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <label style="font-size:0.8rem; font-weight:600; color:#475569;">👥 Working with anyone?</label>
                             </div>
                             <div id="checkin-tags-container" style="display:flex; flex-wrap:wrap; gap:0.5rem; min-height:40px; padding:0.5rem; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc;">
                                <div class="placeholder" style="width:100%; text-align:center; color:#94a3b8; font-size:0.8rem; padding:0.25rem;">No tags yet</div>
                             </div>
                        </div>

                        <div style="display:flex; gap:1rem;">
                            <button type="button" onclick="document.getElementById('checkin-modal').remove()" style="flex:1; padding:0.75rem; background:white; border:1px solid #e2e8f0; color:#64748b; border-radius:10px; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">Cancel</button>
                            <button type="submit" style="flex:2; padding:0.75rem; background:linear-gradient(135deg, #16a34a 0%, #15803d 100%); border:none; color:white; border-radius:10px; font-weight:700; cursor:pointer; box-shadow:0 4px 6px -1px rgba(22, 163, 74, 0.4); display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                                <span>🚀 Confirm & Check In</span>
                            </button>
                        </div>
                    </form>
                    
                    <!-- Hidden Dropdown for mentions -->
                    <div id="checkin-mention-dropdown" style="display:none; position:fixed; z-index:10005; background:white; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); width:200px; max-height:200px; overflow-y:auto; padding:4px;"></div>
                </div>
            </div>
            `;
        },
    };

    // Initialize checkout intro panel visibility
    if (typeof window !== 'undefined') {
        // Use MutationObserver to detect when checkout modal is shown
        const checkoutObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const modal = document.getElementById('checkout-modal');
                const introPanel = document.getElementById('checkout-intro-panel');

                if (modal && introPanel && modal.style.display !== 'none') {
                    // Check if intro has been seen before
                    const introSeen = localStorage.getItem('checkoutIntroSeen');
                    if (!introSeen) {
                        introPanel.style.display = 'block';
                    }
                }
            });
        });

        // Start observing when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                const modalContainer = document.body;
                if (modalContainer) {
                    checkoutObserver.observe(modalContainer, {
                        attributes: true,
                        subtree: true,
                        attributeFilter: ['style']
                    });
                }
            });
        } else {
            const modalContainer = document.body;
            if (modalContainer) {
                checkoutObserver.observe(modalContainer, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['style']
                });
            }
        }
    }
})();
