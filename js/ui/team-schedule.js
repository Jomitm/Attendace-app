/**
 * Team Schedule Component
 * Renders the mini calendar for the dashboard.
 */

import { onAction } from '../utils/action-router.js';
import { renderProgrammeAgenda } from './programmes.js';
let selectedPlanDate = '';

export const renderYearlyPlan = (plans) => {
    const today = new Date();
    const currentUser = window.AppAuth?.getUser();
    const canManageHoliday = !!(
        currentUser
        && (
            window.app_isAdminUser?.(currentUser)
            || currentUser.role === 'Administrator'
            || window.app_canManageAttendanceSheet?.(currentUser)
        )
    );
    if (window.app_calMonth === undefined) window.app_calMonth = today.getMonth();
    if (window.app_calYear === undefined) window.app_calYear = today.getFullYear();

    const year = window.app_calYear;
    const month = window.app_calMonth;
    if (selectedPlanDate && !selectedPlanDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`)) selectedPlanDate = '';
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHTML = '';
    for (let i = 0; i < firstDay; i++) calendarHTML += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const evs = typeof window.app_getDayEvents === 'function' ? window.app_getDayEvents(dStr, plans) : [];
        const hasLeave = evs.some(e => e.type === 'leave');
        const hasEvent = evs.some(e => e.type === 'event' || e.type === 'programme');
        const hasWork = evs.some(e => e.type === 'work');
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

        // Detect automatic day type
        const dayType = window.AppAnalytics ? window.AppAnalytics.getDayType(new Date(year, month, d)) : 'Work Day';

        calendarHTML += `
            <div class="cal-day${isToday ? ' today' : ''}"
                    data-date="${dStr}"
                    data-day-type="${dayType}"
                    data-has-leave="${hasLeave}"
                    data-has-event="${hasEvent}"
                    data-has-work="${hasWork}"
                    tabindex="0"
                    role="button"
                    title="${dayType}">
                ${d}
            </div>
        `;
    }

    // Global data for the handlers in app.js
    window._currentPlans = plans;

    if (typeof window.app_prefetchDayPlan === 'function') {
        const currentDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (year === today.getFullYear() && month === today.getMonth()) {
            setTimeout(() => window.app_prefetchDayPlan(currentDateStr), 0);
        }
    }

    // Register button actions with shared router (once).
    if (!window._tsActionRegistered) {
        window._tsActionRegistered = true;
        onAction('add-plan', el => window.app_openDayPlan?.(el.dataset.date || selectedPlanDate || window.AppCalendar?.getTodayKey?.(), window.AppAuth?.getUser?.()?.id));
        onAction('edit-plan', el => window.app_openDayPlan?.(el.dataset.date || selectedPlanDate || window.AppCalendar?.getTodayKey?.(), window.AppAuth?.getUser?.()?.id));
        onAction('add-holiday', () => window.app_openEventModal?.());
        onAction('prev-month', () => window.app_changeCalMonth?.(-1));
        onAction('next-month', () => window.app_changeCalMonth?.(1));

        // Day cell click + prefetch listeners (not data-ts-action)
        document.addEventListener('click', (e) => {
            const day = e.target.closest('.cal-day[data-date]');
            if (day) { selectedPlanDate = day.dataset.date; window.app_openDayPlan?.(day.dataset.date); }
        });
        document.addEventListener('mouseover', (e) => {
            const day = e.target.closest('.cal-day[data-date]');
            if (day) window.app_prefetchDayPlan?.(day.dataset.date);
        });
        document.addEventListener('mousedown', (e) => {
            const day = e.target.closest('.cal-day[data-date]');
            if (day) window.app_prefetchDayPlan?.(day.dataset.date);
        });
        document.addEventListener('focusin', (e) => {
            const day = e.target.closest('.cal-day[data-date]');
            if (day) window.app_prefetchDayPlan?.(day.dataset.date);
        });
    }

    return `
        <div class="card dashboard-team-schedule-card ts-card">
            <div class="ts-card-head">
                <h4>Team Schedule</h4>
                <span>Planned Leaves & Events</span>
            </div>

            <div class="ts-header-row" data-ts-cal-handler>
                <div class="ts-month-nav">
                    <button data-ts-action="prev-month" title="Previous month"><i class="fa-solid fa-chevron-left"></i></button>
                    <h4>${monthNames[month]} ${year}</h4>
                    <button data-ts-action="next-month" title="Next month"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <div class="ts-btn-row">
                    <button
                        type="button"
                        class="ts-btn ts-btn-add"
                        data-ts-action="add-plan"
                        title="Add Personal Plan (work tasks, leaves, events)"
                    >
                        <i class="fa-solid fa-plus"></i>
                        <span>Add Plan</span>
                    </button>
                    <button
                        type="button"
                        class="ts-btn ts-btn-edit"
                        data-ts-action="edit-plan"
                        title="Edit your existing Personal Plan"
                    >
                        <i class="fa-regular fa-pen-to-square"></i>
                        <span>Edit Plan</span>
                    </button>
                    ${canManageHoliday ? `<button class="ts-btn ts-btn-holiday" data-ts-action="add-holiday" title="Add Holiday / Event"><i class="fa-solid fa-plus-circle"></i></button>` : ''}
                </div>
            </div>

            ${renderProgrammeAgenda(plans)}

            <div class="ts-cal-grid">
                <div class="ts-weekday">S</div>
                <div class="ts-weekday">M</div>
                <div class="ts-weekday">T</div>
                <div class="ts-weekday">W</div>
                <div class="ts-weekday">T</div>
                <div class="ts-weekday">F</div>
                <div class="ts-weekday">S</div>
                ${calendarHTML}
            </div>

            <div class="ts-legend">
                <span class="ts-legend-item"><span class="ts-legend-dot ts-legend-dot-leave"></span> Leave</span>
                <span class="ts-legend-item"><span class="ts-legend-dot ts-legend-dot-event"></span> Event</span>
                <span class="ts-legend-item"><span class="ts-legend-dot ts-legend-dot-holiday"></span> Holiday</span>
                <span class="ts-legend-item"><span class="ts-legend-dot ts-legend-dot-half"></span> Half</span>
            </div>
        </div>
    `;
};

/** Refresh only the calendar card after programme data changes. */
export async function refreshTeamSchedule() {
    const currentCard = document.querySelector('.dashboard-team-schedule-card');
    if (!currentCard || !window.AppCalendar?.getPlans) return false;
    const currentAgenda = currentCard.querySelector('.programme-agenda');
    if (!currentAgenda) return false;

    const route = window.location.hash;
    const plans = await (window.AppCalendar.getDashboardPlans?.() || window.AppCalendar.getPlans());
    if (!currentCard.isConnected || window.location.hash !== route) return false;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderProgrammeAgenda(plans);
    const updatedAgenda = wrapper.firstElementChild;
    if (!updatedAgenda) return false;
    currentAgenda.replaceWith(updatedAgenda);
    window._currentPlans = plans;
    currentCard.querySelectorAll('.cal-day[data-date]').forEach(day => {
        const events = window.app_getDayEvents?.(day.dataset.date, plans) || [];
        day.dataset.hasEvent = String(events.some(event => event.type === 'event' || event.type === 'programme'));
    });
    return true;
}

if (typeof window !== 'undefined') {
    window.app_refreshTeamSchedule = refreshTeamSchedule;
}
