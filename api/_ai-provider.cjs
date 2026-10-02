// api/_ai-provider.cjs
// CommonJS mirror of api/_ai-provider.js — the shared AI provider used by the
// Vite dev plugin (which loads it via require). The Vercel function imports the
// ESM version. Keep both in sync: same SYSTEM_PROMPT, same model chain, same
// timeout/retry behavior.
//
// Env vars:
//   OPENROUTER_API_KEY   — OpenRouter API key (required for real AI)
//   XAI_API_KEY          — optional xAI (Grok) key, used as an extra provider if set
//   AI_MODEL_CHAIN       — comma-separated OpenRouter models (optional override)
//   OPENROUTER_HTTP_REFERER / OPENROUTER_APP_TITLE — attribution headers (optional)

const POLICY_BLOCK = `CRWI policy facts (use these when answering, do not invent rules):
- Late: checking in after 09:15 is marked late.
- 3 late days in a month = half-day pay cut.
- Missing check-out is counted as absent unless a reason is submitted the same day.
- Leave requests must be applied in the app before the leave date where possible.
- Daily chat limit: each user has a daily AI question limit (resets midnight UTC). The exact numbers arrive in the data as a "quota" object: {limit, used, remaining}. If asked how many questions they can ask, answer ONLY from that quota object (e.g. "You can ask 5 questions a day — N left today"). If no quota object is in the data, say a daily limit applies but do not quote exact numbers. NEVER say there is no limit.`;

const SYSTEM_PROMPT = `You are CRWI's personal helper for staff — like a friendly guide, not a formal HR bot.
You know the user's role, attendance, tasks, leaves and CRWI policies.

${POLICY_BLOCK}

Rules:
- Always reply in SIMPLE layman language — short sentences, everyday words, no jargon. Explain like to a new staff member.
- Be personal: talk directly to "you", use the user's name/role if given.
- Be proactive: point out missed check-in/out, overdue tasks, pending leaves without being asked.
- Be evidence-based: separate Fact (what data says) / Observation (what it means) / Prediction (what may happen) / Recommendation (what to do next).
- Be actionable: give exactly one next step with button label if possible (e.g. "Tap Check Out").
- Be role-aware: show only data the user is allowed to see.
- Be concise: avoid filler, avoid long explanations. If data is missing, say so plainly.
- Format labels exactly as "### Fact", "### Observation", "### Prediction", "### Recommendation" on their own lines.
- Use the conversation history for context: resolve follow-ups ("what about yesterday?", "and my tasks?") against earlier turns. If the latest question is a follow-up, answer it in that context.`;

// Fallback chain: primary + backups. Overridable via AI_MODEL_CHAIN env var.
// Slugs verified against the live OpenRouter catalog (old free chain returned
// 404s — free tiers churn, re-verify when every model fails).
const DEFAULT_MODEL_CHAIN = [
    'inclusionai/ling-3.0-flash-sante:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'google/gemma-4-31b-it:free',
    'qwen/qwen3.8-27b:free'
];

const MAX_TOKENS = 600;
const TEMPERATURE = 0.4;
const TIMEOUT_MS = 15000;

function trimMetrics(metrics) {
    if (!metrics || typeof metrics !== 'object') return {};
    const keep = {};
    const allowed = ['user', 'myIssues', 'myTasks', 'myAttendance', 'myAttendanceSummary',
        'myLeave', 'taskMetrics', 'pendingLeaves', 'today', 'todayDate', 'trend', 'quota'];
    for (const key of allowed) {
        if (metrics[key] !== undefined) keep[key] = metrics[key];
    }
    if (Array.isArray(keep.myIssues)) keep.myIssues = keep.myIssues.slice(0, 8);
    if (Array.isArray(keep.myTasks)) keep.myTasks = keep.myTasks.slice(0, 20);
    if (Array.isArray(keep.trend)) keep.trend = keep.trend.slice(-7);
    return keep;
}

function buildModelChain() {
    const fromEnv = (process.env.AI_MODEL_CHAIN || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    return fromEnv.length > 0 ? fromEnv : DEFAULT_MODEL_CHAIN;
}

function buildProviders() {
    const providers = [];
    if (process.env.OPENROUTER_API_KEY) {
        providers.push({
            name: 'openrouter',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: {
                'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://crwiattendance.vercel.app',
                'X-Title': process.env.OPENROUTER_APP_TITLE || 'CRWI Attendance App'
            },
            models: buildModelChain(),
            key: process.env.OPENROUTER_API_KEY
        });
    }
    if (process.env.XAI_API_KEY) {
        providers.push({
            name: 'xai',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {},
            models: ['grok-3-mini'],
            key: process.env.XAI_API_KEY
        });
    }
    return providers;
}

function sanitizeHistory(history, maxMessages = 24) {
    if (!Array.isArray(history)) return [];
    const out = [];
    for (const m of history) {
        if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
        const content = String(m.content || '').slice(0, 500);
        if (!content) continue;
        out.push({ role: m.role, content });
    }
    return out.slice(-maxMessages);
}

async function callOnce(url, headers, apiKey, model, userPrompt, history = [], systemPrompt = SYSTEM_PROMPT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...headers
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history,
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: MAX_TOKENS,
                temperature: TEMPERATURE
            })
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            const err = new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
            err.status = res.status;
            throw err;
        }
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || '';
        if (!content) throw new Error('Empty AI response');
        return { insight: content, model };
    } finally {
        clearTimeout(timer);
    }
}

const RETRYABLE = (err) => !err.status || err.status === 429 || err.status >= 500;

// ── Task classification (AI-weighted performance) ──────────────
const CLASSIFY_PROMPT = `You classify work tasks for a performance scoring system.
For each task, return the closest sizeCategory and priorityLevel based on the wording.
sizeCategory must be exactly one of: single-action, quick-task, small-task, medium-task, large-task, major-project.
priorityLevel must be exactly one of: urgent, important, standard, flexible.
Rules of thumb: reply/call/email/check = single-action or quick-task; a document or one-day work = small-task or medium-task; multi-day work or a deliverable = large-task; a project or initiative = major-project.
Reply ONLY with a JSON array: [{"id":"<given id>","sizeCategory":"...","priorityLevel":"..."}] — no other text.`;

// ── Performance coach (explains deterministic scores) ─────────
const PERF_PROMPT = `You are CRWI's AI performance coach. You are given a user's performance snapshot:
6 deterministic dimension scores (punctuality, attendance, taskExecution, productivity, planning, compliance),
a composite score, raw details (late days, task counts, extra hours), and a weekly trend.

Rules:
- The scores are computed by fixed formulas — NEVER claim to change or recalculate them. Your job is to EXPLAIN them.
- A "dataCheck" object verifies each score against the raw evidence. If any check has ok:false, SAY SO plainly in the Observation (e.g. "the data looks off for <dimension>: <note>") and treat that number with caution. If dataCheck.allOk is true, you may state the data passed consistency checks.
- Identify which dimension most influenced the composite and why (use the raw details as evidence, e.g. "3 postponed tasks lowered Task Execution").
- Cross-reference sections: attendance patterns affect punctuality and compliance; postponed/missed tasks affect task execution and planning.
- Reply in SIMPLE layman language, talking directly to "you".
- Format exactly as: "### Fact", "### Observation", "### Prediction", "### Recommendation" on their own lines, 1-3 short sentences each.
- End the Recommendation with exactly ONE concrete next step.
- Finally, on the last line, give your OWN re-evaluated score: "AI Score: <0-100> — <one short reason>". Judge the person holistically as a fair human manager would: weigh real impact of completed work, context behind late days or missed tasks, and consistency. It may differ from the formula score.`;

// ── Hero of the Week jury (picks ONE from eligible candidates) ─
const HERO_PROMPT = `You are picking the "Hero of the Week" for the CRWI attendance app — a fair, layman-language jury.
You receive a JSON array of ELIGIBLE staff candidates for the period, each with a deterministic rank/score and weekly stats (days attended, hours, planned/completed/in-progress/postponed/missed tasks, punctuality).

Rules:
- Pick exactly ONE candidate as the hero. Weigh the whole picture like a fair manager: task delivery, consistency, hours, punctuality. "rank" is the score order, but you may justify choosing another eligible candidate when the story is clearly stronger.
- NEVER pick someone who is not in the candidates array. Never invent names or ids.
- The rationale must be ONE plain-language sentence (max 25 words) a non-technical coworker would understand.
- Reply ONLY with JSON: {"userId":"<candidate id>","rationale":"<one sentence>"} — no other text.`;

const VALID_SIZES = ['single-action', 'quick-task', 'small-task', 'medium-task', 'large-task', 'major-project'];
const VALID_PRIORITIES = ['urgent', 'important', 'standard', 'flexible'];

function generatePerformanceFallback(metrics) {
    const dims = metrics?.dimensions || {};
    const det = metrics?.details || {};
    const trend = metrics?.trend || [];
    const composite = Math.round(Number(metrics?.composite) || 0);
    const dimNames = {
        punctuality: 'Punctuality', attendance: 'Attendance', taskExecution: 'Task Execution',
        productivity: 'Productivity', planning: 'Planning', compliance: 'Compliance'
    };
    let strongest = null, weakest = null;
    for (const [k, d] of Object.entries(dims)) {
        if (!strongest || d.score > dims[strongest].score) strongest = k;
        if (!weakest || d.score < dims[weakest].score) weakest = k;
    }
    const lines = [];
    lines.push(`### Fact\nYour formula score this period is ${composite}/100.`
        + (strongest && dims[strongest] ? ` Strongest: ${dimNames[strongest]} (${dims[strongest].score}).` : '')
        + (weakest && dims[weakest] ? ` Weakest: ${dimNames[weakest]} (${dims[weakest].score}).` : ''));
    const obs = [];
    if (det.taskPostponed > 0) obs.push(`${det.taskPostponed} postponed task(s)`);
    if (det.taskMissed > 0) obs.push(`${det.taskMissed} missed task(s)`);
    if (det.lateDays > 0) obs.push(`${det.lateDays} late day(s)`);
    if (det.taskCompleted > 0) obs.push(`${det.taskCompleted} completed task(s)`);
    if (Number(det.extraHours) > 0) obs.push(`${det.extraHours}h extra hours`);
    lines.push(`### Observation\n${obs.length > 0
        ? `This period shows: ${obs.join(', ')}.`
        : 'No significant activity signals this period.'}`);
    if (trend.length >= 2) {
        const diff = trend[trend.length - 1].score - trend[trend.length - 2].score;
        lines.push(`### Prediction\n${diff > 3 ? 'Your trend is improving — keep the current pace.'
            : diff < -3 ? 'Your trend is declining — the next period may drop further without changes.'
            : 'Your trend is stable — expect a similar score next period.'}`);
    } else {
        lines.push(`### Prediction\nNot enough trend data yet — more weeks will show direction.`);
    }
    const steps = {
        punctuality: 'Plan to check in before 09:15 daily.',
        attendance: 'Avoid unplanned absences and keep checkout consistent.',
        taskExecution: 'Clear overdue and postponed tasks first — they weigh down this score.',
        productivity: 'Add richer work descriptions and log extra hours when they happen.',
        planning: 'Plan 5+ tasks weekly with sizes and purposes set.',
        compliance: 'Check out from your registered location to avoid mismatches.'
    };
    lines.push(`### Recommendation\n${weakest && steps[weakest] ? steps[weakest] : 'Keep your current routine and finish today\'s plan.'}`);
    let aiScore = composite;
    if (det.taskCompleted > 0 && det.taskPostponed === 0 && det.taskMissed === 0) aiScore += 3;
    if (det.taskPostponed > 2) aiScore -= 2;
    if (det.taskMissed > 2) aiScore -= 3;
    if (Number(det.extraHours) >= 2) aiScore += 2;
    if (det.lateDays === 0 && det.totalDays > 0) aiScore += 1;
    aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));
    const reason = aiScore > composite ? 'context behind the numbers is favorable'
        : aiScore < composite ? 'pending work and signals outweigh the raw formula'
        : 'formula already reflects the situation fairly';
    lines.push(`AI Score: ${aiScore} — ${reason}.`);
    return lines.join('\n\n');
}

function heuristicClassify(taskText) {
    const t = String(taskText || '').toLowerCase();
    const has = (...words) => words.some(w => t.includes(w));
    let size;
    if (has('project', 'migration', 'implementation', 'launch', 'rollout', 'overhaul', 'initiative')) size = 'major-project';
    else if (has('report', 'proposal', 'audit', 'presentation', 'plan ', 'design ', 'research', 'review ')) size = 'large-task';
    else if (has('prepare', 'draft', 'create', 'build', 'write', 'analyze', 'organize', 'organise')) size = 'medium-task';
    else if (has('update', 'document', 'check ', 'verify', 'follow up', 'schedule')) size = 'small-task';
    else if (has('call', 'email', 'reply', 'send', 'remind')) size = 'quick-task';
    else size = 'small-task';
    let priority = 'standard';
    if (has('urgent', 'asap', 'immediately', 'critical', 'today', 'deadline')) priority = 'urgent';
    else if (has('important', 'priority', 'must', 'client')) priority = 'important';
    else if (has('someday', 'optional', 'if time', 'later')) priority = 'flexible';
    return { sizeCategory: size, priorityLevel: priority };
}

async function classifyTaskBatch(tasks) {
    const clean = (Array.isArray(tasks) ? tasks : [])
        .map((t, i) => ({ id: String(t?.id ?? i), task: String(t?.task || '').slice(0, 120) }))
        .filter(t => t.task);
    if (clean.length === 0) return [];

    const providers = buildProviders();
    if (providers.length > 0) {
        for (const provider of providers) {
            for (const model of provider.models) {
                try {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
                    let res;
                    try {
                        res = await fetch(provider.url, {
                            method: 'POST',
                            signal: controller.signal,
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.key}`, ...provider.headers },
                            body: JSON.stringify({
                                model,
                                messages: [
                                    { role: 'system', content: CLASSIFY_PROMPT },
                                    { role: 'user', content: JSON.stringify(clean.map(t => ({ id: t.id, task: t.task }))) }
                                ],
                                max_tokens: 800,
                                temperature: 0.1
                            })
                        });
                    } finally { clearTimeout(timer); }
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    const raw = data?.choices?.[0]?.message?.content || '';
                    const match = raw.match(/\[[\s\S]*\]/);
                    if (!match) throw new Error('No JSON array in response');
                    const parsed = JSON.parse(match[0]);
                    const byId = new Map(clean.map(t => [String(t.id), t]));
                    const results = [];
                    for (const item of (Array.isArray(parsed) ? parsed : [])) {
                        const t = byId.get(String(item?.id));
                        if (!t) continue;
                        if (!VALID_SIZES.includes(item?.sizeCategory) || !VALID_PRIORITIES.includes(item?.priorityLevel)) continue;
                        results.push({ id: t.id, sizeCategory: item.sizeCategory, priorityLevel: item.priorityLevel });
                    }
                    const done = new Set(results.map(r => String(r.id)));
                    for (const t of clean) {
                        if (!done.has(String(t.id))) {
                            const h = heuristicClassify(t.task);
                            results.push({ id: t.id, ...h });
                        }
                    }
                    return results;
                } catch (err) {
                    console.warn(`[ai-provider] classify ${provider.name}/${model} failed:`, err.message);
                }
            }
        }
    }
    return clean.map(t => ({ id: t.id, ...heuristicClassify(t.task) }));
}

async function callAI({ metrics, question, history, mode }) {
    const providers = buildProviders();
    if (providers.length === 0) return null;

    // Performance snapshots are already minimal and purpose-built
    // (composite/dimensions/details/trend) — the personal-context whitelist
    // would strip them all, leaving the AI nothing to explain.
    const trimmed = (mode === 'performance' || mode === 'hero') ? (metrics || {}) : trimMetrics(metrics);
    let systemPrompt = SYSTEM_PROMPT;
    let userPrompt;
    if (mode === 'performance') {
        systemPrompt = PERF_PROMPT;
        userPrompt = `Performance snapshot (JSON):\n${JSON.stringify(trimmed, null, 2)}\n\nExplain this period's performance in the Fact/Observation/Prediction/Recommendation format.`;
    } else if (mode === 'hero') {
        systemPrompt = HERO_PROMPT;
        userPrompt = `Eligible hero candidates (JSON):\n${JSON.stringify(trimmed, null, 2)}`;
    } else if (question) {
        userPrompt = `Question: ${question}\n\nData context (JSON):\n${JSON.stringify(trimmed, null, 2)}`;
    } else {
        userPrompt = `Analyze this personal data and provide 3-5 key insights with recommendations:\n\n${JSON.stringify(trimmed, null, 2)}`;
    }

    const priorMessages = sanitizeHistory(history);
    for (const provider of providers) {
        for (const model of provider.models) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const result = await callOnce(provider.url, provider.headers, provider.key, model, userPrompt, priorMessages, systemPrompt);
                    return { ...result, source: 'ai', degraded: model !== provider.models[0] };
                } catch (err) {
                    const name = err.name === 'AbortError' ? 'timeout' : `HTTP ${err.status || '?'}`;
                    console.warn(`[ai-provider] ${provider.name}/${model} attempt ${attempt} failed (${name})`);
                    if (!RETRYABLE(err)) break;
                }
            }
        }
    }
    return null;
}

// ── Streaming chat completion ─────────────────────────────────
// Yields text deltas as they arrive. Same provider chain, but streams.
async function* callAIStream({ metrics, question, history }) {
    const providers = buildProviders();
    if (providers.length === 0) return;

    const trimmed = trimMetrics(metrics);
    const userPrompt = question
        ? `Question: ${question}\n\nData context (JSON):\n${JSON.stringify(trimmed, null, 2)}`
        : `Analyze this personal data:\n\n${JSON.stringify(trimmed, null, 2)}`;
    const priorMessages = sanitizeHistory(history);

    for (const provider of providers) {
        for (const model of provider.models) {
            let res;
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), TIMEOUT_MS * 2);
                try {
                    res = await fetch(provider.url, {
                        method: 'POST',
                        signal: controller.signal,
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.key}`, ...provider.headers },
                        body: JSON.stringify({
                            model,
                            messages: [
                                { role: 'system', content: SYSTEM_PROMPT },
                                ...priorMessages,
                                { role: 'user', content: userPrompt }
                            ],
                            max_tokens: MAX_TOKENS,
                            temperature: TEMPERATURE,
                            stream: true
                        })
                    });
                } finally { clearTimeout(timer); }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                if (!res.body) throw new Error('No stream body');

                const decoder = new TextDecoder();
                let buffer = '';
                let emitted = false;
                for await (const chunk of res.body) {
                    buffer += decoder.decode(chunk, { stream: true });
                    const parts = buffer.split('\n');
                    buffer = parts.pop() || '';
                    for (const line of parts) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine.startsWith('data:')) continue;
                        const payload = trimmedLine.slice(5).trim();
                        if (payload === '[DONE]') continue;
                        try {
                            const json = JSON.parse(payload);
                            const delta = json?.choices?.[0]?.delta?.content || '';
                            if (delta) { emitted = true; yield delta; }
                        } catch { /* partial line — ignore */ }
                    }
                }
                if (emitted) return; // success
                throw new Error('Stream ended with no content');
            } catch (err) {
                console.warn(`[ai-provider] stream ${provider.name}/${model} failed:`, err.message);
                // If we already emitted tokens, surface a newline and stop rather
                // than restarting with a duplicate answer.
                if (res && res.ok) return;
                continue; // try next model
            }
        }
    }
}

// ── Tool plan (LLM agent) ─────────────────────────────────────
// Converts free-text requests into a strict JSON action plan. Execution and
// confirmation stay client-side; the model only DECIDES, never acts.
const TOOL_PLAN_PROMPT = `You convert a user's request into an action plan for a workplace assistant.
Available actions:
- add_task: {"action":"add_task","task":"<short task name>","date":"YYYY-MM-DD"} — date optional, omit for today
- complete_task: {"action":"complete_task","query":"<task name or part of it>"} — match by name
- complete_overdue: {"action":"complete_overdue"} — mark ALL overdue tasks done
- postpone_task: {"action":"postpone_task","query":"<task name or part>","date":"YYYY-MM-DD"} — move a task to a new date
- none: {} — if the request is a question, not an action
Rules:
- Resolve relative dates (today/tomorrow/next wednesday) to YYYY-MM-DD using the provided current date.
- Only output actions the user clearly asked for. When unsure, use none.
- Reply ONLY with compact JSON: {"action":...} — no markdown, no explanation.`;

async function planToolAction({ text, today }) {
    const providers = buildProviders();
    if (providers.length === 0) return null;
    for (const provider of providers) {
        for (const model of provider.models) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
                let res;
                try {
                    res = await fetch(provider.url, {
                        method: 'POST',
                        signal: controller.signal,
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.key}`, ...provider.headers },
                        body: JSON.stringify({
                            model,
                            messages: [
                                { role: 'system', content: TOOL_PLAN_PROMPT },
                                { role: 'user', content: `Current date: ${today || ''}\nRequest: ${String(text || '').slice(0, 300)}` }
                            ],
                            max_tokens: 150,
                            temperature: 0
                        })
                    });
                } finally { clearTimeout(timer); }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const raw = data?.choices?.[0]?.message?.content || '';
                const match = raw.match(/\{[\s\S]*\}/);
                if (!match) continue;
                const plan = JSON.parse(match[0]);
                const VALID = ['add_task', 'complete_task', 'complete_overdue', 'postpone_task', 'none'];
                if (!VALID.includes(plan?.action)) continue;
                if (plan.action === 'add_task' && !String(plan.task || '').trim()) continue;
                if ((plan.action === 'complete_task' || plan.action === 'postpone_task') && !String(plan.query || '').trim()) continue;
                if (plan.date && !/^\d{4}-\d{2}-\d{2}$/.test(plan.date)) delete plan.date;
                return plan;
            } catch (err) {
                console.warn(`[ai-provider] plan ${provider.name}/${model} failed:`, err.message);
            }
        }
    }
    return null;
}

module.exports = { callAI, callAIStream, planToolAction, trimMetrics, sanitizeHistory, classifyTaskBatch, heuristicClassify, generatePerformanceFallback, SYSTEM_PROMPT, PERF_PROMPT, HERO_PROMPT };
