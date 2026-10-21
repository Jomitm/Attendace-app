const TELEGRAM_ENDPOINT = '/api/telegram-send';
let lastSentAt = 0;
const THROTTLE_MS = 3000;

async function sendTelegramEvent(payload) {
    try {
        const now = Date.now();
        if (now - lastSentAt < THROTTLE_MS) return;
        lastSentAt = now;
        const auth = window.AppFirebaseAuth;
        const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
        if (!idToken) return;
        await fetch(TELEGRAM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify(payload)
        });
    } catch {
        // Best-effort notification; the underlying attendance or leave action has already completed.
    }
}

export function telegramNotifyCheckIn(_name, _time) {
    void sendTelegramEvent({ event: 'check-in' });
}

export function telegramNotifyLateCheckIn(_name, _time) {
    void sendTelegramEvent({ event: 'check-in' });
}

export function telegramNotifyCheckOut(_name, _time) {
    void sendTelegramEvent({ event: 'check-out' });
}

export function telegramNotifyLeaveUpdate(_name, _status, leaveId) {
    if (leaveId) void sendTelegramEvent({ event: 'leave-update', leaveId: String(leaveId) });
}

export function telegramNotifyTaskTagged(_tagger, _task, details = {}) {
    if (details.targetUserId && details.notificationId && details.planId && Number.isInteger(details.taskIndex)) {
        void sendTelegramEvent({ event: 'task-tagged', ...details });
    }
}

// Arbitrary chat IDs and free-form messages are intentionally not sent from the browser.
export async function sendPersonalTelegram(_chatId, _text) { return false; }
export async function notifyUserById(_userId, _text) { return false; }
export function telegramNotifyTaskAssigned(_assigner, _task, _assigneeChatId) { return false; }

export async function linkTelegramAccount(_chatId) {
    return { ok: false, error: 'Use the secure Telegram link from your profile.' };
}

export function getTelegramLinkUrl() {
    return 'https://t.me/CRWIAttendancebot';
}
