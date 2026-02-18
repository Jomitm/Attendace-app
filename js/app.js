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
    let adminListenerUnsubscribe = [];
    let cachedLocation = null;
    let lastLocationFetch = 0;
    const LOCATION_CACHE_TIME = 30000; // 30 seconds cache
    window.app_annualYear = new Date().getFullYear();

    // DOM Elements - queried dynamically or once if available
    const contentArea = document.getElementById('page-content');
    const sidebar = document.querySelector('.sidebar');
    const mobileHeader = document.querySelector('.mobile-header');
    const mobileNav = document.querySelector('.mobile-nav');

    // --- Theme Management ---
    window.app_initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcons(savedTheme);
    };

    window.app_toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
    };

    function updateThemeIcons(theme) {
        document.querySelectorAll('.theme-toggle i').forEach(icon => {
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
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

    // --- UI Helpers ---
    const getLocalISO = (date = new Date()) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    function toggleMobileSidebar(show) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && overlay) {
            if (show) {
                sidebar.classList.add('open');
                overlay.classList.add('active');
            } else {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        }
    }

    function cleanURL() {
        if (window.location.search) {
            const clean = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
            window.history.replaceState({ path: clean }, '', clean);
            console.log("Address bar cleaned of query parameters.");
        }
    }

    window.app_toggleSidebar = (forceCollapse = null) => {
        const sidebar = document.querySelector('.sidebar');
        const icon = document.querySelector('#desktop-sidebar-toggle i');
        if (!sidebar) return;

        const isCollapsing = forceCollapse !== null ? forceCollapse : !sidebar.classList.contains('collapsed');

        if (isCollapsing) {
            sidebar.classList.add('collapsed');
            if (icon) {
                icon.classList.remove('fa-angles-left');
                icon.classList.add('fa-angles-right');
            }
        } else {
            sidebar.classList.remove('collapsed');
            if (icon) {
                icon.classList.remove('fa-angles-right');
                icon.classList.add('fa-angles-left');
            }
        }
    };

    // Modal Helper to avoid overwriting modal-container
    window.app_showModal = (html, id) => {
        const container = document.getElementById('modal-container');
        if (!container) return;
        // Remove existing modal with same ID if any
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        container.insertAdjacentHTML('beforeend', html);
    };

    // Initialize Global App Logic
    // --- Yearly Plan / Calendar Logic ---
    window.app_openEventModal = () => {
        const html = `
            <div class="modal-overlay" id="event-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-size: 1.1rem;">Add Shared Event</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <form onsubmit="window.app_submitEvent(event)">
                        <div style="display:flex; flex-direction:column; gap:0.75rem;">
                            <div>
                                <label style="display:block; font-size:0.8rem; margin-bottom:0.2rem;">Event Title</label>
                                <input type="text" id="event-title" required style="width:100%; padding:0.6rem; border:1px solid #ddd; border-radius:8px; font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.8rem; margin-bottom:0.2rem;">Date</label>
                                <input type="date" id="event-date" required style="width:100%; padding:0.6rem; border:1px solid #ddd; border-radius:8px; font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.8rem; margin-bottom:0.2rem;">Type</label>
                                <select id="event-type" style="width:100%; padding:0.6rem; border:1px solid #ddd; border-radius:8px; font-size:0.9rem;">
                                    <option value="holiday">Holiday</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="event">Other Event</option>
                                </select>
                            </div>
                            <button type="submit" class="action-btn" style="width:100%; margin-top:0.5rem; padding: 0.75rem;">Save Event</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        window.app_showModal(html, 'event-modal');
    };

    window.app_submitEvent = async (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const type = document.getElementById('event-type').value;

        try {
            await window.AppCalendar.addEvent({ title, date, type });
            alert("Event added successfully!");
            document.getElementById('event-modal')?.remove();
            // Refresh Dashboard
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
            setupDashboardEvents();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    // --- Original Login/Auth Logic ---
    async function init() {
        window.app_initTheme();
        cleanURL();
        try {
            await window.AppAuth.init();
            registerSW();

            // Ensure Activity Command Listener starts even if not checked in
            if (window.AppActivity) window.AppActivity.initCommandListener();
        } catch (e) {
            console.error("Initialization Failed:", e);
            if (contentArea) contentArea.innerHTML = `<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`;
        }

        // Global Toggles
        document.addEventListener('click', (e) => {
            if (e.target.id === 'sidebar-toggle' || e.target.closest('#sidebar-toggle')) {
                toggleMobileSidebar(true);
            } else if (e.target.id === 'sidebar-overlay') {
                toggleMobileSidebar(false);
            }
        });

        window.addEventListener('hashchange', router);
        router();

        // Trigger Tour if applicable
        const currentUser = window.AppAuth.getUser();
        if (currentUser && window.AppTour) {
            window.AppTour.init(currentUser);
        }
    }

    // Router
    async function router() {
        const user = window.AppAuth.getUser();
        const hash = window.location.hash.slice(1) || 'dashboard';

        // Cleanup
        if (hash !== 'admin' && adminListenerUnsubscribe && adminListenerUnsubscribe.length > 0) {
            console.log("Cleaning up Admin Realtime Listener.");
            adminListenerUnsubscribe.forEach(u => typeof u === 'function' && u());
            adminListenerUnsubscribe = [];
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
        // Clear mobile specific states on route change
        toggleMobileSidebar(false);

        if (sidebar) sidebar.style.display = '';
        if (mobileHeader) mobileHeader.style.display = '';
        if (mobileNav) mobileNav.style.display = '';

        // Update Side Profile
        const sideProfile = document.querySelector('.sidebar-footer .user-mini-profile');
        if (sideProfile) {
            sideProfile.innerHTML = `
                <img src="${user.avatar || 'https://ui-avatars.com/api/?name=User'}" alt="User">
                <div>
                    <p class="user-name">${user.name || 'Staff Member'}</p>
                </div>
                <i class="fa-solid fa-gear user-settings-icon"></i>
            `;
        }

        // Admin Link logic
        const adminLinks = document.querySelectorAll('a[data-page="admin"], a[data-page="salary"], a[data-page="master-sheet"]');
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
            if (modalContainer && !document.getElementById('checkout-modal')) {
                modalContainer.insertAdjacentHTML('beforeend', window.AppUI.renderModals());
            }

            // Show Loading State immediately
            if (contentArea) contentArea.innerHTML = '<div class="loading-spinner"></div>';

            if (hash === 'dashboard') {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            } else if (hash === 'staff-directory') {
                contentArea.innerHTML = await window.AppUI.renderStaffDirectoryPage();
            } else if (hash === 'policies') {
                if (window.AppPolicies && typeof window.AppPolicies.render === 'function') {
                    contentArea.innerHTML = await window.AppPolicies.render();
                } else {
                    contentArea.innerHTML = `<div style="padding:1rem; color:#b91c1c;">Policies module failed to load.</div>`;
                }
            } else if (hash === 'annual-plan') {
                // Auto-hide sidebar for better view
                window.app_toggleSidebar(true);
                contentArea.innerHTML = await window.AppUI.renderAnnualPlan();
            } else if (hash === 'timesheet') {
                contentArea.innerHTML = await window.AppUI.renderTimesheet();
            } else if (hash === 'profile') {
                contentArea.innerHTML = await window.AppUI.renderProfile();
            } else if (hash === 'salary') {
                if (user.role !== 'Administrator' && !user.isAdmin) {
                    window.location.hash = 'dashboard';
                    return;
                }
                contentArea.innerHTML = await window.AppUI.renderSalaryProcessing ? await window.AppUI.renderSalaryProcessing() : await window.AppUI.renderSalary();
            } else if (hash === 'master-sheet') {
                if (user.role !== 'Administrator' && !user.isAdmin) {
                    window.location.hash = 'dashboard';
                    return;
                }
                contentArea.innerHTML = await window.AppUI.renderMasterSheet();
            } else if (hash === 'minutes') {
                contentArea.innerHTML = await window.AppUI.renderMinutes();
            } else if (hash === 'admin') {
                if (user.role !== 'Administrator' && !user.isAdmin) {
                    window.location.hash = 'dashboard';
                    return;
                }
                contentArea.innerHTML = await window.AppUI.renderAdmin();
                window.AppAnalytics.initAdminCharts();
                startAdminRealtimeListener();
            }
            if (window.app_updateStaffNavIndicator) {
                await window.app_updateStaffNavIndicator();
            }
        } catch (e) {
            console.error("Render Error:", e);
            contentArea.innerHTML = `<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${e.message}</div>`;
        }
    }

    // --- Admin Link Logic ---
    function updateAdminVisibility(user) {
        const adminLinks = document.querySelectorAll('a[data-page="admin"], a[data-page="salary"]');
        adminLinks.forEach(link => {
            if (user.role === 'Administrator' || user.isAdmin) {
                link.style.display = 'flex';
            } else {
                link.style.setProperty('display', 'none', 'important');
            }
        });
    }

    // Router Helper (Call this inside router)
    // Actually, I'll just integrate it.

    // --- Admin Realtime Listener ---
    function startAdminRealtimeListener() {
        // Clear previous listeners
        adminListenerUnsubscribe.forEach(u => typeof u === 'function' && u());
        adminListenerUnsubscribe = [];

        console.log("Starting Admin Realtime Listeners (Users & Audits)...");

        const refreshAdminUI = async () => {
            const currentHash = window.location.hash.slice(1);
            if (currentHash !== 'admin') return;

            const openModal = document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]');
            if (!openModal) {
                console.log("Admin Data Update Received (Realtime) - Refreshing UI");
                const contentArea = document.getElementById('page-content');
                if (contentArea) {
                    // PRESERVE FILTERS
                    const startDate = document.getElementById('audit-start')?.value;
                    const endDate = document.getElementById('audit-end')?.value;

                    contentArea.innerHTML = await window.AppUI.renderAdmin(startDate, endDate);
                    if (window.AppAnalytics) window.AppAnalytics.initAdminCharts();
                }
            } else {
                console.log("Admin Update received but skipped because a modal is open.");
            }
        };

        // Listen for users (staff status updates)
        adminListenerUnsubscribe.push(window.AppDB.listen('users', refreshAdminUI));

        // Listen for audit logs (manual trigger triggers these immediately)
        adminListenerUnsubscribe.push(window.AppDB.listen('location_audits', refreshAdminUI));
    }

    // --- Event Handlers ---

    const getAutoCheckoutTime = (checkInDate) => {
        const tenPm = new Date(checkInDate);
        tenPm.setHours(22, 0, 0, 0);
        const eightHoursLater = new Date(checkInDate.getTime() + (8 * 60 * 60 * 1000));
        return eightHoursLater > tenPm ? eightHoursLater : tenPm;
    };

    const notifyAdminsAutoCheckout = async (staffUser, checkInDate, autoCheckoutAt) => {
        try {
            const users = await window.AppDB.getAll('users');
            const dateStr = checkInDate.toISOString().split('T')[0];
            const key = `auto-checkout-${staffUser.id}-${dateStr}`;
            const message = `${staffUser.name} did not check out by 10:00 PM. Auto check-out applied (${autoCheckoutAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Approve extra hours if applicable.`;

            const admins = users.filter(u => u.isAdmin || u.role === 'Administrator');
            await Promise.all(admins.map(admin => {
                if (!admin.notifications) admin.notifications = [];
                const already = admin.notifications.some(n => n.key === key);
                if (!already) {
                    admin.notifications.unshift({
                        key,
                        type: 'auto_checkout',
                        message,
                        staffId: staffUser.id,
                        date: new Date().toISOString()
                    });
                    return window.AppDB.put('users', admin);
                }
                return Promise.resolve();
            }));
        } catch (err) {
            console.warn('Failed to notify admins about auto checkout:', err);
        }
    };

    function startTimer(targetUser = null, readOnly = false) {
        if (timerInterval) clearInterval(timerInterval);

        const updateTimerUI = async () => {
            let status = 'out';
            let lastCheckIn = null;
            if (targetUser) {
                status = targetUser.status || 'out';
                lastCheckIn = targetUser.lastCheckIn || null;
            } else {
                const statusInfo = await window.AppAttendance.getStatus();
                status = statusInfo.status;
                lastCheckIn = statusInfo.lastCheckIn;
            }
            const user = window.AppAuth.getUser();
            const display = document.getElementById('timer-display');
            const countdownContainer = document.getElementById('countdown-container');
            const overtimeContainer = document.getElementById('overtime-container');
            const countdownValue = document.getElementById('countdown-value');
            const countdownProgress = document.getElementById('countdown-progress');
            const overtimeValue = document.getElementById('overtime-value');
            const timerLabel = document.getElementById('timer-label');

            if (status === 'in' && lastCheckIn) {
                // Determine Target Time (Example: 5:00 PM if Weekday)
                const checkInDate = new Date(lastCheckIn);
                const today = new Date();
                const checkInLocalDate = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`;
                const todayLocalDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isStaleSession = checkInLocalDate !== todayLocalDate;
                const targetTime = new Date(checkInDate); // Clone date
                targetTime.setHours(17, 0, 0, 0); // 5:00 PM default

                const day = checkInDate.getDay();
                if (day === 6) targetTime.setHours(13, 0, 0, 0); // Saturday 1 PM target
                if (day === 0) targetTime.setHours(17, 0, 0, 0); // Sunday (Default 5pm if working)

                // Timer Interval
                timerInterval = setInterval(() => {
                    const now = Date.now();
                    const diff = now - lastCheckIn; // Total Worked (Elapsed)

                    // Format Elapsed (Main Timer)
                    if (display) {
                        let hrs = Math.floor(diff / (1000 * 60 * 60));
                        let mins = Math.floor((diff / (1000 * 60)) % 60);
                        let secs = Math.floor((diff / 1000) % 60);

                        hrs = (hrs < 10) ? "0" + hrs : hrs;
                        mins = (mins < 10) ? "0" + mins : mins;
                        secs = (secs < 10) ? "0" + secs : secs;
                        display.textContent = `${hrs} : ${mins} : ${secs}`;
                    }

                    // If session started on a previous day, avoid confusing overtime UI.
                    if (isStaleSession) {
                        if (countdownContainer) countdownContainer.style.display = 'none';
                        if (overtimeContainer) overtimeContainer.style.display = 'none';
                        if (display) display.style.color = '#b45309';
                        if (timerLabel) {
                            timerLabel.textContent = 'Session Carryover (Please Check Out)';
                            timerLabel.style.color = '#b45309';
                        }
                        return;
                    }

                    if (!readOnly && user && user.id) {
                        const autoCheckoutAt = getAutoCheckoutTime(checkInDate);
                        const autoKey = `auto-checkout-${user.id}-${checkInLocalDate}`;
                        if (now >= autoCheckoutAt.getTime() && !sessionStorage.getItem(autoKey)) {
                            sessionStorage.setItem(autoKey, '1');
                            (async () => {
                                try {
                                    await window.AppAttendance.checkOut(
                                        'Auto check-out: did not check out by 10:00 PM',
                                        null,
                                        null,
                                        'Auto checkout',
                                        false,
                                        '',
                                        {
                                            autoCheckout: true,
                                            autoCheckoutReason: 'Auto check-out at 10:00 PM',
                                            autoCheckoutAt: autoCheckoutAt.toISOString(),
                                            autoCheckoutRequiresApproval: true,
                                            autoCheckoutExtraApproved: false,
                                            checkOutTime: autoCheckoutAt.toISOString()
                                        }
                                    );
                                    await notifyAdminsAutoCheckout(user, checkInDate, autoCheckoutAt);
                                    const contentArea = document.getElementById('page-content');
                                    if (contentArea) {
                                        contentArea.innerHTML = await window.AppUI.renderDashboard();
                                        if (window.setupDashboardEvents) window.setupDashboardEvents();
                                    }
                                } catch (e) {
                                    console.warn('Auto check-out failed:', e);
                                    sessionStorage.removeItem(autoKey);
                                }
                            })();
                            return;
                        }
                    }

                    // Countdown / Overtime Logic
                    const timeToTarget = targetTime.getTime() - now;

                    if (timeToTarget > 0) {
                        // Regular Work Time
                        if (countdownContainer) countdownContainer.style.display = 'block';
                        if (overtimeContainer) overtimeContainer.style.display = 'none';
                        if (timerLabel) {
                            timerLabel.textContent = 'Elapsed Time';
                            timerLabel.style.color = '#6b7280';
                        }
                        if (display) display.style.color = '#1f2937';

                        // Calculate Remaining
                        let rHrs = Math.floor((timeToTarget / (1000 * 60 * 60)) % 24);
                        let rMins = Math.floor((timeToTarget / (1000 * 60)) % 60);
                        let rSecs = Math.floor((timeToTarget / 1000) % 60);

                        rHrs = (rHrs < 10) ? "0" + rHrs : rHrs;
                        rMins = (rMins < 10) ? "0" + rMins : rMins;
                        rSecs = (rSecs < 10) ? "0" + rSecs : rSecs;

                        // Progress Bar calculation (Target is fixed duration from checkin or fixed time?)
                        // Let's use CheckIn -> Target as the full bar.
                        const totalShiftDuration = targetTime.getTime() - lastCheckIn;
                        // Avoid division by zero
                        const progress = totalShiftDuration > 0 ? Math.min(100, (diff / totalShiftDuration) * 100) : 100;

                        if (countdownValue) countdownValue.textContent = `${rHrs}:${rMins}:${rSecs}`;
                        if (countdownProgress) countdownProgress.style.width = `${progress}%`;
                        if (countdownProgress) countdownProgress.style.background = 'var(--primary)'; // Normal Color

                    } else {
                        // Overtime
                        if (countdownContainer) countdownContainer.style.display = 'none';
                        if (overtimeContainer) overtimeContainer.style.display = 'block';

                        // Calculate Overtime Duration
                        const otDiff = Math.abs(now - targetTime.getTime());
                        let oHrs = Math.floor(otDiff / (1000 * 60 * 60));
                        let oMins = Math.floor((otDiff / (1000 * 60)) % 60);
                        let oSecs = Math.floor((otDiff / 1000) % 60);

                        oHrs = (oHrs < 10) ? "0" + oHrs : oHrs;
                        oMins = (oMins < 10) ? "0" + oMins : oMins;
                        oSecs = (oSecs < 10) ? "0" + oSecs : oSecs;

                        if (overtimeValue) overtimeValue.textContent = `+ ${oHrs}:${oMins}:${oSecs}`;

                        // Change Main Timer Color
                        if (display) display.style.color = '#c2410c'; // Dark Orange
                        if (timerLabel) {
                            timerLabel.textContent = 'Total Elapsed (Overtime)';
                            timerLabel.style.color = '#c2410c';
                        }
                    }

                }, 1000);

                // Prompt once per stale check-in session to close it quickly.
                if (isStaleSession) {
                    const stalePromptKey = `stale-session-prompted-${lastCheckIn}`;
                    if (!sessionStorage.getItem(stalePromptKey)) {
                        sessionStorage.setItem(stalePromptKey, '1');
                        setTimeout(async () => {
                            const doAutoClose = confirm(
                                `You are still checked in from ${checkInDate.toLocaleString()}. Auto check-out this carried session now?`
                            );
                            if (!doAutoClose) return;
                            try {
                                await window.AppAttendance.checkOut('Auto check-out: carried session from previous day');
                                const contentArea = document.getElementById('page-content');
                                if (contentArea) {
                                    contentArea.innerHTML = await window.AppUI.renderDashboard();
                                    if (window.setupDashboardEvents) window.setupDashboardEvents();
                                }
                            } catch (e) {
                                console.warn('Auto check-out for stale session failed:', e);
                            }
                        }, 250);
                    }
                }

                // Start Activity Monitor
                    if (!readOnly && window.AppActivity && window.AppActivity.start) window.AppActivity.start();

            } else {
                if (display) {
                    display.textContent = "00 : 00 : 00";
                    display.style.color = ''; // Reset
                }
                if (timerLabel) {
                    timerLabel.textContent = 'Elapsed Time';
                    timerLabel.style.color = '';
                }
                if (countdownContainer) countdownContainer.style.display = 'none';
                if (overtimeContainer) overtimeContainer.style.display = 'none';
            }
        };
        updateTimerUI();
    }

    window.getLocation = function getLocation() {
        return new Promise(async (resolve, reject) => {
            // Check Cache first
            const now = Date.now();
            if (cachedLocation && (now - lastLocationFetch < LOCATION_CACHE_TIME)) {
                console.log("Using cached location (freshness: " + (now - lastLocationFetch) + "ms)");
                resolve(cachedLocation);
                return;
            }

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
                console.log("Requesting Location: High Accuracy (GPS)...");
                const p = await getPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                });
                const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
                cachedLocation = pos;
                lastLocationFetch = Date.now();
                resolve(pos);
            } catch (err) {
                console.warn("High Accuracy Failed:", err.message);

                // Attempt 2: Low Accuracy - Fallback
                try {
                    console.log("Requesting Location: Low Accuracy (Fallback)...");
                    const p2 = await getPosition({
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 10000
                    });
                    const pos2 = { lat: p2.coords.latitude, lng: p2.coords.longitude };
                    cachedLocation = pos2;
                    lastLocationFetch = Date.now();
                    resolve(pos2);
                } catch (err2) {
                    console.error("Low Accuracy Failed:", err2.message);
                    let msg = 'Unable to retrieve location.';
                    if (err2.code === 1) msg = 'Location permission denied.';
                    else if (err2.code === 2) msg = 'Location unavailable.';
                    else if (err2.code === 3) msg = 'Location request timed out.';
                    reject(msg);
                }
            }
        });
    }

    // --- Work Plan Logic ---

    window.app_getDayEvents = (dateStr, plans, opts = {}) => {
        const includeAuto = opts.includeAuto !== false;
        const dedupe = opts.dedupe !== false;
        if (!plans) return [];
        if (Array.isArray(plans)) return plans.filter(p => p.date === dateStr);
        const dateObj = new Date(dateStr);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const d = dateObj.getDate();

        const evs = [];

        // 1. Add Automatic Day Types (Saturdays, Sundays)
        if (includeAuto && window.AppAnalytics) {
            const dayType = window.AppAnalytics.getDayType(dateObj);
            if (dayType === 'Holiday') {
                evs.push({ title: 'Company Holiday (Weekend)', type: 'holiday', date: dateStr });
            } else if (dayType === 'Half Day') {
                evs.push({ title: 'Half Working Day (Sat)', type: 'event', date: dateStr });
            }
        }

        (plans.leaves || []).forEach(l => {
            if (dateStr >= l.startDate && dateStr <= l.endDate) {
                evs.push({ title: `${l.userName || 'Staff'} (Leave)`, type: 'leave', userId: l.userId, date: dateStr });
            }
        });
        (plans.events || []).forEach(e => {
            if (e.date === dateStr) evs.push({ title: e.title, type: e.type || 'event', date: dateStr });
        });
        (plans.workPlans || []).forEach(p => {
            if (p.date === dateStr) {
                let title = '';
                if (p.plans && p.plans.length > 0) {
                    title = `${p.userName}: ${p.plans.map(pl => pl.task).join('; ')}`;
                } else {
                    title = `${p.userName}: ${p.plan || 'Work Plan'}`;
                }
                evs.push({ title: title, type: 'work', userId: p.userId, plans: p.plans, date: dateStr });
            }
        });
        if (!dedupe) return evs;
        const seen = new Set();
        return evs.filter(ev => {
            const type = ev.type || 'event';
            if (type !== 'holiday' && type !== 'event') return true;
            const key = `${type}|${ev.title || ''}|${ev.userId || ''}|${ev.date || dateStr}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    window.app_openDayPlan = async (date, targetUserId = null) => {
        const currentUser = window.AppAuth.getUser();
        const targetId = targetUserId || currentUser.id;
        const allUsers = await window.AppDB.getAll('users');
        const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
        const isEditingOther = targetId !== currentUser.id;

        const myWorkPlan = await window.AppCalendar.getWorkPlan(targetId, date);

        const blockFromPlan = (plan = {}, idx = 0) => {
            const task = plan.task || '';
            const subPlans = Array.isArray(plan.subPlans) ? plan.subPlans : [];
            const tags = Array.isArray(plan.tags) ? plan.tags : [];
            const assignedTo = plan.assignedTo || targetId;

            return `
                <div class="plan-block day-plan-block-shell" data-index="${idx}">
                    <div class="day-plan-block-body">
                        ${idx > 0 ? `<button type="button" onclick="this.closest('.plan-block').remove()" title="Remove this task" class="day-plan-remove-task-btn"><i class="fa-solid fa-times"></i></button>` : ''}
                        <div class="day-plan-left-panel">
                            <label class="day-plan-label">What will you work on?</label>
                            <p class="day-plan-help-text">Be specific. Use @ to tag collaborators.</p>
                            <textarea class="plan-task day-plan-task-input" required placeholder="Describe your plan for the day...">${task}</textarea>
                            <div class="day-plan-sub-section">
                                <label class="day-plan-mini-label">Break into steps (optional)</label>
                                <div class="sub-plans-list day-plan-sub-list">
                                    ${subPlans.map(sub => `
                                        <div class="sub-plan-row day-plan-sub-row">
                                            <div class="day-plan-step-dot"></div>
                                            <input type="text" value="${sub}" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
                                            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" onclick="window.app_addSubPlanRow(this)" class="day-plan-add-step-btn"><i class="fa-solid fa-plus"></i> Add Step</button>
                            </div>
                        </div>
                        <div class="day-plan-right-panel">
                            <label class="day-plan-label">Who's helping?</label>
                            <p class="day-plan-collab-hint">Type <b>@</b> in task text, then pick a teammate.</p>
                            <div class="tags-container">
                                ${tags.map(t => `
                                    <div class="tag-chip day-plan-tag-chip" data-id="${t.id}" data-name="${t.name}" data-status="${t.status || 'pending'}">
                                        <span class="day-plan-tag-main"><i class="fa-solid fa-at day-plan-tag-icon"></i>${t.name} <span class="day-plan-tag-pending">(${t.status || 'pending'})</span></span>
                                        <i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>
                                    </div>
                                `).join('')}
                                ${tags.length === 0 ? `
                                    <div class="no-tags-placeholder day-plan-no-tags-placeholder">
                                        <div class="day-plan-no-tags-icon-wrap"><i class="fa-solid fa-user-plus day-plan-no-tags-icon"></i></div>
                                        <p class="day-plan-no-tags-title">No collaborators yet</p>
                                        <p class="day-plan-no-tags-text">Use <b>@</b> in your task to tag teammates</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="day-plan-bottom-controls">
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <label class="day-plan-mini-label">Status</label>
                            <select class="plan-status day-plan-select">
                                <option value="" ${!plan.status ? 'selected' : ''}>Auto-Track (Recommended)</option>
                                <option value="completed" ${plan.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="not-completed" ${plan.status === 'not-completed' ? 'selected' : ''}>Not Completing</option>
                                <option value="in-process" ${plan.status === 'in-process' ? 'selected' : ''}>In Progress</option>
                            </select>
                        </div>
                        ${isAdmin ? `
                            <div style="display:flex; align-items:center; gap:0.6rem;">
                                <label class="day-plan-mini-label">Assign To</label>
                                <select class="plan-assignee day-plan-select">
                                    ${allUsers.map(u => `<option value="${u.id}" ${u.id === assignedTo ? 'selected' : ''}>${u.name}</option>`).join('')}
                                </select>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        };

        const initialBlocks = (myWorkPlan && Array.isArray(myWorkPlan.plans) && myWorkPlan.plans.length > 0)
            ? myWorkPlan.plans
            : (myWorkPlan && myWorkPlan.plan)
                ? [{ task: myWorkPlan.plan, subPlans: myWorkPlan.subPlans || [], tags: [], status: null, assignedTo: targetId }]
                : [{ task: '', subPlans: [], tags: [], status: null, assignedTo: targetId }];

        const targetUser = allUsers.find(u => u.id === targetId);
        const headerName = targetUser ? targetUser.name : 'Staff';

        const html = `
            <div class="modal-overlay" id="day-plan-modal" style="display:flex;">
                <div class="modal-content day-plan-content">
                    <div class="day-plan-head">
                        <div>
                            <h3>Plan Your Day</h3>
                            <p>${date}${isEditingOther ? ` - Editing for ${headerName}` : ''}</p>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            ${myWorkPlan ? `<button type="button" onclick="window.app_deleteDayPlan('${date}', '${targetId}')" class="day-plan-delete-btn" title="Delete plan"><i class="fa-solid fa-trash"></i></button>` : ''}
                            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="day-plan-close-btn" title="Close"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                    <form onsubmit="window.app_saveDayPlan(event, '${date}', '${targetId}')">
                        <div id="plans-container">
                            ${initialBlocks.map((p, idx) => blockFromPlan(p, idx)).join('')}
                        </div>
                        <div class="day-plan-footer">
                            <button type="button" onclick="window.app_addPlanBlockUI()" class="day-plan-add-task-btn"><i class="fa-solid fa-plus-circle"></i> <span>Add Task</span></button>
                            <div style="flex:1; min-width:280px; display:flex; gap:0.65rem;">
                                <button type="button" onclick="this.closest('.modal-overlay').remove()" class="day-plan-discard-btn">Discard</button>
                                <button type="submit" class="action-btn day-plan-save-btn"><i class="fa-solid fa-check-circle"></i> <span>Save Plan</span></button>
                            </div>
                        </div>
                    </form>
                    <div id="mention-dropdown"></div>
                </div>
            </div>
        `;

        window.app_showModal(html, 'day-plan-modal');

        const container = document.getElementById('plans-container');
        if (container) {
            container.addEventListener('input', (e) => {
                if (e.target.classList.contains('plan-task')) {
                    window.app_checkMentions(e.target, allUsers.filter(u => u.id !== targetId));
                }
            });
        }
    };

    window.app_openAnnualDayPlan = async (dateStr) => {
        await window.app_openDayPlan(dateStr);
    };

    window.app_addPlanBlockUI = async () => {
        const container = document.getElementById('plans-container');
        if (!container) return;
        const allUsers = await window.AppDB.getAll('users');
        const currentUser = window.AppAuth.getUser();
        const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
        const newBlock = document.createElement('div');
        newBlock.className = 'plan-block day-plan-block-shell';
        newBlock.innerHTML = `
            <div class="day-plan-block-body">
                <button type="button" onclick="this.closest('.plan-block').remove()" title="Remove this task" class="day-plan-remove-task-btn"><i class="fa-solid fa-times"></i></button>
                <div class="day-plan-left-panel">
                    <label class="day-plan-label">What will you work on?</label>
                    <p class="day-plan-help-text">Be specific. Use @ to tag collaborators.</p>
                    <textarea class="plan-task day-plan-task-input" required placeholder="Describe your plan for the day..."></textarea>
                    <div class="day-plan-sub-section">
                        <label class="day-plan-mini-label">Break into steps (optional)</label>
                        <div class="sub-plans-list day-plan-sub-list"></div>
                        <button type="button" onclick="window.app_addSubPlanRow(this)" class="day-plan-add-step-btn"><i class="fa-solid fa-plus"></i> Add Step</button>
                    </div>
                </div>
                <div class="day-plan-right-panel">
                    <label class="day-plan-label">Who's helping?</label>
                    <p class="day-plan-collab-hint">Type <b>@</b> in task text, then pick a teammate.</p>
                    <div class="tags-container">
                        <div class="no-tags-placeholder day-plan-no-tags-placeholder">
                            <div class="day-plan-no-tags-icon-wrap"><i class="fa-solid fa-user-plus day-plan-no-tags-icon"></i></div>
                            <p class="day-plan-no-tags-title">No collaborators yet</p>
                            <p class="day-plan-no-tags-text">Use <b>@</b> in your task to tag teammates</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="day-plan-bottom-controls">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <label class="day-plan-mini-label">Status</label>
                    <select class="plan-status day-plan-select">
                        <option value="" selected>Auto-Track (Recommended)</option>
                        <option value="completed">Completed</option>
                        <option value="not-completed">Not Completing</option>
                        <option value="in-process">In Progress</option>
                    </select>
                </div>
                ${isAdmin ? `
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <label class="day-plan-mini-label">Assign To</label>
                        <select class="plan-assignee day-plan-select">
                            ${allUsers.map(u => `<option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>
        `;
        container.appendChild(newBlock);
        const ta = newBlock.querySelector('.plan-task');
        if (ta) ta.focus();
    };

    window.app_addSubPlanRow = (btn) => {
        const list = btn.closest('.plan-block')?.querySelector('.sub-plans-list');
        if (!list) return;
        const row = document.createElement('div');
        row.className = 'sub-plan-row day-plan-sub-row';
        row.innerHTML = `
            <div class="day-plan-step-dot"></div>
            <input type="text" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        list.appendChild(row);
        const input = row.querySelector('input');
        if (input) input.focus();
    };

    window.app_checkMentions = (textarea, users) => {
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        const lastAt = text.lastIndexOf('@', cursorPos - 1);
        const dropdown = document.getElementById('mention-dropdown');
        if (!dropdown) return;

        if (lastAt !== -1 && !text.substring(lastAt, cursorPos).includes(' ')) {
            const query = text.substring(lastAt + 1, cursorPos).toLowerCase();
            const filtered = users.filter(u => u.name.toLowerCase().includes(query));
            if (!textarea.id) textarea.id = 'ta-' + Date.now();
            if (filtered.length > 0) {
                const rect = textarea.getBoundingClientRect();
                dropdown.innerHTML = filtered.map(u => `
                    <div onclick="window.app_applyMention('${textarea.id}', '${u.id}', '${u.name.replace(/'/g, "\\'")}', ${lastAt})" class="mention-item day-plan-mention-item">
                        <img src="${u.avatar}" class="day-plan-mention-avatar" />
                        <span>${u.name}</span>
                    </div>
                `).join('');
                dropdown.style.top = `${rect.bottom + 6}px`;
                dropdown.style.left = `${rect.left}px`;
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        } else {
            dropdown.style.display = 'none';
        }
    };

    window.app_applyMention = (taId, userId, userName, atPos) => {
        const textarea = document.getElementById(taId);
        if (!textarea) return;
        const cursorPos = textarea.selectionStart;
        const before = textarea.value.substring(0, atPos);
        const after = textarea.value.substring(cursorPos);
        textarea.value = `${before}${userName} ${after}`;
        textarea.focus();

        const block = textarea.closest('.plan-block');
        const tagsContainer = block?.querySelector('.tags-container');
        if (!tagsContainer) return;

        const dropdown = document.getElementById('mention-dropdown');
        if (dropdown) dropdown.style.display = 'none';

        const existing = tagsContainer.querySelector(`[data-id="${userId}"]`);
        if (existing) return;

        const placeholder = tagsContainer.querySelector('.no-tags-placeholder');
        if (placeholder) placeholder.remove();

        const chip = document.createElement('div');
        chip.className = 'tag-chip day-plan-tag-chip';
        chip.dataset.id = userId;
        chip.dataset.name = userName;
        chip.dataset.status = 'pending';
        chip.innerHTML = `<span class="day-plan-tag-main"><i class="fa-solid fa-at day-plan-tag-icon"></i>${userName} <span class="day-plan-tag-pending">(Pending)</span></span><i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>`;
        tagsContainer.appendChild(chip);
    };

    window.app_removeTagHint = (btn) => {
        const container = btn.closest('.tags-container');
        btn.parentElement.remove();
        if (container && container.querySelectorAll('.tag-chip').length === 0) {
            container.innerHTML = `
                <div class="no-tags-placeholder day-plan-no-tags-placeholder">
                    <div class="day-plan-no-tags-icon-wrap"><i class="fa-solid fa-user-plus day-plan-no-tags-icon"></i></div>
                    <p class="day-plan-no-tags-title">No collaborators yet</p>
                    <p class="day-plan-no-tags-text">Use <b>@</b> in your task to tag teammates</p>
                </div>
            `;
        }
    };

    window.app_showStatusTooltip = () => { };



    // === CHECKOUT FORM HELPER FUNCTIONS ===

    // Hide checkout intro panel
    window.app_hideCheckoutIntro = () => {
        const panel = document.getElementById('checkout-intro-panel');
        if (panel) {
            panel.style.display = 'none';
            localStorage.setItem('checkoutIntroSeen', 'true');
        }
    };

    // Update character counter in checkout textarea
    window.app_updateCharCounter = (textarea) => {
        const counter = document.getElementById('char-counter');
        if (counter) {
            const length = textarea.value.length;
            counter.textContent = `${length} / 500 recommended`;

            // Visual feedback for length
            if (length > 500) {
                counter.style.color = '#f59e0b'; // Orange for long text
            } else if (length > 300) {
                counter.style.color = '#10b981'; // Green for good length
            } else {
                counter.style.color = '#94a3b8'; // Default gray
            }
        }
    };

    // Select location reason (quick button)
    window.app_selectLocationReason = (reason) => {
        const textarea = document.getElementById('location-explanation');
        if (textarea) {
            // Clear previous selection styling
            document.querySelectorAll('.location-reason-btn').forEach(btn => {
                btn.style.background = '#e0f2fe';
                btn.style.borderColor = '#7dd3fc';
            });

            // Highlight selected button
            event.target.style.background = '#0ea5e9';
            event.target.style.borderColor = '#0ea5e9';
            event.target.style.color = 'white';

            // Set textarea value
            textarea.value = reason;
            textarea.focus();
        }
    };

    // Use work plan to fill checkout summary
    window.app_useWorkPlan = () => {
        const planTextEl = document.getElementById('checkout-plan-text');
        const summaryTextarea = document.getElementById('checkout-work-summary');
        const rawText = planTextEl?.dataset?.rawText;

        if (rawText && summaryTextarea) {
            summaryTextarea.value = rawText;

            // Update character counter
            if (window.app_updateCharCounter) {
                window.app_updateCharCounter(summaryTextarea);
            }

            // Focus the textarea
            summaryTextarea.focus();

            // Visual feedback
            summaryTextarea.style.borderColor = '#8b5cf6';
            summaryTextarea.style.background = '#f5f3ff';
            setTimeout(() => {
                summaryTextarea.style.borderColor = '#e2e8f0';
                summaryTextarea.style.background = '#ffffff';
            }, 1000);
        }
    };



    window.app_deleteDayPlan = async (date, targetUserId = null) => {
        if (!confirm("Are you sure you want to delete this work plan?")) return;
        const currentUser = window.AppAuth.getUser();
        const targetId = targetUserId || currentUser.id;

        try {
            await window.AppCalendar.deleteWorkPlan(date, targetId);
            if (window.AppStore && window.AppStore.invalidatePlans) {
                window.AppStore.invalidatePlans(); // CACHE INVALIDATION
            }
            alert("Plan deleted!");
            document.getElementById('day-plan-modal')?.remove();

            // Re-render Dashboard
            const html = await window.AppUI.renderDashboard();
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = html;
                if (window.setupDashboardEvents) window.setupDashboardEvents();
            }
        } catch (err) {
            alert(err.message);
        }
    };

    window.app_saveDayPlan = async (e, date, targetUserId = null) => {
        e.preventDefault();
        const currentUser = window.AppAuth.getUser();
        const targetId = targetUserId || currentUser.id;

        const planBlocks = document.querySelectorAll('.plan-block');
        const plans = [];

        planBlocks.forEach(block => {
            const task = block.querySelector('.plan-task').value.trim();
            const subPlanInputs = block.querySelectorAll('.sub-plan-input');
            const subPlans = Array.from(subPlanInputs).map(input => input.value.trim()).filter(v => v !== '');
            const tagChips = block.querySelectorAll('.tag-chip');
            const tags = Array.from(tagChips).map(chip => ({
                id: chip.dataset.id,
                name: chip.dataset.name,
                status: chip.dataset.status || 'pending'
            }));
            const status = block.querySelector('.plan-status').value;
            const assigneeSelect = block.querySelector('.plan-assignee');
            const assignedTo = assigneeSelect ? assigneeSelect.value : targetId;

            if (task) {
                plans.push({
                    task,
                    subPlans,
                    tags,
                    status: status || null,
                    assignedTo: assignedTo || null,
                    completedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : null
                });
            }
        });

        if (plans.length === 0) {
            alert("Please add at least one task.");
            return;
        }

        try {
            await window.AppCalendar.setWorkPlan(date, plans, targetId);
            if (window.AppStore && window.AppStore.invalidatePlans) {
                window.AppStore.invalidatePlans(); // CACHE INVALIDATION
            }

            const allUsers = await window.AppDB.getAll('users');

            // 1. Notify the owner if edited by an admin
            if (targetId !== currentUser.id && (currentUser.role === 'Administrator' || currentUser.isAdmin)) {
                const owner = allUsers.find(u => u.id === targetId);
                if (owner) {
                    if (!owner.notifications) owner.notifications = [];
                    const lastNotif = owner.notifications[owner.notifications.length - 1];
                    if (!lastNotif || lastNotif.message !== `Admin ${currentUser.name} has edited your Work Plan for ${date}`) {
                        owner.notifications.push({
                            type: 'admin_edit',
                            message: `Admin ${currentUser.name} has edited your Work Plan for ${date}`,
                            date: new Date().toLocaleString(),
                            read: false
                        });
                        await window.AppDB.put('users', owner);
                    }
                }
            }

            // 2. Send Notifications to newly tagged users
            const distinctTaggedUsers = new Set();
            plans.forEach(p => {
                if (p.tags) p.tags.forEach(t => distinctTaggedUsers.add(t.id));
            });

            if (distinctTaggedUsers.size > 0) {
                const planId = `plan_${targetId}_${date}`;
                for (const uid of distinctTaggedUsers) {
                    const targetUser = allUsers.find(u => u.id === uid);
                    if (targetUser && uid !== currentUser.id) {
                        if (!targetUser.notifications) targetUser.notifications = [];
                        plans.forEach((p, idx) => {
                            if (p.tags && p.tags.some(t => t.id === uid)) {
                                const alreadyNotified = targetUser.notifications.some(n =>
                                    n.type === 'mention' && n.planId === planId && n.taskIndex === idx
                                );
                                if (!alreadyNotified) {
                                    targetUser.notifications.push({
                                        id: `tag_${Date.now()}_${uid}_${idx}`,
                                        type: 'tag',
                                        title: p.task || 'Tagged task',
                                        description: p.subPlans && p.subPlans.length > 0 ? p.subPlans.join(', ') : '',
                                        taggedById: currentUser.id,
                                        taggedByName: currentUser.name,
                                        taggedAt: new Date().toISOString(),
                                        status: 'pending',
                                        source: 'plan',
                                        planId: planId,
                                        taskIndex: idx,
                                        message: `${currentUser.name} tagged you in: "${p.task}" for ${date}`,
                                        date: new Date().toLocaleString(),
                                        read: false
                                    });
                                }
                            }
                        });
                        await window.AppDB.put('users', targetUser);
                    }
                }

                for (let idx = 0; idx < plans.length; idx++) {
                    const p = plans[idx];
                    if (!p.tags) continue;
                    for (const t of p.tags) {
                        if (t.id === targetId) continue;
                        const recipient = allUsers.find(u => u.id === t.id);
                        if (!recipient || !window.AppCalendar) continue;
                        const details = p.subPlans && p.subPlans.length > 0 ? ` - ${p.subPlans.join(', ')}` : '';
                        const taskText = `${p.task}${details} (Responsible: ${recipient.name})`;
                        await window.AppCalendar.addWorkPlanTask(
                            date,
                            recipient.id,
                            taskText,
                            [{ id: currentUser.id, name: currentUser.name, status: 'pending' }],
                            {
                                addedFrom: 'tag',
                                sourcePlanId: planId,
                                sourceTaskIndex: idx,
                                taggedById: currentUser.id,
                                taggedByName: currentUser.name,
                                status: 'pending',
                                subPlans: p.subPlans || []
                            }
                        );
                    }
                }
            }
            alert("Plans saved successfully!");
            document.getElementById('day-plan-modal')?.remove();

            // Refresh
            const html = await window.AppUI.renderDashboard();
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = html;
                if (window.setupDashboardEvents) window.setupDashboardEvents();
            }
        } catch (err) {
            alert(err.message);
        }
    };

    window.app_handleTagResponse = async (planId, taskIndex, response, notifIdx) => {
        const user = window.AppAuth.getUser();
        try {
            // 1. Fetch the original work plan
            const plan = await window.AppDB.get('work_plans', planId);
            if (!plan || !plan.plans || !plan.plans[taskIndex]) {
                throw new Error("Plan or task not found.");
            }

            // 2. Update the tag status for the current user
            const task = plan.plans[taskIndex];
            if (task.tags) {
                const myTag = task.tags.find(t => t.id === user.id);
                if (myTag) {
                    myTag.status = response;
                }
            }

            // 3. Save the updated plan
            await window.AppDB.put('work_plans', plan);

            // 4. Update notification status (do not remove)
            const updatedUser = await window.AppDB.get('users', user.id);
            let rejectReason = '';
            if (response === 'rejected') {
                rejectReason = prompt('Optional: add a rejection reason', '') || '';
            }
            if (updatedUser && updatedUser.notifications) {
                const notif = updatedUser.notifications[notifIdx];
                if (notif) {
                    notif.status = response;
                    notif.respondedAt = new Date().toISOString();
                    if (rejectReason) notif.rejectReason = rejectReason;
                }
                if (!updatedUser.tagHistory) updatedUser.tagHistory = [];
                updatedUser.tagHistory.unshift({
                    id: `taghist_${Date.now()}`,
                    type: 'tag_response',
                    title: notif?.title || plan.plans[taskIndex].task || 'Tagged task',
                    taggedByName: notif?.taggedByName || plan.userName || 'Staff',
                    status: response,
                    reason: rejectReason,
                    date: new Date().toISOString()
                });
                await window.AppDB.put('users', updatedUser);
            }

            // 4b. Notify the tagger
            if (plan.userId) {
                const tagger = await window.AppDB.get('users', plan.userId);
                if (tagger) {
                    if (!tagger.notifications) tagger.notifications = [];
                    tagger.notifications.unshift({
                        id: `tagresp_${Date.now()}`,
                        type: 'tag_response',
                        message: `${user.name} ${response} your tag request.`,
                        title: plan.plans[taskIndex].task,
                        taggedByName: user.name,
                        status: response,
                        reason: rejectReason,
                        date: new Date().toISOString(),
                        read: false
                    });
                    await window.AppDB.put('users', tagger);
                }
            }

            // 5. Refresh UI
            if (window.AppStore && window.AppStore.invalidatePlans) {
                window.AppStore.invalidatePlans(); // CACHE INVALIDATION
            }
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
            if (window.setupDashboardEvents) window.setupDashboardEvents();

            alert(`You have ${response} the collaboration request.`);
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    window.app_changeCalMonth = (delta) => {
        let newMonth = window.app_calMonth + delta;
        if (newMonth < 0) { window.app_calYear--; newMonth = 11; }
        if (newMonth > 11) { window.app_calYear++; newMonth = 0; }
        window.app_calMonth = newMonth;
        // Refresh Dashboard
        window.AppUI.renderDashboard().then(async html => {
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = html;
            // Re-setup dashboard specific events (like attendance button)
            setupDashboardEvents();
        });
    };

    window.app_exportCalendar = async () => {
        const plans = window._currentPlans;
        const month = window.app_calMonth;
        const year = window.app_calYear;

        if (!plans) {
            alert("Calendar data not loaded yet.");
            return;
        }

        try {
            await window.AppReports.exportCalendarPlansCSV(plans, month, year);
        } catch (err) {
            alert("Export failed: " + err.message);
        }
    };

    // Meeting Minutes Handlers
    window.app_newMeeting = async () => {
        const user = window.AppAuth.getUser();
        const newMeeting = {
            id: 'meeting_' + Date.now(),
            title: '',
            date: new Date().toISOString().split('T')[0],
            minutes: '',
            author: user.name,
            timestamp: new Date().toISOString()
        };

        await window.AppDB.put('meetings', newMeeting);
        window._selectedMeetingId = newMeeting.id;

        const contentArea = document.getElementById('page-content');
        contentArea.innerHTML = await window.AppUI.renderMinutes();
    };

    window.app_selectMeeting = async (id) => {
        window._selectedMeetingId = id;
        const contentArea = document.getElementById('page-content');
        contentArea.innerHTML = await window.AppUI.renderMinutes();
    };

    window.app_saveMeeting = async () => {
        const title = document.getElementById('meeting-title')?.value;
        const date = document.getElementById('meeting-date')?.value;
        const minutes = document.getElementById('meeting-minutes')?.value;

        if (!window._selectedMeetingId) {
            alert('No meeting selected');
            return;
        }

        const meeting = await window.AppDB.get('meetings', window._selectedMeetingId);
        if (!meeting) {
            alert('Meeting not found');
            return;
        }

        meeting.title = title;
        meeting.date = date;
        meeting.minutes = minutes;
        meeting.timestamp = new Date().toISOString();

        await window.AppDB.put('meetings', meeting);

        const contentArea = document.getElementById('page-content');
        contentArea.innerHTML = await window.AppUI.renderMinutes();

        alert('Meeting minutes saved successfully!');
    };

    window.app_deleteMeeting = async (id) => {
        if (!confirm('Are you sure you want to delete this meeting?')) return;

        await window.AppDB.delete('meetings', id);
        window._selectedMeetingId = null;

        const contentArea = document.getElementById('page-content');
        contentArea.innerHTML = await window.AppUI.renderMinutes();
    };


    // Helper to postpone a task
    window.app_postponeTask = async (planId, taskIndex, taskText) => {
        const targetDate = prompt("When do you want to postpone this to? (YYYY-MM-DD)", new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        if (!targetDate) return;

        try {
            const user = window.AppAuth.getUser();
            // 1. Mark as 'postponed' in today's plan
            await window.AppCalendar.updateTaskStatus(planId, taskIndex, 'postponed');

            // 2. Add to target date's plan
            await window.AppCalendar.addWorkPlanTask(targetDate, user.id, taskText);
            if (window.AppStore && window.AppStore.invalidatePlans) {
                window.AppStore.invalidatePlans(); // CACHE INVALIDATION
            }

            alert(`Task postponed to ${targetDate}`);
            if (typeof handleAttendance === 'function') await handleAttendance();
        } catch (err) {
            alert("Failed to postpone task: " + err.message);
        }
    };

    // Helper to calculate distance in meters between two coordinates
    function calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371e3; // meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
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

                if (locationText) locationText.innerHTML = `<i class="fa-solid fa-location-dot"></i> Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)}`;

                const address = `Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)}`;
                await window.AppAttendance.checkIn(pos.lat, pos.lng, address);
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
                // Check if a reminder popup is needed
                await window.AppUI.checkDailyPlanReminder();
            } else {
                // Pre-fill Checkout Description from Work Plan
                const user = window.AppAuth.getUser();
                const today = getLocalISO();
                const workPlan = await window.AppCalendar.getWorkPlan(user.id, today);
                const collaborations = await window.AppCalendar.getCollaborations(user.id, today);

                // Ensure persistent modals are present
                const modalContainer = document.getElementById('modal-container');
                if (modalContainer && !document.getElementById('checkout-modal')) {
                    modalContainer.insertAdjacentHTML('beforeend', window.AppUI.renderModals());
                }

                // Show Check-Out Modal
                const modal = document.getElementById('checkout-modal');
                if (modal) {
                    const planRef = document.getElementById('checkout-plan-ref');
                    const planTextEl = document.getElementById('checkout-plan-text');
                    const descArea = modal.querySelector('textarea[name="description"]');

                    if (workPlan && (workPlan.plans || workPlan.plan)) {
                        if (planRef) planRef.style.display = 'block';

                        let displayPlan = "";
                        let rawPlanText = "";

                        if (workPlan.plans && workPlan.plans.length > 0) {
                            displayPlan = workPlan.plans.map((p, idx) => {
                                let txt = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #e9d5ff;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; color:#4c1d95;">${p.task}</div>
                                        ${p.subPlans && p.subPlans.length > 0 ? `<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${p.subPlans.join(', ')}</div>` : ''}
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        ${p.status === 'completed'
                                        ? '<span style="font-size:0.75rem; color:#059669; font-weight:700;">✅ Done</span>'
                                        : `<button type="button" onclick="window.app_postponeTask('${workPlan.id}', ${idx}, '${p.task}')" style="background:#f3e8ff; color:#7c3aed; border:1px solid #ddd6fe; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#f3e8ff'">⌛ Postpone</button>`
                                    }
                                    </div>
                                </div>`;
                                return txt;
                            }).join('');

                            rawPlanText = workPlan.plans.map(p => {
                                let txt = `• ${p.task}`;
                                if (p.subPlans && p.subPlans.length > 0) txt += ` (${p.subPlans.join(', ')})`;
                                return txt;
                            }).join('\n');

                        } else if (workPlan.plan) {
                            // Legacy
                            displayPlan = `<div style="font-weight:600; color:#4c1d95;">${workPlan.plan}</div>`;
                            rawPlanText = `• ${workPlan.plan}`;
                            if (workPlan.subPlans && workPlan.subPlans.length > 0) {
                                displayPlan += `<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${workPlan.subPlans.join(', ')}</div>`;
                                rawPlanText += ` (${workPlan.subPlans.join(', ')})`;
                            }
                        }

                        // Add Collaborations
                        if (collaborations && collaborations.length > 0) {
                            const collabText = collaborations.map(cp => {
                                return cp.plans.filter(p =>
                                    p.tags && p.tags.some(t => t.id === user.id && t.status === 'accepted')
                                ).map(p => {
                                    let txt = `🤝 [Collaborated with ${cp.userName}] ${p.task}`;
                                    if (p.subPlans && p.subPlans.length > 0) {
                                        txt += '\n👣 Steps: ' + p.subPlans.join(', ');
                                    }
                                    return txt;
                                }).join('\n');
                            }).join('\n\n');

                            if (displayPlan) displayPlan += '\n\n' + collabText;
                            else displayPlan = collabText;

                            if (rawPlanText) rawPlanText += '\n\n• ' + collabText;
                            else rawPlanText = '• ' + collabText;
                        }

                        if (planTextEl) planTextEl.innerHTML = displayPlan;
                        // Store raw text for the action button
                        if (planTextEl) planTextEl.dataset.rawText = rawPlanText;

                        // Pre-fill only if the textarea is empty
                        if (descArea && !descArea.value.trim()) {
                            descArea.value = rawPlanText;
                        }
                    } else {
                        if (planRef) planRef.style.display = 'none';
                    }

                    modal.style.display = 'flex';
                    if (btn) btn.disabled = false;

                    // Background Location Verification (Deferred)
                    const mismatchDiv = document.getElementById('checkout-location-mismatch');
                    const mismatchLoading = document.getElementById('checkout-location-loading');

                    if (mismatchLoading) mismatchLoading.style.display = 'block';
                    if (mismatchDiv) mismatchDiv.style.display = 'none';

                    // Use an async IIFE to not block the UI from showing the modal
                    (async () => {
                        try {
                            const currentPos = await getLocation();
                            const checkInLoc = user.currentLocation || user.lastLocation;

                            if (mismatchLoading) mismatchLoading.style.display = 'none';

                            if (checkInLoc && checkInLoc.lat && checkInLoc.lng) {
                                const dist = calculateDistance(currentPos.lat, currentPos.lng, checkInLoc.lat, checkInLoc.lng);
                                if (dist > 500) {
                                    if (mismatchDiv) mismatchDiv.style.display = 'block';
                                } else {
                                    if (mismatchDiv) mismatchDiv.style.display = 'none';
                                }
                            }
                        } catch (locErr) {
                            console.warn("Background location check failed:", locErr);
                            if (mismatchLoading) mismatchLoading.style.display = 'none';
                        }
                    })();
                } else {
                    await window.AppAttendance.checkOut();
                    const contentArea = document.getElementById('page-content');
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
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Locating & Saving...`;

            // Fetch location during checkout - fallback to manual explanation if denied
            let pos = null;
            let locationError = null;
            try {
                pos = await getLocation();
            } catch (err) {
                locationError = err;
            }

            // Detect mismatch for saving
            let locationMismatched = false;
            const checkInLoc = window.AppAuth.getUser()?.currentLocation;

            if (pos) {
                // Try to use cached location first for speed, otherwise use fetched pos
                const checkPos = (cachedLocation && (Date.now() - lastLocationFetch < LOCATION_CACHE_TIME))
                    ? cachedLocation
                    : pos;

                // Standardize pos to the one we are using for calculation/saving
                pos = checkPos;

                if (checkInLoc && checkInLoc.lat && checkInLoc.lng && pos.lat && pos.lng) {
                    const dist = calculateDistance(pos.lat, pos.lng, checkInLoc.lat, checkInLoc.lng);
                    if (dist > 500) locationMismatched = true;
                }
            }

            const explanation = form.locationExplanation ? form.locationExplanation.value.trim() : '';
            if (!pos && !explanation) {
                const mismatchDiv = document.getElementById('checkout-location-mismatch');
                if (mismatchDiv) mismatchDiv.style.display = 'block';
                alert("Location unavailable. Please provide a reason for checking out from a different location.");
                submitBtn.disabled = false;
                submitBtn.textContent = 'Complete Check-Out';
                return;
            }

            // Create formatted address string if no address available
            const formattedAddress = pos
                ? `Lat: ${Number(pos.lat).toFixed(4)}, Lng: ${Number(pos.lng).toFixed(4)}`
                : 'Location unavailable (reason provided)';
            const tomorrowGoal = form.tomorrowGoal ? form.tomorrowGoal.value.trim() : '';

            // 1. Save tomorrow's goal if provided
            if (tomorrowGoal) {
                const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                await window.AppCalendar.addWorkPlanTask(tomorrow, window.AppAuth.getUser().id, tomorrowGoal);
                console.log("Tomorrow's goal saved:", tomorrowGoal);
            }

            await window.AppAttendance.checkOut(
                description,
                pos ? pos.lat : null,
                pos ? pos.lng : null,
                formattedAddress,
                locationMismatched || !pos,
                explanation || (locationError ? String(locationError) : '')
            );

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
        if (e) e.preventDefault();

        // VALIDATED: Your evaluation is correct. e.target is the form, currentTarget is document.
        const form = (e && e.target && e.target.tagName === 'FORM') ? e.target : document.getElementById('edit-user-form');

        if (!form) {
            console.error("Critical Failure: Edit user form not found.");
            alert("Error: Form missing.");
            return;
        }

        const formData = new FormData(form);
        // VALIDATED: name="id" is present in ui.js, so this lookup is correct.
        const id = (formData.get('id') || "").trim();

        if (!id) {
            console.error("Data Failure: No 'id' name attribute found in form data.", {
                target: e.target,
                allData: Object.fromEntries(formData.entries())
            });
            alert('Error: User ID missing. Please refresh.');
            return;
        }

        const isAdminEl = form.querySelector('[name="isAdmin"]');
        const isAdmin = !!(isAdminEl && isAdminEl.checked);

        const userData = {
            id,
            name: (formData.get('name') || "").trim(),
            username: (formData.get('username') || "").trim(),
            password: (formData.get('password') || "").trim(),
            role: formData.get('role'),
            dept: formData.get('dept'),
            email: (formData.get('email') || "").trim(),
            phone: (formData.get('phone') || "").trim(),
            isAdmin
        };

        console.log("Executing Update for User:", userData);

        try {
            const success = await window.AppAuth.updateUser(userData);

            if (success) {
                console.log("Success: User updated in DB.");
                alert(`SUCCESS: Details for '${userData.name}' have been saved.`);
                document.getElementById('edit-user-modal').style.display = 'none';

                const contentArea = document.getElementById('page-content');
                if (contentArea) {
                    // Small delay to let DB settle
                    setTimeout(async () => {
                        contentArea.innerHTML = await window.AppUI.renderAdmin();
                        if (window.AppAnalytics) await window.AppAnalytics.initAdminCharts();
                    }, 50);
                }
            } else {
                alert('Update failed: User not found.');
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
        const readOnly = !!window.app_dashboardReadOnly;
        const targetUser = window.app_dashboardTargetUser || null;
        if (btn && !readOnly) btn.addEventListener('click', handleAttendance);
        startTimer(targetUser, readOnly);
    }
    window.setupDashboardEvents = setupDashboardEvents;

    // --- Global Event Delegation ---

    document.addEventListener('submit', (e) => {
        // Force prevent default for ALL forms in this app to prevent query param reloads
        e.preventDefault();

        // Use getAttribute('id') because elements with name="id" shadow the form.id property!
        const id = e.target.getAttribute('id');
        console.log("Submit Event Intercepted. Form ID:", id);

        if (id === 'manual-log-form') handleManualLog(e);
        else if (id === 'checkout-form') window.app_submitCheckOut(e);
        else if (id === 'add-user-form') handleAddUser(e);
        else if (id === 'login-form') {
            const fd = new FormData(e.target);
            window.AppAuth.login(fd.get('username'), fd.get('password')).then(success => {
                if (success) window.location.reload();
                else alert('Invalid Credentials');
            });
        }
        else if (id === 'edit-user-form') {
            console.log("Routing to app_submitEditUser...");
            window.app_submitEditUser(e);
        }
        else if (id === 'notify-form') handleNotifyUser(e);
        else if (id === 'leave-request-form') handleLeaveRequest(e);
        else {
            console.warn("Unhandled form submission ID:", id, "Target:", e.target);
        }
    });

    async function handleLeaveRequest(e) {
        const fd = new FormData(e.target);
        const user = window.AppAuth.getUser();
        await window.AppLeaves.requestLeave({
            userId: user.id,
            startDate: fd.get('startDate'),
            endDate: fd.get('endDate'),
            startTime: fd.get('startTime') || '',
            endTime: fd.get('endTime') || '',
            type: fd.get('type'),
            reason: fd.get('reason'),
            durationHours: fd.get('durationHours') || ''
        });

        alert('Leave requested successfully!');
        document.getElementById('leave-modal').style.display = 'none';
        e.target.reset();
    }

    async function handleNotifyUser(e) {

        e.preventDefault();
        const formData = new FormData(e.target);
        const toUserId = formData.get('toUserId');
        const reminderMsg = formData.get('reminderMessage') || '';
        const reminderLink = formData.get('reminderLink') || '';
        const taskTitle = formData.get('taskTitle') || '';
        const taskDesc = formData.get('taskDescription') || '';
        const taskDue = formData.get('taskDueDate') || '';

        try {
            if (!reminderMsg.trim() && !taskTitle.trim()) {
                alert('Please enter a reminder or a task.');
                return;
            }
            // Check if user exists
            const user = await window.AppDB.get('users', toUserId);
            if (!user) throw new Error("User not found");

            const currentUser = window.AppAuth.getUser();
            const nowIso = new Date().toISOString();
            // Add notification(s)
            if (!user.notifications) user.notifications = [];
            if (reminderMsg.trim()) {
                user.notifications.unshift({
                    id: `rem_${Date.now()}`,
                    type: 'reminder',
                    message: reminderMsg.trim(),
                    taggedById: currentUser.id,
                    taggedByName: currentUser.name,
                    taggedAt: nowIso,
                    status: 'pending',
                    date: nowIso,
                    read: false
                });
                await window.AppDB.add('staff_messages', {
                    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    type: 'text',
                    message: reminderMsg.trim(),
                    link: reminderLink.trim(),
                    fromId: currentUser.id,
                    fromName: currentUser.name,
                    toId: toUserId,
                    toName: user.name,
                    createdAt: nowIso,
                    read: false
                });
            }
            if (taskTitle.trim()) {
                user.notifications.unshift({
                    id: `task_${Date.now()}`,
                    type: 'task',
                    title: taskTitle.trim(),
                    description: taskDesc.trim(),
                    taggedById: currentUser.id,
                    taggedByName: currentUser.name,
                    taggedAt: nowIso,
                    status: 'pending',
                    dueDate: taskDue || '',
                    date: nowIso,
                    read: false
                });
                await window.AppDB.add('staff_messages', {
                    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    type: 'task',
                    title: taskTitle.trim(),
                    description: taskDesc.trim(),
                    dueDate: taskDue || '',
                    status: 'pending',
                    fromId: currentUser.id,
                    fromName: currentUser.name,
                    toId: toUserId,
                    toName: user.name,
                    createdAt: nowIso,
                    read: false,
                    history: [{ action: 'created', byId: currentUser.id, byName: currentUser.name, at: nowIso }]
                });
            }

            await window.AppAuth.updateUser(user);
            alert('Notification sent!');
            document.getElementById('notify-modal').style.display = 'none';
            if (window.app_updateStaffNavIndicator) {
                await window.app_updateStaffNavIndicator();
            }
        } catch (err) {
            alert('Failed to send: ' + err.message);
        }
    }

    window.app_openStaffThread = async (userId) => {
        window.app_staffThreadId = userId;
        const currentUser = window.AppAuth.getUser();
        if (!currentUser) return;
        const messages = await window.AppDB.getAll('staff_messages');
        const updates = messages.filter(m => m.toId === currentUser.id && m.fromId === userId && !m.read);
        for (const msg of updates) {
            msg.read = true;
            msg.readAt = new Date().toISOString();
            await window.AppDB.put('staff_messages', msg);
        }
        const contentArea = document.getElementById('page-content');
        if (contentArea) {
            contentArea.innerHTML = await window.AppUI.renderStaffDirectoryPage();
        }
        if (window.app_updateStaffNavIndicator) {
            await window.app_updateStaffNavIndicator();
        }
    };

    window.app_sendStaffText = async (e) => {
        e.preventDefault();
        const currentUser = window.AppAuth.getUser();
        const formData = new FormData(e.target);
        const toUserId = formData.get('toUserId');
        const message = (formData.get('message') || '').trim();
        const link = (formData.get('link') || '').trim();
        if (!message) {
            alert('Please type a message.');
            return;
        }
        const toUser = await window.AppDB.get('users', toUserId);
        if (!toUser) {
            alert('Staff member not found.');
            return;
        }
        await window.AppDB.add('staff_messages', {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'text',
            message,
            link,
            fromId: currentUser.id,
            fromName: currentUser.name,
            toId: toUserId,
            toName: toUser.name,
            createdAt: new Date().toISOString(),
            read: false
        });
        e.target.reset();
        const contentArea = document.getElementById('page-content');
        if (contentArea) {
            contentArea.innerHTML = await window.AppUI.renderStaffDirectoryPage();
        }
        if (window.app_updateStaffNavIndicator) {
            await window.app_updateStaffNavIndicator();
        }
    };

    window.app_sendStaffTask = async (e) => {
        e.preventDefault();
        const currentUser = window.AppAuth.getUser();
        const formData = new FormData(e.target);
        const toUserId = formData.get('toUserId');
        const title = (formData.get('taskTitle') || '').trim();
        const description = (formData.get('taskDescription') || '').trim();
        const dueDate = (formData.get('taskDueDate') || '').trim();
        if (!title) {
            alert('Please provide a task title.');
            return;
        }
        const toUser = await window.AppDB.get('users', toUserId);
        if (!toUser) {
            alert('Staff member not found.');
            return;
        }
        await window.AppDB.add('staff_messages', {
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'task',
            title,
            description,
            dueDate,
            status: 'pending',
            fromId: currentUser.id,
            fromName: currentUser.name,
            toId: toUserId,
            toName: toUser.name,
            createdAt: new Date().toISOString(),
            read: false,
            history: [{ action: 'created', byId: currentUser.id, byName: currentUser.name, at: new Date().toISOString() }]
        });
        e.target.reset();
        const contentArea = document.getElementById('page-content');
        if (contentArea) {
            contentArea.innerHTML = await window.AppUI.renderStaffDirectoryPage();
        }
        if (window.app_updateStaffNavIndicator) {
            await window.app_updateStaffNavIndicator();
        }
    };

    window.app_respondStaffTask = async (messageId, response) => {
        const currentUser = window.AppAuth.getUser();
        const msg = await window.AppDB.get('staff_messages', messageId);
        if (!msg) {
            alert('Task not found.');
            return;
        }
        if (msg.toId !== currentUser.id) {
            alert('Only the recipient can approve or reject this task.');
            return;
        }
        let reason = '';
        if (response === 'rejected') {
            reason = prompt('Optional: add a rejection reason', '') || '';
        }
        msg.status = response;
        msg.respondedAt = new Date().toISOString();
        if (reason) msg.rejectReason = reason;
        if (!msg.history) msg.history = [];
        msg.history.unshift({ action: response, byId: currentUser.id, byName: currentUser.name, at: msg.respondedAt, reason });

        if (response === 'approved' && !msg.calendarSynced) {
            const taskDate = msg.dueDate || new Date().toISOString().split('T')[0];
            const recipientName = msg.toName || currentUser.name;
            const details = `${msg.title}${msg.description ? ` - ${msg.description}` : ''}`;
            if (window.AppCalendar) {
                await window.AppCalendar.addWorkPlanTask(taskDate, msg.toId, `${details} (Responsible: ${recipientName})`, [], {
                    addedFrom: 'staff',
                    sourcePlanId: msg.id,
                    sourceTaskIndex: 0,
                    taggedById: msg.fromId,
                    taggedByName: msg.fromName,
                    status: 'pending'
                });
                await window.AppCalendar.addWorkPlanTask(taskDate, msg.fromId, `${details} (Assigned to ${recipientName})`, [], {
                    addedFrom: 'staff',
                    sourcePlanId: msg.id,
                    sourceTaskIndex: 1,
                    taggedById: msg.fromId,
                    taggedByName: msg.fromName,
                    status: 'pending'
                });
                msg.calendarSynced = true;
            }
        }
        await window.AppDB.put('staff_messages', msg);

        const sender = await window.AppDB.get('users', msg.fromId);
        if (sender) {
            if (!sender.notifications) sender.notifications = [];
            sender.notifications.unshift({
                id: `taskresp_${Date.now()}`,
                type: 'task_response',
                message: `${currentUser.name} ${response} a task.`,
                title: msg.title,
                taggedByName: currentUser.name,
                status: response,
                reason,
                date: msg.respondedAt,
                read: false
            });
            await window.AppDB.put('users', sender);
        }
        const contentArea = document.getElementById('page-content');
        if (contentArea) {
            contentArea.innerHTML = await window.AppUI.renderStaffDirectoryPage();
        }
        if (window.app_updateStaffNavIndicator) {
            await window.app_updateStaffNavIndicator();
        }
    };

    window.app_updateStaffNavIndicator = async () => {
        const currentUser = window.AppAuth.getUser();
        if (!currentUser) return;
        const navTargets = document.querySelectorAll('[data-page="staff-directory"]');
        if (!navTargets.length) return;
        const messages = await window.AppDB.getAll('staff_messages');
        const hasUnread = messages.some(m => m.toId === currentUser.id && !m.read);
        navTargets.forEach(el => {
            if (hasUnread) el.classList.add('has-new-msg');
            else el.classList.remove('has-new-msg');
        });
    };

    window.app_handleTagDecision = async (notifId, response) => {
        const user = window.AppAuth.getUser();
        try {
            const updatedUser = await window.AppDB.get('users', user.id);
            if (!updatedUser || !updatedUser.notifications) throw new Error('Notification not found');
            const notif = updatedUser.notifications.find(n => n.id === notifId);
            if (!notif) throw new Error('Notification not found');
            let reason = '';
            if (response === 'rejected') reason = prompt('Optional: add a rejection reason', '') || '';
            notif.status = response;
            notif.respondedAt = new Date().toISOString();
            if (reason) notif.rejectReason = reason;
            if (!updatedUser.tagHistory) updatedUser.tagHistory = [];
            updatedUser.tagHistory.unshift({
                id: `taghist_${Date.now()}`,
                type: 'tag_response',
                title: notif.title || notif.message || 'Tagged item',
                taggedByName: notif.taggedByName || 'Staff',
                status: response,
                reason,
                date: new Date().toISOString()
            });
            await window.AppDB.put('users', updatedUser);

            if (notif.taggedById) {
                const tagger = await window.AppDB.get('users', notif.taggedById);
                if (tagger) {
                    if (!tagger.notifications) tagger.notifications = [];
                    tagger.notifications.unshift({
                        id: `tagresp_${Date.now()}`,
                        type: 'tag_response',
                        message: `${user.name} ${response} your ${notif.type || 'tag'}.`,
                        title: notif.title || '',
                        taggedByName: user.name,
                        status: response,
                        reason,
                        date: new Date().toISOString(),
                        read: false
                    });
                    await window.AppDB.put('users', tagger);
                }
            }

            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                if (window.setupDashboardEvents) window.setupDashboardEvents();
            }
        } catch (err) {
            alert('Failed to update tag: ' + err.message);
        }
    };

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
        console.log("Opening Edit Modal for ID:", userId);
        const user = await window.AppDB.get('users', userId);
        console.log("User Data Found:", user);
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

    window.app_quickAddTask = async (userId) => {
        const currentUser = window.AppAuth.getUser();
        const isAdmin = currentUser && (currentUser.role === 'Administrator' || currentUser.isAdmin);
        if (!isAdmin && userId !== currentUser.id) {
            alert('Only administrators can assign tasks to other staff.');
            return;
        }
        const taskText = prompt('Task to assign:', '');
        if (!taskText || !taskText.trim()) return;
        const dateInput = prompt('Task date (YYYY-MM-DD). Leave blank for today:', '');
        const date = dateInput && dateInput.trim()
            ? dateInput.trim()
            : new Date().toISOString().split('T')[0];
        try {
            if (!window.AppCalendar) throw new Error('Calendar module not available.');
            await window.AppCalendar.addWorkPlanTask(date, userId, taskText.trim());
            await window.AppDB.add('staff_messages', {
                id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                type: 'task',
                title: taskText.trim(),
                description: '',
                dueDate: date,
                status: 'pending',
                fromId: currentUser.id,
                fromName: currentUser.name,
                toId: userId,
                toName: (await window.AppDB.get('users', userId))?.name || 'Staff',
                createdAt: new Date().toISOString(),
                read: false,
                history: [{ action: 'created', byId: currentUser.id, byName: currentUser.name, at: new Date().toISOString() }]
            });
            alert('Task added successfully.');
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                if (window.setupDashboardEvents) window.setupDashboardEvents();
            }
            if (window.app_updateStaffNavIndicator) {
                await window.app_updateStaffNavIndicator();
            }
        } catch (err) {
            alert('Failed to add task: ' + err.message);
        }
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
                                <td><span class="badge ${log.isManualOverride ? 'manual' : ''}" style="font-size:0.7rem; padding: 2px 6px;">${log.type || 'Office'}</span></td>
                                <td style="font-size:0.85rem; color:#6b7280;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        ${locDisplay}
                                        <button onclick="window.app_deleteLog('${log.id}', '${userId}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete Log"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </td>
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
                <div style="display:flex; gap:0.5rem;">
                    <button onclick="window.app_openManualLogModal('${user.id}')" class="action-btn" style="padding:0.5rem 1rem; font-size:0.9rem; background:#10b981; border:none;">
                        <i class="fa-solid fa-plus"></i> Add Manual Log
                    </button>
                    <button onclick="window.AppReports.exportUserLogsCSV(window.currentViewedUser, window.currentViewedLogs)" class="action-btn secondary" style="padding:0.5rem 1rem; font-size:0.9rem;">
                        <i class="fa-solid fa-file-export"></i> Export Report
                    </button>
                </div>
            </div>
            ${logsHTML}
        `;
        document.getElementById('user-details-modal').style.display = 'flex';
    };

    window.app_openManualLogModal = (userId) => {
        const html = `
            <div class="modal-overlay" id="manual-admin-log-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3>Add Manual Attendance</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                    <form onsubmit="window.app_submitManualLog(event, '${userId}')">
                        <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Date</label>
                                <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time In</label>
                                    <input type="time" name="checkIn" required value="09:00" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="17:00" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Category / Rule Override</label>
                                <select name="type" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    <option value="Present">Present (Full Day)</option>
                                    <option value="Work - Home">Work from Home</option>
                                    <option value="Late">Late (Mark as Late)</option>
                                    <option value="Early Departure">Early Departure</option>
                                    <option value="Training">Training</option>
                                    <option value="Absent">Absent</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Admin Comment</label>
                                <textarea name="description" placeholder="Reason for manual entry..." style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px; height:60px;"></textarea>
                            </div>
                            <button type="submit" class="action-btn" style="width:100%; margin-top:1rem;">Save Manual Entry</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        window.app_showModal(html, 'manual-admin-log-modal');
    };

    window.app_submitManualLog = async (e, userId) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const checkIn = fd.get('checkIn');
        const checkOut = fd.get('checkOut');

        const dur = calculateDuration(checkIn, checkOut);
        if (dur === 'Invalid') {
            alert('End time must be after Start time');
            return;
        }

        // Convert 24h back to AM/PM for display consistency (optional, but better)
        const formatTime = (timeStr) => {
            const [h, m] = timeStr.split(':');
            const hours = parseInt(h);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayH = hours % 12 || 12;
            return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
        };

        const logData = {
            date: fd.get('date'),
            checkIn: formatTime(checkIn),
            checkOut: formatTime(checkOut),
            duration: dur,
            type: fd.get('type'),
            workDescription: fd.get('description') || 'Manual Entry by Admin',
            location: 'Office (Manual)',
            durationMs: (new Date(`1970-01-01T${checkOut}:00`) - new Date(`1970-01-01T${checkIn}:00`))
        };

        try {
            await window.AppAttendance.addAdminLog(userId, logData);
            alert("Attendance added manually.");
            document.getElementById('manual-admin-log-modal')?.remove();
            // Refresh logs view
            window.app_viewLogs(userId);
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    window.app_deleteLog = async (logId, userId) => {
        if (!confirm("Are you sure you want to delete this attendance record?")) return;
        try {
            await window.AppAttendance.deleteLog(logId);
            alert("Record deleted.");
            window.app_viewLogs(userId);
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    // --- Leave Management Handlers ---
    window.app_approveLeave = async (leaveId) => {
        if (!confirm("Are you sure you want to APPROVE this leave request?")) return;
        try {
            const user = window.AppAuth.getUser();
            await window.AppLeaves.updateLeaveStatus(leaveId, 'Approved', user.id);
            alert("Leave Approved! Attendance logs have been automatically generated.");

            // Refresh Dashboard
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    window.app_rejectLeave = async (leaveId) => {
        const reason = prompt("Enter rejection reason (optional):", "");
        if (reason === null) return; // Cancelled

        try {
            const user = window.AppAuth.getUser();
            await window.AppLeaves.updateLeaveStatus(leaveId, 'Rejected', user.id, reason);
            alert("Leave Rejected.");

            // Refresh Dashboard
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    window.app_addLeaveComment = async (leaveId) => {
        const leave = await window.AppDB.get('leaves', leaveId);
        const comment = prompt("Enter/Edit Admin Comment:", leave.adminComment || "");
        if (comment === null) return;

        try {
            const user = window.AppAuth.getUser();
            await window.AppLeaves.updateLeaveStatus(leaveId, leave.status, user.id, comment);
            alert("Comment saved.");

            // Refresh Dashboard
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    window.app_exportLeaves = async () => {
        try {
            const allLeaves = await window.AppLeaves.getAllLeaves();
            if (allLeaves.length === 0) {
                alert("No leave requests found to export.");
                return;
            }
            await window.AppReports.exportLeavesCSV(allLeaves);
        } catch (err) {
            alert("Export Failed: " + err.message);
        }
    };


    window.app_refreshMasterSheet = async () => {
        const contentArea = document.getElementById('page-content');
        if (contentArea) {
            const m = document.getElementById('sheet-month')?.value;
            const y = document.getElementById('sheet-year')?.value;
            contentArea.innerHTML = await window.AppUI.renderMasterSheet(m, y);
        }
    };

    window.app_exportMasterSheet = async () => {
        const month = parseInt(document.getElementById('sheet-month').value);
        const year = parseInt(document.getElementById('sheet-year').value);
        const users = await window.AppDB.getAll('users');

        // Filtered Query for Logs (Optimization)
        const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-31`;
        const logs = await window.AppDB.query('attendance', 'date', '>=', startDateStr);
        const filteredLogs = logs.filter(l => l.date <= endDateStr);

        await window.AppReports.exportMasterSheetCSV(month, year, users, filteredLogs);
    };

    window.app_openCellOverride = async (userId, dateStr) => {
        const user = (await window.AppDB.getAll('users')).find(u => u.id === userId);
        const logs = await window.AppDB.getAll('attendance');
        const existingLog = logs.find(l => (l.userId === userId || l.user_id === userId) && l.date === dateStr);

        const html = `
            <div class="modal-overlay" id="cell-override-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <div>
                            <h3 style="margin:0;">Edit Attendance</h3>
                            <p style="font-size:0.8rem; color:#666; margin:4px 0 0 0;">${user.name} | ${dateStr}</p>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                        <form onsubmit="window.app_submitCellOverride(event, '${userId}', '${dateStr}', '${existingLog?.id || ''}')">
                            <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time In</label>
                                    <input type="time" name="checkIn" required value="${existingLog ? convertTo24h(existingLog.checkIn) : '09:00'}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="${existingLog ? convertTo24h(existingLog.checkOut) : '17:00'}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Entry Type</label>
                                <select name="type" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    <option value="Present" ${existingLog?.type === 'Present' ? 'selected' : ''}>Present</option>
                                    <option value="Work - Home" ${existingLog?.type === 'Work - Home' ? 'selected' : ''}>WFH</option>
                                    <option value="Late" ${existingLog?.type === 'Late' ? 'selected' : ''}>Late</option>
                                    <option value="Absent" ${existingLog?.type === 'Absent' ? 'selected' : ''}>Absent</option>
                                    <option value="Casual Leave" ${existingLog?.type === 'Casual Leave' ? 'selected' : ''}>Leave</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Admin Reason</label>
                                <textarea name="description" placeholder="Override reason..." style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px; height:60px;">${existingLog?.workDescription || ''}</textarea>
                            </div>
                            ${existingLog?.autoCheckoutRequiresApproval ? `
                                <div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; border:1px solid #fde68a; border-radius:8px; background:#fffbeb;">
                                    <input type="checkbox" name="autoCheckoutExtraApproved" id="auto-extra-approve" ${existingLog?.autoCheckoutExtraApproved ? 'checked' : ''}>
                                    <label for="auto-extra-approve" style="font-size:0.8rem; color:#92400e; cursor:pointer;">Approve extra hours for auto check-out</label>
                                </div>
                            ` : ''}
                            <div style="display:flex; gap:0.75rem;">
                                <button type="submit" class="action-btn" style="flex:2;">${existingLog ? 'Update Log' : 'Create Log'}</button>
                                ${existingLog ? `<button type="button" onclick="window.app_deleteCellLog('${existingLog.id}', '${userId}')" class="action-btn checkout" style="flex:1; padding:0;">Delete</button>` : ''}
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                                <input type="checkbox" name="isManualOverride" id="override-check" ${existingLog?.isManualOverride ? 'checked' : ''}>
                                <label for="override-check" style="font-size:0.8rem; color:#666; cursor:pointer;">Mark as Manual Override</label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
        window.app_showModal(html, 'cell-override-modal');
    };

    window.app_submitCellOverride = async (e, userId, dateStr, logId) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const checkIn = fd.get('checkIn');
        const checkOut = fd.get('checkOut');

        const dur = calculateDuration(checkIn, checkOut);
        if (dur === 'Invalid') {
            alert('End time must be after Start time');
            return;
        }

        const formatTime = (timeStr) => {
            if (!timeStr || timeStr === '--') return '--';
            const [h, m] = timeStr.split(':');
            const hours = parseInt(h);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayH = hours % 12 || 12;
            return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
        };

        const logData = {
            date: dateStr,
            checkIn: formatTime(checkIn),
            checkOut: formatTime(checkOut),
            duration: dur,
            type: fd.get('type'),
            workDescription: fd.get('description') || 'Admin Override',
            location: 'Office (Override)',
            durationMs: (new Date(`1970-01-01T${checkOut}:00`) - new Date(`1970-01-01T${checkIn}:00`)),
            isManualOverride: fd.get('isManualOverride') === 'on',
            autoCheckoutExtraApproved: fd.get('autoCheckoutExtraApproved') === 'on'
        };

        try {
            if (logId) {
                await window.AppAttendance.updateLog(logId, logData);
            } else {
                await window.AppAttendance.addAdminLog(userId, logData);
            }
            alert("Override successful.");
            document.getElementById('cell-override-modal')?.remove();
            window.app_refreshMasterSheet();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    window.app_deleteCellLog = async (logId, userId) => {
        if (!confirm("Delete this attendance record?")) return;
        try {
            await window.AppAttendance.deleteLog(logId);
            document.getElementById('cell-override-modal')?.remove();
            window.app_refreshMasterSheet();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    function convertTo24h(timeStr) {
        if (!timeStr || timeStr === '--' || timeStr === 'Active Now') return '09:00';
        const [time, ampm] = timeStr.split(' ');
        let [h, m] = time.split(':');
        let hours = parseInt(h);
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${m}`;
    }


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



    window.app_recalculateRow = (row) => {
        const base = parseFloat(row.querySelector('.base-salary-input').value) || 0;
        const dailyRate = base / 22;
        const unpaid = parseFloat(row.querySelector('.unpaid-leaves-count').innerText) || 0;
        const penaltyEl = row.querySelector('.penalty-count');
        const penalty = penaltyEl ? (parseFloat(penaltyEl.dataset.penalty) || 0) : 0;
        const globalTds = parseFloat(document.getElementById('global-tds-percent').value) || 0;
        const tdsInput = row.querySelector('.tds-input');
        if (tdsInput && !tdsInput.dataset.manual) {
            tdsInput.value = globalTds;
        }
        const tdsPercent = tdsInput ? (parseFloat(tdsInput.value) || 0) : globalTds;

        const deduct = Math.round(dailyRate * (unpaid + penalty));
        row.querySelector('.deduction-amount').innerText = '-₹' + deduct.toLocaleString();

        const adjInput = row.querySelector('.salary-input');
        if (!adjInput.dataset.manual) {
            adjInput.value = Math.max(0, base - deduct);
        }

        const adjusted = parseFloat(adjInput.value) || 0;
        const tdsAmount = Math.round(adjusted * (tdsPercent / 100));
        const finalNet = Math.max(0, adjusted - tdsAmount);

        row.querySelector('.tds-amount').innerText = '₹' + tdsAmount.toLocaleString();
        row.querySelector('.tds-amount').dataset.value = tdsAmount;
        row.querySelector('.final-net-salary').innerText = '₹' + finalNet.toLocaleString();
        row.querySelector('.final-net-salary').dataset.value = finalNet;
    };

    window.app_recalculateAllSalaries = () => {
        document.querySelectorAll('tr[data-user-id]').forEach(row => {
            window.app_recalculateRow(row);
        });
    };

    window.app_saveAllSalaries = async () => {
        const rows = document.querySelectorAll('tr[data-user-id]');
        const salaryRecords = [];
        const userUpdates = [];
        const today = new Date();
        const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
        const globalTdsPercent = parseFloat(document.getElementById('global-tds-percent').value) || 0;

        for (const row of rows) {
            const userId = row.dataset.userId;
            const baseSalaryInput = row.querySelector('.base-salary-input').value;
            const adjustedSalary = row.querySelector('.salary-input').value;
            const comment = row.querySelector('.comment-input').value;
            const tdsInput = row.querySelector('.tds-input');
            const rowTdsPercent = tdsInput ? (parseFloat(tdsInput.value) || 0) : globalTdsPercent;
            const tdsAmount = row.querySelector('.tds-amount').dataset.value || 0;
            const finalNet = row.querySelector('.final-net-salary').dataset.value || 0;

            // Check if comment required
            if (row.querySelector('.comment-input').required && !comment) {
                alert(`Please provide a comment for user ID: ${userId} as the salary was adjusted.`);
                return;
            }

            // Record for the month
            salaryRecords.push({
                id: `salary_${userId}_${monthKey}`,
                userId,
                month: monthKey,
                baseAmount: Number(baseSalaryInput),
                deductions: Number(row.querySelector('.deduction-amount').innerText.replace(/[^0-9.-]+/g, "")),
                adjustedAmount: Number(adjustedSalary),
                tdsPercent: rowTdsPercent,
                tdsAmount: Number(tdsAmount),
                finalNet: Number(finalNet),
                comment: comment || '',
                processedAt: Date.now()
            });

            // Update user's base salary if changed
            userUpdates.push({
                id: userId,
                baseSalary: Number(baseSalaryInput),
                tdsPercent: rowTdsPercent
            });
        }

        try {
            // Persist monthly records
            for (const record of salaryRecords) {
                await window.AppDB.put('salaries', record);
            }

            // Sync user base salaries
            for (const update of userUpdates) {
                const existingUser = await window.AppDB.get('users', update.id);
                if (existingUser) {
                    existingUser.baseSalary = update.baseSalary;
                    existingUser.tdsPercent = update.tdsPercent;
                    await window.AppDB.put('users', existingUser);
                }
            }

            alert('All records and TDS details saved successfully!');
            // Refresh view to ensure calculations sync with any base salary changes
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderSalaryProcessing();
        } catch (err) {
            console.error("Salary Save Error:", err);
            alert('Failed to save records: ' + err.message);
        }
    };

    window.app_exportSalaryCSV = () => {
        const rows = document.querySelectorAll('tr[data-user-id]');
        let csv = 'Staff Name,Base Salary,Attendance (P/L/UL),Deductions,Adjusted Salary,TDS (%),TDS Amount,Final Net,Comment\n';

        rows.forEach(row => {
            const name = row.querySelector('div[style*="font-weight: 600"]').innerText;
            const base = row.querySelector('.base-salary-input').value;
            const attendance = row.querySelector('td:nth-child(3)').innerText.replace(/[\n|]/g, '').trim();
            const deduct = row.querySelector('.deduction-amount').innerText.replace('₹', '').replace(',', '');
            const adjusted = row.querySelector('.salary-input').value;
            const globalTdsPercent = parseFloat(document.getElementById('global-tds-percent').value) || 0;
            const tdsInput = row.querySelector('.tds-input');
            const tdsP = tdsInput && tdsInput.value !== ''
                ? tdsInput.value
                : globalTdsPercent;
            const tdsA = row.querySelector('.tds-amount').innerText.replace('₹', '').replace(',', '');
            const net = row.querySelector('.final-net-salary').innerText.replace('₹', '').replace(',', '');
            const comment = row.querySelector('.comment-input').value;

            csv += `"${name}",${base},"${attendance}",${deduct},${adjusted},${tdsP},${tdsA},${net},"${comment}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const month = new Date().toLocaleDateString('default', { month: 'short', year: 'numeric' });
        a.setAttribute('href', url);
        a.setAttribute('download', `Salaries_${month.replace(' ', '_')}.csv`);
        a.click();
    };

    // --- Admin Task Management Functions ---

    /**
     * Edit task status (admin or user)
     */
    window.app_editTaskStatus = async function (planId, taskIndex, newStatus) {
        try {
            const user = window.AppAuth.getUser();
            const completedDate = newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null;

            await window.AppCalendar.updateTaskStatus(planId, taskIndex, newStatus, completedDate);

            // Refresh dashboard
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
            alert(`Task status updated to: ${newStatus}`);
        } catch (err) {
            console.error('Failed to update task status:', err);
            alert('Failed to update task status. Please try again.');
        }
    };

    /**
     * Reassign task to another user (admin only)
     */
    window.app_reassignTask = async function (planId, taskIndex, newUserId) {
        try {
            const user = window.AppAuth.getUser();
            if (user.role !== 'Administrator' && !user.isAdmin) {
                alert('Only administrators can reassign tasks.');
                return;
            }

            await window.AppCalendar.reassignTask(planId, taskIndex, newUserId);

            // Refresh dashboard
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
            alert('Task reassigned successfully!');
        } catch (err) {
            console.error('Failed to reassign task:', err);
            alert('Failed to reassign task. Please try again.');
        }
    };

    /**
     * View task details modal
     */
    window.app_viewTaskDetails = async function (planId, taskIndex) {
        try {
            const plan = await window.AppDB.get('work_plans', planId);
            if (!plan || !plan.plans || !plan.plans[taskIndex]) {
                alert('Task not found.');
                return;
            }

            const task = plan.plans[taskIndex];
            const status = window.AppCalendar.getSmartTaskStatus(plan.date, task.status);

            const statusColors = {
                'to-be-started': '#3b82f6',
                'in-process': '#eab308',
                'completed': '#22c55e',
                'overdue': '#ef4444',
                'not-completed': '#6b7280'
            };

            const statusLabels = {
                'to-be-started': '🔵 To Be Started',
                'in-process': '🟡 In Process',
                'completed': '🟢 Completed',
                'overdue': '🔴 Overdue',
                'not-completed': '⚫ Not Completed'
            };

            const modalHTML = `
                <div class="modal-overlay" id="task-details-modal" style="display: flex;">
                    <div class="modal-content" style="max-width: 500px;">
                        <h2 style="margin-bottom: 1rem;">Task Details</h2>
                        
                        <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Task</label>
                                <p style="margin: 0.25rem 0 0 0; font-weight: 500;">${task.task}</p>
                            </div>
                            
                            <div style="margin-bottom: 0.75rem;">
                                <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Planned Date</label>
                                <p style="margin: 0.25rem 0 0 0;">${plan.date}</p>
                            </div>
                            
                            <div style="margin-bottom: 0.75rem;">
                                <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Status</label>
                                <p style="margin: 0.25rem 0 0 0;">
                                    <span style="background: ${statusColors[status]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                                        ${statusLabels[status]}
                                    </span>
                                </p>
                            </div>
                            
                            ${task.completedDate ? `
                                <div style="margin-bottom: 0.75rem;">
                                    <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Completed Date</label>
                                    <p style="margin: 0.25rem 0 0 0;">${task.completedDate}</p>
                                </div>
                            ` : ''}
                            
                            ${task.subPlans && task.subPlans.length > 0 ? `
                                <div>
                                    <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Sub-tasks</label>
                                    <ul style="margin: 0.25rem 0 0 0; padding-left: 1.5rem;">
                                        ${task.subPlans.map(sub => `<li>${sub}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="document.getElementById('task-details-modal').remove()" class="action-btn" style="flex: 1;">Close</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('modal-container').innerHTML = modalHTML;
        } catch (err) {
            console.error('Failed to view task details:', err);
            alert('Failed to load task details.');
        }
    };

    /**
     * Recalculate all user ratings (admin only)
     */
    window.app_recalculateRatings = async function () {
        try {
            const user = window.AppAuth.getUser();
            if (user.role !== 'Administrator' && !user.isAdmin) {
                alert('Only administrators can recalculate ratings.');
                return;
            }

            if (!confirm('This will recalculate ratings for all users. Continue?')) {
                return;
            }

            const updatedUsers = await window.AppRating.updateAllRatings();
            alert(`Successfully updated ratings for ${updatedUsers.length} users!`);

            // Refresh dashboard
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
        } catch (err) {
            console.error('Failed to recalculate ratings:', err);
            alert('Failed to recalculate ratings. Please try again.');
        }
    };

    // Listeners for Modal Events 
    // (We keep these as they are internal to app.js logic or standard form submits)
    // Removed old document.addEventListener calls for admin actions since we use global funcs now.

    window.app_triggerManualAudit = async () => {
        if (!confirm("Trigger a manual location audit for all active staff?")) return;
        const slotName = `Manual Audit @ ${new Date().toLocaleTimeString()}`;
        try {
            await window.AppDB.add('system_commands', {
                type: 'audit',
                slotName: slotName,
                timestamp: Date.now(),
                requestedBy: window.AppAuth.getUser()?.name || 'Admin',
                status: 'pending'
            });
            alert("Manual audit command sent. All active staff devices will now perform a stealth check.");
        } catch (err) {
            console.error("Failed to trigger manual audit:", err);
            alert("Error: " + err.message);
        }
    };

    window.app_applyAuditFilter = async () => {
        const start = document.getElementById('audit-start')?.value;
        const end = document.getElementById('audit-end')?.value;
        const contentArea = document.getElementById('page-content');
        if (contentArea) {
            contentArea.innerHTML = await window.AppUI.renderAdmin(start, end);
            if (window.AppAnalytics) window.AppAnalytics.initAdminCharts();
        }
    };

    window.app_exportAudits = async () => {
        const start = document.getElementById('audit-start')?.value;
        const end = document.getElementById('audit-end')?.value;

        try {
            let audits = await window.AppDB.getAll('location_audits');
            if (start && end) {
                audits = audits.filter(a => {
                    const d = new Date(a.timestamp).toISOString().split('T')[0];
                    return d >= start && d <= end;
                });
            }
            audits.sort((a, b) => b.timestamp - a.timestamp);

            if (audits.length === 0) {
                alert("No audits found for the selected range.");
                return;
            }

            const headers = ['Timestamp', 'Date', 'Time', 'Staff Member', 'Slot', 'Status', 'Latitude', 'Longitude'];
            const rows = audits.map(a => [
                a.timestamp,
                new Date(a.timestamp).toLocaleDateString(),
                new Date(a.timestamp).toLocaleTimeString(),
                a.userName || 'Unknown',
                a.slot,
                a.status,
                a.lat || '',
                a.lng || ''
            ]);

            const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `security_audits_${start || 'export'}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed: " + err.message);
        }
    };

    window.app_changeAnnualYear = (delta) => {
        window.app_annualYear = (window.app_annualYear || new Date().getFullYear()) + delta;
        window.AppUI.renderAnnualPlan().then(html => {
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = html;
            }
        });
    };

    window.app_toggleAnnualLegendFilter = (key) => {
        const filters = window.app_annualLegendFilters || {
            leave: true,
            event: true,
            work: true,
            overdue: true,
            completed: true
        };
        if (Object.prototype.hasOwnProperty.call(filters, key)) {
            filters[key] = !filters[key];
            window.app_annualLegendFilters = filters;
            window.AppUI.renderAnnualPlan().then(html => {
                const contentArea = document.getElementById('page-content');
                if (contentArea) {
                    contentArea.innerHTML = html;
                }
            });
        }
    };

    window.app_showAnnualDayDetails = async (dateStr) => {
        if (!dateStr) return;
        const plans = window._currentPlans || await window.AppCalendar.getPlans();
        const filters = window.app_annualLegendFilters || {
            leave: true,
            event: true,
            work: true,
            overdue: true,
            completed: true
        };
        const events = (window.app_getDayEvents(dateStr, plans, { includeAuto: false }) || []).filter(ev => {
            if (ev.type === 'leave') return !!filters.leave;
            if (ev.type === 'work') return !!filters.work;
            if (ev.type === 'holiday') return !!filters.event;
            return !!filters.event;
        });
        const listHTML = events.length ? events.map(ev => {
            const type = ev.type || 'event';
            const tagStyle = type === 'leave'
                ? 'background:#fee2e2;color:#991b1b;'
                : type === 'work'
                    ? 'background:#e0e7ff;color:#3730a3;'
                    : type === 'holiday'
                        ? 'background:#f1f5f9;color:#334155;'
                        : 'background:#dcfce7;color:#166534;';
            const tasks = type === 'work' && Array.isArray(ev.plans) && ev.plans.length
                ? `<ul style="margin:0.5rem 0 0 1rem; padding:0; color:#475569; font-size:0.8rem;">
                    ${ev.plans.map(p => `<li>${p.task || 'Work plan item'}</li>`).join('')}
                   </ul>`
                : '';
            return `
                <div style="border:1px solid #eef2f7; border-radius:12px; padding:0.75rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; ${tagStyle}">${type.toUpperCase()}</span>
                        <div style="font-size:0.9rem; color:#1f2937; font-weight:600;">${ev.title || 'Event'}</div>
                    </div>
                    ${tasks}
                </div>`;
        }).join('') : '<div style="text-align:center; color:#94a3b8; padding:1rem;">No visible items for this date with current filters.</div>';
        const html = `
            <div class="modal-overlay" id="annual-day-detail-modal" style="display:flex;">
                <div class="annual-detail-modal">
                    <div class="annual-detail-modal-header">
                        <div>
                            <div style="font-size:0.8rem; color:#64748b;">Date</div>
                            <div style="font-size:1rem; font-weight:700; color:#1e1b4b;">${dateStr}</div>
                        </div>
                        <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:60vh; overflow:auto;">
                        ${listHTML}
                    </div>
                </div>
            </div>`;
        window.app_showModal(html, 'annual-day-detail-modal');
    };

    window.app_toggleAnnualView = (mode) => {
        window.app_annualViewMode = mode;
        window.AppUI.renderAnnualPlan().then(html => {
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = html;
            }
        });
    };

    window.app_jumpToAnnualToday = () => {
        const today = new Date();
        window.app_annualYear = today.getFullYear();
        window.app_selectedAnnualDate = today.toISOString().split('T')[0];
        window.AppUI.renderAnnualPlan().then(html => {
            const contentArea = document.getElementById('page-content');
            if (contentArea) {
                contentArea.innerHTML = html;
            }
            window.app_showAnnualDayDetails(window.app_selectedAnnualDate);
        });
    };

    window.app_closeModal = (el) => {
        const overlay = el && el.closest ? el.closest('.modal-overlay') : null;
        if (overlay) overlay.remove();
    };

    window.app_forceRefresh = async () => {
        try {
            if (navigator.serviceWorker) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }
            if (window.caches) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
        } catch (err) {
            console.warn('Force refresh cleanup failed:', err);
        }
        window.location.reload(true);
    };

    // Initialization
    init();

    console.log("App.js Loaded & Globals Ready");
})();
