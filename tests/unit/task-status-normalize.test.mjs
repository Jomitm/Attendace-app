// tests/unit/task-status-normalize.test.mjs
// Fix 2 for the workflow gap: idle statuses ('to-be-started'/'pending'/
// 'planned') become date-driven when a smart resolver is supplied — today's
// untouched work surfaces as in-process, past work as overdue — while
// explicit statuses, provenance markers and null-resolver callers keep their
// historical results. Uses the real RatingSystem.getSmartTaskStatus resolver.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Browser-ish globals before import (db.js assigns window.AppDB).
globalThis.window = globalThis.window || {};

const { normalizeTaskStatus } = await import('../../js/utils/task-status.js');
const { RatingSystem } = await import('../../js/modules/rating.js');

const rating = new RatingSystem();
// Matches how UI call sites pass the resolver (window.AppCalendar
// .getSmartTaskStatus delegates to AppRating with the same argument order).
const resolver = (planDate, status) => rating.getSmartTaskStatus(planDate, status);

// Same "today" derivation as RatingSystem.getSmartTaskStatus (UTC ISO date).
const today = new Date().toISOString().split('T')[0];
const shiftDays = (dateStr, delta) => {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().split('T')[0];
};
const past = shiftDays(today, -3);
const future = shiftDays(today, 3);

describe('normalizeTaskStatus - idle statuses with resolver become date-driven', () => {
    it('to-be-started today -> in-process', () => {
        assert.equal(normalizeTaskStatus({ status: 'to-be-started' }, today, resolver), 'in-process');
    });

    it('to-be-started past -> overdue', () => {
        assert.equal(normalizeTaskStatus({ status: 'to-be-started' }, past, resolver), 'overdue');
    });

    it('to-be-started future -> to-be-started', () => {
        assert.equal(normalizeTaskStatus({ status: 'to-be-started' }, future, resolver), 'to-be-started');
    });

    it('pending today -> in-process', () => {
        assert.equal(normalizeTaskStatus({ status: 'pending' }, today, resolver), 'in-process');
    });

    it('planned past -> overdue', () => {
        assert.equal(normalizeTaskStatus({ status: 'planned' }, past, resolver), 'overdue');
    });

    it('to be started (spaced alias) today -> in-process', () => {
        assert.equal(normalizeTaskStatus({ status: 'to be started' }, today, resolver), 'in-process');
    });
});

describe('normalizeTaskStatus - reactivated copies never fold back to postponed', () => {
    it('to-be-started + postponedFromDate + resolver stays active for today', () => {
        // Regression guard: replan-activated copies keep their lineage fields.
        const status = normalizeTaskStatus(
            { status: 'to-be-started', postponedFromDate: shiftDays(today, -1) },
            today,
            resolver
        );
        assert.equal(status, 'in-process');
        assert.notEqual(status, 'postponed');
    });

    it('to-be-started + postponedFromDate + resolver is overdue on a past date', () => {
        const status = normalizeTaskStatus(
            { status: 'to-be-started', postponedFromDate: shiftDays(past, -5) },
            past,
            resolver
        );
        assert.equal(status, 'overdue');
        assert.notEqual(status, 'postponed');
    });

    it('to-be-started + addedFrom=postponed + resolver stays active', () => {
        const status = normalizeTaskStatus(
            { status: 'to-be-started', addedFrom: 'postponed' },
            today,
            resolver
        );
        assert.notEqual(status, 'postponed');
        assert.equal(status, 'in-process');
    });
});

describe('normalizeTaskStatus - idle without a usable resolver keeps legacy result', () => {
    it('null resolver: past date still to-be-started', () => {
        assert.equal(normalizeTaskStatus({ status: 'to-be-started' }, past, null), 'to-be-started');
    });

    it('null resolver: today still to-be-started', () => {
        assert.equal(normalizeTaskStatus({ status: 'pending' }, today, null), 'to-be-started');
    });

    it('null resolver: empty status falls back to to-be-started', () => {
        assert.equal(normalizeTaskStatus({ status: '' }, past, null), 'to-be-started');
    });

    it('empty plan date + resolver keeps to-be-started (would be overdue unguarded)', () => {
        assert.equal(normalizeTaskStatus({ status: 'to-be-started' }, '', resolver), 'to-be-started');
    });

    it('missing plan date + resolver keeps to-be-started without throwing', () => {
        // RatingSystem.getSmartTaskStatus would throw on a non-string date.
        assert.equal(normalizeTaskStatus({ status: 'to-be-started' }, undefined, resolver), 'to-be-started');
    });

    it('missing resolver function (undefined) keeps legacy result', () => {
        assert.equal(normalizeTaskStatus({ status: 'planned' }, today, undefined), 'to-be-started');
    });
});

describe('normalizeTaskStatus - explicit statuses remain manual overrides', () => {
    it('in-process + future date + resolver stays in-process', () => {
        assert.equal(normalizeTaskStatus({ status: 'in-process' }, future, resolver), 'in-process');
    });

    it('postponed + today + resolver stays postponed', () => {
        assert.equal(normalizeTaskStatus({ status: 'postponed' }, today, resolver), 'postponed');
    });

    it('postponed + completedDate still postponed (raw status wins)', () => {
        assert.equal(
            normalizeTaskStatus({ status: 'postponed', completedDate: past }, today, resolver),
            'postponed'
        );
    });

    it('not-completed stays not-completed', () => {
        assert.equal(normalizeTaskStatus({ status: 'not-completed' }, past, resolver), 'not-completed');
    });

    it('raw overdue stays overdue', () => {
        assert.equal(normalizeTaskStatus({ status: 'overdue' }, future, resolver), 'overdue');
    });

    it('raw completed stays completed', () => {
        assert.equal(normalizeTaskStatus({ status: 'completed' }, past, resolver), 'completed');
    });
});

describe('normalizeTaskStatus - provenance markers on non-idle statuses', () => {
    it('empty status + postponedFromDate -> postponed (existing path, resolver not consulted)', () => {
        assert.equal(
            normalizeTaskStatus({ status: '', postponedFromDate: past }, today, resolver),
            'postponed'
        );
    });

    it('empty status + addedFrom=postponed -> postponed', () => {
        assert.equal(normalizeTaskStatus({ status: '', addedFrom: 'postponed' }, today, resolver), 'postponed');
    });

    it('empty status + completedDate -> completed (beats date-derived overdue)', () => {
        assert.equal(normalizeTaskStatus({ status: '', completedDate: past }, past, resolver), 'completed');
    });
});

describe('normalizeTaskStatus - empty and unknown statuses with resolver', () => {
    it('empty status today -> in-process', () => {
        assert.equal(normalizeTaskStatus({ status: '' }, today, resolver), 'in-process');
    });

    it('empty status past -> overdue', () => {
        assert.equal(normalizeTaskStatus({ status: '' }, past, resolver), 'overdue');
    });

    it('empty status future -> to-be-started', () => {
        assert.equal(normalizeTaskStatus({ status: '' }, future, resolver), 'to-be-started');
    });

    it('unknown status past -> date-derived via resolver', () => {
        assert.equal(normalizeTaskStatus({ status: 'in review' }, past, resolver), 'overdue');
    });

    it('unknown status with null resolver is preserved verbatim', () => {
        assert.equal(normalizeTaskStatus({ status: 'in review' }, past, null), 'in review');
    });

    it('resolver returning an unrecognized value falls back per path', () => {
        const bogus = () => 'garbage';
        assert.equal(normalizeTaskStatus({ status: 'to-be-started' }, today, bogus), 'to-be-started');
        assert.equal(normalizeTaskStatus({ status: '' }, today, bogus), 'to-be-started');
    });
});
