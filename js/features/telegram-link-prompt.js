const SETTING_ID = 'telegram_link_prompt';
const PROMPT_STYLE_ID = 'telegram-link-prompt-style';
const SESSION_KEY_PREFIX = 'crwi_telegram_link_prompt_seen:';
let promptSettingPromise = null;
const promptedUserIds = new Set();

function isAdmin(user) {
    return user?.isAdmin === true
        || String(user?.role || '').toLowerCase() === 'administrator'
        || window.app_isAdminUser?.(user) === true;
}

function isStaffAccount(user) {
    return Boolean(user?.id)
        && user.status !== 'archived'
        && user.isAdmin !== true
        && String(user.role || '').toLowerCase() !== 'administrator';
}

function readSetting(force = false) {
    if (force || !promptSettingPromise) {
        promptSettingPromise = window.AppDB?.get?.('settings', SETTING_ID)
            .then((setting) => ({ enabled: setting?.enabled !== false }))
            .catch((error) => {
                console.warn('[TelegramLinkPrompt] Could not read prompt setting:', error);
                return { enabled: true };
            });
    }
    return promptSettingPromise;
}

function ensureStyles() {
    if (document.getElementById(PROMPT_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = PROMPT_STYLE_ID;
    style.textContent = `
        .telegram-link-prompt-backdrop{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:1rem;background:rgba(20,32,52,.54);backdrop-filter:blur(5px);opacity:0;transition:opacity .2s ease}
        .telegram-link-prompt-backdrop.is-visible{opacity:1}
        .telegram-link-prompt-dialog{position:relative;width:min(100%,480px);overflow:hidden;border:1px solid rgba(255,255,255,.75);border-radius:22px;background:#fff;color:#172338;box-shadow:0 24px 80px rgba(12,25,48,.28);transform:translateY(10px) scale(.985);transition:transform .2s ease;font-family:inherit}
        .telegram-link-prompt-backdrop.is-visible .telegram-link-prompt-dialog{transform:translateY(0) scale(1)}
        .telegram-link-prompt-top{padding:1.7rem 1.8rem 1.25rem;background:linear-gradient(135deg,#f0f7ff,#fff 75%)}
        .telegram-link-prompt-icon{display:grid;place-items:center;width:52px;height:52px;margin-bottom:1rem;border-radius:16px;background:#e3f2ff;color:#168ac2;font-size:1.6rem}
        .telegram-link-prompt-eyebrow{margin:0 0 .35rem;color:#687b96;font-size:.7rem;font-weight:800;letter-spacing:.12em}
        .telegram-link-prompt-dialog h2{margin:0;color:#19283d;font-size:1.4rem;line-height:1.25}
        .telegram-link-prompt-dialog p{margin:.65rem 0 0;color:#62718a;font-size:.93rem;line-height:1.55}
        .telegram-link-prompt-benefits{display:grid;gap:.6rem;margin:0;padding:0 1.8rem 1.35rem;list-style:none;color:#34445d;font-size:.88rem}
        .telegram-link-prompt-benefits li{display:flex;gap:.65rem;align-items:flex-start}
        .telegram-link-prompt-benefits i{margin-top:.2rem;color:#168ac2}
        .telegram-link-prompt-actions{display:flex;gap:.7rem;justify-content:flex-end;padding:1rem 1.8rem 1.5rem;border-top:1px solid #edf1f6}
        .telegram-link-prompt-actions button{min-height:42px;padding:.65rem 1rem;border-radius:11px;font:inherit;font-size:.86rem;font-weight:700;cursor:pointer}
        .telegram-link-prompt-later{border:1px solid #dce4ee;background:#fff;color:#54647a}
        .telegram-link-prompt-connect{border:1px solid #168ac2;background:#168ac2;color:#fff;box-shadow:0 5px 14px rgba(22,138,194,.2)}
        .telegram-link-prompt-close{position:absolute;top:1rem;right:1rem;width:34px;height:34px;border:1px solid #e3e9f0;border-radius:50%;background:#fff;color:#607089;font-size:1.15rem;cursor:pointer}
        [data-theme="dark"] .telegram-link-prompt-dialog{border-color:#344355;background:#1a2635;color:#e7edf4}
        [data-theme="dark"] .telegram-link-prompt-top{background:linear-gradient(135deg,#1e3046,#1a2635 75%)}
        [data-theme="dark"] .telegram-link-prompt-icon{background:#253650;color:#9bc9e3}
        [data-theme="dark"] .telegram-link-prompt-eyebrow,[data-theme="dark"] .telegram-link-prompt-dialog p{color:#b2bfce}
        [data-theme="dark"] .telegram-link-prompt-dialog h2{color:#e7edf4}
        [data-theme="dark"] .telegram-link-prompt-benefits{color:#d5deea}
        [data-theme="dark"] .telegram-link-prompt-actions{border-color:#344355}
        [data-theme="dark"] .telegram-link-prompt-later,[data-theme="dark"] .telegram-link-prompt-close{border-color:#46596e;background:#202e3e;color:#d5deea}
        @media(max-width:480px){.telegram-link-prompt-top{padding:1.4rem 1.25rem 1rem}.telegram-link-prompt-benefits{padding:0 1.25rem 1.2rem}.telegram-link-prompt-actions{padding:1rem 1.25rem 1.25rem}.telegram-link-prompt-actions button{flex:1}}
        @media(prefers-reduced-motion:reduce){.telegram-link-prompt-backdrop,.telegram-link-prompt-dialog{transition:none}}
    `;
    document.head.appendChild(style);
}

function closePrompt() {
    const overlay = document.getElementById('telegram-link-prompt');
    if (!overlay) return;
    if (overlay.dataset.previousBodyOverflow !== undefined) document.body.style.overflow = overlay.dataset.previousBodyOverflow;
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 200);
}

function showPrompt({ preview = false } = {}) {
    if (document.getElementById('telegram-link-prompt')) return;
    ensureStyles();
    const overlay = document.createElement('div');
    overlay.id = 'telegram-link-prompt';
    overlay.className = 'telegram-link-prompt-backdrop';
    overlay.innerHTML = `
        <section class="telegram-link-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="telegram-link-prompt-title">
            <button type="button" class="telegram-link-prompt-close" aria-label="Close">×</button>
            <div class="telegram-link-prompt-top">
                <span class="telegram-link-prompt-icon"><i class="fa-brands fa-telegram" aria-hidden="true"></i></span>
                <div class="telegram-link-prompt-eyebrow">PERSONAL ATTENDANCE REMINDERS</div>
                <h2 id="telegram-link-prompt-title">Connect your Telegram</h2>
                <p>Linking Telegram lets the attendance app remind you privately when an attendance step may have been missed.</p>
            </div>
            <ul class="telegram-link-prompt-benefits">
                <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>Get a personal reminder if you have not checked in by 9:15am.</span></li>
                <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>Get checkout reminders at 6pm and a final follow-up at 8pm if you are still checked in.</span></li>
            </ul>
            <div class="telegram-link-prompt-actions">
                <button type="button" class="telegram-link-prompt-later">${preview ? 'Close preview' : 'Maybe later'}</button>
                ${preview ? '' : '<button type="button" class="telegram-link-prompt-connect"><i class="fa-brands fa-telegram" aria-hidden="true"></i> Connect Telegram</button>'}
            </div>
        </section>`;
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay || event.target.closest('.telegram-link-prompt-close, .telegram-link-prompt-later')) {
            closePrompt();
            return;
        }
        if (event.target.closest('.telegram-link-prompt-connect')) {
            closePrompt();
            window.setTimeout(() => window.app_linkTelegram?.(), 210);
        }
    });
    overlay.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePrompt();
    });
    overlay.dataset.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    (overlay.querySelector('.telegram-link-prompt-connect') || overlay.querySelector('.telegram-link-prompt-later'))?.focus();
}

window.app_checkTelegramLinkPrompt = async (trigger = 'login') => {
    if (trigger !== 'login') return;
    const user = window.AppAuth?.getUser?.();
    if (!isStaffAccount(user) || isAdmin(user) || String(user.telegramChatId || '').trim()) return;
    const userId = String(user.id);
    if (promptedUserIds.has(userId)) return;
    const key = `${SESSION_KEY_PREFIX}${userId}`;
    try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
    } catch { /* The in-memory guard below still prevents route-change repeats. */ }
    promptedUserIds.add(userId);
    const setting = await readSetting();
    if (!setting.enabled || String(window.AppAuth?.getUser?.()?.telegramChatId || '').trim()) return;
    // Let other login popups finish before presenting this reminder.
    let attempts = 0;
    const present = () => {
        const otherDialog = document.querySelector('#missed-task-prompt, .modal-overlay:not(#telegram-link-modal), #system-dialog');
        if (otherDialog && attempts++ < 20) {
            window.setTimeout(present, 500);
            return;
        }
        if (!document.getElementById('telegram-link-modal')) showPrompt();
    };
    window.setTimeout(present, 300);
};

window.app_openTelegramLinkPromptPreview = () => showPrompt({ preview: true });
window.app_saveTelegramLinkPromptSetting = async (enabled) => {
    if (!window.app_hasPerm?.('users', 'admin')) throw new Error('You do not have permission to change this setting.');
    const user = window.AppAuth?.getUser?.();
    await window.AppDB.put('settings', {
        id: SETTING_ID,
        enabled: Boolean(enabled),
        updatedAt: Date.now(),
        updatedBy: String(user?.id || '')
    });
    promptSettingPromise = Promise.resolve({ enabled: Boolean(enabled) });
    await window.app_refreshAdminPage?.({ preserveCardId: 'telegram-link-control' });
};

window.app_getTelegramLinkPromptSetting = () => readSetting(true);
