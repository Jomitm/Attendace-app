const { test, expect } = require("@playwright/test");

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

    await expect(page.locator(".sidebar")).toBeHidden();
    await expect(page.locator(".mobile-header")).toBeHidden();
    await expect(page.locator(".mobile-nav")).toBeHidden();
    await expect(page.locator("#login-form input[name='username']")).toBeVisible();
    await expect(page.locator("#login-form input[name='password']")).toBeVisible();
  });
});
