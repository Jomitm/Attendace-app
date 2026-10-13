import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'js', 'app.js');
const outPath = join(root, 'js', 'features', 'hover-help.js');

const lines = readFileSync(appPath, 'utf8').split('\n');

const start = 1264 - 1; // 0-indexed
const end = 1674; // exclusive

const block = lines.slice(start, end).join('\n');
if (!block.startsWith('let hoverHelpTooltipEl')) throw new Error('start mismatch: ' + block.slice(0, 60));
if (!block.trimEnd().endsWith('};')) throw new Error('end mismatch: ' + block.slice(-60));

const header = `// Hover-help tooltip system + page usage notes.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml } from '../utils/html-escape.js';

const HOVER_HELP_SELECTOR = [
    'button',
    'a[href]',
    '[role="button"]',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'label',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

const HOVER_HELP_PAGE_MESSAGES = Object.freeze({
    dashboard: 'Open the dashboard overview.',
    'team-activities': 'View recent team activity updates.',
    'staff-directory': 'Browse the staff directory.',
    policies: 'Read attendance and office policies.',
    'annual-plan': 'View the annual work plan.',
    'birthday-calendar': 'View or manage birthdays.',
    timesheet: 'Review attendance and work logs.',
    minutes: 'Open meeting notes and decisions.',
    admin: 'Open admin tools and reports.',
    'master-sheet': 'Review the attendance sheet.',
    salary: 'Open salary processing tools.',
    'policy-test': 'Open the policy test page.',
    widget: 'Open the compact widget view.',
    profile: 'Open your profile and settings.'
});

const HOVER_HELP_ACTIONS = [
    { pattern: /notification/i, message: 'Open notification history.' },
    { pattern: /toggle sidebar|menu/i, message: 'Show or hide the sidebar menu.' },
    { pattern: /sign out|logout/i, message: 'Sign out of the app.' },
    { pattern: /check[\s-]?in/i, message: 'Mark your check-in for the day.' },
    { pattern: /check[\s-]?out/i, message: 'Mark your check-out for the day.' },
    { pattern: /save/i, message: 'Save your changes.' },
    { pattern: /edit/i, message: 'Edit this item.' },
    { pattern: /delete|remove|trash/i, message: 'Remove this item.' },
    { pattern: /close|cancel/i, message: 'Close this panel.' },
    { pattern: /search/i, message: 'Search the current records.' },
    { pattern: /filter/i, message: 'Filter the current list.' },
    { pattern: /export|download/i, message: 'Export this data.' },
    { pattern: /approve/i, message: 'Approve this request.' },
    { pattern: /reject/i, message: 'Reject this request.' },
    { pattern: /message|chat/i, message: 'Open a message window.' },
    { pattern: /view|details|info/i, message: 'View more details.' },
    { pattern: /\bnext\b/i, message: 'Go to the next page.' },
    { pattern: /\bprev\b|\bprevious\b/i, message: 'Go to the previous page.' },
    { pattern: /add|new|create/i, message: 'Add a new item.' },
    { pattern: /submit/i, message: 'Submit this form.' },
    { pattern: /refresh|update/i, message: 'Check for the latest updates.' },
    { pattern: /\btoday\b/i, message: 'Jump to today.' }
];

`;

const out = header + block.replace('const initPageUsageNotes =', 'export const initPageUsageNotes =') + '\n';

mkdirSync(join(root, 'js', 'features'), { recursive: true });
writeFileSync(outPath, out);
console.log('wrote', outPath);

const before = lines.slice(0, start);
const after = lines.slice(end);

const importLine = "import { initPageUsageNotes } from './features/hover-help.js';";
const impIdx = before.findIndex((l) => l.includes('features/birthdays.js'));
if (impIdx === -1) throw new Error('birthdays import not found');
before.splice(impIdx + 1, 0, importLine);

writeFileSync(appPath, before.concat(after).join('\n'));
console.log('updated app.js');
console.log('app.js:', lines.length, '->', before.length + after.length, 'lines');
