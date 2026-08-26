/**
 * Date formatting helpers used across the app.
 */

/**
 * Return a local YYYY-MM-DD string for a date (default now).
 * Mirrors the legacy `getLocalISO` helper previously in app.js.
 */
export function getLocalISO(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Coerce any supported timestamp representation into epoch milliseconds.
 * Accepts: number | numeric string | Date | Firestore Timestamp ({ toMillis }) |
 * parseable date string. Returns null for missing/invalid values instead of NaN,
 * so callers can branch on "unknown" rather than producing garbage keys.
 */
export function coerceEpochMs(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d+$/.test(trimmed)) {
            const n = Number(trimmed);
            return Number.isFinite(n) ? n : null;
        }
        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
    if (typeof value === 'object' && typeof value.toMillis === 'function') {
        try {
            const ms = value.toMillis();
            return Number.isFinite(ms) ? ms : null;
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Normalize a value into a local YYYY-MM-DD key.
 * - Already-normalized YYYY-MM-DD strings pass through untouched.
 * - Dates/timestamps/epoch values are formatted using LOCAL calendar parts
 *   (deliberately NOT toISOString(), which renders UTC and shifts the day
 *   for positive UTC offsets).
 * Returns '' when the value is missing or unparseable.
 */
export function toDateKeyFromValue(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const ms = coerceEpochMs(value);
    if (ms === null) return '';
    return getLocalISO(new Date(ms));
}

if (typeof window !== 'undefined') {
    window.app_getLocalISO = getLocalISO;
}
