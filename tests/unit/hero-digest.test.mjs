// tests/unit/hero-digest.test.mjs
// Evidence digest for the AI Hero jury (js/utils/hero-digest.js):
//   1. Skips missing segments; empty input ÔåÆ ''.
//   2. Done titles are size-ordered and labelled; missed tasks visible.
//   3. On-time mirrors the scorer (completedDate vs end of due date).
//   4. Mix/notes segments summarize the actual work, capped in length.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { buildHeroEvidenceDigest, HERO_DIGEST_MAX_CHARS } =
    await import('../../js/utils/hero-digest.js');

const task = (text, over = {}) => ({
    task: text,
    sizeCategory: 'small-task',
    priorityLevel: 'standard',
    ...over
});
const row = (taskObj, status = 'completed', wpDate = '2026-10-01') => ({
    task: taskObj,
    status,
    wp: { date: wpDate }
});

test('empty and garbage input yields an empty digest', () => {
    assert.equal(buildHeroEvidenceDigest(), '', 'no args');
    assert.equal(buildHeroEvidenceDigest([], []), '', 'empty arrays');
    assert.equal(buildHeroEvidenceDigest(null, null), '', 'null');
    assert.equal(buildHeroEvidenceDigest([null, { task: null }, { task: { task: '   ' } }]), '', 'junk rows skipped');
});

test('Done segment lists titles biggest-first with size labels and overflow count', () => {
    const digest = buildHeroEvidenceDigest([
        row(task('Reply to email', { sizeCategory: 'quick-task' })),
        row(task('Ship major client report', { sizeCategory: 'major-project' })),
        row(task('Draft invoice', { sizeCategory: 'quick-task' })),
        row(task('Build onboarding doc', { sizeCategory: 'medium-task' })),
        row(task('Fix login bug', { sizeCategory: 'small-task' }))
    ], []);
    assert.match(digest, /^Done: "Ship major client report" \(major\), "Build onboarding doc" \(medium\)/,
        'biggest work first');
    assert.match(digest, /\+1 more \| Sizes:/, 'overflow count beyond top 4');
    assert.match(digest, /Sizes: 2 quick, 1 major, 1 medium|Sizes: 2 quick, 1 medium, 1 major/,
        'size mix present');
    assert.ok(!digest.includes('OnTime'), 'no timing segment without completedDate');
});

test('OnTime counts completedDate on/before end of due date', () => {
    const rows = [
        { task: { task: 'A', completedDate: '2026-10-01T18:00:00' }, status: 'completed', wp: { date: '2026-10-01' } },
        { task: { task: 'B', completedDate: '2026-10-03T09:00:00' }, status: 'completed', wp: { date: '2026-10-02' } },
        { task: { task: 'C' }, status: 'completed', wp: { date: '2026-10-02' } }
    ];
    const out = buildHeroEvidenceDigest(rows, []);
    assert.match(out, /OnTime: 1\/2/, 'on time / timed (unknown completedDate excluded)');
    const noDates = buildHeroEvidenceDigest([
        { task: { task: 'A' }, status: 'completed', wp: { date: '2026-10-01' } }
    ], []);
    assert.ok(!noDates.includes('OnTime'), 'no timing segment without completedDate');
});

test('Missed and carried Postponed segments expose the downside', () => {
    const digest = buildHeroEvidenceDigest([
        row(task('Submit compliance filing', { sizeCategory: 'large-task' }), 'missed'),
        row(task('Reply fast', { sizeCategory: 'quick-task' }), 'missed'),
        row(task('Too minor to list', { sizeCategory: 'quick-task' }), 'missed'),
        { task: { task: 'Ongoing audit', postponeWorkStatus: 'in_progress' }, status: 'postponed', wp: { date: '2026-10-01' } },
        { task: { task: 'Shelved thing', postponeWorkStatus: '' }, status: 'postponed', wp: { date: '2026-10-01' } }
    ], []);
    assert.match(digest, /Missed: "Submit compliance filing", "Reply fast"/, 'top 2 missed by size');
    assert.ok(!digest.includes('Too minor'), 'missed list capped at 2');
    assert.match(digest, /Postponed: 1 still in progress/, 'only carried postponements count');
});

test('Priority, Purposes, SubPlans and Notes segments summarize the work', () => {
    const digest = buildHeroEvidenceDigest([
        row(task('Urgent fix', { priorityLevel: 'urgent', purposeCategory: 'client-delivery' })),
        row(task('Urgent patch', { priorityLevel: 'urgent', purposeCategory: 'client-delivery' })),
        row(task('Ops chore', { priorityLevel: 'standard', purposeCategory: 'ops', subPlans: [{}, {}] }))
    ], [
        { workDescription: 'Worked on the client rollout all day.' },
        { workDescription: 'Follow-ups and internal syncs.' },
        {}
    ]);
    assert.match(digest, /Priority: 2 urgent, 1 standard/, 'priority mix');
    assert.match(digest, /Purposes: client-delivery, ops/, 'distinct purposes');
    assert.match(digest, /SubPlans: 1/, 'tasks with sub-plans');
    assert.match(digest, /Notes: \d+ chars/, 'work-note volume');
});

test('digest is capped at HERO_DIGEST_MAX_CHARS with an ellipsis', () => {
    // Dense week: full Done/OnTime/Missed/Postponed/mix/purposes segments.
    const rows = [
        ...Array.from({ length: 6 }, (_, i) => ({
            task: {
                task: `Deliver substantial milestone deliverable number ${i} to the client`,
                sizeCategory: 'large-task',
                priorityLevel: 'urgent',
                purposeCategory: i % 2 ? 'client-delivery-flow' : 'internal-ops-mgmt',
                subPlans: [{}],
                completedDate: `2026-10-0${(i % 6) + 1}T17:00:00`
            },
            status: 'completed',
            wp: { date: `2026-10-0${(i % 6) + 1}` }
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
            task: {
                task: `Overdue regulatory submission item ${i} still owed to compliance`,
                sizeCategory: 'medium-task',
                priorityLevel: 'important',
                purposeCategory: 'people-operations'
            },
            status: 'missed',
            wp: { date: '2026-10-02' }
        })),
        {
            task: { task: 'Quarterly audit prep', postponeWorkStatus: 'work_started', sizeCategory: 'small-task' },
            status: 'postponed',
            wp: { date: '2026-10-01' }
        }
    ];
    const digest = buildHeroEvidenceDigest(rows, [{ workDescription: 'x'.repeat(1500) }]);
    assert.ok(digest.length <= HERO_DIGEST_MAX_CHARS, `length ${digest.length} within cap`);
    assert.ok(digest.endsWith('...'), 'truncated with ellipsis');
});
