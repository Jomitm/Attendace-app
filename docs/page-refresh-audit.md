# Page refresh audit — 2026-10-30

The findings below describe the original behavior. Fixes and corrected regression coverage are recorded in [page-refresh-fix.md](page-refresh-fix.md).

Scope: source review of the CRWI Attendance app, excluding OmniRoute, followed by seven local Chromium reproductions using unchanged source handlers and dummy services. No application behavior or deployment changed during this audit. These are isolated handler reproductions, not live-account or full-application end-to-end tests.

## Deep review: browser-confirmed findings

Run `node tests/browser/page-refresh-audit.check.mjs`. The diagnostic extracts the actual current handlers using an AST parser, executes them in Chromium with dummy data and records `test-results/page-refresh-deep-results.json`. Its assertions deliberately confirm the existing bugs; this diagnostic must be revised into corrected regression expectations when the bugs are fixed.

| Priority | Reproduction | Observed result | Source cause |
| --- | --- | --- | --- |
| High | Click Team Activities Complete once | Completion callback invoked twice | Complete buttons use inline `onclick` (`js/ui/team-activities.js:449` and `:617`) and the document-level `data-action` dispatcher also invokes the same handler (`:907`). `bindEvents` prevents duplicate listener registration, but does not prevent this inline/delegated duplication. The completion handler has no in-flight guard. |
| High | Complete a dashboard task with unrelated content present | Task save succeeds, then unrelated page content and the dummy unsaved input are removed | `app_teamActivitiesCompleteTask` removes its task row and subsequently invokes the full dashboard refresh. |
| High | Begin a slow dashboard refresh, navigate to Staff Directory, finish the old request | Hash stays Staff Directory, but visible content becomes Dashboard | `refreshDashboardAfterAttendance` checks the route before awaiting `renderDashboard`, but not immediately before inserting its result (`js/app.js:5827`). There is no request-generation check. |
| High | Deliver the same Minutes dataset in the initial callback and the next poll | Two complete Minutes renders; a filter inserted after the first render is removed | `Database.listenStaffData` calls back on every 30-second poll, and `startMinutesRealtimeListener` redraws without comparing data. |
| Medium | Refresh Team Activities from page 4 with a selected task | Page becomes 1; selection becomes empty | `refreshData` unconditionally assigns `state.page = 1` and `state.selectedKeys = []` after successful fetch (`js/ui/team-activities.js:828`). Task completion schedules this refresh after 400 ms. |
| Medium | Request two calendar months; finish the newest request first, then the older request | Selected month is November (zero-based 10), but visible content shows October (zero-based 9) | `app_changeCalMonth` accepts each asynchronous dashboard result without checking whether a newer request superseded it (`js/app.js:3934`). |
| High | Prime Admin user listener, then change only a dummy user's rating while a regular input is present | Admin renders once and removes the input | The Admin listener's user signature includes rating and completion stats (`js/app.js:1431`); its redraw guard checks visible modals, not ordinary inputs/edits (`:1530`). `updateUserRating` writes these fields following task-status updates (`js/modules/rating.js:242`), explaining how another person's task update can redraw an administrator's page. |

The duplicate-click reproduction uses the same inline/delegated wiring and the actual `bindEvents` implementation, with a counting completion callback. It proves duplicate dispatch. It does not claim two production database writes were performed; the real completion flow may prompt twice, fail, or continue depending on timing and user responses.

## Additional tracing and limits

- The main router (`js/app.js:1165`) has asynchronous skeleton and page rendering without a route-generation cancellation check. Calls triggered by roster changes or a saved personal plan also run navigation cleanup: they can hide non-checkout modals and replace content with a skeleton. The specific route-overwrite race above is browser-confirmed in the shared dashboard helper; other router/save paths remain source-confirmed risks.
- Midnight refresh lacks a current-route check. This remains source-confirmed; no fake-clock reproduction was run.
- Reflection listeners compare data signatures, so they do **not** redraw on every unchanged poll. They can still invoke a whole dashboard refresh on first nonempty data or later changes. This is distinct from Minutes' unconditional polling redraw.
- Admin user/audit listeners compare signatures and skip their initial snapshots. They are **not** unconditional polling redraws; rating changes and other compared fields can trigger them.
- Ordinary forms are covered by a central synchronous `preventDefault` in `js/app.js:5970`. No `.submit()` or `requestSubmit()` call was found in the app's JS sources. The evidence points to explicit render/reload code, rather than generic form submissions, as the main cause.
- Release-version checks display an update prompt; the actual update reload is invoked by the user's Update now action. Service-worker install/activate handlers do not themselves navigate the page.
- Two additional actual reload paths in `index.html:93` and `:125` serve localhost service-worker cleanup and syntax/cache-error recovery. The first is local-only; the second is error-triggered. `public/offline.html:24` also reloads on the explicit Try again button. These are separate from normal task saves.
- The compact Attendance Sheet's local `refreshSheet` (`js/ui/master-sheet.js:129`) already checks both a request version and the current route before inserting HTML. This is an existing example of the protections missing in the older refresh paths. The legacy global sheet-refresh helper and normal route rendering need their own protection review.
- Kanban drag replaces only its board; the Kanban realtime listener shows a refresh banner rather than reloading the page. It does not explain the whole-dashboard task-completion redraw.

## Findings

Most reported refreshes replace the entire `#page-content` element rather than reload the browser document. This still discards the current page DOM and can reset focus, internal scroll positions and expanded controls. Several save handlers also lack a route check after asynchronous work, so they can overwrite a different page if the user navigates before the save finishes.

| Area | Trigger and evidence | Assessment |
| --- | --- | --- |
| Dashboard tasks | Complete in `js/ui/team-activities.js:1374`; postpone in `js/app.js:4103`; mark complete at `js/app.js:4339`; task status/reassign at `js/app.js:8970` and `js/app.js:8993` | Whole dashboard rebuild after a task save. Complete/postpone already remove the affected planned-task row before the broad refresh. |
| Other task actions | Tag decisions at `js/app.js:3846`, `js/app.js:3922`, `js/app.js:6547`; quick add at `js/app.js:7344`; personal-plan save at `js/modules/day-plan.js:1739` | Dashboard rebuild or full router invocation after a small change. |
| Staff messages | Sending text/task and accepting/rejecting tasks at `js/app.js:6293`, `js/app.js:6337`, `js/app.js:6426`, `js/app.js:6479` | Replaces the complete Staff Directory page. Opening a conversation also rebuilds that page at `js/app.js:6253`. |
| Leave and notification decisions | Minutes-access review at `js/app.js:6661`; missed-checkout review/undo at `js/app.js:6765` and `js/app.js:6854`; leave actions/comments at `js/app.js:7558` and `js/app.js:7648` | Dashboard/Admin rebuilds after decisions and comments. |
| Work summaries and reflections | Work-summary editing at `js/ui/dashboard.js:3419`; reflection refresh helper at `js/ui/journey-reflection.js:234` with callers at lines 277, 393 and 425 | Uses full dashboard refresh, including a reflection subscription callback. |
| Admin changes | Add/edit/remove staff in `js/app.js:5518`, `js/app.js:5600`, `js/app.js:5758`, `js/app.js:8433`; general helper in `js/ui/admin.js:1319`; late-recipient changes in `js/ui/admin-late-notification.js:112` and `js/ui/admin-late-notification.js:126` | Rebuilds all Admin content. The shared helper attempts to restore one selected card mode, but still replaces the whole page. Employment, announcement and Telegram controls call this helper too. |
| Birthdays | Save month/details/external person at `js/features/birthdays.js:237`, `js/features/birthdays.js:388`, `js/features/birthdays.js:470` | Rebuilds Birthday Calendar or Admin. |
| Attendance and payroll | Check-in refresh at `js/app.js:4786`; reconciliation at `js/app.js:814`; manual attendance at `js/app.js:5485`; sheet refresh at `js/app.js:7758`; salary save at `js/app.js:8696` | Broad view refreshes. Some affect multiple totals, but do not require replacing unrelated page content. |
| Filters and selection | Dashboard calendar month at `js/app.js:3940`; leave-history date at `js/ui/dashboard.js:3506`; Admin audit filter at `js/ui/admin.js:1311`; annual-plan controls in `js/ui/annual-plan.js:58`; timesheet controls in `js/ui/timesheet.js:46` | Whole-page rebuilds also occur without a data mutation. Some are view changes, but can be limited to the affected view/table. |

## Automatic rebuilds

- Minutes: `startMinutesRealtimeListener` in `js/app.js:1582` replaces the page at line 1607 on each callback. It skips an open detail modal or dirty editor, but does not compare data signatures. The protected-data adapter in `js/modules/db.js:63` invokes its listener immediately and every 30 seconds, including unchanged results. Consequently Minutes can rebuild repeatedly without a new user action.
- Admin: `startAdminRealtimeListener` refreshes the complete Admin page at `js/app.js:1544` after detected user-status or location-audit changes. It has signature comparisons and a modal guard, so it is not an unconditional redraw on every poll.
- Attendance synchronization: `handleUserSyncEvent` rebuilds Dashboard at `js/app.js:901` on qualifying attendance-status changes.
- Employment roster changes: the `app:staff-employment-changed` handler at `js/app.js:10109` calls the router. Updating the roster is necessary, but replacing a page with active edits is disruptive.
- Midnight: `js/ui/dashboard.js:2334` schedules a full dashboard render and inserts its result without checking that Dashboard is still the current route. This can overwrite another page after navigation.

## Actual browser reloads

- Avoidable: leave-policy save, Hero-policy save and leave-override approval call `window.location.reload()` in `js/modules/admin-policies.js:249`, `js/modules/admin-policies.js:364` and `js/modules/admin-policies.js:388`.
- Intentional lifecycle/navigation operations: login redirect (`js/app.js:5864`), logout/session revocation (`js/modules/auth.js:681`, `js/modules/auth.js:752`), explicit force refresh (`js/app.js:10096`) and tour reset (`js/modules/tour.js:231`). These should be assessed separately from normal save actions.

## Priority

1. Use a single completion click-dispatch path and an in-flight guard before prompting or saving.
2. Remove redundant whole-dashboard refreshes after Complete/Postpone; refresh the affected task lists, counts and rating widgets in place.
3. Stop unchanged Minutes polling results from redrawing the page. Guard asynchronous background rendering by current route, mounted view identity and request generation.
4. Preserve Team Activities pagination/selection on action refreshes. Keep message conversations, Admin cards and leave decisions in place; preserve focus, unsaved input, filters and scroll.
5. Replace policy-save browser reloads with explicit state/cache updates and a local section refresh.

Do not simply remove refresh calls: dependent widgets and cross-device changes must still update. Kanban task drag currently replaces the board component (`js/ui/kanban-board.js:384`) rather than the whole page; this is a narrower update, though it can still reset board-local state.
