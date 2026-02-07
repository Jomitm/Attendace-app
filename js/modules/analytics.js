/**
 * Analytics Module
 * Handles visual data representation using Chart.js.
 */

(function () {

    class Analytics {
        constructor() {
            this.db = window.AppDB;
            this.chartInstance = null;
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
            const [logs, allUsers] = await Promise.all([
                this.db.getAll('attendance'),
                this.db.getAll('users')
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
            const logs = await this.db.getAll('attendance');
            const userLogs = logs.filter(l => l.userId === userId || l.user_id === userId);
            return this.calculateStatsForLogs(userLogs);
        }

        async getSystemMonthlySummary() {
            const allUsers = await this.db.getAll('users');
            const allLogs = await this.db.getAll('attendance');

            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

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
                earlyDepartures: 0,
                label: startOfMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
                breakdown: breakdown,
                totalLateDuration: '0h 0m',
                totalExtraDuration: '0h 0m'
            };

            let totalLateMinutes = 0;
            let totalExtraMinutes = 0;
            const weeklyGraceCount = {};

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
                        // EARLY ARRIVAL Credit (Before 09:15 = 555)
                        if (inMinutes !== null && inMinutes < 555) {
                            dayEarlyCredit = 555 - inMinutes;
                        }

                        // LATE Check (Target: 09:15 = 555)
                        if (inMinutes !== null && inMinutes > 555) {
                            const weekKey = `${logDate.getFullYear()}-W${this.getWeekNumber(logDate)}`;
                            if (!weeklyGraceCount[weekKey]) weeklyGraceCount[weekKey] = 0;

                            weeklyGraceCount[weekKey]++;
                            if (weeklyGraceCount[weekKey] > 3) {
                                // 4th+ time in a week = Half Day Salary loss
                                stats.penalty += 0.5;
                            }

                            breakdown['Late']++;
                            stats.late++;
                            totalLateMinutes += (inMinutes - 555);
                        }

                        // EARLY DEPARTURE Check (Before 17:00 = 1020 minutes)
                        if (outMinutes !== null && outMinutes < 1020 && !String(type).includes('Leave') && type !== 'Absent') {
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
                    if (inMinutes !== null && inMinutes < 555) totalExtraMinutes += (555 - inMinutes);
                    if (outMinutes !== null && outMinutes > 1020) totalExtraMinutes += (outMinutes - 1020);

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

            stats.totalLateDuration = this.formatDuration(totalLateMinutes);
            stats.totalExtraDuration = this.formatDuration(totalExtraMinutes);

            return stats;
        }

        async getUserYearlyStats(userId) {
            const logs = await this.db.getAll('attendance');
            const userLogs = logs.filter(l => l.userId === userId || l.user_id === userId);
            const { start, end, label } = this.getFinancialYearDates();

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
                label: label,
                breakdown: breakdown,
                totalLateDuration: '0h 0m',
                totalExtraDuration: '0h 0m'
            };

            const monthlyLates = {}; // Keep for tracking, but penalty is now weekly
            const weeklyGraceCount = {};
            let totalLateMinutes = 0;
            let totalExtraMinutes = 0;

            userLogs.forEach(log => {
                const logDate = new Date(log.date);
                if (!isNaN(logDate) && logDate >= start && logDate <= end) {
                    let type = log.type || '';
                    const inMinutes = this.parseTimeToMinutes(log.checkIn);
                    const outMinutes = this.parseTimeToMinutes(log.checkOut);

                    // LATE Check (Target: 09:15 = 555)
                    if (inMinutes !== null && inMinutes > 555) {
                        breakdown['Late']++;
                        totalLateMinutes += (inMinutes - 555);

                        const weekKey = `${logDate.getFullYear()}-W${this.getWeekNumber(logDate)}`;
                        if (!weeklyGraceCount[weekKey]) weeklyGraceCount[weekKey] = 0;

                        weeklyGraceCount[weekKey]++;
                        if (weeklyGraceCount[weekKey] > 3) {
                            // 4th+ time in a week = Half Day Salary loss
                            stats.penaltyLeaves += 0.5;
                        }
                    }

                    // EARLY DEPARTURE Check (Before 17:00 = 1020 minutes)
                    if (outMinutes !== null && outMinutes < 1020 && !String(type).includes('Leave') && type !== 'Absent') {
                        stats.earlyDepartures++;
                        breakdown['Early Departure']++;
                    }

                    // EXTRA HOURS Check
                    if (inMinutes !== null && inMinutes < 555) totalExtraMinutes += (555 - inMinutes);
                    if (outMinutes !== null && outMinutes > 1020) totalExtraMinutes += (outMinutes - 1020);

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
            stats.totalLateDuration = this.formatDuration(totalLateMinutes);
            stats.totalExtraDuration = this.formatDuration(totalExtraMinutes);

            // Apply Penalty (Monthly Reset)
            Object.values(monthlyLates).forEach(count => {
                if (count > 3) stats.penaltyLeaves += 0.5;
            });

            return stats;
        }

        getFinancialYearDates() {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth(); // 0-11

            let startYear = year;
            if (month < 3) { // Jan, Feb, Mar are part of previous FY starts
                startYear = year - 1;
            }

            const start = new Date(startYear, 3, 1); // April 1st
            const end = new Date(startYear + 1, 2, 31); // March 31st

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
                // Calculate which Saturday of the month it is (1st, 2nd, 3rd, 4th, or 5th)
                const n = Math.ceil(dateNum / 7);
                // 1st, 3rd, 5th are working days
                if (n === 1 || n === 3 || n === 5) return 'Work Day';
                // 2nd, 4th are holidays
                return 'Holiday';
            }

            return 'Work Day';
        }

        async getHeroOfTheWeek() {
            try {
                const logs = await this.db.getAll('attendance');
                const users = await this.db.getAll('users');

                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                sevenDaysAgo.setHours(0, 0, 0, 0);

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
                const logs = await this.db.getAll('attendance');
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

                // Fetch all attendance logs
                const db = window.AppFirestore;
                const snapshot = await db.collection('attendance').get();
                const allLogs = snapshot.docs.map(doc => doc.data());

                // Fetch all users to get names
                const usersSnapshot = await db.collection('users').get();
                const usersMap = {};
                usersSnapshot.docs.forEach(doc => {
                    const userData = doc.data();
                    usersMap[userData.id] = userData.name;
                });

                // Filter logs by date range and add staff names
                const filteredLogs = allLogs
                    .filter(log => {
                        const logDate = new Date(log.date);
                        return logDate >= startDate && logDate <= endDate && log.workDescription;
                    })
                    .map(log => ({
                        ...log,
                        staffName: usersMap[log.user_id] || 'Unknown Staff',
                        _displayDesc: log.workDescription || 'No description'
                    }))
                    .sort((a, b) => {
                        // Sort by date descending, then by checkout time descending
                        const dateCompare = new Date(b.date) - new Date(a.date);
                        if (dateCompare !== 0) return dateCompare;
                        return (b.checkOut || '').localeCompare(a.checkOut || '');
                    });

                return filteredLogs;
            } catch (err) {
                console.error("Error fetching all staff activities:", err);
                return [];
            }
        }
    }

    window.AppAnalytics = new Analytics();
})();
