/**
 * Auth Module
 * Handles User Authentication and Session Management
 * (Converted to IIFE for file:// support)
 */
(function () {
    class Auth {
        constructor() {
            this.currentUser = null;
            this.sessionKey = 'crwi_session_user';
            this.heartbeatInterval = null;
        }

        async init() {
            // Depend on AppDB
            await window.AppDB.init();

            const storedId = localStorage.getItem(this.sessionKey);
            if (storedId) {
                this.currentUser = await window.AppDB.get('users', storedId);
                if (this.currentUser) {
                    this.startHeartbeat();
                }
            }
        }

        /* SECURED: Seed Logic Disabled */

        async login(username, password) {
            const users = await window.AppDB.getAll('users');
            const cleanUser = username.trim().toLowerCase();
            const cleanPass = password.trim();

            console.log("Attempting Login:", { cleanUser, passwordProvided: cleanPass ? 'YES' : 'NO' });
            console.log("Available Users (Names only):", users.map(u => `${u.username} (${u.role})`));

            const user = users.find(u => {
                const uName = (u.username || "").toLowerCase().trim();
                const uEmail = (u.email || "").toLowerCase().trim();
                return (uName === cleanUser || uEmail === cleanUser) && u.password.trim() === cleanPass;
            });

            if (user) {
                this.currentUser = user;
                localStorage.setItem(this.sessionKey, user.id);
                this.startHeartbeat();
                return true;
            } else {
                // Debugging help for 'Invalid Credentials'
                const userMatch = users.find(u => u.username.toLowerCase().trim() === cleanUser || u.email.toLowerCase().trim() === cleanUser);
                if (userMatch) {
                    console.warn(`User found '${userMatch.username}', but password mismatch.`);
                    console.warn(`Input Pass: "${cleanPass}", Stored Pass: "${userMatch.password}"`);
                } else {
                    console.warn(`User '${cleanUser}' not found.`);
                }
            }
            return false;
        }

        logout() {
            this.stopHeartbeat();
            this.currentUser = null;
            localStorage.removeItem(this.sessionKey);
            window.location.reload();
        }

        getUser() {
            return this.currentUser;
        }

        async updateUser(userData) {
            // Find existing to preserve fields like avatar if not provided
            const existing = await window.AppDB.get('users', userData.id);
            if (!existing) return false;

            const updated = { ...existing, ...userData };

            // Sync Role & isAdmin Status (Robust Logic)
            if (userData.isAdmin === true || userData.isAdmin === 'true') {
                updated.isAdmin = true;
                updated.role = 'Administrator';
            } else if (userData.role === 'Administrator') {
                // If role selected as Admin but checkbox unchecked, treat as Admin
                updated.isAdmin = true;
                updated.role = 'Administrator';
            } else {
                // Not an admin
                updated.isAdmin = false;
                updated.role = userData.role || existing.role || 'Employee';
            }

            console.log(`Auth: User ${updated.id} update - Role: ${updated.role}, Admin: ${updated.isAdmin}`);

            // Only regenerate default avatar if name changed AND no new avatar provided
            if (userData.name && userData.name !== existing.name && !userData.avatar) {
                updated.avatar = `https://ui-avatars.com/api/?name=${userData.name}&background=random&color=fff`;
            }

            await window.AppDB.put('users', updated);

            // If current user is the one being updated, refresh memory state
            if (this.currentUser && this.currentUser.id === updated.id) {
                this.currentUser = updated;
            }
            return true;
        }

        /* SECURED: Reset Logic Disabled
        async resetData() {
            if (confirm('Are you sure you want to RESET ALL DATA? This will clear logs and users.')) {
                this.stopHeartbeat();
                await window.AppDB.clear('users');
                await window.AppDB.clear('attendance');
                localStorage.clear();
                alert('Data reset. Reloading...');
                window.location.reload();
            }
        }
        */

        startHeartbeat() {
            if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

            const updateLastSeen = async () => {
                if (this.currentUser && window.AppDB) {
                    try {
                        await window.AppDB.put('users', {
                            id: this.currentUser.id,
                            lastSeen: Date.now()
                        });
                    } catch (err) {
                        console.warn("Heartbeat update failed:", err);
                    }
                }
            };

            // Immediate update
            updateLastSeen();
            // Then every 30 seconds
            this.heartbeatInterval = setInterval(updateLastSeen, 30000);
            console.log("Presence Heartbeat started.");
        }

        stopHeartbeat() {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
                console.log("Presence Heartbeat stopped.");
            }
        }
    }

    // Export to Window
    window.AppAuth = new Auth();
})();
