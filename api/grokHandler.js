module.exports = async function handler(req, res) {
  // Contract: return { ok, mode, summary, suggestedActions, taskSuggestions, tomorrowGoal, warnings, sourceScope, draft, audit }
  // Your current frontend Day Planner validates these fields.
  const mode = String(req?.body?.mode || 'staff-plan');
  const sourceScope = String(req?.body?.sourceScope || 'unknown');

  const warnings = [];

  try {
    const fetchFn = globalThis.fetch;
    if (typeof fetchFn !== 'function') throw new Error('fetch not available');

    const apiKey = process.env.GROK_API_KEY;
    if (!String(apiKey || '').trim()) {
      warnings.push('GROK_API_KEY missing');
      return endOk({
        res,
        payload: buildFallback(mode, sourceScope, warnings)
      });
    }

    // Call Grok (fallback to OpenRouter-compatible JSON mapping later if needed)
    const response = await fetchFn('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${String(apiKey).trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: String(process.env.GROK_MODEL || 'grok-beta'),


        messages: [
          { role: 'system', content: 'Return a SINGLE JSON object only.' },
          {
            role: 'user',
            content: `Mode: ${mode}\nSourceScope: ${sourceScope}\nContext JSON:\n${JSON.stringify(req?.body?.context || {})}`
          }
        ],
        temperature: 0.2,
        max_tokens: 900,
        // xAI model name must exist in your account; fallback if grok-beta isn't available
      })
    });


    const text = await response.text();
    if (!response.ok) {
      // Include upstream body for debugging 400/401/etc.
      let upstreamSnippet = '';
      try {
        upstreamSnippet = typeof text === 'string' ? text.slice(0, 1400) : '';
      } catch {
        upstreamSnippet = '';
      }
      warnings.push(`upstream_status_${response.status}`);
      if (upstreamSnippet) warnings.push(upstreamSnippet);

      return endOk({
        res,
        payload: buildFallback(mode, sourceScope, warnings)
      });
    }



    // Try to interpret Grok response JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    const content = parsed?.choices?.[0]?.message?.content || parsed?.choices?.[0]?.text || '';

    // We expect the model to return JSON object; extract if wrapped.
    const extracted = extractJson(content);

    if (!extracted) {
      warnings.push('Model returned non-JSON content');
      return endOk({ res, payload: buildFallback(mode, sourceScope, warnings) });
    }

    // Minimal validation to satisfy frontend.
    // If your model doesn't follow schema exactly, this still produces a valid object.
    const out = normalizeAssistantOutput(mode, extracted, sourceScope);
    return endOk({ res, payload: out });
  } catch (err) {
    warnings.push(err?.message ? String(err.message) : 'grok_request_failed');
    return endOk({
      res,
      payload: buildFallback(mode, sourceScope, warnings)
    });
  }
};

function endOk({ res, payload }) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function trimTo(value, maxLen) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!maxLen || text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1)).trim()}...`;
}

function extractJson(text) {
  if (text === null || text === undefined) return null;
  const raw = String(text).trim();
  if (!raw) return null;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1].trim() : raw;

  const firstBrace = source.indexOf('{');
  const lastBrace = source.lastIndexOf('}');
  const candidate = firstBrace >= 0 && lastBrace > firstBrace ? source.slice(firstBrace, lastBrace + 1) : source;

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function buildFallback(mode, sourceScope, warnings) {
  return {
    ok: false,
    mode,
    summary: 'No AI suggestions available, please draft manually.',
    suggestedActions: [],
    taskSuggestions: [],
    tomorrowGoal: '',
    warnings: Array.isArray(warnings) ? warnings.slice(0, 8).map((w) => trimTo(w, 180)) : ['assistant_unavailable'],
    sourceScope: trimTo(sourceScope || 'unknown', 240),
    draft:
      mode === 'staff-plan'
        ? {
            task: '',
            subPlans: [],
            status: '',
            budgetHeadId: '',
            assignedTo: '',
            startDate: '',
            endDate: ''
          }
        : mode === 'checkout-summary'
          ? {
              summary: '',
              tomorrowGoal: '',
              taskSuggestions: [],
              budgetHeadId: ''
            }
          : null,
    audit: {
      fallback: true,
      reason: 'grok_fallback',
      loggedAt: new Date().toISOString()
    }
  };
}

function normalizeAssistantOutput(mode, extracted, sourceScope) {
  const summary = trimTo(extracted?.summary || '', 700);
  const warnings = Array.isArray(extracted?.warnings) ? extracted.warnings : [];
  const suggestedActions = Array.isArray(extracted?.suggestedActions)
    ? extracted.suggestedActions
    : Array.isArray(extracted?.taskSuggestions)
      ? extracted.taskSuggestions
      : [];
  const taskSuggestions = Array.isArray(extracted?.taskSuggestions)
    ? extracted.taskSuggestions
    : Array.isArray(extracted?.suggestedActions)
      ? extracted.suggestedActions
      : [];

  const draft = mode === 'staff-plan' ? extracted?.draft : extracted?.draft;

  if (mode === 'staff-plan') {
    const d = draft && typeof draft === 'object' ? draft : {};
    const task = trimTo(d?.task || '', 500);
    if (!task) {
      return buildFallback(mode, sourceScope, ['missing_draft_task']);
    }

    return {
      ok: extracted?.ok !== false,
      mode,
      summary: summary || trimTo(task, 700),
      suggestedActions: suggestedActions.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
      taskSuggestions: taskSuggestions.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
      tomorrowGoal: '',
      warnings: warnings.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
      sourceScope: trimTo(sourceScope || 'unknown', 240),
      draft: {
        task,
        subPlans: Array.isArray(d?.subPlans) ? d.subPlans.slice(0, 10).map((x) => trimTo(x, 180)).filter(Boolean) : [],
        status: trimTo(d?.status || '', 40),
        budgetHeadId: trimTo(d?.budgetHeadId || '', 80),
        assignedTo: trimTo(d?.assignedTo || '', 120),
        startDate: trimTo(d?.startDate || '', 20),
        endDate: trimTo(d?.endDate || '', 20)
      },
      audit: {
        fallback: false,
        loggedAt: new Date().toISOString()
      }
    };
  }

  if (mode === 'checkout-summary') {
    const d = draft && typeof draft === 'object' ? draft : {};
    const s = trimTo(d?.summary || extracted?.summary || '', 700);
    if (!s) return buildFallback(mode, sourceScope, ['missing_checkout_summary']);

    return {
      ok: extracted?.ok !== false,
      mode,
      summary: s,
      suggestedActions: suggestedActions.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
      taskSuggestions: taskSuggestions.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
      tomorrowGoal: trimTo(d?.tomorrowGoal || extracted?.tomorrowGoal || '', 500),
      warnings: warnings.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
      sourceScope: trimTo(sourceScope || 'unknown', 240),
      draft: {
        summary: s,
        tomorrowGoal: trimTo(d?.tomorrowGoal || extracted?.tomorrowGoal || '', 500),
        taskSuggestions: taskSuggestions.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
        budgetHeadId: trimTo(d?.budgetHeadId || '', 80)
      },
      audit: {
        fallback: false,
        loggedAt: new Date().toISOString()
      }
    };
  }

  // admin-report style
  return {
    ok: extracted?.ok !== false,
    mode,
    summary: summary || trimTo(extracted?.narrative || '', 700),
    suggestedActions: suggestedActions.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
    taskSuggestions: taskSuggestions.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
    tomorrowGoal: '',
    warnings: warnings.slice(0, 8).map((x) => trimTo(x, 180)).filter(Boolean),
    sourceScope: trimTo(sourceScope || 'unknown', 240),
    draft: null,
    audit: {
      fallback: false,
      loggedAt: new Date().toISOString()
    }
  };
}

