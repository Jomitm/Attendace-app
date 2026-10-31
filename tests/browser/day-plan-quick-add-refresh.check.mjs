// Isolated browser regression: actual Day Planner quick-add with an in-memory work-plan store.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://127.0.0.1:3047';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/tests/browser/dashboard-workday.fixture.html?role=staff`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.fixtureReady === true, null, { timeout: 60000 });

    await page.evaluate(async () => {
        window.fixtureDashboardRefreshCalls = 0;
        window.fixturePlannedTaskRefreshCalls = 0;
        const refreshDashboard = window.app_refreshDashboard;
        window.app_refreshDashboard = async (...args) => {
            window.fixtureDashboardRefreshCalls++;
            return refreshDashboard(...args);
        };
        const refreshPlannedTasks = window.app_refreshDashboardPlannedTasks;
        window.app_refreshDashboardPlannedTasks = async (...args) => {
            window.fixturePlannedTaskRefreshCalls++;
            return refreshPlannedTasks(...args);
        };

        const { AppAuth } = await import('/js/modules/auth.js');
        const { AppDB } = await import('/js/modules/db.js');
        const { AppCalendar } = await import('/js/modules/calendar.js');
        AppDB.readStaffData = async () => [];
        AppDB.getAll = async collection => collection === 'users' ? [window.fixtureUser, { id: 'other', name: 'Another staff member', role: 'Employee' }] : [];
        AppDB.getCached = async (_key, _ttl, loader) => loader();
        AppAuth.getUser = () => window.fixtureUser;
        const plans = new Map();
        const planId = (date, userId, scope = 'personal') => `plan_${userId}_${date}_${scope}`;
        AppCalendar.getTodayKey = () => window.fixtureToday;
        AppCalendar.getWorkPlan = async (userId, date, options = {}) => plans.get(planId(date, userId, options.planScope)) || null;
        AppCalendar.getWorkPlanId = planId;
        AppCalendar.setWorkPlan = async (date, tasks, userId, options = {}) => {
            const item = { id: planId(date, userId, options.planScope), date, userId, userName: window.fixtureUser.name, planScope: options.planScope, plans: tasks };
            plans.set(item.id, item);
            window.fixturePlanWrites = [...plans.values()];
            return item;
        };
        AppCalendar.deleteWorkPlan = async (date, userId, options = {}) => {
            plans.delete(planId(date, userId, options.planScope));
            window.fixturePlanWrites = [...plans.values()];
            return true;
        };
        window.fixtureUser = { id: 'staff', name: 'Jomit Mathew', role: 'Employee', isAdmin: false };
        window.fixtureToday = window.AppDB.getISTDateKeys().todayKey;
        window.fixturePlanWrites = [];
        window.fixtureOriginalWorkPlans = await window.AppAnalyticsService.getWorkPlansByDateRange(window.fixtureToday, window.fixtureToday);
        await import('/js/modules/day-plan.js');
        AppDB.readStaffData = async () => [];
        AppDB.getAll = async collection => collection === 'users' ? [window.fixtureUser, { id: 'other', name: 'Another staff member', role: 'Employee' }] : [];
        AppDB.getCached = async (_key, _ttl, loader) => loader();
        window.AppDB = AppDB;
        const fixtureFetch = window.fetch;
        window.fetch = async (url, options) => String(url) === '/api/staff-data'
            ? { ok: true, json: async () => ({ data: [window.fixtureUser, { id: 'other', name: 'Another staff member', role: 'Employee' }] }) }
            : fixtureFetch(url, options);
        window.AppAnalyticsService = {
            getUserWorkPlansByDateRange: async () => [
                ...window.fixtureOriginalWorkPlans,
                ...window.fixturePlanWrites
            ],
            getWorkPlansByDateRange: async () => [
                ...window.fixtureOriginalWorkPlans,
                ...window.fixturePlanWrites
            ],
        };
    });

    await page.evaluate(() => window.app_quickAddPersonalPlan(window.fixtureToday, 'staff'));
    const modal = page.locator('#quick-personal-plan-modal');
    await modal.waitFor({ state: 'visible' });
    await modal.locator('textarea').fill('Temporary planner regression task');
    await modal.getByRole('button', { name: 'Add Personal Plan', exact: true }).click();
    await page.waitForFunction(() => window.fixturePlanWrites.length === 1, null, { timeout: 10000 });
    await page.waitForFunction(() => window.fixturePlannedTaskRefreshCalls === 1, null, { timeout: 10000 });
    const addedState = await page.evaluate(() => ({
        taskVisible: document.body.innerText.includes('Temporary planner regression task'),
        dashboardRefreshCalls: window.fixtureDashboardRefreshCalls,
        taskRefreshCalls: window.fixturePlannedTaskRefreshCalls,
        cardText: document.querySelector('.dashboard-worklog-card')?.innerText,
        plans: window.fixturePlanWrites
    }));
    assert.equal(addedState.taskVisible, true, 'The newly added task appears in the planned tasks card');
    assert.equal(await page.evaluate(() => window.fixturePlanWrites.length), 1, 'Quick add writes one temporary plan in memory');
    assert.equal(await page.evaluate(() => window.fixtureDashboardRefreshCalls), 0, 'Quick add does not rerender the dashboard');
    assert.equal(await page.evaluate(() => window.fixturePlannedTaskRefreshCalls), 1, 'Quick add refreshes only the planned tasks card');

    await page.evaluate(async () => {
        const { AppCalendar } = await import('/js/modules/calendar.js');
        await AppCalendar.deleteWorkPlan(window.fixtureToday, 'staff', { planScope: 'personal' });
        await window.app_refreshDashboardPlannedTasks();
    });
    await page.waitForFunction(() => !document.body.innerText.includes('Temporary planner regression task'), null, { timeout: 10000 });
    assert.equal(await page.evaluate(() => window.fixturePlanWrites.length), 0, 'Removing the temporary plan leaves the fixture empty');
    assert.equal(await page.locator('.dashboard-worklog-card .dashboard-card-summary').innerText(), '6 tasks', 'The original fixture tasks remain after cleanup');
    assert.equal(await page.evaluate(() => window.fixtureDashboardRefreshCalls), 0, 'Removal does not rerender the dashboard');
    assert.equal(await page.evaluate(() => window.fixturePlannedTaskRefreshCalls), 2, 'Removal refreshes only the planned tasks card');
    assert.deepEqual(errors, [], 'Quick add and removal complete without browser errors');
    console.log('PASS: Day Planner quick add, targeted task-card refresh, temporary-plan removal, and no dashboard rerender');
    await page.close();
} finally {
    await browser.close();
}
