/**
 * Policies Module
 * Handles the rendering and logic for the 'Policies & Benefits' page.
 */
(function () {
    const AppPolicies = {
        currentYear: new Date().getFullYear(),
        holidayCache: null,
        baseline2025: [
            { name: 'Republic Day', date: '2025-01-26', type: 'National' },
            { name: 'Maha Shivaratri', date: '2025-02-26', type: 'Regional' },
            { name: 'Holi', date: '2025-03-14', type: 'Regional' },
            { name: 'Id-ul-Fitr', date: '2025-03-31', type: 'Regional' },
            { name: 'Good Friday', date: '2025-04-18', type: 'Regional' },
            { name: 'Independence Day', date: '2025-08-15', type: 'National' },
            { name: 'Dussehra', date: '2025-10-02', type: 'Regional' },
            { name: 'Gandhi Jayanti', date: '2025-10-02', type: 'National' },
            { name: 'Diwali', date: '2025-10-20', type: 'Regional' },
            { name: 'Christmas', date: '2025-12-25', type: 'Regional' }
        ],

        async render() {
            const policy = await window.AppLeaves.getPolicy();
            const user = window.AppAuth.getUser();
            const fy = await window.AppLeaves.getFinancialYear();
            const isAdmin = !!(user && (user.role === 'Administrator' || user.isAdmin));

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
                    if (l.lateCountable === true) return true;
                    return window.AppAttendance.normalizeType(l.type) === 'Late';
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
            const holidaysTable = await this.renderHolidayTable(this.currentYear, isAdmin);

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
                                <div class="policies-late-value">${lateCount} <span>(${Math.floor(lateCount / 3)} block(s) reached)</span></div>
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
                            <div>9:00 AM - 6:00 PM</div>
                            <p>Monday to Saturday (2nd/4th Saturday Off)</p>
                        </div>
                        <div class="policies-guidelines-list">
                            <label>Attendance Policy</label>
                            <ul>
                                <li><i class="fa-solid fa-caret-right"></i>Late arrival is marked after <strong>9:15 AM</strong>.</li>
                                <li><i class="fa-solid fa-caret-right"></i>Every <strong>3 Late marks</strong> causes a <strong>0.5 day salary deduction</strong> (mandatory).</li>
                                <li><i class="fa-solid fa-caret-right"></i>Final status is decided using check-in band and net worked hours.</li>
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
                        ${isAdmin ? `
                            <div style="display:flex; justify-content:flex-end; margin-bottom:0.5rem;">
                                <button class="action-btn" onclick="window.AppPolicies.openHolidayEditor()">
                                    <i class="fa-solid fa-plus"></i> Add Holiday
                                </button>
                            </div>
                        ` : ''}
                        <div id="holidays-container" class="table-container policies-holidays-table">
                            ${holidaysTable}
                        </div>
                    </section>
                </div>

                ${(isAdmin) ? await window.AppAdminPolicies.renderPolicyEditor() : ''}
            </div>
            `;
        },

        async loadHolidaySettings() {
            if (this.holidayCache) return this.holidayCache;
            const existing = await window.AppDB.get('settings', 'holidays').catch(() => null);
            const cache = existing && existing.byYear
                ? existing
                : { id: 'holidays', byYear: {} };
            this.holidayCache = cache;
            return cache;
        },

        async saveHolidaySettings(settings) {
            const payload = { id: 'holidays', byYear: settings.byYear || {} };
            await window.AppDB.put('settings', payload);
            this.holidayCache = payload;
        },

        buildYearFromBaseline(year) {
            return this.baseline2025.map(h => {
                const mmdd = String(h.date).slice(5);
                return {
                    name: h.name,
                    date: `${year}-${mmdd}`,
                    type: h.type || 'Regional'
                };
            }).sort((a, b) => new Date(a.date) - new Date(b.date));
        },

        async getHolidaysForYear(year, persistIfMissing = true) {
            const settings = await this.loadHolidaySettings();
            const y = String(year);
            if (!Array.isArray(settings.byYear[y]) || settings.byYear[y].length === 0) {
                settings.byYear[y] = this.buildYearFromBaseline(year);
                if (persistIfMissing) await this.saveHolidaySettings(settings);
            }
            return [...settings.byYear[y]].sort((a, b) => new Date(a.date) - new Date(b.date));
        },

        async renderHolidayTable(year, isAdmin) {
            const holidays = await this.getHolidaysForYear(year);
            return `
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th>Occasion</th>
                            <th>Date</th>
                            ${isAdmin ? '<th class="text-right">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderHolidayRows(year, holidays, isAdmin)}
                    </tbody>
                </table>
            `;
        },

        renderHolidayRows(year, holidays, isAdmin) {
            if (!holidays.length) {
                return `<tr><td colspan="${isAdmin ? 3 : 2}" class="policies-empty-holiday">No holiday data available for ${year}</td></tr>`;
            }
            return holidays.map((h, idx) => {
                const dateObj = new Date(h.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `
                <tr>
                    <td>
                        <div class="policies-holiday-name">${h.name}</div>
                        ${h.type === 'National' ? '<span class="policies-holiday-chip">Compulsory</span>' : ''}
                    </td>
                    <td class="policies-holiday-date">${dateStr}</td>
                    ${isAdmin ? `
                        <td class="text-right">
                            <button class="icon-btn" title="Edit" onclick="window.AppPolicies.openHolidayEditor(${idx})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="Delete" onclick="window.AppPolicies.deleteHoliday(${idx})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    ` : ''}
                </tr>
            `;
            }).join('');
        },

        async changeYear(delta) {
            this.currentYear += delta;
            const yearLabel = document.getElementById('policy-year-label');
            const container = document.getElementById('holidays-container');
            const user = window.AppAuth.getUser();
            const isAdmin = !!(user && (user.role === 'Administrator' || user.isAdmin));
            if (yearLabel && container) {
                yearLabel.textContent = this.currentYear;
                container.innerHTML = await this.renderHolidayTable(this.currentYear, isAdmin);
            }
        },

        async openHolidayEditor(index = null) {
            const user = window.AppAuth.getUser();
            if (!user || !(user.role === 'Administrator' || user.isAdmin)) return;
            const year = this.currentYear;
            const holidays = await this.getHolidaysForYear(year);
            const existing = Number.isInteger(index) ? holidays[index] : null;
            const modalId = `holiday-editor-${Date.now()}`;
            const html = `
                <div class="modal-overlay" id="${modalId}" style="display:flex;">
                    <div class="modal-content" style="max-width:460px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                            <h3 style="margin:0;">${existing ? 'Edit Holiday' : 'Add Holiday'} (${year})</h3>
                            <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                        </div>
                        <form onsubmit="window.AppPolicies.saveHoliday(event, ${Number.isInteger(index) ? index : 'null'})">
                            <div style="display:grid; gap:0.55rem;">
                                <div>
                                    <label>Holiday Name</label>
                                    <input id="holiday-name-input" type="text" required value="${existing ? String(existing.name || '').replace(/"/g, '&quot;') : ''}">
                                </div>
                                <div>
                                    <label>Date</label>
                                    <input id="holiday-date-input" type="date" required value="${existing ? existing.date : `${year}-01-01`}">
                                </div>
                                <div>
                                    <label>Type</label>
                                    <select id="holiday-type-input">
                                        <option value="National" ${existing && existing.type === 'National' ? 'selected' : ''}>National</option>
                                        <option value="Regional" ${!existing || existing.type !== 'National' ? 'selected' : ''}>Regional</option>
                                    </select>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.5rem; margin-top:0.85rem;">
                                <button type="button" class="action-btn secondary" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                                <button type="submit" class="action-btn" style="flex:1;">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            if (typeof window.app_showModal === 'function') window.app_showModal(html, modalId);
            else (document.getElementById('modal-container') || document.body).insertAdjacentHTML('beforeend', html);
        },

        async saveHoliday(e, index = null) {
            e.preventDefault();
            const year = this.currentYear;
            const name = (document.getElementById('holiday-name-input')?.value || '').trim();
            const date = (document.getElementById('holiday-date-input')?.value || '').trim();
            const type = (document.getElementById('holiday-type-input')?.value || 'Regional').trim();
            if (!name || !date) {
                alert('Please provide holiday name and date.');
                return;
            }
            if (!date.startsWith(`${year}-`)) {
                alert(`Date must be within ${year}.`);
                return;
            }

            const settings = await this.loadHolidaySettings();
            const y = String(year);
            const list = Array.isArray(settings.byYear[y]) ? [...settings.byYear[y]] : this.buildYearFromBaseline(year);
            const payload = { name, date, type: type === 'National' ? 'National' : 'Regional' };
            if (Number.isInteger(index) && list[index]) list[index] = payload;
            else list.push(payload);
            settings.byYear[y] = list.sort((a, b) => new Date(a.date) - new Date(b.date));
            await this.saveHolidaySettings(settings);

            document.querySelector('.modal-overlay[id^="holiday-editor-"]')?.remove();
            await this.changeYear(0);
        },

        async deleteHoliday(index) {
            const user = window.AppAuth.getUser();
            if (!user || !(user.role === 'Administrator' || user.isAdmin)) return;
            const ok = await window.appConfirm('Delete this holiday from current year?');
            if (!ok) return;

            const year = this.currentYear;
            const settings = await this.loadHolidaySettings();
            const y = String(year);
            const list = Array.isArray(settings.byYear[y]) ? [...settings.byYear[y]] : [];
            if (!list[index]) return;
            list.splice(index, 1);
            settings.byYear[y] = list;
            await this.saveHolidaySettings(settings);
            await this.changeYear(0);
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
        }
    };

    window.AppPolicies = AppPolicies;
})();
