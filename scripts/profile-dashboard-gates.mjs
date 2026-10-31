// Production renderer with labelled fixture data and deliberately injected delay.
// These are critical-path experiments, not measurements of Firebase latency.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ headless: true });
const results = [];
try {
    for (const scenario of ['baseline', 'yearly', 'minutes', 'programmes', 'background-summary']) {
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:3047/tests/browser/dashboard-workday.fixture.html?role=staff', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => window.fixtureReady, null, { timeout: 60000 });
        const measured = await page.evaluate(async scenario => {
            const wait = () => new Promise(resolve => setTimeout(resolve, 1200));
            const { renderDashboard } = await import('/js/ui/dashboard.js');
            if (scenario === 'yearly') {
                const original = window.AppAnalytics.getUserYearlyStats;
                window.AppAnalytics.getUserYearlyStats = async (...args) => { await wait(); return original(...args); };
            }
            if (scenario === 'minutes') {
                const original = window.AppMinutes.getMinutes;
                window.AppMinutes.getMinutes = async (...args) => { await wait(); return original(...args); };
            }
            if (scenario === 'programmes') {
                const savedAuth = window.AppAuth, savedCalendar = window.AppCalendar;
                const { Calendar } = await import('/js/modules/calendar.js');
                window.AppAuth = savedAuth;
                const calendar = new Calendar();
                calendar.db = { getAll: async () => [], queryMany: async () => [] };
                window.AppCalendar = { ...savedCalendar, getPlans: () => calendar.getPlans() };
                const originalFetch = window.fetch;
                window.fetch = async (...args) => { if (args[0] === '/api/programmes') await wait(); return originalFetch(...args); };
            }
            if (scenario === 'background-summary') window.AppDB.getOrCreateDailySummary = async () => { await wait(); return null; };
            const started = performance.now();
            await renderDashboard({ preserveView: true });
            return { renderReturnMs: Math.round(performance.now() - started) };
        }, scenario);
        results.push({ scenario, injectedDelayMs: scenario === 'baseline' ? 0 : 1200, ...measured });
        await page.close();
    }
} finally { await browser.close(); }
const output = { evidence: 'Production dashboard/calendar code with synthetic 1200ms dependencies and sample records; no live account or database', results };
writeFileSync(new URL('../docs/performance-dashboard-gates.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
