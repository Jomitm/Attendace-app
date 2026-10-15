//! /tests/unit/ai-toolplan-gate.test.mjs
// Tool-plan pre-check gate (js/modules/ai-actions.js fetchToolPlan):
// every plain chat question used to burn a FULL extra model chain (tool-plan
// LLM call) before the answer chain even started. The ACTION_VERBS gate skips
// that round-trip for non-actionable text — one chain instead of two.
//   1. Plain questions never touch fetch.
//   2. Actionable text still reaches fetch.
//   3. The flagship personalization question stays gate-free.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { fetchToolPlan, ACTION_VERBS } =
    await import('../../js/modules/ai-actions.js');

test('plain questions skip the LLM round-trip entirely', async () => {
    const realFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error('must not be called'); };
    try {
        for (const q of [
            'what should I do first today?',
            'how am I doing this month?',
            'show my leaves',
            'am I late today?'
        ]) {
            assert.equal(await fetchToolPlan(q), null, `no plan for: ${q}`);
        }
        assert.equal(calls, 0, 'fetch must not run for plain questions');
    } finally {
        globalThis.fetch = realFetch;
    }
});

test('actionable text still reaches the server', async () => {
    const realFetch = globalThis.fetch;
    const realWindow = globalThis.window;
    let calls = 0;
    globalThis.window = {};
    globalThis.fetch = async () => {
        calls++;
        return { ok: false, status: 500, json: async () => ({}) };
    };
    try {
        assert.equal(await fetchToolPlan('postpone my report to Friday'), null);
        assert.equal(calls, 1, 'fetch must run once for actionable text');
    } finally {
        globalThis.fetch = realFetch;
        globalThis.window = realWindow;
    }
});

test('ACTION_VERBS matches action phrasings, not plain questions', () => {
    for (const q of ['add task call Ravi', 'mark the report done', 'move standup to tomorrow', 'delete old entry']) {
        assert.match(q, ACTION_VERBS, `should match: ${q}`);
    }
    for (const q of ['what should I do first today?', 'how is my attendance?', 'show overdue tasks']) {
        assert.doesNotMatch(q, ACTION_VERBS, `must not match: ${q}`);
    }
});
