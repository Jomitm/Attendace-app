const { getDb } = require('./_firebase-admin');
const { authenticateRequest, isGlobalAdmin } = require('./_api-auth');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
    }

    const auth = await authenticateRequest(req);
    if (!auth.ok) {
        res.statusCode = auth.status;
        res.end(JSON.stringify({ ok: false, error: auth.error }));
        return;
    }
    if (!isGlobalAdmin(auth.user)) {
        res.statusCode = 403;
        res.end(JSON.stringify({ ok: false, error: 'Only a global administrator can register the webhook' }));
        return;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set in Vercel env' }));
        return;
    }

    const db = getDb();
    if (!db) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'Firebase not configured' }));
        return;
    }

    // Confirm the signed-in administrator still has an active account.
    try {
        const snap = await db.collection('users').doc(auth.user.uid).get();
        if (!snap.exists) {
            res.statusCode = 404;
            res.end(JSON.stringify({ ok: false, error: 'User not found' }));
            return;
        }
        const user = snap.data();
        if (user.status === 'archived' || user.isAdmin !== true) {
            res.statusCode = 403;
            res.end(JSON.stringify({ ok: false, error: 'Administrator account is inactive or no longer authorized' }));
            return;
        }
    } catch {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: 'Failed to verify admin' }));
        return;
    }

    // Determine webhook URL
    const appOrigin = String(process.env.APP_ORIGIN || '').split(',').map((s) => s.trim()).find(Boolean)
        || 'https://staff.crwi.org.in';
    const webhookUrl = `${appOrigin.replace(/\/+$/, '')}/api/telegram-webhook`;

    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_LINK_SECRET || process.env.CRON_SECRET || '';
    if (!secret) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'TELEGRAM_WEBHOOK_SECRET must be configured before registration' }));
        return;
    }
    const params = {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
    };
    params.secret_token = secret;

    try {
        const resp = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const data = await resp.json();
        if (!data.ok) {
            res.statusCode = 502;
            res.end(JSON.stringify({ ok: false, error: data.description || 'Telegram API error', details: data }));
            return;
        }
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, webhookUrl, hasSecret: !!secret, result: data }));
    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: err.message || 'Failed to set webhook' }));
    }
};
