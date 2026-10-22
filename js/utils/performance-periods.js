// Shared performance windows used by the dashboard and performance views.
export const PERF_PERIODS = [
    { key: 'week', label: 'This Week', windowDays: 7, trendWeeks: 4 },
    { key: 'month', label: 'This Month', windowDays: 30, trendWeeks: 4, calendarMonth: true },
    { key: 'year', label: 'This Year', windowDays: 365, trendWeeks: 12 }
];
