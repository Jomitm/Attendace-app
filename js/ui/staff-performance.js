/**
 * Staff Performance Monitor — Personal View
 * Shows the logged-in user's (or viewed staff's) performance radar,
 * dimension breakdown, weekly trend, and insights.
 * All data comes from analytics.getPersonalPerformance().
 */

import { safeHtml, safeUrl, formatLabeledInsight } from './helpers.js';
import { runDailyPerformanceAI, getTodaysCachedNarrative, getTodaysCachedAiScore, refreshPerformanceAI, verifyPerformanceData } from '../modules/ai-performance-coach.js';

// ─── Radar Chart (Chart.js global) ─────────────────────────────
let _radarInstance = null;

function renderRadarChart(dimensions) {
    // Defer to next tick so DOM is ready
    setTimeout(() => {
        const canvas = document.getElementById('perf-radar-canvas');
        if (!canvas || !window.Chart) return;

        if (_radarInstance) { _radarInstance.destroy(); _radarInstance = null; }

        const labels = Object.values(dimensions).map(d => d.label);
        const scores = Object.values(dimensions).map(d => d.score);
        const colors = Object.values(dimensions).map(d => d.color);

        _radarInstance = new Chart(canvas.getContext('2d'), {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label: 'Score',
                    data: scores,
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    pointBackgroundColor: colors,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            font: { size: 9 },
                            color: '#94a3b8',
                            backdropColor: 'transparent'
                        },
                        pointLabels: {
                            font: { size: 10, weight: '600' },
                            color: '#475569'
                        },
                        grid: { color: '#e2e8f0' },
                        angleLines: { color: '#e2e8f0' }
                    }
                }
            }
        });
    }, 50);
}

// ─── Dimension Bar ─────────────────────────────────────────────
function dimBarHtml(dim) {
    const pct = Math.min(100, Math.max(0, dim.score));
    const color = dim.score >= 80 ? '#16a34a' : dim.score >= 50 ? '#d97706' : '#dc2626';
    return `
        <div class="perf-dim-row">
            <div class="perf-dim-icon" style="color:${dim.color}"><i class="${dim.icon}"></i></div>
            <div class="perf-dim-label">${safeHtml(dim.label)}</div>
            <div class="perf-dim-bar-wrap">
                <div class="perf-dim-bar" style="width:${pct}%;background:${color};"></div>
            </div>
            <div class="perf-dim-score" style="color:${color}">${dim.score}</div>
        </div>`;
}

// ─── Trend Sparkline (pure CSS) ────────────────────────────────
function trendHtml(trend) {
    if (!trend || trend.length < 2) return '';
    const max = Math.max(...trend.map(t => t.score), 1);
    const bars = trend.map(t => {
        const h = Math.max(4, (t.score / max) * 100);
        const color = t.score >= 80 ? '#16a34a' : t.score >= 50 ? '#d97706' : '#dc2626';
        return `<div class="perf-trend-col">
            <div class="perf-trend-bar" style="height:${h}%;background:${color};" title="${t.score}"></div>
            <div class="perf-trend-label">${safeHtml(t.week || '')}</div>
            <div class="perf-trend-val">${t.score}</div>
        </div>`;
    }).join('');

    // Trend arrow
    const first = trend[0].score;
    const last = trend[trend.length - 1].score;
    const diff = last - first;
    let arrow = '', arrowClass = '';
    if (diff > 3) { arrow = '↗ Improving'; arrowClass = 'perf-trend-up'; }
    else if (diff < -3) { arrow = '↘ Declining'; arrowClass = 'perf-trend-down'; }
    else { arrow = '→ Stable'; arrowClass = 'perf-trend-flat'; }

    return `
        <div class="perf-trend-section">
            <div class="perf-trend-header">
                <span class="perf-trend-title">📈 Weekly Trend</span>
                <span class="perf-trend-badge ${arrowClass}">${arrow} (${diff >= 0 ? '+' : ''}${diff})</span>
            </div>
            <div class="perf-trend-chart">${bars}</div>
        </div>`;
}

// ─── Insights ──────────────────────────────────────────────────
function insightsHtml(insights) {
    if (!insights || insights.length === 0) return '';
    const iconMap = {
        positive: 'fa-solid fa-circle-check',
        improve: 'fa-solid fa-lightbulb',
        warning: 'fa-solid fa-triangle-exclamation',
        neutral: 'fa-solid fa-info-circle',
        classification_bonus: 'fa-solid fa-star',
        classification_warning: 'fa-solid fa-tag'
    };
    const colorMap = {
        positive: '#16a34a',
        improve: '#2563eb',
        warning: '#d97706',
        neutral: '#64748b',
        classification_bonus: '#16a34a',
        classification_warning: '#d97706'
    };
    const items = insights.map(ins => `
        <div class="perf-insight" style="border-left-color:${colorMap[ins.type] || '#64748b'}">
            <i class="${iconMap[ins.type] || 'fa-solid fa-info-circle'}" style="color:${colorMap[ins.type] || '#64748b'}"></i>
            <span>${safeHtml(ins.text)}</span>
        </div>`).join('');

    return `
        <div class="perf-insights-section">
            <div class="perf-insights-title">💡 Insights</div>
            ${items}
        </div>`;
}

// ─── Detail Chips (quick stats) ────────────────────────────────
function detailChipsHtml(details, stats) {
    if (!details || Object.keys(details).length === 0) return '';
    const chips = [];
    // Use stats (same source as Monthly Stats card) for attendance metrics
    const daysWorked = stats?.present ?? details.daysWorked;
    const extraHours = stats?.extraWorkedHours ?? details.extraHours;
    const _lateCount = stats?.late ?? details.lateDays;
    if (daysWorked) chips.push(`<span class="perf-chip"><i class="fa-solid fa-calendar"></i> ${daysWorked} days worked</span>`);
    if (details.taskCompleted) chips.push(`<span class="perf-chip perf-chip-green"><i class="fa-solid fa-check"></i> ${details.taskCompleted} completed</span>`);
    if (details.taskInProgress) chips.push(`<span class="perf-chip perf-chip-blue"><i class="fa-solid fa-spinner"></i> ${details.taskInProgress} in progress</span>`);
    if (details.taskMissed) chips.push(`<span class="perf-chip perf-chip-red"><i class="fa-solid fa-xmark"></i> ${details.taskMissed} missed</span>`);
    if (extraHours > 0) chips.push(`<span class="perf-chip perf-chip-purple"><i class="fa-solid fa-clock"></i> ${extraHours}h extra</span>`);
    if (details.avgActivity) chips.push(`<span class="perf-chip"><i class="fa-solid fa-bolt"></i> ${details.avgActivity}% activity</span>`);
    if (details.classifiedCount > 0) chips.push(`<span class="perf-chip perf-chip-green"><i class="fa-solid fa-star"></i> ${details.classifiedCount} priority set</span>`);
    if (details.classificationBonus > 0) chips.push(`<span class="perf-chip perf-chip-green"><i class="fa-solid fa-star"></i> +${details.classificationBonus} bonus</span>`);

    return chips.length > 0
        ? `<div class="perf-detail-chips">${chips.join('')}</div>`
        : '';
}

// ─── Score Ring ────────────────────────────────────────────────
// Formula score. Sized 44px so it can share one row with the AI score chip
// inside the radar's 120px column — the pair never adds height or width.
function scoreRingHtml(score) {
    const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
    const radius = 17;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return `
        <div class="perf-score-ring">
            <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="4"/>
                <circle cx="22" cy="22" r="${radius}" fill="none" stroke="${color}" stroke-width="4"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                    stroke-linecap="round" transform="rotate(-90 22 22)"
                    style="transition: stroke-dashoffset 0.8s ease;"/>
            </svg>
            <div class="perf-score-ring-value" style="color:${color}">${score}</div>
        </div>`;
}

// ─── Main Render ───────────────────────────────────────────────
// ─── Period config ───────────────────────────────────────────────
// Shared with dashboard.js so the dashboard fetch and the tab switcher always
// use the same window/trend parameters for a given period.
// week trendWeeks is 4 (was 1) so every period gets a real trend series.
export const PERF_PERIODS = [
    { key: 'week', label: 'This Week', windowDays: 7, trendWeeks: 4 },
    { key: 'month', label: 'This Month', windowDays: 30, trendWeeks: 4, calendarMonth: true },
    { key: 'year', label: 'This Year', windowDays: 365, trendWeeks: 12 }
];

let _personalPerfUserId = null;
let _personalPerfCurrentPeriod = 'week';

function personalPerfTabsHtml(activeKey) {
    return PERF_PERIODS.map(p =>
        `<button class="perf-team-tab ${p.key === activeKey ? 'active' : ''}" onclick="window.app_switchPersonalPerf('${p.key}')">${safeHtml(p.label)}</button>`
    ).join('');
}

window.app_switchPersonalPerf = async (periodKey) => {
    if (!_personalPerfUserId || !window.AppAnalytics?.getPersonalPerformance) return;
    _personalPerfCurrentPeriod = periodKey;
    const period = PERF_PERIODS.find(p => p.key === periodKey) || PERF_PERIODS[0];
    const container = document.querySelector('.dashboard-perf-card');
    if (!container) return;
    // Show loading state (the container may be an error card without .perf-main-layout)
    const loadLayout = container.querySelector('.perf-main-layout');
    if (loadLayout) loadLayout.style.opacity = '0.4';
    try {
        const perfData = await window.AppAnalytics.getPersonalPerformance(_personalPerfUserId, { windowDays: period.windowDays, trendWeeks: period.trendWeeks, calendarMonth: period.calendarMonth || false });
        if (perfData) {
            cleanupPerformanceChart();
            container.outerHTML = renderStaffPerformance(perfData, { windowDays: period.windowDays, period: periodKey });
            // Hydrate the AI Coach for THIS period (cache is per period, so a
            // previously-viewed period shows its narrative instantly).
            hydrateAICoach(perfData, periodKey).catch(e => console.warn('[PerfAI] hydrate (switch) failed:', e));
        }
    } catch (e) {
        console.warn('[Perf] Personal period switch failed:', e);
        const layout = container.querySelector('.perf-main-layout');
        if (layout) layout.style.opacity = '1';
    }
};

export function renderStaffPerformance(perfData, options = {}) {
    if (!perfData) {
        return `<div class="card dashboard-perf-card" style="display:none;"></div>`;
    }

    _personalPerfUserId = perfData.userId || _personalPerfUserId;
    const periodKey = options.period || _personalPerfCurrentPeriod || 'week';
    const { composite, dimensions, details, trend, insights } = perfData;
    const period = PERF_PERIODS.find(p => p.key === periodKey) || PERF_PERIODS[0];

    // Fetch failure → retry card. Never render a fabricated all-zero score
    // (analytics sets error:true on read failure; see getPersonalPerformance).
    if (perfData.error) {
        return `
        <div class="card dashboard-perf-card">
            <div class="perf-team-tabs" style="margin-bottom:0.5rem;">
                ${personalPerfTabsHtml(periodKey)}
            </div>
            <div class="dashboard-perf-head">
                <div>
                    <h4 class="dashboard-perf-title">Your Performance</h4>
                    <span class="dashboard-perf-subtitle">${safeHtml(period.label)}</span>
                </div>
            </div>
            <div class="perf-perf-error" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;gap:0.75rem;color:#94a3b8;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:1.4rem;color:#f59e0b;"></i>
                <span style="font-size:0.9rem;">Couldn&rsquo;t load performance data &mdash; check your connection and try again.</span>
                <button type="button" onclick="window.app_switchPersonalPerf('${periodKey}')" style="padding:0.4rem 1rem;border:1px solid rgba(148,163,184,0.35);border-radius:8px;background:transparent;color:#e2e8f0;cursor:pointer;font-size:0.85rem;">Retry</button>
            </div>
        </div>`;
    }

    // Kick off radar chart after DOM insert
    if (dimensions) renderRadarChart(dimensions);

    return `
        <div class="card dashboard-perf-card">
            <div class="perf-team-tabs" style="margin-bottom:0.5rem;">
                ${personalPerfTabsHtml(periodKey)}
            </div>
            <div class="dashboard-perf-head">
                <div>
                    <h4 class="dashboard-perf-title">Your Performance</h4>
                    <span class="dashboard-perf-subtitle">${safeHtml(period.calendarMonth ? (perfData.trend?.[perfData.trend.length - 1]?.week || period.label) : `${period.label} · ${options.windowDays || period.windowDays}-day window`)}</span>
                </div>
            </div>

            <div class="perf-main-layout">
                <!-- Left: formula ring + AI score share one row (no extra space), then Radar -->
                <div class="perf-left">
                    <div class="perf-score-row">
                        ${scoreRingHtml(composite)}
                    </div>
                    <div class="perf-radar-wrap">
                        <canvas id="perf-radar-canvas"></canvas>
                    </div>
                </div>

                <!-- Right: Dimension bars + chips -->
                <div class="perf-right">
                    <div class="perf-dims">
                        ${Object.values(dimensions || {}).map(d => dimBarHtml(d)).join('')}
                    </div>
                    ${detailChipsHtml(details, perfData.stats)}
                </div>
            </div>

            ${trendHtml(trend)}
            ${insightsHtml(insights)}
            ${dataCheckHtml(perfData)}
            ${aiCoachPlaceholderHtml(periodKey, composite)}
        </div>`;
}

/** Mount the AI-score chip BESIDE the formula ring (shared row, no extra space). */
function _mountAiScoreChip(periodKey, composite) {
    try {
        document.querySelector('.perf-ai-score-chip')?.remove();
        const chipHtml = aiScoreChipHtml(periodKey, composite);
        if (!chipHtml) return;
        const ring = document.querySelector('.perf-score-row .perf-score-ring');
        if (ring) ring.insertAdjacentHTML('afterend', chipHtml);
        else document.querySelector('.perf-score-row')?.insertAdjacentHTML('beforeend', chipHtml);
    } catch { /* cosmetic only */ }
}

/**
 * Cleanup chart instance (call on page navigation).
 */
export function cleanupPerformanceChart() {
    if (_radarInstance) { _radarInstance.destroy(); _radarInstance = null; }
}

// ─── AI Performance Coach (up to 3×/day) ───────────────────────
/** Compact AI score block shown beside the formula ring (label/value/delta stacked). */
function aiScoreChipHtml(periodKey, composite) {
    const ai = getTodaysCachedAiScore(periodKey, composite);
    if (!ai) return '';
    const color = ai.score >= 80 ? '#16a34a' : ai.score >= 50 ? '#d97706' : '#dc2626';
    const delta = ai.score - Math.round(Number(composite) || 0);
    const deltaTxt = delta === 0 ? 'matches formula' : `${delta > 0 ? '+' : ''}${delta} vs formula`;
    const deltaShort = delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`;
    return `<div class="perf-ai-score-chip" title="${safeHtml(ai.reason || 'AI re-evaluated score')} — ${safeHtml(deltaTxt)}">
        <span class="perf-ai-score-chip__label"><i class="fa-solid fa-robot"></i> AI</span>
        <span class="perf-ai-score-chip__value" style="color:${color}">${ai.score}</span>
        <span class="perf-ai-score-chip__delta">${deltaShort}</span>
    </div>`;
}

function _coachSerClass(opts) {
    return `ser--${_coachSeriousness(opts)}`;
}

function aiCoachPlaceholderHtml(periodKey, composite) {
    const cached = getTodaysCachedNarrative(periodKey);
    const cachedScore = getTodaysCachedAiScore(periodKey, composite);
    const expanded = _coachExpanded(periodKey);
    const pending = !cached;
    const opts = pending
        ? { expanded, pending: true, stamp: '' }
        : { narrative: cached, aiScore: cachedScore?.score ?? null, scoreReason: cachedScore?.reason || '', expanded, stamp: '' };
    const cls = `perf-ai-coach ${_coachSerClass(opts)}${pending ? ' perf-ai-coach--pending' : ''}${expanded ? ' is-expanded' : ''}`;
    return `<div class="${cls}" data-perf-period="${safeHtml(periodKey)}">
        ${_coachInnerHtml(periodKey, opts)}
    </div>`;
}

/** Data-quality verdict chips — deterministic, independent of the AI. */
function dataCheckHtml(perfData) {
    try {
        const check = verifyPerformanceData(perfData);
        if (!check?.checks?.length) return '';
        const items = check.checks.map(c => {
            const icon = c.ok ? 'fa-circle-check' : 'fa-triangle-exclamation';
            const color = c.ok ? '#16a34a' : '#d97706';
            const title = c.ok ? (c.expected ? `Expected ~${c.expected}` : 'Consistent with raw data') : (c.note || 'Inconsistent with raw data');
            return `<span class="perf-datacheck__item" title="${safeHtml(title)}" style="color:${color};">
                <i class="fa-solid ${icon}"></i> ${safeHtml(c.dimension)}
            </span>`;
        }).join('');
        const verdict = check.allOk
            ? `<span style="color:#16a34a;font-weight:700;"><i class="fa-solid fa-shield-halved"></i> Data check passed</span>`
            : `<span style="color:#d97706;font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Data check: some scores look inconsistent — see highlights</span>`;
        return `<div class="perf-datacheck">
            <div class="perf-datacheck__verdict">${verdict}</div>
            <div class="perf-datacheck__items">${items}</div>
        </div>`;
    } catch { return ''; }
}

// ── Coach collapsible state (minimized by default, remembered per session) ──
const COACH_STATE_KEY = 'crwi_perf_ai_coach_expanded';

function _coachExpanded(periodKey) {
    try {
        const map = JSON.parse(sessionStorage.getItem(COACH_STATE_KEY) || '{}');
        return map[periodKey] === true;
    } catch { return false; }
}

function _setCoachExpanded(periodKey, expanded) {
    try {
        const map = JSON.parse(sessionStorage.getItem(COACH_STATE_KEY) || '{}');
        map[periodKey] = expanded;
        sessionStorage.setItem(COACH_STATE_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
}

window.app_togglePerfAICoach = (periodKey) => {
    const block = document.querySelector('.perf-ai-coach');
    if (!block) return;
    const expanded = !block.classList.contains('is-expanded');
    block.classList.toggle('is-expanded', expanded);
    _setCoachExpanded(periodKey, expanded);
    const chevron = block.querySelector('.perf-ai-coach__chevron i');
    if (chevron) chevron.className = expanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    const body = block.querySelector('.perf-ai-coach__collapsible');
    if (body) body.style.display = expanded ? 'block' : 'none';
};

/** Build the collapsible coach inner HTML: minimized one-line summary by
 *  default, expandable to the full narrative. Whole block is color-coded by
 *  seriousness: green (good, score ≥80) / amber (watch, 50-79) / red (needs
 *  attention, <50) / neutral gray (pending or unavailable). */
function _coachSeriousness(opts) {
    const { narrative, aiScore, pending } = opts;
    if (pending) return 'pending';
    if (!narrative) return 'unavailable';
    const s = Number(aiScore);
    if (!Number.isFinite(s)) return 'neutral';
    if (s >= 80) return 'good';
    if (s >= 50) return 'watch';
    return 'alert';
}

function _coachInnerHtml(periodKey, opts = {}) {
    const { narrative, aiScore, scoreReason, expanded, stamp } = opts;
    const hasBody = Boolean(narrative);
    const seriousness = _coachSeriousness(opts);
    const dot = `<span class="perf-ai-coach__dot perf-ai-coach__dot--${seriousness}"></span>`;
    const summary = hasBody
        ? `${aiScore != null ? `<span class="perf-ai-coach__peek-score perf-ai-coach__peek-score--${seriousness}" title="${safeHtml(scoreReason || 'AI re-evaluated score')}">AI Score: <strong>${aiScore}</strong></span>` : ''}
           <span class="perf-ai-coach__peek-text">${safeHtml(_oneLineSummary(narrative))}</span>`
        : `<span class="perf-ai-coach__peek-text" style="color:#94a3b8;">${opts.pending ? 'Analyzing your scores…' : 'AI analysis unavailable — formula scores unaffected.'}</span>`;
    return `
        <div class="perf-ai-coach__head" onclick="window.app_togglePerfAICoach('${safeHtml(periodKey)}')" role="button" aria-expanded="${expanded}" style="cursor:pointer;">
            <span class="perf-ai-coach__title">${dot}<i class="fa-solid fa-robot"></i> AI Coach — ${safeHtml(periodKey)}</span>
            <span class="perf-ai-coach__head-actions">
                <button class="perf-ai-coach__refresh" onclick="event.stopPropagation(); window.app_refreshPerfAI('${safeHtml(periodKey)}')" title="Get a fresh AI analysis"><i class="fa-solid fa-arrows-rotate"></i></button>
                <span class="perf-ai-coach__chevron"><i class="fa-solid ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i></span>
            </span>
        </div>
        <div class="perf-ai-coach__summary" style="${expanded && hasBody ? 'display:none;' : ''}">${summary}${stamp ? `<span class="perf-ai-coach__stamp">${stamp}</span>` : ''}</div>
        <div class="perf-ai-coach__collapsible" style="display:${expanded && hasBody ? 'block' : 'none'}">
            ${hasBody ? `${formatLabeledInsight(narrative)}
            <div class="perf-ai-coach__stamp">${stamp || ''}</div>` : ''}
        </div>`;
}

function _oneLineSummary(narrative) {
    // First meaningful line after "### Fact" — the strongest single-sentence take.
    const lines = String(narrative || '').split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (/^###/i.test(l)) continue;
        if (l.length > 8) return l.length > 90 ? l.slice(0, 90) + '…' : l;
    }
    return 'Tap to expand the AI analysis.';
}

/** Hydrate the AI coach block after the card is in the DOM. Runs the
 *  budgeted pipeline (daily classify backfill + up-to-3×/day narrative
 *  re-check). Idempotent. */
export async function hydrateAICoach(perfData, periodKey = 'week') {
    const container = document.querySelector('.perf-ai-coach');
    if (!container || !perfData || perfData.error) return;
    // Show cached AI score beside the formula ring before fetching
    _mountAiScoreChip(periodKey, perfData.composite);
    const expanded = _coachExpanded(periodKey);
    if (container.classList.contains('is-pending')) {
        container.classList.toggle('is-expanded', expanded);
        const body = container.querySelector('.perf-ai-coach__collapsible');
        if (body) body.style.display = 'none';
    }
    try {
        const { narrative, aiScore, scoreReason } = await runDailyPerformanceAI(perfData, periodKey);
        const fresh = document.querySelector('.perf-ai-coach');
        if (!fresh) return; // card re-rendered meanwhile
        const nowExpanded = _coachExpanded(periodKey);
        const stamp = `AI · updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · AI score shown beside the formula ring`;
        if (narrative) {
            fresh.classList.remove('perf-ai-coach--pending');
            fresh.classList.toggle('is-expanded', nowExpanded);
            const copts = { narrative, aiScore, scoreReason, expanded: nowExpanded, stamp };
            // swap seriousness color class
            for (const c of ['ser--good', 'ser--watch', 'ser--alert', 'ser--neutral', 'ser--pending', 'ser--unavailable']) fresh.classList.remove(c);
            fresh.classList.add(_coachSerClass(copts));
            fresh.innerHTML = _coachInnerHtml(periodKey, copts);
            _mountAiScoreChip(periodKey, perfData.composite);
        } else {
            // AI unavailable — minimized notice instead of a spinner or removal.
            fresh.classList.remove('perf-ai-coach--pending');
            fresh.innerHTML = _coachInnerHtml(periodKey, { expanded: nowExpanded, stamp: '' });
        }
    } catch (e) {
        console.warn('[PerfAI] hydrate failed:', e);
        const fresh = document.querySelector('.perf-ai-coach');
        if (fresh) {
            fresh.classList.remove('perf-ai-coach--pending');
            fresh.innerHTML = _coachInnerHtml(periodKey, { expanded: false, stamp: '', pending: false });
        }
    }
}

window.app_refreshPerfAI = async (periodKey) => {
    if (!_personalPerfUserId || !window.AppAnalytics?.getPersonalPerformance) return;
    const container = document.querySelector('.perf-ai-coach__body');
    if (container) container.innerHTML = '<span class="ai-chat-typing"><span></span><span></span><span></span></span> Re-analyzing…';
    try {
        const period = PERF_PERIODS.find(p => p.key === periodKey) || PERF_PERIODS[0];
        const perfData = await window.AppAnalytics.getPersonalPerformance(_personalPerfUserId, { windowDays: period.windowDays, trendWeeks: period.trendWeeks, calendarMonth: period.calendarMonth || false });
        if (perfData?.error) throw new Error('performance fetch failed');
        const { narrative, aiScore, scoreReason } = await refreshPerformanceAI(perfData, periodKey);
        const fresh = document.querySelector('.perf-ai-coach');
        if (!fresh) return;
        const nowExpanded = _coachExpanded(periodKey);
        if (narrative) {
            fresh.classList.toggle('is-expanded', nowExpanded);
            const copts = { narrative, aiScore, scoreReason, expanded: nowExpanded, stamp: `AI · updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · AI score shown beside the formula ring` };
            for (const c of ['ser--good', 'ser--watch', 'ser--alert', 'ser--neutral', 'ser--pending', 'ser--unavailable']) fresh.classList.remove(c);
            fresh.classList.add(_coachSerClass(copts));
            fresh.innerHTML = _coachInnerHtml(periodKey, copts);
            _mountAiScoreChip(periodKey, perfData.composite);
        } else {
            fresh.innerHTML = _coachInnerHtml(periodKey, { expanded: nowExpanded, stamp: '' });
        }
    } catch (e) {
        console.warn('[PerfAI] refresh failed:', e);
        if (container) container.innerHTML = '<span style="color:#94a3b8;font-size:0.8rem;">AI analysis unavailable &mdash; tap refresh to retry.</span>';
    }
};

// ─── Team Performance (Expanded View) ──────────────────────────

function teamDimMiniBar(score) {
    const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
    return `<div class="perf-team-mini-bar" style="width:${Math.min(100, score)}%;background:${color};"></div>`;
}



// Cache fetched results per period so tab switching is instant
let _perfTeamCache = {};
let _perfTeamAllUsers = null;

function perfPeriodTabsHtml(activeKey) {
    return PERF_PERIODS.map(p =>
        `<button class="perf-team-tab ${p.key === activeKey ? 'active' : ''}" onclick="window.app_switchPerfPeriod('${p.key}')">${safeHtml(p.label)}</button>`
    ).join('');
}

function perfTeamRowHtml(r) {
    if (!r.perf) return `
        <div class="perf-team-row perf-team-row-empty">
            <div class="perf-team-avatar"><img src="${safeUrl(r.user.avatar || '')}" alt="" loading="lazy"></div>
            <div class="perf-team-name">${safeHtml(r.user.name)}</div>
            <div class="perf-team-empty-msg">No data</div>
        </div>`;
    return `
        <div class="perf-team-row">
            <div class="perf-team-avatar"><img src="${safeUrl(r.user.avatar || '')}" alt="" loading="lazy"></div>
            <div class="perf-team-name-col">
                <div class="perf-team-name">${safeHtml(r.user.name)}</div>
                <div class="perf-team-role">${safeHtml(r.user.role || 'Staff')}</div>
            </div>
            <div class="perf-team-score-badge" style="background:${r.perf.composite >= 80 ? '#dcfce7' : r.perf.composite >= 50 ? '#fef3c7' : '#fee2e2'};color:${r.perf.composite >= 80 ? '#16a34a' : r.perf.composite >= 50 ? '#92400e' : '#991b1b'}">${r.perf.composite}</div>
            <div class="perf-team-dims">
                ${Object.values(r.perf.dimensions).map(dim => `
                    <div class="perf-team-dim">
                        <span class="perf-team-dim-name">${safeHtml(dim.label)}</span>
                        <div class="perf-team-mini-bar-wrap">${teamDimMiniBar(dim.score)}</div>
                        <span class="perf-team-dim-val">${dim.score}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

function renderPerfTeamResults(results, periodKey) {
    const period = PERF_PERIODS.find(p => p.key === periodKey) || PERF_PERIODS[0];
    const scored = results.filter(r => r.perf?.composite > 0);
    const avgComposite = scored.length > 0
        ? Math.round(scored.reduce((s, r) => s + r.perf.composite, 0) / scored.length)
        : 0;

    return `
        <div class="perf-team-wrap">
            <div class="perf-team-tabs">
                ${perfPeriodTabsHtml(periodKey)}
            </div>
            <div class="perf-team-header">
                <h4>Team Performance — ${safeHtml(period.label)}</h4>
                <div class="perf-team-avg-badge">Team avg: <strong>${avgComposite}</strong></div>
            </div>
            <div class="perf-team-list">
                ${results.map(perfTeamRowHtml).join('')}
            </div>
        </div>`;
}

async function fetchTeamPerformance(allUsers, periodKey) {
    const period = PERF_PERIODS.find(p => p.key === periodKey) || PERF_PERIODS[0];
    const analytics = window.AppAnalytics;
    const results = [];
    const BATCH = 5;
    const TIMEOUT_MS = 15000;
    const withTimeout = (promise, ms) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
    for (let i = 0; i < allUsers.length; i += BATCH) {
        const batch = allUsers.slice(i, i + BATCH);
        const batchResults = await Promise.all(
            batch.map(u => withTimeout(
                analytics.getPersonalPerformance(u.id, { windowDays: period.windowDays, trendWeeks: period.trendWeeks, calendarMonth: period.calendarMonth || false }),
                TIMEOUT_MS
            ).catch(e => { console.warn('[Perf]', u.name, period.key, e.message); return null; }))
        );
        results.push(...batchResults.map((perf, idx) => ({
            user: batch[idx],
            perf: perf
        })));
    }
    results.sort((a, b) => (b.perf?.composite || 0) - (a.perf?.composite || 0));
    return results;
}

/**
 * Load and display team performance for a given period.
 * Uses cache for instant tab switching after first load.
 */
async function loadAndRenderTeam(allUsers, periodKey, container) {
    if (_perfTeamCache[periodKey]) {
        container.innerHTML = renderPerfTeamResults(_perfTeamCache[periodKey], periodKey);
        return;
    }
    container.innerHTML = `<div class="perf-team-loading">
        <span class="perf-team-loading-dot"></span>
        <span class="perf-team-loading-dot"></span>
        <span class="perf-team-loading-dot"></span>
        <div>Computing scores for ${allUsers.length} staff...</div>
    </div>`;
    try {
        const results = await fetchTeamPerformance(allUsers, periodKey);
        _perfTeamCache[periodKey] = results;
        container.innerHTML = renderPerfTeamResults(results, periodKey);
    } catch (err) {
        console.error('[Perf] Team fetch failed:', err);
        container.innerHTML = `<div style="padding:1.5rem;color:#991b1b;">Failed to load team performance. Please try again.</div>`;
    }
}

/**
 * Tab-switching handler (global, called from onclick).
 */
window.app_switchPerfPeriod = (periodKey) => {
    const container = document.getElementById('perf-team-expanded');
    if (!container || !_perfTeamAllUsers) return;
    loadAndRenderTeam(_perfTeamAllUsers, periodKey, container);
};

/**
 * Fetches all staff performance and renders the team expanded view.
 * Called by the card-mode hook after the overlay opens.
 */
export async function renderTeamPerformanceExpanded() {
    const container = document.getElementById('perf-team-expanded');
    if (!container) return;

    const analytics = window.AppAnalytics;
    const auth = window.AppAuth;
    if (!analytics?.getPersonalPerformance || !auth?.getUser) {
        container.innerHTML = '<div style="padding:1rem;color:#94a3b8;">Performance data unavailable.</div>';
        return;
    }

    // Get all users (exclude demo)
    let allUsers = [];
    try {
        allUsers = await window.AppUserService.getAll();
        allUsers = allUsers.filter(u => u && u.id && !window.AppConfig?.isDemoUser?.(u));
    } catch { allUsers = []; }

    if (allUsers.length === 0) {
        container.innerHTML = '<div style="padding:1rem;color:#94a3b8;">No staff found.</div>';
        return;
    }

    _perfTeamAllUsers = allUsers;
    _perfTeamCache = {}; // reset cache on fresh open
    await loadAndRenderTeam(allUsers, 'week', container);
}
