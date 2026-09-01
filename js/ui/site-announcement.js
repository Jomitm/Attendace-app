import { safeHtml } from './helpers.js';

const SITE_ANNOUNCEMENT_COLLECTION = 'settings';
const SITE_ANNOUNCEMENT_DOC_ID = 'site_announcement';
const SITE_ANNOUNCEMENT_SEEN_KEY = 'app_seen_site_announcement_version';

const DEFAULT_SETTINGS = Object.freeze({
    id: SITE_ANNOUNCEMENT_DOC_ID,
    enabled: false,
    title: 'Announcement',
    message: '',
    ctaLabel: 'Open Link',
    ctaUrl: '',
    version: 1
});

const runtime = {
    started: false,
    unsub: null,
    pollTimer: null,
    loadingPromise: null,
    latest: { ...DEFAULT_SETTINGS },
    activeVersion: '',
    previewMode: false
};

const getDb = () => window.AppDB || null;

const normalizeUrl = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
        const url = new URL(raw, window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch (err) {
        void err;
        return '';
    }
};

const normalizeSettings = (doc = {}) => {
    const enabled = doc.enabled === true || doc.enabled === 'true' || doc.active === true || doc.show === true;
    const title = String(doc.title || doc.heading || DEFAULT_SETTINGS.title).trim() || DEFAULT_SETTINGS.title;
    const message = String(doc.message || doc.body || '').trim();
    const ctaLabel = String(doc.ctaLabel || doc.buttonLabel || DEFAULT_SETTINGS.ctaLabel).trim() || DEFAULT_SETTINGS.ctaLabel;
    const ctaUrl = normalizeUrl(doc.ctaUrl || doc.link || '');
    const version = Math.max(1, Number(doc.version || doc.revision || 1) || 1);

    return {
        id: SITE_ANNOUNCEMENT_DOC_ID,
        enabled,
        title,
        message,
        ctaLabel,
        ctaUrl,
        version,
        updatedAt: String(doc.updatedAt || ''),
        updatedBy: String(doc.updatedBy || ''),
        createdAt: String(doc.createdAt || '')
    };
};

const getSeenVersion = () => {
    try {
        return String(localStorage.getItem(SITE_ANNOUNCEMENT_SEEN_KEY) || '');
    } catch (err) {
        void err;
        return '';
    }
};

const setSeenVersion = (version) => {
    try {
        localStorage.setItem(SITE_ANNOUNCEMENT_SEEN_KEY, String(version || ''));
    } catch (err) {
        void err;
    }
};

const announcementHtml = (text = '') => safeHtml(String(text || '')).replace(/\n/g, '<br>');

const getAnnouncementPreviewMarkup = (settings = DEFAULT_SETTINGS) => {
    const row = normalizeSettings(settings);
    const bodyHtml = row.message
        ? announcementHtml(row.message)
        : '<span style="color:#94a3b8;">No message has been added yet.</span>';
    const ctaHtml = row.ctaUrl
        ? `<a class="action-btn site-announcement-preview-button" href="${safeHtml(row.ctaUrl)}" target="_blank" rel="noopener noreferrer" onclick="window.app_markSiteAnnouncementSeen?.()">${safeHtml(row.ctaLabel || 'Open Link')}</a>`
        : '';

    return `
        <div class="site-announcement-preview-shell">
            <div class="site-announcement-preview-banner">
                <span class="site-announcement-preview-kicker">Preview</span>
                <span class="site-announcement-preview-status ${row.enabled ? 'is-live' : 'is-draft'}">${row.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div class="site-announcement-preview-copy">
                <div class="site-announcement-preview-title">${safeHtml(row.title)}</div>
                <div class="site-announcement-preview-body">${bodyHtml}</div>
            </div>
            <div class="site-announcement-preview-actions">
                ${ctaHtml}
                <button type="button" class="action-btn secondary site-announcement-preview-close" onclick="window.app_previewSiteAnnouncement?.()">Open Preview</button>
            </div>
            <div class="site-announcement-preview-meta">
                <span>Version ${safeHtml(String(row.version || 1))}</span>
                ${row.updatedAt ? `<span>${safeHtml(row.updatedAt)}</span>` : ''}
            </div>
        </div>
    `;
};

const readFormValues = (formEl) => {
    if (!formEl) return normalizeSettings(DEFAULT_SETTINGS);
    const fd = new FormData(formEl);
    return normalizeSettings({
        enabled: fd.get('enabled') === 'on',
        title: fd.get('title'),
        message: fd.get('message'),
        ctaLabel: fd.get('ctaLabel'),
        ctaUrl: fd.get('ctaUrl')
    });
};

const renderAnnouncementModal = (settings = DEFAULT_SETTINGS, { preview = false } = {}) => {
    const row = normalizeSettings(settings);
    const modalId = preview ? 'site-announcement-preview-modal' : 'site-announcement-modal';
    const bodyHtml = row.message
        ? announcementHtml(row.message)
        : '<span style="color:#94a3b8;">No announcement message is available.</span>';
    const ctaHtml = row.ctaUrl
        ? `<a class="action-btn site-announcement-modal-link" href="${safeHtml(row.ctaUrl)}" target="_blank" rel="noopener noreferrer" onclick="window.app_markSiteAnnouncementSeen?.()">${safeHtml(row.ctaLabel || 'Open Link')}</a>`
        : '';
    const closeAction = preview ? 'window.app_dismissSiteAnnouncement(false)' : 'window.app_dismissSiteAnnouncement()';

    return `
        <div class="modal-overlay site-announcement-overlay" id="${modalId}" style="display:flex;">
            <div class="modal-content site-announcement-modal">
                <div class="site-announcement-modal-head">
                    <div class="site-announcement-modal-head-copy">
                        <span class="site-announcement-modal-kicker">${preview ? 'Admin preview' : 'Official notice'}</span>
                        <h3>${safeHtml(row.title)}</h3>
                    </div>
                    <button type="button" class="site-announcement-modal-close" onclick="${closeAction}" aria-label="Close announcement">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="site-announcement-modal-body">
                    ${bodyHtml}
                </div>
                <div class="site-announcement-modal-foot">
                    <div class="site-announcement-modal-meta">
                        <span>Version ${safeHtml(String(row.version || 1))}</span>
                        ${row.updatedAt ? `<span>${safeHtml(row.updatedAt)}</span>` : ''}
                    </div>
                    <div class="site-announcement-modal-actions">
                        ${ctaHtml}
                        <button type="button" class="action-btn secondary" onclick="${closeAction}">${preview ? 'Close Preview' : 'Close'}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const markSeen = (version) => {
    if (!version) return;
    setSeenVersion(version);
};

const openModal = (settings, { preview = false, force = false } = {}) => {
    const row = normalizeSettings(settings || runtime.latest || DEFAULT_SETTINGS);
    if (!row.message) return false;
    if (!preview && !force && String(row.version || '') === getSeenVersion()) return false;
    const modalId = preview ? 'site-announcement-preview-modal' : 'site-announcement-modal';
    if (document.getElementById(modalId)) return true;

    runtime.activeVersion = String(row.version || '');
    runtime.previewMode = preview === true;
    if (!preview) {
        runtime.latest = row;
    }
    if (typeof window.app_showModal === 'function') {
        window.app_showModal(renderAnnouncementModal(row, { preview }), modalId);
    } else {
        (document.getElementById('modal-container') || document.body).insertAdjacentHTML('beforeend', renderAnnouncementModal(row, { preview }));
    }
    return true;
};

const fetchSettings = async () => {
    const db = getDb();
    if (!db?.get) {
        runtime.latest = normalizeSettings(runtime.latest || DEFAULT_SETTINGS);
        return runtime.latest;
    }
    const doc = await db.get(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID).catch(() => null);
    runtime.latest = normalizeSettings(doc || DEFAULT_SETTINGS);
    return runtime.latest;
};

const saveSettings = async (input = {}, currentUser = null) => {
    const db = getDb();
    if (!db?.put) throw new Error('Database is not ready.');
    const existing = await db.get(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID).catch(() => null);
    const normalizedExisting = normalizeSettings(existing || DEFAULT_SETTINGS);
    const normalizedInput = normalizeSettings(input);
    if (normalizedInput.enabled && !normalizedInput.message) {
        throw new Error('Announcement message is required when the popup is enabled.');
    }
    const changed = [
        normalizedExisting.enabled !== normalizedInput.enabled,
        normalizedExisting.title !== normalizedInput.title,
        normalizedExisting.message !== normalizedInput.message,
        normalizedExisting.ctaLabel !== normalizedInput.ctaLabel,
        normalizedExisting.ctaUrl !== normalizedInput.ctaUrl
    ].some(Boolean);
    const now = new Date().toISOString();
    const nextVersion = changed ? (Number(normalizedExisting.version || 0) + 1) : normalizedExisting.version || 1;
    const payload = {
        id: SITE_ANNOUNCEMENT_DOC_ID,
        enabled: normalizedInput.enabled,
        title: normalizedInput.title,
        message: normalizedInput.message,
        ctaLabel: normalizedInput.ctaLabel,
        ctaUrl: normalizedInput.ctaUrl,
        version: nextVersion,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        updatedBy: currentUser?.name || currentUser?.displayName || 'Admin'
    };
    await db.put(SITE_ANNOUNCEMENT_COLLECTION, payload);
    runtime.latest = normalizeSettings(payload);
    return runtime.latest;
};

const readPreviewSettings = () => {
    const form = document.getElementById('site-announcement-form');
    return readFormValues(form);
};

const renderAdminBody = (settings = DEFAULT_SETTINGS) => {
    const row = normalizeSettings(settings);
    const liveBadge = row.enabled
        ? '<span class="site-announcement-status is-live"><i class="fa-solid fa-bullhorn"></i> Visible to everyone</span>'
        : '<span class="site-announcement-status is-draft"><i class="fa-regular fa-eye-slash"></i> Hidden from users</span>';

    return `
        <div class="site-announcement-panel">
            <div class="site-announcement-panel-head">
                <div>
                    <span class="site-announcement-kicker">Site-wide popup</span>
                    <p class="site-announcement-copy">
                        This appears to every signed-in user when the site opens. Keep the link stable, and replace the target behind it when you ship a new build.
                    </p>
                </div>
                ${liveBadge}
            </div>

            <div class="site-announcement-layout">
                <form id="site-announcement-form" class="site-announcement-form" onsubmit="window.app_saveSiteAnnouncement?.(event)">
                    <div class="site-announcement-fields">
                        <label class="site-announcement-field site-announcement-field-toggle">
                            <span class="site-announcement-label">Enabled</span>
                            <span class="site-announcement-switch">
                                <input type="checkbox" name="enabled" ${row.enabled ? 'checked' : ''}>
                                <span class="site-announcement-switch-track"></span>
                            </span>
                        </label>
                        <label class="site-announcement-field">
                            <span class="site-announcement-label">Title</span>
                            <input type="text" name="title" value="${safeHtml(row.title)}" placeholder="New Android build available">
                        </label>
                        <label class="site-announcement-field">
                            <span class="site-announcement-label">Message</span>
                            <textarea name="message" rows="5" placeholder="Write the announcement staff should see when they open the site.">${safeHtml(row.message)}</textarea>
                        </label>
                        <div class="site-announcement-grid-2">
                            <label class="site-announcement-field">
                                <span class="site-announcement-label">Button label</span>
                                <input type="text" name="ctaLabel" value="${safeHtml(row.ctaLabel)}" placeholder="Open Link">
                            </label>
                            <label class="site-announcement-field">
                                <span class="site-announcement-label">Button URL</span>
                                <input type="url" name="ctaUrl" value="${safeHtml(row.ctaUrl)}" placeholder="https://...">
                            </label>
                        </div>
                    </div>

                    <div class="site-announcement-form-foot">
                        <div class="site-announcement-note">
                            Use a Firebase Hosting path or a redirect page so the link stays stable while the APK changes behind it.
                        </div>
                        <div class="site-announcement-actions">
                            <button type="button" class="action-btn secondary" onclick="window.app_previewSiteAnnouncement?.()">
                                <i class="fa-regular fa-eye"></i> Preview
                            </button>
                            <button type="submit" class="action-btn">
                                <i class="fa-solid fa-save"></i> Save Announcement
                            </button>
                        </div>
                    </div>
                </form>

                <div class="site-announcement-preview">
                    ${getAnnouncementPreviewMarkup(row)}
                </div>
            </div>

            <div class="site-announcement-footer">
                <span>Version <strong>${safeHtml(String(row.version || 1))}</strong></span>
                <span>Updated ${safeHtml(row.updatedAt || '—')}</span>
                <span>By ${safeHtml(row.updatedBy || '—')}</span>
            </div>
        </div>
    `;
};

const start = async () => {
    if (runtime.started) return runtime.latest;
    runtime.started = true;
    const db = getDb();
    if (!db) {
        runtime.latest = normalizeSettings(DEFAULT_SETTINGS);
        return runtime.latest;
    }

    const handleDoc = (doc) => {
        const normalized = normalizeSettings(doc || DEFAULT_SETTINGS);
        runtime.latest = normalized;
        if (normalized.enabled && normalized.message) {
            openModal(normalized, { force: false, preview: false });
        } else {
            dismiss(false);
        }
    };

    if (typeof db.listenDoc === 'function') {
        runtime.unsub = db.listenDoc(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID, (doc) => {
            if (doc) handleDoc(doc);
        });
    } else {
        runtime.pollTimer = setInterval(async () => {
            try {
                const doc = await db.get(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID);
                if (doc) handleDoc(doc);
            } catch (err) {
                void err;
            }
        }, 30000);
    }

    const current = await fetchSettings();
    if (current.enabled && current.message && String(current.version || '') !== getSeenVersion()) {
        openModal(current, { force: true, preview: false });
    } else if (!current.enabled || !current.message) {
        dismiss(false);
    }
    return current;
};

const stop = () => {
    if (typeof runtime.unsub === 'function') {
        runtime.unsub();
    }
    runtime.unsub = null;
    if (runtime.pollTimer) {
        clearInterval(runtime.pollTimer);
        runtime.pollTimer = null;
    }
    runtime.started = false;
};

const preview = async (settings = null, closeExisting = false) => {
    if (closeExisting) {
        document.getElementById('site-announcement-preview-modal')?.remove();
        return true;
    }
    const row = settings ? normalizeSettings(settings) : readPreviewSettings();
    return openModal(row, { preview: true, force: true });
};

const dismiss = (markAsSeen = true) => {
    document.getElementById('site-announcement-modal')?.remove();
    document.getElementById('site-announcement-preview-modal')?.remove();
    if (markAsSeen && runtime.activeVersion && !runtime.previewMode) {
        markSeen(runtime.activeVersion);
    }
    runtime.activeVersion = '';
    runtime.previewMode = false;
};

const saveFromEvent = async (event) => {
    event?.preventDefault?.();
    const form = event?.target || document.getElementById('site-announcement-form');
    const values = readFormValues(form);
    try {
        const saved = await saveSettings(values, window.AppAuth?.getUser?.() || null);
        window.app_showSyncToast?.('Site announcement saved.');
        if (typeof window.app_refreshAdminPage === 'function') {
            await window.app_refreshAdminPage({ preserveCardId: 'site-announcement' });
        }
        return saved;
    } catch (err) {
        console.error('Failed to save site announcement:', err);
        alert(`Failed to save site announcement: ${err?.message || err}`);
        return null;
    }
};

const updatePreview = () => {
    const previewHost = document.querySelector('.site-announcement-preview');
    if (!previewHost) return;
    previewHost.innerHTML = getAnnouncementPreviewMarkup(readPreviewSettings());
};

const showFromForm = () => preview(readPreviewSettings(), false);

const showCurrent = () => openModal(runtime.latest || DEFAULT_SETTINGS, { preview: false, force: true });

if (typeof window !== 'undefined') {
    window.app_saveSiteAnnouncement = saveFromEvent;
    window.app_previewSiteAnnouncement = showFromForm;
    window.app_updateSiteAnnouncementPreview = updatePreview;
    window.app_dismissSiteAnnouncement = dismiss;
    window.app_markSiteAnnouncementSeen = () => {
        if (runtime.activeVersion && !runtime.previewMode) {
            markSeen(runtime.activeVersion);
        }
    };
}

export const SiteAnnouncement = {
    getSettings: fetchSettings,
    saveSettings,
    start,
    stop,
    preview,
    dismiss,
    showCurrent,
    renderAdminBody,
    updatePreview,
    openModal,
    normalizeSettings
};

if (typeof window !== 'undefined') {
    window.AppSiteAnnouncement = SiteAnnouncement;
}

export default SiteAnnouncement;
