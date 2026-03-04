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

// For backward compatibility with legacy global calls
if (typeof window !== 'undefined') {
    window.safeHtml = safeHtml;
    window.safeAttr = safeAttr;
    window.safeJsStr = safeJsStr;
    window.safeUrl = safeUrl;
    window.timeAgo = timeAgo;
}
