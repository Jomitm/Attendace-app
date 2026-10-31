# Employment and administrator security verification

The employment/admin rules now use the current `users` profile for authority. Cached ID-token roles and stale `user_access` mirrors cannot restore a removed admin, payroll, HR, or birthday grant. Missing and former profiles are denied.

## Controls verified

- Former, resigned, retired and legacy-inactive accounts cannot read or write, even with a previously valid administrator token.
- Employment status, leaving dates, credential values and credential-migration flags are changed by server endpoints rather than direct client writes.
- Legacy `status: inactive` cannot be used to bypass the employment action. Current check-in `in/out` and session updates continue to work.
- `staff_employment` notes are readable only by current full/users administrators. No client, including a full admin, can write or delete those notes directly.
- Employment audit entries cannot be forged, changed, retagged or deleted through the client SDK.
- Profile type and length validation applies on create and update. New client-created profiles must start active.
- Protected server APIs check current employment status after verifying the ID token, and use current profile roles/permissions. If account lookup fails, access fails closed with a retryable response.
- All active staff retain shared attendance and directory visibility through the authenticated `/api/staff-data` gateway. Direct raw collection queries require staff-history administrator authority. Normal check-in, leave cancellation, task updates and operational audit entries have positive regression tests.

## Re-running the real emulator tests

Run `npm run test:rules`, or `node scripts/test-firestore-rules.mjs` when npm is not on PATH. The runner starts a loopback-only Firestore emulator on an available port, uses only the `demo-crwi-rules` project, loads this checkout's `firestore.rules`, runs the integration tests, and stops the emulator. It never loads production credentials.

The emulator and portable Java runtime used for development are in ignored `.cache/rules-emulator/`. On another machine, provide `FIRESTORE_EMULATOR_JAR` and optionally `RULES_TEST_JAVA`, or use the same cache structure. Obtain Java and the emulator from their official distributors; do not commit the binary downloads.

Official references:

- [Firebase emulator installation and configuration](https://firebase.google.com/docs/emulator-suite/install_and_configure)
- [Connecting to the Firestore emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Firebase CLI emulator release metadata](https://github.com/firebase/firebase-tools/blob/master/src/emulator/downloadableEmulatorInfo.json)
- [Eclipse Temurin Java distributions](https://adoptium.net/temurin/releases/)

Development tools were verified against distributor SHA-256 values before execution: Firestore emulator 1.22.0 (`9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c`) and Temurin 21.0.13+9 JRE (`2332c0b4cff6bed722da3567c91d5e47568bcba863fa4945d0a8d6fc76158628`).

## Scope and remaining boundaries

The client, server and rules must be released together. Active-staff sharing uses a paginated, authenticated gateway that filters former owners, rejects unauthorized archive requests, redacts profile secrets and protects private task bodies. Current full/users administrators can request retained history from Admin. No historical documents are deleted or migrated.

Minutes approvals/access requests and staff task acceptance/delegation use authenticated server transactions. Shared ranking caches are administrator-written; ordinary staff calculate local summaries. Direct collaboration writes preserve identity and ownership.

Verification: 491 unit tests, 46 real emulator cases, TypeScript, lint (warnings only), production build and both browser fixtures pass. These local checks do not certify production or every legacy document shape. Unrelated legacy document-size limits remain a separate improvement.
