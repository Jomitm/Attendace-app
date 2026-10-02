// tests/unit/hero-ai-select.test.mjs
// AI Hero-of-the-Week selection rules (api/_hero-select-core.js + provider parity):
//   1. Period keys and Firestore doc ids are stable and safe.
//   2. Candidates = eligible rows only, compact stats, capped.
//   3. The model answer is validated against the allow-list — anything else
//      (bad JSON, unknown id, no candidates) → null → normal ranking fallback.
//   4. HERO_PROMPT + mode:'hero' exist in BOTH provider mirrors (.js and .cjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { buildHeroPeriodKey, heroSelectionDocId, sanitizeCandidates, buildHeroCandidates, parseHeroAiResponse } =
    await import('../../api/_hero-select-core.js');

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');

// ── period key + doc id ──

test('buildHeroPeriodKey joins valid local date keys', () => {
    assert.equal(buildHeroPeriodKey('2026-09-24', '2026-10-01'), '2026-09-24_2026-10-01');
    assert.equal(buildHeroPeriodKey('2026-09-24T00:00:00', '2026-10-01'), '2026-09-24_2026-10-01', 'time part trimmed');
});

test('buildHeroPeriodKey rejects missing or malformed dates', () => {
    assert.equal(buildHeroPeriodKey('', '2026-10-01'), null, 'missing start');
    assert.equal(buildHeroPeriodKey('2026-09-24', ''), null, 'missing end');
    assert.equal(buildHeroPeriodKey('nope', '2026-10-01'), null, 'garbage start');
    assert.equal(buildHeroPeriodKey(undefined, undefined), null, 'undefined');
});

test('heroSelectionDocId keeps period keys and sanitizes odd input', () => {
    assert.equal(heroSelectionDocId('2026-09-24_2026-10-01'), '2026-09-24_2026-10-01');
    assert.equal(heroSelectionDocId('a/b..c'), 'a_b__c', 'path chars replaced');
    assert.ok(!heroSelectionDocId('../../etc/passwd').includes('/'), 'no path traversal');
    assert.equal(heroSelectionDocId(''), '', 'empty stays empty');
});

// ── candidate building / sanitizing ──

const row = (id, over = {}) => ({
    user: { id, name: `User ${id}` },
    stats: { finalScore: 80, days: 5, hours: 40.123, taskPlanned: 6, taskCompleted: 5, taskInProgress: 1, taskPostponed: 0, taskMissed: 0, punctuality: 90 },
    rank: 1,
    isEligible: true,
    ...over
});

test('buildHeroCandidates keeps only eligible rows with a user', () => {
    const rows = [
        row('a'),
        row('b', { isEligible: false }),
        row('', {}),
        { user: null, stats: null, isEligible: true },
        row('c', { rank: 3 })
    ];
    const candidates = buildHeroCandidates(rows);
    assert.deepEqual(candidates.map((c) => c.id), ['a', 'c'], 'eligible-only, order preserved');
    const a = candidates[0];
    assert.equal(a.name, 'User a');
    assert.equal(a.score, 80, 'finalScore → score');
    assert.equal(a.planned, 6, 'taskPlanned → planned');
    assert.equal(a.missed, 0);
    assert.equal(a.rank, 1);
    assert.ok(Math.abs(a.hours - 40.1) < 0.01, 'hours rounded to 1 decimal');
});

test('buildHeroCandidates tolerates garbage input', () => {
    assert.deepEqual(buildHeroCandidates(), [], 'no rows');
    assert.deepEqual(buildHeroCandidates('x'), [], 'non-array');
    assert.deepEqual(buildHeroCandidates([]), [], 'empty');
    const capped = buildHeroCandidates(Array.from({ length: 150 }, (_, i) => row(`u${i}`)));
    assert.equal(capped.length, 100, 'capped at 100 candidates');
});

test('sanitizeCandidates coerces types and drops unknown/empty ids', () => {
    const out = sanitizeCandidates([
        { id: ' a ', name: '  Alice ', rank: '2', score: '81.5', days: '5', hours: '40', junk: 'drop me' },
        { id: '', name: 'no id' },
        { name: 'no id either' },
        null
    ]);
    assert.equal(out.length, 1, 'only the id-bearing row survives');
    assert.equal(out[0].id, 'a');
    assert.equal(out[0].name, 'Alice');
    assert.equal(out[0].rank, 2, 'numeric string coerced');
    assert.equal(out[0].score, 81.5);
    assert.ok(!('junk' in out[0]), 'unknown fields dropped');
    assert.deepEqual(sanitizeCandidates(null), [], 'null input');
    assert.deepEqual(sanitizeCandidates('x'), [], 'string input');
});

// ── model answer validation (the fallback gate) ──

const ALLOWED = ['u1', 'u2'];

test('parseHeroAiResponse accepts clean and fenced JSON', () => {
    assert.deepEqual(
        parseHeroAiResponse('{"userId":"u2","rationale":"Best balanced week."}', ALLOWED),
        { userId: 'u2', rationale: 'Best balanced week.' },
        'clean JSON'
    );
    assert.equal(
        parseHeroAiResponse('```json\n{"userId":"u1","rationale":"Solid."}\n```', ALLOWED)?.userId,
        'u1',
        'code fence tolerated'
    );
    assert.equal(
        parseHeroAiResponse('Sure! Here is my pick: {"userId":"u1","rationale":"Most consistent."} — done.', ALLOWED)?.userId,
        'u1',
        'surrounding prose tolerated'
    );
});

test('parseHeroAiResponse rejects anything outside the allow-list', () => {
    assert.equal(parseHeroAiResponse('{"userId":"u9","rationale":"Nope."}', ALLOWED), null, 'unknown id');
    assert.equal(parseHeroAiResponse('{"rationale":"Forgot the id."}', ALLOWED), null, 'missing userId');
    assert.equal(parseHeroAiResponse('not json at all', ALLOWED), null, 'non-JSON');
    assert.equal(parseHeroAiResponse('', ALLOWED), null, 'empty answer');
    assert.equal(parseHeroAiResponse('{"userId":"u1","rationale":"x"}', []), null, 'empty allow-list');
    assert.equal(parseHeroAiResponse(null, ALLOWED), null, 'null answer');
});

test('parseHeroAiResponse fills a default rationale and truncates long ones', () => {
    const noRationale = parseHeroAiResponse('{"userId":"u1"}', ALLOWED);
    assert.equal(noRationale.userId, 'u1');
    assert.ok(noRationale.rationale.length > 0, 'default rationale provided');

    const long = parseHeroAiResponse(`{"userId":"u1","rationale":"${'word '.repeat(80)}"}`, ALLOWED);
    assert.ok(long.rationale.length <= 200, 'rationale capped at 200 chars');
});

test('parseHeroAiResponse handles braces inside string values', () => {
    const tricky = parseHeroAiResponse('{"userId":"u2","rationale":"Lifted the team {with care} daily."}', ALLOWED);
    assert.equal(tricky.userId, 'u2', 'balanced-brace scan ignores braces in strings');
    assert.match(tricky.rationale, /\{with care\}/, 'rationale preserved verbatim');
});

// ── provider mirror parity ──

test('HERO_PROMPT + mode hero exist in both provider mirrors', () => {
    for (const file of ['../../api/_ai-provider.js', '../../api/_ai-provider.cjs']) {
        const src = read(file);
        assert.match(src, /const HERO_PROMPT = `/, `${file} defines HERO_PROMPT`);
        assert.match(src, /mode === 'hero'/, `${file} branches on mode hero`);
        assert.match(src, /systemPrompt = HERO_PROMPT/, `${file} swaps in HERO_PROMPT`);
        assert.match(src, /Eligible hero candidates \(JSON\)/, `${file} builds the candidates prompt`);
    }
    const cjs = read('../../api/_ai-provider.cjs');
    assert.match(cjs, /HERO_PROMPT \}/, '.cjs exports HERO_PROMPT');
});
