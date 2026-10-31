import { isFormerStaff, canManageStaff, formerStaffIds, filterFormerStaffRecords } from '../utils/staff-employment.js';
import { AppConfig } from '../config.js';
import { AppFirestore } from './firebase-config.js';
import { PRIVATE_WORK_PLAN_COLLECTION, hydrateWorkPlanFromStorage, splitWorkPlanForStorage } from '../utils/private-work-plans.js';

export class Database {
    constructor() {
        this.db = AppFirestore;
        this.cache = new Map();
        this.telemetry = {
            get: 0,
            getAll: 0,
            query: 0,
            queryMany: 0,
            listen: 0,
            listenQuery: 0,
            writes: 0,
            docsRead: 0,
            byCollection: {}
        };
    }


    inEmploymentAdminArea() {
        return typeof window !== 'undefined' && String(window.location?.hash || '').split('?')[0] === '#admin'
            && canManageStaff(window.AppAuth?.getUser?.());
    }

    shouldUseStaffReadGateway(collection) {
        return typeof window !== 'undefined' && !!window.AppFirebaseAuth?.currentUser?.getIdToken &&
            ['users', 'user_private', 'attendance', 'leaves', 'minutes', 'salaries', 'staff_messages', 'work_plans',
                'location_audits', 'task_activity_events', 'daily_standups', 'journey_reflections', 'meetings',
                'birthday_people', 'hero_selections', 'daily_summaries', 'events'].includes(collection);
    }

    async readStaffData(collection, query = {}, options = {}) {
        const viewer = window.AppFirebaseAuth.currentUser;
        const includeFormer = options.includeFormer === true && this.inEmploymentAdminArea();
        const cacheKey = this.getCacheKey('protectedStaffRead', collection, { ...query, includeFormer, viewer: viewer.uid, orderBy: options.orderBy || [], limit: options.limit || null });
        const load = async () => {
            const token = await viewer.getIdToken();
            const rows = [];
            let cursor;
            const requestedLimit = Number(options.limit) > 0 ? Number(options.limit) : Infinity;
            for (let page = 0; page < 100; page++) {
                const response = await fetch('/api/staff-data', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ collection, ...query, includeFormer, cursor, orderBy: options.orderBy || [], pageSize: Math.min(400, requestedLimit - rows.length) })
                });
                const result = await response.json();
                if (window.AppFirebaseAuth?.currentUser?.uid !== viewer.uid) throw new Error('The signed-in account changed. Please refresh.');
                if (!response.ok) throw new Error(result.error || 'Could not load staff records.');
                rows.push(...result.data);
                cursor = result.nextCursor;
                if (!cursor || rows.length >= requestedLimit) return collection === 'work_plans' ? this.hydrateWorkPlans(rows.slice(0, requestedLimit)) : rows.slice(0, requestedLimit);
            }
            throw new Error('Too many staff records. Select a smaller date range.');
        };
        if (options.force || options.source === 'server') return load();
        return this.getCached(cacheKey, collection === 'users' ? 30000 : 10000, load);
    }

    listenStaffData(collection, filters, options, callback) {
        let stopped = false;
        let busy = false;
        let signature;
        const refresh = async () => {
            if (stopped || busy) return;
            busy = true;
            try {
                const rows = await this.readStaffData(collection, options.recordId ? { id: options.recordId } : filters ? { filters } : {}, { ...options, source: 'server' });
                const nextSignature = JSON.stringify(rows);
                if (!stopped && nextSignature !== signature) {
                    signature = nextSignature;
                    this.invalidateCollectionCache?.(collection);
                    callback(rows, { metadata: { fromCache: false, hasPendingWrites: false } });
                }
            } catch (error) { if (!stopped) console.error('Protected staff listener:', error.message); }
            finally { busy = false; }
        };
        void refresh();
        const timer = setInterval(refresh, 30000);
        window.addEventListener('app:staff-employment-changed', refresh);
        return () => { stopped = true; clearInterval(timer); window.removeEventListener('app:staff-employment-changed', refresh); };
    }

    applyEmploymentRoster(users) {
        const signature = users.map(u => String(u.id) + ':' + isFormerStaff(u)).sort().join('|');
        const changed = this.employmentSignature !== undefined && this.employmentSignature !== signature;
        this.employmentSignature = signature;
        this.employmentUsers = users;
        if (changed) {
            this.cache.clear();
            window.AppAnalytics?.memo?.clear();
            window.dispatchEvent(new CustomEvent('app:staff-employment-changed'));
        }
    }

    startEmploymentRoster() {
        if (this.employmentRosterUnsubscribe || !this.db) return;
        if (this.shouldUseStaffReadGateway('users')) {
            const refresh = () => this.readStaffData('users', {}, { source: 'server' }).then(users => this.applyEmploymentRoster(users)).catch(error => console.error('Staff roster:', error.message));
            const stop = this.db.collection('staff_directory_state').doc('current').onSnapshot(refresh, error => console.error('Staff roster state:', error.message));
            const timer = setInterval(refresh, 30000);
            this.employmentRosterUnsubscribe = () => { stop(); clearInterval(timer); };
            return;
        }
        this.employmentRosterUnsubscribe = this.db.collection('users').onSnapshot(snapshot => {
            this.applyEmploymentRoster(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        }, () => { this.employmentRosterUnsubscribe = null; this.employmentUsers = null; });
    }

    stopEmploymentRoster() {
        this.employmentRosterUnsubscribe?.();
        this.employmentRosterUnsubscribe = null;
        this.employmentUsers = null;
        this.cache.clear();
        if (typeof window !== 'undefined') window.AppAnalytics?.memo?.clear();
    }

    async filterStaffRows(collection, rows, options = {}) {
        if (options.includeFormer === true && this.inEmploymentAdminArea()) return rows;
        if (typeof window === 'undefined' || !window.AppAuth?.getUser?.()) return rows;
        const relevant = ['users', 'attendance', 'leaves', 'minutes', 'salaries', 'staff_messages', 'work_plans',
            'location_audits', 'task_activity_events', 'daily_standups', 'journey_reflections', 'meetings', 'birthday_people', 'hero_selections', 'daily_summaries'];
        if (!relevant.includes(collection)) return rows;
        if (collection === 'users' && !this.employmentUsers) this.applyEmploymentRoster(await this._getAllRaw('users'));
        else if (!this.employmentUsers) {
            this.applyEmploymentRoster(await this._getAllRaw('users', { source: 'server' }));
        }
        const ids = formerStaffIds(this.employmentUsers || []);
        if (collection === 'daily_summaries') rows = rows.filter(row =>
            !ids.size && !row.staffEmploymentSignature || row.staffEmploymentSignature === this.employmentSignature);
        return filterFormerStaffRecords(collection, rows, ids);
    }

    async getAll(collection, options = {}) {
        return this.filterStaffRows(collection, await this._getAllRaw(collection, options), options);
    }
    async query(collection, field, operator, value, options = {}) {
        return this.filterStaffRows(collection, await this._queryRaw(collection, field, operator, value), options);
    }
    async queryMany(collection, filters = [], options = {}) {
        return this.filterStaffRows(collection, await this._queryManyRaw(collection, filters, options), options);
    }
    async queryManyStrict(collection, filters = [], options = {}) {
        return this.filterStaffRows(collection, await this._queryManyStrictRaw(collection, filters, options), options);
    }
    async get(collection, id, options = {}) {
        const row = await this._getRaw(collection, id, options);
        // Authentication must still see its own employment state to sign out promptly.
        if (!row || (this.inEmploymentAdminArea() && ['users', 'work_plans'].includes(collection)) || (collection === 'users' && String(id) === String(window.AppAuth?.getUser?.()?.id || ''))) return row;
        return (await this.filterStaffRows(collection, [row], options))[0] || null;
    }

    async init() {
        if (!this.db) {
            console.error("Firebase not initialized! Check config.");
            return;
        }
        console.log("Firestore adapter ready.");
    }

    getFlags() {
        return (AppConfig && AppConfig.READ_OPT_FLAGS) || {};
    }

    track(op, collectionName, docsRead = 0) {
        const flags = this.getFlags();
        if (!flags.ENABLE_READ_TELEMETRY) return;
        if (typeof this.telemetry[op] === 'number') this.telemetry[op] += 1;
        this.telemetry.docsRead += Math.max(0, Number(docsRead) || 0);
        if (!this.telemetry.byCollection[collectionName]) {
            this.telemetry.byCollection[collectionName] = { ops: 0, docsRead: 0 };
        }
        this.telemetry.byCollection[collectionName].ops += 1;
        this.telemetry.byCollection[collectionName].docsRead += Math.max(0, Number(docsRead) || 0);
    }

    getReadTelemetry() {
        return JSON.parse(JSON.stringify(this.telemetry));
    }

    clearReadTelemetry() {
        this.telemetry = {
            get: 0,
            getAll: 0,
            query: 0,
            queryMany: 0,
            listen: 0,
            listenQuery: 0,
            writes: 0,
            docsRead: 0,
            byCollection: {}
        };
    }

    getCacheKey(prefix, collectionName, payload = {}) {
        return `${prefix}:${collectionName}:${JSON.stringify(payload)}`;
    }

    invalidateCollectionCache(collectionName) {
        // Evict legacy keys + new doc/all keys for this collection.
        const needle = `:${collectionName}:`;
        const docNeedle = `doc:${collectionName}:`;
        const allNeedle = `all:${collectionName}:`;

        for (const key of this.cache.keys()) {
            if (key.includes(needle) || key.startsWith(docNeedle) || key.startsWith(allNeedle)) {
                this.cache.delete(key);
            }
        }
    }

    async getCached(cacheKey, ttlMs, fetchFn) {
        const now = Date.now();
        const entry = this.cache.get(cacheKey);
        if (entry?.pending) return entry.pending;
        if (entry && entry.expiresAt > now) {
            return entry.value;
        }
        const loading = { pending: null, expiresAt: 0 };
        const pending = Promise.resolve().then(fetchFn).then(value => {
            // Invalidation during a request must not resurrect its old data.
            if (this.cache.get(cacheKey) === loading) {
                this.cache.set(cacheKey, { value, expiresAt: Date.now() + Math.max(0, Number(ttlMs) || 0) });
            }
            return value;
        }, error => {
            if (this.cache.get(cacheKey) === loading) this.cache.delete(cacheKey);
            throw error;
        });
        loading.pending = pending;
        this.cache.set(cacheKey, loading);
        return pending;
    }

    async getOrGenerateSummary(summaryKey, generatorFn, ttlMs) {
        if (!summaryKey || typeof generatorFn !== 'function') {
            throw new Error('getOrGenerateSummary requires a key and generator function.');
        }
        const key = this.getCacheKey('summary', 'computed', { summaryKey });
        const ttl = typeof ttlMs === 'number'
            ? ttlMs
            : (AppConfig?.READ_CACHE_TTLS?.attendanceSummary || 30000);
        return this.getCached(key, ttl, generatorFn);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
    }

    getSummarySchemaVersion() {
        return Number(AppConfig?.SUMMARY_POLICY?.SCHEMA_VERSION || 1);
    }

    getIstNow() {
        const now = new Date();
        return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    }

    toDateKey(dateObj) {
        const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    getISTDateKeys() {
        const istNow = this.getIstNow();
        const istYesterday = new Date(istNow);
        istYesterday.setDate(istYesterday.getDate() - 1);
        return {
            todayKey: this.toDateKey(istNow),
            yesterdayKey: this.toDateKey(istYesterday)
        };
    }

    getISTDayRange(dateKey) {
        const key = String(dateKey || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
        const start = new Date(`${key}T00:00:00+05:30`);
        const end = new Date(`${key}T23:59:59.999+05:30`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        return {
            start,
            end,
            startMs: start.getTime(),
            endMs: end.getTime()
        };
    }

    shouldRecomputeNowIST(cutoffHourIST) {
        const cutoff = Number.isFinite(Number(cutoffHourIST))
            ? Number(cutoffHourIST)
            : Number(AppConfig?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST || 17);
        return this.getIstNow().getHours() >= Math.max(0, Math.min(23, cutoff));
    }

    async hasAttendanceSignalForDate(dateKey) {
        const key = String(dateKey || '').trim();
        if (!key) return false;
        try {
            if (this.queryMany) {
                const attendanceRows = await this.queryMany('attendance', [
                    { field: 'date', operator: '==', value: key }
                ], { limit: 1 });
                if (Array.isArray(attendanceRows) && attendanceRows.length > 0) return true;
            }

            const dayRange = this.getISTDayRange(key);
            if (!dayRange) return false;

            if (this.queryMany) {
                const checkedInUsers = await this.queryMany('users', [
                    { field: 'lastCheckIn', operator: '>=', value: dayRange.startMs },
                    { field: 'lastCheckIn', operator: '<=', value: dayRange.endMs }
                ], { limit: 1 });
                return Array.isArray(checkedInUsers) && checkedInUsers.length > 0;
            }

            const [attendanceRows, users] = await Promise.all([
                this.getAll('attendance'),
                this.getAll('users')
            ]);
            if ((attendanceRows || []).some((row) => String(row?.date || '') === key)) return true;
            return (users || []).some((user) => {
                const lastCheckIn = Number(user?.lastCheckIn || 0);
                return Number.isFinite(lastCheckIn) && lastCheckIn >= dayRange.startMs && lastCheckIn <= dayRange.endMs;
            });
        } catch (error) {
            console.warn('Failed to check attendance signal for date:', key, error);
            return false;
        }
    }

    isSummaryFresh(summaryDoc, staleAfterMs) {
        if (!summaryDoc || typeof summaryDoc !== 'object') return false;
        const generatedAt = Number(summaryDoc.generatedAt || 0);
        const schemaVersion = Number(summaryDoc.version || 0);
        if (!generatedAt || !schemaVersion) return false;
        if (schemaVersion !== this.getSummarySchemaVersion()) return false;
        return (Date.now() - generatedAt) <= Math.max(0, Number(staleAfterMs) || 0);
    }

    async getDailySummary(dateKey) {
        const key = String(dateKey || '').trim();
        if (!key) return null;
        const ttl = AppConfig?.READ_CACHE_TTLS?.dailySummaryReadMs || 60000;
        const cacheKey = this.getCacheKey('dailySummary', 'daily_summaries', { key });
        return this.getCached(cacheKey, ttl, () => this.get('daily_summaries', key));
    }

    listenDailySummary(dateKey, callback) {
        const key = String(dateKey || '').trim();
        if (!key) return null;
        const cacheKey = this.getCacheKey('dailySummary', 'daily_summaries', { key });
        return this.listenDoc('daily_summaries', key, (data, snapshot) => {
            if (data) {
                const ttl = AppConfig?.READ_CACHE_TTLS?.dailySummaryReadMs || 60000;
                this.cache.set(cacheKey, { value: data, expiresAt: Date.now() + ttl });
            }
            if (callback) callback(data, snapshot);
        });
    }

    async getSummaryByDateKey(dateKey) {
        return this.getDailySummary(dateKey);
    }

    async getLatestSuccessfulSummaryMeta() {
        const ttl = AppConfig?.READ_CACHE_TTLS?.dailySummaryReadMs || 60000;
        const cacheKey = this.getCacheKey('dailySummaryMeta', 'daily_summaries_meta', { key: 'latest_success' });
        return this.getCached(cacheKey, ttl, () => this.get('daily_summaries_meta', 'latest_success'));
    }

    async setLatestSuccessfulSummaryMeta({ dateKey, generatedAt, version } = {}) {
        const key = String(dateKey || '').trim();
        if (!key) return;
        const payload = {
            id: 'latest_success',
            dateKey: key,
            generatedAt: Number(generatedAt || Date.now()),
            version: Number(version || this.getSummarySchemaVersion())
        };
        await this.put('daily_summaries_meta', payload);
    }

    async getDailySummaryWithFallback({ todayKey, yesterdayKey, staleAfterMs } = {}) {
        const staleMs = Math.max(1000, Number(staleAfterMs) || Number(AppConfig?.SUMMARY_POLICY?.STALENESS_MS) || 86400000);
        const allowYesterday = AppConfig?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY !== false;

        const tryToday = await this.getSummaryByDateKey(todayKey);
        if (this.isSummaryFresh(tryToday, staleMs)) {
            return { summary: tryToday, source: 'today' };
        }

        if (allowYesterday) {
            const tryYesterday = await this.getSummaryByDateKey(yesterdayKey);
            if (tryYesterday && typeof tryYesterday === 'object') {
                return { summary: tryYesterday, source: 'yesterday' };
            }
        }

        const meta = await this.getLatestSuccessfulSummaryMeta();
        const metaKey = String(meta?.dateKey || '').trim();
        if (metaKey) {
            const viaMeta = await this.getSummaryByDateKey(metaKey);
            if (viaMeta && typeof viaMeta === 'object') {
                return { summary: viaMeta, source: 'latest_success' };
            }
        }

        return { summary: tryToday || null, source: 'none' };
    }

    async putDailySummary(dateKey, payload = {}) {
        const key = String(dateKey || '').trim();
        if (!key) throw new Error('putDailySummary requires dateKey.');
        const doc = {
            id: key,
            dateKey: key,
            version: this.getSummarySchemaVersion(),
            ...payload,
            staffEmploymentSignature: this.employmentSignature || ''
        };
        return this.put('daily_summaries', doc);
    }

    async acquireSummaryLock(dateKey, lockOwner, ttlMs) {
        const key = String(dateKey || '').trim();
        const owner = String(lockOwner || '').trim();
        if (!key || !owner) return false;
        if (!this.db || !this.db.runTransaction) return false;
        if (AppConfig?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING === false) return true;

        const ttl = Math.max(1000, Number(ttlMs) || Number(AppConfig?.SUMMARY_POLICY?.LOCK_TTL_MS) || 90000);
        const ref = this.db.collection('summary_locks').doc(key);
        const now = Date.now();

        try {
            const acquired = await this.db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                if (snap.exists) {
                    const cur = snap.data() || {};
                    const curOwner = String(cur.ownerId || '');
                    const expiresAt = Number(cur.expiresAt || 0);
                    const isActive = expiresAt > now;
                    if (isActive && curOwner && curOwner !== owner) return false;
                }
                tx.set(ref, {
                    id: key,
                    dateKey: key,
                    ownerId: owner,
                    createdAt: now,
                    expiresAt: now + ttl
                }, { merge: true });
                return true;
            });
            return acquired === true;
        } catch (error) {
            console.warn('Failed to acquire summary lock:', error);
            return false;
        }
    }

    async releaseSummaryLock(dateKey, lockOwner) {
        const key = String(dateKey || '').trim();
        const owner = String(lockOwner || '').trim();
        if (!key || !owner || !this.db || !this.db.runTransaction) return;
        if (AppConfig?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING === false) return;
        const ref = this.db.collection('summary_locks').doc(key);
        try {
            await this.db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists) return;
                const cur = snap.data() || {};
                if (String(cur.ownerId || '') === owner) {
                    tx.delete(ref);
                }
            });
        } catch (error) {
            console.warn('Failed to release summary lock:', error);
        }
    }

    async getOrCreateDailySummary({
        dateKey,
        yesterdayKey,
        generatorFn,
        staleAfterMs,
        lockTtlMs
    } = {}) {
        const keys = this.getISTDateKeys();
        const key = String(dateKey || keys.todayKey || '').trim();
        const prevKey = String(yesterdayKey || keys.yesterdayKey || '').trim();
        if (!key || typeof generatorFn !== 'function') {
            throw new Error('getOrCreateDailySummary requires dateKey and generatorFn.');
        }
        const staleMs = Math.max(1000, Number(staleAfterMs) || Number(AppConfig?.SUMMARY_POLICY?.STALENESS_MS) || 86400000);
        const lockMs = Math.max(1000, Number(lockTtlMs) || Number(AppConfig?.SUMMARY_POLICY?.LOCK_TTL_MS) || 90000);
        const owner = String(window.AppAuth?.getUser?.()?.id || `anon_${Math.random().toString(36).slice(2, 10)}`);

        const fallback = await this.getDailySummaryWithFallback({
            todayKey: key,
            yesterdayKey: prevKey,
            staleAfterMs: staleMs
        });
        if (fallback.summary && fallback.source === 'today' && this.isSummaryFresh(fallback.summary, staleMs)) {
            // Force recalculation after the cutoff hour if the summary was generated
            // before the cutoff — ensures hero is scored with complete daily task data.
            const cutoffHour = Number(AppConfig?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST || 17);
            const istNow = this.getIstNow();
            const generatedAt = Number(fallback.summary.generatedAt || 0);
            const generatedDate = generatedAt ? new Date(generatedAt) : null;
            const generatedHourIST = generatedDate
                ? new Date(generatedDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours()
                : 0;
            const needsPostCutoffRefresh = istNow.getHours() >= cutoffHour && generatedHourIST < cutoffHour;
            if (!needsPostCutoffRefresh) {
                return { ...fallback.summary, _source: 'shared_today' };
            }
            // Fall through to regeneration — clear analytics memo so generatorFn fetches fresh Firestore data
            if (typeof window !== 'undefined' && window.AppAnalytics?.clearMemo) {
                window.AppAnalytics.clearMemo('analytics:heroShared');
                window.AppAnalytics.clearMemo('analytics:attendance');
            }
        }

        const shouldGateOnFirstCheckIn = AppConfig?.SUMMARY_POLICY?.GENERATE_ON_FIRST_CHECKIN !== false;
        if (shouldGateOnFirstCheckIn) {
            const hasAttendanceSignal = await this.hasAttendanceSignalForDate(key);
            if (!hasAttendanceSignal) {
                return fallback.summary ? { ...fallback.summary, _source: `fallback_${fallback.source}` } : null;
            }
        } else if (!this.shouldRecomputeNowIST(AppConfig?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST)) {
            return fallback.summary ? { ...fallback.summary, _source: `fallback_${fallback.source}` } : null;
        }

        // Ordinary staff may calculate their view, but cannot publish or replace
        // another person's shared ranking/summary document.
        if (window.AppAuth?.getUser?.()?.isAdmin !== true) {
            return { ...(await generatorFn()), dateKey: key, _source: 'local_calculated' };
        }
        const acquired = await this.acquireSummaryLock(key, owner, lockMs);
        if (acquired) {
            try {
                const generated = await generatorFn();
                const payload = {
                    ...(generated || {}),
                    generatedAt: Date.now(),
                    generatedBy: owner,
                    version: this.getSummarySchemaVersion()
                };
                await this.putDailySummary(key, payload);
                await this.setLatestSuccessfulSummaryMeta({
                    dateKey: key,
                    generatedAt: payload.generatedAt,
                    version: payload.version
                });
                return { dateKey: key, ...payload, _source: 'generated' };
            } finally {
                await this.releaseSummaryLock(key, owner);
            }
        }

        const pollDelays = [200, 400, 800];
        for (const delayMs of pollDelays) {
            await this.sleep(delayMs);
            const candidate = await this.getDailySummary(key);
            if (this.isSummaryFresh(candidate, staleMs)) {
                return { ...candidate, _source: 'shared' };
            }
        }
        return fallback.summary ? { ...fallback.summary, _source: `fallback_${fallback.source}` } : null;
    }

    applyFilters(ref, filters = []) {
        let q = ref;
        (filters || []).forEach(f => {
            if (!f || !f.field || !f.operator) return;
            q = q.where(f.field, f.operator, f.value);
        });
        return q;
    }

    applyOptions(ref, options = {}) {
        let q = ref;
        if (options.orderBy) {
            const arr = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
            arr.forEach(o => {
                if (!o) return;
                if (typeof o === 'string') q = q.orderBy(o);
                else if (o.field) q = q.orderBy(o.field, o.direction || 'asc');
            });
        }
        if (options.limit) q = q.limit(options.limit);
        if (options.startAt !== undefined) q = q.startAt(options.startAt);
        if (options.endAt !== undefined) q = q.endAt(options.endAt);
        return q;
    }

    isPermissionDenied(error) {
        const code = String(error?.code || '').toLowerCase();
        const message = String(error?.message || '').toLowerCase();
        return code.includes('permission-denied')
            || message.includes('missing or insufficient permissions');
    }

    async hydrateWorkPlans(plans) {
        const rows = Array.isArray(plans) ? plans : [];
        const viewerId = String(window.AppFirebaseAuth?.currentUser?.uid || window.AppAuth?.getUser?.()?.id || '').trim();
        if (!viewerId || !rows.some((plan) => Array.isArray(plan?.plans) && plan.plans.some((task) => task?.isPrivate === true))) return rows;
        return Promise.all(rows.map((plan) => hydrateWorkPlanFromStorage(plan, viewerId, async (id) => {
            const snapshot = await this.db.collection(PRIVATE_WORK_PLAN_COLLECTION).doc(id).get();
            return snapshot.exists ? { ...snapshot.data(), id: snapshot.id } : null;
        })));
    }

    async putWorkPlan(item) {
        const docId = String(item.id);
        const ref = this.db.collection('work_plans').doc(docId);
        const writerId = String(window.AppFirebaseAuth?.currentUser?.uid || window.AppAuth?.getUser?.()?.id || '').trim();
        let oldSnapshot;
        try {
            oldSnapshot = await ref.get();
        } catch (error) {
            // The history rules cannot authorize resource.data for a document
            // that does not exist yet. Confirm absence through the protected
            // read API, only for the signed-in owner's canonical personal plan.
            const isOwnPersonalPlan = writerId && String(item.userId) === writerId
                && /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || ''))
                && docId === `plan_${writerId}_${item.date}`;
            if (!this.isPermissionDenied(error) || !isOwnPersonalPlan || !this.shouldUseStaffReadGateway('work_plans')) throw error;
            const existing = await this.readStaffData('work_plans', { id: docId }, { source: 'server' });
            if (existing.length) throw error;
            oldSnapshot = { exists: false };
        }
        const oldPlan = oldSnapshot.exists ? oldSnapshot.data() || {} : {};
        // A hidden former-staff task is a display placeholder, never a deletion.
        const preservedPlans = (Array.isArray(item.plans) ? item.plans : []).map((task, index) =>
            task?.isEmploymentHidden ? oldPlan.plans?.[index] || task : task);
        item = { ...item, plans: preservedPlans };
        const retiredIds = formerStaffIds(this.employmentUsers || []);
        const activeIds = new Set((this.employmentUsers || []).filter(user => !isFormerStaff(user)).map(user => String(user.id)));
        item.plans = item.plans.map((task, index) => {
            const old = task?.id ? (oldPlan.plans || []).find(prior => prior?.id === task.id) : oldPlan.plans?.[index];
            const retainedTags = (old?.tags || []).filter(tag => (retiredIds.has(String(tag.id)) || this.shouldUseStaffReadGateway('work_plans') && !activeIds.has(String(tag.id))) && !(task?.tags || []).some(current => current.id === tag.id));
            return retainedTags.length ? { ...task, tags: [...(task.tags || []), ...retainedTags] } : task;
        });
        const safeInput = { ...item, plans: [...(Array.isArray(item.plans) ? item.plans : [])] };
        const ownerId = String(oldPlan.userId === 'annual_shared' ? oldPlan.createdById : oldPlan.userId || item.userId || '').trim();
        const writerOwnsPlan = Boolean(writerId && writerId === ownerId);
        // Editing a plan must preserve its original creator. Staff may edit
        // their own admin-created plan, but rules forbid changing attribution.
        const existingCreatorId = String(oldPlan.createdById || '').trim();
        if (existingCreatorId) {
            safeInput.createdById = existingCreatorId;
            if (oldPlan.createdByName !== undefined) safeInput.createdByName = oldPlan.createdByName;
        } else if (writerOwnsPlan) {
            safeInput.createdById = writerId;
        }
        // A collaborator cannot see an owner's private task bodies. Preserve
        // those references when they save edits to the public tasks in a plan.
        if (oldSnapshot.exists && !writerOwnsPlan) {
            const retainedIds = new Set(safeInput.plans.filter((task) => task?.privateTaskId).map((task) => String(task.privateTaskId)));
            (Array.isArray(oldPlan.plans) ? oldPlan.plans : []).forEach((task, index) => {
                if (task?.isPrivate === true && task.privateTaskId && !retainedIds.has(String(task.privateTaskId))) {
                    safeInput.plans.splice(Math.min(index, safeInput.plans.length), 0, task);
                }
            });
        }
        for (let index = 0; index < safeInput.plans.length; index += 1) {
            const task = safeInput.plans[index];
            if (task?.isPrivate !== true || !task.privateTaskId) continue;
            if (writerOwnsPlan && !Object.prototype.hasOwnProperty.call(task, 'task')) {
                throw new Error('Cannot save this plan because a private task body was not loaded. Reload the plan and try again.');
            }
            if (!Object.prototype.hasOwnProperty.call(task, 'task')) continue;
            const prior = await this.db.collection(PRIVATE_WORK_PLAN_COLLECTION).doc(String(task.privateTaskId)).get();
            if (prior.exists && String(prior.data()?.planId || '') !== docId) {
                safeInput.plans[index] = { ...task, privateTaskId: '' };
            }
        }
        const { publicPlan, privateTasks } = splitWorkPlanForStorage(safeInput, undefined, writerId);
        const nextIds = new Set(privateTasks.map((task) => task.id));
        const oldIds = (Array.isArray(oldPlan.plans) ? oldPlan.plans : [])
            .filter((task) => task?.isPrivate === true && task.privateTaskId)
            .map((task) => String(task.privateTaskId));
        const staleCount = writerOwnsPlan ? oldIds.filter((id) => !nextIds.has(id)).length : 0;
        if (privateTasks.length + staleCount + 1 > 500) {
            throw new Error('This work plan has too many private-task changes for one atomic save.');
        }
        const batch = this.db.batch();
        for (const task of privateTasks) batch.set(this.db.collection(PRIVATE_WORK_PLAN_COLLECTION).doc(task.id), task, { merge: true });
        for (const oldId of oldIds) {
            // Only the owner is allowed to delete these records by rules.
            if (writerOwnsPlan && !nextIds.has(oldId)) batch.delete(this.db.collection(PRIVATE_WORK_PLAN_COLLECTION).doc(oldId));
        }
        batch.set(ref, publicPlan, { merge: true });
        await batch.commit();
        return docId;
    }

    async _getAllRaw(collectionName, options = {}) {
        if (this.shouldUseStaffReadGateway(collectionName)) return this.readStaffData(collectionName, {}, options);
        try {
            const source = String(options?.source || '').trim().toLowerCase();
            const canUseSource = source === 'server' || source === 'cache';

            // Cache collections that are read often and rarely change within a session.
            // work_plans and users are fetched by many callsites across the app.
            const isWorkPlans = String(collectionName) === 'work_plans';
            const isUsers = String(collectionName) === 'users';
            const ttlByCollection = AppConfig?.READ_CACHE_TTLS || {};
            const shouldCache = (isWorkPlans || isUsers) && source !== 'server';

            const cacheKey = this.getCacheKey(
                'all',
                collectionName,
                { source: canUseSource ? source : 'none' }
            );

            if (shouldCache) {
                if (isWorkPlans) {
                    const wasHit = this.cache.has(cacheKey);
                    window.app_workPlansLoadSource = (wasHit && this.cache.get(cacheKey)?.expiresAt > Date.now()) ? 'hit' : 'miss';
                }

                const ttlMs = isUsers
                    ? (ttlByCollection.users || 60000)
                    : (ttlByCollection.workPlansAllReadMs || 60000);
                const cached = await this.getCached(cacheKey, ttlMs, async () => {
                    const snapshot = canUseSource
                        ? await this.db.collection(collectionName).get({ source })
                        : await this.db.collection(collectionName).get();
                    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    this.track('getAll', collectionName, data.length);
                    return data;
                });
                return isWorkPlans ? this.hydrateWorkPlans(cached) : cached;
            }

            const snapshot = canUseSource
                ? await this.db.collection(collectionName).get({ source })
                : await this.db.collection(collectionName).get();
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.track('getAll', collectionName, data.length);
            return isWorkPlans ? this.hydrateWorkPlans(data) : data;
        } catch (error) {
            if (options?.silentPermissionDenied && this.isPermissionDenied(error)) {
                return [];
            }
            console.error(`Error getting all from ${collectionName}:`, error);
            throw error;
        }
    }

    async _getRaw(collectionName, id, options = {}) {
        if (!id) return null;
        if (this.shouldUseStaffReadGateway(collectionName) && !(collectionName === 'users' && String(id) === String(window.AppFirebaseAuth.currentUser.uid))) return (await this.readStaffData(collectionName, { id: String(id) }, { ...options, includeFormer: options.includeFormer ?? (this.inEmploymentAdminArea() && ['users', 'work_plans'].includes(collectionName)) }))[0] || null;
        try {
            const docId = String(id);
            const docRef = this.db.collection(collectionName).doc(docId);

            const source = String(options?.source || '').trim().toLowerCase();
            const canUseSource = source === 'server' || source === 'cache';

            // Only cache work_plans doc reads by default to reuse full day plan payload.
            const isWorkPlans = String(collectionName) === 'work_plans';
            const ttlByCollection = AppConfig?.READ_CACHE_TTLS || {};
            const shouldCache = isWorkPlans && source !== 'server';

            const cacheKey = this.getCacheKey(
                'doc',
                collectionName,
                { id: docId, source: canUseSource ? source : 'none' }
            );

            if (shouldCache) {
                // expose where data came from (only for work_plans)
                const wasHit = this.cache.has(cacheKey);
                if (wasHit && this.cache.get(cacheKey)?.expiresAt > Date.now()) {
                    window.app_workPlansLoadSource = 'hit';
                } else {
                    window.app_workPlansLoadSource = 'miss';
                }

                const ttlMs = ttlByCollection.workPlanReadMs || 60000;
                const cached = await this.getCached(cacheKey, ttlMs, async () => {
                    const doc = canUseSource ? await docRef.get({ source }) : await docRef.get();
                    if (doc.exists) {
                        this.track('get', collectionName, 1);
                        return { ...doc.data(), id: doc.id };
                    } else {
                        this.track('get', collectionName, 0);
                        return null;
                    }
                });
                return cached ? (await this.hydrateWorkPlans([cached]))[0] : null;
            }

            const doc = canUseSource ? await docRef.get({ source }) : await docRef.get();
            if (doc.exists) {
                this.track('get', collectionName, 1);
                const result = { ...doc.data(), id: doc.id };
                return isWorkPlans ? (await this.hydrateWorkPlans([result]))[0] : result;
            } else {
                this.track('get', collectionName, 0);
                return null;
            }
        } catch (error) {
            if (options?.silentPermissionDenied && this.isPermissionDenied(error)) {
                return null;
            }
            console.error(`Error getting ${id} from ${collectionName}:`, error);
            throw error;
        }
    }

    async add(collectionName, item, options = {}) {
        if (item.id) {
            return this.put(collectionName, item);
        }
        if (String(collectionName) === 'work_plans') {
            const id = this.db.collection('work_plans').doc().id;
            return this.put(collectionName, { ...item, id }, options);
        }
        try {
            const docRef = await this.db.collection(collectionName).add(item);
            this.telemetry.writes += 1;
            this.invalidateCollectionCache(collectionName);
            if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', {
                detail: {
                    collection: collectionName,
                    op: 'add',
                    id: docRef.id,
                    item: { ...item, id: docRef.id }
                }
            }));
            return docRef.id;
        } catch (error) {
            if (options?.silentPermissionDenied && this.isPermissionDenied(error)) {
                console.warn(`Silent: failed to add to ${collectionName} due to permissions.`);
                return null;
            }
            console.error(`Error adding to ${collectionName}:`, error);
            throw error;
        }
    }

    async put(collectionName, item, options = {}) {
        if (!item.id) throw new Error("Item must have an ID for 'put' operation.");
        try {
            const docId = String(item.id);
            if (String(collectionName) === 'work_plans') await this.putWorkPlan(item);
            else await this.db.collection(collectionName).doc(docId).set(item, { merge: true });
            this.telemetry.writes += 1;
            this.invalidateCollectionCache(collectionName);
            if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', {
                detail: {
                    collection: collectionName,
                    op: 'put',
                    id: docId,
                    item: { ...item }
                }
            }));
            return docId;
        } catch (error) {
            if (options?.silentPermissionDenied && this.isPermissionDenied(error)) {
                return null;
            }
            console.error(`Error putting ${item.id} to ${collectionName}:`, error);
            throw error;
        }
    }

    async putBatch(operations = []) {
        if (!this.db || !this.db.batch) throw new Error('Firestore batch writes are not available.');
        const rows = Array.isArray(operations) ? operations : [];
        if (rows.length > 500) throw new Error('A batch can contain at most 500 writes.');
        const batch = this.db.batch();
        const collections = new Set();
        rows.forEach(({ collection, item }) => {
            if (!collection || !item?.id) throw new Error('Every batch write needs a collection and document id.');
            if (String(collection) === 'work_plans') throw new Error('Work plans must be saved through putWorkPlan.');
            batch.set(this.db.collection(collection).doc(String(item.id)), item, { merge: true });
            collections.add(String(collection));
        });
        await batch.commit();
        collections.forEach((collection) => {
            this.telemetry.writes += rows.filter((row) => String(row.collection) === collection).length;
            this.invalidateCollectionCache(collection);
        });
        return rows.length;
    }

    async delete(collectionName, id) {
        if (!id) return;
        try {
            const docId = String(id);
            await this.db.collection(collectionName).doc(docId).delete();
            this.telemetry.writes += 1;
            this.invalidateCollectionCache(collectionName);
            if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', {
                detail: {
                    collection: collectionName,
                    op: 'delete',
                    id: docId
                }
            }));
        } catch (error) {
            console.error(`Error deleting ${id} from ${collectionName}:`, error);
            throw error;
        }
    }

    async deleteMany(collectionName, ids = [], options = {}) {
        const uniqueIds = Array.from(new Set((ids || []).filter(Boolean).map((id) => String(id))));
        if (!uniqueIds.length) return 0;
        const chunkSize = Math.max(1, Math.min(450, Number(options.chunkSize) || 400));
        let deletedCount = 0;

        try {
            for (let i = 0; i < uniqueIds.length; i += chunkSize) {
                const chunk = uniqueIds.slice(i, i + chunkSize);
                const batch = this.db.batch();
                chunk.forEach((docId) => {
                    const ref = this.db.collection(collectionName).doc(docId);
                    batch.delete(ref);
                });
                await batch.commit();
                deletedCount += chunk.length;
            }
            this.telemetry.writes += deletedCount;
            this.invalidateCollectionCache(collectionName);
            if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', {
                detail: {
                    collection: collectionName,
                    op: 'deleteMany',
                    count: deletedCount,
                    ids: uniqueIds
                }
            }));
            return deletedCount;
        } catch (error) {
            console.error(`Error deleting many from ${collectionName}:`, error);
            throw error;
        }
    }

    async deleteAllInCollection(collectionName, options = {}) {
        const rows = await this.getAll(collectionName, options);
        const ids = (rows || []).map((row) => row?.id).filter(Boolean);
        if (!ids.length) return 0;
        return this.deleteMany(collectionName, ids, options);
    }

    async _queryRaw(collectionName, field, operator, value) {
        if (this.shouldUseStaffReadGateway(collectionName)) return this.readStaffData(collectionName, { filters: [{ field, operator, value }] });
        try {
            const snapshot = await this.db.collection(collectionName).where(field, operator, value).get();
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.track('query', collectionName, data.length);
            return data;
        } catch (error) {
            console.error(`Error querying ${collectionName}:`, error);
            throw error;
        }
    }


    async _queryManyStrictRaw(collectionName, filters = [], options = {}) {
        if (this.shouldUseStaffReadGateway(collectionName)) return this.readStaffData(collectionName, { filters }, options);
        if (!this.db) throw new Error('Firestore is not initialized.');
        let ref = this.db.collection(collectionName);
        ref = this.applyFilters(ref, filters);
        ref = this.applyOptions(ref, options);
        const snapshot = await ref.get();
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        this.track('queryMany', collectionName, data.length);
        return data;
    }

    async getDayPlansByDate(dateKey) {
        const safeDate = String(dateKey || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(safeDate)) return [];
        const plans = await this.queryManyStrict('work_plans', [
            { field: 'date', operator: '==', value: safeDate }
        ]);
        const matching = plans.filter((plan) => String(plan?.date || '').trim() === safeDate);
        return this.hydrateWorkPlans(matching);
    }

    /**
     * Fetch the day-plan docs for a date by their known doc ids instead of a
     * date-scoped collection query: the annual shared plan (plan_annual_{date})
     * plus one personal plan (plan_{userId}_{date}) per supplied user id.
     * The annual doc is always included; 'annual_shared' ids are skipped.
     * Uses getManyByIds (IN queries in chunks of 10 with a per-doc fallback),
     * so no full work_plans collection read ever happens on this path.
     */
    async getDayPlansByIds(dateKey, userIds = []) {
        const safeDate = String(dateKey || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(safeDate)) return [];
        const ids = new Set([`plan_annual_${safeDate}`]);
        (Array.isArray(userIds) ? userIds : []).forEach((uid) => {
            const safeUid = String(uid || '').trim();
            if (!safeUid || safeUid === 'annual_shared') return;
            ids.add(`plan_${safeUid}_${safeDate}`);
        });
        if (ids.size === 0) return [];
        return this.getManyByIds('work_plans', Array.from(ids));
    }
    async _queryManyRaw(collectionName, filters = [], options = {}) {
        if (this.shouldUseStaffReadGateway(collectionName)) return this.readStaffData(collectionName, { filters }, options);
        const flags = this.getFlags();
        if (!flags.FF_READ_OPT_DB_QUERIES) {
            const rows = await this.getAll(collectionName, { ...options, silentPermissionDenied: true });
            return this.filterRows(rows, filters, options);
        }
        try {
            let ref = this.db.collection(collectionName);
            ref = this.applyFilters(ref, filters);
            ref = this.applyOptions(ref, options);
            const source = options?.source === 'server' ? { source: 'server' } : undefined;
            const snapshot = await ref.get(source);
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.track('queryMany', collectionName, data.length);
            return String(collectionName) === 'work_plans' ? this.hydrateWorkPlans(data) : data;
        } catch (error) {
            console.warn(`queryMany failed for ${collectionName}`, error);
            throw error;
        }
    }

    filterRows(rows, filters = [], options = {}) {
        let result = (Array.isArray(rows) ? rows : []).filter((row) => (filters || []).every((f) => {
            if (!f?.field || !f.operator) return true;
            const actual = f.field.split('.').reduce((value, key) => value?.[key], row);
            switch (f.operator) {
                case '==': return actual === f.value;
                case '!=': return actual !== f.value;
                case '>': return actual > f.value;
                case '>=': return actual >= f.value;
                case '<': return actual < f.value;
                case '<=': return actual <= f.value;
                case 'in': return Array.isArray(f.value) && f.value.includes(actual);
                case 'array-contains': return Array.isArray(actual) && actual.includes(f.value);
                default: return false;
            }
        }));
        const ordering = Array.isArray(options.orderBy) ? options.orderBy : (options.orderBy ? [options.orderBy] : []);
        if (ordering.length) result = result.slice().sort((a, b) => {
            for (const entry of ordering) {
                const field = typeof entry === 'string' ? entry : entry?.field;
                if (!field) continue;
                const direction = typeof entry === 'object' && entry.direction === 'desc' ? -1 : 1;
                const av = field.split('.').reduce((value, key) => value?.[key], a);
                const bv = field.split('.').reduce((value, key) => value?.[key], b);
                if (av < bv) return -direction;
                if (av > bv) return direction;
            }
            return 0;
        });
        if (Number.isFinite(options.limit) && options.limit > 0) result = result.slice(0, options.limit);
        return result;
    }

    async getManyByIds(collectionName, ids = []) {
        const uniqueIds = Array.from(new Set((ids || []).filter(Boolean).map(v => String(v))));
        if (!uniqueIds.length) return [];
        const chunks = [];
        for (let i = 0; i < uniqueIds.length; i += 10) chunks.push(uniqueIds.slice(i, i + 10));
        const reads = await Promise.all(chunks.map(async (chunk) => {
            try {
                const scoped = await this.queryMany(collectionName, [{ field: 'id', operator: 'in', value: chunk }]);
                if (scoped && scoped.length) return scoped.filter((row) => chunk.includes(String(row?.id || '')));
                return Promise.all(chunk.map(id => this.get(collectionName, id)));
            } catch {
                return Promise.all(chunk.map(id => this.get(collectionName, id)));
            }
        }));
        return reads.flat().filter(Boolean);
    }

    listenDoc(collectionName, id, callback, options = {}) {
        if (!this.db || !id) return null;
        if (this.shouldUseStaffReadGateway(collectionName) && !(collectionName === 'users' && String(id) === String(window.AppFirebaseAuth.currentUser.uid))) {
            return this.listenStaffData(collectionName, [], { ...options, recordId: id }, (rows, snapshot) => callback(rows[0] || null, snapshot));
        }
        const docId = String(id);
        try {
            return this.db.collection(collectionName).doc(docId).onSnapshot((doc) => {
                const data = doc.exists ? { ...doc.data(), id: doc.id } : null;
                this.track('listen', collectionName, 1);
                if (String(collectionName) === 'work_plans') this.hydrateWorkPlans(data ? [data] : []).then(rows => this.filterStaffRows(collectionName, rows, options)).then(rows => callback(rows[0] || null, doc));
                else this.filterStaffRows(collectionName, data ? [data] : [], options).then(rows => callback(rows[0] || null, doc)).catch(error => console.error('Staff visibility:', error));
            }, (error) => {
                console.error(`Realtime listener error in ${collectionName}/${docId}:`, error);
            });
        } catch (error) {
            console.error(`Error setting up listener for ${collectionName}/${docId}:`, error);
            return null;
        }
    }

    listenQuery(collectionName, filters = [], options = {}, callback) {
        if (!this.db) return null;
        if (this.shouldUseStaffReadGateway(collectionName)) return this.listenStaffData(collectionName, filters, options, callback);
        try {
            let ref = this.db.collection(collectionName);
            ref = this.applyFilters(ref, filters);
            ref = this.applyOptions(ref, options);
            return ref.onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                this.track('listenQuery', collectionName, data.length);
                if (String(collectionName) === 'work_plans') this.hydrateWorkPlans(data).then(rows => this.filterStaffRows(collectionName, rows, options)).then(rows => callback(rows, snapshot));
                else this.filterStaffRows(collectionName, data, options).then(rows => callback(rows, snapshot)).catch(error => console.error('Staff visibility:', error));
            }, (error) => {
                if (options.silentPermissionDenied && this.isPermissionDenied(error)) {
                    return;
                }
                console.error(`Realtime query listener error in ${collectionName}:`, error);
            });
        } catch (error) {
            console.warn(`listenQuery failed for ${collectionName}, falling back to listen`, error);
            return this.listen(collectionName, callback);
        }
    }

    listen(collectionName, callback, options = {}) {
        if (!this.db) return null;
        if (this.shouldUseStaffReadGateway(collectionName)) return this.listenStaffData(collectionName, [], options, callback);
        return this.db.collection(collectionName).onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.track('listen', collectionName, data.length);
            if (String(collectionName) === 'work_plans') this.hydrateWorkPlans(data).then(rows => this.filterStaffRows(collectionName, rows, options)).then(rows => callback(rows, snapshot));
            else this.filterStaffRows(collectionName, data, options).then(rows => callback(rows, snapshot)).catch(error => console.error('Staff visibility:', error));
        }, (error) => {
            console.error(`Realtime listener error in ${collectionName}:`, error);
        });
    }

    /**
     * Atomically read-check-write a user document for check-in.
     * Uses Firestore runTransaction to prevent cross-device race conditions.
     *
     * @param {string} userId
     * @param {function} validateAndBuild - (currentUser) => { ok, user, extra } or { ok: false, conflict: true, message }
     * @returns {{ ok, conflict?, message?, user? }}
     */
    async transactionalUserUpdate(userId, validateAndBuild) {
        if (!this.db || !this.db.runTransaction) {
            throw new Error('Firestore runTransaction not available');
        }
        const docRef = this.db.collection('users').doc(String(userId));
        let result;
        try {
            result = await this.db.runTransaction(async (tx) => {
                const snap = await tx.get(docRef);
                const currentUser = snap.exists ? { id: snap.id, ...snap.data() } : null;
                const outcome = await validateAndBuild(currentUser);
                if (outcome && outcome.conflict) {
                    return { ok: false, conflict: true, message: outcome.message || 'Conflict detected' };
                }
                if (outcome && outcome.ok && outcome.user) {
                    tx.set(docRef, outcome.user, { merge: true });
                }
                return outcome;
            });
        } catch (txErr) {
            console.error('transactionalUserUpdate failed, falling back:', txErr);
            return { ok: false, conflict: true, message: 'Sync error. Please try again.' };
        }
        if (result && result.ok) {
            this.telemetry.writes += 1;
            this.invalidateCollectionCache('users');
            if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', {
                detail: { collection: 'users', op: 'transactionalUpdate', id: String(userId) }
            }));
        }
        return result;
    }
}

export const AppDB = new Database();
if (typeof window !== 'undefined') window.AppDB = AppDB;
