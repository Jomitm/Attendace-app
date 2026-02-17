/**
 * Policies Module
 * Handles the rendering and logic for the 'Policies & Benefits' page.
 */
(function () {
    const AppPolicies = {
        currentYear: new Date().getFullYear(),

        async render() {
            const policy = await window.AppLeaves.getPolicy();
            const user = window.AppAuth.getUser();
            const fy = await window.AppLeaves.getFinancialYear();

            let lateCount = 0;
            try {
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(today.setDate(diff));
                monday.setHours(0, 0, 0, 0);

                const dateStr = monday.toISOString().split('T')[0];
                const allLogs = await window.AppDB.getAll('attendance');
                const userLogs = allLogs.filter(l => l.user_id === user.id && l.date >= dateStr);

                lateCount = userLogs.filter(l => {
                    if (!l.checkIn) return false;
                    const [h, m] = l.checkIn.split(':').map(Number);
                    return (h > 9) || (h === 9 && m > 15);
                }).length;
            } catch (e) {
                console.warn('Error calc lates', e);
            }

            const balancePromises = Object.keys(policy).map(async type => {
                const usage = await window.AppLeaves.getLeaveUsage(user.id, type, fy);
                return {
                    type,
                    usage,
                    total: policy[type].total,
                    icon: this.getIconForType(type),
                    color: this.getColorForType(type)
                };
            });
            const balances = await Promise.all(balancePromises);

            return `
            <div class="content-container slide-in policies-modern">
                <section class="card policies-hero">
                    <p class="policies-kicker">Policies and Benefits</p>
                    <h1>Work Guidelines at CRWI</h1>
                    <p class="policies-hero-text">
                        Clear leave rules, attendance expectations, and holiday visibility to keep planning simple and fair.
                    </p>
                    <div class="policies-value-row">
                        <span><i class="fa-solid fa-shield-heart"></i> Integrity</span>
                        <span><i class="fa-solid fa-eye"></i> Transparency</span>
                        <span><i class="fa-solid fa-handshake"></i> Accountability</span>
                        <span><i class="fa-solid fa-seedling"></i> Growth</span>
                    </div>
                </section>

                <div class="dashboard-grid">
                    <section class="card full-width policies-balance-card">
                        <div class="policies-row-head">
                            <div>
                                <h2>My Leave Balance</h2>
                                <p class="text-muted">Financial Year ${fy.label}</p>
                            </div>
                            <button onclick="document.getElementById('leave-modal').style.display='flex'" class="action-btn policies-request-btn">
                                <i class="fa-solid fa-paper-plane"></i> Request Leave
                            </button>
                        </div>

                        <div class="policies-late-chip">
                            <div class="policies-late-icon"><i class="fa-solid fa-clock"></i></div>
                            <div>
                                <div class="policies-late-label">Late Arrivals This Week</div>
                                <div class="policies-late-value">${lateCount} <span>/ 3 allowed</span></div>
                            </div>
                        </div>

                        <div class="policies-leave-grid">
                            ${balances.map(b => this.renderLeaveCard(b.type, b, b.icon, b.color)).join('')}
                        </div>
                    </section>

                    <section class="card policies-guidelines">
                        <h3><i class="fa-solid fa-clock"></i> Working at CRWI</h3>
                        <div class="policies-hours-box">
                            <label>Standard Hours</label>
                            <div>9:00 AM - 5:00 PM</div>
                            <p>Monday to Saturday</p>
                        </div>
                        <div class="policies-guidelines-list">
                            <label>Attendance Policy</label>
                            <ul>
                                <li><i class="fa-solid fa-caret-right"></i>Late arrival is marked after <strong>9:15 AM</strong>.</li>
                                <li><i class="fa-solid fa-caret-right"></i>More than <strong>3 late arrivals</strong> in a month leads to a half-day deduction.</li>
                            </ul>
                        </div>
                        <div class="policies-zero-box">
                            <h4><i class="fa-solid fa-triangle-exclamation"></i> Zero Tolerance</h4>
                            <p>CRWI maintains a strict policy on <strong>corruption, harassment, and discrimination</strong>.</p>
                        </div>
                    </section>

                    <section class="card policies-holidays">
                        <div class="policies-row-head">
                            <h3><i class="fa-solid fa-umbrella-beach"></i> Holidays</h3>
                            <div class="policies-year-switch">
                                <button onclick="window.AppPolicies.changeYear(-1)"><i class="fa-solid fa-chevron-left"></i></button>
                                <span id="policy-year-label">${this.currentYear}</span>
                                <button onclick="window.AppPolicies.changeYear(1)"><i class="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div id="holidays-container" class="table-container policies-holidays-table">
                            <table class="compact-table">
                                <thead>
                                    <tr>
                                        <th>Occasion</th>
                                        <th class="text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.renderHolidays(this.currentYear)}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                ${(user.role === 'Administrator' || user.isAdmin) ? await window.AppAdminPolicies.renderPolicyEditor() : ''}
            </div>
            `;
        },

        changeYear(delta) {
            this.currentYear += delta;
            const yearLabel = document.getElementById('policy-year-label');
            const container = document.getElementById('holidays-container');
            if (yearLabel && container) {
                yearLabel.textContent = this.currentYear;
                container.innerHTML = `
                    <table class="compact-table">
                        <thead>
                            <tr>
                                <th>Occasion</th>
                                <th class="text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderHolidays(this.currentYear)}
                        </tbody>
                    </table>
                `;
            }
        },

        getIconForType(type) {
            const icons = {
                'Annual Leave': 'calendar-check',
                'Casual Leave': 'mug-hot',
                'Medical Leave': 'staff-snake',
                'Maternity Leave': 'baby-carriage',
                'Paternity Leave': 'baby',
                'Study Leave': 'graduation-cap',
                'Compassionate Leave': 'hand-holding-heart',
                'Short Leave': 'clock'
            };
            return icons[type] || 'file-circle-check';
        },

        getColorForType(type) {
            const colors = {
                'Annual Leave': '#0f766e',
                'Casual Leave': '#ea580c',
                'Medical Leave': '#dc2626',
                'Maternity Leave': '#be185d',
                'Paternity Leave': '#1d4ed8',
                'Study Leave': '#6d28d9',
                'Compassionate Leave': '#9333ea',
                'Short Leave': '#475569'
            };
            return colors[type] || '#64748b';
        },

        renderLeaveCard(title, balance, icon, color) {
            const percentage = Math.min(100, (balance.usage / balance.total) * 100);
            return `
            <div class="policies-leave-item">
                <div class="policies-leave-bg-icon" style="color:${color};"><i class="fa-solid fa-${icon}"></i></div>
                <h4>${title}</h4>
                <div class="policies-leave-count">
                    <span>${balance.total - balance.usage}</span>
                    <small>/ ${balance.total}</small>
                </div>
                <div class="policies-leave-bar"><div style="width:${percentage}%; background:${color};"></div></div>
                <div class="policies-leave-used">${balance.usage} used</div>
            </div>
            `;
        },

        renderHolidays(year) {
            const commonHolidays = [
                { name: 'Republic Day', date: `${year}-01-26`, type: 'National' },
                { name: 'Independence Day', date: `${year}-08-15`, type: 'National' },
                { name: 'Gandhi Jayanti', date: `${year}-10-02`, type: 'National' },
                { name: 'Christmas', date: `${year}-12-25`, type: 'Regional' }
            ];

            let variableHolidays = [];
            if (year === 2024) {
                variableHolidays = [
                    { name: 'Maha Shivaratri', date: '2024-03-08', type: 'Regional' },
                    { name: 'Holi', date: '2024-03-25', type: 'Regional' },
                    { name: 'Good Friday', date: '2024-03-29', type: 'Regional' },
                    { name: 'Id-ul-Fitr', date: '2024-04-11', type: 'Regional' },
                    { name: 'Ram Navami', date: '2024-04-17', type: 'Regional' },
                    { name: 'Janmashtami', date: '2024-08-26', type: 'Regional' },
                    { name: 'Dussehra', date: '2024-10-12', type: 'Regional' },
                    { name: 'Diwali', date: '2024-11-01', type: 'Regional' }
                ];
            } else if (year === 2025) {
                variableHolidays = [
                    { name: 'Maha Shivaratri', date: '2025-02-26', type: 'Regional' },
                    { name: 'Holi', date: '2025-03-14', type: 'Regional' },
                    { name: 'Good Friday', date: '2025-04-18', type: 'Regional' },
                    { name: 'Id-ul-Fitr', date: '2025-03-31', type: 'Regional' },
                    { name: 'Dussehra', date: '2025-10-02', type: 'Regional' },
                    { name: 'Diwali', date: '2025-10-20', type: 'Regional' }
                ];
            }

            const allHolidays = [...commonHolidays, ...variableHolidays].sort((a, b) => new Date(a.date) - new Date(b.date));

            if (allHolidays.length === 0) {
                return `<tr><td colspan="2" class="policies-empty-holiday">No holiday data available for ${year}</td></tr>`;
            }

            return allHolidays.map(h => {
                const dateObj = new Date(h.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `
                <tr>
                    <td>
                        <div class="policies-holiday-name">${h.name}</div>
                        ${h.type === 'National' ? '<span class="policies-holiday-chip">Compulsory</span>' : ''}
                    </td>
                    <td class="policies-holiday-date">${dateStr}</td>
                </tr>
            `;
            }).join('');
        }
    };

    window.AppPolicies = AppPolicies;
})();
