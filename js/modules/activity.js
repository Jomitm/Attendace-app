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

            this.handleActivity = this.handleActivity.bind(this);
            this.tick = this.tick.bind(this);
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

            // Sync current Score to local User object (for live updates)
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
