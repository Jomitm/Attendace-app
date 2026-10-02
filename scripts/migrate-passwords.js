// scripts/migrate-passwords.js
// ONE-TIME migration: creates Firebase Auth users and removes plaintext passwords.
//
// Usage:
//   1. Set FIREBASE_SERVICE_ACCOUNT env var (JSON string of service account)
//   2. Run: node scripts/migrate-passwords.js
//
// This script is safe to run multiple times (idempotent).

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        console.error('FIREBASE_SERVICE_ACCOUNT environment variable is required.');
        console.error('Set it to the JSON string of your Firebase service account.');
        process.exit(1);
    }
    const parsed = typeof serviceAccount === 'string' ? JSON.parse(serviceAccount) : serviceAccount;
    admin.initializeApp({ credential: admin.credential.cert(parsed) });
}

const db = admin.firestore();
const auth = admin.auth();

async function migrate() {
    console.log('Starting password migration...\n');

    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs;
    console.log(`Found ${users.length} users in Firestore.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of users) {
        const uid = userDoc.id;
        const data = userDoc.data();
        const username = data.username || '(no username)';
        const hasPassword = !!data.password;
        const alreadyMigrated = data.authMigrated === true;

        if (alreadyMigrated) {
            console.log(`  SKIP  ${username} (${uid}) — already migrated`);
            skipped++;
            continue;
        }

        if (!hasPassword) {
            console.log(`  SKIP  ${username} (${uid}) — no password to migrate`);
            skipped++;
            continue;
        }

        try {
            // Create or update Firebase Auth user
            try {
                await auth.getUser(uid);
                // User exists in Auth — update password
                await auth.updateUser(uid, { password: data.password });
            } catch (err) {
                if (err.code === 'auth/user-not-found') {
                    // Create new Auth user
                    await auth.createUser({
                        uid: uid,
                        email: data.email || `${uid}@crwi.placeholder`,
                        displayName: data.name || data.username,
                        password: data.password,
                        emailVerified: true
                    });
                } else {
                    throw err;
                }
            }

            // Set custom claims
            await auth.setCustomUserClaims(uid, {
                role: data.role || 'Employee',
                isAdmin: data.isAdmin === true
            });

            // Remove plaintext password from Firestore
            await userDoc.ref.update({
                password: admin.firestore.FieldValue.delete(),
                authMigrated: true,
                authMigratedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`  OK    ${username} (${uid}) — migrated`);
            migrated++;
        } catch (err) {
            console.error(`  ERROR ${username} (${uid}) — ${err.message}`);
            errors++;
        }
    }

    console.log('\nMigration complete.');
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log(`  Errors:   ${errors}`);

    if (errors > 0) {
        console.log('\nSome users had errors. Check the output above and fix them manually.');
        process.exit(1);
    }
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
