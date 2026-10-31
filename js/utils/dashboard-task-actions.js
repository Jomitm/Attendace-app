const pendingCompletions = new Set();

export async function completeDashboardTask(button) {
    if (!button || button.disabled) return;
    const user = window.AppAuth?.getUser?.();
    const userId = String(user?.id || '');
    const ownerId = String(button.dataset.userId || '');
    const isAdmin = !!user && (user.role === 'Administrator' || user.isAdmin === true);
    const planId = String(button.dataset.planId || '');
    const taskIndex = Number(button.dataset.taskIndex);

    if (!isAdmin && (!userId || userId !== ownerId)) {
        window.alert('Only the assigned staff member or an admin can complete this task.');
        return;
    }
    if (!planId || !Number.isInteger(taskIndex) || typeof window.AppCalendar?.updateTaskStatus !== 'function') {
        window.alert('This task cannot be completed right now. Refresh the dashboard and try again.');
        return;
    }

    const actionKey = `${planId}:${taskIndex}`;
    if (pendingCompletions.has(actionKey)) return;
    pendingCompletions.add(actionKey);
    const originalHtml = button.innerHTML;
    const originalDisabled = button.disabled;

    try {
        const comment = typeof window.app_promptOptionalComment === 'function'
            ? await window.app_promptOptionalComment('Add a note for completing this task?', 'Completion note (optional)')
            : '';
        if (comment === null) return;

        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Saving…</span>';

        const savedPlan = await window.AppCalendar.updateTaskStatus(planId, taskIndex, 'completed', null, {
            completionComment: comment,
            deferRating: true
        });
        if (typeof window.app_appendCompletedTaskToSummary === 'function') {
            await window.app_appendCompletedTaskToSummary(planId, taskIndex, comment, savedPlan?.plans?.[taskIndex]);
        }

        const taskItem = button.closest('.dashboard-planned-task-item');
        const taskList = taskItem?.parentElement;
        taskItem?.remove();
        if (taskList) {
            const remaining = taskList.querySelectorAll('.dashboard-planned-task-item').length;
            const summary = taskList.closest('.dashboard-worklog-card')?.querySelector('.dashboard-card-summary');
            if (summary) summary.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'}`;
            if (!remaining) taskList.innerHTML = '<div class="dashboard-activity-empty">No planned tasks for today.</div>';
        }

        window.app_showSyncToast?.('Task marked as completed.');
        window.app_refreshDashboard?.().catch(error => console.warn('Dashboard refresh after complete failed:', error));
        window.app_refreshHeroAuditLive?.().catch(error => console.warn('Hero refresh after complete failed:', error));
    } catch (error) {
        console.error('Dashboard task completion failed:', error);
        window.alert(`Failed to complete task: ${error?.message || 'Please try again.'}`);
    } finally {
        pendingCompletions.delete(actionKey);
        if (button.isConnected) {
            button.disabled = originalDisabled;
            button.removeAttribute('aria-busy');
            button.innerHTML = originalHtml;
        }
    }
}
