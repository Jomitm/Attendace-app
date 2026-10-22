const { test, expect } = require("@playwright/test");
const { readFileSync } = require("node:fs");
const { join, dirname } = require("node:path");

const manifest = JSON.parse(
  readFileSync(join(__dirname, "..", "fixtures", "globals-loadtime-manifest.json"), "utf8")
);

test.describe("CRWI Attendance smoke", () => {
  test("loads login shell and avoids uncaught runtime failures", async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message || String(error));
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text() || "";
        if (!text.includes("favicon")) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto("/index.html", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#page-content")).toBeVisible();
    await expect(page.locator("input[name='username']").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" }).first()).toBeVisible();

    expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("renders main shell elements for unauthenticated users", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator(".mobile-header")).toBeHidden();
    await expect(page.locator(".mobile-nav")).toBeHidden();
    await expect(page.locator("#login-form input[name='username']")).toBeVisible();
    await expect(page.locator("#login-form input[name='password']")).toBeVisible();
  });

  test("load-time window globals match the manifest", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const present = await page.evaluate(
      (names) => Object.keys(window).filter((k) => names.includes(k)),
      manifest.loadtime
    );

    const missing = manifest.loadtime.filter((n) => !present.includes(n));
    expect(missing, `Missing load-time globals:\n${missing.join("\n")}`).toEqual([]);
  });

  test("combines same-day check-in sessions without counting a second day", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof window.AppAnalytics?.aggregateAttendanceSessionsPerDay === "function");

    const result = await page.evaluate(() => {
      const originalAttendance = window.AppAttendance;
      window.AppAttendance = {
        evaluateAttendanceStatus: (_checkIn, durationMs) => ({
          status: durationMs >= 8 * 60 * 60 * 1000 ? "Present" : "Half Day",
          dayCredit: durationMs >= 8 * 60 * 60 * 1000 ? 1 : 0.5,
          lateCountable: false,
          extraWorkedMs: 0
        }),
        msToTime: (durationMs) => `${Math.floor(durationMs / 3600000)}h`
      };

      try {
        const date = "2026-09-22";
        const firstIn = new Date(`${date}T09:00:00`).getTime();
        const secondIn = new Date(`${date}T15:00:00`).getTime();
        const sessions = [
          {
            id: "smoke-first-session", user_id: "smoke-user", date, entrySource: "checkin_checkout",
            attendanceEligible: true, type: "Half Day", dayCredit: 0.5,
            checkIn: "09:00", checkOut: "13:00", checkInAt: firstIn, checkOutAt: firstIn + 4 * 3600000,
            durationMs: 4 * 3600000
          },
          {
            id: "smoke-second-session", user_id: "smoke-user", date, entrySource: "checkin_checkout",
            attendanceEligible: true, type: "Half Day", dayCredit: 0.5,
            checkIn: "15:00", checkOut: "19:00", checkInAt: secondIn, checkOutAt: secondIn + 4 * 3600000,
            durationMs: 4 * 3600000
          }
        ];
        const [combined] = window.AppAnalytics.aggregateAttendanceSessionsPerDay(sessions);
        return {
          rows: window.AppAnalytics.aggregateAttendanceSessionsPerDay(sessions).length,
          durationMs: combined?.durationMs,
          dayCredit: combined?.dayCredit,
          type: combined?.type,
          firstCheckInAt: combined?.checkInAt,
          lastCheckOutAt: combined?.checkOutAt
        };
      } finally {
        window.AppAttendance = originalAttendance;
      }
    });

    expect(result).toEqual({
      rows: 1,
      durationMs: 8 * 60 * 60 * 1000,
      dayCredit: 1,
      type: "Present",
      firstCheckInAt: new Date("2026-09-22T09:00:00").getTime(),
      lastCheckOutAt: new Date("2026-09-22T19:00:00").getTime()
    });
  });
});
