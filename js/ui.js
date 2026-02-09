/**
 * UI Module
 * Handles all purely visual rendering.
 * (Converted to IIFE for file:// support)
 */
(function () {
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
            const [status, logs, monthlyStats, yearlyStats, heroData, calendarPlans, staffActivities, pendingLeaves, allUsers] = await Promise.all([
                window.AppAttendance.getStatus(),
                window.AppAttendance.getLogs(targetStaffId),
                window.AppAnalytics.getUserMonthlyStats(targetStaffId),
                window.AppAnalytics.getUserYearlyStats(targetStaffId),
                window.AppAnalytics.getHeroOfTheWeek(),
                window.AppCalendar ? window.AppCalendar.getPlans() : { leaves: [], events: [] },
                window.AppAnalytics.getAllStaffActivities(7),
                isAdmin ? window.AppLeaves.getPendingLeaves() : Promise.resolve([]),
                isAdmin ? window.AppDB.getAll('users') : Promise.resolve([])
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
                        <!-- Header -->
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div>
                                <h4 style="margin:0; font-size:1rem; color:#1f2937;">${title}</h4>
                                <span style="font-size:0.7rem; color:#6b7280; margin-top:0.15rem; display:block;">${subtitle}</span>
                            </div>
                            ${penaltyBadge}
                        </div>

                        <!-- Time Stats -->
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

                        <!-- Breakdown -->
                        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: start;">
                            ${renderBreakdown(statsObj.breakdown)}
                        </div>
                    </div>
                `;
            };

            window.app_changeSummaryStaff = (staffId) => {
                window.app_selectedSummaryStaffId = staffId;
                this.renderDashboard().then(html => {
                    const contentArea = document.getElementById('page-content');
                    if (contentArea) {
                        contentArea.innerHTML = html;
                        if (window.setupDashboardEvents) window.setupDashboardEvents();
                    }
                });
            };

            // NEW: Activity Report Widget Helper
            const renderActivityReport = (logs) => {
                // Default: Current Month
                const today = new Date();
                const startDefault = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                const endDefault = today.toISOString().split('T')[0];

                return `
                    <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column;">
                        <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                             <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Activity Log</h4>
                             <span style="font-size:0.7rem; color:#6b7280;">Work Descriptions</span>
                        </div>

                        <!-- Filters -->
                         <div style="display:flex; gap:0.4rem; margin-bottom:0.75rem; align-items:center;">
                            <input type="date" id="act-start" value="${startDefault}" style="border:1px solid #e5e7eb; border-radius:4px; padding:3px; font-size:0.75rem; width:100px;">
                            <span style="color:#9ca3af; font-size:0.75rem;">to</span>
                            <input type="date" id="act-end" value="${endDefault}" style="border:1px solid #e5e7eb; border-radius:4px; padding:3px; font-size:0.75rem; width:100px;">
                            <button onclick="window.app_filterActivity()" style="background:var(--primary); color:white; border:none; border-radius:4px; padding:3px 6px; font-size:0.75rem; cursor:pointer;">Go</button>
                        </div>

                        <!-- Report Content (Scrollable) -->
                        <div id="activity-list" style="flex:1; overflow-y:auto; min-height: 150px; max-height: 300px; font-size:0.8rem; padding-right:5px;">
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
                    const d = new Date(l.date);
                    const desc = l.workDescription || (l.location && !l.location.startsWith('Lat:') ? l.location : 'Standard Activity');
                    l._displayDesc = desc;
                    return d >= start && d <= end;
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

            // NEW: Staff Activity Widget Helper
            const renderStaffActivityWidget = (allStaffLogs) => {
                // Calculate yesterday's date
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                // Initialize auto-scroll after render
                setTimeout(() => {
                    const container = document.getElementById('staff-activity-list');
                    if (container) this.initStaffActivityScroll(container);
                }, 500);

                return `
                <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column; max-height: 400px;">
                    <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                         <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Team Activities</h4>
                         <span style="font-size:0.7rem; color:#6b7280;">Previous Day's Work</span>
                    </div>

                    <!-- Filter Buttons -->
                    <div style="display:flex; gap:0.4rem; margin-bottom:0.75rem;">
                        <button onclick="window.app_filterStaffActivity(1)" class="chip-btn" style="font-size:0.7rem; padding:0.3rem 0.6rem;">Yesterday</button>
                        <button onclick="window.app_filterStaffActivity(3)" class="chip-btn" style="font-size:0.7rem; padding:0.3rem 0.6rem;">Last 3 Days</button>
                        <button onclick="window.app_filterStaffActivity(7)" class="chip-btn" style="font-size:0.7rem; padding:0.3rem 0.6rem;">Last Week</button>
                    </div>

                    <!-- Scrollable List with Auto-Scroll -->
                    <div id="staff-activity-list" style="flex:1; overflow-y:auto; font-size:0.8rem; padding-right:5px; scroll-behavior: smooth;">
                        ${renderStaffActivityList(allStaffLogs, 1)}
                    </div>
                </div>
            `;
            };

            // Global Helper for filtering staff activities
            window.app_filterStaffActivity = (daysBack) => {
                const list = document.getElementById('staff-activity-list');
                if (!list) return;

                window.AppAnalytics.getAllStaffActivities(daysBack).then(logs => {
                    list.innerHTML = renderStaffActivityList(logs, daysBack);
                    this.initStaffActivityScroll(list);
                });
            };

            // NEW: Unified Scroll Helper (Ping-Pong behavior)
            this.initStaffActivityScroll = (container) => {
                if (!container) return;

                // Clear existing scroll interval
                if (window.staffActivityScrollInterval) {
                    clearInterval(window.staffActivityScrollInterval);
                    window.staffActivityScrollInterval = null;
                }

                let scrollInterval;
                let isPaused = false;
                let direction = 1; // 1 = down, -1 = up
                let isWaiting = false;

                const startAutoScroll = () => {
                    scrollInterval = setInterval(() => {
                        if (!isPaused && !isWaiting && container) {
                            const maxScroll = container.scrollHeight - container.clientHeight;

                            if (maxScroll <= 0) return; // Nothing to scroll

                            container.scrollTop += direction;

                            // Bottom hit
                            if (direction === 1 && container.scrollTop >= maxScroll) {
                                isWaiting = true;
                                setTimeout(() => {
                                    direction = -1;
                                    isWaiting = false;
                                }, 2000); // Wait 2s at bottom
                            }
                            // Top hit
                            else if (direction === -1 && container.scrollTop <= 0) {
                                isWaiting = true;
                                setTimeout(() => {
                                    direction = 1;
                                    isWaiting = false;
                                }, 1500); // Wait 1.5s at top
                            }
                        }
                    }, 50);
                };

                // Pause on hover
                const onMouseEnter = () => isPaused = true;
                const onMouseLeave = () => isPaused = false;

                // Clean up listeners if re-initializing on the same element
                container.removeEventListener('mouseenter', onMouseEnter);
                container.removeEventListener('mouseleave', onMouseLeave);

                container.addEventListener('mouseenter', onMouseEnter);
                container.addEventListener('mouseleave', onMouseLeave);

                startAutoScroll();
                window.staffActivityScrollInterval = scrollInterval;
            };

            // Internal Helper to render staff activity list
            const renderStaffActivityList = (allLogs, daysBack) => {
                // Filter by days back
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysBack);
                cutoffDate.setHours(0, 0, 0, 0);

                const filtered = allLogs.filter(log => {
                    const logDate = new Date(log.date);
                    return logDate >= cutoffDate;
                });

                if (filtered.length === 0) {
                    return '<div style="color:#9ca3af; text-align:center; padding:1rem;">No team activities found.</div>';
                }

                let html = '';
                let lastDate = '';

                filtered.forEach(log => {
                    const showDate = log.date !== lastDate;
                    if (showDate) {
                        html += `<div style="font-weight:600; color:#374151; background:#f9fafb; padding:4px 8px; border-radius:4px; margin-top:0.75rem; margin-bottom:0.25rem; font-size:0.8rem;">${log.date}</div>`;
                        lastDate = log.date;
                    }

                    html += `
                    <div style="margin-left:0.5rem; padding-left:0.75rem; border-left:2px solid #e5e7eb; margin-bottom:0.5rem;">
                        <div style="font-weight:600; color:var(--primary); font-size:0.8rem;">${log.staffName}</div>
                        <div style="white-space: pre-wrap; color:#4b5563; font-size:0.85rem; margin-top:2px;">${log._displayDesc}</div>
                        <div style="font-size:0.7rem; color:#9ca3af; margin-top:2px;">${log.checkOut || 'Checked Out'}</div>
                    </div>
                 `;
                });
                return html;
            };

            // NEW: Work Plan Calendar Widget (Shared)
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
                             ${user.role === 'Administrator' || user.isAdmin ? `<button onclick="window.app_openEventModal()" style="background:none; border:none; color:var(--primary); cursor:pointer;"><i class="fa-solid fa-plus-circle"></i></button>` : ''}
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

            const heroHTML = this.renderHeroCard(heroData);

            const staffSelectionHTML = isAdmin ? `
                <div class="card full-width" style="padding: 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fa-solid fa-users-viewfinder" style="color: var(--primary); font-size: 1.2rem;"></i>
                        <div>
                            <h4 style="margin: 0; font-size: 0.95rem;">Viewing Summary For</h4>
                            <p style="margin: 0; font-size: 0.75rem; color: #64748b;">Select a staff member to see their stats</p>
                        </div>
                    </div>
                    <select onchange="window.app_changeSummaryStaff(this.value)" style="padding: 0.5rem; border-radius: 8px; border: 1px solid #cbd5e1; min-width: 200px; font-weight: 500; cursor: pointer;">
                        <option value="${user.id}">My Own Summary (Self)</option>
                        <optgroup label="Staff Members">
                            ${(allUsers || []).filter(u => u.id !== user.id).sort((a, b) => a.name.localeCompare(b.name)).map(u => `
                                <option value="${u.id}" ${u.id === targetStaffId ? 'selected' : ''}>${u.name} (${u.dept || 'General'})</option>
                            `).join('')}
                        </optgroup>
                    </select>
                </div>
            ` : '';

            let summaryHTML = '';

            if (isAdmin) {
                summaryHTML = `
                    <!-- Admin Top Section: Leave Requests + Team Schedule/Hero -->
                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; grid-column: 1 / -1; margin-bottom: 1rem;">
                        <!-- Left Column: Leave Requests (Flex 2 = ~66%) -->
                        <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">
                            ${this.renderLeaveRequests(pendingLeaves)}
                        </div>

                        <!-- Right Column: Team Schedule & Hero (Flex 1 = ~33%, same as widgets below) -->
                        <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">
                            ${renderYearlyPlan(calendarPlans)}
                            ${heroHTML}
                        </div>
                    </div>

                    ${staffSelectionHTML}

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; align-items: start; grid-column: 1 / -1;">
                        ${renderStatsCard(targetStaffId === user.id ? monthlyStats.label : `${monthlyStats.label} (Staff)`, 'Monthly Stats', monthlyStats)}
                        ${renderStatsCard('Yearly Summary', targetStaffId === user.id ? yearlyStats.label : `${yearlyStats.label} (Staff)`, yearlyStats)}
                    </div>
                `;
            } else {
                // STAFF SPECIFIC LAYOUT: 3-Column Row
                summaryHTML = `
                    <!-- Staff Section: Summary, Team Activities, and Schedule side-by-side -->
                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; grid-column: 1 / -1; margin-bottom: 2rem; align-items: stretch;">
                        
                        <!-- Column 1: Summaries -->
                        <div style="flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 1rem;">
                            <div style="flex: 1; display: flex; flex-direction: column;">
                                ${renderStatsCard(monthlyStats.label, 'Monthly Stats', monthlyStats)}
                            </div>
                            <div style="flex: 1; display: flex; flex-direction: column;">
                                ${renderStatsCard('Yearly Summary', yearlyStats.label, yearlyStats)}
                            </div>
                        </div>

                        <!-- Column 2: Team Activities (Middle) -->
                        <div style="flex: 1.1; min-width: 300px; display: flex; flex-direction: column;">
                            ${renderStaffActivityWidget(staffActivities)}
                        </div>

                        <!-- Column 3: Team Schedule (Calendar) + Hero -->
                        <div style="flex: 1.2; min-width: 320px; display: flex; flex-direction: column;">
                            ${renderYearlyPlan(calendarPlans)}
                            <div style="margin-top: 1rem;">
                                ${heroHTML}
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="dashboard-grid">
                    <div class="card welcome-card full-width" style="background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); position: relative; overflow: hidden; min-height: 120px; display: flex; align-items: center; padding: 1.25rem;">
                        <!-- Premium Background Decorations -->
                        <div style="position: absolute; top: -30px; right: -30px; width: 180px; height: 180px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -50px; left: -20px; width: 120px; height: 120px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
                        
                        <div style="position: relative; z-index: 1; flex: 1;">
                            <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Good Afternoon, ${user.name}</h2>
                            <p style="opacity: 0.9; margin-top: 0.35rem; font-size: 0.9rem;">Welcome back! Ready to start your productive day?</p>
                        </div>
                        <div class="welcome-icon" style="position: relative; z-index: 1;">
                            <i class="fa-solid fa-cloud-sun" style="font-size: 3rem; color: #fbbf24; filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));"></i>
                        </div>
                    </div>


                    ${notifHTML}

                    <!-- Top Widgets Row: Timer, Recent Activity, Activity Log -->
                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; grid-column: 1 / -1; margin-bottom: 1rem; align-items: stretch;">
                        
                        <!-- 1. Check-in Timer Widget -->
                        <div class="card check-in-widget" style="flex: 1; min-width: 280px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; background: white; border: 1px solid #eef2ff;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;">
                                <div style="position: relative;">
                                    <img src="${user.avatar}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;">
                                    <div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: ${isCheckedIn ? '#10b981' : '#94a3b8'}; border: 2px solid white;"></div>
                                </div>
                                <div style="text-align: left;">
                                    <h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${user.name}</h4>
                                    <p class="text-muted" style="font-size: 0.75rem; margin: 0;">${user.role}</p>
                                </div>
                            </div>

                            <div style="text-align:center; padding: 0.5rem 0;">
                                <div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">${timerHTML}</div>
                                <div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div>
                            </div>

                            <!-- Progress / Countdown Area -->
                            <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;">
                                 <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;">
                                    <span id="countdown-label">Time to checkout</span>
                                    <span id="countdown-value" style="font-weight: 600;">--:--:--</span>
                                </div>
                                <div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                                    <div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div>
                                </div>
                            </div>

                            <!-- Overtime Alert Area -->
                            <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;">
                                 <div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div>
                                 <div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div>
                            </div>

                            <button class="${btnClass}" id="attendance-btn" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease;">
                                ${btnText} <i class="fa-solid fa-fingerprint"></i>
                            </button>

                            <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;">
                                <i class="fa-solid fa-location-dot"></i> 
                                <span>
                                    ${isCheckedIn && user.currentLocation
                    ? `Lat: ${Number(user.currentLocation.lat).toFixed(4)}, Lng: ${Number(user.currentLocation.lng).toFixed(4)}`
                    : 'Waiting for location...'}
                                </span>
                            </div>
                        </div>

                        <!-- 2. Recent Activity -->
                        <div class="card" style="flex: 1; min-width: 280px; padding: 1.25rem; margin-bottom: 0; display: flex; flex-direction: column; background: white;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                                <h4 style="margin: 0; font-size: 0.95rem; color: #1e1b4b;"><i class="fa-solid fa-history" style="color: #6366f1; margin-right: 6px;"></i> Recent Activity</h4>
                                <a href="#timesheet" onclick="window.location.hash = 'timesheet'; return false;" style="font-size: 0.7rem; color: #4338ca; text-decoration: none; font-weight: 600;">View All</a>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem; flex: 1; overflow-y: auto; max-height: 300px; padding-right: 4px;">
                                ${recentLogs.length > 0 ? recentLogs.slice(0, 3).map(log => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid #f8fafc;">
                                        <div>
                                            <div style="font-size: 0.8rem; font-weight: 600; color: #334155;">${log.date}</div>
                                            <div style="font-size: 0.7rem; color: #64748b;">${log.checkIn} - ${log.checkOut || '<span style="color:#10b981;">Active</span>'}</div>
                                        </div>
                                        <div style="font-size: 0.8rem; font-weight: 700; color: #4338ca; background: #eef2ff; padding: 2px 8px; border-radius: 6px;">${log.duration || '--'}</div>
                                    </div>
                                `).join('') : '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin-top: 1rem;">No recent sessions</p>'}
                            </div>
                        </div>

                        <!-- 3. Activity Log (Compact) -->
                        <div class="card" style="flex: 1; min-width: 280px; padding: 1.25rem; margin-bottom: 0; display: flex; flex-direction: column; background: white;">
                             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                                <h4 style="margin: 0; font-size: 0.95rem; color: #1e1b4b;"><i class="fa-solid fa-clipboard-list" style="color: #6366f1; margin-right: 6px;"></i> Work Log</h4>
                                <div style="display: flex; gap: 4px;">
                                    <input type="date" id="act-start" value="${new Date().toISOString().split('T')[0]}" style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px 4px; font-size: 0.65rem; width: 85px; outline: none;">
                                    <button onclick="window.app_filterActivity()" style="background: #4338ca; color: white; border: none; border-radius: 4px; padding: 2px 6px; font-size: 0.65rem; cursor: pointer;"><i class="fa-solid fa-sync"></i></button>
                                </div>
                            </div>
                            <div id="activity-list" style="flex: 1; overflow-y: auto; max-height: 300px; font-size: 0.75rem; padding-right: 4px;">
                                ${renderActivityList(logs, new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], new Date().toISOString().split('T')[0])}
                            </div>
                        </div>
                    </div>

                    ${summaryHTML}

                    <!-- Full Width Area (If needed for future content) -->
                    <div style="grid-column: 1 / -1; display: grid; gap: 1rem;">
                        <!-- Any future bottom widgets -->
                    </div>
                </div>
            `;
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
                            <div style="padding: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                                <!-- Left: Stats -->
                                <div style="border-right: 1px solid #f3f4f6; padding-right: 2rem;">
                                    <h3 style="font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Performance Stats</h3>
                                    <div class="stat-grid" style="grid-template-columns: repeat(2, 1fr);">
                                        <div class="stat-card">
                                            <div class="label">Monthly Attendance</div>
                                            <div class="value">${monthlyStats.present} <span style="font-size: 0.7rem; color: #6b7280;">Days</span></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="label">Total Leaves (FY)</div>
                                            <div class="value">${yearlyStats.leaves} <span style="font-size: 0.7rem; color: #6b7280;">Days</span></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="label">Monthly Lates</div>
                                            <div class="value" style="color: ${monthlyStats.late > 2 ? 'var(--accent)' : 'var(--text-main)'}">${monthlyStats.late}</div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="label">Work Intensity</div>
                                            <div class="value">${monthlyStats.totalExtraDuration.split(' ')[0]} <span style="font-size: 0.7rem; color: #6b7280;">Extra</span></div>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-radius: var(--radius-md); border: 1px solid #dcfce7; display: flex; align-items: center; gap: 1rem;">
                                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--success); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                            <i class="fa-solid fa-trophy"></i>
                                        </div>
                                        <div>
                                            <div style="font-weight: 700; color: #065f46; font-size: 0.9rem;">Excellent Consistency!</div>
                                            <div style="font-size: 0.75rem; color: #047857;">You are in the top 10% of active staff this month.</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Right: Details & Actions -->
                                <div>
                                    <h3 style="font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Work Details</h3>
                                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                                            <span style="color: #6b7280; font-size: 0.85rem;">Login ID</span>
                                            <span style="font-weight: 600; font-family: monospace;">${user.username}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                                            <span style="color: #6b7280; font-size: 0.85rem;">Email</span>
                                            <span style="font-weight: 600;">${user.email || '--'}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                                            <span style="color: #6b7280; font-size: 0.85rem;">Phone</span>
                                            <span style="font-weight: 600;">${user.phone || '--'}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                                            <span style="color: #6b7280; font-size: 0.85rem;">Joining Date</span>
                                            <span style="font-weight: 600;">${user.joinDate || '--'}</span>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                        <button class="action-btn" onclick="window.AppTour.resetTour('${user.id}')" style="background: white; color: var(--primary); border: 1px solid #c7d2fe; box-shadow: none; padding: 0.5rem; font-size: 0.8rem; width: 100%;">
                                            <i class="fa-solid fa-circle-question"></i> Replay Tour
                                        </button>
                                        <button class="action-btn" onclick="document.dispatchEvent(new CustomEvent('auth-logout'))" style="background: white; color: #991b1b; border: 1px solid #fecaca; box-shadow: none; padding: 0.5rem; font-size: 0.8rem; width: 100%;">
                                            <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Mobile View Adjustment -->
                            <style>
                                @media (max-width: 768px) {
                                    .profile-header-compact { flex-direction: column; text-align: center; gap: 1rem; }
                                    .dashboard-grid > .full-width > div:nth-child(2) { grid-template-columns: 1fr !important; gap: 2rem; }
                                    .dashboard-grid > .full-width > div:nth-child(2) > div:first-child { border-right: none !important; padding-right: 0 !important; border-bottom: 1px solid #f3f4f6; padding-bottom: 2rem; }
                                }
                            </style>
                        </div>

                        <!-- Leave History (More Compact) -->
                        <div class="card full-width" style="margin-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <h3 style="margin: 0; font-size: 1.1rem;">My Leave History</h3>
                                <button class="action-btn secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="document.getElementById('leave-modal').style.display='flex'">
                                    <i class="fa-solid fa-plus"></i> Request Leave
                                </button>
                            </div>
                            <div class="table-container mobile-table-card">
                                <table class="compact-table">
                                    <thead>
                                        <tr style="background: #f9fafb;">
                                            <th>Date Range</th>
                                            <th>Type</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${leaves.length ? leaves.slice(0, 5).map(l => {
                    let badgeColor = '#f3f4f6'; let textColor = '#374151';
                    if (l.status === 'Approved') { badgeColor = '#dcfce7'; textColor = '#166534'; }
                    if (l.status === 'Rejected') { badgeColor = '#fee2e2'; textColor = '#991b1b'; }

                    return `
                                                <tr style="border-bottom: 1px solid #f3f4f6;">
                                                    <td data-label="Dates">
                                                        <div style="font-weight: 600; font-size: 0.85rem;">${l.startDate}</div>
                                                        <div style="font-size: 0.75rem; color: #9ca3af;">to ${l.endDate}</div>
                                                    </td>
                                                    <td data-label="Type" style="font-size: 0.85rem;">${l.type}</td>
                                                    <td data-label="Reason" style="font-size: 0.8rem; color: #6b7280; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${l.reason}">${l.reason}</td>
                                                    <td data-label="Status">
                                                        <span style="background:${badgeColor}; color:${textColor}; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;">${l.status}</span>
                                                        ${l.adminComment ? `<div style="font-size: 0.7rem; color: #4338ca; margin-top: 2px; font-style: italic;">Note: ${l.adminComment}</div>` : ''}
                                                    </td>
                                                </tr>`;
                }).join('') : '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#9ca3af;">No leave history found.</td></tr>'}
                                    </tbody>
                                </table>
                                ${leaves.length > 5 ? `<div style="text-align: center; margin-top: 0.75rem;"><a href="#" style="font-size: 0.8rem; color: var(--primary); font-weight: 600;">View All Requests</a></div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
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

            // Filtered Query for Logs (Optimization)
            const startDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
            const endDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`;
            const logs = await window.AppDB.query('attendance', 'date', '>=', startDateStr);
            // Further filter in memory for end date (or add another query param if we had a complex query method)
            const filteredLogs = logs.filter(l => l.date <= endDateStr);

            // Days in selected month
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            return `
            <div class="dashboard-grid">
                <div class="card full-width">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <div>
                            <h2 style="font-size:1.25rem; margin-bottom:0.15rem;">Attendance Sheet</h2>
                            <p style="color:var(--text-muted); font-size:0.85rem;">Master grid view for all staff logs.</p>
                        </div>
                        <div style="display:flex; gap:0.75rem; align-items:center;">
                            <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.5rem; border-radius:8px; border:1px solid #ddd;">
                                ${monthNames.map((m, i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                            <select onchange="window.app_refreshMasterSheet()" id="sheet-year" style="padding:0.5rem; border-radius:8px; border:1px solid #ddd;">
                                <option value="${currentYear}" selected>${currentYear}</option>
                                <option value="${currentYear - 1}">${currentYear - 1}</option>
                            </select>
                            <button onclick="window.app_exportMasterSheet()" class="action-btn secondary" style="padding:0.5rem 1rem; font-size:0.9rem;">
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
                    const dayLogs = logs.filter(l => (l.userId === u.id || l.user_id === u.id) && l.date === dateStr);

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
                            // Override: Show status but with distinct color (e.g. Purple/Pink) and maybe an indicator
                            cellStyle = 'color: #be185d; font-weight: bold; background: #fdf2f8;'; // Distinct override style
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
                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#0ea5e9; font-weight:bold;">W</span> WFH</div>
                        <div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#be185d; font-weight:bold; background:#fdf2f8; padding:0 3px;">P/A</span> Manual Override</div>
                    </div>
                </div>
            </div>
        `;
        },

        async renderAdmin() {
            let allUsers = [];
            let performance = { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0] };

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
            const perfStatus = performance.avgScore > 70 ? 'Optimal' : (performance.avgScore > 40 ? 'Good' : 'low');
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
                        
                        <!-- Chart Area -->
                        <div style="height: 80px; display: flex; align-items: flex-end; gap: 5px; margin-bottom: 6px;">
                            ${performance.trendData.map((h, i) => {
                const barColor = h > 70 ? 'var(--primary)' : (h > 40 ? '#f59e0b' : '#ef4444');
                const dayLabel = performance.labels ? performance.labels[i] : '';
                return `
                                    <div style="flex: 1; display: flex; flex-direction: column; height: 100%; justify-content: flex-end; align-items: center; gap: 3px;">
                                        <div style="font-size: 0.55rem; font-weight: 700; color: ${barColor};">${h}%</div>
                                        <div style="width: 100%; background: ${barColor}; height: ${Math.max(h, 5)}%; border-radius: 4px 4px 0 0; opacity: 0.8;" title="Score: ${h}%"></div>
                                    </div>
                                `;
            }).join('')}
                        </div>
                        
                        <!-- X-Axis Labels -->
                        <div style="display: flex; gap: 6px; border-top: 1px solid #f3f4f6; padding-top: 4px; margin-bottom: 1rem;">
                             ${(performance.labels || []).map(label => `<div style="flex: 1; text-align: center; font-size: 0.65rem; color: #9ca3af; font-weight: 600;">${label}</div>`).join('')}
                        </div>

                        <!-- Legend -->
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
                const isLive = u.lastSeen && (Date.now() - u.lastSeen < 120000); // 2 minutes window
                const lastIn = u.lastCheckIn ? new Date(u.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
                const lastOut = u.lastCheckOut ? new Date(u.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

                return `
                                        <tr>
                                            <td data-label="Staff">
                                                <div style="display: flex; align-items: center; gap: 0.75rem; justify-content: flex-end;">
                                                    <div style="position: relative;">
                                                        <img src="${u.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                                                        ${isLive ? `<div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid white; border-radius: 50%;" title="Currently Online"></div>` : ''}
                                                    </div>
                                                    <div style="text-align: right;">
                                                        <div style="font-weight: 600; display: flex; align-items: center; gap: 4px; justify-content: flex-end;">
                                                            ${u.name}
                                                            ${isLive ? `<span style="font-size: 0.6rem; background: #f0fdf4; color: #166534; padding: 1px 4px; border-radius: 4px; font-weight: 700;">LIVE</span>` : ''}
                                                        </div>
                                                        <div style="font-size: 0.75rem; color: #6b7280;">ID: ${u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <span class="status-badge ${u.status === 'in' ? 'in' : 'out'}" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                                    ${u.status === 'in' ? 'In' : 'Out'}
                                                </span>
                                            </td>
                                            <td data-label="Logged">
                                                <div style="font-size: 0.85rem; color: #374151; display: flex; flex-direction: column; gap: 2px; align-items: flex-end;">
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
                                                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; align-items: flex-end;">
                                                    <div style="display: flex; align-items: center; gap: 4px;">
                                                        <span style="color: #6b7280; font-weight: 500;">IN:</span>
                                                        ${(() => {
                        const loc = u.currentLocation || u.lastLocation;
                        if (loc && loc.lat && loc.lng) {
                            return `<a href="https://www.google.com/maps?q=${loc.lat},${loc.lng}" target="_blank" style="color:var(--primary); text-decoration:none; display:flex; align-items:center; gap:2px;">
                                             Map
                                        </a>`;
                        }
                        return loc?.address ? loc.address : `<span style="color:#9ca3af;">N/A</span>`;
                    })()}
                                                    </div>
                                                    <div style="display: flex; align-items: center; gap: 4px;">
                                                        <span style="color: #6b7280; font-weight: 500;">OUT:</span>
                                                        ${(() => {
                        const loc = u.lastCheckOutLocation;
                        const isMismatched = u.locationMismatched === true;
                        const color = isMismatched ? '#ef4444' : 'var(--primary)';
                        if (loc && loc.lat && loc.lng) {
                            return `<a href="https://www.google.com/maps?q=${loc.lat},${loc.lng}" target="_blank" style="color:${color}; text-decoration:none; display:flex; align-items:center; gap:2px; font-weight:${isMismatched ? '700' : '400'}">
                                         Map ${isMismatched ? '(Mismatch)' : ''}
                                    </a>`;
                        }
                        return loc?.address ? loc.address : `<span style="color:#9ca3af;">N/A</span>`;
                    })()}
                                                </div>
                                            </td>
                                             <td data-label="Actions">
                                                 <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                                                      <button onclick="window.app_viewLogs('${u.id}')" style="padding: 0.3rem; background: #eef2ff; color: #4338ca; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;" title="Logs"><i class="fa-solid fa-list-check" style="font-size:0.8rem;"></i></button>
                                                      <button onclick="window.app_notifyUser('${u.id}')" style="padding: 0.3rem; background: #fff7ed; color: #c2410c; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;" title="Notify"><i class="fa-solid fa-bell" style="font-size:0.8rem;"></i></button>
                                                      <button onclick="window.app_editUser('${u.id}')" style="padding: 0.3rem; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;" title="Edit"><i class="fa-solid fa-pen" style="font-size:0.8rem;"></i></button>
                                                      <button onclick="window.app_deleteUser('${u.id}')" style="padding: 0.3rem; background: #fef2f2; color: #b91c1c; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;" title="Delete"><i class="fa-solid fa-trash" style="font-size:0.8rem;"></i></button>
                                                 </div>
                                             </td>
                                        </tr>
                                    `;
            }).join('')}
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
        },

        async renderSalaryProcessing() {
            const summary = await window.AppAnalytics.getSystemMonthlySummary();
            const today = new Date();
            const monthLabel = today.toLocaleDateString('default', { month: 'long', year: 'numeric' });

            return `
                <div class="card full-width">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <h3 style="font-size: 1.15rem;">Salary Processing</h3>
                            <p class="text-muted" style="font-size: 0.8rem;">Period: ${monthLabel}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="background: #f8fafc; padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.5rem;">
                                <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">Global TDS:</label>
                                <input type="number" id="global-tds-percent" value="0" min="0" max="100" 
                                    style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;"
                                    onchange="window.app_recalculateAllSalaries()">
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
                                                    onchange="window.app_recalculateRow(this.closest('tr'))">
                                            </td>
                                            <td style="font-size: 0.85rem;">
                                                <span style="color: #10b981;">P: ${stats.present}</span> | 
                                                <span style="color: #f59e0b;">L: ${stats.late}</span> | 
                                                <span style="color: #991b1b;">ED: ${stats.earlyDepartures}</span> |
                                                <span style="color: #ef4444;">UL: <span class="unpaid-leaves-count">${stats.unpaidLeaves}</span></span>
                                                <span class="penalty-count" data-penalty="${stats.penalty}" style="display:none"></span>
                                            </td>
                                            <td style="color: #ef4444; font-weight: 600;" class="deduction-amount">-₹${deductionAmount.toLocaleString()}</td>
                                            <td>
                                                <input type="number" class="salary-input" value="${calculatedSalary}" 
                                                    style="width: 100px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"
                                                    onchange="this.dataset.manual = 'true'; window.app_recalculateRow(this.closest('tr'))">
                                            </td>
                                            <td style="color: #64748b;" class="tds-amount">₹0</td>
                                            <td style="font-weight: 700; color: #1e40af;" class="final-net-salary">₹${calculatedSalary.toLocaleString()}</td>
                                            <td>
                                                <input type="text" class="comment-input" placeholder="Required if adjusted..."
                                                    style="width: 150px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                                            </td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    };
})();
