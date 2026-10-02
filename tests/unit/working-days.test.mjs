// tests/unit/working-days.test.mjs
// Required-working-day helpers used by the performance scorer denominators:
// Mon–Fri minus configured holidays; Saturdays/Sundays never required.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toDateKey, isRequiredWorkingDay, countRequiredWorkingDays } from '../../js/utils/working-days.js';

// Calendar facts (verified): 2026-09-28 = Monday, 2026-09-29 = Tuesday,
// 2026-09-30 = Wednesday, 2026-10-03 = Saturday, 2026-10-04 = Sunday.

test('toDateKey pads month and day', () => {
    assert.equal(toDateKey(new Date(2026, 0, 5)), '2026-01-05');
    assert.equal(toDateKey(new Date(2026, 11, 31)), '2026-12-31');
});

test('weekdays are required, weekends are not', () => {
    assert.equal(isRequiredWorkingDay('2026-09-28', new Set()), true);  // Mon
    assert.equal(isRequiredWorkingDay('2026-09-30', new Set()), true);  // Wed
    assert.equal(isRequiredWorkingDay('2026-10-03', new Set()), false); // Sat
    assert.equal(isRequiredWorkingDay('2026-10-04', new Set()), false); // Sun
});

test('configured holidays remove weekdays from the denominator', () => {
    const holidays = new Set(['2026-09-29']);
    assert.equal(isRequiredWorkingDay('2026-09-29', holidays), false); // Tue holiday
    assert.equal(isRequiredWorkingDay('2026-09-28', holidays), true);  // Mon still required
});

test('accepts Date objects and full ISO datetimes, rejects junk', () => {
    assert.equal(isRequiredWorkingDay(new Date(2026, 8, 28), new Set()), true);
    assert.equal(isRequiredWorkingDay('2026-09-28T09:30:00', new Set()), true);
    assert.equal(isRequiredWorkingDay('not-a-date', new Set()), false);
    assert.equal(isRequiredWorkingDay('', new Set()), false);
    assert.equal(isRequiredWorkingDay(null, new Set()), false);
});

test('holiday set may be a plain array', () => {
    assert.equal(isRequiredWorkingDay('2026-09-29', ['2026-09-29']), false);
});

test('countRequiredWorkingDays: full week Mon–Sun = 5', () => {
    const count = countRequiredWorkingDays(
        new Date(2026, 8, 28), // Mon
        new Date(2026, 9, 4),   // Sun
        new Set()
    );
    assert.equal(count, 5);
});

test('countRequiredWorkingDays subtracts holidays', () => {
    const count = countRequiredWorkingDays(
        new Date(2026, 8, 28),
        new Date(2026, 9, 4),
        new Set(['2026-09-29']) // Tue holiday
    );
    assert.equal(count, 4);
});

test('countRequiredWorkingDays: weekend-only range = 0, inverted range = 0', () => {
    assert.equal(countRequiredWorkingDays(new Date(2026, 9, 3), new Date(2026, 9, 4), new Set()), 0);
    assert.equal(countRequiredWorkingDays(new Date(2026, 9, 4), new Date(2026, 8, 28), new Set()), 0);
});

test('countRequiredWorkingDays: accepts date-key strings', () => {
    assert.equal(countRequiredWorkingDays('2026-09-28', '2026-10-04', new Set()), 5);
});

test('huge ranges stay bounded by the iteration guard', () => {
    const count = countRequiredWorkingDays(new Date(2020, 0, 1), new Date(2030, 11, 31), new Set());
    assert.ok(count > 0 && count <= 600, `guard-bounded count, got ${count}`);
});
