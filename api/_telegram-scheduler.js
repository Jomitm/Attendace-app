const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');
const { OAuth2Client } = require('google-auth-library');

const TELEGRAM_API = 'https://api.telegram.org';
const CLOUD_SCHEDULER_OIDC_AUDIENCE = 'https://staff.crwi.org.in/api/telegram-scheduler';
const CLOUD_SCHEDULER_TASK_JOBS = Object.freeze({
    forgot_checkin: 'crwi-forgot-checkin-0915',
    forgot_checkout: 'crwi-forgot-checkout-1800',
    forgot_checkout_followup: 'crwi-forgot-checkout-followup-2000'
});
const schedulerOAuthClient = new OAuth2Client();

// Vercel sends "Authorization: Bearer <CRON_SECRET>" on scheduled invocations.
function cronSecretIsValid(req) {
    const expected = process.env.CRON_SECRET;
    if (!expected) return false;
    const header = String(req.headers?.authorization || '');
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return false;
    const a = Buffer.from(match[1]);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function cloudSchedulerRequestIsValid(req, task) {
    const expectedEmail = String(process.env.CLOUD_SCHEDULER_SERVICE_ACCOUNT_EMAIL || '').trim().toLowerCase();
    const expectedJob = CLOUD_SCHEDULER_TASK_JOBS[task];
    if (!expectedEmail || !expectedJob) return false;

    const authorization = String(req.headers?.authorization || '');
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return false;

    const jobName = String(req.headers?.['x-cloudscheduler-jobname'] || '').split('/').pop();
    if (jobName !== expectedJob) return false;

    try {
        const ticket = await schedulerOAuthClient.verifyIdToken({
            idToken: match[1],
            audience: CLOUD_SCHEDULER_OIDC_AUDIENCE
        });
        const payload = ticket.getPayload();
        return payload?.email_verified === true
            && String(payload.email || '').trim().toLowerCase() === expectedEmail;
    } catch (error) {
        console.warn('Cloud Scheduler OIDC verification failed:', error?.message || error);
        return false;
    }
}

async function sendMessage(token, chatId, text) {
    const resp = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text.slice(0, 4000),
            parse_mode: 'HTML',
            disable_web_page_preview: true
        })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) throw new Error(data.description || `Telegram returned HTTP ${resp.status}`);
    return data;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isStaffAccount(user) {
    return user.status !== 'archived' && user.isAdmin !== true && user.role !== 'Administrator';
}

function isReportAdmin(user) {
    return user.isAdmin === true || user.role === 'Administrator' || user.permissions?.reports === 'admin';
}

function getLocalISO(offsetHours = 5.5) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utc + offsetHours * 3600000);
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
}

async function getLinkedUsers(db) {
    const snap = await db.collection('users')
        .where('telegramChatId', '!=', '')
        .get();

    const users = [];
    snap.forEach(doc => {
        const data = doc.data();
        if (data.telegramChatId && isStaffAccount(data)) {
            users.push({ id: doc.id, ...data });
        }
    });
    return users;
}

async function getReportChatIds(db) {
    const recipients = new Set();
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach(doc => {
        const user = doc.data() || {};
        if (isReportAdmin(user) && user.telegramChatId) recipients.add(String(user.telegramChatId).trim());
    });
    const groupChatId = String(process.env.TELEGRAM_CHAT_ID || '').trim();
    if (groupChatId) recipients.add(groupChatId);
    recipients.delete('');
    return [...recipients];
}

async function sendReport(token, chatIds, text) {
    let sent = 0;
    let failed = 0;
    for (const chatId of chatIds) {
        try {
            await sendMessage(token, chatId, text);
            sent++;
        } catch (error) {
            failed++;
            console.warn('Telegram admin report delivery failed:', error?.message || error);
        }
    }
    return { sent, failed };
}

// ── Daily Standup (6 PM IST) ──────────────────────────────────────────
async function dailyStandup(db, token) {
    const users = await getLinkedUsers(db);
    const today = getLocalISO();

    let sent = 0;
    for (const user of users) {
        // Check if standup already submitted
        const standupId = `standup_${user.id}_${today}`;
        const existing = await db.collection('daily_standups').doc(standupId).get();
        if (existing.exists) continue;

        await sendMessage(token, user.telegramChatId,
            `📝 <b>Daily Standup</b>\n\n` +
            `Hi ${escapeHtml(user.name || 'there')}! What did you accomplish today?\n\n` +
            `Just type your update and send it to me.\n` +
            `Examples:\n` +
            `• Completed the API integration\n` +
            `• Fixed 3 bugs, reviewed 2 PRs\n` +
            `• Same as yesterday, no blockers`
        );
        sent++;
    }
    return { standup: true, sent };
}

// ── Absentee Alert (11 AM IST) ────────────────────────────────────────
async function absenteeAlert(db, token) {
    const reportChatIds = await getReportChatIds(db);
    if (!reportChatIds.length) return { absentee: false, reason: 'no linked report admin or group recipient' };

    const today = getLocalISO();

    // Read all profiles so staff records without an explicit role are included.
    const usersSnap = await db.collection('users').get();
    const allStaff = usersSnap.docs.filter(doc => isStaffAccount(doc.data()));

    // Check today's attendance logs
    const attendanceSnap = await db.collection('attendance')
        .where('date', '==', today)
        .get();

    const checkedIn = new Set();
    attendanceSnap.forEach(doc => {
        const log = doc.data();
        if (log.checkIn || Number(log.checkInAt) > 0) checkedIn.add(String(log.user_id || ''));
    });
    allStaff.forEach(doc => {
        const user = doc.data();
        if (user.status === 'in' && getLocalISOFromEpoch(user.lastCheckIn) === today) checkedIn.add(doc.id);
    });

    // Find users who haven't checked in today
    const actuallyAbsent = [];
    allStaff.forEach(doc => {
        if (!checkedIn.has(doc.id)) actuallyAbsent.push(doc.data().name || doc.id);
    });

    if (actuallyAbsent.length === 0) {
        const msg = `✅ <b>Attendance check — ${today}</b>\n\nAll ${allStaff.length} active staff have checked in.`;
        const delivery = await sendReport(token, reportChatIds, msg);
        return { absent: 0, total: allStaff.length, message: 'All staff checked in', ...delivery };
    }

    const msg = `🔔 <b>Absentee Alert — ${today}</b>\n\n` +
        `<b>${actuallyAbsent.length} staff</b> haven't checked in yet:\n` +
        actuallyAbsent.map(n => `• ${escapeHtml(n)}`).join('\n') +
        `\n\n⏰ Current time: ${new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date())}`;

    const delivery = await sendReport(token, reportChatIds, msg);
    return { absent: actuallyAbsent.length, names: actuallyAbsent, ...delivery };
}

// ── Weekly Leaderboard (Monday 9 AM IST) ─────────────────────────────
async function weeklyLeaderboard(db, token) {
    const reportChatIds = await getReportChatIds(db);
    if (!reportChatIds.length) return { leaderboard: false, reason: 'no linked report admin or group recipient' };

    // Calculate last week's date range
    const now = new Date();
    const localNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
    const daysSinceMonday = (localNow.getDay() + 6) % 7;
    const lastMonday = new Date(localNow);
    lastMonday.setDate(localNow.getDate() - daysSinceMonday - 7);
    const lastSunday = new Date(localNow);
    lastSunday.setDate(localNow.getDate() - daysSinceMonday - 1);

    const startDate = `${lastMonday.getFullYear()}-${String(lastMonday.getMonth() + 1).padStart(2, '0')}-${String(lastMonday.getDate()).padStart(2, '0')}`;
    const endDate = `${lastSunday.getFullYear()}-${String(lastSunday.getMonth() + 1).padStart(2, '0')}-${String(lastSunday.getDate()).padStart(2, '0')}`;

    // Get all attendance logs for last week
    const logsSnap = await db.collection('attendance')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();

    const stats = {};
    logsSnap.forEach(doc => {
        const log = doc.data();
        const uid = log.user_id;
        if (!stats[uid]) {
            stats[uid] = { name: uid, days: 0, totalMs: 0, late: 0, fullDays: 0 };
        }
        stats[uid].days++;
        stats[uid].totalMs += Number(log.durationMs) || 0;
        if (log.lateCountable) stats[uid].late++;
        if (log.type === 'Full Day') stats[uid].fullDays++;
    });

    // Resolve user names
    const userIds = Object.keys(stats);
    for (const uid of userIds) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            stats[uid].name = userDoc.data().name || uid;
        }
    }

    const entries = Object.values(stats).sort((a, b) => b.totalMs - a.totalMs);

    if (entries.length === 0) {
        const delivery = await sendReport(token, reportChatIds, `🏆 <b>Weekly attendance report</b>\n📅 ${startDate} → ${endDate}\n\nNo attendance records were found.`);
        return { leaderboard: true, count: 0, ...delivery };
    }

    const medals = ['🥇', '🥈', '🥉'];
    let msg = `🏆 <b>Weekly Leaderboard</b>\n`;
    msg += `📅 ${startDate} → ${endDate}\n\n`;

    entries.forEach((entry, i) => {
        const medal = medals[i] || '  ';
        const hours = (entry.totalMs / 3600000).toFixed(1);
        const avgPerDay = entry.days > 0 ? (entry.totalMs / entry.days / 3600000).toFixed(1) : '0';
        msg += `${medal} <b>${escapeHtml(entry.name)}</b>\n`;
        msg += `   📊 ${entry.fullDays} full days | ⏱️ ${hours}h total | ⏰ ${avgPerDay}h avg/day\n`;
        if (entry.late > 0) msg += `   ⚠️ ${entry.late} late\n`;
        msg += `\n`;
    });

    const totalHours = entries.reduce((s, e) => s + e.totalMs, 0) / 3600000;
    msg += `📈 Team total: ${totalHours.toFixed(0)}h | ${entries.length} members active`;

    const delivery = await sendReport(token, reportChatIds, msg);
    return { leaderboard: true, count: entries.length, totalHours, ...delivery };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Personal Work Plan (8 AM IST) ────────────────────────────────────
async function personalWorkPlanDigest(db, token) {
    const users = await getLinkedUsers(db);
    if (!users.length) return { personalWorkPlan: true, sent: 0, reason: 'no linked users' };
    const today = getLocalISO();
    // Fetch all work_plans for today in one query to save reads
    let plansByUser = {};
    try {
        const plansSnap = await db.collection('work_plans').where('date', '==', today).get();
        plansSnap.forEach(doc => {
            const data = doc.data();
            const uid = data.userId || data.ownerUserId || '';
            if (!uid) return;
            if (!plansByUser[uid]) plansByUser[uid] = [];
            const tasks = Array.isArray(data.plans) ? data.plans : (data.plan ? [data.plan] : []);
            plansByUser[uid] = plansByUser[uid].concat(tasks);
        });
    } catch {}
    let sent = 0;
    for (const user of users) {
        const tasks = (plansByUser[user.id] || []).filter(t => !t.isRemoved);
        let msg;
        if (!tasks.length) {
            msg = `☀️ Good morning ${escapeHtml(user.name || 'there')}!\n\n` +
                  `📅 ${today} — <b>YOU HAVE NO TASK TODAY</b>\n\n` +
                  `Enjoy your day or check with your manager for new work.`;
        } else {
            const total = tasks.length;
            const pending = tasks.filter(t => !['completed', 'not-completed', 'cancelled'].includes(String(t.status))).length;
            const completed = tasks.filter(t => String(t.status) === 'completed').length;
            msg = `☀️ Good morning ${escapeHtml(user.name || 'there')}!\n\n` +
                  `📋 <b>Your work plan for ${today}</b> — ${total} tasks (${pending} pending, ${completed} completed)\n\n` +
                  tasks.slice(0, 10).map((t, i) => {
                      const tt = t.task || t.title || t.description || 'Untitled task';
                      const st = String(t.status || 'pending');
                      return `${i + 1}. ${escapeHtml(tt)} — <i>${escapeHtml(st)}</i>`;
                  }).join('\n') +
                  (total > 10 ? `\n…and ${total - 10} more` : '') +
                  `\n\nHave a productive day!`;
        }
        await sendMessage(token, user.telegramChatId, msg);
        sent++;
        if (sent % 10 === 0) await sleep(300);
        else await sleep(120);
    }
    return { personalWorkPlan: true, sent };
}

// ── Forgot Check-in (9:15 AM IST) ───────────────────────────────────
async function forgotCheckInDigest(db, token) {
    const users = await getLinkedUsers(db);
    const today = getLocalISO();
    const attendanceSnap = await db.collection('attendance').where('date', '==', today).get();
    const checkedInToday = new Set();
    attendanceSnap.forEach(doc => {
        const log = doc.data() || {};
        if (log.checkIn || Number(log.checkInAt) > 0) checkedInToday.add(String(log.user_id || ''));
    });
    let sent = 0;
    let failed = 0;
    for (const user of users) {
        const lastIn = user.lastCheckIn ? getLocalISOFromEpoch(user.lastCheckIn) : '';
        if (checkedInToday.has(user.id) || (user.status === 'in' && lastIn === today)) continue;
        const msg = `⏰ <b>Reminder — you forgot to check in</b>\n\n` +
                    `Hi ${escapeHtml(user.name || 'there')}, you have not checked in yet today (${today}).\n` +
                    `Please open the app and check in as soon as possible.`;
        try {
            await sendMessage(token, user.telegramChatId, msg);
            sent++;
        } catch (error) {
            failed++;
            console.warn('Telegram check-in reminder failed:', error?.message || error);
        }
        await sleep(120);
    }
    return { forgotCheckIn: true, sent, failed };
}

function getLocalISOFromEpoch(epochMs) {
    const d = new Date(Number(epochMs));
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const local = new Date(utc + 5.5 * 3600000);
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
}

// ── Forgot Check-out (6 PM IST) ─────────────────────────────────────
async function forgotCheckOutDigest(db, token) {
    const users = await getLinkedUsers(db);
    const today = getLocalISO();
    let sent = 0;
    let failed = 0;
    for (const user of users) {
        const lastIn = user.lastCheckIn ? getLocalISOFromEpoch(user.lastCheckIn) : '';
        const isStillIn = user.status === 'in' && lastIn === today;
        if (!isStillIn) continue;
        const msg = `🔔 <b>Reminder — you forgot to check out</b>\n\n` +
                    `Hi ${escapeHtml(user.name || 'there')}, you are still checked in since today.\n` +
                    `Please check out before you leave. If you already left, open the app and check out now.`;
        try {
            await sendMessage(token, user.telegramChatId, msg);
            sent++;
        } catch (error) {
            failed++;
            console.warn('Telegram check-out reminder failed:', error?.message || error);
        }
        await sleep(120);
    }
    return { forgotCheckOut: true, sent, failed };
}

// ── Forgot Check-out follow-up (8 PM IST) ────────────────────────────
async function forgotCheckOutFollowUp(db, token) {
    const users = await getLinkedUsers(db);
    const today = getLocalISO();
    let sent = 0;
    let failed = 0;
    for (const user of users) {
        const lastIn = user.lastCheckIn ? getLocalISOFromEpoch(user.lastCheckIn) : '';
        if (user.status !== 'in' || lastIn !== today) continue;
        const msg = `🚨 <b>Final check-out reminder</b>\n\n` +
            `Hi ${escapeHtml(user.name || 'there')}, your attendance still shows you checked in. ` +
            `Please check out now if you have finished work.`;
        try {
            await sendMessage(token, user.telegramChatId, msg);
            sent++;
        } catch (error) {
            failed++;
            console.warn('Telegram 8 PM check-out reminder failed:', error?.message || error);
        }
        await sleep(120);
    }
    return { forgotCheckOutFollowUp: true, sent, failed };
}

// ── Team Digests (10 AM signed-in, 6 PM signed-out) ──────────────────
async function teamDigest(db, token, slot) {
    const today = getLocalISO();
    const usersSnap = await db.collection('users').get();
    const allStaff = [];
    const reportRecipients = new Map();
    usersSnap.forEach(doc => {
        const u = doc.data();
        if (isStaffAccount(u)) allStaff.push({ id: doc.id, ...u });
        if (isReportAdmin(u) && u.telegramChatId) reportRecipients.set(String(u.telegramChatId), 'admin');
    });
    const groupChatId = String(process.env.TELEGRAM_CHAT_ID || '').trim();
    if (groupChatId) reportRecipients.set(groupChatId, 'group');
    if (!reportRecipients.size) return { teamDigest: false, reason: 'no linked report admin or group recipient' };

    const attendanceSnap = await db.collection('attendance').where('date', '==', today).get();
    const checkedInTodayIds = new Set();
    const checkedOutTodayIds = new Set();
    attendanceSnap.forEach(doc => {
        const row = doc.data() || {};
        const uid = String(row.user_id || '');
        if (!uid) return;
        if (row.checkIn || Number(row.checkInAt) > 0) checkedInTodayIds.add(uid);
        if ((row.checkOut && row.checkOut !== 'Active Now') || Number(row.checkOutAt) > 0) checkedOutTodayIds.add(uid);
    });
    const isStillIn = (u) => u.status === 'in' && getLocalISOFromEpoch(u.lastCheckIn) === today;
    const checkedIn = allStaff.filter(u => checkedInTodayIds.has(u.id) || isStillIn(u));
    const notCheckedIn = allStaff.filter(u => !checkedInTodayIds.has(u.id) && !isStillIn(u));
    const stillIn = allStaff.filter(isStillIn);
    const stillInIds = new Set(stillIn.map(u => u.id));
    const signedOut = allStaff.filter(u =>
        (checkedInTodayIds.has(u.id) || isStillIn(u)) &&
        !stillInIds.has(u.id) &&
        (checkedOutTodayIds.has(u.id) || getLocalISOFromEpoch(u.lastCheckOut) === today)
    );
    let msg;
    if (slot === '10am') {
        msg = `📋 <b>Team Check-in — ${today} 10am</b>\n\n` +
              `✅ Checked in: <b>${checkedIn.length}</b> / ${allStaff.length}\n` +
              (checkedIn.slice(0, 15).map(u => `• ${escapeHtml(u.name || u.id)}`).join('\n') || '• —') + `\n\n` +
              `⏰ Not yet in: <b>${notCheckedIn.length}</b>\n` +
              (notCheckedIn.slice(0, 15).map(u => `• ${escapeHtml(u.name || u.id)}`).join('\n') || '• All in!') +
              `\n\n🔔 The missed check-in reminder runs at 9:15; late status follows the attendance policy.`;
    } else {
        msg = `📋 <b>Team Check-out — ${today} 6pm</b>\n\n` +
              `🚪 Checked out today: <b>${signedOut.length}</b> / ${checkedIn.length} who checked in\n` +
              `⏱️ Still checked in: <b>${stillIn.length}</b>\n` +
              (stillIn.slice(0, 15).map(u => `• ${escapeHtml(u.name || u.id)}`).join('\n') || '• All signed out!') +
              `\n\nPlease remind those still in to check out.`;
    }
    const delivery = await sendReport(token, [...reportRecipients.keys()], msg);
    return { teamDigest: true, slot, sentTo: delivery.sent, failed: delivery.failed, checkedIn: checkedIn.length, checkedOut: signedOut.length, stillIn: stillIn.length, total: allStaff.length };
}

module.exports = async (req, res) => {
    const requestedTask = String(req.query?.task || req.body?.task || '').trim();
    const aliases = {
        jomit_team_10am: 'team_digest_10am',
        jomit_team_6pm: 'team_digest_6pm'
    };
    const task = aliases[requestedTask] || requestedTask;

    if (!process.env.CRON_SECRET && !process.env.CLOUD_SCHEDULER_SERVICE_ACCOUNT_EMAIL) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'No scheduler authentication is configured' }));
        return;
    }
    // Server-to-server endpoint (cron + operators) — no browser CORS needed.
    if (!cronSecretIsValid(req) && !await cloudSchedulerRequestIsValid(req, task)) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
        return;
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
        res.statusCode = 405;
        res.end(JSON.stringify({ ok: false }));
        return;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set' }));
        return;
    }

    const db = getDb();
    if (!db) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'FIREBASE_SERVICE_ACCOUNT not set' }));
        return;
    }

    // Every scheduled request must name exactly one task. Inferring jobs from
    // the current hour caused unrelated digests to run together on retries.
    const handlers = {
        absentee: () => absenteeAlert(db, token),
        standup: () => dailyStandup(db, token),
        leaderboard: () => weeklyLeaderboard(db, token),
        personal_workplan: () => personalWorkPlanDigest(db, token),
        forgot_checkin: () => forgotCheckInDigest(db, token),
        forgot_checkout: () => forgotCheckOutDigest(db, token),
        forgot_checkout_followup: () => forgotCheckOutFollowUp(db, token),
        team_digest_10am: () => teamDigest(db, token, '10am'),
        team_digest_6pm: () => teamDigest(db, token, '6pm')
    };
    if (!handlers[task]) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'A valid scheduler task is required', task: requestedTask || null }));
        return;
    }

    try {
        const result = await handlers[task]();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, task, result }));
    } catch (err) {
        console.error('Scheduler error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: 'Scheduler failed' }));
    }
};
