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
            const logs = await this.db.getAll('attendance');

            // 2. Process Data (Last 7 Days)
            const stats = this.processLast7Days(logs);

            // 3. Render Chart
            // 3. Render Chart
            const ctx = canvas.getContext('2d');
            try {
                this.chartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: stats.labels,
                        datasets: [
                            {
                                label: 'Present',
                                data: stats.present,
                                backgroundColor: '#4ade80',
                                borderRadius: 4
                            },
                            {
                                label: 'On Leave',
                                data: stats.onLeave,
                                backgroundColor: '#f87171',
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: 'Weekly Attendance Overview' }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            } catch (err) {
                console.error("Chart.js Error:", err);
                canvas.parentNode.innerHTML = `<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${err.message}</div>`;
            }
        }

        processLast7Days(logs) {
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

                // Count logs for this day
                const daysLogs = logs.filter(l => {
                    const logDate = new Date(l.date);
                    // Invalid dates are ignored
                    if (isNaN(logDate.getTime())) return false;
                    return isSameDay(logDate, targetDate);
                });

                const presentCount = daysLogs.filter(l => l.status === 'in' && l.type !== 'Sick Leave' && l.type !== 'Casual Leave' && l.type !== 'Annual Leave' && l.location !== 'On Leave').length;
                const leaveCount = daysLogs.filter(l => l.location === 'On Leave' || String(l.type).includes('Leave')).length;

                presentData.push(presentCount);
                leaveData.push(leaveCount);
            }

            console.log("Weekly Stats Generated:", { labels, present: presentData });
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

        async getUserMonthlyStats(userId) {
            const logs = await this.db.getAll('attendance');
            const userLogs = logs.filter(l => l.userId === userId || l.user_id === userId);

            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();

            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const breakdown = {
                'Present': 0, 'Late': 0, 'Work - Home': 0, 'Training': 0,
                'Sick Leave': 0, 'Casual Leave': 0, 'Earned Leave': 0,
                'Paid Leave': 0, 'Maternity Leave': 0, 'Absent': 0,
                'Holiday': 0, 'National Holiday': 0, 'Regional Holidays': 0
            };

            const stats = {
                present: 0,
                late: 0,
                leaves: 0,
                penalty: 0,
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

                    // LATE Check (Threshold: 09:05 = 545 minutes)
                    if (inMinutes !== null && inMinutes > 545) {
                        breakdown['Late']++;
                        stats.late++;
                        totalLateMinutes += (inMinutes - 545); // Duration from 9:05
                    }

                    // EXTRA HOURS Check
                    // 1. Morning: Before 09:00 (540 minutes)
                    if (inMinutes !== null && inMinutes < 540) {
                        totalExtraMinutes += (540 - inMinutes);
                    }
                    // 2. Evening: After 17:00 (17 * 60 = 1020 minutes)
                    if (outMinutes !== null && outMinutes > 1020) {
                        totalExtraMinutes += (outMinutes - 1020);
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

            // Penalty Rule: > 3 Lates = 0.5 Leave penalty
            if (breakdown['Late'] > 3) stats.penalty = 0.5;

            stats.totalLateDuration = this.formatDuration(totalLateMinutes);
            stats.totalExtraDuration = this.formatDuration(totalExtraMinutes);

            return stats;
        }

        async getUserYearlyStats(userId) {
            const logs = await this.db.getAll('attendance');
            const userLogs = logs.filter(l => l.userId === userId || l.user_id === userId);
            const { start, end, label } = this.getFinancialYearDates();

            const breakdown = {
                'Present': 0, 'Late': 0, 'Work - Home': 0, 'Training': 0,
                'Sick Leave': 0, 'Casual Leave': 0, 'Earned Leave': 0,
                'Paid Leave': 0, 'Maternity Leave': 0, 'Absent': 0,
                'Holiday': 0, 'National Holiday': 0, 'Regional Holidays': 0
            };

            const stats = {
                present: 0,
                late: 0,
                leaves: 0,
                penaltyLeaves: 0,
                label: label,
                breakdown: breakdown,
                totalLateDuration: '0h 0m',
                totalExtraDuration: '0h 0m'
            };

            const monthlyLates = {};
            let totalLateMinutes = 0;
            let totalExtraMinutes = 0;

            userLogs.forEach(log => {
                const logDate = new Date(log.date);
                if (!isNaN(logDate) && logDate >= start && logDate <= end) {
                    let type = log.type || '';
                    const inMinutes = this.parseTimeToMinutes(log.checkIn);
                    const outMinutes = this.parseTimeToMinutes(log.checkOut);

                    // LATE Check (Threshold: 09:05 = 545 minutes)
                    if (inMinutes !== null && inMinutes > 545) {
                        breakdown['Late']++;

                        // Accumulate duration
                        totalLateMinutes += (inMinutes - 545);

                        // Track monthly for penalty
                        const monthKey = `${logDate.getFullYear()}-${logDate.getMonth()}`;
                        if (!monthlyLates[monthKey]) monthlyLates[monthKey] = 0;
                        monthlyLates[monthKey]++;
                    }

                    // EXTRA HOURS Check
                    // 1. Morning: Before 09:00 (540 minutes)
                    if (inMinutes !== null && inMinutes < 540) {
                        totalExtraMinutes += (540 - inMinutes);
                    }
                    // 2. Evening: After 17:00 (1020 minutes)
                    if (outMinutes !== null && outMinutes > 1020) {
                        totalExtraMinutes += (outMinutes - 1020);
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

        getDayType(date) {
            const day = date.getDay();
            const dateNum = date.getDate();

            if (day === 0) return 'Holiday'; // Sunday

            if (day === 6) { // Saturday Rules
                // Calculate which Saturday it is (1st, 2nd, etc.)
                const weekNum = Math.ceil(dateNum / 7);
                if (weekNum === 2 || weekNum === 4) return 'Holiday';
                return 'Half Day';
            }

            return 'Work Day';
        }
    }

    window.AppAnalytics = new Analytics();

})();
