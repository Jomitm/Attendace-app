/**
 * Activity Monitor Module
 * Tracks user engagement (mouse/keyboard) to calculate productivity score.
 */
(function () {
    class ActivityMonitor {
        constructor() {
            this.isActive = false;
            this.activeMinutes = 0;
            this.totalMinutes = 0;
            this.monitorInterval = null;
            this.lastActivityTime = Date.now();
            this.isCurrentlyActive = false; // Flag for current minute
            this.performedAudits = {}; // To track { 'YYYY-MM-DD': { slot1: true, slot2: true } }
            this.commandListener = null;
            this.processedCommandIds = new Set();
            this.startTime = Date.now();

            this.handleActivity = this.handleActivity.bind(this);
            this.tick = this.tick.bind(this);

            // Start listener immediately if DB is ready
            if (window.AppDB) this.initCommandListener();
        }

        initCommandListener() {
            if (this.commandListener) return; // Already running

            if (window.AppDB && window.AppDB.listen) {
                console.log("Activity Monitor: Initializing System Command Listener...");
                this.commandListener = window.AppDB.listen('system_commands', (commands) => {
                    const user = window.AppAuth.getUser();
                    if (!user) {
                        console.log("[Audit] Command detected but user not authenticated yet. Waiting...");
                        return;
                    }

                    // Filter for recent commands we haven't processed
                    const freshCommands = commands.filter(cmd =>
                        cmd.type === 'audit' &&
                        cmd.timestamp > (this.startTime - 600000) && // 10 min window
                        !this.processedCommandIds.has(cmd.id)
                    ).sort((a, b) => b.timestamp - a.timestamp);

                    if (freshCommands.length > 0) {
                        const latest = freshCommands[0];
                        console.log("[Audit] Manual Command Received!", latest.id);
                        this.processedCommandIds.add(latest.id);

                        const slotName = latest.slotName || `Manual Audit @ ${new Date().toLocaleTimeString()}`;
                        console.log(`[Audit] Executing for user: ${user.name} in slot: ${slotName}`);
                        this.performSilentAudit(slotName);
                    }
                });
            }
        }

        async performSilentAudit(slot) {
            const user = window.AppAuth.getUser();
            if (!user) return;

            const today = new Date().toISOString().split('T')[0];
            if (!this.performedAudits[today]) this.performedAudits[today] = {};
            if (this.performedAudits[today][slot]) return;

            console.log(`Executing Silent Location Audit for slot: ${slot}`);
            this.performedAudits[today][slot] = true;

            let logData = {
                userId: user.id,
                userName: user.name,
                timestamp: Date.now(),
                slot: slot,
                status: 'Success',
                lat: 0,
                lng: 0
            };

            try {
                if (window.getLocation) {
                    // Try to get location silently
                    const pos = await window.getLocation().catch(err => {
                        console.warn("Silent Audit Location Failed:", err);
                        return null;
                    });

                    if (pos) {
                        logData.lat = pos.lat;
                        logData.lng = pos.lng;
                    } else {
                        logData.status = 'Location service disabled';
                    }
                } else {
                    logData.status = 'Location service disabled (missing helper)';
                }
            } catch (err) {
                logData.status = 'Location service disabled';
            }

            // Save to DB
            try {
                await window.AppDB.add('location_audits', logData);
                console.log("Silent Audit Log Saved.");
            } catch (dbErr) {
                console.error("Failed to save audit log:", dbErr);
            }
        }

        start() {
            if (this.isActive) return;
            this.isActive = true;
            this.activeMinutes = 0;
            this.totalMinutes = 0;
            this.isCurrentlyActive = false;
            this.lastActivityTime = Date.now();

            // Attach Listeners
            document.addEventListener('mousemove', this.handleActivity);
            document.addEventListener('click', this.handleActivity);
            document.addEventListener('keydown', this.handleActivity);
            document.addEventListener('scroll', this.handleActivity);

            // Start Timer (Every 1 Minute)
            this.monitorInterval = setInterval(this.tick, 60000);

            console.log("Activity Monitoring Started");
        }

        stop() {
            if (!this.isActive) return;
            this.isActive = false;

            // Remove Listeners
            document.removeEventListener('mousemove', this.handleActivity);
            document.removeEventListener('click', this.handleActivity);
            document.removeEventListener('keydown', this.handleActivity);
            document.removeEventListener('scroll', this.handleActivity);

            // Clear Timer
            if (this.monitorInterval) clearInterval(this.monitorInterval);

            console.log("Activity Monitoring Stopped. Score:", this.getScore());
            return this.getStats();
        }

        handleActivity() {
            // Mark this minute as active if not already
            if (!this.isCurrentlyActive) {
                this.isCurrentlyActive = true;
                this.lastActivityTime = Date.now();
            }
        }

        tick() {
            this.totalMinutes++;
            if (this.isCurrentlyActive) {
                this.activeMinutes++;
            }

            // --- Silent Audit Logic (11 AM & 2 PM) ---
            const now = new Date();
            const hour = now.getHours();
            if (hour === 11) {
                this.performSilentAudit('11 AM Slot');
            } else if (hour === 14) {
                this.performSilentAudit('2 PM Slot');
            }

            // Sync current Score to local User object
            const user = window.AppAuth.getUser();
            if (user && user.status === 'in') {
                user.activityScore = this.getScore();
                user.lastActive = this.lastActivityTime;
                // We update local storage but don't blast DB every minute to save writes
                // Only critical updates go to DB. UI can read this from local.
                window.AppDB.put('users', user);
            }

            // Reset for next minute
            this.isCurrentlyActive = false;
        }

        getScore() {
            if (this.totalMinutes === 0) return 100; // Default start
            return Math.round((this.activeMinutes / this.totalMinutes) * 100);
        }

        getStats() {
            return {
                score: this.getScore(),
                activeMinutes: this.activeMinutes,
                totalMinutes: this.totalMinutes
            };
        }
    }

    window.AppActivity = new ActivityMonitor();
})();
