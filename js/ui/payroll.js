/**
 * Payroll Component
 * Handles rendering of salary processing, TDS calculations, and policy testing utilities.
 */

import { safeHtml } from './helpers.js';

export async function renderSalaryProcessing() {
    const summary = await window.AppAnalytics.getSystemMonthlySummary();
    const today = new Date();
    const currentUser = window.AppAuth.getUser();
    const isFullAdmin = window.app_hasPerm('reports', 'admin', currentUser);
    const monthLabel = today.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    const payPeriodValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const payDateValue = today.toISOString().split('T')[0];

    // Recalculation logic
    window.app_recalculateRow = (row) => {
        const base = parseFloat(row.querySelector('.base-salary-input').value) || 0;
        const tdsPercentInput = row.querySelector('.tds-input');
        const globalTds = parseFloat(document.getElementById('global-tds-percent')?.value) || 0;
        const tdsPercent = tdsPercentInput.value !== '' ? parseFloat(tdsPercentInput.value) : globalTds;

        const unpaidDays = parseFloat(row.querySelector('.unpaid-leaves-count').textContent) || 0;
        const netSalary = Math.max(0, base - (base / 22 * unpaidDays));
        const tdsAmount = Math.round(netSalary * (tdsPercent / 100));
        const finalNet = Math.max(0, netSalary - tdsAmount);

        row.querySelector('.tds-amount').textContent = `Rs ${tdsAmount.toLocaleString()}`;
        row.querySelector('.final-net-salary').textContent = `Rs ${finalNet.toLocaleString()}`;
        row.querySelector('.salary-input').value = Math.round(netSalary);
    };

    window.app_recalculateAllSalaries = () => {
        const rows = document.querySelectorAll('.salary-processing-table tbody tr');
        rows.forEach(row => window.app_recalculateRow(row));
    };

    return `
        <div class="card full-width">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.25rem;">Salary Processing</h3>
                    <p class="text-muted">Period: ${monthLabel}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="background: #f8fafc; padding: 0.5rem 1rem; border-radius: 0.6rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.5rem;">
                        <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">Global TDS:</label>
                        <input type="number" id="global-tds-percent" value="0" min="0" max="100" style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;" onchange="window.app_recalculateAllSalaries()">
                        <span style="font-weight: 600; color: #64748b;">%</span>
                    </div>
                    ${isFullAdmin ? `<button class="action-btn" onclick="window.app_saveAllSalaries()" style="padding: 0.6rem 1.2rem;">Save All & Lock</button>` : ''}
                </div>
            </div>

            <div class="table-container salary-processing-table-wrap">
                <table class="salary-processing-table">
                    <thead>
                        <tr>
                            <th>Staff Member</th>
                            <th>Base Salary</th>
                            <th>Present</th>
                            <th>Unpaid</th>
                            <th>Deductions</th>
                            <th>Calculated</th>
                            <th>TDS %</th>
                            <th>Final Net</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summary.map(item => {
        const { user, stats } = item;
        const base = user.baseSalary || 0;
        const unpaid = stats.unpaidLeaves || 0;
        const net = Math.round(Math.max(0, base - (base / 22 * unpaid)));
        return `
                                <tr data-user-id="${user.id}">
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <img src="${user.avatar}" style="width: 28px; height: 28px; border-radius: 50%;">
                                            <div style="font-weight: 600;">${safeHtml(user.name)}</div>
                                        </div>
                                    </td>
                                    <td><input type="number" class="base-salary-input" value="${base}" style="width: 80px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td><span class="present-count">${stats.present}</span></td>
                                    <td><span class="unpaid-leaves-count">${unpaid}</span></td>
                                    <td class="deduction-amount" style="color:#ef4444;">-Rs ${Math.round(base / 22 * unpaid).toLocaleString()}</td>
                                    <td><input type="number" class="salary-input" value="${net}" style="width: 90px;"></td>
                                    <td><input type="number" class="tds-input" value="" placeholder="Global" style="width: 60px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td class="final-net-salary" style="font-weight:700; color:#1e40af;">Rs ${net.toLocaleString()}</td>
                                    <td class="tds-amount" style="display:none;">0</td>
                                    <td><button class="action-btn secondary" onclick="window.app_generateSalarySlip('${user.id}')">Slip</button></td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export async function renderPolicyTest() {
    const today = new Date().toISOString().split('T')[0];

    window.app_runPolicyTest = () => {
        const checkIn = document.getElementById('policy-test-checkin')?.value;
        const checkOut = document.getElementById('policy-test-checkout')?.value;
        const output = document.getElementById('policy-test-output');
        if (!checkIn || !checkOut || !output) return;

        const date = document.getElementById('policy-test-date')?.value;
        const inDt = new Date(`${date}T${checkIn}`);
        const outDt = new Date(`${date}T${checkOut}`);
        const durationHr = (outDt - inDt) / (1000 * 60 * 60);

        let status = 'Absent';
        if (durationHr >= 8) status = 'Present';
        else if (durationHr >= 4) status = 'Half Day';

        output.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="stat-card"><div class="label">Status</div><div class="value">${status}</div></div>
                <div class="stat-card"><div class="label">Duration</div><div class="value">${durationHr.toFixed(2)} hrs</div></div>
            </div>
        `;
    };

    return `
        <div class="card full-width">
            <h3 style="margin-bottom:1rem;">Policy Simulator</h3>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin-bottom:1rem;">
                <input type="date" id="policy-test-date" value="${today}">
                <input type="time" id="policy-test-checkin" value="09:00">
                <input type="time" id="policy-test-checkout" value="18:00">
            </div>
            <button class="action-btn" onclick="window.app_runPolicyTest()">Test Outcome</button>
            <div id="policy-test-output" style="margin-top:1.5rem;"></div>
        </div>
    `;
}

// Global Exports
if (typeof window !== 'undefined') {
    if (!window.AppUI) window.AppUI = {};
    window.AppUI.renderSalaryProcessing = renderSalaryProcessing;
    window.AppUI.renderPolicyTest = renderPolicyTest;
}
