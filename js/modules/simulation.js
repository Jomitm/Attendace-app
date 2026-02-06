/**
 * Simulation Module
 * Injects dummy data for various office scenarios.
 * AUTO-RUNS ONCE IF FLAG IS NOT SET.
 */
(function () {
    class Simulation {
        constructor() {
            this.db = window.AppDB;
        }

        async run() {
            if (localStorage.getItem('simulation_run_v2')) {
                console.log("ℹ️ Simulation already ran. Use window.AppSimulation.run(true) to force.");
                return;
            }
            await this.forceRun();
            localStorage.setItem('simulation_run_v2', 'true');
        }

        async forceRun() {
            console.log("🚀 Starting Office Scenario Simulation (V2)...");

            // 1. Define Users for all departments
            const users = [
                { id: 'sim_admin_new', name: 'Sr. Maria Admin', username: 'maria', role: 'Administrator', isAdmin: true, dept: 'Administration', avatar: 'https://ui-avatars.com/api/?name=Maria+Admin&background=1e40af&color=fff' },
                { id: 'sim_punctual', name: 'Jomit Punctuall', username: 'jomit_p', role: 'Administrator', isAdmin: true, dept: 'IT Department', avatar: 'https://ui-avatars.com/api/?name=Jomit+P&background=10b981&color=fff' },
                { id: 'sim_late', name: 'Staff Late', username: 'late_user', role: 'Employee', isAdmin: false, dept: 'Sales', avatar: 'https://ui-avatars.com/api/?name=Late+Staff&background=f59e0b&color=fff' },
                { id: 'sim_early', name: 'Staff Early', username: 'early_user', role: 'Employee', isAdmin: false, dept: 'HR', avatar: 'https://ui-avatars.com/api/?name=Early+Staff&background=ef4444&color=fff' },
                { id: 'sim_mismatch', name: 'Staff Field', username: 'field_user', role: 'Employee', isAdmin: false, dept: 'Operations', avatar: 'https://ui-avatars.com/api/?name=Field+Staff&background=6366f1&color=fff' },
                { id: 'sim_general', name: 'Staff General', username: 'general_user', role: 'Employee', isAdmin: false, dept: 'General', avatar: 'https://ui-avatars.com/api/?name=General+Staff&background=94a3b8&color=fff' }
            ];

            // 2. Create Simulated Users
            for (const u of users) {
                await this.db.put('users', { ...u, status: 'out', password: '123', joinDate: new Date().toISOString().split('T')[0] });
            }
            console.log("✅ Simulated Users created for all departments.");

            const today = new Date();
            const logs = [];

            // 3. Populate Logs (Punctual/Admin)
            for (let i = 1; i <= 5; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                logs.push({
                    id: `log_admin_${i}`, userId: 'sim_admin_new', date: dateStr,
                    checkIn: '08:50 AM', checkOut: '05:30 PM', duration: '8h 40m',
                    type: 'Present', activityScore: 98
                });
                logs.push({
                    id: `log_punctual_${i}`, userId: 'sim_punctual', date: dateStr,
                    checkIn: '08:55 AM', checkOut: '05:05 PM', duration: '8h 10m',
                    type: 'Present', activityScore: 95
                });
            }

            // 4. User: 4 Late Arrivals (Penalty 0.5)
            for (let i = 1; i <= 4; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                logs.push({
                    id: `log_late_${i}`, userId: 'sim_late', date: dateStr,
                    checkIn: '09:20 AM', checkOut: '05:30 PM', duration: '8h 10m',
                    type: 'Present', activityScore: 75
                });
            }

            // 5. User: 3 Early Departures (Penalty 1.0)
            for (let i = 1; i <= 3; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (i + 4));
                const dateStr = date.toISOString().split('T')[0];
                logs.push({
                    id: `log_early_${i}`, userId: 'sim_early', date: dateStr,
                    checkIn: '08:50 AM', checkOut: '04:15 PM', duration: '7h 25m',
                    type: 'Present', activityScore: 65
                });
            }

            // 6. User: Location Mismatch
            const date4 = new Date(today);
            date4.setDate(date4.getDate() - 1);
            logs.push({
                id: `log_mismatch_1`, userId: 'sim_mismatch', date: date4.toISOString().split('T')[0],
                checkIn: '09:00 AM', checkOut: '05:00 PM', duration: '8h 0m',
                inLat: 12.9716, inLng: 77.5946,
                outLat: 12.9352, outLng: 77.6245,
                locationMismatched: true,
                locationExplanation: 'Emergency client site visit required before end of shift.',
                type: 'Present', activityScore: 90
            });

            // 7. Push all logs
            for (const log of logs) {
                await this.db.put('attendance', log);
            }

            // 8. Add Shared Events
            if (window.AppCalendar) {
                const holidayDate = new Date(today);
                holidayDate.setDate(holidayDate.getDate() + 1);
                await window.AppCalendar.addEvent({
                    title: 'Office Picnic/Holiday',
                    date: holidayDate.toISOString().split('T')[0],
                    type: 'holiday'
                });
            }

            console.log("🏁 Simulation Complete! Refresh and check Admin Panel.");
            alert("Simulation Data Injected! Check Admin Panel and Salary Processing.");
        }
    }

    window.AppSimulation = new Simulation();
    // Auto-trigger for convenience
    setTimeout(() => window.AppSimulation.run(), 2000);
})();
