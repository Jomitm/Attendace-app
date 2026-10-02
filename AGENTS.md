# CRWI Attendance App — Agent Guidelines

## Project

Firebase-backed attendance management system for CRWI staff. Vanilla JS (no framework), Vite build, PWA with offline support. Deploys to Vercel.

**Not to be confused with `OmniRoute/`** — that is a separate AI proxy/router project nested in this repo. Ignore it for attendance-app work.

## Stack

- **Build**: Vite 7, vanilla JS ES modules
- **Database**: Firebase Firestore (compat SDK v9.23 loaded via `<script>` in `index.html`)
- **Auth**: Password login verified server-side (`api/_auth-login.js`) issues a Firebase custom token (`signInWithCustomToken`); session cached in localStorage (`crwi_session_user`, device token `crwi_session_token`)
- **Hosting**: Vercel (`vercel.json` configures SPA rewrites + cron jobs)
- **PWA**: Service worker (`sw.js` generated at build), manifest.json

- **Notifications**: Telegram bot integration (`api/_telegram-*.js`, `js/utils/telegram.js`)

## Commands

```bash
npm install              # install deps
npm run dev              # Vite dev server on :3000 (opens browser)
npm run build            # Vite build → dist/
npm run lint             # ESLint flat config (js/, tests/, api/)
npm run typecheck        # tsc via jsconfig.json — // @ts-check files, strict minus noImplicitAny
npm run test:unit        # Node.js native test runner (tests/unit/*.test.mjs)
npm run test:smoke       # Playwright — currently unavailable (tests/smoke/ absent, see Testing)
npm test                 # lint + unit + smoke (fails at smoke until tests/smoke/ is restored)
```

**Smoke tests are currently unavailable** — `playwright.config.js` still points at `tests/smoke/`, which does not exist in the working tree (spec recoverable from git history, e.g. commit `779d53c`). When restored: run `npm run build` first — the test server (`test_server.ps1`) serves from `dist/`, not source.

### Quick Start

```cmd
start.cmd              # double-click: installs deps + starts Vite
```

Or manually:
```cmd
cd /d D:\Attendace-app-main
npm install --include=dev
npx vite
```

## Testing

- **Unit tests**: `tests/unit/*.test.mjs` — Node.js native `--test` runner, no framework (scoring formula, perf windows, render-level UI, API validators)
- **Smoke tests**: NOT AVAILABLE — `tests/smoke/` is absent; `playwright.config.js` declares `testDir: ./tests/smoke`, chromium only
- **Test server**: `test_server.ps1` binds port 8080 (fallback 3004), serves `dist/`
- **Override target**: `$env:BASE_URL="http://localhost:3004"; npm run test:smoke`

## Architecture

Single-page app with hash-based routing (`#dashboard`, `#staff-directory`, `#kanban`, etc.).

```
index.html          ← entry point, loads Firebase SDK + app.js
js/app.js           ← main orchestrator (~12k lines), imports all modules, handles routing
js/config.js        ← AppConfig: timings, policies, feature flags, hero policy
js/modules/         ← domain modules (auth, db, attendance, leaves, analytics, etc.)
js/ui.js            ← UI rendering dispatcher
js/ui/              ← page-specific UI components (33 files)
js/utils/           ← date-helpers, html-escape, action-router, telegram, ical
css/                ← stylesheets (main.css, kanban.css, dashboard-modern.css, etc.)
api/                ← Vercel serverless functions
scripts/            ← build helpers (build-meta.cjs, generate-build-assets.cjs)
```

### Key Modules

| Module | Purpose |
|--------|---------|
| `auth.js` | Login, session management, heartbeat |
| `db.js` | Firestore adapter with read cache + telemetry |
| `attendance.js` | Check-in/out, pause, status calculation, conflict detection |
| `leaves.js` | Leave policies, balance, application |
| `analytics.js` | Hero of the Week scoring, dashboard summaries |
| `calendar.js` | Task management, day planning |
| `permissions.js` | Role-based access (admin, hr, staff) |
| `day-plan.js` | Daily work plan with carry-forward |
| `admin-policies.js` | Admin UI for tuning policies |
| `ai-performance-coach.js` | Daily AI performance narrative + task classification backfill |

### Key UI Components

| Component | Purpose |
|-----------|---------|
| `checkin-checkout-modals.js` | Goal-setting modal for check-in flow |
| `kanban-board.js` | Drag-drop task board |
| `view-toggle.js` | Dashboard view switcher |
| `team-activities.js` | Team activity feed |


### API Endpoints (Vercel Serverless)

The only counted function is `api/index.js` — it dispatches `/api/<route>` to the handlers below. Every handler lives in an underscore-prefixed file (`api/_*.js`), which Vercel does not count against the Hobby plan's 12-function limit. `vercel.json` rewrites each `/api/<route>` to `/api/index?route=<route>`; `tests/unit/api-router.test.mjs` pins the route map and fails if a stray non-underscore file appears in `api/`.

| Endpoint | Purpose |
|----------|---------|
| `api/_auth-login.js` | Password login → Firebase custom token |
| `api/_auth-set-password.js` | Set/change account password |
| `api/_ai-insights.js` | AI chat/insights (classify, performance, tool plans) |
| `api/_hero-select.js` | AI Hero-of-the-Week pick (stored per period in `hero_selections`; falls back to normal ranking) |
| `api/_ai-briefing.js` | Cron: Telegram morning briefing for opted-in users |
| `api/_calendar-feed.js` | iCal feed for Outlook/Google Calendar |
| `api/_calendar-token.js` | Generate secure calendar tokens |
| `api/_feast-proxy.js` | Feast proxy (also wired into Vite dev) |
| `api/_telegram-webhook.js` | Telegram bot webhook handler |
| `api/_telegram-send.js` | Send Telegram messages |
| `api/_telegram-scheduler.js` | Cron: notifications (absentee, standup, leaderboard) |
| `api/_telegram-register-webhook.js` | Admin: register bot webhook |
| `api/_telegram-generate-link.js` | Telegram deep-link generation |

Shared helpers (not endpoints): `_ai-provider.js` (model chain; `.cjs` mirror required by `vite.config.js`), `_firebase-admin.js`, `_perf-snapshot.js` (pure snapshot validator, unit-tested), `_hero-select-core.js` (pure hero-selection rules shared by the endpoint and `vite.config.js`).

### Firestore Collections

`users`, `attendance`, `leaves`, `minutes`, `staff_messages`, `location_audits`, `work_plans`, `meetings`, `salaries`, `system_commands`, `settings`, `events`, `daily_standups`, `daily_summaries`, `daily_summaries_meta`, `summary_locks`, `journey_reflections`, `app_meta`, `policies`, `budget_heads`, `task_activity_events`, `telegram_link_tokens`, `ai_usage` (per-user daily chat-question counter, UTC day keys — `api/_ai-quota.js`), `hero_selections` (AI hero pick per ranking period — server-only, `api/_hero-select.js`)

(Not collections: `admin_policies`, `annual_plan`, `day_plan` — admin policy writes go through `AppLeaves.updatePolicy` → `policies`; annual/day plans live in `work_plans` with `planScope`.)

## Gotchas

- **file:// protocol blocked**: App shows security warning if opened directly. Must use dev server or `start.cmd`.
- **Service worker cleanup**: On localhost, the app auto-unregisters service workers and purges caches on first load to avoid stale ESM modules.
- **Letter-pad bare imports**: `docx`, `jsPDF`, `html2canvas` are Vite-resolved. Smoke tests against plain static server may fail on these — run against Vite dev server or use built `dist/`.
- **PowerShell execution policy**: Use `cmd.exe /c` wrapper if PS profile is restricted.
- **Config-driven policies**: `js/config.js` → `HERO_POLICY`, `SIMULATION_POLICY`, `SUMMARY_POLICY` control scoring. Admin panel can override and saves to Firestore with schema version bump.
- **Read cache TTLs**: `config.js` → `READ_CACHE_TTLS` controls Firestore read caching. Stale reads are a common source of confusion during development.
- **OneDrive file deletion**: OneDrive can silently delete source files from `js/modules/`, `js/utils/`, etc. If Vite reports missing imports (e.g., "Failed to resolve import"), restore from `git checkout origin/main -- js/`. Keep project outside OneDrive or exclude it from sync.
- **Check-in flow**: When status is "out", `handleAttendance()` renders a goal-setting modal (`renderCheckInModal`) instead of checking in directly. The modal calls `window.app_submitCheckIn()` which handles location, conflict detection, and day-plan creation.
- **Cross-device conflict detection**: `app_submitCheckIn` checks `checkInResult.conflict` and shows `app_showSyncToast()` if another device already checked in.
- **Vite config**: `vite.config.js` has `open: true` — browser auto-launches on `npx vite`. Custom plugin serves feast proxy (`/api/feast-proxy`) in dev mode.
- **Lazy AppUI pages**: `js/ui.js` lazy-loads admin, master-sheet, annual-plan, payroll, timesheet, birthday-calendar via `import()` — every `AppUI.render*` call site must `await` them (all current call sites do).
- **`_ai-provider.cjs` mirror**: required by `vite.config.js` (dev AI proxy) — NOT an orphan. Keep it in sync with `api/_ai-provider.js`.
- **API router**: all HTTP endpoints live in `api/index.js` (the only counted function); each handler is an underscore-prefixed `api/_<route>.js` file. Adding a new endpoint = underscore file + a `ROUTES` entry in `api/index.js` + a rewrite in `vercel.json`. Never add a non-underscore `.js` file directly under `api/` — it becomes a new serverless function and breaks the Hobby plan's 12-function limit (`tests/unit/api-router.test.mjs` fails).

## Environment

Copy `.env.example` to `.env`. `OPENROUTER_API_KEY` is **required for the CRWI Assistant** — without it `/api/ai-insights` silently returns fixed rule-based answers (the chat UI now surfaces an "Offline — AI provider unavailable" note when that happens):
```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_HTTP_REFERER=http://localhost:3004
OPENROUTER_APP_TITLE=CRWI Attendance App
```

`AI_DAILY_QUESTION_LIMIT` (default `5`) caps chat questions per user per UTC day (`api/_ai-quota.js`, counter in `ai_usage`; 429 → both chat surfaces show a limit notice). Tool-plan pre-check/classify/coach/insights are exempt.

Firebase config is hardcoded in `index.html` (public client keys, not secret).

## Vercel Deployment

- `vercel.json` defines cron jobs for Telegram notifications:
  - Absentee alert: weekdays 5:30 AM
  - Standup reminder: weekdays 12:30 PM
  - Leaderboard: Monday 3:30 AM
- Build output goes to `dist/`
- Predev/prebuild hooks run `generate-build-assets.cjs` to create `dist/version.json`

## Style Conventions

- ES modules throughout (`import`/`export`)
- Classes export singleton instances (`AppDB`, `AppAuth`, etc.)
- Config centralized in `js/config.js` — avoid hardcoding magic numbers
- `window.*` aliases for cross-module communication where needed
- UI components in `js/ui/` export render functions consumed by `js/ui.js`
