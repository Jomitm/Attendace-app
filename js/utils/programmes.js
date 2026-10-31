// Shared by the browser, API and Outlook feed. Date-only values are India calendar dates.
export const PROGRAMME_TIME_ZONE = 'Asia/Kolkata';
export function programmeToday(now = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: PROGRAMME_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function addProgrammeDays(date, days) {
    const value = new Date(date + 'T12:00:00Z');
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
}
export function validProgrammeDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        && !Number.isNaN(Date.parse(value + 'T00:00:00Z'))
        && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
export function canManageProgrammes(user) {
    return user?.isAdmin === true;
}
export function canCreateProgramme(user) {
    return !!(user?.uid || user?.id);
}
export function canEditProgramme(row, user) {
    const id = String(user?.uid || user?.id || '');
    return !!id && (canManageProgrammes(user) || row?.createdById === id);
}
export function canViewProgramme(row, user) {
    const id = String(user?.uid || user?.id || '');
    return !!id && (canManageProgrammes(user) || row.audience === 'all'
        || row.createdById === id || row.coordinatorId === id || row.participantIds?.includes(id));
}
export function programmeInRange(row, from, to) {
    return row.status !== 'cancelled' && row.startDate <= to && row.endDate >= from;
}
export function sortProgrammes(rows) {
    return [...rows].sort((a, b) => a.startDate.localeCompare(b.startDate)
        || (a.startTime || '').localeCompare(b.startTime || '') || a.title.localeCompare(b.title));
}
export function upcomingProgrammes(rows, today = programmeToday(), count = 3) {
    return sortProgrammes(rows.filter(row => programmeInRange(row, today, addProgrammeDays(today, 30)))).slice(0, count);
}
export function validateProgramme(input) {
    const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
    if (!input || typeof input !== 'object') fail('Programme details are required.');
    const text = (key, max, required = false) => {
        if (input[key] !== undefined && typeof input[key] !== 'string') fail('Invalid ' + key + '.');
        const value = (input[key] || '').trim();
        if ((required && !value) || value.length > max) fail('Check ' + key + '.');
        if ([...value].some(char => {
            const code = char.charCodeAt(0);
            return code === 127 || code < 32 && (key !== 'description' || ![9, 10, 13].includes(code));
        })) fail('Remove unsupported control characters from ' + key + '.');
        return value;
    };
    const title = text('title', 160, true), startDate = text('startDate', 10), endDate = text('endDate', 10);
    if (!validProgrammeDate(startDate) || !validProgrammeDate(endDate) || endDate < startDate) fail('Choose a valid start and end date.');
    if (endDate > addProgrammeDays(startDate, 366)) fail('A programme may span at most one year.');
    if (typeof input.allDay !== 'boolean') fail('Choose all day or a start and end time.');
    const allDay = input.allDay;
    const startTime = allDay ? '' : text('startTime', 5), endTime = allDay ? '' : text('endTime', 5);
    if (!allDay && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)
        || (startDate === endDate && endTime <= startTime))) fail('Choose valid start and end times.');
    const venue = text('venue', 250), meetingUrl = text('meetingUrl', 1000), description = text('description', 4000);
    if (meetingUrl) { try { if (new URL(meetingUrl).protocol !== 'https:') fail('Meeting links must start with https://.'); } catch { fail('Enter a valid https:// meeting link.'); } }
    const coordinatorId = text('coordinatorId', 128, true);
    if (coordinatorId.includes('/')) fail('Invalid coordinator.');
    const audience = text('audience', 10);
    if (!['all', 'selected'].includes(audience)) fail('Choose who can see the programme.');
    if (!Array.isArray(input.participantIds) || input.participantIds.length > 200 || input.participantIds.some(id => typeof id !== 'string' || !id || id.length > 128 || id.includes('/'))) fail('Choose valid participants.');
    const participantIds = [...new Set(input.participantIds)];
    if (audience === 'selected' && !participantIds.length) fail('Select at least one participant.');
    return { title, startDate, endDate, allDay, startTime, endTime, venue, meetingUrl, description, coordinatorId, audience, participantIds: audience === 'all' ? [] : participantIds };
}
export function programmeCalendarEntry(row) {
    const compact = date => date.replaceAll('-', '');
    return {
        uid: `crwi-programme-${row.id}@crwi-attendance`, summary: row.title,
        description: [row.description, row.meetingUrl].filter(Boolean).join('\n').replace(/\r\n?/g, '\n'), location: row.venue,
        allDay: row.allDay,
        dtstart: compact(row.startDate) + (row.allDay ? '' : 'T' + row.startTime.replace(':', '') + '00'),
        dtend: compact(row.allDay ? addProgrammeDays(row.endDate, 1) : row.endDate) + (row.allDay ? '' : 'T' + row.endTime.replace(':', '') + '00')
    };
}
