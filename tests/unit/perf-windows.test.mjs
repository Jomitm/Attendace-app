import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformanceWindows, MIN_TREND_POINTS, YEAR_TREND_POINTS, daySpan } from '../../js/utils/perf-windows.js';

// All assertions are component-based (local Y/M/D), not absolute-timestamp
// based, so they hold in any timezone / DST configuration.

function ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function isStartOfDay(d) {
    return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
}

function isEndOfDay(d) {
    return d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59 && d.getMilliseconds() === 999;
}

/** Midnight of the day after d (local, DST-safe via setDate + setHours). */
function nextDayStart(d) {
    const x = new Date(d);
    x.setDate(x.getDate() + 1);
    x.setHours(0, 0, 0, 0);
    return x;
}

// Known fixed dates: Wed Sep 30 2026 (env "today"), Mon Oct 5 2026.
const WED = new Date(2026, 8, 30, 14, 30, 0, 0);
const MONDAY = new Date(2026, 9, 5, 9, 0, 0, 0);

describe('buildPerformanceWindows — current window includes today', () => {
    it('current window ends today (end-of-day) and covers "now"', () => {
        const { scoreWindows } = buildPerformanceWindows({ now: MONDAY, windowDays: 7, trendWeeks: 4 });
        const cur = scoreWindows[0];
        assert.equal(ymd(cur.end), ymd(MONDAY), 'current window must end today');
        assert.ok(cur.end.getTime() >= MONDAY.getTime(), 'current window must include now');
        assert.ok(isEndOfDay(cur.end), 'current window ends at 23:59:59.999');
    });

    it("Monday's window is the current week (Mon..Mon), not the previous week", () => {
        const { scoreWindows } = buildPerformanceWindows({ now: MONDAY, windowDays: 7, trendWeeks: 4 });
        const cur = scoreWindows[0];
        assert.equal(ymd(cur.start), ymd(addDays(MONDAY, -6)), 'starts 6 days ago');
        assert.equal(ymd(cur.end), ymd(MONDAY), 'ends today');
        // The old builder ended yesterday, showing the ENTIRE previous week on Monday.
        assert.notEqual(ymd(cur.end), ymd(addDays(MONDAY, -1)), 'must not be the previous-week window');
        assert.ok(isStartOfDay(cur.start), 'current window starts at 00:00:00.000');
    });

    it('current window spans exactly windowDays days', () => {
        for (const windowDays of [7, 30]) {
            const { scoreWindows } = buildPerformanceWindows({ now: WED, windowDays, trendWeeks: 4 });
            const cur = scoreWindows[0];
            assert.equal(daySpan(cur.start, cur.end), windowDays);
            assert.equal(cur.days, windowDays);
            assert.equal(ymd(cur.end), ymd(WED));
        }
    });
});

describe('buildPerformanceWindows — contiguity (no 1-day gap)', () => {
    it('rolling-week trend windows are contiguous', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, windowDays: 7, trendWeeks: 4 });
        for (let i = 0; i < trendWindows.length - 1; i++) {
            const newer = trendWindows[i];
            const older = trendWindows[i + 1];
            assert.equal(
                newer.start.getTime(),
                nextDayStart(older.end).getTime(),
                `gap/overlap between trend window ${i} and ${i + 1}`
            );
        }
    });

    it('covers the day that fell in the old builder gap (day -7)', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, windowDays: 7, trendWeeks: 4 });
        // Old bug: window0 = days -6..-1, window1 = days -14..-8 → day -7 uncovered.
        assert.equal(ymd(trendWindows[1].end), ymd(addDays(WED, -7)), 'day -7 must be the end of trend window 1');
        assert.equal(ymd(trendWindows[1].start), ymd(addDays(WED, -13)));
    });

    it('contiguous span reaches exactly from trend start to today', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, windowDays: 7, trendWeeks: 4 });
        const oldest = trendWindows[trendWindows.length - 1];
        const expectedStart = addDays(WED, -(trendWindows.length * 7) + 1);
        assert.equal(ymd(oldest.start), ymd(expectedStart));
        assert.equal(daySpan(oldest.start, trendWindows[0].end), trendWindows.length * 7);
    });

    it('calendar-month trend windows are contiguous', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, calendarMonth: true, trendWeeks: 4 });
        for (let i = 0; i < trendWindows.length - 1; i++) {
            const newer = trendWindows[i];
            const older = trendWindows[i + 1];
            assert.equal(newer.start.getTime(), nextDayStart(older.end).getTime());
        }
    });
});

describe('buildPerformanceWindows — trend floor', () => {
    it('week period with trendWeeks=1 is floored to 4 trend points', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, windowDays: 7, trendWeeks: 1 });
        assert.equal(trendWindows.length, MIN_TREND_POINTS);
        assert.equal(MIN_TREND_POINTS, 4);
    });

    it('requested trend length above the floor is honored', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, windowDays: 7, trendWeeks: 6 });
        assert.equal(trendWindows.length, 6);
    });

    it('calendar month is floored to 4 monthly trend points', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, calendarMonth: true, trendWeeks: 1 });
        assert.equal(trendWindows.length, 4);
        // Newest first: current month, then previous months.
        assert.equal(ymd(trendWindows[0].start), '2026-09-01');
        assert.equal(ymd(trendWindows[1].start), '2026-08-01');
    });

    it('trend windows are returned newest-first', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, windowDays: 7, trendWeeks: 5 });
        for (let i = 0; i < trendWindows.length - 1; i++) {
            assert.ok(trendWindows[i].start.getTime() > trendWindows[i + 1].start.getTime());
        }
    });
});

describe('buildPerformanceWindows — year period', () => {
    it('scores the year in a single window', () => {
        const { scoreWindows } = buildPerformanceWindows({ now: WED, windowDays: 365, trendWeeks: 12 });
        assert.equal(scoreWindows.length, 1);
        const win = scoreWindows[0];
        assert.equal(win.label, '2026');
        assert.equal(ymd(win.start), '2026-01-01');
        assert.equal(ymd(win.end), '2026-12-31');
        assert.ok(isStartOfDay(win.start) && isEndOfDay(win.end));
        assert.equal(win.days, 365); // 2026 is not a leap year
    });

    it('builds 12 monthly trend points (previously promised but never built)', () => {
        const { trendWindows } = buildPerformanceWindows({ now: WED, windowDays: 365, trendWeeks: 12 });
        assert.equal(trendWindows.length, YEAR_TREND_POINTS);
        assert.equal(YEAR_TREND_POINTS, 12);
        // Newest first: Sep 2026 back to Oct 2025.
        assert.equal(ymd(trendWindows[0].start), '2026-09-01');
        assert.equal(ymd(trendWindows[1].start), '2026-08-01');
        assert.equal(ymd(trendWindows[11].start), '2025-10-01');
        const labels = new Set(trendWindows.map(w => w.label));
        assert.equal(labels.size, 12, 'every monthly trend label must be distinct');
        for (let i = 0; i < trendWindows.length - 1; i++) {
            assert.equal(
                trendWindows[i].start.getTime(),
                nextDayStart(trendWindows[i + 1].end).getTime(),
                'monthly trend windows must be contiguous'
            );
        }
    });
});

describe('buildPerformanceWindows — calendar month', () => {
    it('current month window runs 1st 00:00 → last day 23:59:59.999', () => {
        const { scoreWindows } = buildPerformanceWindows({ now: WED, windowDays: 30, trendWeeks: 4, calendarMonth: true });
        const cur = scoreWindows[0];
        assert.equal(ymd(cur.start), '2026-09-01');
        assert.equal(ymd(cur.end), '2026-09-30');
        assert.ok(isStartOfDay(cur.start) && isEndOfDay(cur.end));
        assert.equal(cur.days, 30);
        assert.equal(cur.label, 'September 2026');
    });
});

describe('daySpan', () => {
    it('counts inclusive calendar days', () => {
        assert.equal(daySpan(new Date(2026, 8, 24), new Date(2026, 8, 30)), 7);
        assert.equal(daySpan(new Date(2026, 8, 30), new Date(2026, 8, 30)), 1);
        assert.equal(daySpan(new Date(2026, 0, 1), new Date(2026, 11, 31)), 365);
    });
});
