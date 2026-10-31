# Staff employment status

Admin > Staff Management provides Active / Former staff / All filters and a name/username/department search. Mark as former staff records a last working date, reason (Resigned, Retired, Contract ended, Other) and optional admin note. Restore retains the same staff id and history. Self-deactivation is blocked; full administrators are protected from changes by scoped staff administrators.

## Behavior

- `/api/staff-employment` validates current administrator permission on the server, stores the employment transition and audit event in a Firestore transaction, clears device sessions, then disables/enables Firebase Auth and revokes refresh tokens. Synchronization failures return an explicit warning and can be retried. Login independently rejects former profiles.
- Employment status is separate from daily `status: in/out`. Missing employment fields mean active, preserving legacy profiles. Historical `status: inactive` is also recognized.
- Normal application reads filter former staff and associated records through the database adapter. Admin history requests explicitly include former records. Live user snapshots invalidate app caches and refresh ordinary pages. No staff profile, attendance, leave, salary or work-plan history is deleted.
- Hidden task placeholders retain list positions. Saving a filtered work plan restores the hidden task and retired tags from storage to avoid accidental history loss.
- Telegram reminders, reports, linking and daily briefings exclude former staff. Calendar feeds and new feed tokens reject former accounts.
- Shared daily summaries are regenerated when their employment-roster signature is obsolete.
- Employment notes/history are stored in `staff_employment`, separately from the shared roster. Server writes only; full/users administrators can read them.

## Access boundaries and deployment

Shared active-staff records are read through the authenticated `/api/staff-data` gateway. Ordinary staff cannot directly list protected collections or request former-staff history. The gateway checks current account authority, filters former and orphan personal records, redacts sensitive profile fields, and preserves private-task boundaries. Historical documents remain in place; authorized Admin requests can retrieve them.

The matching app, server routes and rules were deployed on 2026-10-30 to `staff.crwi.org.in` and Firebase project `crwiattendance`. Production deployment: `dpl_26qokmB5ZEWpj3EZGEaANSpMRd5g`; ruleset: `3d0d7868-abfb-443c-a814-e0d679e48b3a`. Live checks covered active login, shared attendance in a real browser, direct-read denial, former-history restriction, resignation, old-token denial and restoration. All temporary QA accounts and records were removed. No real staff employment status was changed. See security-rules-verification.md for repeatable local checks and remaining scope limits.

## Verification

- `node --test tests/unit/staff-employment.test.mjs`
- `node --test tests/unit/*.test.mjs`
- `node node_modules/typescript/bin/tsc -p jsconfig.json`
- `node tests/browser/staff-employment.check.mjs` against local Vite (`BASE_URL`, default port 3017): uses actual Admin rendering with fixture accounts and intercepted API writes.

Admin improvements in this change also include initial-letter avatar fallbacks, separate employment/check-in badges, no impersonation action for former staff, active-only admin/birthday/Telegram overview counts, and a warning when admin reads fail.

- `npm run test:rules` runs real Firestore emulator integration tests against a demo project, including negative access tests and positive staff workflows.
