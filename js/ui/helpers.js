/**
 * UI Helper Functions
 * Provides common utilities for safe HTML rendering and date formatting.
 */

export function safeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function safeAttr(value) {
    return safeHtml(value);
}

export function safeJsStr(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

export function safeUrl(value, fallback = 'https://via.placeholder.com/24') {
    if (!value || typeof value !== 'string') return fallback;
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('/') || value.startsWith('./')) {
        return value;
    }
    return fallback;
}

/**
 * POST and stream the response body as text deltas. Falls back to a single
 * final chunk when the server doesn't stream. Returns { text, source } —
 * source is 'rule-based' when the server had no AI provider available
 * (X-AI-Source header), 'ai' otherwise. Pass onDelta callback before await;
 * it fires per chunk.
 */
export async function postStream(url, body, { onDelta, token } = {}) {
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        if (res.status === 429) {
            // Daily question limit — carry the server's message to the caller.
            try { err.body = await res.json(); } catch { /* keep default notice */ }
        }
        throw err;
    }
    const source = res.headers && typeof res.headers.get === 'function'
        && res.headers.get('X-AI-Source') === 'rule-based' ? 'rule-based' : 'ai';
    if (!res.body || !res.body.getReader) {
        const text = await res.text();
        if (onDelta) onDelta(text);
        return { text, source };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        if (onDelta) onDelta(chunk, full);
    }
    return { text: full, source };
}

/**
 * HTML notice for a 429 daily-limit response from /api/ai-insights.
 * Uses the server message when present (it carries the configured limit and
 * UTC reset date), otherwise a generic fallback.
 */
export function quotaNoticeHtml(err) {
    const msg = (err && err.body && err.body.message)
        || 'Daily question limit reached — resets at midnight UTC. Local answers still work meanwhile.';
    return `<span style="color:#b45309;font-weight:600;">${safeHtml(msg)}</span>`;
}

export function timeAgo(isoOrDate) {
    if (!isoOrDate) return 'Never';
    const date = new Date(isoOrDate);
    if (isNaN(date.getTime())) return 'Unknown';

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
}

/**
 * Format an AI insight (Fact / Observation / Prediction / Recommendation) into
 * styled HTML. Handles "### Heading" labels, **bold** and "- " bullets.
 * Input is escaped first, so the AI text can never inject HTML.
 */
export function formatLabeledInsight(text) {
    if (!text) return '';
    const LABELS = ['Fact', 'Observation', 'Prediction', 'Recommendation'];
    let html = safeHtml(text);
    for (const label of LABELS) {
        html = html.replace(new RegExp(`###\\s*${label}`, 'g'), `<h3 style="font-size:13px;font-weight:800;margin:12px 0 6px;color:#0f172a;">${label}</h3>`);
        html = html.replace(new RegExp(`(?:^|\\n)\\s*${label}:`, 'g'), `\n<strong>${label}:</strong>`);
    }
    // **bold**
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    // "- " bullets at line start
    html = html.replace(/(?:^|\n)\s*-\s+/g, '\n&bull; ');
    // newlines → <br> (except right after our own block tags)
    html = html.replace(/\n/g, '<br>');
    return html;
}

/**
 * One-click gate shown in place of the personal check (evidence cards) on
 * both the float panel and the AI Center. The full check is only fetched and
 * rendered after the user clicks the question button (wired via [data-pc-run]).
 */
export function pcGateHtml() {
    return `<div class="ai-pc-gate">
        <button type="button" class="ai-pc-gate__btn" data-pc-run><i class="fa-solid fa-wand-magic-sparkles"></i> What did I miss today?</button>
        <div class="ai-pc-gate__hint">One click — I'll check your attendance, today's plan and overdue work.</div>
    </div>`;
}

/**
 * FAB notification badge visibility. `seen` is the watermark acknowledged by
 * opening the assistant: the badge shows only while the issue count is above
 * it — so opening clears the badge, and it re-arms only when NEW issues push
 * the count past what was already seen.
 */
export function shouldShowFabBadge(count, seen) {
    return Number(count) > 0 && Number(count) > Number(seen || 0);
}

// For backward compatibility with legacy global calls
if (typeof window !== 'undefined') {
    window.safeHtml = safeHtml;
    window.safeAttr = safeAttr;
    window.safeJsStr = safeJsStr;
    window.safeUrl = safeUrl;
    window.timeAgo = timeAgo;
}
