import { test } from 'node:test';
import assert from 'node:assert/strict';

const { postStream } = await import('../../js/ui/helpers.js');

test('postStream reports rule-based source when X-AI-Source header present', async () => {
    globalThis.fetch = async () => new Response('fixed answer', {
        status: 200,
        headers: { 'X-AI-Source': 'rule-based' }
    });
    const r = await postStream('/api/ai-insights', { question: 'hi' });
    assert.equal(r.text, 'fixed answer');
    assert.equal(r.source, 'rule-based');
});

test('postStream defaults to ai source when header absent', async () => {
    globalThis.fetch = async () => new Response('live answer', { status: 200 });
    const r = await postStream('/api/ai-insights', { question: 'hi' });
    assert.equal(r.text, 'live answer');
    assert.equal(r.source, 'ai');
});

test('postStream still fires onDelta and reports source', async () => {
    globalThis.fetch = async () => new Response('streamed', {
        status: 200,
        headers: { 'X-AI-Source': 'rule-based' }
    });
    const chunks = [];
    const r = await postStream('/api/ai-insights', {}, { onDelta: (c) => chunks.push(c) });
    assert.ok(chunks.length >= 1, 'onDelta must fire');
    assert.equal(r.source, 'rule-based');
});

test('postStream throws on HTTP error (offline path)', async () => {
    globalThis.fetch = async () => new Response('nope', { status: 503 });
    await assert.rejects(() => postStream('/api/ai-insights', {}), /HTTP 503/);
});
