// api/_auth-login.js — Vercel Serverless
// Receives username/email + password, returns a Firebase Auth custom token.
// The client never sees other users' passwords — all comparison happens here.

const { getAdmin, getDb } = require('./_firebase-admin.js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { identifier, password } = req.body || {};
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Missing identifier or password' });
        }

        const admin = getAdmin();
        const db = getDb();
        if (!admin || !db) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const cleanIdentifier = String(identifier).trim().toLowerCase();
        const cleanPassword = String(password).trim();

        // Find user by username or email
        const usersRef = db.collection('users');
        let userDoc = null;

        // Try username match first
        const usernameQuery = await usersRef.where('username', '==', cleanIdentifier).limit(1).get();
        if (!usernameQuery.empty) {
            userDoc = usernameQuery.docs[0];
        }

        // Try email match if no username match
        if (!userDoc) {
            const emailQuery = await usersRef.where('email', '==', cleanIdentifier).limit(1).get();
            if (!emailQuery.empty) {
                userDoc = emailQuery.docs[0];
            }
        }

        if (!userDoc) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userData = userDoc.data();
        const uid = userDoc.id;

        // Compare password (existing plaintext — will be removed after migration)
        const storedPassword = String(userData.password || '').trim();
        if (storedPassword !== cleanPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Ensure Firebase Auth user exists (getUser/createUser side effects)
        try {
            await admin.auth().getUser(uid);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                // Create Firebase Auth user
                await admin.auth().createUser({
                    uid: uid,
                    email: userData.email || `${uid}@crwi.placeholder`,
                    displayName: userData.name || userData.username,
                    emailVerified: true
                });
            } else {
                throw err;
            }
        }

        // Set custom claims (role, isAdmin)
        const claims = {
            role: userData.role || 'Employee',
            isAdmin: userData.isAdmin === true
        };
        await admin.auth().setCustomUserClaims(uid, claims);

        // Create custom token
        const customToken = await admin.auth().createCustomToken(uid, claims);

        return res.status(200).json({
            customToken,
            user: {
                id: uid,
                name: userData.name,
                username: userData.username,
                email: userData.email,
                role: userData.role,
                isAdmin: userData.isAdmin,
                avatar: userData.avatar,
                permissions: userData.permissions
            }
        });
    } catch (error) {
        console.error('auth-login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
