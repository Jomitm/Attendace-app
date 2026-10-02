// @ts-check
// js/modules/ai-performance-coach.js
// AI layer for the "Your Performance" section — task classification runs ONCE
// PER USER PER DAY; the narrative/score may autonomously re-check the data up
// to AI_MAX_UPDATES_PER_DAY times per day (hour-spaced, only when the data
// actually changed).
//
// Two jobs:
//  1) Task-size classification backfill: classifies the user's recent
//     unclassified tasks via AI (or keyword heuristics offline) and stores
//     aiSizeCategory/aiPriorityLevel on the task docs, so the weighted
//     performance scoring (analytics.js) reflects real task sizes —
//     "database migration" finally counts more than "reply to email".
//  2) Coach narrative: sends the performance snapshot (composite,
//     6 dimension scores, details, trend) to /api/ai-insights with
//     mode:'performance' and caches the explanation. The cache re-checks
//     itself as the day's data changes, within the daily update budget.
//
// Scores themselves are NEVER computed by AI — analytics.js formulas stay
// deterministic and auditable. AI only classifies (data entry) and explains.

import { AppConfig } from '../config.js';

// v3: bumps cache version so stale (wrong-context) narratives from an older
// build are never served — bump again if the snapshot/prompt logic changes.
const CACHE_PREFIX = 'crwi_perf_ai_v3_';
const CLASSIFY_PREFIX = 'crwi_task_cls_';
const MAX_TASKS_PER_RUN = 40;
// Guards from AppConfig.AI_POLICY — see AI_POLICY comment in config.js.
const AI_SCORE_MAX_DELTA = Math.max(0, Number(AppConfig.AI_POLICY?.AI_SCORE_MAX_DELTA ?? 15));
const NARRATIVE_DRIFT_POINTS = Math.max(0, Number(AppConfig.AI_POLICY?.NARRATIVE_DRIFT_POINTS ?? 5));
// Autonomous re-check budget: at most this many fresh generations per user per
// day, spaced at least AI_UPDATE_MIN_GAP_MS apart, and only when data changed.
const AI_MAX_UPDATES_PER_DAY = Math.max(1, Number(AppConfig.AI_POLICY?.AI_MAX_UPDATES_PER_DAY ?? 3));
const AI_UPDATE_MIN_GAP_MS = Math.max(0, Number(AppConfig.AI_POLICY?.AI_UPDATE_MIN_GAP_MS ?? 60 * 60 * 1000));

function _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _user() {
    return window.AppAuth?.getUser?.() || null;
}

function _hash(text) {
    let h = 5381;
    const s = String(text || '').toLowerCase().trim();
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return String(h >>> 0);
}

function _lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return null; }
}

function _lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota — ignore */ }
}

/** Per-user/day autonomous-update budget record key. */
export function _aiRunsKey(userId) {
    return `${CACHE_PREFIX}${userId}_ai_runs_${_today()}`;
}

function _aiRuns(userId) {
    const rec = _lsGet(_aiRunsKey(userId)) || {};
    return { count: Math.max(0, Number(rec.count) || 0), lastAt: Math.max(0, Number(rec.lastAt) || 0) };
}

function _aiRunsBump(userId) {
    const cur = _aiRuns(userId);
    _lsSet(_aiRunsKey(userId), { count: cur.count + 1, lastAt: Date.now() });
}

/**
 * Stable fingerprint of the data a cached narrative/score was written against.
 * When it no longer matches the live payload the AI should re-check — subject
 * to the daily budget and min gap.
 * @param {any} perfData
 * @returns {string}
 */
export function _perfFingerprint(perfData) {
    const d = perfData?.details || {};
    return [
        Math.round(Number(perfData?.composite) || 0),
        Number(d.taskCompleted) || 0,
        Number(d.taskMissed) || 0,
        Number(d.taskPostponed) || 0,
        Number(d.taskInProgress) || 0,
        Number(d.daysWorked) || 0,
        Number(d.lateDays) || 0,
        Math.round(Number(d.extraHours) || 0),
        Math.round(Number(d.avgActivity) || 0)
    ].join('|');
}

async function _authedFetch(body) {
    const token = await window.AppFirebaseAuth?.currentUser?.getIdToken?.() || '';
    // Hard timeout — the coach UI must never hang on a stuck request.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        return await fetch('/api/ai-insights', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: JSON.stringify(body)
        });
    } finally { clearTimeout(timer); }
}

// ── 1) Task classification backfill ────────────────────────────

function _collectUnclassifiedTasks(days = 30) {
    // Reads work_plans via the analytics cache — same shape as scoring uses.
    return window.AppAnalytics?.getWorkPlans?.().then(rows => {
        const cutoff = (() => { const d = new Date(Date.now() - days * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
        const user = _user();
        const out = [];
        for (const wp of (rows || [])) {
            if (!wp || !Array.isArray(wp.plans)) continue;
            if (String(wp.date || '') < cutoff) continue;
            if (user && String(wp.userId || wp.user_id || '') !== String(user.id)) continue;
            for (const t of wp.plans) {
                if (!t || t.isRemoved) continue;
                const name = String(t.task || '').trim();
                if (!name) continue;
                if (t.sizeCategory || t.aiSizeCategory) continue; // already classified (human or AI)
                out.push({ wp, t, name });
            }
        }
        return out;
    }).catch(() => []);
}

async function _backfillClassifications() {
    const candidates = await _collectUnclassifiedTasks();
    if (candidates.length === 0) return { classified: 0, skipped: true };

    // Dedupe by text hash using the classification cache
    const pending = [];
    const pendingKeys = new Set();
    for (const c of candidates) {
        if (pending.length >= MAX_TASKS_PER_RUN) break;
        const key = CLASSIFY_PREFIX + _hash(c.name);
        const cached = _lsGet(key);
        if (cached?.sizeCategory) {
            c.t.aiSizeCategory = cached.sizeCategory;
            c.t.aiPriorityLevel = cached.priorityLevel;
            c.t.aiClassified = true;
            pendingKeys.add(key); // mark dirty for write below
            pending.push({ ...c, key });
        } else {
            pending.push({ ...c, key, needsAi: true });
        }
    }
    if (pending.length === 0) return { classified: 0, skipped: true };

    // Ask the server for the ones without a cache entry
    const needAi = pending.filter(p => p.needsAi);
    if (needAi.length > 0) {
        try {
            const res = await _authedFetch({
                mode: 'classify',
                tasks: needAi.map((p, i) => ({ id: String(i), task: p.name }))
            });
            if (res.ok) {
                const data = await res.json();
                const byId = new Map((data.classifications || []).map(c => [String(c.id), c]));
                needAi.forEach((p, i) => {
                    const c = byId.get(String(i));
                    if (c?.sizeCategory) {
                        p.t.aiSizeCategory = c.sizeCategory;
                        p.t.aiPriorityLevel = c.priorityLevel;
                        p.t.aiClassified = true;
                        _lsSet(p.key, { sizeCategory: c.sizeCategory, priorityLevel: c.priorityLevel, at: Date.now() });
                        p.needsAi = false;
                    }
                });
            }
        } catch { /* offline — heuristics below */ }
    }

    // Heuristic fallback for anything the AI didn't classify
    for (const p of pending) {
        if (p.needsAi) {
            const h = _heuristicClassify(p.name);
            p.t.aiSizeCategory = h.sizeCategory;
            p.t.aiPriorityLevel = h.priorityLevel;
            p.t.aiClassified = true;
            _lsSet(p.key, { ...h, at: Date.now(), heuristic: true });
        }
    }

    // Persist back to work_plans (single put per changed plan doc)
    const dirtyPlans = new Map();
    for (const p of pending) {
        if (p.t.aiSizeCategory) dirtyPlans.set(p.wp.id || p.wp.date, p.wp);
    }
    for (const wp of dirtyPlans.values()) {
        try {
            wp.updatedAt = new Date().toISOString();
            await window.AppDB.put('work_plans', wp);
        } catch { /* best-effort */ }
    }
    // Invalidate analytics caches so the next score computation uses the new weights
    try { window.AppDB?.invalidateCache?.('svc_analytics_workPlans'); } catch {}
    return { classified: pending.length, skipped: false };
}

export function _heuristicClassify(taskText) {
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

// ── 2) Coach narrative (budgeted autonomous re-checks) ─────────

function _buildSnapshot(perfData) {
    return {
        today: _today(),
        composite: perfData.composite,
        dimensions: Object.fromEntries(
            Object.entries(perfData.dimensions || {}).map(([k, d]) => [k, { label: d.label, score: d.score }])
        ),
        details: perfData.details || {},
        stats: perfData.stats ? {
            present: perfData.stats.present,
            late: perfData.stats.late,
            extraWorkedHours: perfData.stats.extraWorkedHours
        } : null,
        trend: (perfData.trend || []).map(t => ({ week: t.week, score: t.score })),
        dataCheck: verifyPerformanceData(perfData)
    };
}

/**
 * Deterministic score verification — recomputes what each dimension SHOULD
 * roughly be from the raw details and flags impossible/implausible values.
 * This runs before the AI so the model gets told which numbers look wrong
 * (and the UI can show a data-quality verdict independent of the AI).
 */
export function verifyPerformanceData(perfData) {
    const d = perfData?.dimensions || {};
    const det = perfData?.details || {};
    const checks = [];
    const push = (dim, ok, expected, note) => checks.push({ dimension: dim, ok, expected, note });

    const lateDays = Number(det.lateDays ?? 0);
    const totalDays = Number(det.totalDays ?? 0);
    const daysWorked = Number(det.daysWorked ?? 0);

    // Punctuality 100 requires zero late days (any late day caps it below 100
    // once totalDays > 0 — formula: (total-late)/total * 100, minus pauses)
    if (d.punctuality != null) {
        const p = Number(d.punctuality.score ?? d.punctuality);
        const impossible = totalDays > 0 && lateDays > 0 && p >= 100;
        push('Punctuality', !impossible,
            totalDays > 0 ? Math.floor(((totalDays - lateDays) / totalDays) * 100) + '+/-' : null,
            impossible ? `${lateDays} late day(s) with totalDays ${totalDays} cannot yield 100` : null);
    }

    // Attendance ceiling = day-ratio over REQUIRED WORKING days in the window
    // (pace-adjusted — NOT calendar windowDays) + max policy bonuses
    // (hours ≤25, consistency ≤20). Flag only genuinely impossible values:
    // a 100 over a partial calendar window (e.g. 4/5 required days + bonuses)
    // is legitimate and must pass.
    if (d.attendance != null) {
        const a = Number(d.attendance.score ?? d.attendance);
        const denom = Number(det.attendanceDenom) || Number(det.requiredDays) || Number(perfData.windowDays) || 0;
        if (denom > 0) {
            const daysScore = Math.min(100, Math.round((daysWorked / denom) * 100));
            const maxPlausible = Math.min(100, daysScore + 45);
            push('Attendance', a <= maxPlausible,
                `≤${maxPlausible} (${daysWorked}/${denom} required days + policy bonuses)`,
                a > maxPlausible ? `attendance ${a} impossible for ${daysWorked}/${denom} days (max ${maxPlausible})` : null);
        }
    }

    // Task Execution: completing everything on time ⇒ ≥ ~70 (0.5*100 + 0.2*100);
    // a 100 with missed/postponed tasks is suspicious.
    if (d.taskExecution != null) {
        const t = Number(d.taskExecution.score ?? d.taskExecution);
        const missed = Number(det.taskMissed ?? 0);
        const postponed = Number(det.taskPostponed ?? 0);
        const suspicious = t >= 95 && (missed > 0 || postponed > 2);
        push('Task Execution', !suspicious,
            missed + postponed > 0 ? '<95 when missed/postponed tasks exist' : null,
            suspicious ? `score ${t} despite ${missed} missed / ${postponed} postponed` : null);
    }

    // Compliance: auto-checkouts/location mismatches must reduce it.
    if (d.compliance != null) {
        const c = Number(d.compliance.score ?? d.compliance);
        const mismatches = Number(det.locationMismatches ?? 0);
        const autos = Number(det.autoCheckouts ?? 0);
        const suspicious = c >= 100 && (mismatches > 0 || autos > 0);
        push('Compliance', !suspicious, mismatches + autos > 0 ? '<100 with violations' : null,
            suspicious ? `score ${c} despite ${mismatches} mismatch(es)/${autos} auto-checkout(s)` : null);
    }

    // Composite must sit within the dimension envelope (weighted average ± bonus 3)
    if (perfData.composite != null && Object.keys(d).length >= 4) {
        const scores = Object.values(d).map(x => Number(x.score ?? x)).filter(Number.isFinite);
        const maxDim = Math.max(...scores);
        const minDim = Math.min(...scores);
        const c = Number(perfData.composite);
        const plausible = c <= maxDim + 5 && c >= minDim - 5;
        push('Composite', plausible, `${minDim}–${maxDim} (weighted within dimension range ±5)`,
            plausible ? null : `composite ${c} outside dimension range ${minDim}–${maxDim}`);
    }

    return { ranAt: Date.now(), allOk: checks.every(c => c.ok), checks };
}

/**
 * Personal-performance payload (result of analytics.getPersonalPerformance()).
 * @typedef {object} PerfData
 * @property {number} [composite] deterministic 0–100 score
 * @property {Record<string, any>} [dimensions] per-dimension {label, score, icon, color}
 * @property {Record<string, any>} [details] raw counters used by checks/narrative
 * @property {Array<{week?: string, score?: number}>} [trend]
 * @property {boolean} [error]
 */

/**
 * Runs the once-a-day AI pass. Safe to call on every dashboard render —
 * it early-returns when today's data already exists.
 * @param {PerfData} perfData result of analytics.getPersonalPerformance()
 * @param {string} periodKey week|month|year
 * @returns {Promise<{narrative: string|null, aiScore?: number|null, scoreReason?: string, fromCache: boolean, classified: number, model?: string, source?: string}>}
 */
export async function runDailyPerformanceAI(perfData, periodKey = 'week') {
    const user = _user();
    if (!user || !perfData) return { narrative: null, fromCache: false, classified: 0 };

    const cacheKey = `${CACHE_PREFIX}${user.id}_${_today()}_${periodKey}`;
    const cached = _lsGet(cacheKey);

    // Narrative FIRST (fast, cached server-side) — the classification backfill
    // (slow: reads work_plans + batched AI calls) runs in the background and
    // only affects tomorrow's weights. This keeps the spinner to <2s.
    const classifyKey = `${CACHE_PREFIX}${user.id}_cls_${_today()}`;
    let classified = 0;
    if (!_lsGet(classifyKey)) {
        // Kick off but don't await — mark as started immediately so a slow
        // work_plans read can never stall the UI pipeline.
        _backfillClassifications()
            .then(r => { classified = r.classified || 0; })
            .catch(e => console.warn('[PerfAI] classify backfill failed:', e))
            .finally(() => _lsSet(classifyKey, { at: Date.now() }));
    } else {
        _lsSet(classifyKey, { at: Date.now() });
    }

    // Serve today's cached narrative when we have one. The background
    // classification only affects the *next* scoring pass, so no need to
    // recompute the narrative here (keeps this call fast).
    // Sanity guard: a cached narrative claiming a 0/100 formula score while
    // the real composite is above zero (or "no activity" when tasks completed
    // exist) was generated from an empty snapshot — discard it and refetch.
    const composite = Math.round(Number(perfData.composite) || 0);
    const completed = Number(perfData.details?.taskCompleted ?? perfData.details?.task_completed) || 0;
    const stale = _isStaleNarrative(cached?.narrative, composite, completed, cached?.composite);
    if (stale) {
        try { localStorage.removeItem(cacheKey); } catch {}
    }

    if (cached?.narrative && !stale) {
        // Autonomous re-check: regenerate only when the underlying data
        // actually changed, the min gap since the last check has passed, AND
        // today's update budget isn't exhausted. Otherwise serve the cache.
        const runs = _aiRuns(user.id);
        const changed = cached.fp !== _perfFingerprint(perfData);
        const spaced = Date.now() - runs.lastAt >= AI_UPDATE_MIN_GAP_MS;
        const canUpdate = changed && spaced && runs.count < AI_MAX_UPDATES_PER_DAY;
        if (!canUpdate) {
            return { narrative: cached.narrative, aiScore: _clampAiScore(cached.aiScore ?? null, composite), scoreReason: cached.scoreReason || '', fromCache: true, classified, model: cached.model };
        }
        console.info(`[PerfAI] autonomous re-check ${runs.count + 1}/${AI_MAX_UPDATES_PER_DAY}: data changed since last run`);
    }

    // We are regenerating (first run, autonomous update, stale repair, or a
    // manual Refresh) — count it toward today's budget. Only the autonomous
    // path above is gated by the budget; correctness repairs and explicit
    // user intent always go through.
    _aiRunsBump(user.id);

    try {
        const res = await _authedFetch({ mode: 'performance', metrics: _buildSnapshot(perfData) });
        if (res.ok) {
            const data = await res.json();
            if (data.insight) {
                const { narrative, aiScore, scoreReason } = _extractAiScore(data.insight, composite);
                // Validate the FRESH response too — a server that hasn't picked
                // up the snapshot fix still sends empty-fed narratives. Never
                // cache or show one; fall back to the client-side generator.
                if (_isStaleNarrative(narrative, composite, completed)) {
                    console.warn('[PerfAI] server narrative failed sanity check — using client-side generation');
                    const local = _localPerformanceNarrative(perfData);
                    local.aiScore = _clampAiScore(local.aiScore, composite);
                    _lsSet(cacheKey, { narrative: local.narrative, aiScore: local.aiScore, scoreReason: local.scoreReason, model: 'client-fallback', at: Date.now(), composite, fp: _perfFingerprint(perfData) });
                    return { ...local, fromCache: false, classified, model: 'client-fallback', source: 'rule-based' };
                }
                _lsSet(cacheKey, { narrative, aiScore, scoreReason, model: data.model, at: Date.now(), composite, fp: _perfFingerprint(perfData) });
                return { narrative, aiScore, scoreReason, fromCache: false, classified, model: data.model, source: data.source };
            }
        }
    } catch (e) { console.warn('[PerfAI] narrative fetch failed:', e); }
    // Server unreachable — client-side generation so the block still works
    const local = _localPerformanceNarrative(perfData);
    local.aiScore = _clampAiScore(local.aiScore, composite);
    _lsSet(cacheKey, { narrative: local.narrative, aiScore: local.aiScore, scoreReason: local.scoreReason, model: 'client-fallback', at: Date.now(), composite, fp: _perfFingerprint(perfData) });
    return { ...local, fromCache: false, classified, model: 'client-fallback', source: 'rule-based' };
}

/**
 * Is a cached narrative unfit to show?
 * @param {string|null} narrative cached text
 * @param {number} composite current formula composite
 * @param {number} completed tasks completed in the window
 * @param {number} [cachedComposite] composite the narrative was written against;
 *   when it has drifted ≥ NARRATIVE_DRIFT_POINTS from the current composite the
 *   narrative describes a score the user no longer sees.
 */
export function _isStaleNarrative(narrative, composite, completed, cachedComposite) {
    if (!narrative) return true;
    // [^\d] guard: "70/100" and "100/100" contain the substring "0/100" but
    // are real scores, not the empty-snapshot "0/100" claim we're hunting.
    if (composite > 0 && /(^|[^\d])0\s*\/\s*100/.test(narrative)) return true;
    if (completed > 0 && /no significant activity/i.test(narrative)) return true;
    if (cachedComposite != null && Number.isFinite(Number(cachedComposite))
        && Math.abs(Number(cachedComposite) - composite) >= NARRATIVE_DRIFT_POINTS) return true;
    return false;
}

/**
 * Client-side performance narrative (mirror of the server's
 * generatePerformanceFallback) — guarantees a correct, data-fed narrative
 * even when the server is mid-deploy or unreachable.
 * @param {any} perfData
 * @returns {{narrative: string, aiScore: number|null, scoreReason: string}}
 */
function _localPerformanceNarrative(perfData) {
    const dims = perfData.dimensions || {};
    const det = perfData.details || {};
    const trend = perfData.trend || [];
    const composite = Math.round(Number(perfData.composite) || 0);
    const names = { punctuality: 'Punctuality', attendance: 'Attendance', taskExecution: 'Task Execution', productivity: 'Productivity', planning: 'Planning', compliance: 'Compliance' };
    /** @type {string|null} */
    let strongest = null;
    /** @type {string|null} */
    let weakest = null;
    for (const [k, d] of Object.entries(dims)) {
        if (!strongest || d.score > dims[strongest].score) strongest = k;
        if (!weakest || d.score < dims[weakest].score) weakest = k;
    }
    const lines = [];
    lines.push(`### Fact\nYour formula score this period is ${composite}/100.`
        + (strongest && dims[strongest] ? ` Strongest: ${names[strongest]} (${dims[strongest].score}).` : '')
        + (weakest && dims[weakest] ? ` Weakest: ${names[weakest]} (${dims[weakest].score}).` : ''));
    const obs = [];
    if (det.taskPostponed > 0) obs.push(`${det.taskPostponed} postponed task(s)`);
    if (det.taskMissed > 0) obs.push(`${det.taskMissed} missed task(s)`);
    if (det.lateDays > 0) obs.push(`${det.lateDays} late day(s)`);
    if (det.taskCompleted > 0) obs.push(`${det.taskCompleted} completed task(s)`);
    if (Number(det.extraHours) > 0) obs.push(`${det.extraHours}h extra hours`);
    lines.push(`### Observation\n${obs.length > 0 ? `This period shows: ${obs.join(', ')}.` : 'No significant activity signals this period.'}`);
    if (trend.length >= 2) {
        const diff = trend[trend.length - 1].score - trend[trend.length - 2].score;
        lines.push(`### Prediction\n${diff > 3 ? 'Your trend is improving — keep the current pace.' : diff < -3 ? 'Your trend is declining — the next period may drop further without changes.' : 'Your trend is stable — expect a similar score next period.'}`);
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
    if (det.taskCompleted > 0 && !det.taskPostponed && !det.taskMissed) aiScore += 3;
    if (det.taskPostponed > 2) aiScore -= 2;
    if (det.taskMissed > 2) aiScore -= 3;
    if (Number(det.extraHours) >= 2) aiScore += 2;
    if (!det.lateDays && det.totalDays > 0) aiScore += 1;
    aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));
    const reason = aiScore > composite ? 'context behind the numbers is favorable' : aiScore < composite ? 'pending work and signals outweigh the raw formula' : 'formula already reflects the situation fairly';
    return { narrative: lines.join('\n\n'), aiScore, scoreReason: reason };
}

/**
 * Clamp an AI re-evaluated score: always 0–100, and within
 * ±AI_SCORE_MAX_DELTA of the deterministic composite when one is provided.
 * Returns null for missing/non-numeric scores.
 */
export function _clampAiScore(score, composite) {
    if (score == null || !Number.isFinite(Number(score))) return null;
    let s = Math.max(0, Math.min(100, Math.round(Number(score))));
    const c = Number(composite);
    if (Number.isFinite(c)) {
        const lo = Math.max(0, c - AI_SCORE_MAX_DELTA);
        const hi = Math.min(100, c + AI_SCORE_MAX_DELTA);
        s = Math.max(lo, Math.min(hi, s));
    }
    return s;
}

/**
 * Split the trailing "AI Score: <n> — <reason>" line off the narrative.
 * Returns { narrative, aiScore, scoreReason }. When `composite` is given,
 * the extracted score is bounded to ±AI_SCORE_MAX_DELTA around it.
 */
export function _extractAiScore(text, composite) {
    const s = String(text || '');
    const m = s.match(/AI\s*Score\s*:\s*(\d{1,3})\s*[—–-]?\s*([^\n]*)/i);
    if (!m) return { narrative: s.trim(), aiScore: null, scoreReason: '' };
    const score = _clampAiScore(Number(m[1]), composite);
    return { narrative: s.slice(0, m.index).trim(), aiScore: score, scoreReason: (m[2] || '').trim() };
}

/** Force a fresh narrative (Refresh button) — ignores today's cache. */
export async function refreshPerformanceAI(perfData, periodKey = 'week') {
    const user = _user();
    if (!user || !perfData) return { narrative: null, fromCache: false, classified: 0 };
    const cacheKey = `${CACHE_PREFIX}${user.id}_${_today()}_${periodKey}`;
    try { localStorage.removeItem(cacheKey); } catch {}
    return runDailyPerformanceAI(perfData, periodKey);
}

export function getTodaysCachedNarrative(periodKey = 'week') {
    const user = _user();
    if (!user) return null;
    const cached = _lsGet(`${CACHE_PREFIX}${user.id}_${_today()}_${periodKey}`);
    return cached?.narrative || null;
}

export function getTodaysCachedAiScore(periodKey = 'week', composite = null) {
    const user = _user();
    if (!user) return null;
    const cached = _lsGet(`${CACHE_PREFIX}${user.id}_${_today()}_${periodKey}`);
    if (cached?.aiScore == null) return null;
    const score = _clampAiScore(cached.aiScore, composite);
    return score != null ? { score, reason: cached.scoreReason || '' } : null;
}
