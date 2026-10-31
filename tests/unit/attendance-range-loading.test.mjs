import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AttendanceService } from '../../js/services/attendance-service.js';

test('empty attendance periods do not download everybody’s history', async () => {
    const saved = globalThis.window;
    const calls = [];
    globalThis.window = { AppDB: {
        queryMany: async () => { throw new Error('Expected the strict query'); },
        queryManyStrict: async (...args) => { calls.push(args); return []; },
        getAll: async () => { throw new Error('Unexpected full-history read'); }
    } };
    try {
        const service = new AttendanceService();
        assert.deepEqual(await service.getByDateRange('2026-10-01', '2026-10-31'), []);
        assert.deepEqual(await service.getByDate('2026-10-31'), []);
        assert.equal(calls.length, 2);
        window.AppDB.queryManyStrict = async () => { throw new Error('Unavailable'); };
        await assert.rejects(service.getByDateRange('2026-10-01', '2026-10-31'), /Unavailable/);
        await assert.rejects(service.getByDate('2026-10-31'), /Unavailable/);
    } finally { globalThis.window = saved; }
});
