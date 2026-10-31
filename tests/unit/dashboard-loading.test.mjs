import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calendar } from '../../js/modules/calendar.js';
import { AnalyticsService } from '../../js/services/analytics-service.js';

describe('dashboard data loading', () => {
    it('loads only the dashboard calendar window instead of whole collections', async () => {
        const originalWindow = globalThis.window;
        const calls = [];
        globalThis.window = { app_calYear: 2026, app_calMonth: 9 };
        try {
            const calendar = new Calendar();
            calendar.db = {
                async queryManyStrict(collection, filters) {
                    calls.push({ collection, filters });
                    if (collection === 'leaves') return [
                        { id: 'overlap', status: 'Approved', startDate: '2026-09-30', endDate: '2026-10-02' },
                        { id: 'outside', status: 'Approved', startDate: '2026-07-01', endDate: '2026-07-02' }
                    ];
                    return [];
                },
                async getAll(collection) {
                    if (collection === 'users') return [];
                    assert.fail(`dashboard calendar must not scan ${collection}`);
                }
            };

            const result = await calendar.getDashboardPlans();
            assert.deepEqual(result.leaves.map(row => row.id), ['overlap']);
            assert.deepEqual(calls.map(call => call.collection).sort(), ['events', 'leaves', 'work_plans']);
            const workPlanFilters = calls.find(call => call.collection === 'work_plans').filters;
            assert.ok(workPlanFilters.some(filter => filter.field === 'date' && filter.operator === '>='));
            assert.ok(workPlanFilters.some(filter => filter.field === 'date' && filter.operator === '<='));
        } finally {
            if (originalWindow === undefined) delete globalThis.window;
            else globalThis.window = originalWindow;
        }
    });

    it('scopes initial dashboard work-plan reads to the selected staff member', async () => {
        const originalWindow = globalThis.window;
        const calls = [];
        globalThis.window = {
            AppConfig: { READ_CACHE_TTLS: {} },
            AppDB: {
                getCacheKey: (...args) => JSON.stringify(args),
                async getCached(_key, _ttl, load) { return load(); },
                async queryManyStrict(collection, filters) { calls.push({ collection, filters }); return []; }
            }
        };
        try {
            await new AnalyticsService().getUserWorkPlansByDateRange('staff-1', '2026-10-31', '2026-10-31');
            assert.equal(calls.length, 1);
            assert.deepEqual(calls[0], {
                collection: 'work_plans',
                filters: [
                    { field: 'userId', operator: '==', value: 'staff-1' },
                    { field: 'date', operator: '>=', value: '2026-10-31' },
                    { field: 'date', operator: '<=', value: '2026-10-31' }
                ]
            });
        } finally {
            if (originalWindow === undefined) delete globalThis.window;
            else globalThis.window = originalWindow;
        }
    });
});
