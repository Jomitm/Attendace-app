// js/modules/ai-chat-memory.js
// Session conversation memory for the CRWI Assistant — shared by the AI Center
// page and the floating assistant, so a conversation started in one continues
// in the other. Stored in sessionStorage (survives reloads in the same tab,
// cleared when the tab closes or the user logs out).

const STORAGE_PREFIX = 'crwi_ai_chat_';
const MAX_EXCHANGES = 12;          // keep the last N question/answer pairs
const MAX_TEXT_LENGTH = 500;       // trim each side of an exchange

function _key() {
    const user = window.AppAuth?.getUser?.();
    const id = user?.id || 'anon';
    return `${STORAGE_PREFIX}${id}`;
}

function _trim(text) {
    const s = String(text || '');
    return s.length > MAX_TEXT_LENGTH ? s.slice(0, MAX_TEXT_LENGTH) : s;
}

function _load() {
    try {
        const raw = sessionStorage.getItem(_key());
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function _save(history) {
    try {
        sessionStorage.setItem(_key(), JSON.stringify(history.slice(-MAX_EXCHANGES * 2)));
    } catch { /* storage full or unavailable — memory just stays in-page */ }
}

export function getHistory() {
    return _load().map(x => ({ role: x.role, content: x.content }));
}

/** Record one question/answer pair. Returns the updated history. */
export function addExchange(question, answer) {
    const history = _load();
    history.push({ role: 'user', content: _trim(question) });
    if (answer) history.push({ role: 'assistant', content: _trim(answer) });
    _save(history);
    return getHistory();
}

/** Clear this user's chat memory (used by the "Clear chat" button and logout). */
export function clearChat() {
    try { sessionStorage.removeItem(_key()); } catch {}
}

/**
 * Sanitize a history array for sending to the server:
 * only 'user'/'assistant' roles, string contents, hard caps on size.
 */
export function sanitizeForServer(history, maxExchanges = MAX_EXCHANGES) {
    if (!Array.isArray(history)) return [];
    const out = [];
    for (const m of history) {
        if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
        const content = _trim(m.content);
        if (!content) continue;
        out.push({ role: m.role, content });
    }
    return out.slice(-maxExchanges * 2);
}

// Also register logout cleanup
if (typeof window !== 'undefined') {
    const _origLogout = window.AppAuth?.logout?.bind(window.AppAuth);
    if (_origLogout && !window.AppAuth.__chatMemoryHooked) {
        window.AppAuth.__chatMemoryHooked = true;
        window.AppAuth.logout = async (...args) => {
            clearChat();
            return _origLogout(...args);
        };
    }
}
