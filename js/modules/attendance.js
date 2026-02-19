/**
 * Attendance Module
 * Handles Check-in, Check-out, and Log Management
 * (Converted to IIFE for file:// support)
 */
(function () {
    class Attendance {

        async getStatus() {
            // Depend on AppAuth
            const user = window.AppAuth.getUser();
            if (!user) return { status: 'out', lastCheckIn: null };
            return {
                status: user.status || 'out',
                lastCheckIn: user.lastCheckIn
            };
        }

        async checkIn(latitude, longitude, address = 'Unknown Location') {
            const user = window.AppAuth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Update User State
            user.status = 'in';
            user.lastCheckIn = Date.now();
            const locationString = address && address !== 'Unknown Location'
                ? address
                : (latitude && longitude ? `Lat: ${Number(latitude).toFixed(4)}, Lng: ${Number(longitude).toFixed(4)}` : 'Unknown Location');

            user.currentLocation = { lat: latitude, lng: longitude, address: locationString };

            await window.AppDB.put('users', user);
            return true;
        }

        async checkOut(description = '', lat = null, lng = null, address = 'Detected Location', locationMismatched = false, explanation = '', options = {}) {
            const user = window.AppAuth.getUser();
            if (!user || user.status !== 'in') throw new Error("User is not checked in");

            const checkInTime = new Date(user.lastCheckIn);
            const checkOutTime = options.checkOutTime ? new Date(options.checkOutTime) : new Date();
            const durationMs = checkOutTime - checkInTime;
            const statusMeta = this.evaluateAttendanceStatus(checkInTime, durationMs);

            // Get Activity Stats
            const activityStats = window.AppActivity ? window.AppActivity.getStats() : { score: 0 };

            // Create Attendance Log
            const log = {
                id: String(Date.now()), // Ensure ID is string
                user_id: user.id,
                date: checkOutTime.toISOString().split('T')[0], // Stable ISO format YYYY-MM-DD
                checkIn: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                checkOut: checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: this.msToTime(durationMs),
                durationMs: durationMs, // Store raw ms for calculations
                type: statusMeta.status,
                dayCredit: statusMeta.dayCredit,
                lateCountable: statusMeta.lateCountable,
                extraWorkedMs: statusMeta.extraWorkedMs || 0,
                policyVersion: 'v2',
                location: user.currentLocation?.address || 'Checked In Location',
                lat: user.currentLocation?.lat,
                lng: user.currentLocation?.lng,
                checkOutLocation: address || (lat && lng ? `Lat: ${Number(lat).toFixed(4)}, Lng: ${Number(lng).toFixed(4)}` : 'Detected Location'),
                outLat: lat,
                outLng: lng,
                workDescription: description || '',
                locationMismatched: locationMismatched,
                locationExplanation: explanation || '',
                activityScore: activityStats.score,
                autoCheckout: !!options.autoCheckout,
                autoCheckoutReason: options.autoCheckoutReason || '',
                autoCheckoutAt: options.autoCheckoutAt || null,
                autoCheckoutRequiresApproval: !!options.autoCheckoutRequiresApproval,
                autoCheckoutExtraApproved: options.autoCheckoutExtraApproved ?? null,
                synced: false // For future sync logic
            };

            // Save Log
            await window.AppDB.add('attendance', log);

            // Update User State (Save Last Known Info)
            user.status = 'out';
            user.lastCheckOut = Date.now(); // Save checkout timestamp
            user.lastLocation = user.currentLocation; // Persist last known check-in location
            user.lastCheckOutLocation = { lat, lng, address }; // Persist last known check-out location
            user.locationMismatched = locationMismatched;

            // Clear Active State
            user.lastCheckIn = null;
            user.currentLocation = null;

            await window.AppDB.put('users', user);

            // Stop Activity Monitoring
            if (window.AppActivity) window.AppActivity.stop();

            return true;
        }

        async addAdminLog(userId, logData) {
            const newLog = {
                id: String(Date.now()),
                user_id: userId,
                ...logData,
                isManualOverride: true,
                synced: false
            };

            await window.AppDB.add('attendance', newLog);
            return newLog;
        }

        async deleteLog(logId) {
            if (!logId) return;
            await window.AppDB.delete('attendance', logId);
            return true;
        }

        async updateLog(logId, logData) {
            if (!logId) return;
            const existing = await window.AppDB.get('attendance', logId);
            if (!existing) throw new Error("Log not found");

            const updatedLog = {
                ...existing,
                ...logData,
                isManualOverride: true,
                id: logId
            };

            await window.AppDB.put('attendance', updatedLog);
            return updatedLog;
        }

        async addManualLog(logData) {
            const user = window.AppAuth.getUser();
            if (!user) return;

            const checkInDate = this.buildDateTime(logData.date, logData.checkIn);
            const checkOutDate = this.buildDateTime(logData.date, logData.checkOut);
            const durationMs = (checkInDate && checkOutDate) ? (checkOutDate - checkInDate) : 0;
            const statusMeta = this.evaluateAttendanceStatus(checkInDate || new Date(), durationMs);

            const resolvedType = String(logData.type || '').trim();
            const finalType = (!resolvedType || resolvedType === 'Manual')
                ? statusMeta.status
                : resolvedType;

            const newLog = {
                id: String(Date.now()),
                user_id: user.id,
                ...logData,
                type: finalType,
                durationMs: typeof logData.durationMs === 'number' ? logData.durationMs : durationMs,
                dayCredit: statusMeta.dayCredit,
                lateCountable: finalType === 'Late',
                extraWorkedMs: statusMeta.extraWorkedMs || 0,
                synced: false
            };

            await window.AppDB.add('attendance', newLog);
            return newLog;
        }

        async getLogs(userId = null) {
            // Optimized: Use Firestore Query instead of fetching all
            const targetId = userId || window.AppAuth.getUser()?.id;
            if (!targetId) return [];

            try {
                // Access raw Firestore instance for query
                const db = window.AppFirestore;
                let query = db.collection('attendance');

                // Filter by User
                query = query.where('user_id', '==', targetId);

                // Sort by ID (timestamp) descending for "Newest First"
                // Note: Firestore requires an index for this. If it fails, we default to client-side sort for now.
                // For simplicity/robustness without index mgmt, we fetch last 50 then sort client safely
                // or just standard fetch.

                // const snapshot = await query.orderBy('id', 'desc').limit(50).get(); // Needs Index

                const snapshot = await query.get();
                const userLogs = snapshot.docs.map(doc => doc.data());

                // Client-side sort (but dataset is now much smaller, only this user's logs)
                // Client-side sort (but dataset is now much smaller, only this user's logs)
                const sortedLogs = userLogs.sort((a, b) => b.id - a.id).map(log => {
                    // Fix display for logs with missing address but valid coordinates
                    if ((!log.location || log.location === 'Unknown Location') && log.lat && log.lng) {
                        log.location = `Lat: ${Number(log.lat).toFixed(4)}, Lng: ${Number(log.lng).toFixed(4)}`;
                    }
                    return log;
                });

                // Check for ACTIVE session (Virtual Log)
                try {
                    const currentUserState = await window.AppDB.get('users', targetId);
                    if (currentUserState && currentUserState.status === 'in' && currentUserState.lastCheckIn) {
                        const checkInTime = new Date(currentUserState.lastCheckIn);
                        const virtualLog = {
                            id: 'active_now',
                            date: checkInTime.toLocaleDateString(),
                            checkIn: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            checkOut: 'Active Now',
                            duration: 'Working...',
                            type: 'Office',
                            location: currentUserState.currentLocation?.address && currentUserState.currentLocation.address !== 'Unknown Location'
                                ? currentUserState.currentLocation.address
                                : (currentUserState.currentLocation?.lat && currentUserState.currentLocation?.lng
                                    ? `Lat: ${Number(currentUserState.currentLocation.lat).toFixed(4)}, Lng: ${Number(currentUserState.currentLocation.lng).toFixed(4)}`
                                    : 'Current Session')
                        };
                        sortedLogs.unshift(virtualLog); // Add to top
                    }
                } catch (err) {
                    console.warn("Could not fetch active status for logs", err);
                }

                return sortedLogs.slice(0, 50); // Limit to last 50
            } catch (e) {
                console.warn("Optimized log fetch failed, falling back to simple filter", e);
                // Fallback (e.g. offline mode restrictions?)
                return [];
            }
        }

        async getAllLogs() {
            // Admin: Get all logs
            return await window.AppDB.getAll('attendance');
        }

        msToTime(duration) {
            let minutes = Math.floor((duration / (1000 * 60)) % 60);
            let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
            return `${hours}h ${minutes}m`;
        }

        buildDateTime(dateStr, timeStr) {
            if (!dateStr || !timeStr) return null;
            const iso = `${dateStr}T${timeStr}:00`;
            const dt = new Date(iso);
            return Number.isNaN(dt.getTime()) ? null : dt;
        }

        normalizeType(rawType) {
            const type = String(rawType || '').trim();
            if (!type || type === 'Manual') return 'Present';
            if (type === 'Manual/WFH') return 'Work - Home';
            return type;
        }

        getDayCredit(type) {
            const normalized = this.normalizeType(type);
            if (normalized === 'Half Day') return 0.5;
            if (normalized === 'Absent') return 0;
            if (
                normalized === 'Present' ||
                normalized === 'Present (Late Waived)' ||
                normalized === 'Late' ||
                normalized === 'Work - Home' ||
                normalized === 'On Duty'
            ) {
                return 1;
            }
            return 0;
        }

        evaluateAttendanceStatus(checkInDateObj, durationMs = 0) {
            if (!checkInDateObj || Number.isNaN(checkInDateObj.getTime())) {
                return { status: 'Absent', dayCredit: 0, lateCountable: false, extraWorkedMs: 0 };
            }

            const day = checkInDateObj.getDay(); // 0=Sun, 6=Sat
            if (day === 0) {
                return { status: 'Present', dayCredit: 1, lateCountable: false, extraWorkedMs: 0 };
            }

            const checkInMins = (checkInDateObj.getHours() * 60) + checkInDateObj.getMinutes();
            const netHours = Math.max(0, durationMs) / (1000 * 60 * 60);

            const graceEnd = window.AppConfig.LATE_CUTOFF_MINUTES || 555; // 09:15
            const minorLateEnd = window.AppConfig.MINOR_LATE_END_MINUTES || 615; // 10:15
            const lateEnd = window.AppConfig.LATE_END_MINUTES || 720; // 12:00
            const postNoonEnd = window.AppConfig.POST_NOON_END_MINUTES || 810; // 13:30
            const afternoonStart = window.AppConfig.AFTERNOON_START_MINUTES || 720; // 12:00

            let status = 'Present';
            let lateCountable = false;
            let extraWorkedMs = 0;

            // Afternoon office entry rule: decision is purely by net worked hours
            if (checkInMins >= afternoonStart) {
                if (netHours >= 8) {
                    status = 'Present';
                } else if (netHours >= 4) {
                    status = 'Half Day';
                } else {
                    status = 'Absent';
                }
                if (netHours > 4) {
                    extraWorkedMs = Math.max(0, durationMs - (4 * 60 * 60 * 1000));
                }
                return {
                    status,
                    dayCredit: this.getDayCredit(status),
                    lateCountable: false,
                    extraWorkedMs
                };
            }

            if (checkInMins > postNoonEnd) {
                status = 'Absent';
            } else if (checkInMins > lateEnd) {
                status = netHours >= 4 ? 'Half Day' : 'Absent';
            } else if (checkInMins > minorLateEnd) {
                status = netHours >= 4 ? 'Half Day' : 'Absent';
            } else if (checkInMins > graceEnd) {
                if (netHours >= 8) {
                    status = 'Present (Late Waived)';
                } else {
                    status = 'Late';
                    lateCountable = true;
                }
            } else {
                status = 'Present';
            }

            return {
                status,
                dayCredit: this.getDayCredit(status),
                lateCountable,
                extraWorkedMs
            };
        }

        calculateStatus(checkInDateObj) {
            return this.evaluateAttendanceStatus(checkInDateObj, 8 * 60 * 60 * 1000).status;
        }
    }

    // Export to Window
    window.AppAttendance = new Attendance();
})();
