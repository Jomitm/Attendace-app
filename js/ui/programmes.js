import { safeHtml, safeUrl } from './helpers.js';
import { onAction } from '../utils/action-router.js';
import { canManageProgrammes, canCreateProgramme, canEditProgramme, upcomingProgrammes, programmeToday, addProgrammeDays, programmeInRange, PROGRAMME_TIME_ZONE } from '../utils/programmes.js';
import { getProgramme, getProgrammes, getCalendarProgrammes, saveProgramme, cancelProgramme } from '../services/programme-service.js';

const viewer = () => window.AppAuth?.getUser?.();
const fmt = (date, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) => new Intl.DateTimeFormat('en-IN', { timeZone: PROGRAMME_TIME_ZONE, ...options }).format(new Date(date + 'T12:00:00+05:30'));
const when = row => `${fmt(row.startDate)}${row.endDate !== row.startDate ? ' – ' + fmt(row.endDate) : ''} · ${row.allDay ? 'All day' : `${row.startTime} – ${row.endTime} IST`}`;
const action = (name, label, id = '') => `<button type="button" class="programme-link" data-ts-action="${name}" data-programme-id="${safeHtml(id)}">${label}</button>`;
const creationHelp = () => `${action('programme-help', 'How to add a programme')}`;
function rowsHtml(rows, today = programmeToday()) {
    return rows.map(row => `<div class="programme-agenda-row"><div class="programme-date"><small>${safeHtml(fmt(row.startDate, { month: 'short' }))}</small><strong>${safeHtml(row.startDate.slice(8))}</strong></div><div class="programme-agenda-copy"><strong>${safeHtml(row.title)}</strong><span>${safeHtml(row.startDate < today && row.endDate >= today ? 'Ongoing · ' + when(row) : when(row))}</span>${row.venue ? `<span>${safeHtml(row.venue)}</span>` : ''}${row.status === 'cancelled' ? '<span>Cancelled</span>' : ''}</div>${action('programme-open', 'Details', row.id)}</div>`).join('');
}
function programmeCarousel(rows) {
    const today = programmeToday();
    const slides = rows.map((row, index) => {
        const time = row.allDay ? 'All day' : `${row.startTime}–${row.endTime} IST`;
        const range = row.startDate !== row.endDate ? `${fmt(row.startDate, { day: 'numeric', month: 'short' })}–${fmt(row.endDate, { day: 'numeric', month: 'short' })} · ` : '';
        return `<div class="programme-carousel-slide" role="group" aria-label="${index + 1} of ${rows.length}" ${index ? 'hidden' : ''}><div class="programme-date"><small>${safeHtml(fmt(row.startDate, { month: 'short' }))}</small><strong>${safeHtml(row.startDate.slice(8))}</strong></div><div class="programme-agenda-copy"><button type="button" class="programme-carousel-title" data-ts-action="programme-open" data-programme-id="${safeHtml(row.id)}" title="${safeHtml(row.title)}">${safeHtml(row.title)}</button><span>${safeHtml((row.startDate < today ? 'Ongoing · ' : '') + range + time)}</span></div></div>`;
    }).join('');
    return `<div class="programme-carousel" aria-roledescription="carousel" aria-label="Upcoming programmes" data-programme-index="0">${slides}${rows.length > 1 ? '<button type="button" class="programme-carousel-arrow programme-carousel-prev" data-ts-action="programme-previous" aria-label="Previous programme">‹</button><button type="button" class="programme-carousel-arrow programme-carousel-next" data-ts-action="programme-next" aria-label="Next programme">›</button><span class="programme-carousel-count" aria-live="polite">1 / ' + rows.length + '</span>' : ''}</div>`;
}
function moveProgramme(button, direction) {
    const carousel = button.closest('.programme-carousel');
    if (!carousel) return;
    const slides = [...carousel.querySelectorAll('.programme-carousel-slide')];
    const index = (Number(carousel.dataset.programmeIndex || 0) + direction + slides.length) % slides.length;
    carousel.dataset.programmeIndex = String(index);
    slides.forEach((slide, position) => { slide.hidden = position !== index; });
    carousel.querySelector('.programme-carousel-count').textContent = `${index + 1} / ${slides.length}`;
}
export function renderProgrammeAgenda(plans = {}) {
    bindActions();
    const rows = upcomingProgrammes(plans.programmes || [], programmeToday(), Infinity);
    return `<section class="programme-agenda" aria-label="Upcoming programmes"><div class="programme-heading"><div><h4>Upcoming programmes</h4></div>${canCreateProgramme(viewer()) ? action('programme-add', '+ Add Programme') : ''}</div>${plans.programmeError ? `<p class="programme-error" role="status">${safeHtml(plans.programmeError)}</p>${action('programme-retry', 'Retry')}` : rows.length ? programmeCarousel(rows) : '<p class="programme-empty">No upcoming programmes.</p>'}${action('programme-list', 'View all programmes →')}</section>`;
}
function closeModal() { document.getElementById('programme-modal')?.remove(); }
let returnFocus;
function showModal(title, html) {
    const previous = document.getElementById('programme-modal');
    if (!previous) returnFocus = document.activeElement;
    previous?.remove();
    const overlay = document.createElement('div'); overlay.id = 'programme-modal'; overlay.className = 'modal-overlay programme-modal';
    overlay.innerHTML = `<section class="modal-content programme-dialog" role="dialog" aria-modal="true" aria-labelledby="programme-dialog-title"><header><h3 id="programme-dialog-title">${safeHtml(title)}</h3>${action('programme-close', 'Close ×')}</header><div class="programme-modal-content">${html}</div></section>`;
    document.body.append(overlay);
    overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') { closeModal(); returnFocus?.focus?.(); }
        if (event.key === 'Tab') {
            const focusable = [...overlay.querySelectorAll('button:not([disabled]),input,textarea,select,a[href]')].filter(el => !el.hidden && el.getClientRects().length);
            const first = focusable[0], last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
    });
    overlay.querySelector('input,button')?.focus();
    return overlay;
}
async function refreshProgrammes() {
    window.AppCalendar?._plansCache?.clear();
    window.dispatchEvent(new CustomEvent('app:db-write', { detail: { collection: 'programmes' } }));
    if (String(window.location.hash || '#dashboard') === '#dashboard') {
        if (typeof window.app_refreshTeamSchedule === 'function') await window.app_refreshTeamSchedule();
        else await window.app_refreshDashboard?.();
    }
    else if (String(window.location.hash).startsWith('#dashboard-section/')) await window.app_refreshCurrentPage?.();
}
function showError(error) { showModal('Programmes', `<p role="alert">${safeHtml(error.message || 'Could not load programmes.')}</p>${action('programme-list', 'Try again')}`); }
async function openDetails(id) {
    const uid = viewer()?.id, route = window.location.hash;
    try {
        const row = await getProgramme(id);
        const users = await window.AppUserService.getActiveStaff().catch(() => []);
        if (viewer()?.id !== uid || window.location.hash !== route) return;
        const name = userId => users.find(user => user.id === userId)?.name || 'Staff member (not in active directory)';
        showModal(row.title, `<p class="programme-detail-date">${safeHtml(when(row))}</p><p>${safeHtml(row.venue || 'Venue not set')}</p><p class="programme-description">${safeHtml(row.description || '')}</p><p>Coordinator: ${safeHtml(name(row.coordinatorId))}</p><p>Audience: ${row.audience === 'all' ? 'All staff' : safeHtml((row.participantIds || []).map(name).join(', '))}</p>${row.meetingUrl ? `<a href="${safeUrl(row.meetingUrl)}" target="_blank" rel="noopener noreferrer">Open meeting link ↗</a>` : ''}${row.status === 'cancelled' ? '<p>Programme cancelled.</p>' : canEditProgramme(row, viewer()) ? `<div class="programme-form-actions">${action('programme-edit', 'Edit programme', id)}${action('programme-cancel', 'Cancel programme', id)}</div>` : ''}`);
    } catch (error) { if (viewer()?.id === uid && window.location.hash === route) showError(error); }
}
async function openList() {
    const uid = viewer()?.id, route = window.location.hash;
    try {
        const from = addProgrammeDays(programmeToday(), -30);
        const rows = await getProgrammes(from, addProgrammeDays(from, 400), canManageProgrammes(viewer()));
        if (viewer()?.id !== uid || window.location.hash !== route) return;
        showModal('Programmes · Past 30 days & coming year', `${canCreateProgramme(viewer()) ? action('programme-add', '+ Add Programme') : ''}${rows.length ? rowsHtml(rows) : '<p>No programmes in this period.</p>'}${creationHelp()}`);
    } catch (error) { if (viewer()?.id === uid && window.location.hash === route) showError(error); }
}
async function openForm(id) {
    if (!canCreateProgramme(viewer())) return;
    const uid = viewer()?.id, route = window.location.hash;
    try {
        const row = id ? await getProgramme(id) : null;
        if (row?.status === 'cancelled') return openDetails(id);
        const users = await window.AppUserService.getActiveStaff();
        if (viewer()?.id !== uid || window.location.hash !== route || !canCreateProgramme(viewer()) || (row && !canEditProgramme(row, viewer()))) return;
        const data = row || { title: '', startDate: programmeToday(), endDate: programmeToday(), allDay: true, coordinatorId: viewer().id, audience: 'all', participantIds: [] };
        const field = (label, name, type = 'text', required = false, max = 250) => `<label>${label}<input type="${type}" name="${name}" value="${safeHtml(data[name] || '')}" ${required ? 'required' : ''} maxlength="${max}"></label>`;
        const overlay = showModal(id ? 'Edit programme' : 'Add programme', `<form id="programme-form"><label>Programme name<input name="title" value="${safeHtml(data.title)}" maxlength="160" required></label><div class="programme-form-grid">${field('Start date', 'startDate', 'date', true)}${field('End date', 'endDate', 'date', true)}</div><label class="programme-checkbox"><input type="checkbox" name="allDay" ${data.allDay ? 'checked' : ''}> All day</label><div class="programme-form-grid" id="programme-time-fields">${field('Start time (IST)', 'startTime', 'time')}${field('End time (IST)', 'endTime', 'time')}</div>${field('Venue', 'venue')}${field('Online meeting link (https://)', 'meetingUrl', 'url', false, 1000)}<label>Coordinator<select name="coordinatorId" required>${users.map(u => `<option value="${safeHtml(u.id)}" ${u.id === data.coordinatorId ? 'selected' : ''}>${safeHtml(u.name)}</option>`).join('')}</select></label><label>Who can see this programme?<select name="audience"><option value="all" ${data.audience === 'all' ? 'selected' : ''}>All staff</option><option value="selected" ${data.audience === 'selected' ? 'selected' : ''}>Selected staff, coordinator and administrators</option></select></label><fieldset id="programme-participants"><legend>Participating staff</legend>${users.map(u => `<label class="programme-checkbox"><input type="checkbox" name="participantIds" value="${safeHtml(u.id)}" ${data.participantIds.includes(u.id) ? 'checked' : ''}>${safeHtml(u.name)}</label>`).join('')}</fieldset><label>Description<textarea name="description" rows="3" maxlength="4000">${safeHtml(data.description || '')}</textarea></label><p id="programme-form-error" role="alert"></p><div class="programme-form-actions"><button type="submit" class="action-btn">Save programme</button>${action('programme-close', 'Discard changes')}</div></form>`);
        const form = overlay.querySelector('form');
        const toggle = () => {
            const allDay = form.elements.namedItem('allDay').checked;
            overlay.querySelector('#programme-time-fields').hidden = allDay;
            ['startTime', 'endTime'].forEach(name => { form.elements.namedItem(name).required = !allDay; });
            overlay.querySelector('#programme-participants').hidden = form.elements.namedItem('audience').value !== 'selected';
        };
        form.addEventListener('change', toggle); toggle();
        form.elements.namedItem('startDate').addEventListener('change', () => {
            if (form.elements.namedItem('endDate').value < form.elements.namedItem('startDate').value) form.elements.namedItem('endDate').value = form.elements.namedItem('startDate').value;
        });
        const newId = crypto.randomUUID();
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (form.dataset.saving) return;
            form.dataset.saving = 'true'; const button = form.querySelector('[type="submit"]'); button.disabled = true;
            try {
                const values = Object.fromEntries(new FormData(form));
                values.allDay = form.elements.namedItem('allDay').checked;
                values.participantIds = [...form.querySelectorAll('[name="participantIds"]:checked')].map(el => el.value);
                const saved = await saveProgramme(values, row, newId);
                if (!form.isConnected) { await refreshProgrammes(); return; }
                closeModal(); await refreshProgrammes(); await openDetails(saved.id);
            } catch (error) { form.querySelector('[role="alert"]').textContent = error.message; }
            finally { delete form.dataset.saving; button.disabled = false; }
        });
    } catch (error) { if (viewer()?.id === uid && window.location.hash === route) showError(error); }
}
let bound = false;
function bindActions() {
    if (bound || typeof document === 'undefined') return;
    bound = true;
    window.addEventListener('hashchange', closeModal);
    onAction('programme-add', () => void openForm());
    onAction('programme-next', el => moveProgramme(el, 1));
    onAction('programme-previous', el => moveProgramme(el, -1));
    onAction('programme-help', () => showModal('How to add a programme', `<p>Programmes are entered separately from daily work plans.</p>${'<p>Any signed-in staff member can add a programme. You can edit or cancel programmes you created; administrators can manage all programmes.</p>'}<ol><li>Open <strong>Upcoming programmes</strong> on the dashboard.</li><li>Choose <strong>+ Add Programme</strong>.</li><li>Enter the programme name, start and end dates, all-day or start/end times, venue or meeting link, coordinator and audience.</li><li>Choose <strong>Save programme</strong>.</li></ol><p>Saved programmes appear on their calendar dates. Ongoing programmes and those starting within the next 30 days also appear in Upcoming programmes, for the selected audience.</p>${canCreateProgramme(viewer()) ? action('programme-add', '+ Add Programme') : ''}`));
    onAction('programme-edit', el => void openForm(el.dataset.programmeId));
    onAction('programme-open', el => void openDetails(el.dataset.programmeId));
    onAction('programme-list', () => void openList());
    onAction('programme-close', () => { closeModal(); returnFocus?.focus?.(); });
    onAction('programme-retry', () => void refreshProgrammes());
    onAction('programme-cancel', el => { void (async () => {
        try {
            const row = await getProgramme(el.dataset.programmeId);
            if (!await window.appConfirm('Cancel this programme? It will leave the upcoming list and calendar.')) return;
            await cancelProgramme(row); closeModal(); await refreshProgrammes(); await openDetails(row.id);
        } catch (error) { showError(error); }
    })(); });
}
export function programmeDayEvents(date, rows = []) {
    return rows.filter(row => programmeInRange(row, date, date)).map(row => ({ id: row.id, title: row.title, date, type: 'programme' }));
}

let syncUser = '', syncTimer = null, syncStop = null;
export function startProgrammeUpdates() {
    const uid = viewer()?.id;
    if (syncTimer && syncUser === uid) return;
    syncStop?.();
    syncTimer = null; syncUser = uid || '';
    if (!uid) return;
    let signature = JSON.stringify((window._currentPlans?.programmes || []).map(row => [row.id, row.updatedAt, row.status]).sort((a, b) => a[0].localeCompare(b[0]))), busy = false;
    const stop = () => { clearInterval(syncTimer); syncTimer = null; syncUser = ''; syncStop = null; window.removeEventListener('hashchange', stop); };
    syncStop = stop;
    window.addEventListener('hashchange', stop);
    syncTimer = setInterval(async () => {
        if (viewer()?.id !== uid || !['', '#dashboard'].includes(window.location.hash)) { stop(); return; }
        if (busy || document.visibilityState === 'hidden' || document.getElementById('programme-modal')) return;
        busy = true;
        try {
            const today = programmeToday();
            const rows = await getCalendarProgrammes(addProgrammeDays(today, -62), addProgrammeDays(today, 92));
            if (syncStop !== stop) return;
            const next = JSON.stringify(rows.map(row => [row.id, row.updatedAt, row.status]).sort((a, b) => a[0].localeCompare(b[0])));
            if (signature !== null && signature !== next && viewer()?.id === uid) await refreshProgrammes();
            signature = next;
        } catch { /* Keep visible data on a temporary network error. Explicit reloads show errors. */ }
        finally { busy = false; }
    }, 60000);
}
