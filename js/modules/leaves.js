/**
 * Leaves Module
 * Manages leave requests and approvals.
 */

(function () {

    class Leaves {
        constructor() {
            this.db = window.AppDB;
            this.policy = {
                'Annual Leave': { total: 10, minDays: 4 },
                'Casual Leave': { total: 6, maxDays: 3 },
                'Medical Leave': { total: 6, certificateThreshold: 3 },
                'Short Leave': { maxHoursPerMonth: 2, sessions: 2 },
                'Maternity Leave': {
                    'standard': 26 * 7, // 26 weeks in days
                    'extended': 12 * 7, // 12 weeks for 3rd child+
                    'adoption': 12 * 7,
                    'miscarriage': 6 * 7,
                    'tubectomy': 2 * 7
                },
                'Paternity Leave': { total: 10, minServiceYears: 1 },
                'Study Leave': { total: 5, approvalRequired: 'Executive Director' },
                'Compassionate Leave': { total: 5 }
            };
        }

        getFinancialYear(date = new Date()) {
            const d = new Date(date);
            const month = d.getMonth();
            const year = d.getFullYear();
            const startYear = (month < 3) ? year - 1 : year; // April is 3
            return {
                start: new Date(startYear, 3, 1),
                end: new Date(startYear + 1, 2, 31),
                label: `FY ${startYear}-${startYear + 1}`
            };
        }

        async getLeaveUsage(userId, type, financialYear) {
            const allLeaves = await this.db.getAll('leaves');
            const userLeaves = allLeaves.filter(l =>
                l.userId === userId &&
                l.type === type &&
                l.status === 'Approved' &&
                new Date(l.startDate) >= financialYear.start &&
                new Date(l.startDate) <= financialYear.end
            );

            let totalDays = 0;
            userLeaves.forEach(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                totalDays += Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            });
            return totalDays;
        }

        /**
         * Request a new Leave
         * @param {Object} leaveData - { userId, startDate, endDate, type, reason }
         */
        async getMonthlyShortLeaveUsage(userId, date) {
            const month = date.getMonth();
            const year = date.getFullYear();
            const allLeaves = await this.db.getAll('leaves');
            const monthlyShortLeaves = allLeaves.filter(l =>
                l.userId === userId &&
                l.type === 'Short Leave' &&
                l.status === 'Approved' &&
                new Date(l.startDate).getMonth() === month &&
                new Date(l.startDate).getFullYear() === year
            );

            let totalHours = 0;
            monthlyShortLeaves.forEach(l => totalHours += (l.durationHours || 0));
            return {
                hours: totalHours,
                sessions: monthlyShortLeaves.length
            };
        }

        async requestLeave(leaveData) {
            const { userId, startDate, endDate, type, durationHours } = leaveData;
            const start = new Date(startDate);
            const end = new Date(endDate);
            let daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (daysRequested <= 0 && type !== 'Short Leave') throw new Error("Invalid date range");

            const fy = this.getFinancialYear(start);
            const currentUsage = await this.getLeaveUsage(userId, type, fy);
            const rule = this.policy[type];
            const warnings = [];

            // Validation Rules (Collect Warnings)
            if (type === 'Short Leave') {
                const usage = await this.getMonthlyShortLeaveUsage(userId, start);
                let requestedHrs = parseFloat(durationHours || 0);

                // Auto-calculate duration from times if hours field is empty
                if (requestedHrs <= 0 && leaveData.startTime && leaveData.endTime) {
                    const parse = (t) => {
                        const [h, m] = t.split(':').map(Number);
                        return h * 60 + m;
                    };
                    const startMins = parse(leaveData.startTime);
                    const endMins = parse(leaveData.endTime);
                    if (endMins > startMins) {
                        requestedHrs = (endMins - startMins) / 60;
                        leaveData.durationHours = requestedHrs; // Sync back
                    }
                }

                if (requestedHrs <= 0) throw new Error("Please specify duration in hours for Short Leave.");
                if (usage.hours + requestedHrs > rule.maxHoursPerMonth) {
                    warnings.push(`Short Leave limit exceeded (${rule.maxHoursPerMonth}h/mo).`);
                }
                if (usage.sessions >= rule.sessions) {
                    warnings.push(`Max Short Leave sessions (${rule.sessions}/mo) reached.`);
                }
                daysRequested = 0;
            } else if (type === 'Annual Leave') {
                if (daysRequested < rule.minDays) {
                    warnings.push(`Annual Leave requested is less than required minimum (${rule.minDays} days).`);
                }
                if (currentUsage + daysRequested > rule.total) {
                    warnings.push(`Annual Leave balance exceeded (${currentUsage + daysRequested}/${rule.total}).`);
                }
            } else if (type === 'Casual Leave') {
                if (daysRequested > rule.maxDays) {
                    warnings.push(`Casual Leave exceeds maximum allowed per request (${rule.maxDays} days).`);
                }
                if (currentUsage + daysRequested > rule.total) {
                    warnings.push(`Casual Leave balance exceeded (${currentUsage + daysRequested}/${rule.total}).`);
                }
            } else if (type === 'Medical Leave') {
                if (currentUsage + daysRequested > rule.total) {
                    warnings.push(`Medical Leave balance exceeded (${currentUsage + daysRequested}/${rule.total}).`);
                }
                if (daysRequested > rule.certificateThreshold) {
                    leaveData.requireCertificate = true;
                }
            } else if (type === 'Paternity Leave') {
                const user = await this.db.get('users', userId);
                const joinDate = new Date(user.joinDate);
                const serviceYears = (start - joinDate) / (1000 * 60 * 60 * 24 * 365.25);
                if (serviceYears < rule.minServiceYears) {
                    warnings.push("User has not completed 1 year of service (required for Paternity Leave).");
                }
                if (daysRequested > rule.total) {
                    warnings.push(`Paternity Leave exceeds limit of ${rule.total} days.`);
                }
            } else if (['Study Leave', 'Compassionate Leave'].includes(type) && rule) {
                if (daysRequested > rule.total) {
                    warnings.push(`${type} exceeds limit of ${rule.total} days.`);
                }
            }

            const leave = {
                id: 'l' + Date.now(),
                ...leaveData,
                status: 'Pending',
                appliedOn: new Date().toISOString(),
                financialYear: fy.label,
                daysCount: daysRequested,
                policyWarnings: warnings
            };
            await this.db.add('leaves', leave);
            return leave;
        }

        /**
         * Get All Leaves
         * Get All Leaves (for Admin Reports)
         */
        async getAllLeaves() {
            const [allLeaves, allUsers] = await Promise.all([
                this.db.getAll('leaves'),
                this.db.getAll('users')
            ]);

            return allLeaves.map(l => {
                const user = allUsers.find(u => u.id === l.userId);
                return { ...l, userName: user ? user.name : 'Unknown' };
            }).sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        }

        /**
         * Get Pending Leaves (for Admin)
         */
        async getPendingLeaves() {
            const [allLeaves, allUsers] = await Promise.all([
                this.db.getAll('leaves'),
                this.db.getAll('users')
            ]);

            return allLeaves
                .filter(l => l.status === 'Pending')
                .map(l => {
                    const user = allUsers.find(u => u.id === l.userId);
                    return { ...l, userName: user ? user.name : 'Unknown' };
                })
                .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        }

        /**
         * Get My Leaves (for User)
         */
        async getUserLeaves(userId) {
            const allLeaves = await this.db.getAll('leaves');
            return allLeaves.filter(l => l.userId === userId).sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        }

        /**
         * Update Leave Status (Approve/Reject)
         */
        async updateLeaveStatus(leaveId, status, adminId, adminComment = '') {
            const leave = await this.db.get('leaves', leaveId);
            if (!leave) throw new Error("Leave not found");

            leave.status = status;
            leave.actionBy = adminId;
            leave.actionDate = new Date().toISOString();
            leave.adminComment = adminComment;

            await this.db.put('leaves', leave);

            // If Approved, generate Attendance Logs for each day
            if (status === 'Approved') {
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);


                let current = new Date(start);

                while (current <= end) {
                    const dateStr = current.toISOString().split('T')[0];
                    const attendanceLog = {
                        id: 'att_' + leave.userId + '_' + dateStr,
                        user_id: leave.userId, // Standardize to user_id
                        date: dateStr,
                        checkIn: '09:00', // Standard time or leave blank
                        checkOut: '17:00',
                        duration: '8h 0m',
                        location: 'On Leave',
                        type: leave.type, // "Sick Leave", "Casual Leave" etc.
                        status: 'in', // Marked as present/accounted for
                        synced: false
                    };
                    // Check if log exists to avoid overwriting real work (optional policy)
                    // For now, we overwrite or add
                    await this.db.put('attendance', attendanceLog);
                    current.setDate(current.getDate() + 1);
                }
            }

            return leave;
        }
    }

    window.AppLeaves = new Leaves();

})();
