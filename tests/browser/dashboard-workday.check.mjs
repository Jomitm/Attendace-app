// Isolated browser regression: imports production renderers; no Firebase or live data.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const base = process.env.BASE_URL || 'http://127.0.0.1:3047';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
mkdirSync('test-results/dashboard-workday', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
    for (const role of ['staff', 'limited', 'admin']) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
        const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(role + ' page error: ' + error.message); });
        await page.goto(`${base}/tests/browser/dashboard-workday.fixture.html?role=${role}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => window.fixtureReady === true, null, { timeout: 60000 });
        await page.evaluate(() => {
            window.fixtureDashboardRefreshCalls = 0;
            window.fixtureScheduleRefreshCalls = 0;
            const refreshDashboard = window.app_refreshDashboard;
            window.app_refreshDashboard = async (...args) => {
                window.fixtureDashboardRefreshCalls++;
                return refreshDashboard(...args);
            };
            const refreshSchedule = window.app_refreshTeamSchedule;
            window.app_refreshTeamSchedule = async (...args) => {
                window.fixtureScheduleRefreshCalls++;
                return refreshSchedule(...args);
            };
        });
        await page.getByRole('button', { name: '+ Add Programme', exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: '+ Add Programme', exact: true }).count(), 1, 'Every staff role can create a programme');
        if (role !== 'admin') assert.equal(await page.getByText('Executive Overview', { exact: true }).count(), 0);
        if (role !== 'admin') {
            assert.equal(await page.locator('.modern-bento-main .dashboard-team-activity-card').count(), 1, 'Personal activity fills the main column below performance');
            const activityOrder = await page.locator('.modern-bento-main').evaluate(main => {
                const performance = main.querySelector('.dashboard-perf-section');
                const activity = main.querySelector('.dashboard-team-activity-card');
                return !!performance && !!activity && !!(performance.compareDocumentPosition(activity) & Node.DOCUMENT_POSITION_FOLLOWING);
            });
            assert.equal(activityOrder, true, 'Performance comes before activity');
        }
        assert.equal(await page.getByText('Upcoming programmes', { exact: true }).count(), 1);
        const feast = page.locator('#dashboard-feast-widget');
        await feast.getByText('Today’s liturgical celebration', { exact: true }).waitFor();
        assert.equal(await page.locator('.modern-bento-sidebar #dashboard-feast-widget').count(), 0, 'Feast moved out of the sidebar');
        assert.equal(await feast.locator('#dashboard-feast-type').isVisible(), false, 'Liturgical details start collapsed');
        const stripFits = await feast.evaluate(el => {
            const hero = document.querySelector('.dashboard-hero-card');
            const workday = document.querySelector('.dashboard-personal-workday');
            return el.getBoundingClientRect().height <= 60 && !!(hero.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(el.compareDocumentPosition(workday) & Node.DOCUMENT_POSITION_FOLLOWING);
        });
        assert.equal(stripFits, true, 'Slim feast strip sits between the welcome header and workday');
        await feast.locator('summary').click();
        assert.equal(await feast.locator('#dashboard-feast-type').isVisible(), true);
        await feast.locator('summary').press('Enter');
        assert.equal(await feast.locator('#dashboard-feast-type').isVisible(), false, 'Keyboard toggles the details');
        assert.equal(await page.locator('#countdown-container').isVisible(), true, 'Runtime checkout countdown remains visible');
        assert.equal(await page.locator('#overtime-container').isVisible(), false, 'Overtime stays hidden before the shift ends');
        await page.getByText('Own activity sample', { exact: true }).waitFor();
        await page.getByRole('heading', { name: 'Recent Activity', exact: true }).waitFor();
        assert.equal(await page.locator('.dashboard-team-activity-card .dashboard-recent-activity').count(), 1);
        assert.equal(await page.locator('.dashboard-team-activity-card .dashboard-team-activity-split-grid').count(), 0, 'Personal activity is a feed, not another task board');
        assert.equal(await page.getByText('Other staff activity sample', { exact: true }).count(), 0, 'Async My Activity refresh excludes other staff');
        await page.getByRole('button', { name: 'Team', exact: true }).click();
        await page.getByText('Other staff activity sample', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'My', exact: true }).click();
        assert.equal(await page.getByText('Other staff activity sample', { exact: true }).count(), 0);
        assert.equal(await page.getByRole('button', { name: 'My', exact: true }).getAttribute('aria-pressed'), 'true');
        const selectedMonth = await page.locator('.dashboard-team-activity-filters select').first().inputValue();
        await page.getByRole('link', { name: 'Open activity history →', exact: true }).click();
        await page.getByRole('heading', { name: 'My Activity History', exact: true }).waitFor();
        assert.equal(await page.getByLabel('From', { exact: true }).inputValue(), selectedMonth + '-01');
        assert.equal(await page.getByText('Other staff activity sample', { exact: true }).count(), 0, 'Full history preserves My selection');
        await page.getByRole('button', { name: /Back to Dashboard/ }).click();
        await page.getByText('Own activity sample', { exact: true }).waitFor();
        const timer = await page.locator('.dashboard-checkin-card').evaluate(el => {
            const card = el.getBoundingClientRect();
            return [...el.querySelectorAll('.dashboard-checkin-head,.dashboard-checkin-timer-wrap,.dashboard-checkin-action-row')].map(child => { const r = child.getBoundingClientRect(); return r.left >= card.left && r.right <= card.right + 1 && r.top >= card.top && r.bottom <= card.bottom + 1; });
        }); assert.ok(timer.every(Boolean), 'Attendance content stays within the strip');
        await page.getByRole('button', { name: 'Add Plan', exact: true }).click();
        await page.getByRole('button', { name: 'Edit Plan', exact: true }).click();
        const calls = await page.evaluate(() => window.fixtureCalls); assert.equal(calls.length, 2); assert.ok(calls.every(call => call[0] === 'day-planner' && /^\d{4}-\d{2}-\d{2}$/.test(call[1]) && call[2] === 'staff'));
        const task = page.locator('.dashboard-planned-task-item').first(); await task.click();
        await task.getByRole('button', { name: 'Complete', exact: true }).click();
        assert.equal((await page.evaluate(() => window.fixtureCalls)).at(-1)[0], 'complete');
        const beforeKey = (await page.evaluate(() => window.fixtureCalls)).length;
        await task.getByRole('button', { name: 'Complete', exact: true }).press('Enter');
        assert.equal((await page.evaluate(() => window.fixtureCalls)).length, beforeKey + 1, 'Keyboard Complete dispatches exactly once');
        const agenda = page.locator('.programme-agenda');
        const nextProgramme = agenda.getByRole('button', { name: 'Next programme', exact: true });
        await agenda.hover();
        await nextProgramme.click();
        await agenda.getByRole('button', { name: 'Next programme 1', exact: true }).waitFor();
        await nextProgramme.press('Enter');
        await nextProgramme.press('Enter');
        await agenda.getByRole('button', { name: 'Next programme 3', exact: true }).waitFor();
        await nextProgramme.click();
        await agenda.getByRole('button', { name: 'Weekly programme review', exact: true }).waitFor();
        await agenda.getByRole('button', { name: 'Previous programme', exact: true }).click();
        await agenda.getByRole('button', { name: 'Next programme 3', exact: true }).waitFor();
        await nextProgramme.click();
        assert.equal(await agenda.locator('.programme-carousel-slide:visible').count(), 1, 'One programme at a time keeps the schedule compact');
        await page.evaluate(() => { window.AppFirebaseAuth = { currentUser: { uid: 'staff', getIdToken: async () => 'fixture-token' } }; });
        await agenda.getByRole('button', { name: 'Weekly programme review', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'visible' });
        assert.ok((await page.getByRole('dialog').innerText()).includes('Weekly programme review'));
        await page.getByRole('button', { name: 'Close ×', exact: true }).click();
        if (role === 'limited' || role === 'staff') {
            await page.evaluate(() => { window.fixtureDashboardRefreshCalls = 0; window.fixtureScheduleRefreshCalls = 0; });
            await page.getByRole('button', { name: '+ Add Programme', exact: true }).click();
            await page.getByLabel('Programme name', { exact: true }).fill('New programme from regression');
            await page.evaluate(() => { window.AppFirebaseAuth = { currentUser: { uid: 'staff', getIdToken: async () => 'fixture-token' } }; });
            await page.getByRole('button', { name: 'Save programme', exact: true }).click();
            await page.getByRole('dialog').getByRole('heading', { name: 'New programme from regression', exact: true }).waitFor();
            assert.equal((await page.evaluate(() => window.fixtureWrites)).length, 1);
            assert.equal(await page.evaluate(() => window.fixtureDashboardRefreshCalls), 0, 'Adding a programme does not rerender the dashboard');
            assert.equal(await page.evaluate(() => window.fixtureScheduleRefreshCalls), 1, 'Adding a programme refreshes only Team Schedule');
            await page.getByRole('button', { name: 'Edit programme', exact: true }).click();
            await page.getByLabel('Programme name', { exact: true }).fill('Updated programme from regression');
            await page.evaluate(() => { window.AppFirebaseAuth = { currentUser: { uid: 'staff', getIdToken: async () => 'fixture-token' } }; });
            await page.getByRole('button', { name: 'Save programme', exact: true }).click();
            await page.getByRole('dialog').getByRole('heading', { name: 'Updated programme from regression', exact: true }).waitFor();
            assert.equal(await page.evaluate(() => window.fixtureDashboardRefreshCalls), 0, 'Editing a programme does not rerender the dashboard');
            assert.equal(await page.evaluate(() => window.fixtureScheduleRefreshCalls), 2, 'Editing refreshes only Team Schedule');
            await page.getByRole('button', { name: 'Close ×', exact: true }).click();
            assert.equal(await page.getByText('Updated programme from regression', { exact: true }).count(), 1);
            assert.equal(await page.locator('.cal-day.today').getAttribute('data-has-event'), 'true');
            await page.getByRole('button', { name: 'Updated programme from regression', exact: true }).click();
            await page.getByRole('button', { name: 'Cancel programme', exact: true }).click();
            await page.getByText('Programme cancelled.', { exact: true }).waitFor();
            assert.equal(await page.evaluate(() => window.fixtureDashboardRefreshCalls), 0, 'Cancelling a programme does not rerender the dashboard');
            assert.equal(await page.evaluate(() => window.fixtureScheduleRefreshCalls), 3, 'Cancelling refreshes only Team Schedule');
            await page.getByRole('button', { name: 'Close ×', exact: true }).click();
            assert.equal(await page.getByText('Updated programme from regression', { exact: true }).count(), 0);
            assert.equal(await page.locator('.cal-day.today').getAttribute('data-has-event'), 'false');
        }
        assert.deepEqual(errors, [], role + ' has no uncaught page errors');
        await page.screenshot({ path: `test-results/dashboard-workday/${role}-desktop.png`, fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(await feast.evaluate(el => el.getBoundingClientRect().height <= 70), 'Feast remains a compact strip on mobile');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const mobile = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth,
            offenders: [...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })) }));
        await page.screenshot({ path: `test-results/dashboard-workday/${role}-mobile.png`, fullPage: true });
        assert.ok(mobile.width <= mobile.viewport, role + ' mobile overflow: ' + JSON.stringify(mobile));
        console.log('PASS:', role, 'layout, permissions, planner links, task action routing and programme details');
        await page.close();
    }
} finally { await browser.close(); }
