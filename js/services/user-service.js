// js/services/user-service.js
// Centralized user data access with caching.

const COLLECTION = 'users';

function _db() {
    return window.AppDB;
}

function _cfg() {
    return window.AppConfig;
}

export class UserService {
    constructor() {
        this._cacheKeyPrefix = 'svc_users';
    }

    _cacheKey(suffix) {
        return `${this._cacheKeyPrefix}_${suffix}`;
    }

    /**
     * Get all users with caching.
     * @param {object} opts - { force: bool, silentPermissionDenied: bool }
     */
    async getAll(opts = {}) {
        const db = _db();
        if (!db) return [];
        const ttl = (_cfg()?.READ_CACHE_TTLS?.users) || 600000;
        const cacheKey = db.getCacheKey(this._cacheKey('all'), COLLECTION, {});
        if (!opts.force) {
            return db.getCached(cacheKey, ttl, () => db.getAll(COLLECTION, opts));
        }
        return db.getAll(COLLECTION, opts);
    }

    /**
     * Get a single user by ID.
     */
    async get(userId) {
        const db = _db();
        if (!db || !userId) return null;
        return db.get(COLLECTION, userId);
    }

    /**
     * Get users filtered by a predicate, with caching.
     */
    async getFiltered(filterFn, opts = {}) {
        const all = await this.getAll(opts);
        return all.filter(filterFn);
    }

    /**
     * Get active staff (non-demo, non-inactive).
     */
    async getActiveStaff(opts = {}) {
        const cfg = _cfg();
        return this.getFiltered(u => !cfg?.isDemoUser?.(u) && u.status !== 'inactive', opts);
    }

    /**
     * Get admins / HR.
     */
    async getAdmins(opts = {}) {
        return this.getFiltered(u => u.isAdmin || u.role === 'Administrator', opts);
    }

    /**
     * Get a user by username.
     */
    async getByUsername(username, opts = {}) {
        const all = await this.getAll(opts);
        return all.find(u => (u.username || '').toLowerCase() === String(username).toLowerCase()) || null;
    }

    /**
     * Get birthday people.
     */
    async getBirthdayPeople(opts = {}) {
        const db = _db();
        if (!db) return [];
        return db.getAll('birthday_people', { silentPermissionDenied: true, ...opts }).catch(() => []);
    }

    /**
     * Update a user document.
     */
    async update(userId, data) {
        const db = _db();
        if (!db) return false;
        return db.put(COLLECTION, { id: userId, ...data });
    }

    /**
     * Write a user document (full overwrite).
     */
    async put(data) {
        const db = _db();
        if (!db) return false;
        return db.put(COLLECTION, data);
    }
}

export const AppUserService = new UserService();
if (typeof window !== 'undefined') window.AppUserService = AppUserService;
