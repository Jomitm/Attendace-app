import { AppAuth } from './auth.js';
import { AppDB } from './db.js';
import { AppConfig } from '../config.js';
import { telegramNotifyCheckIn, telegramNotifyLateCheckIn, telegramNotifyCheckOut } from '../utils/telegram.js';
import { getLocalISO, toDateKeyFromValue, coerceEpochMs } from '../utils/date-helpers.js';

const hasValidCoordinatePair = (lat, lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
// Local-calendar-day key (UTC-safe). Delegates to the shared date helper so
// Date objects are keyed by their LOCAL calendar day, never by UTC.
const normalizeDateKey = (value) => toDateKeyFromValue(value);

export class Attendance {
    constructor() {
        this.logsCacheTtlMs = AppConfig?.READ_CACHE_TTLS?.attendanceSummary || 30000;
        this._idCounter = 0;
    }

    _nextId() {
        // Combine timestamp with a per-instance counter to prevent same-ms collisions
        this._idCounter = (this._idCounter + 1) % 100000;
        return String(Date.now()) + '_' + String(this._idCounter);
    }
    async getStatus() {
        // If AppAuth is already syncing in realtime, AppAuth.getUser() is likely more up-to-date
        // than a slow DB fetch. refreshCurrentUserFromDB now handles this optimization internally,
        // but we'll call it here to ensure we have the absolute latest known state.
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());

        if (!user) {
            return {
                status: 'out',
                lastCheckIn: null,
                isPaused: false,
                pauseStartedAt: null,
                totalPausedMs: 0
            };
        }

        if (user.status === 'in') {
            try {
                const priorMs = coerceEpochMs(user.lastCheckIn);
                if (priorMs === null) {
                    // Unparseable/legacy lastCheckIn — the session cannot be honored.
                    // Report it as stale so callers heal it instead of showing a phantom
                    // "checked in" state forever.
                    console.warn('getStatus: unparseable lastCheckIn, treating as stale session', typeof user.lastCheckIn);
                    return {
                        status: 'out',
                        lastCheckIn: null,
                        isPaused: false,
                        pauseStartedAt: null,
                        totalPausedMs: 0,
                        staleSession: true
                    };
                }
                const checkInDate = new Date(priorMs);
                const now = new Date();

                // Local calendar-day comparison (shared helper; timezone-safe)
                const localCheckInDate = getLocalISO(checkInDate);
                const localToday = getLocalISO(now);

                if (localCheckInDate < localToday) {
                    return {
                        status: 'out',
                        lastCheckIn: null,
                        isPaused: false,
                        pauseStartedAt: null,
                        totalPausedMs: 0,
                        staleSession: true
                    };
                }

                const hasCheckout = await this.hasRecordedCheckoutForSession(user.id, checkInDate, now);
                if (hasCheckout) {
                    const healedUser = {
                        ...user,
                        status: 'out',
                        lastCheckIn: null,
                        isPaused: false,
                        pauseStartedAt: null,
                        totalPausedMs: 0
                    };
                    try {
                        await AppDB.put('users', healedUser);
                    } catch (healErr) {
                        console.warn('Failed to self-heal stale checked-in status from attendance logs:', healErr);
                    }
                    if (AppAuth) {
                        AppAuth.currentUser = healedUser;
                    }
                    return {
                        status: 'out',
                        lastCheckIn: null,
                        isPaused: false,
                        pauseStartedAt: null,
                        totalPausedMs: 0,
                        healedFromAttendanceLog: true
                    };
                }
            } catch (e) {
                console.warn("Date parsing error in getStatus:", e);
            }
        }

        return {
            status: user.status || 'out',
            lastCheckIn: user.lastCheckIn,
            isPaused: user.isPaused === true,
            pauseStartedAt: user.pauseStartedAt || null,
            totalPausedMs: Number(user.totalPausedMs) || 0
        };
    }

    async checkIn(latitude, longitude, address = 'Unknown Location', options = {}) {
        // Preload holiday cache so evaluateAttendanceStatus can check configured holidays
        if (typeof window.AppAnalytics?.preloadHolidayCache === 'function') {
            window.AppAnalytics.preloadHolidayCache().catch(() => {});
        }
        if (!hasValidCoordinatePair(latitude, longitude)) {
            throw new Error('Location is required for check-in. Please enable location and try again.');
        }
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());
        if (!user) throw new Error("User not authenticated");

        const locationString = address && address !== 'Unknown Location'
            ? address
            : (latitude && longitude ? `Lat: ${Number(latitude).toFixed(4)}, Lng: ${Number(longitude).toFixed(4)}` : 'Unknown Location');

        // --- Transactional conflict detection + user write ---
        // Wraps read-check-write in a single Firestore transaction so two
        // devices cannot both succeed when checking in simultaneously.
        const txResult = await AppDB.transactionalUserUpdate(user.id, async (txUser) => {
            const now = new Date();
            const cu = txUser || user; // fallback to pre-read if tx doc missing

            if (cu.status === 'in') {
                const priorMs = coerceEpochMs(cu.lastCheckIn);
                if (priorMs === null) {
                    // Corrupt/legacy lastCheckIn: clear the stuck "in" status atomically
                    // here rather than reporting a permanent cross-device conflict.
                    console.warn('checkIn: unparseable lastCheckIn on user doc; clearing stuck status');
                    const healed = { ...cu };
                    healed.status = 'out';
                    healed.lastCheckIn = null;
                    healed.isPaused = false;
                    healed.pauseStartedAt = null;
                    healed.totalPausedMs = 0;
                    healed.pauseEvents = [];
                    return { ok: true, user: healed, clearedCorruptSession: true };
                }

                const priorCheckInTime = new Date(priorMs);
                const priorLocalDate = getLocalISO(priorCheckInTime);
                const todayLocalDate = getLocalISO(now);

                if (priorLocalDate < todayLocalDate) {
                    // Stale session from yesterday — heal outside transaction (needs attendance log write)
                    return { ok: false, staleSession: true, user: cu };
                }

                // Same-day conflict: another device already checked in
                return {
                    ok: false,
                    conflict: true,
                    message: 'Already checked in on another device. Status will sync shortly.'
                };
            }

            // Safe to check in — atomically set status
            const updatedUser = { ...cu };
            updatedUser.status = 'in';
            updatedUser.lastCheckIn = Date.now();
            updatedUser.isPaused = false;
            updatedUser.pauseStartedAt = null;
            updatedUser.totalPausedMs = 0;
            updatedUser.pauseEvents = [];
            updatedUser.currentLocation = { lat: latitude, lng: longitude, address: locationString };
            updatedUser.currentBudgetHeadId = String(options.budgetHeadId || updatedUser.currentBudgetHeadId || 'UNALLOCATED');
            updatedUser.currentBudgetHeadUnallocatedReason = String(options.unallocatedReason || '');

            return { ok: true, user: updatedUser };
        });

        // Handle transactional outcomes
        if (txResult && txResult.conflict) {
            return { ok: false, conflict: true, message: txResult.message || 'Status updated from another device.' };
        }

        // Handle stale session (yesterday's open session) — needs attendance log write outside tx
        let resolvedMissedCheckout = false;
        let noticeMessage = '';
        let missedCheckoutLogId = null;
        let missedCheckoutDate = null;

        if (txResult && txResult.staleSession) {
            const cu = txResult.user;
            const priorMs = coerceEpochMs(cu.lastCheckIn);
            // Defensive: the transaction only flags staleSession for parseable timestamps,
            // but never fabricate data if something slipped through.
            const canFabricateClosure = priorMs !== null;
            const priorCheckInTime = new Date(priorMs ?? 0);
            const priorSessionCheckoutLogged = canFabricateClosure
                ? await this.hasRecordedCheckoutForSession(cu.id, priorCheckInTime, new Date())
                : false;
            if (priorSessionCheckoutLogged || !canFabricateClosure) {
                cu.status = 'out';
                cu.lastCheckIn = null;
                cu.isPaused = false;
                cu.pauseStartedAt = null;
                cu.totalPausedMs = 0;
                cu.pauseEvents = [];
                cu.currentLocation = null;
                cu.locationMismatched = false;
                noticeMessage = priorSessionCheckoutLogged
                    ? 'Recovered previous checkout record and cleared stale session status.'
                    : 'Cleared a stale session with unreadable check-in data.';
            } else {
                const fixedDurationMs = 4 * 60 * 60 * 1000;
                let effectiveDurationMs = fixedDurationMs;
                let priorCheckOutTime = new Date(priorCheckInTime.getTime() + fixedDurationMs);
                // Clamp the synthetic checkout to the end of the session's own calendar day
                // so the fabricated record never spills into the next day.
                const endOfSessionDay = new Date(priorCheckInTime);
                endOfSessionDay.setHours(23, 59, 59, 999);
                if (priorCheckOutTime > endOfSessionDay) {
                    priorCheckOutTime = endOfSessionDay;
                    effectiveDurationMs = Math.max(0, endOfSessionDay.getTime() - priorCheckInTime.getTime());
                }
                const statusMeta = {
                    status: 'Half Day',
                    dayCredit: this.getDayCredit('Half Day'),
                    lateCountable: false,
                    extraWorkedMs: 0
                };
                const priorLocation = cu.currentLocation || cu.lastLocation || null;
                const closureTimestamp = new Date().toISOString();
                // Attribute the closure to the SESSION's date (check-in day), not the
                // synthetic checkout moment, so credit lands on the day actually worked.
                const closuredDate = getLocalISO(priorCheckInTime);
                // Deterministic id makes the closure write idempotent across devices/retries:
                // a repeated run upserts the same document instead of appending duplicates.
                const missedLog = {
                    id: `missed_${cu.id}_${closuredDate}`,
                    user_id: cu.id,
                    date: closuredDate,
                    checkInAt: priorCheckInTime.getTime(),
                    checkOutAt: priorCheckOutTime.getTime(),
                    checkIn: priorCheckInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    checkOut: priorCheckOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    duration: this.msToTime(effectiveDurationMs),
                    durationMs: effectiveDurationMs,
                    type: statusMeta.status,
                    dayCredit: statusMeta.dayCredit,
                    lateCountable: statusMeta.lateCountable,
                    extraWorkedMs: options.extraTimeConfirmedMs || statusMeta.extraWorkedMs || 0,
                    policyVersion: 'v2',
                    location: priorLocation?.address || 'Missed checkout session',
                    lat: priorLocation?.lat ?? null,
                    lng: priorLocation?.lng ?? null,
                    checkOutLocation: 'System closure on next check-in',
                    outLat: null,
                    outLng: null,
                    workDescription: 'System closure: missed checkout auto-closed as half day. Reason required on next login.',
                    locationMismatched: false,
                    locationExplanation: '',
                    activityScore: 0,
                    autoCheckout: true,
                    autoCheckoutReason: 'missed_checkout_next_login',
                    autoCheckoutAt: closureTimestamp,
                    autoCheckoutRequiresApproval: false,
                    autoCheckoutExtraApproved: null,
                    missedCheckoutResolved: true,
                    missedCheckoutPolicy: 'half_day_on_missed_checkout',
                    missedCheckoutReasonRequired: true,
                    missedCheckoutReasonStatus: 'pending',
                    missedCheckoutReason: '',
                    missedCheckoutReasonSubmittedAt: null,
                    missedCheckoutReviewedBy: '',
                    missedCheckoutReviewedAt: '',
                    missedCheckoutReviewNote: '',
                    systemClosedAt: closureTimestamp,
                    synced: false
                };
                await AppDB.add('attendance', missedLog);
                missedCheckoutLogId = missedLog.id;
                missedCheckoutDate = missedLog.date;

                cu.status = 'out';
                cu.lastCheckOut = priorCheckOutTime.getTime();
                cu.lastLocation = priorLocation;
                cu.lastCheckOutLocation = { lat: null, lng: null, address: 'System closure on next check-in' };
                cu.locationMismatched = false;
                cu.lastCheckIn = null;
                cu.isPaused = false;
                cu.pauseStartedAt = null;
                cu.totalPausedMs = 0;
                cu.pauseEvents = [];
                cu.currentLocation = null;

                resolvedMissedCheckout = true;
                noticeMessage = 'Previous open session was closed as half day because checkout was missed. Please submit a reason for admin verification.';
            }

            // Re-run transaction with healed user to actually perform the check-in
            const reTxResult = await AppDB.transactionalUserUpdate(cu.id, async (reTxUser) => {
                const current = reTxUser || cu;
                const healed = { ...current };
                healed.status = 'in';
                healed.lastCheckIn = Date.now();
                healed.isPaused = false;
                healed.pauseStartedAt = null;
                healed.totalPausedMs = 0;
                healed.pauseEvents = [];
                healed.currentLocation = { lat: latitude, lng: longitude, address: locationString };
                healed.currentBudgetHeadId = String(options.budgetHeadId || healed.currentBudgetHeadId || 'UNALLOCATED');
                healed.currentBudgetHeadUnallocatedReason = String(options.unallocatedReason || '');
                return { ok: true, user: healed };
            });
            if (reTxResult && reTxResult.conflict) {
                return { ok: false, conflict: true, message: reTxResult.message || 'Conflict during recovery.' };
            }
        }

        // Telegram notification (fire-and-forget)
        try {
            const userName = user.name || user.id || 'Staff';
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const hour = now.getHours();
            const minute = now.getMinutes();
            const isLate = hour > 10 || (hour === 10 && minute > 0);
            if (isLate) {
                telegramNotifyLateCheckIn(userName, timeStr);
            } else {
                telegramNotifyCheckIn(userName, timeStr);
            }
            // Also notify Jomit personally for late cases (if Jomit is linked and not the same user)
            if (isLate) {
                try {
                    const users = await AppDB.getAll('users');
                    const jomit = users.find(u => String(u.username).toLowerCase() === 'jomit' || String(u.name).toLowerCase() === 'jomit mathew');
                    const jomitChat = jomit?.telegramChatId ? String(jomit.telegramChatId).trim() : '';
                    const userChat = String(user.telegramChatId || '').trim();
                    if (jomitChat && jomitChat !== userChat) {
                        fetch('/api/telegram-send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chatId: jomitChat, text: `⚠️ <b>${userName}</b> checked in LATE at ${timeStr} — notifying you as owner` })
                        }).catch(() => {});
                    }
                } catch {}
            }
        } catch { /* best-effort */ }

        return {
            ok: true,
            resolvedMissedCheckout,
            noticeMessage,
            missedCheckoutReasonRequired: resolvedMissedCheckout,
            missedCheckoutLogId,
            missedCheckoutDate
        };
    }

    async pauseSession() {
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());
        if (!user) throw new Error("User not authenticated");

        const txResult = await AppDB.transactionalUserUpdate(user.id, async (txUser) => {
            const cu = txUser || user;
            if (cu.status !== 'in') {
                return { ok: false, conflict: true, message: 'Status updated from another device.' };
            }
            if (cu.isPaused === true) {
                return { ok: false, conflict: true, message: 'Session is already paused.' };
            }
            const now = Date.now();
            const events = Array.isArray(cu.pauseEvents) ? cu.pauseEvents.slice(-99) : [];
            events.push({ type: 'pause', at: new Date(now).toISOString(), atMs: now });
            const updated = { ...cu };
            updated.isPaused = true;
            updated.pauseStartedAt = now;
            updated.totalPausedMs = Number(cu.totalPausedMs) || 0;
            updated.pauseEvents = events;
            return { ok: true, user: updated };
        });
        return txResult || { ok: false, conflict: true, message: 'Transaction failed.' };
    }

    async resumeSession() {
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());
        if (!user) throw new Error("User not authenticated");

        const txResult = await AppDB.transactionalUserUpdate(user.id, async (txUser) => {
            const cu = txUser || user;
            if (cu.status !== 'in') {
                return { ok: false, conflict: true, message: 'Status updated from another device.' };
            }
            if (cu.isPaused !== true) {
                return { ok: false, conflict: true, message: 'Session is not paused.' };
            }
            const now = Date.now();
            const pauseStartMs = Number(cu.pauseStartedAt) || now;
            const resumedMs = Math.max(0, now - pauseStartMs);
            const events = Array.isArray(cu.pauseEvents) ? cu.pauseEvents.slice(-99) : [];
            events.push({ type: 'resume', at: new Date(now).toISOString(), atMs: now });
            const updated = { ...cu };
            updated.totalPausedMs = (Number(cu.totalPausedMs) || 0) + resumedMs;
            updated.isPaused = false;
            updated.pauseStartedAt = null;
            updated.pauseEvents = events;
            return { ok: true, user: updated, resumedPausedMs: resumedMs, totalPausedMs: updated.totalPausedMs };
        });
        if (txResult && txResult.ok) {
            return { ok: true, resumedPausedMs: txResult.resumedPausedMs, totalPausedMs: txResult.totalPausedMs };
        }
        return txResult || { ok: false, conflict: true, message: 'Transaction failed.' };
    }

    async checkOut(description = '', lat = null, lng = null, address = 'Detected Location', locationMismatched = false, explanation = '', options = {}) {
        // Preload holiday cache so evaluateAttendanceStatus can check configured holidays
        if (typeof window.AppAnalytics?.preloadHolidayCache === 'function') {
            window.AppAnalytics.preloadHolidayCache().catch(() => {});
        }
        if (!options.autoCheckout && !hasValidCoordinatePair(lat, lng)) {
            throw new Error('Location is required for check-out. Please enable location and try again.');
        }
        const user = await (AppAuth.refreshCurrentUserFromDB
            ? AppAuth.refreshCurrentUserFromDB()
            : AppAuth.getUser());
        if (!user) throw new Error("User not authenticated");

        // --- Transactional conflict detection + user write ---
        const txResult = await AppDB.transactionalUserUpdate(user.id, async (txUser) => {
            const cu = txUser || user;
            if (cu.status !== 'in') {
                return { ok: false, conflict: true, message: 'Already checked out on another device.' };
            }
            // Snapshot data needed for the attendance log before we mutate
            const snapshot = {
                lastCheckIn: cu.lastCheckIn,
                totalPausedMs: Number(cu.totalPausedMs) || 0,
                pauseStartedAt: Number(cu.pauseStartedAt) || 0,
                isPaused: cu.isPaused === true,
                pauseEvents: Array.isArray(cu.pauseEvents) ? cu.pauseEvents : [],
                currentLocation: cu.currentLocation || null,
                currentBudgetHeadId: cu.currentBudgetHeadId || 'UNALLOCATED',
                currentBudgetHeadUnallocatedReason: cu.currentBudgetHeadUnallocatedReason || ''
            };
            const updated = { ...cu };
            updated.status = 'out';
            updated.lastCheckOut = Date.now();
            updated.lastLocation = cu.currentLocation;
            updated.lastCheckOutLocation = { lat, lng, address };
            updated.locationMismatched = locationMismatched;
            updated.lastCheckIn = null;
            updated.isPaused = false;
            updated.pauseStartedAt = null;
            updated.totalPausedMs = 0;
            updated.pauseEvents = [];
            updated.currentLocation = null;
            updated.currentBudgetHeadId = null;
            updated.currentBudgetHeadUnallocatedReason = '';
            return { ok: true, user: updated, snapshot };
        });

        // Validate transaction result before processing
        if (!txResult) {
            return { ok: false, conflict: true, message: 'Network error. Please try again.' };
        }
        
        if (txResult.error) {
            return { ok: false, conflict: true, message: txResult.error };
        }
        
        if (txResult && txResult.conflict) {
            return { ok: false, conflict: true, message: txResult.message || 'Status updated from another device.' };
        }
        
        if (!txResult.snapshot) {
            return { ok: false, conflict: true, message: 'Sync error. Please try again.' };
        }

        // Build attendance log using snapshot from the transaction
        const snap = txResult.snapshot;
        const checkInTime = new Date(snap.lastCheckIn);
        const checkOutTime = options.checkOutTime ? new Date(options.checkOutTime) : new Date();
        const checkInMs = checkInTime.getTime();
        const checkOutMs = checkOutTime.getTime();
        const basePausedMs = snap.totalPausedMs;
        const pauseStartMs = snap.pauseStartedAt;
        let autoClosedPauseMs = 0;
        if (snap.isPaused && pauseStartMs > 0 && checkOutMs > pauseStartMs) {
            autoClosedPauseMs = checkOutMs - pauseStartMs;
        }
        const totalPausedMs = Math.max(0, basePausedMs + autoClosedPauseMs);
        const rawDurationMs = Math.max(0, (checkOutMs - checkInMs) - totalPausedMs);
        const statusMeta = this.evaluateAttendanceStatus(checkInTime, rawDurationMs);

        let displayDurationMs = rawDurationMs;
        const confirmedExtra = Number(options.extraTimeConfirmedMs) || 0;
        if (confirmedExtra > 0) {
            const shiftBase = 8 * 60 * 60 * 1000;
            displayDurationMs = shiftBase + confirmedExtra;
        }
        const durationMs = displayDurationMs;

        const activityStats = window.AppActivity ? window.AppActivity.getStats() : { score: 0 };
        const pauseEvents = snap.pauseEvents.slice();
        if (autoClosedPauseMs > 0) {
            pauseEvents.push({ type: 'resume', at: checkOutTime.toISOString(), atMs: checkOutMs, autoClosedOnCheckout: true });
        }
        const pauseCount = pauseEvents.filter(evt => evt && evt.type === 'pause').length;

        // Session-scoped dedup: if a record with the same checkInAt (±60s) already exists, this is a double-submit/retry — don't create a duplicate.
        try {
            if (AppDB.queryMany) {
                const existing = await AppDB.queryMany('attendance', [{ field: 'user_id', operator: '==', value: user.id }], { limit: 20 });
                if (Array.isArray(existing)) {
                    const dup = existing.find((r) => {
                        const v = Number(r.checkInAt);
                        return Number.isFinite(v) && Math.abs(v - checkInMs) < 60000;
                    });
                    if (dup) {
                        if (window.AppActivity) window.AppActivity.stop();
                        return { ok: true, conflict: false, deduped: true, existingId: dup.id };
                    }
                }
            }
        } catch { /* best-effort dedup */ }

        const log = {
            id: this._nextId(),
            user_id: user.id,
            date: getLocalISO(checkOutTime),
            checkInAt: checkInMs,
            checkOutAt: checkOutMs,
            checkIn: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOut: checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: this.msToTime(durationMs),
            durationMs: durationMs,
            pausedMs: totalPausedMs,
            pauseCount: pauseCount,
            pauseEvents: pauseEvents,
            type: statusMeta.status,
            dayCredit: statusMeta.dayCredit,
            lateCountable: statusMeta.lateCountable,
            extraWorkedMs: confirmedExtra > 0 ? confirmedExtra : (statusMeta.extraWorkedMs || 0),
            policyVersion: 'v2',
            location: snap.currentLocation?.address || 'Checked In Location',
            lat: snap.currentLocation?.lat,
            lng: snap.currentLocation?.lng,
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
            extraTimePrompted: !!options.extraTimePrompted,
            extraTimeJustification: options.extraTimeJustification || '',
            extraTimeMode: options.extraTimeMode || '',
            extraTimeConfirmedMs: options.extraTimeConfirmedMs || 0,
            extraTimeAutoAllowed: !!options.extraTimeAutoAllowed,
            extraTimeAutoAllowedMs: options.extraTimeAutoAllowedMs || 0,
            taskUpdates: Array.isArray(options.taskUpdates) ? options.taskUpdates : [],
            budgetHeadId: String(options.budgetHeadId || snap.currentBudgetHeadId || 'UNALLOCATED'),
            budgetHeadUnallocatedReason: String(options.budgetHeadUnallocatedReason || ''),
            validationStatus: String(options.validationStatus || 'compliant'),
            validationErrors: Array.isArray(options.validationErrors) ? options.validationErrors : [],
            taskUpdatesSubmittedAt: options.taskUpdatesSubmittedAt || null,
            entrySource: 'checkin_checkout',
            attendanceEligible: true,
            synced: false
        };

        await AppDB.add('attendance', log);

        if (window.AppActivity) window.AppActivity.stop();

        // Telegram notification (fire-and-forget)
        try {
            const userName = user.name || user.id || 'Staff';
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            telegramNotifyCheckOut(userName, timeStr);
        } catch { /* best-effort */ }

        return {
            ok: true,
            conflict: false
        };
    }

    async addAdminLog(userId, logData) {
        const newLog = {
            id: this._nextId(),
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
            id: this._nextId(),
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

    async getLogs(userId = null, options = {}) {
        const targetId = userId || AppAuth.getUser()?.id;
        if (!targetId) return [];

        const startDate = normalizeDateKey(options?.startDate);
        const endDate = normalizeDateKey(options?.endDate);
        const limitValue = Number(options?.limit);
        const normalizedLimit = Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 50;
        const cacheKey = AppDB.getCacheKey("attendanceLogs", "attendance", {
            targetId: String(targetId),
            startDate,
            endDate,
            limit: normalizedLimit,
            source: String(options?.source || "").trim().toLowerCase()
        });

        try {
            return await AppDB.getCached(cacheKey, this.logsCacheTtlMs, async () => {
                let userLogs = [];
                if (AppDB.queryMany) {
                    const filters = [{ field: "user_id", operator: "==", value: targetId }];
                    if (startDate) filters.push({ field: "date", operator: ">=", value: startDate });
                    if (endDate) filters.push({ field: "date", operator: "<=", value: endDate });
                    userLogs = await AppDB.queryMany("attendance", filters).catch(() => []);
                }

                if (!Array.isArray(userLogs) || userLogs.length === 0) {
                    const db = window.AppFirestore;
                    if (!db) return [];
let query = db.collection("attendance").where("user_id", "==", targetId);
if (startDate) query = query.where("date", ">=", startDate);
if (endDate) query = query.where("date", "<=", endDate);
const snapshot = await query.get();
userLogs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                }

                const sortedLogs = (userLogs || []).sort((a, b) => String(b.id || "").localeCompare(String(a.id || ""))).map((log) => {
                    const nextLog = { ...log };
                    if ((!nextLog.location || nextLog.location === "Unknown Location") && nextLog.lat && nextLog.lng) {
                        nextLog.location = "Lat: " + Number(nextLog.lat).toFixed(4) + ", Lng: " + Number(nextLog.lng).toFixed(4);
                    }
                    return nextLog;
                });

                const seen = new Set();
                const dedupedLogs = sortedLogs.filter((log) => {
                    const fingerprint = String(log.date || "") + "|" + String(log.checkIn || "");
                    if (seen.has(fingerprint)) return false;
                    seen.add(fingerprint);
                    return true;
                });

                try {
                    const currentUserState = await AppDB.get("users", targetId);
                    const activeSessionMs = currentUserState && currentUserState.status === "in" ? coerceEpochMs(currentUserState.lastCheckIn) : null;
                    if (activeSessionMs !== null) {
                        const checkInTime = new Date(activeSessionMs);
                        const virtualDate = getLocalISO(checkInTime);
                        const virtualLog = {
                            id: "active_now",
                            date: virtualDate,
                            checkInAt: activeSessionMs,
                            checkIn: checkInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            checkOut: "Active Now",
                            duration: "Working...",
                            type: "Office",
                            location: currentUserState.currentLocation?.address && currentUserState.currentLocation.address !== "Unknown Location"
                                ? currentUserState.currentLocation.address
                                : (currentUserState.currentLocation?.lat && currentUserState.currentLocation?.lng
                                    ? "Lat: " + Number(currentUserState.currentLocation.lat).toFixed(4) + ", Lng: " + Number(currentUserState.currentLocation.lng).toFixed(4)
                                    : "Current Session")
                        };
                        const withinRange = (!startDate || virtualDate >= startDate) && (!endDate || virtualDate <= endDate);
                        if (withinRange) dedupedLogs.unshift(virtualLog);
                    }
                } catch (err) {
                    console.warn("Could not fetch active status for logs", err);
                }

                return dedupedLogs.slice(0, normalizedLimit);
            });
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
        let hours = Math.floor(duration / (1000 * 60 * 60));
        return `${hours}h ${minutes}m`;
    }

    async hasRecordedCheckoutForSession(userId, sessionStart, sessionEnd = new Date()) {
        if (!userId || !(sessionStart instanceof Date) || Number.isNaN(sessionStart.getTime())) return false;

        try {
            const logs = await AppDB.query('attendance', 'user_id', '==', userId);
            if (!Array.isArray(logs) || logs.length === 0) return false;

            const toleranceMs = 5 * 60 * 1000;
            const checkInAnchor = new Date(sessionStart);
            checkInAnchor.setSeconds(0, 0);
            const maxEnd = (sessionEnd instanceof Date && !Number.isNaN(sessionEnd.getTime()))
                ? sessionEnd.getTime() + toleranceMs
                : Date.now() + toleranceMs;

            return logs.some((log) => {
                if (!log || !log.checkOut || log.checkOut === 'Active Now') return false;
                if (log.autoCheckout && log.autoCheckoutReason === 'missed_checkout_next_login') return false;

                const logCheckIn = this.buildDateTime(log.date, log.checkIn);
                const logCheckOut = this.buildDateTime(log.date, log.checkOut);
                if (!logCheckIn || !logCheckOut) return false;
                if (logCheckOut.getTime() < logCheckIn.getTime()) return false;

                const logCheckInAnchor = new Date(logCheckIn);
                logCheckInAnchor.setSeconds(0, 0);
                const sameSessionStart = Math.abs(logCheckInAnchor.getTime() - checkInAnchor.getTime()) <= toleranceMs;
                if (!sameSessionStart) return false;

                const checkOutTime = logCheckOut.getTime();
                return checkOutTime >= sessionStart.getTime() && checkOutTime <= maxEnd;
            });
        } catch (error) {
            console.warn('Failed to verify prior checkout record before auto-closing session:', error);
            return false;
        }
    }

    buildDateTime(dateStr, timeStr) {
        if (!dateStr || !timeStr) return null;

        const dateValue = String(dateStr).trim();
        const timeValue = String(timeStr).trim();
        const dateOnly = new Date(`${dateValue}T00:00:00`);
        if (Number.isNaN(dateOnly.getTime())) return null;

        const time24 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (time24) {
            const hours = Number(time24[1]);
            const minutes = Number(time24[2]);
            const seconds = Number(time24[3] || 0);
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return null;
            dateOnly.setHours(hours, minutes, seconds, 0);
            return dateOnly;
        }

        const time12 = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);
        if (time12) {
            let hours = Number(time12[1]);
            const minutes = Number(time12[2]);
            const seconds = Number(time12[3] || 0);
            const meridiem = String(time12[4] || '').toUpperCase();
            if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return null;
            if (hours === 12) hours = 0;
            if (meridiem === 'PM') hours += 12;
            dateOnly.setHours(hours, minutes, seconds, 0);
            return dateOnly;
        }

        const fallback = new Date(`${dateValue}T${timeValue}`);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
    }

    normalizeType(rawType) {
        const type = String(rawType || '').trim();
        if (!type || type === 'Manual') return 'Present';
        if (type === 'Manual/WFH') return 'Work - Home';
        const compact = type.toLowerCase().replace(/\s+/g, '');
        if (compact === 'wfh' || compact === 'workfromhome' || compact === 'work-home') return 'Work - Home';
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
        // On non-working days (Sunday, off-Saturdays, holidays) all worked hours count as extra
        const isNonWorkingDay = day === 0
            || (day === 6 && typeof AppConfig.IS_SATURDAY_OFF === 'function' && AppConfig.IS_SATURDAY_OFF(checkInDateObj))
            || (typeof window.AppAnalytics?.isConfiguredHoliday === 'function'
                && window.AppAnalytics.isConfiguredHoliday(
                    `${checkInDateObj.getFullYear()}-${String(checkInDateObj.getMonth() + 1).padStart(2, '0')}-${String(checkInDateObj.getDate()).padStart(2, '0')}`));
        if (isNonWorkingDay) {
            return { status: 'Present', dayCredit: 1, lateCountable: false, extraWorkedMs: Math.max(0, durationMs) };
        }

        const checkInMins = (checkInDateObj.getHours() * 60) + checkInDateObj.getMinutes();
        const netHours = Math.max(0, durationMs) / (1000 * 60 * 60);

        const graceEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_CUTOFF_MINUTES : 555) || 555;
        const minorLateEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.MINOR_LATE_END_MINUTES : 615) || 615;
        const _lateEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.LATE_END_MINUTES : 720) || 720;
        const postNoonEnd = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.POST_NOON_END_MINUTES : 810) || 810;
        const afternoonStart = (typeof AppConfig !== 'undefined' && AppConfig ? AppConfig.AFTERNOON_START_MINUTES : 720) || 720;

        let status = 'Present';
        let lateCountable = false;
        let extraWorkedMs = 0;

        if (checkInMins >= afternoonStart && checkInMins <= postNoonEnd) {
            // Afternoon session: noon to 1:30 PM
            if (netHours >= 8) {
                status = 'Present';
                extraWorkedMs = Math.max(0, durationMs - (8 * 60 * 60 * 1000));
            } else if (netHours >= 4) {
                status = 'Half Day';
            } else {
                status = 'Absent';
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
        } else if (checkInMins > minorLateEnd) {
            status = netHours >= 4 ? 'Half Day' : 'Absent';
        } else if (checkInMins > graceEnd) {
            lateCountable = true;
            if (netHours >= 8) {
                status = 'Present (Late Waived)';
            } else {
                status = 'Late';
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

        // Compute extraWorkedMs for pre-noon check-ins
        if (netHours > 8) {
            extraWorkedMs = Math.max(0, durationMs - (8 * 60 * 60 * 1000));
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
