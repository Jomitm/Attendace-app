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
                } catch (err) {
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
