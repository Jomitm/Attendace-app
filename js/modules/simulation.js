/**
 * Simulation Module
 * Injects optional demo events and performs one-time legacy dummy cleanup.
 */
(function () {
    class Simulation {
        constructor() {
            this.db = window.AppDB;
            this.cleanupFlag = 'legacy_dummy_cleanup_v1';
            this.simulationFlag = 'simulation_run_v2';
        }

        async run() {
            if (!localStorage.getItem(this.cleanupFlag)) {
                await this.cleanupLegacyDummyData();
                localStorage.setItem(this.cleanupFlag, 'true');
            }

            if (localStorage.getItem(this.simulationFlag)) {
                console.log('Simulation already ran. Use window.AppSimulation.forceRun() to force.');
                return;
            }

            await this.forceRun();
            localStorage.setItem(this.simulationFlag, 'true');
        }

        async cleanupLegacyDummyData() {
            const legacyIds = new Set(['sim_punctual', 'sim_admin_new']);
            const legacyUsernames = new Set(['jomit_p', 'maria']);

            try {
                const users = await this.db.getAll('users');
                const matchedUsers = users.filter((u) =>
                    legacyIds.has(u.id) || legacyUsernames.has((u.username || '').trim().toLowerCase())
                );
                const targetIds = new Set(matchedUsers.map((u) => u.id));

                if (targetIds.size === 0) return;

                const attendance = await this.db.getAll('attendance');
                for (const log of attendance) {
                    const uid = log.user_id || log.userId;
                    if (targetIds.has(uid)) {
                        await this.db.delete('attendance', log.id);
                    }
                }

                const leaves = await this.db.getAll('leaves');
                for (const leave of leaves) {
                    const uid = leave.userId || leave.user_id;
                    if (targetIds.has(uid)) {
                        await this.db.delete('leaves', leave.id);
                    }
                }

                const plans = await this.db.getAll('work_plans');
                for (const plan of plans) {
                    const uid = plan.userId || plan.user_id;
                    if (targetIds.has(uid)) {
                        await this.db.delete('work_plans', plan.id);
                    }
                }

                for (const user of matchedUsers) {
                    await this.db.delete('users', user.id);
                }

                console.log('Legacy dummy users and linked records removed.');
            } catch (error) {
                console.warn('Legacy dummy cleanup failed:', error);
            }
        }

        async forceRun() {
            console.log('Starting Office Scenario Simulation (V2)...');

            // Simulation now only handles shared event setup.
            const today = new Date();

            if (window.AppCalendar) {
                const holidayDate = new Date(today);
                holidayDate.setDate(holidayDate.getDate() + 1);
                await window.AppCalendar.addEvent({
                    title: 'Office Picnic/Holiday',
                    date: holidayDate.toISOString().split('T')[0],
                    type: 'holiday'
                });
            }

            console.log('Simulation Complete.');
        }
    }

    window.AppSimulation = new Simulation();
    setTimeout(() => window.AppSimulation.run(), 2000);
})();
