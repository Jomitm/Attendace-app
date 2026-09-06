/**
 * Dashboard Skeleton Loading Components
 * Provides shimmer placeholder skeletons for dashboard cards during data fetch.
 */

const SKELETON_BASE = 'background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; border-radius: 8px;';

const SKELETON_KEYFRAMES = `
@keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
.skeleton-card { padding: 1.25rem; border-radius: 16px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.skeleton-line { height: 14px; margin-bottom: 10px; ${SKELETON_BASE} }
.skeleton-line.sm { width: 40%; height: 10px; }
.skeleton-line.md { width: 65%; }
.skeleton-line.lg { width: 85%; }
.skeleton-line.full { width: 100%; }
.skeleton-circle { border-radius: 50%; ${SKELETON_BASE} }
.skeleton-rect { border-radius: 8px; ${SKELETON_BASE} }
.dashboard-load-status { display: flex; align-items: center; gap: 0.85rem; padding: 0.9rem 1.1rem; border-radius: 16px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
.dashboard-load-spinner { width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #3f63a8; animation: dashboard-load-spin 0.9s linear infinite; }
@keyframes dashboard-load-spin { to { transform: rotate(360deg); } }
.dashboard-load-status-copy { flex: 1; min-width: 0; }
.dashboard-load-status-title { font-weight: 800; font-size: 0.95rem; color: #1c2430; }
.dashboard-load-status-text { font-size: 0.82rem; color: #6b7a90; margin-top: 2px; }
.dashboard-load-progress { height: 5px; border-radius: 999px; background: #eef2f7; margin-top: 0.5rem; overflow: hidden; }
#dashboard-load-progress-fill { height: 100%; width: 0%; border-radius: 999px; background: linear-gradient(90deg, #3f63a8, #6fb14a); transition: width 0.3s ease; }
.dashboard-load-status-count { flex-shrink: 0; font-size: 0.75rem; font-weight: 700; color: #6b7a90; }
`;

let _skeletonStyleInjected = false;
function ensureSkeletonStyles() {
    if (_skeletonStyleInjected) return;
    _skeletonStyleInjected = true;
    const style = document.createElement('style');
    style.textContent = SKELETON_KEYFRAMES;
    document.head.appendChild(style);
}

export function renderCheckinSkeleton() {
    ensureSkeletonStyles();
    return `
    <div class="skeleton-card" style="display:flex; align-items:center; gap:1rem; padding:1.5rem;">
        <div class="skeleton-circle" style="width:56px; height:56px; flex-shrink:0;"></div>
        <div style="flex:1;">
            <div class="skeleton-line lg"></div>
            <div class="skeleton-line sm"></div>
        </div>
        <div style="display:flex; gap:0.5rem;">
            <div class="skeleton-rect" style="width:80px; height:36px;"></div>
            <div class="skeleton-rect" style="width:80px; height:36px;"></div>
        </div>
    </div>`;
}

export function renderWorklogSkeleton() {
    ensureSkeletonStyles();
    return `
    <div class="skeleton-card">
        <div class="skeleton-line md" style="margin-bottom:16px;"></div>
        ${Array.from({ length: 4 }, () => `
        <div style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid #f1f5f9;">
            <div class="skeleton-circle" style="width:10px; height:10px; flex-shrink:0;"></div>
            <div style="flex:1;">
                <div class="skeleton-line full"></div>
                <div class="skeleton-line sm"></div>
            </div>
            <div class="skeleton-rect" style="width:60px; height:24px;"></div>
        </div>`).join('')}
    </div>`;
}

export function renderHeroSkeleton() {
    ensureSkeletonStyles();
    return `
    <div class="skeleton-card" style="text-align:center; padding:2rem;">
        <div class="skeleton-circle" style="width:72px; height:72px; margin:0 auto 1rem;"></div>
        <div class="skeleton-line md" style="margin:0 auto 8px;"></div>
        <div class="skeleton-line sm" style="margin:0 auto 16px;"></div>
        <div style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;">
            ${Array.from({ length: 3 }, () => `<div class="skeleton-rect" style="width:80px; height:48px;"></div>`).join('')}
        </div>
    </div>`;
}

export function renderActivitySkeleton() {
    ensureSkeletonStyles();
    return `
    <div class="skeleton-card">
        <div class="skeleton-line md" style="margin-bottom:16px;"></div>
        ${Array.from({ length: 5 }, () => `
        <div style="display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid #f1f5f9;">
            <div class="skeleton-rect" style="width:10px; height:10px;"></div>
            <div style="flex:1;">
                <div class="skeleton-line lg"></div>
                <div class="skeleton-line sm"></div>
            </div>
            <div class="skeleton-line sm" style="width:50px;"></div>
        </div>`).join('')}
    </div>`;
}

export function renderLeaveSkeleton() {
    ensureSkeletonStyles();
    return `
    <div class="skeleton-card">
        <div class="skeleton-line md" style="margin-bottom:16px;"></div>
        ${Array.from({ length: 3 }, () => `
        <div style="padding:0.75rem 0; border-bottom:1px solid #f1f5f9;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="skeleton-line lg" style="width:50%; margin-bottom:6px;"></div>
                <div class="skeleton-rect" style="width:64px; height:22px;"></div>
            </div>
            <div class="skeleton-line sm"></div>
        </div>`).join('')}
    </div>`;
}

export function renderStatsSkeleton() {
    ensureSkeletonStyles();
    return `
    <div class="skeleton-card">
        <div class="skeleton-line md" style="margin-bottom:16px;"></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            ${Array.from({ length: 6 }, () => `
            <div>
                <div class="skeleton-line sm" style="width:60%; margin-bottom:4px;"></div>
                <div class="skeleton-line" style="width:40%; height:20px;"></div>
            </div>`).join('')}
        </div>
    </div>`;
}

export function renderDashboardSkeletons() {
    ensureSkeletonStyles();
    return `
    <div style="display:grid; gap:1rem; padding:1rem;">
        <div class="dashboard-load-status" role="status" aria-live="polite">
            <span class="dashboard-load-spinner" aria-hidden="true"></span>
            <div class="dashboard-load-status-copy">
                <div class="dashboard-load-status-title">Getting your dashboard ready…</div>
                <div id="dashboard-load-status-text" class="dashboard-load-status-text">Connecting…</div>
                <div class="dashboard-load-progress" aria-hidden="true"><div id="dashboard-load-progress-fill"></div></div>
            </div>
            <div id="dashboard-load-status-count" class="dashboard-load-status-count"></div>
        </div>
        ${renderCheckinSkeleton()}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            ${renderWorklogSkeleton()}
            ${renderStatsSkeleton()}
        </div>
        ${renderHeroSkeleton()}
        ${renderActivitySkeleton()}
    </div>`;
}
