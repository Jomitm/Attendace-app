/**
 * Profile Component
 * Handles rendering of user profiles, statistics, and employment details.
 */

import { safeHtml } from './helpers.js';

export async function renderProfile() {
    try {
        const user = window.AppAuth.getUser();
        if (!user) return '<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';

        const isAdmin = user.role === 'Administrator' || user.isAdmin;
        const allUsers = isAdmin ? await window.AppDB.getAll('users') : [];
        const targetProfileId = (isAdmin && window.app_profileTargetUserId) ? window.app_profileTargetUserId : user.id;
        const profileUser = (isAdmin ? (allUsers.find(u => u.id === targetProfileId) || user) : user);

        const deriveEmployeeId = (joinDateRaw, userIdRaw) => {
            const raw = String(joinDateRaw || '').trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'NA';
            const compact = raw.replace(/-/g, '');
            const suffix = String(userIdRaw || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-3) || 'USR';
            return `EMP-${compact}-${suffix}`;
        };

        const profileJoinDate = (typeof profileUser.joinDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(profileUser.joinDate))
            ? profileUser.joinDate
            : '';
        const profileEmployeeId = profileJoinDate
            ? (profileUser.employeeId || deriveEmployeeId(profileJoinDate, profileUser.id))
            : 'NA';

        const [monthlyStats, yearlyStats, leaves] = await Promise.all([
            window.AppAnalytics ? window.AppAnalytics.getUserMonthlyStats(profileUser.id) : null,
            window.AppAnalytics ? window.AppAnalytics.getUserYearlyStats(profileUser.id) : null,
            window.AppLeaves ? window.AppLeaves.getUserLeaves(profileUser.id) : []
        ]);

        // Handlers
        window.app_changeProfileStaff = async (staffId) => {
            window.app_profileTargetUserId = staffId || user.id;
            const contentArea = document.getElementById('page-content');
            if (contentArea) contentArea.innerHTML = await renderProfile();
        };

        window.app_saveProfileEmployment = async () => {
            alert('Staff employment and payroll details are view-only on this profile page.');
        };

        return `
            <div class="profile-container">
                <header class="profile-header card">
                    <div class="profile-cover"></div>
                    <div class="profile-header-content">
                        <div class="profile-avatar-wrap">
                            <img src="${profileUser.avatar || 'https://via.placeholder.com/150'}" alt="${safeHtml(profileUser.name)}" class="profile-avatar">
                            ${isAdmin ? `<button class="avatar-edit-btn" onclick="alert('Avatar editing disabled for security.')"><i class="fa-solid fa-camera"></i></button>` : ''}
                        </div>
                        <div class="profile-info-main">
                            <div class="profile-name-row">
                                <h1>${safeHtml(profileUser.name)}</h1>
                                <span class="profile-badge">${safeHtml(profileUser.role || 'Staff')}</span>
                            </div>
                            <p class="profile-email"><i class="fa-solid fa-envelope"></i> ${safeHtml(profileUser.email)}</p>
                            <div class="profile-meta-tags">
                                <span><i class="fa-solid fa-id-card"></i> ${profileEmployeeId}</span>
                                <span><i class="fa-solid fa-calendar-check"></i> Joined ${profileJoinDate || 'N/A'}</span>
                                ${profileUser.location ? `<span><i class="fa-solid fa-location-dot"></i> ${safeHtml(profileUser.location)}</span>` : ''}
                            </div>
                        </div>
                        ${isAdmin ? `
                        <div class="profile-actions">
                            <select class="staff-picker-select" onchange="window.app_changeProfileStaff(this.value)">
                                <option value="">View Own Profile</option>
                                ${allUsers.map(u => `<option value="${u.id}" ${u.id === targetProfileId ? 'selected' : ''}>${safeHtml(u.name)}</option>`).join('')}
                            </select>
                        </div>
                        ` : ''}
                    </div>
                </header>

                <div class="profile-grid">
                    <div class="profile-main-col">
                        <section class="card profile-section">
                            <div class="section-head">
                                <h3>Performance Highlights</h3>
                                <div class="section-actions">
                                    <button class="icon-btn" title="Refresh Stats"><i class="fa-solid fa-rotate"></i></button>
                                </div>
                            </div>
                            <div class="performance-grid">
                                <div class="perf-card">
                                    <div class="perf-label">Consistency</div>
                                    <div class="perf-value">${monthlyStats?.attendanceRate || '0'}%</div>
                                    <div class="perf-delta positive"><i class="fa-solid fa-arrow-up"></i> 2.4% vs last month</div>
                                </div>
                                <div class="perf-card">
                                    <div class="perf-label">Punctuality</div>
                                    <div class="perf-value">${monthlyStats?.punctualityRate || '0'}%</div>
                                    <div class="perf-delta negative"><i class="fa-solid fa-arrow-down"></i> 0.5% vs last month</div>
                                </div>
                                <div class="perf-card">
                                    <div class="perf-label">Total Hours (MTD)</div>
                                    <div class="perf-value">${monthlyStats?.totalHours || '0'}h</div>
                                    <div class="perf-delta"><i class="fa-solid fa-minus"></i> Stable</div>
                                </div>
                            </div>
                        </section>

                        <section class="card profile-section">
                            <div class="section-head">
                                <h3>Leave Balance & History</h3>
                            </div>
                            <div class="leave-brief-grid">
                                <div class="leave-stat">
                                    <div class="label">Annual Leaves</div>
                                    <div class="bar-wrap"><div class="bar" style="width: 65%;"></div></div>
                                    <div class="text">12 / 18 days used</div>
                                </div>
                                <div class="leave-stat">
                                    <div class="label">Sick Leaves</div>
                                    <div class="bar-wrap"><div class="bar warning" style="width: 20%;"></div></div>
                                    <div class="text">2 / 10 days used</div>
                                </div>
                            </div>
                            <div class="table-container mini-table">
                                <table class="compact-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${leaves.length ? leaves.slice(0, 5).map(l => `
                                            <tr>
                                                <td>${l.startDate}</td>
                                                <td>${safeHtml(l.type)}</td>
                                                <td><span class="status-pill ${l.status?.toLowerCase()}">${l.status}</span></td>
                                            </tr>
                                        `).join('') : '<tr><td colspan="3" class="text-center">No leave history</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <aside class="profile-side-col">
                        <section class="card profile-section">
                            <div class="section-head">
                                <h3>Employment Detail</h3>
                                ${isAdmin ? `<button class="edit-btn-link" onclick="window.app_saveProfileEmployment()">Edit</button>` : ''}
                            </div>
                            <div class="employment-details-list">
                                <div class="detail-item">
                                    <div class="label">Department</div>
                                    <div class="value">${safeHtml(profileUser.department || 'Operations')}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="label">Current Level</div>
                                    <div class="value">${safeHtml(profileUser.level || 'L2 - Senior')}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="label">Reporting To</div>
                                    <div class="value">${safeHtml(profileUser.reportsTo || 'Admin')}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="label">Payroll Cycle</div>
                                    <div class="value">Monthly (25th)</div>
                                </div>
                            </div>
                        </section>

                        <section class="card profile-section">
                            <div class="section-head">
                                <h3>Quick Actions</h3>
                            </div>
                            <div class="quick-actions-grid">
                                <button class="quick-action-btn"><i class="fa-solid fa-file-invoice-dollar"></i> Payslips</button>
                                <button class="quick-action-btn"><i class="fa-solid fa-id-badge"></i> Update ID</button>
                                <button class="quick-action-btn"><i class="fa-solid fa-shield-halved"></i> Security</button>
                                <button class="quick-action-btn"><i class="fa-solid fa-gear"></i> Preferences</button>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Profile Render Error:", err);
        return `<div class="card error-card">Failed to load profile: ${safeHtml(err.message)}</div>`;
    }
}

// Global Exports
if (typeof window !== 'undefined') {
    if (!window.AppUI) window.AppUI = {};
    window.AppUI.renderProfile = renderProfile;
}
