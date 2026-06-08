/**
 * Check-out form modal rendering.
 *
 * Submit handlers, location capture, and attendance persistence stay in app.js
 * and modules/attendance.js. This file owns only the checkout form UI markup
 * and its small visibility observer.
 */

export function renderCheckoutModal(budgetSelectHtml = '<option value="UNALLOCATED">Unallocated / To Be Mapped</option>') {
    return `
        <!-- Check-Out Modal -->
        <div id="checkout-modal" class="modal-overlay checkout-main-modal" style="display: none;">
            <div class="modal-content checkout-main-content">
                <div class="checkout-modal-header">
                    <div>
                        <h3 class="checkout-modal-title">Check Out</h3>
                        <p class="checkout-modal-subtitle">Update task outcomes, add notes, and close today’s attendance.</p>
                    </div>
                    <span class="checkout-modal-badge">Attendance</span>
                </div>
                <form id="checkout-form" novalidate>
                    <div class="checkout-form-grid">
                        <section class="checkout-form-panel checkout-summary-panel">
                            <label class="checkout-section-label">Work Summary</label>
                            <textarea name="description" class="checkout-summary-input" placeholder="- Completed monthly report&#10;- Fixed login bug..."></textarea>
                        </section>

                        <section class="checkout-form-panel checkout-tomorrow-panel">
                            <label>Tomorrow Goal (Optional)</label>
                            <textarea name="tomorrowGoal" placeholder="e.g., Finalize the project report..."></textarea>
                            <div class="checkout-budget-field">
                                <label>Tomorrow Goal Budget Head</label>
                                <select name="tomorrowBudgetHeadId">
                                    ${budgetSelectHtml}
                                </select>
                            </div>
                        </section>
                    </div>

                    <section id="checkout-plan-ref" class="checkout-plan-ref" style="display:none;">
                        <div class="checkout-plan-ref-head">
                            <label>Today’s Work Plan</label>
                            <button type="button" onclick="window.app_useWorkPlan()">Use This</button>
                        </div>
                        <div id="checkout-plan-text" class="checkout-plan-text"></div>
                    </section>

                    <section id="checkout-task-checklist" class="checkout-task-checklist">
                        <label class="checkout-section-label">Today's Task Status</label>
                        <div id="checkout-task-list" class="checkout-task-list">
                            <!-- Populated by JS -->
                        </div>
                    </section>

                    <section id="checkout-action-preview" class="checkout-action-preview" style="display: none;">
                        <label class="checkout-section-label">Action Preview</label>
                        <div id="checkout-action-preview-list" class="checkout-action-preview-list">
                            <!-- Populated by JS -->
                        </div>
                    </section>

                    <section id="delegate-panel" class="checkout-delegate-panel" style="display:none;">
                        <h4 id="delegate-selected-task"></h4>
                        <label>Choose staff member:</label>
                        <div id="delegate-list" class="checkout-delegate-list">
                            <!-- Populated by JS -->
                        </div>
                        <div class="checkout-delegate-actions">
                            <button type="button" onclick="window.app_handleChecklistAction(null, null, null)" class="action-btn secondary">Cancel Delegation</button>
                        </div>
                    </section>

                    <div id="checkout-location-loading" class="checkout-location-loading" style="display:none;">
                         <span><i class="fa-solid fa-spinner fa-spin"></i> <span id="checkout-location-message">Capturing location</span></span>
                         <span id="checkout-location-timer" class="checkout-location-timer">00:00</span>
                    </div>
                    <div id="checkout-location-mismatch" class="checkout-location-mismatch" style="display:none;">
                         <div class="checkout-location-mismatch-title">
                            <i class="fa-solid fa-triangle-exclamation"></i> Location Mismatch
                         </div>
                         <p>You are checking out from a different location than where you checked in. Please explain:</p>
                         <textarea name="locationExplanation" placeholder="e.g. Field visit, Client site..."></textarea>
                    </div>

                    <div class="checkout-actions">
                        <button type="button" class="checkout-cancel-btn" onclick="document.getElementById('checkout-modal').style.display = 'none'; window.app_resetCheckoutLocationSession?.();">Cancel</button>
                        <button type="submit" class="action-btn checkout checkout-submit-btn">Complete Check-Out</button>
                    </div>
                </form>
            </div>
        </div>`;
}

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
