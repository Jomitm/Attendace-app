import { safeHtml } from './helpers.js';

const SITE_ANNOUNCEMENT_COLLECTION = 'settings';
const SITE_ANNOUNCEMENT_DOC_ID = 'site_announcement';
const SITE_ANNOUNCEMENT_SEEN_KEY = 'app_seen_announcements';

const DEFAULT_ANNOUNCEMENT = Object.freeze({
    id: '',
    title: 'Announcement',
    message: '',
    ctaLabel: 'Open Link',
    ctaUrl: '',
    enabled: false,
    startDate: '',
    endDate: '',
    order: 0,
    version: 1
});

const runtime = {
    started: false,
    unsub: null,
    pollTimer: null,
    loadingPromise: null,
    queue: [],
    activeId: '',
    previewMode: false
};

const getDb = () => window.AppDB || null;

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

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

const isWithinDateRange = (item) => {
    const today = new Date().toISOString().slice(0, 10);
    if (item.startDate && today < item.startDate) return false;
    if (item.endDate && today > item.endDate) return false;
    return true;
};

const normalizeAnnouncement = (item = {}) => {
    const enabled = item.enabled === true || item.enabled === 'true' || item.active === true || item.show === true;
    const title = String(item.title || item.heading || DEFAULT_ANNOUNCEMENT.title).trim() || DEFAULT_ANNOUNCEMENT.title;
    const message = String(item.message || item.body || '').trim();
    const ctaLabel = String(item.ctaLabel || item.buttonLabel || DEFAULT_ANNOUNCEMENT.ctaLabel).trim() || DEFAULT_ANNOUNCEMENT.ctaLabel;
    const ctaUrl = normalizeUrl(item.ctaUrl || item.link || '');
    const version = Math.max(1, Number(item.version || item.revision || 1) || 1);
    const order = Number(item.order || 0);
    const startDate = String(item.startDate || '').slice(0, 10);
    const endDate = String(item.endDate || '').slice(0, 10);
    const id = String(item.id || generateId());

    return {
        id,
        title,
        message,
        ctaLabel,
        ctaUrl,
        enabled,
        startDate,
        endDate,
        order,
        version,
        createdAt: String(item.createdAt || new Date().toISOString()),
        updatedAt: String(item.updatedAt || new Date().toISOString()),
        updatedBy: String(item.updatedBy || '')
    };
};

const normalizeDocument = (doc = {}) => {
    const announcements = Array.isArray(doc.announcements)
        ? doc.announcements.map(normalizeAnnouncement)
        : [];

    const oldEnabled = doc.enabled === true || doc.enabled === 'true' || doc.active === true || doc.show === true;
    const oldTitle = String(doc.title || doc.heading || '').trim();
    const oldMessage = String(doc.message || doc.body || '').trim();
    const oldCtaLabel = String(doc.ctaLabel || doc.buttonLabel || '').trim();
    const oldCtaUrl = normalizeUrl(doc.ctaUrl || doc.link || '');
    const oldVersion = Math.max(1, Number(doc.version || doc.revision || 1) || 1);
    const oldUpdatedAt = String(doc.updatedAt || '');
    const oldUpdatedBy = String(doc.updatedBy || '');

    if (oldTitle || oldMessage || oldEnabled) {
        const alreadyExists = announcements.some(a => a.id === SITE_ANNOUNCEMENT_DOC_ID);
        if (!alreadyExists) {
            announcements.unshift({
                id: SITE_ANNOUNCEMENT_DOC_ID,
                title: oldTitle || DEFAULT_ANNOUNCEMENT.title,
                message: oldMessage,
                ctaLabel: oldCtaLabel || DEFAULT_ANNOUNCEMENT.ctaLabel,
                ctaUrl: oldCtaUrl,
                enabled: oldEnabled,
                startDate: '',
                endDate: '',
                order: 0,
                version: oldVersion,
                createdAt: String(doc.createdAt || new Date().toISOString()),
                updatedAt: oldUpdatedAt || new Date().toISOString(),
                updatedBy: oldUpdatedBy || ''
            });
        }
    }

    announcements.sort((a, b) => (a.order || 0) - (b.order || 0));

    return {
        id: SITE_ANNOUNCEMENT_DOC_ID,
        announcements,
        updatedAt: String(doc.updatedAt || new Date().toISOString()),
        updatedBy: String(doc.updatedBy || ''),
        createdAt: String(doc.createdAt || '')
    };
};

const normalizeSettings = (doc = {}) => {
    const enabled = doc.enabled === true || doc.enabled === 'true' || doc.active === true || doc.show === true;
    const title = String(doc.title || doc.heading || DEFAULT_ANNOUNCEMENT.title).trim() || DEFAULT_ANNOUNCEMENT.title;
    const message = String(doc.message || doc.body || '').trim();
    const ctaLabel = String(doc.ctaLabel || doc.buttonLabel || DEFAULT_ANNOUNCEMENT.ctaLabel).trim() || DEFAULT_ANNOUNCEMENT.ctaLabel;
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

const getSeenMap = () => {
    try {
        return JSON.parse(localStorage.getItem(SITE_ANNOUNCEMENT_SEEN_KEY) || '{}');
    } catch (err) {
        void err;
        return {};
    }
};

const setSeenMap = (map) => {
    try {
        localStorage.setItem(SITE_ANNOUNCEMENT_SEEN_KEY, JSON.stringify(map));
    } catch (err) {
        void err;
    }
};

const isSeen = (id, version) => {
    const seen = getSeenMap();
    return !!seen[`${id}_${version}`];
};

const markSeen = (id, version) => {
    if (!id || !version) return;
    const seen = getSeenMap();
    seen[`${id}_${version}`] = true;
    setSeenMap(seen);
};

const announcementHtml = (text = '') => safeHtml(String(text || '')).replace(/\n/g, '<br>');

const getAnnouncementPreviewMarkup = (settings = DEFAULT_ANNOUNCEMENT) => {
    const row = normalizeAnnouncement(settings);
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

const _readFormValues = (formEl) => {
    if (!formEl) return normalizeAnnouncement(DEFAULT_ANNOUNCEMENT);
    const fd = new FormData(formEl);
    return normalizeAnnouncement({
        enabled: fd.get('enabled') === 'on',
        title: fd.get('title'),
        message: fd.get('message'),
        ctaLabel: fd.get('ctaLabel'),
        ctaUrl: fd.get('ctaUrl')
    });
};

const readAllAnnouncementsFromCards = () => {
    const cards = document.querySelectorAll('.site-announcement-admin-card');
    const items = [];
    cards.forEach((card) => {
        const idx = Number(card.dataset.index || 0);
        const inputs = card.querySelectorAll('input, textarea, select');
        const existing = runtime.queue[idx] || {};
        const item = { id: existing.id || generateId(), createdAt: existing.createdAt || new Date().toISOString() };
        inputs.forEach((input) => {
            const name = input.name;
            if (!name) return;
            const value = input.type === 'checkbox' ? input.checked : input.value;
            item[name] = value;
        });
        items.push(normalizeAnnouncement(item));
    });
    return items;
};

const renderStripContent = (container) => {
    const _now = new Date().toISOString().slice(0, 10);
    const visible = runtime.queue.filter((a) => {
        if (!a.enabled) return false;
        if (!a.message) return false;
        if (!isWithinDateRange(a)) return false;
        if (isSeen(a.id, a.version)) return false;
        return true;
    });

    if (visible.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = '';
    container.innerHTML = visible.map((a) => {
        const bodyHtml = a.message ? announcementHtml(a.message) : '<span style="color:#94a3b8;">No message.</span>';
        const ctaHtml = a.ctaUrl
            ? `<a class="action-btn" href="${safeHtml(a.ctaUrl)}" target="_blank" rel="noopener noreferrer" onclick="window.app_markSiteAnnouncementSeen?.()">${safeHtml(a.ctaLabel || 'Open Link')}</a>`
            : '';

        return `
            <div class="announcement-popout" id="announcement-popout-${safeHtml(a.id)}">
                <div class="announcement-popout-head">
                    <div class="announcement-popout-head-copy">
                        <span class="announcement-popout-kicker">Official notice</span>
                        <h3>${safeHtml(a.title)}</h3>
                    </div>
                    <button type="button" class="announcement-popout-close" onclick="window.app_closeSiteAnnouncement?.('${safeHtml(a.id)}', ${a.version})" aria-label="Close announcement">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="announcement-popout-body">
                    ${bodyHtml}
                </div>
                <div class="announcement-popout-foot">
                    <div class="announcement-popout-meta">
                        <span>Version ${safeHtml(String(a.version || 1))}</span>
                        ${a.updatedAt ? `<span>${safeHtml(a.updatedAt)}</span>` : ''}
                    </div>
                    <div class="announcement-popout-actions">
                        ${ctaHtml}
                        <button type="button" class="action-btn secondary" onclick="window.app_markSiteAnnouncementSeen?.(); window.app_closeSiteAnnouncement?.('${safeHtml(a.id)}', ${a.version})">Close</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

const renderStrip = () => {
    const container = document.getElementById('dashboard-announcement-strip');
    if (!container) {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) { requestAnimationFrame(renderStrip); return; }
        const strip = document.createElement('div');
        strip.id = 'dashboard-announcement-strip';
        pageContent.insertBefore(strip, pageContent.firstChild);
        renderStripContent(strip);
        return;
    }
    renderStripContent(container);
};

const ensureStrip = () => {
    renderStrip();
};

const renderAdminBody = (settings = DEFAULT_ANNOUNCEMENT) => {
    const queue = runtime.queue.length > 0 ? runtime.queue : [normalizeAnnouncement(settings)];
    const liveBadge = queue.some((a) => a.enabled)
        ? '<span class="site-announcement-status is-live"><i class="fa-solid fa-bullhorn"></i> Visible to everyone</span>'
        : '<span class="site-announcement-status is-draft"><i class="fa-regular fa-eye-slash"></i> Hidden from users</span>';

    return `
        <div class="site-announcement-panel">
            <div class="site-announcement-panel-head">
                <div>
                    <span class="site-announcement-kicker">Site-wide announcements</span>
                    <p class="site-announcement-copy">
                        Add, edit, and manage announcements that appear as pop-ups on the dashboard. Each announcement shows to users once and disappears until you update it.
                    </p>
                </div>
                ${liveBadge}
            </div>

            <div class="site-announcement-layout">
                <form id="site-announcement-form" class="site-announcement-form" onsubmit="window.app_saveSiteAnnouncement?.(event)">
                    <div class="site-announcement-fields">
                        <div id="site-announcement-list">
                            ${queue.map((a, i) => `
                                <div class="site-announcement-admin-card" data-index="${i}">
                                    <div class="site-announcement-admin-card-head">
                                        <span class="site-announcement-admin-card-title">${safeHtml(a.title || 'Announcement')}</span>
                                        <div class="site-announcement-admin-card-actions">
                                            <button type="button" class="action-btn tiny" onclick="window.app_moveAnnouncement?.(${i}, -1)" title="Move up">▲</button>
                                            <button type="button" class="action-btn tiny" onclick="window.app_moveAnnouncement?.(${i}, 1)" title="Move down">▼</button>
                                            <button type="button" class="action-btn tiny danger" onclick="window.app_deleteAnnouncement?.(${i})" title="Delete">✕</button>
                                        </div>
                                    </div>
                                    <div class="site-announcement-admin-card-fields">
                                        <label class="site-announcement-field site-announcement-field-toggle">
                                            <span class="site-announcement-label">Enabled</span>
                                            <span class="site-announcement-switch">
                                                <input type="checkbox" name="enabled" data-field="enabled" ${a.enabled ? 'checked' : ''}>
                                                <span class="site-announcement-switch-track"></span>
                                            </span>
                                        </label>
                                        <label class="site-announcement-field">
                                            <span class="site-announcement-label">Title</span>
                                            <input type="text" name="title" data-field="title" value="${safeHtml(a.title)}" placeholder="New Android build available">
                                        </label>
                                        <label class="site-announcement-field">
                                            <span class="site-announcement-label">Message</span>
                                            <textarea name="message" data-field="message" rows="3" placeholder="Write the announcement staff should see.">${safeHtml(a.message)}</textarea>
                                        </label>
                                        <div class="site-announcement-grid-2">
                                            <label class="site-announcement-field">
                                                <span class="site-announcement-label">Button label</span>
                                                <input type="text" name="ctaLabel" data-field="ctaLabel" value="${safeHtml(a.ctaLabel)}" placeholder="Open Link">
                                            </label>
                                            <label class="site-announcement-field">
                                                <span class="site-announcement-label">Button URL</span>
                                                <input type="url" name="ctaUrl" data-field="ctaUrl" value="${safeHtml(a.ctaUrl)}" placeholder="https://...">
                                            </label>
                                        </div>
                                        <div class="site-announcement-grid-2">
                                            <label class="site-announcement-field">
                                                <span class="site-announcement-label">Start date (YYYY-MM-DD)</span>
                                                <input type="date" name="startDate" data-field="startDate" value="${safeHtml(a.startDate)}">
                                            </label>
                                            <label class="site-announcement-field">
                                                <span class="site-announcement-label">End date (YYYY-MM-DD)</span>
                                                <input type="date" name="endDate" data-field="endDate" value="${safeHtml(a.endDate)}">
                                            </label>
                                        </div>
                                        <label class="site-announcement-field">
                                            <span class="site-announcement-label">Order</span>
                                            <input type="number" name="order" data-field="order" value="${safeHtml(a.order || 0)}" min="0" step="1">
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="action-btn secondary" onclick="window.app_addAnnouncement?.()">
                            <i class="fa-solid fa-plus"></i> Add New Announcement
                        </button>
                    </div>

                    <div class="site-announcement-form-foot">
                        <div class="site-announcement-note">
                            Announcements show once per user until you update them. Leave dates blank for no time limit.
                        </div>
                        <div class="site-announcement-actions">
                            <button type="button" class="action-btn secondary" onclick="window.app_previewSiteAnnouncement?.()">
                                <i class="fa-regular fa-eye"></i> Preview
                            </button>
                            <button type="submit" class="action-btn">
                                <i class="fa-solid fa-save"></i> Save All Announcements
                            </button>
                        </div>
                    </div>
                </form>

                <div class="site-announcement-preview">
                    ${queue.length > 0 ? getAnnouncementPreviewMarkup(queue.find((a) => a.enabled) || queue[0]) : getAnnouncementPreviewMarkup()}
                </div>
            </div>

            <div class="site-announcement-footer">
                <span>${runtime.queue.length} announcement${runtime.queue.length !== 1 ? 's' : ''}</span>
                <span>Updated ${safeHtml(runtime.queue[0]?.updatedAt || '—')}</span>
                <span>By ${safeHtml(runtime.queue[0]?.updatedBy || '—')}</span>
            </div>
        </div>
    `;
};

const fetchSettings = async () => {
    const db = getDb();
    if (!db?.get) {
        runtime.queue = [normalizeAnnouncement(DEFAULT_ANNOUNCEMENT)];
        return runtime.queue;
    }

    try {
        const doc = await db.get(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID).catch(() => null);
        const normalized = normalizeDocument(doc || {});
        runtime.queue = normalized.announcements || [];
    } catch (err) {
        void err;
        runtime.queue = [normalizeAnnouncement(DEFAULT_ANNOUNCEMENT)];
    }

    return runtime.queue;
};

const migrateOldDoc = async (db) => {
    try {
        const doc = await db.get(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID).catch(() => null);
        if (!doc) return false;
        const hasArray = Array.isArray(doc.announcements);
        if (hasArray) return false;

        const normalized = normalizeSettings(doc);
        const newDoc = {
            id: SITE_ANNOUNCEMENT_DOC_ID,
            announcements: [{
                ...normalized,
                id: generateId(),
                startDate: '',
                endDate: '',
                order: 0
            }],
            updatedAt: new Date().toISOString(),
            updatedBy: normalized.updatedBy || 'Admin',
            createdAt: doc.createdAt || new Date().toISOString()
        };
        await db.put(SITE_ANNOUNCEMENT_COLLECTION, newDoc);
        return true;
    } catch (err) {
        void err;
        return false;
    }
};

const saveSettings = async (items = [], currentUser = null) => {
    const db = getDb();
    if (!db?.put) throw new Error('Database is not ready.');

    const normalized = items.map((item) => {
        const norm = normalizeAnnouncement(item);
        return norm;
    });

    if (normalized.some((a) => a.enabled && !a.message)) {
        throw new Error('Announcement message is required when it is enabled.');
    }

    const existing = await db.get(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID).catch(() => null);
    const now = new Date().toISOString();

    const payload = {
        id: SITE_ANNOUNCEMENT_DOC_ID,
        announcements: normalized.map((a) => {
            const existingItem = Array.isArray(existing?.announcements) ? existing.announcements.find((e) => e.id === a.id) : null;
            return {
                ...a,
                createdAt: existingItem?.createdAt || a.createdAt || now,
                updatedAt: now,
                updatedBy: currentUser?.name || currentUser?.displayName || 'Admin',
                version: existingItem ? (existingItem.version || 1) + 1 : (a.version || 1)
            };
        }),
        updatedAt: now,
        updatedBy: currentUser?.name || currentUser?.displayName || 'Admin',
        createdAt: existing?.createdAt || now
    };

    await db.put(SITE_ANNOUNCEMENT_COLLECTION, payload);
    runtime.queue = normalized;
    return runtime.queue;
};

const readPreviewSettings = () => {
    const card = document.querySelector('.site-announcement-admin-card');
    if (!card) return normalizeAnnouncement(DEFAULT_ANNOUNCEMENT);
    const inputs = card.querySelectorAll('input, textarea, select');
    const item = {};
    inputs.forEach((input) => {
        const name = input.name;
        if (!name) return;
        item[name] = input.type === 'checkbox' ? input.checked : input.value;
    });
    return normalizeAnnouncement(item);
};

const updatePreview = () => {
    const previewHost = document.querySelector('.site-announcement-preview');
    if (!previewHost) return;
    const item = runtime.queue.find((a) => a.enabled) || runtime.queue[0] || DEFAULT_ANNOUNCEMENT;
    previewHost.innerHTML = getAnnouncementPreviewMarkup(item);
};

const showFromForm = () => {
    const item = readPreviewSettings();
    const modalId = 'site-announcement-preview-modal';
    if (document.getElementById(modalId)) return;
    window.app_showModal(renderAnnouncementModal(item, { preview: true }), modalId);
};

const renderAnnouncementModal = (settings = DEFAULT_ANNOUNCEMENT, { preview = false } = {}) => {
    const row = normalizeAnnouncement(settings);
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

const openModal = (settings, { preview = false, force = false } = {}) => {
    const row = normalizeAnnouncement(settings || runtime.queue[0] || DEFAULT_ANNOUNCEMENT);
    if (!row.message) return false;
    if (!preview && !force && isSeen(row.id, row.version)) return false;
    const modalId = preview ? 'site-announcement-preview-modal' : 'site-announcement-modal';
    if (document.getElementById(modalId)) return true;

    runtime.activeId = String(row.id || '');
    runtime.previewMode = preview === true;
    if (typeof window.app_showModal === 'function') {
        window.app_showModal(renderAnnouncementModal(row, { preview }), modalId);
    } else {
        (document.getElementById('modal-container') || document.body).insertAdjacentHTML('beforeend', renderAnnouncementModal(row, { preview }));
    }
    return true;
};

const markSeenFromModal = () => {
    if (runtime.activeId && !runtime.previewMode) {
        const item = runtime.queue.find((a) => a.id === runtime.activeId);
        if (item) markSeen(item.id, item.version);
    }
};

const closeAnnouncement = (id, version) => {
    markSeen(id, version);
    const el = document.getElementById(`announcement-popout-${id}`);
    if (el) el.remove();
    const visible = document.querySelectorAll('.announcement-popout').length;
    if (visible === 0) {
        const strip = document.getElementById('dashboard-announcement-strip');
        if (strip) strip.style.display = 'none';
    }
};

const dismiss = (markAsSeen = true) => {
    document.getElementById('site-announcement-modal')?.remove();
    document.getElementById('site-announcement-preview-modal')?.remove();
    if (markAsSeen && runtime.activeId && !runtime.previewMode) {
        const item = runtime.queue.find((a) => a.id === runtime.activeId);
        if (item) markSeen(item.id, item.version);
    }
    runtime.activeId = '';
    runtime.previewMode = false;
};

const addAnnouncement = () => {
    runtime.queue.push(normalizeAnnouncement({
        title: 'New Announcement',
        order: runtime.queue.length,
        enabled: false
    }));
    renderAdminBody();
    ensureStrip();
};

const deleteAnnouncement = (index) => {
    if (!confirm('Delete this announcement?')) return;
    runtime.queue.splice(index, 1);
    runtime.queue.forEach((a, i) => { a.order = i; });
    renderAdminBody();
    ensureStrip();
};

const moveAnnouncement = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= runtime.queue.length) return;
    [runtime.queue[index], runtime.queue[newIndex]] = [runtime.queue[newIndex], runtime.queue[index]];
    runtime.queue.forEach((a, i) => { a.order = i; });
    renderAdminBody();
    ensureStrip();
};

const saveFromEvent = async (event) => {
    event?.preventDefault?.();
    try {
        const items = readAllAnnouncementsFromCards();
        const saved = await saveSettings(items, window.AppAuth?.getUser?.() || null);
        window.app_showSyncToast?.('Announcements saved.');
        runtime.queue = saved;
        renderAdminBody();
        ensureStrip();
        if (typeof window.app_refreshAdminPage === 'function') {
            await window.app_refreshAdminPage({ preserveCardId: 'site-announcement' });
        }
        return saved;
    } catch (err) {
        console.error('Failed to save site announcements:', err);
        alert(`Failed to save announcements: ${err?.message || err}`);
        return null;
    }
};

const start = async () => {
    if (runtime.started) return runtime.queue;
    runtime.started = true;
    const db = getDb();
    if (!db) {
        runtime.queue = [normalizeAnnouncement(DEFAULT_ANNOUNCEMENT)];
        renderStrip();
        return runtime.queue;
    }

    const migrated = await migrateOldDoc(db);
    if (migrated) {
        try {
            const doc = await db.get(SITE_ANNOUNCEMENT_COLLECTION, SITE_ANNOUNCEMENT_DOC_ID).catch(() => null);
            runtime.queue = normalizeDocument(doc || {}).announcements || [];
        } catch {
            runtime.queue = [normalizeAnnouncement(DEFAULT_ANNOUNCEMENT)];
        }
    }

    const handleDoc = (doc) => {
        const normalized = normalizeDocument(doc || {});
        runtime.queue = normalized.announcements || [];
        renderStrip();
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

    renderStrip();
    return runtime.queue;
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
    const row = settings ? normalizeAnnouncement(settings) : readPreviewSettings();
    return openModal(row, { preview: true, force: true });
};

if (typeof window !== 'undefined') {
    window.app_saveSiteAnnouncement = saveFromEvent;
    window.app_previewSiteAnnouncement = showFromForm;
    window.app_updateSiteAnnouncementPreview = updatePreview;
    window.app_dismissSiteAnnouncement = dismiss;
    window.app_markSiteAnnouncementSeen = markSeenFromModal;
    window.app_closeSiteAnnouncement = closeAnnouncement;
    window.app_addAnnouncement = addAnnouncement;
    window.app_deleteAnnouncement = deleteAnnouncement;
    window.app_moveAnnouncement = moveAnnouncement;
    window.AppSiteAnnouncement = {
        getSettings: fetchSettings,
        saveSettings,
        start,
        stop,
        preview,
        dismiss,
        renderAdminBody,
        updatePreview,
        openModal,
        normalizeAnnouncement,
        getSeenMap,
        isSeen
    };
}

export const renderSiteAnnouncement = renderAdminBody;
export { normalizeAnnouncement, isWithinDateRange, getSeenMap, isSeen, markSeen, setSeenMap };

export const SiteAnnouncement = {
    getSettings: fetchSettings,
    saveSettings,
    start,
    stop,
    preview,
    dismiss,
    renderAdminBody,
    updatePreview,
    openModal,
    normalizeAnnouncement,
    getSeenMap,
    isSeen
};

if (typeof window !== 'undefined') {
    window.AppSiteAnnouncement = SiteAnnouncement;
}

export default SiteAnnouncement;