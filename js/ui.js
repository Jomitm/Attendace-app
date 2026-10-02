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

import { renderStaffDirectoryPage } from './ui/staff-directory.js';
import { renderProfile } from './ui/profile.js';
import { renderMinutes } from './ui/minutes-ui.js';

// Bundle shrink: these pages are routed lazily, so each becomes its own chunk
// instead of inflating the main bundle. Every call site already awaits them,
// which makes the returned promise transparent.
const lazyPage = (load, key) => (...args) => load().then(mod => mod[key](...args));
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
import { renderTeamActivitiesPage } from './ui/team-activities.js';
import { renderDashboardSectionPage, initDashboardSectionPage } from './ui/dashboard-sections.js';
import { renderLetterPad } from './ui/letter-pad.js';
import { renderJourneyReflectionCard } from './ui/journey-reflection.js';
import { initDashboardLayout, toggleEditMode, applyDashboardLayout, isEditModeActive } from './ui/dashboard-layout.js';
import { renderKanbanBoard, initKanbanBoard, startKanbanRealtimeListener, stopKanbanRealtimeListener } from './ui/kanban-board.js';
import { renderViewToggle, initViewToggle, ensureViewToggleCSS } from './ui/view-toggle.js';
import { renderAICenter, initAICenter } from './ui/ai-center.js';

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
