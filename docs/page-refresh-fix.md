# Save and background refresh fixes

The initial audit is retained in `page-refresh-audit.md`. The application now uses a shared, guarded DOM update path for saves and background refreshes. Full replacement and loading skeletons are reserved for navigation.

## Changes

- Removed duplicate inline Complete dispatch in Team Activities; an in-flight task guard also covers repeated clicks while the optional comment prompt or save is pending.
- Added `js/utils/page-updates.js`, backed by morphdom. Updates retain unchanged DOM nodes, dirty/focused fields, caret position, scroll positions, open details and card modes. Newer requests, navigation epochs, changed viewers and detached roots invalidate older results.
- Routed dashboard, Admin, messages, leave actions, birthdays, profile, annual plan, timesheet, letter-pad and policy save refreshes through that path. The main router also guards asynchronous commits; same-page refreshes do not run navigation's modal-hiding/loading-screen behavior.
- Removed the Dashboard renderer's internal loading-skeleton replacement. This was an additional destructive write before the caller could apply its refresh guard, found during the real-backend task test.
- Dashboard save/background renders keep existing fullscreen overlays; Admin refreshes patch the active card's fresh template without toggling it closed. Expanded task cards intentionally navigate to a dedicated worklog screen; completing a task there retains that screen.
- Protected-data listeners suppress identical results. Changed data invalidates relevant read caches before notifying subscribers. Minutes retains a deferred change while an editor/detail modal is open, retries after editing, and cancels pending work when its listener stops.
- Team Activities keeps pagination and selection across action refreshes; a request version rejects older fetch results. Explicit filter/reset controls still reset pagination, and the existing page-count clamp handles a shortened list.
- Leave/Hero policy saves and the legacy leave-override path no longer reload the browser document. Explicit sign-in/out, session revocation, navigation, user-requested updates and error recovery retain their own lifecycle behavior.

## Validation

- 491 unit tests pass; TypeScript passes; lint has warnings only; production build succeeds with the existing chunk-size warnings.
- `node tests/browser/page-refresh-audit.check.mjs`: 14 Chromium checks execute current handlers and the real updater using dummy services, including the actual Admin and Dashboard renderers. Covers the original seven failures, duplicate save guards, focus/caret/scroll, route changes, changed-vs-unchanged polling, and deferred Minutes updates.
- Attendance Sheet and staff employment browser fixtures pass.
- Four read-only application smoke tests pass. Two old smoke assertions were aligned with the existing signed-out contract: authenticated navigation is hidden, and the work-plan cache counter is created by a read rather than at startup.
- A disposable-account test through the local app and real Firebase backend confirmed task persistence, retention of the attendance control/sidebar, no document navigation on completion, completion on the expanded worklog screen, and subsequent Staff Directory navigation. The QA account and its records were removed.

No authorization rules or API contracts were changed for this refresh fix.

## Production verification

Published to https://staff.crwi.org.in on 2026-10-30. Final deployment: `dpl_2qfF7BcDAZ6KFXjpMTKYB3hzATqf`. Uploaded source digest: `984eeb2ac89eb27411fdc25afc547f4e6ac16f6c701d220db7fc02f664556385`.

The same disposable-account flow passed on the live site: the selected task persisted as completed while the remaining task stayed unchanged; the attendance control and sidebar retained their DOM identities; both dashboard completion and expanded-worklog completion caused zero document navigations; subsequent navigation to Staff Directory worked. No uncaught browser errors were recorded. The temporary QA account and its records were removed. No real staff task was changed by this verification.
