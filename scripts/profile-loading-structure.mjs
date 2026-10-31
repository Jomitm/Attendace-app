// Execute production methods with empty/sample records. No real credentials or network.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { Analytics } from '../js/modules/analytics.js';
import { Database } from '../js/modules/db.js';
import { AttendanceService } from '../js/services/attendance-service.js';
const calls = [];
const analytics = new Analytics();
analytics.db = { async queryMany(collection, filters) { calls.push({ collection, filters }); return []; } };
await Promise.all([analytics.getUserMonthlyStats('sample-staff'), analytics.getUserYearlyStats('sample-staff')]);
const attendance = calls.filter(call => call.collection === 'attendance');
const periods = [...new Set(attendance.map(call => JSON.stringify(call.filters)))].map(value => JSON.parse(value));
const require = createRequire(import.meta.url);
const counts = { tokenVerifications: 0, profileReads: 0, rosterReads: 0, requestedCollectionReads: 0 };
const profile = { name: 'Sample staff', permissions: {}, employmentStatus: 'active' };
const db = { collection(name) {
    const ref = {
        where() { return ref; }, orderBy() { return ref; }, limit() { return ref; },
        doc(id) { return { async get() { counts.profileReads++; return { exists: true, id, data: () => profile }; } }; },
        async get() {
            if (name === 'users') { counts.rosterReads++; return { docs: [{ id: 'sample-staff', data: () => profile }] }; }
            counts.requestedCollectionReads++; return { docs: [] };
        }
    }; return ref;
} };
const helper = require.resolve('../api/_firebase-admin.js');
require.cache[helper] = { id: helper, filename: helper, loaded: true, exports: { getDb: () => db,
    getAdmin: () => ({ auth: () => ({ async verifyIdToken() { counts.tokenVerifications++; return { uid: 'sample-staff' }; } }) }) } };
const { default: staffRead } = await import('../api/_staff-data.js');
for (let i = 0; i < 3; i++) {
    let status = 200;
    await staffRead({ method: 'POST', headers: { authorization: 'Bearer sample-fixture-token' }, body: { collection: 'attendance', filters: [{ field: 'date', operator: '>=', value: '2026-10-01' }] } },
        { setHeader() {}, status(value) { status = value; return this; }, json() { if (status !== 200) throw new Error(`Fixture request failed: ${status}`); return this; } });
}
const emptyRangeCalls = [];
globalThis.window = { AppDB: {
    queryMany: async () => { emptyRangeCalls.push('range query'); return []; },
    getAll: async () => { emptyRangeCalls.push('whole attendance collection'); return []; },
    getCacheKey: () => 'sample-empty-range', getCached: async (_key, _ttl, load) => load()
} };
await new AttendanceService().getByDateRange('2026-10-01', '2026-10-31');
const database = new Database();
window.AppFirebaseAuth = { currentUser: { uid: 'sample-staff', getIdToken: async () => 'sample-fixture-token' } };
window.location = { hash: '#dashboard' };
let gatewayFetches = 0;
globalThis.fetch = async () => { gatewayFetches++; return { ok: true, json: async () => ({ data: [], nextCursor: null }) }; };
await database.readStaffData('attendance');
const telemetry = database.getReadTelemetry();
const missingPlanLookups = { groupedQueries: 0, individualReads: 0 };
const batchDatabase = new Database();
batchDatabase.queryMany = async () => { missingPlanLookups.groupedQueries++; return []; };
batchDatabase.get = async () => { missingPlanLookups.individualReads++; return null; };
await batchDatabase.getManyByIds('work_plans', Array.from({ length: 14 }, (_, index) => `sample_missing_plan_${index}`));
const report = { evidence: 'Production methods executed using empty or synthetic records; counts, not live latency',
    monthlyAndYearly: { logicalAttendanceCalls: attendance.length, uniqueQueryShapes: periods.length, ownerFilteredCalls: attendance.filter(call => call.filters.some(filter => ['userId', 'user_id'].includes(filter.field))).length, queries: periods },
    threeProtectedReadRequests: counts, emptyDateRange: emptyRangeCalls, fourteenMissingPlanDocuments: missingPlanLookups,
    gatewayTelemetry: { actualFixtureFetches: gatewayFetches, trackedGetAll: telemetry.getAll, trackedQueryMany: telemetry.queryMany, trackedDocuments: telemetry.docsRead } };
writeFileSync(new URL('../docs/performance-structure-current.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
