// Real dashboard renderer with synthetic optional delays; never signs in to Firebase.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const base = 'http://127.0.0.1:3047/tests/browser/dashboard-workday.fixture.html';
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '?role=staff&slowSections=1500');
    await page.waitForFunction(() => window.fixtureReady);
    const coreMs = await page.evaluate(() => window.fixtureRenderMs);
    assert.ok(coreMs < 900, 'Attendance and today’s tasks return before optional sections');
    assert.equal(await page.locator('#attendance-btn').isEnabled(), true);
    assert.equal(await page.locator('.dashboard-planned-task-item').count(), 6);
    assert.match(await page.locator('.modern-bento-sidebar').innerText(), /Team Schedule\s+Loading/);
    await page.locator('.dashboard-planned-task-item').first().click();
    await page.evaluate(() => { window.fixtureAttendanceNode = document.querySelector('#attendance-btn'); });
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('app:db-write', { detail: { collection: 'work_plans' } }));
        document.querySelector('.dashboard-planned-task-item').dataset.savedWhileLoading = 'true';
    });
    await page.getByRole('button', { name: '+ Add Programme', exact: true }).waitFor();
    assert.equal(await page.locator('#countdown-container').isVisible(), true);
    assert.equal(await page.evaluate(() => window.fixtureAttendanceNode === document.querySelector('#attendance-btn')), true, 'Hydration preserves the live attendance node');
    assert.equal(await page.locator('.dashboard-planned-task-item').first().getAttribute('data-saved-while-loading'), 'true', 'Background write invalidation cannot replace the live task card');
    assert.equal(await page.locator('.dashboard-planned-task-item').first().getByRole('button', { name: 'Complete', exact: true }).isVisible(), true, 'The open task menu stays open');
    await page.evaluate(async () => {
        window.AppCalendar.getPlans = async () => { await new Promise(resolve => setTimeout(resolve, 250)); return { events: [], leaves: [], workPlans: [], programmes: [] }; };
        await window.app_refreshDashboard();
        window.location.hash = '#staff-directory';
        document.querySelector('main').innerHTML = '<p id="other-page">Another page</p>';
    });
    await page.waitForTimeout(450);
    assert.equal(await page.locator('#other-page').count(), 1, 'Late responses cannot replace another route');
    await page.goto(base + '?role=staff&failCalendar&slowSections=200');
    await page.waitForFunction(() => window.fixtureReady);
    await page.getByText('Could not load this section.', { exact: false }).waitFor();
    assert.equal(await page.locator('#attendance-btn').isEnabled(), true);
    assert.equal(await page.locator('.dashboard-planned-task-item').count(), 6);
    assert.equal(await page.getByRole('button', { name: 'Retry', exact: true }).count(), 1);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result: 'PASS', optionalDelayMs: 1500, coreRenderMs: Math.round(coreMs), checks: 'core gate, independent calendar, live controls, open task menu, navigation guard, isolated errors and retry' }));
} finally { await browser.close(); }
