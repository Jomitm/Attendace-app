const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');

const TELEGRAM_API = 'https://api.telegram.org';

// Vercel sends "Authorization: Bearer <CRON_SECRET>" on scheduled invocations
// when CRON_SECRET is configured in project env. Enforced only when set, so
// existing deployments keep working until the secret is added.
function cronSecretIsValid(req) {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        console.warn('CRON_SECRET is not set — scheduler endpoint accepts unauthenticated triggers.');
        return true;
    }
    const header = String(req.headers?.authorization || '');
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return false;
    const a = Buffer.from(match[1]);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
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
    return resp.json();
}

function getLocalISO(offsetHours = 5.5) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utc + offsetHours * 3600000);
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
}

function getLocalDay(offsetHours = 5.5) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utc + offsetHours * 3600000);
    return local.getDay();
}

function getLocalHour(offsetHours = 5.5) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utc + offsetHours * 3600000);
    return local.getHours();
}

async function getLinkedUsers(db) {
    const snap = await db.collection('users')
        .where('telegramChatId', '!=', '')
        .where('telegramChatId', '!=', null)
        .get();

    const users = [];
    snap.forEach(doc => {
        const data = doc.data();
        if (data.telegramChatId && !data.isAdmin && data.status !== 'archived') {
            users.push({ id: doc.id, ...data });
        }
    });
    return users;
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
            `Hi ${user.name || 'there'}! What did you accomplish today?\n\n` +
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
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) return { absentee: false, reason: 'no chat id' };

    const today = getLocalISO();

    // Get all users who should have checked in
    const usersSnap = await db.collection('users')
        .where('role', '!=', 'Administrator')
        .get();

    const absent = [];
    usersSnap.forEach(doc => {
        const user = doc.data();
        if (user.status === 'archived' || user.isAdmin) return;
        if (user.status !== 'in' && !user.lastCheckIn) {
            absent.push(user.name || user.id);
        }
    });

    // Check today's attendance logs
    const attendanceSnap = await db.collection('attendance')
        .where('date', '==', today)
        .get();

    const checkedIn = new Set();
    attendanceSnap.forEach(doc => {
        const log = doc.data();
        if (log.checkIn) checkedIn.add(log.user_id);
    });

    // Find users who haven't checked in today
    const actuallyAbsent = [];
    usersSnap.forEach(doc => {
        const user = doc.data();
        if (user.status === 'archived' || user.isAdmin) return;
        if (!checkedIn.has(doc.id)) {
            actuallyAbsent.push(user.name || user.id);
        }
    });

    if (actuallyAbsent.length === 0) {
        return { absent: 0, message: 'All staff checked in!' };
    }

    const msg = `🔔 <b>Absentee Alert — ${today}</b>\n\n` +
        `<b>${actuallyAbsent.length} staff</b> haven't checked in yet:\n` +
        actuallyAbsent.map(n => `• ${n}`).join('\n') +
        `\n\n⏰ Current time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    await sendMessage(token, chatId, msg);
    return { absent: actuallyAbsent.length, names: actuallyAbsent };
}

// ── Weekly Leaderboard (Monday 9 AM IST) ─────────────────────────────
async function weeklyLeaderboard(db, token) {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) return { leaderboard: false, reason: 'no chat id' };

    // Calculate last week's date range
    const now = new Date();
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - now.getDay() - 6);
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());

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
        return { leaderboard: true, count: 0 };
    }

    const medals = ['🥇', '🥈', '🥉'];
    let msg = `🏆 <b>Weekly Leaderboard</b>\n`;
    msg += `📅 ${startDate} → ${endDate}\n\n`;

    entries.forEach((entry, i) => {
        const medal = medals[i] || '  ';
        const hours = (entry.totalMs / 3600000).toFixed(1);
        const avgPerDay = entry.days > 0 ? (entry.totalMs / entry.days / 3600000).toFixed(1) : '0';
        msg += `${medal} <b>${entry.name}</b>\n`;
        msg += `   📊 ${entry.fullDays} full days | ⏱️ ${hours}h total | ⏰ ${avgPerDay}h avg/day\n`;
        if (entry.late > 0) msg += `   ⚠️ ${entry.late} late\n`;
        msg += `\n`;
    });

    const totalHours = entries.reduce((s, e) => s + e.totalMs, 0) / 3600000;
    msg += `📈 Team total: ${totalHours.toFixed(0)}h | ${entries.length} members active`;

    await sendMessage(token, chatId, msg);
    return { leaderboard: true, count: entries.length, totalHours };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function findJomitUser(db) {
    let snap = await db.collection('users').where('username', '==', 'jomit').limit(1).get();
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    snap = await db.collection('users').where('name', '==', 'Jomit Mathew').limit(1).get();
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    return null;
}

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
            msg = `☀️ Good morning ${user.name || 'there'}!\n\n` +
                  `📅 ${today} — <b>YOU HAVE NO TASK TODAY</b>\n\n` +
                  `Enjoy your day or check with your manager for new work.`;
        } else {
            const total = tasks.length;
            const pending = tasks.filter(t => !['completed', 'not-completed', 'cancelled'].includes(String(t.status))).length;
            const completed = tasks.filter(t => String(t.status) === 'completed').length;
            msg = `☀️ Good morning ${user.name || 'there'}!\n\n` +
                  `📋 <b>Your work plan for ${today}</b> — ${total} tasks (${pending} pending, ${completed} completed)\n\n` +
                  tasks.slice(0, 10).map((t, i) => {
                      const tt = t.task || t.title || t.description || 'Untitled task';
                      const st = String(t.status || 'pending');
                      return `${i + 1}. ${tt} — <i>${st}</i>`;
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

// ── Forgot Check-in (9:30 AM IST) ───────────────────────────────────
async function forgotCheckInDigest(db, token) {
    const users = await getLinkedUsers(db);
    const today = getLocalISO();
    let sent = 0;
    for (const user of users) {
        const lastIn = user.lastCheckIn ? getLocalISOFromEpoch(user.lastCheckIn) : '';
        const isCheckedIn = user.status === 'in' && lastIn === today;
        if (isCheckedIn) continue;
        const msg = `⏰ <b>Reminder — you forgot to check in</b>\n\n` +
                    `Hi ${user.name || 'there'}, you have not checked in yet today (${today}).\n` +
                    `Please open the app and check in by 9:30 to avoid being marked late.`;
        await sendMessage(token, user.telegramChatId, msg);
        sent++;
        await sleep(120);
    }
    return { forgotCheckIn: true, sent };
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
    for (const user of users) {
        const lastIn = user.lastCheckIn ? getLocalISOFromEpoch(user.lastCheckIn) : '';
        const isStillIn = user.status === 'in' && lastIn === today;
        if (!isStillIn) continue;
        const msg = `🔔 <b>Reminder — you forgot to check out</b>\n\n` +
                    `Hi ${user.name || 'there'}, you are still checked in since today.\n` +
                    `Please check out before you leave. If you already left, open the app and check out now.`;
        await sendMessage(token, user.telegramChatId, msg);
        sent++;
        await sleep(120);
    }
    return { forgotCheckOut: true, sent };
}

// ── Jomit Team Digests (10 AM signed-in, 6 PM signed-out) ────────────
async function jomitTeamDigest(db, token, slot) {
    const jomit = await findJomitUser(db);
    const jomitChatId = jomit?.telegramChatId ? String(jomit.telegramChatId) : null;
    const groupChatId = process.env.TELEGRAM_CHAT_ID;
    if (!jomitChatId && !groupChatId) return { jomitTeam: false, reason: 'no chat id' };
    const today = getLocalISO();
    const usersSnap = await db.collection('users').get();
    const allStaff = [];
    usersSnap.forEach(doc => {
        const u = doc.data();
        if (u.status === 'archived' || u.isAdmin || u.role === 'Administrator') return;
        allStaff.push({ id: doc.id, ...u });
    });
    const isInToday = (u) => u.status === 'in' && getLocalISOFromEpoch(u.lastCheckIn) === today;
    const checkedIn = allStaff.filter(isInToday);
    const notCheckedIn = allStaff.filter(u => !isInToday(u));
    const stillIn = checkedIn;
    const signedOut = allStaff.filter(u => !isInToday(u) && u.lastCheckIn);
    let msg;
    if (slot === '10am') {
        msg = `📋 <b>Team Check-in — ${today} 10am</b>\n\n` +
              `✅ Checked in: <b>${checkedIn.length}</b> / ${allStaff.length}\n` +
              (checkedIn.slice(0, 15).map(u => `• ${u.name || u.id}`).join('\n') || '• —') + `\n\n` +
              `⏰ Not yet in: <b>${notCheckedIn.length}</b>\n` +
              (notCheckedIn.slice(0, 15).map(u => `• ${u.name || u.id}`).join('\n') || '• All in!') +
              `\n\n🔔 Late after 9:15 is marked late.`;
    } else {
        msg = `📋 <b>Team Check-out — ${today} 6pm</b>\n\n` +
              `🚪 Signed out: <b>${signedOut.length}</b> / ${allStaff.length}\n` +
              `⏱️ Still checked in: <b>${stillIn.length}</b>\n` +
              (stillIn.slice(0, 15).map(u => `• ${u.name || u.id}`).join('\n') || '• All signed out!') +
              `\n\nPlease remind those still in to check out.`;
    }
    let sentTo = [];
    if (jomitChatId) { await sendMessage(token, jomitChatId, msg); sentTo.push('jomit'); }
    if (groupChatId) { await sendMessage(token, groupChatId, msg); sentTo.push('group'); }
    return { jomitTeam: true, slot, sentTo, checkedIn: checkedIn.length, total: allStaff.length };
}

module.exports = async (req, res) => {
    // Server-to-server endpoint (cron + operators) — no browser CORS needed.
    if (!cronSecretIsValid(req)) {
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

    // Determine which task to run based on query param or schedule
    const task = req.query?.task || req.body?.task || '';
    const hour = getLocalHour();
    const day = getLocalDay();

    try {
        let results = {};

        // Run absentee alert at 11 AM (hour 11)
        if (task === 'absentee' || hour === 11) {
            results.absentee = await absenteeAlert(db, token);
        }

        // Run daily standup at 6 PM (hour 18)
        if (task === 'standup' || hour === 18) {
            results.standup = await dailyStandup(db, token);
        }

        // Run weekly leaderboard on Monday at 9 AM
        if (task === 'leaderboard' || (day === 1 && hour === 9)) {
            results.leaderboard = await weeklyLeaderboard(db, token);
        }

        // Personal work plan at 8 AM Mon-Sat (day 1-6)
        if (task === 'personal_workplan' || (day >= 1 && day <= 6 && hour === 8)) {
            results.personal_workplan = await personalWorkPlanDigest(db, token);
        }

        // Forgot check-in at 9:30 AM Mon-Sat
        if (task === 'forgot_checkin') {
            results.forgot_checkin = await forgotCheckInDigest(db, token);
        }

        // Jomit team 10 AM Mon-Sat
        if (task === 'jomit_team_10am' || (day >= 1 && day <= 6 && hour === 10)) {
            results.jomit_team_10am = await jomitTeamDigest(db, token, '10am');
        }

        // Forgot check-out at 6 PM Mon-Sat (18)
        if (task === 'forgot_checkout' || (day >= 1 && day <= 6 && hour === 18)) {
            // avoid double-send when standup already ran at 18 for personal forgot — run only for dedicated task param
            if (task === 'forgot_checkout') results.forgot_checkout = await forgotCheckOutDigest(db, token);
            else if (task === 'forgot_checkout' || task === '') {
                // when triggered by hour 18 without specific task, run forgot checkout as well
                if (!results.forgot_checkout) results.forgot_checkout = await forgotCheckOutDigest(db, token);
            }
        }

        // Jomit team 6 PM Mon-Sat
        if (task === 'jomit_team_6pm') {
            results.jomit_team_6pm = await jomitTeamDigest(db, token, '6pm');
        }
        // Auto-run jomit 6pm team when hour 18 and day 1-6 and no specific task (alongside forgot checkout)
        if (!task && day >= 1 && day <= 6 && hour === 18) {
            if (!results.jomit_team_6pm) results.jomit_team_6pm = await jomitTeamDigest(db, token, '6pm');
        }

        // If specific task requested, run only that (fallback for direct task calls)
        if (task && !results[task]) {
            if (task === 'absentee') results.absentee = await absenteeAlert(db, token);
            else if (task === 'standup') results.standup = await dailyStandup(db, token);
            else if (task === 'leaderboard') results.leaderboard = await weeklyLeaderboard(db, token);
            else if (task === 'personal_workplan') results.personal_workplan = await personalWorkPlanDigest(db, token);
            else if (task === 'forgot_checkin') results.forgot_checkin = await forgotCheckInDigest(db, token);
            else if (task === 'forgot_checkout') results.forgot_checkout = await forgotCheckOutDigest(db, token);
            else if (task === 'jomit_team_10am') results.jomit_team_10am = await jomitTeamDigest(db, token, '10am');
            else if (task === 'jomit_team_6pm') results.jomit_team_6pm = await jomitTeamDigest(db, token, '6pm');
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, results }));
    } catch (err) {
        console.error('Scheduler error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: 'Scheduler failed' }));
    }
};
