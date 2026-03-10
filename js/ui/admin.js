/**
 * Admin Panel Component
 * Handles rendering of the administrative dashboard, performance trends, and staff management.
 */

import { safeHtml } from './helpers.js';
import { AppConfig } from '../config.js';

export async function renderAdmin(auditStartDate = null, auditEndDate = null) {
    let allUsers = [];
    let pendingLeaves = [];
    let performance = { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0], labels: [] };
    let audits = [];
    let simulationCleanupAudits = [];

    try {
        const today = new Date().toISOString().split('T')[0];
        auditStartDate = auditStartDate || today;
        auditEndDate = auditEndDate || today;

        const results = await Promise.allSettled([
            window.AppDB.getCached
                ? window.AppDB.getCached(window.AppDB.getCacheKey('adminUsers', 'users', {}), (AppConfig?.READ_CACHE_TTLS?.users || 60000), () => window.AppDB.getAll('users'))
                : window.AppDB.getAll('users'),
            window.AppAnalytics.getSystemPerformance(),
            window.AppDB.queryMany
                ? window.AppDB.queryMany('location_audits', [], { orderBy: [{ field: 'timestamp', direction: 'desc' }], limit: 300 }).catch(() => window.AppDB.getAll('location_audits'))
                : window.AppDB.getAll('location_audits'),
            window.AppLeaves.getPendingLeaves(),
            window.AppDB.queryMany
                ? window.AppDB.queryMany('system_audit_logs', [], { orderBy: [{ field: 'createdAt', direction: 'desc' }], limit: 80 }).catch(() => window.AppDB.getAll('system_audit_logs'))
                : window.AppDB.getAll('system_audit_logs')
        ]);

        const readSettled = (idx, fallback, label) => {
            const result = results[idx];
            if (result && result.status === 'fulfilled') return result.value;
            if (result && result.status === 'rejected') {
                console.warn(`Admin data fetch failed for ${label}:`, result.reason);
            }
            return fallback;
        };

        allUsers = readSettled(0, [], 'users');
        performance = readSettled(1, { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0], labels: [] }, 'performance');
        audits = readSettled(2, [], 'location_audits');
        pendingLeaves = readSettled(3, [], 'pending_leaves');
        simulationCleanupAudits = readSettled(4, [], 'system_audit_logs');

        audits = audits.filter(a => {
            const d = new Date(a.timestamp).toISOString().split('T')[0];
            return d >= auditStartDate && d <= auditEndDate;
        }).sort((a, b) => b.timestamp - a.timestamp);

        simulationCleanupAudits = (simulationCleanupAudits || [])
            .filter((row) => row && row.module === 'simulation' && String(row.type || '').startsWith('legacy_dummy_cleanup_'))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
            .slice(0, 25);
    } catch (e) {
        console.error('Failed to fetch admin data', e);
    }

    const activeCount = allUsers.filter(u => u.status === 'in').length;
    const adminCount = allUsers.filter(u => u.role === 'Administrator' || u.isAdmin === true).length;
    const perfStatus = performance.avgScore > 70 ? 'Optimal' : (performance.avgScore > 40 ? 'Good' : 'Low');
    const perfColor = performance.avgScore > 70 ? '#166534' : (performance.avgScore > 40 ? '#854d0e' : '#991b1b');
    const perfBg = performance.avgScore > 70 ? '#f0fdf4' : (performance.avgScore > 40 ? '#fefce8' : '#fef2f2');

    const formatCleanupSummary = (row) => {
        const payload = row && row.payload ? row.payload : {};
        const deleted = payload.deleted || {};
        const configuredTargets = payload.configuredTargets || {};

        if (row.type === 'legacy_dummy_cleanup_completed') {
            return [
                `users=${Number(deleted.users || 0)}`,
                `attendance=${Number(deleted.attendance || 0)}`,
                `leaves=${Number(deleted.leaves || 0)}`,
                `workPlans=${Number(deleted.workPlans || 0)}`
            ].join(', ');
        }

        if (row.type === 'legacy_dummy_cleanup_skipped') {
            const reason = payload.reason || 'unknown';
            const ids = Array.isArray(configuredTargets.ids) ? configuredTargets.ids.length : 0;
            const usernames = Array.isArray(configuredTargets.usernames) ? configuredTargets.usernames.length : 0;
            return `reason=${reason}, targetIds=${ids}, targetUsernames=${usernames}`;
        }

        if (row.type === 'legacy_dummy_cleanup_failed') {
            return String(payload.message || 'Unknown error');
        }

        return '-';
    };

    // UI Handlers
    window.app_applyAuditFilter = async () => {
        const start = document.getElementById('audit-start')?.value;
        const end = document.getElementById('audit-end')?.value;
        const contentArea = document.getElementById('page-content');
        if (contentArea) contentArea.innerHTML = await renderAdmin(start, end);
    };

    return `
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
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

            ${window.app_hasPerm('leaves', 'view') ? `
            <div class="card full-width admin-section-card">
                 <h3 class="admin-section-title">Pending Leave Requests (${pendingLeaves.length})</h3>
                 ${pendingLeaves.length === 0 ? '<p class="text-muted">No pending requests.</p>' : `
                    <div class="table-container">
                        <table class="compact-table">
                            <thead>
                                <tr><th>Date</th><th>Staff</th><th>Type</th><th>Days</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                ${pendingLeaves.map(l => `
                                    <tr>
                                        <td>${new Date(l.startDate).toLocaleDateString()}</td>
                                        <td>${safeHtml(l.userName)}</td>
                                        <td><span class="admin-leave-type-badge">${safeHtml(l.type)}</span></td>
                                        <td>${l.daysCount}</td>
                                        <td>
                                            <div class="admin-leave-actions">
                                                ${window.app_hasPerm('leaves', 'admin') ? `
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${l.id}', 'Approved').then(() => window.app_refreshCurrentPage())" class="admin-btn admin-btn-success">Approve</button>
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${l.id}', 'Rejected').then(() => window.app_refreshCurrentPage())" class="admin-btn admin-btn-danger">Reject</button>
                                                ` : '<span class="text-muted" style="font-size:0.7rem;">View Only</span>'}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                 `}
            </div>
            ` : ''}

            <div class="card admin-performance-card">
                <div class="admin-performance-head">
                    <div>
                        <h4 class="admin-performance-title">System Performance</h4>
                        <p class="text-muted">Avg. Activity: ${performance.avgScore}%</p>
                    </div>
                    <div class="admin-performance-status" style="background:${perfBg}; color:${perfColor};">${perfStatus}</div>
                </div>
                <div class="admin-performance-bars">
                    ${performance.trendData.map(h => `<div class="admin-performance-bar-item"><div class="admin-performance-bar-fill" style="height:${Math.max(h, 5)}%;"></div></div>`).join('')}
                </div>
            </div>

            ${window.app_hasPerm('users', 'view') ? `
            <div class="card full-width">
                <div class="admin-staff-head">
                    <h3 class="admin-staff-title">Staff Management</h3>
                    <div class="admin-staff-head-actions">
                        ${window.app_hasPerm('users', 'admin') ? `<button class="action-btn" onclick="document.getElementById('add-user-modal').style.display='flex'"><i class="fa-solid fa-user-plus"></i> Add Staff</button>` : ''}
                    </div>
                </div>
                 <div class="table-container mobile-table-card">
                    <table>
                        <thead>
                            <tr><th>Staff Member</th><th>Status</th><th>In / Out</th><th>Role / Dept</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${allUsers.map(u => {
        const isLive = u.lastSeen && (Date.now() - u.lastSeen < 120000);
        return `
                                <tr>
                                    <td>
                                        <div class="admin-user-cell">
                                            <img src="${u.avatar}" class="admin-user-avatar">
                                            <div>
                                                <div class="admin-user-name-row">${safeHtml(u.name)} ${isLive ? '<span class="admin-user-live-tag">LIVE</span>' : ''}</div>
                                                <div class="admin-user-id">${safeHtml(u.username)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="status-badge ${u.status === 'in' ? 'in' : 'out'}">${u.status?.toUpperCase()}</span></td>
                                    <td>${u.lastCheckIn ? new Date(u.lastCheckIn).toLocaleTimeString() : '--'} / ${u.lastCheckOut ? new Date(u.lastCheckOut).toLocaleTimeString() : '--'}</td>
                                    <td>${safeHtml(u.role)} / ${safeHtml(u.dept || '--')}</td>
                                    <td>
                                        <div class="admin-row-actions">
                                            <button onclick="window.app_viewLogs('${u.id}')" class="admin-icon-btn"><i class="fa-solid fa-list-check"></i></button>
                                            ${window.app_hasPerm('users', 'admin') ? `<button onclick="window.app_editUser('${u.id}')" class="admin-icon-btn"><i class="fa-solid fa-pen"></i></button>` : ''}
                                        </div>
                                    </td>
                                </tr>`;
    }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3>Security Audits</h3>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <input type="date" id="audit-start" value="${auditStartDate}" style="font-size:0.75rem;">
                        <input type="date" id="audit-end" value="${auditEndDate}" style="font-size:0.75rem;">
                        <button onclick="window.app_applyAuditFilter()" class="action-btn">Filter</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Staff</th><th>Slot</th><th>Time</th><th>Status</th></tr></thead>
                        <tbody>
                            ${audits.length ? audits.map(a => `
                                <tr>
                                    <td>${safeHtml(a.userName)}</td>
                                    <td>${safeHtml(a.slot)}</td>
                                    <td>${new Date(a.timestamp).toLocaleTimeString()}</td>
                                    <td style="color:${a.status === 'Success' ? 'green' : 'red'}">${a.status}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" class="text-center">No audits found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Simulation Cleanup Audit (Debug)</h3>
                    <span class="text-muted" style="font-size:0.75rem;">Last ${simulationCleanupAudits.length} entries</span>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Time</th><th>Event</th><th>Summary</th></tr></thead>
                        <tbody>
                            ${simulationCleanupAudits.length ? simulationCleanupAudits.map(row => `
                                <tr>
                                    <td>${new Date(Number(row.createdAt || 0)).toLocaleString()}</td>
                                    <td>${safeHtml(row.type || '-')}</td>
                                    <td>${safeHtml(formatCleanupSummary(row))}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" class="text-center">No simulation cleanup audit entries found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
}

