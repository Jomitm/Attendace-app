/**
 * Minutes UI Component
 * Handles rendering of meeting minutes, action items, and approval workflows.
 */

import { safeHtml, safeAttr } from './helpers.js';
import { renderYearlyPlan } from './team-schedule.js';

export async function renderMinutes() {
    const minutes = await window.AppMinutes.getMinutes();
    const allUsers = window.AppDB?.getAll ? await window.AppDB.getAll('users') : [];
    const currentUser = window.AppAuth.getUser();
    const calendarPlans = window.AppCalendar ? await window.AppCalendar.getPlans() : { leaves: [], events: [], work: [] };

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
                // Uncheck all attendees in grid
                document.querySelectorAll('.attendee-grid input[type="checkbox"]').forEach(cb => cb.checked = false);
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
        document.querySelectorAll('.attendee-item-modern').forEach(item => {
            const name = (item.dataset.name || '').toLowerCase();
            item.style.display = name.includes(q) ? 'flex' : 'none';
        });
    };

    window.app_filterMinutes = (query) => {
        const q = query.toLowerCase();
        document.querySelectorAll('.minute-card-modern').forEach(card => {
            const title = card.querySelector('.card-title-modern')?.textContent.toLowerCase() || '';
            const date = card.querySelector('.card-date-badge')?.textContent.toLowerCase() || '';
            card.style.display = (title.includes(q) || date.includes(q)) ? 'flex' : 'none';
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
            return `
                <div class="chip-modern">
                    <span>${safeHtml(user?.name || user?.username || 'Unknown')}</span>
                    <i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${id}')"></i>
                </div>
            `;
        }).join('');
    };

    window.app_removeAttendee = (id) => {
        selectedAttendeeIds.delete(id);
        const checkbox = document.querySelector(`.attendee-item-modern input[value="${id}"]`);
        if (checkbox) checkbox.checked = false;
        window.app_refreshAttendeeChips();
    };

    window.app_addActionItemRow = () => {
        const container = document.getElementById('action-items-container');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'action-item-row-card';
        row.innerHTML = `
            <div class="field-group">
                <input type="text" placeholder="What needs to be done?" class="input-premium action-task">
            </div>
            <div class="field-group">
                <select class="input-premium action-assignee">
                    <option value="">Assignee...</option>
                    ${allUsers.map(u => `<option value="${u.id}">${safeHtml(u.name || u.username)}</option>`).join('')}
                </select>
            </div>
            <div class="field-group">
                <input type="date" class="input-premium action-due" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="icon-btn-danger" style="background:#fee2e2; color:#ef4444; border:none; width:40px; height:40px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        container.appendChild(row);
    };

    window.app_submitNewMinutes = async () => {
        const title = document.getElementById('new-minute-title').value.trim();
        const date = document.getElementById('new-minute-date').value;
        const content = document.getElementById('new-minute-content').value.trim();
        const attendeeIds = Array.from(selectedAttendeeIds);
        const actionItems = Array.from(document.querySelectorAll('.action-item-row-card')).map(row => ({
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
        <div class="minutes-container">
            <style>
                :root {
                    --minutes-primary: #4f46e5;
                    --minutes-secondary: #6366f1;
                    --minutes-bg: #f8fafc;
                    --minutes-card-bg: #ffffff;
                    --minutes-text: #1e293b;
                    --minutes-muted: #64748b;
                    --minutes-border: #e2e8f0;
                    --minutes-success: #10b981;
                    --minutes-danger: #ef4444;
                    --minutes-warning: #f59e0b;
                    --minutes-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
                }

                .minutes-container {
                    padding: 0.5rem;
                    color: var(--minutes-text);
                    font-family: 'Manrope', sans-serif;
                }

                .minutes-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2.5rem;
                    border-bottom: 1px solid var(--minutes-border);
                    padding-bottom: 1.5rem;
                }

                .minutes-header-info h2 {
                    font-family: 'Sora', sans-serif;
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 0.5rem;
                }

                .minutes-header-info p {
                    color: var(--minutes-muted);
                    font-size: 0.95rem;
                }

                .btn-record-meeting {
                    background: var(--minutes-primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                }

                .btn-record-meeting:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                    background: var(--minutes-secondary);
                }

                /* Form Styling */
                .form-glass-card {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 20px;
                    padding: 2.5rem;
                    margin-bottom: 3rem;
                    box-shadow: var(--minutes-shadow);
                    animation: slideDown 0.4s ease-out;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .form-section-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .form-section-header h3 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .field-label {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: var(--minutes-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .input-premium {
                    background: white;
                    border: 2px solid var(--minutes-border);
                    border-radius: 12px;
                    padding: 0.875rem 1rem;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                    outline: none;
                }

                .input-premium:focus {
                    border-color: var(--minutes-primary);
                }

                /* Attendee Picker */
                .attendee-picker-container {
                    background: #f1f5f9;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }

                .attendee-chips-wrapper {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    min-height: 40px;
                }

                .chip-modern {
                    background: var(--minutes-primary);
                    color: white;
                    padding: 0.4rem 0.9rem;
                    border-radius: 999px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                    animation: fadeIn 0.2s ease-out;
                }

                .chip-modern i {
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }

                .chip-modern i:hover {
                    opacity: 1;
                }

                .search-staff-input {
                    width: 100%;
                    background: white;
                    border: 1px solid var(--minutes-border);
                    border-radius: 10px;
                    padding: 0.6rem 1rem;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                }

                .attendee-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 0.75rem;
                    max-height: 200px;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }

                .attendee-item-modern {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: white;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    border: 1px solid var(--minutes-border);
                    cursor: pointer;
                    transition: all 0.2s;
                    user-select: none;
                }

                .attendee-item-modern:hover {
                    border-color: var(--minutes-secondary);
                    background: #f8fafc;
                }

                .attendee-item-modern input {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .attendee-item-modern span {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--minutes-text);
                }

                /* Discussion Area */
                .discussion-area {
                    margin-bottom: 2rem;
                }

                .textarea-premium {
                    width: 100%;
                    min-height: 180px;
                    background: white;
                    border: 2px solid var(--minutes-border);
                    border-radius: 12px;
                    padding: 1.25rem;
                    font-size: 1rem;
                    line-height: 1.6;
                    outline: none;
                    resize: vertical;
                    transition: border-color 0.2s;
                }

                .textarea-premium:focus {
                    border-color: var(--minutes-primary);
                }

                /* Action Items */
                .action-items-section {
                    margin-bottom: 2.5rem;
                }

                .action-item-row-card {
                    display: grid;
                    grid-template-columns: 1fr 200px 160px auto;
                    gap: 1rem;
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--minutes-border);
                    margin-bottom: 0.75rem;
                    align-items: center;
                    animation: slideRight 0.3s ease-out;
                }

                @keyframes slideRight {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .btn-add-task {
                    background: #f1f5f9;
                    color: var(--minutes-primary);
                    border: 2px dashed var(--minutes-primary);
                    padding: 0.75rem;
                    border-radius: 12px;
                    width: 100%;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-add-task:hover {
                    background: #eef2ff;
                    border-style: solid;
                }

                .form-footer-modern {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    border-top: 1px solid var(--minutes-border);
                    padding-top: 2rem;
                }

                .btn-secondary-modern {
                    background: #f1f5f9;
                    color: var(--minutes-muted);
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary-modern:hover {
                    background: #e2e8f0;
                    color: var(--minutes-text);
                }

                .minute-card-modern {
                    background: var(--minutes-card-bg);
                    border-radius: 20px;
                    border: 1px solid var(--minutes-border);
                    padding: 1.75rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .minute-card-modern:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    border-color: var(--minutes-primary);
                }

                .minute-card-status {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                }

                .card-date-badge {
                    display: inline-block;
                    background: #f1f5f9;
                    color: var(--minutes-muted);
                    padding: 0.35rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                }

                .card-title-modern {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 1rem;
                    line-height: 1.4;
                }

                .card-metrics {
                    display: flex;
                    gap: 1.25rem;
                    margin-top: auto;
                    padding-top: 1.5rem;
                    border-top: 1px solid #f1f5f9;
                }

                .metric-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--minutes-muted);
                    font-weight: 600;
                }

                .metric-item i {
                    color: var(--minutes-primary);
                }

                .restricted-tag {
                    background: #fef2f2;
                    color: #991b1b;
                    padding: 1rem;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    text-align: center;
                    margin-top: 1.5rem;
                    font-weight: 600;
                }

                .empty-state-modern {
                    grid-column: 1 / -1;
                    padding: 5rem;
                    text-align: center;
                    background: white;
                    border-radius: 20px;
                    border: 2px dashed var(--minutes-border);
                }

                .empty-state-modern i {
                    font-size: 4rem;
                    color: var(--minutes-border);
                    margin-bottom: 1.5rem;
                }

                .empty-state-modern h4 {
                    font-size: 1.5rem;
                    color: var(--minutes-muted);
                    font-weight: 700;
                }

                @media (max-width: 768px) {
                    .form-row { grid-template-columns: 1fr; gap: 1rem; }
                    .action-item-row-card { grid-template-columns: 1fr; padding: 1.5rem; }
                    .minutes-header-section { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .btn-record-meeting { width: 100%; justify-content: center; }
                }
            </style>

            <div class="minutes-header-section">
                <div class="minutes-header-info">
                    <h2>Meeting Minutes</h2>
                    <p>Document decisions and track team accountability.</p>
                </div>
                <button class="btn-record-meeting" onclick="window.app_toggleNewMinuteForm()">
                    <i class="fa-solid fa-plus-circle"></i>
                    Record Meeting
                </button>
            </div>

            <div id="new-minute-form" class="form-glass-card" style="display:none;">
                <div class="form-section-header">
                    <div style="background: var(--minutes-primary); color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-microphone-lines"></i>
                    </div>
                    <h3>Record New Meeting Details</h3>
                </div>

                <div class="form-row">
                    <div class="field-group">
                        <label class="field-label">Meeting Title</label>
                        <input type="text" id="new-minute-title" class="input-premium" placeholder="e.g. Monthly Strategy Review">
                    </div>
                    <div class="field-group">
                        <label class="field-label">Date</label>
                        <input type="date" id="new-minute-date" class="input-premium" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>

                <div class="field-group" style="margin-bottom: 2rem;">
                    <label class="field-label">Required Approvers & Attendees</label>
                    <div class="attendee-picker-container">
                        <div id="minutes-attendee-chips" class="attendee-chips-wrapper"></div>
                        <div style="position: relative;">
                            <i class="fa-solid fa-search" style="position: absolute; left: 1rem; top: 0.75rem; color: var(--minutes-muted);"></i>
                            <input type="text" placeholder="Search staff members..." oninput="window.app_filterAttendees(this.value)" class="search-staff-input" style="padding-left: 2.75rem;">
                        </div>
                        <div class="attendee-grid">
                            ${allUsers.map(u => `
                                <label class="attendee-item-modern" data-name="${safeAttr(u.name || u.username)}">
                                    <input type="checkbox" value="${u.id}" onchange="window.app_toggleAttendeePick(this)">
                                    <span>${safeHtml(u.name || u.username)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="discussion-area">
                    <label class="field-label" style="margin-bottom: 0.75rem; display: block;">Discussion & Key Decisions</label>
                    <textarea id="new-minute-content" class="textarea-premium" placeholder="Summarize what was discussed and the final decisions made..."></textarea>
                </div>

                <div class="action-items-section">
                    <label class="field-label" style="margin-bottom: 1rem; display: block;">Action Items & Accountability</label>
                    <div id="action-items-container"></div>
                    <button type="button" onclick="window.app_addActionItemRow()" class="btn-add-task">
                        <i class="fa-solid fa-plus-circle"></i>
                        Add New Action Item
                    </button>
                </div>

                <div class="ngo-plans-section">
                    <div class="form-section-header">
                        <i class="fa-solid fa-calendar-star" style="color:#db2777; font-size:1.5rem;"></i>
                        <h3>Schedule NGO Activities</h3>
                    </div>
                    <div class="minutes-calendar-widget-wrapper">
                        ${renderYearlyPlan(calendarPlans)}
                    </div>
                </div>

                <div class="form-footer-modern">
                    <button class="btn-secondary-modern" onclick="window.app_toggleNewMinuteForm()">Dismiss</button>
                    <button class="btn-record-meeting" onclick="window.app_submitNewMinutes()">Create Meeting Record</button>
                </div>
            </div>

            <div class="minutes-list-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; margin-top: 2rem;">
                <h3 style="margin:0; font-family:'Sora'; font-weight:800; color:#0f172a;">Recent Meetings</h3>
                <div style="position: relative; width: 300px;">
                    <i class="fa-solid fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--minutes-muted);"></i>
                    <input type="text" placeholder="Search meetings..." oninput="window.app_filterMinutes(this.value)" class="input-premium" style="padding-left: 2.75rem; width: 100%; padding-top: 0.6rem; padding-bottom: 0.6rem; font-size: 0.9rem;">
                </div>
            </div>

            <div class="minutes-list-container">
                ${minutes.length ? minutes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => {
        const hasAccess = hasMinuteDetailAccess(m);
        const reqStatus = getMinuteRequestStatus(m);
        return `
                        <div class="minute-card-modern ${hasAccess ? 'clickable' : ''}" ${hasAccess ? `onclick="window.app_openMinuteDetails('${m.id}')"` : ''}>
                            <div class="card-date-badge">${new Date(m.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            
                            <div class="minute-card-status">
                                ${m.locked ?
                '<span style="background:#dcfce7; color:#166534; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-lock" style="margin-right:0.35rem;"></i>Locked</span>' :
                '<span style="background:#fff7ed; color:#9a3412; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;">Open</span>'
            }
                            </div>

                            <h4 class="card-title-modern">${safeHtml(m.title)}</h4>
                            
                            <div class="card-metrics">
                                <div class="metric-item">
                                    <i class="fa-solid fa-users"></i>
                                    ${m.attendeeIds?.length || 0} Attendees
                                </div>
                                <div class="metric-item">
                                    <i class="fa-solid fa-check-circle"></i>
                                    ${m.actionItems?.length || 0} Tasks
                                </div>
                            </div>

                            ${!hasAccess ? `
                                <div class="restricted-tag">
                                    <i class="fa-solid fa-shield-halved" style="margin-right: 0.5rem;"></i>
                                    Access Restricted
                                    ${reqStatus === 'pending' ? '<div style="margin-top:0.5rem; font-size:0.7rem; color:#f59e0b;">Request Pending Review</div>' :
                    reqStatus === 'rejected' ? '<div style="margin-top:0.5rem; font-size:0.7rem; color:#ef4444;">Access Denied</div>' :
                        `<button class="mini-btn" style="margin-top:0.75rem; width:100%; border-color:#991b1b; color:#991b1b;" onclick="window.app_requestMinuteAccess('${m.id}')">Request View Access</button>`}
                                </div>
                            ` : ''}
                        </div>
                    `;
    }).join('') : `
                    <div class="empty-state-modern">
                        <i class="fa-solid fa-file-invoice"></i>
                        <h4>No Meeting Minutes Recorded Yet</h4>
                        <p style="color:var(--minutes-muted); margin-top:0.5rem;">Click "Record Meeting" to document your first session.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}


export default renderMinutes;

