/**
 * App Entry Point
 * Initializes modules and handles routing.
 * (Converted to IIFE for file:// support)
 */
(function () {
    // Shortcuts (Aliases)
    // We assume AppAuth, AppAttendance, AppUI, AppDB are attached to window by previous scripts

    // App State
    let timerInterval = null;
    let adminPollInterval = null;

    // DOM Elements - queried dynamically or once if available
    const contentArea = document.getElementById('page-content');
    const sidebar = document.querySelector('.sidebar');
    const mobileHeader = document.querySelector('.mobile-header');
    const mobileNav = document.querySelector('.mobile-nav');

    async function initApp() {
        try {
            await window.AppAuth.init();
            router();
            registerSW();
        } catch (e) {
            console.error("Initialization Failed:", e);
            if (contentArea) contentArea.innerHTML = `<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`;
        }
    }

    function registerSW() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('ServiceWorker registered'))
                    .catch(err => console.log('ServiceWorker registration failed: ', err));
            });
        }
    }

    // Router
    async function router() {
        const user = window.AppAuth.getUser();
        const hash = window.location.hash.slice(1) || 'dashboard';

        // Cleanup
        if (hash !== 'admin' && adminPollInterval) {
            clearInterval(adminPollInterval);
            adminPollInterval = null;
        }

        // AUTH GUARD
        if (!user) {
            if (sidebar) sidebar.style.display = 'none';
            if (mobileHeader) mobileHeader.style.display = 'none';
            if (mobileNav) mobileNav.style.display = 'none';
            document.body.style.background = '#f3f4f6';
            if (contentArea) contentArea.innerHTML = window.AppUI.renderLogin();
            return;
        }

        // LOGGED IN
        if (sidebar && window.innerWidth > 768) sidebar.style.display = 'flex';
        if (mobileHeader) mobileHeader.style.display = 'flex';
        if (mobileNav) mobileNav.style.display = 'flex';

        // Update Side Profile
        const sideProfile = document.querySelector('.sidebar-footer .user-mini-profile');
        if (sideProfile) {
            sideProfile.innerHTML = `
                <img src="${user.avatar}" alt="User">
                <div>
                    <p class="user-name">${user.name}</p>
                    <p class="user-role">${user.role}</p>
                </div>
            `;
        }

        // Admin Link logic
        const adminLinks = document.querySelectorAll('a[data-page="admin"]');
        adminLinks.forEach(link => {
            if (user.role === 'Administrator' || user.isAdmin) {
                link.style.display = 'flex';
            } else {
                link.style.setProperty('display', 'none', 'important');
            }
        });

        // Active Nav
        const navLinks = document.querySelectorAll('.nav-item, .mobile-nav-item');
        navLinks.forEach(link => {
            if (link.dataset.page === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Content Rendering
        try {
            // Render Modals into the central container if not already present
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer && !modalContainer.innerHTML) {
                modalContainer.innerHTML = window.AppUI.renderModals();
            }

            // Show Loading State immediately
            if (contentArea) contentArea.innerHTML = '<div class="loading-spinner"></div>';

            if (hash === 'dashboard') {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            } else if (hash === 'timesheet') {
                contentArea.innerHTML = await window.AppUI.renderTimesheet();
            } else if (hash === 'profile') {
                contentArea.innerHTML = await window.AppUI.renderProfile();
            } else if (hash === 'admin') {
                if (user.role !== 'Administrator' && !user.isAdmin) {
                    window.location.hash = 'dashboard';
                    return;
                }
                contentArea.innerHTML = await window.AppUI.renderAdmin();
                window.AppAnalytics.initAdminCharts();
                startAdminPolling();
            }
        } catch (e) {
            console.error("Render Error:", e);
            contentArea.innerHTML = `<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${e.message}</div>`;
        }
    }

    // --- Admin Polling ---
    function startAdminPolling() {
        if (adminPollInterval) clearInterval(adminPollInterval);

        adminPollInterval = setInterval(async () => {
            if (window.location.hash === '#admin') {
                const openModal = document.querySelector('.modal-overlay[style*="display: flex"]');
                // Only poll if NO modal is open (to prevent overwriting form state)
                if (!openModal) {
                    const tableBody = document.querySelector('#admin-user-table tbody');
                    if (tableBody) {
                        try {
                            // Lightweight fetch just for the table part if possible, 
                            // but for now we re-render and check diff.
                            // NOTE: Optimized to not block UI thread
                            const updatedUI = await window.AppUI.renderAdmin();
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(updatedUI, 'text/html');
                            const newBody = doc.querySelector('#admin-user-table tbody');

                            // Only update if content changed to prevent flicker/lag
                            if (newBody && tableBody.innerHTML !== newBody.innerHTML) {
                                tableBody.innerHTML = newBody.innerHTML;
                            }
                        } catch (err) {
                            console.warn("Polling skipped due to error or offline:", err);
                        }
                    }
                }
            } else {
                // formatting fix: stop polling if not on admin
                clearInterval(adminPollInterval);
            }
        }, 10000); // Increased to 10 seconds to reduce lag
    }

    // --- Event Handlers ---

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        window.AppAttendance.getStatus().then(({ status, lastCheckIn }) => {
            const display = document.getElementById('timer-display');
            if (status === 'in' && lastCheckIn && display) {
                timerInterval = setInterval(() => {
                    const now = Date.now();
                    const diff = now - lastCheckIn;
                    const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
                    const mins = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
                    const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                    display.textContent = `${hrs} : ${mins} : ${secs}`;
                }, 1000);

                // Start Activity Monitor
                if (window.AppActivity) window.AppActivity.start();
            } else if (display) {
                display.textContent = '00 : 00 : 00';
            }
        });
    }

    function getLocation() {
        return new Promise(async (resolve, reject) => {
            if (!navigator.geolocation) {
                reject('Geolocation is not supported by your browser.');
                return;
            }

            const getPosition = (options) => {
                return new Promise((res, rej) => {
                    navigator.geolocation.getCurrentPosition(res, rej, options);
                });
            };

            try {
                // Attempt 1: High Accuracy (GPS)
                console.log("Requesting Location: High Accuracy...");
                const p = await getPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
                resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
            } catch (err) {
                console.warn("High Accuracy Failed:", err.message);

                // Attempt 2: Low Accuracy (WiFi/Cell/IP) - Fallback
                try {
                    console.log("Requesting Location: Low Accuracy (Fallback)...");
                    const p2 = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
                    resolve({ lat: p2.coords.latitude, lng: p2.coords.longitude });
                } catch (err2) {
                    console.error("Low Accuracy Failed:", err2.message);

                    let msg = 'Unable to retrieve location.';
                    if (err2.code === 1) msg = 'Location permission denied. Please allow location access.';
                    else if (err2.code === 2) msg = 'Location unavailable. Ensure GPS is on.';
                    else if (err2.code === 3) msg = 'Location request timed out completely.';

                    reject(msg);
                }
            }
        });
    }

    async function handleAttendance() {
        const btn = document.getElementById('attendance-btn');
        const locationText = document.getElementById('location-text');
        const { status } = await window.AppAttendance.getStatus();

        if (btn) btn.disabled = true;

        try {
            if (status === 'out') {
                if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Locating...`;
                const pos = await getLocation();
                if (locationText) locationText.innerHTML = `<i class="fa-solid fa-location-dot"></i> Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)}`;

                await window.AppAttendance.checkIn(pos.lat, pos.lng);
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            } else {
                // Show Check-Out Modal instead of direct checkout
                const modal = document.getElementById('checkout-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    if (btn) btn.disabled = false; // Re-enable button since we didn't submit yet
                } else {
                    // Fallback if modal missing (shouldn't happen)
                    await window.AppAttendance.checkOut();
                    contentArea.innerHTML = await window.AppUI.renderDashboard();
                    setupDashboardEvents();
                }
            }
        } catch (err) {
            alert(err.message || err);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = status === 'out' ? 'Check-in <i class="fa-solid fa-fingerprint"></i>' : 'Check-out <i class="fa-solid fa-fingerprint"></i>';
            }
        }
    }

    // New Function: Handle Check-Out Submission
    window.app_submitCheckOut = async function (event) {
        event.preventDefault();
        const form = event.target;
        const description = form.description.value;
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            await window.AppAttendance.checkOut(description);

            // Hide modal
            document.getElementById('checkout-modal').style.display = 'none';

            // Refresh
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            }
        } catch (err) {
            alert("Check-out failed: " + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Check-Out';
        }
    };

    async function handleManualLog(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dur = calculateDuration(formData.get('checkIn'), formData.get('checkOut'));
        if (dur === 'Invalid') {
            alert('End time must be after Start time');
            return;
        }
        const logData = {
            date: formData.get('date'),
            checkIn: formData.get('checkIn'),
            checkOut: formData.get('checkOut'),
            duration: dur,
            location: formData.get('location'),
            workDescription: formData.get('location'), // Save description here too
            type: 'Manual/WFH'
        };
        await window.AppAttendance.addManualLog(logData);
        alert('Log added successfully!');
        document.getElementById('log-modal').style.display = 'none';
        contentArea.innerHTML = await window.AppUI.renderTimesheet();
    }

    async function handleAddUser(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Sanitize Input (Trim whitespace)
        const name = formData.get('name').trim();
        const username = formData.get('username').trim();
        const password = formData.get('password').trim();
        const email = formData.get('email').trim();

        const isAdmin = formData.get('isAdmin') === 'on' || formData.get('isAdmin') === 'true';

        const userData = {
            id: 'u' + Date.now(),
            name: name,
            username: username,
            password: password,
            role: formData.get('role'),
            dept: formData.get('dept'),
            email: email,
            phone: formData.get('phone'),
            joinDate: formData.get('joinDate'),
            isAdmin: isAdmin,
            avatar: `https://ui-avatars.com/api/?name=${formData.get('name')}&background=random&color=fff`,
            status: 'out',
            lastCheckIn: null
        };

        try {
            // isAdmin/role sync is handled by auth.updateUser but handleAddUser adds directly to DB.
            // Let's ensure sync here too or use a common create function.
            if (userData.isAdmin || userData.role === 'Administrator') {
                userData.isAdmin = true;
                userData.role = 'Administrator';
            }

            await window.AppDB.add('users', userData);
            alert('Success! Account created.');
            document.getElementById('add-user-modal').style.display = 'none';
            contentArea.innerHTML = await window.AppUI.renderAdmin();
        } catch (err) {
            alert('Error creating user: ' + err.message);
        }
    }

    window.app_submitEditUser = async (e) => {
        // Explicitly handle event
        if (e) e.preventDefault();

        const form = document.getElementById('edit-user-form');
        const formData = new FormData(form);

        const id = formData.get('id');
        if (!id) {
            alert('Error: User ID missing.');
            return;
        }

        const isAdmin = formData.get('isAdmin') === 'on' || formData.get('isAdmin') === 'true';

        const userData = {
            id: id,
            name: formData.get('name'),
            username: formData.get('username'),
            password: formData.get('password'),
            role: formData.get('role'),
            dept: formData.get('dept'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            isAdmin: isAdmin
        };

        console.log("Submitting User Update:", userData);

        try {
            const success = await window.AppAuth.updateUser(userData);
            if (success) {
                alert(`SUCCESS: User '${userData.name}' updated.`);
                window.location.reload();
            } else {
                alert('Update failed. User not found.');
            }
        } catch (err) {
            console.error("Update Error:", err);
            alert('Error: ' + err.message);
        }
    };

    // --- Helpers ---

    function calculateDuration(start, end) {
        const [h1, m1] = start.split(':');
        const [h2, m2] = end.split(':');
        const mins = (parseInt(h2) * 60 + parseInt(m2)) - (parseInt(h1) * 60 + parseInt(m1));
        if (mins < 0) return 'Invalid';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    }

    function setupDashboardEvents() {
        const btn = document.getElementById('attendance-btn');
        if (btn) btn.addEventListener('click', handleAttendance);
        startTimer();
    }

    // --- Global Event Delegation ---

    document.addEventListener('submit', (e) => {
        const id = e.target.id;
        console.log("Form Submitted:", id); // Verify submission in console

        if (id === 'manual-log-form') handleManualLog(e);
        else if (id === 'add-user-form') handleAddUser(e);
        else if (id === 'login-form') {
            e.preventDefault();
            const fd = new FormData(e.target);
            window.AppAuth.login(fd.get('username'), fd.get('password')).then(success => {
                if (success) window.location.reload();
                else alert('Invalid Credentials');
            });
        }
        else if (id === 'edit-user-form') window.app_submitEditUser(e);
        else if (id === 'notify-form') handleNotifyUser(e);
        else if (id === 'leave-request-form') handleLeaveRequest(e);
    });

    async function handleLeaveRequest(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const user = window.AppAuth.getUser();
        await window.AppLeaves.requestLeave({
            userId: user.id,
            startDate: fd.get('startDate'),
            endDate: fd.get('endDate'),
            type: fd.get('type'),
            reason: fd.get('reason')
        });
        alert('Leave requested successfully!');
        document.getElementById('leave-modal').style.display = 'none';
        e.target.reset();
    }

    async function handleNotifyUser(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const toUserId = formData.get('toUserId');
        const msg = formData.get('message');

        try {
            // Check if user exists
            const user = await window.AppDB.get('users', toUserId);
            if (!user) throw new Error("User not found");

            // Add notification
            if (!user.notifications) user.notifications = [];
            user.notifications.unshift({
                id: Date.now(),
                message: msg,
                date: new Date().toLocaleDateString(),
                read: false
            });

            await window.AppAuth.updateUser(user);
            alert('Notification sent!');
            document.getElementById('notify-modal').style.display = 'none';
        } catch (err) {
            alert('Failed to send: ' + err.message);
        }
    }

    document.addEventListener('auth-logout', () => window.AppAuth.logout());

    document.addEventListener('dismiss-notification', async (e) => {
        const index = e.detail;
        const user = window.AppAuth.getUser();
        if (user && user.notifications) {
            user.notifications.splice(index, 1);
            await window.AppAuth.updateUser(user);
            contentArea.innerHTML = await window.AppUI.renderDashboard();
        }
    });

    // Manual Log Logic
    document.addEventListener('open-log-modal', () => {
        const modal = document.getElementById('log-modal');
        if (!modal) return;
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        document.getElementById('log-date').value = now.toISOString().split('T')[0];
        document.getElementById('log-start-time').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const later = new Date(now.getTime() + 3600000);
        document.getElementById('log-end-time').value = `${pad(later.getHours())}:${pad(later.getMinutes())}`;
        modal.style.display = 'flex';
    });

    document.addEventListener('set-duration', (e) => {
        const minutes = e.detail;
        const startTimeInput = document.getElementById('log-start-time');
        const endTimeInput = document.getElementById('log-end-time');
        if (startTimeInput.value) {
            const [h, m] = startTimeInput.value.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(h, m);
            const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);
            const pad = n => n.toString().padStart(2, '0');
            endTimeInput.value = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
        }
    });

    // Admin Events
    // --- Global Functions (Exposed for UI onclicks) ---

    window.app_editUser = async (userId) => {
        const user = await window.AppDB.get('users', userId);
        if (!user) return;
        const form = document.getElementById('edit-user-form');
        form.querySelector('#edit-user-id').value = user.id;
        form.querySelector('#edit-user-name').value = user.name;
        form.querySelector('#edit-user-username').value = user.username;
        form.querySelector('#edit-user-password').value = user.password;
        form.querySelector('#edit-user-role').value = user.role;
        form.querySelector('#edit-user-dept').value = user.dept;
        form.querySelector('#edit-user-email').value = user.email;
        form.querySelector('#edit-user-phone').value = user.phone;
        form.querySelector('#edit-user-isAdmin').checked = !!(user.isAdmin || user.role === 'Administrator');
        document.getElementById('edit-user-modal').style.display = 'flex';
    };

    window.app_notifyUser = (userId) => {
        console.log("Opening Notify for:", userId);
        document.getElementById('notify-user-id').value = userId;
        document.getElementById('notify-modal').style.display = 'flex';
    };

    window.app_viewLogs = async (userId) => {
        console.log("Viewing details for:", userId);
        const user = await window.AppDB.get('users', userId);
        let logs = await window.AppAttendance.getLogs(userId);

        // Sort: Chronological (Oldest First) for the detailed report view if requested
        // But usually, newest first is better for quick check. 
        // Let's stick to newest first as per attendance.js, but ensure it's clear.

        window.currentViewedLogs = logs;
        window.currentViewedUser = user;

        const logsHTML = logs.length ? `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>In</th>
                            <th>Out</th>
                            <th>Duration</th>
                            <th>Type</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => {
            let locDisplay = log.location || 'N/A';
            if (log.lat && log.lng) {
                locDisplay = `<a href="https://www.google.com/maps?q=${log.lat},${log.lng}" target="_blank" style="color:var(--primary);text-decoration:none;">
                                    <i class="fa-solid fa-map-pin"></i> ${Number(log.lat).toFixed(4)}, ${Number(log.lng).toFixed(4)}
                                </a>`;
            }
            return `
                            <tr>
                                <td>${log.date}</td>
                                <td>${log.checkIn}</td>
                                <td>${log.checkOut || '--'}</td>
                                <td>${log.duration || '--'}</td>
                                <td>${log.type || 'Office'}</td>
                                <td style="font-size:0.85rem; color:#6b7280;">${locDisplay}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>` : '<p style="text-align:center; padding:1rem; color:#6b7280;">No logs found for this user.</p>';

        document.getElementById('user-details-content').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <div>
                     <h3>${user.name}</h3>
                     <p style="color:#6b7280; font-size:0.9rem;">${user.role} | ${user.dept || 'General'}</p>
                </div>
                <button onclick="window.AppReports.exportUserLogsCSV(window.currentViewedUser, window.currentViewedLogs)" class="action-btn" style="padding:0.5rem 1rem; font-size:0.9rem;">
                    <i class="fa-solid fa-file-export"></i> Export Report
                </button>
            </div>
            ${logsHTML}
        `;
        document.getElementById('user-details-modal').style.display = 'flex';
    };

    window.app_deleteUser = async (userId) => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await window.AppDB.delete('users', userId);
                alert('User deleted successfully.');
                // Refresh Admin View
                const contentArea = document.getElementById('page-content');
                if (contentArea) {
                    contentArea.innerHTML = await window.AppUI.renderAdmin();
                }
            } catch (err) {
                alert('Failed to delete user: ' + err.message);
            }
        }
    };

    window.app_handleLeave = async (leaveId, status) => {
        const user = window.AppAuth.getUser();
        await window.AppLeaves.updateLeaveStatus(leaveId, status, user.id);
        alert(`Leave ${status}!`);
        // Refresh Admin View
        const contentArea = document.getElementById('page-content');
        contentArea.innerHTML = await window.AppUI.renderAdmin();
    };

    // Listeners for Modal Events 
    // (We keep these as they are internal to app.js logic or standard form submits)
    // Removed old document.addEventListener calls for admin actions since we use global funcs now.

    // Initialization
    window.addEventListener('hashchange', router);
    window.addEventListener('load', initApp);
    window.addEventListener('resize', () => {
        if (sidebar) sidebar.style.display = window.innerWidth > 768 ? 'flex' : 'none';
    });

    console.log("App.js Loaded & Globals Ready");
})();
