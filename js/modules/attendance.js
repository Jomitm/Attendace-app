import { AppAuth } from './auth.js';
import { AppDB } from './db.js';
import { AppConfig } from '../config.js';

export class Attendance {
    async getStatus() {
        // If AppAuth is already syncing in realtime, AppAuth.getUser() is likely more up-to-date
        // than a slow DB fetch. refreshCurrentUserFromDB now handles this optimization internally,
        // but we'll call it here to ensure we have the absolute latest known state.
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());

        if (!user) return { status: 'out', lastCheckIn: null };

        if (user.status === 'in' && user.lastCheckIn) {
            try {
                const checkInDate = new Date(user.lastCheckIn);
                const now = new Date();

                // Compare using ISO dates to avoid timezone/clock drift issues during simple checks
                const checkInDateStr = checkInDate.toISOString().split('T')[0];
                const todayStr = now.toISOString().split('T')[0];

                if (checkInDateStr < todayStr) {
                    return { status: 'out', lastCheckIn: null, staleSession: true };
                }
            } catch (e) {
                console.warn("Date parsing error in getStatus:", e);
            }
        }

        return {
            status: user.status || 'out',
            lastCheckIn: user.lastCheckIn
        };
    }

    async checkIn(latitude, longitude, address = 'Unknown Location') {
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());
        if (!user) throw new Error("User not authenticated");

        let resolvedMissedCheckout = false;
        let noticeMessage = '';

        if (user.status === 'in' && user.lastCheckIn) {
            const priorCheckInTime = new Date(user.lastCheckIn);
            const now = new Date();
            const priorLocalDate = `${priorCheckInTime.getFullYear()}-${String(priorCheckInTime.getMonth() + 1).padStart(2, '0')}-${String(priorCheckInTime.getDate()).padStart(2, '0')}`;
            const todayLocalDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            if (priorLocalDate < todayLocalDate) {
                const fixedDurationMs = 8 * 60 * 60 * 1000;
                const priorCheckOutTime = new Date(priorCheckInTime.getTime() + fixedDurationMs);
                const statusMeta = this.evaluateAttendanceStatus(priorCheckInTime, fixedDurationMs);
                const priorLocation = user.currentLocation || user.lastLocation || null;
                const closureTimestamp = new Date().toISOString();

                const missedLog = {
                    id: String(Date.now()),
                    user_id: user.id,
                    date: priorCheckOutTime.toISOString().split('T')[0],
                    checkIn: priorCheckInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    checkOut: priorCheckOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    duration: this.msToTime(fixedDurationMs),
                    durationMs: fixedDurationMs,
                    type: statusMeta.status,
                    dayCredit: statusMeta.dayCredit,
                    lateCountable: statusMeta.lateCountable,
                    extraWorkedMs: statusMeta.extraWorkedMs || 0,
                    policyVersion: 'v2',
                    location: priorLocation?.address || 'Missed checkout session',
                    lat: priorLocation?.lat ?? null,
                    lng: priorLocation?.lng ?? null,
                    checkOutLocation: 'System closure on next check-in',
                    outLat: null,
                    outLng: null,
                    workDescription: 'System closure: previous open session was closed at fixed 8 credited hours.',
                    locationMismatched: false,
                    locationExplanation: '',
                    activityScore: 0,
                    autoCheckout: false,
                    autoCheckoutReason: '',
                    autoCheckoutAt: null,
                    autoCheckoutRequiresApproval: false,
                    autoCheckoutExtraApproved: null,
                    missedCheckoutResolved: true,
                    missedCheckoutPolicy: 'fixed_8h_on_next_checkin',
                    systemClosedAt: closureTimestamp,
                    synced: false
                };

                await AppDB.add('attendance', missedLog);

                user.status = 'out';
                user.lastCheckOut = priorCheckOutTime.getTime();
                user.lastLocation = priorLocation;
                user.lastCheckOutLocation = { lat: null, lng: null, address: 'System closure on next check-in' };
                user.locationMismatched = false;
                user.lastCheckIn = null;
                user.currentLocation = null;

                resolvedMissedCheckout = true;
                noticeMessage = 'Previous open session was closed by policy at 8 credited hours because checkout was missed.';
            } else {
                return {
                    ok: false,
                    conflict: true,
                    message: 'Status updated from another device.'
                };
            }
        }

        // Update User State
        user.status = 'in';
        user.lastCheckIn = Date.now();
        const locationString = address && address !== 'Unknown Location'
            ? address
            : (latitude && longitude ? `Lat: ${Number(latitude).toFixed(4)}, Lng: ${Number(longitude).toFixed(4)}` : 'Unknown Location');

        user.currentLocation = { lat: latitude, lng: longitude, address: locationString };

        await AppDB.put('users', user);
        return {
            ok: true,
            resolvedMissedCheckout,
            noticeMessage
        };
    }

    async checkOut(description = '', lat = null, lng = null, address = 'Detected Location', locationMismatched = false, explanation = '', options = {}) {
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());
        if (!user || user.status !== 'in') {
            return {
                ok: false,
                conflict: true,
                message: 'Status updated from another device.'
            };
        }

        const checkInTime = new Date(user.lastCheckIn);
        const checkOutTime = options.checkOutTime ? new Date(options.checkOutTime) : new Date();
        const durationMs = checkOutTime - checkInTime;
        const statusMeta = this.evaluateAttendanceStatus(checkInTime, durationMs);

        // Get Activity Stats
        const activityStats = window.AppActivity ? window.AppActivity.getStats() : { score: 0 };

        const log = {
            id: String(Date.now()),
            user_id: user.id,
            date: checkOutTime.toISOString().split('T')[0],
            checkIn: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOut: checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: this.msToTime(durationMs),
            durationMs: durationMs,
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
            overtimePrompted: !!options.overtimePrompted,
            overtimeReasonTag: options.overtimeReasonTag || '',
            overtimeExplanation: options.overtimeExplanation || '',
            overtimeCappedToEightHours: !!options.overtimeCappedToEightHours,
            entrySource: 'checkin_checkout',
            attendanceEligible: true,
            synced: false
        };

        await AppDB.add('attendance', log);

        user.status = 'out';
        user.lastCheckOut = Date.now();
        user.lastLocation = user.currentLocation;
        user.lastCheckOutLocation = { lat, lng, address };
        user.locationMismatched = locationMismatched;
        user.lastCheckIn = null;
        user.currentLocation = null;

        await AppDB.put('users', user);

        if (window.AppActivity) window.AppActivity.stop();

        return {
            ok: true,
            conflict: false
        };
    }

    async addAdminLog(userId, logData) {
        const newLog = {
            id: String(Date.now()),
            user_id: userId,
            ...logData,
            isManualOverride: logData.isManualOverride === true,
            entrySource: logData.entrySource || 'admin_override',
            attendanceEligible: Object.prototype.hasOwnProperty.call(logData, 'attendanceEligible')
                ? (logData.attendanceEligible === true)
                : true,
            synced: false
        };

        await AppDB.add('attendance', newLog);
        return newLog;
    }

    async deleteLog(logId) {
        if (!logId) return;
        await AppDB.delete('attendance', logId);
        return true;
    }

    async updateLog(logId, logData) {
        if (!logId) return;
        const existing = await AppDB.get('attendance', logId);
        if (!existing) throw new Error("Log not found");

        const updatedLog = {
            ...existing,
            ...logData,
            isManualOverride: Object.prototype.hasOwnProperty.call(logData, 'isManualOverride')
                ? (logData.isManualOverride === true)
                : !!existing.isManualOverride,
            entrySource: logData.entrySource || existing.entrySource || 'admin_override',
            attendanceEligible: Object.prototype.hasOwnProperty.call(logData, 'attendanceEligible')
                ? (logData.attendanceEligible === true)
                : (Object.prototype.hasOwnProperty.call(existing, 'attendanceEligible') ? existing.attendanceEligible === true : true),
            id: logId
        };

        await AppDB.put('attendance', updatedLog);
        return updatedLog;
    }

    async addManualLog(logData) {
        const user = AppAuth.getUser();
        if (!user) return;

        const checkInDate = this.buildDateTime(logData.date, logData.checkIn);
        const checkOutDate = this.buildDateTime(logData.date, logData.checkOut);
        const durationMs = (checkInDate && checkOutDate) ? (checkOutDate - checkInDate) : 0;
        const statusMeta = this.evaluateAttendanceStatus(checkInDate || new Date(), durationMs);

        const resolvedType = String(logData.type || '').trim();
        const fallbackType = (!resolvedType || resolvedType === 'Manual')
            ? statusMeta.status
            : resolvedType;
        const attendanceEligible = Object.prototype.hasOwnProperty.call(logData, 'attendanceEligible')
            ? (logData.attendanceEligible === true)
            : fallbackType !== 'Work Log';
        const finalType = attendanceEligible ? fallbackType : (resolvedType || 'Work Log');

        const newLog = {
            id: String(Date.now()),
            user_id: user.id,
            ...logData,
            type: finalType,
            durationMs: typeof logData.durationMs === 'number' ? logData.durationMs : durationMs,
            dayCredit: attendanceEligible
                ? (typeof logData.dayCredit === 'number' ? logData.dayCredit : statusMeta.dayCredit)
                : 0,
            lateCountable: attendanceEligible && (logData.lateCountable === true || finalType === 'Late'),
            extraWorkedMs: attendanceEligible
                ? (typeof logData.extraWorkedMs === 'number' ? logData.extraWorkedMs : (statusMeta.extraWorkedMs || 0))
                : 0,
            entrySource: logData.entrySource || 'staff_manual_work',
            attendanceEligible: attendanceEligible,
            synced: false
        };

        await AppDB.add('attendance', newLog);
        return newLog;
    }

    async getLogs(userId = null) {
        const targetId = userId || AppAuth.getUser()?.id;
        if (!targetId) return [];

        try {
            const db = window.AppFirestore;
            if (!db) return [];
            let query = db.collection('attendance');
            query = query.where('user_id', '==', targetId);

            const snapshot = await query.get();
            const userLogs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            const sortedLogs = userLogs.sort((a, b) => b.id - a.id).map(log => {
                if ((!log.location || log.location === 'Unknown Location') && log.lat && log.lng) {
                    log.location = `Lat: ${Number(log.lat).toFixed(4)}, Lng: ${Number(log.lng).toFixed(4)}`;
                }
                return log;
            });

            // ── Deduplication ──────────────────────────────────────────────────────
            // If Firestore has two documents for the same date & checkIn time (e.g.
            // caused by a sync-conflict or double-write), keep only the one with the
            // numerically highest ID (most recently written). sortedLogs is already
            // sorted descending by ID, so the first occurrence wins.
            const seen = new Set();
            const dedupedLogs = sortedLogs.filter(log => {
                const fingerprint = `${log.date}|${log.checkIn}`;
                if (seen.has(fingerprint)) return false;
                seen.add(fingerprint);
                return true;
            });
            // ──────────────────────────────────────────────────────────────────────

            try {
                const currentUserState = await AppDB.get('users', targetId);
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
                    dedupedLogs.unshift(virtualLog);
                }
            } catch (err) {
                console.warn("Could not fetch active status for logs", err);
            }

            return dedupedLogs.slice(0, 50);
        } catch (e) {
            console.warn("Optimized log fetch failed, falling back to simple filter", e);
            return [];
        }
    }

    async getAllLogs() {
        return await AppDB.getAll('attendance');
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

        const day = checkInDateObj.getDay();
        if (day === 0) {
            return { status: 'Present', dayCredit: 1, lateCountable: false, extraWorkedMs: 0 };
        }

        const checkInMins = (checkInDateObj.getHours() * 60) + checkInDateObj.getMinutes();
        const netHours = Math.max(0, durationMs) / (1000 * 60 * 60);

        const graceEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_CUTOFF_MINUTES : 555) || 555;
        const minorLateEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.MINOR_LATE_END_MINUTES : 615) || 615;
        const lateEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_END_MINUTES : 720) || 720;
        const postNoonEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.POST_NOON_END_MINUTES : 810) || 810;
        const afternoonStart = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.AFTERNOON_START_MINUTES : 720) || 720;

        let status = 'Present';
        let lateCountable = false;
        let extraWorkedMs = 0;

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
            if (netHours >= 8) {
                status = 'Present';
            } else if (netHours >= 4) {
                status = 'Half Day';
            } else {
                status = 'Absent';
            }
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

export const AppAttendance = new Attendance();
if (typeof window !== 'undefined') window.AppAttendance = AppAttendance;


