// @ts-check
// js/utils/working-days.js
// Pure helpers describing which days an employee is EXPECTED to attend.
// Used by the performance scorer (widget + leaderboard) so both score against
// the same denominator.
//
// Rules (Product decision, Phase 2 of the performance-reliability plan):
// - Required days = Monday–Friday, minus configured holidays.
// - Saturdays are NOT required (kept out of the denominator even when the
//   weekend policy marks them 'halfday' — flagged for veto, no objection).
// - Sundays are never required.
// - Holiday/weekend hours actually worked still count toward attendance and
//   extra-work numbers (attendance.js already stores non-working-day time as
//   extraWorkedMs); they just don't inflate the expected-days denominator.

/** Zero-padded local date key (YYYY-MM-DD). */
export function toDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(value) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    // Accepts 'YYYY-MM-DD' keys and full ISO datetimes ('YYYY-MM-DDTHH:mm:ss…'),
    // since attendance logs may carry either shape.
    const m = /^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/.exec(String(value || '').trim());
    if (!m) return null;
    const d = new Date(`${m[1]}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Is this day a required working day (Mon–Fri, not a configured holiday)?
 * @param {Date|string} date Date object or YYYY-MM-DD key.
 * @param {Set<string>|Iterable<string>} [holidayDates] Holiday date keys.
 */
export function isRequiredWorkingDay(date, holidayDates) {
    const d = parseDate(date);
    if (!d) return false;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return false;
    if (!holidayDates) return true;
    const duck = /** @type {any} */ (holidayDates);
    const has = typeof duck.has === 'function'
        ? (k) => duck.has(k)
        : (k) => Array.from(holidayDates).includes(k);
    return !has(toDateKey(d));
}

/**
 * Count required working days in the inclusive range [start, end].
 * Clamped iteration so huge ranges (year windows) stay cheap.
 * @param {Date} start
 * @param {Date} end
 * @param {Set<string>|Iterable<string>} [holidayDates]
 * @returns {number}
 */
export function countRequiredWorkingDays(start, end, holidayDates) {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return 0;
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    if (s > e) return 0;
    let count = 0;
    const cursor = new Date(s);
    // Safety: no range should exceed 2 years of daily iteration.
    let guard = 800;
    while (cursor <= e && guard-- > 0) {
        if (isRequiredWorkingDay(cursor, holidayDates)) count++;
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}
