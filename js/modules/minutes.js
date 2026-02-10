/**
 * Meeting Minutes Module
 * Handles storage and retrieval of meeting minutes.
 */
window.AppMinutes = (function () {
    const COLLECTION = 'minutes';

    /**
     * Get all minutes, optionally filtered by date range or limit
     */
    async function getMinutes(limit = 20) {
        try {
            // Using AppDB helper which likely wraps Firestore
            // Assuming AppDB.getAll or query is available.
            // If AppDB is just a wrapper, we might use it directly.
            // Let's use window.AppDB if available, or raw firestore if needed.
            // Based on other modules, AppDB seems to be the way.

            // Check if AppDB is available, otherwise fell back to firestore
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
    async function addMinute(data) {
        try {
            const user = window.AppAuth.getUser();
            const entry = {
                ...data,
                createdBy: user.id,
                createdByName: user.name,
                createdAt: new Date().toISOString()
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
        deleteMinute
    };
})();
