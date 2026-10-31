# Staff workday dashboard and programmes

Implemented locally in `D:\Attendace-app-main`. No commit, push, deployment, permission grant, or live programme/attendance write is part of this change.

## Existing connections preserved

- Attendance retains its existing element IDs, `setupDashboardEvents`, `handleAttendance`, timer/countdown/overtime calculations, pause/resume and read-only behavior. The compact strip does not relabel current-session elapsed time as an all-day total.
- Dashboard Add Plan, Edit Plan and Add task open `app_openDayPlan` for the selected date (today by default) and the signed-in user. Calendar date clicks still open the existing planner. Other quick-add helpers remain available to their existing callers.
- Task Edit opens the original planner; Postpone and Complete keep the original handlers, optional completion notes, task identity, ownership and privacy checks. Outlook task export remains intact. Keyboard activation no longer gets intercepted by the row's expand handler.
- Task Board remains `#kanban`. Monthly/yearly summary cards retain their detail routes. My/Team filters remain available, with My as the initial view. Existing widget IDs and layout preferences remain in place.
- Performance calculations, period controls and AI coaching are retained. Full analysis is expandable; the chart initializes when its panel opens. Trend text identifies the first-to-latest comparison. This does not rewrite historical AI narratives or alter scoring.
- Calendar section pages retain their Back/date-range behavior and include programme access. Calendar CSV export includes permitted active programmes separately from leave/events/work plans.

## Programme data and access

`programmes` is a dedicated collection. The existing Firestore rules default-deny direct browser access; no rules were loosened. Browser reads/writes go through the authenticated `POST /api/programmes` handler, dispatched by the existing single Vercel function. The Vite development middleware uses the same handler.

Every authenticated active staff member may create programmes, and edit or cancel programmes they created. Existing global administrators may manage all programmes. There is no separate programme-manager role or programme permission to allocate. The API enforces ownership inside the write transaction using server-assigned creator metadata.

Audience can be all staff or selected active staff. Selected programmes are visible to their creator, coordinator, participants and administrators. Authority comes from the current server-side staff profile. The Outlook feed applies the same audience predicate. Programmes are not stored as holidays, tasks or activity telemetry.

Validated fields: title, start/end dates, all-day or start/end times, venue, HTTPS meeting link, active coordinator, audience/participants and description. Dates use Asia/Kolkata; end date is inclusive in the app and converted to an exclusive end for all-day Outlook entries. Ranges are limited to one year. IDs/creation metadata are server-controlled; edits and cancellation check the prior update timestamp to reject stale changes. Cancellation retains the record.

The compact agenda shows one ongoing/upcoming programme at a time and lets users browse all visible programmes in the next 30 days. Subtle previous/next arrows appear on hover or keyboard focus; touch controls stay visible. Navigation wraps and makes no additional requests. Programme names open details; View all opens the full list. Calendar day markers include multi-day programmes. The list and details provide Add/Edit/Cancel controls where permitted. Empty, loading failures and retry states are distinct. Save/edit/cancel clears calendar caches and refreshes affected views. Visible dashboards check for programme changes once per minute; polling stops on navigation and skips open programme forms. Asynchronous views discard results after account or route changes.

## Verification

- Baseline: 491 unit tests passed; lint had 0 errors and 34 pre-existing warnings; typecheck passed.
- Updated suite: 500 unit tests passed, including programme validation, permissions, API writes/stale conflicts, cancellation, and actual Outlook feed audience/date handling.
- Firestore emulator: 47 tests passed, including default-denied direct programme reads/writes for staff and browser administrators. No production database was used.
- Isolated browser fixture: staff, limited-access and full-admin desktop/mobile checks passed. Checks cover attendance containment, planner routing, mouse/keyboard completion dispatch, programme details, create/edit/cancel and agenda/calendar agreement.
- Existing page refresh regression script: 14 checks passed, including real completion-handler note/draft preservation, duplicate-call protection, route races, date changes and focus/scroll preservation.
- Four smoke tests passed: login shell, signed-out navigation, load-time globals and same-day attendance session aggregation.
- A repeated final combined smoke run encountered a browser page-creation timeout before the globals test reached the app. The globals case subsequently passed alone with exit code 0 (1.5 minutes including slow browser teardown). The earlier full four-test pass is recorded separately; the final combined rerun is not represented as a clean pass.
- Production Vite build and typecheck passed. Lint has 0 errors; the 34 baseline warnings remain.

Re-run commands with the repository Node runtime:

```text
node --test tests/unit/*.test.mjs
node scripts/test-firestore-rules.mjs
node node_modules/typescript/bin/tsc -p jsconfig.json
node node_modules/eslint/bin/eslint.js "js/**/*.js" "tests/**/*.mjs" "api/**/*.js"
node scripts/generate-build-assets.cjs
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test
```

Browser regression fixture and runner: `tests/browser/dashboard-workday.fixture.html` and `tests/browser/dashboard-workday.check.mjs`. The fixture uses production renderers with explicitly labelled in-memory data and never connects to Firebase. Its default test server is localhost:3047. `tests/browser/page-refresh-audit.check.mjs` accepts `BASE_URL` for the same Vite server.

## Localhost:3000 follow-up

The user signed into the real localhost:3000 app in the built-in browser. This revealed defects not covered by the original empty-data fixture: the older compact CSS suppressed the runtime countdown, the asynchronous activity refresh bypassed the My filter, and more specific legacy Hero styles kept five cramped columns. These were corrected and checked on the signed-in page. My/Team switching now updates the selected state and heading; both initial and refreshed results use the same owner filter. Activity previews show three items per column with full totals and a history link. Task rows have a visible action affordance.

Read-only checks confirmed that Add Plan and Edit Plan open the existing populated day planner, the programmes list opens, the full performance analysis and chart remain available, and the countdown is visible. Planner dialogs were discarded without saving. A new owner-filter unit test brings the unit total to 501. The browser fixture now includes mixed staff records and active countdown visibility instead of empty activity data.

The activity-history link carries the dashboard's My/Team selection and selected month into the full history view. Results are explicitly restricted to the selected dates, and history reads disable analytics side effects. The final isolated staff, limited-access and full-admin browser checks passed with these history assertions included.

For staff with limited administrative access, Activity & Reflection now renders inside the main column immediately after Performance, rather than beneath the taller summaries rail. Ordinary staff already use that main-column placement; full administrators retain their separate review workspace. Desktop/mobile browser checks for all three roles pass, including an assertion that personal activity follows performance in the main column.

The personal activity preview is now Recent Activity: up to five recorded task updates, completed tasks or logged work from the existing activity records. Open tasks without a recorded change are omitted; records without a completion timestamp explicitly show Record date. No synthetic audit events are created and no new database queries are added. The permitted Team view keeps its review columns and the history link keeps its existing scope/month context. Focused owner/feed unit tests, all three role browser checks, lint and typecheck passed.

Today's Feast now renders once as a collapsed full-width strip between the welcome/quick links and Personal Workday, replacing the sidebar card. A native details/summary disclosure reveals the existing rank, season and optional image. The existing feast visibility setting, data source, DOM IDs and seasonal colours remain. Desktop/mobile fixture checks verify placement, compact height, click and keyboard expansion for all three roles. The current built-in browser is signed out, so this follow-up's visual verification used labelled sample data.

Follow-up: programme creation now uses the existing staff/admin model. All staff see Add Programme; creators can edit/cancel their own records and admins can manage all. The separate programme permission controls were removed. All 502 unit tests passed; the staff, limited-access and admin browser checks passed, including staff create/edit/cancel. The real signed-in staff account opened the Add programme form without saving a record. A programme-list request timed out during a dashboard reload; live saving remains untested.

## Summary loading and return navigation follow-up

Month/year summaries now hydrate independently of the twelve essential dashboard data groups. Their pending and completed requests are reused for sixty seconds and invalidated by attendance, user, leave/settings and employment changes. Summary failures show an unavailable/retry state, never fabricated zero totals. Yearly calculations use one FY range instead of twelve monthly chunks. Personal records are fetched through both historical owner-field spellings using existing equality indexes, deduplicated and filtered to the period; this avoids a new deployed composite-index dependency and keeps the existing arithmetic and full-year scope.

Return navigation uses a sixty-second in-memory dashboard preview bound to the account, permissions, attendance state, selected staff and India date. Writes invalidate it; an old mounted page cannot recreate an invalidated preview. Fresh reads and normal action checks continue. Serialized listener markers are removed and card/attendance handlers are rebound. Recent Activity and eligible visible cards are retained while their replacements load.

Validation: 520 unit tests pass, including calculation parity/FY-end/multiple-session/penalty cases, owner-scoped queries, expiry/account separation and invalidation. The delayed-summary browser check rendered the workday in about 23 ms despite a synthetic 1,200 ms summary delay and verified result reuse, preview restoration, keyboard card interaction, planner routing, write invalidation and honest error states. All three role desktop/mobile browser flows passed; build, lint (existing warnings) and typecheck passed. This is not a measured live/hosted speedup; the hosted application has not been updated.

The user was subsequently signed in during verification: live month and year totals populated with the revised queries, and a fresh Profile → Dashboard trip returned with both summary cards already visible instead of a full loading skeleton. No attendance, programme or profile save was submitted.

The localhost programme middleware previously retained its original CommonJS handler, producing the obsolete Manage Programmes error after browser changes. It now reloads the handler per request and obtains shared rules through Vite's invalidated module graph, avoiding stale Node ESM rules. A regression test seeds the obsolete rejecting handler and confirms that the real middleware reloads it and lets an ordinary staff fixture create a programme.

## Remaining live checks

Production API packaging/deployment, calendar subscription in an external Outlook client, and live attendance/programme writes have not been verified. Programme creation is available to all signed-in active staff; no account permissions were changed. Programme notifications/invitations are not sent by this workflow. Existing events, work plans, attendance and unrelated working-tree changes remain intact.
