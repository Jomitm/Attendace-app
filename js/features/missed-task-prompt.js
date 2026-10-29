import { normalizeTaskStatus } from '../utils/task-status.js';

const MISSED_STATUSES = new Set(['overdue', 'missed', 'not-completed']);
let promptedOnLoginFor = '';
let checkInFlight = null;

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function currentWeekRange() {
    const todayKey = String(window.AppCalendar?.getTodayKey?.() || new Date().toISOString().slice(0, 10));
    const today = new Date(`${todayKey}T12:00:00`);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: dateKey(monday), end: dateKey(sunday), today: todayKey };
}

async function getMissedTasks(userId) {
    const service = window.AppAnalyticsService;
    if (!service?.getWorkPlansByDateRange || !userId) return [];
    const range = currentWeekRange();
    const plans = await service.getWorkPlansByDateRange(range.start, range.end);
    const tasks = [];

    (Array.isArray(plans) ? plans : []).forEach((plan) => {
        if (!plan || String(plan.userId || plan.user_id || '') !== String(userId)) return;
        const planDate = String(plan.date || '');
        if (!Array.isArray(plan.plans)) return;
        plan.plans.forEach((task, taskIndex) => {
            if (!task || typeof task !== 'object') return;
            const status = normalizeTaskStatus(task, planDate, window.AppCalendar?.getSmartTaskStatus?.bind(window.AppCalendar));
            if (!MISSED_STATUSES.has(status)) return;
            tasks.push({
                userId: String(userId),
                staffName: String(plan.userName || window.AppAuth?.getUser?.()?.name || 'Staff'),
                planId: String(plan.id || ''),
                taskIndex,
                date: planDate,
                description: String(task.task || 'Missed task'),
                status,
                planScope: String(task.planScope || plan.planScope || 'personal')
            });
        });
    });

    const seen = new Set();
    return tasks
        .filter((task) => {
            if (!task.planId || !Number.isInteger(task.taskIndex)) return false;
            const key = `${task.planId}__${task.taskIndex}__${task.userId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.taskIndex - b.taskIndex);
}

function closePrompt() {
    const prompt = document.getElementById('missed-task-prompt');
    prompt?.remove();
}

function openTaskInTeamActivities(task) {
    closePrompt();
    window.app_pendingMissedTaskFocus = { ...task };
    const currentHash = String(window.location.hash || '').replace(/^#/, '');
    if (currentHash !== 'team-activities') {
        window.location.hash = 'team-activities';
        return;
    }
    if (typeof window.app_teamActivitiesFocusTask === 'function') {
        window.app_teamActivitiesFocusTask(task);
    } else {
        window.app_teamActivitiesRefresh?.();
    }
}

function showPrompt(tasks) {
    closePrompt();
    if (!tasks.length) return;
    const items = tasks.map((task, index) => `
        <li class="missed-task-prompt-item">
            <div class="missed-task-prompt-item-main">
                <span class="missed-task-prompt-date">${escapeHtml(task.date || 'Earlier this week')}</span>
                <strong>${escapeHtml(task.description)}</strong>
                <span class="missed-task-prompt-status">${escapeHtml(task.status.replace(/-/g, ' '))}</span>
            </div>
            <button type="button" class="missed-task-prompt-open" data-missed-task-index="${index}">
                Open task <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
        </li>
    `).join('');
    const overlay = document.createElement('div');
    overlay.id = 'missed-task-prompt';
    overlay.className = 'missed-task-prompt-overlay';
    overlay.innerHTML = `
        <section class="missed-task-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="missed-task-prompt-title">
            <header class="missed-task-prompt-header">
                <span class="missed-task-prompt-icon"><i class="fa-solid fa-list-check" aria-hidden="true"></i></span>
                <button type="button" class="missed-task-prompt-close" aria-label="Close missed tasks"><i class="fa-solid fa-xmark"></i></button>
                <div class="missed-task-prompt-eyebrow">TEAM ACTIVITIES</div>
                <h2 id="missed-task-prompt-title">${tasks.length} missed task${tasks.length === 1 ? '' : 's'} to review</h2>
                <p>Open a task to find it in Team Activities and decide what to do next.</p>
            </header>
            <ul class="missed-task-prompt-list">${items}</ul>
            <footer class="missed-task-prompt-footer">
                <span>Tasks from this week</span>
                <button type="button" class="missed-task-prompt-dismiss">Review later</button>
            </footer>
        </section>
    `;
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay || event.target.closest('.missed-task-prompt-close, .missed-task-prompt-dismiss')) {
            closePrompt();
            return;
        }
        const button = event.target.closest('[data-missed-task-index]');
        if (!button) return;
        const task = tasks[Number(button.dataset.missedTaskIndex)];
        if (task) openTaskInTeamActivities(task);
    });
    overlay.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePrompt();
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    overlay.querySelector('.missed-task-prompt-close')?.focus();
}

window.app_checkMissedTaskPrompt = async (trigger = 'login', options = {}) => {
    const user = window.AppAuth?.getUser?.();
    if (!user?.id) return;
    if (trigger === 'plan-save' && String(options.targetUserId || '') !== String(user.id)) return;
    if (trigger === 'login' && promptedOnLoginFor === String(user.id)) return;
    if (checkInFlight) {
        await checkInFlight;
        if (trigger === 'login' && promptedOnLoginFor === String(user.id)) return;
    }

    const userId = String(user.id);
    if (trigger === 'login') promptedOnLoginFor = userId;
    checkInFlight = getMissedTasks(userId)
        .then(showPrompt)
        .catch((error) => console.warn('[MissedTasks] Could not load missed tasks:', error))
        .finally(() => { checkInFlight = null; });
    await checkInFlight;
};

window.app_openMissedTaskInTeamActivities = openTaskInTeamActivities;
