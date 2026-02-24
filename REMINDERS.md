# Reminders

## Firebase Firestore Offline Cache Migration
- Created: 2026-02-22
- Priority: Medium
- Reminder: Replace `enableIndexedDbPersistence()` with the newer Firestore cache settings API before the next major Firebase SDK upgrade.
- Why: Current method is deprecated warning-only now, but may break in future SDK versions.
- Suggested target date: 2026-03-15
- Owner: Admin / Engineering

## Release Signal Workflow Setup
- Created: 2026-02-24
- Priority: High
- Reminder: Add GitHub repository secret `FIREBASE_SERVICE_ACCOUNT_JSON` (full service account JSON) so `.github/workflows/publish-release-signal.yml` can publish `app_meta/release_signal` after each push to `main`.
- Why: Without this secret, active staff will not receive realtime update blink/countdown notifications.
- Suggested target date: 2026-02-24
- Owner: Admin / Engineering
