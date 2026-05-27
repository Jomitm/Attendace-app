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

  test("renders letter pad editor for assigned users", async ({ page }) => {
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
    await page.waitForFunction(() => Boolean(globalThis.AppUI?.renderLetterPad));

    const html = await page.evaluate(async () => {
      const w = globalThis;
      const originals = {
        getUser: w.AppAuth.getUser,
        queryMany: w.AppDB.queryMany,
        put: w.AppDB.put
      };
      const profile = {
        id: "lp1",
        ownerId: "u1",
        name: "Main Office",
        isDefault: true,
        margins: { top: 28, right: 22, bottom: 28, left: 22 },
        headerHeight: 82,
        footerHeight: 64,
        signatureSize: 120,
        sealSize: 92
      };

      w.AppAuth.getUser = () => ({
        id: "u1",
        name: "Letter User",
        permissions: { letterPad: "view" }
      });
      w.AppDB.queryMany = async (collection) => collection === "letter_pad_profiles" ? [profile] : [];
      w.AppDB.put = async () => true;

      try {
        return await w.AppUI.renderLetterPad();
      } finally {
        w.AppAuth.getUser = originals.getUser;
        w.AppDB.queryMany = originals.queryMany;
        w.AppDB.put = originals.put;
      }
    });

    expect(html).toContain("letter-pad-page");
    expect(html).toContain("Main Office");
    expect(html).toContain("letter-pad-editor");
    expect(html).toContain("DOCX");
    expect(html).toContain("PDF");
    expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("letter pad permission is captured from admin permission UI", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(globalThis.AppUI?.renderModals && globalThis.app_getPermissionsFromUI));

    const permissions = await page.evaluate(() => {
      const w = globalThis;
      const originalGetUser = w.AppAuth.getUser;
      w.AppAuth.getUser = () => ({ id: "admin", name: "Admin", isAdmin: true });
      try {
        document.body.insertAdjacentHTML("beforeend", w.AppUI.renderModals());
        document.getElementById("add-perm-letterPad-view").checked = true;
        return w.app_getPermissionsFromUI("add");
      } finally {
        w.AppAuth.getUser = originalGetUser;
        document.getElementById("add-user-modal")?.remove();
        document.getElementById("edit-user-modal")?.remove();
      }
    });

    expect(permissions.letterPad).toBe("view");
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
        flags: { ...((w.AppConfig && w.AppConfig.READ_OPT_FLAGS) || {}) },
        hadAppConfig: Object.prototype.hasOwnProperty.call(w, 'AppConfig')
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
      if (!w.AppConfig) w.AppConfig = { READ_OPT_FLAGS: {} };
      if (!w.AppConfig.READ_OPT_FLAGS) w.AppConfig.READ_OPT_FLAGS = {};
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
        if (originals.hadAppConfig) {
          w.AppConfig.READ_OPT_FLAGS = originals.flags;
        } else {
          delete w.AppConfig;
        }
      }
    });

    expect(html).toContain("dashboard-team-activity-card");
    expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Page errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });


  test("renders admin debug card for simulation cleanup audits", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(globalThis.AppUI?.renderAdmin));

    const html = await page.evaluate(async () => {
      const w = globalThis;
      const originalHasPerm = w.app_hasPerm;
      const originalGetCached = w.AppDB.getCached;
      const originalQueryMany = w.AppDB.queryMany;
      const originalGetAll = w.AppDB.getAll;
      const originalGetSystemPerformance = w.AppAnalytics.getSystemPerformance;
      const originalGetPendingLeaves = w.AppLeaves.getPendingLeaves;

      w.app_hasPerm = () => true;
      w.AppDB.getCached = null;
      w.AppDB.getAll = async (collection) => {
        if (collection === "users") return [{ id: "a1", name: "Admin", role: "Administrator", username: "admin", avatar: "./favicon.png", status: "in" }];
        if (collection === "location_audits") return [];
        if (collection === "system_audit_logs") return [];
        return [];
      };
      w.AppDB.queryMany = async (collection) => {
        if (collection === "location_audits") return [];
        if (collection === "system_audit_logs") {
          return [{
            module: "simulation",
            type: "legacy_dummy_cleanup_completed",
            createdAt: Date.now(),
            payload: { deleted: { users: 2, attendance: 4, leaves: 1, workPlans: 3 } }
          }];
        }
        return [];
      };
      w.AppAnalytics.getSystemPerformance = async () => ({ avgScore: 80, trendData: [60, 65, 70, 75, 80, 85, 90], labels: [] });
      w.AppLeaves.getPendingLeaves = async () => [];

      try {
        return await w.AppUI.renderAdmin();
      } finally {
        w.app_hasPerm = originalHasPerm;
        w.AppDB.getCached = originalGetCached;
        w.AppDB.queryMany = originalQueryMany;
        w.AppDB.getAll = originalGetAll;
        w.AppAnalytics.getSystemPerformance = originalGetSystemPerformance;
        w.AppLeaves.getPendingLeaves = originalGetPendingLeaves;
      }
    });

    expect(html).toContain("Simulation Cleanup Audit (Debug)");
    expect(html).toContain("legacy_dummy_cleanup_completed");
    expect(html).toContain("users=2");
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

      const origGetPlans = w.AppCalendar.getPlans;
      w.AppCalendar.getPlans = async () => fakePlans;

      // staff view
      w.AppAuth.getUser = () => ({ id:'u1', name:'Me', role:'Staff' });
      await w.app_showAnnualDayDetails('2026-03-05');
      const staffText = document.querySelector('#annual-day-detail-modal')?.innerText || '';

      // admin view
      w.AppAuth.getUser = () => ({ id:'u4', name:'Admin', role:'Administrator', isAdmin:true });
      await w.app_showAnnualDayDetails('2026-03-05');
      const adminText = document.querySelector('#annual-day-detail-modal')?.innerText || '';

      w.AppCalendar.getPlans = origGetPlans;
      return { staffText, adminText };
    });

    expect(result.staffText).toContain('mine');
    expect(result.staffText).toContain('tagged');
    expect(result.staffText).toContain('annual');
    expect(result.staffText).not.toContain('theirs');
    expect(result.adminText).toContain('theirs');
  });

  test("renders birthday calendar for birthday managers", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(globalThis.AppUI?.renderBirthdayCalendar));

    const html = await page.evaluate(async () => {
      const w = globalThis;
      const originals = {
        getUser: w.AppAuth.getUser,
        getAll: w.AppDB.getAll,
        getIstNow: w.AppDB.getIstNow
      };

      w.AppAuth.getUser = () => ({
        id: "mgr1",
        name: "Birthday Manager",
        role: "Employee",
        permissions: { birthday: "admin" }
      });
      w.AppDB.getAll = async (collection) => {
        if (collection === "users") {
          return [
            { id: "mgr1", name: "Birthday Manager", role: "Employee", dept: "HR", permissions: { birthday: "admin" }, birthMonth: 4, birthDay: 5 },
            { id: "u2", name: "Maria", role: "Coordinator", dept: "Admin", birthMonth: 3, birthDay: 24, birthYear: 1990 },
            { id: "u3", name: "Anita", role: "Staff", dept: "Operations", birthYear: 1988 }
          ];
        }
        if (collection === "birthday_people") {
          return [
            { id: "bp1", name: "Sr Mary", position: "Trustee", location: "Kolkata", birthMonth: 3, birthDay: 28 }
          ];
        }
        return [];
      };
      w.AppDB.getIstNow = () => new Date("2026-03-23T09:00:00+05:30");

      try {
        return await w.AppUI.renderBirthdayCalendar();
      } finally {
        w.AppAuth.getUser = originals.getUser;
        w.AppDB.getAll = originals.getAll;
        w.AppDB.getIstNow = originals.getIstNow;
      }
    });

    expect(html).toContain("Birthday Calendar");
    expect(html).toContain("Monthly View");
    expect(html).toContain("Yearly View");
    expect(html).toContain("March 2026");
    expect(html).toContain("March Calendar");
    expect(html).toContain("Add Person Not In System");
    expect(html).toContain("Maria");
    expect(html).toContain("Sr Mary");
    expect(html).toContain("Trustee");
    expect(html).toContain("Incomplete Birthday Records");
    expect(html).toContain("Anita");
  });

  test("birthday manager can add a person not in system from birthday calendar", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(globalThis.app_submitExternalBirthdayPerson));

    const result = await page.evaluate(async () => {
      const w = globalThis;
      const savedPeople = [];
      const originals = {
        getUser: w.AppAuth.getUser,
        put: w.AppDB.put,
        renderBirthdayCalendar: w.AppUI.renderBirthdayCalendar,
        showSyncToast: w.app_showSyncToast
      };

      w.AppAuth.getUser = () => ({
        id: "mgr1",
        name: "Birthday Manager",
        role: "Employee",
        permissions: { birthday: "admin" }
      });
      w.AppDB.put = async (collection, payload) => {
        if (collection === "birthday_people") {
          savedPeople.push(payload);
        }
      };
      w.AppUI.renderBirthdayCalendar = async () => "<div>Birthday calendar refreshed</div>";
      w.app_showSyncToast = () => {};
      if (!document.querySelector("#page-content")) {
        document.body.insertAdjacentHTML("beforeend", '<div id="page-content"></div>');
      }
      w.app_openExternalBirthdayPersonModal(4);
      const form = document.querySelector("#birthday-external-form");
      form.querySelector('[name="name"]').value = "Mother Teresa";
      form.querySelector('[name="position"]').value = "President";
      form.querySelector('[name="location"]').value = "Kolkata";
      form.querySelector('[name="birthDay"]').value = "12";
      form.querySelector('[name="birthMonth"]').value = "4";
      form.querySelector('[name="birthYear"]').value = "1910";

      try {
        await w.app_submitExternalBirthdayPerson({ preventDefault() {}, target: form });
        return {
          savedPeople,
          modalPresent: Boolean(document.querySelector("#birthday-external-modal"))
        };
      } finally {
        w.AppAuth.getUser = originals.getUser;
        w.AppDB.put = originals.put;
        w.AppUI.renderBirthdayCalendar = originals.renderBirthdayCalendar;
        w.app_showSyncToast = originals.showSyncToast;
      }
    });

    expect(result.savedPeople).toHaveLength(1);
    expect(result.savedPeople[0].name).toBe("Mother Teresa");
    expect(result.savedPeople[0].position).toBe("President");
    expect(result.savedPeople[0].location).toBe("Kolkata");
    expect(result.savedPeople[0].birthDay).toBe(12);
    expect(result.savedPeople[0].birthMonth).toBe(4);
    expect(result.modalPresent).toBe(false);
  });

  test("profile shows saved birthday details", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(globalThis.AppUI?.renderProfile));

    const html = await page.evaluate(async () => {
      const w = globalThis;
      const originals = {
        getUser: w.AppAuth.getUser,
        monthly: w.AppAnalytics.getUserMonthlyStats,
        yearly: w.AppAnalytics.getUserYearlyStats,
        leaves: w.AppLeaves.getUserLeaves
      };

      w.AppAuth.getUser = () => ({
        id: "u9",
        name: "Rachel",
        role: "Coordinator",
        dept: "Administration",
        email: "rachel@example.com",
        birthDay: 24,
        birthMonth: 3,
        birthYear: 1991
      });
      w.AppAnalytics.getUserMonthlyStats = async () => ({ attendanceRate: 0, punctualityRate: 0, totalHours: 0 });
      w.AppAnalytics.getUserYearlyStats = async () => ({ totalDays: 0, breakdown: {} });
      w.AppLeaves.getUserLeaves = async () => [];

      try {
        return await w.AppUI.renderProfile();
      } finally {
        w.AppAuth.getUser = originals.getUser;
        w.AppAnalytics.getUserMonthlyStats = originals.monthly;
        w.AppAnalytics.getUserYearlyStats = originals.yearly;
        w.AppLeaves.getUserLeaves = originals.leaves;
      }
    });

    expect(html).toContain("Birthday");
    expect(html).toContain("24 March 1991");
  });

  test("birthday reminder popup is personalized and dedupes notifications", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(globalThis.app_syncBirthdayReminders));

    const result = await page.evaluate(async () => {
      const w = globalThis;
      const userDocs = new Map([
        ["mgr1", {
          id: "mgr1",
          name: "Birthday Manager",
          role: "Employee",
          dept: "HR",
          permissions: { birthday: "admin" },
          notifications: []
        }],
        ["u2", {
          id: "u2",
          name: "Sister Agnes",
          role: "Coordinator",
          dept: "Administration",
          birthDay: 24,
          birthMonth: 3,
          birthYear: 1992
        }]
      ]);
      const birthdayPeople = new Map([
        ["bp1", {
          id: "bp1",
          name: "Fr Thomas",
          position: "Trustee",
          location: "Bengaluru",
          birthDay: 24,
          birthMonth: 3
        }]
      ]);

      const originals = {
        getUser: w.AppAuth.getUser,
        updateUser: w.AppAuth.updateUser,
        getAll: w.AppDB.getAll,
        get: w.AppDB.get,
        put: w.AppDB.put,
        getIstNow: w.AppDB.getIstNow,
        getDayType: w.AppAnalytics.getDayType
      };

      w.AppAuth.getUser = () => userDocs.get("mgr1");
      w.AppAuth.updateUser = async (userData) => {
        const existing = userDocs.get(userData.id);
        userDocs.set(userData.id, { ...existing, ...userData });
        return true;
      };
      w.AppDB.getAll = async (collection) => {
        if (collection === "users") return Array.from(userDocs.values());
        if (collection === "birthday_people") return Array.from(birthdayPeople.values());
        return [];
      };
      w.AppDB.get = async (collection, id) => {
        if (collection === "users") return userDocs.get(id);
        if (collection === "birthday_people") return birthdayPeople.get(id);
        return null;
      };
      w.AppDB.put = async (collection, payload) => {
        if (collection === "users") {
          const existing = userDocs.get(payload.id) || {};
          userDocs.set(payload.id, { ...existing, ...payload });
        }
        if (collection === "birthday_people") {
          const existing = birthdayPeople.get(payload.id) || {};
          birthdayPeople.set(payload.id, { ...existing, ...payload });
        }
      };
      w.AppDB.getIstNow = () => new Date("2026-03-23T09:00:00+05:30");
      w.AppAnalytics.getDayType = () => "Working Day";

      try {
        await w.app_syncBirthdayReminders();
        await w.app_syncBirthdayReminders();
        await w.app_maybeOpenBirthdayPopup();
        return {
          popupText: document.querySelector("#birthday-reminder-modal")?.innerText || "",
          notifCount: (userDocs.get("mgr1")?.notifications || []).filter((n) => n.type === "birthday-reminder").length
        };
      } finally {
        w.AppAuth.getUser = originals.getUser;
        w.AppAuth.updateUser = originals.updateUser;
        w.AppDB.getAll = originals.getAll;
        w.AppDB.get = originals.get;
        w.AppDB.put = originals.put;
        w.AppDB.getIstNow = originals.getIstNow;
        w.AppAnalytics.getDayType = originals.getDayType;
      }
    });

    expect(result.popupText).toContain("UPCOMING BIRTHDAY");
    expect(result.popupText).toContain("Sister Agnes");
    expect(result.popupText).toContain("Fr Thomas");
    expect(result.popupText).toContain("Birthday is tomorrow");
    expect(result.popupText).toContain("Administration");
    expect(result.popupText).toContain("Trustee");
    expect(result.notifCount).toBe(2);
  });
});





