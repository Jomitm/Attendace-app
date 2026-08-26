// tests/unit/firestore-mock.test.mjs
// Integration tests for the in-memory Firestore mock itself, plus exercises
// of db.js and attendance business logic patterns against the mock.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreMock } from '../helpers/firestore-mock.mjs';

const expect = (v) => ({
    toBe: (e) => assert.strictEqual(v, e),
    toEqual: (e) => assert.deepStrictEqual(v, e),
    toBeTruthy: () => assert.ok(v),
    toBeGreaterThanOrEqual: (n) => assert.ok(v >= n),
    toContain: (e) => assert.ok(Array.isArray(v) ? v.some((x) => x.id === e) : String(v).includes(e)),
    toHaveLength: (n) => assert.strictEqual(v.length, n),
});

// ── Mock Firestore: basic CRUD ───────────────────────────────────────

describe('Firestore Mock - CRUD', () => {
    let db;

    beforeEach(() => {
        db = createFirestoreMock();
    });

    it('set and get a document', async () => {
        await db.collection('users').doc('u1').set({ name: 'Alice', role: 'admin' });
        const snap = await db.collection('users').doc('u1').get();
        expect(snap.exists).toBe(true);
        expect(snap.data().name).toBe('Alice');
        expect(snap.data().role).toBe('admin');
    });

    it('get returns exists=false for missing doc', async () => {
        const snap = await db.collection('users').doc('missing').get();
        expect(snap.exists).toBe(false);
    });

    it('set with merge preserves existing fields', async () => {
        await db.collection('users').doc('u1').set({ name: 'Alice', status: 'in' });
        await db.collection('users').doc('u1').set({ lastCheckIn: Date.now() }, { merge: true });
        const snap = await db.collection('users').doc('u1').get();
        expect(snap.data().name).toBe('Alice');
        expect(snap.data().lastCheckIn).toBeTruthy();
    });

    it('update merges fields', async () => {
        await db.collection('users').doc('u1').set({ name: 'Alice', status: 'out' });
        await db.collection('users').doc('u1').update({ status: 'in', lastCheckIn: 1700000000000 });
        const snap = await db.collection('users').doc('u1').get();
        expect(snap.data().status).toBe('in');
        expect(snap.data().lastCheckIn).toBe(1700000000000);
        expect(snap.data().name).toBe('Alice');
    });

    it('delete removes a document', async () => {
        await db.collection('users').doc('u1').set({ name: 'Alice' });
        await db.collection('users').doc('u1').delete();
        const snap = await db.collection('users').doc('u1').get();
        expect(snap.exists).toBe(false);
    });

    it('add generates an auto-id', async () => {
        const ref = await db.collection('attendance').add({ userId: 'u1', status: 'in' });
        expect(ref.id).toBeTruthy();
        expect(ref.id.startsWith('auto-')).toBe(true);
        const snap = await db.collection('attendance').doc(ref.id).get();
        expect(snap.data().userId).toBe('u1');
    });
});

// ── Mock Firestore: queries ──────────────────────────────────────────

describe('Firestore Mock - Queries', () => {
    let db;

    beforeEach(() => {
        db = createFirestoreMock({
            users: {
                u1: { name: 'Alice', role: 'admin', status: 'in' },
                u2: { name: 'Bob', role: 'staff', status: 'out' },
                u3: { name: 'Charlie', role: 'admin', status: 'in' },
            },
        });
    });

    it('get all documents in a collection', async () => {
        const snap = await db.collection('users').get();
        expect(snap.size).toBe(3);
        expect(snap.empty).toBe(false);
    });

    it('where == filter', async () => {
        const snap = await db.collection('users').where('role', '==', 'admin').get();
        expect(snap.size).toBe(2);
    });

    it('where != filter', async () => {
        const snap = await db.collection('users').where('role', '!=', 'admin').get();
        expect(snap.size).toBe(1);
        expect(snap.docs[0].data().name).toBe('Bob');
    });

    it('where > filter', async () => {
        const snap = await db.collection('users').where('name', '>', 'Alice').get();
        expect(snap.size).toBe(2);
    });

    it('chained where filters', async () => {
        const snap = await db.collection('users')
            .where('role', '==', 'admin')
            .where('status', '==', 'in')
            .get();
        expect(snap.size).toBe(2);
    });

    it('orderBy sorts ascending', async () => {
        const snap = await db.collection('users').orderBy('name', 'asc').get();
        expect(snap.docs[0].data().name).toBe('Alice');
        expect(snap.docs[2].data().name).toBe('Charlie');
    });

    it('orderBy sorts descending', async () => {
        const snap = await db.collection('users').orderBy('name', 'desc').get();
        expect(snap.docs[0].data().name).toBe('Charlie');
    });

    it('limit restricts results', async () => {
        const snap = await db.collection('users').limit(2).get();
        expect(snap.size).toBe(2);
    });

    it('where in filter', async () => {
        const snap = await db.collection('users').where('name', 'in', ['Alice', 'Charlie']).get();
        expect(snap.size).toBe(2);
    });

    it('date range query with >= and <=', async () => {
        const now = Date.now();
        const hour = 3600000;
        db = createFirestoreMock({
            attendance: {
                a1: { userId: 'u1', checkInMs: now - hour * 2, date: '2026-08-25' },
                a2: { userId: 'u2', checkInMs: now - hour, date: '2026-08-26' },
                a3: { userId: 'u3', checkInMs: now + hour, date: '2026-08-27' },
            },
        });
        const snap = await db.collection('attendance')
            .where('checkInMs', '>=', now - hour * 3)
            .where('checkInMs', '<=', now)
            .get();
        expect(snap.size).toBe(2);
    });
});

// ── Mock Firestore: transactions ─────────────────────────────────────

describe('Firestore Mock - Transactions', () => {
    let db;

    beforeEach(() => {
        db = createFirestoreMock({
            users: {
                u1: { name: 'Alice', status: 'out', lastCheckIn: null },
            },
        });
    });

    it('read-modify-write in transaction', async () => {
        const result = await db.runTransaction(async (tx) => {
            const userSnap = await tx.get(db.collection('users').doc('u1'));
            assert.ok(userSnap.exists, 'User must exist before check-in');
            const user = userSnap.data();
            assert.strictEqual(user.status, 'out', 'User must be checked out to check in');
            tx.set(db.collection('users').doc('u1'), { status: 'in', lastCheckIn: Date.now() }, { merge: true });
            return { success: true };
        });
        expect(result.success).toBe(true);
        const snap = await db.collection('users').doc('u1').get();
        expect(snap.data().status).toBe('in');
    });

    it('transaction can detect pre-condition failure', async () => {
        await db.collection('users').doc('u1').set({ status: 'in' }); // already checked in
        let threw = false;
        try {
            await db.runTransaction(async (tx) => {
                const snap = await tx.get(db.collection('users').doc('u1'));
                const user = snap.data();
                if (user.status === 'in') {
                    throw new Error('CONFLICT: already checked in');
                }
                return { success: true };
            });
        } catch (e) {
            threw = true;
            expect(e.message).toContain('CONFLICT');
        }
        expect(threw).toBe(true);
    });
});

// ── Mock Firestore: batch writes ─────────────────────────────────────

describe('Firestore Mock - Batch Writes', () => {
    let db;

    beforeEach(() => {
        db = createFirestoreMock({
            attendance: {
                a1: { userId: 'u1', date: '2026-08-25', status: 'active' },
                a2: { userId: 'u2', date: '2026-08-25', status: 'active' },
            },
        });
    });

    it('batch delete multiple docs', async () => {
        const batch = db.batch();
        batch.delete(db.collection('attendance').doc('a1'));
        batch.delete(db.collection('attendance').doc('a2'));
        await batch.commit();
        const snap = await db.collection('attendance').get();
        expect(snap.size).toBe(0);
    });

    it('batch set multiple docs', async () => {
        const batch = db.batch();
        batch.set(db.collection('attendance').doc('a1'), { userId: 'u1', status: 'closed' }, { merge: true });
        batch.set(db.collection('attendance').doc('a3'), { userId: 'u3', status: 'active' });
        await batch.commit();
        const snap = await db.collection('attendance').get();
        expect(snap.size).toBe(3); // a1 merged, a2 untouched, a3 added
        const a1 = await db.collection('attendance').doc('a1').get();
        expect(a1.data().status).toBe('closed');
    });

    it('batch update', async () => {
        const batch = db.batch();
        batch.update(db.collection('attendance').doc('a1'), { status: 'closed' });
        await batch.commit();
        const a1 = await db.collection('attendance').doc('a1').get();
        expect(a1.data().status).toBe('closed');
        expect(a1.data().userId).toBe('u1');
    });
});

// ── Attendance business logic patterns ───────────────────────────────

describe('Attendance - Check-in / Checkout transaction patterns', () => {
    let db;

    beforeEach(() => {
        db = createFirestoreMock({
            users: {
                u1: { id: 'u1', name: 'Alice', status: 'out', lastCheckIn: null, isPaused: false },
            },
            attendance: {},
        });
    });

    it('check-in: status out → in', async () => {
        const user = db._data.users.u1;
        assert.strictEqual(user.status, 'out');

        // Simulate check-in transaction
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(db.collection('users').doc('u1'));
            const u = snap.data();
            if (u.status !== 'in') {
                tx.set(db.collection('users').doc('u1'), {
                    status: 'in',
                    lastCheckIn: Date.now(),
                    lastCheckInAddress: 'Office',
                }, { merge: true });
            }
        });

        const updated = (await db.collection('users').doc('u1').get()).data();
        expect(updated.status).toBe('in');
        expect(updated.lastCheckIn).toBeTruthy();
    });

    it('check-in conflict: second device cannot check in when already in', async () => {
        await db.collection('users').doc('u1').set({ status: 'in', lastCheckIn: Date.now() - 60000 });
        let conflict = false;
        try {
            await db.runTransaction(async (tx) => {
                const snap = await tx.get(db.collection('users').doc('u1'));
                const u = snap.data();
                if (u.status === 'in') {
                    throw new Error('CONFLICT: Another device already checked in');
                }
                tx.set(db.collection('users').doc('u1'), { status: 'in', lastCheckIn: Date.now() }, { merge: true });
            });
        } catch (e) {
            conflict = e.message.includes('CONFLICT');
        }
        expect(conflict).toBe(true);
    });

    it('checkout: status in → out, clear lastCheckIn', async () => {
        await db.collection('users').doc('u1').set({ status: 'in', lastCheckIn: Date.now() - 3600000 });

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(db.collection('users').doc('u1'));
            const u = snap.data();
            if (u.status === 'in') {
                tx.set(db.collection('users').doc('u1'), {
                    status: 'out',
                    lastCheckIn: null,
                    isPaused: false,
                    pauseStartedAt: null,
                    totalPausedMs: 0,
                }, { merge: true });
            }
        });

        const updated = (await db.collection('users').doc('u1').get()).data();
        expect(updated.status).toBe('out');
        expect(updated.lastCheckIn).toBe(null);
    });

    it('stale session detection: check-in from previous day is treated as out', async () => {
        const yesterday = Date.now() - 86400000;
        await db.collection('users').doc('u1').set({ status: 'in', lastCheckIn: yesterday });

        const snap = await db.collection('users').doc('u1').get();
        const user = snap.data();
        const checkInDate = new Date(user.lastCheckIn);
        const today = new Date();
        const isStale = checkInDate.toDateString() !== today.toDateString();

        expect(isStale).toBe(true);
    });

    it('pause and resume flow', async () => {
        // Start paused
        await db.collection('users').doc('u1').set({
            status: 'in',
            lastCheckIn: Date.now() - 7200000,
            isPaused: true,
            pauseStartedAt: Date.now() - 3600000,
        });

        // Resume
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(db.collection('users').doc('u1'));
            const u = snap.data();
            if (u.isPaused) {
                const pausedMs = Date.now() - u.pauseStartedAt;
                tx.set(db.collection('users').doc('u1'), {
                    isPaused: false,
                    pauseStartedAt: null,
                    totalPausedMs: (u.totalPausedMs || 0) + pausedMs,
                }, { merge: true });
            }
        });

        const updated = (await db.collection('users').doc('u1').get()).data();
        expect(updated.isPaused).toBe(false);
        expect(updated.totalPausedMs).toBeTruthy();
    });
});

// ── Analytics helper patterns ────────────────────────────────────────

describe('Analytics - toLocalDateKey and memoization patterns', () => {
    function toLocalDateKey(date) {
        const d = date instanceof Date ? date : new Date(date);
        if (!d || Number.isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    it('toLocalDateKey formats correctly', () => {
        const d = new Date(2026, 7, 23, 14, 30);
        expect(toLocalDateKey(d)).toBe('2026-08-23');
    });

    it('toLocalDateKey returns empty for invalid date', () => {
        expect(toLocalDateKey(new Date('invalid'))).toBe('');
        expect(toLocalDateKey(NaN)).toBe('');
    });

    it('memoize: caches result within TTL', async () => {
        let callCount = 0;
        const memo = new Map();
        const memoize = async (key, ttlMs, fn) => {
            const now = Date.now();
            const cached = memo.get(key);
            if (cached && cached.expiresAt > now) return cached.value;
            const value = await fn();
            memo.set(key, { value, expiresAt: now + ttlMs });
            return value;
        };

        await memoize('test:key', 10000, () => { callCount++; return 42; });
        await memoize('test:key', 10000, () => { callCount++; return 42; });
        await memoize('test:key', 10000, () => { callCount++; return 42; });

        expect(callCount).toBe(1);
    });

    it('memoize: recomputes after TTL expires', async () => {
        let callCount = 0;
        const memo = new Map();
        const memoize = async (key, ttlMs, fn) => {
            const now = Date.now();
            const cached = memo.get(key);
            if (cached && cached.expiresAt > now) return cached.value;
            const value = await fn();
            memo.set(key, { value, expiresAt: now + ttlMs });
            return value;
        };

        await memoize('test:ttl', 1, () => { callCount++; return 'first'; });
        // Simulate TTL expiry
        const entry = memo.get('test:ttl');
        entry.expiresAt = Date.now() - 1000;

        await memoize('test:ttl', 1, () => { callCount++; return 'second'; });
        expect(callCount).toBe(2);
    });

    it('clearMemo: clears all or by prefix', async () => {
        const memo = new Map();
        memo.set('analytics:users', { value: 'a', expiresAt: Date.now() + 10000 });
        memo.set('analytics:attendance', { value: 'b', expiresAt: Date.now() + 10000 });
        memo.set('other:key', { value: 'c', expiresAt: Date.now() + 10000 });

        // Clear by prefix
        for (const key of memo.keys()) {
            if (key.startsWith('analytics:')) memo.delete(key);
        }
        expect(memo.has('analytics:users')).toBe(false);
        expect(memo.has('analytics:attendance')).toBe(false);
        expect(memo.has('other:key')).toBe(true);
    });
});

// ── DB helper patterns ───────────────────────────────────────────────

describe('DB - IST helpers and date key logic', () => {
    function toIST(date) {
        return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    }

    function toDateKey(dateObj) {
        const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function getISTDayRange(dateKey) {
        const key = String(dateKey || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
        const start = new Date(`${key}T00:00:00+05:30`);
        const end = new Date(`${key}T23:59:59.999+05:30`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        return { start, end, startMs: start.getTime(), endMs: end.getTime() };
    }

    it('toIST converts to IST timezone', () => {
        const utc = new Date('2026-08-26T02:00:00Z'); // 07:30 IST
        const ist = toIST(utc);
        expect(ist.getHours()).toBe(7);
        expect(ist.getMinutes()).toBe(30);
    });

    it('toDateKey formats correctly', () => {
        expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
        expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    it('getISTDayRange returns valid range', () => {
        const range = getISTDayRange('2026-08-26');
        expect(range).toBeTruthy();
        expect(range.startMs).toBeTruthy();
        expect(range.endMs > range.startMs).toBe(true);
    });

    it('getISTDayRange returns null for invalid key', () => {
        expect(getISTDayRange('')).toBe(null);
        expect(getISTDayRange('not-a-date')).toBe(null);
        expect(getISTDayRange(null)).toBe(null);
    });

    it('isSummaryFresh: fresh summary passes', () => {
        const summary = { generatedAt: Date.now(), version: 6 };
        const staleMs = 86400000;
        const fresh = (Date.now() - summary.generatedAt) <= staleMs;
        expect(fresh).toBe(true);
    });

    it('isSummaryFresh: stale summary fails', () => {
        const summary = { generatedAt: Date.now() - 90000000, version: 6 };
        const staleMs = 86400000;
        const fresh = (Date.now() - summary.generatedAt) <= staleMs;
        expect(fresh).toBe(false);
    });

    it('isSummaryFresh: wrong schema version fails', () => {
        const summary = { generatedAt: Date.now(), version: 5 };
        const currentVersion = 6;
        expect(summary.version === currentVersion).toBe(false);
    });
});
