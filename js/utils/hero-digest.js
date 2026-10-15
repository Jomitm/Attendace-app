// @ts-check
// js/utils/hero-digest.js
// Pure builder for the per-candidate evidence digest sent to the AI Hero of
// the Week jury (api/_hero-select.js via js/modules/analytics.js).
//
// The deterministic ranking (rankHeroCandidates) stays the source of truth
// for scores and eligibility ÔÇö this digest only gives the model qualitative
// context about WHAT was actually delivered (task titles, size/priority/
// purpose mix, on-time record, documentation depth) so its pick and rationale
// are grounded in the work itself instead of just aggregate numbers.
//
// Dependency-free and side-effect-free so it stays unit-testable
// (tests/unit/hero-digest.test.mjs).

/** Hard cap for one candidate's digest. The server re-caps at 600
 *  (api/_hero-select-core.js MAX_DIGEST_CHARS); keep well under it so a
 *  full candidate list still fits the endpoint's body limit. */
export const HERO_DIGEST_MAX_CHARS = 520;

// Ordering only ÔÇö mirrors SCORING_RULES.SIZE_WEIGHTS defaults from
// js/config.js. Never used for scoring, just "biggest work first".
const SIZE_RANK = {
    'major-project': 6,
    'large-task': 5,
    'medium-task': 4,
    'small-task': 3,
    'quick-task': 2,
    'single-action': 1
};
const SIZE_SHORT = {
    'major-project': 'major',
    'large-task': 'large',
    'medium-task': 'medium',
    'small-task': 'small',
    'quick-task': 'quick',
    'single-action': 'single'
};

/**
 * @typedef {object} DigestTaskRow
 * @property {any} [task] Work-plan task object (task, sizeCategory, priorityLevel, purposeCategory, subPlans, completedDate, postponeWorkStatus).
 * @property {string} [status] Normalized status: completed | in_progress | postponed | missed.
 * @property {{ date?: string }} [wp] Work plan (due date).
 */

/**
 * @typedef {object} DigestLog
 * @property {any} [workDescription] Daily work note text.
 */

/** Collapse whitespace and clip to `max` chars (ASCII ellipsis on cut). */
function clip(value, max) {
    const s = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    return `${s.slice(0, Math.max(1, max - 3)).trimEnd()}...`;
}

function sizeKey(task) {
    return String(task?.sizeCategory || task?.aiSizeCategory || '');
}

function priorityKey(task) {
    return String(task?.priorityLevel || task?.aiPriorityLevel || '');
}

function sizeRank(task) {
    return SIZE_RANK[sizeKey(task)] ?? 0;
}

/**
 * Count rows per key and format the top `max` as "n label" entries.
 * @param {any[]} rows
 * @param {(row: any) => string} keyFn
 * @param {{ max?: number, labels?: Record<string, string> }} [opts]
 */
function countTop(rows, keyFn, opts = {}) {
    const max = opts.max ?? 3;
    const labels = opts.labels || {};
    /** @type {Map<string, number>} */
    const counts = new Map();
    rows.forEach((row) => {
        const key = keyFn(row);
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, max)
        .map(([key, n]) => `${n} ${labels[key] || key}`);
}

/**
 * Build the one-line evidence digest for one hero candidate.
 *
 * Produces segments like:
 *   Done: "Prepare Q3 client report" (large), "Call vendor" (quick) +2 more |
 *   OnTime: 4/5 | Missed: "Submit invoice" | Postponed: 1 still in progress |
 *   Sizes: 3 quick, 2 medium | Priority: 2 urgent, 4 standard |
 *   Purposes: client-delivery, ops | SubPlans: 2 | Notes: 1240 chars
 *
 * Missing segments are simply skipped; returns '' when there is no evidence.
 *
 * @param {DigestTaskRow[]} [tasks] Effective window task rows (`_effectiveWindowTasks` shape).
 * @param {DigestLog[]} [logs] Deduped attendance logs for the window.
 * @returns {string} Digest capped at HERO_DIGEST_MAX_CHARS.
 */
export function buildHeroEvidenceDigest(tasks, logs) {
    const rows = Array.isArray(tasks) ? tasks : [];
    const logRows = Array.isArray(logs) ? logs : [];
    const withTask = rows.filter((row) => row && String(row?.task?.task ?? '').trim());
    const byBiggest = (a, b) => sizeRank(b?.task) - sizeRank(a?.task);

    /** @type {string[]} */
    const segments = [];
    const push = (label, value) => {
        if (value) segments.push(`${label}: ${value}`);
    };

    // Done ÔÇö biggest delivered work first, so substance beats task count.
    const completed = withTask.filter((row) => row.status === 'completed').sort(byBiggest);
    if (completed.length) {
        const titles = completed.slice(0, 4).map((row) => {
            const label = SIZE_SHORT[sizeKey(row.task)] || '';
            return `"${clip(row.task.task, 40)}"${label ? ` (${label})` : ''}`;
        });
        const extra = completed.length > 4 ? ` +${completed.length - 4} more` : '';
        push('Done', titles.join(', ') + extra);
    }

    // On-time ÔÇö completed at/after due date handling mirrors rankHeroCandidates.
    let onTime = 0;
    let timed = 0;
    completed.forEach((row) => {
        const due = String(row?.wp?.date || '');
        const doneAt = String(row?.task?.completedDate || '');
        if (!due || !doneAt) return;
        timed += 1;
        const doneMs = new Date(doneAt).getTime();
        const dueMs = new Date(`${due}T23:59:59`).getTime();
        if (Number.isFinite(doneMs) && Number.isFinite(dueMs) && doneMs <= dueMs) onTime += 1;
    });
    if (timed) push('OnTime', `${onTime}/${timed}`);

    // Missed ÔÇö biggest outstanding commitments, so downside is visible too.
    const missed = withTask.filter((row) => row.status === 'missed').sort(byBiggest).slice(0, 2);
    if (missed.length) push('Missed', missed.map((row) => `"${clip(row.task.task, 40)}"`).join(', '));

    // Postponed but still moving (credit statuses) ÔÇö continuity, not slacking.
    const carried = withTask.filter((row) =>
        row.status === 'postponed'
        && ['in_progress', 'work_started'].includes(String(row?.task?.postponeWorkStatus || ''))
    );
    if (carried.length) push('Postponed', `${carried.length} still in progress`);

    // Work mix over everything planned in the window.
    const sizes = countTop(withTask, (row) => SIZE_SHORT[sizeKey(row.task)] || '', { max: 3 });
    push('Sizes', sizes.join(', '));

    const priorities = countTop(withTask, (row) => priorityKey(row.task), { max: 3 });
    push('Priority', priorities.join(', '));

    const purposes = [...new Set(
        withTask
            .map((row) => clip(row?.task?.purposeCategory || '', 16))
            .filter(Boolean)
    )].slice(0, 3);
    push('Purposes', purposes.join(', '));

    const subPlanCount = withTask.filter((row) =>
        Array.isArray(row?.task?.subPlans) && row.task.subPlans.length > 0
    ).length;
    if (subPlanCount) push('SubPlans', String(subPlanCount));

    // Documentation depth from daily work notes (productivity evidence).
    const noteChars = logRows.reduce((sum, log) => sum + String(log?.workDescription ?? '').length, 0);
    if (noteChars > 0) push('Notes', `${noteChars} chars`);

    const digest = segments.join(' | ');
    if (digest.length <= HERO_DIGEST_MAX_CHARS) return digest;
    return `${digest.slice(0, Math.max(1, HERO_DIGEST_MAX_CHARS - 3)).trimEnd()}...`;
}
