/**
 * Team Schedule Component
 * Renders the mini calendar for the dashboard.
 */

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
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHTML = '';
    for (let i = 0; i < firstDay; i++) calendarHTML += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const evs = typeof window.app_getDayEvents === 'function' ? window.app_getDayEvents(dStr, plans) : [];
        const hasLeave = evs.some(e => e.type === 'leave');
        const hasEvent = evs.some(e => e.type === 'event');
        const hasWork = evs.some(e => e.type === 'work');
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

        // Detect automatic day type
        const dayType = window.AppAnalytics ? window.AppAnalytics.getDayType(new Date(year, month, d)) : 'Work Day';

        calendarHTML += `
            <div class="cal-day ${isToday ? 'today' : ''} ${hasLeave ? 'has-leave' : ''} ${hasEvent ? 'has-event' : ''} ${hasWork ? 'has-work' : ''} ${dayType === 'Holiday' ? 'is-holiday' : ''} ${dayType === 'Half Day' ? 'is-half-day' : ''}" 
                    onmousedown="window.app_prefetchDayPlan?.('${dStr}')"
                    onpointerdown="window.app_prefetchDayPlan?.('${dStr}')"
                    onclick="window.app_openDayPlan('${dStr}')"
                    onmouseenter="window.app_prefetchDayPlan?.('${dStr}')"
                    onpointerenter="window.app_prefetchDayPlan?.('${dStr}')"
                    onfocus="window.app_prefetchDayPlan?.('${dStr}')"
                    tabindex="0"
                    role="button"
                    style="cursor:pointer;"
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

    return `
        <div class="card dashboard-team-schedule-card" style="padding: 0.75rem; display:flex; flex-direction:column;">
            <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                    <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Team Schedule</h4>
                    <span style="font-size:0.7rem; color:#6b7280;">Planned Leaves & Events</span>
            </div>

            <div style="margin-bottom:0.6rem; padding-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                    <button onclick="window.app_changeCalMonth(-1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-left"></i></button>
                    <div style="text-align:center; min-width:70px;">
                        <h4 style="margin:0; color:#1f2937; font-size:0.9rem;">${monthNames[month]} ${year}</h4>
                    </div>
                    <button onclick="window.app_changeCalMonth(1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.35rem;">
                        <button
                            type="button"
                            onclick="window.app_quickAddPersonalPlan?.()"
                            title="Add Personal Plan"
                            style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.3rem 0.55rem; border:1px solid #bfdbfe; border-radius:999px; background:linear-gradient(135deg,#eff6ff,#dbeafe); color:#1d4ed8; font-size:0.64rem; font-weight:800; cursor:pointer; white-space:nowrap;"
                        >
                            <i class="fa-solid fa-plus"></i>
                            <span>Add Personal Plan</span>
                        </button>
                        <button
                            type="button"
                            onclick="window.app_quickEditPersonalPlan?.()"
                            title="Edit Personal Plan"
                            style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.3rem 0.55rem; border:1px solid #cbd5e1; border-radius:999px; background:linear-gradient(135deg,#ffffff,#f8fafc); color:#475569; font-size:0.64rem; font-weight:800; cursor:pointer; white-space:nowrap;"
                        >
                            <i class="fa-regular fa-pen-to-square"></i>
                            <span>Edit Personal Plan</span>
                        </button>
                        ${canManageHoliday ? `<button onclick="window.app_openEventModal()" style="background:none; border:none; color:var(--primary); cursor:pointer;" title="Add Holiday / Event"><i class="fa-solid fa-plus-circle"></i></button>` : ''}
                    </div>
            </div>
            <div class="calendar-grid-mini" style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align:center; font-size: 0.65rem;">
                <div style="font-weight:700; color:#9ca3af;">S</div>
                <div style="font-weight:700; color:#9ca3af;">M</div>
                <div style="font-weight:700; color:#9ca3af;">T</div>
                <div style="font-weight:700; color:#9ca3af;">W</div>
                <div style="font-weight:700; color:#9ca3af;">T</div>
                <div style="font-weight:700; color:#9ca3af;">F</div>
                <div style="font-weight:700; color:#9ca3af;">S</div>
                ${calendarHTML}
            </div>
            <div style="margin-top:0.6rem; display:flex; flex-wrap:wrap; gap:0.4rem; font-size:0.55rem; color:#6b7280; justify-content:center;">
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#b91c1c; border-radius:50%;"></span> Leave</span>
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#166534; border-radius:50%;"></span> Event</span>
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#eee; border-radius:50%; border:0.5px solid #ccc;"></span> Holiday</span>
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#fffbeb; border-radius:50%; border:0.5px solid #d97706;"></span> Half</span>
            </div>
            <style>
                .cal-day { padding: 4px; border-radius: 4px; position: relative; transition: all 0.2s; border: 1px solid transparent; }
                .cal-day:hover:not(.empty) { background: #f3f4f6; }
                .cal-day.today { background: var(--primary) !important; color: white !important; font-weight: 700; border-color: transparent !important; }
                .cal-day.has-leave { background: #fee2e2; color: #b91c1c; }
                .cal-day.has-event { background: #dcfce7; color: #166534; }
                .cal-day.has-work { border-color: #818cf8; }
                .cal-day.is-holiday { background: #f9fafb; color: #9ca3af; opacity: 0.8; }
                .cal-day.is-half-day { background: #fffbeb; color: #d97706; border-color: #fde68a; }
                .cal-day.empty { visibility: hidden; }
            </style>
        </div>
    `;
};
