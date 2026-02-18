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
         * Updated to handle multiple plans and tagged coworkers
         */
        async setWorkPlan(date, plans = [], targetUserId = null) {
            const currentUser = window.AppAuth.getUser();
            if (!currentUser) throw new Error("Not authenticated");

            const targetId = targetUserId || currentUser.id;
            const allUsers = await this.db.getAll('users');
            const targetUser = allUsers.find(u => u.id === targetId);

            if (!targetUser) {
                console.error("setWorkPlan Error: Target user not found", { targetId, currentUser, allUsersCount: allUsers.length });
                throw new Error("Target user not found");
            }

            const workPlan = {
                id: `plan_${targetId}_${date}`,
                userId: targetId,
                userName: targetUser.name,
                date: date,
                plans: plans, // Array of { task, subPlans, tags: [{id, name}] }
                updatedAt: new Date().toISOString()
            };
            return await this.db.put('work_plans', workPlan);
        }

        /**
         * Add a single task to a user's work plan for a specific date
         * Used by Meeting Minutes to assign action items
         */
        async addWorkPlanTask(date, userId, taskDescription, tags = [], meta = {}) {
            let workPlan = await this.getWorkPlan(userId, date);

            // Create if not exists
            if (!workPlan) {
                const allUsers = await this.db.getAll('users');
                const targetUser = allUsers.find(u => u.id === userId);
                if (!targetUser) throw new Error("Target user not found");

                workPlan = {
                    id: `plan_${userId}_${date}`,
                    userId: userId,
                    userName: targetUser.name,
                    date: date,
                    plans: [],
                    updatedAt: new Date().toISOString()
                };
            }

            // Add the task
            if (!workPlan.plans) workPlan.plans = [];

            if (meta.sourcePlanId !== undefined && meta.sourceTaskIndex !== undefined && meta.sourcePlanId !== null) {
                const existing = workPlan.plans.find(p =>
                    p.sourcePlanId === meta.sourcePlanId &&
                    p.sourceTaskIndex === meta.sourceTaskIndex &&
                    p.addedFrom === (meta.addedFrom || 'minutes')
                );
                if (existing) {
                    existing.task = taskDescription;
                    existing.subPlans = meta.subPlans || existing.subPlans || [];
                    existing.tags = tags;
                    existing.status = meta.status || existing.status || 'pending';
                    existing.updatedAt = new Date().toISOString();
                    workPlan.updatedAt = new Date().toISOString();
                    return await this.db.put('work_plans', workPlan);
                }
            }

            workPlan.plans.push({
                task: taskDescription,
                subPlans: meta.subPlans || [],
                tags: tags,
                status: meta.status || 'pending', // Default
                addedFrom: meta.addedFrom || 'minutes',
                sourcePlanId: meta.sourcePlanId || null,
                sourceTaskIndex: meta.sourceTaskIndex ?? null,
                taggedById: meta.taggedById || null,
                taggedByName: meta.taggedByName || null
            });

            workPlan.updatedAt = new Date().toISOString();
            return await this.db.put('work_plans', workPlan);
        }

        /**
         * Delete a work plan for a specific day
         */
        async deleteWorkPlan(date, targetUserId = null) {
            const currentUser = window.AppAuth.getUser();
            if (!currentUser) throw new Error("Not authenticated");
            const targetId = targetUserId || currentUser.id;
            return await this.db.delete('work_plans', `plan_${targetId}_${date}`);
        }

        /**
         * Get work plan for a specific day and user
         */
        async getWorkPlan(userId, date) {
            return await this.db.get('work_plans', `plan_${userId}_${date}`);
        }

        /**
         * Get smart task status based on date (uses AppRating if available)
         */
        getSmartTaskStatus(taskDate, currentStatus = null) {
            if (window.AppRating) {
                return window.AppRating.getSmartTaskStatus(taskDate, currentStatus);
            }
            // Fallback if rating module not loaded
            if (currentStatus === 'completed' || currentStatus === 'not-completed') {
                return currentStatus;
            }
            const today = new Date().toISOString().split('T')[0];
            const taskDateStr = typeof taskDate === 'string' ? taskDate : taskDate.toISOString().split('T')[0];
            if (taskDateStr > today) return 'to-be-started';
            if (taskDateStr === today) return 'in-process';
            if (taskDateStr < today) return 'overdue';
            return 'in-process';
        }

        /**
         * Update task status (admin or user can mark completed/not-completed)
         */
        async updateTaskStatus(planId, taskIndex, newStatus, completedDate = null) {
            try {
                const plan = await this.db.get('work_plans', planId);
                if (!plan || !plan.plans || !plan.plans[taskIndex]) {
                    throw new Error('Plan or task not found');
                }

                plan.plans[taskIndex].status = newStatus;
                if (newStatus === 'completed' && !plan.plans[taskIndex].completedDate) {
                    plan.plans[taskIndex].completedDate = completedDate || new Date().toISOString().split('T')[0];
                }
                plan.updatedAt = new Date().toISOString();

                await this.db.put('work_plans', plan);

                // Trigger rating recalculation
                if (window.AppRating) {
                    await window.AppRating.updateUserRating(plan.userId);
                }

                return plan;
            } catch (err) {
                console.error('Failed to update task status:', err);
                throw err;
            }
        }

        /**
         * Reassign task to another user
         */
        async reassignTask(planId, taskIndex, newUserId) {
            try {
                const plan = await this.db.get('work_plans', planId);
                if (!plan || !plan.plans || !plan.plans[taskIndex]) {
                    throw new Error('Plan or task not found');
                }

                const users = await this.db.getAll('users');
                const newUser = users.find(u => u.id === newUserId);
                if (!newUser) {
                    throw new Error('New user not found');
                }

                plan.plans[taskIndex].assignedTo = newUserId;
                plan.updatedAt = new Date().toISOString();

                await this.db.put('work_plans', plan);
                return plan;
            } catch (err) {
                console.error('Failed to reassign task:', err);
                throw err;
            }
        }

        /**
         * Get tasks by status for a user
         */
        async getTasksByStatus(userId, status, startDate = null, endDate = null) {
            try {
                const allPlans = await this.db.getAll('work_plans');
                const userPlans = allPlans.filter(p => p.userId === userId);

                const tasks = [];
                userPlans.forEach(plan => {
                    if (startDate && plan.date < startDate) return;
                    if (endDate && plan.date > endDate) return;

                    if (plan.plans && Array.isArray(plan.plans)) {
                        plan.plans.forEach((task, idx) => {
                            const taskStatus = this.getSmartTaskStatus(plan.date, task.status);
                            if (taskStatus === status) {
                                tasks.push({
                                    ...task,
                                    planId: plan.id,
                                    taskIndex: idx,
                                    planDate: plan.date,
                                    calculatedStatus: taskStatus
                                });
                            }
                        });
                    }
                });

                return tasks;
            } catch (err) {
                console.error('Failed to get tasks by status:', err);
                return [];
            }
        }

        /**
         * Get all work plans where the user is tagged for a specific day
         */
        async getCollaborations(userId, date = null) {
            try {
                const allPlans = await this.db.getAll('work_plans');
                return allPlans.filter(p =>
                    (!date || p.date === date) &&
                    p.plans &&
                    p.plans.some(task =>
                        task.tags && task.tags.some(t => t.id === userId && t.status === 'accepted')
                    )
                );
            } catch (err) {
                console.error("Failed to fetch collaborations:", err);
                return [];
            }
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
            const workEvents = plans.workPlans.map(p => {
                let titleParts = [];
                if (p.plans && p.plans.length > 0) {
                    p.plans.forEach(plan => {
                        let text = plan.task;
                        if (plan.subPlans && plan.subPlans.length > 0) {
                            text += ' (' + plan.subPlans.join(', ') + ')';
                        }
                        if (plan.tags && plan.tags.length > 0) {
                            text += ' with ' + plan.tags.map(t => t.name).join(', ');
                        }
                        titleParts.push(text);
                    });
                } else if (p.plan) {
                    // Legacy support
                    let text = p.plan;
                    if (p.subPlans && p.subPlans.length > 0) {
                        text += ' (' + p.subPlans.join(', ') + ')';
                    }
                    titleParts.push(text);
                }

                return {
                    date: p.date,
                    title: `${p.userName}: ${titleParts.join('; ')}`,
                    type: 'work',
                    userId: p.userId,
                    plans: p.plans || [],
                    plan: p.plan || '',
                    subPlans: p.subPlans || []
                };
            });

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
