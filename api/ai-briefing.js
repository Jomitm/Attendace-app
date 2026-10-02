// api/ai-briefing.js — Proactive daily briefing (push, not reactive chat).
// Generates a short AI briefing from each opted-in user's snapshot and sends it
// via the existing Telegram integration (api/telegram-send.js). Designed for a
// Vercel Cron trigger — add to vercel.json:
//   "crons": [{ "path": "/api/ai-briefing", "schedule": "0 2 * * *" }]
// (02:00 UTC ≈ 07:30 IST morning briefing.)
//
// Env: OPENROUTER_API_KEY (or XAI_API_KEY), TELEGRAM_BOT_TOKEN.
// Users opt in by having a `users.telegramChatId` field; without it they are skipped.
//
// Note: this endpoint is cron-only (no user token). It is protected by the
// CRON_SECRET env var — Vercel sends it as `Authorization: Bearer $CRON_SECRET`.

import { initializeFirebaseAdmin } from './_firebase-admin.js';

export default async function handler(req, res) {
    // Cron secret check (Vercel sets Authorization header automatically when
    // CRON_SECRET is configured; also allow GET from the dashboard).
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const auth = req.headers.authorization || '';
        if (auth !== `Bearer ${secret}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } else if (req.method !== 'GET') {
        // No secret configured — only allow GET (read-only trigger) to avoid abuse.
        return res.status(405).json({ error: 'Set CRON_SECRET for scheduled runs' });
    }

    try {
        const admin = initializeFirebaseAdmin();
        const db = admin ? (await import('./_firebase-admin.js')).getDb?.() || (await import('./_firebase-admin.js')).getDb() : null;
        if (!db) return res.status(500).json({ error: 'Server configuration error' });

        // Opted-in users only
        const snap = await db.collection('users').where('telegramChatId', '!=', '').limit(50).get();
        if (snap.empty) return res.status(200).json({ ok: true, sent: 0, message: 'No opted-in users' });

        const today = new Date().toISOString().slice(0, 10);
        let sent = 0;
        const results = [];

        for (const doc of snap.docs) {
            const user = { id: doc.id, ...doc.data() };
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
                        openTasks.push({ task: String(t.task || '').slice(0, 60), date: wp.date, postponed: st === 'postponed' });
                    }
                });
                const overdue = openTasks.filter(t => t.date < today);
                const todayTasks = openTasks.filter(t => t.date === today);
                const snapshot = {
                    name: user.name || user.username,
                    today,
                    checkedIn: String(user.status || '').toLowerCase() === 'in',
                    overdueCount: overdue.length,
                    overdueSample: overdue.slice(0, 3).map(t => t.task),
                    todayCount: todayTasks.length,
                    todaySample: todayTasks.slice(0, 3).map(t => t.task)
                };

                // AI briefing (shared provider), rule-based fallback
                let text = '';
                const mod = await import('./_ai-provider.js');
                const ai = await mod.callAI({ metrics: snapshot, question: 'Write my morning briefing.' });
                if (ai?.insight) {
                    text = ai.insight.replace(/AI Score:.*$/m, '').trim();
                } else {
                    text = snapshot.overdueCount > 0
                        ? `Good morning ${snapshot.name} — you have ${snapshot.overdueCount} overdue task(s): ${snapshot.overdueSample.join(', ')}. Clear the oldest one first, then start today's ${snapshot.todayCount} task(s).`
                        : snapshot.todayCount > 0
                            ? `Good morning ${snapshot.name} — ${snapshot.todayCount} task(s) planned today: ${snapshot.todaySample.join(', ')}. ${snapshot.checkedIn ? 'You are checked in — have a productive day.' : 'Remember to check in before 09:15.'}`
                            : `Good morning ${snapshot.name} — no tasks planned for today. Add 3-5 tasks to stay on track.`;
                }

                // Send via existing Telegram integration (server-side import)
                const sendMod = await import('./telegram-send.js');
                // telegram-send is an express-style handler; call it internally
                const fakeRes = { statusCode: 200, setHeader() {}, end() {} };
                await sendMod.default({ method: 'POST', headers: {}, body: { chatId: user.telegramChatId, text: `🌅 ${text}` } }, fakeRes);

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
