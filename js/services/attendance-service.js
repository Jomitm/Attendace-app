// js/services/attendance-service.js
// Centralized attendance data access with caching.

const COLLECTION = 'attendance';

function _db() {
    return window.AppDB;
}

function _cfg() {
    return window.AppConfig;
}

export class AttendanceService {
    constructor() {
        this._cacheKeyPrefix = 'svc_attendance';
    }

    _cacheKey(suffix) {
        return `${this._cacheKeyPrefix}_${suffix}`;
    }

    /**
     * Get all attendance logs with caching.
     */
    async getAll(opts = {}) {
        const db = _db();
        if (!db) return [];
        if (opts.force) {
            // Bypass both service cache and Firestore persistence — read from server
            return db.getAll(COLLECTION, { source: 'server' });
        }
        const ttl = (_cfg()?.READ_CACHE_TTLS?.attendanceSummary) || 60000;
        const cacheKey = db.getCacheKey(this._cacheKey('all'), COLLECTION, {});
        return db.getCached(cacheKey, ttl, () => db.getAll(COLLECTION, { source: 'server' }));
    }

    /**
     * Get attendance logs for a specific user.
     */
    async getByUserId(userId, opts = {}) {
        const all = await this.getAll(opts);
        return all.filter(r => r.user_id === userId);
    }

    /**
     * Get attendance logs for a specific date range.
     */
    async getByDateRange(fromDate, toDate, opts = {}) {
        const db = _db();
        if (!db) return [];

        if (db.queryMany) {
            try {
                const result = await db.queryMany(COLLECTION, [
                    { field: 'date', operator: '>=', value: fromDate },
                    { field: 'date', operator: '<=', value: toDate }
                ], { source: 'server' });
                if (result.length > 0) return result;
            } catch {
                // fall through to getAll
            }
        }

        const all = await this.getAll(opts);
        return all.filter(r => r.date >= fromDate && r.date <= toDate);
    }

    /**
     * Get attendance for a specific date.
     */
    async getByDate(date, opts = {}) {
        const db = _db();
        if (!db) return [];

        if (db.queryMany) {
            try {
                const result = await db.queryMany(COLLECTION, [
                    { field: 'date', operator: '==', value: date }
                ]);
                if (result.length > 0) return result;
                // fall through to getAll
            } catch { /* fall through */ }
        }

        const all = await this.getAll(opts);
        return all.filter(r => r.date === date);
    }

    /**
     * Get a single attendance record by ID.
     */
    async get(recordId) {
        const db = _db();
        if (!db || !recordId) return null;
        return db.get(COLLECTION, recordId);
    }

    /**
     * Create or update an attendance record.
     */
    async put(data) {
        const db = _db();
        if (!db) return false;
        return db.put(COLLECTION, data);
    }

    /**
     * Get all location audits.
     */
    async getLocationAudits(opts = {}) {
        const db = _db();
        if (!db) return [];
        return db.getAll('location_audits', opts).catch(() => []);
    }

    /**
     * Clear cached attendance logs so subsequent reads fetch fresh data.
     * Called after check-in / check-out to invalidate stale cache.
     */
    invalidateCache() {
        const db = _db();
        if (!db || typeof db.invalidateCollectionCache !== 'function') return;
        db.invalidateCollectionCache(COLLECTION);
    }
}

export const AppAttendanceService = new AttendanceService();
if (typeof window !== 'undefined') window.AppAttendanceService = AppAttendanceService;
