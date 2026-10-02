// api/auth-set-password.js — Vercel Serverless
// Changes a user's password server-side. Removes plaintext from Firestore.

const { getAdmin, getDb } = require('./_firebase-admin.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, newPassword, idToken } = req.body || {};
        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'Missing userId or newPassword' });
        }

        const cleanPassword = String(newPassword).trim();
        if (cleanPassword.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        const admin = getAdmin();
        const db = getDb();
        if (!admin || !db) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Verify the requester is the same user or an admin
        if (idToken) {
            try {
                const decoded = await admin.auth().verifyIdToken(idToken);
                if (decoded.uid !== userId && decoded.isAdmin !== true) {
                    return res.status(403).json({ error: 'Not authorized to change this password' });
                }
            } catch {
                return res.status(401).json({ error: 'Invalid authentication token' });
            }
        }

        // Update Firebase Auth password
        try {
            await admin.auth().updateUser(userId, { password: cleanPassword });
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                // Create Firebase Auth user with this password
                const userDoc = await db.collection('users').doc(userId).get();
                if (!userDoc.exists) {
                    return res.status(404).json({ error: 'User not found' });
                }
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
            passwordSetupRequired: false
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('auth-set-password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
