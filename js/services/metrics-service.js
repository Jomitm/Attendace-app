// js/services/metrics-service.js
// Computes metrics from raw event and attendance data for dashboards and AI Center.
// All computation happens client-side (no new server endpoint needed).

function _db() {
    return window.AppDB;
}

function _userService() {
    return window.AppUserService;
}

function _attendanceService() {
    return window.AppAttendanceService;
}

function _analyticsService() {
    return window.AppAnalyticsService;
}

function _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _daysAgo(n) {
    const d = new Date(Date.now() - n * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _monthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function _yearStart() {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
}

export class MetricsService {
    // ── Attendance Metrics ────────────────────────────────────

    /**
     * Compute attendance summary for a date range.
     */
    async getAttendanceSummary(fromDate, toDate) {
        const svc = _attendanceService();
        const logs = await svc?.getByDateRange(fromDate, toDate, { force: true }) || [];

        const total = logs.length;
        const _statusOf = (l) => String(l.status || l.type || '').trim();
        if (total > 0) {
            const statuses = logs.map(_statusOf);
            console.log('[MetricsService] attendance statuses:', [...new Set(statuses)], '| sample status:', logs[0].status, '| sample type:', logs[0].type);
        }
        const present = logs.filter(l => /present|half.?day/i.test(_statusOf(l))).length;
        const absent = logs.filter(l => /absent/i.test(_statusOf(l))).length;
        const late = logs.filter(l => l.late === true || /late/i.test(_statusOf(l))).length;
        const remote = logs.filter(l => l.workMode === 'remote' || l.location_type === 'remote').length;

        return {
            total,
            present,
            absent,
            late,
            remote,
            attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : '0',
            lateRate: total > 0 ? ((late / total) * 100).toFixed(1) : '0'
        };
    }

    /**
     * Get attendance metrics per user for a date range.
     */
    async getUserAttendanceMetrics(fromDate, toDate) {
        const users = await _userService()?.getActiveStaff() || [];
        const logs = await _attendanceService()?.getByDateRange(fromDate, toDate, { force: true }) || [];

        return users.map(user => {
            const userLogs = logs.filter(l => l.user_id === user.id);
            const _s = (l) => String(l.status || l.type || '').toLowerCase();
            const present = userLogs.filter(l => /present|half_day|half day/i.test(_s(l))).length;
            const late = userLogs.filter(l => l.late === true || _s(l) === 'late').length;
            const total = userLogs.length;

            return {
                userId: user.id,
                username: user.username,
                name: user.name,
                totalDays: total,
                present,
                late,
                attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : '0'
            };
        });
    }

    // ── Leave Metrics ─────────────────────────────────────────

    /**
     * Get leave summary for a user over a year.
     */
    async getUserLeaveSummary(userId) {
        const db = _db();
        if (!db) return {};

        const allLeaves = await db.getAll('leaves').catch(() => []);
        const userLeaves = allLeaves.filter(l => l.userId === userId);

        const byType = {};
        for (const leave of userLeaves) {
            const type = leave.type || 'unknown';
            if (!byType[type]) byType[type] = { total: 0, approved: 0, pending: 0, rejected: 0 };
            byType[type].total++;
            if (leave.status === 'approved') byType[type].approved++;
            else if (leave.status === 'pending') byType[type].pending++;
            else if (leave.status === 'rejected') byType[type].rejected++;
        }

        return { userId, byType, total: userLeaves.length };
    }

    /**
     * Get pending leave count.
     */
    async getPendingLeaveCount() {
        const db = _db();
        if (!db) return 0;
        const all = await db.getAll('leaves').catch(() => []);
        return all.filter(l => l.status === 'pending').length;
    }

    // ── Task Metrics ──────────────────────────────────────────

    /**
     * Get task completion metrics from work plans.
     */
    async getTaskMetrics(fromDate, toDate) {
        const workPlans = await _analyticsService()?.getWorkPlans() || [];
        // Flatten work_plans docs (each has .plans array) into individual tasks
        const allTasks = [];
        for (const wp of workPlans) {
            if (!wp || !Array.isArray(wp.plans)) continue;
            if (wp.date && (wp.date < fromDate || wp.date > toDate)) continue;
            for (const t of wp.plans) {
                if (!t || t.isRemoved === true) continue;
                if (!String(t.task || '').trim()) continue;
                allTasks.push({ ...t, _wpDate: wp.date, _wpUserId: wp.userId || wp.user_id });
            }
        }
        const filtered = allTasks;

        const total = filtered.length;
        const _norm = s => String(s || '').trim().toLowerCase();
        if (total > 0) {
            const statuses = filtered.map(p => p.status);
            const normed = [...new Set(filtered.map(p => _norm(p.status)))];
            const sample = filtered[0];
            console.log('[MetricsService] task statuses:', [...new Set(statuses)], '| normed:', normed, '| total tasks:', total, '| sample:', sample);
            console.log('[MetricsService] task statuses JSON:', JSON.stringify([...new Set(statuses)], null, 2));
            console.log('[MetricsService] task sample keys:', Object.keys(sample || {}));
            console.log('[MetricsService] task sample JSON:', JSON.stringify(sample, null, 2).slice(0, 2000));
        } else if (workPlans.length > 0) {
            const sample = workPlans[0];
            console.log('[MetricsService] task debug: workPlans docs', workPlans.length, '| filtered tasks 0 | sample doc keys', Object.keys(sample || {}), '| sample doc', JSON.stringify(sample, null, 2).slice(0, 2000));
        }
        const completed = filtered.filter(p =>
            _norm(p.status) === 'completed' || p.completed === true
        ).length;
        const inProgress = filtered.filter(p => {
            const n = _norm(p.status);
            return n === 'in-process' || n === 'in process' || n === 'in-progress' || n === 'in progress';
        }).length;

        return {
            total,
            completed,
            inProgress,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0'
        };
    }

    // ── Activity Metrics ──────────────────────────────────────

    /**
     * Get activity metrics from events.
     */
    async getActivityMetrics(fromDate, toDate) {
        const db = _db();
        if (!db) return {};

        const allEvents = await db.getAll('events').catch(() => []);
        const filtered = allEvents.filter(e => e.date >= fromDate && e.date <= toDate);

        const byType = {};
        for (const event of filtered) {
            const type = event.type || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
        }

        return { total: filtered.length, byType };
    }

    // ── Hero / Performance Metrics ────────────────────────────

    /**
     * Get Hero of the Week scores (delegates to existing AppAnalytics).
     */
    async getHeroScores() {
        if (window.AppAnalytics?.getHeroScore) {
            return window.AppAnalytics.getHeroScore();
        }
        return {};
    }

    /**
     * Get monthly performance stats for a user.
     */
    async getMonthlyPerformance(userId) {
        if (window.AppAnalytics?.getUserMonthlyStats) {
            return window.AppAnalytics.getUserMonthlyStats(userId);
        }
        return {};
    }

    // ── Team Overview ─────────────────────────────────────────

    /**
     * Get a complete team overview for today.
     */
    async getTeamOverview() {
        const today = _today();
        const monthStart = _monthStart();

        const [attendance, pendingLeaves, taskMetrics] = await Promise.all([
            this.getAttendanceSummary(today, today),
            this.getPendingLeaveCount(),
            this.getTaskMetrics(monthStart, today)
        ]);

        const users = await _userService()?.getActiveStaff() || [];

        return {
            date: today,
            teamSize: users.length,
            attendance,
            pendingLeaves,
            taskMetrics
        };
    }

    /**
     * Get a 7-day trend for attendance.
     */
    async getAttendanceTrend() {
        const trends = [];
        for (let i = 6; i >= 0; i--) {
            const date = _daysAgo(i);
            const summary = await this.getAttendanceSummary(date, date);
            trends.push({ date, ...summary });
        }
        return trends;
    }

    // ── AI Center Summary ─────────────────────────────────────

    /**
     * Get all metrics needed by the AI Center in one call.
     */
    async getAICenterMetrics() {
        const today = _today();
        const monthStart = _monthStart();
        const yearStart = _yearStart();

        const [
            todayAttendance,
            monthAttendance,
            yearAttendance,
            pendingLeaves,
            taskMetrics,
            teamOverview,
            trend
        ] = await Promise.all([
            this.getAttendanceSummary(today, today),
            this.getAttendanceSummary(monthStart, today),
            this.getAttendanceSummary(yearStart, today),
            this.getPendingLeaveCount(),
            this.getTaskMetrics(monthStart, today),
            this.getTeamOverview(),
            this.getAttendanceTrend()
        ]);

        return {
            today: todayAttendance,
            month: monthAttendance,
            year: yearAttendance,
            pendingLeaves,
            taskMetrics,
            teamOverview,
            trend,
            computedAt: Date.now()
        };
    }

    // ── Personal AI Helper ────────────────────────────────────
    _getCurrentUser() {
        try {
            return window.AppAuth?.getUser?.() || null;
        } catch { return null; }
    }

    /**
     * Normalize a task's text for lineage matching: strip the
     * "(Postponed from DATE)" suffix that checkout postpones append, so the
     * source task and all its postponed copies collapse to one identity.
     */
    _taskLineageKey(t, userId) {
        const raw = String(t.task || '').trim();
        const base = raw.replace(/\s*\(Postponed from [^)]+\)\s*$/i, '').trim().toLowerCase();
        const root = String(t.carryForwardRootId || '').trim();
        const src = t.sourcePlanId != null && t.sourceTaskIndex != null ? `${t.sourcePlanId}::${t.sourceTaskIndex}` : '';
        return `${String(userId)}::${root || src || base}`;
    }

    /**
     * Collapse postponed/overdue lineage shells into one entry per logical
     * task: keep the LATEST instance (highest plan date) per lineage key.
     * Without this, each checkout-postpone leaves a permanent shell on the
     * old date and counts inflate (one postponed task can look like five).
     */
    _dedupeTaskInstances(allTasks) {
        const byKey = new Map();
        for (const t of allTasks) {
            const key = this._taskLineageKey(t, t._ownerId || '');
            const prev = byKey.get(key);
            if (!prev || String(t._wpDate) > String(prev._wpDate)) {
                byKey.set(key, t);
            }
        }
        return Array.from(byKey.values());
    }

    _isPrivileged(user) {
        const role = String(user?.role || '').toLowerCase();
        // Only admin sees team-wide view; hr is personal like staff (per requirement 2026-09-14)
        return role === 'admin' || role === 'administrator' || user?.isAdmin === true;
    }

    // Personal task metrics (my tasks only, flattened from work_plans)
    async getMyTaskMetrics(fromDate, toDate) {
        const user = this._getCurrentUser();
        if (!user) return { total: 0, completed: 0, inProgress: 0, completionRate: '0' };
        const workPlans = await _analyticsService()?.getWorkPlans() || [];
        const allTasks = [];
        for (const wp of workPlans) {
            if (!wp || !Array.isArray(wp.plans)) continue;
            if (wp.date && (wp.date < fromDate || wp.date > toDate)) continue;
            for (const t of wp.plans) {
                if (!t || t.isRemoved) continue;
                if (!String(t.task || '').trim()) continue;
                const assigned = String(t.assignedTo || wp.userId || wp.user_id || '').trim();
                if (assigned && String(assigned) !== String(user.id) && String(wp.userId || wp.user_id) !== String(user.id)) continue;
                if (!assigned && String(wp.userId || wp.user_id) !== String(user.id)) continue;
                allTasks.push({ ...t, _wpDate: wp.date, _ownerId: user.id });
            }
        }
        // Collapse postpone shells: source + N copies = 1 logical task
        const liveTasks = this._dedupeTaskInstances(allTasks);
        const norm = s => String(s || '').trim().toLowerCase();
        const total = liveTasks.length;
        const completed = liveTasks.filter(p => norm(p.status) === 'completed' || p.completed === true).length;
        const inProgress = liveTasks.filter(p => { const n = norm(p.status); return n === 'in-process' || n === 'in process' || n === 'in-progress' || n === 'in progress'; }).length;
        const postponed = liveTasks.filter(p => norm(p.status) === 'postponed').length;
        return { total, completed, inProgress, postponed, completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0' };
    }

    async getMyAttendanceSummary(fromDate, toDate) {
        const user = this._getCurrentUser();
        if (!user) return { total:0, present:0, absent:0, late:0, attendanceRate:'0', lateRate:'0' };
        const svc = _attendanceService();
        const logs = await svc?.getByDateRange(fromDate, toDate, { force: false }) || [];
        const mine = logs.filter(r => String(r.user_id) === String(user.id) || String(r.userId) === String(user.id));
        const _statusOf = l => String(l.status || l.type || '').trim();
        const present = mine.filter(l => /present|half.?day/i.test(_statusOf(l))).length;
        const absent = mine.filter(l => /absent/i.test(_statusOf(l))).length;
        const late = mine.filter(l => l.late === true || /late/i.test(_statusOf(l))).length;
        const total = mine.length;
        // Also count live checked-in today as present if no log yet (log only on checkout)
        let extraPresent = 0;
        try {
            const fresh = await _db()?.get('users', user.id);
            const st = String(fresh?.status || '').toLowerCase();
            const ms = Number(fresh?.lastCheckIn)||0;
            const d = ms ? new Date(ms) : null;
            const lastDate = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : null;
            if (st === 'in' && lastDate && lastDate >= fromDate && lastDate <= toDate && mine.length === 0) extraPresent = 1;
        } catch {}
        const adjTotal = total + extraPresent;
        const adjPresent = present + extraPresent;
        return { total: adjTotal, present: adjPresent, absent, late, attendanceRate: adjTotal>0 ? ((adjPresent/adjTotal)*100).toFixed(1) : '0', lateRate: adjTotal>0 ? ((late/adjTotal)*100).toFixed(1) : '0' };
    }

    async getMyPersonalContext() {
        const user = this._getCurrentUser();
        if (!user) return { user: null, role: 'guest' };
        const today = _today();
        const monthStart = _monthStart();
        const isPriv = this._isPrivileged(user);
        const [todayLogs, myIssues, myLeave, myTaskMetrics, myAttendanceSummary, policies] = await Promise.all([
            _attendanceService()?.getByDateRange(today, today, { force: false }).then(rows => (rows || []).filter(r => String(r.user_id) === String(user.id) || String(r.userId) === String(user.id))).catch(() => []),
            this.getMyIssues().catch(() => []),
            this.getUserLeaveSummary(user.id).catch(() => ({ total: 0, byType: {} })),
            this.getMyTaskMetrics(monthStart, today).catch(() => ({ total: 0, completed: 0, completionRate: '0', inProgress: 0 })),
            this.getMyAttendanceSummary(monthStart, today).catch(() => ({ total:0, present:0, absent:0, late:0, attendanceRate:'0' })),
            _db()?.getAll('policies').catch(() => []).then(rows => (rows || []).slice(0, 20)).catch(() => [])
        ]);
        const myAttendance = todayLogs[0] || null;
        // Compact flat task list so the AI can name concrete tasks (overdue/postponed first)
        const myTasks = await this.getMyFlatTasks(today, 20).catch(() => []);
        return {
            user: { id: user.id, name: user.name, role: user.role, email: user.email },
            role: user.role,
            isPrivileged: isPriv,
            today,
            myAttendance,
            myIssues,
            myTasks,
            myLeave,
            taskMetrics: myTaskMetrics,
            myAttendanceSummary,
            // Keep team taskMetrics for admin view if needed (fetch on demand)
            computedAt: Date.now(),
            policies: policies.map(p => ({ id: p.id, title: p.title || p.name, summary: String(p.summary || p.description || '').slice(0, 300) })),
        };
    }

    /**
     * Flat list of my tasks for AI context — prioritized: overdue, postponed,
     * due-today first; capped at `limit` items with short fields only.
     */
    async getMyFlatTasks(today, limit = 20) {
        const user = this._getCurrentUser();
        if (!user) return [];
        const workPlans = await _analyticsService()?.getWorkPlans() || [];
        const norm = s => String(s || '').trim().toLowerCase();
        const out = [];
        for (const wp of workPlans) {
            if (!wp || !Array.isArray(wp.plans)) continue;
            for (const t of wp.plans) {
                if (!t || t.isRemoved) continue;
                if (!String(t.task || '').trim()) continue;
                const assigned = String(t.assignedTo || wp.userId || wp.user_id || '').trim();
                if (assigned && String(assigned) !== String(user.id) && String(wp.userId || wp.user_id) !== String(user.id)) continue;
                if (!assigned && String(wp.userId || wp.user_id) !== String(user.id)) continue;
                const n = norm(t.status);
                const status = (n === 'completed' || t.completed === true) ? 'completed'
                    : n === 'postponed' ? 'postponed' : n || 'pending';
                const date = String(wp.date || '');
                out.push({
                    task: String(t.task).slice(0, 60),
                    date,
                    status,
                    bucket: date < today && status !== 'completed' ? 'overdue-or-postponed'
                        : date === today ? 'today' : 'upcoming'
                });
            }
        }
        const prio = { 'overdue-or-postponed': 0, 'today': 1, 'upcoming': 2 };
        out.sort((a, b) => (prio[a.bucket] - prio[b.bucket]) || a.date.localeCompare(b.date));
        return out.slice(0, limit);
    }

    async getMyIssues() {
        const user = this._getCurrentUser();
        if (!user) return [];
        const today = _today();
        const issues = [];
        // 1. Attendance issues — source of truth for TODAY is users.status (log only exists after checkout)
        try {
            const logs = await _attendanceService()?.getByDateRange(today, today, { force: false }).catch(() => []) || [];
            const myLog = logs.find(r => String(r.user_id) === String(user.id) || String(r.userId) === String(user.id));
            // Fresh user doc is truth for live check-in (AppAuth cache can be stale after multi-tab sync)
            let freshUser = null;
            try { freshUser = await _db()?.get('users', user.id); } catch {}
            const effectiveUser = freshUser || user;
            const status = String(effectiveUser.status || '').trim().toLowerCase();
            const lastMs = Number(effectiveUser.lastCheckIn) || 0;
            const lastDate = lastMs ? (() => { const d = new Date(lastMs); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : null;
            const isCheckedInToday = status === 'in' && lastDate === today;
            const typeNorm = String(myLog?.type || myLog?.status || '').trim().toLowerCase();

            if (isCheckedInToday) {
                // Currently checked in — attendance log not yet written (created on checkout)
                const checkInTimeStr = lastMs ? new Date(lastMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (myLog?.checkIn || 'today');
                // Late detection based on live check-in time (mirrors attendance.js LATE_CUTOFF_MINUTES)
                const mins = lastMs ? (new Date(lastMs).getHours()*60 + new Date(lastMs).getMinutes()) : 0;
                const cutoff = Number(window.AppConfig?.LATE_CUTOFF_MINUTES ?? 555);
                const isLateLive = mins > cutoff;
                if (isLateLive || typeNorm === 'late' || myLog?.late === true) {
                    issues.push({
                        id: 'att-late-live',
                        severity: 'medium',
                        category: 'attendance',
                        title: 'Late check-in today',
                        detail: `You checked in at ${checkInTimeStr} — a bit late. Office time is 09:15.`,
                        fact: `You came at ${checkInTimeStr} today, after 09:15.`,
                        observation: 'You are late today. 3 lates together count as half day leave.',
                        prediction: 'If this happens often, it will affect your attendance score.',
                        recommendation: 'Try to reach before 09:15 tomorrow. If there was a reason, check the policy page.',
                        actionLabel: 'View Policy',
                        action: 'view-policy',
                        dueDate: today
                    });
                }
                // Always remind to checkout (high-priority actionable)
                issues.push({
                    id: 'att-checkedin-pending-checkout',
                    severity: isLateLive ? 'medium' : 'low',
                    category: 'attendance',
                    title: 'You are checked in — need to check out later',
                    detail: `You checked in at ${checkInTimeStr} today. Just remember to check out before you leave — that completes your attendance.`,
                    fact: `You are marked present for today since ${checkInTimeStr}.`,
                    observation: 'Your day will befully counted only after you check out.',
                    prediction: 'If you forget to check out, the system will mark it as Half Day and ask for a reason.',
                    recommendation: 'When your work is done, please tap Check Out and add your task updates.',
                    actionLabel: 'Check Out',
                    action: 'checkout',
                    dueDate: today
                });
            } else if (myLog) {
                // Already checked out — evaluate logged type
                if (/absent/i.test(typeNorm)) {
                    issues.push({
                        id: 'att-absent',
                        severity: 'high',
                        category: 'attendance',
                        title: 'You are marked Absent today',
                        detail: `Your attendance for today is counted as Absent.`,
                        fact: `Today is marked as Absent.`,
                        observation: 'This will lower your monthly attendance and hero score.',
                        prediction: 'If this is a mistake, it can be corrected.',
                        recommendation: 'Please check if you were on leave or holiday. If not, raise an attendance correction.',
                        actionLabel: 'Review Attendance',
                        action: 'review-attendance',
                        dueDate: today
                    });
                } else if (typeNorm === 'late' || myLog.late === true) {
                    issues.push({
                        id: 'att-late',
                        severity: 'medium',
                        category: 'attendance',
                        title: 'You were late today',
                        detail: `You checked in at ${myLog.checkIn || myLog.check_in || 'unknown'} — after 09:15.`,
                        fact: `You came late today at ${myLog.checkIn || 'unknown'}.`,
                        observation: '3 lates together count as half day leave.',
                        prediction: 'Coming late often will affect your record.',
                        recommendation: 'Try to reach before 09:15. Check policy for waiver rules.',
                        actionLabel: 'View Policy',
                        action: 'view-policy',
                        dueDate: today
                    });
                }
                // If checked out today, no "no check-in" issue — clear
            } else {
                // Not checked in today and no log — truly missing
                if (status !== 'in') {
                    issues.push({
                        id: 'att-missing-today',
                        severity: 'high',
                        category: 'attendance',
                        title: 'You have not checked in today',
                        detail: `We did not find a check-in for today (${today}). Office time is 09:15.`,
                        fact: `No check-in found for today.`,
                        observation: 'You are not yet marked present.',
                        prediction: 'If you do not check in, today will be counted as Absent.',
                        recommendation: 'Please check in now. If you are on leave today, please apply for leave.',
                        actionLabel: 'Check In',
                        action: 'checkin',
                        dueDate: today
                    });
                }
            }
        } catch (e) { console.warn('[MetricsService] getMyIssues attendance', e); }

        // 2. Task issues — flattened work_plans
        try {
            const workPlans = await _analyticsService()?.getWorkPlans() || [];
            const allTasks = [];
            for (const wp of workPlans) {
                if (!wp || !Array.isArray(wp.plans)) continue;
                for (const t of wp.plans) {
                    if (!t || t.isRemoved) continue;
                    if (!String(t.task || '').trim()) continue;
                    const assigned = String(t.assignedTo || wp.userId || wp.user_id || '').trim();
                    // Personal scope: only my tasks (or unassigned but owned plan)
                    if (assigned && String(assigned) !== String(user.id) && String(wp.userId || wp.user_id) !== String(user.id)) continue;
                    if (!assigned && String(wp.userId || wp.user_id) !== String(user.id)) continue;
                    allTasks.push({ ...t, _wpDate: wp.date, _wpId: wp.id, _ownerId: user.id });
                }
            }
            // Collapse postpone shells so one logical task counts once
            const liveTasks = this._dedupeTaskInstances(allTasks);
            const norm = s => String(s || '').trim().toLowerCase();
            const nowDate = today;
            const overdue = liveTasks.filter(t => {
                const n = norm(t.status);
                const isDone = n === 'completed' || t.completed === true;
                if (isDone) return false;
                if (n === 'postponed') return false;
                return String(t._wpDate || '') < nowDate;
            });
            // Postponed: count the LATEST instance only. Note the latest copy on
            // a future/today date is intentionally NOT flagged here — it lives on
            // its target day; only shells stranded in the past (never re-planned
            // forward) surface as the postponed issue.
            const postponed = liveTasks.filter(t => {
                const n = norm(t.status);
                const isDone = n === 'completed' || t.completed === true;
                if (isDone) return false;
                if (n !== 'postponed') return false;
                return String(t._wpDate || '') < nowDate;
            });
            const dueToday = liveTasks.filter(t => {
                const n = norm(t.status);
                if (n === 'completed' || n === 'postponed') return false;
                return String(t._wpDate) === nowDate;
            });
            if (overdue.length > 0) {
                const sample = overdue.slice(0, 2).map(t => `"${String(t.task).slice(0, 40)}"`).join(', ');
                issues.push({
                    id: 'task-overdue',
                    severity: 'high',
                    category: 'task',
                    title: `You have ${overdue.length} overdue task(s)`,
                    detail: `These tasks are still pending from earlier: ${sample}${overdue.length>2?'…':''}. Please clear them first.`,
                    fact: `You have ${overdue.length} tasks overdue from before ${today}.`,
                    observation: `These old tasks are holding up your progress.`,
                    prediction: 'They will keep coming forward each day until finished.',
                    recommendation: 'Start with the oldest one today and mark it done.',
                    actionLabel: 'View My Tasks',
                    action: 'view-tasks',
                    dueDate: today,
                    count: overdue.length
                });
            }
            if (postponed.length > 0) {
                const sample = postponed.slice(0, 3).map(t => `"${String(t.task).slice(0, 40)}" (${t._wpDate})`).join(', ');
                issues.push({
                    id: 'task-postponed',
                    severity: 'medium',
                    category: 'task',
                    title: `You have ${postponed.length} postponed task(s) from earlier days`,
                    detail: `You postponed these but they still need to be done: ${sample}${postponed.length>3?'…':''}.`,
                    fact: `You have ${postponed.length} task(s) marked postponed from before ${today}.`,
                    observation: 'Postponed tasks are not lost — but they are not scheduled either. They keep piling up until you re-plan them.',
                    prediction: 'If you do not re-plan them, they will not appear on any day\'s plan and may be forgotten.',
                    recommendation: 'Open your day plan and move them to today or another day this week.',
                    actionLabel: 'Re-plan Tasks',
                    action: 'view-tasks',
                    dueDate: today,
                    count: postponed.length
                });
            }
            if (dueToday.length > 0) {
                issues.push({
                    id: 'task-due-today',
                    severity: overdue.length>0 ? 'medium' : 'high',
                    category: 'task',
                    title: `You have ${dueToday.length} task(s) for today`,
                    detail: `You planned ${dueToday.length} task(s) for today that are not yet marked complete.`,
                    fact: `You have ${dueToday.length} tasks for today.`,
                    observation: 'Your today’s plan is still not finished.',
                    prediction: 'Finishing them today will improve your monthly score.',
                    recommendation: 'Please finish them before you check out today.',
                    actionLabel: 'Open Day Plan',
                    action: 'open-day-plan',
                    dueDate: today,
                    count: dueToday.length
                });
            }
        } catch (e) { console.warn('[MetricsService] getMyIssues tasks', e); }

        // Sort high -> medium
        const prio = { high: 0, medium: 1, low: 2 };
        issues.sort((a, b) => (prio[a.severity]||9) - (prio[b.severity]||9));
        return issues.slice(0, 5);
    }
}

export const AppMetricsService = new MetricsService();
if (typeof window !== 'undefined') window.AppMetricsService = AppMetricsService;
