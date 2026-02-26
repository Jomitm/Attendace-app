/**
 * Database Module (Firestore Wrapper)
 * Handles real-time cloud storage for Users and Attendance.
 * Replaces IndexedDB implementation.
 */
(function () {
    class Database {
        constructor() {
            // AppFirestore should be initialized in firebase-config.js
            this.db = window.AppFirestore;
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

        async init() {
            // Firestore doesn't need explicit 'open', but we can check connection
            if (!this.db) {
                console.error("Firebase not initialized! Check config.");
                return;
            }
            console.log("Firestore adapter ready.");
            // No strict schema setup needed for Firestore (schema-less)
        }

        getFlags() {
            return (window.AppConfig && window.AppConfig.READ_OPT_FLAGS) || {};
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
            const needle = `:${collectionName}:`;
            for (const key of this.cache.keys()) {
                if (key.includes(needle)) this.cache.delete(key);
            }
        }

        async getCached(cacheKey, ttlMs, fetchFn) {
            const now = Date.now();
            const entry = this.cache.get(cacheKey);
            if (entry && entry.expiresAt > now) {
                return entry.value;
            }
            const value = await fetchFn();
            this.cache.set(cacheKey, {
                value,
                expiresAt: now + Math.max(0, Number(ttlMs) || 0)
            });
            return value;
        }

        async getOrGenerateSummary(summaryKey, generatorFn, ttlMs) {
            if (!summaryKey || typeof generatorFn !== 'function') {
                throw new Error('getOrGenerateSummary requires a key and generator function.');
            }
            const key = this.getCacheKey('summary', 'computed', { summaryKey });
            const ttl = typeof ttlMs === 'number'
                ? ttlMs
                : (window.AppConfig?.READ_CACHE_TTLS?.attendanceSummary || 30000);
            return this.getCached(key, ttl, generatorFn);
        }

        async sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
        }

        getSummarySchemaVersion() {
            return Number(window.AppConfig?.SUMMARY_POLICY?.SCHEMA_VERSION || 1);
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

        shouldRecomputeNowIST(cutoffHourIST) {
            const cutoff = Number.isFinite(Number(cutoffHourIST))
                ? Number(cutoffHourIST)
                : Number(window.AppConfig?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST || 17);
            return this.getIstNow().getHours() >= Math.max(0, Math.min(23, cutoff));
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
            const ttl = window.AppConfig?.READ_CACHE_TTLS?.dailySummaryReadMs || 60000;
            const cacheKey = this.getCacheKey('dailySummary', 'daily_summaries', { key });
            return this.getCached(cacheKey, ttl, () => this.get('daily_summaries', key));
        }

        async getSummaryByDateKey(dateKey) {
            return this.getDailySummary(dateKey);
        }

        async getLatestSuccessfulSummaryMeta() {
            const ttl = window.AppConfig?.READ_CACHE_TTLS?.dailySummaryReadMs || 60000;
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
            const staleMs = Math.max(1000, Number(staleAfterMs) || Number(window.AppConfig?.SUMMARY_POLICY?.STALENESS_MS) || 86400000);
            const allowYesterday = window.AppConfig?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY !== false;

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
                ...payload
            };
            return this.put('daily_summaries', doc);
        }

        async acquireSummaryLock(dateKey, lockOwner, ttlMs) {
            const key = String(dateKey || '').trim();
            const owner = String(lockOwner || '').trim();
            if (!key || !owner) return false;
            if (!this.db || !this.db.runTransaction) return false;
            if (window.AppConfig?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING === false) return true;

            const ttl = Math.max(1000, Number(ttlMs) || Number(window.AppConfig?.SUMMARY_POLICY?.LOCK_TTL_MS) || 90000);
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
            if (window.AppConfig?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING === false) return;
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
            const staleMs = Math.max(1000, Number(staleAfterMs) || Number(window.AppConfig?.SUMMARY_POLICY?.STALENESS_MS) || 86400000);
            const lockMs = Math.max(1000, Number(lockTtlMs) || Number(window.AppConfig?.SUMMARY_POLICY?.LOCK_TTL_MS) || 90000);
            const owner = String(window.AppAuth?.getUser?.()?.id || `anon_${Math.random().toString(36).slice(2, 10)}`);

            const fallback = await this.getDailySummaryWithFallback({
                todayKey: key,
                yesterdayKey: prevKey,
                staleAfterMs: staleMs
            });
            if (fallback.summary && fallback.source === 'today' && this.isSummaryFresh(fallback.summary, staleMs)) {
                return { ...fallback.summary, _source: 'shared_today' };
            }

            if (!this.shouldRecomputeNowIST(window.AppConfig?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST)) {
                return fallback.summary ? { ...fallback.summary, _source: `fallback_${fallback.source}` } : null;
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

            const pollDelays = [350, 700, 1200, 1800];
            for (const delayMs of pollDelays) {
                await this.sleep(delayMs);
                const candidate = await this.getDailySummary(key);
                if (this.isSummaryFresh(candidate, staleMs)) {
                    return { ...candidate, _source: 'shared' };
                }
            }

            // Graceful fallback: do not force expensive local recompute if lock owner is still working.
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

        async getAll(collectionName) {
            try {
                const snapshot = await this.db.collection(collectionName).get();
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                this.track('getAll', collectionName, data.length);
                return data;
            } catch (error) {
                console.error(`Error getting all from ${collectionName}:`, error);
                throw error;
            }
        }

        async get(collectionName, id) {
            if (!id) return null;
            try {
                const docId = String(id);
                const docRef = this.db.collection(collectionName).doc(docId);
                const doc = await docRef.get();
                if (doc.exists) {
                    this.track('get', collectionName, 1);
                    return { ...doc.data(), id: doc.id };
                } else {
                    this.track('get', collectionName, 0);
                    return null;
                }
            } catch (error) {
                console.error(`Error getting ${id} from ${collectionName}:`, error);
                throw error;
            }
        }

        async add(collectionName, item) {
            // Use 'put' logic (set with ID) if item has an ID, otherwise addDoc
            if (item.id) {
                return this.put(collectionName, item);
            }
            try {
                const docRef = await this.db.collection(collectionName).add(item);
                this.telemetry.writes += 1;
                this.invalidateCollectionCache(collectionName);
                if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', { detail: { collection: collectionName, op: 'add' } }));
                // We might want to save the auto-generated ID back into the item?
                // For now, just return the ID.
                return docRef.id;
            } catch (error) {
                console.error(`Error adding to ${collectionName}:`, error);
                throw error;
            }
        }

        async put(collectionName, item) {
            if (!item.id) throw new Error("Item must have an ID for 'put' operation.");
            try {
                // FORCE STRING ID
                const docId = String(item.id);
                await this.db.collection(collectionName).doc(docId).set(item, { merge: true });
                this.telemetry.writes += 1;
                this.invalidateCollectionCache(collectionName);
                if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', { detail: { collection: collectionName, op: 'put' } }));
                return docId;
            } catch (error) {
                console.error(`Error putting ${item.id} to ${collectionName}:`, error);
                throw error;
            }
        }

        async delete(collectionName, id) {
            if (!id) return;
            try {
                const docId = String(id);
                await this.db.collection(collectionName).doc(docId).delete();
                this.telemetry.writes += 1;
                this.invalidateCollectionCache(collectionName);
                if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('app:db-write', { detail: { collection: collectionName, op: 'delete' } }));
            } catch (error) {
                console.error(`Error deleting ${id} from ${collectionName}:`, error);
                throw error;
            }
        }

        async query(collectionName, field, operator, value) {
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

        async queryMany(collectionName, filters = [], options = {}) {
            const flags = this.getFlags();
            if (!flags.FF_READ_OPT_DB_QUERIES) return this.getAll(collectionName);
            try {
                let ref = this.db.collection(collectionName);
                ref = this.applyFilters(ref, filters);
                ref = this.applyOptions(ref, options);
                const snapshot = await ref.get();
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                this.track('queryMany', collectionName, data.length);
                return data;
            } catch (error) {
                console.warn(`queryMany failed for ${collectionName}, falling back to getAll`, error);
                return this.getAll(collectionName);
            }
        }

        async getManyByIds(collectionName, ids = []) {
            const uniqueIds = Array.from(new Set((ids || []).filter(Boolean).map(v => String(v))));
            if (!uniqueIds.length) return [];
            // Compat SDK "in" query supports up to 10 values.
            const chunks = [];
            for (let i = 0; i < uniqueIds.length; i += 10) chunks.push(uniqueIds.slice(i, i + 10));
            const reads = await Promise.all(chunks.map(async (chunk) => {
                try {
                    const scoped = await this.queryMany(collectionName, [{ field: 'id', operator: 'in', value: chunk }]);
                    if (scoped && scoped.length) return scoped;
                    return Promise.all(chunk.map(id => this.get(collectionName, id)));
                } catch {
                    // Fallback for docs without mirrored "id" field
                    return Promise.all(chunk.map(id => this.get(collectionName, id)));
                }
            }));
            return reads.flat().filter(Boolean);
        }

        listenQuery(collectionName, filters = [], options = {}, callback) {
            if (!this.db) return null;
            try {
                let ref = this.db.collection(collectionName);
                ref = this.applyFilters(ref, filters);
                ref = this.applyOptions(ref, options);
                return ref.onSnapshot((snapshot) => {
                    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    this.track('listenQuery', collectionName, data.length);
                    callback(data, snapshot);
                }, (error) => {
                    console.error(`Realtime query listener error in ${collectionName}:`, error);
                });
            } catch (error) {
                console.warn(`listenQuery failed for ${collectionName}, falling back to listen`, error);
                return this.listen(collectionName, callback);
            }
        }

        listen(collectionName, callback) {
            if (!this.db) return null;
            return this.db.collection(collectionName).onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                this.track('listen', collectionName, data.length);
                callback(data, snapshot);
            }, (error) => {
                console.error(`Realtime listener error in ${collectionName}:`, error);
            });
        }
    }

    // Export to Window (Global)
    window.AppDB = new Database();
})();
