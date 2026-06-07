
import { safeHtml } from '../ui/helpers.js';
import { AppLeaves } from './leaves.js';
import { AppAuth } from './auth.js';
import { AppConfig } from '../config.js';

/**
 * Admin Policy Module
 * Handles Admin-side Policy editing and Leave Approval Highlighting.
 */
export const AdminPolicies = {

    getHeroPolicy(policy = {}) {
        return AppLeaves.mergeHeroPolicy?.(policy?.heroPolicy || {}) || (AppConfig?.HERO_POLICY || {});
    },

    async renderPolicyEditor() {
        const policy = await AppLeaves.getPolicy();
        const heroPolicy = this.getHeroPolicy(policy);
        const heroWeights = heroPolicy.WEIGHTS || {};
        const leaveTypes = Object.entries(policy).filter(([key]) => key !== 'heroPolicy');
        // Compact Editor for Policies Page
        return `
        <div class="card full-width" style="margin-top: 2rem; border-top: 4px solid #4f46e5;">
            <h3 style="margin-bottom: 1rem; color: #1e1b4b; font-size: 1.1rem;">
                <i class="fa-solid fa-screwdriver-wrench" style="margin-right: 8px;"></i> Manage Leave Policies (Admin)
            </h3>
            <form onsubmit="window.app_savePolicyChanges(event)">
                <div class="table-container">
                    <table class="compact-table" style="font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 8px;">Leave Type</th>
                                <th style="padding: 8px; width: 80px;">Total</th>
                                <th style="padding: 8px; width: 80px;">Min Days</th>
                                <th style="padding: 8px; width: 80px;">Max Days</th>
                                <th style="padding: 8px;">Other Rules</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaveTypes.map(([type, rules]) => {
            return `
                                <tr>
                                    <td style="padding: 6px 8px;"><strong>${type}</strong></td>
                                    <td style="padding: 6px 8px;">
                                        <input type="number" name="${type}_total" value="${rules.total}" style="width: 100%; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                    </td>
                                    <td style="padding: 6px 8px;">
                                        <input type="number" name="${type}_min" value="${rules.minDays || ''}" placeholder="-" style="width: 100%; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                    </td>
                                    <td style="padding: 6px 8px;">
                                        <input type="number" name="${type}_max" value="${rules.maxDays || ''}" placeholder="-" style="width: 100%; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                    </td>
                                    <td style="padding: 6px 8px; color: #64748b;">
                                        ${rules.gender ? `<span class="tag">${rules.gender}</span>` : ''}
                                        ${rules.paid ? `<span class="tag success">Paid</span>` : ''}
                                    </td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 0.75rem; text-align: right;">
                     <button type="submit" class="action-btn" style="padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fa-solid fa-save"></i> Save Changes
                     </button>
                </div>
            </form>
        </div>
        <div class="card full-width" style="margin-top: 1.25rem; border-top: 4px solid #0f6ddf;">
            <h3 style="margin-bottom: 0.55rem; color: #0f172a; font-size: 1.05rem;">
                <i class="fa-solid fa-ranking-star" style="margin-right: 8px;"></i> Hero of the Week Control Panel
            </h3>
            <p style="margin: 0 0 1rem 0; color: #64748b; font-size: 0.85rem;">
                Adjust how much each task signal contributes to the weekly hero score. Saving will refresh the hero schema cache.
            </p>
            <form onsubmit="window.app_saveHeroPolicyChanges(event)">
                <div style="display:grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.75rem;">
                    <label style="display:grid; gap:0.35rem;">
                        <span style="font-size:0.8rem; font-weight:700; color:#334155;">Task Execution</span>
                        <input type="number" step="0.01" min="0" name="hero_taskExecution" value="${heroWeights.taskExecution ?? 0.45}" style="padding:0.55rem; border:1px solid #cbd5e1; border-radius:8px;">
                    </label>
                    <label style="display:grid; gap:0.35rem;">
                        <span style="font-size:0.8rem; font-weight:700; color:#334155;">Completion Rate</span>
                        <input type="number" step="0.01" min="0" name="hero_taskCompletionRate" value="${heroWeights.taskCompletionRate ?? 0.2}" style="padding:0.55rem; border:1px solid #cbd5e1; border-radius:8px;">
                    </label>
                    <label style="display:grid; gap:0.35rem;">
                        <span style="font-size:0.8rem; font-weight:700; color:#334155;">In-Progress Support</span>
                        <input type="number" step="0.01" min="0" name="hero_taskInProgressSupport" value="${heroWeights.taskInProgressSupport ?? 0.1}" style="padding:0.55rem; border:1px solid #cbd5e1; border-radius:8px;">
                    </label>
                    <label style="display:grid; gap:0.35rem;">
                        <span style="font-size:0.8rem; font-weight:700; color:#334155;">Miss Penalty</span>
                        <input type="number" step="0.01" min="0" name="hero_taskMissPenalty" value="${heroWeights.taskMissPenalty ?? 0.1}" style="padding:0.55rem; border:1px solid #cbd5e1; border-radius:8px;">
                    </label>
                    <label style="display:grid; gap:0.35rem;">
                        <span style="font-size:0.8rem; font-weight:700; color:#334155;">Planning Bonus</span>
                        <input type="number" step="0.01" min="0" name="hero_taskPlanning" value="${heroWeights.taskPlanning ?? 0.08}" style="padding:0.55rem; border:1px solid #cbd5e1; border-radius:8px;">
                    </label>
                </div>
                <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:center; margin-top:0.85rem; flex-wrap:wrap;">
                    <div style="font-size:0.8rem; color:#64748b;">
                        Current schema version: <strong>${safeHtml(String(heroPolicy.SCHEMA_VERSION || AppConfig?.HERO_POLICY?.SCHEMA_VERSION || 1))}</strong>
                    </div>
                    <button type="submit" class="action-btn" style="padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fa-solid fa-save"></i> Save Hero Weights
                    </button>
                </div>
            </form>
        </div>
        `;
    },

    // Helper to bind to window
    setupGlobalHandlers() {
        window.app_savePolicyChanges = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const currentPolicy = await AppLeaves.getPolicy();
            const updates = {};

            Object.keys(currentPolicy).forEach(type => {
                updates[type] = { ...currentPolicy[type] };

                // Helper to parse safely
                const getInt = (name) => {
                    const val = formData.get(name);
                    return (val !== '' && val !== null) ? parseInt(val) : undefined;
                };

                const total = getInt(`${type}_total`);
                if (total !== undefined) updates[type].total = total;

                const min = getInt(`${type}_min`);
                if (min !== undefined) updates[type].minDays = min;
                else delete updates[type].minDays; // Remove if cleared

                const max = getInt(`${type}_max`);
                if (max !== undefined) updates[type].maxDays = max;
                else delete updates[type].maxDays; // Remove if cleared
            });

            try {
                await AppLeaves.updatePolicy(updates);
                // Show toast or alert
                const btn = e.target.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
                btn.style.background = '#166534';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    window.location.reload();
                }, 1000);
            } catch (err) {
                alert("Failed to update policy: " + err.message);
            }
        };

        window.app_saveHeroPolicyChanges = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const currentPolicy = await AppLeaves.getPolicy();
            const currentHeroPolicy = AppLeaves.mergeHeroPolicy?.(currentPolicy.heroPolicy || {}) || (AppConfig?.HERO_POLICY || {});
            const nextHeroPolicy = {
                ...currentHeroPolicy,
                WEIGHTS: {
                    ...(currentHeroPolicy.WEIGHTS || {})
                }
            };

            const getNumber = (name, fallback = undefined) => {
                const raw = formData.get(name);
                if (raw === '' || raw === null || raw === undefined) return fallback;
                const parsed = Number(raw);
                return Number.isFinite(parsed) ? parsed : fallback;
            };

            const weightKeys = [
                'taskExecution',
                'taskCompletionRate',
                'taskInProgressSupport',
                'taskMissPenalty',
                'taskPlanning'
            ];

            weightKeys.forEach((key) => {
                const nextValue = getNumber(`hero_${key}`, nextHeroPolicy.WEIGHTS?.[key]);
                if (nextValue !== undefined) {
                    nextHeroPolicy.WEIGHTS[key] = Math.max(0, Number(nextValue));
                }
            });

            nextHeroPolicy.SCHEMA_VERSION = Math.max(
                Number(currentHeroPolicy.SCHEMA_VERSION || AppConfig?.HERO_POLICY?.SCHEMA_VERSION || 1),
                1
            ) + 1;

            try {
                await AppLeaves.updatePolicy({ heroPolicy: nextHeroPolicy });
                window.AppHeroPolicy = nextHeroPolicy;
                const btn = e.target.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
                btn.style.background = '#166534';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    window.location.reload();
                }, 1000);
            } catch (err) {
                alert("Failed to update hero policy: " + err.message);
            }
        };

        window.app_approveLeaveWithWarning = async (leaveId) => {
            const comment = await window.appPrompt("Reason for override:", "", { title: 'Leave Override', confirmText: 'Approve With Reason', placeholder: 'Enter reason' });
            if (!comment) return;

            try {
                await AppLeaves.updateLeaveStatus(leaveId, 'Approved', AppAuth.getUser().id, `[Overridden] ${comment}`);
                window.location.reload();
            } catch (e) {
                alert(e.message);
            }
        };
    }
};

// Initialize Global Handlers on load
AdminPolicies.setupGlobalHandlers();

if (typeof window !== 'undefined') window.AppAdminPolicies = AdminPolicies;
