// Share the selection between initial rendering, async refresh and fullscreen.
export function selectDashboardActivities(rows, viewMode, userId) {
    const source = Array.isArray(rows) ? rows : [];
    if (viewMode === 'team') return source;
    const id = String(userId || '');
    if (!id) return [];
    return source.filter(row => String(row.userId || row.user_id || row.staffId || '') === id);
}

// Use recorded changes and completed work, rather than repeating the open task queue.
export function recentDashboardActivities(rows, sortKey = 'date-desc') {
    const result = [], seen = new Set();
    const labels = { complete: 'Completed a task', completed: 'Completed a task', postpone: 'Postponed a task', delegate: 'Delegated a task' };
    for (const row of rows || []) {
        const changes = (Array.isArray(row.taskUpdates) ? row.taskUpdates : []).filter(update => update?.timestamp);
        if (changes.length) {
            changes.forEach(update => result.push({ ...row, changeLabel: labels[update.action] || 'Updated a task', changeAt: update.timestamp, dateLabel: '' }));
        } else if (row.type === 'attendance' || row._taskStatus === 'completed') {
            const recordedAt = row.completedAt || row.completedDate || row.completed_on;
            result.push({ ...row, changeLabel: row.type === 'attendance' ? 'Logged work' : 'Completed a task', changeAt: recordedAt || row.date, dateLabel: recordedAt ? '' : 'Record date · ' });
        } else if (row.updatedAt) {
            result.push({ ...row, changeLabel: 'Updated a task', changeAt: row.updatedAt, dateLabel: '' });
        }
    }
    const time = value => typeof value === 'number' ? value : value?.seconds ? value.seconds * 1000 : Date.parse(value);
    return result.filter(row => {
        const stamp = time(row.changeAt);
        if (!Number.isFinite(stamp)) return false;
        row.changeTime = stamp;
        const key = `${row.userId || row.user_id || ''}|${row._displayDesc}|${row.changeLabel}|${stamp}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
    }).sort((a, b) => {
        const dateOrder = b.changeTime - a.changeTime;
        const nameOrder = String(a.staffName || '').localeCompare(String(b.staffName || ''));
        if (sortKey === 'staff-asc') return nameOrder || dateOrder;
        if (sortKey === 'staff-desc') return -nameOrder || dateOrder;
        return sortKey === 'date-asc' ? -dateOrder : dateOrder;
    }).slice(0, 5);
}
