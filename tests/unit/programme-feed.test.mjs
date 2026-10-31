import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
import { programmeToday, addProgrammeDays } from '../../js/utils/programmes.js';
const require = createRequire(import.meta.url);
process.env.CALENDAR_FEED_SECRET = 'local-programme-feed-test-only';
const date = programmeToday();
const programme = { title: 'Permitted programme', startDate: date, endDate: addProgrammeDays(date, 2), allDay: true, audience: 'selected', participantIds: ['staff'], status: 'scheduled' };
let rows = [programme, { ...programme, title: 'Private outsider programme', participantIds: ['other'] }, { ...programme, title: 'Cancelled programme', audience: 'all', status: 'cancelled' }];
const db = { collection(name) { const query = {
    where() { return query; }, limit() { return query; },
    doc() { return { get: async () => ({ data: () => ({ name: 'Staff', permissions: {}, employmentStatus: 'active' }) }) }; },
    get: async () => ({ docs: name === 'programmes' ? rows.map((row, i) => ({ id: 'programme-' + i, data: () => row })) : [] })
}; return query; } };
const path = require.resolve('../../api/_firebase-admin.js');
require.cache[path] = { id: path, filename: path, loaded: true, exports: { getDb: () => db } };
const feed = require('../../api/_calendar-feed.js');
function token() { const payload = JSON.stringify({ userId: 'staff', exp: Date.now() + 10000 }); return Buffer.from(payload + '.' + createHmac('sha256', process.env.CALENDAR_FEED_SECRET).update(payload).digest('base64url')).toString('base64url'); }
async function exportFeed() { const res = { statusCode: 200, setHeader() {}, end(text) { this.text = text; } }; await feed({ method: 'GET', query: { token: token() } }, res); return res; }
test('actual Outlook feed includes only permitted active programmes with exclusive multi-day ends', async () => {
    let result = await exportFeed(); assert.equal(result.statusCode, 200);
    assert.match(result.text, /Permitted programme/); assert.doesNotMatch(result.text, /Private outsider programme|Cancelled programme/);
    assert.ok(result.text.includes('DTEND;VALUE=DATE:' + addProgrammeDays(date, 3).replaceAll('-', '')));
    rows = [{ ...programme, status: 'cancelled' }]; result = await exportFeed(); assert.doesNotMatch(result.text, /SUMMARY:Permitted programme/);
});
