const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');

const SECRET = process.env.CALENDAR_FEED_SECRET || 'crwi-cal-feed-fallback-change-me';
const ALGO = 'sha256';
const EXPIRY_DAYS = 180;

function generateToken(userId) {
    const payload = JSON.stringify({
        userId,
        iat: Date.now(),
        exp: Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });
    const sig = crypto.createHmac(ALGO, SECRET).update(payload).digest('base64url');
    return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || req.headers['x-forwarded-host'] || 'crwi-attendance.vercel.app';
    return `${proto}://${host}`;
}

function parseBody(req) {
    return new Promise((resolve) => {
        if (req.body && typeof req.body === 'object') {
            resolve(req.body);
            return;
        }
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch {
                resolve({});
            }
        });
    });
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

    try {
        const body = await parseBody(req);
        const userId = body.userId;

        if (!userId || typeof userId !== 'string') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: 'Missing userId in request body' }));
            return;
        }

        const db = getDb();
        if (db) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ ok: false, error: 'User not found' }));
                return;
            }
        }

        const token = generateToken(userId);
        const baseUrl = getBaseUrl(req);
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
        res.end(JSON.stringify({ ok: false, error: 'Failed to generate calendar token: ' + (err.message || '') }));
    }
};
