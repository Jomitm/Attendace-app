/**
 * ICS (iCalendar) Utility — RFC 5545 compliant
 * Generates .ics files for Outlook/Google/Apple calendar subscriptions.
 */

const ICS_TIMEZONE = 'Asia/Kolkata';

const ICS_VTIMEZONE = `BEGIN:VTIMEZONE
TZID:${ICS_TIMEZONE}
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0530
TZOFFSETTO:+0530
TZNAME:IST
END:STANDARD
END:VTIMEZONE`;

function pad2(n) {
    return String(n).padStart(2, '0');
}

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
        .replace(/\n/g, '\\n');
}

function foldLine(line) {
    const MAX = 75;
    if (line.length <= MAX) return line;
    let result = line.substring(0, MAX);
    let remaining = line.substring(MAX);
    while (remaining.length > 0) {
        result += '\r\n ' + remaining.substring(0, MAX - 1);
        remaining = remaining.substring(MAX - 1);
    }
    return result;
}

function generateUID() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < 32; i++) {
        uid += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${uid}@crwi-attendance`;
}

function buildEvent(event) {
    const lines = ['BEGIN:VEVENT'];
    lines.push(`UID:${event.uid || generateUID()}`);
    lines.push(`DTSTAMP:${toICSDateTime(new Date().toISOString())}`);

    if (event.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${toICSDate(event.start)}`);
        if (event.end) {
            const endDate = new Date(event.end);
            endDate.setDate(endDate.getDate() + 1);
            lines.push(`DTEND;VALUE=DATE:${toICSDate(endDate.toISOString())}`);
        } else {
            const nextDay = new Date(event.start);
            nextDay.setDate(nextDay.getDate() + 1);
            lines.push(`DTEND;VALUE=DATE:${toICSDate(nextDay.toISOString())}`);
        }
    } else {
        lines.push(`DTSTART;TZID=${ICS_TIMEZONE}:${toICSDateTime(event.start)}`);
        lines.push(`DTEND;TZID=${ICS_TIMEZONE}:${toICSDateTime(event.end || event.start)}`);
    }

    lines.push(`SUMMARY:${escapeText(event.title)}`);

    if (event.description) {
        lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    if (event.location) {
        lines.push(`LOCATION:${escapeText(event.location)}`);
    }

    if (event.status === 'busy') {
        lines.push('TRANSP:OPAQUE');
    } else if (event.status === 'free') {
        lines.push('TRANSP:TRANSPARENT');
    }

    if (event.categories && event.categories.length > 0) {
        lines.push(`CATEGORIES:${event.categories.map(c => escapeText(c)).join(',')}`);
    }

    if (event.reminderMinutes) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeText(event.title)}`);
        lines.push(`TRIGGER:-PT${event.reminderMinutes}M`);
        lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
    return lines.map(l => foldLine(l)).join('\r\n');
}

function buildICS(events, options = {}) {
    const calName = options.calName || 'CRWI Attendance';
    const calDesc = options.calDesc || 'CRWI Attendance App Calendar Feed';

    const header = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CRWI Attendance//EN',
        `X-WR-CALNAME:${calName}`,
        `X-WR-CALDESC:${calDesc}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ICS_VTIMEZONE
    ].join('\r\n');

    const footer = 'END:VCALENDAR';

    const eventBlocks = events.map(ev => buildEvent(ev)).join('\r\n');

    return `${header}\r\n${eventBlocks}\r\n${footer}\r\n`;
}

function downloadICS(filename, icsContent) {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'crwi-calendar.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getOutlookDeepLink(event) {
    const base = 'https://outlook.live.com/calendar/0/action/compose';
    const params = new URLSearchParams();
    params.set('subject', event.title || '');
    if (event.allDay) {
        params.set('allday', 'true');
        params.set('startdt', toICSDate(event.start));
        if (event.end) {
            const endDate = new Date(event.end);
            endDate.setDate(endDate.getDate() + 1);
            params.set('enddt', toICSDate(endDate.toISOString()));
        } else {
            const nextDay = new Date(event.start);
            nextDay.setDate(nextDay.getDate() + 1);
            params.set('enddt', toICSDate(nextDay.toISOString()));
        }
    } else {
        params.set('startdt', toICSDateTime(event.start));
        params.set('enddt', toICSDateTime(event.end || event.start));
    }
    if (event.description) params.set('body', event.description);
    if (event.location) params.set('location', event.location);
    return `${base}?${params.toString()}`;
}

function getGoogleCalendarLink(event) {
    const base = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams();
    params.set('action', 'TEMPLATE');
    params.set('text', event.title || '');
    if (event.allDay) {
        params.set('dates', `${toICSDate(event.start)}/${toICSDate(event.end || event.start)}`);
    } else {
        params.set('dates', `${toICSDateTime(event.start)}/${toICSDateTime(event.end || event.start)}`);
    }
    if (event.description) params.set('details', event.description);
    if (event.location) params.set('location', event.location);
    return `${base}?${params.toString()}`;
}

export {
    buildICS,
    downloadICS,
    getOutlookDeepLink,
    getGoogleCalendarLink,
    toICSDate,
    toICSDateTime,
    generateUID,
    ICS_TIMEZONE
};
