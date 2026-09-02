
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
        const heroAttendance = { ...(heroPolicy.ATTENDANCE_MODIFIER || {}) };
        // Migrate old decimal values (0-1 range from legacy config) to new integer range
        // so the HTML5 min/max constraints don't block form submission
        if (heroAttendance.maxBonus !== undefined && heroAttendance.maxBonus >= 0 && heroAttendance.maxBonus < 1 && heroAttendance.maxBonus !== 0) {
            heroAttendance.maxBonus = 10;
        }
        if (heroAttendance.consistencyImpact !== undefined && heroAttendance.consistencyImpact >= 0 && heroAttendance.consistencyImpact < 2 && heroAttendance.consistencyImpact !== 8) {
            heroAttendance.consistencyImpact = 8;
        }
        const heroCaps = heroPolicy.CAPS || {};
        const heroEvidence = heroPolicy.MIN_EVIDENCE || {};
        const heroDefaults = AppConfig?.HERO_POLICY || {};
        const heroWeights = heroPolicy.DIMENSION_WEIGHTS || heroDefaults?.DIMENSION_WEIGHTS || {};
        const heroRules = heroPolicy.SCORING_RULES || heroDefaults?.SCORING_RULES || {};
        const classificationRule = heroRules.CLASSIFICATION_BONUS || {};
        const priorityWeights = heroRules.PRIORITY_WEIGHTS || {};
        const sizeWeights = heroRules.SIZE_WEIGHTS || {};
        const executionWeights = heroRules.TASK_EXECUTION_WEIGHTS || {};
        const planningWeights = heroRules.PLANNING_WEIGHTS || {};
        const pausePenaltyRule = heroRules.PAUSE_PENALTY || {};
        const compliancePenalty = heroRules.COMPLIANCE_PENALTY || {};
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
                Configure how the weekly hero is scored. Saving bumps the schema version and refreshes rankings.
            </p>
            <form onsubmit="window.app_saveHeroPolicyChanges(event)">
                <div style="display:grid; gap:0.85rem;">
                    ${renderSection(
            'Basic Settings',
            null,
            [
                renderNumberField({ label: 'Scoring Period (days)', name: 'hero_windowDays', value: heroPolicy.WINDOW_DAYS ?? heroDefaults.WINDOW_DAYS ?? 7, step: '1', min: '1' }),
                renderNumberField({ label: 'Expected Hours/Day', name: 'hero_attendanceConsistencyImpact', value: heroAttendance.consistencyImpact ?? 8, step: '0.5', min: '1', max: '16' }),
                renderNumberField({ label: 'Max Hours Bonus (pts)', name: 'hero_attendanceMaxBonus', value: heroAttendance.maxBonus ?? 10, step: '1', min: '0', max: '25', help: 'Bonus for working long hours. 0 = off.' }),
                renderNumberField({ label: 'Max Pauses/Day', name: 'hero_maxPausesPerDay', value: (heroPolicy.PAUSE_DISCIPLINE || heroDefaults.PAUSE_DISCIPLINE || {}).maxPausesPerDay ?? 3, step: '1', min: '0', max: '10', help: 'More pauses than this = punctuality penalty.' }),
                renderNumberField({ label: 'Max Pause Mins/Day', name: 'hero_maxPauseMinsPerDay', value: (heroPolicy.PAUSE_DISCIPLINE || heroDefaults.PAUSE_DISCIPLINE || {}).maxPauseMinsPerDay ?? 45, step: '5', min: '0', max: '120', help: 'Longer pauses than this = punctuality penalty.' }),
                renderNumberField({ label: 'Consistency Bonus (pts)', name: 'hero_consistencyBonus', value: heroAttendance.consistencyBonus ?? 10, step: '1', min: '0', max: '20', help: 'Reward for stable check-in times.' }),
                renderNumberField({ label: 'Min Days to Qualify', name: 'hero_minDays', value: heroEvidence.minDays ?? 3, step: '1', min: '1' }),
                renderNumberField({ label: 'Min Hours to Qualify', name: 'hero_minDurationHours', value: Math.max(0, Number(heroEvidence.minDurationMs ?? 14400000) / 3600000), step: '0.5', min: '0' }),
                renderNumberField({ label: 'Min Tasks to Qualify', name: 'hero_minPlannedTasks', value: heroEvidence.minPlannedTasks ?? 3, step: '1', min: '0' })
            ].join(''),
            3
        )}
                    <details style="border:1px solid #e2e8f0; border-radius:10px; padding:0.5rem 0.75rem; background:#fafbfc;">
                        <summary style="cursor:pointer; font-size:0.85rem; font-weight:600; color:#475569; padding:0.35rem 0;">
                            <i class="fa-solid fa-sliders" style="margin-right:6px;"></i> Advanced Settings
                        </summary>
                        <div style="display:grid; gap:0.75rem; margin-top:0.75rem;">
                            ${renderSection(
                'Scoring Parameters',
                null,
                [
                    renderNumberField({ label: 'Fallback Lookback (days)', name: 'hero_fallbackLookbackDays', value: heroPolicy.FALLBACK_LOOKBACK_DAYS ?? heroDefaults.FALLBACK_LOOKBACK_DAYS ?? 90, step: '1', min: '1', help: 'Wider window if nobody qualifies in primary period.' }),
                    renderNumberField({ label: 'Expected Weekly Tasks', name: 'hero_expectedWeeklyTasks', value: heroPolicy.EXPECTED_WEEKLY_TASKS ?? heroDefaults.EXPECTED_WEEKLY_TASKS ?? 5, step: '1', min: '1' }),
                    renderNumberField({ label: 'Default Activity Score', name: 'hero_defaultActivityScore', value: heroPolicy.DEFAULT_ACTIVITY_SCORE ?? heroDefaults.DEFAULT_ACTIVITY_SCORE ?? 50, step: '1', min: '0', max: '100', help: 'Baseline for users with no check-in data.' }),
                    renderNumberField({ label: 'Hours Cap (confidence)', name: 'hero_capsHours', value: heroCaps.hours ?? 40, step: '1', min: '1', help: 'Caps confidence display, not the score.' }),
                    renderNumberField({ label: 'Quality Chars Cap', name: 'hero_capsQualityChars', value: heroCaps.qualityChars ?? 500, step: '1', min: '0', help: 'Limits work description length in scoring.' }),
                    renderNumberField({ label: 'Punctuality Weight', name: 'hero_weightPunctuality', value: heroWeights.punctuality ?? 0.15, step: '0.05', min: '0', max: '1' }),
                    renderNumberField({ label: 'Attendance Weight', name: 'hero_weightAttendance', value: heroWeights.attendance ?? 0.20, step: '0.05', min: '0', max: '1' }),
                    renderNumberField({ label: 'Task Weight', name: 'hero_weightTaskExecution', value: heroWeights.taskExecution ?? 0.25, step: '0.05', min: '0', max: '1' }),
                    renderNumberField({ label: 'Productivity Weight', name: 'hero_weightProductivity', value: heroWeights.productivity ?? 0.15, step: '0.05', min: '0', max: '1' }),
                    renderNumberField({ label: 'Planning Weight', name: 'hero_weightPlanning', value: heroWeights.planning ?? 0.15, step: '0.05', min: '0', max: '1' }),
                    renderNumberField({ label: 'Compliance Weight', name: 'hero_weightCompliance', value: heroWeights.compliance ?? 0.10, step: '0.05', min: '0', max: '1' })
                ].join(''),
                3
            )}
                            ${renderSection(
                'Task Rules',
                'These values control task importance, completion credit, and the priority bonus.',
                [
                    renderNumberField({ label: 'Priority Bonus Points', name: 'hero_ruleBonusPoints', value: classificationRule.points ?? 3, step: '1', min: '0', max: '20' }),
                    renderNumberField({ label: 'Bonus Minimum Tasks', name: 'hero_ruleBonusMinTasks', value: classificationRule.minTasks ?? 5, step: '1', min: '0' }),
                    renderNumberField({ label: 'Bonus Priority Ratio', name: 'hero_ruleBonusRatio', value: classificationRule.minPriorityRatio ?? 0.8, step: '0.05', min: '0', max: '1' }),
                    renderNumberField({ label: 'Urgent Multiplier', name: 'hero_rulePriorityUrgent', value: priorityWeights.urgent ?? 1.5, step: '0.1', min: '0' }),
                    renderNumberField({ label: 'Important Multiplier', name: 'hero_rulePriorityImportant', value: priorityWeights.important ?? 1.2, step: '0.1', min: '0' }),
                    renderNumberField({ label: 'Standard Multiplier', name: 'hero_rulePriorityStandard', value: priorityWeights.standard ?? 1, step: '0.1', min: '0' }),
                    renderNumberField({ label: 'Flexible Multiplier', name: 'hero_rulePriorityFlexible', value: priorityWeights.flexible ?? 0.8, step: '0.1', min: '0' }),
                    renderNumberField({ label: 'Extra Hours Expected/Day', name: 'hero_ruleExtraHours', value: heroRules.EXPECTED_EXTRA_HOURS_PER_DAY ?? 0.5, step: '0.1', min: '0' }),
                    renderNumberField({ label: 'Evidence Characters', name: 'hero_ruleEvidenceChars', value: heroRules.EVIDENCE_MIN_CHARS ?? 40, step: '1', min: '1' })
                ].join(''),
                3
            )}
                            ${renderSection(
                'Detailed Rule Controls',
                'All values below are used directly by Hero scoring. Weight groups are normalized where applicable.',
                [
                    ...['single-action', 'quick-task', 'small-task', 'medium-task', 'large-task', 'major-project'].map((key) => renderNumberField({ label: `Size: ${key}`, name: `hero_ruleSize_${key}`, value: sizeWeights[key] ?? ({ 'single-action': 1, 'quick-task': 2, 'small-task': 3, 'medium-task': 5, 'large-task': 8, 'major-project': 12 }[key]), step: '0.1', min: '0' })),
                    renderNumberField({ label: 'Completion Weight', name: 'hero_ruleExecutionCompletion', value: executionWeights.completion ?? 0.5, step: '0.05', min: '0' }),
                    renderNumberField({ label: 'On-time Weight', name: 'hero_ruleExecutionOnTime', value: executionWeights.onTime ?? 0.2, step: '0.05', min: '0' }),
                    renderNumberField({ label: 'Miss Penalty Weight', name: 'hero_ruleExecutionMissed', value: executionWeights.missed ?? 0.3, step: '0.05', min: '0' }),
                    renderNumberField({ label: 'Subtask Points', name: 'hero_ruleSubPlanPoints', value: planningWeights.subPlanPoints ?? 20, step: '1', min: '0' }),
                    renderNumberField({ label: 'Pause Count Penalty', name: 'hero_rulePauseCountPoints', value: pausePenaltyRule.pauseCountPoints ?? 10, step: '1', min: '0' }),
                    renderNumberField({ label: 'Pause Minutes Block', name: 'hero_rulePauseMinutesBlock', value: pausePenaltyRule.pauseMinutesBlock ?? 10, step: '1', min: '1' }),
                    renderNumberField({ label: 'Location Penalty', name: 'hero_ruleLocationPenalty', value: compliancePenalty.locationMismatch ?? 50, step: '1', min: '0' }),
                    renderNumberField({ label: 'Auto-checkout Penalty', name: 'hero_ruleAutoCheckoutPenalty', value: compliancePenalty.autoCheckout ?? 50, step: '1', min: '0' })
                ].join(''),
                3
            )}
                        </div>
                    </details>
                </div>
                <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:center; margin-top:0.85rem; flex-wrap:wrap;">
                    <div style="font-size:0.8rem; color:#64748b; line-height:1.3;">
                        Schema version: <strong>${safeHtml(String(heroPolicy.SCHEMA_VERSION || heroDefaults.SCHEMA_VERSION || 1))}</strong>
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
                ATTENDANCE_MODIFIER: {
                    ...(currentHeroPolicy.ATTENDANCE_MODIFIER || {})
                },
                PAUSE_DISCIPLINE: {
                    ...(currentHeroPolicy.PAUSE_DISCIPLINE || {})
                },
                DIMENSION_WEIGHTS: {
                    ...(currentHeroPolicy.DIMENSION_WEIGHTS || {})
                },
                SCORING_RULES: {
                    ...(currentHeroPolicy.SCORING_RULES || {}),
                    SIZE_WEIGHTS: { ...(currentHeroPolicy.SCORING_RULES?.SIZE_WEIGHTS || {}) },
                    PRIORITY_WEIGHTS: { ...(currentHeroPolicy.SCORING_RULES?.PRIORITY_WEIGHTS || {}) },
                    TASK_EXECUTION_WEIGHTS: { ...(currentHeroPolicy.SCORING_RULES?.TASK_EXECUTION_WEIGHTS || {}) },
                    PLANNING_WEIGHTS: { ...(currentHeroPolicy.SCORING_RULES?.PLANNING_WEIGHTS || {}) },
                    PAUSE_PENALTY: { ...(currentHeroPolicy.SCORING_RULES?.PAUSE_PENALTY || {}) },
                    COMPLIANCE_PENALTY: { ...(currentHeroPolicy.SCORING_RULES?.COMPLIANCE_PENALTY || {}) },
                    CLASSIFICATION_BONUS: { ...(currentHeroPolicy.SCORING_RULES?.CLASSIFICATION_BONUS || {}) }
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
            nextHeroPolicy.DEFAULT_ACTIVITY_SCORE = Math.max(0, Math.round(getNumber('hero_defaultActivityScore', nextHeroPolicy.DEFAULT_ACTIVITY_SCORE ?? AppConfig?.HERO_POLICY?.DEFAULT_ACTIVITY_SCORE ?? 50)));

            const rawConsistencyImpact = Number(getNumber('hero_attendanceConsistencyImpact', nextHeroPolicy.ATTENDANCE_MODIFIER.consistencyImpact));
            const migratedConsistencyImpact = (rawConsistencyImpact >= 0 && rawConsistencyImpact < 2) ? 8 : rawConsistencyImpact;
            nextHeroPolicy.ATTENDANCE_MODIFIER.consistencyImpact = Math.max(1, Number.isFinite(migratedConsistencyImpact) ? migratedConsistencyImpact : 8);

            const rawMaxBonus = Number(getNumber('hero_attendanceMaxBonus', nextHeroPolicy.ATTENDANCE_MODIFIER.maxBonus));
            const migratedMaxBonus = (rawMaxBonus >= 0 && rawMaxBonus < 1 && rawMaxBonus !== 0) ? 10 : rawMaxBonus;
            nextHeroPolicy.ATTENDANCE_MODIFIER.maxBonus = Math.max(0, Math.round(Number.isFinite(migratedMaxBonus) ? migratedMaxBonus : 10));

            nextHeroPolicy.ATTENDANCE_MODIFIER.consistencyBonus = Math.max(0, Math.round(getNumber('hero_consistencyBonus', nextHeroPolicy.ATTENDANCE_MODIFIER.consistencyBonus ?? AppConfig?.HERO_POLICY?.ATTENDANCE_MODIFIER?.consistencyBonus ?? 10)));

            nextHeroPolicy.PAUSE_DISCIPLINE.maxPausesPerDay = Math.max(0, Math.round(getNumber('hero_maxPausesPerDay', nextHeroPolicy.PAUSE_DISCIPLINE.maxPausesPerDay ?? AppConfig?.HERO_POLICY?.PAUSE_DISCIPLINE?.maxPausesPerDay ?? 3)));
            nextHeroPolicy.PAUSE_DISCIPLINE.maxPauseMinsPerDay = Math.max(0, Math.round(getNumber('hero_maxPauseMinsPerDay', nextHeroPolicy.PAUSE_DISCIPLINE.maxPauseMinsPerDay ?? AppConfig?.HERO_POLICY?.PAUSE_DISCIPLINE?.maxPauseMinsPerDay ?? 45)));

            nextHeroPolicy.CAPS.hours = Math.max(1, Math.round(getNumber('hero_capsHours', nextHeroPolicy.CAPS.hours ?? AppConfig?.HERO_POLICY?.CAPS?.hours ?? 40)));
            nextHeroPolicy.CAPS.qualityChars = Math.max(0, Math.round(getNumber('hero_capsQualityChars', nextHeroPolicy.CAPS.qualityChars ?? AppConfig?.HERO_POLICY?.CAPS?.qualityChars ?? 500)));

            nextHeroPolicy.MIN_EVIDENCE.minDays = Math.max(1, Math.round(getNumber('hero_minDays', nextHeroPolicy.MIN_EVIDENCE.minDays ?? AppConfig?.HERO_POLICY?.MIN_EVIDENCE?.minDays ?? 3)));
            const minDurationHours = Math.max(0, Number(getNumber('hero_minDurationHours', (nextHeroPolicy.MIN_EVIDENCE.minDurationMs ?? AppConfig?.HERO_POLICY?.MIN_EVIDENCE?.minDurationMs ?? 14400000) / 3600000)));
            nextHeroPolicy.MIN_EVIDENCE.minDurationMs = Math.max(0, Math.round(minDurationHours * 3600000));
            nextHeroPolicy.MIN_EVIDENCE.minPlannedTasks = Math.max(0, Math.round(getNumber('hero_minPlannedTasks', nextHeroPolicy.MIN_EVIDENCE.minPlannedTasks ?? AppConfig?.HERO_POLICY?.MIN_EVIDENCE?.minPlannedTasks ?? 3)));

            const dimensionWeights = ['punctuality', 'attendance', 'taskExecution', 'productivity', 'planning', 'compliance'];
            dimensionWeights.forEach((key) => {
                nextHeroPolicy.DIMENSION_WEIGHTS[key] = Math.max(0, getNumber(`hero_weight${key[0].toUpperCase()}${key.slice(1)}`, nextHeroPolicy.DIMENSION_WEIGHTS[key] ?? AppConfig?.HERO_POLICY?.DIMENSION_WEIGHTS?.[key] ?? 0));
            });

            const rules = nextHeroPolicy.SCORING_RULES;
            rules.CLASSIFICATION_BONUS.points = Math.max(0, getNumber('hero_ruleBonusPoints', rules.CLASSIFICATION_BONUS.points ?? 3));
            rules.CLASSIFICATION_BONUS.minTasks = Math.max(0, getNumber('hero_ruleBonusMinTasks', rules.CLASSIFICATION_BONUS.minTasks ?? 5));
            rules.CLASSIFICATION_BONUS.minPriorityRatio = Math.min(1, Math.max(0, getNumber('hero_ruleBonusRatio', rules.CLASSIFICATION_BONUS.minPriorityRatio ?? 0.8)));
            ['urgent', 'important', 'standard', 'flexible'].forEach((key) => {
                rules.PRIORITY_WEIGHTS[key] = Math.max(0, getNumber(`hero_rulePriority${key[0].toUpperCase()}${key.slice(1)}`, rules.PRIORITY_WEIGHTS[key] ?? AppConfig?.HERO_POLICY?.SCORING_RULES?.PRIORITY_WEIGHTS?.[key] ?? 1));
            });
            ['single-action', 'quick-task', 'small-task', 'medium-task', 'large-task', 'major-project'].forEach((key) => {
                rules.SIZE_WEIGHTS[key] = Math.max(0, getNumber(`hero_ruleSize_${key}`, rules.SIZE_WEIGHTS[key] ?? 1));
            });
            rules.TASK_EXECUTION_WEIGHTS.completion = Math.max(0, getNumber('hero_ruleExecutionCompletion', rules.TASK_EXECUTION_WEIGHTS.completion ?? 0.5));
            rules.TASK_EXECUTION_WEIGHTS.onTime = Math.max(0, getNumber('hero_ruleExecutionOnTime', rules.TASK_EXECUTION_WEIGHTS.onTime ?? 0.2));
            rules.TASK_EXECUTION_WEIGHTS.missed = Math.max(0, getNumber('hero_ruleExecutionMissed', rules.TASK_EXECUTION_WEIGHTS.missed ?? 0.3));
            rules.PLANNING_WEIGHTS.subPlanPoints = Math.max(0, getNumber('hero_ruleSubPlanPoints', rules.PLANNING_WEIGHTS.subPlanPoints ?? 20));
            rules.PAUSE_PENALTY.pauseCountPoints = Math.max(0, getNumber('hero_rulePauseCountPoints', rules.PAUSE_PENALTY.pauseCountPoints ?? 10));
            rules.PAUSE_PENALTY.pauseMinutesBlock = Math.max(1, getNumber('hero_rulePauseMinutesBlock', rules.PAUSE_PENALTY.pauseMinutesBlock ?? 10));
            rules.COMPLIANCE_PENALTY.locationMismatch = Math.max(0, getNumber('hero_ruleLocationPenalty', rules.COMPLIANCE_PENALTY.locationMismatch ?? 50));
            rules.COMPLIANCE_PENALTY.autoCheckout = Math.max(0, getNumber('hero_ruleAutoCheckoutPenalty', rules.COMPLIANCE_PENALTY.autoCheckout ?? 50));
            rules.EXPECTED_EXTRA_HOURS_PER_DAY = Math.max(0, getNumber('hero_ruleExtraHours', rules.EXPECTED_EXTRA_HOURS_PER_DAY ?? 0.5));
            rules.EVIDENCE_MIN_CHARS = Math.max(1, getNumber('hero_ruleEvidenceChars', rules.EVIDENCE_MIN_CHARS ?? 40));

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
