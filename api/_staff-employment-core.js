// Keep this small server predicate in parity with the browser helper (tested).
function isFormerStaff(user) {
    return !!user && (['former', 'resigned', 'retired', 'inactive'].includes(String(user.employmentStatus || '').toLowerCase()) || user.status === 'inactive');
}
function canManageStaff(user) {
    return !!user && !isFormerStaff(user) && (user.isAdmin === true || user.permissions?.users === 'admin');
}
function validateEmploymentChange(body, today) {
    const { userId, action, lastWorkingDate, reason, note = '' } = body || {};
    if (typeof userId !== 'string' || !userId.trim() || userId.includes('/') || !['archive', 'restore'].includes(action)) throw new Error('Choose a staff member and a valid action.');
    if (action === 'archive') {
        const parsed = new Date(`${lastWorkingDate}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(lastWorkingDate || '') || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== lastWorkingDate || lastWorkingDate > today) throw new Error('Enter a valid last working date, today or earlier.');
        if (!['Resigned', 'Retired', 'Contract ended', 'Other'].includes(reason)) throw new Error('Choose a reason for leaving.');
    }
    if (typeof note !== 'string' || note.length > 1000) throw new Error('Admin note must be at most 1,000 characters.');
    return { userId: userId.trim(), action, lastWorkingDate: lastWorkingDate || null, reason: reason || '', note: note.trim() };
}
module.exports = { isFormerStaff, canManageStaff, validateEmploymentChange };
