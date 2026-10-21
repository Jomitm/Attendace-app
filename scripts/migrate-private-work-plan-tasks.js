// Move legacy isPrivate work-plan task bodies into private_work_plan_tasks.
// Dry-run is the default. --apply requires a service account whose project ID
// exactly matches STAGING_FIREBASE_PROJECT_ID.
// Usage: node scripts/migrate-private-work-plan-tasks.js [--apply]

const crypto = require('node:crypto');
const admin = require('firebase-admin');

function initializeStagingAdmin() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const expectedProjectId = String(process.env.STAGING_FIREBASE_PROJECT_ID || '').trim();
    if (!raw || !expectedProjectId) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT and STAGING_FIREBASE_PROJECT_ID are required.');
    }
    const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!serviceAccount.project_id || serviceAccount.project_id !== expectedProjectId) {
        throw new Error('Service account project does not match STAGING_FIREBASE_PROJECT_ID.');
    }
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: expectedProjectId });
    return expectedProjectId;
}

function ownerFor(plan) {
    return String(plan?.userId === 'annual_shared' ? plan?.createdById : plan?.userId || '').trim();
}

async function main() {
    const projectId = initializeStagingAdmin();
    const apply = process.argv.includes('--apply');
    const db = admin.firestore();
    const snapshot = await db.collection('work_plans').get();
    const plansToMigrate = [];
    let taskCount = 0;

    for (const doc of snapshot.docs) {
        const plan = doc.data() || {};
        const tasks = Array.isArray(plan.plans) ? plan.plans : [];
        const ownerId = ownerFor(plan);
        if (tasks.some((task) => task?.isPrivate === true && !task.privateTaskId) && !ownerId) {
            throw new Error(`Plan ${doc.id} has private tasks but no owner; migration stopped before writes.`);
        }
        const privateTasks = tasks.filter((task) => task?.isPrivate === true && !task.privateTaskId);
        if (privateTasks.length) {
            plansToMigrate.push({ ref: doc.ref, id: doc.id, plan, privateTasks });
            taskCount += privateTasks.length;
        }
    }

    console.log(`Target project: ${projectId}`);
    console.log(`Mode: ${apply ? 'APPLY (staging)' : 'DRY RUN'}`);
    console.log(`Work plans scanned: ${snapshot.size}; plans to update: ${plansToMigrate.length}; private tasks to move: ${taskCount}`);
    if (!apply) {
        console.log('No data changed. Review this staging dry run before using --apply.');
        return;
    }

    for (const row of plansToMigrate) {
        const ownerId = ownerFor(row.plan);
        const migratedByIndex = new Map();
        let batch = db.batch();
        let operations = 0;
        for (let index = 0; index < row.plan.plans.length; index += 1) {
            const task = row.plan.plans[index];
            if (task?.isPrivate !== true || task.privateTaskId) continue;
            const id = crypto.randomUUID();
            batch.create(db.collection('private_work_plan_tasks').doc(id), {
                id,
                ownerId,
                createdById: ownerId,
                assignedTo: String(task.assignedTo || '').trim(),
                planId: row.id,
                taskIndex: index,
                task: { ...task }
            });
            migratedByIndex.set(index, {
                id: task.id || id,
                privateTaskId: id,
                isPrivate: true,
                ...(task.assignedTo ? { assignedTo: String(task.assignedTo) } : {})
            });
            operations += 1;
            if (operations >= 400) {
                await batch.commit();
                batch = db.batch();
                operations = 0;
            }
        }
        const plans = row.plan.plans.map((task, index) => migratedByIndex.get(index) || task);
        batch.update(row.ref, { plans });
        await batch.commit();
    }
    console.log(`Migrated ${taskCount} private tasks across ${plansToMigrate.length} work plans. Task contents were not logged.`);
}

main().catch((error) => {
    console.error(`Migration stopped: ${error.message}`);
    process.exitCode = 1;
});
