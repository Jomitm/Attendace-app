import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calendar } from '../../js/modules/calendar.js';
import {
    getTaskSpan,
    taskCoversDate,
    spanDayLabel,
    collectSpanningTasks,
    computeDayLoad,
    suggestEndDate,
    taskEffortHours
} from '../../js/utils/span-planning.js';

// Integration: Calendar storage -> span projection -> capacity guard.
// Pins the contract across the seam unit tests cover only one side of:
// addWorkPlanTask writes startDate/endDate; collectSpanningTasks /
// computeDayLoad read them back. Uses the real Calendar with an
// in-memory db (same fake as postpone-wiring).

function makeFakeDb(seedUsers = {}) {
    const store = new Map();
    return {
        store,
        async get(collection, id) {
            const key = `${collection}/${id}`;
            if (store.has(key)) return JSON.parse(JSON.stringify(store.get(key)));
            if (collection === 'users') return seedUsers[id] || null;
            return null;
        },
        async put(collection, doc) {
            const key = `${collection}/${doc.id}`;
            store.set(key, JSON.parse(JSON.stringify(doc)));
            return doc;
        },
        async getAll(collection) {
            const out = [];
            for (const [key, doc] of store) {
                if (key.startsWith(`${collection}/`)) out.push(JSON.parse(JSON.stringify(doc)));
            }
            return out;
        }
    };
}

function makeCalendar(userMap) {
    const cal = new Calendar();
    cal.db = makeFakeDb(userMap);
    return cal;
}

async function storeSpanTask(cal, meta = {}) {
    await cal.addWorkPlanTask('2026-02-02', 'u1', 'Big report', [], {
        status: 'in-process',
        startDate: '2026-02-02',
        endDate: '2026-02-04',
        sizeCategory: 'large-task',
        assignedTo: 'u1',
        ...meta
    });
    return cal.db.get('work_plans', 'plan_u1_2026-02-02');
}

describe('span wiring - storage projects onto covered dates', () => {
    it('a stored span task renders Day X of N on covered dates only', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' } });
        const home = await storeSpanTask(cal);
        const [stored] = home.plans;

        assert.deepEqual(getTaskSpan(stored, home.date), { startDate: '2026-02-02', endDate: '2026-02-04' });
        assert.equal(taskCoversDate(stored, home.date, '2026-02-03'), true);
        assert.equal(taskCoversDate(stored, home.date, '2026-02-05'), false);
        assert.deepEqual(spanDayLabel(stored, home.date, '2026-02-03'), { dayIndex: 2, dayCount: 3, label: 'Day 2 of 3' });

        const middle = collectSpanningTasks([home], '2026-02-03', 'u1');
        assert.equal(middle.length, 1);
        assert.equal(middle[0]._spannedVirtual, true);
        assert.equal(middle[0]._spanLabel, 'Day 2 of 3');
        assert.equal(middle[0]._homeDate, '2026-02-02');

        assert.deepEqual(collectSpanningTasks([home], '2026-02-02', 'u1'), [], 'home date renders normally, no projection');
        assert.deepEqual(collectSpanningTasks([home], '2026-02-05', 'u1'), [], 'past the end, nothing projects');
    });

    it('suggestEndDate round-trips through storage into full coverage', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' } });
        const end = suggestEndDate('2026-02-02', 'large-task');
        assert.ok(end >= '2026-02-02', 'suggestion never goes backwards');

        const home = await storeSpanTask(cal, { endDate: end });
        const [stored] = home.plans;
        let cursor = '2026-02-02';
        let guard = 40;
        while (cursor <= end && guard-- > 0) {
            assert.equal(taskCoversDate(stored, home.date, cursor), true, `${cursor} covered`);
            const [y, m, d] = cursor.split('-').map(Number);
            const next = new Date(y, m - 1, d + 1);
            cursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
        }
    });

    it('computeDayLoad sees the span task effort on a covered day', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' } });
        const home = await storeSpanTask(cal);
        const [stored] = home.plans;

        const empty = computeDayLoad([], '2026-02-03');
        assert.equal(empty.hours, 0);
        assert.equal(empty.over, false);

        const loaded = computeDayLoad([{ ...stored, planDate: home.date }], '2026-02-03');
        assert.ok(loaded.hours > 0, 'span effort lands on the covered day');
        assert.ok(loaded.hours <= taskEffortHours(stored), 'effort spreads, never exceeds the total');

        const tiny = computeDayLoad([{ ...stored, planDate: home.date }], '2026-02-03', { dailyCapacity: 0.01 });
        assert.equal(tiny.over, true, 'capacity guard trips when the day cannot hold the effort');
    });

    it('completed and removed span tasks never project', async () => {
        const cal = makeCalendar({ u1: { id: 'u1', name: 'Test User' } });
        const home = await storeSpanTask(cal, { status: 'completed' });
        assert.deepEqual(collectSpanningTasks([home], '2026-02-03', 'u1'), [], 'completed stays home');

        const home2 = await storeSpanTask(cal);
        // Same plan doc now holds the completed task from above plus a live
        // one: hiding every task must hide the projection entirely.
        home2.plans.forEach((t) => { t.isRemoved = true; });
        assert.deepEqual(collectSpanningTasks([home2], '2026-02-03', 'u1'), [], 'removed never projects');
    });
});
