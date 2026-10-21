// Move legacy Firestore passwords into Firebase Auth.
// Dry-run by default. Applying requires explicit staging project credentials.
// Usage: set FIREBASE_SERVICE_ACCOUNT and STAGING_FIREBASE_PROJECT_ID, then
//        node scripts/migrate-passwords.js --apply

const admin = require('firebase-admin');

function initializeStaging() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const expectedProjectId = String(process.env.STAGING_FIREBASE_PROJECT_ID || '').trim();
    if (!raw || !expectedProjectId) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT and STAGING_FIREBASE_PROJECT_ID are required.');
    }
    const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!serviceAccount.project_id || serviceAccount.project_id !== expectedProjectId) {
        throw new Error('Service account project does not match STAGING_FIREBASE_PROJECT_ID.');
    }
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return { db: admin.firestore(), auth: admin.auth() };
}

async function migrate() {
    const apply = process.argv.includes('--apply');
    const { db, auth } = initializeStaging();
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs;
    const eligible = users.filter((doc) => doc.data()?.password && doc.data()?.authMigrated !== true);

    console.log(`Mode: ${apply ? 'APPLY (staging)' : 'DRY RUN'}`);
    console.log(`Users scanned: ${users.length}; credentials to migrate: ${eligible.length}`);
    if (!apply) {
        console.log('No data changed. Add --apply only after reviewing this staging dry run.');
        return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    for (const userDoc of users) {
        const uid = userDoc.id;
        const data = userDoc.data() || {};
        if (data.authMigrated === true || !data.password) {
            skipped++;
            continue;
        }
        try {
            try {
                await auth.getUser(uid);
                await auth.updateUser(uid, { password: data.password });
            } catch (err) {
                if (err.code !== 'auth/user-not-found') throw err;
                await auth.createUser({
                    uid,
                    email: data.email || `${uid}@crwi.placeholder`,
                    displayName: data.name || data.username,
                    password: data.password,
                    emailVerified: true
                });
            }

            await auth.setCustomUserClaims(uid, {
                role: data.role || 'Employee',
                isAdmin: data.isAdmin === true,
                reportsAdmin: data.isAdmin === true || data.permissions?.reports === 'admin'
            });
            await userDoc.ref.update({
                password: admin.firestore.FieldValue.delete(),
                authMigrated: true,
                authMigratedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            migrated++;
        } catch (err) {
            console.error(`Migration failed for user ${uid}: ${err.message}`);
            errors++;
        }
    }

    console.log(`Migrated: ${migrated}; skipped: ${skipped}; errors: ${errors}`);
    if (errors > 0) process.exitCode = 1;
}

migrate().catch((err) => {
    console.error(`Migration stopped: ${err.message}`);
    process.exitCode = 1;
});
