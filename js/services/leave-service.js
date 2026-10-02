// js/services/leave-service.js
// Centralized leave data access with caching.

const COLLECTION = 'leaves';

function _db() {
    return window.AppDB;
}

function _cfg() {
    return window.AppConfig;
}

export class LeaveService {
    constructor() {
        this._cacheKeyPrefix = 'svc_leaves';
    }

    _cacheKey(suffix) {
        return `${this._cacheKeyPrefix}_${suffix}`;
    }

    /**
     * Get all leave records with caching.
     */
    async getAll(opts = {}) {
        const db = _db();
        if (!db) return [];

        // Use existing AppLeaves module if available
        if (window.AppLeaves?.getAllLeaves) {
            return window.AppLeaves.getAllLeaves();
        }

        const ttl = (_cfg()?.READ_CACHE_TTLS?.attendanceSummary) || 60000;
        const cacheKey = db.getCacheKey(this._cacheKey('all'), COLLECTION, {});
        if (!opts.force) {
            return db.getCached(cacheKey, ttl, () => db.getAll(COLLECTION, opts));
        }
        return db.getAll(COLLECTION, opts);
    }

    /**
     * Get leaves for a specific user.
     */
    async getByUserId(userId, opts = {}) {
        const all = await this.getAll(opts);
        return all.filter(r => r.userId === userId);
    }

    /**
     * Get pending leaves awaiting approval.
     */
    async getPending(opts = {}) {
        const all = await this.getAll(opts);
        return all.filter(r => r.status === 'pending');
    }

    /**
     * Get a single leave record.
     */
    async get(recordId) {
        const db = _db();
        if (!db || !recordId) return null;
        return db.get(COLLECTION, recordId);
    }

    /**
     * Create or update a leave record.
     */
    async put(data) {
        const db = _db();
        if (!db) return false;
        return db.put(COLLECTION, data);
    }

    /**
     * Get leave balance for a user (computed from approved leaves).
     */
    async getBalance(userId, leaveType, opts = {}) {
        const all = await this.getByUserId(userId, opts);
        const approved = all.filter(r =>
            r.status === 'approved' &&
            (!leaveType || r.type === leaveType)
        );
        const totalDays = approved.reduce((sum, r) => sum + (r.days || 1), 0);
        return { totalDays, records: approved };
    }
}

export const AppLeaveService = new LeaveService();
if (typeof window !== 'undefined') window.AppLeaveService = AppLeaveService;
