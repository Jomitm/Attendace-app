// js/services/analytics-service.js
// Centralized analytics and summary data access.

function _db() {
    return window.AppDB;
}

function _cfg() {
    return window.AppConfig;
}

export class AnalyticsService {
    /**
     * Get daily summaries with caching.
     */
    async getDailySummaries(opts = {}) {
        const db = _db();
        if (!db) return [];
        const ttl = (_cfg()?.READ_CACHE_TTLS?.dailySummaryReadMs) || 120000;
        const cacheKey = db.getCacheKey('svc_analytics_dailySummaries', 'daily_summaries', {});
        return db.getCached(cacheKey, ttl, () => db.getAll('daily_summaries', opts));
    }

    /**
     * Get daily summary meta.
     */
    async getDailySummaryMeta(_opts = {}) {
        const db = _db();
        if (!db) return null;
        const ttl = (_cfg()?.READ_CACHE_TTLS?.dailySummaryReadMs) || 120000;
        const cacheKey = db.getCacheKey('svc_analytics_dailySummaryMeta', 'daily_summaries_meta', { key: 'latest_success' });
        return db.getCached(cacheKey, ttl, () => db.get('daily_summaries_meta', 'latest_success'));
    }

    /**
     * Get staff activity feed.
     */
    async getStaffActivities(opts = {}) {
        const db = _db();
        if (!db) return [];
        const ttl = (_cfg()?.READ_CACHE_TTLS?.staffActivitiesReadMs) || 120000;
        const cacheKey = db.getCacheKey('svc_analytics_staffActivities', 'staff_messages', {});
        return db.getCached(cacheKey, ttl, () => db.getAll('staff_messages', opts));
    }

    /**
     * Get work plans.
     */
    async getWorkPlans(opts = {}) {
        const db = _db();
        if (!db) return [];
        const ttl = (_cfg()?.READ_CACHE_TTLS?.workPlansAllReadMs) || 300000;
        const cacheKey = db.getCacheKey('svc_analytics_workPlans', 'work_plans', {});
        return db.getCached(cacheKey, ttl, () => db.getAll('work_plans', opts));
    }

    /**
     * Get events.
     */
    async getEvents(opts = {}) {
        const db = _db();
        if (!db) return [];
        return db.getAll('events', opts).catch(() => []);
    }

    /**
     * Get system audit logs.
     */
    async getAuditLogs(opts = {}) {
        const db = _db();
        if (!db) return [];

        if (db.queryMany) {
            try {
                return await db.queryMany('system_audit_logs', [], {
                    orderBy: [{ field: 'createdAt', direction: 'desc' }],
                    limit: 80
                });
            } catch { /* fall through */ }
        }

        return db.getAll('system_audit_logs', opts).catch(() => []);
    }

    /**
     * Get budget heads.
     */
    async getBudgetHeads(opts = {}) {
        const db = _db();
        if (!db) return [];
        return db.getAll('budget_heads', opts).catch(() => []);
    }

    /**
     * Get summary locks.
     */
    async getSummaryLocks(opts = {}) {
        const db = _db();
        if (!db) return [];
        return db.getAll('summary_locks', opts).catch(() => []);
    }

    /**
     * Get minutes.
     */
    async getMinutes(opts = {}) {
        const db = _db();
        if (!db) return [];
        const ttl = (_cfg()?.READ_CACHE_TTLS?.minutes) || 60000;
        const cacheKey = db.getCacheKey('svc_analytics_minutes', 'minutes', {});
        return db.getCached(cacheKey, ttl, () => db.getAll('minutes', opts));
    }
}

export const AppAnalyticsService = new AnalyticsService();
if (typeof window !== 'undefined') window.AppAnalyticsService = AppAnalyticsService;
