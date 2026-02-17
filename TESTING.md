# Testing Guide

## One-time setup

1. Install Node.js LTS (if needed):

```powershell
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
```

2. Open a new terminal so `node` and `npm` are on `PATH`.

3. Install project dependencies:

```powershell
npm install
```

4. Install Playwright browser runtime:

```powershell
npx playwright install chromium
```

## Run checks

- Lint only:

```powershell
npm run lint
```

- Smoke tests only:

```powershell
npm run test:smoke
```

- Full baseline checks:

```powershell
npm test
```

## Notes

- Smoke tests launch a local static test server from `test_server.ps1`.
- You can override the test target with `BASE_URL`:

```powershell
$env:BASE_URL="http://localhost:3004"
npm run test:smoke
```

## Troubleshooting

- If `node` is not recognized, restart terminal/session and run `node -v`.
- If PowerShell profile policy warnings appear, they are unrelated to the test scripts.
- If Chromium is missing, rerun `npx playwright install chromium`.
