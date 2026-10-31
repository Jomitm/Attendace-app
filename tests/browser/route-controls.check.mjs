import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function sourceFiles(root) {
    return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
        const file = join(root, entry.name);
        return entry.isDirectory() ? sourceFiles(file) : /\.(?:js|html)$/.test(file) ? [file] : [];
    });
}

const sources = [...sourceFiles('js'), 'index.html'];
const actionMarkup = new Set();
const actionHandlers = new Set();
const inlineReferences = new Set();
const inlineDefinitions = new Set();
for (const file of sources) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/data-ts-action\s*=\s*["\x27`]([^"\x27`$]+)["\x27`]/g)) actionMarkup.add(match[1]);
    for (const match of source.matchAll(/onAction\(\s*["\x27`]([^"\x27`]+)["\x27`]/g)) actionHandlers.add(match[1]);
    for (const match of source.matchAll(/onclick\s*=\s*["\x27`]([^"\x27`]+)["\x27`]/g)) {
        for (const call of match[1].matchAll(/window\.([A-Za-z_$][\w$]*)\s*\(/g)) inlineReferences.add(call[1]);
    }
    for (const match of source.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=|\bfunction\s+([A-Za-z_$][\w$]*)\s*\(|\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) {
        const name = match[1] || match[2] || match[3];
        if (name) inlineDefinitions.add(name);
    }
    if (file.endsWith('minutes-ui.js')) {
        for (const match of source.matchAll(/action\(\s*["\x27`](minutes-[^"\x27`]+)["\x27`]/g)) actionHandlers.add(match[1]);
    }
}
const unhandledActions = [...actionMarkup].filter(name => !actionHandlers.has(name));
assert.deepEqual(unhandledActions, [], `Unregistered data-ts-action handlers: ${unhandledActions.join(', ')}`);
const unresolvedInlineReferences = [...inlineReferences].filter(name => !inlineDefinitions.has(name) && !['print'].includes(name));
assert.deepEqual(unresolvedInlineReferences, [], `Inline handlers with no source definition: ${unresolvedInlineReferences.join(', ')}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const browserErrors = [];
page.on('pageerror', error => browserErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
try {
    await page.route('**/__route_render_fixture', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><main id="page-content"></main><div id="modal-container"></div></body></html>' }));
    await page.goto('http://localhost:3000/__route_render_fixture', { waitUntil: 'domcontentloaded' });
    const results = await page.evaluate(async () => {
        const ui = await import('/js/ui.js');
        await Promise.all([
            import('/js/ui/master-sheet.js'), import('/js/ui/letter-pad.js'), import('/js/ui/ai-center.js')
        ]);
        const user = { id: 'staff', name: 'Fixture Admin', role: 'Administrator', isAdmin: true, permissions: { dashboard: 'admin', attendance: 'admin', leaves: 'admin', reports: 'admin', users: 'admin' }, status: 'in' };
        window.fixtureToday = '2026-10-31';
        window.AppAuth = { getUser: () => user, isImpersonating: false };
        window.AppDB = { getAll: async () => [], get: async () => null, getCached: async (_key, _ttl, loader) => loader(), queryMany: async () => [], queryManyStrict: async () => [], getCacheKey: (...parts) => parts.join(':'), getISTDateKeys: () => ({ todayKey: window.fixtureToday, yesterdayKey: '2026-10-30' }), getIstNow: () => new Date(), clearCache: () => {} };
        window.AppUserService = { get: async id => [user, { id: 'other', name: 'Fixture Staff', role: 'Employee' }].find(row => row.id === id) || null, getAll: async () => [user], getActiveStaff: async () => [user], getBirthdayPeople: async () => [] };
        window.AppAttendance = { getStatus: async () => ({ status: 'in' }), getLogs: async () => [], evaluateAttendanceStatus: () => ({ status: 'Present' }), msToTime: () => '0h' };
        window.AppAttendanceService = { getByDateRange: async () => [], get: async () => null };
        window.AppLeaves = { getAllLeaves: async () => [], getPendingLeaves: async () => [], getBalance: async () => ({}), getUserLeaves: async () => [] };
        window.AppLeaveService = { getAll: async () => [] };
        window.AppReports = { get: async () => [], downloadFile: () => {} };
        window.AppPolicies = { get: async () => ({}), getHolidaysForYear: async () => [] };
        window.AppSettingsService = { get: async () => ({}) };
        window.AppAnalytics = { getAllStaffActivities: async () => [], getUsersCached: async () => [user], getSystemPerformance: async () => ({}), getSystemMonthlySummary: async () => [{ user: { id: user.id, name: user.name, baseSalary: 50000 }, stats: { unpaidLeaves: 0, late: 0, extraWorkedHours: 0 } }], getPersonalPerformance: async () => null, getDayType: () => 'Work Day', getUserMonthlyStats: async () => ({}), getUserYearlyStats: async () => ({}) };
        window.AppAnalyticsService = { getWorkPlansByDateRange: async () => [], getUserWorkPlansByDateRange: async () => [] };
        window.AppCalendar = { getTodayKey: () => window.fixtureToday, getPlans: async () => ({ leaves: [], events: [], workPlans: [], programmes: [] }), getDashboardPlans: async () => ({ leaves: [], events: [], workPlans: [], programmes: [] }), getCollaborations: async () => [], getWorkPlan: async () => null, getSmartTaskStatus: () => 'pending' };
        window.AppMinutes = { getMinutes: async () => [], getAllMinutes: async () => [] };
        window.AppSettingsService = { get: async () => ({}), getStaffMessages: async () => [], getLetterPadProfiles: async () => [] };
        window.AppJourneyReflection = { buildDashboardState: async () => null };
        window.app_hasPerm = (_module, _level, who = user) => who.isAdmin === true || who.permissions?.[_module] === 'admin' || who.permissions?.[_module] === 'view';
        window.app_isAdminUser = who => who?.isAdmin === true;
        window.app_canSeeAdminPanel = who => who?.isAdmin === true;
        window.app_canManageBirthdays = who => who?.isAdmin === true;
        window.app_canAdminBirthdays = who => who?.isAdmin === true;
        window.app_canAccessLetterPad = who => who?.isAdmin === true;
        window.app_canManageAttendanceSheet = who => who?.isAdmin === true;
        window.fixtureControlCalls = [];
        window.fixtureCurrentRoute = '';
        window.fixtureBrowserErrors = [];
        window.addEventListener('error', event => window.fixtureBrowserErrors.push(`${window.fixtureCurrentRoute}: ${event.message} ${event.error?.stack || ''}`));
        window.addEventListener('unhandledrejection', event => window.fixtureBrowserErrors.push(`${window.fixtureCurrentRoute}: ${String(event.reason)}`));
        window.app_openModal = () => {};
        window.app_exportMasterSheet = async () => {};
        window.appConfirm = async () => false;
        window.confirm = () => false;
        window.alert = () => {};
        document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
        document.addEventListener('click', event => { if (event.target.closest('a[href]')) event.preventDefault(); }, true);
        const routes = [
            ['Dashboard', () => ui.renderDashboard()], ['Dashboard section', () => ui.renderDashboardSectionPage('worklog')],
            ['Team Activities', () => ui.renderTeamActivitiesPage()], ['Staff Directory', () => ui.renderStaffDirectoryPage()],
            ['Annual Plan', () => ui.renderAnnualPlan()], ['Birthday Calendar', () => ui.renderBirthdayCalendar()],
            ['Timesheet', () => ui.renderTimesheet()], ['Profile', () => ui.renderProfile()], ['Salary', () => ui.renderSalaryProcessing()],
            ['Policy Test', () => ui.renderPolicyTest()], ['Master Sheet', () => ui.renderMasterSheet()], ['Minutes', () => ui.renderMinutes()],
            ['Letter Pad', () => ui.renderLetterPad()], ['Admin', () => ui.renderAdmin()], ['Kanban', () => ui.renderKanbanBoard()], ['AI Center', () => ui.renderAICenter()]
        ];
        const routeHashes = ['dashboard','dashboard-section/worklog','team-activities','staff-directory','annual-plan','birthday-calendar','timesheet','profile','salary','policy-test','master-sheet','minutes','letter-pad','admin','kanban','ai-center'];
        const root = document.getElementById('page-content');
        const out = [];
        for (let index = 0; index < routes.length; index++) {
            const [name, render] = routes[index];
            window.fixtureCurrentRoute = name;
            history.replaceState(null, '', `#${routeHashes[index]}`);
            try {
                const html = await render();
                root.innerHTML = html;
                if (name === 'Dashboard section') await ui.initDashboardSectionPage('worklog');
                if (name === 'Team Activities' && typeof window.app_initTeamActivities === 'function') await window.app_initTeamActivities();
                if (name === 'Kanban') await ui.initKanbanBoard();
                if (name === 'Dashboard') window.app_forceRefreshHero = async () => {};
                await new Promise(resolve => setTimeout(resolve, 20));
                const actionNames = new Set();
                for (const control of root.querySelectorAll('[onclick]')) {
                    for (const match of String(control.getAttribute('onclick')).matchAll(/window\.([A-Za-z_$][\w$]*)\s*\(/g)) actionNames.add(match[1]);
                }
                for (const actionName of actionNames) {
                    const current = window[actionName];
                    window[actionName] = () => { window.fixtureControlCalls.push(actionName); return Promise.resolve(false); };
                    window[actionName]._auditOriginalType = typeof current;
                }
                const controlSelector = 'button,[role=button],a[href],input[type=button],input[type=submit],[onclick],[data-ts-action]';
                const controls = [...root.querySelectorAll(controlSelector)];
                for (const form of root.querySelectorAll('form')) form.noValidate = true;
                let clicked = 0, skipped = 0;
                const skippedDetails = [];
                for (const control of controls.slice().reverse()) {
                    if (!control.isConnected) { skipped++; skippedDetails.push({ reason: 'removed-during-earlier-action', tag: control.tagName, label: control.textContent.trim().slice(0, 50), action: control.dataset.tsAction || control.getAttribute('onclick') || '' }); continue; }
                    if (control.disabled) { skipped++; skippedDetails.push({ reason: 'disabled', tag: control.tagName, label: control.textContent.trim().slice(0, 50) }); continue; }
                    if (control.matches('a[href]:not([href^="#"])')) { skipped++; skippedDetails.push({ reason: 'external-link', href: control.href }); continue; }
                    if (control.form) control.form.noValidate = true;
                    control.click();
                    clicked++;
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                out.push({ name, status: 'rendered', bytes: html.length, controls: controls.length, clicked, skipped, skippedDetails, actionAttributes: new Set(controls.map(el => el.dataset.tsAction).filter(Boolean)).size });
            }
            catch (error) { out.push({ name, status: 'error', error: error.message }); }
        }
        return { out, errors: window.fixtureBrowserErrors };
    });
    assert.equal(results.out.length, 16, 'Every routed page renderer is included');
    assert.ok(results.out.every(result => result.status === 'rendered' && result.bytes > 100), 'Every routed page should render populated markup');
    assert.ok(results.out.reduce((sum, result) => sum + result.controls, 0) >= 200, 'Route fixture should exercise the expected control surface');
    assert.deepEqual(results.errors, [], `In-page errors during page/control exercise: ${results.errors.join(' | ')}`);
    assert.deepEqual(browserErrors, [], `Browser errors during page/control exercise: ${browserErrors.join(' | ')}`);
    console.log(JSON.stringify({ result: 'PASS', routedPages: results.out.length, staticDataActions: actionMarkup.size, registeredDataActions: actionHandlers.size, unregisteredDataActions: unhandledActions.length, uniqueInlineActions: inlineReferences.size, unresolvedInlineActions: unresolvedInlineReferences.length, renderedControls: results.out.reduce((sum, result) => sum + result.controls, 0), browserErrors, routeResults: results.out }, null, 2));
} finally { await browser.close(); }
