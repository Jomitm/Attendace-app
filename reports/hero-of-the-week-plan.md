# Hero of the Week Layout Memory

## Hero Selection Rule
- The hero is selected from a rolling window of the last `7` completed days in the organization's default timezone.
- Config placeholders: `minPlannedTasks = policy.MIN_EVIDENCE.minPlannedTasks || 1`, `minDays = policy.MIN_EVIDENCE.minDays || 1`, `minDurationMs = policy.MIN_EVIDENCE.minDurationMs || 1`.
- Candidates must pass the minimum evidence gate: at least `minPlannedTasks` planned tasks, `minDays` active days AND `minDurationMs` tracked time.
- `taskScore = (completionRate * wCompletionRate) + (absoluteVolumeScore * wAbsoluteVolume) + (executionQualityScore * wExecutionQuality) - (missPenaltyScore * wMissPenalty) - (postponedPenaltyScore * wPostponedPenalty) + (planningScore * wPlanningBreadth)`.
- Postponed tasks that are later completed within the same week are auto-neutralized and excluded from the postponed penalty.
- `attendanceFactor = max(0.5, modifierBase + min(modifierMaxBonus, attendanceReliability * modifierMaxBonus))`.
- `attendanceReliability = ((consistencyScore / 100) * modifierConsistencyImpact) + ((effortScore / 100) * modifierEffortImpact)`.
- `finalScore = taskScore * attendanceFactor`.
- Tie-break order after `finalScore`: higher `taskCompleted`, fewer `taskMissed`, more `days`, more `totalDurationMs`, then user id.
- The leaderboard marks the top eligible rank `1` as the winner.

## Purpose
- The `Hero of the Week` card is the dashboard spotlight for the top weekly staff performer.
- It also doubles as an audit view when expanded to fullscreen.

## Current Layout
- Header row: `Hero of the Week` badge on the left, sync status on the right.
- Body row: staff avatar, name, role, and a metric grid.
- Metrics shown: Planned, Completed, In Progress, Postponed, Missed.
- Attendance row: days, hours, and factor pills.
- Footer row: status tag and supporting summary text.

## Empty / Error State
- When no eligible hero data exists, the card shows a short empty-state message.
- The footer badge switches to either `No Eligible Data` or `Fetch Error`.

## Expanded View
- Clicking the hero card opens the fullscreen dashboard card mode.
- The expanded overlay renders the hero card plus the `Weekly Hero Audit` leaderboard.
- The leaderboard includes scored range, staff count, winner label, and row-level counts.
- Privacy rule: admins and managers see the full leaderboard, while standard staff see only the Top 3 or Top 5 rows to reduce bottom-ranking exposure.

## Accessibility
- The hero card must have an `aria-label` that clearly describes the action to open the Hero of the Week details.
- The metric grid should expose readable labels for each metric so screen readers can identify Planned, Completed, In Progress, Postponed, and Missed values.
- The avatar image must always have a meaningful `alt` text using the staff member's name.
- The card must remain keyboard accessible with `tabindex="0"` and activate on `Enter` or `Space`.

## Admin Manual Refresh
- An admin-only refresh button (🔄 icon) is rendered in the Hero Card header when `app_hasPerm('dashboard', 'admin', currentUser)` is true.
- Clicking the button triggers `window.app_forceRefreshHero(event)` which:
  1. Checks `heroRefreshedToday` on the current Firestore daily summary to enforce once-per-day.
  2. Invalidates local caches for `daily_summaries`, `attendance`, `work_plans`, and `users`.
  3. Calls `AppAnalytics.buildDailyDashboardSummary()` with fresh data.
  4. Writes the updated summary (with `heroRefreshedToday: true`) back to Firestore.
  5. Clears the entire in-memory cache and re-renders the dashboard.
- After a successful refresh, the button is rendered in a disabled/greyed-out state for the rest of the day.

## Key Code Hooks
- Card renderer: `js/ui/dashboard.js` -> `renderHeroCard()`
- Expanded audit renderer: `js/ui/dashboard.js` -> `renderHeroExpandedAuditMarkup()`
- Admin refresh handler: `js/ui/dashboard.js` -> `app_forceRefreshHero()`
- Fullscreen card id: `hero-week`
- Card title label: `Hero of the Week`
- Hero scoring: `js/modules/analytics.js` -> `scoreHeroFromLogs()`
- Hero ranking: `js/modules/analytics.js` -> `rankHeroCandidates()`

## Styling Hooks
- Main card class: `.dashboard-hero-stats-card`
- Hero sub-elements: `.hero-label-badge`, `.hero-profile`, `.hero-metrics`, `.hero-attendance-pill`
- Leaderboard panel: `.hero-leaderboard-panel`

## Caching
- Hero stats should be fetched once per day and reused until the next daily rollover.
- Current cache keys are day-scoped, using `hero_stats_v{schemaVersion}_{todayStr}` and `hero_leaderboard_v{schemaVersion}_{todayStr}`.
- Cache TTL is `24 * 60 * 60 * 1000` ms so dashboard renders do not repeatedly load the database.
- The cached result should be refreshed only after the organization's day key changes.

## Notes For Future Changes
- Keep the hero card compact on the dashboard, but rich in details when fullscreen.
- Preserve the click/keyboard behavior that opens `hero-week`.
- If the layout changes, update this file so the memory stays aligned with the UI.
