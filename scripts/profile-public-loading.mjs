// Empty browser profiles only: measures the signed-out shell, never a real account.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const targets = process.argv.slice(2);
if (!targets.length || targets.some(url => !/^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/$/.test(url))) throw new Error('Pass loopback preview URLs only.');
const results = [];
const browser = await chromium.launch({ headless: true });
try {
    for (const base of targets) {
        const context = await browser.newContext();
        await context.addInitScript(() => {
            window.__loadingLongTasks = [];
            new PerformanceObserver(list => window.__loadingLongTasks.push(...list.getEntries().map(entry => ({ startTime: entry.startTime, duration: entry.duration })))).observe({ entryTypes: ['longtask'] });
        });
        const page = await context.newPage();
        const failed = [];
        page.on('requestfailed', req => { const url = new URL(req.url()); failed.push({ resource: url.origin + url.pathname, reason: req.failure()?.errorText }); });
        for (const run of ['cold', 'warm']) {
            const started = performance.now();
            let error = null;
            try {
                if (run === 'warm') await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
                else await page.goto(base + '#dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 });
                await page.locator('#login-form').waitFor({ state: 'visible', timeout: 20000 });
            } catch (failure) { error = failure.message.split('\n')[0]; }
            const shellMs = Math.round(performance.now() - started);
            const measured = await page.evaluate(() => ({
                navigation: performance.getEntriesByType('navigation').map(entry => ({ responseEnd: entry.responseEnd, domContentLoaded: entry.domContentLoadedEventEnd, load: entry.loadEventEnd })),
                resources: performance.getEntriesByType('resource').map(entry => { const url = new URL(entry.name); return { resource: url.origin + url.pathname, duration: Math.round(entry.duration), bytes: entry.encodedBodySize, initiator: entry.initiatorType }; }),
                longTasks: window.__loadingLongTasks || [],
                loginVisible: !!document.querySelector('#login-form')
            }));
            results.push({ base, run, shellMs, error, failed: [...failed], ...measured });
            console.log(JSON.stringify({ base, run, shellMs, error, loginVisible: measured.loginVisible, resources: measured.resources.length,
                longTasks: measured.longTasks.length, slowest: [...measured.resources].sort((a, b) => b.duration - a.duration).slice(0, 4) }));
        }
        await context.close();
    }
} finally { await browser.close(); }
writeFileSync(new URL('../docs/performance-public-load.json', import.meta.url), JSON.stringify({ evidence: 'Local empty-profile Chromium measurements; signed-in Firebase/dashboard timing is not included', results }, null, 2) + '\n');
