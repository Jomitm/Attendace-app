import { isFormerStaff } from './_staff-employment-core.js';
// api/_ai-briefing.js — Proactive daily briefing (push, not reactive chat).
// Generates a short AI briefing from each opted-in user's snapshot and sends it
// via the existing Telegram integration (api/_telegram-send.js). Designed for a
// Vercel Cron trigger — add to vercel.json:
//   "crons": [{ "path": "/api/ai-briefing", "schedule": "0 2 * * *" }]
// (02:00 UTC ≈ 07:30 IST morning briefing.)
//
// Env: OPENROUTER_API_KEY (or XAI_API_KEY), TELEGRAM_BOT_TOKEN.
// Users opt in by having a `users.telegramChatId` field; without it they are skipped.
//
// Note: this endpoint is cron-only (no user token). It is protected by the
// CRON_SECRET env var — Vercel sends it as `Authorization: Bearer $CRON_SECRET`.

import { getAdmin, getDb } from './_firebase-admin.js';

export default async function handler(req, res) {
    // Vercel sets Authorization on scheduled invocations when CRON_SECRET is configured.
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(503).json({ error: 'CRON_SECRET is not configured' });
    const authHeader = String(req.headers?.authorization || '');
    if (authHeader !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const admin = getAdmin();
        const db = admin ? getDb() : null;
        if (!db) return res.status(500).json({ error: 'Server configuration error' });

        // Opted-in users only
        const snap = await db.collection('users').where('telegramChatId', '!=', '').limit(50).get();
        if (snap.empty) return res.status(200).json({ ok: true, sent: 0, message: 'No opted-in users' });

        const today = new Date().toISOString().slice(0, 10);
        let sent = 0;
        const results = [];

        for (const doc of snap.docs) {
            const user = { id: doc.id, ...doc.data() };
            if (isFormerStaff(user)) continue;
            try {
                // Build a minimal snapshot from Firestore directly (server-side —
                // no browser needed for a cron run).
                const [_issuesSnap, plansSnap] = await Promise.all([
                    db.collection('users').doc(doc.id).get(),
                    db.collection('work_plans')
                        .where('userId', '==', doc.id)
                        .where('date', '>=', today)
                        .limit(14).get()
                ]);
                const openTasks = [];
                plansSnap.forEach(p => {
                    const wp = p.data();
                    for (const t of (wp.plans || [])) {
                        if (!t || t.isRemoved) continue;
                        const st = String(t.status || '').toLowerCase();
                        if (st === 'completed' || t.completed === true) continue;
                        openTasks.push({
                            task: String(t.task || '').slice(0, 60),
                            date: wp.date,
                            postponed: st === 'postponed',
                            size: t.sizeCategory || t.aiSizeCategory || '',
                            pri: t.priorityLevel || t.aiPriorityLevel || '',
                            cf: !!(t.carryForwardRootId || t.carriedForwardFromDate || t.carriedForwardFromPlanId)
                        });
                    }
                });
                const overdue = openTasks.filter(t => t.date < today)
                    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
                const todayTasks = openTasks.filter(t => t.date === today);
                const isUrgent = (t) => t.pri === 'urgent' || t.pri === 'important';
                const urgentToday = todayTasks.filter(isUrgent).slice(0, 3).map(t => t.task);
                // Deterministic top-3: oldest overdue first, then urgent today, then rest of today
                const todayTop3 = overdue.concat(
                    todayTasks.filter(isUrgent),
                    todayTasks.filter(t => !isUrgent(t))
                ).slice(0, 3).map(t => t.task);
                const snapshot = {
                    name: user.name || user.username,
                    today,
                    checkedIn: String(user.status || '').toLowerCase() === 'in',
                    overdueCount: overdue.length,
                    overdueSample: overdue.slice(0, 3).map(t => t.task),
                    todayCount: todayTasks.length,
                    todaySample: todayTasks.slice(0, 3).map(t => t.task),
                    urgentToday,
                    todayTop3
                };

                // AI briefing (shared provider), rule-based fallback
                let text = '';
                const mod = await import('./_ai-provider.js');
                const ai = await mod.callAI({ metrics: snapshot, question: 'Write my morning briefing.' });
                if (ai?.insight) {
                    text = ai.insight.replace(/AI Score:.*$/m, '').trim();
                } else {
                    const urgentLead = snapshot.urgentToday.length > 0
                        ? ` Start with "${snapshot.urgentToday[0]}" — it is marked urgent.`
                        : '';
                    text = snapshot.overdueCount > 0
                        ? `Good morning ${snapshot.name} — you have ${snapshot.overdueCount} overdue task(s): ${snapshot.overdueSample.join(', ')}. Clear the oldest one first, then start today's ${snapshot.todayCount} task(s).${urgentLead}`
                        : snapshot.todayCount > 0
                            ? `Good morning ${snapshot.name} — ${snapshot.todayCount} task(s) planned today: ${snapshot.todaySample.join(', ')}.${urgentLead} ${snapshot.checkedIn ? 'You are checked in — have a productive day.' : 'Remember to check in before 09:15.'}`
                            : `Good morning ${snapshot.name} — no tasks planned for today. Add 3-5 tasks to stay on track.`;
                }

                // Send through the trusted server-only helper; the public
                // endpoint intentionally accepts event descriptions, not arbitrary text.
                const sendMod = await import('./_telegram-send.js');
                await sendMod.default.sendTelegramMessage({ chatId: user.telegramChatId, text: `🌅 ${text}` });

                sent++;
                results.push({ userId: doc.id, ok: true });
            } catch (e) {
                console.warn(`[ai-briefing] user ${doc.id} failed:`, e?.message || e);
                results.push({ userId: doc.id, ok: false, error: e?.message });
            }
        }

        return res.status(200).json({ ok: true, sent, total: snap.size, results });
    } catch (err) {
        console.error('ai-briefing error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
