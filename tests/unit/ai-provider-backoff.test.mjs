//! /tests/unit/ai-provider-backoff.test.mjs
// Rate-limit backoff for the model fallback chain (api/_ai-provider.js):
//   1. isTransientFailure classifies retryable vs permanent failures.
//   2. ESM and CJS mirrors declare the same RETRY_DELAY_MS + RETRYABLE_STATUS
//      (vite dev loads the .cjs — drift would change prod/dev behavior).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { isTransientFailure } =
    await import('../../api/_ai-provider.js');

const errWithStatus = (status) => {
    const e = new Error(`HTTP ${status}: boom`);
    e.status = status;
    return e;
};

test('429 and 5xx are transient', () => {
    for (const s of [429, 500, 502, 503, 504, 408]) {
        assert.equal(isTransientFailure(errWithStatus(s)), true, `HTTP ${s} should wait`);
    }
});

test('401/403/404 fail fast with no wait', () => {
    for (const s of [400, 401, 403, 404]) {
        assert.equal(isTransientFailure(errWithStatus(s)), false, `HTTP ${s} must not wait`);
    }
});

test('classify-style errors without status property are parsed from message', () => {
    assert.equal(isTransientFailure(new Error('HTTP 429: rate limited')), true);
    assert.equal(isTransientFailure(new Error('HTTP 404: no endpoints')), false);
});

test('timeouts and network failures wait; null never waits', () => {
    const abort = new Error('The operation was aborted');
    abort.name = 'AbortError';
    assert.equal(isTransientFailure(abort), true);
    assert.equal(isTransientFailure(new Error('socket hang up')), true);
    assert.equal(isTransientFailure(null), false);
    assert.equal(isTransientFailure(undefined), false);
});

test('ESM and CJS mirrors declare the same backoff constants', async () => {
    const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
    const grab = (src, file) => {
        const d = src.match(/const RETRY_DELAY_MS\s*=\s*(\d+)/);
        const s = src.match(/const RETRYABLE_STATUS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
        assert.ok(d, `${file} must declare RETRY_DELAY_MS`);
        assert.ok(s, `${file} must declare RETRYABLE_STATUS`);
        return d[1] + '|' + s[1].replace(/\s+/g, '');
    };
    const js = grab(await read('../../api/_ai-provider.js'), '_ai-provider.js');
    const cjs = grab(await read('../../api/_ai-provider.cjs'), '_ai-provider.cjs');
    assert.equal(js, cjs, 'backoff constants must never drift between mirrors');
});
