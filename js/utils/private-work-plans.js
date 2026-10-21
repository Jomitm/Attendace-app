/**
 * Storage boundary for private work-plan tasks.
 * Public work_plans documents keep only a routing placeholder. The task body
 * lives in private_work_plan_tasks and is fetched only for its owner/assignee.
 */

export const PRIVATE_WORK_PLAN_COLLECTION = 'private_work_plan_tasks';

export function splitWorkPlanForStorage(workPlan, makeId = () => globalThis.crypto?.randomUUID?.(), writerId = '') {
    const source = workPlan && typeof workPlan === 'object' ? workPlan : {};
    const planId = String(source.id || '').trim();
    if (!planId) throw new Error('A work plan needs an id before private tasks can be stored.');
    const sourceTasks = Array.isArray(source.plans) ? source.plans : [];
    const privateTasks = [];
    const publicTasks = sourceTasks.map((task, index) => {
        if (!task || task.isPrivate !== true) {
            if (!task || !Object.hasOwn(task, 'privateTaskId')) return task;
            const publicTask = { ...task };
            delete publicTask.privateTaskId;
            return publicTask;
        }
        // Pointer-only placeholders are kept as routing metadata. They must
        // never be written over the protected document as if they were a body.
        if (task.privateTaskId && !Object.prototype.hasOwnProperty.call(task, 'task')) return task;
        const privateTaskId = String(task.privateTaskId || '').trim() || String(makeId() || '').trim();
        if (!privateTaskId || privateTaskId.includes('/')) {
            throw new Error('Could not create a valid private task id.');
        }
        const ownerId = String(source.userId === 'annual_shared' ? source.createdById : source.userId || '').trim();
        if (!ownerId) throw new Error('A private task needs a plan owner.');
        const assignedTo = String(task.assignedTo || '').trim();
        const taskBody = { ...task };
        delete taskBody.privateTaskId;
        privateTasks.push({
            id: privateTaskId,
            ownerId,
            createdById: String(writerId || ownerId).trim(),
            assignedTo,
            planId,
            taskIndex: index,
            task: taskBody
        });
        return {
            id: task.id || privateTaskId,
            privateTaskId,
            isPrivate: true,
            ...(assignedTo ? { assignedTo } : {})
        };
    });
    return {
        publicPlan: { ...source, plans: publicTasks },
        privateTasks
    };
}

export async function hydrateWorkPlanFromStorage(workPlan, viewerId, readPrivateTask) {
    if (!workPlan || !Array.isArray(workPlan.plans)) return workPlan;
    const viewer = String(viewerId || '').trim();
    const owner = String(workPlan.userId === 'annual_shared' ? workPlan.createdById : workPlan.userId || '').trim();
    const tasks = await Promise.all(workPlan.plans.map(async (task) => {
        if (!task || task.isPrivate !== true) return task;
        const assignedTo = String(task.assignedTo || '').trim();
        if (!viewer || (viewer !== owner && viewer !== assignedTo)) return null;
        const privateTaskId = String(task.privateTaskId || '').trim();
        // Legacy records remain readable during the staged migration rollout.
        if (!privateTaskId) return task;
        try {
            const stored = await readPrivateTask(privateTaskId);
            if (!stored || String(stored.ownerId || '') !== owner || String(stored.planId || '') !== String(workPlan.id || '') || String(stored.assignedTo || '') !== assignedTo) return null;
            return { ...(stored.task || {}), id: task.id || stored.task?.id || privateTaskId, privateTaskId, isPrivate: true };
        } catch (error) {
            // Fail the whole plan read. Returning a filtered plan lets a later
            // save mistake a transient read failure for an intentional delete.
            throw new Error(`Unable to read private task ${privateTaskId}; aborting plan read.`, { cause: error });
        }
    }));
    return { ...workPlan, plans: tasks.filter(Boolean) };
}
