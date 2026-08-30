const TELEGRAM_API = 'https://api.telegram.org';

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

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const envChatId = process.env.TELEGRAM_CHAT_ID;

    if (!token) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
            ok: false,
            error: 'Telegram not configured. Set TELEGRAM_BOT_TOKEN in Vercel env vars.'
        }));
        return;
    }

    const { text, chatId: bodyChatId, chat_id: bodyChatIdAlt, userId: bodyUserId } = req.body || {};
    let chatId = bodyChatId || bodyChatIdAlt || null;
    // Allow personal send via userId lookup if chatId not directly provided
    if (!chatId && bodyUserId) {
        try {
            const { getDb } = require('./_firebase-admin');
            const db = getDb();
            if (db) {
                const snap = await db.collection('users').doc(String(bodyUserId)).get();
                if (snap.exists) chatId = snap.data()?.telegramChatId || null;
            }
        } catch {}
    }
    if (!chatId) chatId = envChatId;
    if (!chatId) {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'No chatId available' }));
        return;
    }

    if (!text || typeof text !== 'string') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Missing "text" field in request body' }));
        return;
    }

    try {
        const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text.slice(0, 4000),
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        const data = await response.json();

        if (!data.ok) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: data.description || 'Telegram API error' }));
            return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true }));
    } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err.message || 'Failed to send Telegram message' }));
    }
};
