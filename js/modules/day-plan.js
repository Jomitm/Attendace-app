(function() {
    'use strict';

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

    function createIcon(className) {
        return createElement('i', { className });
    }

    // --- UI Components ---

    function createDayPlanHeader(date, isEditingOther, headerName, hasAnyExistingPlan, targetId) {
        const title = createElement('h3', { textContent: 'Plan Your Day' });
        const subtitle = createElement('p', { textContent: `${date}${isEditingOther ? ` - Editing for ${headerName}` : ''}` });

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
            onClick: (e) => e.target.closest('.modal-overlay').remove()
        });

        const headerActions = createElement('div', {
            children: [deleteBtn, closeBtn].filter(Boolean)
        });
        headerActions.style.display = 'flex';
        headerActions.style.gap = '0.5rem';

        return createElement('div', {
            className: 'day-plan-head',
            children: [
                createElement('div', { children: [title, subtitle] }),
                headerActions
            ]
        });
    }

    function createDayPlanForm(date, targetId, personalWorkPlan, annualWorkPlan, initialBlocks, allUsers, defaultScope, selectableCollaborators, isAdmin, currentUser) {
        const plansContainer = createElement('div', {
            id: 'plans-container',
            attributes: { 'data-default-scope': defaultScope }
        });

        initialBlocks.forEach((plan, idx) => {
            const block = window.app_dayPlanRenderBlockV3({
                plan,
                idx,
                allUsers,
                targetId,
                defaultScope,
                selectableCollaborators,
                isAdmin,
                currentUserId: currentUser.id
            });
            plansContainer.appendChild(block);
        });

        const addTaskBtn = createButton({
            className: 'day-plan-add-task-btn',
            innerHTML: '<i class="fa-solid fa-plus-circle"></i> <span>Add Task</span>',
            onClick: () => window.app_addPlanBlockUI()
        });

        const discardBtn = createButton({
            className: 'day-plan-discard-btn',
            textContent: 'Discard',
            onClick: (e) => e.target.closest('.modal-overlay').remove()
        });

        const saveBtn = createButton({
            className: 'action-btn day-plan-save-btn',
            innerHTML: '<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',
            attributes: { type: 'submit' }
        });

        const footerActions = createElement('div', {
            children: [discardBtn, saveBtn]
        });
        footerActions.style.flex = '1';
        footerActions.style.minWidth = '300px';
        footerActions.style.display = 'flex';
        footerActions.style.gap = '0.7rem';


        const footer = createElement('div', {
            className: 'day-plan-footer',
            children: [addTaskBtn, footerActions]
        });

        const form = createElement('form', {
            attributes: {
                'data-had-personal': personalWorkPlan ? '1' : '0',
                'data-had-annual': annualWorkPlan ? '1' : '0',
            },
            children: [plansContainer, footer]
        });
        form.addEventListener('submit', (e) => window.app_saveDayPlan(e, date, targetId));

        return form;
    }


    // --- Main Functions ---

    window.app_dayPlanRenderBlockV3 = function app_dayPlanRenderBlockV3(args) {
        const {
            plan = {},
            idx = 0,
            allUsers = [],
            targetId,
            defaultScope = 'personal',
            selectableCollaborators = [],
            isAdmin = false,
            currentUserId = ''
        } = args || {};

        const esc = (v) => String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const task = String(plan.task || '');
        const subPlans = Array.isArray(plan.subPlans) ? plan.subPlans : [];
        const tags = Array.isArray(plan.tags) ? plan.tags : [];
        const assignedTo = plan.assignedTo || targetId || currentUserId;
        const startDate = plan.startDate || '';
        const endDate = plan.endDate || '';
        const scope = String(plan.planScope || plan._planScope || defaultScope) === 'annual' ? 'annual' : 'personal';
        const summary = task.trim() ? (task.trim().length > 72 ? `${task.trim().slice(0, 72)}...` : task.trim()) : 'New task';
        const tagSet = new Set(tags.map(t => String(t.id || '')));

        const collabButtons = selectableCollaborators.map(u =>
            createButton({
                className: `day-plan-collab-option ${tagSet.has(String(u.id)) ? 'selected' : ''}`,
                textContent: u.name,
                attributes: {
                    'data-id': u.id,
                    title: `Add or remove ${u.name}`
                },
                onClick: (e) => window.app_toggleTaskCollaborator(e.target, u.id, u.name)
            })
        );

        const chips = tags.map(t => {
            const chip = createElement('div', {
                className: 'tag-chip day-plan-tag-chip',
                attributes: {
                    'data-id': t.id,
                    'data-name': t.name,
                    'data-status': t.status || 'pending'
                }
            });
            chip.innerHTML = `<span class="day-plan-tag-main">@${esc(t.name)} <span class="day-plan-tag-pending">(${esc(t.status || 'pending')})</span></span>
                          <i class="fa-solid fa-times day-plan-remove-collab-btn"></i>`;
            chip.querySelector('.day-plan-remove-collab-btn').addEventListener('click', (e) => window.app_removeTagHint(e.target));
            return chip;
        });

        const planBlock = createElement('div', {
            className: 'plan-block day-plan-block-shell',
            attributes: { 'data-index': idx }
        });

        const head = createElement('div', { className: 'day-plan-block-head' });
        const headMain = createElement('div', { className: 'day-plan-block-head-main' });
        headMain.appendChild(createElement('span', { className: 'day-plan-index-badge-step', textContent: idx + 1 }));
        headMain.appendChild(createElement('span', { className: 'day-plan-task-summary', textContent: summary }));
        headMain.appendChild(createElement('span', { className: 'day-plan-scope-pill', textContent: scope === 'annual' ? 'Annual Plan' : 'Personal Plan' }));

        const headActions = createElement('div', { className: 'day-plan-block-head-actions' });
        if (idx > 0) {
            headActions.appendChild(createButton({
                className: 'day-plan-remove-task-btn',
                attributes: { title: 'Remove this task' },
                innerHTML: '<i class="fa-solid fa-times"></i>',
                onClick: (e) => e.target.closest('.plan-block').remove()
            }));
        }
        headActions.appendChild(createButton({
            className: 'day-plan-collapse-btn',
            innerHTML: '<i class="fa-solid fa-chevron-down"></i><span class="day-plan-collapse-label">Minimize</span>',
            onClick: (e) => window.app_togglePlanBlockCollapse(e.currentTarget)
        }));

        head.appendChild(headMain);
        head.appendChild(headActions);

        const body = createElement('div', { className: 'day-plan-block-body' });
        const mainPanel = createElement('div', { className: 'day-plan-main-panel' });
        const rowHead = createElement('div', { className: 'day-plan-row-head' });
        rowHead.appendChild(createElement('label', { className: 'day-plan-label', textContent: 'What will you work on?' }));

        const dateWrap = createElement('div', { className: 'day-plan-date-wrap' });
        dateWrap.appendChild(createElement('input', { className: 'plan-start-date day-plan-select', attributes: { type: 'date', value: startDate, title: 'From Date' } }));
        dateWrap.appendChild(createElement('input', { className: 'plan-end-date day-plan-select', attributes: { type: 'date', value: endDate, title: 'To Date' } }));
        dateWrap.appendChild(createElement('span', { className: 'day-plan-date-note', textContent: 'Optional range' }));
        rowHead.appendChild(dateWrap);

        mainPanel.appendChild(rowHead);
        mainPanel.appendChild(createElement('p', { className: 'day-plan-help-text', textContent: 'Be specific. Pick collaborators here or use @ mention.' }));
        mainPanel.appendChild(createElement('textarea', {
            className: 'plan-task day-plan-task-input',
            textContent: task,
            attributes: { required: true, placeholder: 'Describe your plan for the day...' }
        }));

        const inlineControls = createElement('div', { className: 'day-plan-inline-work-controls' });
        const typeRow = createElement('div', { className: 'day-plan-type-row' });
        typeRow.appendChild(createElement('label', { className: 'day-plan-mini-label', textContent: 'Plan Type' }));
        const scopeSelect = createElement('select', { className: 'plan-scope day-plan-select day-plan-scope-select' });
        scopeSelect.appendChild(createElement('option', { textContent: 'Personal Plan', attributes: { value: 'personal', selected: scope === 'personal' } }));
        scopeSelect.appendChild(createElement('option', { textContent: 'Annual Plan', attributes: { value: 'annual', selected: scope === 'annual' } }));
        typeRow.appendChild(scopeSelect);
        inlineControls.appendChild(typeRow);

        const collabInline = createElement('div', { className: 'day-plan-collab-inline' });
        const collabHead = createElement('div', { className: 'day-plan-collab-head' });
        collabHead.appendChild(createElement('span', { className: 'day-plan-mini-label', textContent: 'Collaborators' }));
        collabHead.appendChild(createElement('span', { className: 'day-plan-collab-hint', textContent: 'Click names to tag/un-tag.' }));
        collabInline.appendChild(collabHead);
        const collabPicker = createElement('div', { className: 'day-plan-collab-picker' });
        collabButtons.forEach(btn => collabPicker.appendChild(btn));
        if (collabButtons.length === 0) {
            collabPicker.appendChild(createElement('span', { className: 'day-plan-collab-empty', textContent: 'No teammates available.' }));
        }
        collabInline.appendChild(collabPicker);
        inlineControls.appendChild(collabInline);

        const tagsContainer = createElement('div', { className: 'tags-container day-plan-tags-inline' });
        if (chips.length > 0) {
            chips.forEach(chip => tagsContainer.appendChild(chip));
        } else {
            tagsContainer.innerHTML = '<div class="no-tags-placeholder day-plan-no-tags-placeholder"><p class="day-plan-no-tags-text">No collaborators yet</p></div>';
        }
        inlineControls.appendChild(tagsContainer);

        mainPanel.appendChild(inlineControls);

        const subSection = createElement('div', { className: 'day-plan-sub-section' });
        subSection.appendChild(createElement('label', { className: 'day-plan-mini-label', textContent: 'Break into steps (optional)' }));
        const subPlansList = createElement('div', { className: 'sub-plans-list day-plan-sub-list' });
        subPlans.forEach(s => {
            const row = createElement('div', { className: 'sub-plan-row day-plan-sub-row' });
            row.appendChild(createElement('div', { className: 'day-plan-step-dot' }));
            row.appendChild(createElement('input', {
                className: 'sub-plan-input day-plan-sub-input',
                attributes: { type: 'text', value: s, placeholder: 'Add a step...' }
            }));
            row.appendChild(createButton({
                className: 'day-plan-remove-step-btn',
                attributes: { title: 'Remove step' },
                innerHTML: '<i class="fa-solid fa-circle-xmark"></i>',
                onClick: (e) => e.target.parentElement.remove()
            }));
            subPlansList.appendChild(row);
        });
        subSection.appendChild(subPlansList);
        subSection.appendChild(createButton({
            className: 'day-plan-add-step-btn',
            innerHTML: '<i class="fa-solid fa-plus"></i> Add Step',
            onClick: (e) => window.app_addSubPlanRow(e.target)
        }));

        mainPanel.appendChild(subSection);
        body.appendChild(mainPanel);

        const bottomControls = createElement('div', { className: 'day-plan-bottom-controls' });
        const statusRow = createElement('div', { className: 'day-plan-control-row' });
        statusRow.appendChild(createElement('label', { className: 'day-plan-mini-label', textContent: 'Status' }));
        const statusSelect = createElement('select', { className: 'plan-status day-plan-select' });
        statusSelect.appendChild(createElement('option', { textContent: 'Auto-Track (Recommended)', attributes: { value: '', selected: !plan.status } }));
        statusSelect.appendChild(createElement('option', { textContent: 'Completed', attributes: { value: 'completed', selected: plan.status === 'completed' } }));
        statusSelect.appendChild(createElement('option', { textContent: 'Not Completing', attributes: { value: 'not-completed', selected: plan.status === 'not-completed' } }));
        statusSelect.appendChild(createElement('option', { textContent: 'In Progress', attributes: { value: 'in-process', selected: plan.status === 'in-process' } }));
        statusRow.appendChild(statusSelect);
        bottomControls.appendChild(statusRow);

        if (isAdmin) {
            const assigneeRow = createElement('div', { className: 'day-plan-control-row' });
            assigneeRow.appendChild(createElement('label', { className: 'day-plan-mini-label', textContent: 'Assign To' }));
            const assigneeSelect = createElement('select', { className: 'plan-assignee day-plan-select' });
            allUsers.forEach(u => {
                assigneeSelect.appendChild(createElement('option', {
                    textContent: u.name,
                    attributes: { value: u.id, selected: u.id === assignedTo }
                }));
            });
            assigneeRow.appendChild(assigneeSelect);
            bottomControls.appendChild(assigneeRow);
        }

        planBlock.appendChild(head);
        planBlock.appendChild(body);
        planBlock.appendChild(bottomControls);

        return planBlock;
    };


    window.app_openDayPlan = async (date, targetUserId = null, forcedScope = null) => {
        const currentUser = window.AppAuth.getUser();
        const targetIdRaw = String(targetUserId ?? '').trim();
        const targetId = (!targetIdRaw || targetIdRaw === 'undefined' || targetIdRaw === 'null') ? currentUser.id : targetIdRaw;
        const allUsers = await window.AppDB.getAll('users');
        const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
        const isEditingOther = targetId !== currentUser.id;
        const defaultScope = forcedScope === 'annual' ? 'annual' : 'personal';
        window.app_currentDayPlanTargetId = targetId;

        const personalWorkPlan = await window.AppCalendar.getWorkPlan(targetId, date, { planScope: 'personal' });
        const annualWorkPlan = await window.AppCalendar.getWorkPlan(targetId, date, { planScope: 'annual' });
        const hasAnyExistingPlan = !!(personalWorkPlan || annualWorkPlan);
        const targetUser = allUsers.find(u => u.id === targetId);
        const headerName = targetUser ? targetUser.name : 'Staff';
        const selectableCollaborators = allUsers.filter(u => u.id !== targetId);

        const normalizeScopedPlans = (workPlan, scope) => {
            if (!workPlan) return [];
            if (Array.isArray(workPlan.plans) && workPlan.plans.length > 0) return workPlan.plans.map(p => ({ ...p, planScope: scope }));
            if (workPlan.plan) {
                return [{
                    task: workPlan.plan,
                    subPlans: workPlan.subPlans || [],
                    tags: [],
                    status: null,
                    assignedTo: targetId,
                    startDate: date,
                    endDate: date,
                    planScope: scope
                }];
            }
            return [];
        };

        const initialBlocks = [
            ...normalizeScopedPlans(personalWorkPlan, 'personal'),
            ...normalizeScopedPlans(annualWorkPlan, 'annual')
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
            className: 'modal-overlay'
        });

        const modalContent = createElement('div', {
            className: 'modal-content day-plan-content'
        });

        modalContent.appendChild(createDayPlanHeader(date, isEditingOther, headerName, hasAnyExistingPlan, targetId));
        modalContent.appendChild(createDayPlanForm(date, targetId, personalWorkPlan, annualWorkPlan, initialBlocks, allUsers, defaultScope, selectableCollaborators, isAdmin, currentUser));
        modalContent.appendChild(createElement('div', { id: 'mention-dropdown' }));
        modalOverlay.appendChild(modalContent);


        const container = document.getElementById('modal-container');
        if (!container) return;
        // Remove existing modal with same ID if any
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

        const plansContainer = document.getElementById('plans-container');
        if (plansContainer) {
            plansContainer.addEventListener('input', (e) => {
                const block = e.target.closest('.plan-block');
                if (block && typeof window.app_refreshPlanBlockSummary === 'function') window.app_refreshPlanBlockSummary(block);
                if (e.target.classList.contains('plan-task') && typeof window.app_checkMentions === 'function') {
                    window.app_checkMentions(e.target, selectableCollaborators);
                }
            });
            plansContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('plan-scope')) {
                    const block = e.target.closest('.plan-block');
                    if (block && typeof window.app_refreshPlanBlockSummary === 'function') window.app_refreshPlanBlockSummary(block);
                }
            });
            plansContainer.querySelectorAll('.plan-block').forEach((b) => {
                if (typeof window.app_refreshPlanBlockSummary === 'function') window.app_refreshPlanBlockSummary(b);
            });
        }
    };


    window.app_addPlanBlockUI = async () => {
        const container = document.getElementById('plans-container');
        if (!container) return;

        const allUsers = await window.AppDB.getAll('users');
        const currentUser = window.AppAuth.getUser();
        const targetIdRaw = String(window.app_currentDayPlanTargetId ?? '').trim();
        const targetId = (!targetIdRaw || targetIdRaw === 'undefined' || targetIdRaw === 'null') ? currentUser.id : targetIdRaw;
        const isAdmin = currentUser.role === 'Administrator' || currentUser.isAdmin;
        const defaultScope = container.dataset.defaultScope === 'annual' ? 'annual' : 'personal';
        const selectableCollaborators = allUsers.filter(u => u.id !== targetId);

        const newBlock = window.app_dayPlanRenderBlockV3({
            plan: {
                task: '',
                subPlans: [],
                tags: [],
                status: null,
                assignedTo: targetId,
                startDate: '',
                endDate: '',
                planScope: defaultScope
            },
            idx: container.querySelectorAll('.plan-block').length,
            allUsers,
            targetId,
            defaultScope,
            selectableCollaborators,
            isAdmin,
            currentUserId: currentUser.id
        });
        container.appendChild(newBlock);

        const dateMatch = document.querySelector('#day-plan-modal .day-plan-head p')?.textContent?.match(/\d{4}-\d{2}-\d{2}/);
        const d = dateMatch ? dateMatch[0] : '';
        const startEl = newBlock.querySelector('.plan-start-date');
        const endEl = newBlock.querySelector('.plan-end-date');
        if (startEl) startEl.value = d;
        if (endEl) endEl.value = d;

        if (typeof window.app_refreshPlanBlockSummary === 'function') window.app_refreshPlanBlockSummary(newBlock);
        newBlock.querySelector('.plan-task')?.focus();
    };


})();
