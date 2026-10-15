//! /tests/unit/postpone-cleanup.test.mjs
// Cleanup finder for old postponed shells (js/modules/calendar.js
// findPostponedShells): only a postponed, visible task WITH a reachable live
// successor copy may be hidden. Everything else must be left alone —
// stranded sources belong to replanPostponedForDate, finished tasks are
// history, and already-removed shells need no action.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Browser-ish globals before import (calendar.js assigns window.AppCalendar).
globalThis.window = globalThis.window || {};

const { findPostponedShells } = await import('../../js/modules/calendar.js');

const planId = (date, userId = 'u1') => `plan_${userId}_${date}`;
const clone = (v) => JSON.parse(JSON.stringify(v));

const makePlan = (date, tasks, userId = 'u1') => ({
    id: planId(date, userId),
    userId,
    userName: 'User One',
    date,
    planScope: 'personal',
    plans: clone(tasks)
});

const copyOf = (fromDate, fromPlanDate, fromIndex, extra = {}) => ({
    task: `Job (Postponed from ${fromDate})`,
    status: 'postponed',
    addedFrom: 'postponed',
    postponedFromDate: fromDate,
    sourcePlanId: planId(fromPlanDate),
    sourceTaskIndex: fromIndex,
    ...extra
});

describe('findPostponedShells', () => {
    it('lists a postponed source that has a live successor copy', () => {
        const out = findPostponedShells([
            makePlan('2026-09-20', [{ task: 'Job', status: 'postponed', postponedToDate: '2026-09-25' }]),
            makePlan('2026-09-25', [copyOf('2026-09-20', '2026-09-20', 0)])
        ]);
        assert.equal(out.length, 1);
        assert.equal(out[0].planId, planId('2026-09-20'));
        assert.equal(out[0].taskIndex, 0);
        assert.equal(out[0].via, 'exact');
    });

    it('ignores stranded sources with no copy', () => {
        const out = findPostponedShells([
            makePlan('2026-09-20', [{ task: 'Lonely', status: 'postponed', postponedToDate: '2026-09-25' }])
        ]);
        assert.deepEqual(out, []);
    });

    it('never touches completed, active or already-removed tasks', () => {
        const out = findPostponedShells([
            makePlan('2026-09-20', [
                { task: 'Done thing', status: 'completed' },
                { task: 'Live thing', status: 'to-be-started' },
                { task: 'Gone shell', status: 'postponed', postponedToDate: '2026-09-25', isRemoved: true }
            ]),
            makePlan('2026-09-25', [copyOf('2026-09-20', '2026-09-20', 0)])
        ]);
        assert.deepEqual(out, []);
    });

    it('skips sources whose only successor copy is itself removed', () => {
        const out = findPostponedShells([
            makePlan('2026-09-20', [{ task: 'Job', status: 'postponed', postponedToDate: '2026-09-25' }]),
            makePlan('2026-09-25', [{ ...copyOf('2026-09-20', '2026-09-20', 0), isRemoved: true }])
        ]);
        assert.deepEqual(out, [], 'removed copy is not a live successor');
    });

    it('follows transitive chains: source → removed copy → live copy', () => {
        const out = findPostponedShells([
            makePlan('2026-09-20', [{ task: 'Chain', status: 'postponed', postponedToDate: '2026-09-25' }]),
            makePlan('2026-09-25', [{
                task: 'Chain (Postponed from 2026-09-20)', status: 'postponed',
                addedFrom: 'postponed', postponedFromDate: '2026-09-20',
                postponedToDate: '2026-09-28',
                sourcePlanId: planId('2026-09-20'), sourceTaskIndex: 0, isRemoved: true
            }]),
            makePlan('2026-09-28', [{
                task: 'Chain (Postponed from 2026-09-25)', status: 'postponed',
                addedFrom: 'postponed', postponedFromDate: '2026-09-25',
                sourcePlanId: planId('2026-09-25'), sourceTaskIndex: 0
            }])
        ]);
        assert.equal(out.length, 1, 'only the visible gen0 source is listed');
        assert.equal(out[0].date, '2026-09-20');
    });

    it('matches legacy copies by origin date + text when pointers are absent', () => {
        const out = findPostponedShells([
            makePlan('2026-09-20', [{ task: 'Legacy job', status: 'postponed' }]),
            makePlan('2026-09-25', [{
                task: 'Legacy job (Postponed from 2026-09-20)',
                status: 'postponed', postponedFromDate: '2026-09-20'
            }])
        ]);
        assert.equal(out.length, 1);
        assert.equal(out[0].via, 'text');
    });

    it('does not match on text alone when origin date differs', () => {
        const out = findPostponedShells([
            makePlan('2026-09-20', [{ task: 'Same words', status: 'postponed' }]),
            makePlan('2026-09-25', [{
                task: 'Same words (Postponed from 2026-09-22)',
                status: 'postponed', postponedFromDate: '2026-09-22'
            }])
        ]);
        assert.deepEqual(out, []);
    });

    it('handles empty and malformed input without throwing', () => {
        assert.deepEqual(findPostponedShells([]), []);
        assert.deepEqual(findPostponedShells(null), []);
        assert.deepEqual(findPostponedShells([null, { id: 'x' }, { id: 'y', plans: null }]), []);
    });
});
