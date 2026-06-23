# CRWI Attendance App – Project Memory

> This file captures key architectural decisions, scoring logic, and config values
> so future developers (or AI assistants) can resume work without re-discovery.

---

## Hero of the Week – Scoring System (v5)

### Overview
The "Hero of the Week" identifies the top-performing staff member each week using a
**weighted composite score** rather than a simple completion ratio. This prevents
staff who complete 1 of 1 task (100%) from outranking staff who complete 8 of 10 tasks (80%).

### Scoring Formula
```
taskScore =
    (completionRate        × 0.20)
  + (absoluteVolumeScore   × 0.30)   ← heaviest weight
  + (executionQualityScore × 0.20)
  - (missPenaltyScore      × 0.10)
  - (postponedPenaltyScore × 0.02)   ← very light
  + (planningBreadthScore  × 0.15)

attendanceReliability =
    (consistencyScore/100 × 0.65) + (effortScore/100 × 0.35)

attendanceFactor =
    max(0.5, 0.9 + min(0.15, attendanceReliability × 0.15))

finalScore = taskScore × attendanceFactor
```

### Eligibility (Strict AND gate)
All three must be satisfied:
| Criterion          | Threshold  |
|--------------------|-----------|
| `minPlannedTasks`  | ≥ 3       |
| `minDays`          | ≥ 3       |
| `minDurationMs`    | ≥ 4 hours (14,400,000 ms) |

### Postponed Task Handling
- **Auto-neutralization**: If a postponed task is completed within the same week,
  the postponed entry is filtered out — no penalty applied.
- **Residual penalty**: If the task stays postponed, it carries only 2% weight
  (vs 10% for a truly missed task).

### Config Location
- `js/config.js` → `HERO_POLICY` object
- All hero policy fields are editable by admins via the **Hero of the Week Control Panel** on the Policies page:
  - `WEIGHTS`
  - `WINDOW_DAYS`
  - `FALLBACK_LOOKBACK_DAYS`
  - `EXPECTED_WEEKLY_TASKS`
  - `DEFAULT_ACTIVITY_SCORE`
  - `ATTENDANCE_MODIFIER`
  - `CAPS`
  - `MIN_EVIDENCE` (`minDurationMs` is edited as hours in the UI and saved back in milliseconds)
- Saving from the admin panel auto-increments `SCHEMA_VERSION`, which forces
  a cache invalidation for all clients on their next dashboard load.

### Key Files
| File | Purpose |
|------|---------|
| `js/config.js` | Default policy values and schema version |
| `js/modules/analytics.js` | `rankHeroCandidates`, `scoreHeroFromLogs`, `normalizeHeroTasks` |
| `js/modules/admin-policies.js` | Admin UI for tuning weights and saving to Firestore |
| `js/ui/dashboard.js` | `renderHeroCard()`, `app_forceRefreshHero()` |
| `reports/hero-of-the-week-plan.md` | Detailed layout/behaviour reference |

---

## Admin Manual Refresh (Hero of the Day)

- An **admin-only** refresh button (🔄) appears on the Hero Card in the dashboard.
- Clicking it:
  1. Invalidates local caches for `daily_summaries`, `attendance`, `work_plans`, and `users`.
  2. Calls `AppAnalytics.buildDailyDashboardSummary()` with fresh data.
  3. Writes the new summary to Firestore with `heroRefreshedToday: true`.
  4. Clears the entire in-memory cache and re-renders the dashboard.
- The button is **disabled after one use per day** (enforced by checking the
  `heroRefreshedToday` flag on the Firestore daily summary doc).
- Permission check: `app_hasPerm('dashboard', 'admin', currentUser)`.

---

## Caching Strategy

| Layer | TTL | Key Pattern |
|-------|-----|-------------|
| Daily summary (Firestore) | 24 h | `daily_summaries/{YYYY-MM-DD}` |
| Hero stats (in-memory) | 24 h | `hero_stats_v{SCHEMA_VERSION}_{todayStr}` |
| Hero leaderboard (in-memory) | 24 h | `hero_leaderboard_v{SCHEMA_VERSION}_{todayStr}` |
| Work plans (read cache) | 60 s | `all:work_plans:*` |
| Users (read cache) | 60 s | `all:users:*` |

Schema version bump → stale cache keys stop matching → automatic recalculation.

---

## Environment & Build Notes

- **Framework**: Vite (vanilla JS, no React/Vue/Angular)
- **Database**: Firebase Firestore (compat SDK loaded via `<script>` in `index.html`)
- **Hosting**: Vercel
- **Test runner**: Playwright (smoke tests in `tests/smoke/`)
- **Test server**: `test_server.ps1` on port 3004 (serves from root, not `dist/`)
- **PowerShell execution policy**: The user's machine has a restricted PS profile;
  use `cmd.exe /c` to wrap commands when needed.
- **Third-party ES imports**: `docx`, `jsPDF`, `html2canvas` are used in `letter-pad.js`.
  These are resolved by Vite at build time but cause bare-specifier errors if the
  app is served from a plain static server without bundling.

---

## Open Items / Future Improvements

- [ ] Consider adding a "Hero of the Month" aggregate view.
- [ ] Expose postponed-neutralization window (currently same-week) as an admin config.
- [ ] Add unit tests for `rankHeroCandidates` and `scoreHeroFromLogs`.
- [ ] The smoke test (`tests/smoke/app.spec.js`) currently fails on the plain
      static test server because `letter-pad.js` uses bare ES module imports (`docx`).
      Either add an import map or run smoke tests against the Vite dev server.
