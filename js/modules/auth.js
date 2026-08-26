import { AppDB } from './db.js';
import { AppConfig } from '../config.js';

export class Auth {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'crwi_session_user';
        this.deviceTokenKey = 'crwi_session_token';
        this.localToken = null;
        this.heartbeatInterval = null;
        this.userDocUnsubscribe = null;
    }

    async init() {
        // Depend on AppDB
        await AppDB.init();

        const storedId = localStorage.getItem(this.sessionKey);
        if (storedId) {
            this.currentUser = await AppDB.get('users', storedId);
            if (this.currentUser) {
                this.localToken = localStorage.getItem(this.deviceTokenKey) || null;
                // Session was superseded while offline (another device logged in) — kick locally.
                if (this.currentUser.activeSessionToken && this.localToken && this.currentUser.activeSessionToken !== this.localToken) {
                    this.forceLogout('Your session was ended because you logged in on another device.');
                    return;
                }
                this.startHeartbeat();
                this.startCurrentUserSync();
            }
        }
    }

    async refreshCurrentUserFromDB() {
        const sessionId = localStorage.getItem(this.sessionKey);
        if (!sessionId) {
            this.currentUser = null;
            return null;
        }

        // Optimization: If a realtime listener is active and we have a user,
        // trust the memory version to avoid race conditions with stale get() calls.
        if (this.userDocUnsubscribe && this.currentUser && this.currentUser.id === sessionId) {
            return this.currentUser;
        }

        const latest = await AppDB.get('users', sessionId);
        this.currentUser = latest || null;
        this.localToken = localStorage.getItem(this.deviceTokenKey) || null;
        if (latest && latest.activeSessionToken && this.localToken && latest.activeSessionToken !== this.localToken) {
            this.forceLogout('Your session was ended because you logged in on another device.');
        }
        return this.currentUser;
    }

    async login(username, password) {
        const users = AppDB.getCached
            ? await AppDB.getCached(
                AppDB.getCacheKey('authUsers', 'users', { mode: 'login' }),
                (AppConfig?.READ_CACHE_TTLS?.users || 60000),
                () => AppDB.getAll('users')
            )
            : await AppDB.getAll('users');
        const cleanUser = username.trim().toLowerCase();
        const cleanPass = password.trim();

        const user = users.find(u => {
            const uName = (u.username || "").toLowerCase().trim();
            const uEmail = (u.email || "").toLowerCase().trim();
            return (uName === cleanUser || uEmail === cleanUser) && u.password.trim() === cleanPass;
        });

        if (user) {
            this.currentUser = user;
            const token = this.generateSessionToken();
            this.localToken = token;
            localStorage.setItem(this.sessionKey, user.id);
            localStorage.setItem(this.deviceTokenKey, token);
            await AppDB.put('users', {
                id: user.id,
                activeSessionToken: token,
                activeSessionStartedAt: Date.now()
            }).catch((err) => console.warn('Failed to set session token:', err));
            this.startHeartbeat();
            this.startCurrentUserSync();
            return true;
        } else {
            console.warn('Login failed: invalid credentials.');
        }
        return false;
    }

    async logout() {
        const sessionId = localStorage.getItem(this.sessionKey);
        const localToken = localStorage.getItem(this.deviceTokenKey);
        if (sessionId && localToken) {
            // Only clear the server token if it belongs to this device,
            // so logging out here does not kill another device's session.
            try {
                const latest = await AppDB.get('users', sessionId);
                if (latest && latest.activeSessionToken && latest.activeSessionToken === localToken) {
                    await AppDB.put('users', { id: sessionId, activeSessionToken: null, activeSessionStartedAt: null });
                }
            } catch (err) {
                console.warn('Failed to clear session token on logout:', err);
            }
        }
        this.stopHeartbeat();
        this.stopCurrentUserSync();
        this.currentUser = null;
        this.localToken = null;
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.deviceTokenKey);
        window.location.reload();
    }

    forceLogout(message = 'Your session was ended.') {
        try {
            sessionStorage.setItem('crwi_auth_notice', message);
        } catch { /* ignore */ }
        this.stopHeartbeat();
        this.stopCurrentUserSync();
        this.currentUser = null;
        this.localToken = null;
        try {
            localStorage.removeItem(this.sessionKey);
            localStorage.removeItem(this.deviceTokenKey);
        } catch { /* ignore */ }
        window.location.reload();
    }

    generateSessionToken() {
        try {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return window.crypto.randomUUID();
            }
        } catch { /* fall through */ }
        return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
    }

    getUser() {
        return this.currentUser;
    }

    async updateUser(userData) {
        // Find existing to preserve fields like avatar if not provided
        const existing = await AppDB.get('users', userData.id);
        if (!existing) return false;

        const updated = { ...existing, ...userData };

        // Sync Admin Status
        if (userData.isAdmin === true || userData.isAdmin === 'true') {
            updated.isAdmin = true;
        } else {
            updated.isAdmin = false;
        }
        updated.role = userData.role || existing.role || 'Employee';

        console.log(`Auth: User ${updated.id} update - Role: ${updated.role}, Admin: ${updated.isAdmin}`);

        // Only regenerate default avatar if name changed AND no new avatar provided
        if (userData.name && userData.name !== existing.name && !userData.avatar) {
            updated.avatar = `https://ui-avatars.com/api/?name=${userData.name}&background=random&color=fff`;
        }

        await AppDB.put('users', updated);

        // If current user is the one being updated, refresh memory state
        if (this.currentUser && this.currentUser.id === updated.id) {
            this.currentUser = updated;
        }
        return true;
    }

    startHeartbeat() {
        const flags = (AppConfig && AppConfig.READ_OPT_FLAGS) || {};
        if (!flags.ENABLE_PRESENCE_HEARTBEAT) {
            this.stopHeartbeat();
            return;
        }
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        const updateLastSeen = async () => {
            if (this.currentUser && AppDB) {
                try {
                    await AppDB.put('users', {
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
        // Then every 2 minutes
        this.heartbeatInterval = setInterval(updateLastSeen, 120000);
        console.log("Presence Heartbeat started.");
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log("Presence Heartbeat stopped.");
        }
    }

    startCurrentUserSync() {
        this.stopCurrentUserSync();

        const sessionId = localStorage.getItem(this.sessionKey);
        if (!sessionId || !window.AppFirestore) return;

        try {
            this.userDocUnsubscribe = window.AppFirestore
                .collection('users')
                .doc(String(sessionId))
                .onSnapshot((doc) => {
                    if (!doc.exists) {
                        this.currentUser = null;
                        return;
                    }
                    const latestUser = { ...doc.data(), id: doc.id };

                    // Single active session enforcement: if the server token changed and
                    // no longer matches this device, end this session locally.
                    const localToken = localStorage.getItem(this.deviceTokenKey) || this.localToken;
                    if (latestUser.activeSessionToken && localToken && latestUser.activeSessionToken !== localToken) {
                        this.forceLogout('You have been logged out because you logged in on another device.');
                        return;
                    }

                    this.currentUser = latestUser;
                    window.dispatchEvent(new CustomEvent('app:user-sync', { detail: latestUser }));
                }, (err) => {
                    console.warn("Current user realtime sync failed:", err);
                });
        } catch (err) {
            console.warn("Failed to start current user sync:", err);
        }
    }

    stopCurrentUserSync() {
        if (typeof this.userDocUnsubscribe === 'function') {
            this.userDocUnsubscribe();
        }
        this.userDocUnsubscribe = null;
    }
}

// Export to Window (Global)
export const AppAuth = new Auth();
if (typeof window !== 'undefined') window.AppAuth = AppAuth;
