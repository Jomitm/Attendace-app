# CRWI Attendance security assessment scope

Date: 31 October 2026 (Asia/Kolkata)
Status: Scope selected following the owner's delegation. Assessment execution has not started.

## Objective and standard

Perform an internal, evidence-based web/PWA security assessment, prepare remediation and retest evidence, and make the result usable by a separate independent assessor. This work does not constitute an independent penetration-test certificate or an OWASP certification.

Use OWASP ASVS 5.0.0 Level 2 as the proposed verification target, including applicable Level 1 requirements, with WSTG 4.2 test references. Map every requirement as pass, fail, not applicable (with reason), or not tested (with limitation); do not claim full Level 2 verification unless coverage supports it. MASVS/MASTG is conditional on identifying a native Android/iOS package; none was identified during initial repository inventory.

References: https://asvs.owasp.org/ ; https://owasp.org/projects/web-security-testing-guide ; https://mas.owasp.org/MASVS/04-Assessment_and_Certification/

## Target baseline

- Workspace: `D:\Attendace-app-main`.
- Observed HEAD: `ce61a2b8f19eb3dd673c53822ab3b088fb0ed02a`.
- The working tree contains substantial tracked modifications and untracked files. HEAD alone does not identify the assessment target. `security-assessment-baseline.json` fingerprints the selected local source/configuration/test files at scoping time. Recheck hashes before testing; assess later changes separately or issue a new baseline. This manifest is not an immutable source archive.
- Linked Vercel project: `crwi-staff-management-system`, project ID `prj_F4I4TvGHo9Ck2QA8ZazfEfZ9ruFS`, from local project linkage. Live deployment, URL, and source parity have not been verified.
- Firebase configuration points to `crwiattendance`. Treat it as production and do not direct active tests at it.
- Primary target: the web client/PWA, its backend handlers, Firestore rules and indexes, build/deployment configuration, dependencies, and app-owned integration logic.
- Exclude `OmniRoute/`, the Tally Connector workspaces, and unrelated applications.

## Environment and testing boundaries

1. Begin with read-only local source/configuration review and existing-test inspection. Existing security reports are leads, not current proof.
2. Run dynamic tests only on loopback with Firebase Auth/Firestore emulators, or a separately identified disposable staging environment with synthetic data and credentials. Never assume a localhost frontend is isolated: verify client Firebase settings, Admin SDK project/credentials, outbound network paths, and test harness configuration before launching it or running tests.
3. Do not use production service-account credentials, production database exports, or real employee records in the test environment. Do not deploy, change live rules/configuration, reset real passwords, or rotate real secrets as part of this scope.
4. Disable scheduled jobs and mock Telegram, AI, calendar consumers, feast services, and other external calls. App-generated messages must not reach real recipients. Test integration contracts locally; external-service delivery remains unverified.
5. Production allowance: ordinary unauthenticated GET/HEAD requests to a verified app-owned deployment for public page/assets, headers, TLS observations, and public build identity. No production payload injection, endpoint enumeration/fuzzing, login attempts, token probing, authenticated records, writes, or cron/webhook invocation.
6. No denial-of-service, password spraying, destructive payloads, social engineering, third-party infrastructure testing, or real-data extraction. Test throttling and lockout behavior using small controlled local sequences.
7. Dynamic-test default: one worker, at most two requests per second and 20 requests per individual negative test; use small explicit local concurrency cases for duplicate submission/race testing. Stop for unexpected live connectivity, real data, external delivery, or instability. Resolve isolation before resuming.
8. Browser coverage: Chromium desktop and mobile viewport first. Include installed-PWA/service-worker behavior on a suitable isolated secure origin, because localhost development cleanup may bypass production caching. Explicitly report Android/iOS hardware, Safari, and native-package coverage as not tested unless actually exercised.

No new broad permission gate is needed for work within these boundaries. An unavailable isolated environment limits dynamic coverage; it does not justify substituting production testing.

## Surfaces and test identities

Inventory all client routes, direct Firestore collection operations, exports/uploads, API entry paths, and trust boundaries before testing. Current API dispatcher declares 18 routes:

`ai-briefing`, `ai-insights`, `auth-login`, `auth-set-password`, `staff-employment`, `staff-data`, `minutes-action`, `staff-task-response`, `programmes`, `calendar-feed`, `calendar-token`, `feast-proxy`, `hero-select`, `telegram-generate-link`, `telegram-register-webhook`, `telegram-scheduler`, `telegram-send`, `telegram-webhook`.

Include canonical `/api/<route>` and dispatcher/query routing behavior. Check API authorization independently of Firestore rules and browser visibility.

Create synthetic identities for anonymous access, staff A, staff B, global admin, module administrator, view-only permissions, and disabled/ended-employment accounts. Verify real role/permission semantics against backend and rules; do not infer access from role labels alone. Include forged client flags, missing/malformed permission fields, stale sessions, and permission revocation.

## Coverage priorities

- Threat model: employee/payroll/location data, credential and token flows, client-to-API and client-to-Firestore boundaries, privileged backend access, external data disclosure, and abuse of attendance/approval workflows.
- Authentication/session: password storage and verification, account enumeration, recovery/set-password paths, rate controls, Firebase token validation, device sessions, logout, revocation, disabled accounts, and cross-device behavior.
- Authorization: cross-staff record reads/writes, privilege escalation, field-level access, collection queries, exports, admin operations, and module permissions. Exercise rules in an emulator; separately test Admin SDK handlers, which bypass rules.
- Business logic: forged times/location, replay, duplicate and concurrent requests, offline reconciliation, leave balances/approvals, task ownership, minutes actions, programme ownership, and employment lifecycle.
- Input/output: stored/reflected/DOM XSS, document/export rendering, unsafe URLs, server-side outbound requests, request validation, oversized input handling, method/content-type checks, CORS and CSRF where applicable.
- PWA/privacy: localStorage, IndexedDB, caches, service-worker updates, shared-device logout, offline records after revocation, logs/error leakage, minimization, and synthetic-data deletion.
- Integrations: Telegram identity binding/webhook secrets, calendar token scope/expiry/revocation, cron authorization, AI prompt injection/data boundaries/tool permissions/quotas, and external script/library trust.
- Platform/supply chain: dependencies and lockfile, secret exposure without reproducing secret values, build artifacts/source maps, headers/CSP, deployment rewrites, and environment separation.

## Evidence, completion, and cleanup

- Every finding needs affected baseline/component, prerequisites, a minimal reproducible case, redacted evidence, expected/actual behavior, impact, severity rationale, and remediation. Distinguish static evidence, mock/emulator tests, browser tests, and live observations.
- Store no usable credentials, tokens, or employee data in reports. Keep synthetic fixtures and redacted evidence locally in the workspace; remove temporary test accounts/data and stop test processes after use.
- Record test environment versions and configuration, case IDs, control mappings, commands/results, exclusions, and any staging/production differences. A tool scan alone cannot establish verification.
- Completion means all selected controls have an explicit status, findings are validated, and remediation/retest results or accepted outstanding risks are recorded. Do not mark unresolved items as passed. Production security remains limited by the stated observation boundary.
- Keep the assessed build stable while testing. Fingerprint fixes and retest affected controls plus relevant adjacent behavior against the new baseline.
- Deliver a scope/control matrix, technical findings with an executive overview, remediation tracker, and retest record. A separate assessor must determine their own scope and evidence sufficiency for any independent report. Recipient-specific qualification/report requirements remain unconfirmed.

## Initial inventory observations (not vulnerability findings)

- `tests/smoke/app.spec.js` currently exists despite older guidance saying smoke tests are unavailable; inspect current tests and configuration before choosing commands.
- `vercel.json` currently has an empty `crons` array despite scheduled jobs described in older guidance; actual deployed scheduler configuration remains unknown.
- Existing security audit documents and tests are present, alongside uncommitted API/rules changes. Do not overwrite or treat them as verified remediation.

Next execution step: inspect the existing security work, select the applicable security-review workflow, build the threat model/control inventory, and verify test isolation before any dynamic run.
