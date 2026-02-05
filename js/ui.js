/**
 * UI Module
 * Handles all purely visual rendering.
 * (Converted to IIFE for file:// support)
 */
(function () {
    window.AppUI = {
        renderLogin: () => {
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem;">
                    <div class="card" style="width: 100%; max-width: 400px; text-align: center;">
                        <button onclick="window.AppAuth.resetData()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.8rem;">
                             <i class="fa-solid fa-rotate-right"></i> Reset App
                        </button>
                        <div class="logo-circle" style="width: 60px; height: 60px; margin: 0 auto 1.5rem auto;">
                            <img src="https://ui-avatars.com/api/?name=CRWI&background=random" alt="Logo">
                        </div>
                        <h2 style="margin-bottom: 0.5rem;">CRWI Attendance</h2>
                        <p class="text-muted" style="margin-bottom: 2rem;">Please sign in to continue</p>
                        
                        <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                            <div>
                                <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Login ID / Email</label>
                                <input type="text" name="username" placeholder="Enter Login ID" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                            </div>
                            <div>
                                <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Password</label>
                                <input type="password" name="password" placeholder="Enter Password" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                            </div>
                            
                            <button type="submit" class="action-btn" style="margin-top: 1rem; width: 100%;">Sign In</button>
                        </form>
                        
                        <p style="margin-top: 2rem; font-size: 0.85rem; color: #6b7280;">
                            Contact Admin for login credentials.
                        </p>
                    </div>
                </div>
             `;
        },
        renderHeroCard: (heroData) => {
            if (!heroData) return '';
            const { user, stats, reason } = heroData;
            return `
                <div class="card hero-of-the-week full-width" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border: none; overflow: hidden; position: relative;">
                    <!-- Decorative Elements -->
                    <div style="position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -10px; width: 100px; height: 100px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
                    <i class="fa-solid fa-crown" style="position: absolute; top: 1rem; right: 1rem; font-size: 2.5rem; color: #fbbf24; opacity: 0.3; transform: rotate(15deg);"></i>

                    <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 1.5rem;">
                        <div style="position: relative;">
                             <div class="logo-circle" style="width: 80px; height: 80px; border: 3px solid #fbbf24; box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);">
                                <img src="${user.avatar}" alt="${user.name}">
                            </div>
                            <div style="position: absolute; bottom: -5px; right: -5px; background: #fbbf24; color: #1e1b4b; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; border: 2px solid #1e1b4b;">
                                <i class="fa-solid fa-trophy"></i>
                            </div>
                        </div>

                        <div style="flex: 1;">
                            <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24;">Hero of the Week</span>
                            <h3 style="margin: 0.25rem 0; font-size: 1.5rem; letter-spacing: -0.5px;">${user.name}</h3>
                            <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem;">
                                <div style="font-size: 0.85rem; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 20px; backdrop-filter: blur(4px);">
                                    <i class="fa-solid fa-star" style="color: #fbbf24; margin-right: 4px;"></i> ${reason}
                                </div>
                                <div style="font-size: 0.85rem; opacity: 0.9;">
                                     <i class="fa-solid fa-clock" style="margin-right: 4px;"></i> ${stats.hours}h tracked
                                </div>
                            </div>
                        </div>

                        <div style="text-align: center; padding-left: 1rem; border-left: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 1.8rem; font-weight: 800; color: #fbbf24;">${Math.round(stats.finalScore)}</div>
                            <div style="font-size: 0.6rem; text-transform: uppercase; opacity: 0.7; font-weight: 600;">Power Score</div>
                        </div>
                    </div>
                </div>
            `;
        },

        async renderDashboard() {
            const user = window.AppAuth.getUser();

            console.time('DashboardFetch');
            // Parallel Fetch
            const [status, logs, monthlyStats, yearlyStats, heroData] = await Promise.all([
                window.AppAttendance.getStatus(),
                window.AppAttendance.getLogs(),
                window.AppAnalytics.getUserMonthlyStats(user.id),
                window.AppAnalytics.getUserYearlyStats(user.id),
                window.AppAnalytics.getHeroOfTheWeek()
            ]);
            console.timeEnd('DashboardFetch');

            const isCheckedIn = status.status === 'in';
            const notifications = user.notifications || [];

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
                            ${notifications.map((n, idx) => `
                                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; padding-bottom: 0.5rem; ${idx !== notifications.length - 1 ? 'border-bottom: 1px solid rgba(0,0,0,0.05);' : ''}">
                                    <div>
                                        <p style="font-size: 0.95rem; color: #78350f;">${n.message}</p>
                                        <small style="color: #92400e; font-size: 0.75rem;">${n.date}</small>
                                    </div>
                                    <button onclick="document.dispatchEvent(new CustomEvent('dismiss-notification', {detail: ${idx}}))" style="background: none; border: none; color: #b45309; cursor: pointer;">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Stats fetched in parallel above, variables ready.

            // Helper to generate breakdown HTML
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
                    'Holiday': { color: '#1e293b', bg: '#f1f5f9', label: 'Holiday' },
                    'National Holiday': { color: '#334155', bg: '#f8fafc', label: 'Nat. Hol' },
                    'Regional Holidays': { color: '#475569', bg: '#f8fafc', label: 'Reg. Hol' }
                };

                return items.map(([key, count]) => {
                    const style = meta[key] || { color: '#374151', bg: '#f3f4f6', label: key };
                    if (count === 0 && !['Present', 'Late', 'Absent'].includes(key)) return '';

                    return `
                        <div style="display:flex; flex-direction:column; align-items:center; justifyContent:center; padding:0.5rem; background:${style.bg}; border-radius:8px; min-width:65px; text-align:center;">
                            <span style="font-weight:700; font-size:1.1rem; color:${style.color}">${count}</span>
                            <span style="font-size:0.65rem; color:${style.color}; font-weight:500; line-height:1.2; margin-top:2px;">${style.label}</span>
                        </div>
                     `;
                }).join('');
            };

            const renderStatsCard = (title, subtitle, statsObj) => {
                const penaltyBadge = statsObj.penalty > 0
                    ? `<span style="font-size:0.65rem; background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:12px; font-weight:600;">Penalty Applies</span>`
                    : '';

                return `
                    <div class="card" style="padding: 1.25rem; display:flex; flex-direction:column; gap:1rem;">
                        <!-- Header -->
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div>
                                <h4 style="margin:0; font-size:1.1rem; color:#1f2937;">${title}</h4>
                                <span style="font-size:0.75rem; color:#6b7280; margin-top:0.25rem; display:block;">${subtitle}</span>
                            </div>
                            ${penaltyBadge}
                        </div>

                        <!-- Time Stats -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
                             <div style="background:#fef2f2; padding:0.75rem; border-radius:8px; text-align:center; border:1px solid #fee2e2;">
                                <div style="color:#b91c1c; font-weight:700; font-size:1.1rem;">${statsObj.totalLateDuration}</div>
                                <div style="color:#7f1d1d; font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Late Time</div>
                             </div>
                             <div style="background:#ecfdf5; padding:0.75rem; border-radius:8px; text-align:center; border:1px solid #d1fae5;">
                                <div style="color:#047857; font-weight:700; font-size:1.1rem;">${statsObj.totalExtraDuration}</div>
                                <div style="color:#064e3b; font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Extra Hrs</div>
                             </div>
                        </div>

                        <!-- Breakdown -->
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: start;">
                            ${renderBreakdown(statsObj.breakdown)}
                        </div>
                    </div>
                `;
            };

            // NEW: Activity Report Widget Helper
            const renderActivityReport = (logs) => {
                // Default: Current Month
                const today = new Date();
                const startDefault = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                const endDefault = today.toISOString().split('T')[0];

                return `
                    <div class="card" style="padding: 1rem; display:flex; flex-direction:column; max-height: 400px;">
                        <div style="margin-bottom:1rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.5rem;">
                             <h4 style="margin:0; color:#1f2937;">Activity Log</h4>
                             <span style="font-size:0.75rem; color:#6b7280;">Work Descriptions</span>
                        </div>

                        <!-- Filters -->
                         <div style="display:flex; gap:0.5rem; margin-bottom:1rem; align-items:center;">
                            <input type="date" id="act-start" value="${startDefault}" style="border:1px solid #e5e7eb; border-radius:4px; padding:4px; font-size:0.8rem; width:110px;">
                            <span style="color:#9ca3af; font-size:0.8rem;">to</span>
                            <input type="date" id="act-end" value="${endDefault}" style="border:1px solid #e5e7eb; border-radius:4px; padding:4px; font-size:0.8rem; width:110px;">
                            <button onclick="window.app_filterActivity()" style="background:var(--primary); color:white; border:none; border-radius:4px; padding:4px 8px; font-size:0.8rem; cursor:pointer;">Go</button>
                        </div>

                        <!-- Report Content (Scrollable) -->
                        <div id="activity-list" style="flex:1; overflow-y:auto; font-size:0.85rem; padding-right:5px;">
                            ${renderActivityList(logs, startDefault, endDefault)}
                        </div>
                    </div>
                `;
            };

            // Global Helper for filtering (attached to window since it's called onclick)
            // We define it inside but assign to window to access closure or just re-run logic separately
            window.app_filterActivity = () => {
                const s = document.getElementById('act-start').value;
                const e = document.getElementById('act-end').value;
                const list = document.getElementById('activity-list');
                // We need access to logs here. Since this is async/global, we might need to re-fetch or store logs globally.
                // Simpler: Just make renderDashboard store logs in a window var? Or fetch again.
                // Fetching again is safer for data consistency.
                window.AppAttendance.getLogs().then(logs => {
                    list.innerHTML = renderActivityList(logs, s, e);
                });
            };

            // Internal Helper to render the list HTML
            const renderActivityList = (allLogs, startStr, endStr) => {
                const start = new Date(startStr);
                const end = new Date(endStr);
                end.setHours(23, 59, 59, 999); // End of day

                // Filter & Sort
                const filtered = allLogs.filter(l => {
                    const d = new Date(l.date); // Assumes YYYY-MM-DD or convertible format
                    // Fallback: Use location as description if workDescription is missing (for manual logs)
                    const desc = l.workDescription || (l.location && !l.location.startsWith('Lat:') ? l.location : null);
                    l._displayDesc = desc; // Temp store
                    return d >= start && d <= end && desc;
                }).sort((a, b) => new Date(b.date + ' ' + b.checkOut) - new Date(a.date + ' ' + a.checkOut));

                if (filtered.length === 0) return '<div style="color:#9ca3af; text-align:center; padding:1rem;">No activity descriptions found.</div>';

                let html = '';
                let lastDate = '';

                filtered.forEach(log => {
                    const showDate = log.date !== lastDate;
                    if (showDate) {
                        html += `<div style="font-weight:600; color:#374151; background:#f9fafb; padding:4px 8px; border-radius:4px; margin-top:0.75rem; margin-bottom:0.25rem; font-size:0.8rem;">${log.date}</div>`;
                        lastDate = log.date;
                    }
                    // Preserve whitespace/newlines in description
                    html += `
                        <div style="margin-left:0.5rem; padding-left:0.75rem; border-left:2px solid #e5e7eb; margin-bottom:0.5rem;">
                            <div style="white-space: pre-wrap; color:#4b5563; font-size:0.85rem;">${log._displayDesc}</div>
                            <div style="font-size:0.7rem; color:#9ca3af; margin-top:2px;">${log.checkOut || 'Checked Out'}</div>
                        </div>
                     `;
                });
                return html;
            };

            // Get logs for the widget (Already fetched above as 'logs')

            const summaryHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 1rem; align-items: start;">
                    ${renderStatsCard(monthlyStats.label, 'Monthly Stats', monthlyStats)}
                    ${renderStatsCard('Yearly Summary', yearlyStats.label, yearlyStats)}
                    ${renderActivityReport(logs)}
                </div>
            `;

            const heroHTML = this.renderHeroCard(heroData);

            return `
                <div class="dashboard-grid">
                    ${heroHTML}
                    ${notifHTML}
                    ${summaryHTML}

                    <div class="card welcome-card full-width">
                        <div>
                            <h3>Good Afternoon, ${user.name}</h3>
                            <p style="opacity: 0.9">Have a productive day!</p>
                        </div>
                        <i class="fa-solid fa-cloud-sun" style="font-size: 3rem; opacity: 0.8;"></i>
                    </div>

                    <div class="card check-in-widget">
                        <div class="user-mini-profile" style="flex-direction: column; text-align: center;">
                            <img src="${user.avatar}" alt="Profile" style="width: 80px; height: 80px;">
                            <div>
                                <h4>${user.name}</h4>
                                <p class="text-muted">${user.role}</p>
                            </div>
                        </div>

                        <div class="status-badge ${statusClass}" id="status-badge">
                            ${statusText}
                        </div>

                        <div class="timer-display" id="timer-display">${timerHTML}</div>

                        <button class="${btnClass}" id="attendance-btn">
                            ${btnText} <i class="fa-solid fa-fingerprint"></i>
                        </button>

                        <div class="location-text" id="location-text">
                            <i class="fa-solid fa-location-dot"></i> 
                            <span>
                                ${user.status === 'in' && user.currentLocation
                    ? `Lat: ${Number(user.currentLocation.lat).toFixed(4)}, Lng: ${Number(user.currentLocation.lng).toFixed(4)}`
                    : 'Waiting for location...'}
                            </span>
                        </div>
                    </div>

                    <div class="card">
                        <h4>Recent Activity</h4>
                        <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
                            ${recentLogs.slice(0, 3).map(log => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid #f3f4f6;">
                                    <div>
                                        <div style="font-weight: 500;">${log.date}</div>
                                        <div style="font-size: 0.8rem; color: #6b7280;">${log.checkIn} - ${log.checkOut || 'Working...'}</div>
                                    </div>
                                    <div style="font-weight: 600; color: var(--primary);">${log.duration || '--'}</div>
                                </div>
                            `).join('')}
                        </div>
                         <div style="margin-top: 1rem; text-align: center;">
                            <a href="#timesheet" onclick="window.location.hash = 'timesheet'; return false;" style="color: var(--primary); text-decoration: none; font-weight: 500;">View All</a>
                        </div>
                    </div>
                </div>

                <!-- Check-Out Modal -->
                <div id="checkout-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="width: 100%; max-width: 450px;">
                        <h3 style="margin-bottom: 1rem;">Check Out</h3>
                        <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">Please summarize your work for today before checking out.</p>
                        <form onsubmit="window.app_submitCheckOut(event)">
                            <textarea name="description" required placeholder="- Completed monthly report&#10;- Fixed login bug..." style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; resize: none; font-family: inherit; margin-bottom: 1.5rem;"></textarea>
                            <div style="display: flex; gap: 1rem;">
                                <button type="button" onclick="document.getElementById('checkout-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                                <button type="submit" class="action-btn" style="flex: 1; justify-content: center;">Complete Check-Out</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        },

        async renderTimesheet() {
            const logs = await window.AppAttendance.getLogs();
            return `
                <div class="card full-width">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3>Timesheet Log</h3>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="action-btn secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: #fff1f2; color: #be123c; border: 1px solid #fda4af;" onclick="document.getElementById('leave-modal').style.display = 'flex'">
                                <i class="fa-solid fa-calendar-xmark"></i> Request Leave
                            </button>
                            <button class="action-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem;" onclick="document.dispatchEvent(new CustomEvent('open-log-modal'))">
                                <i class="fa-solid fa-plus"></i> Add log
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Duration</th>
                                    <th>Type</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.length ? logs.map(log => `
                                    <tr>
                                        <td>${log.date}</td>
                                        <td>${log.checkIn}</td>
                                        <td>${log.checkOut || '--'}</td>
                                        <td><span style="background: #eef2ff; color: var(--primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600;">${log.duration || '--'}</span></td>
                                        <td>${log.type || 'Office'}</td>
                                        <td>${log.location}</td>
                                    </tr>
                                `).join('') : `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No logs found</td></tr>`}
                            </tbody>
                        </table>
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
                        <form id="leave-request-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <div style="display: flex; gap: 1rem;">
                                <label style="flex:1">From
                                    <input type="date" name="startDate" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                </label>
                                <label style="flex:1">To
                                    <input type="date" name="endDate" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                </label>
                            </div>
                            <label>Type
                                <select name="type" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Earned Leave">Earned Leave</option>
                                    <option value="Paid Leave">Paid Leave</option>
                                    <option value="Maternity Leave">Maternity Leave</option>
                                    <option value="Regional Holidays">Regional Holidays</option>
                                    <option value="National Holiday">National Holiday</option>
                                    <option value="Holiday">Holiday</option>
                                    <option value="Absent">Absent</option>
                                </select>
                            </label>
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

                
                <div id="edit-user-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <h3>Edit Staff Details</h3>
                        <form id="edit-user-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
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
                                Role/Designation
                                <input type="text" name="role" id="edit-user-role" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                Department
                                <input type="text" name="dept" id="edit-user-dept" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
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
                        <form id="notify-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
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
                        <form id="add-user-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
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
                                Role/Designation
                                <input type="text" name="role" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                Department
                                <input type="text" name="dept" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
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

        async renderProfile() {
            try {
                const user = window.AppAuth.getUser();
                if (!user) return '<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';

                const leaves = await window.AppLeaves.getUserLeaves(user.id);

                // Helper functions (attached to window for gloabl access from onclick)
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
                        <div class="card full-width" style="padding: 0; overflow: hidden; position: relative;">
                            <!-- Banner -->
                            <div style="height: 150px; background: linear-gradient(to right, #4f46e5, #818cf8); position: relative;"></div>
                            
                            <!-- Profile Info -->
                            <div style="padding: 0 2rem 2rem 2rem; display: flex; flex-direction: column; align-items: center; margin-top: -50px;">
                                <div style="position: relative;">
                                    <div class="logo-circle" style="width: 100px; height: 100px; border: 4px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                                        <img src="${user.avatar}" alt="Profile" style="background:#fff;">
                                    </div>
                                    <button onclick="window.app_triggerUpload()" style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" title="Change Photo">
                                        <i class="fa-solid fa-camera" style="font-size: 0.8rem;"></i>
                                    </button>
                                    <input type="file" id="profile-upload" accept="image/*" style="display: none;" onchange="window.app_handlePhotoUpload(this)">
                                </div>
                                
                                <h2 style="margin-top: 1rem; margin-bottom: 0.25rem;">${user.name}</h2>
                                <p class="text-muted" style="font-weight: 500;">${user.role} <span style="margin: 0 0.5rem; color: #d1d5db;">|</span> ${user.dept || 'General'}</p>
                                
                                <span class="badge ${user.status === 'in' ? 'in' : 'out'}" style="margin-top: 1rem;">
                                    ${user.status === 'in' ? '● Currently Online' : '○ Currently Offline'}
                                </span>
                            </div>

                            <!-- Details Grid -->
                            <div style="padding: 2rem; border-top: 1px solid #f3f4f6;">
                                <h3 style="margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--text-main);">Personal Information</h3>
                                <div class="grid-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Login ID</label>
                                        <div style="font-weight: 500; font-family: monospace; background: #f9fafb; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #e5e7eb;">${user.username}</div>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Joining Date</label>
                                        <div style="font-weight: 500;">${user.joinDate || '--'}</div>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Email Address</label>
                                        <div style="font-weight: 500;">${user.email || '--'}</div>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Phone Number</label>
                                        <div style="font-weight: 500;">${user.phone || '--'}</div>
                                    </div>
                                </div>

                                <div style="margin-top: 2.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                    <button class="action-btn" onclick="document.dispatchEvent(new CustomEvent('auth-logout'))" style="background: white; color: #991b1b; border: 1px solid #fecaca; box-shadow: none;">
                                        <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Leave History Section -->
                        <div class="card full-width" style="margin-top: 1.5rem;">
                            <h3>My Leave History</h3>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Dates</th>
                                            <th>Type</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${leaves.length ? leaves.map(l => {
                    let badgeColor = '#f3f4f6'; // Pending (Gray)
                    let textColor = '#374151';
                    if (l.status === 'Approved') { badgeColor = '#dcfce7'; textColor = '#166534'; }
                    if (l.status === 'Rejected') { badgeColor = '#fee2e2'; textColor = '#991b1b'; }

                    return `
                                                <tr>
                                                    <td>${l.startDate} <span style="color:#9ca3af">to</span> ${l.endDate}</td>
                                                    <td>${l.type}</td>
                                                    <td style="color:#6b7280; font-size:0.9rem;">${l.reason}</td>
                                                    <td><span style="background:${badgeColor}; color:${textColor}; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600;">${l.status}</span></td>
                                                </tr>`;
                }).join('') : '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#6b7280;">No leave requests found.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            } catch (e) {
                console.error("Profile Render Error", e);
                return `<div style="padding: 2rem; color: red;">Error loading profile: ${e.message}</div>`;
            }
        },

        async renderAdmin() {
            let allUsers = [];
            try {
                allUsers = await window.AppDB.getAll('users');
            } catch (e) {
                console.error("Failed to fetch users", e);
            }

            return `
                <div class="dashboard-grid">
                    <!-- Stats Overview -->
                     <div class="card" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border: none;">
                        <span style="font-size: 0.8rem; opacity: 0.8; font-weight: 500;">Total Registered Staff</span>
                        <h2 style="font-size: 2.5rem; margin: 0.5rem 0;">${allUsers.length}</h2>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <div style="flex: 1; background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 0.75rem;">
                                <div style="font-size: 1.2rem; font-weight: 700;">${allUsers.filter(u => u.status === 'in').length}</div>
                                <div style="font-size: 0.7rem; opacity: 0.7; text-transform: uppercase;">Active Now</div>
                            </div>
                            <div style="flex: 1; background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 0.75rem;">
                                <div style="font-size: 1.2rem; font-weight: 700;">${allUsers.filter(u => u.role === 'Administrator').length}</div>
                                <div style="font-size: 0.7rem; opacity: 0.7; text-transform: uppercase;">Admins</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                            <div>
                                <h4>System Performance</h4>
                                <p class="text-muted" style="font-size: 0.8rem;">Average activity score</p>
                            </div>
                            <div style="background: #f0fdf4; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">Optimal</div>
                        </div>
                        <div style="height: 100px; display: flex; align-items: flex-end; gap: 8px;">
                            ${[40, 65, 52, 88, 75, 92, 85].map(h => `<div style="flex: 1; background: var(--primary); height: ${h}%; border-radius: 4px 4px 0 0; opacity: 0.8;"></div>`).join('')}
                        </div>
                    </div>

                    <div class="card full-width">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h3>Staff Management</h3>
                            <div style="display: flex; gap: 0.75rem;">
                                <button class="action-btn secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;" onclick="window.app_exportReports()">
                                    <i class="fa-solid fa-file-export"></i> Export CSV
                                </button>
                                <button class="action-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem;" onclick="document.getElementById('add-user-modal').style.display = 'flex'">
                                    <i class="fa-solid fa-user-plus"></i> Add Staff
                                </button>
                            </div>
                        </div>

                         <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Staff Member</th>
                                        <th>Status</th>
                                        <th>Role</th>
                                        <th>Dept.</th>
                                        <th>Last Active</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${allUsers.map(u => `
                                        <tr>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                    <img src="${u.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                                                    <div>
                                                        <div style="font-weight: 600;">${u.name}</div>
                                                        <div style="font-size: 0.75rem; color: #6b7280;">ID: ${u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="status-badge ${u.status === 'in' ? 'in' : 'out'}" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                                    ${u.status === 'in' ? 'Online' : 'Offline'}
                                                </span>
                                            </td>
                                            <td>${u.role}</td>
                                            <td>${u.dept || '--'}</td>
                                            <td style="font-size: 0.85rem; color: #4b5563;">${u.lastCheckIn ? new Date(u.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                                            <td>
                                                <div style="display: flex; gap: 0.5rem;">
                                                     <button onclick="document.dispatchEvent(new CustomEvent('view-user-logs', {detail: '${u.id}'}))" style="padding: 0.4rem; background: #eef2ff; color: #4338ca; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;" title="View Logs"><i class="fa-solid fa-list-check"></i></button>
                                                     <button onclick="document.dispatchEvent(new CustomEvent('open-notify-modal', {detail: {id: '${u.id}', name: '${u.name}'}}))" style="padding: 0.4rem; background: #fff7ed; color: #c2410c; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;" title="Send Notification"><i class="fa-solid fa-bell"></i></button>
                                                     <button onclick="document.dispatchEvent(new CustomEvent('open-edit-modal', {detail: ${JSON.stringify(u).replace(/"/g, '&quot;')}}))" style="padding: 0.4rem; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;" title="Edit Profile"><i class="fa-solid fa-pen"></i></button>
                                                     <button onclick="document.dispatchEvent(new CustomEvent('auth-delete-user', {detail: '${u.id}'}))" style="padding: 0.4rem; background: #fef2f2; color: #b91c1c; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;" title="Delete User"><i class="fa-solid fa-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Chart Section -->
                    <div class="card full-width">
                        <h3>Attendance Trends</h3>
                        <div style="height: 300px; width: 100%; margin-top: 1rem;">
                            <canvas id="admin-stats-chart"></canvas>
                        </div>
                    </div>
                </div>
            `;
        }
    };
})();
