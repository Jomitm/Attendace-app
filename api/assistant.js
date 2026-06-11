const {
    FALLBACK_MESSAGE,
    buildFallbackResponse,
    buildRequestScope,
    callOpenRouter,
    createRequestId,
    readJsonBody,
    sanitizeRecursive,
    summarizeAuditInput,
    summarizeAuditOutput,
    trimTo,
    validateResponseShape,
    nowIso
} = require('./_assistant-common.js');

function json(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

function isSameOrigin(req) {
    const origin = String(req.headers.origin || '').trim();
    const referer = String(req.headers.referer || '').trim();
    const host = String(req.headers.host || '').trim();

    if (!origin && !referer) return true;
    const candidates = [origin, referer].filter(Boolean);
    return candidates.some((value) => {
        try {
            const parsed = new URL(value);
            return parsed.host === host;
        } catch {
            return false;
        }
    });
}

function hasOpenRouterKey() {
    return !!String(process.env.OPENROUTER_API_KEY || '').trim();
}

function canAccessMode(mode, user = {}) {
    const role = String(user.role || '').toLowerCase();
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || role === 'administrator';
    if (mode === 'admin-report') return isAdmin;
    return true;
}

function sanitizeError(err) {
    return trimTo(err?.message || 'AI assistant request failed', 240);
}

async function handler(req, res) {
    if (req.method === 'GET') {
        return json(res, 200, {
            ok: true,
            route: '/ai/assistant',
            backendRoute: '/api/assistant',
            configured: hasOpenRouterKey(),
            modes: ['staff-plan', 'admin-report'],
            defaultModel: String(process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim()
        });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return json(res, 405, { ok: false, error: 'Method not allowed' });
    }

    if (!isSameOrigin(req)) {
        return json(res, 403, { ok: false, error: 'Forbidden' });
    }

    let body;
    try {
        body = await readJsonBody(req);
    } catch (err) {
        return json(res, err.statusCode || 400, {
            ok: false,
            error: sanitizeError(err)
        });
    }

    const mode = String(body?.mode || '').trim();
    if (!['staff-plan', 'admin-report'].includes(mode)) {
        return json(res, 400, { ok: false, error: 'Invalid assistant mode' });
    }

    const requestId = String(body?.requestId || createRequestId()).trim();
    const user = sanitizeRecursive(body?.user || {});
    const context = buildRequestScope(mode, body);

    if (!canAccessMode(mode, user)) {
        return json(res, 403, {
            ok: false,
            error: 'Not authorized for this assistant mode',
            requestId,
            fallbackMessage: FALLBACK_MESSAGE
        });
    }

    const auditInput = summarizeAuditInput(mode, { ...body, requestId, user }, context);
    console.info('[ai-assistant:request]', JSON.stringify(auditInput));

    if (!hasOpenRouterKey()) {
        const fallback = buildFallbackResponse(mode, context.sourceScope, 'openrouter_api_key_missing');
        fallback.audit = {
            ...fallback.audit,
            requestId,
            loggedAt: nowIso()
        };
        console.info('[ai-assistant:fallback]', JSON.stringify({
            requestId,
            mode,
            reason: 'openrouter_api_key_missing',
            sourceScope: context.sourceScope
        }));
        return json(res, 200, fallback);
    }

    try {
        const result = await callOpenRouter({ mode, context, requestId });
        const response = {
            ...result,
            ok: true,
            audit: {
                requestId,
                loggedAt: nowIso(),
                model: String(process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim(),
                mode
            }
        };

        const validation = validateResponseShape(mode, response);
        if (!validation.valid) {
            const fallback = buildFallbackResponse(mode, context.sourceScope, validation.reason);
            fallback.audit = {
                ...fallback.audit,
                requestId,
                loggedAt: nowIso()
            };
            console.info('[ai-assistant:fallback]', JSON.stringify({
                requestId,
                mode,
                reason: validation.reason,
                sourceScope: context.sourceScope
            }));
            return json(res, 200, fallback);
        }

        const auditOutput = summarizeAuditOutput(mode, validation.value);
        console.info('[ai-assistant:response]', JSON.stringify({
            requestId,
            loggedAt: nowIso(),
            ...auditOutput
        }));

        return json(res, 200, {
            ...validation.value,
            audit: response.audit
        });
    } catch (err) {
        const reason = sanitizeError(err);
        const fallback = buildFallbackResponse(mode, context.sourceScope, reason);
        fallback.audit = {
            ...fallback.audit,
            requestId,
            loggedAt: nowIso()
        };
        console.warn('[ai-assistant:error]', JSON.stringify({
            requestId,
            mode,
            error: reason,
            sourceScope: context.sourceScope
        }));
        return json(res, 200, fallback);
    }
}

module.exports = handler;
