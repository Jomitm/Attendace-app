# CRWI Attendance App – Project Context

This file is automatically loaded at the start of every session so I can resume work without re-discovery.

When significant changes are made or key decisions are discussed in a session, I'll update the relevant sections of this file so the context stays fresh.

---

## Quick Reference

- **Stack**: Vanilla JS SPA + Vite 7 + Firebase Firestore (Compat SDK via CDN)
- **Auth**: Custom username/password (Firestore `users` collection + localStorage `crwi_session_user`)
- **Hosting**: Vercel (`vercel.json` rewrites `/ai/assistant` → serverless fn)
- **Entry**: `index.html` → `js/app.js` (hash-based SPA router)
- **Config**: `js/config.js` (AppConfig — hours, grace bands, late penalty, hero policy)
- **DB adapter**: `js/modules/db.js` (Firestore abstraction with in-memory cache + TTL)
- **Dev**: `npm run dev` (port 3000 via Vite)
- **Build**: `npm run build` → `dist/`

---

## Existing Documentation (Read for Details)

These files contain detailed information I should consult when relevant:

| File | What It Covers |
|------|---------------|
| `ATTENDANCE_POLICY_MANUAL.md` | Attendance status rules, day credit mapping, late deduction, salary calc |
| `LEAVE_AND_ATTENDANCE_LOGIN.md` | Combined understanding of leave flow, login behavior, missed checkout handling |
| `memory.md` | Hero of the Week scoring (v5), caching strategy, dashboard refresh guard, hero-task sync |
| `TESTING.md` | Smoke test setup, Playwright, lint commands |
| `TODO.md` | Current active todos (day-plan query optimization) |
| `REMINDERS.md` | Firestore cache migration, release signal workflow setup |

---

## Key Architecture

### Module Pattern
All business logic modules live in `js/modules/` — each exports a class instance or plain object attached to `window` (e.g. `window.AppAuth`, `window.AppAttendance`, `window.AppAnalytics`). UI rendering modules in `js/ui/` handle page rendering and DOM interaction.

### Data Flow
```
User Action → Module Class → DB Adapter (js/modules/db.js) → Firestore
                                ↕
                           In-Memory Cache (Map with TTL)
                                ↕
                          Realtime Listeners (onSnapshot) → UI
```

### Auth Pattern
Login fetches from `users` collection, matches username/email + password. Session lives in `localStorage`. Permissions checked via `window.app_hasPerm()`, `window.app_isAdminUser()`, `window.app_canManageAttendanceSheet()`.

### Caching Strategy
See `memory.md` — key caches include daily summaries (24h), hero stats (24h, schema-versioned), work plans (60s), users (60s). Schema version bump auto-invalidates hero caches.

---

## AI Integration

- **Client**: `js/modules/ai-assistant.js` → `POST /ai/assistant`
- **Server**: `api/assistant.js` (resolves to `api/grokHandler.js` using xAI/Grok API)
- **Middleman**: `api/_assistant-common.js` (prompt engineering, response validation, audit logging)
- **Context feeder**: `js/modules/ai-context-feeder.js` (builds staff context packs)
- **Env key**: `XAI_API_KEY` / `GROK_API_KEY` in `.env`
- **Dev proxy**: Vite inline plugin routes `/ai/assistant` to `api/assistant.js`

---

## Routes (Hash-based SPA)

| Hash | Page | UI File |
|------|------|---------|
| `#dashboard` | Main dashboard | `js/ui/dashboard.js` |
| `#staff-directory` | Staff directory | `js/ui/staff-directory.js` |
| `#annual-plan` | Annual plan | `js/ui/annual-plan.js` |
| `#team-activities` | Team activities | `js/ui/team-activities.js` |
| `#timesheet` | Timesheet | `js/ui/timesheet.js` |
| `#policies` | Policies & leave | `js/modules/policies.js` |
| `#minutes` | Meeting minutes | `js/ui/minutes-ui.js` |
| `#letter-pad` | Letter pad | `js/ui/letter-pad.js` |
| `#staff-ai-memory` | AI memory (admin) | `js/ui/admin.js` |
| `#admin` | Admin panel | `js/ui/admin.js` |
| `#master-sheet` | Attendance sheet | `js/ui/master-sheet.js` |
| `#salary` | Salary processing | `js/ui/payroll.js` |
| `#policy-test` | Policy test | `js/ui/payroll.js` |
| `#profile` | User profile | `js/ui/profile.js` |
| `#birthday-calendar` | Birthdays | `js/ui/birthday-calendar.js` |

---

## Key Collections (Firestore)

`users`, `attendance`, `leaves`, `minutes`, `work_plans`, `staff_messages`, `salaries`, `settings`, `events`, `daily_summaries`, `journey_reflections`, `policies`, `admin_policies`, `budget_heads`, `task_activity_events`, `ai_assistant_logs`, `ai_staff_context`

---

---

## Session Log

Changes, decisions, and context updates are recorded here after each session so the next one picks up where we left off.

-- Session log starts below --

### 2026-07-21 — Full bug fix pass (extra time, attendance eval, analytics, timer)

- **Fixed 3 extra time tracking bugs** (previous session):
  - `evaluateCheckoutOvertimePrompt()` returned no `extraTimeMs`/`requiresConfirmation` → section never showed. Fixed.
  - `checkOut()` `extraWorkedMs` always 0 for 9AM check-ins. Now uses `options.extraTimeConfirmedMs || statusMeta.extraWorkedMs || 0`.
  - Analytics only read `log.extraWorkedMs`, never `log.extraTimeConfirmedMs`. Now checks both.

- **Full bug-fix pass across all modules** (this session):
  - **`attendance.js` (7 fixes):**
    - Dead branches removed in `evaluateAttendanceStatus` — `>lateEnd`/`>postNoonEnd` were unreachable. Restructured afternoon logic.
    - Saturday holidays respected via `AppConfig.IS_SATURDAY_OFF`.
    - `extraWorkedMs` now computed for all check-in times using `- 8h` (was always 0 for morning, or -4h for afternoon).
    - ID collision fixed — `String(Date.now())` replaced with `_nextId()` (timestamp + counter suffix).
    - UTC→local dates in `getStatus()` staleness check (fixes IST midnight crossover).
    - Same-day stale session self-healing added (previously only cross-day healed).
    - Virtual log uses `YYYY-MM-DD` instead of `toLocaleDateString()`. `msToTime` no longer `% 24`.
  - **`analytics.js` (5 fixes):**
    - Extra time inflation fixed — uses `WORK_START_TIME` (9:00AM) instead of `lateCutoff` (9:15AM) for early-arrival bonus.
    - Half-day Saturdays excluded from `applyImpliedMonthlyAbsences`.
    - Config lookups (`lateCutoff`, `earlyDeparture`, `workStartMinutes`) hoisted outside forEach loops.
    - Admin chart fetches 7 days instead of 14.
    - Inline `manualLateCutoff` redeclaration removed.
  - **`app.js` (4 fixes):**
    - Budget head validation activated (was dead code — `validationErrors` always empty).
    - Null-safe modal hide (`#checkout-modal` null check).
    - `err.message` fallback for non-Error throws.
    - Timer `targetTime` recalculated per-tick from current day-of-week (handles midnight crossover).

### 2026-07-22 — Day plan load performance optimization & dashboard gap fix

- **Day plan load time reduced (`js/modules/day-plan.js`):**
  - `getReferencedDayPlanUsers()` replaced full `users` collection scan + N+1 with single `AppDB.getManyByIds()` — only fetches user IDs referenced in the day's plans
  - `loadDayPlanData()` cut from 3 Firestore reads to 1 (`getDayPlansByDate`), extracts personal/annual via `.find()` on results
  - Prefetch enabled for today's date (changed `>` to `>=`) so loading spinner is skipped on today's common view
  - `DAY_PLAN_LOAD_TTL_MS` and `DAY_PLAN_PREFETCH_TTL_MS` both extended 15s → 5min
  - Added per-session dedup (`dayPlanMaintenanceDone`) to skip repeat carry-forward maintenance on successive opens
  - Added `prewarmFirestore()` — tiny `limit(1)` read on idle to avoid Firestore TLS cold-start latency

- **Cache TTLs bumped (`js/config.js`):** `users` 1min→10min, `settings` 5min→10min, `workPlanReadMs` 2min→5min, other caches extended accordingly

- **Dashboard widget spacing tightened (`css/main.css`):** `--card-gap` reduced from `clamp(0.5rem, 1.4vw, 0.9rem)` to `clamp(0.35rem, 0.6vw, 0.5rem)`. Primary row gap/margin changed from hardcoded `0.75rem` to `var(--card-gap)`

### 2026-07-22 — Dashboard mobile-first responsive redesign

- **New file `css/dashboard-mobile.css`** — Mobile-first overlay with unified breakpoints:
  - `< 768px`: hero card auto-heights (removed `!important` clamp), primary row stacks as flex column, stats row 1-col, compact grid/card padding, leave rows stacked, activity split 1-col
  - `>= 768px (tablet)`: primary row 2-col grid, hero card fixed heights restored, leave actions side-by-side
  - `>= 1024px (desktop)`: primary row 3-col grid, original gaps/padding restored
  - Breaks the 768/780px mismatch — sidebar and dashboard content now collapse at the same point

- **Edited `css/main.css`** — Removed two redundant media query blocks: `@media (max-width: 780px)` leave-row rule and `@media (max-width: 900px)` dashboard-modern hero section, both now handled at the unified 768px breakpoint

- **Edited `index.html`** — Added `<link>` for `css/dashboard-mobile.css`

- **Edited `js/ui/dashboard.js`** — `renderDashboard()` now sets `data-viewport="mobile"|"desktop"` on `.dashboard-grid` based on `window.innerWidth`

- **Edited `js/app.js`** — `setupDashboardEvents()` now calls `updateDashboardViewport()` and registers a `resize` listener to update the attribute live

- **No content hidden** on mobile (all widgets visible), **check-in widget kept full** (countdown/overtime shown) — purely a layout responsiveness fix

### 2026-07-20 — Initial setup
- Created `COMMANDCODE.md` with full project context, referencing all 6 existing `.md` docs.
- Established convention: session crux gets logged here so context carries across conversations.
- Taste system learning preferences automatically from interactions.
- Fixed `cmdc-portable.cmd` — now passes both project root (`%~dp0`) and current working dir (`%CD%`) as `--add-dir`, so it works from any folder while still loading the project's COMMANDCODE.md.

## Conventions to Follow

1. **All date/time** in India Standard Time (IST, UTC+5:30)
2. **Permissions** via `window.app_hasPerm(perm, role, userObj)` — never assume
3. **DB writes** go through `AppDB.put()`, reads through `AppDB.get()`/`AppDB.query()` for cache consistency
4. **UI modules** attach to `window` and are called from `app.js` orchestrator
5. **Firebase SDK** is v9 Compat loaded via CDN in `index.html` — use compat style (`new firestore.DocumentReference()` etc.)
6. **Test runner**: Playwright for smoke tests; `npm test` runs lint + smoke
7. **Vite dev server** needed for proper ES module resolution (bare imports like `docx` won't work on plain static server)
