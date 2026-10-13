import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'js', 'app.js');

const allLines = readFileSync(appPath, 'utf8').split('\n');
const part1Start = 404;
const part1End = 646;
const part2Start = 650;
const part2End = 777;

const part1 = allLines.slice(part1Start, part1End).join('\n');
const part2 = allLines.slice(part2Start, part2End).join('\n');

if (!part1.includes('window.app_getNavSectionCollapsed')) throw new Error('part1 start mismatch');
if (!part2.includes('appServiceWorkerRegistration = await navigator.serviceWorker.register')) throw new Error('part2 end mismatch');

const exports = new Set();
const globalRegex = /window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
let match;
for (const part of [part1, part2]) {
    const regex = new RegExp('window\\.([A-Za-z_$][A-Za-z0-9_$]*)\\s*=', 'g');
    let m;
    while ((m = globalRegex.exec(part)) !== null) {
        exports.add(m[1]);
    }
}

const extraExports = [
    // 'initAppSetup',  // handled by function declaration
];
extraExports.forEach(e => exports.add(e));

// Function declarations in the extracted block that need re-export
const functionExports = ['registerSW', 'updateThemeIcons'];
functionExports.forEach(e => exports.add(e));

const exportBlock = '\n// Exports for init(), generated HTML, and other modules\n' +
    Array.from(exports).sort().filter(name => !['registerSW', 'initAppSetup', 'updateThemeIcons'].includes(name)).map(name => `export const ${name} = ${name};`).join('\n') + '\n' +
    '\n// Function declarations (re-export)\n' +
    ['registerSW', 'updateThemeIcons'].map(name => `export { ${name} };`).join('\n') + '\n';

const moduleContent = `// App setup: navigation, theme, hidden sheets, service worker.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml } from '../utils/html-escape.js';
import AppUI from '../ui.js';

// Module-scoped state for service worker
let appServiceWorkerRegistration = null;

// Module-scoped state for auto-collapse timer
let autoCollapseTimer = null;

` + part1.replace('let autoCollapseTimer = null;', '') + '\n' + part2 + '\n' +

`\n// Initialize app setup: event listeners, theme, hidden sheets, nav sections, SW
export const initAppSetup = () => {
    window.addEventListener('load', () => {
        try { window.app_showLastNotifError(); } catch (err) { void err; }
        try { window.app_applyShowHiddenSheetsToggle(); } catch (err) { void err; }
        try { if (typeof window.app_initSectionToggle === 'function') window.app_initSectionToggle(); } catch (err) { void err; }
    }, { once: true });

    document.addEventListener('DOMContentLoaded', () => {
        try { window.app_applyShowHiddenSheetsToggle(); } catch (err) { void err; }
        try { if (typeof window.app_initSectionToggle === 'function') window.app_initSectionToggle(); } catch (err) { void err; }
        try { if (typeof window.app_updateNavigationSections === 'function') window.app_updateNavigationSections(); } catch (err) { void err; }
    }, { once: true });

    registerSW();
};

` + '\n// Exports for init(), generated HTML, and other modules\n' +
    Array.from(new Set([
        'registerSW', 'app_initTheme', 'app_initSectionToggle', 'app_updateNavigationSections',
        'app_getNavSectionCollapsed', 'app_setNavSectionCollapsed', 'app_toggleNavSection',
        'app_getShowHiddenSheets', 'app_setShowHiddenSheets', 'app_toggleShowHiddenSheets',
        'app_applyShowHiddenSheetsToggle', 'app_startAutoCollapseTimer', 'app_resetAutoCollapseTimer',
        'app_autoCollapseSections', 'updateThemeIcons'
    ])).sort().filter(name => !['registerSW', 'initAppSetup', 'updateThemeIcons'].includes(name)).map(name => `export const ${name} = ${name};`).join('\n') + '\n' +
    '\n// Function declarations (re-export)\n' +
    ['registerSW', 'updateThemeIcons'].map(name => `export { ${name} };`).join('\n') + '\n';

mkdirSync('js/features', { recursive: true });
writeFileSync('js/features/app-setup.js', moduleContent);
console.log('wrote js/features/app-setup.js');

const before = allLines.slice(0, 404);
const middle = allLines.slice(646, 650);
const after = allLines.slice(777);

const importLine = "import { registerSW, app_initTheme, app_initSectionToggle, app_updateNavigationSections, app_getNavSectionCollapsed, app_setNavSectionCollapsed, app_toggleNavSection, app_getShowHiddenSheets, app_setShowHiddenSheets, app_toggleShowHiddenSheets, app_applyShowHiddenSheetsToggle, app_startAutoCollapseTimer, app_resetAutoCollapseTimer, app_autoCollapseSections, initAppSetup } from './features/app-setup.js';";

const impIdx = allLines.slice(0, 404).findIndex((l) => l.includes('features/hover-help.js'));
if (impIdx === -1) throw new Error('hover-help import not found');
const newBefore = allLines.slice(0, 404);
newBefore.splice(impIdx + 1, 0, importLine);

const newAllLines = newBefore.concat(middle).concat(allLines.slice(777));
let appContent = newAllLines.join('\n');

const updatedContent = appContent.replace(
    'await window.AppAuth.init();',
    'await window.AppAuth.init();\n        initAppSetup();'
);

writeFileSync('js/app.js', updatedContent);
console.log('updated app.js');