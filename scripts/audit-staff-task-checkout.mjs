// Read-only production audit. Saves only account/plan metadata; never task text,
// passwords, session tokens, or coordinates. No Firebase writes or logins.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
import { getAdmin, getDb } from '../api/_firebase-admin.js';
import { isFormerStaff } from '../api/_staff-employment-core.js';

Object.assign(process.env, loadEnv('production', process.cwd(), ''));
const admin = getAdmin();
const db = getDb();
if (!admin || !db) throw new Error('Configured Attendance database credentials are unavailable.');
const projectId = admin.app().options.credential.projectId;
if (projectId !== 'crwiattendance') throw new Error('Audit stopped: this is not the Attendance database.');
const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const timeout = setTimeout(() => {
    console.error('Audit timed out. No production records were changed.');
    process.exit(2);
}, 45000);
try {
    const [roster, plans, liveRules] = await Promise.all([
        db.collection('users').select('name', 'role', 'isAdmin', 'permissions', 'status', 'employmentStatus', 'lastCheckIn', 'currentLocation').get(),
        db.collection('work_plans').where('date', '>=', today.slice(0, 7) + '-01').select('userId', 'date', 'createdById').get(),
        admin.securityRules().getFirestoreRuleset()
    ]);
    const source = liveRules.source.map(file => file.content).join('\n');
    const normalizeRules = text => text.replace(/\r\n/g, '\n').trim();
    const localSource = readFileSync('firestore.rules', 'utf8');
    const allPlans = plans.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const profiles = roster.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const active = profiles.filter(user => !isFormerStaff(user));
    const staff = active.map(user => {
        const own = allPlans.filter(plan => plan.userId === user.id && plan.date <= today);
        const hasPlanToday = own.some(plan => plan.id === `plan_${user.id}_${today}`);
        const historyAccess = user.isAdmin === true || user.permissions?.users === 'admin';
        const checkedIn = user.status === 'in';
        const location = user.currentLocation;
        const validCheckInLocation = location?.lat !== null && location?.lat !== undefined
            && location?.lng !== null && location?.lng !== undefined
            && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng));
        return {
            id: user.id, name: user.name || user.id, role: user.role || 'Employee',
            isAdmin: user.isAdmin === true, usersAdmin: user.permissions?.users === 'admin',
            status: user.status || 'out', hasPlanToday,
            missingPlanReadRisk: !historyAccess,
            blockedOnMissingPlanToday: !hasPlanToday && !historyAccess,
            recentPlans: own.length,
            plansCreatedByOthers: own.filter(plan => plan.createdById && plan.createdById !== user.id).length,
            checkedIn,
            invalidCheckInTimestamp: checkedIn && !(Number(user.lastCheckIn) > 0),
            missingCheckInLocation: checkedIn && !validCheckInLocation
        };
    }).sort((a, b) => a.name.localeCompare(b.name));
    const report = {
        projectId, checkedAt: new Date().toISOString(), today,
        liveRulesCreatedAt: liveRules.createTime,
        liveRulesSha256: createHash('sha256').update(normalizeRules(source)).digest('hex'),
        liveRulesMatchLocal: normalizeRules(source) === normalizeRules(localSource),
        totalAccounts: profiles.length, activeStaff: staff.length,
        formerAccountsExcluded: profiles.length - active.length,
        missingPlanRiskAccounts: staff.filter(user => user.missingPlanReadRisk).length,
        blockedOnMissingPlanToday: staff.filter(user => user.blockedOnMissingPlanToday).length,
        checkedInStaff: staff.filter(user => user.checkedIn).length,
        checkedInDataIssues: staff.filter(user => user.invalidCheckInTimestamp || user.missingCheckInLocation).length,
        staff
    };
    const destination = resolve('test-results/staff-task-checkout/audit.json');
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    console.log('Read-only audit saved to ' + destination);
} finally {
    clearTimeout(timeout);
    await db.terminate();
}
