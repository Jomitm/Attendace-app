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

            // 1. Define Users for Molly and Jomit
            const users = [
                { id: 'sim_admin_new', name: 'Sr. Maria Admin', username: 'maria', email: 'maria@crwi.org', role: 'Administrator', isAdmin: true, dept: 'Administration', avatar: 'https://ui-avatars.com/api/?name=Maria+Admin&background=1e40af&color=fff' },
                { id: 'sim_punctual', name: 'Jomit Punctuall', username: 'jomit_p', email: 'jomit@crwi.org', role: 'Administrator', isAdmin: true, dept: 'IT Department', avatar: 'https://ui-avatars.com/api/?name=Jomit+P&background=10b981&color=fff' }
            ];

            // 2. Create Simulated Users
            for (const u of users) {
                await this.db.put('users', { ...u, status: 'out', password: '123', joinDate: new Date().toISOString().split('T')[0] });
            }
            console.log("✅ Simulated Users created for Molly and Jomit.");

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

            // 4. Push all logs
            for (const log of logs) {
                await this.db.put('attendance', log);
            }

            // 5. Add Shared Events
            if (window.AppCalendar) {
                const holidayDate = new Date(today);
                holidayDate.setDate(holidayDate.getDate() + 1);
                await window.AppCalendar.addEvent({
                    title: 'Office Picnic/Holiday',
                    date: holidayDate.toISOString().split('T')[0],
                    type: 'holiday'
                });
            }

            console.log("🏁 Simulation Complete! Molly and Jomit data preserved.");
            alert("Simulation Data Updated! Only Molly and Jomit dummy data kept.");
        }
    }

    window.AppSimulation = new Simulation();
    // Auto-trigger for convenience
    setTimeout(() => window.AppSimulation.run(), 2000);
})();
