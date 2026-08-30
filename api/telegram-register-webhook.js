const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set in Vercel env' }));
        return;
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const userId = String(body?.userId || '').trim();
    if (!userId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Missing userId' }));
        return;
    }

    const db = getDb();
    if (!db) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'Firebase not configured' }));
        return;
    }

    // Verify caller is owner (jomit)
    try {
        const snap = await db.collection('users').doc(userId).get();
        if (!snap.exists) {
            res.statusCode = 404;
            res.end(JSON.stringify({ ok: false, error: 'User not found' }));
            return;
        }
        const user = snap.data();
        const isOwner = String(user.username || '').toLowerCase() === 'jomit' || String(user.name || '').toLowerCase() === 'jomit mathew';
        if (!isOwner && !user.isAdmin) {
            res.statusCode = 403;
            res.end(JSON.stringify({ ok: false, error: 'Only owner can register webhook' }));
            return;
        }
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: 'Failed to verify owner' }));
        return;
    }

    // Determine webhook URL
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || '';
    if (!host) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Cannot determine host' }));
        return;
    }
    const webhookUrl = `${proto}://${host}/api/telegram-webhook`;

    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_LINK_SECRET || process.env.CRON_SECRET || '';
    // If no secret set, warn but still register without secret_token (webhook will accept unverified)
    const params = {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
    };
    if (secret) params.secret_token = secret;

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
