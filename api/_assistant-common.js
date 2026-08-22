const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const MAX_REQUEST_BYTES = 24 * 1024;
const MAX_RESPONSE_CHARS = 12000;
const MAX_SUMMARY_CHARS = 700;
const MAX_WARNING_CHARS = 180;
const MAX_ACTION_CHARS = 180;
const FALLBACK_MESSAGE = 'No AI suggestions available, please draft manually.';

const SENSITIVE_KEY_PATTERN = /(salary|token|secret|password|passcode|api[-_ ]?key|auth|private|ssn|aadhaar|bank|account|pin|notes?)/i;

function nowIso() {
    return new Date().toISOString();
}

function createRequestId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `ai_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function trimTo(value, maxLen) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!maxLen || text.length <= maxLen) return text;
    return `${text.slice(0, Math.max(0, maxLen - 1)).trim()}...`;
}

function toText(value, maxLen = 240) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return trimTo(value, maxLen);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        return value.slice(0, 12).map((item) => toText(item, Math.max(40, Math.floor(maxLen / 3)))).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2).slice(0, maxLen);
    }
    return trimTo(String(value), maxLen);
}

function sanitizeRecursive(value, depth = 0) {
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
    if (typeof value === 'string') return trimTo(value, 400);
    return value;
}

function normalizeStringArray(list, limit = 8, maxLen = MAX_ACTION_CHARS) {
    return Array.isArray(list)
        ? list
            .map((item) => trimTo(item, maxLen))
            .filter(Boolean)
            .slice(0, limit)
        : [];
}

function parseJsonObject(text) {
    if (text && typeof text === 'object') return text;
    const raw = String(text || '').trim();
    if (!raw) return null;

    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const source = fenced ? fenced[1].trim() : raw;
    const firstBrace = source.indexOf('{');
    const lastBrace = source.lastIndexOf('}');
    const candidate = firstBrace >= 0 && lastBrace > firstBrace
        ? source.slice(firstBrace, lastBrace + 1)
        : source;

    try {
        return JSON.parse(candidate);
    } catch {
        return null;
    }
}

function buildFallbackResponse(mode, sourceScope, reason = 'invalid_ai_output') {
    return {
        ok: false,
        mode,
        summary: FALLBACK_MESSAGE,
        suggestedActions: [],
        taskSuggestions: [],
        tomorrowGoal: '',
        warnings: [trimTo(reason, MAX_WARNING_CHARS)],
        sourceScope: trimTo(sourceScope || 'unknown', 200),
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
            requestId: createRequestId(),
            loggedAt: nowIso(),
            fallback: true
        }
    };
}

function validateResponseShape(mode, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { valid: false, reason: 'response_not_object' };
    const summary = trimTo(payload.summary, MAX_SUMMARY_CHARS);
    const suggestedActions = normalizeStringArray(payload.suggestedActions || payload.taskSuggestions, 8, MAX_ACTION_CHARS);
    const taskSuggestions = normalizeStringArray(payload.taskSuggestions || payload.suggestedActions, 8, MAX_ACTION_CHARS);
    const tomorrowGoal = trimTo(payload.tomorrowGoal || payload.draft?.tomorrowGoal || '', 500);
    const warnings = normalizeStringArray(payload.warnings, 8, MAX_WARNING_CHARS);
    const sourceScope = trimTo(payload.sourceScope, 240);

    if (!summary) return { valid: false, reason: 'missing_summary' };
    if (!sourceScope) return { valid: false, reason: 'missing_source_scope' };

    if (mode === 'staff-plan') {
        const draft = payload.draft && typeof payload.draft === 'object' && !Array.isArray(payload.draft) ? payload.draft : null;
        if (!draft) return { valid: false, reason: 'missing_staff_draft' };
        const normalizedDraft = {
            task: trimTo(draft.task, 500),
            subPlans: normalizeStringArray(draft.subPlans, 10, 180),
            status: trimTo(draft.status, 40),
            budgetHeadId: trimTo(draft.budgetHeadId, 80),
            assignedTo: trimTo(draft.assignedTo, 120),
            startDate: trimTo(draft.startDate, 20),
            endDate: trimTo(draft.endDate, 20)
        };
        if (!normalizedDraft.task) return { valid: false, reason: 'missing_draft_task' };
        if (normalizedDraft.task.length > 500) return { valid: false, reason: 'draft_task_too_long' };
        return {
            valid: true,
            value: {
                ok: payload.ok !== false,
                mode,
                summary,
                suggestedActions,
                taskSuggestions,
                tomorrowGoal: '',
                warnings,
                sourceScope,
                draft: normalizedDraft
            }
        };
    }

    if (mode === 'checkout-summary') {
        const draft = payload.draft && typeof payload.draft === 'object' && !Array.isArray(payload.draft) ? payload.draft : null;
        const normalizedDraft = {
            summary: trimTo(draft?.summary || summary, MAX_SUMMARY_CHARS),
            tomorrowGoal: trimTo(draft?.tomorrowGoal || tomorrowGoal, 500),
            taskSuggestions: normalizeStringArray(draft?.taskSuggestions || taskSuggestions, 8, MAX_ACTION_CHARS),
            budgetHeadId: trimTo(draft?.budgetHeadId || '', 80)
        };
        if (!normalizedDraft.summary) return { valid: false, reason: 'missing_checkout_summary' };
        return {
            valid: true,
            value: {
                ok: payload.ok !== false,
                mode,
                summary,
                suggestedActions,
                taskSuggestions,
                tomorrowGoal,
                warnings,
                sourceScope,
                draft: normalizedDraft
            }
        };
    }

    const executiveTone = trimTo(payload.executiveTone || payload.narrative || '', MAX_SUMMARY_CHARS);
    return {
        valid: true,
        value: {
            ok: payload.ok !== false,
            mode,
            summary: executiveTone || summary,
            suggestedActions,
            taskSuggestions,
            tomorrowGoal: '',
            warnings,
            sourceScope,
            draft: null
        }
    };
}

function buildSafetyPreamble() {
    return [
        'You are a privacy-first assistant for the CRWI attendance app.',
        'Never include salaries, tokens, private notes, or raw dumps in your response.',
        'Use only the provided context. Do not invent unseen records, private HR details, or secrets.',
        'Return a single JSON object only, with no markdown fences or extra commentary.'
    ].join(' ');
}

function buildModePrompt(mode) {
    const common = buildSafetyPreamble();

    if (mode === 'staff-plan') {
        return [
            common,
            'Mode: staff-plan.',
            'Help the staff member draft or refine a daily plan.',
            'Return JSON with: summary, suggestedActions (array), warnings (array), sourceScope, draft.',
            'The draft must include: task, subPlans, status, budgetHeadId, assignedTo, startDate, endDate.',
            'Use the currentPlan and historySummary to refine the wording, infer sensible steps, and match repeated work patterns.',
            'Use staffMemory when available to understand the staff member’s recurring work style, attendance rhythm, collaborators, and budget-head preferences.',
            'If the historySummary suggests a likely budget head, include it in draft.budgetHeadId.',
            'Keep the draft editable. Prefer practical, concise wording and sensible steps.'
        ].join(' ');
    }

    if (mode === 'checkout-summary') {
        return [
            common,
            'Mode: checkout-summary.',
            'Help a staff member draft a privacy-safe checkout summary using the current summary, tomorrow goal, task checklist, work plan, and staff memory.',
            'Return JSON with: summary, tomorrowGoal, taskSuggestions (array), warnings (array), sourceScope, draft.',
            'The draft must include: summary, tomorrowGoal, taskSuggestions, budgetHeadId.',
            'Use the current summary text, tomorrowGoal field, taskChecklist state, workPlan, and staffMemory to refine the language and suggest concise follow-up items.',
            'Use recentPersonalPlans, recentTaskActivityHistory, budgetHeadPatterns, and staffMemory.summary to identify recurring habits and likely budget-head matches.',
            'If a budget head pattern is strong, include draft.budgetHeadId. Otherwise leave it blank.',
            'Keep the output editable and brief. Never include salaries, tokens, private notes, or raw dumps in your response.'
        ].join(' ');
    }

    return [
        common,
        'Mode: admin-report.',
        'Help an admin summarize attendance and report data from the filtered scope.',
        'Return JSON with: summary, suggestedActions (array), warnings (array), sourceScope, executiveTone.',
        'Include concise trends, exceptions, and next-step ideas. Reference the provided sourceScope explicitly in the output.'
    ].join(' ');
}

function buildMessages(mode, context = {}) {
    const safeContext = sanitizeRecursive(context);
    return [
        {
            role: 'system',
            content: buildModePrompt(mode)
        },
        {
            role: 'user',
            content: JSON.stringify({
                mode,
                sourceScope: safeContext.sourceScope || '',
                context: safeContext
            }, null, 2)
        }
    ];
}

function summarizeAuditInput(mode, requestBody, sanitizedContext) {
    return {
        requestId: requestBody.requestId || createRequestId(),
        mode,
        userId: trimTo(requestBody?.user?.id || requestBody?.userId || '', 120),
        role: trimTo(requestBody?.user?.role || '', 60),
        sourceScope: trimTo(sanitizedContext?.sourceScope || requestBody?.sourceScope || '', 240),
        inputSummary: trimTo(toText(sanitizedContext, 800), 800),
        loggedAt: nowIso()
    };
}

function summarizeAuditOutput(mode, response) {
    return {
        mode,
        ok: !!response?.ok,
        sourceScope: trimTo(response?.sourceScope || '', 240),
        summary: trimTo(response?.summary || '', MAX_SUMMARY_CHARS),
        suggestedActions: normalizeStringArray(response?.suggestedActions, 8, MAX_ACTION_CHARS),
        taskSuggestions: normalizeStringArray(response?.taskSuggestions, 8, MAX_ACTION_CHARS),
        tomorrowGoal: trimTo(response?.tomorrowGoal || '', 500),
        warnings: normalizeStringArray(response?.warnings, 8, MAX_WARNING_CHARS)
    };
}

async function readJsonBody(req, limitBytes = MAX_REQUEST_BYTES) {
    if (req.body && typeof req.body === 'object') return req.body;
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buf.length;
        if (total > limitBytes) {
            const err = new Error('Request body too large');
            err.statusCode = 413;
            throw err;
        }
        chunks.push(buf);
    }
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        const err = new Error('Invalid JSON payload');
        err.statusCode = 400;
        throw err;
    }
}

function getDefaultModel() {
    return trimTo(process.env.OPENROUTER_MODEL || DEFAULT_MODEL, 120);
}

function getOpenRouterHeaders() {
    const envReferer = String(process.env.OPENROUTER_HTTP_REFERER || process.env.VERCEL_URL || '').trim();
    const referer = envReferer
        ? (/^https?:\/\//i.test(envReferer) ? envReferer : `https://${envReferer}`)
        : '';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${String(process.env.OPENROUTER_API_KEY || '').trim()}`,
        'HTTP-Referer': referer,
        'X-Title': String(process.env.OPENROUTER_APP_TITLE || 'CRWI Attendance App').trim()
    };
    if (!headers['HTTP-Referer']) delete headers['HTTP-Referer'];
    return headers;
}

async function callOpenRouter({ mode, context }) {
    const messages = buildMessages(mode, context);
    const model = getDefaultModel();
    const maxTokens = mode === 'staff-plan' ? 700 : (mode === 'checkout-summary' ? 800 : 900);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: getOpenRouterHeaders(),
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
            max_tokens: maxTokens
        })
    });

    const text = await response.text();
    if (!response.ok) {
        const err = new Error(`OpenRouter request failed with status ${response.status}`);
        err.statusCode = 502;
        err.upstream = text.slice(0, 1200);
        throw err;
    }
    if (text.length > MAX_RESPONSE_CHARS) {
        const err = new Error('OpenRouter response too large');
        err.statusCode = 502;
        throw err;
    }

    const payload = parseJsonObject(text);
    const content = payload?.choices?.[0]?.message?.content ?? payload?.choices?.[0]?.text ?? payload;
    const parsed = parseJsonObject(content);
    if (!parsed) {
        const err = new Error('Model returned non-JSON content');
        err.statusCode = 502;
        throw err;
    }

    const validation = validateResponseShape(mode, parsed);
    if (!validation.valid) {
        const err = new Error(`Invalid AI response: ${validation.reason}`);
        err.statusCode = 502;
        throw err;
    }

    return validation.value;
}

function buildRequestScope(mode, body) {
    const sanitized = sanitizeRecursive(body?.context || {});
    const user = sanitizeRecursive(body?.user || {});

    if (mode === 'staff-plan') {
        const collaborators = Array.isArray(sanitized.collaborators)
            ? sanitized.collaborators.slice(0, 12).map((item) => ({
                id: trimTo(item?.id || '', 80),
                name: trimTo(item?.name || '', 120)
            }))
            : [];
        return {
            sourceScope: trimTo(body?.sourceScope || sanitized.sourceScope || `Daily plan for ${sanitized.date || 'selected date'}`, 240),
            user,
            date: trimTo(sanitized.date || '', 20),
            scope: trimTo(sanitized.scope || 'personal', 30),
            currentPlan: {
                task: trimTo(sanitized.currentPlan?.task || '', 500),
                subPlans: normalizeStringArray(sanitized.currentPlan?.subPlans, 10, 180),
                status: trimTo(sanitized.currentPlan?.status || '', 40),
                budgetHeadId: trimTo(sanitized.currentPlan?.budgetHeadId || '', 80),
                assignedTo: trimTo(sanitized.currentPlan?.assignedTo || '', 120),
                startDate: trimTo(sanitized.currentPlan?.startDate || '', 20),
                endDate: trimTo(sanitized.currentPlan?.endDate || '', 20)
            },
            staffMemory: sanitized.staffMemory ? {
                sourceScope: trimTo(sanitized.staffMemory?.sourceScope || '', 240),
                historyAvailable: sanitized.staffMemory?.historyAvailable === true,
                summary: sanitizeRecursive(sanitized.staffMemory?.summary || {}),
                recentPlans: Array.isArray(sanitized.staffMemory?.recentPlans)
                    ? sanitized.staffMemory.recentPlans.slice(0, 8).map((item) => ({
                        date: trimTo(item?.date || '', 20),
                        task: trimTo(item?.task || '', 220),
                        budgetHeadId: trimTo(item?.budgetHeadId || '', 80),
                        budgetHeadLabel: trimTo(item?.budgetHeadLabel || '', 180),
                        status: trimTo(item?.status || '', 40),
                        scope: trimTo(item?.scope || '', 20),
                        assignedTo: trimTo(item?.assignedTo || '', 120),
                        collaboratorCount: Number(item?.collaboratorCount || 0),
                        steps: normalizeStringArray(item?.steps, 5, 120)
                    }))
                    : [],
                recentActivities: Array.isArray(sanitized.staffMemory?.recentActivities)
                    ? sanitized.staffMemory.recentActivities.slice(0, 8).map((item) => ({
                        date: trimTo(item?.date || '', 20),
                        eventType: trimTo(item?.eventType || '', 60),
                        budgetHeadId: trimTo(item?.budgetHeadId || '', 80),
                        progressStatus: trimTo(item?.progressStatus || '', 40),
                        note: trimTo(item?.note || '', 180)
                    }))
                    : [],
                attendanceSummary: sanitizeRecursive(sanitized.staffMemory?.attendanceSummary || {}),
                tagHistorySummary: normalizeStringArray(sanitized.staffMemory?.tagHistorySummary, 8, 180),
                notificationSummary: normalizeStringArray(sanitized.staffMemory?.notificationSummary, 8, 180)
            } : null,
            historySummary: {
                sourceScope: trimTo(sanitized.historySummary?.sourceScope || '', 240),
                historyAvailable: sanitized.historySummary?.historyAvailable === true,
                recentPlans: Array.isArray(sanitized.historySummary?.recentPlans)
                    ? sanitized.historySummary.recentPlans.slice(0, 8).map((plan) => ({
                        date: trimTo(plan?.date || '', 20),
                        budgetHeadId: trimTo(plan?.budgetHeadId || '', 80),
                        budgetHeadLabel: trimTo(plan?.budgetHeadLabel || '', 180),
                        taskCount: Number(plan?.taskCount || 0),
                        summary: trimTo(plan?.summary || '', 500)
                    }))
                    : [],
                recurringBudgetHeads: Array.isArray(sanitized.historySummary?.recurringBudgetHeads)
                    ? sanitized.historySummary.recurringBudgetHeads.slice(0, 5).map((item) => ({
                        id: trimTo(item?.id || '', 80),
                        label: trimTo(item?.label || '', 180),
                        count: Number(item?.count || 0)
                    }))
                    : [],
                recurringSteps: normalizeStringArray(sanitized.historySummary?.recurringSteps, 6, 180)
            },
            collaborators
        };
    }

    if (mode === 'checkout-summary') {
        const taskChecklist = Array.isArray(sanitized.taskChecklist)
            ? sanitized.taskChecklist.slice(0, 18).map((item) => ({
                label: trimTo(item?.label || item?.text || item?.task || '', 240),
                status: trimTo(item?.status || '', 40),
                action: trimTo(item?.action || '', 40),
                progressPercent: Number(item?.progressPercent || 0),
                budgetHeadId: trimTo(item?.budgetHeadId || '', 80),
                note: trimTo(item?.note || item?.progressNote || '', 180)
            })).filter((item) => item.label)
            : [];
        return {
            sourceScope: trimTo(body?.sourceScope || sanitized.sourceScope || `Checkout draft for ${sanitized.date || 'selected date'}`, 240),
            user,
            date: trimTo(sanitized.date || '', 20),
            currentSummary: trimTo(sanitized.currentSummary || sanitized.currentPlan?.summary || sanitized.description || '', 1200),
            tomorrowGoal: trimTo(sanitized.tomorrowGoal || sanitized.currentPlan?.tomorrowGoal || '', 500),
            currentBudgetHeadId: trimTo(sanitized.currentBudgetHeadId || sanitized.currentPlan?.currentBudgetHeadId || '', 80),
            taskChecklist,
            workPlan: {
                sourceScope: trimTo(sanitized.workPlan?.sourceScope || '', 240),
                rawText: trimTo(sanitized.workPlan?.rawText || '', 1200),
                planCount: Number(sanitized.workPlan?.planCount || 0),
                completedCount: Number(sanitized.workPlan?.completedCount || 0),
                pendingCount: Number(sanitized.workPlan?.pendingCount || 0)
            },
            staffMemory: sanitized.staffMemory ? {
                sourceScope: trimTo(sanitized.staffMemory?.sourceScope || '', 240),
                historyAvailable: sanitized.staffMemory?.historyAvailable === true,
                summary: sanitizeRecursive(sanitized.staffMemory?.summary || {}),
                recentPlans: Array.isArray(sanitized.staffMemory?.recentPlans)
                    ? sanitized.staffMemory.recentPlans.slice(0, 8).map((item) => ({
                        date: trimTo(item?.date || '', 20),
                        task: trimTo(item?.task || '', 220),
                        budgetHeadId: trimTo(item?.budgetHeadId || '', 80),
                        budgetHeadLabel: trimTo(item?.budgetHeadLabel || '', 180),
                        status: trimTo(item?.status || '', 40),
                        scope: trimTo(item?.scope || '', 20),
                        assignedTo: trimTo(item?.assignedTo || '', 120),
                        collaboratorCount: Number(item?.collaboratorCount || 0),
                        steps: normalizeStringArray(item?.steps, 5, 120)
                    }))
                    : [],
                recentActivities: Array.isArray(sanitized.staffMemory?.recentActivities)
                    ? sanitized.staffMemory.recentActivities.slice(0, 8).map((item) => ({
                        date: trimTo(item?.date || '', 20),
                        eventType: trimTo(item?.eventType || '', 60),
                        budgetHeadId: trimTo(item?.budgetHeadId || '', 80),
                        progressStatus: trimTo(item?.progressStatus || '', 40),
                        note: trimTo(item?.note || '', 180)
                    }))
                    : [],
                attendanceSummary: sanitizeRecursive(sanitized.staffMemory?.attendanceSummary || {}),
                tagHistorySummary: normalizeStringArray(sanitized.staffMemory?.tagHistorySummary, 8, 180),
                notificationSummary: normalizeStringArray(sanitized.staffMemory?.notificationSummary, 8, 180)
            } : null
        };
    }

    const highlights = Array.isArray(sanitized.highlights)
        ? sanitized.highlights.slice(0, 12).map((item) => trimTo(item, 180))
        : [];
    const exceptions = Array.isArray(sanitized.exceptions)
        ? sanitized.exceptions.slice(0, 12).map((item) => sanitizeRecursive(item))
        : [];
    return {
        sourceScope: trimTo(body?.sourceScope || sanitized.sourceScope || 'Admin report filter scope', 240),
        user,
        summaryFilters: {
            auditStartDate: trimTo(sanitized.auditStartDate || '', 20),
            auditEndDate: trimTo(sanitized.auditEndDate || '', 20),
            view: trimTo(sanitized.view || '', 50)
        },
        metrics: sanitizeRecursive(sanitized.metrics || {}),
        highlights,
        exceptions,
        sampleRows: Array.isArray(sanitized.sampleRows)
            ? sanitized.sampleRows.slice(0, 10).map((row) => sanitizeRecursive(row))
            : []
    };
}

module.exports = {
    DEFAULT_MODEL,
    MAX_REQUEST_BYTES,
    MAX_RESPONSE_CHARS,
    FALLBACK_MESSAGE,
    createRequestId,
    trimTo,
    sanitizeRecursive,
    validateResponseShape,
    buildFallbackResponse,
    buildMessages,
    summarizeAuditInput,
    summarizeAuditOutput,
    readJsonBody,
    callOpenRouter,
    buildRequestScope,
    nowIso,
    getDefaultModel
};
