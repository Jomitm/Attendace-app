// Build new shared selections exclusively from server-owned records. The
// existing browser engine runs in a short-lived process with the same India
// timezone, without changing global timezone/window state in the API process.
import { fork } from 'node:child_process';
import { resolve as resolvePath } from 'node:path';

export function currentHeroPeriod(now = new Date()) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const end = new Date(`${today}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    return { today, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), periodKey: `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}` };
}

export function calculateTrustedHeroRanking(input) {
    return new Promise((resolve, reject) => {
        const child = fork(resolvePath(process.cwd(), 'api/_hero-ranking-worker.cjs'), [], {
            // The worker only calculates supplied records; it gets no server credentials.
            env: { TZ: 'Asia/Kolkata', NODE_NO_WARNINGS: '1', SystemRoot: process.env.SystemRoot || '' },
            silent: true, windowsHide: true, execArgv: []
        });
        let settled = false;
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            child.kill();
            if (error) reject(error); else resolve(result);
        };
        const timer = setTimeout(() => finish(new Error('Hero calculation timed out')), 10000);
        child.on('error', error => finish(error));
        child.on('exit', () => finish(new Error('Hero calculation ended without a result')));
        child.on('message', result => result?.error
            ? finish(new Error(result.error)) : finish(null, result));
        // Drain diagnostics so a verbose imported module cannot block the worker.
        child.stdout?.resume();
        child.stderr?.resume();
        child.send(input, error => { if (error) finish(error); });
    });
}

let calculation;
let calculationKey;
let calculationExpires = 0;
export async function loadTrustedHeroCandidates(db, period) {
    if (calculation && calculationKey === period.periodKey && Date.now() < calculationExpires) return calculation;
    calculationKey = period.periodKey;
    calculationExpires = Date.now() + 30000;
    const pending = readTrustedHeroCandidates(db, period);
    calculation = pending;
    pending.catch(() => { if (calculation === pending) calculation = null; });
    return pending;
}

async function readTrustedHeroCandidates(db, period) {
    const rows = snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const range = collection => db.collection(collection).where('date', '>=', period.start).where('date', '<=', period.end).get();
    const [users, attendance, workPlans, events, settings, holidays] = await Promise.all([
        db.collection('users').get(), range('attendance'), range('work_plans'), range('events'),
        db.collection('settings').doc('policies').get(), db.collection('settings').doc('holidays').get()
    ]);
    return calculateTrustedHeroRanking({ period, users: rows(users), attendance: rows(attendance),
        workPlans: rows(workPlans), events: rows(events), settings: settings.exists ? settings.data() : {},
        holidays: holidays.exists ? holidays.data() : { byYear: {} } });
}
