const { authenticateRequest, sendAuthError } = require('./_api-auth.js');
const { getDb } = require('./_firebase-admin.js');
const { isFormerStaff } = require('./_staff-employment-core.js');

// No browser Firestore access: the collection remains default-denied by firestore.rules.
async function handler(req, res, { programmeRules } = {}) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    const auth = await authenticateRequest(req);
    if (!auth.ok) return sendAuthError(res, auth);
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Programme service is unavailable.' });
    const { canManageProgrammes, canCreateProgramme, canEditProgramme, canViewProgramme, validateProgramme, validProgrammeDate, programmeToday, addProgrammeDays, sortProgrammes } = programmeRules || await import('../js/utils/programmes.js');
    const body = req.body || {}, actor = auth.user, manager = canManageProgrammes(actor);
    const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);
    try {
        if (body.action === 'list') {
            const from = body.from || programmeToday();
            if (!validProgrammeDate(from)) return res.status(400).json({ error: 'Choose a valid start date.' });
            const to = body.to || addProgrammeDays(from, 366);
            if (!validProgrammeDate(from) || !validProgrammeDate(to) || from > to || to > addProgrammeDays(from, 400)) return res.status(400).json({ error: 'Choose a date range of up to 400 days.' });
            const snapshot = await db.collection('programmes').where('endDate', '>=', from).where('endDate', '<=', addProgrammeDays(to, 366)).limit(1001).get();
            if (snapshot.docs.length > 1000) return res.status(409).json({ error: 'Too many programmes. Please contact the administrator.' });
            const rows = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(row => row.startDate <= to && canViewProgramme(row, actor)
                && (row.status !== 'cancelled' || manager && body.includeCancelled === true));
            return res.status(200).json({ data: sortProgrammes(rows), canManage: manager });
        }
        if (body.action === 'get') {
            if (!validId(body.id)) return res.status(400).json({ error: 'Invalid programme.' });
            const snap = await db.collection('programmes').doc(body.id).get();
            if (!snap.exists || !canViewProgramme(snap.data(), actor)) return res.status(404).json({ error: 'Programme not found or access changed.' });
            return res.status(200).json({ data: { ...snap.data(), id: snap.id }, canManage: manager });
        }
        if (!canCreateProgramme(actor)) return res.status(403).json({ error: 'Sign in to add a programme.' });
        if (!['save', 'cancel'].includes(body.action) || !validId(body.id)) return res.status(400).json({ error: 'Invalid programme action.' });
        const data = body.action === 'save' ? validateProgramme(body.data) : null;
        if (data) {
            for (const id of new Set([data.coordinatorId, ...data.participantIds])) {
                const user = await db.collection('users').doc(id).get();
                if (!user.exists || isFormerStaff(user.data())) return res.status(400).json({ error: 'Choose active staff as coordinator and participants.' });
            }
        }
        const ref = db.collection('programmes').doc(body.id);
        const saved = await db.runTransaction(async tx => {
            const existing = await tx.get(ref), previous = existing.exists ? existing.data() : null;
            if (previous && !canEditProgramme(previous, actor)) throw Object.assign(new Error('Only the creator or an administrator can change this programme.'), { status: 403 });
            if (body.action === 'cancel' && !previous) throw Object.assign(new Error('Programme not found.'), { status: 404 });
            if ((previous?.updatedAt || null) !== (body.expectedUpdatedAt || null)) throw Object.assign(new Error('This programme changed. Reopen it before saving.'), { status: 409 });
            if (previous?.status === 'cancelled' && body.action === 'save') throw Object.assign(new Error('Cancelled programmes cannot be edited. Create a new programme.'), { status: 409 });
            const now = new Date().toISOString();
            const next = { ...(previous || {}), ...(data || {}), id: ref.id,
                status: body.action === 'cancel' ? 'cancelled' : 'scheduled',
                createdById: previous?.createdById || actor.uid, createdAt: previous?.createdAt || now,
                updatedById: actor.uid, updatedAt: now };
            tx.set(ref, next);
            return next;
        });
        return res.status(200).json({ data: saved });
    } catch (error) {
        console.error('Programme request failed:', error.message);
        return res.status(error.status || 500).json({ error: error.status ? error.message : 'Could not load or save programmes. Please try again.' });
    }
}
module.exports = handler;
