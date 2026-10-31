import { getDb } from './_firebase-admin.js';
import { authenticateRequest, sendAuthError } from './_api-auth.js';
import { canManageStaff, isFormerStaff, formerStaffIds, filterFormerStaffRecords } from '../js/utils/staff-employment.js';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const localCursorKey = randomBytes(32);
function cursorKey() {
    const secret = process.env.STAFF_DATA_CURSOR_SECRET || process.env.FIREBASE_SERVICE_ACCOUNT;
    return secret ? createHash('sha256').update(`staff-data-pagination:${secret}`).digest() : localCursorKey;
}
function cursorContext(query, uid) {
    return JSON.stringify([uid, query.collection, query.filters, query.orderBy, query.includeFormer]);
}
export function encodeStaffCursor(id, query, uid) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', cursorKey(), iv);
    cipher.setAAD(Buffer.from(cursorContext(query, uid)));
    const encrypted = Buffer.concat([cipher.update(id, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
export function decodeStaffCursor(token, query, uid) {
    const bytes = Buffer.from(token, 'base64url');
    const cipher = createDecipheriv('aes-256-gcm', cursorKey(), bytes.subarray(0, 12));
    cipher.setAAD(Buffer.from(cursorContext(query, uid)));
    cipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8');
}

export const STAFF_DATA_COLLECTIONS = new Set(['users', 'user_private', 'attendance', 'leaves', 'minutes', 'salaries',
    'staff_messages', 'work_plans', 'location_audits', 'task_activity_events', 'daily_standups', 'journey_reflections',
    'meetings', 'birthday_people', 'hero_selections', 'daily_summaries', 'events']);
const PRIVATE_PROFILE_FIELDS = ['password', 'authMigrated', 'activeSessions', 'activeSessionToken', 'activeSessionStartedAt',
    'baseSalary', 'otherAllowances', 'providentFund', 'professionalTax', 'loanAdvance', 'tdsPercent', 'bankName', 'bankAccount',
    'bankIfsc', 'accountNumber', 'ifsc', 'pan', 'PAN', 'uan', 'UAN', 'notifications', 'telegramChatId'];

export function validateStaffRead(body) {
    if (!body || !STAFF_DATA_COLLECTIONS.has(body.collection)) throw new Error('Unsupported staff collection.');
    if (body.id !== undefined && (typeof body.id !== 'string' || !body.id || body.id.includes('/') || body.id.length > 500)) throw new Error('Invalid record id.');
    const filters = body.filters || [];
    if (!Array.isArray(filters) || filters.length > 10) throw new Error('Too many filters.');
    for (const filter of filters) {
        if (!/^[A-Za-z_][A-Za-z0-9_.]{0,100}$/.test(filter.field || '') || !['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in', 'array-contains', 'array-contains-any'].includes(filter.operator)) throw new Error('Invalid staff query.');
        if (['in', 'not-in', 'array-contains-any'].includes(filter.operator) && (!Array.isArray(filter.value) || !filter.value.length || filter.value.length > 30)) throw new Error('Invalid query values.');
    }
    const orderBy = body.orderBy || [];
    if (!Array.isArray(orderBy) || orderBy.length > 3 || orderBy.some(order => !/^[A-Za-z_][A-Za-z0-9_.]{0,100}$/.test(order.field || '') || !['asc', 'desc'].includes(order.direction || 'asc'))) throw new Error('Invalid query ordering.');
    if (body.cursor !== undefined && (typeof body.cursor !== 'string' || !/^[A-Za-z0-9_-]+$/.test(body.cursor) || body.cursor.length > 2048)) throw new Error('Invalid query cursor.');
    return { collection: body.collection, id: body.id, filters, orderBy, includeFormer: body.includeFormer === true,
        cursor: body.cursor, pageSize: Math.max(1, Math.min(400, Number(body.pageSize) || 200)) };
}

export function visibleStaffRows(collection, rows, users, viewer, includeFormer = false) {
    const historyAllowed = includeFormer && canManageStaff(viewer);
    let visible = historyAllowed ? rows : filterFormerStaffRecords(collection, rows, formerStaffIds(users));
    if (!historyAllowed) {
        const activeIds = new Set(users.filter(user => !isFormerStaff(user)).map(user => String(user.id)));
        const personal = new Set(['users', 'user_private', 'attendance', 'leaves', 'minutes', 'salaries', 'staff_messages', 'work_plans', 'location_audits', 'task_activity_events', 'daily_standups', 'journey_reflections', 'meetings']);
        visible = visible.filter(row => {
            if (!personal.has(collection)) return true;
            if (['users', 'user_private'].includes(collection)) return activeIds.has(String(row.id));
            if (collection === 'staff_messages') return activeIds.has(String(row.fromId)) && activeIds.has(String(row.toId));
            const owner = collection === 'minutes' ? row.createdBy : collection === 'meetings' ? row.createdById
                : collection === 'work_plans' ? row.userId : row.user_id || row.userId || row.staffId || row.ownerId || row.createdById || row.createdBy;
            return owner === 'annual_shared' || activeIds.has(String(owner));
        });
        const formerNames = new Set(users.filter(isFormerStaff).map(user => String(user.name || '').trim()).filter(Boolean));
        visible = visible.filter(row => !(collection === 'meetings' && !row.createdById && (!row.author || formerNames.has(row.author))));
        if (collection === 'daily_summaries') {
            const signature = users.filter(user => !isFormerStaff(user)).map(user => `${user.id}:false`).sort().join('|');
            visible = visible.filter(row => row.staffEmploymentSignature === signature);
        }
    }
    if (collection === 'minutes') visible = visible.map(row => {
        const detailsAllowed = historyAllowed || row.createdBy === viewer.id || viewer.isAdmin || ['admin', 'view'].includes(viewer.permissions?.minutes)
            || (row.allowedViewers || []).includes(viewer.id) || (row.attendeeIds || []).includes(viewer.id)
            || (row.actionItems || []).some(task => task.assignedTo === viewer.id);
        if (detailsAllowed) return row;
        return { id: row.id, title: row.title, date: row.date, createdBy: row.createdBy, createdByName: row.createdByName,
            accessRequests: (row.accessRequests || []).filter(item => item.userId === viewer.id), detailsRestricted: true };
    });
    if (collection === 'users') visible = visible.map(row => {
        const clean = { ...row };
        const privilegedPayroll = viewer.isAdmin || viewer.permissions?.reports === 'admin';
        const financial = new Set(['baseSalary', 'otherAllowances', 'providentFund', 'professionalTax', 'loanAdvance', 'tdsPercent', 'bankName', 'bankAccount', 'bankIfsc', 'accountNumber', 'ifsc', 'pan', 'PAN', 'uan', 'UAN']);
        PRIVATE_PROFILE_FIELDS.forEach(field => {
            const permitted = row.id === viewer.id || (field === 'notifications' && canManageStaff(viewer)) || financial.has(field) && privilegedPayroll;
            if (!permitted || field === 'password') delete clean[field];
        });
        return clean;
    });
    return visible;
}

export default async function handler(req, res) {
    res.setHeader?.('Cache-Control', 'private, no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let query;
    try { query = validateStaffRead(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
    const auth = await authenticateRequest(req);
    if (!auth.ok) return sendAuthError(res, auth);
    const viewer = { ...auth.user, id: auth.user.uid };
    if (query.includeFormer && !canManageStaff(viewer)) return res.status(403).json({ error: 'Administrator access is required for former-staff history.' });
    if (['salaries', 'user_private'].includes(query.collection) && viewer.isAdmin !== true && viewer.permissions?.reports !== 'admin') return res.status(403).json({ error: 'Payroll access is required.' });
    try {
        const db = getDb();
        const roster = await db.collection('users').get();
        const users = roster.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        let rows, nextCursor = null;
        if (query.id) {
            const doc = await db.collection(query.collection).doc(query.id).get();
            rows = doc.exists ? [{ ...doc.data(), id: doc.id }] : [];
        } else {
            let ref = db.collection(query.collection);
            for (const filter of query.filters) ref = ref.where(filter.field, filter.operator, filter.value);
            for (const order of query.orderBy) ref = ref.orderBy(order.field, order.direction || 'asc');
            if (query.cursor) {
                let cursorId;
                try { cursorId = decodeStaffCursor(query.cursor, query, viewer.id); }
                catch { return res.status(409).json({ error: 'The result expired or changed. Refresh and try again.' }); }
                const cursor = await db.collection(query.collection).doc(cursorId).get();
                if (!cursor.exists) return res.status(409).json({ error: 'The result changed. Refresh and try again.' });
                ref = ref.startAfter(cursor);
            }
            const snapshot = await ref.limit(query.pageSize).get();
            rows = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            if (snapshot.docs.length === query.pageSize) nextCursor = encodeStaffCursor(snapshot.docs.at(-1).id, query, viewer.id);
        }
        const data = visibleStaffRows(query.collection, rows, users, viewer, query.includeFormer);
        return res.status(200).json({ data, nextCursor });
    } catch (error) {
        console.error('Protected staff read failed:', error.code || error.message);
        return res.status(503).json({ error: 'Staff records could not be loaded. Please retry or narrow the selected period.' });
    }
}
