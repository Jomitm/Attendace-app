// Short-lived, account-bound display preview for return navigation.
// Fresh reads still run; this is never an authority for writes or permissions.
let saved = null;
let revision = 0;
export function dashboardPreviewRevision() { return revision; }
export function dashboardPreviewKey() {
    const user = window.AppAuth?.getUser?.();
    if (!user?.id) return '';
    const date = window.AppDB?.getISTDateKeys?.().todayKey || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    return JSON.stringify([window.AppFirebaseAuth?.currentUser?.uid || user.id, user.id, user.isAdmin, user.role, user.permissions,
        user.employmentStatus, user.status, user.isPaused, user.lastCheckIn, user.pauseStartedAt, window.app_selectedSummaryStaffId || user.id, date]);
}
export function clearDashboardPreview() { saved = null; revision++; }
export function rememberDashboardPreview(page) {
    const root = page?.querySelector?.('.dashboard-staff-view');
    const key = dashboardPreviewKey();
    if (!root) return;
    if (!key || root.getAttribute('data-dashboard-preview-key') !== key) { console.debug('Dashboard preview: context changed'); return; }
    if (root.getAttribute('data-dashboard-preview-revision') !== String(revision)) { console.debug('Dashboard preview: data invalidated'); return; }
    // Listener markers cannot survive serialization: the restored elements
    // are new nodes and setup must bind their handlers again.
    saved = { key, revision, html: page.innerHTML.replace(/\sdata-(?:bound|hero-bound)="1"/g, ''), expiresAt: Date.now() + 60000 };
    console.debug('Dashboard preview: captured');
}
export function readDashboardPreview() {
    const key = dashboardPreviewKey();
    return saved && key && saved.key === key && saved.revision === revision && saved.expiresAt > Date.now() ? saved.html : '';
}
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('app:db-write', clearDashboardPreview);
    window.addEventListener('app:staff-employment-changed', clearDashboardPreview);
}
