// One trusted calculation per process. Reuse the real browser implementations
// rather than maintaining a second scoring, policy, holiday or lineage formula.
process.once('message', async input => {
    try {
        global.window = {};
        const [{ AppAnalytics }, { AppDB }, { AppLeaves }, { AppPolicies }, { AppCalendar }, { AppAttendance }, { buildHeroCandidates }, { isFormerStaff, filterFormerStaffRecords, formerStaffIds }] = await Promise.all([
            import('../js/modules/analytics.js'), import('../js/modules/db.js'), import('../js/modules/leaves.js'),
            import('../js/modules/policies.js'), import('../js/modules/calendar.js'), import('../js/modules/attendance.js'),
            import('./_hero-select-core.js'), import('../js/utils/staff-employment.js')
        ]);
        const { period } = input;
        const users = input.users.filter(user => !isFormerStaff(user));
        const former = formerStaffIds(input.users);
        const activeIds = new Set(users.map(user => user.id));
        const visible = (collection, records) => filterFormerStaffRecords(collection, records, former).filter(row => {
            const owner = row.user_id || row.userId || row.createdById || row.createdBy;
            return owner === 'annual_shared' || activeIds.has(owner);
        });
        const publicPlans = visible('work_plans', input.workPlans).map(plan => ({ ...plan,
            // Preserve the normal public-storage representation, including for
            // legacy inline private bodies. Never send private content to AI.
            plans: (plan.plans || []).map(task => task?.isPrivate === true
                ? { id: task.id, privateTaskId: task.privateTaskId, isPrivate: true, assignedTo: task.assignedTo }
                : task)
        }));
        const data = { users, attendance: visible('attendance', input.attendance),
            work_plans: publicPlans, events: filterFormerStaffRecords('events', input.events, former),
            settings: [{ id: 'policies', ...input.settings }, { id: 'holidays', ...input.holidays }] };
        AppDB.getAll = async collection => data[collection] || [];
        AppDB.get = async (collection, id) => (data[collection] || []).find(row => row.id === id) || null;
        AppDB.queryMany = async (collection, filters) => (data[collection] || []).filter(row => filters.every(filter => {
            if (filter.operator === '>=') return row[filter.field] >= filter.value;
            if (filter.operator === '<=') return row[filter.field] <= filter.value;
            return row[filter.field] === filter.value;
        }));
        window.AppDB = AppDB;
        window.AppCalendar = AppCalendar;
        window.AppAttendance = AppAttendance;
        window.AppPolicies = AppPolicies;
        window.AppHeroPolicy = AppLeaves.mergeHeroPolicy(input.settings.heroPolicy || {});
        AppPolicies.holidayCache = { byYear: input.holidays.byYear || {} };
        // Make time-of-day irrelevant to the window and never call AI recursively.
        AppDB.getIstNow = () => new Date(`${period.today}T12:00:00`);
        AppAnalytics.getUsersCached = async () => users;
        AppAnalytics.selectHeroWithAi = async () => null;
        await AppAnalytics.preloadHolidayCache();
        const ranking = await AppAnalytics.buildHeroRanking({ baseDate: new Date(`${period.today}T12:00:00`) });
        process.send({ candidates: buildHeroCandidates(ranking.rows), periodKey: `${ranking.dataset.startIso}_${ranking.dataset.endIso}` });
    } catch (error) {
        process.send({ error: String(error?.message || 'Hero calculation failed') });
    }
});
