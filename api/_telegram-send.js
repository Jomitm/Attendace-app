const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');
const { authenticateRequest, isGlobalAdmin } = require('./_api-auth');

const TELEGRAM_API = 'https://api.telegram.org';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function sendJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
}

async function sendTelegramMessage({ chatId, text }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('Telegram is not configured');
    if (!chatId || !text) throw new Error('Telegram recipient and message are required');
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: String(text).slice(0, 4000),
            parse_mode: 'HTML',
            disable_web_page_preview: true
        })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.description || 'Telegram API error');
    return data;
}

async function acquireDeliveryLock(db, key, event, uid) {
    const ref = db.collection('telegram_delivery_events').doc(key);
    let acquired = false;
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) {
            const data = snap.data() || {};
            if (data.status === 'sent' || Date.now() - Number(data.startedAt || 0) < 120000) return;
        }
        tx.set(ref, { event, uid, status: 'sending', startedAt: Date.now() });
        acquired = true;
    });
    return { ref, acquired };
}

async function resolveNotification(db, actor, body) {
    const uid = actor.uid;
    const targetId = String(body.targetUserId || '').trim();
    const notificationId = String(body.notificationId || '').trim();
    const planId = String(body.planId || '').trim();
    const taskIndex = Number(body.taskIndex);
    if (!targetId || !notificationId || !planId || !Number.isInteger(taskIndex) || taskIndex < 0) return null;

    const [targetSnap, planSnap] = await Promise.all([
        db.collection('users').doc(targetId).get(),
        db.collection('work_plans').doc(planId).get()
    ]);
    if (!targetSnap.exists || !planSnap.exists) return null;
    const target = targetSnap.data() || {};
    const plan = planSnap.data() || {};
    if (!isGlobalAdmin(actor) && String(plan.userId || '') !== uid) return null;
    const task = Array.isArray(plan.plans) ? plan.plans[taskIndex] : null;
    if (!task || !(task.tags || []).some((tag) => String(tag?.id || '') === targetId)) return null;
    const notification = (target.notifications || []).find((row) => String(row?.id || '') === notificationId);
    if (!notification || notification.type !== 'tag' || String(notification.taggedById || '') !== uid) return null;
    if (String(notification.planId || '') !== planId || Number(notification.taskIndex) !== taskIndex) return null;
    const chatId = String(target.telegramChatId || '').trim();
    if (!chatId) return null;
    return {
        chatId,
        key: `task-tag-${notificationId}`,
        text: `📋 <b>${escapeHtml(plan.userName || 'A teammate')}</b> tagged you in: &quot;${escapeHtml(task.task || notification.title || 'Task')}&quot;`
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });

    const auth = await authenticateRequest(req);
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const event = String(body.event || '');
    const db = getDb();
    if (!db) return sendJson(res, 503, { ok: false, error: 'Firebase is not configured' });

    let delivery;
    let destination;
    try {
        if (event === 'check-in' || event === 'check-out') {
            const userSnap = await db.collection('users').doc(auth.user.uid).get();
            if (!userSnap.exists) return sendJson(res, 404, { ok: false, error: 'User not found' });
            const user = userSnap.data() || {};
            const isCheckIn = event === 'check-in';
            const stamp = Number(isCheckIn ? user.lastCheckIn : user.lastCheckOut);
            if (!Number.isFinite(stamp) || stamp <= 0 || (isCheckIn ? user.status !== 'in' : user.status === 'in')) {
                return sendJson(res, 409, { ok: false, error: 'Attendance state does not match this notification' });
            }
            const date = new Date(stamp);
            const localParts = new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
            }).formatToParts(date);
            const localHour = Number(localParts.find((part) => part.type === 'hour')?.value || 0);
            const localMinute = Number(localParts.find((part) => part.type === 'minute')?.value || 0);
            const time = `${String(localHour).padStart(2, '0')}:${String(localMinute).padStart(2, '0')}`;
            const late = isCheckIn && (localHour > 10 || (localHour === 10 && localMinute > 0));
            const label = isCheckIn ? (late ? 'checked in LATE' : 'checked in') : 'checked out';
            delivery = { key: `${event}-${auth.user.uid}-${stamp}`, text: `${isCheckIn ? (late ? '⚠️' : '✅') : '🚪'} <b>${escapeHtml(user.name || user.username || 'Staff')}</b> ${label} at ${time}` };
            destination = process.env.TELEGRAM_CHAT_ID;
        } else if (event === 'leave-update') {
            const leaveId = String(body.leaveId || '').trim();
            if (!leaveId) return sendJson(res, 400, { ok: false, error: 'Missing leaveId' });
            const leaveSnap = await db.collection('leaves').doc(leaveId).get();
            if (!leaveSnap.exists) return sendJson(res, 404, { ok: false, error: 'Leave request not found' });
            const leave = leaveSnap.data() || {};
            const role = String(auth.user.role || '').toLowerCase();
            if (!isGlobalAdmin(auth.user) && role !== 'hr' && role !== 'administrator') return sendJson(res, 403, { ok: false, error: 'Not authorized' });
            if (!['Approved', 'Rejected'].includes(String(leave.status || '')) || String(leave.actionBy || '') !== auth.user.uid) {
                return sendJson(res, 409, { ok: false, error: 'Leave decision does not match this notification' });
            }
            const userSnap = await db.collection('users').doc(String(leave.userId || '')).get();
            const name = userSnap.exists ? (userSnap.data()?.name || leave.userName || 'Staff') : (leave.userName || 'Staff');
            const status = String(leave.status).toLowerCase();
            delivery = { key: `leave-${leaveId}-${status}-${String(leave.actionDate || '')}`, text: `${status === 'approved' ? '✅' : '❌'} Leave ${status} for <b>${escapeHtml(name)}</b>` };
            destination = process.env.TELEGRAM_CHAT_ID;
        } else if (event === 'task-tagged') {
            delivery = await resolveNotification(db, auth.user, body);
            if (!delivery) return sendJson(res, 403, { ok: false, error: 'Task notification is not authorized or has no Telegram recipient' });
            destination = delivery.chatId;
        } else {
            return sendJson(res, 400, { ok: false, error: 'Unsupported notification event' });
        }

        if (!destination) return sendJson(res, 503, { ok: false, error: 'Telegram recipient is not configured' });
        const key = crypto.createHash('sha256').update(delivery.key).digest('hex');
        const lock = await acquireDeliveryLock(db, key, event, auth.user.uid);
        if (!lock.acquired) return sendJson(res, 200, { ok: true, duplicate: true });
        try {
            await sendTelegramMessage({ chatId: destination, text: delivery.text });
            await lock.ref.set({ status: 'sent', sentAt: Date.now() }, { merge: true });
        } catch (error) {
            await lock.ref.delete().catch(() => {});
            throw error;
        }
        return sendJson(res, 200, { ok: true });
    } catch (error) {
        console.warn('Telegram notification failed:', error?.message || error);
        return sendJson(res, 502, { ok: false, error: 'Telegram notification could not be delivered' });
    }
};

module.exports.sendTelegramMessage = sendTelegramMessage;
