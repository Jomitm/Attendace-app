import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppConfig } from '../../js/config.js';

process.env.TZ = 'Asia/Kolkata';
globalThis.window = {};

const { AppAnalytics } = await import('../../js/modules/analytics.js');
const HOUR = 60 * 60 * 1000;
const baseLog = (date, extra = {}) => ({
    id: `att_${date}`,
    userId: 'analytics-regression-user',
    date,
    type: 'Present',
    attendanceEligible: true,
    checkIn: '09:00',
    checkOut: '17:00',
    durationMs: 8 * HOUR,
    ...extra
});

test('date-only attendance on month and financial-year end is included', async () => {
    const endOfMonth = baseLog('2026-09-30');
    const monthStats = AppAnalytics.calculateStatsForLogs([endOfMonth]);
    assert.equal(monthStats.present, 1);

    const originalDates = AppAnalytics.getFinancialYearDates;
    const originalRange = AppAnalytics.getAttendanceInRange;
    try {
        AppAnalytics.getFinancialYearDates = () => ({
            start: new Date(2026, 3, 1), end: new Date(2027, 2, 31), label: 'FY regression'
        });
        AppAnalytics.getAttendanceInRange = async () => [baseLog('2027-03-31')];
        const yearly = await AppAnalytics.getUserYearlyStats('analytics-regression-user');
        assert.equal(yearly.present, 1);
    } finally {
        AppAnalytics.getFinancialYearDates = originalDates;
        AppAnalytics.getAttendanceInRange = originalRange;
    }
});

test('leave-only records do not earn Performance attendance or punctuality', () => {
    const leaveLogs = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']
        .map(date => baseLog(date, { type: 'Casual Leave', location: 'On Leave' }));
    const week = {
        label: 'Leave regression', start: new Date(2026, 8, 21),
        end: new Date(2026, 8, 27, 23, 59, 59, 999), days: 7
    };
    const result = AppAnalytics._computeWeekPerformance(leaveLogs, [], week, {
        policy: AppConfig.HERO_POLICY, windowDays: 7, holidayDates: new Set(),
        wPunctuality: 0.15, wAttendance: 0.2, wTaskExecution: 0.25,
        wProductivity: 0.15, wPlanning: 0.15, wCompliance: 0.1,
        now: new Date(2026, 8, 28)
    });
    assert.equal(result.details.daysWorked, 0);
    assert.equal(result.dimensions.attendance.score, 0);
});

test('Hero counts each person-day once and gives half-day credit', () => {
    const duplicates = [
        baseLog('2026-09-22', { activityScore: 80 }),
        baseLog('2026-09-22', { activityScore: 80 })
    ];
    const fullDay = AppAnalytics.buildHeroCandidateStats(AppAnalytics.normalizeHeroLogs(duplicates))[0];
    assert.equal(fullDay.totalDurationMs, 8 * HOUR);
    assert.equal(fullDay.daysSet.size, 1);
    assert.equal(fullDay.dayCredit, 1);

    const halfDay = baseLog('2026-09-23', {
        type: 'Half Day', location: 'On Leave', dayCredit: 0.5,
        checkOut: '13:00', durationMs: 4 * HOUR
    });
    const half = AppAnalytics.buildHeroCandidateStats(AppAnalytics.normalizeHeroLogs([halfDay]))[0];
    assert.equal(half.dayCredit, 0.5);
    assert.equal(half.totalDurationMs, 4 * HOUR);
});

test('Short Leave is credited by hours and actual checkout outranks generated leave', () => {
    const stats = AppAnalytics.calculateStatsForLogs([
        baseLog('2026-09-22', { type: 'Short Leave', durationHours: 2 })
    ]);
    assert.equal(stats.present, 0.75);
    assert.equal(stats.leaves, 0.25);

    const actual = baseLog('2026-09-23', { activityScore: 90 });
    const generatedLeave = baseLog('2026-09-23', {
        type: 'Casual Leave', location: 'On Leave', leaveGenerated: true
    });
    const normalized = AppAnalytics.normalizeHeroLogs([generatedLeave, actual]);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].activityScore, 90);
});

test('yearly penalties sum month-level results and expose effective penalty', async () => {
    const originalDates = AppAnalytics.getFinancialYearDates;
    const originalRange = AppAnalytics.getAttendanceInRange;
    try {
        AppAnalytics.getFinancialYearDates = () => ({
            start: new Date(2026, 3, 1), end: new Date(2027, 2, 31), label: 'FY regression'
        });
        AppAnalytics.getAttendanceInRange = async () => [
            ...['2026-04-06', '2026-04-07', '2026-05-04', '2026-05-05'].map(date =>
                baseLog(date, { type: 'Late', lateCountable: true, checkIn: '09:30' }))
        ];
        const stats = await AppAnalytics.getUserYearlyStats('analytics-regression-user');
        assert.equal(stats.penaltyLeaves, 0);
        assert.equal(stats.effectivePenalty, 0);
        assert.equal(stats.penalty, stats.effectivePenalty);
    } finally {
        AppAnalytics.getFinancialYearDates = originalDates;
        AppAnalytics.getAttendanceInRange = originalRange;
    }
});

test('yearly overtime offsets do not erase a penalty earned in a different month', async () => {
    const originalDates = AppAnalytics.getFinancialYearDates;
    const originalRange = AppAnalytics.getAttendanceInRange;
    try {
        AppAnalytics.getFinancialYearDates = () => ({
            start: new Date(2026, 3, 1), end: new Date(2027, 2, 31), label: 'FY regression'
        });
        AppAnalytics.getAttendanceInRange = async () => [
            ...['2026-04-06', '2026-04-07'].map(date =>
                baseLog(date, { type: 'Late', lateCountable: true, checkIn: '09:30' })),
            baseLog('2026-04-08', { extraWorkedMs: 4 * HOUR }),
            ...['2026-05-04', '2026-05-05', '2026-05-06'].map(date =>
                baseLog(date, { type: 'Late', lateCountable: true, checkIn: '09:30' }))
        ];
        const stats = await AppAnalytics.getUserYearlyStats('analytics-regression-user');
        assert.equal(stats.penaltyLeaves, 0.5);
        assert.equal(stats.penaltyOffset, 0.5);
        assert.equal(stats.effectivePenalty, 0.5);
        assert.equal(stats.penalty, 0.5);
    } finally {
        AppAnalytics.getFinancialYearDates = originalDates;
        AppAnalytics.getAttendanceInRange = originalRange;
    }
});
