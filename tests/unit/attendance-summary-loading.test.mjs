import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Analytics } from '../../js/modules/analytics.js';

test('personal month/year totals use owner queries and retain legacy owners, duplicate handling and full-year results', async () => {
    const current = new Date(), analytics = new Analytics(), reference = new Analytics();
    const day = analytics.toLocalDateKey(new Date(current.getFullYear(), current.getMonth(), 5));
    const fy = analytics.getFinancialYearDates();
    const log = { id: 'one', user_id: 'self', date: day, type: 'Present', checkIn: '09:00', checkOut: '17:00', durationMs: 8 * 3600000 };
    const rows = [log, { ...log, id: 'two', user_id: undefined, userId: 'self' },
        { ...log, id: 'both', userId: 'self' }, { ...log, id: 'other', user_id: 'other' },
        { ...log, id: 'fy-end', date: analytics.toLocalDateKey(fy.end) }];
    const calls = [];
    analytics.db = { queryMany: async (_collection, filters) => {
        calls.push(filters);
        return rows.filter(row => row[filters[0].field] === filters[0].value);
    } };
    reference.getAttendanceInRange = async (start, end) => rows.filter(row => row.date >= reference.toLocalDateKey(start) && row.date <= reference.toLocalDateKey(end));
    const actual = await Promise.all([analytics.getUserMonthlyStats('self'), analytics.getUserYearlyStats('self')]);
    const expected = await Promise.all([reference.getUserMonthlyStats('self'), reference.getUserYearlyStats('self')]);
    assert.deepEqual(actual, expected);
    assert.equal(calls.length, 4, 'Two legacy owner spellings for each period, rather than twelve month chunks');
    assert.ok(calls.every(filters => filters.length === 1 && filters[0].operator === '==' && filters[0].value === 'self'));
    await analytics.getUserYearlyStats('self');
    assert.equal(calls.length, 4, 'Returning within the cache window reuses the range');
});

test('a failed owner query does not become a misleading zero summary', async () => {
    const analytics = new Analytics();
    analytics.db = { queryMany: async () => { throw new Error('temporary outage'); } };
    await assert.rejects(analytics.getUserYearlyStats('self'), /temporary outage/);
});
