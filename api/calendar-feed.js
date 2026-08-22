const crypto = require('crypto');
const { getDb } = require('./_firebase-admin');

const SECRET = process.env.CALENDAR_FEED_SECRET || 'crwi-cal-feed-fallback-change-me';
const ALGO = 'sha256';

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const [payload, sig] = decoded.split('.');
        if (!payload || !sig) return null;
        const expected = crypto.createHmac(ALGO, SECRET).update(payload).digest('base64url');
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
        const data = JSON.parse(payload);
        if (data.exp && Date.now() > data.exp) return null;
        return data;
    } catch {
        return null;
    }
}

function pad2(n) { return String(n).padStart(2, '0'); }

function toICSDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

function toICSDateTime(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function escapeText(text) {
    return String(text || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/"/g, '\\"');
}

function foldLine(line) {
    const MAX = 75;
    if (Buffer.byteLength(line, 'utf8') <= MAX) return line;
    let result = '';
    let remaining = line;
    let first = true;
    while (remaining.length > 0) {
        const chunk = remaining.substring(0, first ? MAX : MAX - 1);
        remaining = remaining.substring(first ? MAX : MAX - 1);
        result += (first ? '' : '\r\n ') + chunk;
        first = false;
    }
    return result;
}

function buildEvent(ev) {
    if (!ev.dtstart || !ev.dtend) return null;

    const lines = ['BEGIN:VEVENT'];
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${toICSDateTime(new Date().toISOString())}`);

    if (ev.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${ev.dtstart}`);
        lines.push(`DTEND;VALUE=DATE:${ev.dtend}`);
    } else {
        lines.push(`DTSTART;TZID=Asia/Kolkata:${ev.dtstart}`);
        lines.push(`DTEND;TZID=Asia/Kolkata:${ev.dtend}`);
    }

    lines.push(`SUMMARY:${escapeText(ev.summary)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
    lines.push('TRANSP:OPAQUE');

    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeText(ev.summary)}`);
    lines.push('TRIGGER:-PT15M');
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
    return lines.map(l => foldLine(l)).join('\r\n');
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    const token = req.query.token;
    if (!token) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Missing token. Generate a calendar feed URL from your CRWI profile.');
        return;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Invalid or expired token. Generate a new calendar feed URL from your CRWI profile.');
        return;
    }

    const db = getDb();
    if (!db) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Calendar feed unavailable. Firebase not configured on server.');
        return;
    }

    try {
        const userId = payload.userId;
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAhead = new Date(now);
        thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

        const startDate = sevenDaysAgo.toISOString().slice(0, 10);
        const endDate = thirtyDaysAhead.toISOString().slice(0, 10);

        const [workPlansSnap, leavesSnap, eventsSnap, usersSnap] = await Promise.all([
            db.collection('work_plans')
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .get()
                .catch(() => ({ docs: [] })),
            db.collection('leaves')
                .where('status', '==', 'approved')
                .get()
                .catch(() => ({ docs: [] })),
            db.collection('events')
                .get()
                .catch(() => ({ docs: [] })),
            db.collection('users')
                .doc(userId)
                .get()
                .catch(() => ({ data: () => ({}) }))
        ]);

        const userName = (usersSnap.data ? usersSnap.data() : {}).name || 'Staff';
        const events = [];
        let uidCounter = 0;

        const makeUID = () => `crwi-${userId}-${Date.now()}-${uidCounter++}@crwi-attendance`;

        workPlansSnap.docs.forEach(doc => {
            const plan = doc.data();
            if (plan.userId !== userId || !plan.plans || !plan.plans.length) return;

            plan.plans.forEach(task => {
                if (!task.task) return;
                const taskTags = (task.tags || []).map(t => t.name).filter(Boolean);
                const subPlans = (task.subPlans || []).filter(Boolean);
                let desc = '';
                if (taskTags.length) desc += `Collaborators: ${taskTags.join(', ')}. `;
                if (subPlans.length) desc += `Sub-tasks: ${subPlans.join(', ')}. `;
                if (task.status) desc += `Status: ${task.status}.`;

                const dtstart = plan.date ? plan.date.replace(/-/g, '') : null;
                const dtend = (() => {
                    if (!plan.date) return null;
                    const d = new Date(plan.date);
                    d.setDate(d.getDate() + 1);
                    return d.toISOString().slice(0, 10).replace(/-/g, '');
                })();

                events.push({
                    uid: makeUID(),
                    summary: task.task,
                    description: desc.trim() || undefined,
                    dtstart,
                    dtend,
                    allDay: true
                });
            });
        });

        leavesSnap.docs.forEach(doc => {
            const leave = doc.data();
            if (leave.userId !== userId) return;
            const leaveType = leave.type || 'Leave';

            const dtstart = toICSDate(leave.startDate);
            const dtend = (() => {
                if (!leave.endDate) return null;
                const d = new Date(leave.endDate);
                d.setDate(d.getDate() + 1);
                return toICSDate(d.toISOString());
            })();

            if (dtstart && dtend) {
                events.push({
                    uid: makeUID(),
                    summary: `${userName} (${leaveType})`,
                    description: `Approved ${leaveType}. ${leave.reason || ''}`.trim(),
                    dtstart,
                    dtend,
                    allDay: true
                });
            }
        });

        eventsSnap.docs.forEach(doc => {
            const ev = doc.data();
            if (!ev.date) return;
            const isAllDay = !ev.startTime;

            if (isAllDay) {
                const dtstart = toICSDate(ev.date);
                const dtend = (() => {
                    const d = new Date(ev.date);
                    d.setDate(d.getDate() + 1);
                    return toICSDate(d.toISOString());
                })();
                if (dtstart && dtend) {
                    events.push({
                        uid: makeUID(),
                        summary: ev.title || 'Company Event',
                        description: ev.description || ev.details || undefined,
                        dtstart,
                        dtend,
                        allDay: true
                    });
                }
            } else {
                const startTime = ev.startTime || '09:00';
                const endTime = ev.endTime || '10:00';
                const dateClean = ev.date.replace(/-/g, '');
                events.push({
                    uid: makeUID(),
                    summary: ev.title || 'Company Event',
                    description: ev.description || ev.details || undefined,
                    dtstart: `${dateClean}T${startTime.replace(':', '')}00`,
                    dtend: `${dateClean}T${endTime.replace(':', '')}00`,
                    allDay: false
                });
            }
        });

        const calName = `CRWI - ${userName}`;
        const vtimezone = 'BEGIN:VTIMEZONE\r\nTZID:Asia/Kolkata\r\nBEGIN:STANDARD\r\nDTSTART:19700101T000000\r\nTZOFFSETFROM:+0530\r\nTZOFFSETTO:+0530\r\nTZNAME:IST\r\nEND:STANDARD\r\nEND:VTIMEZONE';

        const eventBlocks = events.map(ev => buildEvent(ev)).filter(Boolean);

        const calLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CRWI Attendance//EN',
            `X-WR-CALNAME:${calName}`,
            'X-WR-CALDESC:CRWI Attendance App Calendar Feed',
            'CALSCALE:GREGORIAN',
            vtimezone
        ];

        if (eventBlocks.length > 0) {
            calLines.push(...eventBlocks);
        } else {
            calLines.push('BEGIN:VEVENT');
            calLines.push(`UID:placeholder-${Date.now()}@crwi-attendance`);
            calLines.push(`DTSTAMP:${toICSDateTime(new Date().toISOString())}`);
            calLines.push(`DTSTART;VALUE=DATE:${toICSDate(now.toISOString())}`);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            calLines.push(`DTEND;VALUE=DATE:${toICSDate(tomorrow.toISOString())}`);
            calLines.push('SUMMARY:No events yet');
            calLines.push('END:VEVENT');
        }

        calLines.push('END:VCALENDAR');

        const ics = calLines.join('\r\n') + '\r\n';

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
        res.statusCode = 200;
        res.end(ics);
    } catch (err) {
        console.error('Calendar feed error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Failed to generate calendar feed. Please try again later.');
    }
};
