// tests/unit/ai-quota.test.mjs
// Daily chat-question quota rules (api/_ai-quota.js):
//   1. Doc id keys a user's counter to a UTC day.
//   2. Limit defaults to 5; a sane env override wins, garbage falls back.
//   3. Only user-typed chat questions are chargeable — tool_plan, classify,
//      performance and Generate Insights (question: null) are exempt.
//   4. Reset date/message land on the next UTC midnight.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { quotaLimit, isQuotaRequest, quotaDocId, nextUtcMidnight, quotaMessage, quotaContext } =
    await import('../../api/_ai-quota.js');

test('quotaDocId keys a user to a UTC day', () => {
    assert.equal(quotaDocId('uid123', '2026-10-01T15:30:00.000Z'), 'uid123_2026-10-01');
    assert.equal(quotaDocId('uid123', '2026-12-31'), 'uid123_2026-12-31');
    const generated = quotaDocId('u');
    assert.match(generated, /^u_\d{4}-\d{2}-\d{2}$/, 'auto-generated id uses ISO date');
});

test('quotaLimit defaults to 5 and honors sane overrides', () => {
    assert.equal(quotaLimit({}), 5, 'missing env falls back to default');
    assert.equal(quotaLimit({ AI_DAILY_QUESTION_LIMIT: '10' }), 10, 'string env override');
    assert.equal(quotaLimit({ AI_DAILY_QUESTION_LIMIT: 7 }), 7, 'numeric env override');
    assert.equal(quotaLimit({ AI_DAILY_QUESTION_LIMIT: '0' }), 5, 'zero rejected');
    assert.equal(quotaLimit({ AI_DAILY_QUESTION_LIMIT: '-3' }), 5, 'negative rejected');
    assert.equal(quotaLimit({ AI_DAILY_QUESTION_LIMIT: 'abc' }), 5, 'garbage rejected');
    assert.equal(quotaLimit({ AI_DAILY_QUESTION_LIMIT: '4.7' }), 4, 'floats floor');
});

test('only chat questions are chargeable', () => {
    assert.equal(isQuotaRequest({ question: 'How are we doing?' }), true, 'plain chat');
    assert.equal(isQuotaRequest({ question: '  hi  ', mode: undefined }), true, 'whitespace around ok');
    assert.equal(isQuotaRequest({ question: 'x', mode: 'stream' }), true, 'stream mode charges');

    assert.equal(isQuotaRequest({ question: 'x', mode: 'tool_plan' }), false, 'tool_plan exempt');
    assert.equal(isQuotaRequest({ question: 'x', mode: 'classify' }), false, 'classify exempt');
    assert.equal(isQuotaRequest({ question: 'x', mode: 'performance' }), false, 'coach exempt');

    assert.equal(isQuotaRequest({ question: null }), false, 'Generate Insights sends null');
    assert.equal(isQuotaRequest({ question: '' }), false, 'empty string');
    assert.equal(isQuotaRequest({ question: '   ' }), false, 'blank string');
    assert.equal(isQuotaRequest({ metrics: { today: '2026-10-01' } }), false, 'no question');
    assert.equal(isQuotaRequest({}), false, 'empty body');
});

test('nextUtcMidnight rolls to the following UTC date', () => {
    assert.equal(nextUtcMidnight(new Date('2026-10-01T00:00:00Z')), '2026-10-02');
    assert.equal(nextUtcMidnight(new Date('2026-10-01T23:59:59Z')), '2026-10-02');
    assert.equal(nextUtcMidnight(new Date('2026-12-31T12:00:00Z')), '2027-01-01', 'year rollover');
});

test('quotaMessage carries the limit and reset info', () => {
    const withDate = quotaMessage(5, '2026-10-02');
    assert.match(withDate, /\b5\b/, 'mentions the limit');
    assert.match(withDate, /2026-10-02/, 'mentions the reset date');
    const generic = quotaMessage(5);
    assert.match(generic, /midnight UTC/, 'mentions UTC reset');
    assert.match(generic, /\b5\b/, 'mentions the limit without a date too');
});

test('quotaContext tells the model limit/used/remaining truthfully', () => {
    assert.deepEqual(quotaContext(5, 0), { limit: 5, used: 0, remaining: 4 }, 'first question spends 1 of 5');
    assert.deepEqual(quotaContext(5, 4), { limit: 5, used: 4, remaining: 0 }, 'last allowed question → 0 left');
    assert.deepEqual(quotaContext(5, null), { limit: 5, used: 0, remaining: 4 }, 'null used treated as 0');
    assert.equal(quotaContext(5, 4).remaining, 0, 'remaining never goes negative before the 429');
});
