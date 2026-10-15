//! /tests/unit/span-carry-guard.test.mjs
// Multi-day spans must not produce carry-forward duplicates:
// a task whose [startDate, endDate] already covers the target date shows
// virtually on the day page, so carrying it would display it twice.
// Single-day tasks keep the exact old behaviour.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Browser-ish globals before import (calendar.js assigns window.AppCalendar).
globalThis.window = globalThis.window || {};

const { Calendar } = await import('../../js/modules/calendar.js');

const USER = 'u1';
const FROM = '2026-10-14';
const TO = '2026-10-15';

// Minimal stand-in: attendance with a missed-checkout exception for FROM,
// so the exception-day gate passes and only the span rule is exercised.
function setup() {
    const calendar = new Calendar();
    calendar.db = {
        async queryMany(collection, filters = []) {
            if (collection !== 'attendance') return [];
            return [{
                user_id: USER,
                date: FROM,
                autoCheckoutReason: 'missed_checkout_next_login'
            }];
        },
        async getAll(collection) {
            if (collection !== 'attendance') return [];
            return [{
                user_id: USER,
                date: FROM,
                autoCheckoutReason: 'missed_checkout_next_login'
            }];
        }
    };
    return calendar;
}

describe('isEligibleNextDayCarryTask - span guard', () => {
    it('skips a multi-day task whose span already covers the target date', async () => {
        const calendar = setup();
        const ok = await calendar.isEligibleNextDayCarryTask(
            { task: 'Span job', status: 'in-process', startDate: '2026-10-14', endDate: '2026-10-16' },
            FROM, TO, USER
        );
        assert.equal(ok, false, 'spanning task needs no carry shell');
    });

    it('still carries an ordinary single-day task', async () => {
        const calendar = setup();
        const ok = await calendar.isEligibleNextDayCarryTask(
            { task: 'One day', status: 'in-process', startDate: FROM, endDate: FROM },
            FROM, TO, USER
        );
        assert.equal(ok, true, 'single-day behaviour unchanged');
    });

    it('still carries a task with no range fields at all', async () => {
        const calendar = setup();
        const ok = await calendar.isEligibleNextDayCarryTask(
            { task: 'Legacy', status: 'in-process' },
            FROM, TO, USER
        );
        assert.equal(ok, true, 'legacy tasks without dates are unaffected');
    });
});
