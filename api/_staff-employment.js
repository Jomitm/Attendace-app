const { randomUUID } = require('crypto');
const { getDb } = require('./_firebase-admin.js');
const { authenticateRequest, sendAuthError } = require('./_api-auth.js');
const { isFormerStaff, canManageStaff, validateEmploymentChange } = require('./_staff-employment-core.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let change;
    try {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        change = validateEmploymentChange(req.body, today);
    } catch (error) { return res.status(400).json({ error: error.message }); }
    const auth = await authenticateRequest(req);
    if (!auth.ok) return sendAuthError(res, auth);
    const db = getDb();
    const { userId, action } = change;
    if (auth.user.uid === userId) return res.status(403).json({ error: 'You cannot change your own employment status.' });
    try {
        const targetRef = db.collection('users').doc(userId);
        const employmentRef = db.collection('staff_employment').doc(userId);
        let authUser = null;
        try { authUser = await auth.admin.auth().getUser(userId); }
        catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
        const eventId = randomUUID();
        const changedAt = Date.now();
        await db.runTransaction(async tx => {
            const actorSnap = await tx.get(db.collection('users').doc(auth.user.uid));
            const target = await tx.get(targetRef);
            const previous = await tx.get(employmentRef);
            const actor = actorSnap.data();
            if (!actorSnap.exists || !canManageStaff(actor)) throw Object.assign(new Error('Staff management permission is required.'), { status: 403 });
            if (!target.exists) throw Object.assign(new Error('Staff member not found.'), { status: 404 });
            const user = target.data();
            if (user.isAdmin && !actor.isAdmin) throw Object.assign(new Error('Only a full administrator can change another administrator.'), { status: 403 });
            if (action === 'archive' && user.isAdmin) {
                const admins = await tx.get(db.collection('users').where('isAdmin', '==', true));
                if (!admins.docs.some(doc => doc.id !== userId && !isFormerStaff(doc.data()))) throw Object.assign(new Error('Keep at least one active administrator.'), { status: 409 });
            }
            const old = previous.exists ? previous.data() : {};
            tx.update(targetRef, {
                employmentStatus: action === 'archive' ? 'former' : 'active',
                employmentEndedAt: action === 'archive' ? change.lastWorkingDate : null,
                employmentChangedAt: changedAt,
                activeSessions: [], activeSessionToken: null, activeSessionStartedAt: null,
                status: 'out'
            });
            tx.set(employmentRef, {
                ...old, id: userId, ...change, changedAt, changedBy: auth.user.uid,
                history: [...(old.history || []).slice(-99), { ...change, changedAt, changedBy: auth.user.uid }],
                authWasDisabled: action === 'archive' && !isFormerStaff(user) ? authUser?.disabled === true : old.authWasDisabled === true
            });
            tx.set(db.collection('staff_directory_state').doc('current'), { changedAt, changeId: eventId });
            tx.set(db.collection('system_audit_logs').doc(eventId), {
                id: eventId, type: 'staff-employment', userId, staffName: user.name || '', action,
                lastWorkingDate: change.lastWorkingDate, reason: change.reason, note: change.note,
                createdAt: changedAt, actorId: auth.user.uid, actorName: actor.name || ''
            });
        });
        let warning = '';
        if (authUser) {
            try {
                const saved = await employmentRef.get();
                await auth.admin.auth().updateUser(userId, { disabled: saved.data()?.action === 'archive' || saved.data()?.authWasDisabled === true });
                await auth.admin.auth().revokeRefreshTokens(userId);
            } catch (error) {
                console.error('Employment saved; Firebase account synchronization needs retry:', error.code || error.message);
                warning = 'Employment status was saved. Account synchronization needs a retry; the employment check still blocks former staff from signing in.';
            }
        }
        return res.status(200).json({ success: true, employmentStatus: action === 'archive' ? 'former' : 'active', warning });
    } catch (error) {
        console.error('staff-employment:', error.code || error.message);
        return res.status(error.status || 500).json({ error: error.status ? error.message : 'Could not update employment status. Please try again.' });
    }
};
