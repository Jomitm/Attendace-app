// js/services/settings-service.js
// Centralized settings and configuration data access.

function _db() {
    return window.AppDB;
}

export class SettingsService {
    /**
     * Get app settings.
     */
    async getSettings() {
        const db = _db();
        if (!db) return {};
        return db.getAll('settings').catch(() => []);
    }

    /**
     * Get a specific setting value.
     */
    async getSetting(key) {
        const settings = await this.getSettings();
        const found = settings.find(s => s.id === key || s.key === key);
        return found?.value ?? found?.val ?? null;
    }

    /**
     * Get policies.
     */
    async getPolicies() {
        const db = _db();
        if (!db) return [];
        return db.getAll('policies').catch(() => []);
    }

    /**
     * Get admin policies.
     */
    async getAdminPolicies() {
        const db = _db();
        if (!db) return [];
        return db.getAll('admin_policies').catch(() => []);
    }

    /**
     * Get annual plan.
     */
    async getAnnualPlan() {
        const db = _db();
        if (!db) return [];
        return db.getAll('annual_plan').catch(() => []);
    }

    /**
     * Get letter pad profiles.
     */
    async getLetterPadProfiles() {
        const db = _db();
        if (!db) return [];
        return db.getAll('letter_pad_profiles', { silentPermissionDenied: true }).catch(() => []);
    }

    /**
     * Get letter pad profiles with caching.
     */
    async getLetterPadProfilesCached() {
        const db = _db();
        if (!db) return [];
        const cacheKey = db.getCacheKey('svc_settings_letterPad', 'letter_pad_profiles', {});
        return db.getCached(cacheKey, 300000, () =>
            db.getAll('letter_pad_profiles', { silentPermissionDenied: true }).catch(() => [])
        );
    }

    /**
     * Get staff messages.
     */
    async getStaffMessages(opts = {}) {
        const db = _db();
        if (!db) return [];
        return db.getAll('staff_messages', opts).catch(() => []);
    }

    /**
     * Write/update settings.
     */
    async putSetting(key, value) {
        const db = _db();
        if (!db) return false;
        return db.put('settings', { id: key, key, value });
    }
}

export const AppSettingsService = new SettingsService();
if (typeof window !== 'undefined') window.AppSettingsService = AppSettingsService;
