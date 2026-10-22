// api/_auth-set-password.js — Vercel Serverless
// Changes a user's password server-side. Removes plaintext from Firestore.

const { getAdmin, getDb } = require('./_firebase-admin.js');
const { authenticateRequest, sendAuthError } = require('./_api-auth.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // The runtime's lazy req.body getter throws on a malformed payload;
    // surface that as a 400 instead of an opaque 500.
    let body;
    try {
        body = req.body || {};
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    try {
        const { userId, newPassword } = body;
        if (typeof userId !== 'string' || !userId.trim() || userId.includes('/') || typeof newPassword !== 'string' || !newPassword) {
            return res.status(400).json({ error: 'Missing userId or newPassword' });
        }

        const cleanPassword = String(newPassword).trim();
        if (cleanPassword.length < 6 || cleanPassword.length > 4096) {
            return res.status(400).json({ error: 'Password must be between 6 and 4096 characters' });
        }

        const auth = await authenticateRequest(req);
        if (!auth.ok) return sendAuthError(res, auth);
        const admin = auth.admin || getAdmin();
        const db = getDb();
        if (!admin || !db) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const actorSnap = await db.collection('users').doc(auth.user.uid).get();
        if (!actorSnap.exists) return res.status(403).json({ error: 'Your staff account no longer exists' });
        if (auth.user.uid !== userId) {
            // The admin screen grants this action to users with users:admin,
            // while custom claims only carry the global-admin flag. Check the
            // current Firestore profile so scoped admins are authorized and
            // changes to their permissions take effect without waiting for a
            // new ID token.
            const actor = actorSnap.data();
            const canManageUsers = actor?.permissions?.users === 'admin';
            if (actor?.isAdmin !== true && !canManageUsers) {
                return res.status(403).json({ error: 'Not authorized to change this password' });
            }
        }

        const userDoc = auth.user.uid === userId ? actorSnap : await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        // Update Firebase Auth password
        try {
            await admin.auth().updateUser(userId, { password: cleanPassword });
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                // Create Firebase Auth user with this password
                const userData = userDoc.data();
                await admin.auth().createUser({
                    uid: userId,
                    email: userData.email || `${userId}@crwi.placeholder`,
                    displayName: userData.name || userData.username,
                    password: cleanPassword,
                    emailVerified: true
                });
            } else {
                throw err;
            }
        }

        // Remove plaintext password from Firestore
        await db.collection('users').doc(userId).update({
            password: admin.firestore.FieldValue.delete(),
            passwordSetupRequired: false,
            authMigrated: true
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('auth-set-password error:', error);
        if (error?.code === 'auth/invalid-password' || error?.code === 'auth/password-does-not-meet-requirements') {
            return res.status(400).json({ error: 'Password must be at least 6 characters and meet the account password policy.' });
        }
        if (error?.code === 'auth/email-already-exists') {
            return res.status(409).json({ error: 'This staff email already belongs to another Firebase account.' });
        }
        if (error?.code === 'auth/invalid-email') {
            return res.status(400).json({ error: 'The staff profile contains an invalid email address.' });
        }
        const message = req?.localDevRequest === true
            ? String(error?.message || error?.code || 'Internal server error')
            : 'Internal server error';
        return res.status(500).json({ error: message });
    }
};
