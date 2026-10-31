import morphdom from 'morphdom';

// A navigation invalidates pending work even when the user returns to the same hash.
let navigationVersion = 0;
const requests = new WeakMap();
const dirty = new WeakSet();
// Track the containers actually scrolled instead of reading layout state
// from every descendant whenever background data refreshes a large page.
const scrolledElements = new Set();
let scrollQuietUntil = 0;
const routeKey = () => String(window.location.hash || '#dashboard').replace(/^#/, '') || 'dashboard';
const viewerKey = () => String(window.AppAuth?.getUser?.()?.id || '');
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('hashchange', () => { navigationVersion++; scrolledElements.clear(); });
if (typeof document !== 'undefined') {
    const deferWhileScrolling = () => { scrollQuietUntil = Date.now() + 150; };
    document.addEventListener('wheel', deferWhileScrolling, { capture: true, passive: true });
    document.addEventListener('touchmove', deferWhileScrolling, { capture: true, passive: true });
    document.addEventListener('keydown', event => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
            && !event.target?.matches?.('input,textarea,select,[contenteditable="true"]')) deferWhileScrolling();
    });
    document.addEventListener('scroll', event => {
        if (event.target?.nodeType === 1) scrolledElements.add(event.target);
    }, { capture: true, passive: true });
    const remember = event => { if (event.target?.matches?.('input,textarea,select,[contenteditable="true"]')) dirty.add(event.target); };
    document.addEventListener('input', remember);
    document.addEventListener('change', remember);
    document.addEventListener('reset', event => {
        event.target.querySelectorAll('input,textarea,select,[contenteditable="true"]').forEach(el => dirty.delete(el));
    });
}

export function beginPageUpdate(root = document.getElementById('page-content')) {
    if (!root) return null;
    const version = (requests.get(root) || 0) + 1;
    requests.set(root, version);
    const route = routeKey(), viewer = viewerKey(), navigation = navigationVersion;
    return { root, route, current: () => root.isConnected && requests.get(root) === version && routeKey() === route && viewerKey() === viewer && navigationVersion === navigation };
}

function nodeKey(node) {
    if (node.nodeType !== 1) return undefined;
    // getAttribute also works on forms containing an input named "id".
    const id = node.getAttribute('id');
    if (id) return 'id:' + id;
    const card = node.getAttribute('data-admin-card');
    if (card) return 'admin:' + card;
    const plan = node.getAttribute('data-plan-id'), index = node.getAttribute('data-task-index');
    if (plan && index !== null && node.tagName === 'TR') return `task:${plan}:${index}`;
    return undefined;
}

function preserveLocalState(from, to) {
    if (from.matches('input,textarea,select,[contenteditable="true"]') &&
        (dirty.has(from) || from === document.activeElement)) return false;
    if (from.tagName === 'DETAILS') to.open = from.open;
    // Runtime presentation controls are independent of the latest server data.
    for (const name of ['data-dashboard-card-id', 'data-dashboard-card-mode', 'data-dashboard-original-full-width']) {
        if (from.hasAttribute(name)) to.setAttribute(name, from.getAttribute(name));
    }
    const localClasses = [...from.classList].filter(name => /^(dashboard-card-(compact|mode-|has-controls)|is-action-open$)/.test(name));
    if (localClasses.length) to.classList.add(...localClasses);
    if (from.matches('[data-admin-card]')) {
        const mode = from.dataset.adminCardMode || 'collapsed';
        to.dataset.adminCardMode = mode;
        to.classList.remove('admin-card-mode-collapsed', 'admin-card-mode-tile', 'admin-card-mode-original');
        to.classList.add(...[...from.classList].filter(name => name.startsWith('admin-card-mode-')));
        to.setAttribute('aria-expanded', String(mode !== 'collapsed'));
        const header = to.querySelector('.admin-card-header-row');
        header?.setAttribute('aria-expanded', String(mode !== 'collapsed'));
    }
    if (from.matches('canvas')) return false; // Keep chart instances attached.
    if (from.isEqualNode(to)) return false;
    return true;
}

export function patchContent(root, html) {
    if (!root || typeof html !== 'string') return;
    const target = root.cloneNode(false);
    target.innerHTML = html;
    const viewport = { left: window.scrollX, top: window.scrollY };
    const active = document.activeElement;
    const scroll = [];
    for (const el of new Set([root, ...scrolledElements])) {
        if (!el.isConnected) { scrolledElements.delete(el); continue; }
        if (el !== root && !root.contains(el)) continue;
        const top = el.scrollTop, left = el.scrollLeft;
        if (top || left) scroll.push([el, top, left]);
    }
    morphdom(root, target, {
        childrenOnly: true, getNodeKey: nodeKey, onBeforeElUpdated: preserveLocalState,
        onBeforeNodeDiscarded: node => !node.matches?.('.dashboard-card-mode-controls')
    });
    for (const [el, top, left] of scroll) if (el.isConnected) {
        if (el.scrollTop !== top) el.scrollTop = top;
        if (el.scrollLeft !== left) el.scrollLeft = left;
    }
    if (active?.isConnected && document.activeElement !== active && active !== document.body) active.focus({ preventScroll: true });
    if (window.scrollX !== viewport.left || window.scrollY !== viewport.top) window.scrollTo({ ...viewport, behavior: 'instant' });
}

export async function refreshPage(render, { root = document.getElementById('page-content'), route, token, navigation = false, after } = {}) {
    if (!root || route && routeKey() !== route) return false;
    const request = token || beginPageUpdate(root);
    if (!request?.current()) return false;
    const html = await render();
    if (!request.current()) return false;
    // Network work can finish during a wheel gesture. Commit the expensive
    // DOM update once scrolling pauses, rather than interrupting that gesture.
    if (!navigation) {
        while (request.current() && Date.now() < scrollQuietUntil) {
            await new Promise(resolve => setTimeout(resolve, Math.min(150, scrollQuietUntil - Date.now())));
        }
        if (!request.current()) return false;
    }
    if (navigation) root.innerHTML = html;
    else patchContent(root, html);
    if (after) await after();
    return true;
}
