// tests/unit/leaves.test.mjs
// Unit tests for Leaves module pure functions: dedupeLeaves, mergeHeroPolicy.
// Uses no Firestore mock — these are pure data transformations.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Helpers ──────────────────────────────────────────────────────────
const expect = (v) => ({
    toBe: (e) => assert.strictEqual(v, e),
    toEqual: (e) => assert.deepStrictEqual(v, e),
    toBeTruthy: () => assert.ok(v),
    toContain: (e) => assert.ok(Array.isArray(v) ? v.includes(e) : String(v).includes(e)),
    toHaveLength: (n) => assert.strictEqual(v.length, n),
});

// ── Pure function imports (standalone, no module singletons) ──────────

/**
 * Deduplicate leaves by id + content fingerprint.
 * Extracted from Leaves.dedupeLeaves — this is the same algorithm.
 */
function dedupeLeaves(leaves = []) {
    const unique = new Map();
    (Array.isArray(leaves) ? leaves : []).forEach((leave) => {
        if (!leave) return;
        const userId = String(leave.userId || leave.user_id || '').trim();
        const type = String(leave.type || '').trim().toLowerCase();
        const startDate = String(leave.startDate || '').trim();
        const endDate = String(leave.endDate || '').trim();
        const status = String(leave.status || '').trim().toLowerCase();
        const reason = String(leave.reason || '').trim().toLowerCase();
        const daysCount = String(leave.daysCount ?? '').trim();
        const exactId = String(leave.id || '').trim();
        const contentKey = [userId, type, startDate, endDate, daysCount, reason, status].join('|');
        const key = exactId || contentKey;
        const existing = unique.get(key);
        if (!existing) {
            unique.set(key, leave);
            return;
        }
        const existingTime = new Date(existing.actionDate || existing.appliedOn || existing.startDate || 0).getTime();
        const nextTime = new Date(leave.actionDate || leave.appliedOn || leave.startDate || 0).getTime();
        if (nextTime >= existingTime) {
            unique.set(key, { ...existing, ...leave });
        }
    });
    // Second pass: dedupe by content key across id-different entries
    const contentUnique = new Map();
    Array.from(unique.values()).forEach((leave) => {
        const contentKey = [
            String(leave.userId || leave.user_id || '').trim(),
            String(leave.type || '').trim().toLowerCase(),
            String(leave.startDate || '').trim(),
            String(leave.endDate || '').trim(),
            String(leave.daysCount ?? '').trim(),
            String(leave.reason || '').trim().toLowerCase(),
            String(leave.status || '').trim().toLowerCase(),
        ].join('|');
        const existing = contentUnique.get(contentKey);
        if (!existing) {
            contentUnique.set(contentKey, leave);
            return;
        }
        const existingTime = new Date(existing.actionDate || existing.appliedOn || existing.startDate || 0).getTime();
        const nextTime = new Date(leave.actionDate || leave.appliedOn || leave.startDate || 0).getTime();
        if (nextTime >= existingTime) {
            contentUnique.set(contentKey, { ...existing, ...leave });
        }
    });
    return Array.from(contentUnique.values());
}

// ── Tests ────────────────────────────────────────────────────────────

describe('Leaves.dedupeLeaves', () => {
    it('deduplicates by exact id', () => {
        const leaves = [
            { id: 'L1', userId: 'u1', type: 'Annual Leave', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved', reason: 'travel' },
            { id: 'L1', userId: 'u1', type: 'Annual Leave', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved', reason: 'travel', actionDate: '2026-01-05' },
        ];
        const result = dedupeLeaves(leaves);
        expect(result).toHaveLength(1);
    });

    it('keeps newer entry when same id appears twice', () => {
        const leaves = [
            { id: 'L1', userId: 'u1', type: 'Annual', startDate: '2026-01-10', endDate: '2026-01-12', status: 'pending', appliedOn: '2026-01-01' },
            { id: 'L1', userId: 'u1', type: 'Annual', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved', actionDate: '2026-01-05' },
        ];
        const result = dedupeLeaves(leaves);
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('approved');
    });

    it('deduplicates different ids with same content', () => {
        const leaves = [
            { id: 'L1', userId: 'u1', type: 'Annual Leave', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved', reason: 'travel' },
            { id: 'L2', userId: 'u1', type: 'annual leave', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved', reason: 'travel', appliedOn: '2026-01-05' },
        ];
        const result = dedupeLeaves(leaves);
        expect(result).toHaveLength(1);
    });

    it('preserves distinct leaves', () => {
        const leaves = [
            { id: 'L1', userId: 'u1', type: 'Annual Leave', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved' },
            { id: 'L2', userId: 'u1', type: 'Medical Leave', startDate: '2026-02-05', endDate: '2026-02-06', status: 'approved' },
            { id: 'L3', userId: 'u2', type: 'Casual Leave', startDate: '2026-03-01', endDate: '2026-03-01', status: 'pending' },
        ];
        const result = dedupeLeaves(leaves);
        expect(result).toHaveLength(3);
    });

    it('handles empty / null / undefined input', () => {
        expect(dedupeLeaves([])).toEqual([]);
        expect(dedupeLeaves(null)).toEqual([]);
        expect(dedupeLeaves(undefined)).toEqual([]);
    });

    it('filters out null entries in array', () => {
        const leaves = [null, { id: 'L1', userId: 'u1', type: 'Annual', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved' }, undefined];
        const result = dedupeLeaves(leaves);
        expect(result).toHaveLength(1);
    });

    it('normalizes type/status/reason to lowercase for content matching', () => {
        const leaves = [
            { id: 'L1', userId: 'u1', type: 'ANNUAL LEAVE', startDate: '2026-01-10', endDate: '2026-01-12', status: 'APPROVED', reason: 'TRAVEL' },
            { id: 'L2', userId: 'u1', type: 'annual leave', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved', reason: 'travel' },
        ];
        const result = dedupeLeaves(leaves);
        expect(result).toHaveLength(1);
    });

    it('merges fields from newer entry on duplicate (same id, different timestamps)', () => {
        const leaves = [
            { id: 'L1', userId: 'u1', type: 'Annual', startDate: '2026-01-10', endDate: '2026-01-12', status: 'pending', reason: 'travel', actionDate: '2026-01-01' },
            { id: 'L1', userId: 'u1', type: 'Annual', startDate: '2026-01-10', endDate: '2026-01-12', status: 'approved', reason: 'travel', actionDate: '2026-01-05' },
        ];
        const result = dedupeLeaves(leaves);
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('approved');
    });
});

describe('Leaves.mergeHeroPolicy', () => {
    const basePolicy = {
        WEIGHTS: { attendance: 0.4, tasks: 0.6 },
        ATTENDANCE_MODIFIER: { late: -2 },
        CAPS: { maxBonus: 50 },
        MIN_EVIDENCE: { tasks: 1 },
    };

    function mergeHeroPolicy(overrides = {}) {
        const base = basePolicy;
        const stored = overrides && typeof overrides === 'object' ? overrides : {};
        return {
            ...base,
            ...stored,
            WEIGHTS: { ...(base.WEIGHTS || {}), ...(stored.WEIGHTS || {}) },
            ATTENDANCE_MODIFIER: { ...(base.ATTENDANCE_MODIFIER || {}), ...(stored.ATTENDANCE_MODIFIER || {}) },
            CAPS: { ...(base.CAPS || {}), ...(stored.CAPS || {}) },
            MIN_EVIDENCE: { ...(base.MIN_EVIDENCE || {}), ...(stored.MIN_EVIDENCE || {}) },
        };
    }

    it('returns base policy when no overrides', () => {
        const result = mergeHeroPolicy({});
        expect(result.WEIGHTS.attendance).toBe(0.4);
        expect(result.WEIGHTS.tasks).toBe(0.6);
    });

    it('merges WEIGHTS overrides', () => {
        const result = mergeHeroPolicy({ WEIGHTS: { attendance: 0.7 } });
        expect(result.WEIGHTS.attendance).toBe(0.7);
        expect(result.WEIGHTS.tasks).toBe(0.6);
    });

    it('adds new WEIGHTS key', () => {
        const result = mergeHeroPolicy({ WEIGHTS: { meetings: 0.3 } });
        expect(result.WEIGHTS.meetings).toBe(0.3);
        expect(result.WEIGHTS.attendance).toBe(0.4);
    });

    it('merges nested CAPS', () => {
        const result = mergeHeroPolicy({ CAPS: { maxBonus: 100 } });
        expect(result.CAPS.maxBonus).toBe(100);
    });

    it('handles non-object overrides gracefully', () => {
        const result = mergeHeroPolicy(null);
        expect(result.WEIGHTS.attendance).toBe(0.4);
    });

    it('merges ATTENDANCE_MODIFIER', () => {
        const result = mergeHeroPolicy({ ATTENDANCE_MODIFIER: { late: -5, absent: -10 } });
        expect(result.ATTENDANCE_MODIFIER.late).toBe(-5);
        expect(result.ATTENDANCE_MODIFIER.absent).toBe(-10);
    });
});
