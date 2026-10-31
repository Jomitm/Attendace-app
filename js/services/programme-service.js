import { programmeToday, addProgrammeDays } from '../utils/programmes.js';

async function request(body) {
    const auth = window.AppFirebaseAuth?.currentUser;
    if (!auth) throw new Error('Please sign in to load programmes.');
    const token = await auth.getIdToken();
    const response = await fetch('/api/programmes', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
    });
    if (window.AppFirebaseAuth?.currentUser?.uid !== auth.uid) throw new Error('The signed-in account changed. Please reopen the dashboard.');
    let result;
    try { result = await response.json(); } catch { throw new Error('Programme service is unavailable. Please try again.'); }
    if (!response.ok) throw new Error(result.error || 'Could not load programmes.');
    return result;
}
export async function getProgrammes(from = programmeToday(), to = addProgrammeDays(from, 366), includeCancelled = false) {
    return (await request({ action: 'list', from, to, includeCancelled })).data;
}
export async function getCalendarProgrammes(from, to) {
    const rows = await getProgrammes(from, to);
    if (Number.isInteger(window.app_calYear) && Number.isInteger(window.app_calMonth)) {
        const selectedFrom = `${window.app_calYear}-${String(window.app_calMonth + 1).padStart(2, '0')}-01`;
        const selectedTo = new Date(Date.UTC(window.app_calYear, window.app_calMonth + 1, 0, 12)).toISOString().slice(0, 10);
        if (selectedFrom < from || selectedTo > to) rows.push(...await getProgrammes(selectedFrom, selectedTo));
    }
    return [...new Map(rows.map(row => [row.id, row])).values()];
}
export async function getProgramme(id) { return (await request({ action: 'get', id })).data; }
export async function saveProgramme(data, existing = null, newId = null) {
    return (await request({ action: 'save', id: existing?.id || newId || crypto.randomUUID(), expectedUpdatedAt: existing?.updatedAt || null, data })).data;
}
export async function cancelProgramme(existing) {
    return (await request({ action: 'cancel', id: existing.id, expectedUpdatedAt: existing.updatedAt })).data;
}
