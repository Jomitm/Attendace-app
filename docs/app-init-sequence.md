# app.js Init-Sequence & Dependency Map

Read-only analysis produced before the app.js decomposition refactor. Its purpose:
make the execution-order hazards explicit so every extraction step can be checked
against them. **Every move must be verified against this map.**

File: `js/app.js` — 12,185 lines, the app entry point (`index.html:547` loads it as
`<script type="module">`). Nothing imports app.js; all cross-module communication
happens via `window.*` assignments (538 unique names; 377 present at load).

---

## 1. Load-time execution order

ES module semantics: **all imports execute before the entry body.** So the order is:

1. **Imports (lines 1–38)** — side-effect module loads. These register the `AppX`
   singletons (`window.AppAuth`, `window.AppDB`, `window.AppAttendance`, …),
   services, and utils. Order among them matters only if one module reads another's
   global at load time (e.g. line 40 reads `window.app_normalizeBudgetId`, set by
   the budget-heads module imported at line 6–7).
2. **Entry body top-level statements** (column 0, in source order):
   - `window.app_asyncButton` (43)
   - **IIFE (56–83)** — MutationObserver syncing `btn-loading` class to disabled
     buttons. Attaches immediately or on DOMContentLoaded. **Runs at load.**
   - Module-scoped state declarations (88–128) — see §2.
   - `window.app_annualYear = new Date().getFullYear()` (129) — reads current year.
   - `window.addEventListener('load', …)` ×2 (716, 721)
   - `document.addEventListener('DOMContentLoaded', …)` (726)
   - `window.addEventListener('focus', …)` (1754)
   - `document.addEventListener('visibilitychange', handleVisibilityAttendanceReconcile)` (1757)
   - `window.addEventListener('resize', updateDashboardViewport)` (7991)
   - `document.addEventListener('submit', …)` (8171) — global form interception
   - `document.addEventListener('auth-logout', …)` (8735)
   - `document.addEventListener('dismiss-notification', …)` (9043)
   - `document.addEventListener('dismiss-tag-history', …)` (9078)
   - `document.addEventListener('open-log-modal', …)` (9092)
   - `document.addEventListener('set-duration', …)` (9104)
   - ~440 `window.X = …` assignments (declarations — order matters only relative
     to load-time readers, see §3)
   - `import('./ui/ai-float.js')` (12180) — dynamic import, fire-and-forget
   - **`init()` (12183)** — the orchestrator, see §4
   - `console.log("App.js Loaded & Globals Ready")` (12185)

**Hazard:** extracting a top-level statement into a module imported at line ~38
makes it run *earlier* (during the import phase). Immediate-effect code (listeners,
IIFEs, `init()`) must be wrapped in an exported `init()` called from app.js at the
exact original position.

## 2. Module-scoped state (the coupling mechanism)

These `let` bindings (lines 88–102, 128) are closed over by many functions across the
file. **A function that reads/writes any of these cannot be extracted unless the
state moves with it or is shared via a module.**

| Variable | Line | Written by (representative) |
|---|---|---|
| `timerInterval` | 88 | timer/clock section (3878–4044) |
| `adminListenerUnsubscribe` | 89 | admin realtime listener (3612+) |
| `minutesListenerUnsubscribe` | 90 | minutes handlers (6289+) |
| `cachedLocation` / `lastLocationFetch` | 91–92 | location helpers (4017+) |
| `attendanceActionInFlight` | 93 | check-in/out flow |
| `lastSyncedAttendanceStatus` | 94 | `init()` (3334), attendance reconcile |
| `userSyncRenderLock` / `suppressSyncToastUntil` | 95–96 | user-sync handler (1689+) |
| `appServiceWorkerRegistration` | 97 | `registerSW()` |
| `releaseSignalUnsubscribe` / `releaseSignalPollTimer` / `releaseSignalListenerStarted` | 98–100 | release-update system (291–392) |
| `versionPollTimer` / `versionCheckInFlight` | 101–102 | routine update checks |
| `checkoutLocationSession` | 128 | checkout location helpers |

Constants (`APP_BUILD_META`, `UPDATE_MANIFEST_URL`, `RELEASE_*`, `LOCATION_*`,
`CHECKOUT_LOCATION_FRESH_MS`, `releaseUpdateState`) are immutable and safe to move,
but are referenced from many clusters — prefer moving them with their primary
cluster and importing where needed.

## 3. Load-time readers (order-sensitive assignments)

These read another global during the import phase, so their relative order is fixed:

- Line 40: `app_normalizeBudgetHeadId = window.app_normalizeBudgetId` (needs budget-heads module imported first — it is, at line 6–7)
- Line 129: `app_annualYear = new Date().getFullYear()` (no dependency)

All other `window.X =` assignments are pure declarations; they only need to exist
before first *call* (which happens inside `init()`/router or from generated HTML
`onclick`), so their position among themselves is flexible.

## 4. `init()` sequence (3320–3373) — runs once at load

```
app_initTheme() → initPageUsageNotes() → cleanURL()
addEventListener: app:user-sync, app:update-available, app:update-state,
                  visibilitychange, focus, online
await AppAuth.init()
  └─ if user: startReleaseSignalListener, startRoutineUpdateChecks,
              AppSiteAnnouncement.start
registerSW()
await app_migrateLegacyWorkPlanSchema()
await app_refreshBudgetHeadsCache()
AppActivity.initCommandListener()   (if AppActivity)
Global-toggles click listener (sidebar-toggle / sidebar-overlay)
app_initSectionToggle()             (guarded by typeof check)
addEventListener: hashchange → router
AppUI.initDashboardSectionPage()    (if present)
router()
AppTour.init(currentUser)           (if user)
```

**Dependencies:** `AppAuth.init()` must complete before `router()` reads the user.
`registerSW()` and the migration are awaited before routing. The release-signal and
routine-update systems start only when a user exists.

## 5. `router()` sequence (3376+) — runs on load and every hashchange

1. Cleanup: admin listener (if leaving `#admin`), minutes listener (if leaving
   `#minutes`), kanban listener (if leaving `#kanban`)
2. **Auth guard:** no user → stop release/update/announcement systems, hide shell
   (unless show-hidden-sheets pref), render login (or owner login at `#owner`),
   refresh notification bell, return
3. Logged in: start release/update/announcement, impersonation banner, reset mobile
   state, show shell, render the page for the hash

## 6. Extraction rules (derived from this map)

1. **Declarations + `window.*` aliases** → safe to move to a module's top level.
2. **Immediate-effect code** (the listeners in §1, the IIFE, `init()` itself) →
   wrap in exported `init()` invoked from app.js at the exact original position.
3. **Functions closing over §2 state** → either co-locate the state with the
   function, or extract the state into a shared module (e.g. `js/features/_state.js`)
   imported by both sides. Do not duplicate the `let` bindings.
4. **Constants** → move with their primary cluster; import where needed.
5. **Static imports only** — no new dynamic `import()` (preserves order, avoids races).
6. After every step: `npm run lint && npm run typecheck && npm run test:unit &&
   npm run test:smoke` + manual walkthrough of the touched flow.
