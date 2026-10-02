// js/services/minutes-service.js
// Centralized minutes (meeting notes) data access with caching.

const COLLECTION = 'minutes';

function _db() {
    return window.AppDB;
}

export class MinutesService {
    constructor() {
        this._cacheKeyPrefix = 'svc_minutes';
    }

    _cacheKey(suffix) {
        return `${this._cacheKeyPrefix}_${suffix}`;
    }

    /**
     * Get all minutes with caching.
     */
    async getAll(opts = {}) {
        const db = _db();
        if (!db) return [];
        const cacheKey = db.getCacheKey(this._cacheKey('all'), COLLECTION, {});
        return db.getCached(cacheKey, 60000, () => db.getAll(COLLECTION, opts));
    }

    /**
     * Get minutes for a specific date.
     */
    async getByDate(date, opts = {}) {
        const all = await this.getAll(opts);
        return all.filter(m => m.date === date);
    }

    /**
     * Get a single minute record.
     */
    async get(recordId) {
        const db = _db();
        if (!db || !recordId) return null;
        return db.get(COLLECTION, recordId);
    }

    /**
     * Create or update a minute record.
     */
    async put(data) {
        const db = _db();
        if (!db) return false;
        return db.put(COLLECTION, data);
    }

    /**
     * Delete a minute record.
     */
    async remove(recordId) {
        const db = _db();
        if (!db) return false;
        return db.delete(COLLECTION, recordId);
    }
}

export const AppMinutesService = new MinutesService();
if (typeof window !== 'undefined') window.AppMinutesService = AppMinutesService;
