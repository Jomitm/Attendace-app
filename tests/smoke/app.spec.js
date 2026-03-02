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

  test("renders staff directory page without runtime failures", async ({ page }) => {
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
    await page.waitForFunction(() => Boolean(globalThis.AppUI?.renderStaffDirectoryPage));

    const html = await page.evaluate(async () => {
      const w = globalThis;
      const originalGetUser = w.AppAuth.getUser;
      const originalGetAll = w.AppDB.getAll;
      const originalGetCached = w.AppDB.getCached;
      const originalAppGetMyMessages = w.app_getMyMessages;
      const originalThreadId = w.app_staffThreadId;

      w.AppAuth.getUser = () => ({ id: "u1", name: "Tester" });
      w.AppDB.getCached = null;
      w.AppDB.getAll = async (collection) => {
        if (collection === "users") {
          return [
            { id: "u1", name: "Tester", role: "Admin", avatar: "./favicon.png" },
            { id: "u2", name: "Staff One", role: "Staff", avatar: "./favicon.png" }
          ];
        }
        if (collection === "staff_messages") return [];
        return [];
      };
      w.app_getMyMessages = async () => [];

      try {
        w.app_staffThreadId = "u2";
        return await w.AppUI.renderStaffDirectoryPage();
      } finally {
        w.AppAuth.getUser = originalGetUser;
        w.AppDB.getAll = originalGetAll;
        w.AppDB.getCached = originalGetCached;
        w.app_getMyMessages = originalAppGetMyMessages;
        w.app_staffThreadId = originalThreadId;
      }
    });

    expect(html).toContain("staff-directory-page");
    expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("renders dashboard with shared daily summary enabled", async ({ page }) => {
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
    await page.waitForFunction(() => Boolean(globalThis.AppUI?.renderDashboard));

    const html = await page.evaluate(async () => {
      const w = globalThis;
      const originals = {
        getUser: w.AppAuth.getUser,
        getStatus: w.AppAttendance.getStatus,
        getLogs: w.AppAttendance.getLogs,
        getUserMonthlyStats: w.AppAnalytics.getUserMonthlyStats,
        getUserYearlyStats: w.AppAnalytics.getUserYearlyStats,
        getPlans: w.AppCalendar ? w.AppCalendar.getPlans : null,
        getCollaborations: w.AppCalendar ? w.AppCalendar.getCollaborations : null,
        dbGetAll: w.AppDB.getAll,
        dbGetCached: w.AppDB.getCached,
        dbQueryMany: w.AppDB.queryMany,
        getOrCreateDailySummary: w.AppDB.getOrCreateDailySummary,
        flags: { ...(w.AppConfig.READ_OPT_FLAGS || {}) }
      };

      w.AppAuth.getUser = () => ({
        id: "u1",
        name: "Tester",
        role: "Staff",
        avatar: "./favicon.png",
        notifications: [],
        tagHistory: [],
        rating: 75
      });
      w.AppAttendance.getStatus = async () => ({ status: "out", lastCheckIn: null });
      w.AppAttendance.getLogs = async () => [];
      w.AppAnalytics.getUserMonthlyStats = async () => ({
        present: 0,
        late: 0,
        leaves: 0,
        penalty: 0,
        effectivePenalty: 0,
        breakdown: {}
      });
      w.AppAnalytics.getUserYearlyStats = async () => ({
        present: 0,
        late: 0,
        leaves: 0,
        penalty: 0,
        effectivePenalty: 0,
        breakdown: {}
      });
      if (w.AppCalendar) {
        w.AppCalendar.getPlans = async () => ({ leaves: [], events: [] });
        w.AppCalendar.getCollaborations = async () => [];
      }
      w.AppDB.getCached = null;
      w.AppDB.getAll = async (collection) => {
        if (collection === "users") {
          return [{ id: "u1", name: "Tester", role: "Staff", avatar: "./favicon.png" }];
        }
        return [];
      };
      w.AppDB.queryMany = async () => [];
      w.AppDB.getOrCreateDailySummary = async () => ({
        hero: null,
        teamActivityPreview: [],
        generatedAt: Date.now(),
        version: 1
      });
      w.AppConfig.READ_OPT_FLAGS = {
        ...w.AppConfig.READ_OPT_FLAGS,
        FF_SHARED_DAILY_SUMMARY: true
      };

      try {
        return await w.AppUI.renderDashboard();
      } finally {
        w.AppAuth.getUser = originals.getUser;
        w.AppAttendance.getStatus = originals.getStatus;
        w.AppAttendance.getLogs = originals.getLogs;
        w.AppAnalytics.getUserMonthlyStats = originals.getUserMonthlyStats;
        w.AppAnalytics.getUserYearlyStats = originals.getUserYearlyStats;
        if (w.AppCalendar) {
          w.AppCalendar.getPlans = originals.getPlans;
          w.AppCalendar.getCollaborations = originals.getCollaborations;
        }
        w.AppDB.getAll = originals.dbGetAll;
        w.AppDB.getCached = originals.dbGetCached;
        w.AppDB.queryMany = originals.dbQueryMany;
        w.AppDB.getOrCreateDailySummary = originals.getOrCreateDailySummary;
        w.AppConfig.READ_OPT_FLAGS = originals.flags;
      }
    });

    expect(html).toContain("dashboard-team-activity-card");
    expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Page errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("day plan popup hides other users' personal tasks for staff and shows all for admin", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(globalThis.app_showAnnualDayDetails));

    const result = await page.evaluate(async () => {
      const w = globalThis;
      const fakePlans = {
        leaves: [],
        events: [],
        workPlans: [
          { date: '2026-03-05', userId: 'u1', userName:'Me', planScope:'personal', plans:[{task:'mine',tags:[],status:'pending'}] },
          { date: '2026-03-05', userId: 'u2', userName:'Them', planScope:'personal', plans:[{task:'theirs',tags:[],status:'pending'}] },
          { date: '2026-03-05', userId: 'u2', userName:'Them', planScope:'personal', plans:[{task:'tagged',tags:[{id:'u1',name:'Me',status:'accepted'}],status:'pending'}] },
          { date: '2026-03-05', userId: 'u3', userName:'All', planScope:'annual', plans:[{task:'annual',tags:[],status:'pending'}] }
        ]
      };

      let captured = '';
      const origGetPlans = w.AppCalendar.getPlans;
      w.AppCalendar.getPlans = async () => fakePlans;

      // staff view
      w.AppAuth.getUser = () => ({ id:'u1', name:'Me', role:'Staff' });
      await w.app_showAnnualDayDetails('2026-03-05');
      captured += document.querySelector('#annual-day-detail-modal')?.innerText || '';
      // admin view
      w.AppAuth.getUser = () => ({ id:'u4', name:'Admin', role:'Administrator', isAdmin:true });
      await w.app_showAnnualDayDetails('2026-03-05');
      captured += '||ADMIN||' + (document.querySelector('#annual-day-detail-modal')?.innerText || '');

      w.AppCalendar.getPlans = origGetPlans;
      return captured;
    });

    expect(result).toContain('mine');
    expect(result).toContain('tagged');
    expect(result).toContain('annual');
    expect(result).not.toContain('theirs');
    expect(result).toMatch(/ADMIN\|\|.*theirs/);
  });
});
