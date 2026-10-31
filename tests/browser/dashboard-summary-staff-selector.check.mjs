import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true });

try {
    const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    admin.on('pageerror', error => errors.push(error.message));
    await admin.goto(`${base}/tests/browser/dashboard-workday.fixture.html?role=admin`, { waitUntil: 'domcontentloaded' });
    await admin.waitForFunction(() => window.fixtureReady === true);
    const selector = admin.locator('.dashboard-viewing-select');
    await selector.waitFor({ state: 'visible' });
    await selector.selectOption('other');
    await admin.getByRole('heading', { name: "Another staff member's Dashboard" }).waitFor();
    assert.equal(await admin.evaluate(() => window.app_selectedSummaryStaffId), 'other');
    await admin.getByRole('button', { name: 'Back to My Dashboard' }).click();
    await admin.waitForFunction(() => !document.querySelector('.dashboard-staff-view-banner'));
    assert.equal(await admin.evaluate(() => window.app_selectedSummaryStaffId), '');
    assert.deepEqual(errors, []);
    await admin.close();

    const staff = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await staff.goto(`${base}/tests/browser/dashboard-workday.fixture.html?role=staff`, { waitUntil: 'domcontentloaded' });
    await staff.waitForFunction(() => window.fixtureReady === true);
    const unauthorizedResult = await staff.evaluate(async () => {
        const accepted = await window.app_changeSummaryStaff('other');
        return { accepted, selected: window.app_selectedSummaryStaffId || '' };
    });
    assert.deepEqual(unauthorizedResult, { accepted: false, selected: '' });
    assert.equal(await staff.locator('.dashboard-viewing-select').count(), 0);
    await staff.close();
    console.log(JSON.stringify({ result: 'PASS', cases: 3, scope: 'authorized staff-summary switch, return-to-self, unauthorized guard; fixture data only' }));
} finally {
    await browser.close();
}
