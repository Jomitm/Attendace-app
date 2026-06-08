# CSS Cleanup Report

Date: 2026-06-07

## Completed In This Pass

- Removed the legacy day-plan refresh block from `css/main.css`.
- Removed the duplicate `#day-plan-modal .day-plan-content` override from the global modal refresh block.
- Removed unused helper styles from `css/day-plan.css` and `css/tour.css`.
- Consolidated the nav jiggle animation rule in `css/main.css` into one shared selector group.
- Kept the mobile nav active label color in one shared rule instead of repeating it later.
- Folded the split `dashboard-modern` hero animation rules into the base hero selectors.
- Added section labels around the dashboard modern override layers so the file is easier to scan.

## Confirmed Dead Or Legacy

- `css/tour.css` `@keyframes tour-pulse` was unused and removed.
- `css/day-plan.css` `plan-editor-tags-*` styles were unused in the current module and removed.
- `css/main.css` old day-plan modal refresh selectors such as `#day-plan-modal .day-plan-head h3`, `#day-plan-modal .day-plan-intro`, `#day-plan-modal .day-plan-context > div`, and `#day-plan-modal #plans-container` were only present in the legacy styling layer and backups, not in the active module.
- A second dashboard audit confirmed the hero orbs, refresh button, and hero-stats-card selectors are active through `js/ui/dashboard.js`, so they were kept.

## Still Intentionally Kept

- `js/modules/day-plan.js` still depends on compatibility selectors like `.plan-task`, `.sub-plan-input`, and `.tag-chip` for data extraction.
- `css/main.css` still contains the later shell/theme overrides for `nav-item`, `card`, and `action-btn` because they are active visual refinements, not dead code.

## Next Cleanup Candidates

1. Split the repeated shell/theme section in `css/main.css` into a clearly labeled override layer so the base styles and the visual refresh are easier to compare.
2. Reduce repeated button and card declarations by promoting shared surface properties into a small component foundation.
3. Review the large `dashboard-modern` block in `css/main.css` for selectors that only exist as visual overrides and can be folded into shared tokens or modifier classes.
4. Re-check backup-only selectors under `backups/dayplan-popup/` to make sure no active code still points at them.
