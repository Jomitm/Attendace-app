// tests/unit/ai-chat-memory.test.mjs
// Unit tests for the CRWI Assistant session chat memory (js/modules/ai-chat-memory.js)

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser-ish globals before importing the module.
class FakeStorage {
    constructor() { this.map = new Map(); }
    getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
    setItem(k, v) { this.map.set(k, String(v)); }
    removeItem(k) { this.map.delete(k); }
    clear() { this.map.clear(); }
}

globalThis.window = {
    AppAuth: {
        getUser: () => ({ id: 'u_test' }),
        logout: async () => 'logged-out'
    }
};
globalThis.sessionStorage = new FakeStorage();

const memory = await import('../../js/modules/ai-chat-memory.js');

beforeEach(() => {
    sessionStorage.clear();
});

test('chat memory starts empty and returns plain copies', () => {
    assert.deepEqual(memory.getHistory(), []);
});

test('addExchange records user+assistant pairs', () => {
    memory.addExchange('What did I miss?', '### Fact\nNothing.');
    memory.addExchange('Show overdue tasks', '### Fact\nNone.');
    const h = memory.getHistory();
    assert.equal(h.length, 4);
    assert.equal(h[0].role, 'user');
    assert.equal(h[0].content, 'What did I miss?');
    assert.equal(h[1].role, 'assistant');
    assert.equal(h[3].content, '### Fact\nNone.');
});

test('history is capped at the last 12 exchanges (24 messages)', () => {
    for (let i = 0; i < 20; i++) {
        memory.addExchange(`q${i}`, `a${i}`);
    }
    const h = memory.getHistory();
    assert.equal(h.length, 24);
    assert.equal(h[0].content, 'q8');
    assert.equal(h[h.length - 1].content, 'a19');
});

test('long texts are trimmed to 500 chars', () => {
    const long = 'x'.repeat(2000);
    memory.addExchange(long, long);
    const h = memory.getHistory();
    assert.equal(h[0].content.length, 500);
    assert.equal(h[1].content.length, 500);
});

test('sanitizeForServer drops invalid roles and empty content', () => {
    memory.addExchange('q1', 'a1');
    const sanitized = memory.sanitizeForServer([
        { role: 'system', content: 'hack' },
        { role: 'user', content: '' },
        null,
        { role: 'user', content: 'q1' },
        { role: 'assistant', content: 'a1' },
        { role: 'user', content: 'q2' }
    ]);
    assert.deepEqual(sanitized, [
        { role: 'user', content: 'q1' },
        { role: 'assistant', content: 'a1' },
        { role: 'user', content: 'q2' }
    ]);
});

test('sanitizeForServer handles non-array input', () => {
    assert.deepEqual(memory.sanitizeForServer(null), []);
    assert.deepEqual(memory.sanitizeForServer('nope'), []);
});

test('clearChat wipes the per-user memory', () => {
    memory.addExchange('q', 'a');
    assert.equal(memory.getHistory().length, 2);
    memory.clearChat();
    assert.deepEqual(memory.getHistory(), []);
});

test('memory is keyed per user', async () => {
    memory.addExchange('q1', 'a1');
    window.AppAuth.getUser = () => ({ id: 'u_other' });
    assert.deepEqual(memory.getHistory(), [], 'other user should have empty memory');
    window.AppAuth.getUser = () => ({ id: 'u_test' });
    assert.equal(memory.getHistory().length, 2, 'original user memory intact');
});

test('logout hook clears chat memory', async () => {
    memory.addExchange('q', 'a');
    assert.equal(memory.getHistory().length, 2);
    const result = await window.AppAuth.logout();
    assert.equal(result, 'logged-out');
    assert.deepEqual(memory.getHistory(), []);
});
