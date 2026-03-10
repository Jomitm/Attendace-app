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
import { renderAnnualPlan } from './ui/annual-plan.js';
import { renderTimesheet } from './ui/timesheet.js';
import { renderProfile } from './ui/profile.js';
import { renderMasterSheet } from './ui/master-sheet.js';
import { renderAdmin } from './ui/admin.js';
import { renderSalaryProcessing, renderPolicyTest } from './ui/payroll.js';
import { renderMinutes } from './ui/minutes-ui.js';
import { renderCheckInModal } from './ui/attendance-modals.js';
import { renderLogin } from './ui/auth-pages.js';
import { renderModals } from './ui/global-modals.js';
import { renderYearlyPlan } from './ui/team-schedule.js';

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
    renderSalaryProcessing,
    renderPolicyTest,
    renderMinutes,
    renderCheckInModal,
    renderLogin,
    renderModals,
    renderYearlyPlan
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
    renderSalaryProcessing,
    renderPolicyTest,
    renderMinutes,
    renderCheckInModal,
    renderLogin,
    renderModals,
    renderYearlyPlan
};


if (typeof window !== 'undefined') {
    window.AppUI = AppUI;
}

export default AppUI;
