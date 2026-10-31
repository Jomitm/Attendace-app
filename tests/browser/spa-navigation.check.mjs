import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://127.0.0.1:3000/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: 'block' });
await context.addInitScript(() => {
    const loadCount = Number(sessionStorage.getItem('__spa_nav_check_loads__') || 0) + 1;
    sessionStorage.setItem('__spa_nav_check_loads__', String(loadCount));
});
const page = await context.newPage();
const documentNavigations = [];
const pageErrors = [];
page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
        const url = new URL(frame.url());
        documentNavigations.push(`${url.origin}${url.pathname}${url.search}`);
    }
});
page.on('pageerror', error => pageErrors.push(error.message));

try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => localStorage.getItem('__app_local_sw_cleanup_done__') === '1', null, { timeout: 10000 });
    const initialLoadCount = await page.evaluate(() => Number(sessionStorage.getItem('__spa_nav_check_loads__') || 0));
    const routes = ['dashboard', 'staff-directory', 'annual-plan', 'team-activities', 'kanban', 'timesheet', 'minutes', 'profile', 'dashboard'];
    for (const route of routes) {
        await page.evaluate(hash => { window.location.hash = hash; }, route);
        await page.waitForFunction(hash => window.location.hash === `#${hash}`, route);
        await page.waitForTimeout(80);
    }
    const result = await page.evaluate(() => ({
        hash: location.hash,
        navigationEntries: performance.getEntriesByType('navigation').length,
        navigationType: performance.getEntriesByType('navigation')[0]?.type,
        localDevCleanupDone: localStorage.getItem('__app_local_sw_cleanup_done__'),
    }));
    assert.equal(documentNavigations.length, initialLoadCount + routes.length, 'initial loads and hash changes may emit frame navigation events');
    assert.equal(result.navigationEntries, 1, 'one document navigation entry should remain for the session');
    assert.equal(initialLoadCount, 1, 'a clean local visit does not reload after finding no stale service workers or caches');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('__spa_nav_check_loads__')), String(initialLoadCount), 'route clicks must not reload the document');
    assert.deepEqual(pageErrors, [], 'route changes should not raise uncaught page errors');
    console.log(JSON.stringify({ result: 'PASS', scope: 'SPA hash navigation only; signed-out local app; no persisted data', routes, firstVisitDocumentLoads: initialLoadCount, routeClicksDocumentLoads: await page.evaluate(() => Number(sessionStorage.getItem('__spa_nav_check_loads__') || 0)), pageErrors, ...result }));
} finally {
    await context.close();
    await browser.close();
}
