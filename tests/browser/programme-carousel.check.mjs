// Isolated sample data; no Firebase connection or account changes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const base = process.env.BASE_URL || 'http://127.0.0.1:3047';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
mkdirSync('test-results/programme-carousel', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(base + '/tests/browser/dashboard-workday.fixture.html?role=limited', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.fixtureReady);
    const agenda = page.locator('.programme-agenda');
    const next = agenda.getByRole('button', { name: 'Next programme', exact: true });
    await page.mouse.move(10, 10);
    assert.equal(await next.evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    await agenda.hover();
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.programme-carousel-next')).opacity) > 0);
    await next.click();
    await agenda.getByRole('button', { name: 'Next programme 1', exact: true }).waitFor();
    await page.locator('.dashboard-team-schedule-card').screenshot({ path: 'test-results/programme-carousel/schedule-hover.png' });
    const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await touch.goto(base + '/tests/browser/dashboard-workday.fixture.html?role=staff', { waitUntil: 'domcontentloaded' });
    await touch.waitForFunction(() => window.fixtureReady);
    const touchNext = touch.getByRole('button', { name: 'Next programme', exact: true });
    assert.ok(await touchNext.evaluate(el => Number(getComputedStyle(el).opacity) > 0), 'Touch does not depend on hover');
    await touchNext.tap();
    await touch.getByRole('button', { name: 'Next programme 1', exact: true }).waitFor();
    await touch.locator('.dashboard-team-schedule-card').screenshot({ path: 'test-results/programme-carousel/schedule-touch.png' });
    console.log('PASS: desktop hover reveals arrows, next opens another programme, touch arrows stay visible');
} finally { await browser.close(); }
