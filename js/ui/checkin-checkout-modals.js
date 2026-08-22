/**
 * Check-in modal rendering.
 *
 * Checkout form UI now lives in checkout-form.js. Re-exports below keep older
 * imports working while giving checkout its own file.
 */

import { safeHtml } from './helpers.js';
export { renderCheckoutModal, initCheckoutObserver } from './checkout-form.js';

export function renderCheckInModal(existingPlans = []) {
    let plansHtml = '';
    if (existingPlans && existingPlans.length > 0) {
        const list = existingPlans.map(p =>
            `<div class="checkin-plan-item">
                <span class="checkin-plan-bullet">&bull;</span> ${safeHtml(p.task)}
                ${p.subPlans && p.subPlans.length > 0 ? `<div class="checkin-subtask-count">+ ${p.subPlans.length} sub-tasks</div>` : ''}
             </div>`
        ).join('');

        plansHtml = `
            <div class="checkin-plans-panel">
                 <label class="checkin-field-label">Your Planned Tasks</label>
                 <div class="checkin-plans-list">
                    ${list}
                 </div>
            </div>
        `;
    }

    const promptText = (existingPlans && existingPlans.length > 0)
        ? 'Add another task? (Optional)'
        : "What's your main focus today?";

    const requiredAttr = (existingPlans && existingPlans.length > 0) ? '' : 'required';

    return `
    <div class="modal-overlay checkin-modal-overlay" id="checkin-modal" style="display:flex;">
        <div class="modal-content checkin-modal-content">
             <div class="checkin-modal-head">
                <div class="checkin-modal-title-row">
                    <div class="checkin-modal-icon">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                    <div>
                        <h3>Start Your Day</h3>
                        <p>Set your goal and check in</p>
                    </div>
                </div>
                <button type="button" class="checkin-close-btn" onclick="document.getElementById('checkin-modal').remove()" aria-label="Close check-in">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form onsubmit="window.app_submitCheckIn(event)">
                ${plansHtml}
                <div class="checkin-task-field">
                     <label class="checkin-field-label">${promptText}</label>
                     <textarea id="checkin-task" ${requiredAttr} placeholder="e.g. Complete the monthly financial report..." class="checkin-task-input"></textarea>
                </div>

                <div class="checkin-actions">
                    <button type="button" class="checkin-cancel-btn" onclick="document.getElementById('checkin-modal').remove()">Cancel</button>
                    <button type="submit" class="checkin-submit-btn">
                        <span>Confirm & Check In</span>
                    </button>
                </div>
            </form>
        </div>
    </div>`;
}
