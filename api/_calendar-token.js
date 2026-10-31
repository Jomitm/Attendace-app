const { isFormerStaff } = require('./_staff-employment-core.js');
const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');
const { authenticateRequest } = require('./_api-auth');

function getSecret() {
    return process.env.CALENDAR_FEED_SECRET
        || process.env.TELEGRAM_WEBHOOK_SECRET
        || process.env.CRON_SECRET
        || process.env.TELEGRAM_BOT_TOKEN
        || '';
}
const ALGO = 'sha256';
const EXPIRY_DAYS = 180;

// Best-effort per-instance rate limiter for token minting (per IP).
const MINT_WINDOW_MS = 60 * 60 * 1000;
const MINT_MAX_PER_WINDOW = 20;
const mintLog = new Map();
function mintRateLimited(ip) {
    const now = Date.now();
    const entry = mintLog.get(ip);
    if (!entry || now > entry.resetAt) {
        mintLog.set(ip, { count: 1, resetAt: now + MINT_WINDOW_MS });
        return false;
    }
    entry.count += 1;
    return entry.count > MINT_MAX_PER_WINDOW;
}

function generateToken(userId) {
    const secret = getSecret();
    const payload = JSON.stringify({
        userId,
        iat: Date.now(),
        exp: Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });
    const sig = crypto.createHmac(ALGO, secret).update(payload).digest('base64url');
    return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function getBaseUrl() {
    const configured = String(process.env.APP_ORIGIN || '').split(',').map((s) => s.trim()).find(Boolean);
    return String(configured || 'https://staff.crwi.org.in').replace(/\/+$/, '');
}

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
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
    }

    try {
        const auth = await authenticateRequest(req);
        if (!auth.ok) {
            res.statusCode = auth.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: auth.error }));
            return;
        }

        if (!getSecret()) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: 'Calendar feed is not configured (no secret available)' }));
            return;
        }

        const rawIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');
        if (mintRateLimited(rawIp.split(',')[0].trim())) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: 'Too many token requests' }));
            return;
        }

        const userId = auth.user.uid;

        const db = getDb();
        if (db) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists || isFormerStaff(userDoc.data())) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ ok: false, error: 'User not found' }));
                return;
            }
        }

        const token = generateToken(userId);
        const baseUrl = getBaseUrl();
        const feedUrl = `${baseUrl}/api/calendar-feed?token=${token}`;
        const expiryDate = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 200;
        res.end(JSON.stringify({
            ok: true,
            feedUrl,
            token,
            expiresAt: expiryDate.toISOString(),
            expiryDays: EXPIRY_DAYS,
            instructions: {
                outlookDesktop: [
                    'Open Outlook → File → Account Settings → Account Settings',
                    'Click "Internet Calendars" tab → "New"',
                    'Paste the feed URL → click "Add"',
                    'Name the calendar → click "OK"'
                ],
                outlookWeb: [
                    'Go to outlook.live.com/calendar',
                    'Click "Add calendar" → "Subscribe from web"',
                    'Paste the feed URL → click "Import"'
                ]
            }
        }));
    } catch (err) {
        console.error('Calendar token error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Failed to generate calendar token' }));
    }
};
