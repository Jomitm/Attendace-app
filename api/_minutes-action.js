const { getDb } = require('./_firebase-admin.js');
const { authenticateRequest, sendAuthError } = require('./_api-auth.js');
const { isFormerStaff, canManageStaff } = require('./_staff-employment-core.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let body;
    try { body = req.body || {}; } catch { return res.status(400).json({ error: 'Invalid request.' }); }
    const { id, action, taskIndex, status, userId } = body;
    if (typeof id !== 'string' || !id || id.includes('/') || !['request-access', 'review-access', 'task-status', 'approve'].includes(action)) return res.status(400).json({ error: 'Invalid minutes action.' });
    const auth = await authenticateRequest(req);
    if (!auth.ok) return sendAuthError(res, auth);
    try {
        const db = getDb();
        const ref = db.collection('minutes').doc(id);
        await db.runTransaction(async tx => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw Object.assign(new Error('Minutes not found.'), { status: 404 });
            const minute = snap.data();
            const actor = auth.user;
            const owner = minute.createdBy === actor.uid;
            const privileged = actor.isAdmin || actor.permissions?.minutes === 'admin';
            if (minute.createdBy) {
                const creator = await tx.get(db.collection('users').doc(minute.createdBy));
                if (creator.exists && isFormerStaff(creator.data()) && !canManageStaff(actor)) throw Object.assign(new Error('Former-staff history requires administrator access.'), { status: 403 });
            }
            const now = new Date().toISOString();
            const next = { ...minute };
            if (action === 'request-access') {
                const requests = Array.isArray(minute.accessRequests) ? minute.accessRequests.slice() : [];
                if (requests.some(item => item.userId === actor.uid)) return;
                if (!requests.some(item => item.userId === actor.uid)) requests.push({ userId: actor.uid, userName: actor.name, status: 'pending', requestedAt: now });
                if (requests.length > 300) throw Object.assign(new Error('Too many outstanding access requests.'), { status: 409 });
                next.accessRequests = requests;
            } else if (action === 'review-access') {
                if (!owner && !privileged) throw Object.assign(new Error('Only the owner or minutes administrator can review access.'), { status: 403 });
                if (!['approved', 'rejected'].includes(status) || typeof userId !== 'string') throw Object.assign(new Error('Invalid access decision.'), { status: 400 });
                next.accessRequests = (minute.accessRequests || []).map(item => item.userId === userId ? { ...item, status } : item);
                if (status === 'approved') next.allowedViewers = [...new Set([...(minute.allowedViewers || []), userId])];
            } else if (action === 'task-status') {
                const task = Number.isInteger(taskIndex) && minute.actionItems?.[taskIndex];
                if (!task || !['pending', 'in-progress', 'in-process', 'not-started', 'completed', 'not-completed', 'blocked'].includes(status)) throw Object.assign(new Error('Invalid action item or status.'), { status: 400 });
                if (!owner && !privileged && task.assignedTo !== actor.uid) throw Object.assign(new Error('Only the assigned staff member can update this action item.'), { status: 403 });
                next.actionItems = minute.actionItems.map((item, index) => index === taskIndex ? { ...item, status, ...(status === 'completed' ? { completedAt: now } : {}) } : item);
            } else {
                if (!owner && !privileged && !(minute.attendeeIds || []).includes(actor.uid)) throw Object.assign(new Error('Only attendees may approve these minutes.'), { status: 403 });
                next.approvals = { ...(minute.approvals || {}), [actor.uid]: now };
                if (minute.approvals?.[actor.uid]) return;
                if (minute.attendeeIds?.length && minute.attendeeIds.every(uid => next.approvals[uid])) next.locked = true;
            }
            next.lastEditedBy = actor.uid;
            next.lastEditedByName = actor.name;
            next.lastEditedAt = now;
            next.auditLog = [...(minute.auditLog || []), { userId: actor.uid, userName: actor.name, timestamp: now, action }];
            tx.set(ref, next);
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Minutes action:', error.code || error.message);
        return res.status(error.status || 503).json({ error: error.status ? error.message : 'Could not save the minutes action. Please retry.' });
    }
};
