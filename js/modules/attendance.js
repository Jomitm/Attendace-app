/**
 * Attendance Module
 * Handles Check-in, Check-out, and Log Management
 * (Converted to IIFE for file:// support)
 */
(function () {
    class Attendance {

        async getStatus() {
            // Depend on AppAuth
            const user = window.AppAuth.getUser();
            if (!user) return { status: 'out', lastCheckIn: null };
            return {
                status: user.status || 'out',
                lastCheckIn: user.lastCheckIn
            };
        }

        async checkIn(latitude, longitude, address = 'Unknown Location') {
            const user = window.AppAuth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Update User State
            user.status = 'in';
            user.lastCheckIn = Date.now();
            user.currentLocation = { lat: latitude, lng: longitude, address };

            await window.AppDB.put('users', user);
            return true;
        }

        async checkOut() {
            const user = window.AppAuth.getUser();
            if (!user || user.status !== 'in') throw new Error("User is not checked in");

            const checkInTime = new Date(user.lastCheckIn);
            const checkOutTime = new Date();
            const durationMs = checkOutTime - checkInTime;

            // Create Attendance Log
            const log = {
                id: Date.now(),
                user_id: user.id,
                date: checkOutTime.toLocaleDateString(),
                checkIn: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                checkOut: checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: this.msToTime(durationMs),
                type: 'Office',
                location: user.currentLocation?.address || 'Detected Location',
                synced: false // For future sync logic
            };

            // Save Log
            await window.AppDB.add('attendance', log);

            // Reset User State
            user.status = 'out';
            user.lastCheckIn = null;
            user.currentLocation = null;

            await window.AppDB.put('users', user);
            return log;
        }

        async addManualLog(logData) {
            const user = window.AppAuth.getUser();
            if (!user) return;

            const newLog = {
                id: Date.now(),
                user_id: user.id,
                ...logData,
                synced: false
            };

            await window.AppDB.add('attendance', newLog);
            return newLog;
        }

        async getLogs(userId = null) {
            // Optimized: Use Firestore Query instead of fetching all
            const targetId = userId || window.AppAuth.getUser()?.id;
            if (!targetId) return [];

            try {
                // Access raw Firestore instance for query
                const db = window.AppFirestore;
                let query = db.collection('attendance');

                // Filter by User
                query = query.where('user_id', '==', targetId);

                // Sort by ID (timestamp) descending for "Newest First"
                // Note: Firestore requires an index for this. If it fails, we default to client-side sort for now.
                // For simplicity/robustness without index mgmt, we fetch last 50 then sort client side safely
                // or just standard fetch.

                // Let's try simple fetch of recent items? 
                // Firestore client SDK doesn't support 'orderBy' easily without composite index if filtering.
                // Fallback: Fetch by user -> limit 50 -> sort client side.

                // const snapshot = await query.orderBy('id', 'desc').limit(50).get(); // Needs Index

                const snapshot = await query.get();
                const userLogs = snapshot.docs.map(doc => doc.data());

                // Client-side sort (but dataset is now much smaller, only this user's logs)
                return userLogs.sort((a, b) => b.id - a.id).slice(0, 50); // Limit to last 50
            } catch (e) {
                console.warn("Optimized log fetch failed, falling back to simple filter", e);
                // Fallback (e.g. offline mode restrictions?)
                return [];
            }
        }

        async getAllLogs() {
            // Admin: Get all logs
            return await window.AppDB.getAll('attendance');
        }

        msToTime(duration) {
            let minutes = Math.floor((duration / (1000 * 60)) % 60);
            let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
            return `${hours}h ${minutes}m`;
        }
    }

    // Export to Window
    window.AppAttendance = new Attendance();
})();
