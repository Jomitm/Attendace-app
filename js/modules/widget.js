/**
 * Widget Module for CRWI Attendance
 * Handles the "Widget Mode" UI state and persistence.
 */

const Widget = {
    isWidgetMode: false,
    syncInterval: null,

    init() {
        console.log("Widget Module Initialized");

        // Check for ?mode=widget in URL - This is now the ONLY way to enter widget mode
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'widget') {
            this.isWidgetMode = true;
        }

        if (this.isWidgetMode) {
            this.enableWidgetMode();
        }

        // Global watcher for hashchange isn't strictly needed for mounting anymore
        // but we'll keep it to ensure dashboard logic is always ready
    },

    toggle() {
        if (!this.isWidgetMode) {
            const width = 420;
            const height = 500;
            const left = window.screen.width - width - 20;
            const top = 40;

            window.open(
                window.location.origin + window.location.pathname + '?mode=widget#dashboard',
                'CRWIWidget',
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
            );
        } else {
            this.isWidgetMode = false;

            if (window.opener || (window.name === 'CRWIWidget')) {
                window.close();
            } else {
                this.disableWidgetMode();
            }
        }
    },

    enableWidgetMode() {
        document.body.classList.add('widget-mode');
        this.renderWidgetView();
        this.startSync();

        // Attempt to shrink window for a true widget feel
        if (window.resizeTo) window.resizeTo(320, 420);
    },

    disableWidgetMode() {
        document.body.classList.remove('widget-mode');
        const widgetView = document.getElementById('widget-view');
        if (widgetView) widgetView.remove();
        this.stopSync();
    },

    startSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => this.sync(), 500);
    },

    stopSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
    },

    sync() {
        if (!this.isWidgetMode) return;

        // Source elements from the main dashboard
        const mainTimer = document.getElementById('timer-display');
        const mainTimerLabel = document.getElementById('timer-label');
        const mainStatusDot = document.querySelector('.check-in-widget .status-dot') || document.querySelector('.check-in-widget [style*="background: #10b981"]') || document.querySelector('.check-in-widget [style*="background: #94a3b8"]');
        const mainBtn = document.getElementById('attendance-btn');
        const mainLocation = document.getElementById('location-text');

        // Progress bar sources
        const mainCountdownContainer = document.getElementById('countdown-container');
        const mainCountdownLabel = document.getElementById('countdown-label');
        const mainCountdownValue = document.getElementById('countdown-value');
        const mainCountdownProgress = document.getElementById('countdown-progress');

        // Overtime sources
        const mainOvertimeContainer = document.getElementById('overtime-container');
        const mainOvertimeValue = document.getElementById('overtime-value');

        // Target elements in the widget view
        const targetView = document.getElementById('widget-view');
        if (!targetView) return;

        const widgetTimer = targetView.querySelector('#timer-display');
        const widgetTimerLabel = targetView.querySelector('#timer-label');
        const widgetStatusDot = targetView.querySelector('.status-dot-indicator');
        const widgetBtn = targetView.querySelector('#attendance-btn');
        const widgetLocation = targetView.querySelector('#location-text');

        const widgetCountdownContainer = targetView.querySelector('#countdown-container');
        const widgetCountdownLabel = targetView.querySelector('#countdown-label');
        const widgetCountdownValue = targetView.querySelector('#countdown-value');
        const widgetCountdownProgress = targetView.querySelector('#countdown-progress');

        const widgetOvertimeContainer = targetView.querySelector('#overtime-container');
        const widgetOvertimeValue = targetView.querySelector('#overtime-value');

        // Sync Timer
        if (mainTimer && widgetTimer) {
            widgetTimer.innerHTML = mainTimer.innerHTML;
            widgetTimer.style.color = mainTimer.style.color;
        }
        if (mainTimerLabel && widgetTimerLabel) widgetTimerLabel.innerHTML = mainTimerLabel.innerHTML;

        // Sync Status Dot (Online/Offline)
        if (mainStatusDot && widgetStatusDot) {
            widgetStatusDot.style.background = mainStatusDot.style.background || (mainStatusDot.classList.contains('online') ? '#10b981' : '#94a3b8');
        }

        // Sync Progress Bar
        if (mainCountdownContainer && widgetCountdownContainer) {
            widgetCountdownContainer.style.display = mainCountdownContainer.style.display;
            if (mainCountdownLabel && widgetCountdownLabel) widgetCountdownLabel.innerHTML = mainCountdownLabel.innerHTML;
            if (mainCountdownValue && widgetCountdownValue) widgetCountdownValue.innerHTML = mainCountdownValue.innerHTML;
            if (mainCountdownProgress && widgetCountdownProgress) widgetCountdownProgress.style.width = mainCountdownProgress.style.width;
        }

        // Sync Overtime
        if (mainOvertimeContainer && widgetOvertimeContainer) {
            widgetOvertimeContainer.style.display = mainOvertimeContainer.style.display;
            if (mainOvertimeValue && widgetOvertimeValue) widgetOvertimeValue.innerHTML = mainOvertimeValue.innerHTML;
        }

        // Sync Attendance Button
        if (mainBtn && widgetBtn) {
            widgetBtn.innerHTML = mainBtn.innerHTML;
            widgetBtn.className = mainBtn.className;
            widgetBtn.disabled = mainBtn.disabled;
        }

        // Sync Location
        if (mainLocation && widgetLocation) {
            widgetLocation.innerHTML = mainLocation.innerHTML;
        }
    },

    handleWidgetAction() {
        // If we have an opener (the main app window), focus it and trigger action there
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.focus();
                if (window.opener.location.hash !== '#dashboard') {
                    window.opener.location.hash = '#dashboard';
                }
                if (window.opener.app_handleAttendance) {
                    window.opener.app_handleAttendance();
                    return;
                }
            } catch (err) {
                console.warn("Could not communicate with main window:", err);
            }
        }

        // If no opener or communication failed, reopen the main app
        console.log("Opener lost or closed. Reopening main app...");
        const mainAppUrl = window.location.origin + window.location.pathname + '#dashboard';
        const mainApp = window.open(mainAppUrl, 'CRWIMainApp');

        if (mainApp) {
            mainApp.focus();
            // We can't immediately call handleAttendance on the new window because it needs to load
            // But usually, navigation to #dashboard is enough for the user to proceed.
            // Highlight this to the user.
            const btn = document.getElementById('attendance-btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...';
                setTimeout(() => { btn.innerHTML = originalText; }, 3000);
            }
        } else {
            alert("Please allow popups or open the main application window manually.");
        }
    },

    renderWidgetView() {
        let widgetView = document.getElementById('widget-view');
        if (!widgetView) {
            widgetView = document.createElement('div');
            widgetView.id = 'widget-view';
            document.body.appendChild(widgetView);
        }

        // Fetch user data for initial render - Handle null user gracefully
        const user = (window.AppAuth && window.AppAuth.getUser()) || {
            name: 'User',
            role: 'Staff',
            avatar: 'https://via.placeholder.com/48'
        };

        widgetView.innerHTML = `
            <div class="widget-chrome-header">
                <div class="widget-drag-handle">
                    <i class="fa-solid fa-grip-lines"></i>
                </div>
                <div class="widget-controls">
                    <i class="fa-solid fa-expand widget-close" onclick="window.Widget.toggle()" title="Full View"></i>
                </div>
            </div>
            <div class="card check-in-widget">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;">
                    <div style="position: relative;">
                        <img src="${user.avatar}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;">
                        <div class="status-dot-indicator" style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: #94a3b8; border: 2px solid white;"></div>
                    </div>
                    <div style="text-align: left;">
                        <h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${user.name}</h4>
                        <p class="text-muted" style="font-size: 0.75rem; margin: 0;">${user.role}</p>
                    </div>
                </div>

                <div style="text-align:center; padding: 0.5rem 0;">
                    <div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">00:00:00</div>
                    <div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div>
                </div>

                <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;">
                        <span id="countdown-label">Time to checkout</span>
                        <span id="countdown-value" style="font-weight: 600;">--:--:--</span>
                    </div>
                    <div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                        <div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div>
                    </div>
                </div>

                <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;">
                    <div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div>
                    <div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div>
                </div>

                <button class="btn btn-primary" id="attendance-btn" onclick="window.Widget.handleWidgetAction()" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease;">
                    Action <i class="fa-solid fa-fingerprint"></i>
                </button>

                <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;">
                    <i class="fa-solid fa-location-dot"></i><span>Waiting for location...</span>
                </div>
            </div>
        `;
    }
};

window.Widget = Widget;
Widget.init();
