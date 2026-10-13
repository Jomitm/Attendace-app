import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'js', 'app.js');

const allLines = readFileSync(appPath, 'utf8').split('\n');
const start = 1199;
const end = 1674;

const block = allLines.slice(start, end).join('\n');
if (!block.includes('const toSafeNotifStatus')) throw new Error('start mismatch');
if (!block.includes('await window.app_refreshNotificationBell();')) throw new Error('end mismatch');

const moduleContent = `// Notification bell & history drawer.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml, escapeJsSingleQuote as app_escapeJsSingleQuote } from '../utils/html-escape.js';

` + block + '\n' +

`\n// Initialize notification system
export const initNotifications = () => {
    // No load-time init needed for notifications currently
    // app_refreshNotificationBell is called from initAppSetup
};

` + '\n// Re-export window functions as local exports\n' +
    'export const app_refreshNotificationBell = window.app_refreshNotificationBell;\n' +
    'export const app_closeNotificationHistory = window.app_closeNotificationHistory;\n' +
    'export const app_recordNotifError = window.app_recordNotifError;\n' +
    'export const app_showLastNotifError = window.app_showLastNotifError;\n' +
    'export const app_markNotificationResponded = window.app_markNotificationResponded;\n' +
    'export const app_respondNotificationFromHistory = window.app_respondNotificationFromHistory;\n' +
    'export const app_openNotificationHistory = window.app_openNotificationHistory;\n';

mkdirSync('js/features', { recursive: true });
writeFileSync('js/features/notifications.js', moduleContent);
console.log('wrote js/features/notifications.js');

const before = allLines.slice(0, 1199);
const after = allLines.slice(1674);

const importLine = "import { app_refreshNotificationBell, app_closeNotificationHistory, app_recordNotifError, app_showLastNotifError, app_markNotificationResponded, app_respondNotificationFromHistory, app_openNotificationHistory, initNotifications } from './features/notifications.js';";

const impIdx = allLines.slice(0, 1199).findIndex((l) => l.includes('features/app-setup.js'));
if (impIdx === -1) throw new Error('app-setup import not found');
const newBefore = allLines.slice(0, 1199);
newBefore.splice(impIdx + 1, 0, importLine);

const newAllLines = newBefore.concat(allLines.slice(1674));
writeFileSync('js/app.js', newAllLines.join('\n'));
console.log('updated app.js');