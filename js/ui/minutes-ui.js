/**
 * Minutes UI Component
 * Handles rendering of meeting minutes, action items, and approval workflows.
 */

import { safeHtml, safeJsStr, safeAttr } from './helpers.js';

export async function renderMinutes() {
    const minutes = await window.AppMinutes.getMinutes();
    const allUsers = window.AppDB?.getAll ? await window.AppDB.getAll('users') : [];
    const currentUser = window.AppAuth.getUser();

    // Helper functions
    const hasMinuteDetailAccess = (m, user = currentUser) => {
        if (!m || !user) return false;
        if (window.app_hasPerm('minutes', 'view', user)) return true;
        if (m.createdBy === user.id) return true;
        if ((m.attendeeIds || []).includes(user.id)) return true;
        if ((m.allowedViewers || []).includes(user.id)) return true;
        // Also allow access if assigned a task
        if ((m.actionItems || []).some(a => a.assignedTo === user.id)) return true;
        return false;
    };

    const getMinuteRequestStatus = (m, userId = currentUser.id) => {
        const req = (m.accessRequests || []).find(r => r.userId === userId);
        return req ? req.status : '';
    };

    // State for the form
    let selectedAttendeeIds = new Set();

    // Global UI Handlers
    window.app_toggleNewMinuteForm = () => {
        const form = document.getElementById('new-minute-form');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
            if (form.style.display === 'block') {
                selectedAttendeeIds = new Set();
                window.app_refreshAttendeeChips();
                const container = document.getElementById('action-items-container');
                if (container) { container.innerHTML = ''; window.app_addActionItemRow(); }
            }
        }
    };

    window.app_refreshMinutesView = async () => {
        const page = document.getElementById('page-content');
        if (page) page.innerHTML = await renderMinutes();
    };

    window.app_filterAttendees = (query) => {
        const q = query.toLowerCase();
        document.querySelectorAll('.minutes-attendee-item').forEach(item => {
            const name = item.dataset.name.toLowerCase();
            item.style.display = name.includes(q) ? 'flex' : 'none';
        });
    };

    window.app_toggleAttendeePick = (checkbox) => {
        if (checkbox.checked) selectedAttendeeIds.add(checkbox.value);
        else selectedAttendeeIds.delete(checkbox.value);
        window.app_refreshAttendeeChips();
    };

    window.app_refreshAttendeeChips = () => {
        const container = document.getElementById('minutes-attendee-chips');
        if (!container) return;
        container.innerHTML = Array.from(selectedAttendeeIds).map(id => {
            const user = allUsers.find(u => u.id === id);
            return `<div class="attendee-chip"><span>${safeHtml(user?.name || user?.username || 'Unknown')}</span><i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${id}')"></i></div>`;
        }).join('');
    };

    window.app_removeAttendee = (id) => {
        selectedAttendeeIds.delete(id);
        const checkbox = document.querySelector(`.minutes-attendee-item input[value="${id}"]`);
        if (checkbox) checkbox.checked = false;
        window.app_refreshAttendeeChips();
    };

    window.app_addActionItemRow = () => {
        const container = document.getElementById('action-items-container');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'action-item-row';
        row.innerHTML = `
            <input type="text" placeholder="Task description..." class="action-task">
            <select class="action-assignee">
                <option value="">Assign to...</option>
                ${allUsers.map(u => `<option value="${u.id}">${safeHtml(u.name || u.username)}</option>`).join('')}
            </select>
            <input type="date" class="action-due" value="${new Date().toISOString().split('T')[0]}">
            <button type="button" onclick="this.parentElement.remove()" class="remove-action-btn"><i class="fa-solid fa-trash"></i></button>
        `;
        container.appendChild(row);
    };

    window.app_submitNewMinutes = async () => {
        const title = document.getElementById('new-minute-title').value.trim();
        const date = document.getElementById('new-minute-date').value;
        const content = document.getElementById('new-minute-content').value.trim();
        const attendeeIds = Array.from(selectedAttendeeIds);
        const actionItems = Array.from(document.querySelectorAll('.action-item-row')).map(row => ({
            task: row.querySelector('.action-task').value.trim(),
            assignedTo: row.querySelector('.action-assignee').value,
            dueDate: row.querySelector('.action-due').value,
            status: 'pending'
        })).filter(a => a.task);

        if (!title || !content) return alert("Title and content are required.");
        try {
            await window.AppMinutes.addMinute({ title, date, content, attendeeIds, actionItems });
            alert("Meeting minutes recorded!");
            window.app_refreshMinutesView();
        } catch (error) { alert("Error saving: " + error.message); }
    };

    window.app_requestMinuteAccess = async (id) => {
        try {
            await window.AppMinutes.requestAccess(id);
            alert("Access requested!");
            window.app_refreshMinutesView();
        } catch (error) { alert("Error: " + error.message); }
    };

    window.app_handleMinuteApproval = async (id) => {
        if (!confirm("Are you sure you want to approve these minutes? This will lock the record if you are the last attendee to sign.")) return;
        try {
            await window.AppMinutes.approveMinute(id);
            alert("Minutes approved!");
            window.app_openMinuteDetails(id);
            window.app_refreshMinutesView();
        } catch (error) { alert("Error: " + error.message); }
    };

    window.app_handleActionItemStatus = async (id, index, status) => {
        try {
            await window.AppMinutes.updateActionItemStatus(id, index, status);
            alert(`Task marked as ${status}!`);
            window.app_openMinuteDetails(id);
        } catch (error) { alert("Error: " + error.message); }
    };

    window.app_handleAccessDecision = async (id, userId, status) => {
        try {
            await window.AppMinutes.handleAccessRequest(id, userId, status);
            alert(`Request ${status}!`);
            window.app_openMinuteDetails(id);
        } catch (error) { alert("Error: " + error.message); }
    };

    window.app_openMinuteDetails = async (id) => {
        const minutesList = await window.AppMinutes.getMinutes();
        const m = minutesList.find(item => item.id === id);
        if (!m) return;

        if (!hasMinuteDetailAccess(m)) {
            return alert("Access Restricted. Please request access from the list view.");
        }

        const isAttendee = (m.attendeeIds || []).includes(currentUser.id);
        const hasApproved = m.approvals && m.approvals[currentUser.id];
        const isOwner = m.createdBy === currentUser.id;
        const isAdmin = window.app_hasPerm('minutes', 'admin', currentUser);

        const attendeeApprovals = (m.attendeeIds || []).map(uid => {
            const user = allUsers.find(u => u.id === uid);
            const approved = m.approvals && m.approvals[uid];
            return `
                <div class="approval-chip ${approved ? 'approved' : 'pending'}">
                    <i class="fa-solid fa-${approved ? 'check-circle' : 'clock'}"></i>
                    ${safeHtml(user?.name || 'Unknown')}
                </div>
            `;
        }).join('');

        const actions = (m.actionItems || []).map((a, idx) => {
            const assignee = allUsers.find(u => u.id === a.assignedTo);
            const isAssignedToMe = a.assignedTo === currentUser.id;
            return `
                <div class="detail-action-item">
                    <div class="action-status-dot ${a.status || 'pending'}"></div>
                    <div class="action-main">
                        <strong>${safeHtml(a.task)}</strong>
                        <span class="action-meta">Assigned: ${safeHtml(assignee?.name || 'Unassigned')} | Due: ${a.dueDate || 'N/A'}</span>
                    </div>
                    ${isAssignedToMe && a.status !== 'completed' ? `
                        <div class="action-btns">
                            ${a.status === 'pending' ? `<button class="mini-btn" onclick="window.app_handleActionItemStatus('${m.id}', ${idx}, 'accepted')">Accept</button>` : ''}
                            <button class="mini-btn success" onclick="window.app_handleActionItemStatus('${m.id}', ${idx}, 'completed')">Complete</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        const accessRequests = (m.accessRequests || []).filter(r => r.status === 'pending').map(r => `
            <div class="access-request-row">
                <span>${safeHtml(r.userName)}</span>
                <div class="req-btns">
                    <button class="mini-btn success" onclick="window.app_handleAccessDecision('${m.id}', '${r.userId}', 'approved')">Approve</button>
                    <button class="mini-btn danger" onclick="window.app_handleAccessDecision('${m.id}', '${r.userId}', 'rejected')">Deny</button>
                </div>
            </div>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay" id="minute-detail-modal" style="display:flex;">
                <div class="modal-content minutes-detail-wide">
                    <div class="modal-header">
                        <div>
                            <span class="detail-date">${new Date(m.date).toLocaleDateString()}</span>
                            <h2 style="margin:0; color:#1e1b4b;">${safeHtml(m.title)}</h2>
                        </div>
                        <button onclick="document.getElementById('minute-detail-modal').remove()" class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="main-column">
                                <section>
                                    <label><i class="fa-solid fa-file-lines"></i> Discussion & Decisions</label>
                                    <div class="content-text">${safeHtml(m.content).replace(/\n/g, '<br>')}</div>
                                </section>
                                ${actions ? `
                                <section>
                                    <label><i class="fa-solid fa-list-check"></i> Action Items</label>
                                    <div class="action-items-list">${actions}</div>
                                </section>
                                ` : ''}
                            </div>
                            <div class="side-column">
                                <section>
                                    <label><i class="fa-solid fa-users-check"></i> Approvals</label>
                                    <div class="approvals-stack">${attendeeApprovals || '<p class="empty">No attendees defined</p>'}</div>
                                    ${isAttendee && !hasApproved && !m.locked ? `<button class="action-btn wide" onclick="window.app_handleMinuteApproval('${m.id}')" style="margin-top:1rem;">Approve Minutes</button>` : ''}
                                </section>
                                ${(isOwner || isAdmin) && accessRequests ? `
                                <section class="owner-only">
                                    <label><i class="fa-solid fa-key"></i> Access Requests</label>
                                    <div class="access-requests-list">${accessRequests}</div>
                                </section>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${m.locked ? '<span class="status-locked-msg"><i class="fa-solid fa-lock"></i> Record Locked (All approved)</span>' : ''}
                        <div style="flex:1"></div>
                        <button class="action-btn secondary" onclick="document.getElementById('minute-detail-modal').remove()">Close</button>
                        ${(isOwner || isAdmin) ? `<button class="action-btn danger" onclick="window.app_deleteMinute('${m.id}')">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('modal-container')) {
            const div = document.createElement('div'); div.id = 'modal-container'; document.body.appendChild(div);
        }
        document.getElementById('modal-container').innerHTML = modalHtml;
    };

    window.app_deleteMinute = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await window.AppMinutes.deleteMinute(id);
            document.getElementById('minute-detail-modal')?.remove();
            window.app_refreshMinutesView();
        } catch (error) { alert("Error: " + error.message); }
    };

    return `
        <div class="card full-width minutes-modern">
            <style>
                .minutes-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .minutes-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .minute-item { padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.2s; position: relative; display: flex; flex-direction: column; }
                .minute-item.clickable { cursor: pointer; }
                .minute-item.clickable:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .minute-item.restricted { opacity: 0.8; background: #f8fafc; cursor: default; }
                .minute-item-date { font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem; }
                .minute-item-title { font-size: 1.1rem; color: #1e293b; margin-bottom: 0.8rem; font-weight: 700; }
                .minute-item-meta { display: flex; flex-wrap: wrap; gap: 0.8rem; font-size: 0.8rem; color: #64748b; margin-bottom: 1rem; }
                .minute-item-meta span { display: flex; align-items: center; gap: 4px; }
                
                .restricted-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.8rem; padding: 1rem; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1; }
                .status-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; }
                
                .minutes-attendee-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
                .attendee-chip { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
                .attendee-chip i { cursor: pointer; opacity: 0.7; }
                
                .action-item-row { display: grid; grid-template-columns: 1fr 120px 120px 32px; gap: 0.5rem; margin-bottom: 0.5rem; }
                .minutes-detail-wide { max-width: 800px !important; }
                .detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; }
                .side-column { border-left: 1px solid #f1f5f9; padding-left: 1.5rem; }
                .side-column section { margin-bottom: 2rem; }
                .approvals-stack { display: flex; flex-direction: column; gap: 0.6rem; }
                .approval-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 8px; font-size: 0.85rem; }
                .approval-chip.approved { background: #ecfdf5; color: #065f46; border: 1px solid #bbf7d0; }
                .approval-chip.pending { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
                
                .mini-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-size: 0.75rem; }
                .mini-btn.success { background: #10b981; color: #fff; border-color: #10b981; }
                .mini-btn.danger { background: #ef4444; color: #fff; border-color: #ef4444; }
                
                .status-locked-msg { color: #059669; font-weight: 700; font-size: 0.9rem; }
                .access-request-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.5rem; }
                .req-btns { display: flex; gap: 4px; }
            </style>

            <div class="minutes-header">
                <div>
                    <h3>Meeting Minutes</h3>
                    <p>Track decisions and action items from team meetings.</p>
                </div>
                ${window.app_hasPerm('minutes', 'admin') ? `<button class="action-btn" onclick="window.app_toggleNewMinuteForm()"><i class="fa-solid fa-plus"></i> New Minutes</button>` : ''}
            </div>

            <div id="new-minute-form" style="display:none; margin-bottom:2rem; padding:1.5rem; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:12px;">
                <!-- Copy of previous form with better attendee picker -->
                <h4 style="margin-bottom:1rem; color:#1e1b4b;">Record New Meeting</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                    <div><label class="form-label">Title</label><input type="text" id="new-minute-title" class="form-input" placeholder="e.g. Sales Sync"></div>
                    <div><label class="form-label">Date</label><input type="date" id="new-minute-date" class="form-input" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label class="form-label">Attendees (Required Approvers)</label>
                    <div class="attendee-picker-wrap">
                        <div id="minutes-attendee-chips" class="minutes-attendee-chips"></div>
                        <input type="text" placeholder="Search staff..." oninput="window.app_filterAttendees(this.value)" class="form-input-minimal">
                        <div class="minutes-attendee-list">
                            ${allUsers.map(u => `<label class="minutes-attendee-item" data-name="${safeAttr(u.name || u.username)}"><input type="checkbox" value="${u.id}" onchange="window.app_toggleAttendeePick(this)"><span>${safeHtml(u.name || u.username)}</span></label>`).join('')}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label class="form-label">Discussion & Decisions</label>
                    <textarea id="new-minute-content" class="form-input" style="min-height:120px;" placeholder="Document what was decided..."></textarea>
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label class="form-label">Action Items</label>
                    <div id="action-items-container"></div>
                    <button type="button" onclick="window.app_addActionItemRow()" class="minutes-add-task-btn"><i class="fa-solid fa-plus-circle"></i> Add Task</button>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid #cbd5e1; padding-top:1rem;">
                    <button class="action-btn secondary" onclick="window.app_toggleNewMinuteForm()">Cancel</button>
                    <button class="action-btn" onclick="window.app_submitNewMinutes()">Create Record</button>
                </div>
            </div>

            <div class="minutes-list-grid">
                ${minutes.length ? minutes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => {
        const hasAccess = hasMinuteDetailAccess(m);
        const reqStatus = getMinuteRequestStatus(m);
        return `
                        <div class="minute-item ${hasAccess ? 'clickable' : 'restricted'}" ${hasAccess ? `onclick="window.app_openMinuteDetails('${m.id}')"` : ''}>
                            <div class="minute-item-date">${new Date(m.date).toLocaleDateString()}</div>
                            <h4 class="minute-item-title">${safeHtml(m.title)}</h4>
                            <div class="minute-item-meta">
                                <span><i class="fa-solid fa-users"></i> ${m.attendeeIds?.length || 0} attendees</span>
                                ${hasAccess ? `<span><i class="fa-solid fa-list-check"></i> ${m.actionItems?.length || 0} tasks</span>` : ''}
                                ${m.locked ? '<span style="color:#059669"><i class="fa-solid fa-lock"></i> Locked</span>' : ''}
                            </div>
                            ${!hasAccess ? `
                                <div class="restricted-overlay">
                                    <span style="font-size:0.75rem; color:#64748b; text-align:center;">You were not an attendee.</span>
                                    ${reqStatus === 'pending' ? '<span class="status-badge pending">Request Pending</span>' :
                    reqStatus === 'rejected' ? '<span class="status-badge danger">Access Denied</span>' :
                        `<button class="mini-btn" onclick="window.app_requestMinuteAccess('${m.id}')">Request Access</button>`}
                                </div>
                            ` : ''}
                        </div>
                    `;
    }).join('') : '<div class="empty-state">No meeting minutes recorded yet.</div>'}
            </div>
        </div>
    `;
}

// Global Exports
if (typeof window !== 'undefined') {
    if (!window.AppUI) window.AppUI = {};
    window.AppUI.renderMinutes = renderMinutes;
}
export default renderMinutes;
