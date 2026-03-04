import { AppAuth } from './auth.js';
import { AppDB } from './db.js';
import { AppCalendar } from './calendar.js';

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

const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// --- UI Components ---

function createDayPlanHeader(date, isEditingOther, headerName, hasAnyExistingPlan, targetId) {
    const title = createElement('h3', { textContent: 'Plan Your Day' });
    const subtitle = createElement('p', { className: 'day-plan-subline', textContent: `${date}${isEditingOther ? ` - Editing for ${headerName}` : ''}` });

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
            createElement('div', { className: 'day-plan-headline', children: [title, subtitle] }),
            headerActions
        ]
    });
}

function createDayPlanForm(date, targetId, personalWorkPlan, annualWorkPlan, initialBlocks, allUsers, defaultScope, selectableCollaborators, isAdmin, currentUser) {
    const personalContainer = createElement('div', {
        className: 'day-plan-scroll-area personal-plans-container',
        attributes: { 'data-scope': 'personal' }
    });

    const othersContainer = createElement('div', {
        className: 'day-plan-scroll-area others-plans-container',
        attributes: { 'data-scope': 'annual' }
    });

    initialBlocks.forEach((plan, idx) => {
        const block = dayPlanRenderBlockV3({
            plan,
            idx,
            allUsers,
            targetId,
            defaultScope,
            selectableCollaborators,
            isAdmin,
            currentUserId: currentUser.id,
            isReference: plan.isReference
        });
        const scope = plan.planScope || plan._planScope || defaultScope;
        if (scope === 'annual' || plan.isReference) {
            othersContainer.appendChild(block);
        } else {
            personalContainer.appendChild(block);
        }
    });

    const columns = createElement('div', {
        className: 'day-plan-columns',
        children: [
            createElement('div', {
                className: 'day-plan-column',
                children: [
                    createElement('div', {
                        className: 'day-plan-column-head',
                        children: [
                            createElement('h4', { className: 'day-plan-column-title', textContent: 'Self Plan' }),
                            createButton({
                                className: 'btn-premium-add',
                                innerHTML: '<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan</span>',
                                onClick: () => openPlanEditor({ date, targetId, scope: 'personal', allUsers, selectableCollaborators, isAdmin, container: personalContainer })
                            })
                        ]
                    }),
                    personalContainer
                ]
            }),
            createElement('div', {
                className: 'day-plan-column',
                children: [
                    createElement('div', {
                        className: 'day-plan-column-head',
                        children: [
                            createElement('h4', { className: 'day-plan-column-title', textContent: 'Others\' & Annual Plans' }),
                            createButton({
                                className: 'btn-premium-add',
                                innerHTML: '<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan</span>',
                                onClick: () => openPlanEditor({ date, targetId, scope: 'annual', allUsers, selectableCollaborators, isAdmin, container: othersContainer })
                            })
                        ]
                    }),
                    othersContainer
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
        },
        children: [columns, footer]
    });
    form.addEventListener('submit', (e) => window.app_saveDayPlan(e, date, targetId));

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
        planScope: scope
    };

    const overlay = createElement('div', { className: 'plan-editor-overlay' });
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

    // Status Field
    const statusField = createElement('div', { className: 'plan-editor-field' });
    statusField.innerHTML = '<label>Status</label>';
    const statusSelect = createElement('select', { className: 'plan-editor-select' });
    statusSelect.innerHTML = `
        <option value="" ${!planData.status ? 'selected' : ''}>Auto-Track</option>
        <option value="completed" ${planData.status === 'completed' ? 'selected' : ''}>Completed</option>
        <option value="in-process" ${planData.status === 'in-process' ? 'selected' : ''}>In Progress</option>
        <option value="not-completed" ${planData.status === 'not-completed' ? 'selected' : ''}>Not Completing</option>
    `;
    statusField.appendChild(statusSelect);

    // Assignee Field
    const assignField = createElement('div', { className: 'plan-editor-field' });
    assignField.innerHTML = '<label>Assign To</label>';
    const assignSelect = createElement('select', { className: 'plan-editor-select', attributes: isAdmin ? {} : { disabled: true } });
    allUsers.forEach(u => {
        const opt = createElement('option', { textContent: u.name, attributes: { value: u.id, selected: u.id === planData.assignedTo } });
        assignSelect.appendChild(opt);
    });
    assignField.appendChild(assignSelect);

    grid.appendChild(statusField);
    grid.appendChild(assignField);

    body.appendChild(textarea);
    body.appendChild(grid);

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
                assignedTo: assignSelect.value
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
                const newBlock = dayPlanRenderBlockV3({ ...blockArgs, idx: container.querySelectorAll('.plan-block').length });
                container.appendChild(newBlock);
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
    const displayScope = isReference ? (plan.userName ? `${plan.userName}'s Plan` : 'Others Plan') : (scope === 'annual' ? 'Annual Plan' : 'Personal Plan');
    const summary = task.trim() ? (task.trim().length > 120 ? `${task.trim().slice(0, 120)}...` : task.trim()) : 'New task';

    const planBlock = createElement('div', {
        className: (isReference ? 'plan-block-ref' : 'plan-block') + (isReference ? ' is-reference-only' : ''),
        attributes: { 'data-index': idx }
    });

    // compatibility for window.app_saveDayPlan ( scraper in app.js )
    const hiddenInputs = createElement('div', { className: 'dp-hidden-data', attributes: { style: 'display:none;' } });
    hiddenInputs.innerHTML = `
        <textarea class="plan-task">${esc(task)}</textarea>
        <select class="plan-status"><option value="${esc(plan.status || '')}" selected></option></select>
        <select class="plan-scope"><option value="${esc(scope)}" selected></option></select>
        <select class="plan-assignee"><option value="${esc(assignedTo)}" selected></option></select>
        <input class="plan-start-date" value="${esc(startDate)}">
        <input class="plan-end-date" value="${esc(endDate)}">
    `;
    // Add subplans if any
    if (plan.subPlans) {
        plan.subPlans.forEach(s => {
            const input = createElement('input', { className: 'sub-plan-input', attributes: { value: esc(s) } });
            hiddenInputs.appendChild(input);
        });
    }
    // Tags for scraping
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

    // Left Group: Index + Summary (Flexible and Wrapping)
    const titleGroup = createElement('div', { className: 'plan-block-title-group' });
    titleGroup.appendChild(createElement('span', { className: 'day-plan-index-badge', textContent: idx + 1 }));
    titleGroup.appendChild(createElement('span', { className: 'plan-block-summary', textContent: summary }));

    // Right Group: Scope + Actions (Fixed and Stable)
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
        if (idx > 0) {
            headerActions.appendChild(createButton({
                className: 'day-plan-remove-btn',
                attributes: { title: 'Remove task' },
                innerHTML: '<i class="fa-solid fa-trash-can"></i>',
                onClick: () => planBlock.remove()
            }));
        }
    }

    header.appendChild(titleGroup);
    header.appendChild(headerActions);
    planBlock.appendChild(header);

    if (plan.tags && plan.tags.length > 0) {
        const body = createElement('div', { className: 'plan-block-body' });
        plan.tags.forEach(t => {
            const tag = createElement('span', { className: 'day-plan-tag-pill', textContent: `@${t.name}` });
            body.appendChild(tag);
        });
        planBlock.appendChild(body);
    }

    return planBlock;
}

export function app_extractBlockData(block) {
    if (!block) return null;
    const task = block.querySelector('.plan-task')?.value || '';
    const status = block.querySelector('.plan-status')?.value || '';
    const planScope = block.querySelector('.plan-scope')?.value || 'personal';
    const assignedTo = block.querySelector('.plan-assignee')?.value || '';
    const startDate = block.querySelector('.plan-start-date')?.value || '';
    const endDate = block.querySelector('.plan-end-date')?.value || '';

    const subPlans = Array.from(block.querySelectorAll('.sub-plan-input')).map(i => i.value);
    const tags = Array.from(block.querySelectorAll('.tag-chip')).map(c => ({
        id: c.dataset.id,
        name: c.dataset.name,
        status: c.dataset.status
    }));

    return { task, status, planScope, assignedTo, startDate, endDate, subPlans, tags };
}

export async function openDayPlan(date, targetUserId = null, forcedScope = null) {
    const currentUser = AppAuth.getUser();
    const targetIdRaw = String(targetUserId ?? '').trim();
    const targetId = (!targetIdRaw || targetIdRaw === 'undefined' || targetIdRaw === 'null') ? currentUser.id : targetIdRaw;
    const allUsers = await AppDB.getAll('users');
    const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
    const isEditingOther = targetId !== currentUser.id;
    const defaultScope = forcedScope === 'annual' ? 'annual' : 'personal';
    window.app_currentDayPlanTargetId = targetId;

    const [personalWorkPlan, annualWorkPlan, allDayPlans] = await Promise.all([
        AppCalendar.getWorkPlan(targetId, date, { planScope: 'personal' }),
        AppCalendar.getWorkPlan(targetId, date, { planScope: 'annual' }),
        AppDB.queryMany('work_plans', [{ field: 'date', operator: '==', value: date }])
    ]);
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
            }));
        }
        if (workPlan.plan) {
            return [{
                task: workPlan.plan,
                subPlans: workPlan.subPlans || [],
                tags: [],
                status: null,
                assignedTo: workPlan.userId === 'annual_shared' ? null : workPlan.userId,
                startDate: date,
                endDate: date,
                planScope: scope,
                userName: userName || workPlan.userName,
                isReference: !!userName
            }];
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
            assignedTo: targetId,
            startDate: date,
            endDate: date,
            planScope: defaultScope
        });
    }

    const modalOverlay = createElement('div', {
        id: 'day-plan-modal',
        className: 'day-plan-modal-overlay'
    });

    const modalContent = createElement('div', {
        className: 'day-plan-content'
    });

    modalContent.appendChild(createDayPlanHeader(date, isEditingOther, headerName, hasAnyExistingPlan, targetId));
    modalContent.appendChild(createDayPlanForm(date, targetId, personalWorkPlan, annualWorkPlan, initialBlocks, allUsers, defaultScope, selectableCollaborators, isAdmin, currentUser));
    modalContent.appendChild(createElement('div', { id: 'mention-dropdown' }));
    modalOverlay.appendChild(modalContent);


    const container = document.getElementById('modal-container');
    if (!container) return;
    const existing = document.getElementById('day-plan-modal');
    if (existing) existing.remove();

    container.appendChild(modalOverlay);
    const modalEl = document.getElementById('day-plan-modal');
    if (modalEl) {
        const overlays = Array.from(document.querySelectorAll('.modal-overlay, .modal'))
            .filter(el => el !== modalEl);
        const maxZ = overlays.reduce((acc, el) => {
            const z = Number.parseInt(window.getComputedStyle(el).zIndex, 10);
            return Number.isFinite(z) ? Math.max(acc, z) : acc;
        }, 1000);
        modalEl.style.zIndex = String(maxZ + 2);
    }
}

export async function addPlanBlockUI(scopeOverride = null) {
    // This is kept for legacy calls, but now redirets to openPlanEditor if needed
    // or just opens a basic editor
    const modal = document.getElementById('day-plan-modal');
    if (!modal) return;
    const scope = scopeOverride || 'personal';
    const container = scope === 'annual' ?
        modal.querySelector('.others-plans-container') :
        modal.querySelector('.personal-plans-container');

    const dateMatch = modal.querySelector('.day-plan-headline p')?.textContent?.match(/\d{4}-\d{2}-\d{2}/);
    const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

    const allUsers = await AppDB.getAll('users');
    const currentUser = AppAuth.getUser();
    const targetId = window.app_currentDayPlanTargetId || currentUser.id;
    const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
    const selectableCollaborators = allUsers.filter(u => u.id !== targetId);

    openPlanEditor({ date, targetId, scope, allUsers, selectableCollaborators, isAdmin, container });
}

// Global exposure
const AppDayPlan = {
    openDayPlan,
    dayPlanRenderBlockV3,
    addPlanBlockUI,
    openPlanEditor,
    app_extractBlockData
};

window.AppDayPlan = AppDayPlan;
window.app_openDayPlan = openDayPlan;
window.app_dayPlanRenderBlockV3 = dayPlanRenderBlockV3;
window.app_addPlanBlockUI = addPlanBlockUI;
window.app_extractBlockData = app_extractBlockData;

export { AppDayPlan };
