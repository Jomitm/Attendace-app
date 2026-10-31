import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { attendanceToday, selectAttendanceLog, buildAttendanceSheet, filterAttendanceRows, attendanceSheetCSV } from '../../js/utils/attendance-sheet.js';

const users = [{ id: 'a', name: 'Alice, Finance', dept: 'Finance' }, { id: 'b', name: 'Beena', dept: 'Programmes', joinDate: '2026-10-12' }];
const log = (extra = {}) => ({ id: 'punch', user_id: 'a', date: '2026-10-05', type: 'Present', checkIn: '09:00', checkOut: '17:00', attendanceEligible: true, activityScore: 1, ...extra });
const sheet = (options = {}) => buildAttendanceSheet({ users, logs: [], month: 9, year: 2026, today: '2026-10-29', ...options });
const cell = (result, day, index = 0) => result.rows[index].cells[day - 1];

test('India calendar date is correct around UTC midnight', () => {
    assert.equal(attendanceToday(new Date('2026-10-28T19:00:00Z')), '2026-10-29');
});

test('real punches outrank generated leave; manual override wins consistently', () => {
    const leave = log({ id: 'leave', type: 'Casual Leave', leaveGenerated: true });
    const punch = log();
    assert.equal(selectAttendanceLog([leave, punch], 'a', punch.date), punch);
    const manual = log({ id: 'override', isManualOverride: true, type: 'On Duty' });
    assert.equal(selectAttendanceLog([leave, punch, manual], 'a', punch.date), manual);
    assert.equal(cell(sheet({ logs: [leave, punch, manual] }), 5).log, manual);
});

test('work-only entries never count as attendance', () => {
    const work = log({ entrySource: 'staff_manual_work', attendanceEligible: false });
    assert.equal(cell(sheet({ logs: [work] }), 5).code, 'A');
    assert.equal(selectAttendanceLog([work], 'a', work.date), null);
});

test('calendar, joining date, future days and today do not become false absences', () => {
    const result = sheet({ holidays: [{ date: '2026-10-02', name: 'National holiday' }] });
    assert.equal(cell(result, 2).code, 'H');
    assert.equal(cell(result, 4).code, 'H');
    assert.equal(cell(result, 10).code, 'H');
    assert.equal(cell(result, 3).code, '—');
    assert.equal(cell(result, 29).code, '?');
    assert.equal(cell(result, 30).code, '—');
    assert.match(cell(result, 5, 1).label, /Before joining/);
});

test('unavailable holidays do not produce inferred weekday absences', () => {
    const result = sheet({ calendarComplete: false });
    assert.equal(cell(result, 5).code, '?');
    assert.equal(result.rows[0].totals.absent, 0);
});

test('late, half day, WFH and short leave have distinct totals', () => {
    const result = sheet({ logs: [log({ type: 'Late' }), log({ date: '2026-10-06', type: 'Half Day' }), log({ date: '2026-10-07', type: 'Work - Home' }), log({ date: '2026-10-08', type: 'Short Leave' })] });
    assert.equal(result.rows[0].totals.present, 2);
    assert.equal(result.rows[0].totals.late, 1);
    assert.equal(result.rows[0].totals.half, 1);
    assert.equal(result.rows[0].totals.leave, 1);
    assert.equal(cell(result, 8).code, 'SL');
});

test('review flags missing checkout and unapproved auto closure', () => {
    const result = sheet({ logs: [log({ checkOut: '' }), log({ date: '2026-10-06', type: 'Half Day Leave', autoCheckout: true }), log({ date: '2026-10-07', autoCheckout: true, missedCheckoutReasonStatus: 'approved' })] });
    assert.equal(result.rows[0].totals.review, 2);
    assert.equal(cell(result, 7).code, 'P');
    assert.match(cell(result, 7).note, /approved/);
});

test('active check-in is represented without a saved attendance row', () => {
    const result = sheet({ users: [{ ...users[0], status: 'in', lastCheckIn: '2026-10-29T04:00:00Z' }] });
    assert.equal(cell(result, 29).code, 'IN');
});

test('approved WFH attendance is eligible without device signals', () => {
    const result = sheet({ logs: [{ id: 'approved-wfh', user_id: 'a', date: '2026-10-05', type: 'Work - Home', location: 'Work - Home', leaveGenerated: true, leaveRequestId: 'approved-request', checkIn: '09:00', checkOut: '17:00' }] });
    assert.equal(cell(result, 5).code, 'W');
    assert.equal(result.rows[0].totals.present, 1);
});

test('filters combine personal scope, department, search and review', () => {
    const result = sheet({ logs: [log({ checkOut: '' })] });
    assert.equal(filterAttendanceRows(result.rows, { scope: 'mine', viewerId: 'b' })[0].user.id, 'b');
    assert.equal(filterAttendanceRows(result.rows, { department: 'Finance', search: 'alice', attention: true }).length, 1);
    assert.equal(filterAttendanceRows(result.rows, { department: 'Programmes', attention: true }).length, 0);
});

test('CSV matches selected statuses and filters and escapes commas, quotes and formulas', () => {
    const result = sheet({ users: [{ ...users[0], name: '=SUM(1,2) "Name"' }, users[1]], logs: [log({ type: 'On Duty' })] });
    const selected = filterAttendanceRows(result.rows, { department: 'Finance' });
    const csv = attendanceSheetCSV(result, selected);
    assert.match(csv, /D: On Duty/);
    assert.match(csv, /'=SUM\(1,2\) ""Name""/);
    assert.doesNotMatch(csv, /Beena/);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.equal(csv.split('\r\n').length, 2);
});

test('model leaves source arrays and records untouched and supports leap February', () => {
    const logs = [Object.freeze(log())];
    const snapshot = JSON.stringify({ users, logs });
    sheet({ logs });
    assert.equal(JSON.stringify({ users, logs }), snapshot);
    assert.equal(sheet({ month: 1, year: 2028 }).days, 29);
});

test('actual cell editor opens the same source record selected by the sheet', async () => {
    const punch = log();
    const override = log({ id: 'manual-override', type: 'On Duty', isManualOverride: true });
    const logs = [punch, override];
    const source = readFileSync(new URL('../../js/app.js', import.meta.url), 'utf8');
    const start = source.indexOf('window.app_openCellOverride = async');
    const handler = source.slice(start, source.indexOf('window.app_submitCellOverride =', start));
    let modal = '';
    const context = { selectAttendanceLog, convertTo24h: value => value, alert: () => {}, window: {
        app_canManageAttendanceSheet: () => true,
        AppDB: { getAll: async collection => collection === 'users' ? users : logs },
        app_showModal: html => { modal = html; }
    } };
    vm.runInNewContext(handler, context);
    await context.window.app_openCellOverride('a', '2026-10-05');
    assert.match(modal, /app_submitCellOverride\(event, 'a', '2026-10-05', 'manual-override'\)/);
    assert.equal(cell(sheet({ logs }), 5).log.id, 'manual-override');
});
