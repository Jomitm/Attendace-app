// api/_perf-snapshot.js
// Pure validation for the personal performance snapshot the client sends to
// ai-insights mode:'performance'. No Firebase or provider imports — the unit
// tests import this directly.
//
// Both consumers assume this shape: the AI prompt stringifies the whole
// snapshot, and generatePerformanceFallback reads dimensions[k].score,
// details.*, and trend[].score. A malformed snapshot must be a 400, not a
// garbage completion or a broken rule-based fallback.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

const isScore = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;

/**
 * @param {*} metrics request body metrics for mode:'performance'
 * @returns {{ok: true, errors: []} | {ok: false, errors: string[]}}
 */
export function validatePerfSnapshot(metrics) {
    const errors = [];

    if (!isPlainObject(metrics)) {
        return { ok: false, errors: ['metrics must be an object'] };
    }

    if (typeof metrics.today !== 'string' || !DATE_RE.test(metrics.today)) {
        errors.push('today must be a YYYY-MM-DD string');
    }

    if (!isScore(metrics.composite)) {
        errors.push('composite must be a number between 0 and 100');
    }

    if (!isPlainObject(metrics.dimensions) || Object.keys(metrics.dimensions).length === 0) {
        errors.push('dimensions must be a non-empty object');
    } else {
        for (const [key, dim] of Object.entries(metrics.dimensions)) {
            if (!isPlainObject(dim) || !isScore(dim.score)) {
                errors.push(`dimensions.${key}.score must be a number between 0 and 100`);
            }
        }
    }

    if (!isPlainObject(metrics.details)) {
        errors.push('details must be an object');
    }

    if (metrics.trend !== undefined && !Array.isArray(metrics.trend)) {
        errors.push('trend must be an array');
    }

    return { ok: errors.length === 0, errors };
}
