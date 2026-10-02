// js/services/event-service.js
// Structured event capture pipeline for analytics and AI Center.
// Writes to 'events' and 'task_activity_events' collections.

function _db() {
    return window.AppDB;
}

function _auth() {
    return window.AppAuth;
}

function _now() {
    return Date.now();
}

function _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export class EventService {
    /**
     * Capture a generic event.
     * @param {string} type - Event type (e.g. 'checkin', 'checkout', 'leave_applied', 'task_completed')
     * @param {object} data - Event payload
     */
    async capture(type, data = {}) {
        const db = _db();
        if (!db) return;

        const user = _auth()?.getUser();
        const event = {
            type,
            userId: user?.id || null,
            username: user?.username || null,
            timestamp: _now(),
            date: _today(),
            ...data
        };

        try {
            await db.add('events', event);
        } catch (err) {
            console.warn('EventService.capture failed:', type, err);
        }
    }

    /**
     * Capture a task activity event (for Kanban board tracking).
     */
    async captureTaskEvent(taskId, action, details = {}) {
        const db = _db();
        if (!db) return;

        const user = _auth()?.getUser();
        const event = {
            taskId,
            action,
            userId: user?.id || null,
            username: user?.username || null,
            timestamp: _now(),
            date: _today(),
            ...details
        };

        try {
            await db.add('task_activity_events', event);
        } catch (err) {
            console.warn('EventService.captureTaskEvent failed:', action, err);
        }
    }

    /**
     * Capture an attendance event with location context.
     */
    async captureAttendance(action, attendanceData = {}) {
        await this.capture(`attendance_${action}`, {
            attendanceId: attendanceData.id,
            date: attendanceData.date,
            time: attendanceData.time,
            status: attendanceData.status,
            location: attendanceData.location || null
        });
    }

    /**
     * Capture a leave event.
     */
    async captureLeave(action, leaveData = {}) {
        await this.capture(`leave_${action}`, {
            leaveId: leaveData.id,
            type: leaveData.type,
            status: leaveData.status,
            days: leaveData.days,
            targetUserId: leaveData.userId
        });
    }

    /**
     * Capture a notification event (Telegram sent, etc.).
     */
    async captureNotification(channel, template, recipientCount = 0) {
        await this.capture('notification_sent', {
            channel,
            template,
            recipientCount
        });
    }

    /**
     * Capture a system event (cron job, migration, etc.).
     */
    async captureSystem(action, details = {}) {
        await this.capture(`system_${action}`, details);
    }

    /**
     * Get events for a date range.
     */
    async getByDateRange(fromDate, toDate) {
        const db = _db();
        if (!db) return [];

        if (db.queryMany) {
            try {
                return await db.queryMany('events', [
                    { field: 'date', operator: '>=', value: fromDate },
                    { field: 'date', operator: '<=', value: toDate }
                ]);
            } catch { /* fall through */ }
        }

        const all = await db.getAll('events').catch(() => []);
        return all.filter(e => e.date >= fromDate && e.date <= toDate);
    }

    /**
     * Get events for a specific user.
     */
    async getByUserId(userId) {
        const db = _db();
        if (!db) return [];
        const all = await db.getAll('events').catch(() => []);
        return all.filter(e => e.userId === userId);
    }

    /**
     * Get task activity events for a specific task.
     */
    async getTaskEvents(taskId) {
        const db = _db();
        if (!db) return [];
        const all = await db.getAll('task_activity_events').catch(() => []);
        return all.filter(e => e.taskId === taskId);
    }

    /**
     * Get events by type.
     */
    async getByType(type) {
        const db = _db();
        if (!db) return [];
        const all = await db.getAll('events').catch(() => []);
        return all.filter(e => e.type === type);
    }
}

export const AppEventService = new EventService();
if (typeof window !== 'undefined') window.AppEventService = AppEventService;
