const { getDb } = require('./_firebase-admin.js');
const { authenticateRequest, sendAuthError } = require('./_api-auth.js');
const { isFormerStaff } = require('./_staff-employment-core.js');
const { createHash } = require('crypto');

async function delegateTask(db, actor, body) {
    const { planId, taskIndex, targetUserId } = body;
    if (typeof planId !== 'string' || !planId || planId.includes('/') || !Number.isInteger(taskIndex) || typeof targetUserId !== 'string' || !targetUserId || targetUserId.includes('/')) throw Object.assign(new Error('Invalid delegation.'), { status: 400 });
    await db.runTransaction(async tx => {
        const sourceRef = db.collection('work_plans').doc(planId);
        const source = await tx.get(sourceRef);
        const targetRef = db.collection('users').doc(targetUserId);
        const target = await tx.get(targetRef);
        if (!source.exists || !source.data().plans?.[taskIndex]) throw Object.assign(new Error('Source task not found.'), { status: 404 });
        const plan = source.data();
        const ownerId = plan.userId === 'annual_shared' ? plan.createdById : plan.userId || plan.createdById;
        const owner = ownerId && await tx.get(db.collection('users').doc(ownerId));
        if ((!owner?.exists || isFormerStaff(owner.data())) && !actor.isAdmin && actor.permissions?.users !== 'admin') throw Object.assign(new Error('Former-staff history requires administrator access.'), { status: 403 });
        if (!actor.isAdmin && plan.userId !== actor.uid && plan.createdById !== actor.uid) throw Object.assign(new Error('Only the owner or administrator may delegate this task.'), { status: 403 });
        if (!target.exists || isFormerStaff(target.data())) throw Object.assign(new Error('Choose an active staff member.'), { status: 409 });
        let task = plan.plans[taskIndex];
        if (task.isPrivate) {
            if (plan.userId !== actor.uid) throw Object.assign(new Error('Only the private-task owner may share this task.'), { status: 403 });
            const privateSnap = task.privateTaskId && await tx.get(db.collection('private_work_plan_tasks').doc(task.privateTaskId));
            if (privateSnap?.exists) {
                if (privateSnap.data().ownerId !== actor.uid || privateSnap.data().planId !== planId) throw Object.assign(new Error('This private-task reference does not belong to your plan.'), { status: 403 });
                task = { ...privateSnap.data().task, privateTaskId: task.privateTaskId, isPrivate: true };
            }
            if (!task.task) throw Object.assign(new Error('Private task details are unavailable.'), { status: 409 });
        }
        const date = /^\d{4}-\d{2}-\d{2}$/.test(plan.date || '') ? plan.date : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const recipientPlanRef = db.collection('work_plans').doc(`plan_${targetUserId}_${date}`);
        const recipientPlan = await tx.get(recipientPlanRef);
        const destination = recipientPlan.exists ? recipientPlan.data() : { id: recipientPlanRef.id, userId: targetUserId, createdById: targetUserId, userName: target.data().name || '', date, plans: [] };
        const tasks = (destination.plans || []).slice();
        const now = new Date().toISOString();
        if (!tasks.some(item => item.sourcePlanId === planId && item.sourceTaskIndex === taskIndex && item.addedFrom === 'delegated')) {
            const copy = { ...task, task: task.task || '', status: 'pending', addedFrom: 'delegated', sourcePlanId: planId, sourceTaskIndex: taskIndex,
                assignedTo: targetUserId, assignedToName: target.data().name || '', taggedById: actor.uid, taggedByName: actor.name, tags: [] };
            delete copy.privateTaskId;
            if (task.isPrivate) {
                const key = `delegated_${createHash('sha256').update(`${planId}:${taskIndex}:${targetUserId}`).digest('hex')}`;
                tx.set(db.collection('private_work_plan_tasks').doc(key), { id: key, ownerId: targetUserId, createdById: actor.uid, assignedTo: targetUserId, planId: recipientPlanRef.id, taskIndex: tasks.length, task: copy });
                tasks.push({ id: key, privateTaskId: key, isPrivate: true, assignedTo: targetUserId, sourcePlanId: planId, sourceTaskIndex: taskIndex, addedFrom: 'delegated' });
            } else tasks.push(copy);
        }
        const sourceTasks = plan.plans.slice();
        sourceTasks[taskIndex] = { ...sourceTasks[taskIndex], tags: [...(sourceTasks[taskIndex].tags || []).filter(tag => tag.id !== targetUserId), { id: targetUserId, name: target.data().name || '', status: 'pending' }] };
        tx.set(sourceRef, { ...plan, plans: sourceTasks, updatedAt: now });
        tx.set(recipientPlanRef, { ...destination, plans: tasks, updatedAt: now });
        const notificationId = `delegate_${createHash('sha256').update(`${planId}:${taskIndex}:${targetUserId}`).digest('hex').slice(0, 24)}`;
        tx.update(targetRef, { notifications: [{ id: notificationId, type: 'task', title: task.task || 'Delegated task', taggedById: actor.uid, taggedByName: actor.name, status: 'pending', source: 'delegation', date: now, read: false }, ...(target.data().notifications || []).filter(item => item.id !== notificationId)] });
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let body;
    try { body = req.body || {}; } catch { return res.status(400).json({ error: 'Invalid request.' }); }
    const { messageId, response, reason = '' } = body;
    if (body.action !== 'delegate' && (typeof messageId !== 'string' || !messageId || messageId.includes('/') || !['approved', 'rejected'].includes(response) || typeof reason !== 'string' || reason.length > 1000)) return res.status(400).json({ error: 'Invalid task response.' });
    const auth = await authenticateRequest(req);
    if (!auth.ok) return sendAuthError(res, auth);
    try {
        const db = getDb();
        if (body.action === 'delegate') {
            await delegateTask(db, auth.user, body);
            return res.status(200).json({ success: true });
        }
        await db.runTransaction(async tx => {
            const ref = db.collection('staff_messages').doc(messageId);
            const snap = await tx.get(ref);
            const message = snap.exists ? snap.data() : null;
            if (!message || message.type !== 'task') throw Object.assign(new Error('Task message not found.'), { status: 404 });
            if (message.toId !== auth.user.uid) throw Object.assign(new Error('Only the recipient can respond to this task.'), { status: 403 });
            const senderRef = db.collection('users').doc(message.fromId);
            const sender = await tx.get(senderRef);
            if (!sender.exists || isFormerStaff(sender.data())) throw Object.assign(new Error('This sender is no longer active. Ask an administrator to reassign the work.'), { status: 409 });
            if (message.status === response) return;
            if (message.status && message.status !== 'pending') throw Object.assign(new Error('This task has already received a response.'), { status: 409 });
            const date = /^\d{4}-\d{2}-\d{2}$/.test(message.dueDate || '') ? message.dueDate : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            const plans = [];
            if (response === 'approved') {
                for (const uid of [...new Set([message.toId, message.fromId])]) {
                    const planRef = db.collection('work_plans').doc(`plan_${uid}_${date}`);
                    const existing = await tx.get(planRef);
                    plans.push({ uid, ref: planRef, plan: existing.exists ? existing.data() : { id: planRef.id, userId: uid, createdById: uid, date, plans: [] } });
                }
            }
            const now = new Date().toISOString();
            for (const item of plans) {
                const index = item.uid === message.toId ? 0 : 1;
                const tasks = (item.plan.plans || []).slice();
                if (!tasks.some(task => task.sourcePlanId === messageId && task.sourceTaskIndex === index && task.addedFrom === 'staff')) {
                    tasks.push({ task: `${message.title}${message.description ? ` - ${message.description}` : ''}`, status: 'pending', addedFrom: 'staff', sourcePlanId: messageId, sourceTaskIndex: index, assignedTo: message.toId,
                        assignedToName: message.toName || auth.user.name, taggedById: message.fromId, taggedByName: message.fromName || sender.data().name || '', startDate: date, endDate: date, budgetHeadId: 'UNALLOCATED', subPlans: [], tags: [] });
                }
                tx.set(item.ref, { ...item.plan, plans: tasks, updatedAt: now });
            }
            tx.update(ref, { status: response, respondedAt: now, rejectReason: reason, calendarSynced: response === 'approved',
                history: [{ action: response, byId: auth.user.uid, byName: auth.user.name, at: now, reason }, ...(message.history || [])] });
            tx.update(senderRef, { notifications: [{ id: `taskresp_${messageId}`, type: 'task_response', title: message.title || '', message: `${auth.user.name} ${response} a task.`, taggedByName: auth.user.name, status: response, reason, date: now, read: false }, ...(sender.data().notifications || [])] });
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Staff task response:', error.code || error.message);
        return res.status(error.status || 503).json({ error: error.status ? error.message : 'Could not save the task response. Please retry.' });
    }
};
