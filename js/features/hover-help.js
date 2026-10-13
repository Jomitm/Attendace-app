// Hover-help tooltip system + page usage notes.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml } from '../utils/html-escape.js';

const HOVER_HELP_SELECTOR = [
    'button',
    'a[href]',
    '[role="button"]',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'label',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

const HOVER_HELP_PAGE_MESSAGES = Object.freeze({
    dashboard: 'Open the dashboard overview.',
    'team-activities': 'View recent team activity updates.',
    'staff-directory': 'Browse the staff directory.',
    policies: 'Read attendance and office policies.',
    'annual-plan': 'View the annual work plan.',
    'birthday-calendar': 'View or manage birthdays.',
    timesheet: 'Review attendance and work logs.',
    minutes: 'Open meeting notes and decisions.',
    admin: 'Open admin tools and reports.',
    'master-sheet': 'Review the attendance sheet.',
    salary: 'Open salary processing tools.',
    'policy-test': 'Open the policy test page.',
    widget: 'Open the compact widget view.',
    profile: 'Open your profile and settings.'
});

const HOVER_HELP_ACTIONS = [
    { pattern: /notification/i, message: 'Open notification history.' },
    { pattern: /toggle sidebar|menu/i, message: 'Show or hide the sidebar menu.' },
    { pattern: /sign out|logout/i, message: 'Sign out of the app.' },
    { pattern: /check[\s-]?in/i, message: 'Mark your check-in for the day.' },
    { pattern: /check[\s-]?out/i, message: 'Mark your check-out for the day.' },
    { pattern: /save/i, message: 'Save your changes.' },
    { pattern: /edit/i, message: 'Edit this item.' },
    { pattern: /delete|remove|trash/i, message: 'Remove this item.' },
    { pattern: /close|cancel/i, message: 'Close this panel.' },
    { pattern: /search/i, message: 'Search the current records.' },
    { pattern: /filter/i, message: 'Filter the current list.' },
    { pattern: /export|download/i, message: 'Export this data.' },
    { pattern: /approve/i, message: 'Approve this request.' },
    { pattern: /reject/i, message: 'Reject this request.' },
    { pattern: /message|chat/i, message: 'Open a message window.' },
    { pattern: /view|details|info/i, message: 'View more details.' },
    { pattern: /\bnext\b/i, message: 'Go to the next page.' },
    { pattern: /\bprev\b|\bprevious\b/i, message: 'Go to the previous page.' },
    { pattern: /add|new|create/i, message: 'Add a new item.' },
    { pattern: /submit/i, message: 'Submit this form.' },
    { pattern: /refresh|update/i, message: 'Check for the latest updates.' },
    { pattern: /\btoday\b/i, message: 'Jump to today.' }
];

let hoverHelpTooltipEl = null;
let hoverHelpActiveTarget = null;
let hoverHelpHideTimer = null;

const cleanHoverHelpText = (text = '') => {
    return String(text || '')
        .replace(/\s+/g, ' ')
        .replace(/\s*[\r\n]+\s*/g, ' ')
        .replace(/[|•]+/g, ' ')
        .trim();
};

const toHoverHelpSentence = (text, prefix) => {
    const cleaned = cleanHoverHelpText(text).replace(/[.:!?]+$/, '');
    if (!cleaned) return '';
    const normalized = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    return `${prefix} ${normalized}.`;
};

const getHoverHelpTextContent = (element) => {
    if (!element) return '';
    return cleanHoverHelpText(
        element.getAttribute?.('data-hover-help')
        || element.getAttribute?.('aria-label')
        || element.getAttribute?.('title')
        || element.innerText
        || element.textContent
        || ''
    );
};

const getHoverHelpFieldLabel = (element) => {
    if (!element) return '';

    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
        const combined = labelledBy
            .split(/\s+/)
            .map(id => document.getElementById(id))
            .filter(Boolean)
            .map(node => cleanHoverHelpText(node.textContent))
            .filter(Boolean)
            .join(' ');
        if (combined) return combined;
    }

    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        const labelText = cleanHoverHelpText(label?.textContent || '');
        if (labelText) return labelText;
    }

    const wrappingLabel = element.closest('label');
    return cleanHoverHelpText(wrappingLabel?.textContent || '');
};

const getHoverHelpFieldMessage = (element) => {
    const labelText = getHoverHelpFieldLabel(element)
        || cleanHoverHelpText(element.getAttribute('placeholder') || '');
    const lowerLabel = labelText.replace(/[.:!?]+$/, '').trim().toLowerCase();

    if (element.matches('input[type="search"], [type="search"]')) {
        return lowerLabel ? `Search ${lowerLabel}.` : 'Search the current records.';
    }
    if (element.matches('input[type="date"]')) {
        return lowerLabel ? `Choose ${lowerLabel}.` : 'Choose a date.';
    }
    if (element.matches('input[type="time"]')) {
        return lowerLabel ? `Choose ${lowerLabel}.` : 'Choose a time.';
    }
    if (element.matches('input[type="checkbox"], input[type="radio"]')) {
        return lowerLabel ? `Select ${lowerLabel}.` : 'Select this option.';
    }
    if (element.tagName === 'SELECT') {
        return lowerLabel ? `Choose ${lowerLabel}.` : 'Choose an option.';
    }
    if (element.tagName === 'TEXTAREA') {
        return lowerLabel ? `Write ${lowerLabel}.` : 'Write your notes here.';
    }
    return lowerLabel ? `Enter ${lowerLabel}.` : 'Enter a value here.';
};

const getHoverHelpActionMessage = (text) => {
    const cleaned = cleanHoverHelpText(text);
    if (!cleaned) return '';
    const match = HOVER_HELP_ACTIONS.find(entry => entry.pattern.test(cleaned));
    return match ? match.message : '';
};

const getHoverHelpMessage = (element) => {
    if (!element || element.matches('[disabled], [aria-hidden="true"]')) return '';

    const explicit = cleanHoverHelpText(
        element.getAttribute('data-hover-help')
        || element.getAttribute('data-tooltip')
        || element.getAttribute('aria-description')
    );
    if (explicit) return explicit.endsWith('.') ? explicit : `${explicit}.`;

    const pageKey = cleanHoverHelpText(element.getAttribute('data-page') || '').toLowerCase();
    if (pageKey && HOVER_HELP_PAGE_MESSAGES[pageKey]) {
        return HOVER_HELP_PAGE_MESSAGES[pageKey];
    }

    if (element.matches('input:not([type="hidden"]), select, textarea')) {
        return getHoverHelpFieldMessage(element);
    }

    const text = getHoverHelpTextContent(element);
    const actionMessage = getHoverHelpActionMessage(text);
    if (actionMessage) return actionMessage;

    if (element.matches('a[href]') && text) {
        return toHoverHelpSentence(text, 'Open');
    }
    if (element.matches('button, [role="button"], label')) {
        if (text) return toHoverHelpSentence(text, 'Use');
        return 'Use this control.';
    }

    return text ? `${text.replace(/[.:!?]+$/, '')}.` : '';
};

const ensureHoverHelpTooltip = () => {
    if (hoverHelpTooltipEl) return hoverHelpTooltipEl;
    const el = document.createElement('div');
    el.id = 'app-hover-help-tooltip';
    el.className = 'app-hover-help-tooltip';
    el.setAttribute('role', 'tooltip');
    document.body.appendChild(el);
    hoverHelpTooltipEl = el;
    return el;
};

const clearHoverHelpHideTimer = () => {
    if (!hoverHelpHideTimer) return;
    clearTimeout(hoverHelpHideTimer);
    hoverHelpHideTimer = null;
};

const restoreNativeTitle = (element) => {
    if (!element?.dataset?.hoverHelpNativeTitle) return;
    element.setAttribute('title', element.dataset.hoverHelpNativeTitle);
    delete element.dataset.hoverHelpNativeTitle;
};

const positionHoverHelpTooltip = (originEvent = null, target = hoverHelpActiveTarget) => {
    if (!hoverHelpTooltipEl || !target) return;

    const margin = 16;
    let left = margin;
    let top = margin;

    if (originEvent?.clientX != null && originEvent?.clientY != null) {
        left = originEvent.clientX - (hoverHelpTooltipEl.offsetWidth / 2);
        top = originEvent.clientY + 14;
    } else {
        const rect = target.getBoundingClientRect();
        left = rect.left + ((rect.width - hoverHelpTooltipEl.offsetWidth) / 2);
        top = rect.bottom + 14;
    }

    const tooltipRect = hoverHelpTooltipEl.getBoundingClientRect();
    if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
    }
    if (top + tooltipRect.height > window.innerHeight - margin) {
        top = window.innerHeight - tooltipRect.height - margin;
    }
    if (top < margin) top = margin;
    if (left < margin) left = margin;

    hoverHelpTooltipEl.style.left = `${left}px`;
    hoverHelpTooltipEl.style.top = `${top}px`;
};

const hideHoverHelpTooltip = () => {
    clearHoverHelpHideTimer();
    restoreNativeTitle(hoverHelpActiveTarget);
    hoverHelpActiveTarget = null;
    if (!hoverHelpTooltipEl) return;
    hoverHelpTooltipEl.classList.remove('is-visible');
    hoverHelpTooltipEl.textContent = '';
};

const showHoverHelpTooltip = (target, originEvent = null) => {
    const message = getHoverHelpMessage(target);
    if (!message) {
        hideHoverHelpTooltip();
        return;
    }

    clearHoverHelpHideTimer();

    if (hoverHelpActiveTarget && hoverHelpActiveTarget !== target) {
        restoreNativeTitle(hoverHelpActiveTarget);
    }

    hoverHelpActiveTarget = target;
    const tooltip = ensureHoverHelpTooltip();
    if (tooltip.textContent !== message) {
        tooltip.textContent = message;
    }
    if (!tooltip.classList.contains('is-visible')) {
        tooltip.classList.add('is-visible');
    }

    if (target.hasAttribute('title') && !target.dataset.hoverHelpNativeTitle) {
        target.dataset.hoverHelpNativeTitle = target.getAttribute('title') || '';
        target.removeAttribute('title');
    }

    positionHoverHelpTooltip(originEvent, target);
};

const _initHoverHelp = () => {
    if (window.__appHoverHelpInitialized) return;
    window.__appHoverHelpInitialized = true;

    document.addEventListener('mouseover', (event) => {
        const source = event.target instanceof Element ? event.target : event.target?.parentElement;
        const target = source?.closest(HOVER_HELP_SELECTOR);
        if (!target || !document.body.contains(target)) return;
        if (target === hoverHelpActiveTarget) {
            clearHoverHelpHideTimer();
            positionHoverHelpTooltip(event, target);
            return;
        }
        showHoverHelpTooltip(target, event);
    });

    document.addEventListener('mousemove', (event) => {
        if (!hoverHelpActiveTarget) return;
        positionHoverHelpTooltip(event);
    });

    document.addEventListener('mouseout', (event) => {
        if (!hoverHelpActiveTarget) return;
        const source = event.target instanceof Element ? event.target : event.target?.parentElement;
        if (source && !hoverHelpActiveTarget.contains(source) && source !== hoverHelpActiveTarget) return;
        const nextTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
        if (nextTarget && hoverHelpActiveTarget.contains(nextTarget)) return;
        if (nextTarget && nextTarget.closest?.(HOVER_HELP_SELECTOR) === hoverHelpActiveTarget) return;
        clearHoverHelpHideTimer();
        hoverHelpHideTimer = setTimeout(() => {
            hideHoverHelpTooltip();
        }, 70);
    });

    document.addEventListener('focusin', (event) => {
        const source = event.target instanceof Element ? event.target : event.target?.parentElement;
        const target = source?.closest(HOVER_HELP_SELECTOR);
        if (!target) return;
        showHoverHelpTooltip(target);
    });

    document.addEventListener('focusout', () => {
        hideHoverHelpTooltip();
    });

    window.addEventListener('scroll', () => {
        if (!hoverHelpActiveTarget) return;
        positionHoverHelpTooltip(null, hoverHelpActiveTarget);
    }, true);

    window.addEventListener('resize', () => {
        if (!hoverHelpActiveTarget) return;
        positionHoverHelpTooltip(null, hoverHelpActiveTarget);
    });
};

const PAGE_USAGE_NOTES = Object.freeze({
    'team-activities': {
        title: 'How To Use This Page',
        why: 'This page helps you review what the team has been working on, track progress, and spot overdue or blocked work in one place.',
        how: 'Use the filters to narrow by date, type, status, or staff member. Open the records to review details, compare activity across people, and move through pages when the list is long.'
    },
    'staff-directory': {
        title: 'How To Use This Page',
        why: 'This page is for staff communication and quick follow-up. It keeps person-to-person messages and task discussions organized by staff member.',
        how: 'Choose a staff member from the list, read the conversation history, then send a message or review assigned tasks. Return here whenever you need to continue a discussion with someone on the team.'
    },
    policies: {
        title: 'How To Use This Page',
        why: 'This page explains attendance rules, holidays, working hours, and policy settings so everyone follows the same process.',
        how: 'Read the sections before taking action on attendance, leave, or office timing questions. Admin users can update policy values here, while staff should use it as the main reference page.'
    },
    'annual-plan': {
        title: 'How To Use This Page',
        why: 'This page gives a year-wide view of planned work so you can understand schedules, deadlines, and major activities across the calendar.',
        how: 'Switch between views, filter by staff, search the list, and jump to important dates. Open a day when you want to inspect or plan work for that specific date.'
    },
    'birthday-calendar': {
        title: 'How To Use This Page',
        why: 'This page keeps birthday records organized so the team can manage celebrations and maintain correct staff details.',
        how: 'Review upcoming birthdays, add missing entries, or update existing records when details change. Use it as the central place for birthday-related staff information.'
    },
    timesheet: {
        title: 'How To Use This Page',
        why: 'This page is for checking attendance history, work duration, and day-by-day time records.',
        how: 'Use the available filters or date controls to inspect your logs, verify hours, and open details when something looks incorrect. It is the best page to review your past attendance entries.'
    },
    profile: {
        title: 'How To Use This Page',
        why: 'This page shows your personal staff profile, attendance summary, and leave-related information in one place.',
        how: 'Use it to review your details, check your current status, and look at summary numbers for attendance and leave. Admin users can also switch between staff profiles when needed.'
    },
    minutes: {
        title: 'How To Use This Page',
        why: 'This page is for recording meeting discussions, decisions, action items, and approvals so nothing important is lost after a meeting.',
        how: 'Create a meeting record, write the discussion summary, add action items with owners, and review approval or edit history. Use search to quickly find older meetings.'
    },
    admin: {
        title: 'How To Use This Page',
        why: 'This page gives administrators control over reports, staff management, attendance monitoring, and approval workflows.',
        how: 'Use the filters and admin tools to inspect records, approve requests, review trends, and take corrective actions. Changes here can affect multiple users, so review entries carefully before saving.'
    },
    'master-sheet': {
        title: 'How To Use This Page',
        why: 'This page provides a sheet-style attendance view so you can inspect staff presence, absences, holidays, and exceptions across many dates at once.',
        how: 'Scan rows and columns to compare attendance patterns quickly. Admin users can open cells for detailed review or corrections where needed.'
    },
    salary: {
        title: 'How To Use This Page',
        why: 'This page supports salary preparation by combining attendance-based calculations and payroll-related values in one working area.',
        how: 'Review staff rows carefully, check attendance-driven inputs, and update values before final processing. Use it when payroll needs to be prepared from attendance data.'
    },
    'policy-test': {
        title: 'How To Use This Page',
        why: 'This page helps verify whether policy logic and rules are behaving as expected before relying on them in day-to-day use.',
        how: 'Run the available checks, compare outcomes, and confirm that policy behavior matches the intended rules. It is mainly for validation and troubleshooting.'
    }
});

const createPageUsageNoteMarkup = (pageKey) => {
    const note = PAGE_USAGE_NOTES[pageKey];
    if (!note) return '';
    const title = escapeDialogHtml(note.title || 'How To Use This Page');
    const why = escapeDialogHtml(note.why || '');
    const how = escapeDialogHtml(note.how || '');
    return `
        <section class="page-usage-note" id="page-usage-note" data-page-key="${escapeDialogHtml(pageKey)}" aria-label="Page help note">
            <div class="page-usage-note-header">
                <i class="fa-solid fa-circle-info"></i>
                <h3>${title}</h3>
            </div>
            <p><strong>Why this page exists:</strong> ${why}</p>
            <p><strong>How to use it:</strong> ${how}</p>
        </section>
    `;
};

const applyPageUsageNote = () => {
    const host = document.getElementById('page-content');
    if (!host) return;

    const pageKey = String(window.location.hash || '').replace(/^#/, '') || 'dashboard';
    const existing = host.querySelector('#page-usage-note');

    if (pageKey === 'dashboard') {
        existing?.remove();
        return;
    }

    const markup = createPageUsageNoteMarkup(pageKey);
    if (!markup) {
        existing?.remove();
        return;
    }

    if (existing?.dataset.pageKey === pageKey) return;

    existing?.remove();
    host.insertAdjacentHTML('beforeend', markup);
};

export const initPageUsageNotes = () => {
    if (window.__appPageUsageNotesInitialized) return;
    window.__appPageUsageNotesInitialized = true;

    const bindObserver = () => {
        const host = document.getElementById('page-content');
        if (!host || host.__pageUsageObserverBound) return;

        const observer = new MutationObserver(() => {
            if (host.dataset.applyingUsageNote === '1') return;
            host.dataset.applyingUsageNote = '1';
            try {
                applyPageUsageNote();
            } finally {
                delete host.dataset.applyingUsageNote;
            }
        });

        observer.observe(host, { childList: true });
        host.__pageUsageObserverBound = true;
        applyPageUsageNote();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindObserver, { once: true });
    } else {
        bindObserver();
    }

    window.addEventListener('hashchange', () => {
        requestAnimationFrame(() => {
            applyPageUsageNote();
        });
    });
};
