import { AppAnalytics } from '../modules/analytics.js';
import { AppAttendance } from '../modules/attendance.js';
import { AppConfig } from '../config.js';

export function attendanceToday(now = new Date()) {
    if (Number.isNaN(now.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

// Use the same eligibility and precedence as attendance analytics. Never mutate logs.
export function selectAttendanceLog(logs, userId, date) {
    const eligible = logs.filter(log => String(log.user_id || log.userId) === String(userId)
        && log.date === date && AppAnalytics.isAttendanceEligibleLog(log));
    return AppAnalytics.pickBestAttendanceLogPerDay(eligible, date, date)[0] || null;
}

export function buildAttendanceSheet({ users, logs, month, year, holidays = [], today = attendanceToday(), calendarComplete = true }) {
    const days = new Date(year, month + 1, 0).getDate();
    const holidayMap = new Map();
    holidays.forEach(h => {
        const date = String(h.date || '').slice(0, 10);
        if (!holidayMap.has(date)) holidayMap.set(date, []);
        holidayMap.get(date).push(h.name || h.title || 'Holiday');
    });
    const byUserDay = new Map();
    logs.forEach(log => {
        const key = `${log.user_id || log.userId}:${log.date}`;
        if (!byUserDay.has(key)) byUserDay.set(key, []);
        byUserDay.get(key).push(log);
    });
    const rows = users.filter(u => !AppConfig.isDemoUser(u)).slice()
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))).map(user => {
            const totals = { present: 0, late: 0, half: 0, leave: 0, absent: 0, review: 0 };
            const cells = Array.from({ length: days }, (_, i) => {
                const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                const evidence = byUserDay.get(`${user.id}:${date}`) || [];
                const log = selectAttendanceLog(evidence, user.id, date);
                const eligible = evidence.filter(l => AppAnalytics.isAttendanceEligibleLog(l));
                let code = '—', label = 'No attendance record', kind = 'empty';
                let review = false, note = '';
                if (log) {
                    const approvedAuto = log.autoCheckout && (log.missedCheckoutApprovedAsFullDay
                        || String(log.missedCheckoutReasonStatus).toLowerCase() === 'approved');
                    const type = AppAttendance.normalizeType(approvedAuto ? 'Present' : log.type);
                    label = type;
                    if (type === 'Half Day' || /Half Day.*Leave/.test(type)) { code = 'HD'; kind = 'half'; totals.half++; }
                    else if (type === 'Absent') { code = 'A'; kind = 'absent'; totals.absent++; }
                    else if (/Leave/.test(type)) {
                        code = type === 'Retreat Leave' ? 'RL' : type === 'Staff Development Leave' ? 'SDL' : type === 'Short Leave' ? 'SL' : 'LV';
                        kind = 'leave'; totals.leave++;
                    } else if (/Holiday/.test(type)) { code = 'H'; kind = 'holiday'; }
                    else {
                        code = type === 'Work - Home' ? 'W' : type === 'On Duty' ? 'D' : type === 'Late' ? 'L' : 'P';
                        kind = type === 'Late' ? 'late' : 'present'; totals.present++;
                        if (type === 'Late' || log.lateCountable === true) totals.late++;
                    }
                    const missingCheckout = !log.leaveGenerated && !/Leave|Holiday/.test(type) && (!log.checkOut || log.checkOut === 'Active Now');
                    review = (log.autoCheckout && !approvedAuto) || (missingCheckout && date < today) || eligible.length > 1;
                    if (log.autoCheckout) note = approvedAuto ? 'Missed checkout approved as full day.' : 'Automatically closed; check approval status.';
                    if (eligible.length > 1) note += ' Multiple attendance records; review the source records.';
                    if (missingCheckout) note += date < today ? ' Missing checkout.' : ' Checkout pending.';
                    if (log.isManualOverride) note += ' Manually overridden.';
                } else if (date > today) { label = 'Future date'; }
                else if (user.joinDate && date < user.joinDate) { label = `Before joining (${user.joinDate})`; }
                else if (date === today && user.status === 'in' && user.lastCheckIn && attendanceToday(new Date(user.lastCheckIn)) === date) {
                    code = 'IN'; kind = 'present'; label = 'Currently checked in'; totals.present++;
                } else if (holidayMap.has(date)) { code = 'H'; kind = 'holiday'; label = holidayMap.get(date).join(', '); }
                else {
                    const policy = AppAnalytics.getWeekendPolicy(date);
                    if (policy === 'holiday') { code = 'H'; kind = 'holiday'; label = 'Weekly off'; }
                    else if (policy === 'halfday') { label = 'Half-day Saturday: no record'; }
                    else if (date === today) { code = '?'; kind = 'empty'; label = 'No check-in recorded yet'; }
                    else if (!calendarComplete) { code = '?'; kind = 'empty'; label = 'Holiday calendar unavailable: attendance unknown'; }
                    else { code = 'A'; kind = 'absent'; label = 'No attendance recorded on a working day'; totals.absent++; }
                }
                if (review) totals.review++;
                return { date, code, label, kind, note: note.trim(), review, log, evidence };
            });
            return { user, cells, totals };
        });
    return { month, year, days, rows, today };
}

export function filterAttendanceRows(rows, { scope = 'team', viewerId, search = '', department = '', attention = false } = {}) {
    const needle = search.trim().toLowerCase();
    return rows.filter(({ user, totals }) => (scope !== 'mine' || String(user.id) === String(viewerId))
        && (!department || (user.dept || user.department || 'General') === department)
        && (!needle || `${user.name || ''} ${user.employeeId || ''} ${user.dept || user.department || ''}`.toLowerCase().includes(needle))
        && (!attention || totals.review > 0));
}

export function attendanceSheetCSV(sheet, rows = sheet.rows) {
    const headers = ['Staff Name', 'Department', ...Array.from({ length: sheet.days }, (_, i) => String(i + 1)),
        'Present (includes Late/WFH/Duty)', 'Late (subset of Present)', 'Half Days', 'Leave Entries', 'Absent', 'Needs Review'];
    const data = rows.map(({ user, cells, totals }) => [user.name, user.dept || user.department || 'General',
        ...cells.map(c => `${c.code}: ${c.label}${c.log?.checkIn ? ` (${c.log.checkIn} – ${c.log.checkOut || 'Checkout pending'})` : ''}${c.note ? `; ${c.note}` : ''}`),
        totals.present, totals.late, totals.half, totals.leave, totals.absent, totals.review]);
    const escape = value => {
        let text = String(value ?? '');
        if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    };
    return '\uFEFF' + [headers, ...data].map(row => row.map(escape).join(',')).join('\r\n');
}
