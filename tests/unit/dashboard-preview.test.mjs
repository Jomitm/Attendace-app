import { test } from 'node:test';
import assert from 'node:assert/strict';
let user = { id: 'self', role: 'Employee', permissions: {}, status: 'in' };
globalThis.window = { AppAuth: { getUser: () => user }, AppDB: { getISTDateKeys: () => ({ todayKey: '2026-10-31' }) }, addEventListener() {} };
const { dashboardPreviewKey, dashboardPreviewRevision, rememberDashboardPreview, readDashboardPreview, clearDashboardPreview } = await import('../../js/utils/dashboard-preview.js');
test('dashboard preview is account, permission, attendance-state and day bound', () => {
    clearDashboardPreview();
    const key = dashboardPreviewKey(), revision = String(dashboardPreviewRevision());
    const page = { innerHTML: '<div>Saved workday</div>', querySelector: () => ({ getAttribute: name => name.endsWith('revision') ? revision : key }) };
    rememberDashboardPreview(page); assert.equal(readDashboardPreview(), page.innerHTML);
    user = { ...user, id: 'other' }; assert.equal(readDashboardPreview(), '');
    user = { ...user, id: 'self', status: 'out' }; assert.equal(readDashboardPreview(), '');
    user = { ...user, status: 'in', permissions: { dashboard: 'admin' } }; assert.equal(readDashboardPreview(), '');
    user = { ...user, permissions: {} }; window.AppDB.getISTDateKeys = () => ({ todayKey: '2026-11-01' }); assert.equal(readDashboardPreview(), '');
});
test('a write invalidates the preview and an old mounted page cannot recreate it', () => {
    clearDashboardPreview();
    const key = dashboardPreviewKey(), revision = String(dashboardPreviewRevision());
    const page = { innerHTML: '<div>Old workday</div>', querySelector: () => ({ getAttribute: name => name.endsWith('revision') ? revision : key }) };
    rememberDashboardPreview(page); assert.ok(readDashboardPreview());
    clearDashboardPreview(); rememberDashboardPreview(page); assert.equal(readDashboardPreview(), '');
    user = null; assert.equal(readDashboardPreview(), '');
});
test('preview expires and serialized listener markers are removed for rebinding', () => {
    user = { id: 'self', role: 'Employee', permissions: {}, status: 'in' };
    clearDashboardPreview();
    const key = dashboardPreviewKey(), revision = String(dashboardPreviewRevision());
    rememberDashboardPreview({ innerHTML: '<div data-bound="1" data-hero-bound="1">Summary</div>', querySelector: () => ({ getAttribute: name => name.endsWith('revision') ? revision : key }) });
    assert.equal(readDashboardPreview(), '<div>Summary</div>');
    const now = Date.now;
    try { Date.now = () => now() + 61000; assert.equal(readDashboardPreview(), ''); }
    finally { Date.now = now; }
});
