/**
 * Reports Module
 * Handles data export and report generation.
 */

(function () {

    class Reports {

        constructor() {
            this.db = window.AppDB;
        }

        /**
         * Convert Array of Objects to CSV
         * @param {Array} data - The data array
         * @param {Array} headers - Column headers ["Name", "Date", ...]
         * @param {Array} keys - Object keys corresponding to headers ["name", "date", ...]
         */
        convertToCSV(data, headers, keys) {
            const headerRow = headers.join(',');
            const rows = data.map(row => {
                return keys.map(key => {
                    let val = row[key] || '';
                    // Escape quotes and wrap in quotes if contains comma
                    val = String(val).replace(/"/g, '""');
                    if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
                    return val;
                }).join(',');
            });
            return [headerRow, ...rows].join('\n');
        }

        /**
         * Trigger File Download
         * @param {String} content - File content
         * @param {String} fileName - Name of file
         * @param {String} mimeType - MIME type (e.g., 'text/csv')
         */
        downloadFile(content, fileName, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }

        /**
         * Export All Attendance Logs
         */
        async exportAttendanceCSV() {
            try {
                // 1. Fetch all data
                const users = await this.db.getAll('users');
                const logs = await this.db.getAll('attendance');

                // 2. Map User Details to Logs
                const userMap = {};
                users.forEach(u => userMap[u.id] = u);

                const flattenedData = logs.map(log => {
                    // Handle schema inconsistency (user_id vs userId)
                    const uid = log.user_id || log.userId;
                    const user = userMap[uid] || { name: 'Unknown', role: 'N/A', rating: 0, completionStats: {} };

                    // Format Location: Prefer raw coords if available (for Google Maps compatibility)
                    let locString = log.location || 'N/A';
                    if (log.lat && log.lng) {
                        locString = `Lat: ${Number(log.lat).toFixed(5)}, Lng: ${Number(log.lng).toFixed(5)}`;
                    }

                    return {
                        date: log.date,
                        name: user.name,
                        role: user.role,
                        rating: user.rating ? user.rating.toFixed(1) : 'N/A',
                        completionRate: user.completionStats?.completionRate ? `${(user.completionStats.completionRate * 100).toFixed(0)}%` : 'N/A',
                        checkIn: log.checkIn,
                        checkOut: log.checkOut || '--',
                        duration: log.duration || '--',
                        workSummary: log.workDescription || '--',
                        inLocation: locString,
                        outLocation: log.checkOutLocation || '--',
                        type: log.type || 'Standard'
                    };
                });

                // 2.5 ADD ACTIVE SESSIONS (Virtual Logs)
                users.forEach(u => {
                    if (u.status === 'in' && u.lastCheckIn) {
                        const checkInDate = new Date(u.lastCheckIn);
                        flattenedData.push({
                            date: checkInDate.toLocaleDateString(), // Use Check-in date, not today (could be overnight)
                            name: u.name,
                            role: u.role,
                            checkIn: checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            checkOut: 'Active Now',
                            duration: 'Working...',
                            workSummary: 'Current Session (Active)',
                            inLocation: u.currentLocation?.address || 'Current Session',
                            outLocation: '--',
                            type: 'Office (Active)'
                        });
                    }
                });

                // 3. Sort by Date (descending)
                flattenedData.sort((a, b) => new Date(b.date) - new Date(a.date));

                // 4. Generate CSV
                const headers = ['Date', 'Staff Name', 'Role', 'Star Rating', 'Completion Rate', 'Check In', 'Check Out', 'Duration', 'Work Summary', 'Check-in Location', 'Check-out Location', 'Type'];
                const keys = ['date', 'name', 'role', 'rating', 'completionRate', 'checkIn', 'checkOut', 'duration', 'workSummary', 'inLocation', 'outLocation', 'type'];

                const csvContent = this.convertToCSV(flattenedData, headers, keys);

                // 5. Download
                const fileName = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
                this.downloadFile(csvContent, fileName, 'text/csv');

                return true;

            } catch (err) {
                console.error("Export Failed:", err);
                throw new Error("Failed to generate report");
            }
        }

        /**
         * Export Single User Logs
         */
        async exportUserLogsCSV(user, logs) {
            try {
                const flattenedData = logs.map(log => {
                    let locString = log.location || 'N/A';
                    if (log.lat && log.lng) {
                        locString = `Lat: ${Number(log.lat).toFixed(5)}, Lng: ${Number(log.lng).toFixed(5)}`;
                    }
                    return {
                        date: log.date,
                        name: user.name,
                        role: user.role,
                        checkIn: log.checkIn,
                        checkOut: log.checkOut || '--',
                        duration: log.duration || '--',
                        workSummary: log.workDescription || '--',
                        inLocation: locString,
                        outLocation: log.checkOutLocation || '--',
                        type: log.type || 'Standard'
                    };
                });

                // Sort by Date (descending)
                flattenedData.sort((a, b) => new Date(b.date) - new Date(a.date));

                const headers = ['Date', 'Staff Name', 'Role', 'Check In', 'Check Out', 'Duration', 'Work Summary', 'Check-in Location', 'Check-out Location', 'Type'];
                const keys = ['date', 'name', 'role', 'checkIn', 'checkOut', 'duration', 'workSummary', 'inLocation', 'outLocation', 'type'];

                const csvContent = this.convertToCSV(flattenedData, headers, keys);
                const fileName = `Attendance_Report_${user.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
                this.downloadFile(csvContent, fileName, 'text/csv');
                return true;
            } catch (err) {
                console.error("Export Failed:", err);
                alert("Failed to export logs: " + err.message);
            }
        }
        async exportMasterSheetCSV(month, year, users, logs) {
            try {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const headers = ['S.No', 'Staff Name', 'Department'];
                for (let d = 1; d <= daysInMonth; d++) headers.push(String(d));

                const rows = users.sort((a, b) => a.name.localeCompare(b.name)).map((u, idx) => {
                    const row = [idx + 1, u.name, u.dept || 'General'];
                    for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const dayLogs = logs.filter(l => (l.userId === u.id || l.user_id === u.id) && l.date === dateStr);
                        if (dayLogs.length > 0) {
                            const l = dayLogs[0];
                            let display = l.type || 'P';
                            if (display === 'Short Leave' && l.durationHours) {
                                display = `SL(${l.durationHours}h)`;
                            }
                            row.push(`${display} (${l.checkIn}-${l.checkOut || 'Active'})`);
                        } else {
                            row.push('-');
                        }
                    }
                    return row;
                });

                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
                const fileName = `Attendance_Sheet_${monthName}_${year}.csv`;
                this.downloadFile(csvContent, fileName, 'text/csv');
                return true;
            } catch (err) {
                console.error("Export Failed:", err);
                alert("Export Failed: " + err.message);
            }
        }

        /**
         * Export Leave Requests to CSV
         */
        async exportLeavesCSV(leaves) {
            try {
                const headers = ['Applied On', 'Staff Name', 'FY', 'Type', 'From', 'To', 'Days/Hrs', 'Reason', 'Status', 'Admin Comment'];
                const keys = ['appliedOn', 'userName', 'financialYear', 'type', 'startDate', 'endDate', 'daysCount', 'reason', 'status', 'adminComment'];

                const processedLeaves = leaves.map(l => ({
                    ...l,
                    daysCount: l.type === 'Short Leave' ? `${l.durationHours || 0}h` : l.daysCount
                }));

                const csvContent = this.convertToCSV(processedLeaves, headers, keys);
                const fileName = `Leave_Requests_${new Date().toISOString().split('T')[0]}.csv`;
                this.downloadFile(csvContent, fileName, 'text/csv');
                return true;
            } catch (err) {
                console.error("Leave Export Failed:", err);
                alert("Export Failed: " + err.message);
            }
        }

        /**
         * Export Calendar Plans (Work, Leave, Events) to CSV
         */
        async exportCalendarPlansCSV(plans, month, year) {
            try {
                const flattenedData = [];
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

                for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                    // 1. Check Leaves
                    plans.leaves.forEach(l => {
                        if (dateStr >= l.startDate && dateStr <= l.endDate) {
                            flattenedData.push({
                                date: dateStr,
                                category: 'Leave',
                                subject: `${l.userName || 'Staff'} - ${l.type}`,
                                details: l.reason || 'No reason provided',
                                staff: l.userName || 'Staff'
                            });
                        }
                    });

                    // 2. Check Events
                    plans.events.forEach(e => {
                        if (e.date === dateStr) {
                            flattenedData.push({
                                date: dateStr,
                                category: 'Event',
                                subject: e.title,
                                details: e.type || 'General Event',
                                staff: 'Organization'
                            });
                        }
                    });

                    // 3. Check Work Plans
                    plans.workPlans.forEach(p => {
                        if (p.date === dateStr) {
                            const taskDetails = p.plans ? p.plans.map((task, idx) => {
                                let tStr = `${idx + 1}. ${task.task}`;
                                if (task.subPlans && task.subPlans.length > 0) tStr += ` (Steps: ${task.subPlans.join(', ')})`;
                                if (task.tags && task.tags.length > 0) tStr += ` [With: ${task.tags.map(t => `@${t.name} (${t.status || 'pending'})`).join(', ')}]`;
                                return tStr;
                            }).join(' | ') : (p.plan || 'Work Plan');

                            flattenedData.push({
                                date: dateStr,
                                category: 'Work Plan',
                                subject: 'Daily Goals',
                                details: taskDetails,
                                staff: p.userName || 'Staff'
                            });
                        }
                    });
                }

                if (flattenedData.length === 0) {
                    alert("No plans found for the selected month.");
                    return false;
                }

                const headers = ['Date', 'Category', 'Subject', 'Details', 'Staff Member'];
                const keys = ['date', 'category', 'subject', 'details', 'staff'];

                const csvContent = this.convertToCSV(flattenedData, headers, keys);
                const fileName = `Team_Schedule_${monthName}_${year}.csv`;
                this.downloadFile(csvContent, fileName, 'text/csv');
                return true;
            } catch (err) {
                console.error("Calendar Export Failed:", err);
                alert("Failed to export calendar: " + err.message);
            }
        }

        async exportAnnualListViewCSV(rows) {
            try {
                // Pre-process rows for CSV (strip HTML from desc)
                const data = rows.map(r => ({
                    date: r.date,
                    staff: r.staff,
                    type: r.type,
                    desc: r.desc.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '') // Basic HTML strip
                }));

                const headers = ['Date', 'Staff Name', 'Category', 'Description'];
                const keys = ['date', 'staff', 'type', 'desc'];

                const csvContent = this.convertToCSV(data, headers, keys);
                const fileName = `Annual_Plan_List_${new Date().toISOString().split('T')[0]}.csv`;
                this.downloadFile(csvContent, fileName, 'text/csv');
                return true;
            } catch (err) {
                console.error("List Export Failed:", err);
                throw new Error("Failed to export list: " + err.message);
            }
        }
    }

    // Initialize
    window.AppReports = new Reports();

})();
