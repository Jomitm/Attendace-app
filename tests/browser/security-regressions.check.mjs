// Real browser checks against source modules and isolated service fixtures.
// No Firebase SDK, credentials, live writes or external AI/Telegram calls.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { currentHeroPeriod, calculateTrustedHeroRanking } from '../../api/_hero-ranking.js';

const base = process.env.BASE_URL || 'http://127.0.0.1:3031';
const output = process.env.SECURITY_ARTIFACT_DIR || 'test-results/security-fixes';
mkdirSync(output, { recursive: true });
const originals = process.env.SECURITY_BASELINE_SOURCES
    ? JSON.parse(readFileSync(process.env.SECURITY_BASELINE_SOURCES, 'utf8')) : [];
const browser = await chromium.launch({ headless: true, args: ['--renderer-process-limit=1', '--disable-gpu'] });
const results = [];
async function fixture() {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, timezoneId: 'Asia/Kolkata' });
    // Fixtures are fully local; unavailable CDN fonts must not stall rendering.
    await page.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
    await page.route('**/__security_fixture', route => route.fulfill({ contentType: 'text/html', body: '<html><head><link rel="stylesheet" href="/css/main.css"></head><body><main id="page-content"></main><div id="modal-container"></div></body></html>' }));
    await page.goto(base + '/__security_fixture');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
        window.fixtureUsers = [{ id: 'viewer', name: 'Viewer' }, { id: 'other', name: 'Other', role: 'Employee', avatar: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' }];
        window.fixtureMinutes = [{ id: 'minute', createdBy: 'other', title: 'Normal meeting', date: '2026-10-30', attendeeIds: ['viewer'], contentHtml: '<h2>Agenda</h2><p><strong>Report</strong> and <em>discussion</em>.</p><ul><li>Follow up</li></ul>', actionItems: [{ task: 'Prepare report', dueDate: '2026-11-02', status: 'pending', assignedTo: 'viewer' }], approvals: {}, locked: false }];
        window.fixtureMessages = [{ id: 'message', type: 'text', fromId: 'other', toId: 'viewer', fromName: 'Other', createdAt: '2026-10-30T10:00:00Z', message: 'See https://example.test/report?a=1&b=2', link: 'https://example.test/report' }];
        window.AppAuth = { getUser: () => ({ id: 'viewer', isAdmin: false, permissions: {} }) };
        window.AppUserService = { getAll: async () => window.fixtureUsers };
        window.app_getMyMessages = async () => window.fixtureMessages;
        window.AppMinutes = { getMinutes: async () => window.fixtureMinutes, setMinutesDirtyState() {} };
        window.AppCalendar = { getPlans: async () => ({ work: [], leaves: [], events: [] }) };
        window.app_hasPerm = () => false;
        window.securityExecuted = 0;
        window.actionCalls = [];
    });
    return page;
}
async function module(page, path, before = false) {
    const source = before && originals.find(item => item.path === path)?.content;
    return page.evaluate(async ({ path, source }) => {
        if (!source) { window.testModule = await import('/' + path); return; }
        const directory = new URL('/' + path, location.origin);
        const rebased = source.replace(/from\s+(['"])(\.[^'"]+)\1/g, (_match, quote, specifier) => `from ${quote}${new URL(specifier, directory).href}${quote}`);
        const url = URL.createObjectURL(new Blob([rebased], { type: 'text/javascript' }));
        window.testModule = await import(url);
        URL.revokeObjectURL(url);
    }, { path, source });
}
async function render(page, kind) {
    await page.evaluate(async kind => {
        document.getElementById('page-content').innerHTML = await window.testModule[kind === 'directory' ? 'renderStaffDirectoryPage' : 'renderMinutes']();
    }, kind);
    await page.waitForTimeout(80);
}
async function record(name, fn) {
    console.log('CHECK: ' + name);
    await fn(); results.push({ name, passed: true }); console.log('PASS: ' + name);
}
try {
    for (const [kind, path] of [['directory', 'js/ui/staff-directory.js'], ['minutes', 'js/ui/minutes-ui.js']]) {
        await record(`${kind}: unchanged normal appearance`, async () => {
            const page = await fixture();
            try {
                await module(page, path, !!originals.length); await render(page, kind);
                await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1000))]));
                const before = await page.screenshot({ path: resolve(output, `${kind}-before.png`), fullPage: true, animations: 'disabled' });
                await module(page, path); await render(page, kind);
                const after = await page.screenshot({ path: resolve(output, `${kind}-after.png`), fullPage: true, animations: 'disabled' });
                assert.ok(after.equals(before), 'Normal fixture screenshots must match exactly; inspect saved images');
            } finally { await page.close(); }
        });
    }
    if (originals.length) await record('original exploits reproduce before the patch and stop after it', async () => {
        for (const [kind, path] of [['directory', 'js/ui/staff-directory.js'], ['minutes', 'js/ui/minutes-ui.js']]) {
            const page = await fixture();
            try {
                await page.evaluate(kind => {
                    if (kind === 'directory') window.fixtureUsers[1].avatar = 'x" onerror="window.securityExecuted++';
                    else window.fixtureMinutes[0].contentHtml = '<div><img src=x onerror=window.securityExecuted++></div>';
                }, kind);
                await module(page, path, true); await render(page, kind);
                if (kind === 'minutes') await page.locator('.minute-card-modern').click();
                await page.waitForFunction(() => window.securityExecuted > 0);
                await page.evaluate(() => { document.getElementById('modal-container').innerHTML = ''; window.securityExecuted = 0; });
                await module(page, path); await render(page, kind);
                if (kind === 'minutes') await page.locator('.minute-card-modern').click();
                await page.waitForTimeout(100);
                assert.equal(await page.evaluate(() => window.securityExecuted), 0, kind);
            } finally { await page.close(); }
        }
    });
    await record('directory: malicious fields stay inert and legitimate actions keep exact arguments', async () => {
        const page = await fixture();
        try {
            await module(page, 'js/ui/staff-directory.js');
            await page.evaluate(() => {
                const payload = '"><img src=x onerror=window.securityExecuted++>';
                window.fixtureUsers[1] = { ...window.fixtureUsers[1], id: "other');window.securityExecuted++;//", name: "O'Brien & Team", avatar: 'x" onerror="window.securityExecuted++' };
                window.app_staffThreadId = window.fixtureUsers[1].id;
                window.fixtureMessages = [
                    { id: payload, type: 'text', fromId: window.app_staffThreadId, toId: 'viewer', fromName: 'Other', message: 'https://example.test/" onmouseover=window.securityExecuted++', link: payload },
                    { id: payload, type: 'task', fromId: window.app_staffThreadId, toId: 'viewer', title: 'Task', status: 'pending', dueDate: payload },
                    { id: 'status', type: 'task', fromId: window.app_staffThreadId, toId: 'viewer', status: payload }
                ];
                window.app_openStaffThread = (...args) => window.actionCalls.push(['thread', ...args]);
                window.app_openStaffMessageModal = (...args) => window.actionCalls.push(['message', ...args]);
                window.app_openStaffTaskModal = (...args) => window.actionCalls.push(['task', ...args]);
                window.app_respondStaffTask = (...args) => window.actionCalls.push(['respond', ...args]);
            });
            await render(page, 'directory');
            await page.locator('[data-ts-action=staff-open-thread]').click();
            await page.locator('[data-ts-action=staff-send-message]').click();
            await page.locator('[data-ts-action=staff-send-task]').click();
            await page.locator('[data-response=approved]').click();
            await page.locator('[data-response=rejected]').click();
            const outcome = await page.evaluate(() => ({ executed: window.securityExecuted, events: document.querySelectorAll('[onerror],[onmouseover]').length, calls: window.actionCalls, other: window.fixtureUsers[1], id: window.fixtureMessages[1].id }));
            assert.equal(outcome.executed, 0); assert.equal(outcome.events, 0);
            assert.deepEqual(outcome.calls, [['thread', outcome.other.id], ['message', outcome.other.id, outcome.other.name], ['task', outcome.other.id, outcome.other.name], ['respond', outcome.id, 'approved'], ['respond', outcome.id, 'rejected']]);
        } finally { await page.close(); }
    });
    await record('minutes: list/calendar identifiers and nested rich content cannot execute', async () => {
        const page = await fixture();
        try {
            await module(page, 'js/ui/minutes-ui.js');
            await page.evaluate(() => {
                const minute = window.fixtureMinutes[0];
                minute.id = '"><img src=x onerror=window.securityExecuted++>';
                minute.contentHtml = '<div><img src=x onerror=window.securityExecuted++><a href="javascript:window.securityExecuted++" onclick="window.securityExecuted++">Bad link</a><p><strong>Safe rich text</strong></p></div>';
                minute.actionItems[0].dueDate = '<img src=x onerror=window.securityExecuted++>';
                minute.actionItems[0].status = 'pending" onmouseover="window.securityExecuted++';
            });
            await render(page, 'minutes');
            await page.locator('.minute-card-modern').click();
            await page.waitForTimeout(100);
            const content = await page.locator('.rich-minutes-content').innerHTML();
            assert.ok(content.includes('<strong>Safe rich text</strong>'));
            assert.ok(!/onerror|onclick|javascript:|<img/i.test(content));
            await page.locator('#minute-detail-modal .minutes-modal-footer button').first().click();
            await page.evaluate(() => window.app_setMinutesView('calendar'));
            await page.waitForTimeout(100);
            assert.equal(await page.evaluate(() => window.securityExecuted), 0);
            assert.equal(await page.locator('[onerror],[onmouseover]').count(), 0);
        } finally { await page.close(); }
    });
    await record('Hero: trusted server candidates match the unchanged browser engine', async () => {
        const page = await fixture();
        try {
            const period = currentHeroPeriod();
            const users = [{ id: 'a', name: 'Alice', username: 'alice' }, { id: 'b', name: 'Bea', username: 'bea' }];
            const attendance = [], workPlans = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(period.start + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + i);
                const key = date.toISOString().slice(0, 10);
                for (const user of users) {
                    attendance.push({ id: `${user.id}_${key}`, user_id: user.id, date: key, checkIn: '09:00', checkOut: '17:00', type: 'Present', dayCredit: 1, attendanceEligible: true, durationMs: 28800000, workDescription: 'Detailed daily report and programme coordination work.' });
                    workPlans.push({ id: `p_${user.id}_${key}`, userId: user.id, date: key, plans: [{ task: 'Prepare programme report', status: user.id === 'a' ? 'completed' : 'pending', assignedTo: user.id }] });
                }
            }
            // Include multiple sessions and legacy policy/holiday cases below.
            const input = { period, users, attendance, workPlans, events: [], settings: {}, holidays: { byYear: {} } };
            for (const scenario of ['default', 'stored-policy-holiday', 'multiple-sessions-private-lineage']) {
                if (scenario === 'stored-policy-holiday') {
                    input.settings.heroPolicy = { ELIGIBILITY_RULE_VERSION: 2, MIN_EVIDENCE: { minDays: 2, minDurationMs: 14400000, minPlannedTasks: 2 } };
                    input.holidays.byYear[period.start.slice(0, 4)] = [{ date: period.start, name: 'Fixture holiday' }];
                }
                if (scenario === 'multiple-sessions-private-lineage') {
                    const day = period.start;
                    input.attendance.push(...[9, 14].map(hour => ({ id: `split_${hour}`, user_id: 'a', date: day, type: 'Half Day', entrySource: 'checkin_checkout', attendanceEligible: true, dayCredit: 0.5, checkIn: `${hour}:00`, checkOut: `${hour + 4}:00`, checkInAt: new Date(`${day}T${String(hour).padStart(2, '0')}:00:00+05:30`).getTime(), durationMs: 14400000 })));
                    input.workPlans[0].plans.push({ isPrivate: true, privateTaskId: 'hidden', assignedTo: 'a' }, { task: 'Carry copy', addedFrom: 'postponed', sourcePlanId: 'old', sourceTaskIndex: 0, status: 'postponed' });
                }
                const expected = await page.evaluate(async input => {
                    await import('/js/modules/policies.js');
                    const { AppAnalytics: analytics } = await import('/js/modules/analytics.js');
                    const { AppDB: db } = await import('/js/modules/db.js');
                    const { AppLeaves: leaves } = await import('/js/modules/leaves.js');
                    const { AppCalendar: calendar } = await import('/js/modules/calendar.js');
                    const { AppAttendance: attendanceModule } = await import('/js/modules/attendance.js');
                    const data = { users: input.users, attendance: input.attendance, work_plans: input.workPlans, events: input.events };
                    db.getAll = async collection => data[collection] || [];
                    db.queryMany = async (collection, filters) => (data[collection] || []).filter(row => filters.every(f => f.operator === '>=' ? row[f.field] >= f.value : row[f.field] <= f.value));
                    window.AppDB = db; window.AppCalendar = calendar; window.AppAttendance = attendanceModule;
                    window.AppHeroPolicy = leaves.mergeHeroPolicy(input.settings.heroPolicy || {});
                    window.AppPolicies.holidayCache = { byYear: input.holidays.byYear };
                    analytics.db = db; analytics.clearMemo(); analytics._cachedHolidayYear = null;
                    analytics.getUsersCached = async () => input.users;
                    analytics.selectHeroWithAi = async () => null;
                    await analytics.preloadHolidayCache();
                    const ranking = await analytics.buildHeroRanking({ baseDate: new Date(`${input.period.today}T12:00:00`) });
                    // Browser candidate payload uses the same projection as the server.
                    const { buildHeroCandidates } = await import('/api/_hero-select-core.js');
                    return { candidates: buildHeroCandidates(ranking.rows), periodKey: `${ranking.dataset.startIso}_${ranking.dataset.endIso}` };
                }, input);
                const actual = await calculateTrustedHeroRanking(input);
                assert.ok(expected.candidates.length > 0, scenario + ': fixture must have eligible candidates');
                assert.deepEqual(actual, expected, scenario);
            }
        } finally { await page.close(); }
    });
    writeFileSync(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
} finally { await browser.close(); }
