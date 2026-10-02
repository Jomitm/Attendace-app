// js/modules/ai-actions.js — Task agent (LLM tool-plan first, regex fallback)
// Handles: today, tomorrow, day after tomorrow, next weekday (with typo tolerance), YYYY-MM-DD
// LLM path: planToolAction server-side converts ANY phrasing ("reschedule my
// report to Friday", "postpone everything") into a validated JSON action;
// execution + confirmation always happen here, client-side.
import { _heuristicClassify } from './ai-performance-coach.js';

/**
 * Ask the server LLM for an action plan. Returns plan or null (offline/no key).
 */
export async function fetchToolPlan(text) {
  try {
    const token = await window.AppFirebaseAuth?.currentUser?.getIdToken?.() || '';
    const res = await fetch('/api/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ mode: 'tool_plan', text, metrics: { today: _todayStr() } })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const plan = data?.plan;
    if (!plan || plan.action === 'none') return null;
    return plan;
  } catch { return null; }
}

/**
 * Execute a validated tool plan (from LLM). Reuses executeAddTask /
 * executeCompleteTask for shared logic; adds postpone support.
 */
export async function executeToolPlan(plan) {
  const user = window.AppAuth?.getUser?.();
  if (!user) throw new Error('Not logged in');
  switch (plan.action) {
    case 'add_task':
      return executeAddTask({ task: String(plan.task).trim(), date: plan.date || _todayStr() });
    case 'complete_task':
      return executeCompleteTask({ query: String(plan.query).trim(), isBulk: false });
    case 'complete_overdue':
      return executeCompleteTask({ query: '__OVERDUE__', isBulk: true });
    case 'postpone_task':
      return executePostponeTask({ query: String(plan.query).trim(), date: plan.date });
    default:
      throw new Error('Unknown action');
  }
}

/**
 * Move a matching task (or its overdue instances) to a new date.
 */
export async function executePostponeTask({ query, date }) {
  const user = window.AppAuth?.getUser?.();
  if (!user) throw new Error('Not logged in');
  const target = date || _addDaysStr(1); // default: tomorrow
  let rows = [];
  try { rows = await window.AppAnalyticsService.getWorkPlans(); }
  catch { try { rows = await window.AppDB.getAll('work_plans'); } catch { rows = []; } }
  const qLower = String(query).trim().toLowerCase();
  const candidates = [];
  for (const wp of rows) {
    if (!wp || !Array.isArray(wp.plans)) continue;
    if (String(wp.userId || wp.user_id || '') !== String(user.id)) continue;
    wp.plans.forEach(t => {
      if (!t || t.isRemoved) return;
      const n = String(t.status || '').trim().toLowerCase();
      if (n === 'completed' || t.completed === true) return;
      const name = String(t.task || '').trim().toLowerCase();
      if (!name) return;
      if (name.includes(qLower) || qLower.includes(name)) candidates.push({ wp, t, name });
    });
  }
  if (candidates.length === 0) throw new Error(`No open task found matching "${query}".`);
  if (candidates.length > 3) throw new Error(`Found ${candidates.length} matches — please be more specific.`);
  const moved = [];
  for (const c of candidates) {
    if (String(c.wp.date) === String(target)) continue; // already there
    c.t.isRemoved = true; // hide on old day
    c.wp.updatedAt = new Date().toISOString();
    await window.AppDB.put('work_plans', c.wp);
    // Add to target date's plan
    await window.AppCalendar.addWorkPlanTask(target, user.id, c.t.task, [], {
      status: 'to-be-started', addedFrom: 'ai_agent', assignedTo: user.id
    });
    moved.push({ task: c.t.task, from: c.wp.date, to: target });
  }
  try { if (window.AppCalendar.invalidateCarryForwardCache) window.AppCalendar.invalidateCarryForwardCache(); } catch {}
  try { window.AppDB?.invalidateCache?.('svc_analytics_workPlans'); } catch {}
  return { ok: true, moved, count: moved.length, date: target };
}

function _fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _addDaysFrom(base, days) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}
function _todayStr() {
  return _fmtDate(new Date());
}
function _addDaysStr(days) {
  return _fmtDate(_addDaysFrom(new Date(), days));
}
function _isoToDate(iso) { const [y,m,dd] = iso.split('-').map(Number); return new Date(y, m-1, dd); }

const WEEKDAYS = [
  { idx: 0, names: ['sunday','sun','sund'], canon: 'sunday' },
  { idx: 1, names: ['monday','mon','mond'], canon: 'monday' },
  { idx: 2, names: ['tuesday','tue','tues','tuesday'], canon: 'tuesday' },
  { idx: 3, names: ['wednesday','weds','wed','wednesday','wednessday','wensday'], canon: 'wednesday' },
  { idx: 4, names: ['thursday','thu','thur','thurs'], canon: 'thursday' },
  { idx: 5, names: ['friday','fri'], canon: 'friday' },
  { idx: 6, names: ['saturday','sat'], canon: 'saturday' },
];

function _findWeekdayInText(lower) {
  // tolerate typos: we check includes of 3-letter roots
  const roots = { 0:['sun'],1:['mon'],2:['tue'],3:['wed'],4:['thu'],5:['fri'],6:['sat'] };
  for (let i=0;i<WEEKDAYS.length;i++) {
    for (const name of WEEKDAYS[i].names) {
      if (lower.includes(name)) return WEEKDAYS[i].idx;
    }
    // fallback root 3 letters
    const r = roots[WEEKDAYS[i].idx][0];
    if (lower.includes(r)) return WEEKDAYS[i].idx;
  }
  return null;
}

export function parsePlainDate(text, refDate = new Date()) {
  if (!text || typeof text !== 'string') return null;
  const ref = (refDate instanceof Date && !isNaN(refDate.getTime())) ? refDate : new Date();
  const lower = text.trim().toLowerCase();
  // explicit YYYY-MM-DD
  const isoMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    const iso = isoMatch[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  }
  // day after tomorrow first (contains tomorrow)
  if (lower.includes('day after tomorrow') || lower.includes('day after') || lower.includes('overmorrow')) {
    return _fmtDate(_addDaysFrom(ref, 2));
  }
  if (lower.includes('tomorrow')) {
    return _fmtDate(_addDaysFrom(ref, 1));
  }
  if (lower.includes('today')) {
    return _fmtDate(ref);
  }
  // weekday
  const wdIdx = _findWeekdayInText(lower);
  if (wdIdx !== null) {
    const todayIdx = ref.getDay(); // 0 Sun
    let diff = (wdIdx - todayIdx + 7) % 7;
    if (diff === 0) diff = 7; // next occurrence strictly after ref day
    return _fmtDate(_addDaysFrom(ref, diff));
  }
  return null;
}

// Strict trailing-date matcher: the phrase at the END of the text must be a
// date expression on its own, so "call client wednessday" splits as
// task="call client" + date="wednessday" (no partial-word guessing).
const TRAILING_DATE_RE = /^(.+?)\s+(?:for\s+|on\s+|by\s+)?(day\s+after\s+tomorrow|overmorrow|tomorrow|today|\d{4}-\d{2}-\d{2}|(?:next\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday|wednessday|wensday|weds|tues|thur|thurs|mond|sund|sun|mon|tue|wed|thu|fri|sat))\.?$/i;

function _splitTrailingDate(text) {
  const m = String(text).match(TRAILING_DATE_RE);
  if (!m) return null;
  const taskText = m[1].trim();
  const datePhrase = m[2].trim();
  if (!taskText) return null;
  const dateStr = parsePlainDate(datePhrase);
  if (!dateStr) return null;
  return { taskText, datePhrase, dateStr };
}

export function parseAddTaskIntent(text) {
  if (!text || typeof text !== 'string') return null;
  let trimmed = text.trim().replace(/[.?]+$/, '').trim();
  // strip leading politeness: please, can you, could you, etc.
  trimmed = trimmed.replace(/^(?:please\s+)?(?:can you|could you|would you|will you|can|could|please)\s+/i, '').trim();
  // must contain add/create task anywhere (not necessarily at start)
  const lower = trimmed.toLowerCase();
  const addIdx = lower.indexOf('add task');
  const addAIdx = lower.indexOf('add a task');
  const createIdx = lower.indexOf('create task');
  const createAIdx = lower.indexOf('create a task');
  let idx = -1;
  let keywordLen = 0;
  for (const cand of [
    { i: addAIdx, l: 'add a task'.length },
    { i: addIdx, l: 'add task'.length },
    { i: createAIdx, l: 'create a task'.length },
    { i: createIdx, l: 'create task'.length }
  ]) {
    if (cand.i !== -1 && (idx === -1 || cand.i < idx)) { idx = cand.i; keywordLen = cand.l; }
  }
  if (idx === -1) return null;
  let rest = trimmed.slice(idx + keywordLen).trim();
  // strip leading "for me" filler
  rest = rest.replace(/^for\s+me\s+/i, '').trim();
  rest = rest.replace(/^for\s+me\s*$/i, '').trim();
  rest = rest.replace(/^a\s+task\s*/i, '').trim();
  if (!rest) {
    // e.g., "can you add a task for me" — task name missing; derive date from the full text
    let datePhrase = 'today';
    if (lower.includes('day after tomorrow')) datePhrase = 'day after tomorrow';
    else if (lower.includes('tomorrow')) datePhrase = 'tomorrow';
    else if (lower.includes('today')) datePhrase = 'today';
    else if (_findWeekdayInText(lower) !== null) {
      const m = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|wednessday|wensday|weds|tues|thur|thurs|mond|sund|sun|mon|tue|wed|thu|fri|sat)\b/);
      if (m) datePhrase = m[0];
    }
    const finalDate = parsePlainDate(datePhrase) || _todayStr();
    return { task: '', date: finalDate, datePhrase, isMissingTask: true };
  }
  // rest is only a date phrase with no task (e.g., "for tomorrow", "tomorrow")
  const restLower = rest.toLowerCase().trim();
  if (restLower === 'for tomorrow' || restLower === 'tomorrow' || restLower === 'for today' || restLower === 'today') {
    const pd = parsePlainDate(rest);
    if (pd) return { task: '', date: pd, datePhrase: rest.replace(/^for\s+/i, ''), isMissingTask: true };
  }
  if (/^for\s+(today|tomorrow|day after tomorrow|\w+day)$/i.test(restLower)) {
    const pd = parsePlainDate(rest);
    if (pd) return { task: '', date: pd, datePhrase: rest.replace(/^for\s+/i, ''), isMissingTask: true };
  }
  // split off a strict trailing date phrase ("Prepare report for tomorrow", "call client wednessday")
  const split = _splitTrailingDate(rest);
  let taskText, datePhrase, dateStr;
  if (split) {
    taskText = split.taskText;
    datePhrase = split.datePhrase;
    dateStr = split.dateStr;
  } else {
    taskText = rest;
    datePhrase = 'today';
    dateStr = _todayStr();
  }
  taskText = taskText.replace(/^["']|["']$/g, '').trim();
  // leftover filler only — nothing to add yet
  if (!taskText || /^(for|on|by|my|the|for me)$/i.test(taskText)) {
    return { task: '', date: dateStr, datePhrase, isMissingTask: true };
  }
  return { task: taskText, date: dateStr, datePhrase };
}

export function parseCompleteIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.trim().toLowerCase();
  // bulk complete? e.g., "complete my overdue", "mark all overdue as done"
  if (lower.includes('overdue') && (lower.includes('complete') || lower.includes('mark') || lower.includes('finish'))) {
    return { query: '__OVERDUE__', isBulk: true };
  }
  // patterns: mark X as completed/done, complete X, finish X
  let m = text.trim().match(/^(?:mark|complete|finish)\s+(?:task\s+)?(.+?)(?:\s+as\s+(?:completed|done))?\s*$/i);
  if (m) {
    let q = m[1].trim().replace(/^["']|["']$/g, '').trim();
    // strip leading "my" / "the"
    q = q.replace(/^(my\s+|the\s+)/i, '').trim();
    if (!q) return null;
    return { query: q, isBulk: false };
  }
  // also "X done" without prefix? e.g., "prepare report done"
  // not ambiguous, skip
  return null;
}

// Execution helpers — call calendar APIs
async function _getCalendar() {
  // Window singleton preferred
  if (window.AppCalendar?.addWorkPlanTask) return window.AppCalendar;
  // Try dynamic import fallback (should be loaded via app.js calendar module)
  try {
    const mod = await import('./calendar.js');
    // calendar.js exports class but also side-effects register window.AppCalendar
    if (window.AppCalendar) return window.AppCalendar;
    return mod;
  } catch { return window.AppCalendar || null; }
}

export async function executeAddTask({ task, date }) {
  const cal = await _getCalendar();
  if (!cal || !cal.addWorkPlanTask) throw new Error('Calendar not ready');
  const user = window.AppAuth?.getUser?.();
  if (!user) throw new Error('Not logged in');
  // Admin can add for @username
  let targetId = user.id;
  const atMatch = String(task).match(/@([a-zA-Z0-9._-]+)/);
  // Simple mention parse inside task string (optional)
  if (atMatch && window.AppUserService?.getActiveStaff) {
    const mention = atMatch[1].toLowerCase();
    const staff = await window.AppUserService.getActiveStaff().catch(()=>[]);
    const found = staff.find(s => String(s.username||'').toLowerCase()===mention || String(s.name||'').toLowerCase().includes(mention));
    const viewer = user;
    const isAdmin = String(viewer.role||'').toLowerCase()==='admin' || viewer.isAdmin;
    if (found && isAdmin) {
      targetId = found.id;
      task = task.replace(atMatch[0], '').trim();
    }
  }
  const aiClass = _heuristicClassify(task);
  await cal.addWorkPlanTask(date, targetId, task, [], { status: 'to-be-started', addedFrom: 'ai_agent', assignedTo: targetId, aiSizeCategory: aiClass.sizeCategory, aiPriorityLevel: aiClass.priorityLevel });
  // Invalidate caches so metrics reflect immediately
  try { if (cal.invalidateCarryForwardCache) cal.invalidateCarryForwardCache(); } catch {}
  try { if (window.AppDB?.invalidateCache) window.AppDB.invalidateCache('svc_analytics_workPlans'); } catch {}
  return { ok: true, task, date, targetId };
}

export async function executeCompleteTask({ query, isBulk }) {
  const user = window.AppAuth?.getUser?.();
  if (!user) throw new Error('Not logged in');
  const metrics = window.AppMetricsService;
  if (!metrics?.getMyIssues) throw new Error('Metrics not ready');
  // Bulk overdue
  if (isBulk || String(query).toLowerCase().includes('overdue') || query === '__OVERDUE__') {
    // Fetch work_plans and complete overdue ones for this user
    const wpRows = await (window.AppAnalyticsService?.getWorkPlans?.() || window.AppCalendar?.db?.getAll?.('work_plans') || Promise.resolve([])).catch(()=>[]);
    // Fallback to AppDB
    let rows = wpRows;
    if (!Array.isArray(rows) || rows.length===0) {
      try { rows = await window.AppDB.getAll('work_plans'); } catch { rows = []; }
    }
    const today = _todayStr();
    let completedCount = 0;
    for (const wp of rows) {
      if (!wp || !Array.isArray(wp.plans)) continue;
      const wpUser = String(wp.userId || wp.user_id || '');
      if (wpUser !== String(user.id)) continue;
      let changed = false;
      for (const t of wp.plans) {
        if (!t || t.isRemoved) continue;
        const n = String(t.status||'').trim().toLowerCase();
        const isDone = n === 'completed' || t.completed===true;
        if (isDone) continue;
        if (n === 'postponed') continue;
        if (String(wp.date||'') >= today) continue; // only overdue (<today)
        // overdue found
        t.status = 'completed';
        t.completedDate = new Date().toISOString();
        changed = true;
        completedCount++;
      }
      if (changed) {
        wp.updatedAt = new Date().toISOString();
        await window.AppDB.put('work_plans', wp);
      }
    }
    return { ok: true, completedCount, mode: 'bulk-overdue' };
  }

  // Single task by fuzzy name
  const qLower = String(query).trim().toLowerCase();
  // Fetch my tasks
  let rows = [];
  try { rows = await window.AppAnalyticsService.getWorkPlans(); } catch {
    try { rows = await window.AppDB.getAll('work_plans'); } catch { rows = []; }
  }
  const candidates = [];
  for (const wp of rows) {
    if (!wp || !Array.isArray(wp.plans)) continue;
    const wpUser = String(wp.userId || wp.user_id || '');
    if (wpUser !== String(user.id)) continue;
    wp.plans.forEach((t, idx) => {
      if (!t || t.isRemoved) return;
      const name = String(t.task||'').trim();
      if (!name) return;
      const n = String(t.status||'').trim().toLowerCase();
      if (n === 'completed') return;
      const nameLower = name.toLowerCase();
      if (nameLower.includes(qLower) || qLower.includes(nameLower) || nameLower.replace(/\s+/g,'').includes(qLower.replace(/\s+/g,''))) {
        candidates.push({ wp, idx, task: t, name });
      }
    });
  }
  if (candidates.length === 0) throw new Error(`No task found matching "${query}". Try the exact task name.`);
  if (candidates.length > 1) {
    const list = candidates.slice(0,3).map(c=>`"${c.name}" (${c.wp.date})`).join(', ');
    const err = new Error(`Found ${candidates.length} matches: ${list}. Please be more specific.`);
    err.candidates = candidates;
    throw err;
  }
  const chosen = candidates[0];
  chosen.task.status = 'completed';
  chosen.task.completedDate = new Date().toISOString();
  chosen.wp.updatedAt = new Date().toISOString();
  await window.AppDB.put('work_plans', chosen.wp);
  return { ok: true, task: chosen.name, date: chosen.wp.date };
}
