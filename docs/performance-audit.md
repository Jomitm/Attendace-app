# CRWI Attendance loading-performance audit

Audit date: 31 October 2026, Asia/Kolkata. Checkout: `D:\Attendace-app-main`.

## Conclusion

The largest confirmed architectural problem is data loading: the dashboard does not return its HTML until fourteen data groups and customization settings finish. Several groups fetch significantly more history than the visible personal dashboard needs. The protected data gateway multiplies that work through repeated authentication, roster reads and sequential pagination. Local development also adds a substantial JavaScript-module loading cost.

This is an identification audit. Application behaviour, permissions, production data and deployment were not changed. Diagnostic scripts and reports were added locally. Existing unrelated working-tree changes were preserved.

## Evidence and limits

- Source inventory: 149 JavaScript/API/CSS files, including 29 domain modules, 9 services, 35 UI files, 7 feature modules, 21 utilities and 27 API files. Entry HTML, Vite settings, indexes, startup, routing, cache and polling paths were also examined. OmniRoute, dependency internals and demonstration HTML pages are excluded. This is a full mechanical inventory plus focused review of loading paths, not a claim that every line has been manually verified.
- Current production build succeeds. Main JavaScript: 1,229,108 bytes raw, 317,705 bytes gzip. A source-import scan finds 83 modules reachable through static local imports from the app entry.
- Fresh local Chromium profiles reached the signed-out form in 2,496 ms on Vite localhost:3000 and 1,125 ms on a local production-build preview. Actual warm reloads took 552 ms and 261 ms respectively. The recorded resource-entry counts were 115/119 in development and 15/15 in the built preview. These are local, unthrottled, single-machine samples, not hosted-site or signed-in Firebase benchmarks.
- The built-in browser was signed out during this audit. Earlier in this conversation its signed-in dashboard displayed a `Dashboard fetch 49545 ms` badge. That prior observation is consistent with the data-loading paths identified here, but does not provide current per-endpoint timing.
- Controlled experiments use production methods with empty/sample records. They prove query counts and which dependencies block rendering. Injected delays are explicitly synthetic, not measured database latency.
- Raw browser records include `ERR_ABORTED` events around reloads/context cleanup. These do not establish a CDN outage. Cross-origin resource sizes can be unavailable.

## Ranked findings

### 1. High: nonessential data blocks the entire dashboard

`js/ui/dashboard.js:2436` awaits fourteen groups in a single `Promise.all`: attendance state/logs, month/year totals, calendar, leave requests, staff list, collaborations, leave history, meeting notes, review records, weekly attendance, weekly plans and reflection. `js/ui/dashboard.js:2474` then awaits customization settings. Even hidden widgets are determined after these reads have started.

Production-renderer experiments:

| Dependency | Injected delay | Time before render returned |
|---|---:|---:|
| Sample baseline | 0 ms | 8 ms |
| Yearly totals | 1,200 ms | 1,218 ms |
| Meeting notes | 1,200 ms | 1,208 ms |
| Programmes through the real Calendar class | 1,200 ms | 1,219 ms |
| Background shared summary, control case | 1,200 ms | 9 ms |

The loading banner reports the most recently completed stage; its text is not a reliable identification of the request still pending. A failed member can also reject the entire render.

Fix first: render the attendance controls and today's plan once essential reads complete; independently hydrate yearly/monthly summaries, calendar/programmes, reflection, notes, Hero and other optional widgets with local errors and retry. Determine widget visibility before scheduling optional reads. Preserve route/account guards and incomplete drafts.

### 2. High: personal month/year totals query everybody's attendance

`js/modules/analytics.js:155`, `:597` and `:908`: the range query contains dates but no owner predicate. Monthly/yearly methods filter for the requested user after downloading results. Yearly totals launch twelve monthly chunks, including future FY months.

The executed production-method probe counted 13 logical attendance-query calls across 12 unique date ranges for one user's monthly plus yearly totals, with zero owner-filtered queries. Database caching may combine identical calls; this is not a claim of thirteen HTTP requests on every load. Each nonempty range can require multiple gateway pages.

Fix: user-scoped summary queries or a maintained personal summary, preserving legacy `user_id`/`userId` handling, multi-session aggregation, leave treatment and the intended full-FY totals. Do not blindly drop future records if they are part of the agreed yearly-summary definition. Verify required deployed indexes; repository index definitions alone do not prove live index state.

### 3. High: every protected read repeats authentication and a complete staff roster read

`api/_api-auth.js:11` verifies the token and reads the current profile. `api/_staff-data.js:115` then reads the entire users collection before reading the requested records. A production-handler probe executing three sample requests counted three token verifications, three profile reads, three full roster reads and three target collection reads.

`js/modules/db.js:36` downloads protected records in sequential pages of at most 400, potentially repeating the same server work per page. There is no fetch deadline in that method. Admin/session SDK calls may add their own retries; actual current timings remain unmeasured.

Fix: batch related reads, share roster work safely within a request/batch, use minimal roster fields and constrain queries. Keep current account/deactivation checks, former-staff filtering and private-field protections. Do not bypass this gateway or replace it with permissive Firestore rules. Any cross-request caching must be versioned/invalidate immediately on access changes.

### 4. High: programme requests were added to the critical calendar path

`js/modules/calendar.js:585` awaits programmes together with leaves, events, five months of plans and users. The dashboard awaits that calendar. `js/services/programme-service.js:3` applies a 15-second fetch timeout. Therefore a programme timeout can hold back the whole first dashboard render. An out-of-range calendar month can require another programme request.

This avoidable dependency was introduced in the recent programme integration. The feast-strip and activity-layout moves do not add equivalent database dependencies.

Fix: display the base calendar/agenda placeholders immediately and hydrate programmes independently. Retain one shared programme source, audience filtering, refresh after saves and calendar day-marker consistency.

### 5. High: a legitimate empty range triggers a whole-history read

`js/services/attendance-service.js:49` and `:72`: an empty successful range/day query falls through to `getAll(attendance)`. The executed empty-range probe confirmed a range query followed by a whole-collection request. This is especially costly for new staff, empty periods or future dates.

Fix: treat a successful empty array as the answer. Use error-specific fallback only when necessary; show an honest unavailable state rather than silently scanning all history or inventing zero totals.

### 6. Medium/high: startup migration can scan and write all work plans before routing

`js/app.js:1062` reads every work plan when a local migration flag is absent, potentially performs sequential migration writes, and only then sets the local flag. Startup at `:1130` awaits this plus budget-head refresh before calling the router. A new browser or cleared storage can repeat this cost. The condition is per-browser local storage, not a global migration-completion marker.

Fix: a controlled, resumable server/admin migration outside ordinary staff startup, or a minimal version check with deferred migration. Never remove the compatibility path before proving old records are migrated. This audit did not invoke that migration against a signed-in account.

### 7. Medium/high: broad reads remain in calendar, reflections and other pages

Calendar reads all leaves/events and a five-month work-plan window. Journey Reflection reads all reflection records and filters the owner afterward (`js/modules/journey-reflection.js:216`, `:392`). Dashboard leave history gets all leaves before filtering thirty days. Meeting notes fetch up to 150 records before the workday appears.

Other affected paths are listed in the coverage table below. Apply owner/date limits on the server and paginate large views. Preserve team collaboration and selected-audience semantics when reducing scopes.

### 8. Medium: private-task hydration can repeat document reads

`js/modules/db.js:611` retrieves an authorized private document for each relevant private-task marker. These reads have no document cache there. Protected work-plan reads already hydrate; `js/services/analytics-service.js:57` and `getDayPlansByDate` can hydrate again, and overlapping calendar/performance/activity ranges can repeat the same private reads.

Fix: deduplicate authorized private-document reads for the signed-in viewer and operation scope, cache with write/account invalidation, and hydrate once at the data boundary. Private failures must continue to fail safely so a subsequent save cannot delete unseen tasks.

### 9. Medium: polling downloads whole collections and bypasses normal cache reuse

`js/modules/db.js:63` implements protected listeners with a 30-second server-read poll. `:99` also refreshes the users roster every thirty seconds and on the roster-state listener. Kanban registers a whole-work-plans listener, even though the rendered board uses a bounded range. Each poll retrieves records and compares full JSON signatures; source=server bypasses the regular protected-read cache. These loops do not all check document visibility. Programmes have a separate sixty-second poll which does check visibility and skips an open form.

Fix: scope subscriptions/polls to the current page and date range, pause nonessential polling in hidden tabs, deduplicate roster refreshes, and retain immediate account/access invalidation. Auth's own user document currently uses a real snapshot listener; it is not itself a thirty-second polling request.

### 10. Medium: substantial code and blocking third-party scripts load before sign-in

The current main production JS is about 1.23 MB raw/318 KB gzip. Static reachability includes dashboard, Kanban, day planning, reports, simulation/rating, and other code before a page is selected. `index.html:21` and `:23` synchronously load Chart.js and XLSX in the head. Four Firebase compat scripts also block parsing near the bottom. Sixteen stylesheet links are present in the entry HTML. The source inventory finds 314 KB of main CSS and 109 KB of dashboard CSS.

Fix: load Chart/XLSX only when charts/export need them, and split remaining route-only UI/module code. Preserve dependency order for Firebase SDK initialization. Letter Pad's approximately 996 KB chunk is already lazy; its size is not evidence that it downloads on initial dashboard load. Existing lazy admin/payroll/annual-plan/attendance-sheet routes are also positive controls.

### 11. Medium: the existing read telemetry misses the protected gateway

Gateway branches return before the legacy `track` calls. A probe issued one protected fixture fetch while getAll/queryMany/documents telemetry remained zero. Existing read counters can therefore make a busy load look quiet.

Fix: capture endpoint duration, collection, range, page count, returned record count, cache hit/miss and pending-request reuse at the gateway boundary. Avoid logging tokens, private payloads or personal task descriptions. Add per-stage timing to the dashboard; the present global badge and last-completed label are insufficient.

### 12. Lower priority for the long load: DOM refresh and automatic scrolling

The existing isolated source-helper benchmark with 6,576 elements measured five patches at approximately 31.5–58.3 ms, fifteen scroll-position reads, zero offscreen auto-scroll writes, correct disposal and preserved drafts/scroll/details. The optimized expectation checks passed. This is synthetic DOM evidence, not a live-page frame profile, but it does not support blaming the earlier roughly fifty-second wait on layout alone. Keep these safeguards rather than rewriting the UI to address a network/data fan-out problem.

### 13. High for staff task entry: Day Planner's editable form waits for team and spanning data

`js/modules/day-plan.js:2183` mounts a loading shell quickly, but the normal path at `:2274` waits for `loadDayPlanData`, then referenced users and spanning entries before constructing the editable task blocks. `loadDayPlanData` at `:152` gets the staff list first and requests all staff's possible personal-plan IDs for the date, plus the annual plan. `getSpanningEntries` at `:194` requests the target user's previous fourteen possible plan documents (`SPAN_LOOKBACK_DAYS = 14`). These dependencies are partly sequential. There is an existing `personalOnly` branch, but normal dashboard planning uses the fuller path.

`js/modules/db.js:1071` batches known IDs in groups of ten. When a batch query succeeds with no matching documents, it falls back to one individual read per ID. The production helper with fourteen deliberately missing sample IDs executed two grouped queries and fourteen individual reads. The individual protected reads can each repeat gateway account/roster work. This is a conditional request amplification finding, not a live measurement that every planner open makes sixteen HTTP requests.

The carry-forward/cleanup/replanning scheduler is already deferred; do not incorrectly blame it for the whole initial wait. It can still compete with later work. Existing private-task access checks and draft safeguards are essential.

Staff-first repair: hydrate the editable personal plan for the selected day independently; include authorized shared/assigned/spanning work through staged reads, clearly marking anything pending. Load staff names and other staff's reference plans when needed. Saving must be disabled or scoped to the fully loaded personal record until hydration and conflict checks are complete, so unloaded shared/private tasks cannot be accidentally removed. Avoid empty-success per-ID fallback and preserve compatibility for legacy records lacking indexed ID fields through a deliberate, bounded strategy.

## Loading-path coverage

| Area | Current loading behaviour and assessment |
|---|---|
| Entry HTML, auth, application setup | Blocking CDN scripts, many static modules; auth restoration precedes migration, budget loading and routing. Account checks must remain. |
| Dashboard, calendar and programmes | Primary critical-path findings above. Optional data shares the initial all-or-nothing gate. |
| Analytics, Hero, performance, AI coach | Personal totals/team datasets are broad. Hero summary and personal chart/narrative work are deferred, which is good; they can still compete for bandwidth after mount. Avoid waiting for AI before usable content. |
| Database, all nine services, protected API | Repeated roster/auth overhead, pagination, empty-range fallback, private hydration and telemetry gaps. Existing in-flight `getCached` reuse works; do not claim all caching is absent. |
| Attendance, check-in/out, Day Planner | Attendance queries and private plan hydration affect responsiveness. Keep location/session/conflict/write checks out of broad performance rewrites. |
| Recent/Team Activity, Kanban | Personal preview uses existing activity data and limits five rows; the underlying loader still reads the month's team data before selecting My. Kanban's polling subscription is broader than its visible date range. |
| Staff Directory/messages | Reads staff, then messages sequentially; messages are filtered for the selected conversation in the UI. Parallelize independent reads and use conversation/date pagination. |
| Annual Plan | Lazy JS, but waits for shared calendar, then users, then force-refreshes attendance for the calendar year. Independent reads are serialized and broad. |
| Timesheet | Lazy JS, but reads user logs then shared calendar; filters the selected month afterward. Query the selected month directly. |
| Attendance Sheet | Lazy JS with bounded monthly attendance query and strict failure state. A second phase reads holidays/config after users/logs; some independent work could overlap. Relatively better scoped. |
| Admin/review/location audits | Lazy JS; some capped queries, but query failures fall back to entire audit/attendance collections. Leaves/birthdays and multiple review datasets load together. Paginate sections independently. |
| Payroll/reports | Payroll JS is lazy; private-user roster read. Report methods still read all attendance/users and filter locally. Use explicit report period/user scope and keep payroll permissions. |
| Policies, leave balances/history | Policies fetch all attendance to calculate the user's current-week lates. Leave helpers have bounded paths plus broad fallback/full-history reads. |
| Profile/settings/budget | Smaller data but several startup awaits and settings reads; avoid optional settings blocking the workday. Staff-wide data should load only for authorized controls. |
| Birthdays, notifications, Telegram | Background/init/read sites inventoried. No current timing proves these are the dominant delay; preserve sign-in gates and error handling. Delivery cron/server time must not be confused with first-page load. |
| Feast, Letter Pad, exports | Feast already updates after render and now occupies a slim strip. Letter Pad is lazy. Spreadsheet library is currently loaded eagerly even though export is optional. |
| Simulation, rating, system tools | Simulation is disabled by a flag yet its module is statically imported. Some triggered tools scan full collections; those conditional operations are not proof they run on every page load. |
| API routes, Vercel, PWA | API source/router and local middleware reviewed; build succeeds. No production deployment, server-region/Firestore-region latency, deployed indexes or hosted service-worker cache was live-verified. Localhost unregisters its service worker. |

## Recommended repair order

1. Add trustworthy per-stage and gateway measurements; capture one signed-in cold/warm waterfall for staff and admin on the affected environment.
2. Remove yearly summaries, meeting notes, programmes and reflection from the first-useful-dashboard gate. Render each independently with errors/retry.
3. Reduce personal attendance scope and replace the twelve-month query fan-out without changing agreed calculations. Fix successful-empty-range fallbacks.
4. Reduce gateway repeated work through secure request batching and versioned roster reuse; retain immediate account/deactivation enforcement.
5. Move the browser-wide migration out of staff startup; tighten calendar/reflection/activity scopes and private-document hydration.
6. Reduce route polling, load optional libraries on demand, then reassess bundle/DOM costs.

Acceptance checks: first usable workday versus final optional-card time, p50/p95 signed-in cold/warm timings, number/pages/bytes of API reads, equal attendance/payroll/scoring results, private-task/audience/former-staff security checks, correct programme calendar refresh, live saves and cross-device behaviour. Do not promise a fixed speedup before these measurements.

## Reproducible artifacts

- `docs/performance-audit-data.json`: per-file inventory, read/query/timer sites, import reachability and build chunk sizes.
- `docs/performance-structure-probe.json`: production-method request-count/empty-range/telemetry experiments.
- `docs/performance-dashboard-gates.json`: production renderer with controlled delays.
- `docs/performance-public-load.json`: empty-profile development/built shell timings and resources.
- `test-results/dashboard-performance/current.json`: existing DOM patch/auto-scroll benchmark.

Run from this checkout using Node:

```text
node node_modules/vite/bin/vite.js build --manifest
node scripts/audit-loading-performance.mjs
node scripts/profile-loading-structure.mjs
node scripts/profile-public-loading.mjs http://localhost:3000/ http://127.0.0.1:3048/
node scripts/profile-dashboard-gates.mjs
```

The public profiler needs a local built preview on 3048; the gate/DOM experiments use the isolated fixture server on 3047. Browser launch may require the local tool's normal process permission. No fixture signs in or reads/writes live staff records.
