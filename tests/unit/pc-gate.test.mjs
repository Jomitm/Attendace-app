// tests/unit/pc-gate.test.mjs
// One-click personal-check gate (shared by float panel + AI Center):
//   1. Gate renders a single question button wired via [data-pc-run].
//   2. Gate leaks none of the evidence-card content (Fact/Observation/...).
//   3. Gate markup is inert — no inline JS, links, or colliding ids.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { pcGateHtml } = await import('../../js/ui/helpers.js');

test('gate renders one question button wired via data-pc-run', () => {
    const html = pcGateHtml();
    assert.ok(html.includes('ai-pc-gate'), 'gate container rendered');
    assert.ok(html.includes('data-pc-run'), 'click hook present for both surfaces');
    assert.ok(html.includes('What did I miss today?'), 'question text on the button');
    assert.equal((html.match(/<button/g) || []).length, 1, 'exactly one button');
});

test('gate leaks no personal-check evidence before reveal', () => {
    const html = pcGateHtml();
    for (const marker of ['ai-issue', 'Fact:', 'Observation:', 'Prediction:', 'Recommendation:', 'ai-empty']) {
        assert.ok(!html.includes(marker), `no ${marker} in the unopened gate`);
    }
});

test('gate markup is inert — no inline handlers, links, or ids', () => {
    const html = pcGateHtml();
    assert.ok(!/onclick|javascript:|href=/.test(html), 'no inline JS or navigation');
    assert.ok(!html.includes(' id='), 'no ids to collide with page containers');
});
