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
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3>Add Shared Event</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                    <form onsubmit="window.app_submitEvent(event)">
                        <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Event Title</label>
                                <input type="text" id="event-title" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Date</label>
                                <input type="date" id="event-date" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Type</label>
                                <select id="event-type" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    <option value="holiday">Holiday</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="event">Other Event</option>
                                </select>
                            </div>
                            <button type="submit" class="action-btn" style="width:100%; margin-top:1rem;">Save Event</button>
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

        if (sidebar && window.innerWidth > 768) {
            sidebar.style.display = 'flex';
        }
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
                // iOS often needs more than 5s for a cold GPS lock. 10s is safer.
                console.log("Requesting Location: High Accuracy (GPS)...");
                const p = await getPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000 // Allow a 5-second old cached location for speed
                });
                resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
            } catch (err) {
                console.warn("High Accuracy Failed:", err.message);

                // Attempt 2: Low Accuracy (WiFi/Cell/IP) - Fallback
                try {
                    console.log("Requesting Location: Low Accuracy (Fallback)...");
                    const p2 = await getPosition({
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 10000
                    });
                    resolve({ lat: p2.coords.latitude, lng: p2.coords.longitude });
                } catch (err2) {
                    console.error("Low Accuracy Failed:", err2.message);

                    let msg = 'Unable to retrieve location.';
                    if (err2.code === 1) msg = 'Location permission denied. Please allow location access in your iOS Settings.';
                    else if (err2.code === 2) msg = 'Location unavailable. Ensure GPS is enabled (Settings > Privacy > Location).';
                    else if (err2.code === 3) msg = 'Location request timed out. Try moving near a window or outdoors.';

                    reject(msg);
                }
            }
        });
    }

    // --- Work Plan Logic ---
    window.app_openDayPlan = async (date) => {
        const currentUser = window.AppAuth.getUser();
        const d = new Date(date).getDate();
        const evs = window._getDayEvents ? window._getDayEvents(d) : [];
        const plans = window._currentPlans;
        const myPlan = plans && plans.workPlans ? plans.workPlans.find(p => p.date === date && p.userId === currentUser.id) : null;

        // Grouping logic for multi-user visibility
        const teamActivity = evs.filter(e => e.type === 'leave' || e.type === 'event');
        const otherStaffPlans = evs.filter(e => e.type === 'work' && e.userId !== currentUser.id);

        const html = `
            <div class="modal-overlay" id="day-plan-modal" style="display:flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3>Plan for ${date}</h3>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            ${myPlan ? `<button onclick="window.app_deleteDayPlan('${date}')" title="Delete Plan" style="background:none; border:none; color:#ef4444; font-size:1rem; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                            <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                        </div>
                    </div>

                    <div style="margin: 0.5rem 0 1.5rem 0; max-height: 250px; overflow-y: auto; background:#f9fafb; padding:1rem; border-radius:8px;">
                        <!-- Team Activity (Leaves/Shared Events) -->
                        <div style="margin-bottom: 1.25rem;">
                            <label style="font-size: 0.7rem; font-weight:700; color: #9ca3af; display: block; margin-bottom: 0.5rem; text-transform:uppercase; letter-spacing:0.5px;">Team Leaves & Events</label>
                            ${teamActivity.length ? teamActivity.map(e => `
                                <div style="font-size: 0.85rem; padding: 6px 0; border-bottom: 1px solid #f3f4f6; display:flex; gap:8px; align-items:start;">
                                    <span style="width:8px; height:8px; border-radius:50%; margin-top:5px; background:${e.type === 'leave' ? '#ef4444' : '#10b981'}"></span>
                                    <span style="flex:1;">${e.title}</span>
                                </div>
                            `).join('') : '<div style="color:#9ca3af; font-size:0.8rem;">No leaves or events.</div>'}
                        </div>

                        <!-- Staff Work Plans (Other Members) -->
                        <div>
                            <label style="font-size: 0.7rem; font-weight:700; color: #9ca3af; display: block; margin-bottom: 0.5rem; text-transform:uppercase; letter-spacing:0.5px;">Staff Work Plans</label>
                            ${otherStaffPlans.length ? otherStaffPlans.map(e => {
            const parts = e.title.split(':');
            const name = parts[0];
            const planText = parts.slice(1).join(':').trim();
            return `
                                <div style="font-size: 0.85rem; padding: 10px; border: 1px solid #e5e7eb; background:white; border-radius:8px; margin-bottom:8px; display:flex; flex-direction:column; gap:4px;">
                                    <div style="font-weight:600; font-size:0.75rem; color:var(--primary);">${name}</div>
                                    <div style="color:#374151; line-height:1.4;">${planText}</div>
                                </div>
                            `;
        }).join('') : '<div style="color:#9ca3af; font-size:0.8rem;">No staff plans yet.</div>'}
                        </div>
                    </div>
                    
                    <form onsubmit="window.app_saveDayPlan(event, '${date}')">
                        <div style="padding-top:1rem; border-top:1px solid #f3f4f6;">
                            <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:0.5rem;">Main Task / Goal</label>
                            <textarea id="my-work-plan" required placeholder="What are you working on today?" style="width:100%; height:80px; padding:0.75rem; border:1px solid #ddd; border-radius:8px; font-family:inherit; resize:none; margin-bottom:1rem;">${myPlan ? myPlan.plan : ''}</textarea>
                            
                            <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:0.5rem;">Sub-plans / Steps</label>
                            <div id="sub-plans-container" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
                                ${myPlan && myPlan.subPlans ? myPlan.subPlans.map((sub, i) => `
                                    <div class="sub-plan-row" style="display:flex; gap:0.5rem; align-items:center;">
                                        <input type="text" value="${sub}" class="sub-plan-input" placeholder="e.g. Design UI" style="flex:1; padding:0.5rem; border:1px solid #ddd; border-radius:6px; font-size:0.85rem;">
                                        <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color:#9ca3af; cursor:pointer;"><i class="fa-solid fa-circle-xmark"></i></button>
                                    </div>
                                `).join('') : ''}
                            </div>
                            <button type="button" onclick="window.app_addSubPlanUI()" style="background:#f3f4f6; border:1px dashed #d1d5db; border-radius:6px; padding:0.5rem; width:100%; font-size:0.8rem; color:#4b5563; cursor:pointer;">
                                <i class="fa-solid fa-plus"></i> Add Sub-plan
                            </button>
                        </div>
                        <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                             <button type="button" onclick="this.closest('.modal-overlay').remove()" style="flex:1; padding:0.75rem; background:#fff; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-weight:500;">Cancel</button>
                             <button type="submit" class="action-btn" style="flex:2; padding:0.75rem;">Save My Plan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        window.app_showModal(html, 'day-plan-modal');
    };

    window.app_addSubPlanUI = () => {
        const container = document.getElementById('sub-plans-container');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'sub-plan-row';
        row.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
        row.innerHTML = `
            <input type="text" class="sub-plan-input" placeholder="e.g. Design UI" style="flex:1; padding:0.5rem; border:1px solid #ddd; border-radius:6px; font-size:0.85rem;">
            <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color:#9ca3af; cursor:pointer;"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        container.appendChild(row);
        row.querySelector('input').focus();
    };

    window.app_deleteDayPlan = async (date) => {
        if (!confirm("Are you sure you want to delete your work plan for this day?")) return;
        try {
            await window.AppCalendar.deleteWorkPlan(date);
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

    window.app_saveDayPlan = async (e, date) => {
        e.preventDefault();
        const plan = document.getElementById('my-work-plan').value;
        const subPlanInputs = document.querySelectorAll('.sub-plan-input');
        const subPlans = Array.from(subPlanInputs).map(input => input.value.trim()).filter(v => v !== '');

        try {
            await window.AppCalendar.setWorkPlan(date, plan, subPlans);
            alert("Plan saved! This will now pre-fill your checkout summary for this day.");
            document.getElementById('day-plan-modal')?.remove();
            // Refresh
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = await window.AppUI.renderDashboard();
            setupDashboardEvents();
        } catch (err) {
            alert(err.message);
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

    window.app_useWorkPlan = () => {
        const planText = document.getElementById('checkout-plan-text')?.innerText;
        const descArea = document.querySelector('#checkout-modal textarea[name="description"]');
        if (descArea && planText) {
            // Include sub-plans in the pre-fill if they exist in the hidden text or elements
            // Actually, checkout-plan-text and myPlan are available in handleAttendance
            descArea.value = planText;
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

                await window.AppAttendance.checkIn(pos.lat, pos.lng);
                contentArea.innerHTML = await window.AppUI.renderDashboard();
                setupDashboardEvents();
            } else {
                // Pre-fill Checkout Description from Work Plan
                const user = window.AppAuth.getUser();
                const today = getLocalISO();
                const workPlan = await window.AppCalendar.getWorkPlan(user.id, today);

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

                    if (workPlan && workPlan.plan) {
                        if (planRef) planRef.style.display = 'block';

                        let displayPlan = workPlan.plan;
                        if (workPlan.subPlans && workPlan.subPlans.length > 0) {
                            displayPlan += '\n- ' + workPlan.subPlans.join('\n- ');
                        }

                        if (planTextEl) planTextEl.innerText = displayPlan;
                        // Pre-fill only if the textarea is empty
                        if (descArea && !descArea.value.trim()) {
                            descArea.value = displayPlan;
                        }
                    } else {
                        if (planRef) planRef.style.display = 'none';
                    }

                    // Location Verification
                    const mismatchDiv = document.getElementById('checkout-location-mismatch');
                    try {
                        const currentPos = await getLocation();
                        const checkInLoc = user.currentLocation || user.lastLocation;

                        if (checkInLoc && checkInLoc.lat && checkInLoc.lng) {
                            const dist = calculateDistance(currentPos.lat, currentPos.lng, checkInLoc.lat, checkInLoc.lng);
                            // If more than 100 meters away, show mismatch warning
                            if (dist > 100) {
                                if (mismatchDiv) mismatchDiv.style.display = 'block';
                            } else {
                                if (mismatchDiv) mismatchDiv.style.display = 'none';
                            }
                        }
                    } catch (locErr) {
                        console.warn("Location check failed during checkout trigger:", locErr);
                    }

                    modal.style.display = 'flex';
                    if (btn) btn.disabled = false;
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

            // Fetch location during checkout
            let pos = { lat: 0, lng: 0 };
            try {
                pos = await getLocation();
            } catch (locErr) {
                console.warn("Checkout Location Failed:", locErr);
            }

            // Detect mismatch for saving
            let locationMismatched = false;
            const checkInLoc = window.AppAuth.getUser()?.currentLocation;
            if (checkInLoc && checkInLoc.lat && checkInLoc.lng && pos.lat && pos.lng) {
                const dist = calculateDistance(pos.lat, pos.lng, checkInLoc.lat, checkInLoc.lng);
                if (dist > 100) locationMismatched = true;
            }

            const explanation = form.locationExplanation ? form.locationExplanation.value : '';

            await window.AppAttendance.checkOut(description, pos.lat, pos.lng, 'Detected Location', locationMismatched, explanation);

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

    // --- Global Event Delegation ---

    document.addEventListener('submit', (e) => {
        // Force prevent default for ALL forms in this app to prevent query param reloads
        e.preventDefault();

        // Use getAttribute('id') because elements with name="id" shadow the form.id property!
        const id = e.target.getAttribute('id');
        console.log("Submit Event Intercepted. Form ID:", id);

        if (id === 'manual-log-form') handleManualLog(e);
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


    window.app_refreshMasterSheet = async () => {
        const contentArea = document.getElementById('page-content');
        if (contentArea) {
            contentArea.innerHTML = await window.AppUI.renderMasterSheet();
        }
    };

    window.app_exportMasterSheet = async () => {
        const month = parseInt(document.getElementById('sheet-month').value);
        const year = parseInt(document.getElementById('sheet-year').value);
        const users = await window.AppDB.getAll('users');
        const logs = await window.AppDB.getAll('attendance');

        // Filter logs for selected month/year
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        const filteredLogs = logs.filter(l => {
            const d = new Date(l.date);
            return d >= start && d <= end;
        });

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
                            <h3 style="margin:0;">Override Attendance</h3>
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
                                <button type="submit" class="action-btn" style="flex:2;">${existingLog ? 'Update Override' : 'Create Override'}</button>
                                ${existingLog ? `<button type="button" onclick="window.app_deleteCellLog('${existingLog.id}', '${userId}')" class="action-btn checkout" style="flex:1; padding:0;">Delete</button>` : ''}
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
            isManualOverride: true
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

    window.app_handleLeave = async (leaveId, status) => {
        const user = window.AppAuth.getUser();
        await window.AppLeaves.updateLeaveStatus(leaveId, status, user.id);
        alert(`Leave ${status}!`);
        // Refresh Admin View
        const contentArea = document.getElementById('page-content');
        contentArea.innerHTML = await window.AppUI.renderAdmin();
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

    // Listeners for Modal Events 
    // (We keep these as they are internal to app.js logic or standard form submits)
    // Removed old document.addEventListener calls for admin actions since we use global funcs now.

    // Initialization
    init();

    console.log("App.js Loaded & Globals Ready");
})();
