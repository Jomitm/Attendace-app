/**
 * Attendance Modals Component
 * Handles rendering of check-in/check-out modals and associated UI observers.
 */

import { safeHtml } from './helpers.js';

export function renderCheckInModal(existingPlans = []) {
    let plansHtml = '';
    if (existingPlans && existingPlans.length > 0) {
        const list = existingPlans.map(p =>
            `<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                <span style="font-weight:600;">•</span> ${safeHtml(p.task)}
                ${p.subPlans && p.subPlans.length > 0 ? `<div style="font-size:0.8rem; color:#0369a1; margin-left:12px; margin-top:2px;">+ ${p.subPlans.length} sub-tasks</div>` : ''}
             </div>`
        ).join('');

        plansHtml = `
            <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                 <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                 <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                    ${list}
                 </div>
            </div>
        `;
    }

    const promptText = (existingPlans && existingPlans.length > 0)
        ? "✨ Add another task? (Optional)"
        : "📝 What's your main focus today?";

    const requiredAttr = (existingPlans && existingPlans.length > 0) ? '' : 'required';

    return `
    <div class="modal-overlay" id="checkin-modal" style="display:flex;">
        <div class="modal-content" style="max-width: 500px; width: 95%; padding: 1.5rem; border-radius: 16px;">
             <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);">
                        <i class="fa-solid fa-user-check" style="color:white; font-size:1.1rem;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 1.2rem; margin:0; font-weight:700; color:#111827;">Start Your Day</h3>
                        <p style="font-size:0.8rem; color:#64748b; margin:0.25rem 0 0 0;">Set your goal and check in</p>
                    </div>
                </div>
                <button onclick="document.getElementById('checkin-modal').remove()" style="background:#f1f5f9; border:none; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition: all 0.2s;">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form onsubmit="window.app_submitCheckIn(event)">
                ${plansHtml}
                <div style="margin-bottom:1.25rem;">
                     <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.5rem;">${promptText}</label>
                     <div style="position:relative;">
                        <textarea id="checkin-task" ${requiredAttr} placeholder="e.g. Complete the monthly financial report..." style="width:100%; height:80px; padding:0.75rem; border:2px solid #e2e8f0; border-radius:10px; font-family:inherit; resize:none; font-size:0.95rem; line-height:1.5; transition: border-color 0.2s;"></textarea>
                     </div>
                </div>

                <div style="display:flex; gap:1rem;">
                    <button type="button" onclick="document.getElementById('checkin-modal').remove()" style="flex:1; padding:0.75rem; background:white; border:1px solid #e2e8f0; color:#64748b; border-radius:10px; font-weight:600; cursor:pointer;">Cancel</button>
                    <button type="submit" style="flex:2; padding:0.75rem; background:linear-gradient(135deg, #16a34a 0%, #15803d 100%); border:none; color:white; border-radius:10px; font-weight:700; cursor:pointer; box-shadow:0 4px 6px -1px rgba(22, 163, 74, 0.4);">
                        <span>🚀 Confirm & Check In</span>
                    </button>
                </div>
            </form>
        </div>
    </div>`;
}

// Observer for Checkout Modal (Logic extracted from ui.js window scope)
export function initCheckoutObserver() {
    if (typeof window === 'undefined') return;

    const checkoutObserver = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            const modal = document.getElementById('checkout-modal');
            const introPanel = document.getElementById('checkout-intro-panel');

            if (modal && introPanel && modal.style.display !== 'none') {
                const introSeen = localStorage.getItem('checkoutIntroSeen');
                if (!introSeen) {
                    introPanel.style.display = 'block';
                }
            }
        });
    });

    const startObserving = () => {
        const modalContainer = document.body;
        if (modalContainer) {
            checkoutObserver.observe(modalContainer, {
                attributes: true,
                subtree: true,
                attributeFilter: ['style']
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }
}

if (typeof window !== 'undefined') {
    initCheckoutObserver();
}
