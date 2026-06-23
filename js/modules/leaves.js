import { AppDB } from './db.js';
import { AppConfig } from '../config.js';

export class Leaves {
    constructor() {
        this.db = AppDB;
        this.cache = {};

        // Default Policy (Fallback)
        this.defaultPolicy = {
            'Annual Leave': { total: 10, minDays: 3, accrual: 'annual' },
            'Casual Leave': { total: 6, maxDays: 2, accrual: 'monthly' },
            'Medical Leave': { total: 6, certificateThreshold: 2, accrual: 'annual' },
            'Maternity Leave': { total: 180, paid: true, gender: 'female' },
            'Paternity Leave': { total: 10, paid: true, gender: 'male', minServiceYears: 0 },
            'Study Leave': { total: 5, paid: false, requireApproval: true },
            'Compassionate Leave': { total: 3, paid: true },
            'Retreat Leave': { total: 10, paid: true, accrual: 'annual' },
            'Staff Development Leave': { total: null, paid: true, requireApproval: true }
        };
    }

    mergeHeroPolicy(overrides = {}) {
        const base = AppConfig?.HERO_POLICY || {};
        const stored = overrides && typeof overrides === 'object' ? overrides : {};
        return {
            ...base,
            ...stored,
            WEIGHTS: {
                ...(base.WEIGHTS || {}),
                ...(stored.WEIGHTS || {})
            },
            ATTENDANCE_MODIFIER: {
                ...(base.ATTENDANCE_MODIFIER || {}),
                ...(stored.ATTENDANCE_MODIFIER || {})
            },
            CAPS: {
                ...(base.CAPS || {}),
                ...(stored.CAPS || {})
            },
            MIN_EVIDENCE: {
                ...(base.MIN_EVIDENCE || {}),
                ...(stored.MIN_EVIDENCE || {})
            }
        };
    }

    dedupeLeaves(leaves = []) {
        const unique = new Map();
        (Array.isArray(leaves) ? leaves : []).forEach((leave) => {
            if (!leave) return;
            const userId = String(leave.userId || leave.user_id || '').trim();
            const type = String(leave.type || '').trim().toLowerCase();
            const startDate = String(leave.startDate || '').trim();
            const endDate = String(leave.endDate || '').trim();
            const status = String(leave.status || '').trim().toLowerCase();
            const reason = String(leave.reason || '').trim().toLowerCase();
            const daysCount = String(leave.daysCount ?? '').trim();
            const exactId = String(leave.id || '').trim();
            const contentKey = [
                userId,
                type,
                startDate,
                endDate,
                daysCount,
                reason,
                status
            ].join('|');
            const key = exactId || contentKey;
            const existing = unique.get(key);
            if (!existing) {
                unique.set(key, leave);
                return;
            }
            const existingTime = new Date(existing.actionDate || existing.appliedOn || existing.startDate || 0).getTime();
            const nextTime = new Date(leave.actionDate || leave.appliedOn || leave.startDate || 0).getTime();
            if (nextTime >= existingTime) {
                unique.set(key, { ...existing, ...leave });
            }
        });
        const contentUnique = new Map();
        Array.from(unique.values()).forEach((leave) => {
            const contentKey = [
                String(leave.userId || leave.user_id || '').trim(),
                String(leave.type || '').trim().toLowerCase(),
                String(leave.startDate || '').trim(),
                String(leave.endDate || '').trim(),
                String(leave.daysCount ?? '').trim(),
                String(leave.reason || '').trim().toLowerCase(),
                String(leave.status || '').trim().toLowerCase()
            ].join('|');
            const existing = contentUnique.get(contentKey);
            if (!existing) {
                contentUnique.set(contentKey, leave);
                return;
            }
            const existingTime = new Date(existing.actionDate || existing.appliedOn || existing.startDate || 0).getTime();
            const nextTime = new Date(leave.actionDate || leave.appliedOn || leave.startDate || 0).getTime();
            if (nextTime >= existingTime) {
                contentUnique.set(contentKey, { ...existing, ...leave });
            }
        });
        return Array.from(contentUnique.values());
    }

    async getPolicy() {
        if (this.cache.policy) return this.cache.policy;

        try {
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
            if (typeof window !== 'undefined') {
                window.AppHeroPolicy = this.mergeHeroPolicy(this.cache.policy.heroPolicy || {});
            }
        } catch (e) {
            console.warn("Failed to fetch dynamic policy, using default.", e);
            this.cache.policy = this.defaultPolicy;
            if (typeof window !== 'undefined') {
                window.AppHeroPolicy = this.mergeHeroPolicy();
            }
        }
        return this.cache.policy;
    }

    async updatePolicy(newPolicy) {
        try {
            if (window.AppFirestore) {
                await window.AppFirestore.collection('settings').doc('policies').set(newPolicy, { merge: true });
                this.cache.policy = null;
                if (typeof window !== 'undefined' && newPolicy?.heroPolicy) {
                    window.AppHeroPolicy = this.mergeHeroPolicy(newPolicy.heroPolicy);
                }
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
        if (month < 3) {
            return { label: `${year - 1}-${year}`, start: new Date(year - 1, 3, 1), end: new Date(year, 2, 31) };
        } else {
            return { label: `${year}-${year + 1}`, start: new Date(year, 3, 1), end: new Date(year + 1, 2, 31) };
        }
    }

    async getUserLeaves(userId, fyLabel = null) {
        if (!fyLabel) fyLabel = (await this.getFinancialYear()).label;
        try {
            if (this.db.queryMany && AppConfig?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES) {
                const scoped = await this.db.queryMany('leaves', [
                    { field: 'userId', operator: '==', value: userId },
                    { field: 'financialYear', operator: '==', value: fyLabel }
                ]);
                return scoped.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            }
        } catch (e) {
            console.warn('Scoped getUserLeaves query failed, using fallback', e);
        }
        const leaves = await this.db.getAll('leaves');
        return leaves
            .filter(l => l.userId === userId && l.financialYear === fyLabel)
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    }

    async getLeaveUsage(userId, type, fy) {
        const leaves = await this.getUserLeaves(userId, fy.label);
        const approved = leaves.filter(l => l.type === type && (l.status === 'Approved' || l.status === 'Pending'));
        return approved.reduce((sum, l) => sum + (parseFloat(l.daysCount) || 0), 0);
    }

    async getMonthlyShortLeaveUsage(userId, dateObj) {
        const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        let monthlyShortLeaves = [];
        try {
            if (this.db.queryMany && AppConfig?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES) {
                const scoped = await this.db.queryMany('leaves', [
                    { field: 'userId', operator: '==', value: userId },
                    { field: 'type', operator: '==', value: 'Short Leave' },
                    { field: 'startDate', operator: '>=', value: `${monthStr}-01` },
                    { field: 'startDate', operator: '<=', value: `${monthStr}-31` }
                ]);
                monthlyShortLeaves = scoped.filter(l => l.status === 'Approved' || l.status === 'Pending');
            }
        } catch (e) {
            console.warn('Scoped short leave query failed, using fallback', e);
        }
        if (!monthlyShortLeaves.length) {
            const leaves = await this.db.getAll('leaves');
            monthlyShortLeaves = leaves.filter(l =>
                l.userId === userId &&
                l.type === 'Short Leave' &&
                String(l.startDate || '').startsWith(monthStr) &&
                (l.status === 'Approved' || l.status === 'Pending')
            );
        }

        return monthlyShortLeaves.reduce((sum, l) => sum + (parseFloat(l.daysCount || l.durationHours) || 0), 0);
    }

    async getPendingLeaves() {
        try {
            let pending = [];
            if (this.db.queryMany && AppConfig?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES) {
                const scoped = await this.db.queryMany('leaves', [
                    { field: 'status', operator: '==', value: 'Pending' }
                ], { orderBy: [{ field: 'appliedOn', direction: 'desc' }] });
                pending = this.dedupeLeaves(scoped).sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
            } else {
                const leaves = await this.db.getAll('leaves');
                pending = this.dedupeLeaves(leaves)
                    .filter(l => l.status === 'Pending')
                    .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
            }

            if (pending.length > 0) {
                const users = await this.db.getAll('users');
                const userMap = {};
                users.forEach(u => { userMap[u.id] = u.name; });
                pending.forEach(l => {
                    if (!l.userName && userMap[l.userId]) {
                        l.userName = userMap[l.userId];
                    }
                });
            }
            return pending;
        } catch (e) {
            console.warn('getPendingLeaves failed, using fallback', e);
            const leaves = await this.db.getAll('leaves').catch(() => []);
            return this.dedupeLeaves(leaves)
                .filter(l => l.status === 'Pending')
                .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        }
    }

    async getAllLeaves() {
        const leaves = this.dedupeLeaves(await this.db.getAll('leaves').catch(() => []));
        return (leaves || []).sort((a, b) => {
            const bTime = new Date(b.actionDate || b.appliedOn || b.startDate || 0).getTime();
            const aTime = new Date(a.actionDate || a.appliedOn || a.startDate || 0).getTime();
            return bTime - aTime;
        });
    }

    async requestLeave(leaveData) {
        const { userId, startDate, endDate, type, durationHours } = leaveData;
        const rawType = String(type || '').trim();
        const compactType = rawType.toLowerCase().replace(/\s+/g, '');
        const normalizedType = (
            compactType === 'work-home' ||
            compactType === 'workfromhome' ||
            compactType === 'wfh'
        ) ? 'Work - Home' : rawType;
        leaveData.type = normalizedType;
        const start = new Date(startDate);
        const end = new Date(endDate);
        let daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (daysRequested <= 0 && normalizedType !== 'Short Leave') throw new Error("Invalid date range");

        const fy = await this.getFinancialYear(start);
        const currentUsage = await this.getLeaveUsage(userId, normalizedType, fy);

        const policy = await this.getPolicy();
        const rule = policy[normalizedType];
        const warnings = [];

        if (normalizedType === 'Half Day') {
            daysRequested = 0.5;
            leaveData.daysCount = 0.5;
        } else if (normalizedType === 'Short Leave') {
            const usage = await this.getMonthlyShortLeaveUsage(userId, start);
            let requestedHrs = parseFloat(durationHours || 0);
            if (requestedHrs > 2) warnings.push("Short Leave exceeds 2 hours (standard).");
            if (usage + requestedHrs > 4) warnings.push(`Monthly Short Leave limit exceeded (${usage + requestedHrs}/4 hours).`);
            leaveData.daysCount = requestedHrs;
        } else if (normalizedType === 'Work - Home') {
            leaveData.daysCount = daysRequested;
        } else if (normalizedType === 'Annual Leave') {
            if (daysRequested < (rule.minDays || 1)) {
                warnings.push(`Annual Leave requested is less than required minimum (${rule.minDays || 1} days).`);
            }
            if (currentUsage + daysRequested > rule.total) {
                warnings.push(`Annual Leave balance exceeded (${currentUsage + daysRequested}/${rule.total}).`);
            }
        } else if (normalizedType === 'Casual Leave') {
            if (daysRequested > rule.maxDays) {
                warnings.push(`Casual Leave exceeds maximum allowed per request (${rule.maxDays} days).`);
            }
            if (currentUsage + daysRequested > rule.total) {
                warnings.push(`Casual Leave balance exceeded (${currentUsage + daysRequested}/${rule.total}).`);
            }
        } else if (normalizedType === 'Medical Leave') {
            if (currentUsage + daysRequested > rule.total) {
                warnings.push(`Medical Leave balance exceeded (${currentUsage + daysRequested}/${rule.total}).`);
            }
            if (daysRequested > rule.certificateThreshold) {
                leaveData.requireCertificate = true;
            }
        } else if (normalizedType === 'Paternity Leave') {
            const user = await this.db.get('users', userId);
            const joinDate = new Date(user.joinDate);
            const serviceYears = (start - joinDate) / (1000 * 60 * 60 * 24 * 365.25);
            if (rule.minServiceYears && serviceYears < rule.minServiceYears) {
                warnings.push(`User has not completed ${rule.minServiceYears} year(s) of service (required for Paternity Leave).`);
            }
            if (daysRequested > rule.total) {
                warnings.push(`Paternity Leave exceeds limit of ${rule.total} days.`);
            }
        } else if (['Study Leave', 'Compassionate Leave', 'Retreat Leave', 'Staff Development Leave'].includes(normalizedType) && rule) {
            if (Number.isFinite(Number(rule.total)) && daysRequested > Number(rule.total)) {
                warnings.push(`${normalizedType} exceeds limit of ${rule.total} days.`);
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

    async updateLeaveType(leaveId, nextType, actorId = '') {
        const leave = await this.db.get('leaves', leaveId);
        if (!leave) throw new Error("Leave not found");

        const rawType = String(nextType || '').trim();
        if (!rawType) throw new Error("Leave type is required");

        const compactType = rawType.toLowerCase().replace(/\s+/g, '');
        const normalizedType = (
            compactType === 'work-home' ||
            compactType === 'workfromhome' ||
            compactType === 'wfh'
        ) ? 'Work - Home' : rawType;

        if (String(leave.type || '').trim() === normalizedType) {
            return leave;
        }

        const previousLeave = { ...leave };
        const nowIso = new Date().toISOString();
        const wasApproved = String(previousLeave.status || '').trim() === 'Approved';

        if (wasApproved) {
            await this.removeApprovedLeaveAttendance(previousLeave);
        }

        const updatedLeave = {
            ...previousLeave,
            type: normalizedType,
            actionDate: nowIso,
            actionBy: actorId || previousLeave.actionBy || '',
            reviewHistory: Array.isArray(previousLeave.reviewHistory) ? previousLeave.reviewHistory.slice() : []
        };

        updatedLeave.reviewHistory.unshift({
            id: `leave_type_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            previousType: String(previousLeave.type || ''),
            nextType: normalizedType,
            at: nowIso,
            by: actorId || '',
            comment: 'Leave category updated from attendance sheet.'
        });

        await this.db.put('leaves', updatedLeave);

        if (wasApproved) {
            await this.generateApprovedLeaveAttendance(updatedLeave);
        }

        return updatedLeave;
    }

    async generateApprovedLeaveAttendance(leave) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const leaveTypeCompact = String(leave.type || '').toLowerCase().replace(/\s+/g, '');
        const normalizedType = (
            leaveTypeCompact === 'workfromhome' ||
            leaveTypeCompact === 'work-home' ||
            leaveTypeCompact === 'wfh'
        ) ? 'Work - Home' : leave.type;
        const isWorkFromHome = normalizedType === 'Work - Home';

        let current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const attendanceLog = {
                id: 'att_' + leave.userId + '_' + dateStr,
                user_id: leave.userId,
                date: dateStr,
                checkIn: '09:00',
                checkOut: '17:00',
                duration: '8h 0m',
                location: isWorkFromHome ? 'Work - Home' : 'On Leave',
                type: isWorkFromHome ? 'Work - Home' : normalizedType,
                status: 'in',
                synced: false,
                leaveRequestId: leave.id,
                leaveGenerated: true
            };
            await this.db.put('attendance', attendanceLog);
            current.setDate(current.getDate() + 1);
        }
    }

    async removeApprovedLeaveAttendance(leave) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const leaveTypeCompact = String(leave.type || '').toLowerCase().replace(/\s+/g, '');
        const normalizedType = (
            leaveTypeCompact === 'workfromhome' ||
            leaveTypeCompact === 'work-home' ||
            leaveTypeCompact === 'wfh'
        ) ? 'Work - Home' : leave.type;

        let current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const logId = 'att_' + leave.userId + '_' + dateStr;
            const existing = await this.db.get('attendance', logId).catch(() => null);
            if (existing) {
                const belongsToLeave = String(existing.leaveRequestId || '') === String(leave.id || '');
                const matchesLegacyGeneratedLeave = !existing.checkOutLocation
                    && String(existing.user_id || '') === String(leave.userId || '')
                    && String(existing.date || '') === dateStr
                    && String(existing.type || '') === String(normalizedType || '')
                    && (String(existing.location || '') === 'On Leave' || String(existing.location || '') === 'Work - Home');
                if (belongsToLeave || matchesLegacyGeneratedLeave) {
                    await this.db.delete('attendance', logId).catch(() => null);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    }

    async updateLeaveStatus(leaveId, status, adminId, adminComment = '') {
        const leave = await this.db.get('leaves', leaveId);
        if (!leave) throw new Error("Leave not found");

        const actingUserId = adminId || window.AppAuth?.getUser?.()?.id || null;
        const previousStatus = leave.status || 'Pending';
        const nextStatus = status || previousStatus;
        const nowIso = new Date().toISOString();

        if (!Array.isArray(leave.reviewHistory)) leave.reviewHistory = [];

        const isStatusChange = previousStatus !== nextStatus;
        const isCommentOnlyUpdate = !isStatusChange && typeof adminComment === 'string' && adminComment !== (leave.adminComment || '');

        leave.status = nextStatus;
        leave.actionDate = nowIso;
        leave.adminComment = adminComment;

        if (actingUserId) {
            leave.actionBy = actingUserId;
        } else {
            delete leave.actionBy;
        }

        if (isStatusChange) {
            leave.reviewHistory.unshift({
                id: `leave_hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                previousStatus,
                nextStatus,
                at: nowIso,
                by: actingUserId || '',
                comment: adminComment || ''
            });
        } else if (isCommentOnlyUpdate) {
            leave.reviewHistory.unshift({
                id: `leave_note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                previousStatus,
                nextStatus,
                at: nowIso,
                by: actingUserId || '',
                comment: adminComment || '',
                noteOnly: true
            });
        }

        await this.db.put('leaves', leave);

        if (isStatusChange && previousStatus === 'Approved' && nextStatus !== 'Approved') {
            await this.removeApprovedLeaveAttendance(leave);
        }
        if (isStatusChange && nextStatus === 'Approved') {
            await this.generateApprovedLeaveAttendance(leave);
        }
        return leave;
    }
}

export const AppLeaves = new Leaves();
if (typeof window !== 'undefined') window.AppLeaves = AppLeaves;
if (typeof window !== 'undefined') {
    Promise.resolve()
        .then(() => AppLeaves.getPolicy())
        .catch(() => {
            window.AppHeroPolicy = AppLeaves.mergeHeroPolicy();
        });
}
