import { AppDB } from './db.js';
import { AppConfig } from '../config.js';

const MAX_DEVICE_SESSIONS = 2;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function isLocalTestingHost() {
    const hostname = String(window.location?.hostname || '').toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function nextTenPmIst(now = Date.now()) {
    const istNow = new Date(now + IST_OFFSET_MS);
    let cutoff = Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
        22, 0, 0, 0
    ) - IST_OFFSET_MS;
    if (cutoff <= now) cutoff += DAY_MS;
    return cutoff;
}

const normalizeSession = (session) => {
    const token = String(session?.token || '').trim();
    if (!token) return null;
    return {
        token,
        signedInAt: Math.max(0, Number(session.signedInAt) || 0),
        logoutAt: Math.max(0, Number(session.logoutAt) || 0) || null
    };
};

async function readLoginResponse(response, label) {
    const raw = await response.text();
    if (!raw.trim()) {
        console.error(`${label} returned an empty response body`, { status: response.status });
        return { invalidResponse: true, error: `Login service returned an empty response (HTTP ${response.status}).` };
    }

    try {
        return JSON.parse(raw);
    } catch {
        console.error(`${label} returned a non-JSON response`, {
            status: response.status,
            contentType: response.headers.get('content-type') || '',
            bodyPreview: raw.slice(0, 200)
        });
        return { invalidResponse: true, error: `Login service returned an invalid response (HTTP ${response.status}).` };
    }
}

export class Auth {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'crwi_session_user';
        this.deviceTokenKey = 'crwi_session_token';
        this.localToken = null;
        this.heartbeatInterval = null;
        this.userDocUnsubscribe = null;
        this.sessionExpiryTimer = null;
        this.isForceLoggingOut = false;
        this.pendingSessionChecks = new Set();
        this.visibilityCheckHandler = null;
        this.isImpersonating = false;
        this._realUser = null;
        this._realToken = null;
    }

    // Helper: get Firebase Auth instance (loaded via CDN)
    _getFirebaseAuth() {
        return window.AppFirebaseAuth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    }

    async _waitForFirebaseUser(auth = this._getFirebaseAuth()) {
        if (!auth) return null;
        if (auth.currentUser) return auth.currentUser;
        if (typeof auth.onAuthStateChanged !== 'function') return null;

        return new Promise((resolve) => {
            let unsubscribe = null;
            let settled = false;
            const finish = (user) => {
                if (settled) return;
                settled = true;
                if (typeof unsubscribe === 'function') unsubscribe();
                resolve(user || null);
            };
            try {
                unsubscribe = auth.onAuthStateChanged(finish, (error) => {
                    console.warn('Firebase auth state could not be restored:', error);
                    finish(null);
                });
                if (settled && typeof unsubscribe === 'function') unsubscribe();
            } catch (error) {
                console.warn('Firebase auth state could not be restored:', error);
                finish(null);
            }
        });
    }

    async init() {
        await AppDB.init();

        const storedId = localStorage.getItem(this.sessionKey);
        if (storedId) {
            // Firebase restores its persisted auth state asynchronously. Wait
            // for that first state before reading a profile from Firestore;
            // the cached app session alone is not database authorization.
            const firebaseAuth = this._getFirebaseAuth();
            const firebaseUser = await this._waitForFirebaseUser(firebaseAuth);
            if (!firebaseUser || String(firebaseUser.uid || '') !== String(storedId)) {
                if (firebaseUser && typeof firebaseAuth?.signOut === 'function') {
                    try { await firebaseAuth.signOut(); } catch { /* ignore stale auth cleanup */ }
                }
                this.currentUser = null;
                this.localToken = null;
                this.stopHeartbeat();
                this.stopCurrentUserSync();
                this._clearSessionExpiry();
                localStorage.removeItem(this.sessionKey);
                localStorage.removeItem(this.deviceTokenKey);
                return;
            }

            this.currentUser = await AppDB.get('users', storedId);
            if (this.currentUser) {
                this.localToken = localStorage.getItem(this.deviceTokenKey) || null;
                if (!this.localToken) {
                    this.forceLogout('Your saved sign-in could not be verified. Please sign in again.');
                    return;
                }
                if (!isLocalTestingHost()) {
                    const registered = await this._registerDeviceSession(this.currentUser, this.localToken);
                    if (!registered.ok) {
                        this.forceLogout(registered.expired
                            ? 'This device session reached its 10 PM India time sign-out.'
                            : 'This account is already signed in on two devices. Sign out on one device and try again.');
                        return;
                    }
                    this.currentUser = { ...this.currentUser, activeSessions: registered.sessions };
                    this._scheduleSessionExpiry(registered.session);
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
        if (latest && !this._validateUserSession(latest)) {
            return null;
        }
        return this.currentUser;
    }

    // Main login — calls server endpoint, gets custom token, signs in with Firebase Auth
    // Falls back to client-side login when server endpoint is unavailable (local dev)
    async login(username, password) {
        let serverResponded = false;
        try {
            const response = await fetch('/api/auth-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: username, password })
            });
            serverResponded = true;

            const data = await readLoginResponse(response, 'Login service');

            if (data.invalidResponse) {
                return { serverError: data.error };
            }

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
            if (!auth) {
                return { serverError: 'Firebase Authentication is unavailable.' };
            }
            await auth.signInWithCustomToken(data.customToken);

            // Use the user data returned from the server
            const user = data.user;

            const isOwner = (AppConfig && Array.isArray(AppConfig.OWNER_USERNAMES)
                ? AppConfig.OWNER_USERNAMES.map(s => String(s).toLowerCase())
                : []).includes((user.username || '').toLowerCase());
            return this._establishSession(user, isOwner);
        } catch (err) {
            if (serverResponded) {
                console.error('Firebase sign-in failed after the login service responded:', err);
                return { serverError: 'Firebase sign-in failed. Please contact your administrator.' };
            }
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

        const isOwner = (AppConfig && Array.isArray(AppConfig.OWNER_USERNAMES)
            ? AppConfig.OWNER_USERNAMES.map(s => String(s).toLowerCase())
            : []).includes((user.username || '').toLowerCase());
        return this._establishSession(user, isOwner);
    }

    async _establishSession(user, _isOwner = false) {
        // Interactive sign-in must get a fresh token. Reusing a saved token
        // can strand a device on a session that was already removed or expired.
        // Page refreshes retain the current token through init(), not here.
        const token = this.generateSessionToken();
        let registered;
        try {
            registered = isLocalTestingHost()
                ? { ok: true, sessions: user.activeSessions || [], session: { token, signedInAt: Date.now(), logoutAt: null } }
                : await this._registerDeviceSession(user, token, { replaceExisting: true });
        } catch (err) {
            console.error('Failed to register device session:', err);
            const auth = this._getFirebaseAuth();
            if (auth) await auth.signOut().catch(() => {});
            return { serverError: 'Could not save this device session. Check your connection and Firestore permissions, then try again.' };
        }
        if (!registered.ok) {
            const auth = this._getFirebaseAuth();
            if (auth) await auth.signOut().catch(() => {});
            return registered.expired
                ? { serverError: 'This device session has expired. Please sign in again.' }
                : { sessionLimitReached: true };
        }

        this.localToken = token;
        this.currentUser = { ...user, activeSessions: registered.sessions };
        localStorage.setItem(this.sessionKey, user.id);
        localStorage.setItem(this.deviceTokenKey, token);
        this._scheduleSessionExpiry(registered.session);
        this.startHeartbeat();
        this.startCurrentUserSync();
        return true;
    }

    async confirmTakeoverLogin(user) {
        if (!user || !user.id) return false;
        return this._establishSession(user);
    }

    async _registerDeviceSession(user, token, { replaceExisting = false } = {}) {
        const firestore = window.AppFirestore || AppDB.db;
        if (!firestore?.runTransaction || !user?.id || !token) {
            throw new Error('Firestore session storage is unavailable.');
        }
        const ref = firestore.collection('users').doc(String(user.id));
        const now = Date.now();

        return firestore.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (!snapshot.exists) throw new Error('The user record no longer exists.');
            const data = snapshot.data() || {};
            let sessions = Array.isArray(data.activeSessions)
                ? data.activeSessions.map(normalizeSession).filter(Boolean)
                : [];

            // Migrate older app versions' single-device session without signing
            // that device out immediately.
            if (!Array.isArray(data.activeSessions) && data.activeSessionToken) {
                sessions.push(normalizeSession({
                    token: data.activeSessionToken,
                    signedInAt: data.activeSessionStartedAt || now,
                    logoutAt: null
                }));
                sessions = sessions.filter(Boolean);
            }

            const now = Date.now();
            const existing = sessions.find((session) => session.token === token);
            if (existing?.logoutAt && existing.logoutAt <= now) return { ok: false, expired: true };
            sessions = sessions.filter((session) => session.token === token || !session.logoutAt || session.logoutAt > now);

            // An explicit sign-in is a user-requested takeover: replace every
            // older device session immediately. init() omits this option so a
            // page refresh keeps the already-established session intact.
            if (replaceExisting) sessions = sessions.filter((session) => session.token === token);

            let current = sessions.find((session) => session.token === token) || null;
            if (!current) {
                const latestStart = sessions.reduce((max, session) => Math.max(max, session.signedInAt), 0);
                current = { token, signedInAt: Math.max(now, latestStart + 1), logoutAt: null };
                sessions.push(current);
            }

            sessions.sort((a, b) => a.signedInAt - b.signedInAt || a.token.localeCompare(b.token));
            // Keep refresh-driven registration bounded even if stale records
            // from older app versions remain in the document.
            if (sessions.length > MAX_DEVICE_SESSIONS) {
                sessions.splice(0, sessions.length - MAX_DEVICE_SESSIONS);
            }
            if (sessions.length === 2) {
                sessions[0].logoutAt = sessions[0].logoutAt || nextTenPmIst(now);
                sessions[1].logoutAt = null;
            } else if (sessions[0]) {
                sessions[0].logoutAt = null;
            }
            const legacySession = sessions[0] || null;
            transaction.set(ref, {
                activeSessions: sessions,
                activeSessionToken: legacySession?.token || null,
                activeSessionStartedAt: legacySession?.signedInAt || null
            }, { merge: true });

            return {
                ok: true,
                sessions,
                session: sessions.find((session) => session.token === token)
            };
        });
    }

    async _releaseDeviceSession(userId, token) {
        if (isLocalTestingHost()) return;
        const firestore = window.AppFirestore || AppDB.db;
        if (!firestore?.runTransaction || !userId || !token) return;
        const ref = firestore.collection('users').doc(String(userId));
        await firestore.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (!snapshot.exists) return;
            const data = snapshot.data() || {};
            let sessions = Array.isArray(data.activeSessions)
                ? data.activeSessions.map(normalizeSession).filter(Boolean)
                : [];
            if (!Array.isArray(data.activeSessions) && data.activeSessionToken) {
                sessions.push(normalizeSession({
                    token: data.activeSessionToken,
                    signedInAt: data.activeSessionStartedAt || Date.now(),
                    logoutAt: null
                }));
                sessions = sessions.filter(Boolean);
            }
            sessions = sessions.filter((session) => session.token !== token && (!session.logoutAt || session.logoutAt > Date.now()));
            sessions.sort((a, b) => a.signedInAt - b.signedInAt || a.token.localeCompare(b.token));
            if (sessions.length === 2) {
                sessions[0].logoutAt = sessions[0].logoutAt || nextTenPmIst();
                sessions[1].logoutAt = null;
            } else if (sessions[0]) {
                sessions[0].logoutAt = null;
            }
            const legacySession = sessions[0] || null;
            transaction.set(ref, {
                activeSessions: sessions,
                activeSessionToken: legacySession?.token || null,
                activeSessionStartedAt: legacySession?.signedInAt || null
            }, { merge: true });
        });
    }

    _validateUserSession(user) {
        const token = localStorage.getItem(this.deviceTokenKey) || this.localToken;
        if (!token) {
            this.forceLogout('Your saved sign-in could not be verified. Please sign in again.');
            return false;
        }
        if (isLocalTestingHost()) return true;
        if (Array.isArray(user.activeSessions)) {
            const session = user.activeSessions.map(normalizeSession).find((item) => item?.token === token);
            if (!session) {
                // A different tab can receive the Firestore session update
                // before the tab that signed in has saved its new token. Check
                // the authoritative server state after that write can settle
                // before ending Firebase Auth across the shared browser tabs.
                this._confirmSessionMembership(user.id, token);
                return false;
            }
            if (session.logoutAt && session.logoutAt <= Date.now()) {
                this.forceLogout('Your older device session was automatically signed out at 10 PM India time.');
                return false;
            }
            this._scheduleSessionExpiry(session);
            return true;
        }
        if (user.activeSessionToken && user.activeSessionToken !== token) {
            this._confirmSessionMembership(user.id, token);
            return false;
        }
        return true;
    }

    _confirmSessionMembership(userId, observedToken) {
        const key = `${String(userId || '')}:${String(observedToken || '')}`;
        if (!userId || !observedToken || this.pendingSessionChecks.has(key)) return;
        this.pendingSessionChecks.add(key);
        window.setTimeout(async () => {
            try {
                const firestore = window.AppFirestore || AppDB.db;
                const ref = firestore?.collection?.('users')?.doc?.(String(userId));
                if (!ref?.get) return;
                const snapshot = await ref.get({ source: 'server' });
                if (!snapshot.exists) return;
                const data = snapshot.data() || {};
                const sharedToken = localStorage.getItem(this.deviceTokenKey);
                const tokenToCheck = sharedToken || observedToken;
                const sessions = Array.isArray(data.activeSessions)
                    ? data.activeSessions.map(normalizeSession).filter(Boolean)
                    : [];
                const session = sessions.find((item) => item.token === tokenToCheck);
                const stillAuthorized = session
                    ? !session.logoutAt || session.logoutAt > Date.now()
                    : !Array.isArray(data.activeSessions)
                        && (!data.activeSessionToken || data.activeSessionToken === tokenToCheck);
                if (stillAuthorized) {
                    this.localToken = tokenToCheck;
                    return;
                }
                // Another tab may have completed a fresh sign-in while this
                // check was in flight. Never sign it out based on the stale
                // token this listener originally observed.
                if (sharedToken && sharedToken !== observedToken) return;
                await this.forceLogout('This device is no longer signed in. Please sign in again.');
            } catch (error) {
                // A transient network/cache error must not revoke a valid
                // session. The next Firestore snapshot or heartbeat retries.
                console.warn('Could not confirm this device session with the server:', error);
            } finally {
                this.pendingSessionChecks.delete(key);
            }
        }, 500);
    }

    _scheduleSessionExpiry(session) {
        this._clearSessionExpiry();
        if (!session?.logoutAt) return;
        const checkExpiry = () => {
            if (session.logoutAt <= Date.now()) {
                this.forceLogout('Your older device session was automatically signed out at 10 PM India time.');
            } else {
                this.sessionExpiryTimer = setTimeout(checkExpiry, session.logoutAt - Date.now());
            }
        };
        this.sessionExpiryTimer = setTimeout(checkExpiry, Math.max(0, session.logoutAt - Date.now()));
        if (!this.visibilityCheckHandler) {
            this.visibilityCheckHandler = () => {
                if (document.visibilityState === 'visible' && this.currentUser) {
                    this.refreshCurrentUserFromDB().catch((err) => console.warn('Session refresh failed:', err));
                }
            };
            document.addEventListener('visibilitychange', this.visibilityCheckHandler);
        }
    }

    _clearSessionExpiry() {
        if (this.sessionExpiryTimer) clearTimeout(this.sessionExpiryTimer);
        this.sessionExpiryTimer = null;
    }

    // Owner-only login — server validates owner status
    // Falls back to client-side login when server endpoint is unavailable (local dev)
    async loginOwner(username, password) {
        let serverResponded = false;
        try {
            const response = await fetch('/api/auth-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: username, password })
            });
            serverResponded = true;

            const data = await readLoginResponse(response, 'Owner login service');

            if (data.invalidResponse) {
                return { serverError: data.error };
            }

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
            if (!auth) {
                return { serverError: 'Firebase Authentication is unavailable.' };
            }
            await auth.signInWithCustomToken(data.customToken);

            if (user.passwordSetupRequired) {
                return { needsPasswordSetup: true, userId: user.id, username: user.username };
            }

            return this._establishSession(user, true);
        } catch (err) {
            if (serverResponded) {
                console.error('Firebase owner sign-in failed after the login service responded:', err);
                return { serverError: 'Firebase sign-in failed. Please contact your administrator.' };
            }
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
        if (cleanPass.length < 6 || cleanPass.length > 4096) return { error: 'Password must be between 6 and 4096 characters.' };

        try {
            const auth = this._getFirebaseAuth();
            const idToken = auth && auth.currentUser ? await auth.currentUser.getIdToken() : null;
            if (!idToken) return { error: 'Please sign in again before changing your password.' };

            const response = await fetch('/api/auth-set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ userId, newPassword: cleanPass })
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                return { error: data?.error || (response.status === 404
                    ? 'Password service is unavailable. Restart the local development server.'
                    : `Password change failed (HTTP ${response.status}).`) };
            }
            if (data?.success !== true) return { error: 'Password service returned an invalid response.' };
            AppDB.invalidateCollectionCache('users');
            if (this.currentUser?.id === userId) {
                delete this.currentUser.password;
                this.currentUser.passwordSetupRequired = false;
                this.currentUser.authMigrated = true;
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
            try { await this._releaseDeviceSession(sessionId, localToken); }
            catch (err) { console.warn('Failed to release device session on logout:', err); }
        }
        window.AppActivity?.stopCommandListener?.();
        // Sign out from Firebase Auth
        const auth = this._getFirebaseAuth();
        if (auth) {
            try { await auth.signOut(); } catch { /* ignore */ }
        }
        this.stopHeartbeat();
        this.stopCurrentUserSync();
        this._clearSessionExpiry();
        this.currentUser = null;
        this.localToken = null;
        try {
            localStorage.removeItem(this.sessionKey);
            localStorage.removeItem(this.deviceTokenKey);
        } catch { /* ignore */ }
        window.location.reload();
    }

    async forceLogout(message = 'Your session was ended.') {
        if (this.isForceLoggingOut) return;
        const sessionId = localStorage.getItem(this.sessionKey);
        const tabToken = this.localToken;
        const sharedToken = localStorage.getItem(this.deviceTokenKey);
        if (sessionId && sessionId === String(this.currentUser?.id || sessionId)
            && tabToken && sharedToken && sharedToken !== tabToken) {
            this.isForceLoggingOut = true;
            // A different tab may already have completed a fresh sign-in. Do
            // not let this tab's stale expiry callback sign out shared Firebase
            // Auth or erase the replacement token from browser storage.
            try {
                await new Promise((resolve) => window.setTimeout(resolve, 500));
                const latestSharedToken = localStorage.getItem(this.deviceTokenKey);
                if (latestSharedToken) {
                    // The sign-in may have replaced the token while this
                    // expiry callback waited for the server check.
                    const replacementToken = latestSharedToken;
                    const firestore = window.AppFirestore || AppDB.db;
                    const snapshot = await firestore.collection('users').doc(String(sessionId)).get({ source: 'server' });
                    if (snapshot.exists) {
                        const data = snapshot.data() || {};
                        const sessions = Array.isArray(data.activeSessions)
                            ? data.activeSessions.map(normalizeSession).filter(Boolean)
                            : [];
                        const replacement = sessions.find((item) => item.token === replacementToken);
                        const replacementActive = replacement
                            ? !replacement.logoutAt || replacement.logoutAt > Date.now()
                            : !Array.isArray(data.activeSessions)
                                && (!data.activeSessionToken || data.activeSessionToken === replacementToken);
                        if (replacementActive) {
                            this.localToken = replacementToken;
                            this.isForceLoggingOut = false;
                            return;
                        }
                    }
                }
            } catch (error) {
                console.warn('Skipped stale-tab sign-out because the replacement session could not be checked:', error);
                this.isForceLoggingOut = false;
                return;
            }
        }
        this.isForceLoggingOut = true;
        try {
            sessionStorage.setItem('crwi_auth_notice', message);
        } catch { /* ignore */ }
        const localToken = this.localToken || localStorage.getItem(this.deviceTokenKey);
        if (sessionId && localToken) {
            await this._releaseDeviceSession(sessionId, localToken).catch((err) => {
                console.warn('Failed to release expired device session:', err);
            });
        }
        window.AppActivity?.stopCommandListener?.();
        // Sign out from Firebase Auth
        const auth = this._getFirebaseAuth();
        if (auth) {
            try { auth.signOut(); } catch { /* ignore */ }
        }
        this.stopHeartbeat();
        this.stopCurrentUserSync();
        this._clearSessionExpiry();
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

    async updateUser(userData, privateData = null) {
        const existing = await AppDB.get('users', userData.id);
        if (!existing) return false;

        const privateFields = [
            'baseSalary', 'otherAllowances', 'providentFund', 'professionalTax', 'loanAdvance',
            'tdsPercent', 'bankName', 'bankAccount', 'bankIfsc', 'accountNumber', 'ifsc',
            'pan', 'PAN', 'uan', 'UAN'
        ];
        const safeUserData = { ...userData };
        // Credentials are owned by auth-set-password. Never copy a legacy
        // password or migration flags from a previously loaded staff record.
        ['password', 'passwordSetupRequired', 'authMigrated'].forEach((field) => delete safeUserData[field]);
        const privateUpdate = { ...(privateData || {}) };
        privateFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(safeUserData, field)) {
                privateUpdate[field] = safeUserData[field];
                delete safeUserData[field];
            }
        });
        const updated = { ...existing, ...safeUserData };
        delete updated.password;
        privateFields.forEach((field) => delete updated[field]);

        if (Object.prototype.hasOwnProperty.call(userData, 'isAdmin')) {
            updated.isAdmin = userData.isAdmin === true || userData.isAdmin === 'true';
        }
        updated.role = userData.role || existing.role || 'Employee';

        console.log(`Auth: User ${updated.id} update - Role: ${updated.role}, Admin: ${updated.isAdmin}`);

        if (userData.name && userData.name !== existing.name && !userData.avatar) {
            updated.avatar = `https://ui-avatars.com/api/?name=${userData.name}&background=random&color=fff`;
        }

        const profilePatch = { ...safeUserData, isAdmin: updated.isAdmin, role: updated.role };
        if (updated.avatar !== existing.avatar) profilePatch.avatar = updated.avatar;
        await AppDB.put('users', profilePatch);

        if (this.currentUser?.isAdmin === true) {
            await AppDB.put('user_access', {
                id: userData.id,
                permissions: updated.permissions || {}
            });
        }

        const actor = this.currentUser;
        const canManagePayroll = actor?.permissions?.reports === 'admin';
        if (canManagePayroll && Object.keys(privateUpdate).length > 0) {
            const existingPrivate = await AppDB.get('user_private', userData.id).catch(() => null);
            await AppDB.put('user_private', { ...(existingPrivate || {}), ...privateUpdate, id: userData.id });
        }

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
                    if (!this._validateUserSession(latestUser)) return;

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
