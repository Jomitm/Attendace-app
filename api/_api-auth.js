// Shared Firebase ID-token verification for browser-facing API handlers.
const { getAdmin } = require('./_firebase-admin.js');

function bearerToken(req) {
    const header = String(req?.headers?.authorization || '');
    const match = /^Bearer\s+(.+)$/i.exec(header);
    return match ? match[1].trim() : '';
}

async function authenticateRequest(req, { checkRevoked = true } = {}) {
    const admin = getAdmin();
    if (!admin) return { ok: false, status: 503, error: 'Authentication service unavailable' };
    const token = bearerToken(req);
    if (!token) return { ok: false, status: 401, error: 'Authentication required' };
    try {
        const decoded = await admin.auth().verifyIdToken(token, checkRevoked);
        return { ok: true, admin, user: decoded };
    } catch {
        return { ok: false, status: 401, error: 'Invalid or expired authentication token' };
    }
}

function isGlobalAdmin(user) {
    return user?.isAdmin === true;
}

function isReportsAdmin(user, accessRecord) {
    return isGlobalAdmin(user) || accessRecord?.permissions?.reports === 'admin';
}

function sendAuthError(res, auth) {
    return res.status(auth.status).json({ error: auth.error });
}

module.exports = { authenticateRequest, bearerToken, isGlobalAdmin, isReportsAdmin, sendAuthError };
