/**
 * Analytics Module
 * Handles visual data representation using Chart.js.
 */

(function () {

    class Analytics {
        constructor() {
            this.db = window.AppDB;
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
            return (window.AppConfig && window.AppConfig.READ_OPT_FLAGS) || {};
        }

        getTtls() {
            return (window.AppConfig && window.AppConfig.READ_CACHE_TTLS) || {};
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
                if (window.AppDB && window.AppDB.getCached) {
                    const cacheKey = window.AppDB.getCacheKey('analyticsUsers', 'users', { ttl });
                    return window.AppDB.getCached(cacheKey, ttl, () => this.db.getAll('users'));
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

            userLogs.forEach(log => {
                const logDate = new Date(log.date);
                if (!isNaN(logDate) && logDate >= startOfMonth && logDate <= endOfMonth) {
                    let type = log.type || '';
                    const inMinutes = this.parseTimeToMinutes(log.checkIn);
                    const outMinutes = this.parseTimeToMinutes(log.checkOut);

                    let dayLateMins = 0;
                    let dayEarlyCredit = 0;

                    // Manual Override logic
                    const isManual = log.isManualOverride === true;

                    if (!isManual) {
                        // EARLY ARRIVAL Credit
                        const lateCutoff = window.AppConfig.LATE_CUTOFF_MINUTES || 555;
                        if (inMinutes !== null && inMinutes < lateCutoff) {
                            dayEarlyCredit = lateCutoff - inMinutes;
                        }

                        // LATE Check: prefer stored policy decision, fallback to old logs
                        const isLateCountable = log.lateCountable === true || (!Object.prototype.hasOwnProperty.call(log, 'lateCountable') && inMinutes !== null && inMinutes > lateCutoff);
                        if (isLateCountable) {
                            breakdown['Late']++;
                            stats.late++;
                            if (inMinutes !== null) totalLateMinutes += Math.max(0, (inMinutes - lateCutoff));
                        }

                        // EARLY DEPARTURE Check
                        const earlyDeparture = window.AppConfig.EARLY_DEPARTURE_MINUTES || 1020;
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
                            if (inMinutes !== null && inMinutes > 540) {
                                totalLateMinutes += (inMinutes - 540);
                            }
                        } else if (type === 'Early Departure') {
                            stats.earlyDepartures++;
                            breakdown['Early Departure']++;
                        }
                    }

                    // EXTRA HOURS Check (for duration display)
                    const lateCutoff = window.AppConfig.LATE_CUTOFF_MINUTES || 555;
                    const earlyDeparture = window.AppConfig.EARLY_DEPARTURE_MINUTES || 1020;

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
            stats.penalty = Math.floor((stats.late || 0) / (window.AppConfig.LATE_GRACE_COUNT || 3)) * (window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5);
            const offsetStepHours = window.AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET || 4;
            const penaltyStepDays = window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5;
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

            userLogs.forEach(log => {
                const logDate = new Date(log.date);
                if (!isNaN(logDate) && logDate >= start && logDate <= end) {
                    let type = log.type || '';
                    const inMinutes = this.parseTimeToMinutes(log.checkIn);
                    const outMinutes = this.parseTimeToMinutes(log.checkOut);

                    // LATE Check
                    const lateCutoff = window.AppConfig.LATE_CUTOFF_MINUTES || 555;
                    const isLateCountable = log.lateCountable === true || (!Object.prototype.hasOwnProperty.call(log, 'lateCountable') && inMinutes !== null && inMinutes > lateCutoff);
                    if (isLateCountable) {
                        breakdown['Late']++;
                        if (inMinutes !== null) totalLateMinutes += Math.max(0, (inMinutes - lateCutoff));
                    }

                    // EARLY DEPARTURE Check
                    const earlyDeparture = window.AppConfig.EARLY_DEPARTURE_MINUTES || 1020;
                    if (outMinutes !== null && outMinutes < earlyDeparture && !String(type).includes('Leave') && type !== 'Absent') {
                        stats.earlyDepartures++;
                        breakdown['Early Departure']++;
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
                }
            });

            stats.present = breakdown['Present'] + breakdown['Work - Home'] + breakdown['Training'];
            stats.leaves = breakdown['Sick Leave'] + breakdown['Casual Leave'] + breakdown['Earned Leave'] + breakdown['Paid Leave'] + breakdown['Maternity Leave'] + breakdown['Absent'];
            stats.late = breakdown['Late'];
            stats.extraWorkedHours = Number((totalExtraMinutes / 60).toFixed(2));
            stats.totalLateDuration = this.formatDuration(totalLateMinutes);
            stats.totalExtraDuration = this.formatDuration(totalExtraMinutes);

            stats.penaltyLeaves = Math.floor((breakdown['Late'] || 0) / (window.AppConfig.LATE_GRACE_COUNT || 3)) * (window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5);
            const offsetStepHours = window.AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET || 4;
            const penaltyStepDays = window.AppConfig.LATE_DEDUCTION_PER_BLOCK || 0.5;
            stats.penaltyOffset = Math.floor((stats.extraWorkedHours || 0) / offsetStepHours) * penaltyStepDays;
            stats.effectivePenalty = Math.max(0, stats.penaltyLeaves - stats.penaltyOffset);

            return stats;
        }

        getFinancialYearDates() {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth(); // 0-11
            const startMonth = window.AppConfig.FY_START_MONTH || 3; // Default April

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
            const dateNum = date.getDate();

            if (day === 0) return 'Holiday'; // Sunday

            if (day === 6) { // Saturday Rules
                if (window.AppConfig.IS_SATURDAY_OFF && window.AppConfig.IS_SATURDAY_OFF(date)) {
                    return 'Holiday';
                }
                return 'Work Day';
            }

            return 'Work Day';
        }

        async getHeroOfTheWeek() {
            try {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                sevenDaysAgo.setHours(0, 0, 0, 0);
                const [logs, users] = await Promise.all([
                    this.getAttendanceInRange(sevenDaysAgo, new Date(), 'hero'),
                    this.getUsersCached()
                ]);

                const recentLogs = logs.filter(l => {
                    const logDate = new Date(l.date);
                    return !isNaN(logDate.getTime()) && logDate >= sevenDaysAgo;
                });

                if (recentLogs.length === 0) return null;

                const userStats = {};

                recentLogs.forEach(l => {
                    const uid = l.user_id || l.userId;
                    if (!uid) return;

                    if (!userStats[uid]) {
                        userStats[uid] = {
                            userId: uid,
                            totalDurationMs: 0,
                            daysCount: new Set(),
                            activityLogDepth: 0,
                            avgActivityScore: 0,
                            scoreCount: 0
                        };
                    }

                    const stats = userStats[uid];

                    // Fallback for logs without durationMs
                    let dMs = l.durationMs;
                    if (dMs === undefined && l.checkIn && l.checkOut && l.checkOut !== 'Active Now') {
                        const inMins = this.parseTimeToMinutes(l.checkIn);
                        const outMins = this.parseTimeToMinutes(l.checkOut);
                        if (inMins !== null && outMins !== null) {
                            dMs = (outMins - inMins) * 60 * 1000;
                        }
                        if (dMs < 0) dMs = 0;
                    }

                    stats.totalDurationMs += dMs || 0;
                    stats.daysCount.add(l.date);
                    stats.activityLogDepth += (l.workDescription || "").length;
                    if (l.activityScore !== undefined) {
                        stats.avgActivityScore += l.activityScore;
                        stats.scoreCount++;
                    }
                });

                // Calculate final scores
                const rankings = Object.values(userStats).map(stats => {
                    const days = stats.daysCount.size;
                    const hours = stats.totalDurationMs / (1000 * 60 * 60);
                    const avgScore = stats.scoreCount > 0 ? stats.avgActivityScore / stats.scoreCount : 70;

                    // Algorithm: 
                    // - 40% Weight for Consistency (Days present)
                    // - 30% Weight for Effort (Hours worked)
                    // - 20% Weight for Quality (Activity log depth)
                    // - 10% Weight for Engagement (Activity Score)

                    const consistencyScore = (days / 7) * 100;
                    const effortScore = Math.min((hours / 40) * 100, 100); // Caps at 40 hours
                    const qualityScore = Math.min((stats.activityLogDepth / 500) * 100, 100); // Caps at 500 chars total

                    const finalScore = (consistencyScore * 0.4) + (effortScore * 0.3) + (qualityScore * 0.2) + (avgScore * 0.1);

                    return {
                        ...stats,
                        days,
                        hours: hours.toFixed(1),
                        finalScore
                    };
                });

                rankings.sort((a, b) => b.finalScore - a.finalScore);
                const winnerStats = rankings[0];
                const winner = users.find(u => u.id === winnerStats.userId);

                if (!winner) return null;

                return {
                    user: winner,
                    stats: winnerStats,
                    reason: this.determineHeroReason(winnerStats)
                };
            } catch (err) {
                console.error("Hero Calculation Error:", err);
                return null;
            }
        }

        determineHeroReason(stats) {
            if (stats.days >= 5) return "Unmatched Consistency";
            if (stats.hours >= 40) return "Hardworking Machine";
            if (stats.activityLogDepth > 300) return "Detailed Communicator";
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

        async getAllStaffActivities(daysBack = 7) {
            try {
                // Calculate date range
                const endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - daysBack);
                startDate.setHours(0, 0, 0, 0);
                const startIso = startDate.toISOString().split('T')[0];
                const endIso = endDate.toISOString().split('T')[0];

                // 1. Fetch scoped attendance logs + plans + users
                const [attendanceLogs, workPlans, users] = await Promise.all([
                    this.getAttendanceInRange(startDate, endDate, `staffAct:${daysBack}`),
                    this.db.queryMany
                        ? this.db.queryMany('work_plans', [
                            { field: 'date', operator: '>=', value: startIso },
                            { field: 'date', operator: '<=', value: endIso }
                        ])
                        : window.AppDB.getAll('work_plans'),
                    this.getUsersCached()
                ]);

                const usersMap = {};
                users.forEach(userData => {
                    usersMap[userData.id] = userData.name;
                });

                const mergedActivities = [];

                // Process Attendance Logs
                attendanceLogs.forEach(log => {
                    const logDate = new Date(log.date);
                    if (logDate >= startDate && logDate <= endDate && log.workDescription) {
                        mergedActivities.push({
                            ...log,
                            type: 'attendance',
                            staffName: usersMap[log.user_id || log.userId] || 'Unknown Staff',
                            _displayDesc: log.workDescription,
                            _sortTime: log.checkOut || '00:00'
                        });
                    }
                });

                // Process Work Plans
                workPlans.forEach(wp => {
                    const wpDate = new Date(wp.date);
                    if (wpDate >= startDate && wpDate <= endDate && wp.plans) {
                        wp.plans.forEach(plan => {
                            mergedActivities.push({
                                ...plan,
                                date: wp.date,
                                id: wp.id, // work_plan document id
                                type: 'work',
                                staffName: usersMap[wp.userId] || 'Unknown Staff',
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

    window.AppAnalytics = new Analytics();
})();
