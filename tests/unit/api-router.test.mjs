// tests/unit/api-router.test.mjs
// Vercel Hobby plan caps deployments at 12 serverless functions. The whole
// /api surface is served by api/index.js (the only counted function) with
// every endpoint moved to an underscore-prefixed file (underscore files are
// not counted by Vercel). These tests pin:
//   1. The route map matches the full endpoint set (nothing dropped).
//   2. Every route has its underscore handler file on disk.
//   3. No stray non-underscore handler exists in api/ (would break the
//      function-count limit on the next deploy).
//   4. resolveRoute() handles canonical paths, rewritten query form,
//      trailing slashes, and rejects query-string route hijacking.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const apiDir = join(root, 'api');

const EXPECTED_ROUTES = [
    'ai-briefing',
    'ai-insights',
    'auth-login',
    'auth-set-password',
    'calendar-feed',
    'calendar-token',
    'feast-proxy',
    'hero-select',
    'telegram-generate-link',
    'telegram-register-webhook',
    'telegram-scheduler',
    'telegram-send',
    'telegram-webhook'
];

const { ROUTES, resolveRoute } = await import('../../api/index.js');

test('ROUTES exposes exactly the deployed endpoint set', () => {
    assert.deepEqual(Object.keys(ROUTES).sort(), [...EXPECTED_ROUTES].sort());
    for (const [name, fn] of Object.entries(ROUTES)) {
        assert.equal(typeof fn, 'function', `${name} handler must be a function`);
    }
});

test('every route has an underscore-prefixed handler file', () => {
    for (const route of EXPECTED_ROUTES) {
        assert.ok(
            existsSync(join(apiDir, `_${route}.js`)),
            `missing api/_${route}.js for route "${route}"`
        );
    }
});

test('api/ has no stray counted function files (Vercel Hobby 12-fn limit)', () => {
    const strays = readdirSync(apiDir).filter(
        (file) => file.endsWith('.js') && !file.startsWith('_') && file !== 'index.js'
    );
    assert.deepEqual(strays, [], `unexpected function files: ${strays.join(', ')}`);
});

test('resolveRoute: canonical path with query', () => {
    assert.deepEqual(resolveRoute('/api/calendar-feed?token=abc&x=1'), {
        route: 'calendar-feed',
        query: 'token=abc&x=1'
    });
});

test('resolveRoute: rewritten form carries the route query param', () => {
    assert.deepEqual(resolveRoute('/api/index?route=telegram-scheduler&task=absentee'), {
        route: 'telegram-scheduler',
        query: 'task=absentee'
    });
});

test('resolveRoute: path form without query', () => {
    assert.deepEqual(resolveRoute('/api/auth-login'), { route: 'auth-login', query: '' });
});

test('resolveRoute: trailing slash still resolves', () => {
    assert.deepEqual(resolveRoute('/api/auth-login/'), { route: 'auth-login', query: '' });
});

test('resolveRoute: query-string route cannot hijack a real path', () => {
    assert.deepEqual(resolveRoute('/api/auth-login?route=telegram-send'), {
        route: 'auth-login',
        query: ''
    });
});

test('resolveRoute: unknown or empty paths resolve to no route', () => {
    assert.deepEqual(resolveRoute('/'), { route: '', query: '' });
    assert.deepEqual(resolveRoute('/api'), { route: '', query: '' });
    assert.deepEqual(resolveRoute('/api/index'), { route: '', query: '' });
    assert.deepEqual(resolveRoute(undefined), { route: '', query: '' });
});
