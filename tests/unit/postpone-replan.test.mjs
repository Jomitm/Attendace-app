// tests/unit/postpone-replan.test.mjs
// Exercises AppCalendar.replanPostponedForDate: arrived postpone copies are
// reactivated in place, stranded sources (no successor copy) move onto the
// target date, chain continuation and fuzzy successor fallback prevent
// duplicates under sourceTaskIndex drift, and repeat runs are no-ops.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Browser-ish globals before import (calendar.js assigns window.AppCalendar).
globalThis.window = globalThis.window || {};

const { Calendar } = await import('../../js/modules/calendar.js');

const USER = 'u1';
const TARGET = '2026-10-01';
const planId = (date, userId = USER) => `plan_${userId}_${date}`;
const clone = (v) => JSON.parse(JSON.stringify(v));

const makePlan = (date, tasks, userId = USER, userName = 'User One') => ({
    id: planId(date, userId),
    userId,
    userName,
    date,
    planScope: 'personal',
    plans: clone(tasks)
});

// Minimal in-memory stand-in for AppDB queryMany/put/delete.
function createFakeDb(docs = []) {
    const store = new Map(docs.map((d) => [String(d.id), clone(d)]));
    const ops = { puts: [], deletes: [] };
    return {
        ops,
        store,
        async queryMany(collection, filters = []) {
            if (collection !== 'work_plans') return [];
            const out = [];
            for (const doc of store.values()) {
                let ok = true;
                for (const f of filters) {
                    const v = doc[f.field];
                    if (f.operator === '>=' && !(v >= f.value)) { ok = false; break; }
                    if (f.operator === '<=' && !(v <= f.value)) { ok = false; break; }
                    if (f.operator === '==' && v !== f.value) { ok = false; break; }
                }
                if (ok) out.push(clone(doc));
            }
            return out;
        },
        async put(collection, doc) {
            ops.puts.push(String(doc.id));
            store.set(String(doc.id), clone(doc));
        },
        async delete(collection, id) {
            ops.deletes.push(String(id));
            store.delete(String(id));
        }
    };
}

function setup(docs) {
    const calendar = new Calendar();
    const db = createFakeDb(docs);
    calendar.db = db;
    return { calendar, db };
}

const storedTask = (db, date, index = 0) => db.store.get(planId(date))?.plans?.[index] || null;

describe('replanPostponedForDate - arrived copy reactivation', () => {
    it('reactivates a copy due today as in-process when work started, source tombstone untouched', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-30', [{ task: 'Draft report', status: 'postponed', postponedToDate: TARGET }]),
            makePlan(TARGET, [{
                task: 'Draft report (Postponed from 2026-09-30)',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-30',
                postponedToDate: TARGET,
                sourcePlanId: planId('2026-09-30'),
                sourceTaskIndex: 0,
                postponeWorkStatus: 'in_progress'
            }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 1);
        assert.equal(res.moved, 0);
        assert.equal(storedTask(db, TARGET).status, 'in-process');
        assert.equal(storedTask(db, '2026-09-30').status, 'postponed', 'source with successor stays postponed');
        assert.deepEqual(db.ops.puts, [planId(TARGET)]);
    });

    it('reactivates a copy due today as to-be-started when work never started', async () => {
        const { calendar, db } = setup([
            makePlan(TARGET, [{
                task: 'Copy',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-30',
                sourcePlanId: planId('2026-09-30'),
                sourceTaskIndex: 0,
                postponeWorkStatus: 'not_started'
            }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 1);
        assert.equal(storedTask(db, TARGET).status, 'to-be-started');
    });

    it('reactivates a past-dated copy as to-be-started even when work had started', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-25', [{
                task: 'Copy',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-24',
                sourcePlanId: planId('2026-09-24'),
                sourceTaskIndex: 0,
                postponeWorkStatus: 'work_started'
            }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 1);
        assert.equal(res.moved, 0);
        assert.equal(storedTask(db, '2026-09-25').status, 'to-be-started');
    });

    it('leaves tasks whose postponedToDate is still in the future untouched', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-30', [{ task: 'Future', status: 'postponed', postponedToDate: '2026-11-01' }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 0);
        assert.equal(res.moved, 0);
        assert.equal(db.ops.puts.length, 0);
        assert.equal(db.ops.deletes.length, 0);
        assert.equal(storedTask(db, '2026-09-30').status, 'postponed');
    });

    it('keeps the chain alive: only the last copy reactivates', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-20', [{ task: 'B', status: 'postponed', postponedToDate: '2026-09-25' }]),
            makePlan('2026-09-25', [{
                task: 'B copy1',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-20',
                postponedToDate: '2026-09-28',
                sourcePlanId: planId('2026-09-20'),
                sourceTaskIndex: 0,
                postponeWorkStatus: 'work_started'
            }]),
            makePlan('2026-09-28', [{
                task: 'B copy2',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-25',
                sourcePlanId: planId('2026-09-25'),
                sourceTaskIndex: 0,
                postponeWorkStatus: 'in_progress'
            }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 1);
        assert.equal(res.moved, 0);
        assert.equal(storedTask(db, '2026-09-20').status, 'postponed', 'gen0 source has successor');
        assert.equal(storedTask(db, '2026-09-25').status, 'postponed', 'intermediate copy has successor');
        assert.equal(storedTask(db, '2026-09-28').status, 'to-be-started', 'last copy reactivates');
    });

    it('does not re-mark an active to-be-started task with postponed provenance as postponed', async () => {
        // Regression guard: reactivated copies keep postponedFromDate, and
        // normalize-adjacent status math must not fold them back to closed.
        const { calendar, db } = setup([
            makePlan(TARGET, [{
                task: 'Reactivated',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-30',
                sourcePlanId: planId('2026-09-30'),
                sourceTaskIndex: 0
            }])
        ]);

        await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });
        const task = storedTask(db, TARGET);
        assert.notEqual(task.status, 'postponed');
        assert.ok(task.postponedFromDate, 'lineage fields survive reactivation');
    });
});

describe('replanPostponedForDate - stranded source moves', () => {
    it('moves a stranded source onto the target date and deletes the emptied plan', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-24', [{
                task: 'C',
                status: 'postponed',
                postponedToDate: '2026-09-26',
                postponeWorkStatus: 'work_started',
                startDate: '2026-09-24',
                endDate: '2026-09-24'
            }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 0);
        assert.equal(res.moved, 1);
        assert.ok(db.ops.deletes.includes(planId('2026-09-24')), 'emptied source plan deleted');
        assert.equal(db.store.has(planId('2026-09-24')), false);

        const target = db.store.get(planId(TARGET));
        assert.ok(target, 'target plan created');
        assert.equal(target.plans.length, 1);
        const moved = target.plans[0];
        assert.equal(moved.status, 'in-process');
        assert.equal(moved.date, TARGET);
        assert.equal(moved.postponedFromDate, '2026-09-24');
        assert.equal(moved.postponedToDate, TARGET);
        assert.equal(moved.startDate, TARGET, 'start date bumped with the move');
        assert.equal(moved.endDate, TARGET, 'end date bumped with the move');
        assert.equal(moved.task, 'C');
    });

    it('maps missing work status to to-be-started and keeps sibling tasks', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-29', [
                { task: 'D stranded', status: 'postponed' },
                { task: 'Keep me', status: 'in-process' }
            ])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.moved, 1);
        const source = db.store.get(planId('2026-09-29'));
        assert.equal(source.plans.length, 1, 'sibling task keeps the plan alive');
        assert.equal(source.plans[0].task, 'Keep me');

        const moved = db.store.get(planId(TARGET)).plans[0];
        assert.equal(moved.status, 'to-be-started');
        assert.equal(moved.postponedFromDate, '2026-09-29');
        assert.equal(moved.postponedToDate, TARGET);
        assert.equal(moved.date, TARGET);
        assert.equal('startDate' in moved, false, 'no startDate to bump');
    });

    it('is idempotent: a second run makes no changes', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-24', [{ task: 'C', status: 'postponed', postponeWorkStatus: 'work_started' }]),
            makePlan(TARGET, [{
                task: 'A copy',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-30',
                sourcePlanId: planId('2026-09-30'),
                sourceTaskIndex: 0,
                postponeWorkStatus: 'in_progress'
            }])
        ]);

        const first = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });
        assert.equal(first.reactivated + first.moved, 2);

        const putsAfterFirst = db.ops.puts.length;
        const deletesAfterFirst = db.ops.deletes.length;
        const second = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(second.reactivated, 0);
        assert.equal(second.moved, 0);
        assert.equal(db.ops.puts.length, putsAfterFirst, 'no extra writes on rerun');
        assert.equal(db.ops.deletes.length, deletesAfterFirst, 'no extra deletes on rerun');
    });

    it('ignores plans outside the look-back window', async () => {
        // sinceDate default is TARGET - 180 days = 2026-04-05, so 2026-03-01
        // is never read even though its task is stranded.
        const { calendar, db } = setup([
            makePlan('2026-03-01', [{ task: 'Ancient', status: 'postponed' }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 0);
        assert.equal(res.moved, 0);
        assert.equal(db.ops.puts.length, 0);
        assert.equal(storedTask(db, '2026-03-01').status, 'postponed');
    });
});

describe('replanPostponedForDate - successor matching', () => {
    it('uses the plan+date fallback when sourceTaskIndex drifted after an editor save', async () => {
        // Copy declares sourceTaskIndex 5 (drift); actual source sits at index 0.
        const { calendar, db } = setup([
            makePlan('2026-09-20', [{ task: 'E', status: 'postponed', postponedToDate: '2026-09-22' }]),
            makePlan('2026-09-22', [{
                task: 'E copy',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-20',
                postponedToDate: '2026-09-22',
                sourcePlanId: planId('2026-09-20'),
                sourceTaskIndex: 5
            }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 1, 'copy reactivates');
        assert.equal(res.moved, 0, 'source NOT moved despite index drift');
        assert.equal(storedTask(db, '2026-09-20').status, 'postponed', 'source has a successor');
    });

    it('applies the fuzzy fallback only to genuine postpones (postponedToDate present)', async () => {
        // F1 = genuine postpone (has postponedToDate + a copy);
        // F2 = kanban-stranded sibling in the same plan (no postponedToDate)
        // must still move even though the plan carries a genuine postpone.
        const { calendar, db } = setup([
            makePlan('2026-09-20', [
                { task: 'F1', status: 'postponed', postponedToDate: '2026-09-22' },
                { task: 'F2 stranded', status: 'postponed' }
            ]),
            makePlan('2026-09-22', [{
                task: 'F1 copy',
                status: 'postponed',
                addedFrom: 'postponed',
                postponedFromDate: '2026-09-20',
                sourcePlanId: planId('2026-09-20'),
                sourceTaskIndex: 0
            }])
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 1, 'F1 copy reactivates');
        assert.equal(res.moved, 1, 'F2 stranded sibling moves');
        const source = db.store.get(planId('2026-09-20'));
        assert.equal(source.plans.length, 1);
        assert.equal(source.plans[0].task, 'F1', 'genuine source stays');
        const moved = db.store.get(planId(TARGET)).plans.find((t) => t.task === 'F2 stranded');
        assert.ok(moved, 'stranded task landed on target');
        assert.equal(moved.status, 'to-be-started');
    });

    it('respects the userIds filter', async () => {
        const { calendar, db } = setup([
            makePlan('2026-09-24', [{ task: 'U2 work', status: 'postponed' }], 'u2', 'User Two')
        ]);

        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });

        assert.equal(res.reactivated, 0);
        assert.equal(res.moved, 0);
        assert.equal(db.ops.puts.length, 0);
        assert.equal(db.store.get(planId('2026-09-24', 'u2')).plans[0].status, 'postponed', 'other user untouched');
    });

    it('returns an empty result when no plans exist', async () => {
        const { calendar } = setup([]);
        const res = await calendar.replanPostponedForDate(TARGET, { userIds: [USER] });
        assert.deepEqual(res, { reactivated: 0, moved: 0, updatedPlans: [] });
    });

    it('returns an empty result for an invalid target date', async () => {
        const { calendar } = setup([makePlan('2026-09-30', [{ task: 'X', status: 'postponed' }])]);
        const res = await calendar.replanPostponedForDate('', { userIds: [USER] });
        assert.deepEqual(res, { reactivated: 0, moved: 0, updatedPlans: [] });
    });
});
