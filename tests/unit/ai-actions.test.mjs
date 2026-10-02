import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parsePlainDate, parseAddTaskIntent, parseCompleteIntent } from '../../js/modules/ai-actions.js';

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Fixed reference: Monday, 2026-09-14
const REF = new Date(2026, 8, 14);
assert.equal(REF.getDay(), 1, 'reference date must be a Monday');

describe('parsePlainDate', () => {
    it('resolves today/tomorrow/day-after against refDate (not the real clock)', () => {
        assert.equal(parsePlainDate('today', REF), '2026-09-14');
        assert.equal(parsePlainDate('Tomorrow', REF), '2026-09-15');
        assert.equal(parsePlainDate('day after tomorrow', REF), '2026-09-16');
        assert.equal(parsePlainDate('overmorrow', REF), '2026-09-16');
    });

    it('returns explicit ISO dates unchanged', () => {
        assert.equal(parsePlainDate('2026-10-01', REF), '2026-10-01');
        assert.equal(parsePlainDate('submit taxes 2026-10-01', REF), '2026-10-01');
    });

    it('resolves weekdays to the next occurrence strictly after refDate', () => {
        assert.equal(parsePlainDate('wednesday', REF), '2026-09-16'); // +2
        assert.equal(parsePlainDate('fri', REF), '2026-09-18'); // +4
        assert.equal(parsePlainDate('monday', REF), '2026-09-21'); // same weekday -> +7
    });

    it('tolerates weekday typos', () => {
        assert.equal(parsePlainDate('wednessday', REF), '2026-09-16');
        assert.equal(parsePlainDate('wensday', REF), '2026-09-16');
        assert.equal(parsePlainDate('thusday', REF), '2026-09-17');
    });

    it('returns null when no date is present', () => {
        assert.equal(parsePlainDate('', REF), null);
        assert.equal(parsePlainDate(null, REF), null);
        assert.equal(parsePlainDate('meeting sometime next week', REF), null);
    });
});

describe('parseAddTaskIntent', () => {
    const today = fmt(new Date());
    const tomorrow = fmt(addDays(new Date(), 1));
    const dayAfter = fmt(addDays(new Date(), 2));

    it('splits task and trailing "for <date>"', () => {
        const r = parseAddTaskIntent('Add task Prepare report for tomorrow');
        assert.ok(r);
        assert.equal(r.task, 'Prepare report');
        assert.equal(r.date, tomorrow);
        assert.equal(r.datePhrase, 'tomorrow');
        assert.ok(!r.isMissingTask);
    });

    it('splits a trailing weekday without "for"', () => {
        const r = parseAddTaskIntent('add task call client wednessday');
        assert.ok(r);
        assert.equal(r.task, 'call client');
        assert.equal(r.date, parsePlainDate('wednessday'));
        assert.ok(!r.isMissingTask);
    });

    it('handles day-after-tomorrow phrasing', () => {
        const r = parseAddTaskIntent('please add task call client day after tomorrow');
        assert.ok(r);
        assert.equal(r.task, 'call client');
        assert.equal(r.date, dayAfter);
    });

    it('strips politeness and detects a missing task name', () => {
        const r = parseAddTaskIntent('can you add a task for me for tomorrow');
        assert.ok(r);
        assert.equal(r.isMissingTask, true);
        assert.equal(r.task, '');
        assert.equal(r.date, tomorrow);
        assert.equal(r.datePhrase, 'tomorrow');
    });

    it('prompts for a name when no task text at all', () => {
        const r = parseAddTaskIntent('add task for me');
        assert.ok(r);
        assert.equal(r.isMissingTask, true);
        assert.equal(r.task, '');
        assert.equal(r.date, today);
    });

    it('defaults to today when no date is given', () => {
        const r = parseAddTaskIntent('Add task Prepare report');
        assert.ok(r);
        assert.equal(r.task, 'Prepare report');
        assert.equal(r.date, today);
        assert.equal(r.datePhrase, 'today');
    });

    it('accepts explicit ISO dates at the end', () => {
        const r = parseAddTaskIntent('Add task Submit report 2026-10-01');
        assert.ok(r);
        assert.equal(r.task, 'Submit report');
        assert.equal(r.date, '2026-10-01');
    });

    it('supports create task phrasing', () => {
        const r = parseAddTaskIntent('create task Draft newsletter for Monday');
        assert.ok(r);
        assert.equal(r.task, 'Draft newsletter');
        assert.equal(r.date, parsePlainDate('monday'));
    });

    it('returns null for non-add questions', () => {
        assert.equal(parseAddTaskIntent('What did I miss today?'), null);
        assert.equal(parseAddTaskIntent('hello'), null);
        assert.equal(parseAddTaskIntent(''), null);
        assert.equal(parseAddTaskIntent(null), null);
    });
});

describe('parseCompleteIntent', () => {
    it('detects bulk complete for overdue tasks', () => {
        assert.deepEqual(parseCompleteIntent('complete my overdue'), { query: '__OVERDUE__', isBulk: true });
        assert.deepEqual(parseCompleteIntent('mark all overdue as done'), { query: '__OVERDUE__', isBulk: true });
    });

    it('extracts the task name from "mark X as done"', () => {
        const r = parseCompleteIntent('Mark Prepare report as done');
        assert.ok(r);
        assert.equal(r.isBulk, false);
        assert.equal(r.query, 'Prepare report');
    });

    it('strips leading my/the', () => {
        assert.equal(parseCompleteIntent('complete Prepare report').query, 'Prepare report');
        assert.equal(parseCompleteIntent('finish the budget report').query, 'budget report');
    });

    it('returns null for non-complete input', () => {
        assert.equal(parseCompleteIntent('what time is it'), null);
        assert.equal(parseCompleteIntent('add task X tomorrow'), null);
    });
});
