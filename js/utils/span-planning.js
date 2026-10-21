// @ts-check
// js/utils/span-planning.js
// Pure helpers for multi-day (spanning) tasks. No DOM, no Firestore —
// safe to import from UI code, services and unit tests.
//
// A task spans [startDate, endDate] (inclusive, YYYY-MM-DD). Single-day tasks
// have startDate === endDate. The day page stores each task once (on its
// start-date plan doc) and projects it virtually onto every covered date.

import { isRequiredWorkingDay } from './working-days.js';

/** Lookback window (days) when collecting spanning tasks for a date. */
export const SPAN_LOOKBACK_DAYS = 14;

/** Productive hours assumed per working day for capacity math. */
export const SPAN_HOURS_PER_DAY = 8;

/** Estimated hours per size category (mirrors the editor's own labels). */
export const EFFORT_HOURS = {
    'single-action': 0.25,
    'quick-task': 1,
    'small-task': 4,
    'medium-task': 8,
    'large-task': 16,
    'major-project': 40
};

/** ISO date key (YYYY-MM-DD) or '' when invalid. */
export function asIsoDate(value) {
    const raw = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
    const d = new Date(`${raw}T00:00:00`);
    return Number.isNaN(d.getTime()) ? '' : raw;
}

/** Shift an ISO date key by n calendar days. Returns '' on bad input. */
export function addDaysStr(dateStr, n) {
    const iso = asIsoDate(dateStr);
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + Number(n || 0));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Calendar-day distance b - a (can be negative). NaN-safe → 0. */
export function diffDaysStr(a, b) {
    const da = asIsoDate(a);
    const db = asIsoDate(b);
    if (!da || !db) return 0;
    const ms = new Date(`${db}T00:00:00`).getTime() - new Date(`${da}T00:00:00`).getTime();
    return Math.round(ms / 86400000);
}

/**
 * Effective [startDate, endDate] for a task stored on planDate.
 * Explicit task dates win; missing/invalid parts fall back to the plan
 * date; end < start clamps to a single day. Returns null when nothing
 * usable exists. (Mirrors the core of app_getTaskRangeBounds in js/app.js,
 * which additionally handles text inference and source inheritance for
 * calendar views — intentionally not duplicated here.)
 */
export function getTaskSpan(task, planDate) {
    const startDate = asIsoDate(task?.startDate) || asIsoDate(planDate);
    if (!startDate) return null;
    let endDate = asIsoDate(task?.endDate) || startDate;
    if (endDate < startDate) endDate = startDate;
    return { startDate, endDate };
}

/** True when dateStr falls inside the task's span (inclusive). */
export function taskCoversDate(task, planDate, dateStr) {
    const span = getTaskSpan(task, planDate);
    if (!span) return String(planDate || '') === String(dateStr || '');
    const day = asIsoDate(dateStr);
    if (!day) return false;
    if (day < span.startDate || day > span.endDate) return false;
    const doneOn = asIsoDate(task?.completedDate);
    if (doneOn && doneOn < day) return false;
    return true;
}

/**
 * "Day X of N" position for a date inside the task's span (calendar days).
 * Returns null when the date is not covered.
 */
export function spanDayLabel(task, planDate, dateStr) {
    const span = getTaskSpan(task, planDate);
    if (!span) return null;
    const day = asIsoDate(dateStr);
    if (!day || day < span.startDate || day > span.endDate) return null;
    const dayCount = diffDaysStr(span.startDate, span.endDate) + 1;
    const dayIndex = diffDaysStr(span.startDate, day) + 1;
    return { dayIndex, dayCount, label: `Day ${dayIndex} of ${dayCount}` };
}

/**
 * Collect virtual spanning entries for a date: tasks stored on EARLIER plan
 * docs whose [startDate, endDate] range covers dateStr. Single-day tasks,
 * completed/removed tasks and tasks finished before dateStr never project —
 * they render from their own doc (or not at all).
 *
 * Pure function over already-fetched plan docs (no DB) — unit-tested.
 * Each entry carries _spannedVirtual + _home* provenance so the renderer
 * can show it read-only and the save path can skip it.
 */
export function collectSpanningTasks(plans, dateStr, userId) {
    const day = asIsoDate(dateStr);
    if (!day) return [];
    const uid = String(userId || '');
    const out = [];
    for (const wp of (Array.isArray(plans) ? plans : [])) {
        if (!wp || !Array.isArray(wp.plans)) continue;
        const homeDate = asIsoDate(wp.date);
        if (!homeDate) continue;
        const owner = String(wp.userId || wp.user_id || '');
        (wp.plans || []).forEach((t, idx) => {
            if (!t || t.isRemoved) return;
            if (!String(t.task || '').trim()) return;
            const assigned = String(t.assignedTo || owner).trim();
            if (uid && assigned && assigned !== uid && owner !== uid) return;
            if (uid && !assigned && owner !== uid) return;
            const status = String(t.status || '').trim().toLowerCase();
            if (status === 'completed' || t.completed === true) return;
            if (homeDate === day) return; // home doc renders it normally
            if (!taskCoversDate(t, homeDate, day)) return;
            const label = spanDayLabel(t, homeDate, day);
            if (!label || label.dayCount < 2) return; // single-day: no projection needed
            out.push({
                ...t,
                _spannedVirtual: true,
                _homeDate: homeDate,
                _homePlanId: String(wp.id || ''),
                _homeIndex: idx,
                _spanLabel: label.label,
                _spanDayIndex: label.dayIndex,
                _spanDayCount: label.dayCount
            });
        });
    }
    out.sort((a, b) => String(a._homeDate).localeCompare(String(b._homeDate)) || (a._homeIndex - b._homeIndex));
    return out;
}

/** Estimated hours for a task from its size category (defaults to quick-task). */
export function taskEffortHours(task) {
    const size = String(task?.sizeCategory || '').trim();
    if (Object.prototype.hasOwnProperty.call(EFFORT_HOURS, size)) return EFFORT_HOURS[size];
    return EFFORT_HOURS['quick-task'];
}

/** Working days in [startDate, endDate] (Mon–Fri minus holidays). */
export function countSpanWorkingDays(startDate, endDate, holidayDates) {
    const s = asIsoDate(startDate);
    const e = asIsoDate(endDate);
    if (!s || !e || e < s) return 0;
    let count = 0;
    let guard = 800;
    let cursor = s;
    while (cursor <= e && guard-- > 0) {
        if (isRequiredWorkingDay(cursor, holidayDates)) count++;
        if (cursor === e) break;
        cursor = addDaysStr(cursor, 1);
    }
    return count;
}

/** Advance n working days from startDate (start counts when it is one). */
export function addWorkingDays(startDate, n, holidayDates) {
    let cursor = asIsoDate(startDate);
    if (!cursor) return '';
    let remaining = Math.max(1, Number(n) || 1);
    let guard = 800;
    for (;;) {
        if (isRequiredWorkingDay(cursor, holidayDates)) {
            remaining--;
            if (remaining <= 0) return cursor;
        }
        if (guard-- <= 0) return cursor;
        cursor = addDaysStr(cursor, 1);
    }
}

/**
 * Per-day load across a span: each open task's effort spreads evenly over
 * its overlapping working days. Days beyond capacity are flagged.
 * Skips completed/removed tasks and non-working days for capacity.
 */
export function computeSpanLoad(tasks, startDate, endDate, opts = {}) {
    const holidayDates = opts.holidayDates;
    const capacity = Number(opts.dailyCapacity) || SPAN_HOURS_PER_DAY;
    const s = asIsoDate(startDate);
    const e = asIsoDate(endDate);
    const perDay = [];
    if (!s || !e || e < s) return { perDay, totalHours: 0, workingDays: 0, capacityHours: 0, fits: true, shortfallHours: 0 };
    const open = (Array.isArray(tasks) ? tasks : []).filter(
        (t) => t && t.isRemoved !== true && String(t.status || '').trim().toLowerCase() !== 'completed'
    );
    let totalHours = 0;
    let cursor = s;
    let guard = 800;
    while (cursor <= e && guard-- > 0) {
        if (isRequiredWorkingDay(cursor, holidayDates)) {
            let hours = 0;
            for (const t of open) {
                const span = getTaskSpan(t, t.planDate || s);
                if (!span) continue;
                if (cursor < span.startDate || cursor > span.endDate) continue;
                const days = Math.max(1, countSpanWorkingDays(span.startDate, span.endDate, holidayDates));
                hours += taskEffortHours(t) / days;
            }
            hours = Math.round(hours * 100) / 100;
            totalHours += hours;
            perDay.push({ date: cursor, hours, over: hours > capacity });
        }
        if (cursor === e) break;
        cursor = addDaysStr(cursor, 1);
    }
    totalHours = Math.round(totalHours * 100) / 100;
    const workingDays = perDay.length;
    const capacityHours = workingDays * capacity;
    const shortfallHours = Math.max(0, Math.round((totalHours - capacityHours) * 100) / 100);
    return { perDay, totalHours, workingDays, capacityHours, fits: shortfallHours <= 0, shortfallHours };
}

/**
 * Planned load on a single date from already-serialized task payloads
 * (the shape app_saveDayPlan builds). Each open task contributes its
 * effort spread evenly over its overlapping working days.
 */
export function computeDayLoad(tasks, dateStr, opts = {}) {
    const day = asIsoDate(dateStr);
    if (!day) return { date: String(dateStr || ''), hours: 0, over: false };
    const capacity = Number(opts.dailyCapacity) || SPAN_HOURS_PER_DAY;
    const holidayDates = opts.holidayDates;
    const targetUserId = String(opts.targetUserId || '').trim();
    let hours = 0;
    for (const t of (Array.isArray(tasks) ? tasks : [])) {
        if (!t || t.isRemoved) continue;
        if (t.isReference === true) continue;
        const assignedTo = String(t.assignedTo || '').trim();
        if (targetUserId && assignedTo && assignedTo !== targetUserId) continue;
        if (!String(t.task || '').trim()) continue;
        if (String(t.status || '').trim().toLowerCase() === 'completed') continue;
        const span = getTaskSpan(t, day);
        if (!span || day < span.startDate || day > span.endDate) continue;
        const doneOn = asIsoDate(t.completedDate);
        if (doneOn && doneOn < day) continue;
        const days = Math.max(1, countSpanWorkingDays(span.startDate, span.endDate, holidayDates));
        hours += taskEffortHours(t) / days;
    }
    hours = Math.round(hours * 100) / 100;
    return { date: day, hours, over: hours > capacity };
}

/**
 * Suggest an end date for a size: enough working days to hold its effort.
 * Returns startDate itself for sub-day sizes.
 */
export function suggestEndDate(startDate, sizeCategory, holidayDates) {
    const s = asIsoDate(startDate);
    if (!s) return '';
    const days = Math.max(1, Math.ceil(taskEffortHours({ sizeCategory }) / SPAN_HOURS_PER_DAY));
    return addWorkingDays(s, days, holidayDates);
}

/**
 * Parse "3-day task" / "takes 4 days" / "2 days work" relative to refDate.
 * Returns { startDate, endDate } or null.
 */
export function parseDurationPhrase(text, refDate) {
    const raw = String(text || '');
    const m = raw.match(/(\d{1,2})\s*-?\s*days?\b/i);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 1 || n > 60) return null;
    const start = asIsoDate(refDate);
    if (!start) return null;
    return { startDate: start, endDate: addDaysStr(start, n - 1) };
}
