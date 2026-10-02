// tests/unit/perf-scoring.test.mjs
// Phase 2 input-accuracy guarantees for the "Your Performance" scorer:
//   1. Partial windows score against ELAPSED required working days (pace),
//      not the full window that hasn't happened yet.
//   2. Punctuality only counts required working days — a late Saturday or a
//      holiday is not a lateness offense.
//   3. Postpone lineage collapses to one logical task; completions without a
//      timestamp are excluded from the on-time rate (not silently on-time).
//   4. The leaderboard (rankHeroCandidates) applies the same rules as the
//      widget — no denominator drift between the two surfaces.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppConfig } from '../../js/config.js';

// Browser-ish globals before importing the module (window is read at runtime
// by classifyHeroTaskStatus via window.AppCalendar?).
globalThis.window = {};

const { AppAnalytics } = await import('../../js/modules/analytics.js');

const HOUR = 60 * 60 * 1000;
const policy = AppConfig.HERO_POLICY;
const weights = {
    wPunctuality: 0.15, wAttendance: 0.20, wTaskExecution: 0.25,
    wProductivity: 0.15, wPlanning: 0.15, wCompliance: 0.10
};

// Verified calendar: 2026-09-28 = Mon … 2026-09-30 = Wed, 2026-10-03 = Sat, 2026-10-04 = Sun.
const WEEK = {
    label: 'Sep 28 – Oct 4',
    start: new Date(2026, 8, 28, 0, 0, 0, 0),
    end: new Date(2026, 9, 4, 23, 59, 59, 999),
    days: 7
};

const cfg = (overrides = {}) => ({
    ...weights,
    windowDays: 7,
    policy,
    holidayDates: new Set(),
    ...overrides
});

const mkLog = (date, extra = {}) => ({
    date,
    type: 'present',
    lateCountable: false,
    durationMs: 8 * HOUR,
    activityScore: 80,
    checkInAt: `${date}T09:00:00`,
    pausedMs: 0,
    pauseCount: 0,
    ...extra
});

const lateLog = (date) => mkLog(date, { type: 'late', lateCountable: true });

test('pace denominators: partial Wednesday is not judged against a full week', () => {
    const now = new Date(2026, 8, 30, 18, 0, 0, 0); // Wednesday evening
    const logs = [mkLog('2026-09-28'), mkLog('2026-09-29'), mkLog('2026-09-30')];

    const out = AppAnalytics._computeWeekPerformance(logs, [], WEEK, cfg({ now }));

    // Full-week denominators would score days as 3/7 (43) → ~57 total.
    // Pace: 3 elapsed required days, 3 worked → attendance at/near ceiling.
    assert.ok(
        out.dimensions.attendance.score >= 90,
        `expected >= 90 on pace denominator, got ${out.dimensions.attendance.score}`
    );
    assert.equal(out.details.daysWorked, 3);
    assert.equal(out.details.requiredDays, 5);           // full window: Mon–Fri
    assert.equal(out.details.requiredDaysElapsed, 3);     // Mon, Tue, Wed elapsed
    assert.equal(out.details.windowPartial, true);
});

test('punctuality ignores late logs on holidays and weekends', () => {
    const now = new Date(2026, 9, 4, 21, 0, 0, 0); // Sunday evening (window complete)
    const holidayDates = new Set(['2026-09-29']);   // Tuesday holiday
    const logs = [
        mkLog('2026-09-28'),        // Mon on time
        lateLog('2026-09-29'),      // Tue HOLIDAY, late → excluded
        mkLog('2026-09-30'),        // Wed on time
        mkLog('2026-10-01'),        // Thu on time
        mkLog('2026-10-02'),        // Fri on time
        lateLog('2026-10-03'),      // Saturday, late → excluded
        lateLog('2026-10-04')       // Sunday, late → excluded
    ];

    const out = AppAnalytics._computeWeekPerformance(logs, [], WEEK, cfg({ now, holidayDates }));

    assert.equal(out.dimensions.punctuality.score, 100, 'weekend/holiday lates must not count');
    assert.equal(out.details.lateDays, 0);
    assert.equal(out.details.totalDays, 7, 'raw log count unchanged');
    assert.equal(out.details.requiredDays, 4, 'Mon–Fri minus Tuesday holiday');
    assert.equal(out.details.requiredDaysElapsed, 4);
});

test('postpone lineage counts once; undated completion is not on-time', () => {
    const now = new Date(2026, 9, 5, 12, 0, 0, 0); // after the window
    const plans = [
        {
            id: 'planA', userId: 'u1', date: '2026-09-28',
            plans: [{ task: 'Write report', status: 'postponed' }]
        },
        {
            id: 'planB', userId: 'u1', date: '2026-09-29',
            plans: [{
                task: 'Write report (Postponed from 2026-09-28)',
                status: 'postponed',
                addedFrom: 'postponed',
                sourcePlanId: 'planA',
                sourceTaskIndex: 0
            }]
        },
        {
            id: 'planC', userId: 'u1', date: '2026-09-30',
            plans: [{ task: 'Finish thing', status: 'completed' }] // no completedDate
        }
    ];

    const out = AppAnalytics._computeWeekPerformance([], plans, WEEK, cfg({ now }));

    assert.equal(out.details.taskPlanned, 2, 'shadowed source collapses into its postponed copy');
    assert.equal(out.details.taskPostponed, 1);
    assert.equal(out.details.taskCompleted, 1);
    assert.equal(out.details.timedCompleted, 0, 'no timestamp → timing unknown');
    assert.equal(out.details.onTimeCompleted, 0, 'undated completion must not count on-time');
});

test('leaderboard mirrors the widget: punctuality + task dedupe parity', () => {
    const holidayDates = new Set(['2026-09-29']);
    const mkHeroLog = (key) => ({
        userId: 'u1',
        date: `${key}T09:00:00`,
        type: 'present',
        lateCountable: false,
        durationMs: 8 * HOUR,
        activityScore: 80,
        workDescription: 'Daily delivery work details for the window.',
        extraWorkedMs: 0,
        pausedMs: 0,
        pauseCount: 0
    });
    const rawLogs = [
        mkHeroLog('2026-09-28'),
        { ...mkHeroLog('2026-09-29'), type: 'late', lateCountable: true }, // holiday late
        mkHeroLog('2026-09-30'),
        mkHeroLog('2026-10-01'),
        mkHeroLog('2026-10-02'),
        { ...mkHeroLog('2026-10-03'), type: 'late', lateCountable: true }, // Saturday late
        { ...mkHeroLog('2026-10-04'), type: 'late', lateCountable: true }  // Sunday late
    ];
    const plans = [
        {
            id: 'planA', userId: 'u1', date: '2026-09-28',
            plans: [{ task: 'Write report', status: 'postponed' }]
        },
        {
            id: 'planB', userId: 'u1', date: '2026-09-29',
            plans: [{
                task: 'Write report (Postponed from 2026-09-28)',
                status: 'postponed',
                addedFrom: 'postponed',
                sourcePlanId: 'planA',
                sourceTaskIndex: 0
            }]
        },
        {
            id: 'planC', userId: 'u1', date: '2026-09-30',
            plans: [{ task: 'Finish thing', status: 'completed' }]
        }
    ];
    const attendanceStats = [{
        userId: 'u1',
        totalDurationMs: 7 * 8 * HOUR,
        daysSet: new Set([
            '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01',
            '2026-10-02', '2026-10-03', '2026-10-04'
        ]),
        activityLogDepth: 1200,
        totalPauseMs: 0,
        totalPauseCount: 0,
        checkInTimes: []
    }];
    const taskStats = new Map([['u1', { planned: 0, completed: 0, inProgress: 0, missed: 0, postponed: 0 }]]);

    const results = AppAnalytics.rankHeroCandidates(
        attendanceStats,
        taskStats,
        policy,
        rawLogs,
        plans,
        { start: '2026-09-28T00:00:00', end: '2026-10-04T23:59:59' },
        holidayDates
    );

    const row = results.find((r) => r.userId === 'u1');
    assert.ok(row, 'candidate row exists');
    assert.equal(row.punctuality, 100, 'weekend/holiday lates excluded on the leaderboard too');
    assert.equal(row.taskPlanned, 2, 'postpone lineage deduped like the widget');
    assert.equal(row.taskPostponed, 1);
    assert.equal(row.taskCompleted, 1);
    assert.ok(
        Number.isFinite(row.finalScore) && row.finalScore >= 0 && row.finalScore <= 100,
        `finalScore in [0,100], got ${row.finalScore}`
    );
});

// 5. A Firestore read failure must surface error:true so the UI can show a
//    retry card — an outage may never masquerade as a genuine all-zero score.
test('read failure returns error:true, not a bare zero payload', async () => {
    const orig = AppAnalytics.getAttendanceInRange;
    AppAnalytics.getAttendanceInRange = async () => {
        throw new Error('simulated Firestore outage');
    };
    try {
        const out = await AppAnalytics.getPersonalPerformance('u1', { windowDays: 7, trendWeeks: 4 });
        assert.equal(out.error, true, 'error flag set');
        assert.equal(out.composite, 0);
        assert.deepEqual(out.trend, []);
        assert.equal(out.userId, 'u1');
    } finally {
        AppAnalytics.getAttendanceInRange = orig;
    }
});
