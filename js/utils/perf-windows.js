// @ts-check
// js/utils/perf-windows.js
// Pure window builder for the personal performance widget ("Your Performance").
//
// Contract (reliability fixes — covered by tests/unit/perf-windows.test.mjs):
// - The CURRENT window (index 0) ENDS TODAY (23:59:59.999) so today's
//   check-ins, tasks and plan are included. Previously the score window ended
//   yesterday, so on Monday the "This Week" tab showed the entire previous
//   week and today's activity never counted.
// - Windows are CONTIGUOUS: start(i + 1) = end(i) - 1 calendar day. The old
//   builder left a 1-day gap between every pair of trend windows.
// - The trend always carries at least MIN_TREND_POINTS points, regardless of
//   what the caller passes (the week tab used to request a 1-point trend,
//   which made the AI coach permanently say "not enough trend data").
// - The year period scores the current year in one window and builds
//   YEAR_TREND_POINTS monthly trend points around it.
//
// All windows are returned NEWEST-FIRST (index 0 = current period).

export const MIN_TREND_POINTS = 4;
export const YEAR_TREND_POINTS = 12;

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}

/** Whole calendar days spanned by [start, end] (DST-safe via startOfDay diff). */
export function daySpan(start, end) {
    return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000) + 1;
}

function weeklyLabel(start, end) {
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)}–${fmt(end)}`;
}

function monthLabel(firstOfMonth, long) {
    return firstOfMonth.toLocaleDateString('en-US',
        long ? { month: 'long', year: 'numeric' } : { month: 'short', year: '2-digit' });
}

/**
 * Build the score + trend windows for a performance period.
 *
 * @param {object} opts
 * @param {Date}   [opts.now]         Reference "today" (injectable for tests).
 * @param {number} [opts.windowDays]  Width of one period window (7|30|365).
 * @param {number} [opts.trendWeeks]  Requested trend length (floored at MIN_TREND_POINTS).
 * @param {boolean}[opts.calendarMonth] Use calendar-month windows instead of rolling days.
 * @returns {{ scoreWindows: Array<{start: Date, end: Date, label: string, days: number}>,
 *             trendWindows: Array<{start: Date, end: Date, label: string, days: number}> }}
 *          Both arrays are newest-first. For week/month periods they reference
 *          the SAME window objects (trend includes the current window); for the
 *          year period trendWindows holds 12 monthly windows while
 *          scoreWindows holds the single current-year window.
 */
export function buildPerformanceWindows(opts = {}) {
    const now = opts.now instanceof Date && !Number.isNaN(opts.now.getTime()) ? opts.now : new Date();
    const width = Math.max(1, Math.round(Number(opts.windowDays) || 7));
    const requestedTrend = Math.max(1, Number(opts.trendWeeks) || 1);
    const trendCount = Math.max(MIN_TREND_POINTS, requestedTrend);

    // ── Calendar month: current month first, then previous months ──
    if (opts.calendarMonth === true) {
        const windows = [];
        for (let i = 0; i < trendCount; i++) {
            const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(first.getFullYear(), first.getMonth(), 1);
            const end = endOfDay(new Date(first.getFullYear(), first.getMonth() + 1, 0));
            windows.push({
                start,
                end,
                label: monthLabel(first, true),
                days: daySpan(start, end)
            });
        }
        return { scoreWindows: windows, trendWindows: windows };
    }

    // ── Yearly: one current-year score window + 12 monthly trend points ──
    if (width >= 365) {
        const year = now.getFullYear();
        const yearStart = new Date(year, 0, 1);
        const yearEnd = endOfDay(new Date(year, 11, 31));
        const scoreWindows = [{
            start: yearStart,
            end: yearEnd,
            label: `${year}`,
            days: daySpan(yearStart, yearEnd)
        }];
        const trendWindows = [];
        for (let i = 0; i < YEAR_TREND_POINTS; i++) {
            const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(first.getFullYear(), first.getMonth(), 1);
            const end = endOfDay(new Date(first.getFullYear(), first.getMonth() + 1, 0));
            trendWindows.push({
                start,
                end,
                label: monthLabel(first, false),
                days: daySpan(start, end)
            });
        }
        return { scoreWindows, trendWindows };
    }

    // ── Rolling window (week / custom): contiguous, ending TODAY ──
    const windows = [];
    for (let i = 0; i < trendCount; i++) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * width);
        const endEod = endOfDay(end);
        const start = new Date(endEod);
        start.setDate(endEod.getDate() - (width - 1));
        const startSod = startOfDay(start);
        windows.push({
            start: startSod,
            end: endEod,
            label: width <= 7 ? weeklyLabel(startSod, endEod) : monthLabel(startSod, true),
            days: daySpan(startSod, endEod)
        });
    }
    return { scoreWindows: windows, trendWindows: windows };
}
