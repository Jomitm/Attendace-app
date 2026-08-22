
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
        const heroAttendance = heroPolicy.ATTENDANCE_MODIFIER || {};
        const heroCaps = heroPolicy.CAPS || {};
        const heroEvidence = heroPolicy.MIN_EVIDENCE || {};
        const heroDefaults = AppConfig?.HERO_POLICY || {};
        const leaveTypes = Object.entries(policy).filter(([key]) => key !== 'heroPolicy');
        const renderNumberField = ({ label, name, value, step = '0.01', min = '0', max = undefined, help = '' }) => `
            <label style="display:grid; gap:0.35rem;">
                <span style="font-size:0.8rem; font-weight:700; color:#334155;">${safeHtml(label)}</span>
                <input
                    type="number"
                    step="${safeHtml(String(step))}"
                    min="${safeHtml(String(min))}"
                    ${max !== undefined ? `max="${safeHtml(String(max))}"` : ''}
                    name="${safeHtml(name)}"
                    value="${safeHtml(String(value ?? ''))}"
                    style="padding:0.55rem; border:1px solid #cbd5e1; border-radius:8px;"
                >
                ${help ? `<span style="font-size:0.72rem; color:#64748b; line-height:1.2;">${safeHtml(help)}</span>` : ''}
            </label>
        `;

        const renderSection = (title, description, fieldsHtml, columns = 4) => `
            <section style="border:1px solid #dbe4f0; border-radius:14px; padding:0.9rem; background:#f8fbff;">
                <div style="margin-bottom:0.75rem;">
                    <h4 style="margin:0; font-size:0.92rem; color:#0f172a;">${safeHtml(title)}</h4>
                    ${description ? `<p style="margin:0.25rem 0 0 0; font-size:0.78rem; color:#64748b;">${safeHtml(description)}</p>` : ''}
                </div>
                <div style="display:grid; grid-template-columns: repeat(${columns}, minmax(0, 1fr)); gap:0.75rem;">
                    ${fieldsHtml}
                </div>
            </section>
        `;
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
                Adjust every configurable hero policy setting. Saving will refresh the hero schema cache and bump the schema version.
            </p>
            <form onsubmit="window.app_saveHeroPolicyChanges(event)">
                <div style="display:grid; gap:0.85rem;">
                    ${renderSection(
            'Scoring Weights',
            'These values directly shape the weekly hero score.',
            [
                renderNumberField({ label: 'Completion Rate', name: 'hero_completionRate', value: heroWeights.completionRate ?? 0.20 }),
                renderNumberField({ label: 'Absolute Volume', name: 'hero_absoluteVolume', value: heroWeights.absoluteVolume ?? 0.30 }),
                renderNumberField({ label: 'Execution Quality', name: 'hero_executionQuality', value: heroWeights.executionQuality ?? 0.20 }),
                renderNumberField({ label: 'Miss Penalty', name: 'hero_missPenalty', value: heroWeights.missPenalty ?? 0.10 }),
                renderNumberField({ label: 'Postponed Penalty', name: 'hero_postponedPenalty', value: heroWeights.postponedPenalty ?? 0.02 }),
                renderNumberField({ label: 'Planning Breadth', name: 'hero_planningBreadth', value: heroWeights.planningBreadth ?? 0.15 })
            ].join(''),
            3
        )}
                    ${renderSection(
            'Policy Window',
            'Adjust the scoring horizon and the task-volume target.',
            [
                renderNumberField({ label: 'Window Days', name: 'hero_windowDays', value: heroPolicy.WINDOW_DAYS ?? heroDefaults.WINDOW_DAYS ?? 7, step: '1', min: '1' }),
                renderNumberField({ label: 'Fallback Lookback Days', name: 'hero_fallbackLookbackDays', value: heroPolicy.FALLBACK_LOOKBACK_DAYS ?? heroDefaults.FALLBACK_LOOKBACK_DAYS ?? 90, step: '1', min: '1' }),
                renderNumberField({ label: 'Expected Weekly Tasks', name: 'hero_expectedWeeklyTasks', value: heroPolicy.EXPECTED_WEEKLY_TASKS ?? heroDefaults.EXPECTED_WEEKLY_TASKS ?? 5, step: '1', min: '1' }),
                renderNumberField({ label: 'Default Activity Score', name: 'hero_defaultActivityScore', value: heroPolicy.DEFAULT_ACTIVITY_SCORE ?? heroDefaults.DEFAULT_ACTIVITY_SCORE ?? 70, step: '1', min: '0', max: '100' })
            ].join(''),
            4
        )}
                    ${renderSection(
            'Attendance Modifier',
            'These values influence how attendance reliability boosts the final score.',
            [
                renderNumberField({ label: 'Base Factor', name: 'hero_attendanceBase', value: heroAttendance.base ?? 0.9 }),
                renderNumberField({ label: 'Max Bonus', name: 'hero_attendanceMaxBonus', value: heroAttendance.maxBonus ?? 0.15 }),
                renderNumberField({ label: 'Consistency Impact', name: 'hero_attendanceConsistencyImpact', value: heroAttendance.consistencyImpact ?? 0.65 }),
                renderNumberField({ label: 'Effort Impact', name: 'hero_attendanceEffortImpact', value: heroAttendance.effortImpact ?? 0.35 })
            ].join(''),
            4
        )}
                    ${renderSection(
            'Caps and Evidence',
            'These settings bound the score math and eligibility thresholds.',
            [
                renderNumberField({ label: 'Hours Cap', name: 'hero_capsHours', value: heroCaps.hours ?? 40, step: '1', min: '1' }),
                renderNumberField({ label: 'Quality Characters Cap', name: 'hero_capsQualityChars', value: heroCaps.qualityChars ?? 500, step: '1', min: '0' }),
                renderNumberField({ label: 'Minimum Days', name: 'hero_minDays', value: heroEvidence.minDays ?? 3, step: '1', min: '1' }),
                renderNumberField({ label: 'Minimum Duration (Hours)', name: 'hero_minDurationHours', value: Math.max(0, Number(heroEvidence.minDurationMs ?? 14400000) / 3600000), step: '0.5', min: '0', help: 'Saved back to minDurationMs.' }),
                renderNumberField({ label: 'Minimum Planned Tasks', name: 'hero_minPlannedTasks', value: heroEvidence.minPlannedTasks ?? 3, step: '1', min: '0' })
            ].join(''),
            3
        )}
                </div>
                <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:center; margin-top:0.85rem; flex-wrap:wrap;">
                    <div style="font-size:0.8rem; color:#64748b; line-height:1.3;">
                        Current schema version: <strong>${safeHtml(String(heroPolicy.SCHEMA_VERSION || heroDefaults.SCHEMA_VERSION || 1))}</strong>
                        <div>Save will increment this version automatically.</div>
                    </div>
                    <button type="submit" class="action-btn" style="padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fa-solid fa-save"></i> Save Hero Policy
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
                },
                ATTENDANCE_MODIFIER: {
                    ...(currentHeroPolicy.ATTENDANCE_MODIFIER || {})
                },
                CAPS: {
                    ...(currentHeroPolicy.CAPS || {})
                },
                MIN_EVIDENCE: {
                    ...(currentHeroPolicy.MIN_EVIDENCE || {})
                }
            };

            const getNumber = (name, fallback = undefined) => {
                const raw = formData.get(name);
                if (raw === '' || raw === null || raw === undefined) return fallback;
                const parsed = Number(raw);
                return Number.isFinite(parsed) ? parsed : fallback;
            };

            nextHeroPolicy.WINDOW_DAYS = Math.max(1, Math.round(getNumber('hero_windowDays', nextHeroPolicy.WINDOW_DAYS ?? AppConfig?.HERO_POLICY?.WINDOW_DAYS ?? 7)));
            nextHeroPolicy.FALLBACK_LOOKBACK_DAYS = Math.max(1, Math.round(getNumber('hero_fallbackLookbackDays', nextHeroPolicy.FALLBACK_LOOKBACK_DAYS ?? AppConfig?.HERO_POLICY?.FALLBACK_LOOKBACK_DAYS ?? 90)));
            nextHeroPolicy.EXPECTED_WEEKLY_TASKS = Math.max(1, Math.round(getNumber('hero_expectedWeeklyTasks', nextHeroPolicy.EXPECTED_WEEKLY_TASKS ?? AppConfig?.HERO_POLICY?.EXPECTED_WEEKLY_TASKS ?? 5)));
            nextHeroPolicy.DEFAULT_ACTIVITY_SCORE = Math.max(0, Math.round(getNumber('hero_defaultActivityScore', nextHeroPolicy.DEFAULT_ACTIVITY_SCORE ?? AppConfig?.HERO_POLICY?.DEFAULT_ACTIVITY_SCORE ?? 70)));

            const weightKeys = [
                'completionRate',
                'absoluteVolume',
                'executionQuality',
                'missPenalty',
                'postponedPenalty',
                'planningBreadth'
            ];

            weightKeys.forEach((key) => {
                const nextValue = getNumber(`hero_${key}`, nextHeroPolicy.WEIGHTS?.[key]);
                if (nextValue !== undefined) {
                    nextHeroPolicy.WEIGHTS[key] = Math.max(0, Number(nextValue));
                }
            });

            nextHeroPolicy.ATTENDANCE_MODIFIER.base = Math.max(0, Number(getNumber('hero_attendanceBase', nextHeroPolicy.ATTENDANCE_MODIFIER.base ?? AppConfig?.HERO_POLICY?.ATTENDANCE_MODIFIER?.base ?? 0.9)));
            nextHeroPolicy.ATTENDANCE_MODIFIER.maxBonus = Math.max(0, Number(getNumber('hero_attendanceMaxBonus', nextHeroPolicy.ATTENDANCE_MODIFIER.maxBonus ?? AppConfig?.HERO_POLICY?.ATTENDANCE_MODIFIER?.maxBonus ?? 0.15)));
            nextHeroPolicy.ATTENDANCE_MODIFIER.consistencyImpact = Math.max(0, Number(getNumber('hero_attendanceConsistencyImpact', nextHeroPolicy.ATTENDANCE_MODIFIER.consistencyImpact ?? AppConfig?.HERO_POLICY?.ATTENDANCE_MODIFIER?.consistencyImpact ?? 0.65)));
            nextHeroPolicy.ATTENDANCE_MODIFIER.effortImpact = Math.max(0, Number(getNumber('hero_attendanceEffortImpact', nextHeroPolicy.ATTENDANCE_MODIFIER.effortImpact ?? AppConfig?.HERO_POLICY?.ATTENDANCE_MODIFIER?.effortImpact ?? 0.35)));

            nextHeroPolicy.CAPS.hours = Math.max(1, Math.round(getNumber('hero_capsHours', nextHeroPolicy.CAPS.hours ?? AppConfig?.HERO_POLICY?.CAPS?.hours ?? 40)));
            nextHeroPolicy.CAPS.qualityChars = Math.max(0, Math.round(getNumber('hero_capsQualityChars', nextHeroPolicy.CAPS.qualityChars ?? AppConfig?.HERO_POLICY?.CAPS?.qualityChars ?? 500)));

            nextHeroPolicy.MIN_EVIDENCE.minDays = Math.max(1, Math.round(getNumber('hero_minDays', nextHeroPolicy.MIN_EVIDENCE.minDays ?? AppConfig?.HERO_POLICY?.MIN_EVIDENCE?.minDays ?? 3)));
            const minDurationHours = Math.max(0, Number(getNumber('hero_minDurationHours', (nextHeroPolicy.MIN_EVIDENCE.minDurationMs ?? AppConfig?.HERO_POLICY?.MIN_EVIDENCE?.minDurationMs ?? 14400000) / 3600000)));
            nextHeroPolicy.MIN_EVIDENCE.minDurationMs = Math.max(0, Math.round(minDurationHours * 3600000));
            nextHeroPolicy.MIN_EVIDENCE.minPlannedTasks = Math.max(0, Math.round(getNumber('hero_minPlannedTasks', nextHeroPolicy.MIN_EVIDENCE.minPlannedTasks ?? AppConfig?.HERO_POLICY?.MIN_EVIDENCE?.minPlannedTasks ?? 3)));

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
