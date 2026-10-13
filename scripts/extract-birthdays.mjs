import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'js', 'app.js');
const featDir = join(root, 'js', 'features');
const outPath = join(featDir, 'birthdays.js');

const lines = readFileSync(appPath, 'utf8').split('\n');

// Line ranges are 1-indexed in editors, 0-indexed in the array.
// Helpers: lines 4437-4593 (const app_daysInMonth .. app_getBirthdayReminderReason)
// UI functions: lines 2505-3195 (window.app_openBirthdayEditor .. app_maybeOpenBirthdayPopup dup)
const helperStart = 4437 - 1;
const helperEnd = 4593; // exclusive
const uiStart = 2505 - 1;
const uiEnd = 3192; // exclusive

const helpers = lines.slice(helperStart, helperEnd).join('\n');
const uiFuncs = lines.slice(uiStart, uiEnd).join('\n');

// Verify boundaries before writing
const helperFirst = lines[helperStart].trim();
const helperLast = lines[helperEnd - 1].trim();
const uiFirst = lines[uiStart].trim();
const uiLast = lines[uiEnd - 1].trim();

console.log('helper first:', helperFirst.slice(0, 60));
console.log('helper last:', helperLast.slice(0, 60));
console.log('ui first:', uiFirst.slice(0, 60));
console.log('ui last:', uiLast.slice(0, 60));

if (!helperFirst.startsWith('const app_daysInMonth')) throw new Error('helper start mismatch');
if (!helperLast.startsWith('};')) throw new Error('helper end mismatch');
if (!uiFirst.startsWith('window.app_openBirthdayEditor')) throw new Error('ui start mismatch');
if (!uiLast.startsWith('};')) throw new Error('ui end mismatch');

mkdirSync(featDir, { recursive: true });

const header = `// Birthday feature: editors, calendar, reminders, sync.
// Extracted verbatim from js/app.js during the decomposition refactor.
// Helpers are exported because the work-plan code in app.js also calls them.

import { escapeDialogHtml } from '../utils/html-escape.js';
import AppUI from '../ui.js';

`;

// Export the helpers that work-plan code (still in app.js) calls.
const exportNames = [
  'app_daysInMonth',
  'app_getBirthdayFieldValue',
  'app_extractBirthdayFields',
  'app_formatBirthdayDate',
  'app_getBirthdaySourceConfig',
  'app_getBirthdayEditorMeta',
  'app_buildBirthdayReminderPayload',
  'app_getISTNowDate',
  'app_getPostponeDefaultDate',
  'app_toDateKey',
  'app_getBirthdayOccurrence',
  'app_isWorkingDay',
  'app_getPreviousWorkingDay',
  'app_getBirthdayReminderReason'
];

let helperBlock = helpers;
for (const name of exportNames) {
  helperBlock = helperBlock.replace(`const ${name} =`, `export const ${name} =`);
}

writeFileSync(outPath, header + helperBlock + '\n\n' + uiFuncs + '\n');
console.log(`wrote ${outPath}`);

// Now edit app.js: remove the two blocks and add the import.
// Remove the helper block FIRST (it's after the UI block), so the UI block's
// index doesn't shift. Work backwards so line numbers stay valid.
let app = lines.slice();

// Remove helper block (4437-4593) first — it's after the UI block.
app.splice(helperStart, helperEnd - helperStart);

// Remove UI block (2505-3192) — index unchanged by the helper removal above.
app.splice(uiStart, uiEnd - uiStart);

// Add the import after the last existing import (line 38 area).
// Find the last import line.
let lastImport = -1;
for (let i = 0; i < 60; i++) {
  if (app[i] && app[i].startsWith('import ')) lastImport = i;
}
if (lastImport === -1) throw new Error('no import found in first 60 lines');

const importLine = `import { ${exportNames.join(', ')} } from './features/birthdays.js';`;
app.splice(lastImport + 1, 0, importLine);

writeFileSync(appPath, app.join('\n'));
console.log('updated app.js');
console.log(`app.js: ${lines.length} -> ${app.length} lines`);
