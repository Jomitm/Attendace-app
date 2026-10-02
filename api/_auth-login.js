// api/_auth-login.js — Vercel Serverless
// Receives username/email + password, returns a Firebase Auth custom token.
// The client never sees other users' passwords — all comparison happens here.

const { getAdmin, getDb } = require('./_firebase-admin.js');

// Public Firebase Web API key (same value as the index.html client config).
// Used only to verify passwords that auth-set-password migrated into
// Firebase Auth (it deletes the Firestore plaintext copy). Override with
// FIREBASE_WEB_API_KEY if the project key ever rotates.
const FIREBASE_WEB_API_KEY =
    process.env.FIREBASE_WEB_API_KEY || 'AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84';

const USER_FIELDS = ['username', 'email', 'password', 'name', 'role', 'isAdmin', 'avatar', 'permissions'];

// Case-insensitive username/email match. Firestore `==` is case-sensitive
// while identifiers arrive lowercased, so a plain query misses stored
// mixed-case values; this mirrors the old client-side login comparison.
function matchUserByIdentifier(entries, identifier) {
    const key = String(identifier || '').trim().toLowerCase();
    if (!key) return null;
    for (const entry of entries) {
        const data = (entry && entry.data) || {};
        const username = String(data.username || '').trim().toLowerCase();
        const email = String(data.email || '').trim().toLowerCase();
        if (username === key || email === key) return entry;
    }
    return null;
}

// Verify a password that only exists in Firebase Auth (migrated by
// auth-set-password). Returns true only when the Auth account both
// authenticates and belongs to this user id.
async function verifyPasswordWithFirebaseAuth(email, password, uid) {
    try {
        const res = await fetch(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
                FIREBASE_WEB_API_KEY,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, returnSecureToken: true })
            }
        );
        if (!res.ok) return false;
        const data = await res.json();
        return data.localId === uid;
    } catch {
        return false;
    }
}

async function handler(req, res) {
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
        const { identifier, password } = body;
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

        // Find user by username or email (case-insensitive — see helper).
        const snap = await db
            .collection('users')
            .select(...USER_FIELDS)
            .limit(5000)
            .get();
        const entries = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
        const match = matchUserByIdentifier(entries, cleanIdentifier);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userData = match.data;
        const uid = match.id;

        // Compare password. Plaintext copy in Firestore is the legacy path;
        // auth-set-password deletes it after migrating the password into
        // Firebase Auth, so an empty stored password falls back to verifying
        // against Firebase Auth directly.
        const storedPassword = String(userData.password || '').trim();
        let passwordOk = storedPassword !== '' && storedPassword === cleanPassword;
        if (!passwordOk && storedPassword === '') {
            passwordOk = await verifyPasswordWithFirebaseAuth(
                userData.email || `${uid}@crwi.placeholder`,
                cleanPassword,
                uid
            );
        }
        if (!passwordOk) {
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
}

module.exports = handler;
module.exports.matchUserByIdentifier = matchUserByIdentifier;
module.exports.verifyPasswordWithFirebaseAuth = verifyPasswordWithFirebaseAuth;
