/**
 * Calendar Module
 * Handles Yearly Planning, Events, and Shared Schedules.
 */
(function () {
    class Calendar {
        constructor() {
            this.db = window.AppDB;
        }

        /**
         * Get all plans (approved leaves, company events, and work plans)
         */
        async getPlans() {
            try {
                const [leaves, events, workPlans, users] = await Promise.all([
                    this.db.getAll('leaves'),
                    this.db.getAll('events').catch(() => []),
                    this.db.getAll('work_plans').catch(() => []),
                    this.db.getAll('users').catch(() => [])
                ]);

                // Map User IDs to Names for Leaves
                const userMap = {};
                users.forEach(u => { userMap[u.id] = u.name; });

                const enrichedLeaves = leaves
                    .filter(l => l.status === 'Approved')
                    .map(l => ({
                        ...l,
                        userName: l.userName || userMap[l.userId] || 'Staff'
                    }));

                return {
                    leaves: enrichedLeaves,
                    events: events || [],
                    workPlans: workPlans || []
                };
            } catch (err) {
                console.error("Failed to fetch calendar plans:", err);
                return { leaves: [], events: [], workPlans: [] };
            }
        }

        /**
         * Set/Add a work plan for a specific day
         */
        async setWorkPlan(date, plan, subPlans = []) {
            const user = window.AppAuth.getUser();
            if (!user) throw new Error("Not authenticated");

            const workPlan = {
                id: `plan_${user.id}_${date}`,
                userId: user.id,
                userName: user.name,
                date: date,
                plan: plan,
                subPlans: subPlans,
                updatedAt: new Date().toISOString()
            };
            return await this.db.put('work_plans', workPlan);
        }

        /**
         * Delete a work plan for a specific day
         */
        async deleteWorkPlan(date) {
            const user = window.AppAuth.getUser();
            if (!user) throw new Error("Not authenticated");
            return await this.db.delete('work_plans', `plan_${user.id}_${date}`);
        }

        /**
         * Get work plan for a specific day and user
         */
        async getWorkPlan(userId, date) {
            return await this.db.get('work_plans', `plan_${userId}_${date}`);
        }

        /**
         * Add a new shared event (Admin only)
         */
        async addEvent(eventData) {
            const event = {
                id: 'ev_' + Date.now(),
                ...eventData,
                createdOn: new Date().toISOString()
            };
            return await this.db.add('events', event);
        }

        /**
         * Helper: Date to YYYY-MM-DD (Local)
         */
        _toLocalISO(date) {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        /**
         * Get events/plans for a specific month
         */
        async getMonthEvents(year, month) {
            const plans = await this.getPlans();

            // Format leaves into daily events
            const leaveEvents = [];
            plans.leaves.forEach(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                let current = new Date(start);
                while (current <= end) {
                    leaveEvents.push({
                        date: this._toLocalISO(current),
                        title: `${l.userName || 'Staff'} (Leave)`,
                        type: 'leave',
                        userId: l.userId
                    });
                    current.setDate(current.getDate() + 1);
                }
            });

            // Format work plans
            const workEvents = plans.workPlans.map(p => ({
                date: p.date,
                title: p.subPlans && p.subPlans.length > 0
                    ? `${p.userName}: ${p.plan}\n- ${p.subPlans.join('\n- ')}`
                    : `${p.userName}: ${p.plan}`,
                type: 'work',
                userId: p.userId,
                plan: p.plan,
                subPlans: p.subPlans || []
            }));

            // Merge
            const all = [...leaveEvents, ...plans.events, ...workEvents];

            // Filter by month
            return all.filter(ev => {
                const evDate = new Date(ev.date);
                return evDate.getFullYear() === year && evDate.getMonth() === month;
            });
        }
    }

    window.AppCalendar = new Calendar();
})();
