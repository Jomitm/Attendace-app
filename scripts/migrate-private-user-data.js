// Move payroll and bank fields from broadly readable users docs to user_private.
// Dry-run is the default. Applying requires an explicit staging project match.
// Usage: set FIREBASE_SERVICE_ACCOUNT and STAGING_FIREBASE_PROJECT_ID, then
//        node scripts/migrate-private-user-data.js --apply

const admin = require('firebase-admin');

const PRIVATE_FIELDS = [
    'baseSalary', 'otherAllowances', 'providentFund', 'professionalTax', 'loanAdvance',
    'tdsPercent', 'bankName', 'bankAccount', 'bankIfsc', 'accountNumber', 'ifsc',
    'pan', 'PAN', 'uan', 'UAN'
];

function requireStagingCredentials() {
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
}

async function main() {
    requireStagingCredentials();
    const apply = process.argv.includes('--apply');
    const db = admin.firestore();
    const snapshot = await db.collection('users').get();
    const changes = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        const privateData = { id: doc.id };
        const publicUpdates = {};
        for (const field of PRIVATE_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                privateData[field] = data[field];
                publicUpdates[field] = admin.firestore.FieldValue.delete();
            }
        }
        return { ref: doc.ref, id: doc.id, data, privateData, publicUpdates };
    });

    console.log(`Mode: ${apply ? 'APPLY (staging)' : 'DRY RUN'}`);
    console.log(`Users scanned: ${snapshot.size}; records to migrate: ${changes.length}`);
    if (!apply) {
        console.log('No data changed. Add --apply only after reviewing this staging dry run.');
        return;
    }

    let batch = db.batch();
    let operations = 0;
    for (const row of changes) {
        if (Object.keys(row.privateData).length > 1) {
            batch.set(db.collection('user_private').doc(row.id), row.privateData, { merge: true });
            operations++;
        }
        if (Object.keys(row.publicUpdates).length > 0) {
            batch.update(row.ref, row.publicUpdates);
            operations++;
        }
        batch.set(db.collection('user_access').doc(row.id), {
            permissions: { ...(row.data.permissions || {}), ...(row.data.isAdmin === true ? { reports: 'admin' } : {}) }
        }, { merge: true });
        operations++;
        if (operations >= 400) {
            await batch.commit();
            batch = db.batch();
            operations = 0;
        }
    }
    if (operations) await batch.commit();
    console.log(`Migrated ${changes.length} payroll records. No field values were logged.`);
}

main().catch((error) => {
    console.error(`Migration stopped: ${error.message}`);
    process.exitCode = 1;
});
