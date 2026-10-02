// tests/unit/fab-badge.test.mjs
// FAB notification badge watermark (float panel):
//   1. Before the assistant is opened, any issue shows the badge.
//   2. Opening acknowledges the current count — badge goes, even though
//      issues still exist.
//   3. The badge re-arms only when NEW issues push the count past the
//      acknowledged watermark (drops/resolutions never resurrect it).

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { shouldShowFabBadge } = await import('../../js/ui/helpers.js');

test('badge shows for any issue count before the first open', () => {
    assert.equal(shouldShowFabBadge(1, 0), true, 'first issue shows');
    assert.equal(shouldShowFabBadge(4, 0), true, 'count shows while nothing acknowledged');
    assert.equal(shouldShowFabBadge(0, 0), false, 'no issues, no badge');
});

test('opening the assistant clears the badge despite open issues', () => {
    const seen = 4; // acknowledged at open
    assert.equal(shouldShowFabBadge(4, seen), false, 'same count after open is read');
    assert.equal(shouldShowFabBadge(2, seen), false, 'resolved issues stay cleared');
});

test('badge re-arms only when the count grows past the watermark', () => {
    const seen = 4;
    assert.equal(shouldShowFabBadge(5, seen), true, 'a NEW issue re-notifies');
    assert.equal(shouldShowFabBadge(6, seen), true, 'further growth keeps showing');
    assert.equal(shouldShowFabBadge(3, seen), false, 'never for old/dropped counts');
});

test('missing watermark values behave as "nothing seen yet"', () => {
    assert.equal(shouldShowFabBadge(2, undefined), true);
    assert.equal(shouldShowFabBadge(2, null), true);
    assert.equal(shouldShowFabBadge(0, null), false);
});
