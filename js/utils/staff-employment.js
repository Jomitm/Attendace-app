export function isFormerStaff(user) {
    return !!user && (['former', 'resigned', 'retired', 'inactive'].includes(String(user.employmentStatus || '').toLowerCase())
        || user.status === 'inactive');
}

export function canManageStaff(user) {
    return !!user && !isFormerStaff(user) && (user.isAdmin === true || user.permissions?.users === 'admin');
}

const STAFF_COLLECTIONS = new Set(['users', 'user_private', 'attendance', 'leaves', 'minutes', 'salaries', 'staff_messages', 'work_plans',
    'location_audits', 'task_activity_events', 'daily_standups', 'journey_reflections', 'meetings', 'birthday_people', 'hero_selections', 'daily_summaries', 'events']);

export function filterFormerStaffRecords(collection, rows, formerIds) {
    if (!STAFF_COLLECTIONS.has(collection) || (!formerIds.size && collection !== 'users')) return rows;
    const isFormer = id => id !== undefined && formerIds.has(String(id));
    const prune = record => {
        if (!record || typeof record !== 'object') return record;
        const primary = record.user_id || record.userId || record.staffId || record.ownerId || record.assignedTo;
        if (['users', 'user_private'].includes(collection) && isFormer(record.id)) return null;
        if (isFormer(record.fromId) || isFormer(record.toId) || isFormer(record.linkedUserId) || isFormer(record.sourceUserId)) return null;
        if (isFormer(primary) || (collection === 'users' && (isFormer(record.id) || isFormerStaff(record)))) return null;
        if (!primary && (isFormer(record.senderId) || isFormer(record.fromUserId) || isFormer(record.createdById) || isFormer(record.createdBy) || isFormer(record.taggedById))) return null;
        const copy = { ...record };
        for (const [key, value] of Object.entries(copy)) {
            if (['hero', 'winner', 'runnerUp', 'user'].includes(key) && value && typeof value === 'object') {
                copy[key] = isFormer(value.id || value.userId) ? null : prune(value);
            }
            if (Array.isArray(value)) copy[key] = value.map(item => {
                if (typeof item !== 'object' || !item) return isFormer(item) ? null : item;
                if (['tags', 'participants', 'attendees', 'assignees', 'staff', 'users', 'rankings', 'leaderboard'].includes(key) && isFormer(item.id)) return null;
                return prune(item) || (key === 'plans' ? { isRemoved: true, isEmploymentHidden: true } : null);
            }).filter(item => item !== null);
        }
        return copy;
    };
    return rows.map(prune).filter(Boolean);
}

export function formerStaffIds(users) {
    return new Set(users.filter(isFormerStaff).map(user => String(user.id)));
}
