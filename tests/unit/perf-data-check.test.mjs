import test from 'node:test';
import assert from 'node:assert/strict';

// Inert DOM before importing (module registers window aliases).
globalThis.window = {};
const { verifyPerformanceData } = await import('../../js/modules/ai-performance-coach.js');

// Real-world weekly payload: 4 days worked of 5 required working days
// (calendar window is 7), attendance legitimately 100 via
// daysScore 80 + hours bonus + consistency bonus.
const base = () => ({
    composite: 79,
    windowDays: 7,
    dimensions: {
        punctuality: { score: 100 },
        attendance: { score: 100 },
        taskExecution: { score: 50 },
        productivity: { score: 70 },
        planning: { score: 80 },
        compliance: { score: 88 }
    },
    details: {
        lateDays: 0, totalDays: 4, daysWorked: 4,
        attendanceDenom: 5, requiredDays: 5, requiredDaysElapsed: 5,
        taskMissed: 0, taskPostponed: 0,
        locationMismatches: 0, autoCheckouts: 0
    }
});

const find = (r, dim) => r.checks.find(c => c.dimension === dim);

test('attendance 100 over all required working days passes (calendar-window false positive)', () => {
    const r = verifyPerformanceData(base());
    const att = find(r, 'Attendance');
    assert.equal(att?.ok, true, `unexpected flag: ${JSON.stringify(att)}`);
    assert.equal(r.allOk, true, JSON.stringify(r.checks));
});

test('attendance above the day-ratio ceiling is flagged', () => {
    const p = base();
    p.details = { ...p.details, daysWorked: 1, attendanceDenom: 5 }; // 1/5 → 20+45 = 65
    const att = find(verifyPerformanceData(p), 'Attendance');
    assert.equal(att?.ok, false, 'inflated attendance must flag');
    assert.match(String(att.note), /impossible/);
});

test('legacy payload without attendanceDenom falls back to requiredDays', () => {
    const p = base();
    p.details = { ...p.details, daysWorked: 2 };
    delete p.details.attendanceDenom; // denom → requiredDays 5 → 40+45 = 85 < 100
    const att = find(verifyPerformanceData(p), 'Attendance');
    assert.equal(att?.ok, false, 'fallback denominator must still catch inflation');

    const pass = base();
    pass.dimensions.attendance.score = 80;
    pass.details = { ...pass.details, daysWorked: 2 };
    delete pass.details.attendanceDenom;
    assert.equal(find(verifyPerformanceData(pass), 'Attendance').ok, true);
});

test('punctuality 100 with late days is flagged', () => {
    const p = base();
    p.details = { ...p.details, lateDays: 2 };
    const c = find(verifyPerformanceData(p), 'Punctuality');
    assert.equal(c?.ok, false, 'late days + score 100 must flag');
});

test('composite outside the dimension envelope is flagged', () => {
    const p = base();
    p.composite = 20; // dims are 50–100 → 20 is outside [min-5, max+5]
    const c = find(verifyPerformanceData(p), 'Composite');
    assert.equal(c?.ok, false);
});
