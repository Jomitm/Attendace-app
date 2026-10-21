import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planToolAction } from '../../api/_ai-provider.js';

async function withProviderResponse(content, run) {
    const previousKey = process.env.OPENROUTER_API_KEY;
    const previousChain = process.env.AI_MODEL_CHAIN;
    const previousFetch = global.fetch;
    process.env.OPENROUTER_API_KEY = 'unit-test-key';
    process.env.AI_MODEL_CHAIN = 'unit/test-model';
    global.fetch = async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content } }] })
    });
    try {
        return await run();
    } finally {
        if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
        else process.env.OPENROUTER_API_KEY = previousKey;
        if (previousChain === undefined) delete process.env.AI_MODEL_CHAIN;
        else process.env.AI_MODEL_CHAIN = previousChain;
        global.fetch = previousFetch;
    }
}

test('tool planner rejects impossible calendar dates', async () => {
    const plan = await withProviderResponse(
        '{"action":"add_task","task":"Write report","date":"2026-02-31"}',
        () => planToolAction({ text: 'add report', today: '2026-02-01' })
    );
    assert.equal(plan, null);
});

test('tool planner rejects an explicitly empty date', async () => {
    const plan = await withProviderResponse(
        '{"action":"add_task","task":"Write report","date":""}',
        () => planToolAction({ text: 'add report', today: '2026-02-01' })
    );
    assert.equal(plan, null);
});

test('tool planner accepts valid leap day dates', async () => {
    const plan = await withProviderResponse(
        '{"action":"add_task","task":"Write report","date":"2028-02-29"}',
        () => planToolAction({ text: 'add report', today: '2028-02-01' })
    );
    assert.deepEqual(plan, { action: 'add_task', task: 'Write report', date: '2028-02-29' });
});
