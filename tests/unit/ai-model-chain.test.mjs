import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');

function extractChain(src, file) {
    const m = src.match(/const DEFAULT_MODEL_CHAIN = \[([\s\S]*?)\]/);
    assert.ok(m, `${file} must declare DEFAULT_MODEL_CHAIN`);
    const models = [...m[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((x) => x[1] || x[2]);
    assert.ok(models.length >= 2, `${file} chain must have >= 2 models`);
    return models;
}

test('ESM and CJS mirrors declare the same DEFAULT_MODEL_CHAIN', async () => {
    const js = extractChain(await read('../../api/_ai-provider.js'), '_ai-provider.js');
    const cjs = extractChain(await read('../../api/_ai-provider.cjs'), '_ai-provider.cjs');
    assert.deepEqual(js, cjs, 'vite dev (.cjs) and serverless (.js) must never drift');
});

test('chain contains no known-dead OpenRouter slugs (404 regression)', async () => {
    const models = extractChain(await read('../../api/_ai-provider.js'), '_ai-provider.js');
    const dead = [
        'mistralai/mistral-7b-instruct:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-2-9b-it:free',
        // Probed dead/unusable 2026-10-02: no-status failures, 403, ~38s queue.
        'inclusionai/ling-3.0-flash-sante:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'thinkingmachines/inkling:free',
        'nvidia/nemotron-3-ultra-550b-a55b:free'
    ];
    for (const d of dead) {
        assert.ok(!models.includes(d), `dead slug must not be in chain: ${d}`);
    }
});

test('every chain entry is a well-formed model slug', async () => {
    for (const file of ['../../api/_ai-provider.js', '../../api/_ai-provider.cjs']) {
        const models = extractChain(await read(file), file);
        for (const m of models) {
            assert.ok(m.includes('/'), `${file}: "${m}" needs provider/model shape`);
            assert.ok(!/\s/.test(m), `${file}: "${m}" must not contain whitespace`);
        }
    }
});
