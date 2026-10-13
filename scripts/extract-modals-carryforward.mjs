import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'js', 'app.js');

const lines = readFileSync(appPath, 'utf8').split('\n');
const start = 973;
const end = 1199;

const block = lines.slice(start, end).join('\n');
if (!block.includes('window.app_showModal = (html, id) => {')) throw new Error('start mismatch');
if (!block.includes('};')) throw new Error('end mismatch');

let moduleBlock = block;
const functionNames = ['app_showModal', 'app_openModal', 'app_renderCarryForwardIssues', 'app_removeCarryForwardIssues', 'app_findCarryForwardIssues'];

for (const name of functionNames) {
    moduleBlock = moduleBlock.replace(
        new RegExp(`window\\.${name}\\s*=\\s*async\\s*\\(`, 'g'),
        `const ${name} = async (`
    );
    moduleBlock = moduleBlock.replace(
        new RegExp(`window\\.${name}\\s*=\\s*function\\s*\\(`, 'g'),
        `const ${name} = function (`
    );
    moduleBlock = moduleBlock.replace(
        new RegExp(`window\\.${name}\\s*=\\s*\\(([^)]*)\\)\\s*=>`, 'g'),
        `const ${name} = ($1) =>`
    );
}

const moduleContent = `// Modal helpers & carry-forward issues.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml as app_escapeHtml, escapeJsSingleQuote as app_escapeJsSingleQuote } from '../utils/html-escape.js';

` + block + '\n' +

`\n// Initialize modals & carry-forward system
export const initModalsAndCarryForward = () => {
    // No load-time init needed for modals/carry-forward currently
};

` + '\n// Exports for init(), generated HTML, and other modules\n' +
    ['app_showModal', 'app_openModal', 'app_renderCarryForwardIssues', 'app_removeCarryForwardIssues', 'app_findCarryForwardIssues']
        .map(name => `export const ${name} = ${name};`).join('\n') + '\n';

mkdirSync('js/features', { recursive: true });
writeFileSync('js/features/modals-carryforward.js', moduleContent);
console.log('wrote js/features/modals-carryforward.js');

// Edit app.js: remove block, add import
const allLines = readFileSync(appPath, 'utf8').split('\n');
const before = allLines.slice(0, 973);
const after = allLines.slice(1199);

const importLine = "import { app_showModal, app_openModal, app_renderCarryForwardIssues, app_removeCarryForwardIssues, app_findCarryForwardIssues, initModalsAndCarryForward } from './features/modals-carryforward.js';";

const impIdx = allLines.slice(0, 973).findIndex((l) => l.includes('features/notifications.js'));
if (impIdx === -1) throw new Error('notifications import not found');
const newBefore = allLines.slice(0, 973);
newBefore.splice(impIdx + 1, 0, importLine);

const newAllLines = newBefore.concat(allLines.slice(1199));
writeFileSync(appPath, newAllLines.join('\n'));
console.log('updated app.js');