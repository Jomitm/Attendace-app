//! /tests/unit/date-helpers.test.mjs
// Regression tests for the shared date utilities introduced when unifying the
// app's four divergent date-key implementations. The critical invariant: values
// representing a LOCAL calendar day must never shift across midnight due to
// UTC-based formatting (the old normalizeDateKey used toISOString()).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getLocalISO, coerceEpochMs, toDateKeyFromValue } from '../../js/utils/date-helpers.js';

const expect = (actual) => ({
    toBe: (expected) => assert.strictEqual(actual, expected),
    toEqual: (expected) => assert.deepStrictEqual(actual, expected)
});

describe('getLocalISO', () => {
    it('formats using local calendar parts', () => {
        const d = new Date(2026, 7, 23, 14, 30);
        expect(getLocalISO(d)).toBe('2026-08-23');
    });

    it('zero-pads month and day', () => {
        const d = new Date(2026, 0, 5);
        expect(getLocalISO(d)).toBe('2026-01-05');
    });

    it('defaults to now without throwing', () => {
        expect(/^\d{4}-\d{2}-\d{2}$/.test(getLocalISO())).toBe(true);
    });
});

describe('coerceEpochMs', () => {
    it('accepts finite numbers and rejects non-finite ones', () => {
        expect(coerceEpochMs(1750000000000)).toBe(1750000000000);
        expect(coerceEpochMs(NaN)).toBe(null);
        expect(coerceEpochMs(Infinity)).toBe(null);
    });

    it('accepts numeric strings', () => {
        expect(coerceEpochMs('1750000000000')).toBe(1750000000000);
        expect(coerceEpochMs('  1750000000000 ')).toBe(1750000000000);
    });

    it('accepts Date instances', () => {
        const d = new Date(2026, 7, 23, 9, 15);
        expect(coerceEpochMs(d)).toBe(d.getTime());
        expect(coerceEpochMs(new Date(NaN))).toBe(null);
    });

    it('accepts Firestore Timestamp-like objects via toMillis()', () => {
        expect(coerceEpochMs({ toMillis: () => 1750000000000 })).toBe(1750000000000);
        expect(coerceEpochMs({ toMillis: () => NaN })).toBe(null);
    });

    it('parses ISO strings', () => {
        expect(coerceEpochMs('2026-08-23T00:00:00Z')).toBe(Date.parse('2026-08-23T00:00:00Z'));
    });

    it('returns null for missing or garbage values instead of NaN', () => {
        expect(coerceEpochMs(null)).toBe(null);
        expect(coerceEpochMs(undefined)).toBe(null);
        expect(coerceEpochMs('')).toBe(null);
        expect(coerceEpochMs('not-a-date')).toBe(null);
        expect(coerceEpochMs({})).toBe(null);
        expect(coerceEpochMs(true)).toBe(null);
    });
});

describe('toDateKeyFromValue', () => {
    it('passes normalized YYYY-MM-DD strings through untouched', () => {
        expect(toDateKeyFromValue('2026-08-23')).toBe('2026-08-23');
        expect(toDateKeyFromValue('2026-13-45')).toBe('2026-13-45');
    });

    it('keys a local-midnight Date to its own LOCAL day in any host timezone', () => {
        // Regression: the previous implementation used toISOString() (UTC),
        // which shifted this value to the PREVIOUS day for positive UTC offsets.
        const localMidnight = new Date(2026, 7, 23, 0, 0, 0, 0);
        expect(toDateKeyFromValue(localMidnight)).toBe('2026-08-23');
    });

    it('keys epoch millis by the local calendar day', () => {
        const ms = new Date(2026, 7, 23, 23, 59).getTime();
        expect(toDateKeyFromValue(ms)).toBe(getLocalISO(new Date(ms)));
    });

    it('keys numeric-string timestamps like numbers', () => {
        const ms = new Date(2026, 7, 23, 12).getTime();
        expect(toDateKeyFromValue(String(ms))).toBe(getLocalISO(new Date(ms)));
    });

    it('keys Firestore Timestamp-like objects correctly', () => {
        const ms = new Date(2026, 7, 23, 8).getTime();
        expect(toDateKeyFromValue({ toMillis: () => ms })).toBe(getLocalISO(new Date(ms)));
    });

    it('returns empty string for missing or invalid values', () => {
        expect(toDateKeyFromValue(null)).toBe('');
        expect(toDateKeyFromValue(undefined)).toBe('');
        expect(toDateKeyFromValue('')).toBe('');
        expect(toDateKeyFromValue('garbage')).toBe('');
        expect(toDateKeyFromValue(new Date(NaN))).toBe('');
    });
});
