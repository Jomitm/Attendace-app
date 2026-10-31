import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const base = 'http://127.0.0.1:3047/tests/browser/dashboard-workday.fixture.html';

async function openCase(query) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const alerts = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
    await page.goto(`${base}?role=staff&realComplete${query ? `&${query}` : ''}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.fixtureReady === true);
    const task = page.locator('.dashboard-planned-task-item').first();
    await task.click();
    const button = task.getByRole('button', { name: 'Complete', exact: true });
    await button.waitFor({ state: 'visible' });
    return { page, button, errors, alerts };
}

try {
    {
        const { page, button, errors } = await openCase('');
        assert.equal(await page.evaluate(() => typeof window.app_teamActivitiesCompleteTask), 'undefined', 'dashboard does not rely on the lazy Team Activities handler');
        await button.click();
        await page.waitForFunction(() => window.fixtureTaskUpdates.length === 1 && document.querySelectorAll('.dashboard-planned-task-item').length === 5);
        const result = await page.evaluate(() => ({
            update: window.fixtureTaskUpdates[0],
            note: window.fixtureCompletionNotes[0],
            toast: window.fixtureToasts[0],
            count: document.querySelector('.dashboard-worklog-card .dashboard-card-summary')?.textContent
        }));
        assert.equal(result.update.status, 'completed');
        assert.equal(result.update.planId, 'plan_staff_' + await page.evaluate(() => window.AppCalendar.getTodayKey()));
        assert.equal(result.update.taskIndex, 0);
        assert.deepEqual(result.update.options, { completionComment: 'Fixture completion note', deferRating: true });
        assert.equal(result.note[2], 'Fixture completion note');
        assert.equal(result.toast, 'Task marked as completed.');
        assert.equal(result.count, '5 tasks');
        assert.deepEqual(errors, []);
        await page.close();
    }
    {
        const { page, button, alerts } = await openCase('cancelComplete');
        await button.click();
        await page.waitForTimeout(50);
        assert.equal(await page.evaluate(() => window.fixtureTaskUpdates.length), 0, 'cancelled note prompt does not save');
        assert.equal(await page.locator('.dashboard-planned-task-item').count(), 6, 'cancel leaves the task visible');
        assert.equal(await button.isEnabled(), true);
        assert.deepEqual(alerts, []);
        await page.close();
    }
    {
        const { page, button, alerts } = await openCase('failComplete');
        await button.click();
        await page.waitForFunction(() => window.fixtureTaskUpdates.length === 1);
        await page.waitForFunction(() => document.querySelector('.dashboard-planned-task-item .complete')?.disabled === false);
        assert.equal(await page.locator('.dashboard-planned-task-item').count(), 6, 'failed save leaves the task visible');
        assert.match(alerts[0] || '', /Failed to complete task: Sample save failure/);
        await page.close();
    }
    console.log(JSON.stringify({ result: 'PASS', cases: 3, scope: 'dashboard Complete success, cancel, failure; sample records only' }));
} finally {
    await browser.close();
}
