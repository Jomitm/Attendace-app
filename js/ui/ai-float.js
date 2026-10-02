// js/ui/ai-float.js — Floating AI Assistant (global, modern, role-aware)
import { safeHtml, formatLabeledInsight, postStream, pcGateHtml, shouldShowFabBadge, quotaNoticeHtml } from './helpers.js';
import { parseAddTaskIntent, parseCompleteIntent, executeAddTask, executeCompleteTask, fetchToolPlan, executeToolPlan } from '../modules/ai-actions.js';
import { getHistory, addExchange, clearChat, sanitizeForServer } from '../modules/ai-chat-memory.js';

let _mounted = false;
let _panelEl = null;
let _overlayEl = null;
let _fabEl = null;
let _chartInstances = [];
// One-click gate: the personal check is hidden behind a question button until
// the user clicks it once this session; later re-renders show it directly.
let _pcRevealed = false;
// FAB badge watermark: opening the assistant acknowledges the current issue
// count; the badge re-arms only when a NEW issue pushes the count past it.
let _badgeSeen = 0;
let _lastIssueCount = 0;

function _user() { return window.AppAuth?.getUser?.() || null; }
function _isPrivileged(u) {
  const r = String(u?.role || '').toLowerCase();
  return r === 'admin' || r === 'administrator' || r === 'hr' || u?.isAdmin === true;
}

function _today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}

function _closePanel() {
  _panelEl?.classList.remove('is-open');
  _overlayEl?.classList.remove('is-open');
  document.body.style.overflow = '';
  _destroyCharts();
}

function _openPanel() {
  if (!_panelEl) return;
  _panelEl.classList.add('is-open');
  _overlayEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  // Opening the assistant "reads" the badge — acknowledge the count seen so
  // far and hide it immediately (it re-arms only when the count grows).
  _badgeSeen = Math.max(_badgeSeen, _lastIssueCount);
  _syncFabBadgeDom(_lastIssueCount);
  // lazy load content when opened
  _renderPanelContent().catch(e => console.warn('[AIFloat] render', e));
}

function _destroyCharts() {
  for (const c of _chartInstances) try { c.destroy(); } catch {}
  _chartInstances = [];
}

function _triggerAttendance() {
  _closePanel();
  // Dashboard attendance button handles both check-in/out with location + modals (js/app.js:7013 handleAttendance)
  const btn = document.getElementById('attendance-btn');
  if (btn) { btn.click(); return true; }
  // fallback: navigate to dashboard where button exists
  location.hash = '#dashboard';
  setTimeout(() => document.getElementById('attendance-btn')?.click(), 400);
  return true;
}
function _actionFor(issue) {
  const a = String(issue.action || '').toLowerCase();
  if (a === 'checkin' || a === 'checkout') return () => _triggerAttendance();
  if (a === 'view-tasks' || a === 'open-day-plan') return () => { location.hash = '#kanban'; _closePanel(); };
  if (a === 'review-attendance') return () => { location.hash = '#timesheet'; _closePanel(); };
  if (a === 'view-policy') return () => { location.hash = '#policies'; _closePanel(); };
  return () => { location.hash = '#dashboard'; _closePanel(); };
}

function _pcResultsHtml(issues) {
  if (!issues || issues.length === 0) {
    return '<div class="ai-empty">✅ All caught up — no missed attendance or overdue tasks for today.</div>';
  }
  return issues.map(it => `
    <div class="ai-issue ai-issue--${safeHtml(it.severity||'medium')}">
      <div class="ai-issue__head">
        <div class="ai-issue__title">${safeHtml(it.title)}</div>
        <span class="ai-issue__badge">${safeHtml(it.severity)}</span>
      </div>
      <div class="ai-issue__detail">${safeHtml(it.detail)}</div>
      <div class="ai-issue__evidence">
        <div class="fact"><strong>Fact:</strong> ${safeHtml(it.fact||'')}</div>
        <div class="obs"><strong>Observation:</strong> ${safeHtml(it.observation||'')}</div>
        <div class="pred"><strong>Prediction:</strong> ${safeHtml(it.prediction||'')}</div>
        <div class="rec"><strong>Recommendation:</strong> ${safeHtml(it.recommendation||'')}</div>
      </div>
      <button class="ai-issue__cta" data-issue-action="${safeHtml(it.id)}">${safeHtml(it.actionLabel||'Take action')} →</button>
    </div>
  `).join('');
}

function _wirePcCtas(root, issues) {
  if (!issues || issues.length === 0) return;
  for (const it of issues) {
    const btn = root.querySelector(`[data-issue-action="${CSS.escape(it.id)}"]`);
    if (btn) btn.addEventListener('click', _actionFor(it));
  }
}

async function _renderPanelContent() {
  const body = _panelEl?.querySelector('.ai-panel__body');
  if (!body) return;
  const user = _user();
  if (!user) {
    body.innerHTML = '<div class="ai-empty">Please log in to use CRWI Assistant.</div>';
    return;
  }
  body.innerHTML = '<div class="ai-empty">Loading your personal snapshot…</div>';
  try {
    const metrics = window.AppMetricsService;
    if (!metrics) throw new Error('Metrics unavailable');
    const [issues, ctx, todaySum] = await Promise.all([
      _pcRevealed ? metrics.getMyIssues().catch(()=>[]) : Promise.resolve(null),
      metrics.getMyPersonalContext().catch(()=>null),
      metrics.getAttendanceSummary(_today(), _today()).catch(()=>({present:0, absent:0, late:0})),
    ]);
    // Personal check: one-click gate until the user asks for it this session
    const pcHtml = _pcRevealed ? _pcResultsHtml(issues) : pcGateHtml();

    // Charts data — admin sees team, staff/hr sees personal (my)
    const isPriv = _isPrivileged(user);
    let present, late, absent, totalTasks, completed, inProg, pendingTasks;
    let attLabel, taskLabel;
    if (isPriv) {
      present = Number(todaySum.present||0);
      late = Number(todaySum.late||0);
      absent = Number(todaySum.absent||0);
      totalTasks = Number(ctx?.taskMetrics?.total||0);
      completed = Number(ctx?.taskMetrics?.completed||0);
      inProg = Number(ctx?.taskMetrics?.inProgress||0);
      attLabel = 'Today — Team Attendance';
      taskLabel = `Team Tasks — ${String(_monthStart()).slice(0,7)}`;
    } else {
      const myAtt = ctx?.myAttendanceSummary || { present:0, late:0, absent:0 };
      present = Number(myAtt.present||0);
      late = Number(myAtt.late||0);
      absent = Number(myAtt.absent||0);
      totalTasks = Number(ctx?.taskMetrics?.total||0);
      completed = Number(ctx?.taskMetrics?.completed||0);
      inProg = Number(ctx?.taskMetrics?.inProgress||0);
      attLabel = 'My Attendance — This Month';
      taskLabel = `My Tasks — ${String(_monthStart()).slice(0,7)}`;
    }
    pendingTasks = Math.max(0, totalTasks - completed - inProg);

    body.innerHTML = `
      <div class="ai-card ai-card--gradient">
        <div style="display:flex; align-items:center; gap:8px; font-weight:700;"><i class="fa-solid fa-wand-magic-sparkles"></i> Hi ${safeHtml(user.name||user.username||'there')} — here's your personal check</div>
        <div style="font-size:12px; opacity:.9; margin-top:6px; line-height:1.5;">Role: ${safeHtml(user.role||'staff')} · Today: ${safeHtml(_today())}${_isPrivileged(user)?' · Team snapshot included':''}</div>
      </div>

      <div>
        <h3 style="font-size:13px; font-weight:800; color:#0f172a; margin:0 0 8px;">What you missed today</h3>
        <div id="ai-float-pc" style="display:grid; gap:10px;">${pcHtml}</div>
      </div>

      <div class="ai-charts">
        <div class="ai-chart-card">
          <h4>${safeHtml(attLabel)}</h4>
          <canvas id="ai-chart-att" width="200" height="200"></canvas>
          <div style="font-size:11px; color:#64748b; text-align:center;">${isPriv ? `Present ${present} · Late ${late} · Absent ${absent}` : `Present ${present} · Late ${late} · Absent ${absent} (my month)`}</div>
        </div>
        <div class="ai-chart-card">
          <h4>${safeHtml(taskLabel)}</h4>
          <canvas id="ai-chart-tasks" width="200" height="200"></canvas>
          <div style="font-size:11px; color:#64748b; text-align:center;">${completed} done · ${inProg} in-process · ${pendingTasks} pending ${isPriv ? '(team)' : '(my)'}</div>
        </div>
      </div>

      <div class="ai-card">
        <h3 style="font-size:13px; font-weight:800; color:#0f172a; margin:0 0 8px;">Ask your assistant</h3>
        <div class="ai-chips" style="margin-bottom:8px;">
          <button class="ai-chip" data-q="What did I miss today?">What did I miss?</button>
          <button class="ai-chip" data-q="Show overdue tasks">Overdue tasks?</button>
          <button class="ai-chip" data-q="Am I on track this month?">Am I on track?</button>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <span style="font-size:11px; color:#94a3b8;"><i class="fa-solid fa-brain" style="color:#4f46e5;"></i> Memory on — follow-ups keep context</span>
          <button id="ai-float-clear-chat" title="Clear conversation memory" style="padding:4px 8px; border-radius:8px; border:1px solid #e2e8f0; background:#fff; font-size:11px; font-weight:700; color:#64748b; cursor:pointer;"><i class="fa-solid fa-broom"></i> Clear</button>
        </div>
        <div id="ai-float-thread" class="ai-chat-thread ai-chat-thread--compact"></div>
        <div class="ai-ask" style="margin-top:8px;">
          <input id="ai-float-input" type="text" placeholder="e.g. Why was I marked late yesterday?" />
          <button id="ai-float-ask">Ask</button>
        </div>
        <div id="ai-float-response" class="ai-response" style="display:none; margin-top:10px;"></div>
      </div>

      <div style="text-align:center;">
        <a href="#ai-center" style="font-size:12px; color:#4f46e5; font-weight:600; text-decoration:none;">Open full AI Center →</a>
      </div>
    `;

    // Wire the personal-check gate (or CTAs when already revealed)
    const pcBox = body.querySelector('#ai-float-pc');
    if (!_pcRevealed) {
      pcBox?.querySelector('[data-pc-run]')?.addEventListener('click', async () => {
        _pcRevealed = true;
        pcBox.innerHTML = '<div class="ai-empty">Checking your attendance and tasks…</div>';
        try {
          const list = await metrics.getMyIssues().catch(()=>[]);
          pcBox.innerHTML = _pcResultsHtml(list);
          _wirePcCtas(body, list);
        } catch {
          pcBox.innerHTML = '<div class="ai-empty">Could not run the check — please try again.</div>';
        }
      });
    } else {
      _wirePcCtas(body, issues);
    }

    // Render charts
    _destroyCharts();
    const hasChart = typeof window.Chart !== 'undefined';
    if (hasChart) {
      const attCtx = body.querySelector('#ai-chart-att');
      if (attCtx) {
        const c = new window.Chart(attCtx, {
          type: 'doughnut',
          data: {
            labels: ['Present','Late','Absent'],
            datasets: [{ data: [present, late, absent], backgroundColor: ['#22c55e','#eab308','#ef4444'], borderWidth: 0, hoverOffset: 4 }]
          },
          options: { cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
        });
        _chartInstances.push(c);
      }
      const taskCtx = body.querySelector('#ai-chart-tasks');
      if (taskCtx) {
        const c2 = new window.Chart(taskCtx, {
          type: 'doughnut',
          data: {
            labels: ['Completed','In Process','Pending'],
            datasets: [{ data: [completed, inProg, pendingTasks], backgroundColor: ['#22c55e','#06b6d4','#94a3b8'], borderWidth: 0, hoverOffset: 4 }]
          },
          options: { cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
        });
        _chartInstances.push(c2);
      }
    }

    // Wire ask — intercept plain-text task intents before server AI (type-in dates)
    const input = body.querySelector('#ai-float-input');
    const btn = body.querySelector('#ai-float-ask');
    const resp = body.querySelector('#ai-float-response');
    const thread = body.querySelector('#ai-float-thread');
    const clearBtn = body.querySelector('#ai-float-clear-chat');

    // Restore prior conversation from session memory (shared with AI Center)
    const _restoreThread = () => {
      if (!thread) return;
      const history = getHistory();
      thread.innerHTML = history.length === 0
        ? '<div class="ai-chat-empty">Ask me anything — I&apos;ll remember our chat.</div>'
        : history.map(m => _floatBubble(m.role, m.content)).join('');
      thread.scrollTop = thread.scrollHeight;
    };
    const _appendBubble = (role, content) => {
      if (!thread) return;
      thread.querySelectorAll('.ai-chat-empty').forEach(e => e.remove());
      thread.insertAdjacentHTML('beforeend', _floatBubble(role, content));
      thread.scrollTop = thread.scrollHeight;
    };
    const _appendThinkingFloat = () => {
      const wrap = document.createElement('div');
      wrap.className = 'ai-chat-msg ai-chat-msg--ai';
      wrap.innerHTML = `<div class="ai-chat-msg__avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div><div class="ai-chat-msg__bubble"><span class="ai-chat-typing"><span></span><span></span><span></span></span></div>`;
      thread?.appendChild(wrap);
      if (thread) thread.scrollTop = thread.scrollHeight;
      return wrap.querySelector('.ai-chat-msg__bubble');
    };
    const _finalizeFloatBubble = (bubble, answer, source) => {
      if (!bubble) return;
      const note = source === 'ai' || !source
        ? ''
        : '<span class="ai-chat-src">Offline — AI provider unavailable, showing quick local answers</span>';
      bubble.innerHTML = formatLabeledInsight(answer) + note;
      if (thread) thread.scrollTop = thread.scrollHeight;
    };
    clearBtn?.addEventListener('click', () => { clearChat(); _restoreThread(); });
    _restoreThread();

    const ask = async (q) => {
      const question = (q || input.value || '').trim();
      if (!question) return;
      if (input) input.value = '';
      _appendBubble('user', safeHtml(question));
      resp.style.display = 'none';
      resp.textContent = '';
      // Confirm dialogs (add/complete task) still render in resp below the thread
      const showConfirm = (html) => { resp.style.display = 'block'; resp.innerHTML = html; };
      try {
        // 1) Plain-text task agent (add/complete) — local, layman dates: today/tomorrow/day after/Wednesday
        const addIntent = parseAddTaskIntent(question);
        if (addIntent) {
          if (addIntent.isMissingTask || !addIntent.task) {
            showConfirm(`<div style="background:#fefce8; border:1px solid #fde68a; border-radius:10px; padding:12px; font-size:13px; line-height:1.5;">
              <div style="font-weight:800; color:#713f12; margin-bottom:6px;">What task should I add for ${safeHtml(addIntent.datePhrase)} (${safeHtml(addIntent.date)})?</div>
              <input id="ai-float-missing-task-input" type="text" placeholder="e.g. Prepare report" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; margin-top:4px;" />
              <div style="margin-top:8px; display:flex; gap:8px;">
                <button id="ai-float-confirm-add-missing" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Add task</button>
                <button id="ai-float-cancel-add-missing" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
              </div>
            </div>`);
            setTimeout(() => {
              const inp = resp.querySelector('#ai-float-missing-task-input');
              const c = resp.querySelector('#ai-float-confirm-add-missing');
              const x = resp.querySelector('#ai-float-cancel-add-missing');
              if (inp) inp.focus();
              const doAdd = async () => {
                const t = inp?.value?.trim() || '';
                if (!t) { inp.style.borderColor='#ef4444'; return; }
                c.textContent='Adding…'; c.disabled=true;
                try {
                  const r = await executeAddTask({ task: t, date: addIntent.date });
                  resp.innerHTML = `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;">
                    <div style="font-weight:800;">✅ Added!</div>
                    <div>"${safeHtml(r.task)}" added for ${safeHtml(r.date)}.</div>
                  </div>`;
                  setTimeout(()=> _renderPanelContent().catch(()=>{}), 900);
                } catch(e){ resp.innerHTML=`<div style="color:#ef4444; font-size:13px;">Failed to add: ${safeHtml(e.message)}</div>`; }
              };
              if (c) c.addEventListener('click', doAdd);
              if (inp) inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doAdd(); });
              if (x) x.addEventListener('click', ()=> resp.style.display='none');
            },0);
            return;
          }
          resp.innerHTML = `<div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:12px; font-size:13px; line-height:1.5;">
            <div style="font-weight:800; color:#0c4a6e; margin-bottom:6px;">Ready to add your task?</div>
            <div><strong>Task:</strong> ${safeHtml(addIntent.task)}</div>
            <div><strong>Date:</strong> ${safeHtml(addIntent.date)} (${safeHtml(addIntent.datePhrase)})</div>
            <div style="margin-top:8px; display:flex; gap:8px;">
              <button id="ai-float-confirm-add" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Add task</button>
              <button id="ai-float-cancel-add" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
            </div>
          </div>`;
          setTimeout(() => {
            const c = resp.querySelector('#ai-float-confirm-add');
            const x = resp.querySelector('#ai-float-cancel-add');
            if (c) c.addEventListener('click', async () => {
              c.textContent = 'Adding…'; c.disabled = true;
              try {
                const r = await executeAddTask(addIntent);
                resp.innerHTML = `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;">
                  <div style="font-weight:800;">✅ Added!</div>
                  <div>"${safeHtml(r.task)}" added for ${safeHtml(r.date)}.</div>
                  <div style="margin-top:6px; font-size:12px;">Tip: say "Mark ${safeHtml(r.task)} as done" to complete it later.</div>
                </div>`;
                // refresh panel content after short delay
                setTimeout(()=> _renderPanelContent().catch(()=>{}), 900);
              } catch (e) { resp.innerHTML = `<div style="color:#ef4444; font-size:13px;">Failed to add: ${safeHtml(e.message)}</div>`; }
            });
            if (x) x.addEventListener('click', () => { resp.style.display='none'; });
          }, 0);
          return;
        }
        const compIntent = parseCompleteIntent(question);
        if (compIntent) {
          if (compIntent.isBulk) {
            resp.innerHTML = `<div style="background:#fefce8; border:1px solid #fde68a; border-radius:10px; padding:12px; font-size:13px;">
              <div style="font-weight:800; color:#713f12;">Complete all overdue tasks?</div>
              <div style="color:#475569; margin-top:4px;">This will mark every overdue task before today as completed.</div>
              <div style="margin-top:8px; display:flex; gap:8px;">
                <button id="ai-float-confirm-bulk" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Yes, complete all</button>
                <button id="ai-float-cancel-bulk" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
              </div>
            </div>`;
            setTimeout(() => {
              const c = resp.querySelector('#ai-float-confirm-bulk');
              const x = resp.querySelector('#ai-float-cancel-bulk');
              if (c) c.addEventListener('click', async () => {
                c.textContent='Working…'; c.disabled=true;
                try {
                  const r = await executeCompleteTask(compIntent);
                  resp.innerHTML = `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;"><div style="font-weight:800;">✅ Done!</div><div>Marked ${r.completedCount} overdue task(s) as completed.</div></div>`;
                  setTimeout(()=> _renderPanelContent().catch(()=>{}), 900);
                } catch(e){ resp.innerHTML=`<div style="color:#ef4444; font-size:13px;">Failed: ${safeHtml(e.message)}</div>`; }
              });
              if (x) x.addEventListener('click', ()=> resp.style.display='none');
            },0);
            return;
          }
          // single complete — try direct execute, else show confirm with name
          try {
            resp.innerHTML = `<div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:12px; font-size:13px;">
              <div style="font-weight:800; color:#0c4a6e;">Mark task as done?</div>
              <div>Task: "${safeHtml(compIntent.query)}"</div>
              <div style="margin-top:8px; display:flex; gap:8px;">
                <button id="ai-float-confirm-one" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Mark done</button>
                <button id="ai-float-cancel-one" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
              </div>
            </div>`;
            setTimeout(()=>{
              const c = resp.querySelector('#ai-float-confirm-one');
              const x = resp.querySelector('#ai-float-cancel-one');
              if (c) c.addEventListener('click', async ()=>{
                c.textContent='Saving…'; c.disabled=true;
                try {
                  const r = await executeCompleteTask(compIntent);
                  resp.innerHTML = `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;"><div style="font-weight:800;">✅ Completed!</div><div>"${safeHtml(r.task)}" marked as done for ${safeHtml(r.date)}.</div></div>`;
                  setTimeout(()=> _renderPanelContent().catch(()=>{}), 900);
                } catch(e){ resp.innerHTML=`<div style="color:#ef4444; font-size:13px;">${safeHtml(e.message)}</div>`; }
              });
              if (x) x.addEventListener('click', ()=> resp.style.display='none');
            },0);
            return;
          } catch { /* fall through to normal ask */ }
        }

        // 0) LLM tool plan — catch-all for any phrasing the regex missed
        if (!addIntent && !compIntent) {
          try {
            const plan = await fetchToolPlan(question);
            if (plan && plan.action && plan.action !== 'none') {
              const desc = plan.action === 'add_task' ? `Add task "${plan.task}"${plan.date ? ` for ${plan.date}` : ''}?`
                : plan.action === 'complete_task' ? `Mark "${plan.query}" as done?`
                : plan.action === 'complete_overdue' ? 'Mark ALL overdue tasks as done?'
                : plan.action === 'postpone_task' ? `Move "${plan.query}" to ${plan.date || 'tomorrow'}?` : 'Proceed?';
              showConfirm(`<div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:12px; font-size:13px;">
                <div style="font-weight:800; color:#0c4a6e;">Ready to do this?</div><div>${safeHtml(desc)}</div>
                <div style="margin-top:8px; display:flex; gap:8px;">
                  <button id="ai-float-confirm-plan" style="padding:7px 12px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;">Do it</button>
                  <button id="ai-float-cancel-plan" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-weight:600; font-size:12px; cursor:pointer;">Cancel</button>
                </div></div>`);
              setTimeout(() => {
                const c = resp.querySelector('#ai-float-confirm-plan');
                const x = resp.querySelector('#ai-float-cancel-plan');
                if (c) c.addEventListener('click', async () => {
                  c.textContent = 'Working…'; c.disabled = true;
                  try {
                    const r = await executeToolPlan(plan);
                    const msg = r.moved ? `Moved ${r.count} task(s) to ${r.date}.` : (r.completedCount != null ? `Marked ${r.completedCount} task(s) done.` : `"${r.task}" saved for ${r.date}.`);
                    showConfirm(`<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:13px; color:#14532d;"><div style="font-weight:800;">✅ Done!</div><div>${safeHtml(msg)}</div></div>`);
                    addExchange(question, msg);
                    setTimeout(()=> _renderPanelContent().catch(()=>{}), 900);
                  } catch (e) {
                    showConfirm(`<div style="color:#ef4444; font-size:13px; padding:8px;">${safeHtml(e.message)}</div>`);
                  }
                });
                if (x) x.addEventListener('click', () => { resp.style.display = 'none'; });
              }, 0);
              return;
            }
          } catch { /* fall through */ }
        }
        const personal = await window.AppMetricsService.getMyPersonalContext().catch(()=>null);
        // Streaming answer — deltas render live in the thread bubble
        const bubble = _appendThinkingFloat();
        let answer = '';
        let source = 'ai';
        let limitErr = null;
        try {
          const token = await window.AppFirebaseAuth?.currentUser?.getIdToken?.() || '';
          let first = true;
          const streamed = await postStream('/api/ai-insights',
            { metrics: personal, question, history: sanitizeForServer(getHistory()), stream: true },
            { token, onDelta: (_c, all) => {
              if (first) { bubble.innerHTML = ''; first = false; }
              bubble.innerHTML = formatLabeledInsight(all);
              if (thread) thread.scrollTop = thread.scrollHeight;
            } });
          answer = streamed.text;
          source = streamed.source;
        } catch (e) {
          if (e && e.status === 429) limitErr = e;
        }
        if (limitErr) {
          // Daily question limit — show the notice, don't fake a local answer.
          bubble.innerHTML = quotaNoticeHtml(limitErr);
          if (thread) thread.scrollTop = thread.scrollHeight;
          return;
        }
        if (!answer || !answer.trim()) {
          answer = _localAnswer(question, personal, issues);
          source = 'local';
        }
        _finalizeFloatBubble(bubble, answer, source);
        addExchange(question, answer);
      } catch (e) {
        resp.style.display = 'block';
        resp.innerHTML = e && e.status === 429
          ? quotaNoticeHtml(e)
          : `Error: ${safeHtml(e.message || '')}`;
      }
    };
    btn.addEventListener('click', () => ask());
    input.addEventListener('keydown', (e) => { if (e.key==='Enter') ask(); });
    body.querySelectorAll('.ai-chip').forEach(ch => ch.addEventListener('click', () => { input.value = ch.getAttribute('data-q'); ask(input.value); }));
  } catch (e) {
    body.innerHTML = `<div class="ai-empty" style="color:#ef4444;">Failed to load assistant: ${safeHtml(e.message)}</div>`;
  }
}

function _floatBubble(role, content) {
  const isUser = role === 'user';
  return `<div class="ai-chat-msg ${isUser ? 'ai-chat-msg--user' : 'ai-chat-msg--ai'}">
    <div class="ai-chat-msg__avatar"><i class="fa-solid ${isUser ? 'fa-user' : 'fa-wand-magic-sparkles'}"></i></div>
    <div class="ai-chat-msg__bubble">${isUser ? safeHtml(content) : formatLabeledInsight(content)}</div>
  </div>`;
}

function _localAnswer(question, ctx, issues) {
  const q = question.toLowerCase();
  const today = _today();
  const tasks = ctx?.myTasks || [];
  const tm = ctx?.taskMetrics || {};
  const lay = (s) => String(s||'').replace(/source:.*$/gm,'').trim(); // strip technical source tag for layman display
  const findIssue = (id) => issues.find(i=>i.id===id);
  const namesOf = (list) => list.slice(0, 5).map(t => `"${t.task}" (${t.date})`).join(', ');
  // ── Postponed ──
  if (q.includes('postpon')) {
    const pp = tasks.filter(t => t.status === 'postponed');
    if (pp.length > 0) return `### Fact\nYou have ${pp.length} postponed task(s): ${namesOf(pp)}.\n### Observation\nPostponed tasks are not scheduled on any day — they wait until you re-plan them.\n### Recommendation\nOpen your day plan and move them to today or another day this week.`;
    return `### Fact\nNo postponed tasks right now.\n### Observation\nNothing is waiting to be re-planned.\n### Recommendation\nKeep it up — finish today's tasks on time.`;
  }
  // ── Overdue / previous days ──
  if (q.includes('overdue') || q.includes('old task') || q.includes('previous days') || q.includes('past days')) {
    const od = findIssue('task-overdue');
    if (od) {
      const odTasks = tasks.filter(t => t.bucket === 'overdue-or-postponed' && t.status !== 'postponed');
      return `### Fact\n${lay(od.fact)}${odTasks.length ? ' These are: ' + namesOf(odTasks) + '.' : ''}\n### Observation\n${lay(od.observation)}\n### Recommendation\n${lay(od.recommendation)} — tap "${od.actionLabel}" above.`;
    }
    return `### Fact\nNo overdue tasks for ${today} — good job.\n### Observation\nYour completion rate is ${tm.completionRate || '0'}% this month${tm.postponed ? `, with ${tm.postponed} postponed` : ''}.\n### Recommendation\nJust focus on today's list.`;
  }
  // ── Today's task picture ──
  if ((q.includes('today') && (q.includes('task') || q.includes('plan'))) || q.includes('my tasks')) {
    const due = findIssue('task-due-today');
    const od = findIssue('task-overdue');
    const pp = findIssue('task-postponed');
    const parts = [];
    if (due) parts.push(`${due.count} planned for today`);
    if (od) parts.push(`${od.count} overdue`);
    if (pp) parts.push(`${pp.count} postponed from earlier days`);
    if (parts.length === 0) return `### Fact\nYou have no open tasks for ${today}.\n### Observation\nYour plan is clear.\n### Recommendation\nAdd tomorrow's tasks before you leave.`;
    return `### Fact\nYour task picture: ${parts.join(', ')}.\n### Observation\n${od || pp ? "Some tasks from earlier days are still open — today's count alone does not show the full picture." : "Today's plan is not finished yet."}\n### Recommendation\n${od ? 'Clear the overdue ones first, then ' : ''}${pp ? 're-plan the postponed tasks, then ' : ''}finish today's list.`;
  }
  if (q.includes('miss') || q.includes('what did i') || q.includes('pending')) {
    if (!issues || issues.length===0) return `### Fact\nYou have no pending check-in or overdue tasks for ${today}.\n### Observation\nYou are on track today — nothing missed.\n### Recommendation\nJust finish today's planned tasks before you leave.`;
    const parts = issues.map(i => lay(i.title)).join('; ');
    const top = issues[0];
    return `### Fact\nYou have ${issues.length} open item(s): ${parts}.\n### Observation\n${lay(top.detail)}\n### Recommendation\nStart with "${lay(top.title)}" — ${lay(top.recommendation)}. Tap "${top.actionLabel}" above.`;
  }
  if (q.includes('track') || q.includes('on track') || q.includes('attendance')) {
    const att = ctx?.myAttendance;
    const rate = ctx?.taskMetrics?.completionRate || '0';
    if (att) return `### Fact\nYou checked in today — attendance is marked. Your tasks are ${rate}% done this month.\n### Observation\n${Number(rate)>=70?'You are doing well on tasks.':'A few tasks are still pending — need a little push.'}\n### Recommendation\nFinish any overdue tasks first, then today's tasks.`;
    return `### Fact\nNo attendance record for ${today} yet.\n### Observation\nIt will be counted as absent if you don't check in.\n### Recommendation\nPlease check in now. If you are on leave, apply for leave instead.`;
  }
  if (q.includes('late')) {
    return `### Fact\nLate means you came after 09:15. 3 lates = half day cut.\n### Observation\nTry to reach before 09:15 daily.\n### Recommendation\nCheck the leave/policy page if you need a waiver.`;
  }
  return `### Fact\nThe AI assistant is offline right now — the AI provider is unavailable for ${today}.\n### Observation\nI can only answer quick local questions about your attendance, tasks and leaves.\n### Recommendation\nTry: "What did I miss today?" or "Show overdue tasks". Ask the admin to check the AI provider key.`;
}

function _formatLabeled(text) {
  return formatLabeledInsight(text);
}

function _syncFabBadgeDom(n) {
  const badge = _fabEl?.querySelector('.ai-fab__badge');
  if (!badge) return;
  const show = shouldShowFabBadge(n, _badgeSeen);
  badge.textContent = show ? String(n) : '';
  badge.style.display = show ? 'flex' : 'none';
  _fabEl.title = show ? `CRWI Assistant — ${n} issue(s)` : 'CRWI Assistant';
}

function _updateFabBadge() {
  const user = _user();
  if (!user || !_fabEl) return;
  window.AppMetricsService?.getMyIssues?.().then(issues => {
    if (!_fabEl) return;
    const n = Array.isArray(issues) ? issues.length : 0;
    _lastIssueCount = n;
    // While the panel is open every count is "read" — keep the badge
    // acknowledged so late/polling fetches can't flash it over the panel.
    if (_panelEl?.classList.contains('is-open')) _badgeSeen = Math.max(_badgeSeen, n);
    _syncFabBadgeDom(n);
  }).catch(()=>{});
}

export function mountAiFloating() {
  if (_mounted || typeof document === 'undefined') return;
  _mounted = true;

  // Inject FAB + panel
  const fab = document.createElement('button');
  fab.className = 'ai-fab ai-fab--hidden';
  fab.setAttribute('aria-label', 'Open CRWI Assistant');
  fab.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span class="ai-fab__badge" aria-live="polite"></span>';
  fab.addEventListener('click', _openPanel);

  const overlay = document.createElement('div');
  overlay.className = 'ai-panel-overlay';
  overlay.addEventListener('click', _closePanel);

  const panel = document.createElement('div');
  panel.className = 'ai-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'CRWI Assistant');
  panel.innerHTML = `
    <div class="ai-panel__header">
      <div class="ai-panel__title"><i class="fa-solid fa-wand-magic-sparkles"></i> CRWI Assistant</div>
      <button class="ai-panel__close" aria-label="Close assistant"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="ai-panel__body"><div class="ai-empty">Loading…</div></div>
  `;
  panel.querySelector('.ai-panel__close')?.addEventListener('click', _closePanel);

  document.body.appendChild(fab);
  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  _fabEl = fab; _overlayEl = overlay; _panelEl = panel;

  // Visibility: hide pre-login
  const syncVis = () => {
    const u = _user();
    if (!u) { fab.classList.add('ai-fab--hidden'); _closePanel(); }
    else { fab.classList.remove('ai-fab--hidden'); _updateFabBadge(); }
  };
  syncVis();
  // Re-check after auth resolves (app.js loads globals late)
  setTimeout(syncVis, 800);
  setTimeout(syncVis, 2500);
  window.addEventListener('hashchange', syncVis);
  // Poll badge every 60s
  setInterval(() => { if (_user()) _updateFabBadge(); }, 60000);
  document.addEventListener('keydown', (e) => { if (e.key==='Escape') _closePanel(); });
  // Keep #ai-center alias
  window.addEventListener('hashchange', () => { if (location.hash === '#ai-center') { _openPanel(); } });
  if (location.hash === '#ai-center') setTimeout(_openPanel, 300);

  // Expose for debugging
  window._aiFloatOpen = _openPanel;
  window._aiFloatClose = _closePanel;
  window._aiFloatUpdateBadge = _updateFabBadge;
}
