import { AppDB } from './db.js';
import { AppAuth } from './auth.js';
import './ai-context-feeder.js';

const ASSISTANT_ENDPOINT = '/ai/assistant';
const AUDIT_COLLECTION = 'ai_assistant_logs';
const FALLBACK_MESSAGE = 'No AI suggestions available, please draft manually.';

const SENSITIVE_KEY_PATTERN = /(salary|token|secret|password|passcode|api[-_ ]?key|auth|private|ssn|aadhaar|bank|account|pin)/i;

const trimText = (value, maxLen = 240) => {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!maxLen || text.length <= maxLen) return text;
    return `${text.slice(0, Math.max(0, maxLen - 1)).trim()}...`;
};

const normalizeTextValue = (value, maxLen = 240) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return trimText(String(value), maxLen);
    }
    if (Array.isArray(value)) {
        return value
            .map((item) => normalizeTextValue(item, maxLen))
            .filter(Boolean)
            .join(' ');
    }
    if (typeof value === 'object') {
        const candidateKeys = ['text', 'task', 'step', 'title', 'label', 'description', 'summary', 'name'];
        for (const key of candidateKeys) {
            const field = value[key];
            if (typeof field === 'string' && field.trim()) return trimText(field, maxLen);
            if (typeof field === 'number' || typeof field === 'boolean') return trimText(String(field), maxLen);
        }
        return trimText(JSON.stringify(value), maxLen);
    }
    return '';
};

const sanitizeRecursive = (value, depth = 0) => {
    if (value === null || value === undefined) return value;
    if (depth > 4) return '[Depth limited]';
    if (Array.isArray(value)) {
        return value.slice(0, 25).map((item) => sanitizeRecursive(item, depth + 1));
    }
    if (typeof value === 'object') {
        const out = {};
        for (const [key, child] of Object.entries(value)) {
            if (SENSITIVE_KEY_PATTERN.test(key)) continue;
            out[key] = sanitizeRecursive(child, depth + 1);
        }
        return out;
    }
    if (typeof value === 'string') return trimText(value, 400);
    return value;
};

const normalizeArray = (value, limit = 8) => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => normalizeTextValue(item, 180)).filter(Boolean).slice(0, limit);
};

const isLikelyAssistantResponse = (payload, mode) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
    if (!normalizeTextValue(payload.summary || payload.draft?.summary, 1)) return false;
    if (!trimText(payload.sourceScope, 1)) return false;
    const taskSuggestions = Array.isArray(payload.taskSuggestions) ? payload.taskSuggestions : payload.suggestedActions;
    if (!Array.isArray(taskSuggestions)) return false;
    if (!Array.isArray(payload.suggestedActions) && mode !== 'checkout-summary') return false;
    if (!Array.isArray(payload.warnings)) return false;
    if (mode === 'staff-plan') {
        return payload.draft && typeof payload.draft === 'object' && !Array.isArray(payload.draft) && !!trimText(payload.draft.task, 1);
    }
    if (mode === 'checkout-summary') {
        return payload.draft && typeof payload.draft === 'object' && !Array.isArray(payload.draft) && !!trimText(payload.draft.summary || payload.summary, 1);
    }
    return true;
};

const buildFallback = (mode, reason = 'assistant_unavailable', sourceScope = '') => ({
    ok: false,
    mode,
    summary: FALLBACK_MESSAGE,
    suggestedActions: [],
    taskSuggestions: [],
    tomorrowGoal: '',
    warnings: [trimText(reason, 180)],
    sourceScope: trimText(sourceScope || 'unknown', 240),
    draft: mode === 'staff-plan' ? {
        task: '',
        subPlans: [],
        status: '',
        budgetHeadId: '',
        assignedTo: '',
        startDate: '',
        endDate: ''
    } : mode === 'checkout-summary' ? {
        summary: '',
        tomorrowGoal: '',
        taskSuggestions: [],
        budgetHeadId: ''
    } : null,
    audit: {
        fallback: true,
        reason: trimText(reason, 180),
        loggedAt: new Date().toISOString()
    }
});

const safeClone = (value) => {
    try {
        return JSON.parse(JSON.stringify(value ?? null));
    } catch {
        return null;
    }
};

async function logAuditToCollection(entry) {
    if (!AppDB?.put) return;
    const id = trimText(entry?.requestId || `${Date.now()}-${Math.random().toString(16).slice(2)}`, 120);
    const record = {
        id,
        ...sanitizeRecursive(entry),
        createdAt: new Date().toISOString()
    };
    try {
        await AppDB.put(AUDIT_COLLECTION, record, { silentPermissionDenied: true });
    } catch (err) {
        console.warn('AI audit log write failed:', err);
    }
}

async function getStaffMemoryPackForRequest(currentUser, context = {}) {
    const feeder = window.AppAIContextFeeder || null;
    if (!feeder?.getStaffContextPack) return null;
    try {
        const user = currentUser || AppAuth?.getUser?.() || null;
        const staffMemory = await feeder.getStaffContextPack(user, { force: false });
        if (!staffMemory) return null;
        return {
            ...sanitizeRecursive(staffMemory),
            currentPlan: sanitizeRecursive(context?.currentPlan || {}),
            historySummary: sanitizeRecursive(context?.historySummary || {})
        };
    } catch (err) {
        console.warn('AI assistant: failed to load staff memory pack:', err);
        return null;
    }
}

async function requestAssistant({ mode, context = {}, user = null, sourceScope = '', requestId = '' }) {
    const normalizedMode = mode === 'admin-report'
        ? 'admin-report'
        : mode === 'checkout-summary'
            ? 'checkout-summary'
            : 'staff-plan';
    const currentUser = user || AppAuth?.getUser?.() || null;
    const sanitizedContext = sanitizeRecursive(context);
    const staffMemory = (normalizedMode === 'staff-plan' || normalizedMode === 'checkout-summary')
        ? await getStaffMemoryPackForRequest(currentUser, sanitizedContext)
        : null;
    const body = {
        requestId: trimText(requestId || `${Date.now()}-${Math.random().toString(16).slice(2)}`, 120),
        mode: normalizedMode,
        user: sanitizeRecursive({
            id: currentUser?.id || '',
            name: currentUser?.name || '',
            role: currentUser?.role || '',
            isAdmin: currentUser?.isAdmin === true
        }),
        sourceScope: trimText(sourceScope || sanitizedContext?.sourceScope || '', 240),
        context: {
            ...sanitizedContext,
            ...(staffMemory ? { staffMemory } : {})
        }
    };
    let response;
    try {
        response = await fetch(ASSISTANT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });
    } catch {
        const fallback = buildFallback(normalizedMode, 'assistant_fetch_failed', body.sourceScope);
        await logAuditToCollection({
            requestId: body.requestId,
            mode: normalizedMode,
            sourceScope: body.sourceScope,
            status: 'network_error',
            request: safeClone(body),
            response: safeClone(fallback)
        });
        return fallback;
    }

    let parsed = null;
    try {
        parsed = await response.json();
    } catch {
        parsed = null;
    }

    if (!response.ok) {
        const fallback = buildFallback(normalizedMode, parsed?.error || `assistant_http_${response.status}`, body.sourceScope);
        await logAuditToCollection({
            requestId: body.requestId,
            mode: normalizedMode,
            sourceScope: body.sourceScope,
            status: `http_${response.status}`,
            request: safeClone(body),
            response: safeClone(fallback)
        });
        return fallback;
    }

    const payload = parsed && typeof parsed === 'object' ? parsed : null;
    if (!isLikelyAssistantResponse(payload, normalizedMode)) {
        const fallback = buildFallback(normalizedMode, 'malformed_assistant_response', body.sourceScope);
        await logAuditToCollection({
            requestId: body.requestId,
            mode: normalizedMode,
            sourceScope: body.sourceScope,
            status: 'invalid_payload',
            request: safeClone(body),
            response: safeClone(fallback)
        });
        return fallback;
    }

    const normalized = {
        ok: payload.ok !== false,
        mode: normalizedMode,
        summary: normalizeTextValue(payload.summary || payload.draft?.summary, 700),
        suggestedActions: normalizeArray(payload.suggestedActions || payload.taskSuggestions, 8),
        taskSuggestions: normalizeArray(payload.taskSuggestions || payload.suggestedActions, 8),
        tomorrowGoal: trimText(payload.tomorrowGoal || payload.draft?.tomorrowGoal, 500),
        warnings: normalizeArray(payload.warnings, 8),
        sourceScope: trimText(payload.sourceScope || body.sourceScope, 240),
        draft: normalizedMode === 'staff-plan'
            ? {
                task: trimText(payload.draft?.task, 500),
                subPlans: normalizeArray(payload.draft?.subPlans || payload.draft?.steps, 10),
                steps: normalizeArray(payload.draft?.steps || payload.draft?.subPlans, 10),
                status: trimText(payload.draft?.status, 40),
                budgetHeadId: trimText(payload.draft?.budgetHeadId, 80),
                assignedTo: trimText(payload.draft?.assignedTo, 120),
                startDate: trimText(payload.draft?.startDate, 20),
                endDate: trimText(payload.draft?.endDate, 20)
            }
            : normalizedMode === 'checkout-summary'
                ? {
                    summary: trimText(payload.draft?.summary || payload.summary, 700),
                    tomorrowGoal: trimText(payload.draft?.tomorrowGoal || payload.tomorrowGoal, 500),
                    taskSuggestions: normalizeArray(payload.draft?.taskSuggestions || payload.taskSuggestions || payload.suggestedActions, 8),
                    budgetHeadId: trimText(payload.draft?.budgetHeadId, 80)
                }
            : null,
        audit: sanitizeRecursive(payload.audit || {})
    };

    await logAuditToCollection({
        requestId: body.requestId,
        mode: normalizedMode,
        sourceScope: normalized.sourceScope,
        status: 'ok',
        request: safeClone(body),
        response: {
            ok: normalized.ok,
            summary: normalized.summary,
            suggestedActions: normalized.suggestedActions,
            taskSuggestions: normalized.taskSuggestions,
            tomorrowGoal: normalized.tomorrowGoal,
            warnings: normalized.warnings,
            sourceScope: normalized.sourceScope
        }
    });
    return normalized;
}

function attachGlobal() {
    const api = {
        requestAssistant,
        buildFallback,
        sanitizeRecursive,
        trimText,
        FALLBACK_MESSAGE
    };
    if (typeof window !== 'undefined') {
        window.AppAIAssistant = api;
    }
    return api;
}

export const AppAIAssistant = attachGlobal();
export default AppAIAssistant;
