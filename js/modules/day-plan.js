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

// --- @mention Autocomplete Helpers ---

function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    for (const prop of style) {
        div.style[prop] = style[prop];
    }
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = style.width;
    div.style.height = 'auto';

    const text = element.value.substring(0, position);
    div.textContent = text;
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    document.body.appendChild(div);
    const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
    const rect = element.getBoundingClientRect();
    document.body.removeChild(div);

    return {
        top: rect.top + spanTop - element.scrollTop,
        left: rect.left + spanLeft - element.scrollLeft
    };
}

function setupMentionAutocomplete(textarea, allUsers, onSelect) {
    let dropdown = document.getElementById('mention-dropdown');
    if (!dropdown) {
        dropdown = createElement('div', { id: 'mention-dropdown', className: 'mention-dropdown' });
        document.body.appendChild(dropdown);
    } else if (dropdown.parentElement !== document.body) {
        document.body.appendChild(dropdown);
    }

    let activeIndex = 0;
    let filteredUsers = [];
    let mentionStart = -1;

    const closeDropdown = () => {
        dropdown.style.display = 'none';
        mentionStart = -1;
    };

    const renderDropdown = () => {
        if (filteredUsers.length === 0) return closeDropdown();
        dropdown.innerHTML = '';
        filteredUsers.forEach((user, i) => {
            const item = createElement('div', {
                className: `mention-item ${i === activeIndex ? 'active' : ''}`,
                innerHTML: `
                    <img src="${user.avatar || 'https://via.placeholder.com/32'}" class="mention-item-avatar">
                    <span class="mention-item-name">${user.name}</span>
                    <span class="mention-item-role">${user.role || 'Staff'}</span>
                `
            });
            item.addEventListener('click', () => selectUser(user));
            dropdown.appendChild(item);
        });

        const coords = getCaretCoordinates(textarea, mentionStart);
        dropdown.style.top = `${coords.top + 24}px`;
        dropdown.style.left = `${coords.left}px`;
        dropdown.style.display = 'block';
    };

    const selectUser = (user) => {
        const text = textarea.value;
        const before = text.substring(0, mentionStart);
        const after = text.substring(textarea.selectionStart);
        textarea.value = `${before}@${user.name} ${after}`;
        textarea.focus();
        closeDropdown();
        if (onSelect) onSelect();
    };

    textarea.addEventListener('input', () => {
        const text = textarea.value;
        const pos = textarea.selectionStart;
        const lastAt = text.lastIndexOf('@', pos - 1);

        if (lastAt !== -1 && (lastAt === 0 || /\s/.test(text[lastAt - 1]))) {
            const query = text.substring(lastAt + 1, pos).toLowerCase();
            if (!/\s/.test(query)) {
                mentionStart = lastAt;
                filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(query)).slice(0, 8);
                activeIndex = 0;
                renderDropdown();
                return;
            }
        }
        closeDropdown();
        if (onSelect) onSelect();
    });

    textarea.addEventListener('keydown', (e) => {
        if (dropdown.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % filteredUsers.length;
                renderDropdown();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + filteredUsers.length) % filteredUsers.length;
                renderDropdown();
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectUser(filteredUsers[activeIndex]);
            } else if (e.key === 'Escape') {
                closeDropdown();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== textarea) closeDropdown();
    });
}

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
                                innerHTML: '<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan (@)</span>',
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
                                innerHTML: '<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan (@)</span>',
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
        innerHTML: `<h4>${existingBlock ? 'Edit' : 'Add'} ${scope === 'annual' ? 'Annual' : 'Personal'} Plan <small style="font-weight:400; opacity:0.7; font-size:0.8em; margin-left:5px;">(Use @ to tag)</small></h4>`
    });

    const body = createElement('div', { className: 'plan-editor-body' });
    const textarea = createElement('textarea', {
        className: 'plan-editor-textarea',
        textContent: planData.task,
        attributes: { placeholder: 'What is the objective or task for today? Use @ to tag colleagues.', required: true }
    });

    const tagsContainer = createElement('div', { className: 'plan-editor-tags-container', attributes: { style: 'display: none;' } });
    const refreshTagsUI = () => {
        const text = textarea.value;
        const extractedTags = [];

        // Improved extraction: search for @Name sequences that match real users
        allUsers.forEach(u => {
            const mentionStr = `@${u.name}`;
            if (text.includes(mentionStr) && !extractedTags.find(t => t.id === u.id)) {
                extractedTags.push(u);
            }
        });

        if (extractedTags.length > 0) {
            tagsContainer.style.display = 'block';
            tagsContainer.innerHTML = `<label class="plan-editor-tags-label">Tagged Collaborators:</label>`;
            const wrapper = createElement('div', { className: 'plan-editor-tags-wrapper' });
            extractedTags.forEach(u => {
                const pill = createElement('span', { className: 'day-plan-tag-pill', textContent: `@${u.name}` });
                wrapper.appendChild(pill);
            });
            tagsContainer.appendChild(wrapper);
        } else {
            tagsContainer.style.display = 'none';
            tagsContainer.innerHTML = '';
        }
    };

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

    // Only show Assignee Field for Admins
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
    body.appendChild(tagsContainer);
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

            // Extract tags from @mentions (match against real users to handle spaces)
            const extractedTags = [];
            allUsers.forEach(u => {
                if (taskText.includes(`@${u.name}`) && !extractedTags.find(t => t.id === u.id)) {
                    extractedTags.push({
                        id: u.id,
                        name: u.name,
                        status: 'pending'
                    });
                }
            });

            const updatedPlan = {
                ...planData,
                task: taskText,
                status: statusSelect.value,
                assignedTo: assignSelect ? assignSelect.value : (planData.assignedTo || targetId),
                tags: extractedTags.length > 0 ? extractedTags : (planData.tags || [])
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
    setupMentionAutocomplete(textarea, allUsers, refreshTagsUI);
    refreshTagsUI();
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
    // Adds a new plan block by opening the plan editor for the requested scope.
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


