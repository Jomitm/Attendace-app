/**
 * UI Module (Main Entry)
 * Centrally exports all UI rendering components as ES Modules.
 * This file replaces the monolithic ui.js and provides backward compatibility.
 */

import {
    renderDashboard,
    renderHeroCard,
    renderWorkLog,
    renderActivityList,
    renderActivityLog,
    renderStaffActivityListSplit,
    renderStaffActivityColumn,
    renderStatsCard,
    renderBreakdown,
    renderLeaveRequests,
    renderLeaveHistory,
    renderNotificationPanel,
    renderTaggedItems,
    renderStaffDirectory
} from './ui/dashboard.js';

// Route-only pages load on demand; every routed render call awaits the result.
const lazyPage = (load, key) => (...args) => load().then(mod => mod[key](...args));
const renderStaffDirectoryPage = lazyPage(() => import('./ui/staff-directory.js'), 'renderStaffDirectoryPage');
const renderProfile = lazyPage(() => import('./ui/profile.js'), 'renderProfile');
const renderMinutes = lazyPage(() => import('./ui/minutes-ui.js'), 'renderMinutes');

// Bundle shrink: these pages are routed lazily, so each becomes its own chunk
// instead of inflating the main bundle. Every call site already awaits them,
// which makes the returned promise transparent.
const renderAnnualPlan = lazyPage(() => import('./ui/annual-plan.js'), 'renderAnnualPlan');
const renderTimesheet = lazyPage(() => import('./ui/timesheet.js'), 'renderTimesheet');
const renderMasterSheet = lazyPage(() => import('./ui/master-sheet.js'), 'renderMasterSheet');
const renderAdmin = lazyPage(() => import('./ui/admin.js'), 'renderAdmin');
const renderBirthdayCalendar = lazyPage(() => import('./ui/birthday-calendar.js'), 'renderBirthdayCalendar');
const renderSalaryProcessing = lazyPage(() => import('./ui/payroll.js'), 'renderSalaryProcessing');
const renderPolicyTest = lazyPage(() => import('./ui/payroll.js'), 'renderPolicyTest');
import { renderCheckInModal, renderCheckoutModal } from './ui/attendance-modals.js';
import { renderLogin, renderOwnerLogin, renderOwnerPasswordSetup } from './ui/auth-pages.js';
import { renderModals } from './ui/global-modals.js';
import { renderYearlyPlan } from './ui/team-schedule.js';
const renderTeamActivitiesPage = lazyPage(() => import('./ui/team-activities.js'), 'renderTeamActivitiesPage');
const renderDashboardSectionPage = lazyPage(() => import('./ui/dashboard-sections.js'), 'renderDashboardSectionPage');
const initDashboardSectionPage = lazyPage(() => import('./ui/dashboard-sections.js'), 'initDashboardSectionPage');
const renderLetterPad = lazyPage(() => import('./ui/letter-pad.js'), 'renderLetterPad');
const renderJourneyReflectionCard = lazyPage(() => import('./ui/journey-reflection.js'), 'renderJourneyReflectionCard');
const initDashboardLayout = lazyPage(() => import('./ui/dashboard-layout.js'), 'initDashboardLayout');
const toggleEditMode = lazyPage(() => import('./ui/dashboard-layout.js'), 'toggleEditMode');
const applyDashboardLayout = lazyPage(() => import('./ui/dashboard-layout.js'), 'applyDashboardLayout');
const isEditModeActive = lazyPage(() => import('./ui/dashboard-layout.js'), 'isEditModeActive');
const renderKanbanBoard = lazyPage(() => import('./ui/kanban-board.js'), 'renderKanbanBoard');
const initKanbanBoard = lazyPage(() => import('./ui/kanban-board.js'), 'initKanbanBoard');
const startKanbanRealtimeListener = lazyPage(() => import('./ui/kanban-board.js'), 'startKanbanRealtimeListener');
const stopKanbanRealtimeListener = lazyPage(() => import('./ui/kanban-board.js'), 'stopKanbanRealtimeListener');
const renderViewToggle = lazyPage(() => import('./ui/view-toggle.js'), 'renderViewToggle');
const initViewToggle = lazyPage(() => import('./ui/view-toggle.js'), 'initViewToggle');
const ensureViewToggleCSS = lazyPage(() => import('./ui/view-toggle.js'), 'ensureViewToggleCSS');
const renderAICenter = lazyPage(() => import('./ui/ai-center.js'), 'renderAICenter');
const initAICenter = lazyPage(() => import('./ui/ai-center.js'), 'initAICenter');

// Re-export for ESM usage
export {
    renderDashboard,
    renderHeroCard,
    renderWorkLog,
    renderActivityList,
    renderActivityLog,
    renderStaffActivityListSplit,
    renderStaffActivityColumn,
    renderStatsCard,
    renderBreakdown,
    renderLeaveRequests,
    renderLeaveHistory,
    renderNotificationPanel,
    renderTaggedItems,
    renderStaffDirectory,
    renderStaffDirectoryPage,
    renderAnnualPlan,
    renderTimesheet,
    renderProfile,
    renderMasterSheet,
    renderAdmin,
    renderBirthdayCalendar,
    renderSalaryProcessing,
    renderPolicyTest,
    renderMinutes,
    renderCheckInModal,
    renderCheckoutModal,
    renderLogin,
    renderOwnerLogin,
    renderOwnerPasswordSetup,
    renderModals,
    renderYearlyPlan,
    renderTeamActivitiesPage,
    renderDashboardSectionPage,
    initDashboardSectionPage,
    renderLetterPad,
    renderJourneyReflectionCard,
    initDashboardLayout,
    toggleEditMode,
    applyDashboardLayout,
    isEditModeActive,
    renderKanbanBoard,
    initKanbanBoard,
    startKanbanRealtimeListener,
    stopKanbanRealtimeListener,
    renderViewToggle,
    initViewToggle,
    ensureViewToggleCSS,
    renderAICenter,
    initAICenter
};

export const AppUI = {
    renderDashboard,
    renderHeroCard,
    renderWorkLog,
    renderActivityList,
    renderActivityLog,
    renderStaffActivityListSplit,
    renderStaffActivityColumn,
    renderStatsCard,
    renderBreakdown,
    renderLeaveRequests,
    renderLeaveHistory,
    renderNotificationPanel,
    renderTaggedItems,
    renderStaffDirectory,
    renderStaffDirectoryPage,
    renderAnnualPlan,
    renderTimesheet,
    renderProfile,
    renderMasterSheet,
    renderAdmin,
    renderBirthdayCalendar,
    renderSalaryProcessing,
    renderPolicyTest,
    renderMinutes,
    renderCheckInModal,
    renderCheckoutModal,
    renderLogin,
    renderOwnerLogin,
    renderOwnerPasswordSetup,
    renderModals,
    renderYearlyPlan,
    renderTeamActivitiesPage,
    renderDashboardSectionPage,
    initDashboardSectionPage,
    renderLetterPad,
    renderJourneyReflectionCard,
    initDashboardLayout,
    toggleEditMode,
    applyDashboardLayout,
    isEditModeActive,
    renderKanbanBoard,
    initKanbanBoard,
    startKanbanRealtimeListener,
    stopKanbanRealtimeListener,
    renderViewToggle,
    initViewToggle,
    ensureViewToggleCSS,
    renderAICenter,
    initAICenter
};


if (typeof window !== 'undefined') {
    window.AppUI = AppUI;
}

export default AppUI;
