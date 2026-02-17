
/**
 * Leaves Module
 * Manages leave requests and approvals.
 */

(function () {

    class Leaves {
        constructor() {
            this.db = window.AppDB;
            this.cache = {};

            // Default Policy (Fallback)
            this.defaultPolicy = {
                'Annual Leave': { total: 10, minDays: 3, accrual: 'annual' },
                'Casual Leave': { total: 6, maxDays: 2, accrual: 'monthly' },
                'Medical Leave': { total: 6, certificateThreshold: 2, accrual: 'annual' },
                'Maternity Leave': { total: 180, paid: true, gender: 'female' }, // ~26 weeks
                'Paternity Leave': { total: 10, paid: true, gender: 'male', minServiceYears: 0 },
                'Study Leave': { total: 5, paid: false, requireApproval: true },
                'Compassionate Leave': { total: 3, paid: true }
            };
        }

        async getPolicy() {
            if (this.cache.policy) return this.cache.policy;

            try {
                // Check if Firestore is available
                if (window.AppFirestore) {
                    const doc = await window.AppFirestore.collection('settings').doc('policies').get();
                    if (doc.exists) {
                        this.cache.policy = { ...this.defaultPolicy, ...doc.data() };
                    } else {
                        this.cache.policy = this.defaultPolicy;
                    }
                } else {
                    this.cache.policy = this.defaultPolicy;
                }
            } catch (e) {
                console.warn("Failed to fetch dynamic policy, using default.", e);
                this.cache.policy = this.defaultPolicy;
            }
            return this.cache.policy;
        }

        async updatePolicy(newPolicy) {
            try {
                if (window.AppFirestore) {
                    await window.AppFirestore.collection('settings').doc('policies').set(newPolicy, { merge: true });
                    this.cache.policy = null; // Invalidate cache
                    return true;
                }
                throw new Error("Database not connected");
            } catch (e) {
                console.error("Failed to update policy:", e);
                throw e;
            }
        }

        async getFinancialYear(dateObj = new Date()) {
            const month = dateObj.getMonth();
            const year = dateObj.getFullYear();
            // Start of FY is April 1st
            if (month < 3) { // Jan, Feb, Mar belong to previous FY start year
                return { label: `${year - 1}-${year}`, start: new Date(year - 1, 3, 1), end: new Date(year, 2, 31) };
            } else {
                return { label: `${year}-${year + 1}`, start: new Date(year, 3, 1), end: new Date(year + 1, 2, 31) };
            }
        }

        async getUserLeaves(userId, fyLabel = null) {
            if (!fyLabel) fyLabel = (await this.getFinancialYear()).label;
            const leaves = await this.db.getAll('leaves');
            return leaves.filter(l => l.userId === userId && l.financialYear === fyLabel).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        }

        async getLeaveUsage(userId, type, fy) {
            const leaves = await this.getUserLeaves(userId, fy.label);
            const approved = leaves.filter(l => l.type === type && (l.status === 'Approved' || l.status === 'Pending'));
            return approved.reduce((sum, l) => sum + (parseFloat(l.daysCount) || 0), 0);
        }

        // Special check for Short Leave (Monthly Limit)
        async getMonthlyShortLeaveUsage(userId, dateObj) {
            const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            const leaves = await this.db.getAll('leaves');

            const monthlyShortLeaves = leaves.filter(l =>
                l.userId === userId &&
                l.type === 'Short Leave' &&
                l.startDate.startsWith(monthStr) &&
                (l.status === 'Approved' || l.status === 'Pending')
            );

            return monthlyShortLeaves.reduce((sum, l) => sum + (parseFloat(l.daysCount || l.durationHours) || 0), 0);
        }

        async getPendingLeaves() {
            const leaves = await this.db.getAll('leaves');
            return leaves.filter(l => l.status === 'Pending').sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        }

        async requestLeave(leaveData) {
            const { userId, startDate, endDate, type, durationHours } = leaveData;
            const start = new Date(startDate);
            const end = new Date(endDate);
            let daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (daysRequested <= 0 && type !== 'Short Leave') throw new Error("Invalid date range");

            const fy = await this.getFinancialYear(start);
            const currentUsage = await this.getLeaveUsage(userId, type, fy);

            const policy = await this.getPolicy(); // Dynamic Check
            const rule = policy[type];
            const warnings = [];

            // Validation Rules (Collect Warnings)
            if (type === 'Short Leave') {
                const usage = await this.getMonthlyShortLeaveUsage(userId, start);
                let requestedHrs = parseFloat(durationHours || 0);
                if (requestedHrs > 2) warnings.push("Short Leave exceeds 2 hours (standard).");
                if (usage + requestedHrs > 4) warnings.push(`Monthly Short Leave limit exceeded (${usage + requestedHrs}/4 hours).`);
                leaveData.daysCount = requestedHrs; // Store hours for short leave

            } else if (type === 'Annual Leave') {
                if (daysRequested < (rule.minDays || 1)) {
                    warnings.push(`Annual Leave requested is less than required minimum (${rule.minDays || 1} days).`);
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
                if (rule.minServiceYears && serviceYears < rule.minServiceYears) {
                    warnings.push(`User has not completed ${rule.minServiceYears} year(s) of service (required for Paternity Leave).`);
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
                    await this.db.put('attendance', attendanceLog);
                    current.setDate(current.getDate() + 1);
                }
            }
            return leave;
        }
    }

    window.AppLeaves = new Leaves();

})();
