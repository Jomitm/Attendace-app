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
    let adminListenerUnsubscribe = null;
    let cachedLocation = null;
    let lastLocationFetch = 0;
    const LOCATION_CACHE_TIME = 30000; // 30 seconds cache

    // DOM Elements - queried dynamically or once if available
    const contentArea = document.getElementById('page-content');
    const sidebar = document.querySelector('.sidebar');
    const mobileHeader = document.querySelector('.mobile-header');
    const mobileNav = document.querySelector('.mobile-nav');

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
        cleanURL();
        try {
            await window.AppAuth.init();
            registerSW();
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
        if (hash !== 'admin' && adminListenerUnsubscribe) {
            console.log("Cleaning up Admin Realtime Listener.");
            adminListenerUnsubscribe();
            adminListenerUnsubscribe = null;
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
                <img src="${user.avatar}" alt="User">
                <div>
                    <p class="user-name">${user.name}</p>
                    <p class="user-role">${user.role}</p>
                </div>
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
        if (adminListenerUnsubscribe) adminListenerUnsubscribe();

        console.log("Starting Admin Realtime Listener...");
        adminListenerUnsubscribe = window.AppDB.listen('users', async (data) => {
            const currentHash = window.location.hash.slice(1);
            if (currentHash !== 'admin') return;

            const openModal = document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]');

            // Only update if NO modal is open (to prevent overwriting form state)
            if (!openModal) {
                console.log("Admin Data Update Received (Realtime) - Refreshing UI");
                const contentArea = document.getElementById('page-content');
                if (contentArea) {
                    contentArea.innerHTML = await window.AppUI.renderAdmin();
                    if (window.AppAnalytics) window.AppAnalytics.initAdminCharts();
                }
            } else {
                console.log("Admin Update received but skipped because a modal is open.");
            }
        });
    }

    // --- Event Handlers ---

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);

        const updateTimerUI = async () => {
            const { status, lastCheckIn } = await window.AppAttendance.getStatus();
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
                        let hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
                        let mins = Math.floor((diff / (1000 * 60)) % 60);
                        let secs = Math.floor((diff / 1000) % 60);

                        hrs = (hrs < 10) ? "0" + hrs : hrs;
                        mins = (mins < 10) ? "0" + mins : mins;
                        secs = (secs < 10) ? "0" + secs : secs;
                        display.textContent = `${hrs} : ${mins} : ${secs}`;
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
                        let oHrs = Math.floor((otDiff / (1000 * 60 * 60)) % 24);
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

                // Start Activity Monitor
                if (window.AppActivity && window.AppActivity.start) window.AppActivity.start();

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

    window.app_getDayEvents = (dateStr, plans) => {
        if (!plans) return [];
        const dateObj = new Date(dateStr);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const d = dateObj.getDate();

        const evs = [];

        // 1. Add Automatic Day Types (Saturdays, Sundays)
        if (window.AppAnalytics) {
            const dayType = window.AppAnalytics.getDayType(dateObj);
            if (dayType === 'Holiday') {
                evs.push({ title: 'Company Holiday (Weekend)', type: 'holiday' });
            } else if (dayType === 'Half Day') {
                evs.push({ title: 'Half Working Day (Sat)', type: 'event' });
            }
        }

        (plans.leaves || []).forEach(l => {
            if (dateStr >= l.startDate && dateStr <= l.endDate) {
                evs.push({ title: `${l.userName || 'Staff'} (Leave)`, type: 'leave', userId: l.userId });
            }
        });
        (plans.events || []).forEach(e => {
            if (e.date === dateStr) evs.push({ title: e.title, type: e.type || 'event' });
        });
        (plans.workPlans || []).forEach(p => {
            if (p.date === dateStr) {
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

    window.app_openDayPlan = async (date, targetUserId = null) => {
        const currentUser = window.AppAuth.getUser();
        const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
        const targetId = targetUserId || currentUser.id;

        const plans = window._currentPlans;

        const evs = window.app_getDayEvents(date, plans);
        const myWorkPlan = plans && plans.workPlans ? plans.workPlans.find(p => p.date === date && p.userId === targetId) : null;
        const teamActivity = evs.filter(e => e.type === 'leave' || e.type === 'event');
        const otherStaffPlans = evs.filter(e => e.type === 'work' && e.userId !== targetId);
        const allUsers = await window.AppDB.getAll('users');
        const targetStaff = allUsers.find(u => u.id === targetId);

        // Format date nicely
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        // Check if intro panel has been seen
        const introPanelSeen = localStorage.getItem('workPlanIntroSeen') === 'true';

        const html = `
            <div class="modal-overlay" id="day-plan-modal" style="display:flex; align-items:flex-start; padding-top:2rem;">
                <div class="modal-content" style="max-width: 800px; width: 95%; padding: 1.5rem; border-radius: 16px;">
                    
                    <!-- Redesigned Header -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
                                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);">
                                    <i class="fa-solid fa-calendar-day" style="color:white; font-size:1.1rem;"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.3rem; margin:0; font-weight:700; color:#111827;">Plan Your Day${targetId !== currentUser.id ? ` - ${targetStaff?.name || 'Staff'}` : ''}</h3>
                                    <p style="font-size:0.875rem; color:#64748b; margin:0.25rem 0 0 0;">${formattedDate} • Break down tasks, set goals, and collaborate</p>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            ${myWorkPlan ? `<button onclick="window.app_deleteDayPlan('${date}', '${targetId}')" title="Delete this entire plan" style="background:#fff1f2; border:1px solid #fecaca; color:#ef4444; width:36px; height:36px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fff1f2'"><i class="fa-solid fa-trash-can" style="font-size:0.9rem;"></i></button>` : ''}
                            <button onclick="this.closest('.modal-overlay').remove()" title="Close without saving" style="background:#f1f5f9; border:none; width:36px; height:36px; border-radius:8px; font-size:1.3rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">&times;</button>
                        </div>
                    </div>

                    <!-- How to Use Panel (Collapsible) -->
                    <div id="intro-panel" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #bae6fd; border-radius:12px; padding:1rem; margin-bottom:1.5rem; display:${introPanelSeen ? 'none' : 'block'};">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <i class="fa-solid fa-lightbulb" style="color:#0369a1; font-size:1rem;"></i>
                                <h4 style="margin:0; font-size:0.95rem; font-weight:700; color:#0369a1;">How to Use This Form</h4>
                            </div>
                            <button onclick="window.app_hideIntroPanel()" title="Hide this guide" style="background:transparent; border:none; color:#0369a1; cursor:pointer; font-size:1.2rem; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(3, 105, 161, 0.1)'" onmouseout="this.style.background='transparent'">&times;</button>
                        </div>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.75rem;">
                            <div style="display:flex; gap:0.5rem;">
                                <div style="background:#0ea5e9; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">1</div>
                                <div>
                                    <p style="margin:0; font-size:0.8rem; font-weight:600; color:#0c4a6e;">📝 Write Your Tasks</p>
                                    <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#075985; line-height:1.3;">Describe what you'll work on today</p>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <div style="background:#0ea5e9; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">2</div>
                                <div>
                                    <p style="margin:0; font-size:0.8rem; font-weight:600; color:#0c4a6e;">⏱️ Break Into Steps</p>
                                    <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#075985; line-height:1.3;">Add smaller actionable items</p>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <div style="background:#0ea5e9; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">3</div>
                                <div>
                                    <p style="margin:0; font-size:0.8rem; font-weight:600; color:#0c4a6e;">👥 Tag Teammates</p>
                                    <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#075985; line-height:1.3;">Type @ to mention collaborators</p>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <div style="background:#0ea5e9; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; flex-shrink:0;">4</div>
                                <div>
                                    <p style="margin:0; font-size:0.8rem; font-weight:600; color:#0c4a6e;">✅ Track Progress</p>
                                    <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:#075985; line-height:1.3;">Status updates automatically</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Team Context Cards -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; margin-bottom:1.5rem;">
                         <div style="background:#f8fafc; padding:0.75rem; border-radius:10px; border:1px solid #e2e8f0;">
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                                <i class="fa-solid fa-users" style="color:#64748b; font-size:0.85rem;"></i>
                                <label style="font-size: 0.7rem; font-weight:700; color: #64748b; text-transform:uppercase; letter-spacing:0.5px; margin:0;">Who's Out Today</label>
                            </div>
                            <div style="max-height: 80px; overflow-y:auto; display:flex; flex-direction:column; gap:3px;">
                                ${teamActivity.length ? teamActivity.map(e => `
                                    <div style="font-size: 0.8rem; display:flex; gap:6px; align-items:center; color:#475569;">
                                        <span style="width:6px; height:6px; border-radius:50%; background:${e.type === 'leave' ? '#ef4444' : '#10b981'}"></span>
                                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.title}</span>
                                    </div>
                                `).join('') : '<div style="color:#94a3b8; font-size:0.75rem; font-style:italic;">Everyone available today</div>'}
                            </div>
                         </div>
                         <div style="background:#f8fafc; padding:0.75rem; border-radius:10px; border:1px solid #e2e8f0;">
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                                <i class="fa-solid fa-clipboard-list" style="color:#64748b; font-size:0.85rem;"></i>
                                <label style="font-size: 0.7rem; font-weight:700; color: #64748b; text-transform:uppercase; letter-spacing:0.5px; margin:0;">Team's Plans Today</label>
                            </div>
                            <div style="max-height: 80px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
                                ${otherStaffPlans.length ? otherStaffPlans.map(e => {
            const parts = e.title.split(':');
            return `<div style="font-size: 0.8rem; color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${e.title.split(':').slice(1).join(':')}"><b style="color:var(--primary); font-size:0.75rem;">${parts[0].split(' ')[0]}:</b> ${parts.slice(1).join(':').trim()}</div>`;
        }).join('') : '<div style="color:#94a3b8; font-size:0.75rem; font-style:italic;">No other plans yet</div>'}
                            </div>
                         </div>
                    </div>
                    
                    <form onsubmit="window.app_saveDayPlan(event, '${date}', '${targetId}')">
                        <div id="plans-container" style="max-height: 50vh; overflow-y: auto; padding-right: 5px;">
                            ${(myWorkPlan && myWorkPlan.plans && myWorkPlan.plans.length > 0)
                ? myWorkPlan.plans.map((p, idx) => renderPlanBlock(p, idx, allUsers)).join('')
                : (myWorkPlan && myWorkPlan.plan)
                    ? renderPlanBlock({ task: myWorkPlan.plan, subPlans: myWorkPlan.subPlans || [], tags: [] }, 0, allUsers)
                    : renderPlanBlock({ task: '', subPlans: [], tags: [] }, 0, allUsers)
            }
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; gap:1rem; flex-wrap:wrap;">
                            <button type="button" onclick="window.app_addPlanBlockUI()" style="flex:1; min-width:200px; background:#f0fdf4; border:1px dashed #22c55e; border-radius:10px; padding:0.85rem; font-size:0.9rem; color:#166534; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:center; gap:0.5rem; transition: all 0.2s;" onmouseover="this.style.background='#dcfce7'; this.style.borderStyle='solid'" onmouseout="this.style.background='#f0fdf4'; this.style.borderStyle='dashed'">
                                <i class="fa-solid fa-plus-circle"></i> <span>➕ Add Another Task</span>
                            </button>
                            <div style="flex:1.5; min-width:300px; display:flex; gap:0.75rem;">
                                <button type="button" onclick="this.closest('.modal-overlay').remove()" style="flex:1; padding:0.85rem; background:#fff; border:1px solid #e2e8f0; border-radius:10px; cursor:pointer; font-weight:600; color:#64748b; font-size:0.95rem; transition: all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">✕ Discard Changes</button>
                                <button type="submit" class="action-btn" style="flex:2; padding:0.85rem; font-size:0.95rem; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                                    <i class="fa-solid fa-check-circle"></i> <span>💾 Save My Plan</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Mention Dropdown (Shared) -->
                <div id="mention-dropdown" style="display:none; position:fixed; z-index:10000; background:white; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); width:240px; max-height:250px; overflow-y:auto; padding:4px;">
                    <div style="padding:8px 12px; font-size:0.7rem; color:#64748b; font-weight:700; text-transform:uppercase; display:flex; align-items:center; gap:0.5rem; border-bottom:1px solid #f1f5f9;">
                        <i class="fa-solid fa-at" style="color:#6366f1;"></i>
                        <span>Tag a Teammate</span>
                    </div>
                    <div id="mention-list-items"></div>
                </div>
            </div>
        `;
        window.app_showModal(html, 'day-plan-modal');

        // Setup event delegation for mentions
        const container = document.getElementById('plans-container');
        if (container) {
            container.addEventListener('input', (e) => {
                if (e.target.classList.contains('plan-task')) {
                    window.app_checkMentions(e.target, allUsers.filter(u => u.id !== targetId));
                }
            });
            // Close dropdown on focus out or click away
            document.addEventListener('mousedown', (e) => {
                const dropdown = document.getElementById('mention-dropdown');
                if (dropdown && !dropdown.contains(e.target) && !e.target.classList.contains('plan-task')) {
                    dropdown.style.display = 'none';
                }
            });
        }

        function renderPlanBlock(plan, index, users) {
            const calculatedStatus = window.AppCalendar.getSmartTaskStatus(date, plan.status);
            const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;

            // Example placeholders that rotate
            const taskExamples = [
                "Example: Review Q1 budget report with @TeamMember",
                "Example: Update client presentation slides for Friday meeting",
                "Example: Complete code review for authentication module",
                "Example: Prepare monthly analytics dashboard @DataTeam"
            ];
            const randomExample = taskExamples[index % taskExamples.length];

            return `
                <div class="plan-block" data-index="${index}" style="background:#fff; border:2px solid #e2e8f0; border-radius:14px; padding:0; margin-bottom:1.5rem; position:relative; overflow:hidden; display:flex; min-height:180px; flex-direction: column; transition: all 0.2s;" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="this.style.borderColor='#e2e8f0'">
                    <div style="display: flex; flex: 1; min-height: 180px;">
                        ${index > 0 ? `<button type="button" onclick="this.closest('.plan-block').remove()" title="Remove this task" style="position:absolute; top:10px; right:10px; background:#fff1f2; border:1px solid #fecaca; color:#ef4444; width:28px; height:28px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:5; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='#fff1f2'; this.style.transform='scale(1)'"><i class="fa-solid fa-times" style="font-size:0.75rem;"></i></button>` : ''}
                        
                        <!-- Left: Task Description (60%) -->
                        <div style="flex: 1.5; padding: 1.25rem; border-right: 2px solid #f1f5f9;">
                             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <div style="background:#6366f1; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem;">1</div>
                                    <label style="font-size:0.85rem; font-weight:700; color:#334155; margin:0;">📝 What will you work on?</label>
                                </div>
                                ${window.AppUI.renderTaskStatusBadge ? window.AppUI.renderTaskStatusBadge(calculatedStatus) : ''}
                             </div>
                             <p style="font-size:0.75rem; color:#64748b; margin:0 0 0.75rem 0; font-style:italic; line-height:1.4;">Be specific about your goal. Type @ to tag a teammate who will help you.</p>
                             <textarea class="plan-task" required placeholder="${randomExample}" style="width:100%; height:80px; padding:0.85rem; border:2px solid #e2e8f0; border-radius:10px; font-family:inherit; resize:none; margin-bottom:0.85rem; font-size:0.95rem; line-height:1.5; background:#fcfdfe; transition: border-color 0.2s;" onfocus="this.style.borderColor='#6366f1'; this.style.background='#ffffff'" onblur="this.style.borderColor='#e2e8f0'; this.style.background='#fcfdfe'">${plan.task || ''}</textarea>
                             
                             <div style="background:#fef9f3; padding:0.6rem; border-radius:8px; border:1px solid #fed7aa; margin-bottom:0.75rem; display:${plan.task && plan.task.includes('@') ? 'block' : 'none'}">
                                <p style="font-size:0.75rem; color:#9a3412; margin:0; display:flex; align-items:center; gap:0.4rem;">
                                    <i class="fa-solid fa-circle-info" style="font-size:0.85rem;"></i>
                                    <span>💡 Typing @ will show teammates you can tag</span>
                                </p>
                             </div>
                             
                             <div style="border-top:1px dashed #e2e8f0; padding-top:0.75rem;">
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                                    <div style="background:#8b5cf6; color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.65rem;">2</div>
                                    <label style="font-size:0.8rem; font-weight:600; color:#334155; margin:0;">⏱️ Break it down into steps <span style="font-size:0.7rem; color:#94a3b8; font-weight:400;">(Optional)</span></label>
                                </div>
                                <p style="font-size:0.7rem; color:#64748b; margin:0 0 0.5rem 0; font-style:italic;">Smaller steps make big tasks easier to complete</p>
                                <div class="sub-plans-list" style="display:flex; flex-direction:column; gap:0.5rem;">
                                   ${plan.subPlans ? plan.subPlans.map(sub => `
                                       <div class="sub-plan-row" style="display:flex; gap:0.5rem; align-items:center;">
                                           <div style="width:8px; height:8px; background:#a78bfa; border-radius:50%; flex-shrink:0;"></div>
                                           <input type="text" value="${sub}" class="sub-plan-input" placeholder="e.g., Gather data, Create charts, Review..." style="flex:1; padding:0.5rem; border:1px solid #e2e8f0; border-radius:6px; font-size:0.85rem; background:#fafafa; outline:none; transition: all 0.2s;" onfocus="this.style.borderColor='#8b5cf6'; this.style.background='#ffffff'" onblur="this.style.borderColor='#e2e8f0'; this.style.background='#fafafa'">
                                           <button type="button" onclick="this.parentElement.remove()" title="Remove step" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:4px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i class="fa-solid fa-circle-xmark"></i></button>
                                       </div>
                                   `).join('') : ''}
                                </div>
                                <button type="button" onclick="window.app_addSubPlanRow(this)" style="background:none; border:1px dashed #e2e8f0; border-radius:6px; padding:6px 10px; font-size:0.8rem; color:#8b5cf6; cursor:pointer; margin-top:0.5rem; display:flex; align-items:center; gap:6px; font-weight:600; width:100%; justify-content:center; transition: all 0.2s;" onmouseover="this.style.background='#faf5ff'; this.style.borderColor='#8b5cf6'; this.style.borderStyle='solid'" onmouseout="this.style.background='transparent'; this.style.borderColor='#e2e8f0'; this.style.borderStyle='dashed'">
                                   <i class="fa-solid fa-plus"></i> ➕ Add a Step
                                </button>
                             </div>
                        </div>
    
                        <!-- Right: Collaborators (40%) -->
                        <div style="flex: 1; padding: 1.25rem; background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%); display:flex; flex-direction:column;">
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
                                <div style="background:#a78bfa; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem;">3</div>
                                <label style="font-size:0.85rem; font-weight:700; color:#334155; margin:0;">👥 Who's helping?</label>
                            </div>
                            <p style="font-size:0.7rem; color:#6b21a8; margin:0 0 0.75rem 0; background:#faf5ff; padding:0.5rem; border-radius:6px; border:1px solid #e9d5ff; line-height:1.4;">
                                <span style="font-weight:600;">How to tag:</span> Type <span style="background:#8b5cf6; color:white; padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.65rem;">@</span> in the task field above, then click a name.
                            </p>
                            <div class="tags-container" style="display:flex; flex-direction:column; gap:0.5rem; flex:1;">
                                ${plan.tags ? plan.tags.map(t => `
                                    <div class="tag-chip" data-id="${t.id}" data-name="${t.name}" data-status="${t.status || 'pending'}" style="background:white; color:#334155; padding:8px 12px; border-radius:10px; font-size:0.8rem; display:flex; align-items:center; justify-content:space-between; font-weight:600; border:1px solid #c4b5fd; box-shadow:0 2px 4px rgba(139, 92, 246, 0.1);">
                                        <span style="display:flex; align-items:center; gap:6px;">
                                            <i class="fa-solid fa-user-tag" style="color:#8b5cf6; font-size:0.75rem;"></i>
                                            <span>${t.name}</span>
                                            <span style="font-size:0.65rem; padding:2px 6px; border-radius:4px; background:${t.status === 'accepted' ? '#dcfce7' : (t.status === 'rejected' ? '#fee2e2' : '#fef3c7')}; color:${t.status === 'accepted' ? '#166534' : (t.status === 'rejected' ? '#991b1b' : '#854d0e')}; font-weight:700;">
                                                ${t.status === 'accepted' ? '✅' : (t.status === 'rejected' ? '❌' : '🟡')} ${t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Pending'}
                                            </span>
                                        </span>
                                        <i class="fa-solid fa-times" onclick="this.parentElement.remove()" title="Remove collaborator" style="cursor:pointer; font-size:0.75rem; color:#94a3b8; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'"></i>
                                    </div>
                                `).join('') : ''}
                                ${(!plan.tags || plan.tags.length === 0) ? `
                                    <div class="no-tags-placeholder" style="font-size:0.75rem; color:#a78bfa; text-align:center; padding:1.5rem 1rem; border:2px dashed #ddd6fe; border-radius:10px; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.5rem; background:white;">
                                        <div style="background:#f5f3ff; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:0.25rem;">
                                            <i class="fa-solid fa-user-plus" style="font-size:1.2rem; color:#8b5cf6;"></i>
                                        </div>
                                        <p style="margin:0; font-weight:600; color:#6b21a8;">No collaborators yet</p>
                                        <p style="margin:0; font-size:0.7rem; color:#9333ea; line-height:1.3;">Type <b>@</b> in your task<br/>to tag a teammate</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bottom Controls: Status and Assignment -->
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 0.85rem 1.25rem; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <label style="font-size: 0.75rem; font-weight: 700; color: #334155; display:flex; align-items:center; gap:0.35rem;">
                                    ✅ STATUS:
                                    <button type="button" onclick="window.app_showStatusTooltip(this)" title="Click for help" style="background:#e0e7ff; border:none; color:#4338ca; width:16px; height:16px; border-radius:50%; cursor:pointer; font-size:0.65rem; font-weight:700; display:flex; align-items:center; justify-content:center;">?</button>
                                </label>
                            </div>
                            <select class="plan-status" style="padding: 6px 10px; border-radius: 8px; border: 2px solid #d1d5db; font-size: 0.8rem; background: white; color: #374151; font-weight:600; cursor:pointer; transition: border-color 0.2s;" onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#d1d5db'">
                                <option value="" ${!plan.status ? 'selected' : ''}>🤖 Auto-Track (Recommended)</option>
                                <option value="completed" ${plan.status === 'completed' ? 'selected' : ''}>✅ I Finished This</option>
                                <option value="not-completed" ${plan.status === 'not-completed' ? 'selected' : ''}>❌ Won't Complete</option>
                                <option value="in-process" ${plan.status === 'in-process' ? 'selected' : ''}>🟡 Working On It</option>
                            </select>
                        </div>
                        
                        ${isAdmin ? `
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <label style="font-size: 0.75rem; font-weight: 700; color: #334155;">👤 ASSIGN TO:</label>
                                <select class="plan-assignee" style="padding: 6px 10px; border-radius: 8px; border: 2px solid #d1d5db; font-size: 0.8rem; background: white; color: #374151; font-weight:600; cursor:pointer; transition: border-color 0.2s;" onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#d1d5db'">
                                    ${users.map(u => `<option value="${u.id}" ${u.id === (plan.assignedTo || currentUser.id) ? 'selected' : ''}>${u.name}</option>`).join('')}
                                </select>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Status Tooltip (Hidden by default) -->
                    <div class="status-tooltip" style="display:none; position:absolute; bottom:60px; left:1.25rem; background:#1e293b; color:white; padding:0.85rem; border-radius:10px; font-size:0.75rem; max-width:280px; z-index:10; box-shadow:0 10px 25px rgba(0,0,0,0.3); line-height:1.5;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                            <strong style="font-size:0.8rem;">Status Tracking Help</strong>
                            <button onclick="this.closest('.status-tooltip').style.display='none'" style="background:transparent; border:none; color:white; cursor:pointer; font-size:1rem;">&times;</button>
                        </div>
                        <p style="margin:0.4rem 0; color:#cbd5e1;"><b>🤖 Auto-Track:</b> App decides based on date</p>
                        <ul style="margin:0; padding-left:1.2rem; color:#cbd5e1;">
                            <li style="margin:0.25rem 0;">Future → To Start</li>
                            <li style="margin:0.25rem 0;">Today → In Progress</li>
                            <li style="margin:0.25rem 0;">Past → Overdue</li>
                        </ul>
                        <p style="margin:0.4rem 0 0 0; color:#cbd5e1;"><b>Manual options:</b> Mark yourself when done</p>
                        <div style="position:absolute; bottom:-6px; left:20px; width:12px; height:12px; background:#1e293b; transform:rotate(45deg);"></div>
                    </div>
                </div>
            `;
        }
    };

    window.app_addPlanBlockUI = async () => {
        const container = document.getElementById('plans-container');
        if (!container) return;
        const allUsers = await window.AppDB.getAll('users');
        const currentUser = window.AppAuth.getUser();
        const index = container.querySelectorAll('.plan-block').length;

        const html = `
                <div class="plan-block" data-index="${index}" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:0; margin-bottom:1.25rem; position:relative; overflow:hidden; display:flex; flex-direction:column; min-height:160px; animation: fadeIn 0.3s ease;">
                    <button type="button" onclick="this.closest('.plan-block').remove()" style="position:absolute; top:8px; right:8px; background:#fff1f2; border:none; color:#ef4444; width:24px; height:24px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:5;"><i class="fa-solid fa-times" style="font-size:0.7rem;"></i></button>
                    
                    <!-- Left: Self Plan (65%) -->
                    <div style="flex: 1; display: flex; min-height: 160px;">
                        <div style="flex: 1.8; padding: 1rem; border-right: 1px solid #f1f5f9;">
                             <label style="display:block; font-size:0.65rem; font-weight:800; color:#94a3b8; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px;">1. My Tasks & Steps</label>
                             <textarea class="plan-task" required placeholder="Type task... use @ to tag staff" style="width:100%; height:70px; padding:0.75rem; border:1px solid #e2e8f0; border-radius:10px; font-family:inherit; resize:none; margin-bottom:0.75rem; font-size:0.9rem; line-height:1.4; background:#fcfdfe;"></textarea>
                             
                             <div class="sub-plans-list" style="display:flex; flex-direction:column; gap:0.4rem;"></div>
                             <button type="button" onclick="window.app_addSubPlanRow(this)" style="background:none; border:none; padding:4px 0; font-size:0.75rem; color:var(--primary); cursor:pointer; margin-top:0.4rem; display:flex; align-items:center; gap:4px; font-weight:600;">
                                <i class="fa-solid fa-plus"></i> Add Sub-task
                             </button>
                        </div>
    
                        <!-- Right: Tagged Staff (35%) -->
                        <div style="flex: 1; padding: 1rem; background: #f8fafc; display:flex; flex-direction:column;">
                            <label style="display:block; font-size:0.65rem; font-weight:800; color:#94a3b8; margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">2. Collaborators</label>
                            <div class="tags-container" style="display:flex; flex-direction:column; gap:0.5rem; flex:1;">
                                <div class="no-tags-placeholder" style="font-size:0.7rem; color:#cbd5e1; text-align:center; padding-top:1rem; border:1px dashed #e2e8f0; border-radius:10px; flex:1;">Use @ in task text to tag</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bottom Controls: Status and Admin Reassign -->
                    <div style="background: #f1f5f9; padding: 0.5rem 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b;">STATUS:</label>
                            <select class="plan-status" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 0.75rem; background: white; color: #374151;">
                                <option value="" selected>Auto (Smart Status)</option>
                                <option value="completed">✅ Completed</option>
                                <option value="not-completed">❌ Not Completed</option>
                                <option value="in-process">🟡 In Process</option>
                            </select>
                        </div>
                        
                        ${(currentUser.role === 'Administrator' || currentUser.isAdmin) ? `
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <label style="font-size: 0.7rem; font-weight: 700; color: #64748b;">ASSIGN TO:</label>
                                <select class="plan-assignee" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 0.75rem; background: white; color: #374151;">
                                    ${allUsers.map(u => `<option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                                </select>
                            </div>
                        ` : ''}
                    </div>
                </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newBlock = tempDiv.firstElementChild;
        container.appendChild(newBlock);
        newBlock.querySelector('textarea').focus();
    };

    // Mentions Logic Helper
    window.app_checkMentions = (textarea, users) => {
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        const lastAt = text.lastIndexOf('@', cursorPos - 1);

        if (lastAt !== -1 && !text.substring(lastAt, cursorPos).includes(' ')) {
            const query = text.substring(lastAt + 1, cursorPos).toLowerCase();
            const filteredUsers = users.filter(u => u.name.toLowerCase().includes(query));

            // Give textarea a temporary ID for selection if needed
            if (!textarea.id) textarea.id = 'ta-' + Date.now();

            if (filteredUsers.length > 0) {
                const rect = textarea.getBoundingClientRect();
                const dropdown = document.getElementById('mention-dropdown');
                const list = document.getElementById('mention-list-items');

                list.innerHTML = filteredUsers.map(u => `
                    <div onclick="window.app_applyMention('${textarea.id}', '${u.id}', '${u.name}', ${lastAt})" style="padding:8px 12px; font-size:0.85rem; cursor:pointer; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:8px;" class="mention-item">
                        <img src="${u.avatar}" style="width:20px; height:20px; border-radius:50%;" />
                        <span>${u.name}</span>
                    </div>
                `).join('');

                // Position dropdown
                dropdown.style.top = (rect.top + 30) + 'px';
                dropdown.style.left = rect.left + 'px';
                dropdown.style.display = 'block';
            } else {
                document.getElementById('mention-dropdown').style.display = 'none';
            }
        } else {
            const dropdown = document.getElementById('mention-dropdown');
            if (dropdown) dropdown.style.display = 'none';
        }
    };

    window.app_applyMention = (taId, userId, userName, atPos) => {
        const textarea = document.getElementById(taId);
        if (!textarea) return;

        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        const before = text.substring(0, atPos);
        const after = text.substring(cursorPos);

        textarea.value = before + userName + ' ' + after;
        textarea.focus();
        document.getElementById('mention-dropdown').style.display = 'none';

        // Add to tags container on the right
        const block = textarea.closest('.plan-block');
        const tagsContainer = block.querySelector('.tags-container');

        // Remove placeholder
        const placeholder = tagsContainer.querySelector('.no-tags-placeholder');
        if (placeholder) placeholder.remove();

        // Check if already tagged
        if (tagsContainer.querySelector(`[data-id="${userId}"]`)) return;

        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.dataset.id = userId;
        chip.dataset.name = userName;
        chip.dataset.status = 'pending'; // New: status for approval
        chip.style.cssText = 'background:white; color:#334155; padding:6px 10px; border-radius:10px; font-size:0.75rem; display:flex; align-items:center; justify-content:space-between; font-weight:600; border:1px solid #e2e8f0; box-shadow:0 1px 2px rgba(0,0,0,0.03); animation: slideInRight 0.2s ease;';
        chip.innerHTML = `
            <span><i class="fa-solid fa-at" style="color:#6366f1; font-size:0.65rem; margin-right:4px;"></i>${userName} <span style="font-size:0.6rem; color:#f59e0b;">(Pending)</span></span>
            <i class="fa-solid fa-times" onclick="window.app_removeTagHint(this)" style="cursor:pointer; font-size:0.7rem; color:#94a3b8;"></i>
        `;
        tagsContainer.appendChild(chip);
    };

    window.app_removeTagHint = (btn) => {
        const container = btn.closest('.tags-container');
        btn.parentElement.remove();
        if (container.querySelectorAll('.tag-chip').length === 0) {
            container.innerHTML = `
                <div class="no-tags-placeholder" style="font-size:0.75rem; color:#a78bfa; text-align:center; padding:1.5rem 1rem; border:2px dashed #ddd6fe; border-radius:10px; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.5rem; background:white;">
                    <div style="background:#f5f3ff; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:0.25rem;">
                        <i class="fa-solid fa-user-plus" style="font-size:1.2rem; color:#8b5cf6;"></i>
                    </div>
                    <p style="margin:0; font-weight:600; color:#6b21a8;">No collaborators yet</p>
                    <p style="margin:0; font-size:0.7rem; color:#9333ea; line-height:1.3;">Type <b>@</b> in your task<br/>to tag a teammate</p>
                </div>
            `;
        }
    };

    window.app_addSubPlanRow = (btn) => {
        const block = btn.closest('.plan-block');
        const list = block.querySelector('.sub-plans-list');
        const row = document.createElement('div');
        row.className = 'sub-plan-row';
        row.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
        row.innerHTML = `
            <div style="width:8px; height:8px; background:#a78bfa; border-radius:50%; flex-shrink:0;"></div>
            <input type="text" class="sub-plan-input" placeholder="e.g., Gather data, Create charts, Review..." style="flex:1; padding:0.5rem; border:1px solid #e2e8f0; border-radius:6px; font-size:0.85rem; background:#fafafa; outline:none; transition: all 0.2s;" onfocus="this.style.borderColor='#8b5cf6'; this.style.background='#ffffff'" onblur="this.style.borderColor='#e2e8f0'; this.style.background='#fafafa'">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:4px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        list.appendChild(row);
        row.querySelector('input').focus();
    };

    // New helper function: Hide intro panel
    window.app_hideIntroPanel = () => {
        const panel = document.getElementById('intro-panel');
        if (panel) {
            panel.style.display = 'none';
            localStorage.setItem('workPlanIntroSeen', 'true');
        }
    };

    // New helper function: Show status tooltip
    window.app_showStatusTooltip = (btn) => {
        const block = btn.closest('.plan-block');
        const tooltip = block.querySelector('.status-tooltip');
        if (tooltip) {
            const isVisible = tooltip.style.display === 'block';
            tooltip.style.display = isVisible ? 'none' : 'block';
        }
    };

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


    window.app_addSubPlanUI = () => {
        // Obsolete but kept for safety if needed by other components temporarily
        console.warn("app_addSubPlanUI is obsolete.");
    };

    window.app_deleteDayPlan = async (date, targetUserId = null) => {
        if (!confirm("Are you sure you want to delete this work plan?")) return;
        const currentUser = window.AppAuth.getUser();
        const targetId = targetUserId || currentUser.id;

        try {
            await window.AppCalendar.deleteWorkPlan(date, targetId);
            alert("Plan deleted!");
            document.getElementById('day-plan-modal')?.remove();
            // Refresh
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
            setupDashboardEvents();
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

            const allUsers = await window.AppDB.getAll('users');

            // 1. Notify the owner if edited by an admin
            if (targetId !== currentUser.id && (currentUser.role === 'Administrator' || currentUser.isAdmin)) {
                const owner = allUsers.find(u => u.id === targetId);
                if (owner) {
                    if (!owner.notifications) owner.notifications = [];
                    // Avoid duplicate notifications for same day/admin
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
                if (p.tags) {
                    p.tags.forEach(t => distinctTaggedUsers.add(t.id));
                }
            });

            if (distinctTaggedUsers.size > 0) {
                const planId = `plan_${targetId}_${date}`;

                for (const uid of distinctTaggedUsers) {
                    const targetUser = allUsers.find(u => u.id === uid);
                    if (targetUser && uid !== currentUser.id) { // Don't notify self if tagged self (unlikely but safe)
                        if (!targetUser.notifications) targetUser.notifications = [];

                        // Find which tasks this user is tagged in to provide context
                        plans.forEach((p, idx) => {
                            if (p.tags && p.tags.some(t => t.id === uid)) {
                                const alreadyNotified = targetUser.notifications.some(n =>
                                    n.type === 'mention' && n.planId === planId && n.taskIndex === idx
                                );

                                if (!alreadyNotified) {
                                    targetUser.notifications.push({
                                        type: 'mention',
                                        message: `${currentUser.name} tagged you in: "${p.task}" for ${date}`,
                                        planId: planId,
                                        taskIndex: idx,
                                        date: new Date().toLocaleString(),
                                        read: false
                                    });
                                }
                            }
                        });
                        await window.AppDB.put('users', targetUser);
                    }
                }
            }
            alert("Plans saved successfully!");
            document.getElementById('day-plan-modal')?.remove();
            // Refresh
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
            setupDashboardEvents();
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

            // 4. Dismiss the notification
            const updatedUser = await window.AppDB.get('users', user.id);
            if (updatedUser && updatedUser.notifications) {
                updatedUser.notifications.splice(notifIdx, 1);
                await window.AppDB.put('users', updatedUser);
            }

            // 5. Refresh UI
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

    window.app_checkDailyPlanReminder = async () => {
        const user = window.AppAuth.getUser();
        const today = getLocalISO();

        try {
            const [myPlan, collabs] = await Promise.all([
                window.AppCalendar.getWorkPlan(user.id, today),
                window.AppCalendar.getCollaborations(user.id, today)
            ]);

            const hasMyPlan = myPlan && (myPlan.plans?.length > 0 || (myPlan.plan && myPlan.plan.trim() !== ''));
            const hasCollab = collabs && collabs.length > 0;

            if (!hasMyPlan && !hasCollab) return;

            let planHtml = "";

            if (hasMyPlan) {
                const plansToDisplay = myPlan.plans || [{ task: myPlan.plan, subPlans: myPlan.subPlans || [], tags: [] }];
                planHtml += plansToDisplay.map(p => `
                    <div style="background:#f0f9ff; border-left:4px solid #0369a1; padding:0.75rem; border-radius:8px; margin-bottom:0.75rem;">
                        <div style="font-weight:700; color:#0c4a6e; font-size:0.9rem;">📍 ${p.task}</div>
                        ${p.subPlans && p.subPlans.length > 0 ? `<div style="font-size:0.75rem; color:#075985; margin-top:4px;">👣 ${p.subPlans.join(', ')}</div>` : ''}
                    </div>
                `).join('');
            }

            if (hasCollab) {
                collabs.forEach(cp => {
                    const myCollabTasks = cp.plans.filter(p =>
                        p.tags && p.tags.some(t => t.id === user.id && t.status === 'accepted')
                    );
                    myCollabTasks.forEach(p => {
                        planHtml += `
                            <div style="background:#f0fdf4; border-left:4px solid #15803d; padding:0.75rem; border-radius:8px; margin-bottom:0.75rem;">
                                <div style="font-weight:700; color:#14532d; font-size:0.9rem;">🤝 ${p.task} <span style="font-weight:normal; font-size:0.7rem; color:#166534;">(with ${cp.userName})</span></div>
                                ${p.subPlans && p.subPlans.length > 0 ? `<div style="font-size:0.75rem; color:#166534; margin-top:4px;">👣 ${p.subPlans.join(', ')}</div>` : ''}
                            </div>
                        `;
                    });
                });
            }

            const modalHtml = `
                <div class="modal-overlay" id="plan-reminder-modal" style="display:flex; align-items:center; z-index:10001;">
                    <div class="modal-content" style="max-width: 450px; width: 90%; padding: 1.5rem; text-align:left; border-radius:20px; animation: slideUp 0.3s ease;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <h3 style="margin:0; font-size:1.1rem; color:#1e2937;">📝 Your Goals for Today</h3>
                            <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#94a3b8;">&times;</button>
                        </div>
                        <p style="font-size:0.85rem; color:#64748b; margin-bottom:1.25rem;">You have some items planned for today. Let's make it a productive one!</p>
                        
                        <div style="max-height:300px; overflow-y:auto; padding-right:5px;">
                            ${planHtml}
                        </div>

                        <button onclick="this.closest('.modal-overlay').remove()" class="action-btn" style="width:100%; margin-top:1.25rem; padding:0.8rem; border-radius:12px;">Got it, let's work!</button>
                    </div>
                </div>
            `;
            window.app_showModal(modalHtml, 'plan-reminder-modal');
        } catch (err) {
            console.error("Reminder failed:", err);
        }
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

            alert(`Task postponed to ${targetDate}`);
            if (handleAttendance) await handleAttendance();
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
                await window.app_checkDailyPlanReminder();
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

            // Fetch location during checkout - STRICT MODE
            let pos = await getLocation(); // Will throw if failed/denied

            // Detect mismatch for saving
            let locationMismatched = false;
            const checkInLoc = window.AppAuth.getUser()?.currentLocation;

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

            // Create formatted address string if no address available
            const formattedAddress = `Lat: ${Number(pos.lat).toFixed(4)}, Lng: ${Number(pos.lng).toFixed(4)}`;

            const explanation = form.locationExplanation ? form.locationExplanation.value : '';
            const tomorrowGoal = form.tomorrowGoal ? form.tomorrowGoal.value.trim() : '';

            // 1. Save tomorrow's goal if provided
            if (tomorrowGoal) {
                const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                await window.AppCalendar.addWorkPlanTask(tomorrow, window.AppAuth.getUser().id, tomorrowGoal);
                console.log("Tomorrow's goal saved:", tomorrowGoal);
            }

            await window.AppAttendance.checkOut(description, pos.lat, pos.lng, formattedAddress, locationMismatched, explanation);

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
        if (btn) btn.addEventListener('click', handleAttendance);
        startTimer();
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
            isManualOverride: fd.get('isManualOverride') === 'on'
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
        const penalty = parseFloat(row.querySelector('.penalty-count').dataset.penalty) || 0;
        const tdsPercent = parseFloat(document.getElementById('global-tds-percent').value) || 0;

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
        const tdsPercent = parseFloat(document.getElementById('global-tds-percent').value) || 0;

        for (const row of rows) {
            const userId = row.dataset.userId;
            const baseSalaryInput = row.querySelector('.base-salary-input').value;
            const adjustedSalary = row.querySelector('.salary-input').value;
            const comment = row.querySelector('.comment-input').value;
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
                tdsPercent: tdsPercent,
                tdsAmount: Number(tdsAmount),
                finalNet: Number(finalNet),
                comment: comment || '',
                processedAt: Date.now()
            });

            // Update user's base salary if changed
            userUpdates.push({
                id: userId,
                baseSalary: Number(baseSalaryInput)
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
            const tdsP = document.getElementById('global-tds-percent').value;
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
        try {
            await window.AppDB.add('system_commands', {
                type: 'audit',
                timestamp: Date.now(),
                requestedBy: window.AppAuth.getUser()?.name || 'Admin',
                status: 'pending'
            });
            alert("Manual audit command sent. Active staff devices will perform a stealth check within a minute.");
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

    // Initialization
    init();

    console.log("App.js Loaded & Globals Ready");
})();
