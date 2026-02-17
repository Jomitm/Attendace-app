const { defineConfig, devices } = require("@playwright/test");

const baseURL = process.env.BASE_URL || "http://localhost:3004";

module.exports = defineConfig({
  testDir: "./tests/smoke",
  timeout: 30000,
  expect: {
    timeout: 7000
  },
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure"
  },
  webServer: {
    command: "powershell -NoProfile -ExecutionPolicy Bypass -File ./test_server.ps1",
    url: `${baseURL}/index.html`,
    timeout: 120000,
    reuseExistingServer: true
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});

