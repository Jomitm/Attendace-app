// Shared Firebase ID-token verification for browser-facing API handlers.
const { getAdmin, getDb } = require('./_firebase-admin.js');
const { isFormerStaff } = require('./_staff-employment-core.js');

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
    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(token, checkRevoked);
    } catch {
        return { ok: false, status: 401, error: 'Invalid or expired authentication token' };
    }
    try {
        const db = getDb();
        if (!db) return { ok: false, status: 503, error: 'Account status service unavailable' };
        const snapshot = await db.collection('users').doc(decoded.uid).get();
        if (!snapshot.exists || isFormerStaff(snapshot.data())) {
            return { ok: false, status: 403, error: 'This staff account is no longer active. Please contact the administrator.' };
        }
        const profile = snapshot.data();
        // Verify the token for identity, then use the current profile for authority.
        // Role removal and deactivation must not wait for cached JWTs to expire.
        return { ok: true, admin, user: { ...decoded,
            isAdmin: profile.isAdmin === true, role: profile.role || 'Employee',
            name: profile.name || profile.username || '',
            permissions: profile.permissions || {}
        } };
    } catch {
        return { ok: false, status: 503, error: 'Could not verify current account access. Please try again.' };
    }
}

function isGlobalAdmin(user) {
    return user?.isAdmin === true;
}

function isReportsAdmin(user, _accessRecord) {
    return isGlobalAdmin(user) || user?.permissions?.reports === 'admin';
}

function sendAuthError(res, auth) {
    return res.status(auth.status).json({ error: auth.error });
}

module.exports = { authenticateRequest, bearerToken, isGlobalAdmin, isReportsAdmin, sendAuthError };
