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
        this.isImpersonating = false;
        this._realUser = null;
        this._realToken = null;
    }

    // Helper: get Firebase Auth instance (loaded via CDN)
    _getFirebaseAuth() {
        return window.AppFirebaseAuth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    }

    async init() {
        await AppDB.init();

        const storedId = localStorage.getItem(this.sessionKey);
        if (storedId) {
            this.currentUser = await AppDB.get('users', storedId);
            if (this.currentUser) {
                this.localToken = localStorage.getItem(this.deviceTokenKey) || null;
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

    // Main login — calls server endpoint, gets custom token, signs in with Firebase Auth
    // Falls back to client-side login when server endpoint is unavailable (local dev)
    async login(username, password) {
        try {
            const response = await fetch('/api/auth-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: username, password })
            });

            const data = await response.json();

            if (!response.ok || !data.customToken) {
                console.warn('Login failed:', data.error || 'Unknown error');
                // Server-side failure (5xx) is not a credential problem — let
                // the caller show a retry message instead of "Invalid Credentials".
                if (response.status >= 500) {
                    return { serverError: data.error || 'Server error' };
                }
                return false;
            }

            // Sign in with Firebase Auth using the custom token
            const auth = this._getFirebaseAuth();
            if (auth) {
                await auth.signInWithCustomToken(data.customToken);
            }

            // Use the user data returned from the server
            const user = data.user;

            // Check session conflict (same logic as before)
            const localToken = localStorage.getItem(this.deviceTokenKey) || null;
            const foreignToken = user.activeSessionToken || null;
            const startedAt = user.activeSessionStartedAt || 0;
            const windowMs = (AppConfig && AppConfig.SESSION_TAKEOVER_PROMPT_WINDOW_MS) || (24 * 60 * 60 * 1000);
            const recent = (Date.now() - startedAt) <= windowMs;
            const hasConflict = !!foreignToken && foreignToken !== localToken && recent;
            const isOwner = (AppConfig && Array.isArray(AppConfig.OWNER_USERNAMES)
                ? AppConfig.OWNER_USERNAMES.map(s => String(s).toLowerCase())
                : []).includes((user.username || '').toLowerCase());

            if (hasConflict && !isOwner) {
                return { needsConflictConfirmation: true, user };
            }
            return this._establishSession(user, isOwner);
        } catch (err) {
            // Server endpoint unavailable — fall back to client-side login (local dev)
            console.warn('Server login unavailable, falling back to client-side login:', err.message);
            return this._loginLocal(username, password);
        }
    }

    // Client-side login fallback (original behavior for local dev)
    async _loginLocal(username, password) {
        const allUsers = await AppDB.getAll('users').catch(() => []);
        const user = allUsers.find(u =>
            (u.username || '').toLowerCase() === String(username).trim().toLowerCase()
        );
        if (!user || user.password !== String(password).trim()) {
            return false;
        }

        const localToken = localStorage.getItem(this.deviceTokenKey) || null;
        const foreignToken = user.activeSessionToken || null;
        const startedAt = user.activeSessionStartedAt || 0;
        const windowMs = (AppConfig && AppConfig.SESSION_TAKEOVER_PROMPT_WINDOW_MS) || (24 * 60 * 60 * 1000);
        const recent = (Date.now() - startedAt) <= windowMs;
        const hasConflict = !!foreignToken && foreignToken !== localToken && recent;
        const isOwner = (AppConfig && Array.isArray(AppConfig.OWNER_USERNAMES)
            ? AppConfig.OWNER_USERNAMES.map(s => String(s).toLowerCase())
            : []).includes((user.username || '').toLowerCase());

        if (hasConflict && !isOwner) {
            return { needsConflictConfirmation: true, user };
        }
        return this._establishSession(user, isOwner);
    }

    async _establishSession(user, isOwner = false) {
        let token = this.generateSessionToken();
        if (isOwner && user.activeSessionToken) {
            token = user.activeSessionToken;
        }
        this.localToken = token;
        this.currentUser = user;
        localStorage.setItem(this.sessionKey, user.id);
        localStorage.setItem(this.deviceTokenKey, token);
        if (!isOwner || !user.activeSessionToken) {
            await AppDB.put('users', {
                id: user.id,
                activeSessionToken: token,
                activeSessionStartedAt: Date.now()
            }).catch((err) => console.warn('Failed to set session token:', err));
        }
        this.startHeartbeat();
        this.startCurrentUserSync();
        return true;
    }

    async confirmTakeoverLogin(user) {
        if (!user || !user.id) return false;
        return this._establishSession(user);
    }

    // Owner-only login — server validates owner status
    // Falls back to client-side login when server endpoint is unavailable (local dev)
    async loginOwner(username, password) {
        try {
            const response = await fetch('/api/auth-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: username, password })
            });

            const data = await response.json();

            if (!response.ok || !data.customToken) {
                console.warn('Owner login failed:', data.error || 'Unknown error');
                if (response.status >= 500) {
                    return { serverError: data.error || 'Server error' };
                }
                return false;
            }

            const user = data.user;
            const isOwner = (AppConfig && Array.isArray(AppConfig.OWNER_USERNAMES)
                ? AppConfig.OWNER_USERNAMES.map(s => String(s).toLowerCase())
                : []).includes((user.username || '').toLowerCase());

            if (!isOwner) {
                return { denied: 'not-owner' };
            }

            // Sign in with Firebase Auth
            const auth = this._getFirebaseAuth();
            if (auth) {
                await auth.signInWithCustomToken(data.customToken);
            }

            if (user.passwordSetupRequired) {
                return { needsPasswordSetup: true, userId: user.id, username: user.username };
            }

            return this._establishSession(user, true);
        } catch (err) {
            // Server endpoint unavailable — fall back to client-side owner login (local dev)
            console.warn('Server owner login unavailable, falling back to client-side:', err.message);
            return this._loginOwnerLocal(username, password);
        }
    }

    // Client-side owner login fallback (original behavior for local dev)
    async _loginOwnerLocal(username, password) {
        const allUsers = await AppDB.getAll('users').catch(() => []);
        const user = allUsers.find(u =>
            (u.username || '').toLowerCase() === String(username).trim().toLowerCase()
        );
        if (!user || user.password !== String(password).trim()) {
            return false;
        }

        const isOwner = (AppConfig && Array.isArray(AppConfig.OWNER_USERNAMES)
            ? AppConfig.OWNER_USERNAMES.map(s => String(s).toLowerCase())
            : []).includes((user.username || '').toLowerCase());

        if (!isOwner) {
            return { denied: 'not-owner' };
        }

        if (user.passwordSetupRequired) {
            return { needsPasswordSetup: true, userId: user.id, username: user.username };
        }

        return this._establishSession(user, true);
    }

    async setPassword(userId, newPassword) {
        if (!userId || !newPassword) return false;
        const cleanPass = String(newPassword).trim();
        if (cleanPass.length < 4) return { error: 'Password must be at least 4 characters.' };

        try {
            const auth = this._getFirebaseAuth();
            const idToken = auth && auth.currentUser ? await auth.currentUser.getIdToken() : null;

            const response = await fetch('/api/auth-set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newPassword: cleanPass, idToken })
            });

            const data = await response.json();
            if (!response.ok) {
                return { error: data.error || 'Failed to set password' };
            }
            return true;
        } catch (err) {
            console.warn('Set password error:', err);
            return { error: 'Network error' };
        }
    }

    async impersonate(userId) {
        const me = this.currentUser;
        if (!me) return false;
        const ownerUsernames = (AppConfig && Array.isArray(AppConfig.OWNER_USERNAMES)
            ? AppConfig.OWNER_USERNAMES.map(s => String(s).toLowerCase()) : []);
        const isOwner = ownerUsernames.includes(String(me.username || '').toLowerCase());
        if (!isOwner) return false;

        const target = await AppDB.get('users', userId).catch(() => null);
        if (!target) return false;
        if (target.id === me.id) return false;

        this._realUser = me;
        this._realToken = this.localToken;
        this.isImpersonating = true;

        this.stopCurrentUserSync();
        this.stopHeartbeat();

        this.currentUser = { ...target, id: target.id };
        window.dispatchEvent(new CustomEvent('app:impersonation-start', { detail: this.currentUser }));
        return true;
    }

    async stopImpersonating() {
        if (!this.isImpersonating) return false;
        this.isImpersonating = false;
        this.currentUser = this._realUser;
        this.localToken = this._realToken;
        this._realUser = null;
        this._realToken = null;
        this.startCurrentUserSync();
        this.startHeartbeat();
        window.dispatchEvent(new CustomEvent('app:impersonation-end', { detail: this.currentUser }));
        return true;
    }

    async logout() {
        const sessionId = localStorage.getItem(this.sessionKey);
        const localToken = localStorage.getItem(this.deviceTokenKey);
        if (sessionId && localToken) {
            try {
                const latest = await AppDB.get('users', sessionId);
                if (latest && latest.activeSessionToken && latest.activeSessionToken === localToken) {
                    await AppDB.put('users', { id: sessionId, activeSessionToken: null, activeSessionStartedAt: null });
                }
            } catch (err) {
                console.warn('Failed to clear session token on logout:', err);
            }
        }
        // Sign out from Firebase Auth
        const auth = this._getFirebaseAuth();
        if (auth) {
            try { await auth.signOut(); } catch { /* ignore */ }
        }
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

    forceLogout(message = 'Your session was ended.') {
        try {
            sessionStorage.setItem('crwi_auth_notice', message);
        } catch { /* ignore */ }
        // Sign out from Firebase Auth
        const auth = this._getFirebaseAuth();
        if (auth) {
            try { auth.signOut(); } catch { /* ignore */ }
        }
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
        const existing = await AppDB.get('users', userData.id);
        if (!existing) return false;

        const updated = { ...existing, ...userData };

        if (userData.isAdmin === true || userData.isAdmin === 'true') {
            updated.isAdmin = true;
        } else {
            updated.isAdmin = false;
        }
        updated.role = userData.role || existing.role || 'Employee';

        console.log(`Auth: User ${updated.id} update - Role: ${updated.role}, Admin: ${updated.isAdmin}`);

        if (userData.name && userData.name !== existing.name && !userData.avatar) {
            updated.avatar = `https://ui-avatars.com/api/?name=${userData.name}&background=random&color=fff`;
        }

        await AppDB.put('users', updated);

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

        updateLastSeen();
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

export const AppAuth = new Auth();
if (typeof window !== 'undefined') window.AppAuth = AppAuth;
