/**
 * Tour Module
 * Handles one-time onboarding tours for Staff and Admin.
 */
(function () {
    class TourManager {
        constructor() {
            this.active = false;
            this.currentStep = 0;
            this.steps = [];
            this.overlay = null;
            this.tooltip = null;
            this.highlight = null;
            this.tourKey = 'crwi_tour_completed';
        }

        init(user) {
            if (!user) return;

            // Check if tour already completed
            if (localStorage.getItem(this.tourKey + '_' + user.id)) {
                console.log("Tour already completed for user:", user.id);
                return;
            }

            this.defineSteps(user);

            // Wait for UI to be ready
            setTimeout(() => {
                this.startTour(user);
            }, 2000);
        }

        defineSteps(user) {
            const isAdmin = user.isAdmin || user.role === 'Administrator';

            if (isAdmin) {
                this.steps = [
                    {
                        element: '.sidebar-header',
                        title: 'Welcome, Admin!',
                        content: 'This is your CRWI Attendance management console. Let us walk you through the key features.',
                        position: 'right'
                    },
                    {
                        element: '.nav-item[data-page="admin"]',
                        title: 'User Management',
                        content: 'In the Admin Panel, you can add new staff, edit details, and manage roles.',
                        position: 'right'
                    },
                    {
                        element: '.nav-item[data-page="master-sheet"]',
                        title: 'Attendance Sheet',
                        content: 'View and export the master attendance sheet for all employees here.',
                        position: 'right'
                    },
                    {
                        element: '.nav-item[data-page="salary"]',
                        title: 'Salary Processing',
                        content: 'Calculate and process salaries based on attendance logs and penalties.',
                        position: 'right'
                    },
                    {
                        element: '.main-content',
                        title: 'Dashboard Overview',
                        content: 'The dashboard gives you real-time insights into who is in, pending leaves, and team activity.',
                        position: 'bottom'
                    }
                ];
            } else {
                this.steps = [
                    {
                        element: '.sidebar-header',
                        title: 'Welcome to CRWI!',
                        content: 'This portal helps you track your attendance and work logs. Here is a quick guide.',
                        position: 'right'
                    },
                    {
                        element: '.action-btn',
                        title: 'Check-In / Out',
                        content: 'Use this button daily to mark your attendance. Don\'t forget to add a summary when checking out!',
                        position: 'bottom'
                    },
                    {
                        element: '.nav-item[data-page="timesheet"]',
                        title: 'Your Timesheet',
                        content: 'Review your past logs and request leaves from here.',
                        position: 'right'
                    },
                    {
                        element: '.nav-item[data-page="profile"]',
                        title: 'Your Profile',
                        content: 'View your stats, rewards, and manage your account details.',
                        position: 'right'
                    }
                ];
            }
        }

        startTour(user) {
            if (this.steps.length === 0) return;
            this.active = true;
            this.currentStep = 0;
            this.createUIElements();
            this.showStep();

            // Mark as completed immediately to prevent re-triggering if they refresh
            localStorage.setItem(this.tourKey + '_' + user.id, 'true');
        }

        createUIElements() {
            // Overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'tour-overlay';

            // Highlight box
            this.highlight = document.createElement('div');
            this.highlight.className = 'tour-highlight';

            // Tooltip
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tour-tooltip';

            document.body.appendChild(this.overlay);
            document.body.appendChild(this.highlight);
            document.body.appendChild(this.tooltip);
        }

        showStep() {
            const step = this.steps[this.currentStep];
            const target = document.querySelector(step.element);

            if (!target || target.offsetParent === null) {
                // If element missed or hidden, try next or end
                console.warn("Tour target not found:", step.element);
                this.nextStep();
                return;
            }

            // Position highlight
            const rect = target.getBoundingClientRect();
            const padding = 5;

            this.highlight.style.top = (rect.top - padding) + 'px';
            this.highlight.style.left = (rect.left - padding) + 'px';
            this.highlight.style.width = (rect.width + padding * 2) + 'px';
            this.highlight.style.height = (rect.height + padding * 2) + 'px';

            // Scroll into view
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Tooltip Content
            this.tooltip.innerHTML = `
                <div class="tour-tooltip-header">
                    <h4>${step.title}</h4>
                    <span class="tour-progress">${this.currentStep + 1} / ${this.steps.length}</span>
                </div>
                <div class="tour-tooltip-content">${step.content}</div>
                <div class="tour-tooltip-footer">
                    <button class="tour-btn-skip" onclick="window.AppTour.endTour()">Skip</button>
                    <button class="tour-btn-next" onclick="window.AppTour.nextStep()">
                        ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            `;

            // Position tooltip
            this.positionTooltip(rect, step.position);

            this.tooltip.classList.add('active');
        }

        positionTooltip(targetRect, position) {
            const tipRect = this.tooltip.getBoundingClientRect();
            const margin = 15;

            let top, left;

            switch (position) {
                case 'right':
                    top = targetRect.top + (targetRect.height / 2) - (tipRect.height / 2);
                    left = targetRect.right + margin;
                    break;
                case 'bottom':
                    top = targetRect.bottom + margin;
                    left = targetRect.left + (targetRect.width / 2) - (tipRect.width / 2);
                    break;
                case 'left':
                    top = targetRect.top + (targetRect.height / 2) - (tipRect.height / 2);
                    left = targetRect.left - tipRect.width - margin;
                    break;
                case 'top':
                    top = targetRect.top - tipRect.height - margin;
                    left = targetRect.left + (targetRect.width / 2) - (tipRect.width / 2);
                    break;
                default:
                    top = targetRect.bottom + margin;
                    left = targetRect.left;
            }

            // Boundary checks
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            if (left < 10) left = 10;
            if (left + tipRect.width > winW - 10) left = winW - tipRect.width - 10;
            if (top < 10) top = 10;
            if (top + tipRect.height > winH - 10) top = winH - tipRect.height - 10;

            this.tooltip.style.top = top + 'px';
            this.tooltip.style.left = left + 'px';
        }

        nextStep() {
            this.currentStep++;
            if (this.currentStep < this.steps.length) {
                this.showStep();
            } else {
                this.endTour();
            }
        }

        endTour() {
            this.active = false;
            if (this.overlay) this.overlay.remove();
            if (this.highlight) this.highlight.remove();
            if (this.tooltip) this.tooltip.remove();
        }

        resetTour(userId) {
            localStorage.removeItem(this.tourKey + '_' + userId);
            window.location.reload();
        }
    }

    window.AppTour = new TourManager();
})();
