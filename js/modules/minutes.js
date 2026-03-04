/**
 * Meeting Minutes Module
 * Handles storage and retrieval of meeting minutes.
 */

const COLLECTION = 'minutes';

/**
 * Get all minutes
 */
export async function getMinutes(options = {}) {
    try {
        const limit = options.limit || 150;
        if (window.AppDB) {
            return await window.AppDB.getAll(COLLECTION);
        } else {
            const snapshot = await window.AppFirestore.collection(COLLECTION).orderBy('date', 'desc').limit(limit).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (error) {
        console.error("Error fetching minutes:", error);
        throw error;
    }
}

/**
 * Add a new minute entry
 */
export async function addMinute(data) {
    try {
        const user = window.AppAuth.getUser();
        const entry = {
            ...data,
            createdBy: user.id,
            createdByName: user.name || user.username,
            createdAt: new Date().toISOString(),
            auditLog: [{
                userId: user.id,
                userName: user.name || user.username,
                timestamp: new Date().toISOString(),
                action: "Created meeting minutes"
            }],
            approvals: {}, // userId: timestamp
            locked: false,
            restrictedFrom: [],
            allowedViewers: [],
            accessRequests: [] // { userId, userName, status: 'pending'|'approved'|'rejected', requestedAt }
        };

        if (window.AppDB) {
            return await window.AppDB.add(COLLECTION, entry);
        } else {
            const docRef = await window.AppFirestore.collection(COLLECTION).add(entry);
            return docRef.id;
        }
    } catch (error) {
        console.error("Error adding minute:", error);
        throw error;
    }
}

/**
 * Update an existing minute entry
 */
export async function updateMinute(id, updates, auditAction) {
    try {
        const user = window.AppAuth.getUser();
        const existing = await (window.AppDB ? window.AppDB.get(COLLECTION, id) : window.AppFirestore.collection(COLLECTION).doc(id).get().then(d => d.data()));

        if (!existing) throw new Error("Minute not found");
        if (existing.locked && !auditAction?.includes("Action Items")) throw new Error("This record is locked.");

        const auditEntry = {
            userId: user.id,
            userName: user.name || user.username,
            timestamp: new Date().toISOString(),
            action: auditAction || "Updated minutes"
        };

        const updatedData = {
            ...existing,
            ...updates,
            id: id,
            auditLog: [...(existing.auditLog || []), auditEntry]
        };

        if (window.AppDB) {
            await window.AppDB.put(COLLECTION, updatedData);
        } else {
            await window.AppFirestore.collection(COLLECTION).doc(id).update(updatedData);
        }
        return true;
    } catch (error) {
        console.error("Error updating minute:", error);
        throw error;
    }
}

/**
 * Request access to minutes
 */
export async function requestAccess(id) {
    try {
        const user = window.AppAuth.getUser();
        const existing = await (window.AppDB ? window.AppDB.get(COLLECTION, id) : window.AppFirestore.collection(COLLECTION).doc(id).get().then(d => d.data()));
        if (!existing) throw new Error("Minute not found");

        const requests = existing.accessRequests || [];
        if (requests.some(r => r.userId === user.id)) return true; // Already requested

        requests.push({
            userId: user.id,
            userName: user.name || user.username,
            status: 'pending',
            requestedAt: new Date().toISOString()
        });

        return await updateMinute(id, { accessRequests: requests }, `Requested access for ${user.name}`);
    } catch (error) {
        console.error("Error requesting access:", error);
        throw error;
    }
}

/**
 * Handle access request
 */
export async function handleAccessRequest(id, userId, status) {
    try {
        const existing = await (window.AppDB ? window.AppDB.get(COLLECTION, id) : window.AppFirestore.collection(COLLECTION).doc(id).get().then(d => d.data()));
        if (!existing) throw new Error("Minute not found");

        const requests = existing.accessRequests || [];
        const req = requests.find(r => r.userId === userId);
        if (!req) return;

        req.status = status;
        const allowedViewers = existing.allowedViewers || [];
        if (status === 'approved' && !allowedViewers.includes(userId)) {
            allowedViewers.push(userId);
        }

        return await updateMinute(id, { accessRequests: requests, allowedViewers }, `${status.toUpperCase()} access request for userId: ${userId}`);
    } catch (error) {
        console.error("Error handling access request:", error);
        throw error;
    }
}

/**
 * Update Action Item Status
 */
export async function updateActionItemStatus(id, taskIndex, status) {
    try {
        const existing = await (window.AppDB ? window.AppDB.get(COLLECTION, id) : window.AppFirestore.collection(COLLECTION).doc(id).get().then(d => d.data()));
        if (!existing || !existing.actionItems) throw new Error("Minute or tasks not found");

        const task = existing.actionItems[taskIndex];
        if (!task) throw new Error("Task not found");

        task.status = status;
        if (status === 'completed') task.completedAt = new Date().toISOString();

        // Locked record check: we allow updating action item status even if locked
        return await updateMinute(id, { actionItems: existing.actionItems }, `Updated Task: ${task.task} to ${status}`);
    } catch (error) {
        console.error("Error updating action item:", error);
        throw error;
    }
}

/**
 * Approve meeting minutes
 */
export async function approveMinute(id) {
    try {
        const user = window.AppAuth.getUser();
        const existing = await (window.AppDB ? window.AppDB.get(COLLECTION, id) : window.AppFirestore.collection(COLLECTION).doc(id).get().then(d => d.data()));

        if (!existing) throw new Error("Minute not found");

        const approvals = existing.approvals || {};
        approvals[user.id] = new Date().toISOString();

        const attendeeIds = existing.attendeeIds || [];
        const allApproved = attendeeIds.length > 0 && attendeeIds.every(uid => approvals[uid]);

        const updates = { approvals };
        if (allApproved) {
            updates.locked = true;
        }

        return await updateMinute(id, updates, `${allApproved ? 'FINAL APPROVAL & LOCK' : 'Signed'} by ${user.name}`);
    } catch (error) {
        console.error("Error approving minute:", error);
        throw error;
    }
}

/**
 * Delete a minute entry
 */
export async function deleteMinute(id) {
    try {
        if (window.AppDB) {
            return await window.AppDB.delete(COLLECTION, id);
        } else {
            await window.AppFirestore.collection(COLLECTION).doc(id).delete();
            return true;
        }
    } catch (error) {
        console.error("Error deleting minute:", error);
        throw error;
    }
}

// Global Export
const AppMinutes = {
    getMinutes,
    addMinute,
    updateMinute,
    approveMinute,
    deleteMinute,
    requestAccess,
    handleAccessRequest,
    updateActionItemStatus
};

if (typeof window !== 'undefined') {
    window.AppMinutes = AppMinutes;
}

export default AppMinutes;
