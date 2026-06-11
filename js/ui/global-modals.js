/**
 * Global Modals Component
 * Renders shared modals used across the application.
 */

import { renderCheckoutModal } from './checkout-form.js';

export function renderModals() {
    const user = window.AppAuth?.getUser();
    if (!user) return '';
    const budgetSelectHtml = typeof window.app_renderBudgetHeadOptions === 'function'
        ? window.app_renderBudgetHeadOptions('')
        : '<option value="UNALLOCATED">Unallocated / To Be Mapped</option>';

    return `
        ${renderCheckoutModal(budgetSelectHtml)}

        <!-- Add Log Modal (Modern) -->
        <div id="log-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="width: 100%; max-width: 500px; padding: 0;">
                <div style="padding: 1.5rem; border-bottom: 1px solid #f3f4f6;">
                    <h3 style="margin: 0;">New Time Entry</h3>
                    <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem;">Log past or off-site work</p>
                </div>
                
                <form id="manual-log-form" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
                    <div>
                        <label style="display:block; font-size:0.85rem; font-weight:500; color:#374151; margin-bottom:0.5rem;">Budget Head</label>
                        <select name="budgetHeadId" required style="width:100%; padding:0.75rem; border:1px solid #e5e7eb; border-radius:0.5rem; background:#fff;">
                            ${budgetSelectHtml}
                        </select>
                    </div>
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
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Work Summary</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Work - Home'">🏠 Work - Home</button>
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Training'">🎓 Training</button>
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Client Visit'">🤝 Client Visit</button>
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Field Work'">🚧 Field Work</button>
                        </div>
                        <input type="text" name="workDescription" id="log-location" placeholder="Describe the work done..." required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
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
                            <option value="Half Day">Half Day</option>
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Earned Leave">Earned Leave</option>
                            <option value="Paid Leave">Paid Leave</option>
                            <option value="Maternity Leave">Maternity Leave</option>
                            <option value="Retreat Leave">Retreat Leave</option>
                            <option value="Staff Development Leave">Staff Development Leave</option>
                            <option value="Regional Holidays">Regional Holidays</option>
                            <option value="National Holiday">National Holiday</option>
                            <option value="Holiday">Holiday</option>
                            <option value="Absent">Absent</option>
                            <option value="Work - Home">Work from Home</option>
                        </select>
                    </label>
                    <label>Reason
                        <textarea name="reason" rows="3" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;"></textarea>
                        <div style="margin-top:0.35rem; font-size:0.75rem; color:#92400e; line-height:1.4;">Please mention the reason specifically. If the reason is vague or not clearly mentioned, the leave may not be sanctioned.</div>
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
                        <input type="checkbox" name="isAdmin" id="edit-user-isAdmin" style="width: 1.2rem; height: 1.2rem;" onchange="const sel = document.getElementById('edit-user-role'); if(this.checked) { sel.value = 'Administrator'; } else { if(sel.value === 'Administrator') sel.value = 'Employee'; }">
                        <div style="font-weight: 600; color: #1e40af;">Grant Full Administrator Rights</div>
                    </label>

                    <div id="edit-user-permissions-panel" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-top: 0.5rem;">
                        <div style="font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-shield-halved"></i> Section-Specific Permissions
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem; align-items: center;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Section</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">View Only</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">Full Admin</div>
                            
                            <!-- Dashboard -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Dashboard</div>
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="view" id="edit-perm-dashboard-view">
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="admin" id="edit-perm-dashboard-admin">

                            <!-- Leaves -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Leaves</div>
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="view" id="edit-perm-leaves-view">
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="admin" id="edit-perm-leaves-admin">

                            <!-- Users -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">User Management</div>
                            <input type="checkbox" class="perm-check" data-module="users" data-level="view" id="edit-perm-users-view">
                            <input type="checkbox" class="perm-check" data-module="users" data-level="admin" id="edit-perm-users-admin">

                            <!-- AI Memory -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">AI Memory Sheet</div>
                            <input type="checkbox" name="canAccessStaffAiMemory" id="edit-user-can-access-staff-ai-memory" style="width: 1.1rem; height: 1.1rem;">
                            <div style="font-size: 0.78rem; color: #475569;">Allow this staff member to open the AI memory sheet.</div>

                            <!-- Attendance -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Attendance Sheet</div>
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="view" id="edit-perm-attendance-view">
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="admin" id="edit-perm-attendance-admin">

                            <!-- Reports -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Reports</div>
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="view" id="edit-perm-reports-view">
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="admin" id="edit-perm-reports-admin">

                            <!-- Minutes -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Meeting Minutes</div>
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="view" id="edit-perm-minutes-view">
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="admin" id="edit-perm-minutes-admin">

                            <!-- Policies -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Company Policies</div>
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="view" id="edit-perm-policies-view">
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="admin" id="edit-perm-policies-admin">

                            <!-- Birthday -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Birthday Calendar</div>
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="view" id="edit-perm-birthday-view">
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="admin" id="edit-perm-birthday-admin">

                        </div>
                    </div>
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
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.45rem;">Date of Birth</div>
                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                                <input type="number" name="birthDay" id="edit-user-birth-day" min="1" max="31" placeholder="DD" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                                <input type="number" name="birthMonth" id="edit-user-birth-month" min="1" max="12" placeholder="MM" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                                <input type="number" name="birthYear" id="edit-user-birth-year" min="1900" max="2100" placeholder="YYYY" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                        </div>
                        <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">You can save any one or more birthday fields. Day and month are required only for reminders.</div>
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
                        <input type="checkbox" name="isAdmin" id="add-user-isAdmin" style="width: 1.2rem; height: 1.2rem;" onchange="const sel = document.getElementById('add-user-role'); if(this.checked) { sel.value = 'Administrator'; } else { if(sel.value === 'Administrator') sel.value = 'Employee'; }">
                        <div style="font-weight: 600; color: #1e40af;">Grant Full Administrator Rights</div>
                    </label>

                    <div id="add-user-permissions-panel" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-top: 0.5rem;">
                        <div style="font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-shield-halved"></i> Section-Specific Permissions
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem; align-items: center;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Section</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">View Only</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">Full Admin</div>
                            
                            <!-- Dashboard -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Dashboard</div>
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="view" id="add-perm-dashboard-view">
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="admin" id="add-perm-dashboard-admin">

                            <!-- Leaves -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Leaves</div>
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="view" id="add-perm-leaves-view">
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="admin" id="add-perm-leaves-admin">

                            <!-- Users -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">User Management</div>
                            <input type="checkbox" class="perm-check" data-module="users" data-level="view" id="add-perm-users-view">
                            <input type="checkbox" class="perm-check" data-module="users" data-level="admin" id="add-perm-users-admin">

                            <!-- AI Memory -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">AI Memory Sheet</div>
                            <input type="checkbox" name="canAccessStaffAiMemory" id="add-user-can-access-staff-ai-memory" style="width: 1.1rem; height: 1.1rem;">
                            <div style="font-size: 0.78rem; color: #475569;">Allow this staff member to open the AI memory sheet.</div>

                            <!-- Attendance -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Attendance Sheet</div>
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="view" id="add-perm-attendance-view">
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="admin" id="add-perm-attendance-admin">

                            <!-- Reports -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Reports</div>
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="view" id="add-perm-reports-view">
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="admin" id="add-perm-reports-admin">

                            <!-- Minutes -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Meeting Minutes</div>
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="view" id="add-perm-minutes-view">
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="admin" id="add-perm-minutes-admin">

                            <!-- Policies -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Company Policies</div>
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="view" id="add-perm-policies-view">
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="admin" id="add-perm-policies-admin">

                            <!-- Birthday -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Birthday Calendar</div>
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="view" id="add-perm-birthday-view">
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="admin" id="add-perm-birthday-admin">

                        </div>
                    </div>
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
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.45rem;">Date of Birth</div>
                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                                <input type="number" name="birthDay" min="1" max="31" placeholder="DD" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                                <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                                <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                        </div>
                        <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">You can save any one or more birthday fields. Day and month are required only for reminders.</div>
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
}
