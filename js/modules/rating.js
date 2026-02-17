/**
 * Rating System Module
 * Handles individual star rating calculation based on task completion.
 * Auto-calculates task status based on planned date vs current date.
 */
(function () {
    class RatingSystem {
        constructor() {
            this.db = window.AppDB;
        }

        /**
         * Get smart task status based on date comparison
         * @param {string} taskDate - Planned date for the task (YYYY-MM-DD)
         * @param {string} currentStatus - Current status if manually set
         * @returns {string} - Status: to-be-started | in-process | completed | not-completed | overdue
         */
        getSmartTaskStatus(taskDate, currentStatus = null) {
            // Manual statuses override auto-calculation
            if (currentStatus === 'completed' || currentStatus === 'not-completed') {
                return currentStatus;
            }

            const today = new Date().toISOString().split('T')[0];
            const taskDateStr = typeof taskDate === 'string' ? taskDate : taskDate.toISOString().split('T')[0];

            // Auto-calculate based on date
            if (taskDateStr > today) return 'to-be-started';
            if (taskDateStr === today) return 'in-process';
            if (taskDateStr < today) return 'overdue';

            return 'in-process'; // default
        }

        /**
         * Calculate points for a single task based on status and timing
         * @param {object} task - Task object with status, date, completedDate
         * @param {string} planDate - Planned date for this task
         * @returns {number} - Points earned/lost for this task
         */
        calculateTaskPoints(task, planDate) {
            const status = this.getSmartTaskStatus(planDate, task.status);
            let points = 0;

            // Base points by status
            switch (status) {
                case 'completed':
                    points = 10;
                    // Timing bonuses/penalties
                    if (task.completedDate) {
                        const daysDiff = this.getDaysDifference(planDate, task.completedDate);
                        if (daysDiff === 0) {
                            points += 3; // On-time bonus
                        } else if (daysDiff === 1) {
                            points -= 1; // 1 day late
                        } else if (daysDiff >= 2) {
                            points -= 2; // 2+ days late
                        }
                    }
                    break;
                case 'in-process':
                    points = 5;
                    break;
                case 'to-be-started':
                    points = 0; // Neutral, future task
                    break;
                case 'overdue':
                    points = -8; // Heavy penalty
                    break;
                case 'not-completed':
                    points = -3; // Cancelled/abandoned
                    break;
            }

            return points;
        }

        /**
         * Get difference in days between two dates
         * @param {string} date1 - First date (YYYY-MM-DD)
         * @param {string} date2 - Second date (YYYY-MM-DD)
         * @returns {number} - Days difference (date2 - date1)
         */
        getDaysDifference(date1, date2) {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            const diffTime = d2 - d1;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        /**
         * Get completion statistics for a user's tasks
         * @param {array} workPlans - Array of work plans
         * @returns {object} - Statistics object
         */
        getCompletionStats(workPlans) {
            let completed = 0;
            let inProcess = 0;
            let notCompleted = 0;
            let overdue = 0;
            let toBeStarted = 0;
            let totalTasks = 0;

            workPlans.forEach(plan => {
                if (plan.plans && Array.isArray(plan.plans)) {
                    plan.plans.forEach(task => {
                        totalTasks++;
                        const status = this.getSmartTaskStatus(plan.date, task.status);
                        switch (status) {
                            case 'completed': completed++; break;
                            case 'in-process': inProcess++; break;
                            case 'not-completed': notCompleted++; break;
                            case 'overdue': overdue++; break;
                            case 'to-be-started': toBeStarted++; break;
                        }
                    });
                } else if (plan.plan) {
                    // Legacy single plan format
                    totalTasks++;
                    const status = this.getSmartTaskStatus(plan.date, plan.status);
                    switch (status) {
                        case 'completed': completed++; break;
                        case 'in-process': inProcess++; break;
                        case 'not-completed': notCompleted++; break;
                        case 'overdue': overdue++; break;
                        case 'to-be-started': toBeStarted++; break;
                    }
                }
            });

            const completionRate = totalTasks > 0 ? completed / totalTasks : 0;

            return {
                completed,
                inProcess,
                notCompleted,
                overdue,
                toBeStarted,
                totalTasks,
                completionRate: parseFloat(completionRate.toFixed(2)),
                lastCalculated: new Date().toISOString()
            };
        }

        /**
         * Calculate user rating based on task completion over specified days
         * @param {string} userId - User ID
         * @param {number} daysBack - Number of days to look back (default 30)
         * @returns {object} - Rating data with score and stats
         */
        async calculateUserRating(userId, daysBack = 30) {
            try {
                // Get all work plans
                const allPlans = await this.db.getAll('work_plans');

                // Filter to user's plans within date range
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysBack);
                const cutoffStr = cutoffDate.toISOString().split('T')[0];

                const userPlans = allPlans.filter(p =>
                    p.userId === userId && p.date >= cutoffStr
                );

                if (userPlans.length === 0) {
                    return {
                        rating: 3.0, // Default neutral rating
                        rawScore: 0,
                        stats: {
                            completed: 0,
                            inProcess: 0,
                            notCompleted: 0,
                            overdue: 0,
                            toBeStarted: 0,
                            totalTasks: 0,
                            completionRate: 0,
                            lastCalculated: new Date().toISOString()
                        }
                    };
                }

                // Calculate total points
                let totalPoints = 0;
                userPlans.forEach(plan => {
                    if (plan.plans && Array.isArray(plan.plans)) {
                        plan.plans.forEach(task => {
                            totalPoints += this.calculateTaskPoints(task, plan.date);
                        });
                    } else if (plan.plan) {
                        // Legacy format
                        totalPoints += this.calculateTaskPoints(plan, plan.date);
                    }
                });

                // Get completion stats
                const stats = this.getCompletionStats(userPlans);

                // Normalize to 1-5 scale
                // Use a sigmoid-like function for smooth scaling
                // Typical range: -50 to +150 points for 30 days
                const rating = this.normalizeScore(totalPoints, -50, 150);

                return {
                    rating: parseFloat(rating.toFixed(1)),
                    rawScore: totalPoints,
                    stats
                };
            } catch (err) {
                console.error('Rating calculation failed:', err);
                return {
                    rating: 3.0,
                    rawScore: 0,
                    stats: {
                        completed: 0,
                        inProcess: 0,
                        notCompleted: 0,
                        overdue: 0,
                        toBeStarted: 0,
                        totalTasks: 0,
                        completionRate: 0,
                        lastCalculated: new Date().toISOString()
                    }
                };
            }
        }

        /**
         * Normalize raw score to 1-5 rating scale
         * @param {number} score - Raw score
         * @param {number} minScore - Expected minimum score
         * @param {number} maxScore - Expected maximum score
         * @returns {number} - Rating between 1 and 5
         */
        normalizeScore(score, minScore, maxScore) {
            // Clamp score to range
            const clampedScore = Math.max(minScore, Math.min(maxScore, score));

            // Linear interpolation to 1-5 scale
            const normalized = 1 + ((clampedScore - minScore) / (maxScore - minScore)) * 4;

            // Ensure result is between 1 and 5
            return Math.max(1, Math.min(5, normalized));
        }

        /**
         * Update rating for a specific user and save to database
         * @param {string} userId - User ID
         * @returns {object} - Updated user object
         */
        async updateUserRating(userId) {
            try {
                const ratingData = await this.calculateUserRating(userId);
                const user = await this.db.get('users', userId);

                if (!user) {
                    throw new Error('User not found');
                }

                // Initialize rating history if needed
                if (!user.ratingHistory) {
                    user.ratingHistory = [];
                }

                // Add to history (keep last 90 days)
                const today = new Date().toISOString().split('T')[0];
                user.ratingHistory.push({
                    date: today,
                    rating: ratingData.rating,
                    reason: 'auto-calculated'
                });

                // Keep only last 90 entries
                if (user.ratingHistory.length > 90) {
                    user.ratingHistory = user.ratingHistory.slice(-90);
                }

                // Update current rating and stats
                user.rating = ratingData.rating;
                user.completionStats = ratingData.stats;

                await this.db.put('users', user);
                return user;
            } catch (err) {
                console.error('Failed to update user rating:', err);
                throw err;
            }
        }

        /**
         * Update ratings for all users
         * @returns {array} - Array of updated users
         */
        async updateAllRatings() {
            try {
                const users = await this.db.getAll('users');
                const updatedUsers = [];

                for (const user of users) {
                    try {
                        const updated = await this.updateUserRating(user.id);
                        updatedUsers.push(updated);
                    } catch (err) {
                        console.error(`Failed to update rating for ${user.name}:`, err);
                    }
                }

                return updatedUsers;
            } catch (err) {
                console.error('Failed to update all ratings:', err);
                throw err;
            }
        }

        /**
         * Get top performers by rating
         * @param {number} limit - Number of top performers to return
         * @returns {array} - Array of top users with ratings
         */
        async getTopPerformers(limit = 5) {
            try {
                const users = await this.db.getAll('users');

                // Filter out users without ratings and sort
                const rankedUsers = users
                    .filter(u => u.rating !== undefined)
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, limit);

                return rankedUsers.map(u => ({
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar,
                    rating: u.rating || 0,
                    completionStats: u.completionStats || {}
                }));
            } catch (err) {
                console.error('Failed to get top performers:', err);
                return [];
            }
        }

        /**
         * Get rating history for a user
         * @param {string} userId - User ID
         * @param {number} daysBack - Number of days to look back
         * @returns {array} - Rating history entries
         */
        async getRatingHistory(userId, daysBack = 90) {
            try {
                const user = await this.db.get('users', userId);
                if (!user || !user.ratingHistory) {
                    return [];
                }

                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysBack);
                const cutoffStr = cutoffDate.toISOString().split('T')[0];

                return user.ratingHistory.filter(h => h.date >= cutoffStr);
            } catch (err) {
                console.error('Failed to get rating history:', err);
                return [];
            }
        }
    }

    // Export to Window (Global)
    window.AppRating = new RatingSystem();
})();
