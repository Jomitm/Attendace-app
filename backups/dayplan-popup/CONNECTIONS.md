# Day Plan Popup Connections Backup (2026-02-26)

## Purpose
Backup reference before disabling/removing Day Plan popup UI.

## Primary public functions
- window.app_openDayPlan(date, targetUserId, forcedScope)
- window.app_addPlanBlockUI()
- window.app_saveDayPlan(e, date, targetUserId)
- window.app_deleteDayPlan(date, targetUserId, planScope)

## Core popup DOM/selector contract
- #day-plan-modal
- #plans-container
- .plan-block
- .plan-task
- .sub-plan-input
- .plan-scope
- .plan-status
- .plan-assignee
- .plan-start-date
- .plan-end-date
- .tag-chip
- .tags-container

## Known trigger points
- js/ui.js:140-141 (activity action -> app_openDayPlan)
- js/ui.js:204 (dashboard admin edit button)
- js/ui.js:406 (dashboard status row edit button)
- js/ui.js:785 (calendar day click)
- js/ui.js:2673 (annual selected day quick button)
- js/app.js:2033 (annual day popup button -> app_openDayPlan)

## Snapshot backup
- backups/dayplan-popup/app.js.pre-dayplan-popup-removal-2026-02-26.js
