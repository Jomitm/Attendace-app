// App setup: navigation, theme, hidden sheets, service worker.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml } from '../utils/html-escape.js';
import AppUI from '../ui.js';

// Module-scoped state for service worker
let appServiceWorkerRegistration = null;

// Module-scoped state for auto-collapse timer
let autoCollapseTimer = null;
const SIDEBAR_AUTO_HIDE_KEY = 'crwi_sidebar_auto_hide';

const app_applySidebarAutoHide = (enabled) => {
    const sidebar = document.querySelector('.app-container > .sidebar');
    const toggle = document.getElementById('desktop-sidebar-autohide-toggle');
    const handle = document.getElementById('sidebar-auto-hide-handle');
    if (!sidebar) return false;

    sidebar.classList.toggle('auto-hide-enabled', !!enabled);
    sidebar.classList.remove('auto-hide-open');
    if (enabled) sidebar.classList.remove('collapsed');

    if (toggle) {
        toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        toggle.title = enabled ? 'Turn off Auto-hide' : 'Turn on Auto-hide';
        toggle.setAttribute('aria-label', enabled ? 'Turn off Auto-hide sidebar' : 'Turn on Auto-hide sidebar');
        toggle.classList.toggle('is-active', !!enabled);
    }
    if (handle) handle.setAttribute('aria-expanded', 'false');

    return true;
};

const app_setSidebarAutoHide = (enabled, persist = true) => {
    const value = !!enabled;
    if (persist) {
        try {
            localStorage.setItem(SIDEBAR_AUTO_HIDE_KEY, value ? 'true' : 'false');
        } catch (err) {
            console.warn('Failed to save sidebar auto-hide preference:', err);
        }
    }
    app_applySidebarAutoHide(value);
    return value;
};
window.app_setSidebarAutoHide = app_setSidebarAutoHide;

window.app_toggleSidebarAutoHide = (event) => {
    const sidebar = document.querySelector('.app-container > .sidebar');
    if (!sidebar) return;
    app_setSidebarAutoHide(!sidebar.classList.contains('auto-hide-enabled'));
    if (Number(event?.detail) > 0) event.currentTarget?.blur?.();
};

window.app_revealAutoHideSidebar = (event) => {
    const sidebar = document.querySelector('.app-container > .sidebar');
    const handle = document.getElementById('sidebar-auto-hide-handle');
    if (!sidebar?.classList.contains('auto-hide-enabled')) return;
    sidebar.classList.add('auto-hide-open');
    handle?.setAttribute('aria-expanded', 'true');
    if (event?.detail === 0) {
        sidebar.querySelector('.nav-item:not([style*="display: none"])')?.focus();
    }
};

const app_closeAutoHideSidebar = ({ focusHandle = false } = {}) => {
    const sidebar = document.querySelector('.app-container > .sidebar');
    const handle = document.getElementById('sidebar-auto-hide-handle');
    if (!sidebar) return;
    sidebar.classList.remove('auto-hide-open');
    handle?.setAttribute('aria-expanded', 'false');
    if (focusHandle && sidebar.classList.contains('auto-hide-enabled')) handle?.focus();
};

const app_initSidebarAutoHide = () => {
    const sidebar = document.querySelector('.app-container > .sidebar');
    const handle = document.getElementById('sidebar-auto-hide-handle');
    if (!sidebar) return;

    let enabled = false;
    try {
        enabled = localStorage.getItem(SIDEBAR_AUTO_HIDE_KEY) === 'true';
    } catch (err) {
        console.warn('Failed to read sidebar auto-hide preference:', err);
    }
    app_applySidebarAutoHide(enabled);

    if (sidebar.dataset.autoHideListenersAttached === 'true') return;
    sidebar.dataset.autoHideListenersAttached = 'true';

    sidebar.addEventListener('mouseleave', () => app_closeAutoHideSidebar());
    sidebar.addEventListener('click', (event) => {
        if (Number(event.detail) <= 0 || !sidebar.classList.contains('auto-hide-enabled')) return;
        if (!event.target?.closest?.('.nav-item, .nav-section-header, #desktop-sidebar-autohide-toggle')) return;
        setTimeout(() => {
            const activeElement = document.activeElement;
            if (activeElement && sidebar.contains(activeElement)) activeElement.blur?.();
        }, 0);
    });
    document.addEventListener('click', (event) => {
        if (!sidebar.classList.contains('auto-hide-open')) return;
        if (sidebar.contains(event.target) || handle?.contains(event.target)) return;
        app_closeAutoHideSidebar();
        if (sidebar.contains(document.activeElement)) document.activeElement.blur?.();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !sidebar.classList.contains('auto-hide-open')) return;
        app_closeAutoHideSidebar({ focusHandle: true });
    });
};
window.app_initSidebarAutoHide = app_initSidebarAutoHide;

// --- Navigation Section Management (Collapsible Categories) ---

/**
 * Get collapse state from localStorage
 */
const app_getNavSectionCollapsed = (sectionName) => {
    try {
        const stored = localStorage.getItem(`nav_section_${sectionName}_collapsed`);
        if (stored === null) return false; // Default to expanded on first load
        return stored === 'true';
    } catch (err) {
        console.warn('Failed to get nav section collapsed state:', err);
        return false;
    }
};
window.app_getNavSectionCollapsed = app_getNavSectionCollapsed;

/**
 * Set collapse state in localStorage
 */
const app_setNavSectionCollapsed = (sectionName, isCollapsed) => {
    try {
        localStorage.setItem(`nav_section_${sectionName}_collapsed`, isCollapsed ? 'true' : 'false');
    } catch (err) {
        console.warn('Failed to set nav section collapsed state:', err);
    }
};
window.app_setNavSectionCollapsed = app_setNavSectionCollapsed;

/**
 * Toggle a navigation section's collapse state
 */
const app_toggleNavSection = (sectionName) => {
    const section = document.querySelector(`.nav-section[data-section="${sectionName}"]`);
    if (!section) return;

    const header = section.querySelector('.nav-section-header');
    if (!header) return;

    const isCurrentlyCollapsed = header.dataset.collapsed === 'true';
    const newCollapsedState = !isCurrentlyCollapsed;

    header.dataset.collapsed = newCollapsedState ? 'true' : 'false';
    window.app_setNavSectionCollapsed(sectionName, newCollapsedState);
    
    // Reset auto-collapse timer on user interaction
    window.app_resetAutoCollapseTimer();
};
window.app_toggleNavSection = app_toggleNavSection;

/**
 * Initialize section toggle handlers and restore collapse states
 */
/**
 * Initialize section toggle handlers and restore collapse states
 */
const app_initSectionToggle = () => {
    app_initSidebarAutoHide();
    const headers = document.querySelectorAll('.nav-section-header');
    headers.forEach(header => {
        const section = header.closest('.nav-section');
        if (!section) return;

        const sectionName = section.dataset.section;
        if (!sectionName) return;

        // Restore collapse state from localStorage
        const isCollapsed = window.app_getNavSectionCollapsed(sectionName);
        header.dataset.collapsed = isCollapsed ? 'true' : 'false';

        // Add click event listener only if not already added (check for data attribute)
        if (header.dataset.listenerAttached !== 'true') {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.app_toggleNavSection(sectionName);
            });
            header.dataset.listenerAttached = 'true';
        }
    });
    
    // Start auto-collapse timer on initialization
    window.app_startAutoCollapseTimer();
};
window.app_initSectionToggle = app_initSectionToggle;

// Auto-collapse timer variable


/**
 * Start auto-collapse timer (5 minutes)
 */
const app_startAutoCollapseTimer = () => {
    window.app_resetAutoCollapseTimer();
};
window.app_startAutoCollapseTimer = app_startAutoCollapseTimer;

/**
 * Reset auto-collapse timer
 */
const app_resetAutoCollapseTimer = () => {
    if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer);
    }
    
    autoCollapseTimer = setTimeout(() => {
        window.app_autoCollapseSections();
    }, 5 * 60 * 1000); // 5 minutes
};
window.app_resetAutoCollapseTimer = app_resetAutoCollapseTimer;

/**
 * Auto-collapse all sections except CORE
 */
const app_autoCollapseSections = () => {
    const sections = document.querySelectorAll('.nav-section');
    sections.forEach(section => {
        const sectionName = section.dataset.section;
        if (!sectionName) return;
        
        // Skip CORE section - keep it expanded
        if (sectionName === 'core') return;
        
        const header = section.querySelector('.nav-section-header');
        if (header) {
            header.dataset.collapsed = 'true';
            window.app_setNavSectionCollapsed(sectionName, true);
        }
    });
};

window.app_autoCollapseSections = app_autoCollapseSections;

/**
 * Update navigation sections visibility and item visibility based on user permissions
 */
const app_updateNavigationSections = (user = window.AppAuth?.getUser()) => {
    // allow this function to run even when `user` is not yet available
    if (!user) {
        user = window.AppAuth?.getUser();
    }

    // Determine what each user can see
    const overrideShowHiddenSheets = (window.app_getShowHiddenSheets && window.app_getShowHiddenSheets()) || false;
    const canSeeDashboard = window.app_hasPerm('dashboard', 'view', user);
    const _canSeeLeaves = window.app_hasPerm('leaves', 'view', user);
    const canSeeUsers = window.app_hasPerm('users', 'view', user);
    // All signed-in staff have a personal attendance view; team access is checked by the sheet.
    const canSeeAttendance = !!user;
    const canSeeReports = window.app_hasPerm('reports', 'view', user) || overrideShowHiddenSheets;
    const canSeePoliciesAdmin = window.app_hasPerm('policies', 'view', user) || overrideShowHiddenSheets;
    const canSeeAdmin = window.app_canSeeAdminPanel(user) || overrideShowHiddenSheets;
    const canSeeBirthdayCalendar = window.app_canManageBirthdays(user) || overrideShowHiddenSheets;
    const canSeeLetterPad = window.app_canAccessLetterPad(user) || overrideShowHiddenSheets;
    const canSeeMinutes = window.app_hasPerm('minutes', 'view', user) || overrideShowHiddenSheets;

    // Update individual item visibility
    const itemVisibility = [
        { selector: 'a[data-page="dashboard"]', canSee: canSeeDashboard },
        { selector: 'a[data-page="staff-directory"]', canSee: canSeeUsers },
        { selector: 'a[data-page="annual-plan"]', canSee: canSeeDashboard },
        { selector: 'a[data-page="team-activities"]', canSee: canSeeDashboard },
        { selector: 'a[data-page="timesheet"]', canSee: canSeeAttendance },
        { selector: 'a[data-page="policies"]', canSee: canSeePoliciesAdmin },
        { selector: 'a[data-page="birthday-calendar"]', canSee: canSeeBirthdayCalendar },
        { selector: 'a[data-page="admin"]', canSee: canSeeAdmin },
        { selector: 'a[data-page="master-sheet"]', canSee: canSeeAttendance },
        { selector: 'a[data-page="salary"]', canSee: canSeeReports },
        { selector: 'a[data-page="policy-test"]', canSee: canSeePoliciesAdmin },
        { selector: 'a[data-page="letter-pad"]', canSee: canSeeLetterPad },
        { selector: 'a[data-page="minutes"]', canSee: canSeeMinutes },
        { selector: 'a[data-page="widget"]', canSee: true } // Widget mode always available
    ];

    itemVisibility.forEach(({ selector, canSee }) => {
        document.querySelectorAll(selector).forEach(link => {
            if (canSee) {
                // remove any previously-applied important display rule
                try { link.style.removeProperty('display'); } catch (err) { void err; }
                link.style.display = 'flex';
            } else {
                link.style.setProperty('display', 'none', 'important');
            }
        });
    });

    // Determine section visibility based on whether they have access to ANY visible item in that section.
    // Keep the section present for the user even when only one item is allowed, so the sidebar remains useful.
    const visibleCoreItems = [canSeeDashboard, canSeeUsers];
    const visibleHrItems = [canSeeAttendance, canSeePoliciesAdmin, canSeeBirthdayCalendar];
    const visibleToolsItems = [canSeeMinutes, canSeeLetterPad];
    const visibleAdminItems = [canSeeAdmin, canSeeReports, canSeePoliciesAdmin];

    const sectionVisiblity = {
        core: visibleCoreItems.some(Boolean),
        hr: visibleHrItems.some(Boolean),
        tools: visibleToolsItems.some(Boolean),
        admin: visibleAdminItems.some(Boolean)
    };

    // Update section visibility
    document.querySelectorAll('.nav-section').forEach(section => {
        const sectionName = section.dataset.section;
        if (!sectionName) return;

        const shouldBeVisible = sectionVisiblity[sectionName];
        if (shouldBeVisible === undefined) return;

        if (shouldBeVisible) {
            section.classList.remove('empty');
            section.style.display = '';
        } else {
            section.classList.add('empty');
            section.style.display = 'none';
        }
    });

    // Do the same for mobile nav sections
    document.querySelectorAll('.mobile-nav-section').forEach(section => {
        const sectionName = section.dataset.section;
        if (!sectionName) return;

        const shouldBeVisible = sectionVisiblity[sectionName];
        if (shouldBeVisible === undefined) return;

        if (shouldBeVisible) {
            section.classList.remove('empty');
        } else {
            section.classList.add('empty');
        }
    });
};
window.app_updateNavigationSections = app_updateNavigationSections;

// --- Read Optimization: Filtered Mailbox ---
const app_getMyMessages = async () => {
    const user = window.AppAuth.getUser();
    if (!user) return [];
    try {
        const [incoming, outgoing] = await Promise.all([
            window.AppDB.query('staff_messages', 'toId', '==', user.id),
            window.AppDB.query('staff_messages', 'fromId', '==', user.id)
        ]);
        // Merge and deduplicate by ID
        const map = new Map();
        (incoming || []).forEach(m => map.set(m.id, m));
        (outgoing || []).forEach(m => map.set(m.id, m));
        return Array.from(map.values());
    } catch (err) {
        console.warn("Message fetch failed, falling back to getAll", err);
        return window.AppDB.getAll('staff_messages');
    }
};
window.app_getMyMessages = app_getMyMessages;

// DOM Elements - queried dynamically or once if available

// --- Theme Management ---
const app_initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
};
window.app_initTheme = app_initTheme;

const app_toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
};
window.app_toggleTheme = app_toggleTheme;

function updateThemeIcons(theme) {
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
}

// --- Show Hidden Sheets Toggle (Settings override)
const app_getShowHiddenSheets = () => {
    try {
        return localStorage.getItem('show_hidden_sheets') === 'true';
    } catch {
        return false;
    }
};
window.app_getShowHiddenSheets = app_getShowHiddenSheets;

const app_setShowHiddenSheets = (value) => {
    try {
        localStorage.setItem('show_hidden_sheets', value ? 'true' : 'false');
    } catch {
        // ignore
    }
};
window.app_setShowHiddenSheets = app_setShowHiddenSheets;

const app_toggleShowHiddenSheets = () => {
    const next = !window.app_getShowHiddenSheets();
    window.app_setShowHiddenSheets(next);
    window.app_applyShowHiddenSheetsToggle();
    // Re-evaluate navigation visibility
    try { window.app_updateNavigationSections(); } catch (err) { void err; }
};
window.app_toggleShowHiddenSheets = app_toggleShowHiddenSheets;

const app_applyShowHiddenSheetsToggle = () => {
    const btn = document.getElementById('show-sheets-toggle');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (window.app_getShowHiddenSheets()) {
        btn.classList.add('active');
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    } else {
        btn.classList.remove('active');
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    }
};

window.app_applyShowHiddenSheetsToggle = app_applyShowHiddenSheetsToggle;

// Show last notification error if any (persisted across refresh)
window.addEventListener('load', () => {
    if (window.app_showLastNotifError) window.app_showLastNotifError();
}, { once: true });

// Ensure the Show Hidden Sheets toggle UI reflects persisted state on load
window.addEventListener('load', () => {
    try { window.app_applyShowHiddenSheetsToggle(); } catch (err) { void err; }
}, { once: true });

// Also apply toggle as early as DOMContentLoaded so nav visuals are correct sooner
document.addEventListener('DOMContentLoaded', () => {
    try { window.app_applyShowHiddenSheetsToggle(); } catch (err) { void err; }
    try { if (typeof window.app_initSectionToggle === 'function') window.app_initSectionToggle(); } catch (err) { void err; }
    try { if (typeof window.app_updateNavigationSections === 'function') window.app_updateNavigationSections(); } catch (err) { void err; }
}, { once: true });

function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    const host = String(window.location?.hostname || '').toLowerCase();
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocalHost) {
        console.log('ServiceWorker registration skipped on localhost');
        return;
    }

    const runRegistration = async () => {
        try {
            appServiceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registered');
        } catch (err) {
            console.log('ServiceWorker registration failed: ', err);
        }
    };

    if (document.readyState === 'complete') {
        void runRegistration();
        return;
    }

    window.addEventListener('load', () => {
        void runRegistration();
    }, { once: true });
}


// Initialize app setup: event listeners, theme, hidden sheets, nav sections, SW
export const initAppSetup = () => {
    window.addEventListener('load', () => {
        try { window.app_showLastNotifError(); } catch (err) { void err; }
        try { window.app_applyShowHiddenSheetsToggle(); } catch (err) { void err; }
        try { if (typeof window.app_initSectionToggle === 'function') window.app_initSectionToggle(); } catch (err) { void err; }
    }, { once: true });

    document.addEventListener('DOMContentLoaded', () => {
        try { window.app_applyShowHiddenSheetsToggle(); } catch (err) { void err; }
        try { if (typeof window.app_initSectionToggle === 'function') window.app_initSectionToggle(); } catch (err) { void err; }
        try { if (typeof window.app_updateNavigationSections === 'function') window.app_updateNavigationSections(); } catch (err) { void err; }
    }, { once: true });

    registerSW();
};


// Exports for init(), generated HTML, and other modules

export { app_autoCollapseSections };
export { app_getNavSectionCollapsed };
export { app_applyShowHiddenSheetsToggle };
export { app_getShowHiddenSheets };
export { app_initSectionToggle };
export { app_initTheme };
export { app_resetAutoCollapseTimer };
export { app_setNavSectionCollapsed };
export { app_setShowHiddenSheets };
export { app_startAutoCollapseTimer };
export { app_toggleNavSection };
export { app_toggleShowHiddenSheets };
export { app_updateNavigationSections };

// Function declarations (re-export)
export { registerSW };
export { updateThemeIcons };
