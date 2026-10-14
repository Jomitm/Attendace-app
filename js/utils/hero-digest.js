/**
 * Hero Evidence Digest Utility
 * Builds a qualitative evidence string for the AI hero jury from completed tasks and logs.
 */

import { escapeDialogHtml as app_escapeHtml } from './html-escape.js';

/**
 * Builds a qualitative evidence digest for the AI hero jury.
 * @param {Array} effectiveTasks - Array of task objects with task, status, planDate, etc.
 * @param {Array} dedupedLogs - Array of log objects with checkIn, checkOut, taskRef, etc.
 * @returns {string} Qualitative evidence digest string for AI hero jury
 */
export function buildHeroEvidenceDigest(effectiveTasks, dedupedLogs) {
    if (!effectiveTasks && !dedupedLogs) return 'No activity data available.';

    const completedTasks = (effectiveTasks || []).filter(t => String(t?.status || '').trim().toLowerCase() === 'completed');
    const totalCompleted = completedTasks.length;

    if (!totalCompleted && (!dedupedLogs || !dedupedLogs.length)) {
        return 'No completed tasks or attendance logs found for this period.';
    }

    const taskSummary = completedTasks
        .map(t => `- ${app_escapeHtml(t.task || 'Untitled task')} (${t.planDate || 'date unknown'})`)
        .slice(0, 10)
        .join('; ') || 'No completed tasks.';

    const logSummary = (dedupedLogs || [])
        .filter(l => l.checkIn && l.checkOut && l.checkOut !== 'Active Now')
        .map(l => {
            const duration = l.checkIn && l.checkOut ? ` ${Math.round((new Date(l.checkOut) - new Date(l.checkIn)) / 3600000 * 100) / 100}h` : '';
            return `${app_escapeHtml(l.taskRef || 'Log')} on ${l.checkIn?.split('T')[0] || 'unknown date'}${duration}`;
        })
        .slice(0, 5)
        .join('; ') || 'No attendance logs.';

    return `Completed ${totalCompleted} task(s): ${taskSummary}. Attendance: ${logSummary}.`;
}

export default buildHeroEvidenceDigest;