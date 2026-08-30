const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');

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

function makeShortId() {
    return crypto.randomBytes(9).toString('base64url').slice(0, 12);
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
    // Use short token (12 chars, fits Telegram 64 char limit) stored in Firestore, with HMAC fallback for old links
    const db = getDb();
    let token;
    if (db) {
        try {
            let shortId = makeShortId();
            // Ensure uniqueness (rare collision)
            let tries = 0;
            while (tries < 3) {
                const existing = await db.collection('telegram_link_tokens').doc(shortId).get();
                if (!existing.exists) break;
                shortId = makeShortId();
                tries++;
            }
            token = shortId;
            await db.collection('telegram_link_tokens').doc(shortId).set({
                userId,
                expiryMs,
                createdAt: Date.now(),
                used: false
            });
        } catch {
            // Fallback to signed token if Firestore unavailable
            token = signToken(userId, expiryMs, secret);
        }
    } else {
        token = signToken(userId, expiryMs, secret);
    }
    const url = `https://t.me/${botUsername}?start=${token}`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, url, token, expiryMs }));
};
