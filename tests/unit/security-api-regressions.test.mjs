import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createFirestoreMock } from '../helpers/firestore-mock.mjs';
import { currentHeroPeriod } from '../../api/_hero-ranking.js';
const require = createRequire(import.meta.url);
let db, uid, revoked, revocationChecks;
const admin = { auth: () => ({ verifyIdToken: async (_token, checkRevoked) => {
    revocationChecks.push(checkRevoked);
    if (revoked && checkRevoked) throw new Error('revoked');
    return { uid };
} }) };
const helper = require.resolve('../../api/_firebase-admin.js');
require.cache[helper] = { id: helper, filename: helper, loaded: true, exports: { getDb: () => db, getAdmin: () => admin } };
const { default: insights } = await import('../../api/_ai-insights.js');
const { default: hero } = await import('../../api/_hero-select.js');
const webhook = require('../../api/_telegram-webhook.js');
const call = async (handler, body, extra = {}) => {
    let code = 200, result;
    const res = { setHeader() {}, status(value) { code = value; return this; },
        json(value) { result = value; return this; },
        end(value) { if (value) result = JSON.parse(value); return this; },
        get statusCode() { return code; }, set statusCode(value) { code = value; } };
    await handler({ method: 'POST', headers: { origin: 'https://staff.crwi.org.in', authorization: 'Bearer fixture', ...extra.headers }, body }, res);
    return { code, result };
};
beforeEach(() => {
    uid = 'staff'; revoked = false; revocationChecks = [];
    db = createFirestoreMock({ users: { staff: { name: 'Staff', role: 'Employee' } }, hero_selections: {}, ai_usage: {} });
});

test('both AI routes reject revoked, former, inactive and missing accounts', async () => {
    for (const handler of [insights, hero]) {
        revoked = true;
        assert.equal((await call(handler, {})).code, 401);
        revoked = false;
        db._data.users.staff.employmentStatus = 'former';
        assert.equal((await call(handler, {})).code, 403);
        db._data.users.staff = { status: 'inactive' };
        assert.equal((await call(handler, {})).code, 403);
        delete db._data.users.staff;
        assert.equal((await call(handler, {})).code, 403);
        db._data.users.staff = { name: 'Staff' };
    }
    assert.ok(revocationChecks.every(value => value === true));
});

test('AI rejects conflicting stream modes before provider work while classification remains available', async () => {
    const keys = [process.env.OPENROUTER_API_KEY, process.env.XAI_API_KEY];
    delete process.env.OPENROUTER_API_KEY; delete process.env.XAI_API_KEY;
    try {
        for (const mode of ['classify', 'performance', 'tool_plan']) {
            assert.equal((await call(insights, { mode, stream: true, question: 'Bypass' })).code, 400);
        }
        for (const question of [['Bypass'], { text: 'Bypass' }, 42, true]) {
            assert.equal((await call(insights, { question, stream: true })).code, 400);
            assert.equal((await call(insights, { question })).code, 400);
        }
        const valid = await call(insights, { mode: 'classify', tasks: [{ id: 't', task: 'Prepare the report' }] });
        assert.equal(valid.code, 200);
        assert.equal(valid.result.classifications.length, 1);
    } finally {
        for (const [i, name] of ['OPENROUTER_API_KEY', 'XAI_API_KEY'].entries()) {
            if (keys[i] === undefined) delete process.env[name]; else process.env[name] = keys[i];
        }
    }
});

test('Hero ignores caller candidate omissions and preserves an existing shared pick', async () => {
    const { periodKey } = currentHeroPeriod();
    db._data.hero_selections[periodKey] = { userId: 'existing-winner', rationale: 'Existing reason', model: 'fixture' };
    const result = await call(hero, { periodKey, candidates: [{ id: 'attacker', score: 999999 }] });
    assert.equal(result.code, 200);
    assert.equal(result.result.pick.userId, 'existing-winner');
    assert.equal(result.result.source, 'stored');
    assert.equal((await call(hero, { periodKey: '2000-01-01_2000-01-07', candidates: [{ id: 'attacker' }] })).result.pick, null);
});

test('new Hero picks use trusted complete candidates and return the transaction winner', async () => {
    const period = currentHeroPeriod();
    db._data.users.a = { name: 'Alice', username: 'alice' };
    db._data.users.b = { name: 'Bea', username: 'bea' };
    db._data.attendance = {}; db._data.work_plans = {}; db._data.events = {}; db._data.settings = {};
    for (let index = 0; index < 7; index++) {
        const date = new Date(period.start + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + index);
        const key = date.toISOString().slice(0, 10);
        for (const user of ['a', 'b']) {
            db._data.attendance[`${user}_${index}`] = { user_id: user, date: key, type: 'Present', attendanceEligible: true, dayCredit: 1, durationMs: 28800000, checkIn: '09:00', checkOut: '17:00' };
            db._data.work_plans[`${user}_${index}`] = { userId: user, date: key, plans: [{ task: 'Trusted report', status: 'completed' }] };
        }
    }
    const keyBefore = process.env.OPENROUTER_API_KEY, xaiBefore = process.env.XAI_API_KEY;
    db._data.work_plans.a_0.plans.push({ isPrivate: true, task: 'PRIVATE LEGACY BODY MUST NOT REACH PROVIDER', assignedTo: 'a' });
    const fetchBefore = globalThis.fetch;
    process.env.OPENROUTER_API_KEY = 'fixture-provider-key'; delete process.env.XAI_API_KEY;
    let calls = 0;
    globalThis.fetch = async (url, options) => {
        assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
        calls++;
        const messages = JSON.parse(options.body).messages;
        const prompt = messages.find(message => message.role === 'user').content;
        const sent = JSON.parse(prompt.slice(prompt.indexOf('{')));
        assert.ok(!prompt.includes('PRIVATE LEGACY BODY'));
        assert.deepEqual(sent.candidates.map(candidate => candidate.id).sort(), ['a', 'b']);
        assert.ok(sent.candidates.every(candidate => candidate.score < 1000));
        return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ userId: 'a', rationale: 'Fixture reason' }) } }] }) };
    };
    const transaction = db.runTransaction.bind(db);
    db.runTransaction = async callback => {
        db._data.hero_selections[period.periodKey] = { userId: 'b', rationale: 'Already selected concurrently', model: 'fixture' };
        return transaction(callback);
    };
    try {
        const result = await call(hero, { periodKey: period.periodKey, candidates: [{ id: 'attacker', score: 999999, digest: 'Fake evidence' }] });
        assert.equal(calls, 1, JSON.stringify(result));
        assert.equal(result.result.pick.userId, 'b');
        assert.equal(result.result.source, 'stored');
        assert.equal(db._data.hero_selections[period.periodKey].userId, 'b');
    } finally {
        globalThis.fetch = fetchBefore;
        if (keyBefore === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = keyBefore;
        if (xaiBefore === undefined) delete process.env.XAI_API_KEY; else process.env.XAI_API_KEY = xaiBefore;
    }
});

test('real Telegram commands use canonical profile identity despite a forged stored id', async () => {
    db._data.users = {
        staff: { id: 'victim', name: 'Staff', telegramChatId: '123', status: 'out' },
        victim: { name: 'Victim', status: 'out' }
    };
    db._data.attendance = {}; db._data.daily_standups = {}; db._data.leaves = {};
    const fetchBefore = globalThis.fetch;
    const secretBefore = process.env.TELEGRAM_WEBHOOK_SECRET, tokenBefore = process.env.TELEGRAM_BOT_TOKEN;
    process.env.TELEGRAM_WEBHOOK_SECRET = 'fixture-webhook-secret';
    process.env.TELEGRAM_BOT_TOKEN = 'fixture-bot-token';
    globalThis.fetch = async url => {
        assert.ok(String(url).startsWith('https://api.telegram.org/'));
        return { ok: true, json: async () => ({ ok: true }) };
    };
    try {
        const headers = { 'x-telegram-bot-api-secret-token': 'fixture-webhook-secret' };
        assert.equal((await call(webhook, { message: { chat: { id: 123 }, from: {}, text: 'IN' } }, { headers })).code, 200);
        assert.equal(db._data.users.staff.status, 'in');
        assert.equal(db._data.users.victim.status, 'out');
        assert.ok(Object.values(db._data.attendance).every(row => row.user_id === 'staff'));
        await call(webhook, { message: { chat: { id: 123 }, from: {}, text: 'My standup' } }, { headers });
        assert.ok(Object.values(db._data.daily_standups).every(row => row.userId === 'staff'));
        assert.equal(Object.values(db._data.daily_standups).length, 1);
    } finally {
        globalThis.fetch = fetchBefore;
        if (secretBefore === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET; else process.env.TELEGRAM_WEBHOOK_SECRET = secretBefore;
        if (tokenBefore === undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN = tokenBefore;
    }
});
