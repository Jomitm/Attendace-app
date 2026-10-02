// js/ui/ai-center.js
// AI Center page — personal, proactive, role-aware assistant (modern, multicolour charts)

import { safeHtml, formatLabeledInsight, postStream, pcGateHtml, quotaNoticeHtml } from './helpers.js';
import { parseAddTaskIntent, parseCompleteIntent, executeAddTask, executeCompleteTask, fetchToolPlan, executeToolPlan } from '../modules/ai-actions.js';
import { getHistory, addExchange, clearChat, sanitizeForServer } from '../modules/ai-chat-memory.js';

const AI_CENTER_ID = 'ai-center-container';
const AI_QUESTION_ID = 'ai-question-input';
const AI_CHAT_THREAD_ID = 'ai-chat-thread';
let _aiCharts = [];
// One-click gate: the personal check stays behind a question button until the
// user clicks it once this session; later visits/refreshes show it directly.
let _pcRevealed = false;

export async function renderAICenter() {
    const user = window.AppAuth?.getUser();
    if (!user) return '<div class="card">Please log in.</div>';

    return `
        <div id="${AI_CENTER_ID}" class="card" style="max-width:960px;margin:0 auto;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:6px;">
                <h2 style="margin:0; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-wand-magic-sparkles" style="color:#4f46e5;"></i> CRWI Assistant</h2>
                <span style="font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#4f46e5; background:#eef2ff; border:1px solid #c7d2fe; padding:4px 8px; border-radius:999px;">Personal · ${safeHtml(user.role||'staff')}</span>
            </div>
            <p style="color:#64748b;margin:0 0 18px;font-size:13px; line-height:1.5;">
                Your personal helper — finds what you missed, what’s overdue, and what to do next. Role-aware, evidence-tagged, actionable. Also available as floating <i class="fa-solid fa-wand-magic-sparkles"></i> button on any page.
            </p>

            <!-- What you missed today (personal, proactive) -->
            <div style="margin-bottom:20px;">
                <h3 style="font-size:15px; font-weight:800; color:#0f172a; margin:0 0 10px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-circle-exclamation" style="color:#ef4444;"></i> What you missed today</h3>
                <div id="ai-my-issues" style="display:grid; gap:10px;">
                    ${_pcRevealed
                        ? '<div style="color:#94a3b8; font-size:13px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px; padding:14px; text-align:center;">Loading personal check…</div>'
                        : pcGateHtml()}
                </div>
            </div>

            <!-- Quick Stats -->
            <div id="ai-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
                <div class="ai-stat-card" style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center; border:1px solid #e2e8f0;">
                    <div style="font-size:26px;font-weight:800;color:#0f172a;" id="ai-stat-present">--</div>
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em; font-weight:700;">Present Today</div>
                </div>
                <div class="ai-stat-card" style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center; border:1px solid #e2e8f0;">
                    <div style="font-size:26px;font-weight:800;color:#0f172a;" id="ai-stat-late">--</div>
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em; font-weight:700;">Late Today</div>
                </div>
                <div class="ai-stat-card" style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center; border:1px solid #e2e8f0;">
                    <div style="font-size:26px;font-weight:800;color:#0f172a;" id="ai-stat-pending-leaves">--</div>
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em; font-weight:700;">Pending Leaves</div>
                </div>
                <div class="ai-stat-card" style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center; border:1px solid #e2e8f0;">
                    <div style="font-size:26px;font-weight:800;color:#0f172a;" id="ai-stat-task-rate">--</div>
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em; font-weight:700;">Task Completion</div>
                </div>
            </div>

            <!-- Snapshot Charts (modern, multicolour) -->
            <div style="margin-bottom:20px;">
                <h3 style="font-size:15px; font-weight:800; color:#0f172a; margin:0 0 10px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-chart-pie" style="color:#06b6d4;"></i> Team snapshot</h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
                        <h4 style="font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#64748b; margin:0 0 8px;">Today — Attendance</h4>
                        <canvas id="ai-center-att-chart" width="220" height="220" style="max-height:200px;"></canvas>
                        <div id="ai-center-att-legend" style="font-size:11px; color:#64748b; text-align:center; margin-top:6px;"></div>
                    </div>
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
                        <h4 style="font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#64748b; margin:0 0 8px;">Tasks — This Month</h4>
                        <canvas id="ai-center-task-chart" width="220" height="220" style="max-height:200px;"></canvas>
                        <div id="ai-center-task-legend" style="font-size:11px; color:#64748b; text-align:center; margin-top:6px;"></div>
                    </div>
                </div>
                <div style="font-size:11px; color:#94a3b8; margin-top:6px;">Full 7-day trend lives on Dashboard — this is your concise today + monthly mix.</div>
            </div>

            <!-- AI Insights (evidence-labeled, actionable) -->
            <div style="margin-bottom:20px;">
                <h3 style="font-size:15px; font-weight:800; color:#0f172a; margin:0 0 10px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-lightbulb" style="color:#eab308;"></i> Insights for you</h3>
                <button onclick="window._aiCenterGenerateInsights()" 
                    style="padding:8px 16px;background:#4f46e5;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700; box-shadow:0 4px 12px rgba(79,70,229,.25);">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Insights
                </button>
                <div style="font-size:11px; color:#94a3b8; margin-top:6px;">The summary is added to the chat below, so follow-up questions keep the context.</div>
            </div>

            <!-- Ask a Question (personal Q&A with session memory) -->
            <div>
                <h3 style="font-size:15px; font-weight:800; color:#0f172a; margin:0 0 10px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-comments" style="color:#4f46e5;"></i> Ask your assistant</h3>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
                    <div style="font-size:11px; color:#94a3b8;"><i class="fa-solid fa-brain" style="color:#4f46e5;"></i> Chat memory on — the assistant remembers this conversation, so follow-ups like "what about yesterday?" work.</div>
                    <button id="ai-chat-clear" onclick="window._aiCenterClearChat()" title="Clear conversation memory"
                        style="flex-shrink:0; padding:5px 10px; border-radius:8px; border:1px solid #e2e8f0; background:#fff; font-size:11px; font-weight:700; color:#64748b; cursor:pointer;">
                        <i class="fa-solid fa-broom"></i> Clear chat
                    </button>
                </div>
                <div id="${AI_CHAT_THREAD_ID}" class="ai-chat-thread"></div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin:8px 0;">
                    <button class="ai-chip" data-q="What did I miss today?" style="padding:6px 10px; border-radius:999px; border:1px solid #e2e8f0; background:#fff; font-size:11px; font-weight:600; color:#475569; cursor:pointer;" onclick="document.getElementById('${AI_QUESTION_ID}').value=this.getAttribute('data-q'); window._aiCenterAskQuestion();">What did I miss?</button>
                    <button class="ai-chip" data-q="Show overdue tasks" style="padding:6px 10px; border-radius:999px; border:1px solid #e2e8f0; background:#fff; font-size:11px; font-weight:600; color:#475569; cursor:pointer;" onclick="document.getElementById('${AI_QUESTION_ID}').value=this.getAttribute('data-q'); window._aiCenterAskQuestion();">Overdue tasks?</button>
                    <button class="ai-chip" data-q="Am I on track this month?" style="padding:6px 10px; border-radius:999px; border:1px solid #e2e8f0; background:#fff; font-size:11px; font-weight:600; color:#475569; cursor:pointer;" onclick="document.getElementById('${AI_QUESTION_ID}').value=this.getAttribute('data-q'); window._aiCenterAskQuestion();">Am I on track?</button>
                </div>
                <div style="display:flex;gap:8px;">
                    <input id="${AI_QUESTION_ID}" type="text" placeholder="e.g. Why was I marked late yesterday? What should I do next?"
                        style="flex:1;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;" />
                    <button onclick="window._aiCenterAskQuestion()"
                        style="padding:10px 16px;background:#0f172a;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;">
                        Ask
                    </button>
                </div>
                <div style="font-size:11px; color:#94a3b8; margin-top:6px;">Answers are personal to your role, attendance, tasks and CRWI policies — with <strong>Fact / Observation / Prediction / Recommendation</strong> labels.</div>
            </div>
        </div>
    `;
}

export async function initAICenter() {
    console.log('[AICenter] initAICenter — AppMetricsService:', !!window.AppMetricsService);
    renderChatThread();
    document.getElementById('ai-my-issues')?.querySelector('[data-pc-run]')
        ?.addEventListener('click', runPersonalCheck);
    await refreshAICenter();
}

export async function refreshAICenter() {
    if (_pcRevealed) {
        await Promise.all([loadStats(), loadPersonal(), loadSnapshotCharts()]);
    } else {
        await Promise.all([loadStats(), loadSnapshotCharts()]);
    }
}

// One-click personal check: fetch + render the evidence cards on demand.
async function runPersonalCheck() {
    _pcRevealed = true;
    const el = document.getElementById('ai-my-issues');
    if (el) el.innerHTML = '<div style="color:#94a3b8; font-size:13px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px; padding:14px; text-align:center;">Checking your attendance and tasks…</div>';
    await loadPersonal();
}

// Post-action refreshes only reload the check once it has been revealed —
// otherwise they would bypass the gate and dump the result unprompted.
function refreshPersonal() {
    return _pcRevealed ? loadPersonal() : Promise.resolve();
}

// ── Chat thread rendering ───────────────────────────────────
function renderChatThread() {
    const thread = document.getElementById(AI_CHAT_THREAD_ID);
    if (!thread) return;
    const history = getHistory();
    if (history.length === 0) {
        thread.innerHTML = `<div class="ai-chat-empty">Hi! Ask me anything about your attendance, tasks or leaves — I'll remember what we discuss.</div>`;
        return;
    }
    thread.innerHTML = history.map(m => _chatBubble(m.role, m.content)).join('');
    thread.scrollTop = thread.scrollHeight;
}

function _chatBubble(role, content) {
    const isUser = role === 'user';
    return `<div class="ai-chat-msg ${isUser ? 'ai-chat-msg--user' : 'ai-chat-msg--ai'}">
        <div class="ai-chat-msg__avatar"><i class="fa-solid ${isUser ? 'fa-user' : 'fa-wand-magic-sparkles'}"></i></div>
        <div class="ai-chat-msg__bubble">${isUser ? safeHtml(content) : formatLabeledInsight(content)}</div>
    </div>`;
}

function _appendUserMsg(text) {
    const thread = document.getElementById(AI_CHAT_THREAD_ID);
    if (!thread) return;
    thread.querySelectorAll('.ai-chat-empty').forEach(e => e.remove());
    thread.insertAdjacentHTML('beforeend', _chatBubble('user', text));
    thread.scrollTop = thread.scrollHeight;
}

function _appendAiHtml(html) {
    const thread = document.getElementById(AI_CHAT_THREAD_ID);
    if (!thread) return;
    thread.insertAdjacentHTML('beforeend', `<div class="ai-chat-msg ai-chat-msg--ai">
        <div class="ai-chat-msg__avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
        <div class="ai-chat-msg__bubble">${html}</div>
    </div>`);
    thread.scrollTop = thread.scrollHeight;
    return thread.lastElementChild?.querySelector('.ai-chat-msg__bubble');
}

function _appendThinking() {
    const bubble = _appendAiHtml('<span class="ai-chat-typing"><span></span><span></span><span></span></span>');
    return bubble;
}

function _finalizeAiBubble(bubble, answer, source) {
    if (!bubble) return;
    bubble.innerHTML = formatLabeledInsight(answer)
        + (source === 'ai'
            ? '<span class="ai-chat-src">Powered by AI — personal to your role & data</span>'
            : '<span class="ai-chat-src">Offline — AI provider unavailable, showing quick local answers</span>');
    const thread = document.getElementById(AI_CHAT_THREAD_ID);
    if (thread) thread.scrollTop = thread.scrollHeight;
}

function _finalizeAiRawHtml(bubble, html) {
    if (!bubble) return;
    bubble.innerHTML = html;
    const thread = document.getElementById(AI_CHAT_THREAD_ID);
    if (thread) thread.scrollTop = thread.scrollHeight;
}

export function clearChatUi() {
    clearChat();
    renderChatThread();
}

async function _fetchAiAnswer(ctx, question) {
    try {
        const token = await window.AppFirebaseAuth?.currentUser?.getIdToken?.() || '';
        const response = await fetch('/api/ai-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: JSON.stringify({ metrics: ctx, question, history: sanitizeForServer(getHistory()) })
        });
        if (response.status === 429) {
            // Daily question limit — rethrow so callers show the notice
            // instead of silently degrading to a local answer.
            const err = new Error('daily_limit');
            err.status = 429;
            try { err.body = await response.json(); } catch { /* default notice */ }
            throw err;
        }
        if (response.ok) {
            const data = await response.json();
            if (data.insight) return { answer: data.insight, source: data.source === 'ai' ? 'ai' : 'local' };
        }
    } catch (e) {
        if (e && e.status === 429) throw e;
        /* fall through to local */
    }
    return null;
}

async function loadStats() {
    try {
        const metrics = window.AppMetricsService;
        if (!metrics) { console.warn('[AICenter] loadStats: AppMetricsService not available'); return; }
        const user = window.AppAuth?.getUser?.();
        const isPriv = !!user && (String(user.role).toLowerCase()==='admin' || String(user.role).toLowerCase()==='administrator' || user.isAdmin===true);
        const today = _today();
        const monthStart = _monthStart();
        if (isPriv) {
            const [todaySummary, pendingLeaves, taskMetrics] = await Promise.all([
                metrics.getAttendanceSummary(today, today),
                metrics.getPendingLeaveCount(),
                metrics.getTaskMetrics(monthStart, today)
            ]);
            _setStat('ai-stat-present', todaySummary.present || 0);
            _setStat('ai-stat-late', todaySummary.late || 0);
            _setStat('ai-stat-pending-leaves', pendingLeaves || 0);
            _setStat('ai-stat-task-rate', (taskMetrics.completionRate || '0') + '%');
            const grid = document.getElementById('ai-stats-grid');
            if (grid) grid.setAttribute('data-scope','team');
        } else {
            const ctx = await metrics.getMyPersonalContext().catch(()=>null);
            const myAtt = ctx?.myAttendanceSummary || { present:0, late:0 };
            const myLeavePending = (() => {
                const byType = ctx?.myLeave?.byType || {};
                let c=0; for (const k of Object.keys(byType)) c+= Number(byType[k]?.pending||0);
                return c;
            })();
            const rate = ctx?.taskMetrics?.completionRate || '0';
            // For personal "Present Today" -> 1 if checked in (users.status=in) else 0; use my att present
            const isIn = String(window.AppAuth?.getUser?.()?.status||'').toLowerCase()==='in' && ctx?.myAttendanceSummary?.present>0;
            // Fallback: check users.status directly
            let presentVal = isIn ? 1 : (myAtt.present>0?1:0);
            try {
                const fresh = await window.AppDB?.get('users', user.id);
                if (String(fresh?.status).toLowerCase()==='in') {
                    const ms = Number(fresh.lastCheckIn)||0;
                    const d = ms? new Date(ms):null;
                    const lastDate = d? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:null;
                    if (lastDate===today) presentVal = 1;
                }
            } catch {}
            _setStat('ai-stat-present', presentVal ? 'Yes' : 'No');
            _setStat('ai-stat-late', myAtt.late || 0);
            _setStat('ai-stat-pending-leaves', myLeavePending);
            _setStat('ai-stat-task-rate', rate + '%');
            // Relabel cards for personal scope
            const labels = document.querySelectorAll('#ai-stats-grid .ai-stat-card div:last-child');
            if (labels[0]) labels[0].textContent = 'My Status Today';
            if (labels[1]) labels[1].textContent = 'My Late Days';
            if (labels[2]) labels[2].textContent = 'My Pending Leaves';
            if (labels[3]) labels[3].textContent = 'My Tasks Done';
            const grid = document.getElementById('ai-stats-grid');
            if (grid) grid.setAttribute('data-scope','personal');
        }
    } catch (err) {
        console.warn('AI Center: failed to load stats', err);
    }
}

async function loadPersonal() {
    const container = document.getElementById('ai-my-issues');
    if (!container) return;
    try {
        const metrics = window.AppMetricsService;
        if (!metrics?.getMyIssues) { container.innerHTML = '<div style="color:#94a3b8; font-size:13px;">Assistant unavailable.</div>'; return; }
        const issues = await metrics.getMyIssues();
        if (!issues || issues.length === 0) {
            container.innerHTML = '<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px; text-align:center; color:#14532d; font-size:13px; font-weight:600;">✅ All caught up — no missed attendance or overdue tasks for today.</div>';
            return;
        }
        container.innerHTML = issues.map(it => {
            const sev = String(it.severity||'medium');
            const border = sev==='high' ? '#ef4444' : sev==='medium' ? '#eab308' : '#22c55e';
            const badgeBg = sev==='high' ? '#fef2f2' : sev==='medium' ? '#fefce8' : '#f0fdf4';
            const badgeFg = sev==='high' ? '#ef4444' : sev==='medium' ? '#a16207' : '#14532d';
            return `
                <div style="background:#fff; border:1px solid #e2e8f0; border-left:4px solid ${border}; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <div style="font-weight:800; font-size:13px; color:#0f172a;">${safeHtml(it.title)}</div>
                        <span style="font-size:10px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:2px 6px; border-radius:999px; background:${badgeBg}; color:${badgeFg};">${safeHtml(sev)}</span>
                    </div>
                    <div style="font-size:13px; color:#475569; line-height:1.5;">${safeHtml(it.detail)}</div>
                    <div style="display:grid; gap:6px; margin-top:2px;">
                        <div style="font-size:12px; line-height:1.5; padding:6px 8px; border-radius:8px; background:#f0f9ff; border:1px solid #bae6fd; color:#0c4a6e;"><strong>Fact:</strong> ${safeHtml(it.fact||'')}</div>
                        <div style="font-size:12px; line-height:1.5; padding:6px 8px; border-radius:8px; background:#fefce8; border:1px solid #fde68a; color:#713f12;"><strong>Observation:</strong> ${safeHtml(it.observation||'')}</div>
                        <div style="font-size:12px; line-height:1.5; padding:6px 8px; border-radius:8px; background:#fdf2f8; border:1px solid #fbcfe8; color:#831843;"><strong>Prediction:</strong> ${safeHtml(it.prediction||'')}</div>
                        <div style="font-size:12px; line-height:1.5; padding:6px 8px; border-radius:8px; background:#f0fdf4; border:1px solid #bbf7d0; color:#14532d; font-weight:600;"><strong>Recommendation:</strong> ${safeHtml(it.recommendation||'')}</div>
                    </div>
                    <button onclick="window._aiCenterHandleIssueAction('${safeHtml(it.id)}')" style="align-self:flex-start; margin-top:2px; padding:7px 12px; border-radius:8px; border:none; font-size:12px; font-weight:700; cursor:pointer; background:#0f172a; color:#fff;">${safeHtml(it.actionLabel||'Take action')} →</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.warn('[AICenter] loadPersonal', e);
        container.innerHTML = `<div style="color:#ef4444; font-size:13px;">Failed to load personal check: ${safeHtml(e.message)}</div>`;
    }
}

function _triggerAttendanceFromCenter() {
    const btn = document.getElementById('attendance-btn');
    if (btn) { btn.click(); return; }
    location.hash = '#dashboard';
    setTimeout(() => document.getElementById('attendance-btn')?.click(), 400);
}
function _actionForIssue(id) {
    return (window.AppMetricsService?.getMyIssues?.().then(issues => issues.find(x=>x.id===id)).then(it => {
        if (!it) return;
        const a = String(it.action||'').toLowerCase();
        if (a==='checkin' || a==='checkout') return _triggerAttendanceFromCenter();
        else if (a==='view-tasks' || a==='open-day-plan') location.hash='#kanban';
        else if (a==='review-attendance') location.hash='#timesheet';
        else if (a==='view-policy') location.hash='#policies';
        else location.hash='#dashboard';
    }));
}

async function loadSnapshotCharts() {
    try {
        const metrics = window.AppMetricsService;
        if (!metrics) return;
        const user = window.AppAuth?.getUser?.();
        const isPriv = !!user && (String(user.role).toLowerCase()==='admin' || String(user.role).toLowerCase()==='administrator' || user.isAdmin===true);
        const today = _today();
        const monthStart = _monthStart();
        let todaySum, taskMetrics;
        let attTitle = 'Today — Attendance';
        let taskTitle = 'Tasks — This Month';
        if (isPriv) {
            [todaySum, taskMetrics] = await Promise.all([
                metrics.getAttendanceSummary(today, today),
                metrics.getTaskMetrics(monthStart, today)
            ]);
            attTitle = 'Today — Team Attendance';
            taskTitle = 'Team Tasks — This Month';
        } else {
            const ctx = await metrics.getMyPersonalContext().catch(()=>null);
            todaySum = ctx?.myAttendanceSummary || { present:0, late:0, absent:0 };
            // For personal attendance donut, show present vs absent days this month (from my summary)
            // If monthly data not available, fallback to today binary
            if (!todaySum || (todaySum.total===0 && !ctx?.myAttendance)) {
                // use my attendance summary monthly for donut if available
                todaySum = ctx?.myAttendanceSummary || todaySum;
            }
            taskMetrics = ctx?.taskMetrics || { total:0, completed:0, inProgress:0 };
            attTitle = 'My Attendance — This Month';
            taskTitle = 'My Tasks — This Month';
        }
        // Update headings for scope
        const attH4 = document.querySelector('#ai-center-att-chart')?.closest('div')?.querySelector('h4');
        const taskH4 = document.querySelector('#ai-center-task-chart')?.closest('div')?.querySelector('h4');
        if (attH4) attH4.textContent = attTitle;
        if (taskH4) taskH4.textContent = taskTitle;

        for (const c of _aiCharts) try{c.destroy();}catch{}
        _aiCharts = [];
        if (typeof window.Chart === 'undefined') { console.warn('[AICenter] Chart.js not loaded'); return; }
        const attEl = document.getElementById('ai-center-att-chart');
        const taskEl = document.getElementById('ai-center-task-chart');
        const present = Number(todaySum.present||0), late=Number(todaySum.late||0), absent=Number(todaySum.absent||0);
        const total = Number(taskMetrics.total||0), completed=Number(taskMetrics.completed||0), inProg=Number(taskMetrics.inProgress||0);
        const pending = Math.max(0, total - completed - inProg);
        if (attEl) {
            const hasData = (present+late+absent) > 0;
            const c = new window.Chart(attEl, {
                type: 'doughnut',
                data: { labels: hasData? ['Present','Late','Absent'] : ['No data'], datasets:[{ data: hasData? [present,late,absent] : [1], backgroundColor: hasData? ['#22c55e','#eab308','#ef4444'] : ['#e2e8f0'], borderWidth:0, hoverOffset: hasData?6:0 }] },
                options: { cutout:'62%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{size:11} } } } }
            });
            _aiCharts.push(c);
            const leg = document.getElementById('ai-center-att-legend');
            if (leg) leg.textContent = hasData ? `Present ${present} · Late ${late} · Absent ${absent}` : 'No attendance yet this month';
        }
        if (taskEl) {
            const hasT = total>0;
            const c2 = new window.Chart(taskEl, {
                type: 'doughnut',
                data: { labels: hasT? ['Completed','In Process','Pending'] : ['No tasks'], datasets:[{ data: hasT? [completed,inProg,pending] : [1], backgroundColor: hasT? ['#22c55e','#06b6d4','#94a3b8'] : ['#e2e8f0'], borderWidth:0, hoverOffset: hasT?6:0 }] },
                options: { cutout:'62%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{size:11} } } } }
            });
            _aiCharts.push(c2);
            const leg2 = document.getElementById('ai-center-task-legend');
            if (leg2) leg2.textContent = hasT ? `${completed} done · ${inProg} in-process · ${pending} pending` : 'No tasks this month';
        }
    } catch (e) { console.warn('[AICenter] loadSnapshotCharts', e); }
}

async function generateInsights() {
    const metrics = window.AppMetricsService;
    if (!metrics) return;
    _appendUserMsg('Generate my insights');
    const bubble = _appendThinking();
    try {
        const ctx = metrics?.getMyPersonalContext ? await metrics.getMyPersonalContext() : await metrics.getAICenterMetrics();
        let insight = '';
        let source = 'local';
        const fetched = await _fetchAiAnswer(ctx, null);
        if (fetched) {
            insight = fetched.answer;
            source = fetched.source;
        } else {
            insight = _generateLocalInsight(ctx);
            source = 'local';
        }
        _finalizeAiBubble(bubble, insight, source);
        addExchange('Generate my insights', insight);
    } catch (err) {
        _finalizeAiRawHtml(bubble, '<span style="color:#ef4444;">Error: ' + safeHtml(err.message) + '</span>');
    }
}

async function askQuestion() {
    const input = document.getElementById(AI_QUESTION_ID);
    if (!input) return;
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    _appendUserMsg(question);
    // Plain-text add/complete intercept — handles "can you add a task for me for tomorrow" even with politeness + missing name
    const addIntent = parseAddTaskIntent(question);
    if (addIntent) {
        if (addIntent.isMissingTask || !addIntent.task) {
            const bubble = _appendAiHtml(`<div style="font-weight:800; color:#713f12;">What task should I add for ${safeHtml(addIntent.datePhrase)} (${safeHtml(addIntent.date)})?</div>
                <input id="ai-center-missing-task-input" type="text" placeholder="e.g. Prepare report" style="width:100%; margin-top:8px; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px;" />
                <div style="margin-top:8px; display:flex; gap:8px;">
                  <button id="ai-center-confirm-add-missing" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Add task</button>
                  <button id="ai-center-cancel-add-missing" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
                </div>`);
            bubble?.closest('.ai-chat-msg')?.classList.add('ai-chat-msg--wide');
            const output = bubble;
            setTimeout(()=>{
                const inp=document.getElementById('ai-center-missing-task-input');
                const c=document.getElementById('ai-center-confirm-add-missing');
                const x=document.getElementById('ai-center-cancel-add-missing');
                if(inp) inp.focus();
                const doAdd=async()=>{
                    const t=inp?.value?.trim()||'';
                    if(!t){ inp.style.borderColor='#ef4444'; return; }
                    c.textContent='Adding…'; c.disabled=true;
                    try{
                        const r=await executeAddTask({task:t, date:addIntent.date});
                        output.innerHTML=`<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;"><div style="font-weight:800;">✅ Added!</div><div>"${safeHtml(r.task)}" added for ${safeHtml(r.date)}.</div></div>`;
                        await Promise.all([refreshPersonal(), loadSnapshotCharts(), loadStats()]);
                    }catch(e){ output.innerHTML=`<div style="color:#ef4444; font-size:13px;">Failed to add: ${safeHtml(e.message)}</div>`; }
                };
                if(c) c.addEventListener('click', doAdd);
                if(inp) inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doAdd(); });
                if(x) x.addEventListener('click', ()=> output.innerHTML='<span style="color:#94a3b8;">Cancelled.</span>');
            },0);
            return;
        }
        const output = _appendAiHtml(`<div style="font-weight:800; color:#0c4a6e;">Ready to add your task?</div>
            <div><strong>Task:</strong> ${safeHtml(addIntent.task)}</div>
            <div><strong>Date:</strong> ${safeHtml(addIntent.date)} (${safeHtml(addIntent.datePhrase)})</div>
            <div style="margin-top:8px; display:flex; gap:8px;">
              <button id="ai-center-confirm-add" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Add task</button>
              <button id="ai-center-cancel-add" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
            </div>`);
        setTimeout(() => {
            const c = document.getElementById('ai-center-confirm-add');
            const x = document.getElementById('ai-center-cancel-add');
            if (c) c.addEventListener('click', async () => {
                c.textContent='Adding…'; c.disabled=true;
                try {
                    const r = await executeAddTask(addIntent);
                    output.innerHTML = `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;"><div style="font-weight:800;">✅ Added!</div><div>"${safeHtml(r.task)}" added for ${safeHtml(r.date)}.</div></div>`;
                    await Promise.all([refreshPersonal(), loadSnapshotCharts(), loadStats()]);
                } catch(e){ output.innerHTML=`<div style="color:#ef4444; font-size:13px;">Failed to add: ${safeHtml(e.message)}</div>`; }
            });
            if (x) x.addEventListener('click', () => { output.innerHTML = '<span style="color:#94a3b8;">Cancelled.</span>'; });
        },0);
        return;
    }
    const compIntent = parseCompleteIntent(question);
    if (compIntent) {
        if (compIntent.isBulk) {
            const output = _appendAiHtml(`<div style="font-weight:800; color:#713f12;">Complete all overdue tasks?</div><div style="margin-top:8px; display:flex; gap:8px;"><button id="ai-center-confirm-bulk" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Yes, complete all</button><button id="ai-center-cancel-bulk" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button></div>`);
            setTimeout(()=>{
                const c=document.getElementById('ai-center-confirm-bulk');
                const x=document.getElementById('ai-center-cancel-bulk');
                if(c) c.addEventListener('click', async()=>{
                    c.textContent='Working…'; c.disabled=true;
                    try{ const r=await executeCompleteTask(compIntent); output.innerHTML=`<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;"><div style="font-weight:800;">✅ Done!</div><div>Marked ${r.completedCount} overdue task(s) as completed.</div></div>`; await Promise.all([refreshPersonal(), loadSnapshotCharts(), loadStats()]); }catch(e){ output.innerHTML=`<div style="color:#ef4444; font-size:13px;">Failed: ${safeHtml(e.message)}</div>`; }
                });
                if(x) x.addEventListener('click', ()=> output.innerHTML='<span style="color:#94a3b8;">Cancelled.</span>');
            },0);
            return;
        } else {
            const output = _appendAiHtml(`<div style="font-weight:800; color:#0c4a6e;">Mark task as done?</div><div>Task: "${safeHtml(compIntent.query)}"</div><div style="margin-top:8px; display:flex; gap:8px;"><button id="ai-center-confirm-one" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Mark done</button><button id="ai-center-cancel-one" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button></div>`);
            setTimeout(()=>{
                const c=document.getElementById('ai-center-confirm-one');
                const x=document.getElementById('ai-center-cancel-one');
                if(c) c.addEventListener('click', async()=>{
                    c.textContent='Saving…'; c.disabled=true;
                    try{ const r=await executeCompleteTask(compIntent); output.innerHTML=`<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;"><div style="font-weight:800;">✅ Completed!</div><div>"${safeHtml(r.task)}" marked as done for ${safeHtml(r.date)}.</div></div>`; await Promise.all([refreshPersonal(), loadSnapshotCharts(), loadStats()]); }catch(e){ output.innerHTML=`<div style="color:#ef4444; font-size:13px;">${safeHtml(e.message)}</div>`; }
                });
                if(x) x.addEventListener('click', ()=> output.innerHTML='<span style="color:#94a3b8;">Cancelled.</span>');
            },0);
            return;
        }
    }
    // 0) LLM tool plan — catches ANY phrasing the regex parser misses
    //    ("reschedule my report to Friday", "postpone everything today").
    //    Skipped when the regex parser already found an intent above.
    if (!addIntent && !compIntent) {
        try {
            const plan = await fetchToolPlan(question);
            if (plan && plan.action && plan.action !== 'none') {
                const desc = _describeToolPlan(plan);
                const output = _appendAiHtml(`<div style="font-weight:800; color:#0c4a6e;">Ready to do this?</div><div>${safeHtml(desc)}</div>
                    <div style="margin-top:8px; display:flex; gap:8px;">
                      <button id="ai-center-confirm-plan" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Do it</button>
                      <button id="ai-center-cancel-plan" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
                    </div>`);
                setTimeout(() => {
                    const c = document.getElementById('ai-center-confirm-plan');
                    const x = document.getElementById('ai-center-cancel-plan');
                    if (c) c.addEventListener('click', async () => {
                        c.textContent = 'Working…'; c.disabled = true;
                        try {
                            const r = await executeToolPlan(plan);
                            const msg = r.moved
                                ? `Moved ${r.count} task(s) to ${r.date}.`
                                : (r.completedCount != null ? `Marked ${r.completedCount} task(s) done.` : `"${r.task}" saved for ${r.date}.`);
                            _finalizeAiRawHtml(output, `<div style="font-weight:800; color:#14532d;">✅ Done!</div><div>${safeHtml(msg)}</div>`);
                            addExchange(question, msg);
                            await Promise.all([refreshPersonal(), loadSnapshotCharts(), loadStats()]);
                        } catch (e) {
                            _finalizeAiRawHtml(output, `<span style="color:#ef4444;">${safeHtml(e.message)}</span>`);
                        }
                    });
                    if (x) x.addEventListener('click', () => _finalizeAiRawHtml(output, '<span style="color:#94a3b8;">Cancelled.</span>'));
                }, 0);
                return;
            }
        } catch { /* fall through to Q&A */ }
    }
    const bubble = _appendThinking();
    try {
        const metrics = window.AppMetricsService;
        const ctx = metrics?.getMyPersonalContext ? await metrics.getMyPersonalContext() : await metrics.getAICenterMetrics();
        // Streaming path — render deltas as they arrive
        let limitErr = null;
        try {
            const token = await window.AppFirebaseAuth?.currentUser?.getIdToken?.() || '';
            let first = true;
            const streamed = await postStream('/api/ai-insights',
                { metrics: ctx, question, history: sanitizeForServer(getHistory()), stream: true },
                { token, onDelta: (_chunk, all) => {
                    if (first) { bubble.innerHTML = ''; first = false; }
                    bubble.innerHTML = formatLabeledInsight(all);
                    const thread = document.getElementById(AI_CHAT_THREAD_ID);
                    if (thread) thread.scrollTop = thread.scrollHeight;
                } });
            if (streamed.text && streamed.text.trim()) {
                _finalizeAiBubble(bubble, streamed.text, streamed.source === 'rule-based' ? 'local' : 'ai');
                addExchange(question, streamed.text);
                return;
            }
        } catch (e) {
            // Daily question limit — show the notice; skip fallbacks entirely.
            if (e && e.status === 429) limitErr = e;
        }
        if (limitErr) {
            _finalizeAiRawHtml(bubble, quotaNoticeHtml(limitErr));
            return;
        }
        const fetched = await _fetchAiAnswer(ctx, question);
        if (fetched) {
            _finalizeAiBubble(bubble, fetched.answer, fetched.source);
            addExchange(question, fetched.answer);
            return;
        }
        const local = _generateLocalAnswer(question, ctx);
        _finalizeAiBubble(bubble, local, 'local');
        addExchange(question, local);
    } catch (err) {
        _finalizeAiRawHtml(bubble, err && err.status === 429
            ? quotaNoticeHtml(err)
            : '<span style="color:#ef4444;">Error: ' + safeHtml(err.message) + '</span>');
    }
}

function _describeToolPlan(plan) {
    switch (plan.action) {
        case 'add_task': return `Add task "${plan.task}"${plan.date ? ` for ${plan.date}` : ' for today'}?`;
        case 'complete_task': return `Mark "${plan.query}" as done?`;
        case 'complete_overdue': return 'Mark ALL overdue tasks as done?';
        case 'postpone_task': return `Move "${plan.query}" to ${plan.date || 'tomorrow'}?`;
        default: return 'Proceed?';
    }
}

function _formatLabeled(text) {
    return formatLabeledInsight(text);
}

// Local insight generation — layman, personal, evidence-labeled
function _generateLocalInsight(ctx) {
    if (!ctx) return 'No data to show right now.';
    const lines = [];
    const user = ctx.user;
    if (user) lines.push(`### Fact\nHi ${user.name} — today is ${ctx.today}. Your role is ${user.role}.`);
    const issues = ctx.myIssues || [];
    if (issues.length > 0) {
        // strip technical source tags for layman
        const lay = s => String(s||'').replace(/\s*\(source:.*\)$/,'').trim();
        lines.push(`### Observation\nYou have ${issues.length} thing(s) left to do today: ${issues.map(i=>lay(i.title)).join(', ')}.`);
        lines.push(`### Prediction\nIf you don't clear them today, they will carry forward to tomorrow.`);
        lines.push(`### Recommendation\n${lay(issues[0].recommendation)} — tap "${issues[0].actionLabel}" on the card above.`);
    } else {
        lines.push(`### Fact\nYou have no pending check-in or overdue tasks for ${ctx.today}.`);
        lines.push(`### Observation\nYou are on track today — good job.`);
        lines.push(`### Recommendation\nJust finish today's planned tasks before you leave.`);
    }
    if (ctx.taskMetrics) {
        const { total, completed, completionRate } = ctx.taskMetrics;
        const rate = Number(completionRate)||0;
        lines.push(`### Fact\nYour tasks this month: ${completed} of ${total} done — ${rate}% complete.`);
        lines.push(`### Observation\n${rate>=70?'You are doing well — keep the same pace.':'A few tasks are still pending — try to finish 2-3 today.'}`);
    }
    return lines.join('\n\n');
}

function _generateLocalAnswer(question, ctx) {
    const q = question.toLowerCase();
    const today = ctx?.today || _today();
    const issues = ctx?.myIssues || [];
    const tasks = ctx?.myTasks || [];
    const tm = ctx?.taskMetrics || {};
    const lay = s => String(s||'').replace(/\s*\(source:.*\)$/,'').trim();
    const findIssue = id => issues.find(i => i.id === id);
    const namesOf = list => list.slice(0, 5).map(t => `"${t.task}" (${t.date})`).join(', ');

    // ── Postponed tasks ──
    if (q.includes('postpon')) {
        const pp = tasks.filter(t => t.status === 'postponed');
        if (pp.length > 0) {
            return `### Fact\nYou have ${pp.length} postponed task(s): ${namesOf(pp)}.\n### Observation\nPostponed tasks are not scheduled on any day — they wait until you re-plan them.\n### Recommendation\nOpen your day plan and move them to today or another day this week.`;
        }
        return `### Fact\nNo postponed tasks right now.\n### Observation\nNothing is waiting to be re-planned.\n### Recommendation\nKeep it up — finish today's tasks on time.`;
    }

    // ── Overdue tasks ──
    if (q.includes('overdue') || q.includes('old task') || q.includes('previous days') || q.includes('past days')) {
        const od = findIssue('task-overdue');
        if (od) {
            const odTasks = tasks.filter(t => t.bucket === 'overdue-or-postponed' && t.status !== 'postponed');
            return `### Fact\n${lay(od.fact)}${odTasks.length ? ' These are: ' + namesOf(odTasks) + '.' : ''}\n### Observation\n${lay(od.observation)}\n### Recommendation\n${lay(od.recommendation)} — tap "${od.actionLabel}" above.`;
        }
        return `### Fact\nNo overdue tasks for ${today} — good job.\n### Observation\nYour completion rate is ${tm.completionRate || '0'}% this month${tm.postponed ? `, with ${tm.postponed} postponed` : ''}.\n### Recommendation\nJust focus on today's list.`;
    }

    // ── Today's plan / task count questions ("why only one task", "my tasks") ──
    if (q.includes('today') && (q.includes('task') || q.includes('plan')) || q === 'my tasks' || q.includes('my tasks')) {
        const due = findIssue('task-due-today');
        const od = findIssue('task-overdue');
        const pp = findIssue('task-postponed');
        const parts = [];
        if (due) parts.push(`${due.count} planned for today`);
        if (od) parts.push(`${od.count} overdue`);
        if (pp) parts.push(`${pp.count} postponed from earlier days`);
        if (parts.length === 0) {
            return `### Fact\nYou have no open tasks for ${today}.\n### Observation\nYour plan is clear.\n### Recommendation\nAdd tomorrow's tasks before you leave.`;
        }
        return `### Fact\nYour task picture: ${parts.join(', ')}.\n### Observation\n${od || pp ? 'Some tasks from earlier days are still open — today\'s count alone does not show the full picture.' : "Today's plan is not finished yet."}\n### Recommendation\n${od ? 'Clear the overdue ones first, then ' : ''}${pp ? 're-plan the postponed tasks, then ' : ''}finish today's list.`;
    }

    // ── "What did I miss" / general catch-all ──
    if (q.includes('miss') || q.includes('what did i') || q.includes('left to do') || q.includes('pending')) {
        if (issues.length === 0) {
            return `### Fact\nYou have no pending check-in or overdue tasks for ${today}.\n### Observation\nYou are on track today.\n### Recommendation\nJust finish today's planned tasks before you leave.`;
        }
        const parts = issues.map(i => lay(i.title)).join('; ');
        const top = issues[0];
        return `### Fact\nYou have ${issues.length} open item(s): ${parts}.\n### Observation\n${lay(top.detail)}\n### Recommendation\nStart with "${lay(top.title)}" — ${lay(top.recommendation)}. Tap "${top.actionLabel}" above.`;
    }

    // ── Attendance / late ──
    if (q.includes('attendance') || q.includes('present') || q.includes('late')) {
        const att = ctx?.myAttendance;
        // myAttendance is null when checked in but not yet checked out (logs are
        // written on checkout). Fall back to myIssues / myAttendanceSummary which
        // do a fresh user-doc fetch.
        const isCheckedIn = att ||
            (ctx?.myAttendanceSummary?.present > 0) ||
            (ctx?.myIssues || []).some(i => i.id === 'att-checkedin-pending-checkout');
        if (isCheckedIn) return `### Fact\nYou checked in today — attendance is marked.\n### Observation\nDon't forget to check out before you leave.\n### Recommendation\nCheck out when your work is done.`;
        return `### Fact\nNo attendance marked for ${today} yet.\n### Observation\nIt will be counted as absent if you don't check in.\n### Recommendation\nPlease check in now. If you are on leave, apply for leave instead.`;
    }

    return `### Fact\nI know your attendance, ${tm.total || 0} tasks this month (${tm.completionRate || '0'}% done${tm.postponed ? `, ${tm.postponed} postponed` : ''}) for ${today}.\n### Observation\nI can break down what you missed, what's overdue, or what's postponed.\n### Recommendation\nTry asking: "Show overdue tasks", "What tasks are postponed?" or "What did I miss today?".`;
}

// Helpers
function _setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
function _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function _monthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// Expose globals for inline handlers + float
if (typeof window !== 'undefined') {
    window._aiCenterGenerateInsights = generateInsights;
    window._aiCenterAskQuestion = askQuestion;
    window._aiCenterHandleIssueAction = (id) => _actionForIssue(id);
    window._aiCenterClearChat = clearChatUi;
    window.app_refreshAICenter = refreshAICenter;
}
