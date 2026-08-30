const crypto = require('crypto');

function getLinkSecret() {
    return process.env.TELEGRAM_LINK_SECRET
        || process.env.TELEGRAM_WEBHOOK_SECRET
        || process.env.CRON_SECRET
        || process.env.TELEGRAM_BOT_TOKEN
        || '';
}

function signToken(userId, expiryMs, secret) {
    const payload = `${userId}:${expiryMs}`;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const raw = `${userId}:${expiryMs}:${hmac}`;
    return Buffer.from(raw).toString('base64url');
}

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
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
    }

    const secret = getLinkSecret();
    if (!secret) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'Link secret not configured' }));
        return;
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const userId = String(body?.userId || body?.uid || '').trim();
    if (!userId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Missing userId' }));
        return;
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'CRWIAttendancebot';
    const expiryMs = Date.now() + 10 * 60 * 1000;
    const token = signToken(userId, expiryMs, secret);
    const url = `https://t.me/${botUsername}?start=${token}`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, url, token, expiryMs }));
};
