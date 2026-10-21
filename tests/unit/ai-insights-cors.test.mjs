import { test } from 'node:test';
import assert from 'node:assert/strict';

import handler from '../../api/_ai-insights.js';

function mockResponse() {
    return {
        headers: {},
        statusCode: null,
        ended: false,
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.statusCode = code; return this; },
        end() { this.ended = true; return this; },
        json(body) { this.body = body; return this; }
    };
}

test('AI endpoint answers allowed browser preflight before method validation', async () => {
    const res = mockResponse();
    await handler({
        method: 'OPTIONS',
        headers: { origin: 'https://staff.crwi.org.in' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.ended, true);
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://staff.crwi.org.in');
    assert.equal(res.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});
