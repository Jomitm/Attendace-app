// Run with Vite on BASE_URL (default http://127.0.0.1:3017).
// All records and writes are intercepted fixtures; no Firebase requests are made.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:3017';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/main.css"></head><body><main id="page-content" style="padding:20px;min-width:0;width:100%;box-sizing:border-box"></main><script type="module">
import { renderMasterSheet, exportCurrentAttendanceSheet } from '/js/ui/master-sheet.js';
window.fixtureUsers = [
 { id:'a', name:'Anita George', dept:'Finance', isAdmin:true },
 { id:'b', name:'Beena Thomas', dept:'Programmes' },
 { id:'c', name:'Celine Joseph', dept:'Administration', canManageAttendanceSheet:true }
];
window.fixtureLogs = [
 { id:'punch', user_id:'a', date:'2026-10-05', type:'Present', checkIn:'09:00',checkOut:'17:00',attendanceEligible:true,activityScore:4 },
 { id:'late', user_id:'b', date:'2026-10-05', type:'Late', checkIn:'09:20',checkOut:'17:00',attendanceEligible:true },
 { id:'missing', user_id:'a', date:'2026-10-06', type:'Present', checkIn:'09:00',checkOut:'',attendanceEligible:true },
 { id:'wfh', user_id:'b', date:'2026-10-06', type:'Work - Home', checkIn:'09:00',checkOut:'17:00',leaveGenerated:true,leaveRequestId:'leave-wfh' }
];
window.currentFixtureUser = window.fixtureUsers[0];
window.fixtureWrites = 0;
window.AppAuth = { getUser: () => window.currentFixtureUser };
window.AppUserService = { getAll: async () => window.fixtureUsers };
window.AppDB = { queryManyStrict: async (collection, range) => {
 if (window.failAttendance && collection==='attendance') throw new Error('Fixture: connection lost');
 if (window.failCalendar && collection==='events') throw new Error('Fixture: calendar unavailable');
 return (collection==='attendance' ? window.fixtureLogs : [{date:'2026-10-02',type:'holiday',title:'National holiday'}]).filter(log => log.date>=range[0].value && log.date<=range[1].value);
}, put: async () => { window.fixtureWrites++; }, getAll: async () => [], get: async () => ({byYear:{}}) };
window.AppPolicies = { getHolidaysForYear: async () => [] };
window.app_fixCurrentMonthFalseHalfDayLeaves = () => { window.fixtureWrites++; };
window.AppReports = { downloadFile: (content, name) => { window.fixtureDownload={content,name}; } };
window.app_exportMasterSheet = exportCurrentAttendanceSheet;
window.app_openCellOverride = async (id,date) => { window.fixtureEdit={id,date}; };
window.renderFixture = async () => { document.getElementById('page-content').innerHTML=await renderMasterSheet(9,2026); };
await window.renderFixture();
</script></body></html>`;

try {
    await page.route('**/__attendance_fixture', route => route.fulfill({ contentType: 'text/html', body: fixture }));
    await page.goto(`${base}/__attendance_fixture#master-sheet`);
    await page.getByRole('heading', { name: 'Attendance Sheet', exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 3, 'All staff are shown by default');
    assert.equal(await page.evaluate(() => window.fixtureWrites), 0, 'Opening sheet must not write');
    await page.locator('[data-sheet-filter="scope"]').selectOption('mine');
    assert.equal(await page.locator('tbody tr').count(), 1, 'Personal view remains an optional filter');
    await page.locator('[data-sheet-filter="scope"]').selectOption('team');
    assert.equal(await page.locator('tbody tr').count(), 3);
    await page.locator('[data-sheet-filter="department"]').selectOption('Programmes');
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.getByRole('button', { name: 'Download CSV' }).click();
    const download = await page.evaluate(() => window.fixtureDownload);
    assert.match(download.content, /Beena Thomas/);
    assert.doesNotMatch(download.content, /Anita George/);
    assert.match(download.content, /W: Work - Home/);
    await page.locator('[data-staff-id="b"][data-attendance-day="2026-10-06"]').click();
    await page.getByRole('dialog').waitFor();
    assert.match(await page.getByRole('dialog').textContent(), /Approved leave entry/);
    await page.getByRole('button', { name: 'Edit attendance', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.fixtureEdit), { id: 'b', date: '2026-10-06' });
    await page.locator('[data-sheet-filter="department"]').selectOption('');
    await page.locator('[data-sheet-filter="search"]').fill('Anita');
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.locator('[data-sheet-filter="search"]').fill('');
    await page.locator('[data-sheet-filter="attention"]').check();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.locator('[data-sheet-filter="attention"]').uncheck();
    await page.setViewportSize({ width: 1100, height: 800 });
    assert.ok((await page.locator('.attendance-scroll').boundingBox()).y < 210, 'Grid starts near the top on desktop');
    assert.equal(await page.locator('.attendance-summary > div').count(), 0, 'Totals have no large cards');
    mkdirSync('test-results/attendance-sheet', { recursive: true });
    await page.screenshot({ path: 'test-results/attendance-sheet/desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok((await page.locator('.attendance-scroll').boundingBox()).y < 330, 'Mobile controls stay compact');
    await page.screenshot({ path: 'test-results/attendance-sheet/mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile page stays within viewport');
    await page.evaluate(async () => { window.currentFixtureUser=window.fixtureUsers[1]; await window.renderFixture(); });
    assert.equal(await page.locator('[data-sheet-filter="scope"]').count(), 1, 'Every staff member can select all staff');
    assert.equal(await page.locator('tbody tr').count(), 3, 'Ordinary staff see everyone');
    assert.match(await page.locator('tbody').textContent(), /Beena Thomas/);
    await page.getByRole('button', { name: 'Download CSV' }).click();
    assert.match(await page.evaluate(() => window.fixtureDownload.content), /Anita George/);
    await page.locator('[data-staff-id="a"][data-attendance-day="2026-10-06"]').click();
    assert.equal(await page.getByRole('button', { name: 'Edit attendance', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.evaluate(async () => { window.currentFixtureUser=window.fixtureUsers[2]; await window.renderFixture(); });
    assert.equal(await page.locator('[data-sheet-filter="scope"]').count(), 1, 'Delegated managers retain team controls');
    await page.evaluate(async () => { window.failAttendance=true; await window.renderFixture(); });
    await page.getByRole('heading', { name: 'Attendance unavailable' }).waitFor();
    assert.equal(await page.locator('.attendance-grid').count(), 0);
    await page.evaluate(() => { window.failAttendance=false; });
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.getByRole('heading', { name: 'Attendance Sheet', exact: true }).waitFor();
    await page.evaluate(async () => { window.failAttendance=false; window.failCalendar=true; await window.renderFixture(); });
    assert.match(await page.getByRole('alert').textContent(), /holidays could not be loaded/);
    assert.equal(await page.evaluate(() => window.fixtureWrites), 0, 'Filtering, details and export must not write');
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log('PASS: all-staff access and downloads, manager-only edits, compact desktop/mobile layout, filters, WFH, CSV parity, failed reads, and zero automatic writes.');
} finally {
    await browser.close();
}
