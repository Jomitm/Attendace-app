// Production renderer with deliberately slow sample summaries. No Firebase.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto('http://127.0.0.1:3047/tests/browser/dashboard-workday.fixture.html?role=limited&slowSummaries=1200', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.fixtureReady);
    const renderMs = await page.evaluate(() => window.fixtureRenderMs);
    assert.ok(renderMs < 800, 'The workday renders before delayed totals resolve');
    assert.equal(await page.getByRole('button', { name: '+ Add task', exact: true }).isVisible(), true);
    assert.match(await page.locator('[data-stats-type="monthly"]').innerText(), /Loading summary/);
    await page.waitForFunction(() => document.querySelector('[data-stats-type="yearly"]')?.textContent.includes('311h 51m'));
    await page.evaluate(() => window.app_refreshDashboard());
    assert.deepEqual(await page.evaluate(() => window.fixtureStatsCalls), { monthly: 1, yearly: 1 }, 'Refresh reuses calculated totals');
    assert.doesNotMatch(await page.locator('[data-stats-type="monthly"]').innerText(), /Loading summary/);
    await page.evaluate(async () => {
        window.app_attachStatsCardHandlers();
        const preview = await import('/js/utils/dashboard-preview.js');
        const main = document.querySelector('main');
        preview.rememberDashboardPreview(main);
        const html = preview.readDashboardPreview();
        if (!html) throw new Error('Preview was not captured');
        main.innerHTML = '<p>Another page</p>';
        main.innerHTML = html;
        window.app_attachStatsCardHandlers();
        window.app_toggleDashboardCardMode = () => window.fixtureCalls.push(['stats-click']);
    });
    assert.match(await page.locator('[data-stats-type="monthly"]').innerText(), /3h 48m/, 'Restored preview contains populated totals');
    await page.locator('[data-stats-type="monthly"]').press('Enter');
    assert.equal((await page.evaluate(() => window.fixtureCalls)).at(-1)[0], 'stats-click', 'Restored totals are interactive');
    await page.getByRole('button', { name: '+ Add task', exact: true }).click();
    assert.equal((await page.evaluate(() => window.fixtureCalls)).at(-1)[0], 'day-planner');
    await page.evaluate(async () => {
        window.dispatchEvent(new CustomEvent('app:db-write', { detail: { collection: 'attendance' } }));
        await window.app_refreshDashboard();
    });
    assert.deepEqual(await page.evaluate(() => window.fixtureStatsCalls), { monthly: 2, yearly: 2 }, 'An attendance write invalidates totals');
    await page.waitForFunction(() => document.querySelector('[data-stats-type="yearly"]')?.textContent.includes('311h 51m'));
    await page.evaluate(async () => {
        window.AppAnalytics.getUserMonthlyStats = async () => { throw new Error('Sample outage'); };
        window.dispatchEvent(new CustomEvent('app:db-write', { detail: { collection: 'attendance' } }));
        await window.app_refreshDashboard();
    });
    await page.locator('[data-stats-type="monthly"]').getByText('Summary unavailable.', { exact: true }).waitFor();
    assert.doesNotMatch(await page.locator('[data-stats-type="monthly"]').innerText(), /0h 0m/);
    console.log(JSON.stringify({ result: 'PASS', injectedSummaryDelayMs: 1200, workdayRenderMs: Math.round(renderMs), checks: 'deferred totals, reused results, account-bound preview, planner link, write invalidation, honest errors' }));
} finally { await browser.close(); }
