
/**
 * Admin Policy Module
 * Handles Admin-side Policy editing and Leave Approval Highlighting.
 */
(function () {
    const AdminPolicies = {

        async renderPolicyEditor() {
            const policy = await window.AppLeaves.getPolicy();
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
                                ${Object.keys(policy).map(type => {
                const rules = policy[type];
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
            `;
        },

        // Helper to bind to window
        setupGlobalHandlers() {
            window.app_savePolicyChanges = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const currentPolicy = await window.AppLeaves.getPolicy();
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
                    await window.AppLeaves.updatePolicy(updates);
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

            window.app_approveLeaveWithWarning = async (leaveId) => {
                const comment = await window.appPrompt("Reason for override:", "", { title: 'Leave Override', confirmText: 'Approve With Reason', placeholder: 'Enter reason' });
                if (!comment) return;

                try {
                    await window.AppLeaves.updateLeaveStatus(leaveId, 'Approved', window.AppAuth.getUser().id, `[Overridden] ${comment}`);
                    window.location.reload();
                } catch (e) {
                    alert(e.message);
                }
            };
        }
    };

    // Initialize Global Handlers on load
    AdminPolicies.setupGlobalHandlers();

    window.AppAdminPolicies = AdminPolicies;
})();
