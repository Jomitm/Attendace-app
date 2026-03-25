import { AppDB } from './db.js';
import { AppConfig } from '../config.js';

export class Analytics {
    constructor() {
        this.db = AppDB;
        this.chartInstance = null;
        this.memo = new Map();
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('app:db-write', (e) => {
                const collection = e?.detail?.collection;
                if (['attendance', 'users', 'work_plans', 'leaves', 'minutes'].includes(collection)) {
                    this.clearMemo();
                }
            });
        }
    }

    getFlags() {
        return (AppConfig && AppConfig.READ_OPT_FLAGS) || {};
    }

    getTtls() {
        return (AppConfig && AppConfig.READ_CACHE_TTLS) || {};
    }

    async memoize(key, ttlMs, fn) {
        const flags = this.getFlags();
        if (!flags.FF_READ_OPT_ANALYTICS_CACHE) return fn();
        const now = Date.now();
        const cached = this.memo.get(key);
        if (cached && cached.expiresAt > now) return cached.value;
        const value = await fn();
        this.memo.set(key, { value, expiresAt: now + Math.max(0, Number(ttlMs) || 0) });
        return value;
    }

    clearMemo(prefix = '') {
        if (!prefix) {
            this.memo.clear();
            return;
        }
        for (const key of this.memo.keys()) {
            if (key.startsWith(prefix)) this.memo.delete(key);
        }
    }

    async getUsersCached() {
        const ttl = this.getTtls().users || 60000;
        return this.memoize('analytics:users', ttl, async () => {
            if (AppDB && AppDB.getCached) {
                const cacheKey = AppDB.getCacheKey('analyticsUsers', 'users', { ttl });
                return AppDB.getCached(cacheKey, ttl, () => this.db.getAll('users'));
            }
            return this.db.getAll('users');
        });
    }

    async getAttendanceInRange(startDate, endDate, cacheSuffix = '') {
        const ttl = this.getTtls().attendanceSummary || 30000;
        const startIso = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
        const endIso = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
        const key = `analytics:attendance:${startIso}:${endIso}:${cacheSuffix}`;
        return this.memoize(key, ttl, async () => {
            if (this.db.queryMany) {
                return this.db.queryMany('attendance', [
                    { field: 'date', operator: '>=', value: startIso },
                    { field: 'date', operator: '<=', value: endIso }
                ]);
            }
            const all = await this.db.getAll('attendance');
            return all.filter(l => l.date >= startIso && l.date <= endIso);
        });
    }

    async initAdminCharts() {
        const canvas = document.getElementById('admin-stats-chart');
        if (!canvas) return;

        // Destroy existing chart to avoid "Canvas is already in use" error
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        // 1. Fetch Data
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 14);
        const [logs, allUsers] = await Promise.all([
            this.getAttendanceInRange(start, end, 'adminChart'),
            this.getUsersCached()
        ]);

        // 2. Process Data (Last 7 Days)
        const stats = this.processLast7Days(logs, allUsers);

        // 3. Render Chart
        const ctx = canvas.getContext('2d');
        try {
            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: stats.labels,
                    datasets: [
                        {
                            label: 'Staff Present',
                            data: stats.present,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: '#10b981',
                            pointRadius: 4
                        },
                        {
                            label: 'On Leave',
                            data: stats.onLeave,
                            borderColor: '#ef4444',
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            tension: 0.1,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index',
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { usePointStyle: true, boxWidth: 6 }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30, 27, 75, 0.9)',
                            padding: 12,
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, color: '#6b7280' },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#6b7280' }
                        }
                    }
                }
            });
        } catch (err) {
            console.error("Chart.js Error:", err);
            canvas.parentNode.innerHTML = `<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${err.message}</div>`;
        }
    }

    processLast7Days(logs, allUsers = []) {
        const labels = [];
        const presentData = [];
        const leaveData = [];
        const isAttendanceEligible = (log) => {
            if (Object.prototype.hasOwnProperty.call(log || {}, 'attendanceEligible')) {
                return log.attendanceEligible === true;
            }
            const src = String(log?.entrySource || '');
            if (src === 'staff_manual_work') return false;
            if (src === 'admin_override' || src === 'checkin_checkout') return true;
            if (log?.isManualOverride) return true;
            if (log?.location === 'Office (Manual)' || log?.location === 'Office (Override)') return true;
            const hasSystemSignals =
                typeof log?.activityScore !== 'undefined' ||
                typeof log?.locationMismatched !== 'undefined' ||
                typeof log?.autoCheckout !== 'undefined' ||
                !!log?.checkOutLocation ||
                typeof log?.outLat !== 'undefined' ||
                typeof log?.outLng !== 'undefined';
            if (hasSystemSignals) return true;
            const type = String(log?.type || '');
            return type.includes('Leave') || log?.location === 'On Leave';
        };

        // Helper for robust date comparison (ignores time & string format)
        const isSameDay = (d1, d2) => {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        };

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);

            const dayLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            labels.push(dayLabel);

            // Count unique users for this day
            const daysLogs = logs.filter(l => {
                const logDate = new Date(l.date);
                if (isNaN(logDate.getTime())) return false;
                return isSameDay(logDate, targetDate);
            });

            const uniquePresent = new Set();
            const uniqueLeave = new Set();

            daysLogs.forEach(l => {
                if (!isAttendanceEligible(l)) return;
                const uid = l.user_id || l.userId;
                if (!uid) return;

                const isLeaveType = String(l.type || '').toLowerCase().includes('leave') ||
                    l.location === 'On Leave' ||
                    l.type === 'Absent';

                if (isLeaveType) {
                    uniqueLeave.add(uid);
                } else {
                    uniquePresent.add(uid);
                }
            });

            // If processing TODAY, also include users who are currently checked in (active sessions)
            if (i === 0) {
                allUsers.forEach(u => {
                    if (u.status === 'in') {
                        uniquePresent.add(u.id);
                    }
                });
            }

            presentData.push(uniquePresent.size);
            leaveData.push(uniqueLeave.size);
        }

        console.log("Weekly Stats Generated (Unique):", { labels, present: presentData });
        return { labels, present: presentData, onLeave: leaveData };
    }

    // Helper to parse "HH:mm" or "h:mm AM/PM" to minutes from midnight
    parseTimeToMinutes(timeStr) {
        if (!timeStr) return null;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');

        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;

        return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    }

    isAttendanceEligibleLog(log) {
        if (Object.prototype.hasOwnProperty.call(log || {}, 'attendanceEligible')) {
            return log.attendanceEligible === true;
        }
        const src = String(log?.entrySource || '');
        if (src === 'staff_manual_work') return false;
        if (src === 'admin_override' || src === 'checkin_checkout') return true;
        if (log?.isManualOverride) return true;
        if (log?.location === 'Office (Manual)' || log?.location === 'Office (Override)') return true;
        const hasSystemSignals =
            typeof log?.activityScore !== 'undefined' ||
            typeof log?.locationMismatched !== 'undefined' ||
            typeof log?.autoCheckout !== 'undefined' ||
            !!log?.checkOutLocation ||
            typeof log?.outLat !== 'undefined' ||
            typeof log?.outLng !== 'undefined';
        if (hasSystemSignals) return true;
        const type = String(log?.type || '');
        return type.includes('Leave') || log?.location === 'On Leave';
    }

    getAttendanceLogPriority(log) {
        const type = String(log?.type || '');
        const isLeaveLog = type.includes('Leave') || log?.location === 'On Leave';
        const isActualCheckoutLog = (
            !!log?.checkOut &&
            log.checkOut !== 'Active Now' &&
            (
                typeof log?.activityScore !== 'undefined' ||
                typeof log?.locationMismatched !== 'undefined' ||
                !!log?.checkOutLocation ||
                typeof log?.outLat !== 'undefined' ||
                typeof log?.outLng !== 'undefined'
            )
        );

        let score = 1;
        if (isActualCheckoutLog) score = 2;
        if (isLeaveLog) score = 3;
        if (log?.isManualOverride) score = 4;
        return score;
    }

    pickBestAttendanceLogPerDay(logs, startDate, endDate) {
        const bestByDate = new Map();
        const toLocalIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        logs.forEach((log) => {
            const logDate = new Date(log?.date);
            if (Number.isNaN(logDate.getTime()) || logDate < startDate || logDate > endDate) return;
            const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(log?.date || '')) ? String(log.date) : toLocalIso(logDate);
            const existing = bestByDate.get(dateKey);
            if (!existing || this.getAttendanceLogPriority(log) > this.getAttendanceLogPriority(existing)) {
                bestByDate.set(dateKey, log);
            }
        });

        return Array.from(bestByDate.values());
    }
    // Helper to format minutes to "Xh Ym"
    formatDuration(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m}m`;
    }

    getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    async getUserMonthlyStats(userId) {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const logs = await this.getAttendanceInRange(start, end, `monthly:${userId}`);
        const userLogs = logs.filter(l => l.userId === userId || l.user_id === userId);
        return this.calculateStatsForLogs(userLogs);
    }

    async getSystemMonthlySummary() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const [allUsers, allLogs] = await Promise.all([
            this.getUsersCached(),
            this.getAttendanceInRange(startOfMonth, endOfMonth, 'sysMonthly')
        ]);

        const summary = await Promise.all(allUsers.map(async (user) => {
            const userLogs = allLogs.filter(l => (l.userId === user.id || l.user_id === user.id) &&
                (new Date(l.date) >= startOfMonth && new Date(l.date) <= endOfMonth));

            const stats = this.calculateStatsForLogs(userLogs);
            return {
                user,
                stats
            };
        }));

        return summary;
    }

    calculateStatsForLogs(userLogs) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);

        const breakdown = {
            'Present': 0, 'Late': 0, 'Early Departure': 0, 'Work - Home': 0, 'Training': 0,
            'Sick Leave': 0, 'Casual Leave': 0, 'Earned Leave': 0,
            'Paid Leave': 0, 'Maternity Leave': 0, 'Absent': 0,
            'Holiday': 0, 'National Holiday': 0, 'Regional Holidays': 0
        };

        const stats = {
            present: 0,
            late: 0,
            leaves: 0,
            unpaidLeaves: 0,
            penalty: 0,
            penaltyOffset: 0,
            effectivePenalty: 0,
            extraWorkedHours: 0,
            earlyDepartures: 0,
            label: startOfMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
            breakdown: breakdown,
            totalLateDuration: '0h 0m',
            totalExtraDuration: '0h 0m'
        };

        let totalLateMinutes = 0;
        let totalExtraMinutes = 0;

        const canonicalLogs = this.pickBestAttendanceLogPerDay(userLogs, startOfMonth, endOfMonth);
        canonicalLogs.forEach(log => {
                if (!this.isAttendanceEligibleLog(log)) return;
                let type = log.type || '';
                const inMinutes = this.parseTimeToMinutes(log.checkIn);
                const outMinutes = this.parseTimeToMinutes(log.checkOut);

                // Manual Override logic
                const isManual = log.isManualOverride === true;

                if (!isManual) {
                    // EARLY ARRIVAL check retained for compatibility with legacy data shape.
                    const lateCutoff = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_CUTOFF_MINUTES : 555) || 555;

                    // LATE Check: prefer stored policy decision, fallback to old logs
                    const isLateCountable = log.lateCountable === true || (!Object.prototype.hasOwnProperty.call(log, 'lateCountable') && inMinutes !== null && inMinutes > lateCutoff);
                    if (isLateCountable) {
                        breakdown['Late']++;
                        stats.late++;
                        if (inMinutes !== null) totalLateMinutes += Math.max(0, (inMinutes - lateCutoff));
                    }

                    // EARLY DEPARTURE Check
                    const earlyDeparture = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.EARLY_DEPARTURE_MINUTES : 1020) || 1020;
                    if (outMinutes !== null && outMinutes < earlyDeparture && !String(type).includes('Leave') && type !== 'Absent') {
                        stats.earlyDepartures++;
                        breakdown['Early Departure']++;
                    }
                } else {
                    // For manual logs, still track duration if needed, but skip penalties
                    // Manual logs explicitly set their type (Present, Late, etc.)
                    if (type === 'Late') {
                        stats.late++;
                        breakdown['Late']++;
                        // We don't have a reliable late duration for manual logs unless we calculate it
                        const manualLateCutoff = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_CUTOFF_MINUTES : 555) || 555;
                        if (inMinutes !== null && inMinutes > manualLateCutoff) {
                            totalLateMinutes += (inMinutes - manualLateCutoff);
                        }
                    } else if (type === 'Early Departure') {
                        stats.earlyDepartures++;
                        breakdown['Early Departure']++;
                    }
                }

                // EXTRA HOURS Check (for duration display)
                const lateCutoff = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_CUTOFF_MINUTES : 555) || 555;
                const earlyDeparture = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.EARLY_DEPARTURE_MINUTES : 1020) || 1020;

                const storedExtraMinutes = typeof log.extraWorkedMs === 'number'
                    ? Math.max(0, Math.round(log.extraWorkedMs / (1000 * 60)))
                    : 0;
                if (storedExtraMinutes > 0) {
                    totalExtraMinutes += storedExtraMinutes;
                } else {
                    const allowExtra = !(log.autoCheckout && !log.autoCheckoutExtraApproved);
                    if (allowExtra) {
                        if (inMinutes !== null && inMinutes < lateCutoff) totalExtraMinutes += (lateCutoff - inMinutes);
                        if (outMinutes !== null && outMinutes > earlyDeparture) totalExtraMinutes += (outMinutes - earlyDeparture);
                    }
                }

                // CATEGORY Check
                if (type === 'Work - Home') breakdown['Work - Home']++;
                else if (type === 'Training') breakdown['Training']++;
                else if (type === 'Sick Leave') { breakdown['Sick Leave']++; stats.unpaidLeaves++; }
                else if (type === 'Casual Leave') breakdown['Casual Leave']++;
                else if (type === 'Earned Leave') breakdown['Earned Leave']++;
                else if (type === 'Paid Leave') breakdown['Paid Leave']++;
                else if (type === 'Maternity Leave') breakdown['Maternity Leave']++;
                else if (type === 'Absent') { breakdown['Absent']++; stats.unpaidLeaves++; }
                else if (type === 'National Holiday') breakdown['National Holiday']++;
                else if (type === 'Regional Holidays') breakdown['Regional Holidays']++;
                else if (String(type).includes('Holiday')) breakdown['Holiday']++;
                else if (log.checkIn) {
                    breakdown['Present']++;
                }
        });

        stats.present = breakdown['Present'] + breakdown['Work - Home'] + breakdown['Training'];
        stats.leaves = breakdown['Sick Leave'] + breakdown['Casual Leave'] + breakdown['Earned Leave'] + breakdown['Paid Leave'] + breakdown['Maternity Leave'] + breakdown['Absent'];

        // Penalty inherited from Daily Check (> 15 mins late = 0.5)
        // Penalty Rule 1: > 3 Lates (within grace) = 0.5 Leave penalty? 
        // The request doesn't explicitly state the 3-late rule anymore, 
        // but I'll keep it for lates that WERE within grace but still marked.
        // Actually, let's simplify to match the request exactly.

        stats.extraWorkedHours = Number((totalExtraMinutes / 60).toFixed(2));
        stats.penalty = Math.floor((stats.late || 0) / ((typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_GRACE_COUNT : 3) || 3)) * ((typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_DEDUCTION_PER_BLOCK : 0.5) || 0.5);
        const offsetStepHours = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET : 4) || 4;
        const penaltyStepDays = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_DEDUCTION_PER_BLOCK : 0.5) || 0.5;
        stats.penaltyOffset = Math.floor((stats.extraWorkedHours || 0) / offsetStepHours) * penaltyStepDays;
        stats.effectivePenalty = Math.max(0, stats.penalty - stats.penaltyOffset);
        stats.totalLateDuration = this.formatDuration(totalLateMinutes);
        stats.totalExtraDuration = this.formatDuration(totalExtraMinutes);

        return stats;
    }

    async getUserYearlyStats(userId) {
        const { start, end, label } = this.getFinancialYearDates();
        const logs = await this.getAttendanceInRange(start, end, `yearly:${userId}`);
        const userLogs = logs.filter(l => l.userId === userId || l.user_id === userId);

        const breakdown = {
            'Present': 0, 'Late': 0, 'Early Departure': 0, 'Work - Home': 0, 'Training': 0,
            'Sick Leave': 0, 'Casual Leave': 0, 'Earned Leave': 0,
            'Paid Leave': 0, 'Maternity Leave': 0, 'Absent': 0,
            'Holiday': 0, 'National Holiday': 0, 'Regional Holidays': 0
        };

        const stats = {
            present: 0,
            late: 0,
            leaves: 0,
            earlyDepartures: 0,
            penaltyLeaves: 0,
            penaltyOffset: 0,
            effectivePenalty: 0,
            extraWorkedHours: 0,
            label: label,
            breakdown: breakdown,
            totalLateDuration: '0h 0m',
            totalExtraDuration: '0h 0m'
        };

        let totalLateMinutes = 0;
        let totalExtraMinutes = 0;

        const canonicalLogs = this.pickBestAttendanceLogPerDay(userLogs, start, end);
        canonicalLogs.forEach(log => {
                if (!this.isAttendanceEligibleLog(log)) return;
                let type = log.type || '';
                const inMinutes = this.parseTimeToMinutes(log.checkIn);
                const outMinutes = this.parseTimeToMinutes(log.checkOut);

                const lateCutoff = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_CUTOFF_MINUTES : 555) || 555;
                const earlyDeparture = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.EARLY_DEPARTURE_MINUTES : 1020) || 1020;
                const isManual = log.isManualOverride === true;

                if (!isManual) {
                    // LATE Check
                    const isLateCountable = log.lateCountable === true || (!Object.prototype.hasOwnProperty.call(log, 'lateCountable') && inMinutes !== null && inMinutes > lateCutoff);
                    if (isLateCountable) {
                        breakdown['Late']++;
                        if (inMinutes !== null) totalLateMinutes += Math.max(0, (inMinutes - lateCutoff));
                    }

                    // EARLY DEPARTURE Check
                    if (outMinutes !== null && outMinutes < earlyDeparture && !String(type).includes('Leave') && type !== 'Absent') {
                        stats.earlyDepartures++;
                        breakdown['Early Departure']++;
                    }
                } else {
                    if (type === 'Late') {
                        breakdown['Late']++;
                        if (inMinutes !== null && inMinutes > lateCutoff) {
                            totalLateMinutes += (inMinutes - lateCutoff);
                        }
                    } else if (type === 'Early Departure') {
                        stats.earlyDepartures++;
                        breakdown['Early Departure']++;
                    }
                }

                // EXTRA HOURS Check
                const storedExtraMinutes = typeof log.extraWorkedMs === 'number'
                    ? Math.max(0, Math.round(log.extraWorkedMs / (1000 * 60)))
                    : 0;
                if (storedExtraMinutes > 0) {
                    totalExtraMinutes += storedExtraMinutes;
                } else {
                    const allowExtra = !(log.autoCheckout && !log.autoCheckoutExtraApproved);
                    if (allowExtra) {
                        if (inMinutes !== null && inMinutes < lateCutoff) totalExtraMinutes += (lateCutoff - inMinutes);
                        if (outMinutes !== null && outMinutes > earlyDeparture) totalExtraMinutes += (outMinutes - earlyDeparture);
                    }
                }

                // CATEGORY Check
                if (type === 'Work - Home') breakdown['Work - Home']++;
                else if (type === 'Training') breakdown['Training']++;
                else if (type === 'Sick Leave') breakdown['Sick Leave']++;
                else if (type === 'Casual Leave') breakdown['Casual Leave']++;
                else if (type === 'Earned Leave') breakdown['Earned Leave']++;
                else if (type === 'Paid Leave') breakdown['Paid Leave']++;
                else if (type === 'Maternity Leave') breakdown['Maternity Leave']++;
                else if (type === 'Absent') breakdown['Absent']++;
                else if (type === 'National Holiday') breakdown['National Holiday']++;
                else if (type === 'Regional Holidays') breakdown['Regional Holidays']++;
                else if (String(type).includes('Holiday')) breakdown['Holiday']++;
                else if (log.checkIn) {
                    breakdown['Present']++;
                }
        });

        stats.present = breakdown['Present'] + breakdown['Work - Home'] + breakdown['Training'];
        stats.leaves = breakdown['Sick Leave'] + breakdown['Casual Leave'] + breakdown['Earned Leave'] + breakdown['Paid Leave'] + breakdown['Maternity Leave'] + breakdown['Absent'];
        stats.late = breakdown['Late'];
        stats.extraWorkedHours = Number((totalExtraMinutes / 60).toFixed(2));
        stats.totalLateDuration = this.formatDuration(totalLateMinutes);
        stats.totalExtraDuration = this.formatDuration(totalExtraMinutes);

        stats.penaltyLeaves = Math.floor((breakdown['Late'] || 0) / ((typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_GRACE_COUNT : 3) || 3)) * ((typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_DEDUCTION_PER_BLOCK : 0.5) || 0.5);
        const offsetStepHours = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET : 4) || 4;
        const penaltyStepDays = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_DEDUCTION_PER_BLOCK : 0.5) || 0.5;
        stats.penaltyOffset = Math.floor((stats.extraWorkedHours || 0) / offsetStepHours) * penaltyStepDays;
        stats.effectivePenalty = Math.max(0, stats.penaltyLeaves - stats.penaltyOffset);

        return stats;
    }

    getFinancialYearDates() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11
        const startMonth = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.FY_START_MONTH : 3) || 3; // Default April

        let startYear = year;
        if (month < startMonth) {
            startYear = year - 1;
        }

        const start = new Date(startYear, startMonth, 1);
        // End is 1 day before start month of next year
        const end = new Date(startYear + 1, startMonth, 0);

        return {
            start,
            end,
            label: `FY ${startYear}-${startYear + 1}`
        };
    }

    getDayType(dateStr) {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        const day = date.getDay();
        if (day === 0) return 'Holiday'; // Sunday

        if (day === 6) { // Saturday Rules
            if (typeof AppConfig !== 'undefined' && AppConfig && AppConfig.IS_SATURDAY_OFF && AppConfig.IS_SATURDAY_OFF(date)) {
                return 'Holiday';
            }
            return 'Work Day';
        }

        return 'Work Day';
    }

    getHeroPolicy() {
        return AppConfig?.HERO_POLICY || {};
    }

    parseHeroLogDate(raw) {
        if (!raw) return null;
        if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
        if (typeof raw !== 'string') return null;
        const s = raw.trim();
        if (!s) return null;

        const direct = new Date(s);
        if (!Number.isNaN(direct.getTime())) return direct;

        // Compatibility for legacy/localized strings such as DD/MM/YYYY or MM/DD/YYYY.
        const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
        if (!m) return null;
        const a = Number(m[1]);
        const b = Number(m[2]);
        let y = Number(m[3]);
        if (y < 100) y += 2000;
        if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(y)) return null;

        const mm = a > 12 ? b : a;
        const dd = a > 12 ? a : b;
        const dt = new Date(y, mm - 1, dd);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }

    resolveHeroUserId(log) {
        const raw = log?.user_id ?? log?.userId ?? log?.uid ?? log?.user ?? '';
        const uid = String(raw || '').trim();
        return uid || null;
    }

    resolveHeroDurationMs(log) {
        let durationMs = Number(log?.durationMs);
        if (!Number.isFinite(durationMs)) durationMs = 0;
        if (durationMs > 0) return durationMs;
        if (log?.checkIn && log?.checkOut && log.checkOut !== 'Active Now') {
            const inMins = this.parseTimeToMinutes(log.checkIn);
            const outMins = this.parseTimeToMinutes(log.checkOut);
            if (inMins !== null && outMins !== null) {
                durationMs = (outMins - inMins) * 60 * 1000;
            }
        }
        return Math.max(0, Number(durationMs) || 0);
    }

    normalizeHeroLogs(logs = []) {
        return (logs || [])
            .map((log) => {
                const logDate = this.parseHeroLogDate(log?.date);
                const userId = this.resolveHeroUserId(log);
                if (!logDate || !userId) return null;
                const durationMs = this.resolveHeroDurationMs(log);
                const activityScore = Number(log?.activityScore);
                return {
                    userId,
                    logDate,
                    dateKey: logDate.toISOString().split('T')[0],
                    durationMs,
                    activityLogDepth: String(log?.workDescription || '').length,
                    activityScore: Number.isFinite(activityScore) ? activityScore : null
                };
            })
            .filter(Boolean);
    }

    buildHeroCandidateStats(normalizedLogs = []) {
        const byUser = new Map();
        normalizedLogs.forEach((log) => {
            if (!byUser.has(log.userId)) {
                byUser.set(log.userId, {
                    userId: log.userId,
                    totalDurationMs: 0,
                    daysSet: new Set(),
                    activityLogDepth: 0,
                    activityScoreTotal: 0,
                    activityScoreCount: 0
                });
            }
            const bucket = byUser.get(log.userId);
            bucket.totalDurationMs += Math.max(0, Number(log.durationMs) || 0);
            bucket.daysSet.add(log.dateKey);
            bucket.activityLogDepth += Math.max(0, Number(log.activityLogDepth) || 0);
            if (Number.isFinite(log.activityScore)) {
                bucket.activityScoreTotal += log.activityScore;
                bucket.activityScoreCount += 1;
            }
        });
        return Array.from(byUser.values());
    }

    classifyHeroTaskStatus(rawStatus, planDate = null) {
        const normalized = String(rawStatus || '').toLowerCase().trim();
        const smartStatus = window.AppCalendar?.getSmartTaskStatus
            ? String(window.AppCalendar.getSmartTaskStatus(planDate, normalized) || normalized)
            : normalized;
        if (smartStatus === 'completed') return 'completed';
        if (smartStatus === 'in-process' || smartStatus === 'in progress' || smartStatus === 'to-be-started' || smartStatus === 'pending' || smartStatus === '') return 'in_progress';
        if (smartStatus === 'not-completed' || smartStatus === 'overdue' || smartStatus === 'postponed' || smartStatus === 'missed') return 'missed';
        return 'in_progress';
    }

    normalizeHeroTasks(workPlans = []) {
        const rows = [];
        (workPlans || []).forEach((wp) => {
            const userId = String(wp?.userId || wp?.user_id || '').trim();
            if (!userId || !Array.isArray(wp?.plans)) return;
            wp.plans.forEach((task) => {
                if (!task || !String(task.task || '').trim()) return;
                const status = this.classifyHeroTaskStatus(task.status, wp.date);
                rows.push({ userId, status, date: wp.date });
            });
        });
        return rows;
    }

    buildHeroTaskStats(taskRows = []) {
        const byUser = new Map();
        taskRows.forEach((row) => {
            if (!byUser.has(row.userId)) {
                byUser.set(row.userId, { planned: 0, completed: 0, inProgress: 0, missed: 0 });
            }
            const bucket = byUser.get(row.userId);
            bucket.planned += 1;
            if (row.status === 'completed') bucket.completed += 1;
            else if (row.status === 'missed') bucket.missed += 1;
            else bucket.inProgress += 1;
        });
        return byUser;
    }

    rankHeroCandidates(attendanceStats = [], taskStats = new Map(), policy = {}) {
        const weights = policy.WEIGHTS || {};
        const caps = policy.CAPS || {};
        const windowDays = Math.max(1, Number(policy.WINDOW_DAYS || 7));
        const hourCap = Math.max(1, Number(caps.hours || 40));
        const attendanceModifier = policy.ATTENDANCE_MODIFIER || {};

        const wTaskExecution = Number(weights.taskExecution ?? 0.45);
        const wTaskCompletionRate = Number(weights.taskCompletionRate ?? 0.2);
        const wTaskInProgressSupport = Number(weights.taskInProgressSupport ?? 0.1);
        const wTaskMissPenalty = Number(weights.taskMissPenalty ?? 0.1);

        const modifierBase = Number(attendanceModifier.base ?? 0.9);
        const modifierMaxBonus = Number(attendanceModifier.maxBonus ?? 0.15);
        const modifierConsistencyImpact = Number(attendanceModifier.consistencyImpact ?? 0.65);
        const modifierEffortImpact = Number(attendanceModifier.effortImpact ?? 0.35);

        const attendanceMap = new Map(attendanceStats.map((row) => [String(row.userId), row]));
        const allUserIds = new Set([...attendanceMap.keys(), ...taskStats.keys()]);

        return Array.from(allUserIds).map((userId) => {
            const attendance = attendanceMap.get(String(userId)) || {
                userId,
                totalDurationMs: 0,
                daysSet: new Set(),
                activityLogDepth: 0
            };
            const tasks = taskStats.get(String(userId)) || { planned: 0, completed: 0, inProgress: 0, missed: 0 };

            const days = attendance.daysSet.size;
            const hoursValue = attendance.totalDurationMs / (1000 * 60 * 60);
            const planned = Math.max(0, Number(tasks.planned) || 0);
            const completed = Math.max(0, Number(tasks.completed) || 0);
            const inProgress = Math.max(0, Number(tasks.inProgress) || 0);
            const missed = Math.max(0, Number(tasks.missed) || 0);
            const completionRate = planned > 0 ? (completed / planned) * 100 : 0;

            const taskExecutionScore = planned > 0
                ? Math.max(0, Math.min(100, ((completed + (inProgress * 0.5) - missed) / planned) * 100))
                : 0;
            const inProgressScore = planned > 0 ? Math.max(0, Math.min(100, (inProgress / planned) * 100)) : 0;
            const missPenaltyScore = planned > 0 ? Math.max(0, Math.min(100, (missed / planned) * 100)) : 0;
            const consistencyScore = (days / windowDays) * 100;
            const effortScore = Math.min((hoursValue / hourCap) * 100, 100);

            const taskScore = (taskExecutionScore * wTaskExecution)
                + (completionRate * wTaskCompletionRate)
                + (inProgressScore * wTaskInProgressSupport)
                - (missPenaltyScore * wTaskMissPenalty);
            const attendanceReliability = ((consistencyScore / 100) * modifierConsistencyImpact)
                + ((effortScore / 100) * modifierEffortImpact);
            const attendanceBoost = Math.max(0, Math.min(modifierMaxBonus, attendanceReliability * modifierMaxBonus));
            const attendanceFactor = Math.max(0.5, modifierBase + attendanceBoost);
            const finalScore = taskScore * attendanceFactor;

            return {
                userId,
                days,
                hours: Number(hoursValue.toFixed(1)),
                totalDurationMs: Math.max(0, Number(attendance.totalDurationMs) || 0),
                activityLogDepth: attendance.activityLogDepth,
                taskPlanned: planned,
                taskCompleted: completed,
                taskInProgress: inProgress,
                taskMissed: missed,
                completionRate: Number(completionRate.toFixed(1)),
                taskScore: Number(Math.max(0, taskScore).toFixed(2)),
                attendanceFactor: Number(attendanceFactor.toFixed(3)),
                finalScore: Number(Math.max(0, finalScore).toFixed(2))
            };
        }).sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            if (b.taskCompleted !== a.taskCompleted) return b.taskCompleted - a.taskCompleted;
            if (a.taskMissed !== b.taskMissed) return a.taskMissed - b.taskMissed;
            if (b.days !== a.days) return b.days - a.days;
            if (b.totalDurationMs !== a.totalDurationMs) return b.totalDurationMs - a.totalDurationMs;
            return String(a.userId).localeCompare(String(b.userId));
        });
    }

    createNoHeroPayload({ reason = 'No eligible attendance data found.', period = 'weekly', source = 'direct_cache' } = {}) {
        return {
            state: 'no_eligible_data',
            user: null,
            stats: null,
            reason,
            period,
            source,
            confidence: 0,
            schemaVersion: Number(this.getHeroPolicy()?.SCHEMA_VERSION || 1)
        };
    }

    scoreHeroFromLogs(logs = [], users = [], options = {}) {
        const period = String(options.period || 'weekly');
        const source = String(options.source || 'direct_cache');
        const policy = this.getHeroPolicy();
        const minEvidence = policy.MIN_EVIDENCE || {};
        const minDays = Math.max(1, Number(minEvidence.minDays || 1));
        const minDurationMs = Math.max(0, Number(minEvidence.minDurationMs || 1));
        const minPlannedTasks = Math.max(0, Number(minEvidence.minPlannedTasks || 1));

        const normalized = this.normalizeHeroLogs(logs);
        const workPlans = Array.isArray(options.workPlans) ? options.workPlans : [];
        const normalizedTasks = this.normalizeHeroTasks(workPlans);
        if (normalized.length === 0 && normalizedTasks.length === 0) {
            return this.createNoHeroPayload({ period, source });
        }

        const ranked = this.rankHeroCandidates(
            this.buildHeroCandidateStats(normalized),
            this.buildHeroTaskStats(normalizedTasks),
            policy
        );
        const eligible = ranked.filter((row) =>
            row.taskPlanned >= minPlannedTasks &&
            (row.days >= minDays || row.totalDurationMs >= minDurationMs)
        );
        if (eligible.length === 0) {
            return this.createNoHeroPayload({ reason: 'No staff met the minimum hero criteria this period.', period, source });
        }

        const winnerStats = eligible[0];
        const winner = (users || []).find(u => String(u.id) === String(winnerStats.userId));
        if (!winner) {
            return this.createNoHeroPayload({ reason: 'No valid user mapping found for hero candidates.', period, source });
        }

        const confidenceTasks = winnerStats.taskPlanned > 0
            ? Math.min(1, winnerStats.taskCompleted / winnerStats.taskPlanned)
            : 0;
        const confidenceDays = Math.min(1, winnerStats.days / Math.max(1, Number(policy.WINDOW_DAYS || 7)));
        const confidenceHours = Math.min(1, winnerStats.totalDurationMs / (1000 * 60 * 60 * Math.max(1, Number(policy?.CAPS?.hours || 40))));
        const confidence = Number(((confidenceTasks + confidenceDays + confidenceHours) / 3).toFixed(2));

        return {
            state: 'winner',
            user: winner,
            stats: winnerStats,
            reason: this.determineHeroReason(winnerStats),
            period,
            source,
            confidence,
            schemaVersion: Number(policy.SCHEMA_VERSION || 1)
        };
    }

    async getHeroOfTheWeek(options = {}) {
        try {
            const policy = this.getHeroPolicy();
            const windowDays = Math.max(1, Number(policy.WINDOW_DAYS || 7));
            const fallbackDays = Math.max(windowDays, Number(policy.FALLBACK_LOOKBACK_DAYS || 90));
            const now = new Date();
            const start = new Date(now);
            start.setDate(start.getDate() - windowDays);
            start.setHours(0, 0, 0, 0);

            const [logs, workPlans, users] = await Promise.all([
                this.getAttendanceInRange(start, now, 'hero'),
                this.db.queryMany
                    ? this.db.queryMany('work_plans', [
                        { field: 'date', operator: '>=', value: start.toISOString().split('T')[0] },
                        { field: 'date', operator: '<=', value: now.toISOString().split('T')[0] }
                    ])
                    : this.db.getAll('work_plans'),
                this.getUsersCached()
            ]);

            const weeklyHero = this.scoreHeroFromLogs(logs, users, {
                period: 'weekly',
                source: String(options.source || 'direct_cache'),
                workPlans
            });
            if (weeklyHero.state === 'winner') return weeklyHero;

            const fallbackStart = new Date(now);
            fallbackStart.setDate(fallbackStart.getDate() - fallbackDays);
            fallbackStart.setHours(0, 0, 0, 0);
            const [widerLogs, widerWorkPlans] = await Promise.all([
                this.getAttendanceInRange(fallbackStart, now, 'hero_fallback_lookback'),
                this.db.queryMany
                    ? this.db.queryMany('work_plans', [
                        { field: 'date', operator: '>=', value: fallbackStart.toISOString().split('T')[0] },
                        { field: 'date', operator: '<=', value: now.toISOString().split('T')[0] }
                    ])
                    : this.db.getAll('work_plans')
            ]);
            const normalizedWiderLogs = this.normalizeHeroLogs(widerLogs);
            const normalizedWiderTasks = this.normalizeHeroTasks(widerWorkPlans);
            if (normalizedWiderLogs.length === 0 && normalizedWiderTasks.length === 0) {
                return this.createNoHeroPayload({
                    reason: weeklyHero.reason,
                    period: 'latest_active_window',
                    source: String(options.source || 'direct_cache')
                });
            }

            const latestFromAttendance = normalizedWiderLogs.length > 0
                ? normalizedWiderLogs.reduce((max, row) => (row.logDate > max ? row.logDate : max), normalizedWiderLogs[0].logDate)
                : null;
            const latestFromTasks = normalizedWiderTasks.length > 0
                ? normalizedWiderTasks.reduce((max, row) => {
                    const dt = this.parseHeroLogDate(row?.date);
                    return (dt && (!max || dt > max)) ? dt : max;
                }, null)
                : null;
            const latestLogDate = latestFromAttendance || latestFromTasks || now;
            const windowStart = new Date(latestLogDate);
            windowStart.setDate(windowStart.getDate() - (windowDays - 1));
            windowStart.setHours(0, 0, 0, 0);
            const slicedRawLogs = (widerLogs || []).filter((log) => {
                const dt = this.parseHeroLogDate(log?.date);
                return !!dt && dt >= windowStart && dt <= latestLogDate;
            });
            const slicedWorkPlans = (widerWorkPlans || []).filter((plan) => {
                const dt = this.parseHeroLogDate(plan?.date);
                return !!dt && dt >= windowStart && dt <= latestLogDate;
            });
            return this.scoreHeroFromLogs(slicedRawLogs, users, {
                period: 'latest_active_window',
                source: String(options.source || 'direct_cache'),
                workPlans: slicedWorkPlans
            });
        } catch (err) {
            console.error('Hero Calculation Error:', err);
            return {
                state: 'fetch_error',
                user: null,
                stats: null,
                reason: 'Unable to calculate hero right now.',
                period: 'weekly',
                source: String(options.source || 'direct_cache'),
                confidence: 0,
                schemaVersion: Number(this.getHeroPolicy()?.SCHEMA_VERSION || 1)
            };
        }
    }

    determineHeroReason(stats) {
        const planned = Number(stats?.taskPlanned || 0);
        const completed = Number(stats?.taskCompleted || 0);
        const inProgress = Number(stats?.taskInProgress || 0);
        const missed = Number(stats?.taskMissed || 0);
        const completionRate = planned > 0 ? (completed / planned) * 100 : 0;
        const attendanceFactor = Number(stats?.attendanceFactor || 1);
        if (planned >= 6 && completionRate >= 80) return "Execution Champion";
        if (completed >= 4 && inProgress >= 2) return "Delivery Momentum";
        if (completionRate >= 70 && attendanceFactor >= 1) return "Reliable Executor";
        if (planned > 0 && missed === 0 && completionRate >= 60) return "Reliable Finisher";
        return "Top Performer";
    }

    async getSystemPerformance() {
        try {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            const logs = await this.getAttendanceInRange(start, new Date(), 'performance');
            const trendData = [];
            const labels = [];
            let totalScore = 0;
            let scoreCount = 0;

            const isSameDay = (d1, d2) => {
                return d1.getFullYear() === d2.getFullYear() &&
                    d1.getMonth() === d2.getMonth() &&
                    d1.getDate() === d2.getDate();
            };

            for (let i = 6; i >= 0; i--) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() - i);

                const label = targetDate.toLocaleDateString('en-US', { weekday: 'narrow' });
                labels.push(label);
                const dayLogs = logs.filter(l => {
                    const logDate = new Date(l.date);
                    return !isNaN(logDate.getTime()) && isSameDay(logDate, targetDate);
                });

                if (dayLogs.length === 0) {
                    trendData.push(0);
                } else {
                    const dayScores = dayLogs.map(l => l.activityScore || 0).filter(s => s > 0);
                    const dayAvg = dayScores.length > 0 ? dayScores.reduce((a, b) => a + b, 0) / dayScores.length : 0;
                    trendData.push(Math.round(dayAvg));

                    if (dayAvg > 0) {
                        totalScore += dayAvg;
                        scoreCount++;
                    }
                }
            }

            const finalAvg = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

            return {
                avgScore: finalAvg,
                trendData: trendData,
                labels: labels
            };
        } catch (err) {
            console.error("System Performance Calculation Error:", err);
            return { avgScore: 0, trendData: [0, 0, 0, 0, 0, 0, 0] };
        }
    }

    async buildDailyDashboardSummary(options = {}) {
        const now = new Date();
        const dateKey = String(options.dateKey || now.toISOString().split('T')[0]);
        const monthKey = String(options.selectedMonth || now.toISOString().slice(0, 7));
        const [yearStr, monthStr] = monthKey.split('-');
        const year = Number(yearStr);
        const monthIndex = Number(monthStr) - 1;
        const monthStart = (Number.isInteger(year) && Number.isInteger(monthIndex) && monthIndex >= 0 && monthIndex <= 11)
            ? new Date(year, monthIndex, 1)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = (Number.isInteger(year) && Number.isInteger(monthIndex) && monthIndex >= 0 && monthIndex <= 11)
            ? new Date(year, monthIndex + 1, 0)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const activityLimit = Math.max(1, Number(AppConfig?.SUMMARY_POLICY?.TEAM_ACTIVITY_LIMIT) || 15);

        const [hero, teamActivities] = await Promise.all([
            this.getHeroOfTheWeek({ source: 'shared_summary' }),
            this.getAllStaffActivities({ mode: 'month', month: monthKey, scope: 'work' })
        ]);

        return {
            dateKey,
            monthKey,
            version: Number(AppConfig?.SUMMARY_POLICY?.SCHEMA_VERSION || 1),
            generatedAt: Date.now(),
            hero: (hero && hero.state !== 'fetch_error') ? hero : null,
            teamActivityPreview: (teamActivities || []).slice(0, activityLimit),
            range: {
                startIso: monthStart.toISOString().split('T')[0],
                endIso: monthEnd.toISOString().split('T')[0]
            },
            meta: {
                generatedAt: Date.now(),
                source: 'client_first_writer'
            }
        };
    }

    async getAllStaffActivities(options = {}) {
        try {
            const normalized = options || {};
            const mode = normalized.mode || 'month';
            const scope = normalized.scope || 'all';

            const endDate = new Date();
            const startDate = new Date();

            if (mode === 'range') {
                const startIsoRaw = String(normalized.startIso || '');
                const endIsoRaw = String(normalized.endIso || '');
                if (!startIsoRaw || !endIsoRaw) {
                    throw new Error('Range mode requires startIso and endIso.');
                }
                const rangeStart = new Date(startIsoRaw);
                const rangeEnd = new Date(endIsoRaw);
                if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
                    throw new Error(`Invalid range dates: ${startIsoRaw} to ${endIsoRaw}`);
                }
                startDate.setTime(rangeStart.getTime());
                endDate.setTime(rangeEnd.getTime());
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (mode === 'days') {
                const daysBack = Number.isFinite(Number(normalized.daysBack))
                    ? Number(normalized.daysBack)
                    : 7;
                endDate.setHours(23, 59, 59, 999);
                startDate.setDate(startDate.getDate() - daysBack);
                startDate.setHours(0, 0, 0, 0);
            } else {
                const monthKey = String(normalized.month || new Date().toISOString().slice(0, 7));
                const [yearStr, monthStr] = monthKey.split('-');
                const year = Number(yearStr);
                const monthIndex = Number(monthStr) - 1;
                if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
                    throw new Error(`Invalid month key: ${monthKey}`);
                }
                const monthStart = new Date(year, monthIndex, 1);
                const monthEnd = new Date(year, monthIndex + 1, 0);
                startDate.setTime(monthStart.getTime());
                endDate.setTime(monthEnd.getTime());
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            }

            const startIso = startDate.toISOString().split('T')[0];
            const endIso = endDate.toISOString().split('T')[0];

            if (window.AppCalendar?.ensureCarryForwardForRange) {
                await window.AppCalendar.ensureCarryForwardForRange(startIso, endIso);
            }
            if (window.AppCalendar?.cleanupOldCarryForwardTaggedTasksForDate) {
                const todayKey = window.AppCalendar.getTodayKey ? window.AppCalendar.getTodayKey() : '';
                if (todayKey && todayKey >= startIso && todayKey <= endIso) {
                    const cleanupKey = `cleanup_old_tagged_global_v5_${todayKey}`;
                    let shouldRunCleanup = true;
                    try {
                        shouldRunCleanup = localStorage.getItem(cleanupKey) !== '1';
                    } catch {
                        shouldRunCleanup = true;
                    }
                    if (shouldRunCleanup) {
                        try {
                            const cleanupRes = await window.AppCalendar.cleanupOldCarryForwardTaggedTasksForDate(todayKey, { onlyToday: true });
                            if ((cleanupRes?.removed || 0) > 0) {
                                console.log(`Team activity global cleanup removed ${cleanupRes.removed} stale tagged task(s) for ${todayKey}.`);
                            }
                            try { localStorage.setItem(cleanupKey, '1'); } catch { /* ignore */ }
                        } catch (cleanupErr) {
                            console.warn('Global stale tagged cleanup failed:', cleanupErr);
                        }
                    }
                }
            }

            const shouldFetchAttendance = scope !== 'work';
            const [attendanceLogs, workPlans, users] = await Promise.all([
                shouldFetchAttendance
                    ? this.getAttendanceInRange(startDate, endDate, `staffAct:${startIso}:${endIso}:${scope}`)
                    : Promise.resolve([]),
                this.db.queryMany
                    ? this.db.queryMany('work_plans', [
                        { field: 'date', operator: '>=', value: startIso },
                        { field: 'date', operator: '<=', value: endIso }
                    ])
                    : AppDB.getAll('work_plans'),
                this.getUsersCached()
            ]);

            const usersMap = {};
            users.forEach(userData => {
                usersMap[userData.id] = userData.name;
            });

            const mergedActivities = [];
            const attendanceContentByDay = {}; // Map of "userId:date" -> [arrayOfWorkDescriptions]
            const isTaggedCopyOriginTask = (task = {}) => {
                if (window.AppCalendar?.isTaggedCopyOriginTask) {
                    return window.AppCalendar.isTaggedCopyOriginTask(task);
                }
                const addedFrom = String(task.addedFrom || '').toLowerCase().trim();
                const fromTaggedSource = addedFrom === 'tag' || addedFrom === 'delegated' || addedFrom === 'staff';
                const hasSourceReference = !!task.sourcePlanId
                    || Number.isInteger(task.sourceTaskIndex)
                    || Number.isFinite(Number(task.sourceTaskIndex));
                return fromTaggedSource || hasSourceReference;
            };
            const hasCarryForwardLineage = (task = {}) => {
                if (window.AppCalendar?.hasCarryForwardLineage) {
                    return window.AppCalendar.hasCarryForwardLineage(task);
                }
                return !!(
                    task.carryForwardRootId
                    || task.isAutoForwarded === true
                    || task.carriedForwardFromDate
                    || task.carriedForwardFromPlanId
                );
            };
            const resolveOriginDate = (task = {}) => {
                if (window.AppCalendar?.resolveTaskOriginDate) {
                    return String(window.AppCalendar.resolveTaskOriginDate(task) || '');
                }
                const direct = String(task.carriedForwardFromDate || '').trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
                const src = String(task.sourcePlanId || '').match(/(\d{4}-\d{2}-\d{2})/);
                if (src) return src[1];
                const root = String(task.carryForwardRootId || '').match(/(\d{4}-\d{2}-\d{2})/);
                if (root) return root[1];
                return '';
            };
            const hasLegacyTaggedTextPattern = (task = {}) => {
                if (window.AppCalendar?.hasLegacyTaggedTextPattern) {
                    return !!window.AppCalendar.hasLegacyTaggedTextPattern(task);
                }
                const text = String(task.task || '');
                if (!text) return false;
                const repeatedResponsible = (text.match(/\(Responsible:/gi) || []).length > 1;
                return repeatedResponsible;
            };

            if (shouldFetchAttendance) {
                attendanceLogs.forEach(log => {
                    const logDate = new Date(log.date);
                    if (logDate >= startDate && logDate <= endDate && log.workDescription) {
                        const userKey = log.user_id || log.userId;
                        const dayKey = `${userKey}:${log.date}`;
                        if (!attendanceContentByDay[dayKey]) attendanceContentByDay[dayKey] = [];
                        attendanceContentByDay[dayKey].push(log.workDescription.toLowerCase().trim());

                        mergedActivities.push({
                            ...log,
                            type: 'attendance',
                            staffName: usersMap[userKey] || log.userName || 'Unknown Staff',
                            _displayDesc: log.workDescription,
                            _sortTime: log.checkOut || '00:00'
                        });
                    }
                });
            }

            // Process Work Plans
            workPlans.forEach(wp => {
                const wpDate = new Date(wp.date);
                if (wpDate >= startDate && wpDate <= endDate && wp.plans) {
                    const dayKey = `${wp.userId}:${wp.date}`;
                    const dayAttendanceContent = attendanceContentByDay[dayKey] || [];

                    wp.plans.forEach((plan, idx) => {
                        if (plan?.isRemoved === true) return;
                        const isOldCarryForwardTask = (() => {
                            const originDate = resolveOriginDate(plan);
                            if (originDate && originDate < String(wp.date || '')) return true;
                            if (hasCarryForwardLineage(plan) && !originDate) return true;
                            if (isTaggedCopyOriginTask(plan) && hasLegacyTaggedTextPattern(plan)) return true;
                            return false;
                        })();
                        if (isOldCarryForwardTask) return;
                        // Deduplication Logic:
                        // If this task text is found as a substring within any associated attendance log's description 
                        // (which often happens at checkout when tasks are auto-appended to summary), we skip it here.
                        const taskText = (plan.task || '').trim().toLowerCase();
                        if (taskText && dayAttendanceContent.length > 0) {
                            const isDuplicate = dayAttendanceContent.some(desc => desc.includes(taskText));
                            if (isDuplicate) return; // Skip this task as it's already covered by an attendance log
                        }

                        const wpUserId = wp.userId || wp.user_id;
                        let staffName = usersMap[wpUserId] || wp.userName;
                        if (!staffName) {
                            staffName = (wpUserId === 'annual_shared') ? 'All Staff' : 'Unknown Staff';
                        }

                        mergedActivities.push({
                            ...plan,
                            date: wp.date,
                            id: wp.id, // work_plan document id
                            planId: wp.id,
                            taskIndex: idx,
                            planScope: plan.planScope || wp.planScope || 'personal',
                            userId: wpUserId,
                            type: 'work',
                            staffName: staffName,
                            _displayDesc: plan.task,
                            _sortTime: '09:00' // Default sort time for plans
                        });
                    });
                }
            });

            // Sort by date descending, then by sort time descending
            mergedActivities.sort((a, b) => {
                const dateCompare = new Date(b.date) - new Date(a.date);
                if (dateCompare !== 0) return dateCompare;
                return b._sortTime.localeCompare(a._sortTime);
            });

            return mergedActivities;
        } catch (err) {
            console.error("Error fetching all staff activities:", err);
            return [];
        }
    }
}

export const AppAnalytics = new Analytics();
if (typeof window !== 'undefined') window.AppAnalytics = AppAnalytics;
