/**
 * Database Module (Firestore Wrapper)
 * Handles real-time cloud storage for Users and Attendance.
 * Replaces IndexedDB implementation.
 */
(function () {
    class Database {
        constructor() {
            // AppFirestore should be initialized in firebase-config.js
            this.db = window.AppFirestore;
        }

        async init() {
            // Firestore doesn't need explicit 'open', but we can check connection
            if (!this.db) {
                console.error("Firebase not initialized! Check config.");
                return;
            }
            console.log("Firestore adapter ready.");
            // No strict schema setup needed for Firestore (schema-less)
        }

        async getAll(collectionName) {
            try {
                const snapshot = await this.db.collection(collectionName).get();
                return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            } catch (error) {
                console.error(`Error getting all from ${collectionName}:`, error);
                throw error;
            }
        }

        async get(collectionName, id) {
            if (!id) return null;
            try {
                const docId = String(id);
                const docRef = this.db.collection(collectionName).doc(docId);
                const doc = await docRef.get();
                if (doc.exists) {
                    return { ...doc.data(), id: doc.id };
                } else {
                    return null;
                }
            } catch (error) {
                console.error(`Error getting ${id} from ${collectionName}:`, error);
                throw error;
            }
        }

        async add(collectionName, item) {
            // Use 'put' logic (set with ID) if item has an ID, otherwise addDoc
            if (item.id) {
                return this.put(collectionName, item);
            }
            try {
                const docRef = await this.db.collection(collectionName).add(item);
                // We might want to save the auto-generated ID back into the item?
                // For now, just return the ID.
                return docRef.id;
            } catch (error) {
                console.error(`Error adding to ${collectionName}:`, error);
                throw error;
            }
        }

        async put(collectionName, item) {
            if (!item.id) throw new Error("Item must have an ID for 'put' operation.");
            try {
                // FORCE STRING ID
                const docId = String(item.id);
                await this.db.collection(collectionName).doc(docId).set(item, { merge: true });
                return docId;
            } catch (error) {
                console.error(`Error putting ${item.id} to ${collectionName}:`, error);
                throw error;
            }
        }

        async delete(collectionName, id) {
            if (!id) return;
            try {
                const docId = String(id);
                await this.db.collection(collectionName).doc(docId).delete();
            } catch (error) {
                console.error(`Error deleting ${id} from ${collectionName}:`, error);
                throw error;
            }
        }

        /* SECURED: Clear Logic Disabled
        async clear(collectionName) {
            // DANGEROUS IN PRODUCTION - Deletes all documents in collection
            // Only used for Reset/Debug
            try {
                const snapshot = await this.db.collection(collectionName).get();
                const batch = this.db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            } catch (error) {
                console.error(`Error clearing ${collectionName}:`, error);
                throw error;
            }
        }
        */

        async query(collectionName, field, operator, value) {
            try {
                const snapshot = await this.db.collection(collectionName).where(field, operator, value).get();
                return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            } catch (error) {
                console.error(`Error querying ${collectionName}:`, error);
                throw error;
            }
        }

        listen(collectionName, callback) {
            if (!this.db) return null;
            return this.db.collection(collectionName).onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                callback(data);
            }, (error) => {
                console.error(`Realtime listener error in ${collectionName}:`, error);
            });
        }
    }

    // Export to Window (Global)
    window.AppDB = new Database();
})();
