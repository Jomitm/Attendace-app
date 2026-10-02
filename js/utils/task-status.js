const CLOSED_STATUS_ALIASES = new Set([
    'completed',
    'complete',
    'done',
    'finished',
    'closed',
    'postponed',
    'postpone',
    'not-completed',
    'not completed',
    'cancelled',
    'canceled',
    'removed',
    'in-process',
    'in process',
    'working',
    'started',
    'to-be-started',
    'to be started',
    'pending',
    'planned',
    'overdue',
    'missed'
]);

function normalizeRawStatus(value) {
    return String(value || '').trim().toLowerCase();
}

export function normalizeTaskStatus(task = {}, planDate = '', smartStatusResolver = null) {
    const rawStatus = normalizeRawStatus(task.status);
    if (['completed', 'complete', 'done', 'finished', 'closed'].includes(rawStatus)) return 'completed';
    if (['postponed', 'postpone'].includes(rawStatus)) return 'postponed';
    if (['not-completed', 'not completed', 'cancelled', 'canceled', 'removed'].includes(rawStatus)) return 'not-completed';
    if (['in-process', 'in process', 'working', 'started'].includes(rawStatus)) return 'in-process';
    if (['overdue', 'missed'].includes(rawStatus)) return rawStatus;

    // Idle statuses ('to-be-started'/'pending'/'planned') follow the same
    // date-driven model as AppRating.getSmartTaskStatus when a resolver is
    // supplied: today's untouched work surfaces as in-process and past work
    // as overdue instead of being parked in 'to-be-started' forever. Explicit
    // 'in-process'/'postponed' above stay manual overrides. Without a resolver
    // (bulk-shift, badge helpers) or a usable plan date the historical
    // classification stands.
    if (['to-be-started', 'to be started', 'pending', 'planned'].includes(rawStatus)) {
        const hasPlanDate = typeof planDate === 'string' && planDate.trim() !== '';
        if (hasPlanDate && typeof smartStatusResolver === 'function') {
            const smartStatus = normalizeRawStatus(smartStatusResolver(planDate, rawStatus) || rawStatus);
            if (['completed', 'postponed', 'not-completed', 'in-process', 'to-be-started', 'overdue', 'missed'].includes(smartStatus)) {
                return smartStatus;
            }
        }
        return 'to-be-started';
    }

    if (task.completedDate || task.completedAt || task.completed_on) return 'completed';
    if (task.postponedFromDate || normalizeRawStatus(task.addedFrom) === 'postponed') return 'postponed';

    if (typeof smartStatusResolver === 'function') {
        const smartStatus = normalizeRawStatus(smartStatusResolver(planDate, rawStatus) || rawStatus);
        if (['completed', 'postponed', 'not-completed', 'in-process', 'to-be-started', 'overdue', 'missed'].includes(smartStatus)) {
            return smartStatus;
        }
    }

    if (CLOSED_STATUS_ALIASES.has(rawStatus)) return rawStatus;
    return rawStatus || 'to-be-started';
}
