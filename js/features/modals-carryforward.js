// Modal helpers & carry-forward issues.
// Extracted verbatim from js/app.js during the decomposition refactor.

import { escapeDialogHtml as app_escapeHtml, escapeJsSingleQuote as app_escapeJsSingleQuote } from '../utils/html-escape.js';

window.app_showModal = (html, id) => {
    const container = document.getElementById('modal-container');
    if (!container) return;
    // Remove existing modal with same ID if any
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    container.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById(id);
    if (modalEl && (modalEl.classList.contains('modal-overlay') || modalEl.classList.contains('modal'))) {
        const overlays = Array.from(document.querySelectorAll('.modal-overlay, .modal'))
            .filter(el => el !== modalEl);
        const maxZ = overlays.reduce((acc, el) => {
            const z = Number.parseInt(window.getComputedStyle(el).zIndex, 10);
            return Number.isFinite(z) ? Math.max(acc, z) : acc;
        }, 1000);
        modalEl.style.zIndex = String(maxZ + 2);
    }
};

// Opens a pre-rendered overlay modal (e.g. add-user-modal, leave-modal).
// Removes the gm-hidden guard class (which is !important) before showing.
// ALWAYS use this instead of setting style.display directly, or the modal
// stays hidden behind gm-hidden.
window.app_openModal = (id) => {
    const modal = typeof id === 'string' ? document.getElementById(id) : id;
    if (!modal) return;
    modal.classList.remove('gm-hidden');
    modal.style.display = 'flex';
};

window.app_renderCarryForwardIssues = function (sortKey = 'date-desc') {
    const issues = Array.isArray(window.app_carryForwardIssues) ? window.app_carryForwardIssues : [];
    const maxRows = 200;
    const safeSortKey = String(sortKey || 'date-desc');

    const sorted = [...issues].sort((a, b) => {
        if (safeSortKey === 'date-asc') return String(a.planDate || '').localeCompare(String(b.planDate || ''));
        if (safeSortKey === 'owner-asc') return String(a.planUserName || '').localeCompare(String(b.planUserName || '')) || String(b.planDate || '').localeCompare(String(a.planDate || ''));
        if (safeSortKey === 'owner-desc') return String(b.planUserName || '').localeCompare(String(a.planUserName || '')) || String(b.planDate || '').localeCompare(String(a.planDate || ''));
        if (safeSortKey === 'origin-asc') return String(a.originDate || '').localeCompare(String(b.originDate || ''));
        if (safeSortKey === 'origin-desc') return String(b.originDate || '').localeCompare(String(a.originDate || ''));
        return String(b.planDate || '').localeCompare(String(a.planDate || ''));
    });

    const rows = sorted.slice(0, maxRows).map((issue) => {
        const flags = [
            issue.ownerMismatch ? 'Owner mismatch' : '',
            issue.assignedMismatch ? 'Assigned mismatch' : '',
            issue.isAutoForwarded ? 'Auto-forwarded' : ''
        ].filter(Boolean).join(', ') || '—';
        return `
            <tr>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${app_escapeHtml(issue.planDate || '')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${app_escapeHtml(issue.planUserName || issue.planUserId || '')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${app_escapeHtml(issue.taskText || '')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${app_escapeHtml(issue.originDate || '')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${app_escapeHtml(issue.rootToken || '')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${app_escapeHtml(flags)}</td>
            </tr>
        `;
    }).join('');

    const summaryNote = issues.length > maxRows
        ? `<div style="font-size:0.8rem; color:#94a3b8;">Showing first ${maxRows} of ${issues.length} items.</div>`
        : `<div style="font-size:0.8rem; color:#94a3b8;">Total items: ${issues.length}.</div>`;

    const html = `
        <div class="modal-overlay" id="carryforward-issues-modal" style="display:flex;">
            <div class="modal-content" style="max-width:960px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                    <h3 style="margin:0;">Auto-Forward Issues</h3>
                    <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div style="font-size:0.85rem; color:#64748b; margin-bottom:0.6rem;">
                    These are carry-forward tasks that look assigned to the wrong staff or plan owner.
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.6rem; align-items:center; margin-bottom:0.6rem;">
                    <label style="font-size:0.8rem; color:#64748b;">Sort by</label>
                    <select id="carryforward-issues-sort" class="app-select" style="padding:6px 8px; border-radius:8px; border:1px solid #e2e8f0;">
                        <option value="date-desc" ${safeSortKey === 'date-desc' ? 'selected' : ''}>Date (Newest)</option>
                        <option value="date-asc" ${safeSortKey === 'date-asc' ? 'selected' : ''}>Date (Oldest)</option>
                        <option value="owner-asc" ${safeSortKey === 'owner-asc' ? 'selected' : ''}>Owner (A-Z)</option>
                        <option value="owner-desc" ${safeSortKey === 'owner-desc' ? 'selected' : ''}>Owner (Z-A)</option>
                        <option value="origin-desc" ${safeSortKey === 'origin-desc' ? 'selected' : ''}>Origin (Newest)</option>
                        <option value="origin-asc" ${safeSortKey === 'origin-asc' ? 'selected' : ''}>Origin (Oldest)</option>
                    </select>
                    <button type="button" class="action-btn danger" onclick="window.app_removeCarryForwardIssues && window.app_removeCarryForwardIssues()">
                        <i class="fa-solid fa-trash"></i> Delete All Listed
                    </button>
                </div>
                ${summaryNote}
                <div style="margin-top:0.6rem; border:1px solid #e2e8f0; border-radius:10px; overflow:auto; max-height:60vh;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
                        <thead style="background:#f8fafc; position:sticky; top:0;">
                            <tr>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Date</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Plan Owner</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Task</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Origin Date</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Root Token</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Flags</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    window.app_showModal(html, 'carryforward-issues-modal');

    const sortSelect = document.getElementById('carryforward-issues-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const value = e.target?.value || 'date-desc';
            window.app_renderCarryForwardIssues(value);
        }, { once: true });
    }
};

window.app_removeCarryForwardIssues = async function () {
    try {
        const issues = Array.isArray(window.app_carryForwardIssues) ? window.app_carryForwardIssues : [];
        if (!issues.length) {
            alert('No items to remove.');
            return;
        }
        const confirmText = `Remove ${issues.length} task(s) so they stop carrying forward?`;
        const approved = window.appConfirm
            ? await window.appConfirm(confirmText)
            : window.confirm(confirmText);
        if (!approved) return;
        if (!window.AppCalendar?.removeTask) {
            alert('Remove action is not available.');
            return;
        }
        let removed = 0;
        let skipped = 0;
        let failed = 0;
        const currentUser = window.AppAuth?.getUser ? window.AppAuth.getUser() : null;
        for (const issue of issues) {
            if (!issue.planId) {
                skipped += 1;
                continue;
            }
            try {
                const plan = await window.AppDB.get('work_plans', issue.planId);
                if (!plan || !Array.isArray(plan.plans) || plan.plans.length === 0) {
                    skipped += 1;
                    continue;
                }
                let targetIndex = -1;
                const rootToken = String(issue.rootToken || '').trim();
                if (rootToken) {
                    targetIndex = plan.plans.findIndex(t =>
                        t
                        && (String(t.carryForwardRootId || '') === rootToken
                            || String(t.carriedForwardFromPlanId || '') === rootToken
                            || String(t.sourcePlanId || '') === rootToken)
                    );
                }
                if (targetIndex < 0 && Number.isInteger(issue.taskIndex)) {
                    targetIndex = issue.taskIndex;
                }
                if (targetIndex < 0 || !plan.plans[targetIndex]) {
                    skipped += 1;
                    continue;
                }
                plan.plans[targetIndex] = {
                    ...plan.plans[targetIndex],
                    status: 'not-completed',
                    isRemoved: true,
                    removedAt: new Date().toISOString(),
                    removedBy: currentUser?.id || ''
                };
                plan.updatedAt = new Date().toISOString();
                await window.AppDB.put('work_plans', plan);
                console.log('[carryforward] removed task from plan', issue.planId, 'index', targetIndex);
                removed += 1;
            } catch (err) {
                failed += 1;
                console.warn('Carry-forward remove failed', { issue, err });
            }
        }
        const summary = `Removed: ${removed}. Skipped: ${skipped}. Failed: ${failed}.`;
        if (window.app_showSyncToast) {
            window.app_showSyncToast(summary);
        } else {
            alert(summary);
        }
        const refreshed = window.AppCalendar?.findCarryForwardIssues
            ? await window.AppCalendar.findCarryForwardIssues({ includeAssignedMismatch: true })
            : [];
        window.app_carryForwardIssues = refreshed;
        if (!refreshed.length) {
            window.app_renderCarryForwardIssues('date-desc');
            return;
        }
        window.app_renderCarryForwardIssues('date-desc');
    } catch (err) {
        console.error('Bulk remove carry-forward issues failed:', err);
        alert('Failed to remove carry-forward issues.');
    }
};

window.app_findCarryForwardIssues = async function () {
    try {
        if (!window.AppCalendar?.findCarryForwardIssues) {
            alert('Carry-forward scan is not available in this build.');
            return;
        }
        const issues = await window.AppCalendar.findCarryForwardIssues({ includeAssignedMismatch: true });
        if (!issues.length) {
            alert('No auto-forwarded tasks assigned to other staff were found.');
            return;
        }
        window.app_carryForwardIssues = issues;
        window.app_renderCarryForwardIssues('date-desc');
    } catch (err) {
        console.error('Carry-forward scan failed:', err);
        alert('Failed to scan carry-forward tasks. Please try again.');
    }
};

// Initialize modals & carry-forward system
export const initModalsAndCarryForward = () => {
    // No load-time init needed for modals/carry-forward currently
};

// Exports for init(), generated HTML, and other modules

const app_showModal = window.app_showModal;
const app_openModal = window.app_openModal;
const app_renderCarryForwardIssues = window.app_renderCarryForwardIssues;
const app_removeCarryForwardIssues = window.app_removeCarryForwardIssues;
const app_findCarryForwardIssues = window.app_findCarryForwardIssues;

export { app_showModal, app_openModal, app_renderCarryForwardIssues, app_removeCarryForwardIssues, app_findCarryForwardIssues };
