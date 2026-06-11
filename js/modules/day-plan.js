import { AppAuth } from './auth.js';
import { AppDB } from './db.js';
import { AppCalendar } from './calendar.js';
import { AppConfig } from '../config.js';

let aiAssistantModulePromise = null;
async function getAIAssistant() {
    if (window.AppAIAssistant) return window.AppAIAssistant;
    if (!aiAssistantModulePromise) {
        aiAssistantModulePromise = import('./ai-assistant.js').then((mod) => mod.AppAIAssistant || mod.default || window.AppAIAssistant);
    }
    return aiAssistantModulePromise;
}

// --- Helper Functions ---

function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.id) el.id = options.id;
    if (options.className) el.className = options.className;
    if (options.textContent) el.textContent = options.textContent;
    if (options.innerHTML) el.innerHTML = options.innerHTML;
    if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
            el.setAttribute(key, value);
        }
    }
    if (options.children) {
        for (const child of options.children) {
            el.appendChild(child);
        }
    }
    return el;
}

function createButton(options = {}) {
    const btn = createElement('button', {
        className: options.className,
        textContent: options.textContent,
        innerHTML: options.innerHTML,
        attributes: { type: 'button', ...options.attributes }
    });
    if (options.onClick) btn.addEventListener('click', options.onClick);
    return btn;
}

function scheduleNextPaint(callback) {
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => window.setTimeout(callback, 0));
        return;
    }
    window.setTimeout(callback, 0);
}

const DAY_PLAN_PREFETCH_TTL_MS = 15000;
const dayPlanPrefetchCache = new Map();

async function getCachedDayPlanUsers() {
    const cacheKey = AppDB.getCacheKey
        ? AppDB.getCacheKey('dayPlanUsers', 'users', { scope: 'day-plan' })
        : 'dayPlanUsers:users:scope';
    const ttl = Number(AppConfig?.READ_CACHE_TTLS?.users || 60000);
    if (AppDB.getCached) {
        return AppDB.getCached(cacheKey, ttl, () => AppDB.getAll('users'));
    }
    return AppDB.getAll('users');
}

function buildBudgetHeadLookup() {
    const budgetHeads = Array.isArray(window.app_budgetHeadsCache)
        ? window.app_budgetHeadsCache
        : [{ id: 'UNALLOCATED', code: 'UNALLOCATED', name: 'Unallocated / To Be Mapped' }];
    const lookup = new Map();
    budgetHeads.forEach((head) => {
        const id = String(head?.id || '').trim();
        if (!id) return;
        lookup.set(id, {
            id,
            code: String(head?.code || id).trim(),
            name: String(head?.name || id).trim()
        });
    });
    return lookup;
}

function getBudgetHeadLabel(budgetHeadId, lookup = buildBudgetHeadLookup()) {
    const id = String(budgetHeadId || '').trim();
    if (!id) return '';
    const head = lookup.get(id);
    if (!head) return id;
    return `${head.code} - ${head.name}`;
}

async function getRecentPersonalPlanHistory(targetId, beforeDate, targetUserName = '') {
    const safeTargetId = String(targetId || '').trim();
    const safeBeforeDate = String(beforeDate || '').trim();
    if (!safeTargetId || !safeBeforeDate) {
        return {
            sourceScope: 'No recent personal plan history available',
            historyAvailable: false,
            recentPlans: [],
            recurringBudgetHeads: [],
            recurringSteps: []
        };
    }

    let historyRows = [];
    try {
        const dateScopedRows = await AppDB.queryMany('work_plans', [
            { field: 'date', operator: '<', value: safeBeforeDate }
        ], {
            orderBy: [{ field: 'date', direction: 'desc' }],
            limit: 30
        });
        historyRows = (dateScopedRows || [])
            .filter((plan) =>
                String(plan?.userId || '').trim() === safeTargetId
                && String(plan?.planScope || 'personal').toLowerCase() === 'personal'
            )
            .slice(0, 8);
    } catch (queryErr) {
        console.warn('Failed to query recent plan history, falling back to cached scan:', queryErr);
        const allPlans = await AppDB.getAll('work_plans').catch(() => []);
        historyRows = (allPlans || [])
            .filter((plan) =>
                String(plan?.userId || '').trim() === safeTargetId
                && String(plan?.planScope || 'personal').toLowerCase() === 'personal'
                && String(plan?.date || '').trim() < safeBeforeDate
            )
            .sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')))
            .slice(0, 8);
    }

    const budgetLookup = buildBudgetHeadLookup();
    const budgetHeadCounts = new Map();
    const stepCounts = new Map();
    const recentPlans = (historyRows || [])
        .map((plan) => {
            const validTasks = Array.isArray(plan?.plans)
                ? plan.plans.filter((task) => task && task.isRemoved !== true)
                : [];
            const normalizedTasks = validTasks.map((task) => ({
                task: String(task?.task || '').trim(),
                subPlans: Array.isArray(task?.subPlans) ? task.subPlans.map((step) => String(step || '').trim()).filter(Boolean).slice(0, 5) : [],
                budgetHeadId: String(task?.budgetHeadId || '').trim(),
                status: String(task?.status || '').trim(),
                assignedTo: String(task?.assignedTo || '').trim()
            })).filter((task) => task.task);

            normalizedTasks.forEach((task) => {
                if (task.budgetHeadId) {
                    budgetHeadCounts.set(task.budgetHeadId, (budgetHeadCounts.get(task.budgetHeadId) || 0) + 1);
                }
                task.subPlans.forEach((step) => {
                    const key = step.toLowerCase();
                    stepCounts.set(key, {
                        text: step,
                        count: (stepCounts.get(key)?.count || 0) + 1
                    });
                });
            });

            const taskSummary = normalizedTasks.slice(0, 3).map((task) => {
                const stepText = task.subPlans.length ? ` | Steps: ${task.subPlans.join('; ')}` : '';
                return `${task.task}${stepText}`;
            }).join(' || ');

            const planBudgetHeadId = normalizedTasks.find((task) => task.budgetHeadId)?.budgetHeadId
                || String(plan?.budgetHeadId || '').trim();

            return {
                date: String(plan?.date || '').trim(),
                budgetHeadId: planBudgetHeadId,
                budgetHeadLabel: getBudgetHeadLabel(planBudgetHeadId, budgetLookup),
                taskCount: normalizedTasks.length,
                summary: taskSummary || 'No active tasks'
            };
        })
        .filter((plan) => plan.date);

    const recurringBudgetHeads = Array.from(budgetHeadCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, count]) => ({
            id,
            label: getBudgetHeadLabel(id, budgetLookup),
            count
        }));

    const recurringSteps = Array.from(stepCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((entry) => entry.text);

    return {
        sourceScope: `Recent personal plans for ${targetUserName || safeTargetId} before ${safeBeforeDate}`,
        historyAvailable: recentPlans.length > 0,
        recentPlans,
        recurringBudgetHeads,
        recurringSteps
    };
}

function buildStaffDraftContext({
    date,
    scope,
    action,
    currentPlan,
    collaborators,
    historySummary,
    notes
}) {
    return {
        date,
        scope,
        action,
        currentPlan,
        collaborators,
        historySummary,
        notes
    };
}

function normalizeDayPlanTargetId(targetUserId) {
    const currentUser = AppAuth.getUser();
    const targetIdRaw = String(targetUserId ?? '').trim();
    return (!targetIdRaw || targetIdRaw === 'undefined' || targetIdRaw === 'null')
        ? currentUser?.id
        : targetIdRaw;
}

function getDayPlanPrefetchKey(date, targetUserId = null, forcedScope = null, options = {}) {
    const targetId = normalizeDayPlanTargetId(targetUserId);
    return JSON.stringify({
        date: String(date || '').trim(),
        targetId: String(targetId || ''),
        forcedScope: forcedScope === 'annual' ? 'annual' : 'personal',
        hideAutoForwardedTasks: options?.hideAutoForwardedTasks === true,
        skipCarryForwardSync: options?.skipCarryForwardSync === true,
        skipCarryForwardCleanup: options?.skipCarryForwardCleanup === true
    });
}

function getDayPlanPrefetchRecord(date, targetUserId = null, forcedScope = null, options = {}) {
    const currentUser = AppAuth.getUser();
    if (!currentUser) return null;

    const targetId = normalizeDayPlanTargetId(targetUserId) || currentUser.id;
    const key = getDayPlanPrefetchKey(date, targetId, forcedScope, options);
    const now = Date.now();
    const existing = dayPlanPrefetchCache.get(key);
    if (existing && existing.expiresAt > now) return existing;

    const todayKey = AppCalendar?.getTodayKey ? AppCalendar.getTodayKey() : '';
    const safeDate = String(date || '').trim();
    const canPrefetchPlans = !!todayKey && safeDate > todayKey;
    const usersPromise = getCachedDayPlanUsers();
    const record = {
        key,
        date: safeDate,
        targetId,
        forcedScope: forcedScope === 'annual' ? 'annual' : 'personal',
        options: {
            hideAutoForwardedTasks: options?.hideAutoForwardedTasks === true,
            skipCarryForwardSync: options?.skipCarryForwardSync === true,
            skipCarryForwardCleanup: options?.skipCarryForwardCleanup === true
        },
        expiresAt: now + DAY_PLAN_PREFETCH_TTL_MS,
        usersPromise,
        dataPromise: null,
        promise: null
    };

    if (canPrefetchPlans) {
        record.dataPromise = (async () => {
            const [allUsers, personalWorkPlan, annualWorkPlan, allDayPlans] = await Promise.all([
                usersPromise,
                AppCalendar.getWorkPlan(targetId, safeDate, { planScope: 'personal' }),
                AppCalendar.getWorkPlan(targetId, safeDate, { planScope: 'annual' }),
                AppDB.queryMany('work_plans', [{ field: 'date', operator: '==', value: safeDate }])
            ]);
            return {
                allUsers,
                personalWorkPlan,
                annualWorkPlan,
                allDayPlans
            };
        })();
        record.promise = record.dataPromise;
    } else {
        record.promise = usersPromise.then((allUsers) => ({ allUsers }));
    }

    record.promise.catch(() => {
        dayPlanPrefetchCache.delete(key);
    });
    dayPlanPrefetchCache.set(key, record);
    return record;
}

function createDayPlanLoadingState(message = 'Loading Plan Your Day...') {
    const loader = createElement('div', { className: 'day-plan-loading-state' });
    loader.style.display = 'flex';
    loader.style.alignItems = 'center';
    loader.style.justifyContent = 'center';
    loader.style.minHeight = '260px';
    loader.style.padding = '1.25rem';
    loader.style.textAlign = 'center';

    const panel = createElement('div', { className: 'day-plan-loading-panel' });
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.alignItems = 'center';
    panel.style.gap = '0.75rem';
    panel.style.maxWidth = '420px';

    const icon = createElement('span', {
        className: 'day-plan-loading-icon',
        innerHTML: '<i class="fa-solid fa-spinner fa-spin"></i>'
    });
    icon.style.fontSize = '1.25rem';
    icon.style.color = '#1d4ed8';

    const text = createElement('div', {
        className: 'day-plan-loading-copy',
        textContent: message
    });
    text.style.fontWeight = '600';
    text.style.color = '#1f2937';

    const hint = createElement('div', {
        className: 'day-plan-loading-hint',
        textContent: 'We are preparing your day plan now.'
    });
    hint.style.fontSize = '0.92rem';
    hint.style.color = '#64748b';

    panel.appendChild(icon);
    panel.appendChild(text);
    panel.appendChild(hint);
    loader.appendChild(panel);
    return loader;
}

const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatFriendlyDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

/* ============================================================
   STATUS INDICATOR — returns a DOM element
   ============================================================
   completed     → green tick in green circle
   not-completed → calendar icon in orange circle (postponed)
   in-process    → spinner icon in blue circle
   null / ''     → empty dashed circle (auto-track)
   ============================================================ */
function createStatusIndicator(status) {
    const s = String(status || '').trim().toLowerCase();
    let iconHTML = '';
    let cls = 'plan-status-indicator';

    switch (s) {
        case 'completed':
            cls += ' plan-status-completed';
            iconHTML = '<i class="fa-solid fa-check"></i>';
            break;
        case 'not-completed':
            cls += ' plan-status-postponed';
            iconHTML = '<i class="fa-regular fa-calendar"></i>';
            break;
        case 'in-process':
            cls += ' plan-status-inprogress';
            iconHTML = '<i class="fa-solid fa-rotate"></i>';
            break;
        default:
            cls += ' plan-status-none';
            iconHTML = '';
            break;
    }

    return createElement('span', {
        className: cls,
        innerHTML: iconHTML,
        attributes: { 'data-status': s || 'none', title: s ? s.replace('-', ' ') : 'Auto-track' }
    });
}

// --- UI Components ---

function createDayPlanHeader(date, isEditingOther, headerName, hasAnyExistingPlan, targetId) {
    const title = createElement('h3', { textContent: 'Plan Your Day' });
    const dateLabel = formatFriendlyDate(date) || date;
    const subtitle = createElement('p', {
        className: 'day-plan-subline',
        textContent: isEditingOther ? `${dateLabel} · Editing for ${headerName}` : dateLabel
    });

    const deleteBtn = hasAnyExistingPlan ?
        createButton({
            className: 'day-plan-delete-btn',
            attributes: { title: 'Delete plan' },
            innerHTML: '<i class="fa-solid fa-trash"></i>',
            onClick: () => window.app_deleteDayPlan(date, targetId)
        }) :
        null;

    const closeBtn = createButton({
        className: 'day-plan-close-btn',
        attributes: { title: 'Close' },
        innerHTML: '<i class="fa-solid fa-xmark"></i>',
        onClick: (e) => e.currentTarget.closest('.day-plan-modal-overlay').remove()
    });

    const headerActions = createElement('div', {
        className: 'day-plan-header-actions',
        children: [deleteBtn, closeBtn].filter(Boolean)
    });

    return createElement('div', {
        className: 'day-plan-header',
        children: [
            createElement('div', {
                className: 'day-plan-headline',
                children: [
                    createElement('span', { className: 'day-plan-kicker', textContent: 'Today' }),
                    title,
                    subtitle
                ]
            }),
            headerActions
        ]
    });
}

function createDayPlanForm(date, targetId, personalWorkPlan, annualWorkPlan, initialBlocks, allUsers, defaultScope, selectableCollaborators, isAdmin, currentUser) {
    const batchSize = 4;
    const scopeBuckets = {
        personal: [],
        annual: [],
        context: 0
    };
    initialBlocks.forEach((plan, idx) => {
        const scope = plan.planScope || plan._planScope || defaultScope;
        const normalizedPlan = { ...plan, _lazyIndex: idx };
        if (scope === 'annual' || plan.isReference) {
            scopeBuckets.annual.push(normalizedPlan);
        } else {
            scopeBuckets.personal.push(normalizedPlan);
        }
        if (plan.isReference === true) scopeBuckets.context += 1;
    });

    const renderState = {
        personal: { pending: [...scopeBuckets.personal], nextIndex: 0, done: false },
        annual: { pending: [...scopeBuckets.annual], nextIndex: 0, done: false }
    };

    const personalContainer = createElement('div', {
        className: 'day-plan-scroll-area personal-plans-container',
        attributes: { 'data-scope': 'personal' }
    });
    const personalExistingContainer = createElement('div', {
        className: 'day-plan-existing-blocks',
        attributes: { 'data-scope': 'personal-existing' }
    });
    const personalSentinel = createElement('div', {
        className: 'day-plan-load-sentinel',
        attributes: { 'aria-hidden': 'true' }
    });
    const personalNewContainer = createElement('div', {
        className: 'day-plan-new-blocks',
        attributes: { 'data-scope': 'personal-new' }
    });
    personalContainer.appendChild(personalExistingContainer);
    personalContainer.appendChild(personalSentinel);
    personalContainer.appendChild(personalNewContainer);

    const othersContainer = createElement('div', {
        className: 'day-plan-scroll-area others-plans-container',
        attributes: { 'data-scope': 'annual' }
    });
    const othersExistingContainer = createElement('div', {
        className: 'day-plan-existing-blocks',
        attributes: { 'data-scope': 'annual-existing' }
    });
    const othersSentinel = createElement('div', {
        className: 'day-plan-load-sentinel',
        attributes: { 'aria-hidden': 'true' }
    });
    const othersNewContainer = createElement('div', {
        className: 'day-plan-new-blocks',
        attributes: { 'data-scope': 'annual-new' }
    });
    othersContainer.appendChild(othersExistingContainer);
    othersContainer.appendChild(othersSentinel);
    othersContainer.appendChild(othersNewContainer);

    const renderBatch = (scope, forceAll = false) => {
        const container = scope === 'annual' ? othersExistingContainer : personalExistingContainer;
        const state = renderState[scope];
        if (!state || state.done) return false;
        const limit = forceAll ? state.pending.length : Math.min(batchSize, state.pending.length);
        if (limit <= 0) {
            state.done = true;
            return false;
        }
        const frag = document.createDocumentFragment();
        const startIndex = state.nextIndex;
        const batch = state.pending.splice(0, limit);
        batch.forEach((plan, offset) => {
            frag.appendChild(dayPlanRenderBlockV3({
                plan,
                idx: startIndex + offset,
                allUsers,
                targetId,
                defaultScope,
                selectableCollaborators,
                isAdmin,
                currentUserId: currentUser.id,
                isReference: plan.isReference
            }));
        });
        state.nextIndex += batch.length;
        container.appendChild(frag);
        if (state.pending.length === 0) state.done = true;
        return state.pending.length > 0;
    };

    const flushAllPending = () => {
        renderBatch('personal', true);
        renderBatch('annual', true);
    };

    const personalCount = scopeBuckets.personal.length;
    const annualCount = scopeBuckets.annual.length;
    const contextCount = scopeBuckets.context;

    const toolbar = createElement('div', {
        className: 'day-plan-toolbar',
        children: [
            createElement('div', {
                className: 'day-plan-toolbar-copy',
                children: [
                    createElement('span', { className: 'day-plan-toolbar-kicker', textContent: 'Planner' }),
                    createElement('h4', { className: 'day-plan-toolbar-title', textContent: 'My Daily Plan' }),
                    createElement('p', {
                        className: 'day-plan-toolbar-subtitle',
                        textContent: 'Focus on the work that matters most today.'
                    })
                ]
            }),
            createButton({
                className: 'day-plan-new-task-btn',
                innerHTML: '<i class="fa-solid fa-plus"></i><span>New Task</span>',
                onClick: () => openPlanEditor({ date, targetId, scope: 'personal', allUsers, selectableCollaborators, isAdmin, container: personalNewContainer })
            })
        ]
    });

    const contextCard = createElement('div', {
        className: 'day-plan-context-card',
        children: [
            createElement('div', {
                className: 'day-plan-context-card-head',
                children: [
                    createElement('span', { className: 'day-plan-context-kicker', textContent: 'Context' }),
                    createElement('strong', { className: 'day-plan-context-title', textContent: 'Around You' })
                ]
            }),
            createElement('div', {
                className: 'day-plan-context-grid',
                children: [
                    createElement('div', {
                        className: 'day-plan-context-stat',
                        children: [
                            createElement('span', { textContent: 'Personal' }),
                            createElement('strong', { textContent: String(personalCount) })
                        ]
                    }),
                    createElement('div', {
                        className: 'day-plan-context-stat',
                        children: [
                            createElement('span', { textContent: 'Annual' }),
                            createElement('strong', { textContent: String(annualCount) })
                        ]
                    }),
                    createElement('div', {
                        className: 'day-plan-context-stat',
                        children: [
                            createElement('span', { textContent: 'Team' }),
                            createElement('strong', { textContent: String(contextCount) })
                        ]
                    })
                ]
            }),
            createButton({
                className: 'day-plan-context-link',
                attributes: { title: 'Open Team Schedule' },
                innerHTML: '<i class="fa-solid fa-calendar-days"></i><span>Schedule</span>',
                onClick: () => {
                    document.getElementById('day-plan-modal')?.remove();
                    if (typeof window.app_openDashboardSection === 'function') {
                        window.app_openDashboardSection('team-schedule');
                    } else {
                        window.location.hash = 'dashboard-section/team-schedule';
                    }
                }
            })
        ]
    });

    const teamTitleWrap = createElement('div', {
        className: 'day-plan-column-title-wrap',
        children: [
            createElement('span', { className: 'day-plan-column-icon day-plan-column-icon-muted', innerHTML: '<i class="fa-solid fa-people-group"></i>' }),
            createElement('div', {
                children: [
                    createElement('h4', {
                        className: 'day-plan-column-title',
                        innerHTML: 'Shared Plans <span class="team-plan-special-badge"><i class="fa-solid fa-star"></i> TEAM</span>'
                    }),
                    createElement('p', { className: 'day-plan-column-subtitle', textContent: 'Annual and referenced work for this day' })
                ]
            })
        ]
    });

    const columns = createElement('div', {
        className: 'day-plan-workspace',
        children: [
            createElement('div', {
                className: 'day-plan-column day-plan-column-equal',
                children: [
                    createElement('div', {
                        className: 'day-plan-column-head',
                        children: [
                            createElement('div', {
                                className: 'day-plan-column-title-wrap',
                                children: [
                                    createElement('span', { className: 'day-plan-column-icon', innerHTML: '<i class="fa-regular fa-calendar"></i>' }),
                                    createElement('div', {
                                        children: [
                                            createElement('h4', { className: 'day-plan-column-title', textContent: 'My Daily Plan' }),
                                            createElement('p', { className: 'day-plan-column-subtitle', textContent: 'Focus blocks and private tasks' })
                                        ]
                                    })
                                ]
                            }),
                            createButton({
                                className: 'day-plan-column-btn',
                                innerHTML: '<i class="fa-solid fa-plus"></i><span>Add task</span>',
                                onClick: () => openPlanEditor({ date, targetId, scope: 'personal', allUsers, selectableCollaborators, isAdmin, container: personalContainer })
                            })
                        ]
                    }),
                    personalContainer
                ]
            }),
            createElement('div', {
                className: 'day-plan-column day-plan-column-equal day-plan-context-column',
                children: [
                    contextCard,
                    createElement('div', {
                        className: 'day-plan-shared-shell',
                        children: [
                            createElement('div', {
                                className: 'day-plan-column-head day-plan-column-head-secondary',
                                children: [
                                    teamTitleWrap,
                                    createButton({
                                        className: 'day-plan-column-btn day-plan-column-btn-secondary',
                                        innerHTML: '<i class="fa-solid fa-plus"></i><span>Add annual</span>',
                                        onClick: () => openPlanEditor({ date, targetId, scope: 'annual', allUsers, selectableCollaborators, isAdmin, container: othersNewContainer })
                                    })
                                ]
                            }),
                            othersContainer
                        ]
                    })
                ]
            })
        ]
    });

    const discardBtn = createButton({
        className: 'day-plan-discard-btn',
        textContent: 'Discard',
        onClick: (e) => e.currentTarget.closest('.day-plan-modal-overlay').remove()
    });

    const saveBtn = createButton({
        className: 'day-plan-save-btn',
        innerHTML: '<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',
        attributes: { type: 'submit' }
    });

    const footer = createElement('div', {
        className: 'day-plan-footer',
        children: [
            createElement('div', { className: 'day-plan-actions', children: [discardBtn, saveBtn] })
        ]
    });

    const form = createElement('form', {
        className: 'day-plan-form',
        attributes: {
            'data-had-personal': personalWorkPlan ? '1' : '0',
            'data-had-annual': annualWorkPlan ? '1' : '0',
            'data-removed-tasks': '[]',
            'data-next-plan-index': String(initialBlocks.length)
        },
        children: [toolbar, columns, footer]
    });
    form.addEventListener('submit', (e) => window.app_saveDayPlan(e, date, targetId));
    form._dayPlanFlushPending = flushAllPending;

    const loadMoreIntoScope = (scope) => {
        const state = renderState[scope];
        if (!state || state.done || state.pending.length === 0) return;
        window.requestAnimationFrame?.(() => renderBatch(scope, false)) || window.setTimeout(() => renderBatch(scope, false), 0);
    };

    const observeSentinel = (root, sentinel, scope) => {
        if (!root || !sentinel || typeof IntersectionObserver !== 'function') return;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                loadMoreIntoScope(scope);
            }
        }, { root, rootMargin: '120px 0px', threshold: 0.01 });
        observer.observe(sentinel);
        form._dayPlanObservers = form._dayPlanObservers || [];
        form._dayPlanObservers.push(observer);
    };

    observeSentinel(personalContainer, personalSentinel, 'personal');
    observeSentinel(othersContainer, othersSentinel, 'annual');

    const loadMoreFallback = createButton({
        className: 'day-plan-load-more-btn',
        textContent: 'Load more',
        onClick: () => {
            loadMoreIntoScope('personal');
            loadMoreIntoScope('annual');
        }
    });
    loadMoreFallback.style.display = (scopeBuckets.personal.length > batchSize || scopeBuckets.annual.length > batchSize) ? 'inline-flex' : 'none';
    footer.appendChild(createElement('div', { className: 'day-plan-load-more-wrap', children: [loadMoreFallback] }));

    renderBatch('personal', false);
    renderBatch('annual', false);

    return form;
}

export function openPlanEditor(args) {
    const { date, targetId, scope, allUsers, selectableCollaborators, isAdmin, container, existingBlock = null } = args;
    const currentUser = AppAuth.getUser();
    const planData = existingBlock ? window.app_extractBlockData(existingBlock) : {
        task: '',
        subPlans: [],
        tags: [],
        status: null,
        assignedTo: targetId,
        startDate: date,
        endDate: date,
        planScope: scope,
        carryForwardRootId: '',
        isRemoved: false
    };

    const overlay = createElement('div', { className: 'plan-editor-overlay' });
    const openLayers = Array.from(document.querySelectorAll('.day-plan-modal-overlay, .modal-overlay, .modal, .dashboard-max-overlay, .dashboard-max-window, .hero-task-modal-overlay, .hero-task-modal-shell'));
    const maxZ = openLayers.reduce((acc, el) => {
        const z = Number.parseInt(window.getComputedStyle(el).zIndex, 10);
        return Number.isFinite(z) ? Math.max(acc, z) : acc;
    }, 10040);
    overlay.style.zIndex = String(maxZ + 20);
    const modal = createElement('div', { className: 'plan-editor-modal' });

    const head = createElement('div', {
        className: 'plan-editor-head',
        innerHTML: `<h4>${existingBlock ? 'Edit' : 'Add'} ${scope === 'annual' ? 'Annual' : 'Personal'} Plan</h4>`
    });

    const body = createElement('div', { className: 'plan-editor-body' });
    const textarea = createElement('textarea', {
        className: 'plan-editor-textarea',
        textContent: planData.task,
        attributes: { placeholder: 'What is the objective or task for today?', required: true }
    });

    const grid = createElement('div', { className: 'plan-editor-grid' });
    const budgetHeads = Array.isArray(window.app_budgetHeadsCache) ? window.app_budgetHeadsCache : [{ id: 'UNALLOCATED', code: 'UNALLOCATED', name: 'Unallocated / To Be Mapped' }];

    const statusField = createElement('div', { className: 'plan-editor-field' });
    statusField.innerHTML = '<label>Status</label>';
    const statusSelect = createElement('select', { className: 'plan-editor-select' });
    statusSelect.innerHTML = `
        <option value="" ${!planData.status ? 'selected' : ''}>Auto-Track</option>
        <option value="completed" ${planData.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
        <option value="in-process" ${planData.status === 'in-process' ? 'selected' : ''}>🔄 In Progress</option>
        <option value="not-completed" ${planData.status === 'not-completed' ? 'selected' : ''}>📅 Postponed</option>
    `;
    statusField.appendChild(statusSelect);
    grid.appendChild(statusField);

    const budgetField = createElement('div', { className: 'plan-editor-field' });
    budgetField.innerHTML = '<label>Budget Head</label>';
    const budgetSelect = createElement('select', { className: 'plan-editor-select' });
    const currentBudgetHeadId = String(planData.budgetHeadId || AppAuth.getUser()?.currentBudgetHeadId || 'UNALLOCATED');
    const sortedBudgetHeads = [...budgetHeads].sort((a, b) => {
        if (String(a?.id || '') === 'UNALLOCATED') return -1;
        if (String(b?.id || '') === 'UNALLOCATED') return 1;
        const aLabel = `${String(a?.code || a?.id || '')} ${String(a?.name || '')}`.trim();
        const bLabel = `${String(b?.code || b?.id || '')} ${String(b?.name || '')}`.trim();
        return aLabel.localeCompare(bLabel, undefined, { numeric: true, sensitivity: 'base' });
    });
    sortedBudgetHeads.forEach((head) => {
        const id = String(head.id || '');
        const label = `${String(head.code || id)} - ${String(head.name || id)}`;
        const opt = createElement('option', { textContent: label, attributes: { value: id, selected: id === currentBudgetHeadId } });
        budgetSelect.appendChild(opt);
    });
    budgetField.appendChild(budgetSelect);
    grid.appendChild(budgetField);

    let assignSelect = null;
    if (isAdmin) {
        const assignField = createElement('div', { className: 'plan-editor-field' });
        assignField.innerHTML = '<label>Assign To</label>';
        assignSelect = createElement('select', { className: 'plan-editor-select' });
        allUsers.forEach(u => {
            const opt = createElement('option', { textContent: u.name, attributes: { value: u.id, selected: u.id === planData.assignedTo } });
            assignSelect.appendChild(opt);
        });
        assignField.appendChild(assignSelect);
        grid.appendChild(assignField);
    }

    body.appendChild(textarea);
    body.appendChild(grid);

    const secondaryStrip = createElement('div', { className: 'plan-editor-secondary-strip' });

    const subPlanField = createElement('div', { className: 'plan-editor-subplans' });
    subPlanField.innerHTML = `
        <div class="plan-editor-section-head">
            <div>
                <label>Break into steps</label>
                <p class="plan-editor-section-copy">Split the task into clear, editable steps.</p>
            </div>
        </div>
    `;
    const subPlanList = createElement('div', { className: 'plan-editor-subplans-list' });
    const appendSubPlanRow = (value = '') => {
        const row = createElement('div', { className: 'plan-editor-subplan-row' });
        const input = createElement('input', {
            className: 'plan-editor-subplan-input',
            attributes: {
                type: 'text',
                placeholder: 'Add a step...',
                value: value
            }
        });
        const removeBtn = createButton({
            className: 'day-plan-remove-step-btn plan-editor-subplan-remove',
            attributes: { title: 'Remove step' },
            innerHTML: '<i class="fa-solid fa-circle-xmark"></i>',
            onClick: () => row.remove()
        });
        row.appendChild(input);
        row.appendChild(removeBtn);
        subPlanList.appendChild(row);
        return input;
    };
    const initialSubPlans = Array.isArray(planData.subPlans) ? planData.subPlans.filter(Boolean) : [];
    if (initialSubPlans.length > 0) {
        initialSubPlans.forEach((step) => appendSubPlanRow(step));
    } else {
        appendSubPlanRow('');
    }
    const addSubPlanBtn = createButton({
        className: 'day-plan-add-step-btn plan-editor-add-step-btn',
        innerHTML: '<i class="fa-solid fa-plus"></i> Add step',
        onClick: () => appendSubPlanRow('')
    });
    subPlanField.appendChild(subPlanList);
    subPlanField.appendChild(addSubPlanBtn);
    secondaryStrip.appendChild(subPlanField);

    const assistantField = createElement('div', { className: 'plan-editor-ai-panel' });
    assistantField.innerHTML = `
        <div class="plan-editor-section-head">
            <div>
                <label>AI Draft Assistant</label>
                <p class="plan-editor-section-copy">Generate an editable draft from the current plan context.</p>
            </div>
        </div>
    `;
    const assistantControls = createElement('div', { className: 'plan-editor-ai-controls' });
    const aiActionSelect = createElement('select', { className: 'plan-editor-select plan-editor-ai-select' });
    aiActionSelect.innerHTML = `
        <option value="draft" selected>Draft from context</option>
        <option value="refine">Refine this draft</option>
        <option value="breakdown">Break into steps</option>
        <option value="compress">Shorten wording</option>
    `;
    const aiRunBtn = createButton({
        className: 'action-btn secondary plan-editor-ai-btn',
        innerHTML: '<i class="fa-solid fa-wand-magic-sparkles"></i> Draft with AI',
        onClick: async () => {
            const aiAssistant = await getAIAssistant();
            if (!aiAssistant?.requestAssistant) {
                assistantPreview.textContent = 'No AI suggestions available, please draft manually.';
                return;
            }
            const currentSourceScope = `Day plan for ${date} (${scope === 'annual' ? 'annual' : 'personal'})`;
            const collabNames = Array.isArray(selectableCollaborators)
                ? selectableCollaborators.slice(0, 12).map((u) => ({ id: u.id, name: u.name }))
                : [];
            const currentSubPlans = Array.from(subPlanList.querySelectorAll('.plan-editor-subplan-input'))
                .map((input) => String(input.value || '').trim())
                .filter(Boolean);
            const currentPlan = {
                task: String(textarea.value || '').trim(),
                subPlans: currentSubPlans,
                status: String(statusSelect.value || ''),
                budgetHeadId: String(budgetSelect.value || ''),
                assignedTo: String(assignSelect ? assignSelect.value : (planData.assignedTo || targetId) || ''),
                startDate: String(planData.startDate || date || ''),
                endDate: String(planData.endDate || date || '')
            };
            const historySummary = await getRecentPersonalPlanHistory(targetId, date, currentUser?.name || '');
            const context = buildStaffDraftContext({
                date,
                scope,
                action: String(aiActionSelect.value || 'draft'),
                currentPlan,
                collaborators: collabNames,
                historySummary,
                notes: 'Staff should receive editable drafts only. Compare the draft against recent personal plan patterns.'
            });
            const previousLabel = aiRunBtn.innerHTML;
            aiRunBtn.disabled = true;
            aiRunBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Drafting...';
            assistantPreview.textContent = historySummary?.historyAvailable
                ? 'Contacting AI assistant with your recent personal plan history...'
                : 'Contacting AI assistant...';
            try {
                const result = await aiAssistant.requestAssistant({
                    mode: 'staff-plan',
                    context,
                    user: currentUser,
                    sourceScope: currentSourceScope
                });
                assistantPreview.innerHTML = `
                    <div class="plan-editor-ai-summary"><strong>Summary:</strong> ${esc(result.summary || '')}</div>
                    ${Array.isArray(result.suggestedActions) && result.suggestedActions.length ? `<ul class="plan-editor-ai-actions">${result.suggestedActions.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
                    ${Array.isArray(result.warnings) && result.warnings.length ? `<div class="plan-editor-ai-warnings"><strong>Warnings:</strong> ${result.warnings.map((item) => esc(item)).join(' • ')}</div>` : ''}
                    <div class="plan-editor-ai-source"><strong>Source:</strong> ${esc(result.sourceScope || currentSourceScope)}</div>
                `;
                if (result?.draft?.task) {
                    textarea.value = result.draft.task;
                    textarea.focus();
                }
                const nextSteps = Array.isArray(result?.draft?.subPlans) ? result.draft.subPlans.filter(Boolean) : [];
                if (nextSteps.length > 0) {
                    subPlanList.innerHTML = '';
                    nextSteps.forEach((step) => appendSubPlanRow(step));
                }
                if (result?.draft?.status) statusSelect.value = result.draft.status;
                const suggestedBudgetHeadId = String(result?.draft?.budgetHeadId || '').trim()
                    || (historySummary?.recurringBudgetHeads?.[0]?.count >= 2 ? String(historySummary.recurringBudgetHeads[0].id || '').trim() : '');
                if (suggestedBudgetHeadId && (!budgetSelect.value || budgetSelect.value === 'UNALLOCATED')) {
                    budgetSelect.value = suggestedBudgetHeadId;
                }
                if (assignSelect && result?.draft?.assignedTo) assignSelect.value = result.draft.assignedTo;
            } catch (err) {
                console.warn('AI draft generation failed:', err);
                assistantPreview.textContent = aiAssistant.FALLBACK_MESSAGE || 'No AI suggestions available, please draft manually.';
            } finally {
                aiRunBtn.disabled = false;
                aiRunBtn.innerHTML = previousLabel;
            }
        }
    });
    assistantControls.appendChild(aiActionSelect);
    assistantControls.appendChild(aiRunBtn);
    const assistantPreview = createElement('div', {
        className: 'plan-editor-ai-preview',
        textContent: 'AI suggestions will appear here after you draft with AI.'
    });
    assistantField.appendChild(assistantControls);
    assistantField.appendChild(assistantPreview);
    secondaryStrip.appendChild(assistantField);
    body.appendChild(secondaryStrip);

    const footer = createElement('div', { className: 'plan-editor-footer' });
    const cancelBtn = createButton({
        className: 'day-plan-discard-btn',
        textContent: 'Cancel',
        onClick: () => overlay.remove()
    });
    const confirmBtn = createButton({
        className: 'day-plan-save-btn',
        textContent: existingBlock ? 'Update' : 'Add to List',
        onClick: () => {
            const taskText = textarea.value.trim();
            if (!taskText) return alert('Please enter a task description');

            const updatedPlan = {
                ...planData,
                task: taskText,
                status: statusSelect.value,
                budgetHeadId: String(budgetSelect.value || 'UNALLOCATED'),
                assignedTo: assignSelect ? assignSelect.value : (planData.assignedTo || targetId),
                tags: Array.isArray(planData.tags) ? planData.tags : [],
                subPlans: Array.from(subPlanList.querySelectorAll('.plan-editor-subplan-input'))
                    .map((input) => String(input.value || '').trim())
                    .filter(Boolean)
            };

            const blockArgs = {
                plan: updatedPlan,
                allUsers,
                targetId,
                selectableCollaborators,
                isAdmin,
                currentUserId: currentUser.id
            };

            if (existingBlock) {
                const newBlock = dayPlanRenderBlockV3({ ...blockArgs, idx: Number.parseInt(existingBlock.getAttribute('data-index')) });
                existingBlock.replaceWith(newBlock);
            } else {
                const form = container?.closest?.('.day-plan-form');
                const nextIndex = Number.parseInt(form?.dataset?.nextPlanIndex || container.querySelectorAll('.plan-block').length, 10);
                const newBlock = dayPlanRenderBlockV3({ ...blockArgs, idx: Number.isFinite(nextIndex) ? nextIndex : container.querySelectorAll('.plan-block').length });
                container.appendChild(newBlock);
                if (form) {
                    form.dataset.nextPlanIndex = String((Number.isFinite(nextIndex) ? nextIndex : container.querySelectorAll('.plan-block').length) + 1);
                }
            }
            overlay.remove();
        }
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    modal.appendChild(head);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    document.getElementById('modal-container').appendChild(overlay);
    textarea.focus();
}

// --- Main Functions ---

export function dayPlanRenderBlockV3(args) {
    const {
        plan = {},
        idx = 0,
        allUsers = [],
        targetId,
        defaultScope = 'personal',
        selectableCollaborators = [],
        isAdmin = false,
        currentUserId = '',
        isReference = false
    } = args || {};

    const task = String(plan.task || '');
    const assignedTo = plan.assignedTo || targetId || currentUserId;
    const startDate = plan.startDate || '';
    const endDate = plan.endDate || '';
    const scope = String(plan.planScope || plan._planScope || defaultScope) === 'annual' ? 'annual' : 'personal';
    const budgetHeadId = String(plan.budgetHeadId || AppAuth.getUser()?.currentBudgetHeadId || 'UNALLOCATED');
    const displayScope = isReference ? (plan.userName ? `${plan.userName}'s Plan` : 'Others Plan') : (scope === 'annual' ? 'Annual Plan' : 'Personal Plan');
    const summary = task.trim() || 'New task';
    const durationLabel = startDate && endDate && startDate !== endDate ? `${startDate} → ${endDate}` : (startDate || 'Due today');
    const planStatus = String(plan.status || '').trim().toLowerCase();

    /* Determine block class based on status */
    let blockStatusClass = '';
    if (planStatus === 'completed') blockStatusClass = ' plan-block-done';
    else if (planStatus === 'not-completed') blockStatusClass = ' plan-block-postponed';
    else if (planStatus === 'in-process') blockStatusClass = ' plan-block-active';

    const planBlock = createElement('div', {
        className: (isReference ? 'plan-block-ref' : 'plan-block') + blockStatusClass + (isReference ? ' is-reference-only' : ''),
        attributes: { 'data-index': idx, 'data-status': planStatus || 'none' }
    });

    const hiddenInputs = createElement('div', { className: 'dp-hidden-data', attributes: { style: 'display:none;' } });
    hiddenInputs.innerHTML = `
        <textarea class="plan-task">${esc(task)}</textarea>
        <select class="plan-status"><option value="${esc(plan.status || '')}" selected></option></select>
        <select class="plan-budget-head"><option value="${esc(budgetHeadId)}" selected></option></select>
        <select class="plan-scope"><option value="${esc(scope)}" selected></option></select>
        <select class="plan-assignee"><option value="${esc(assignedTo)}" selected></option></select>
        <input class="plan-start-date" value="${esc(startDate)}">
        <input class="plan-end-date" value="${esc(endDate)}">
        <input class="plan-root-id" value="${esc(plan.carryForwardRootId || '')}">
        <input class="plan-removed-flag" value="${plan.isRemoved === true ? '1' : '0'}">
    `;
    if (plan.subPlans) {
        plan.subPlans.forEach(s => {
            const input = createElement('input', { className: 'sub-plan-input', attributes: { value: esc(s) } });
            hiddenInputs.appendChild(input);
        });
    }
    if (plan.tags) {
        plan.tags.forEach(t => {
            const chip = createElement('div', {
                className: 'tag-chip',
                attributes: {
                    'data-id': t.id,
                    'data-name': t.name,
                    'data-status': t.status || 'pending'
                }
            });
            hiddenInputs.appendChild(chip);
        });
    }

    planBlock.appendChild(hiddenInputs);

    const header = createElement('div', { className: 'plan-block-header' });

    /* ============================================================
       TITLE GROUP — now includes STATUS INDICATOR before the badge
       ============================================================ */
    const titleGroup = createElement('div', { className: 'plan-block-title-group' });

    /* Status indicator circle (replaces plain index badge when status exists) */
    const statusIndicator = createStatusIndicator(planStatus);
    titleGroup.appendChild(statusIndicator);

    titleGroup.appendChild(createElement('span', { className: 'day-plan-index-badge', textContent: idx + 1 }));
    titleGroup.appendChild(createElement('div', {
        className: 'plan-block-copy',
        children: [
            createElement('span', { className: 'plan-block-summary', textContent: summary }),
            createElement('span', { className: 'plan-block-meta', textContent: durationLabel })
        ]
    }));

    const headerActions = createElement('div', { className: 'plan-block-actions' });
    headerActions.appendChild(createElement('span', { className: 'day-plan-scope-pill', textContent: displayScope }));

    if (!isReference) {
        headerActions.appendChild(createButton({
            className: 'day-plan-edit-btn',
            attributes: { title: 'Edit plan' },
            innerHTML: '<i class="fa-solid fa-pen-to-square"></i>',
            onClick: () => openPlanEditor({
                date: startDate,
                targetId,
                scope,
                allUsers,
                selectableCollaborators,
                isAdmin,
                container: planBlock.parentElement,
                existingBlock: planBlock
            })
        }));
        headerActions.appendChild(createButton({
            className: 'day-plan-remove-btn',
            attributes: { title: 'Remove task' },
            innerHTML: '<i class="fa-solid fa-trash-can"></i>',
            onClick: () => window.app_markTaskRemoved(planBlock)
        }));
    }

    header.appendChild(titleGroup);
    header.appendChild(headerActions);
    planBlock.appendChild(header);

    if ((plan.tags && plan.tags.length > 0) || (Array.isArray(plan.subPlans) && plan.subPlans.length > 0)) {
        const body = createElement('div', { className: 'plan-block-body' });
        if (Array.isArray(plan.subPlans) && plan.subPlans.length > 0) {
            const subList = createElement('div', { className: 'day-plan-subplan-list' });
            plan.subPlans.forEach((step) => {
                subList.appendChild(createElement('div', {
                    className: 'day-plan-subplan-item',
                    children: [
                        createElement('span', { className: 'day-plan-subplan-check', innerHTML: '<i class="fa-regular fa-circle-check"></i>' }),
                        createElement('span', { className: 'day-plan-subplan-text', textContent: step })
                    ]
                }));
            });
            body.appendChild(subList);
        }
        if (plan.tags && plan.tags.length > 0) {
            plan.tags.forEach(t => {
                const tag = createElement('span', { className: 'day-plan-tag-pill', textContent: `@${t.name}` });
                body.appendChild(tag);
            });
        }
        planBlock.appendChild(body);
    }

    return planBlock;
}

export function app_extractBlockData(block) {
    if (!block) return null;
    const task = block.querySelector('.plan-task')?.value || '';
    const status = block.querySelector('.plan-status')?.value || '';
    const planScope = block.querySelector('.plan-scope')?.value || 'personal';
    const budgetHeadId = block.querySelector('.plan-budget-head')?.value || 'UNALLOCATED';
    const assignedTo = block.querySelector('.plan-assignee')?.value || '';
    const startDate = block.querySelector('.plan-start-date')?.value || '';
    const endDate = block.querySelector('.plan-end-date')?.value || '';
    const carryForwardRootId = block.querySelector('.plan-root-id')?.value || '';
    const isRemoved = block.querySelector('.plan-removed-flag')?.value === '1';

    const subPlans = Array.from(block.querySelectorAll('.sub-plan-input')).map(i => i.value);
    const tags = Array.from(block.querySelectorAll('.tag-chip')).map(c => ({
        id: c.dataset.id,
        name: c.dataset.name,
        status: c.dataset.status
    }));

    return { task, status, planScope, budgetHeadId, assignedTo, startDate, endDate, subPlans, tags, carryForwardRootId, isRemoved };
}

const isAutoForwardedTask = (task) => {
    if (!task || typeof task !== 'object') return false;
    return task.isAutoForwarded === true
        || !!task.carryForwardRootId
        || !!task.carriedForwardFromDate
        || !!task.carriedForwardFromPlanId
        || !!task.autoForwardedAt;
};

export async function openDayPlan(date, targetUserId = null, forcedScope = null, options = {}) {
    if (window.performance?.mark) window.performance.mark('day-plan-open-start');
    const currentUser = AppAuth.getUser();
    const targetIdRaw = String(targetUserId ?? '').trim();
    const targetId = (!targetIdRaw || targetIdRaw === 'undefined' || targetIdRaw === 'null') ? currentUser.id : targetIdRaw;
    const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
    const isEditingOther = targetId !== currentUser.id;
    const defaultScope = forcedScope === 'annual' ? 'annual' : 'personal';
    const hideAutoForwardedTasks = options?.hideAutoForwardedTasks === true;
    const skipCarryForwardSync = options?.skipCarryForwardSync === true;
    const skipCarryForwardCleanup = options?.skipCarryForwardCleanup === true;
    window.app_currentDayPlanTargetId = targetId;
    const todayKey = AppCalendar?.getTodayKey ? AppCalendar.getTodayKey() : '';
    const prefetchRecord = getDayPlanPrefetchRecord(date, targetId, forcedScope, options);

    const modalOverlay = createElement('div', {
        id: 'day-plan-modal',
        className: 'day-plan-modal-overlay',
        attributes: { 'data-plan-date': date }
    });

    const modalContent = createElement('div', {
        className: 'day-plan-content'
    });

    const headerWrap = createElement('div', { className: 'day-plan-header-wrap' });
    headerWrap.appendChild(createDayPlanHeader(date, isEditingOther, 'Staff', false, targetId));

    const bodyWrap = createElement('div', { className: 'day-plan-body-wrap' });
    bodyWrap.appendChild(createDayPlanLoadingState());

    modalContent.appendChild(headerWrap);
    modalContent.appendChild(bodyWrap);
    modalOverlay.appendChild(modalContent);

    const container = document.getElementById('modal-container');
    if (!container) return;
    const existing = document.getElementById('day-plan-modal');
    if (existing) existing.remove();

    container.appendChild(modalOverlay);
    if (window.performance?.mark) window.performance.mark('day-plan-shell-mounted');
    if (window.performance?.measure) {
        try {
            window.performance.measure('day-plan:shell', 'day-plan-open-start', 'day-plan-shell-mounted');
        } catch {
            // Ignore duplicate or missing marks.
        }
    }
    const modalEl = document.getElementById('day-plan-modal');
    if (modalEl) {
        const overlays = Array.from(document.querySelectorAll('.modal-overlay, .modal, .dashboard-max-overlay, .dashboard-max-window, .hero-task-modal-overlay, .hero-task-modal-shell'))
            .filter(el => el !== modalEl);
        const maxZ = overlays.reduce((acc, el) => {
            const z = Number.parseInt(window.getComputedStyle(el).zIndex, 10);
            return Number.isFinite(z) ? Math.max(acc, z) : acc;
        }, 1000);
        modalEl.style.zIndex = String(maxZ + 20);
    }

    scheduleNextPaint(async () => {
        const activeModal = document.getElementById('day-plan-modal');
        if (!activeModal || !activeModal.isConnected) return;

        if (window.performance?.mark) window.performance.mark('day-plan-hydrate-start');
        try {
            const usersPromise = prefetchRecord?.usersPromise || getCachedDayPlanUsers();
            if (!skipCarryForwardSync && AppCalendar?.ensureCarryForwardForDate && date <= todayKey) {
                await AppCalendar.ensureCarryForwardForDate(date, { userIds: [targetId] });
            }

            if (!skipCarryForwardCleanup && AppCalendar?.cleanupInvalidTodayCarryForward && date === todayKey) {
                try {
                    const cleanupResult = await AppCalendar.cleanupInvalidTodayCarryForward(targetId, date, { onlyToday: true });
                    if ((cleanupResult?.removed || 0) > 0) {
                        console.log(`Day plan cleanup removed ${cleanupResult.removed} invalid carry-forward task(s) for ${targetId} on ${date}.`);
                    }
                } catch (cleanupErr) {
                    console.warn('Failed to cleanup invalid today carry-forward tasks:', cleanupErr);
                }
            }

            const canUsePrefetchedPlans = !!todayKey && String(date || '').trim() > todayKey;
            let allUsers = null;
            let personalWorkPlan = null;
            let annualWorkPlan = null;
            let allDayPlans = null;

            if (canUsePrefetchedPlans && prefetchRecord?.dataPromise) {
                const prefetched = await prefetchRecord.dataPromise;
                allUsers = prefetched?.allUsers || null;
                personalWorkPlan = prefetched?.personalWorkPlan || null;
                annualWorkPlan = prefetched?.annualWorkPlan || null;
                allDayPlans = prefetched?.allDayPlans || null;
            } else {
                allUsers = await usersPromise;
            }
            if (!activeModal.isConnected) return;

            if (!canUsePrefetchedPlans) {
                [personalWorkPlan, annualWorkPlan, allDayPlans] = await Promise.all([
                    AppCalendar.getWorkPlan(targetId, date, { planScope: 'personal' }),
                    AppCalendar.getWorkPlan(targetId, date, { planScope: 'annual' }),
                    AppDB.queryMany('work_plans', [{ field: 'date', operator: '==', value: date }])
                ]);
            }
            if (!activeModal.isConnected) return;

            const hasAnyExistingPlan = !!(personalWorkPlan || annualWorkPlan);
            const targetUser = allUsers.find(u => u.id === targetId);
            const headerName = targetUser ? targetUser.name : 'Staff';
            const selectableCollaborators = allUsers.filter(u => u.id !== targetId);

            const normalizeScopedPlans = (workPlan, scope, userName = null) => {
                if (!workPlan) return [];
                if (Array.isArray(workPlan.plans) && workPlan.plans.length > 0) {
                    return workPlan.plans.map(p => ({
                        ...p,
                        planScope: scope,
                        userName: userName || workPlan.userName,
                        isReference: !!userName
                    })).filter(p => p.isRemoved !== true && (!hideAutoForwardedTasks || !isAutoForwardedTask(p)));
                }
                return [];
            };

            const othersPlans = (allDayPlans || []).filter(p =>
                p.id !== AppCalendar.getWorkPlanId(date, targetId, 'personal') &&
                p.id !== AppCalendar.getWorkPlanId(date, targetId, 'annual')
            );

            const othersBlocks = [];
            othersPlans.forEach(p => {
                othersBlocks.push(...normalizeScopedPlans(p, p.planScope, p.userName));
            });

            const initialBlocks = [
                ...normalizeScopedPlans(personalWorkPlan, 'personal'),
                ...normalizeScopedPlans(annualWorkPlan, 'annual'),
                ...othersBlocks
            ];
            if (initialBlocks.length === 0) {
                initialBlocks.push({
                    task: '',
                    subPlans: [],
                    tags: [],
                    status: null,
                    budgetHeadId: AppAuth.getUser()?.currentBudgetHeadId || 'UNALLOCATED',
                    assignedTo: targetId,
                    startDate: date,
                    endDate: date,
                    planScope: defaultScope
                });
            }

            headerWrap.replaceChildren(createDayPlanHeader(date, isEditingOther, headerName, hasAnyExistingPlan, targetId));
            bodyWrap.replaceChildren(createDayPlanForm(date, targetId, personalWorkPlan, annualWorkPlan, initialBlocks, allUsers, defaultScope, selectableCollaborators, isAdmin, currentUser));
            const subtitle = modalContent.querySelector('.day-plan-subline');
            if (subtitle) {
                subtitle.textContent = isEditingOther ? `${formatFriendlyDate(date) || date} · Editing for ${headerName}` : (formatFriendlyDate(date) || date);
            }
            const kicker = modalContent.querySelector('.day-plan-kicker');
            if (kicker) kicker.textContent = 'Today';
            if (window.performance?.mark) window.performance.mark('day-plan-hydrate-end');
            if (window.performance?.measure) {
                try {
                    window.performance.measure('day-plan:hydrate', 'day-plan-hydrate-start', 'day-plan-hydrate-end');
                } catch {
                    // Ignore duplicate or missing marks.
                }
            }
        } catch (err) {
            console.error('Failed to open day plan:', err);
            bodyWrap.replaceChildren(createDayPlanLoadingState(`Unable to load the day plan${err?.message ? `: ${err.message}` : ''}`));
        }
    });
}

export async function addPlanBlockUI(scopeOverride = null) {
    const modal = document.getElementById('day-plan-modal');
    if (!modal) return;
    const scope = scopeOverride || 'personal';
    const container = scope === 'annual' ?
        modal.querySelector('.others-plans-container') :
        modal.querySelector('.personal-plans-container');

    const date = modal.dataset.planDate || new Date().toISOString().split('T')[0];

    const allUsers = await getCachedDayPlanUsers();
    const currentUser = AppAuth.getUser();
    const targetId = window.app_currentDayPlanTargetId || currentUser.id;
    const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
    const selectableCollaborators = allUsers.filter(u => u.id !== targetId);

    openPlanEditor({ date, targetId, scope, allUsers, selectableCollaborators, isAdmin, container });
}

export function prefetchDayPlan(date, targetUserId = null, forcedScope = null, options = {}) {
    const record = getDayPlanPrefetchRecord(date, targetUserId, forcedScope, options);
    return record?.promise || Promise.resolve(null);
}

// Global exposure
const AppDayPlan = {
    openDayPlan,
    dayPlanRenderBlockV3,
    addPlanBlockUI,
    openPlanEditor,
    prefetchDayPlan,
    app_extractBlockData
};

window.AppDayPlan = AppDayPlan;
window.app_openDayPlan = openDayPlan;
window.app_dayPlanRenderBlockV3 = dayPlanRenderBlockV3;
window.app_addPlanBlockUI = addPlanBlockUI;
window.app_prefetchDayPlan = prefetchDayPlan;
window.app_extractBlockData = app_extractBlockData;
window.app_markTaskRemoved = function (block) {
    if (!block) return;
    const form = block.closest('.day-plan-form');
    const data = app_extractBlockData(block);
    const rootId = data?.carryForwardRootId || '';
    if (form && rootId) {
        let removed = [];
        try {
            removed = JSON.parse(form.dataset.removedTasks || '[]');
        } catch {
            removed = [];
        }
        const scope = data?.planScope === 'annual' ? 'annual' : 'personal';
        if (!removed.find(item => item && item.rootId === rootId && item.scope === scope)) {
            removed.push({ rootId, scope });
            form.dataset.removedTasks = JSON.stringify(removed);
        }
    }
    block.remove();
};

export { AppDayPlan };
