/**
 * Meeting Minutes Module
 * Handles storage and retrieval of meeting minutes.
 */
window.AppMinutes = (function () {
    const COLLECTION = 'minutes';

    /**
     * Get all minutes
     */
    async function getMinutes() {
        try {
            if (window.AppDB) {
                return await window.AppDB.getAll(COLLECTION);
            } else {
                const snapshot = await window.AppFirestore.collection(COLLECTION).orderBy('date', 'desc').get();
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
    async function addMinute(data) {
        try {
            const user = window.AppAuth.getUser();
            const entry = {
                ...data,
                createdBy: user.id,
                createdByName: user.name,
                createdAt: new Date().toISOString(),
                auditLog: [{
                    userId: user.id,
                    userName: user.name,
                    timestamp: new Date().toISOString(),
                    action: "Created meeting minutes"
                }],
                approvals: {}, // userId: timestamp
                locked: false,
                restrictedFrom: [] // List of user IDs who cannot see this
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
     * Update an existing minute entry (with audit log)
     */
    async function updateMinute(id, updates, auditAction) {
        try {
            const user = window.AppAuth.getUser();
            const existing = await (window.AppDB ? window.AppDB.get(COLLECTION, id) : window.AppFirestore.collection(COLLECTION).doc(id).get().then(d => d.data()));

            if (!existing) throw new Error("Minute not found");
            if (existing.locked) throw new Error("This record is locked and cannot be edited.");

            const auditEntry = {
                userId: user.id,
                userName: user.name,
                timestamp: new Date().toISOString(),
                action: auditAction || "Updated minutes"
            };

            const updatedData = {
                ...existing,
                ...updates,
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
     * Approve meeting minutes
     */
    async function approveMinute(id) {
        try {
            const user = window.AppAuth.getUser();
            const existing = await (window.AppDB ? window.AppDB.get(COLLECTION, id) : window.AppFirestore.collection(COLLECTION).doc(id).get().then(d => d.data()));

            if (!existing) throw new Error("Minute not found");

            const approvals = existing.approvals || {};
            approvals[user.id] = new Date().toISOString();

            // Check if all attendees have approved
            const attendeeIds = existing.attendeeIds || [];
            const allApproved = attendeeIds.length > 0 && attendeeIds.every(uid => approvals[uid]);

            const auditEntry = {
                userId: user.id,
                userName: user.name,
                timestamp: new Date().toISOString(),
                action: "Approved meeting minutes"
            };

            const updates = {
                approvals,
                auditLog: [...(existing.auditLog || []), auditEntry]
            };

            if (allApproved) {
                updates.locked = true;
                updates.auditLog.push({
                    userId: 'system',
                    userName: 'System',
                    timestamp: new Date().toISOString(),
                    action: "All attendees approved. Minutes are now LOCKED."
                });
            }

            if (window.AppDB) {
                await window.AppDB.put(COLLECTION, { ...existing, ...updates });
            } else {
                await window.AppFirestore.collection(COLLECTION).doc(id).update(updates);
            }
            return true;
        } catch (error) {
            console.error("Error approving minute:", error);
            throw error;
        }
    }

    /**
     * Delete a minute entry
     */
    async function deleteMinute(id) {
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

    return {
        getMinutes,
        addMinute,
        updateMinute,
        approveMinute,
        deleteMinute
    };
})();
