// tests/helpers/firestore-mock.mjs
// In-memory Firestore mock for Node.js native test runner (node:test).
// Mimics the Firebase Admin Firestore SDK API surface enough to unit-test
// db.js, attendance.js, leaves.js, and analytics.js without a live database.

/**
 * Create an in-memory Firestore mock seeded with optional initial data.
 * Shape: { collectionName: { docId: { ...fields } } }
 */
export function createFirestoreMock(initialData = {}) {
    // Deep-clone to prevent test-to-test bleed
    const db = JSON.parse(JSON.stringify(initialData));

    const makeTimestamp = (ms) => ({
        _seconds: Math.floor(ms / 1000),
        _nanoseconds: (ms % 1000) * 1e6,
        toDate: () => new Date(ms),
        toMillis: () => ms,
    });

    const Timestamp = {
        now: () => makeTimestamp(Date.now()),
        fromDate: (date) => makeTimestamp(date.getTime()),
        fromMillis: (ms) => makeTimestamp(ms),
    };

    const FieldValue = {
        serverTimestamp: () => '__SERVER_TIMESTAMP__',
        delete: () => '__DELETE__',
    };

    function resolveFilters(docs, filters) {
        return docs.filter((doc) => {
            return filters.every(({ field, op, value }) => {
                const docVal = field === '__name__' ? doc._id : doc[field];

                // Date comparison helper
                const toDate = (v) => {
                    if (v === null || v === undefined) return v;
                    if (v instanceof Date) return v;
                    if (typeof v === 'object' && typeof v.toDate === 'function') return v.toDate();
                    if (typeof v === 'string' && isNaN(Number(v))) {
                        const d = new Date(v);
                        return isNaN(d.getTime()) ? v : d;
                    }
                    if (typeof v === 'number') return new Date(v);
                    return v;
                };

                const comparableDoc = toDate(docVal);
                const comparableVal = toDate(value);

                if (comparableDoc instanceof Date && comparableVal instanceof Date) {
                    const a = comparableDoc.getTime();
                    const b = comparableVal.getTime();
                    switch (op) {
                        case '==': return a === b;
                        case '!=': return a !== b;
                        case '>': return a > b;
                        case '>=': return a >= b;
                        case '<': return a < b;
                        case '<=': return a <= b;
                        default: return false;
                    }
                }

                switch (op) {
                    case '==': return docVal === value;
                    case '!=': return docVal !== value;
                    case '>': return docVal > value;
                    case '>=': return docVal >= value;
                    case '<': return docVal < value;
                    case '<=': return docVal <= value;
                    case 'in': return Array.isArray(value) && value.includes(docVal);
                    case 'not-in': return !(Array.isArray(value) && value.includes(docVal));
                    case 'array-contains': return Array.isArray(docVal) && docVal.includes(value);
                    case 'array-contains-any': return Array.isArray(docVal) && Array.isArray(value) && value.some((v) => docVal.includes(v));
                    default: return false;
                }
            });
        });
    }

    function makeDocRef(collectionPath, docId) {
        return {
            id: docId,
            path: `${collectionPath}/${docId}`,
            get: async () => {
                const exists = !!(db[collectionPath] && db[collectionPath][docId]);
                return {
                    id: docId,
                    exists,
                    data: () => (exists ? { ...db[collectionPath][docId] } : undefined),
                    ref: makeDocRef(collectionPath, docId),
                };
            },
            set: async (data, options) => {
                if (!db[collectionPath]) db[collectionPath] = {};
                if (options?.merge) {
                    db[collectionPath][docId] = { ...(db[collectionPath][docId] || {}), ...data };
                } else {
                    db[collectionPath][docId] = data;
                }
            },
            update: async (data) => {
                if (!db[collectionPath]) db[collectionPath] = {};
                db[collectionPath][docId] = { ...(db[collectionPath][docId] || {}), ...data };
            },
            delete: async () => {
                if (db[collectionPath]) delete db[collectionPath][docId];
            },
        };
    }

    function makeQueryChain(collectionPath, filters = [], orderOpts = null, limitVal = null) {
        const chain = {
            where: (field, op, value) =>
                makeQueryChain(collectionPath, [...filters, { field, op, value }], orderOpts, limitVal),
            orderBy: (field, direction = 'asc') =>
                makeQueryChain(collectionPath, filters, { field, direction }, limitVal),
            limit: (n) =>
                makeQueryChain(collectionPath, filters, orderOpts, n),
            startAfter: () => chain,
            endAt: () => chain,
            get: async () => {
                let docs = Object.entries(db[collectionPath] || {}).map(([id, data]) => ({
                    _id: id,
                    ...data,
                }));

                docs = resolveFilters(docs, filters);

                if (orderOpts) {
                    docs.sort((a, b) => {
                        const va = a[orderOpts.field];
                        const vb = b[orderOpts.field];
                        const dir = orderOpts.direction === 'desc' ? -1 : 1;
                        if (va < vb) return -1 * dir;
                        if (va > vb) return 1 * dir;
                        return 0;
                    });
                }

                if (limitVal !== null) docs = docs.slice(0, limitVal);

                const result = docs.map((d) => {
                    const { _id, ...rest } = d;
                    return {
                        id: _id,
                        exists: true,
                        data: () => rest,
                        ref: makeDocRef(collectionPath, _id),
                    };
                });

                return {
                    docs: result,
                    empty: result.length === 0,
                    size: result.length,
                    forEach: (cb) => result.forEach(cb),
                };
            },
        };
        return chain;
    }

    function makeCollectionRef(path) {
        return {
            doc: (docId) => makeDocRef(path, docId || `mock-${Math.random().toString(36).slice(2, 10)}`),
            add: async (data) => {
                const id = `auto-${Math.random().toString(36).slice(2, 10)}`;
                if (!db[path]) db[path] = {};
                db[path][id] = data;
                return makeDocRef(path, id);
            },
            ...makeQueryChain(path),
        };
    }

    const batchOps = [];
    const mockBatch = {
        set: (ref, data, options) => { batchOps.push({ type: 'set', ref, data, options }); return mockBatch; },
        update: (ref, data) => { batchOps.push({ type: 'update', ref, data }); return mockBatch; },
        delete: (ref) => { batchOps.push({ type: 'delete', ref }); return mockBatch; },
        commit: async () => {
            for (const op of batchOps) {
                const parts = op.ref.path.split('/');
                const col = parts[0];
                const id = parts[1];
                if (op.type === 'delete') {
                    if (db[col]) delete db[col][id];
                } else if (op.type === 'update') {
                    if (!db[col]) db[col] = {};
                    db[col][id] = { ...(db[col][id] || {}), ...op.data };
                } else if (op.type === 'set') {
                    if (!db[col]) db[col] = {};
                    if (op.options?.merge) {
                        db[col][id] = { ...(db[col][id] || {}), ...op.data };
                    } else {
                        db[col][id] = op.data;
                    }
                }
            }
            batchOps.length = 0;
        },
    };

    let txOps = [];
    const mockFirestore = {
        collection: (path) => makeCollectionRef(path),
        doc: (path) => {
            const parts = path.split('/');
            return makeDocRef(parts[0], parts[1]);
        },
        batch: () => { batchOps.length = 0; return mockBatch; },
        runTransaction: async (fn) => {
            txOps = [];
            const tx = {
                get: async (ref) => {
                    const parts = ref.path.split('/');
                    const col = parts[0];
                    const id = parts[1];
                    const exists = !!(db[col] && db[col][id]);
                    return {
                        id,
                        exists,
                        data: () => (exists ? { ...db[col][id] } : undefined),
                        ref,
                    };
                },
                set: (ref, data, options) => { txOps.push({ type: 'set', ref, data, options }); },
                update: (ref, data) => { txOps.push({ type: 'update', ref, data }); },
                delete: (ref) => { txOps.push({ type: 'delete', ref }); },
            };
            const result = await fn(tx);
            // Apply tx operations
            for (const op of txOps) {
                const parts = op.ref.path.split('/');
                const col = parts[0];
                const id = parts[1];
                if (op.type === 'delete') {
                    if (db[col]) delete db[col][id];
                } else if (op.type === 'update') {
                    if (!db[col]) db[col] = {};
                    db[col][id] = { ...(db[col][id] || {}), ...op.data };
                } else if (op.type === 'set') {
                    if (!db[col]) db[col] = {};
                    if (op.options?.merge) {
                        db[col][id] = { ...(db[col][id] || {}), ...op.data };
                    } else {
                        db[col][id] = op.data;
                    }
                }
            }
            txOps = [];
            return result;
        },
        Timestamp,
        FieldValue,
        // Expose raw data for assertions
        _data: db,
    };

    return mockFirestore;
}

/**
 * Reset a mock DB with fresh initial data (avoids stale state between tests).
 */
export function resetFirestoreMock(mockFirestore, newData = {}) {
    const internal = mockFirestore._data;
    for (const key of Object.keys(internal)) delete internal[key];
    Object.assign(internal, JSON.parse(JSON.stringify(newData)));
}
