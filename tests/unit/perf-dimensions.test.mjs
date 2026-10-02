// tests/unit/perf-dimensions.test.mjs
// Dimension guarantees for the "Your Performance" scorer:
//   1. Attendance hours bonus is driven by expectedHoursPerDay (canonical key)
//      with consistencyImpact honored as the legacy alias — stored overrides
//      keep tuning the same value the admin UI labels "Expected Hours/Day".
//   2. The consistency bonus derives from check-in spread (std-dev of clock
//      time), and Leave/Absent logs never inflate attended hours.
//   3. Compliance penalizes location mismatches and auto-checkouts with the
//      SAME formula on the widget and the leaderboard (rankHeroCandidates).
//   4. Classification bonus/warning follow CLASSIFICATION_BONUS thresholds
//      (minTasks 5, reward at ratio >= 0.8, warn below 0.4) and AI-set
//      priority counts as classified.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppConfig } from '../../js/config.js';

// Browser-ish globals before importing modules (window is read at runtime).
globalThis.window = {};

const { AppAnalytics } = await import('../../js/modules/analytics.js');
const { AppLeaves } = await import('../../js/modules/leaves.js');

const HOUR = 60 * 60 * 1000;
const policy = AppConfig.HERO_POLICY;
const weights = {
    wPunctuality: 0.15, wAttendance: 0.20, wTaskExecution: 0.25,
    wProductivity: 0.15, wPlanning: 0.15, wCompliance: 0.10
};

// Verified calendar: 2026-09-28 = Mon … 2026-10-04 = Sun.
const WEEK = {
    label: 'Sep 28 – Oct 4',
    start: new Date(2026, 8, 28, 0, 0, 0, 0),
    end: new Date(2026, 9, 4, 23, 59, 59, 999)
};
// After the window: full (non-pace) denominators, requiredDays = 5.
const AFTER = new Date(2026, 9, 10, 12, 0, 0, 0); // Saturday

const cfg = (overrides = {}) => ({
    ...weights,
    windowDays: 7,
    policy,
    holidayDates: new Set(),
    now: AFTER,
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

// Policy with a rewritten ATTENDANCE_MODIFIER (canonical key present).
const attPolicy = (overrides) => ({
    ...policy,
    ATTENDANCE_MODIFIER: { ...policy.ATTENDANCE_MODIFIER, ...overrides }
});

// Legacy stored shape: consistencyImpact only, no expectedHoursPerDay key.
const legacyAttPolicy = (consistencyImpact) => {
    const att = { ...policy.ATTENDANCE_MODIFIER };
    delete att.expectedHoursPerDay;
    att.consistencyImpact = consistencyImpact;
    return { ...policy, ATTENDANCE_MODIFIER: att };
};

const threeDayLogs = (checkInTimes = ['09:00', '09:00', '09:00']) => [
    mkLog('2026-09-28', { checkInAt: `2026-09-28T${checkInTimes[0]}:00` }),
    mkLog('2026-09-29', { checkInAt: `2026-09-29T${checkInTimes[1]}:00` }),
    mkLog('2026-09-30', { checkInAt: `2026-09-30T${checkInTimes[2]}:00` })
];

// ── 1–4: hours-day expectation (canonical key + legacy alias) ───────────────
// Fixture: 3 of 5 required days worked, 8h each, identical 09:00 check-ins.
// daysScore 60, consistency bonus 10. Expected hours (5-day window):
//   default 8h/day → 24/40 → bonus 6 → attendance 76
//   4h/day         → 24/20 → bonus 10 (capped) → attendance 80
test('attendance: default policy scores hours against 8h × required days', () => {
    const out = AppAnalytics._computeWeekPerformance(threeDayLogs(), [], WEEK, cfg());
    assert.equal(out.dimensions.attendance.score, 76);
});

test('attendance: expectedHoursPerDay (canonical key) drives the hours bonus', () => {
    const out = AppAnalytics._computeWeekPerformance(
        threeDayLogs(), [], WEEK, cfg({ policy: attPolicy({ expectedHoursPerDay: 4 }) })
    );
    assert.equal(out.dimensions.attendance.score, 80, '4h/day expectation must raise the hours bonus');
});

test('attendance: legacy consistencyImpact-only override still sets hours/day', () => {
    const out = AppAnalytics._computeWeekPerformance(
        threeDayLogs(), [], WEEK, cfg({ policy: legacyAttPolicy(4) })
    );
    assert.equal(out.dimensions.attendance.score, 80, 'stored legacy overrides must keep their tuning');
});

test('attendance: canonical key wins over a divergent legacy value', () => {
    const out = AppAnalytics._computeWeekPerformance(
        threeDayLogs(), [],
        WEEK,
        cfg({ policy: attPolicy({ expectedHoursPerDay: 4, consistencyImpact: 999 }) })
    );
    // Legacy 999 would give expected 4995h → bonus 0 → attendance 66.
    assert.equal(out.dimensions.attendance.score, 80, 'expectedHoursPerDay must take precedence');
});

// ── 5: consistency bonus follows check-in spread ────────────────────────────
test('attendance: scattered check-in times shrink the consistency bonus', () => {
    const stable = AppAnalytics._computeWeekPerformance(threeDayLogs(), [], WEEK, cfg());
    const scattered = AppAnalytics._computeWeekPerformance(
        threeDayLogs(['08:00', '09:00', '10:00']), [], WEEK, cfg()
    );
    assert.equal(stable.dimensions.attendance.score, 76, 'same check-in time → full consistency bonus');
    // stdDev of 08:00/09:00/10:00 = sqrt(2400) ≈ 48.99min → score 18 → bonus 2.
    assert.equal(scattered.dimensions.attendance.score, 68, 'spread check-ins must cost points');
});

// ── 6: Leave logs never inflate attended hours ──────────────────────────────
test('attendance: Leave logs count as days but contribute no hours', () => {
    const logs = [
        ...threeDayLogs(),
        mkLog('2026-10-01', { type: 'Leave - Annual', durationMs: 8 * HOUR, checkInAt: undefined })
    ];
    const out = AppAnalytics._computeWeekPerformance(logs, [], WEEK, cfg());
    // daysWorked 4 (leave day included) → daysScore 80; hours stay 24/40 → 6;
    // consistency over the three 09:00 check-ins → 10. Leave hours would make
    // it 32/40 → 8 → 98, so 96 pins the exclusion.
    assert.equal(out.dimensions.attendance.score, 96);
});

// ── 7: compliance penalties (widget) ────────────────────────────────────────
test('compliance: location mismatches and auto-checkouts both penalize', () => {
    const mismatchLogs = [
        mkLog('2026-09-28', { locationMismatched: true }),
        mkLog('2026-09-29', { locationMismatched: true }),
        mkLog('2026-09-30'),
        mkLog('2026-10-01'),
        mkLog('2026-10-02')
    ];
    const twoMismatch = AppAnalytics._computeWeekPerformance(mismatchLogs, [], WEEK, cfg());
    assert.equal(twoMismatch.dimensions.compliance.score, 80, '2/5 × 50pts');
    assert.equal(twoMismatch.details.locationMismatches, 2);
    assert.equal(twoMismatch.details.autoCheckouts, 0);

    const withAuto = AppAnalytics._computeWeekPerformance(
        [mismatchLogs[0], ...mismatchLogs.slice(1).map((l, i) => (i === 0 ? { ...l, autoCheckout: true } : l))],
        [], WEEK, cfg()
    );
    assert.equal(withAuto.dimensions.compliance.score, 70, '2 mismatches + 1 auto-checkout');
    assert.equal(withAuto.details.autoCheckouts, 1);

    const allFlagged = AppAnalytics._computeWeekPerformance(
        ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map((d) =>
            mkLog(d, { locationMismatched: true, autoCheckout: true })
        ),
        [], WEEK, cfg()
    );
    assert.equal(allFlagged.dimensions.compliance.score, 0, 'penalties clamp at zero, never negative');
});

// ── 8: widget ↔ leaderboard compliance parity ───────────────────────────────
test('compliance: widget and leaderboard apply the identical formula', () => {
    const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'];
    const widgetLogs = dates.map((d, i) => mkLog(d, {
        locationMismatched: i < 2,
        autoCheckout: i === 0
    }));
    const heroLogs = widgetLogs.map((l) => ({ ...l, userId: 'u1', date: `${l.date}T09:00:00` }));

    const widget = AppAnalytics._computeWeekPerformance(widgetLogs, [], WEEK, cfg());

    const attendanceStats = [{
        userId: 'u1',
        totalDurationMs: 5 * 8 * HOUR,
        daysSet: new Set(dates),
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
        heroLogs,
        [],
        { start: '2026-09-28T00:00:00', end: '2026-10-04T23:59:59' },
        new Set()
    );
    const row = results.find((r) => r.userId === 'u1');
    assert.ok(row, 'candidate row exists');
    assert.equal(row.compliance, widget.dimensions.compliance.score,
        'same 2 mismatches + 1 auto-checkout must score the same on both surfaces');
    assert.equal(row.compliance, 70);
});

// ── 9–13: classification bonus / warning thresholds ─────────────────────────
const mkPlans = (tasks) => [{
    id: 'p1', userId: 'u1', date: '2026-09-28',
    plans: tasks
}];
const task = (name, extra = {}) => ({
    task: name,
    status: 'completed',
    completedDate: '2026-09-28T18:00:00',
    ...extra
});
const tasks = (count, classified = {}) =>
    Array.from({ length: count }, (_, i) => task(`Task ${i + 1}`, classified(i)));

test('classification: full classification earns the bonus, no warning', () => {
    const out = AppAnalytics._computeWeekPerformance(
        [], mkPlans(tasks(6, () => ({ priorityLevel: 'important' }))), WEEK, cfg()
    );
    assert.equal(out.details.taskPlanned, 6);
    assert.equal(out.details.classifiedCount, 6);
    assert.equal(out.details.classificationBonus, 3, 'ratio 1.0 ≥ 0.8 with planned ≥ 5');
    assert.equal(out.details.classificationWarning, false);
});

test('classification: sparse classification warns instead of rewarding', () => {
    const out = AppAnalytics._computeWeekPerformance(
        [], mkPlans(tasks(6, (i) => (i < 2 ? { priorityLevel: 'important' } : {}))), WEEK, cfg()
    );
    assert.equal(out.details.classifiedCount, 2);
    assert.equal(out.details.classificationBonus, 0, 'ratio 0.33 < 0.8 → no bonus');
    assert.equal(out.details.classificationWarning, true, 'ratio 0.33 < 0.4 → warning shown');
});

test('classification: mid ratio earns nothing but stays quiet', () => {
    const out = AppAnalytics._computeWeekPerformance(
        [], mkPlans(tasks(6, (i) => (i < 3 ? { priorityLevel: 'important' } : {}))), WEEK, cfg()
    );
    assert.equal(out.details.classifiedCount, 3);
    assert.equal(out.details.classificationBonus, 0, 'ratio 0.5 < 0.8 → no bonus');
    assert.equal(out.details.classificationWarning, false, 'ratio 0.5 ≥ 0.4 → no warning');
});

test('classification: aiPriorityLevel counts as classified', () => {
    const out = AppAnalytics._computeWeekPerformance(
        [], mkPlans(tasks(6, () => ({ aiPriorityLevel: 'high' }))), WEEK, cfg()
    );
    assert.equal(out.details.classifiedCount, 6, 'AI-set priority must count like a human one');
    assert.equal(out.details.classificationBonus, 3);
});

test('classification: below minTasks neither rewards nor warns', () => {
    const out = AppAnalytics._computeWeekPerformance(
        [], mkPlans(tasks(4, () => ({ priorityLevel: 'important' }))), WEEK, cfg()
    );
    assert.equal(out.details.taskPlanned, 4, 'planned < minTasks (5)');
    assert.equal(out.details.classificationBonus, 0);
    assert.equal(out.details.classificationWarning, false);
});

// ── 14–15: policy merge keeps stored tuning visible under the canonical key ─
test('mergeHeroPolicy promotes a legacy consistencyImpact to expectedHoursPerDay', () => {
    const merged = AppLeaves.mergeHeroPolicy({
        ATTENDANCE_MODIFIER: { consistencyImpact: 4, maxBonus: 12 }
    });
    assert.equal(merged.ATTENDANCE_MODIFIER.expectedHoursPerDay, 4,
        'stored legacy tuning must win over the base default');
    assert.equal(merged.ATTENDANCE_MODIFIER.consistencyImpact, 4);
    assert.equal(merged.ATTENDANCE_MODIFIER.maxBonus, 12);
    assert.equal(merged.ATTENDANCE_MODIFIER.consistencyBonus,
        policy.ATTENDANCE_MODIFIER.consistencyBonus, 'untouched defaults survive the merge');
});

test('mergeHeroPolicy keeps stored canonical values and falls back to defaults', () => {
    const stored = AppLeaves.mergeHeroPolicy({
        ATTENDANCE_MODIFIER: { expectedHoursPerDay: 6, consistencyImpact: 6 }
    });
    assert.equal(stored.ATTENDANCE_MODIFIER.expectedHoursPerDay, 6,
        'base default must not shadow a stored canonical value');
    assert.equal(stored.ATTENDANCE_MODIFIER.consistencyImpact, 6);

    const bare = AppLeaves.mergeHeroPolicy();
    assert.equal(bare.ATTENDANCE_MODIFIER.expectedHoursPerDay,
        policy.ATTENDANCE_MODIFIER.expectedHoursPerDay, 'no override → config default');
});
