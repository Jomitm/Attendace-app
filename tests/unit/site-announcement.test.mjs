import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const { normalizeAnnouncement, isWithinDateRange } = await import('../../js/ui/site-announcement.js');

describe('Site Announcement - normalizeAnnouncement', () => {
    it('normalizes a minimal announcement', () => {
        const result = normalizeAnnouncement({ title: 'Test', message: 'Hello' });
        assert.strictEqual(result.title, 'Test');
        assert.strictEqual(result.message, 'Hello');
        assert.ok(result.id, 'should generate an id');
        assert.strictEqual(result.version, 1);
        assert.strictEqual(result.order, 0);
        assert.strictEqual(result.enabled, false);
        assert.strictEqual(result.ctaLabel, 'Open Link');
        assert.strictEqual(result.ctaUrl, '');
        assert.strictEqual(result.startDate, '');
        assert.strictEqual(result.endDate, '');
    });

    it('preserves provided fields', () => {
        const result = normalizeAnnouncement({
            id: 'abc', title: 'My Title', message: 'My msg',
            enabled: true, startDate: '2026-01-01', endDate: '2026-12-31',
            order: 5, version: 3
        });
        assert.strictEqual(result.id, 'abc');
        assert.strictEqual(result.title, 'My Title');
        assert.strictEqual(result.enabled, true);
        assert.strictEqual(result.startDate, '2026-01-01');
        assert.strictEqual(result.endDate, '2026-12-31');
        assert.strictEqual(result.order, 5);
        assert.strictEqual(result.version, 3);
    });

    it('defaults missing title to Announcement', () => {
        const result = normalizeAnnouncement({ message: 'Hi' });
        assert.strictEqual(result.title, 'Announcement');
    });

    it('normalizes version to minimum 1', () => {
        const result = normalizeAnnouncement({ version: 0 });
        assert.strictEqual(result.version, 1);
        const result2 = normalizeAnnouncement({ version: '5' });
        assert.strictEqual(result2.version, 5);
    });

    it('strips dates to YYYY-MM-DD', () => {
        const result = normalizeAnnouncement({ startDate: '2026-06-15T10:00:00Z' });
        assert.strictEqual(result.startDate, '2026-06-15');
    });
});

describe('Site Announcement - isWithinDateRange', () => {
    it('returns true when no dates set', () => {
        assert.strictEqual(isWithinDateRange({ startDate: '', endDate: '' }), true);
    });

    it('returns true when today is at or after startDate', () => {
        const today = new Date().toISOString().slice(0, 10);
        assert.strictEqual(isWithinDateRange({ startDate: today, endDate: '' }), true);
    });

    it('returns false when today is before startDate', () => {
        assert.strictEqual(isWithinDateRange({ startDate: '2099-01-01', endDate: '' }), false);
    });

    it('returns false when today is after endDate', () => {
        assert.strictEqual(isWithinDateRange({ startDate: '', endDate: '2000-01-01' }), false);
    });
});