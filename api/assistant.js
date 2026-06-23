// grokHandler.js is currently written as CommonJS (module.exports = ...).
// But runtime/CJS loader can still return weird shapes under Vite/interop,
// so we dynamically resolve and always call the resolved function.
const grokModule = require('./grokHandler.js');

async function resolveGrokHandlerFn() {
  // direct callable
  if (typeof grokModule === 'function') return grokModule;

  // possible interop shapes
  if (grokModule && typeof grokModule.default === 'function') return grokModule.default;

  // as a last resort, try dynamic import
  try {
    const mod = await import('./grokHandler.js');
    if (mod && typeof mod.default === 'function') return mod.default;
  } catch {
    // ignore
  }

  return null;
}

module.exports = async (req, res) => {
  try {
    const handlerFn = await resolveGrokHandlerFn();

    if (typeof handlerFn !== 'function') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: false,
        mode: String(req?.body?.mode || 'staff-plan'),
        summary: 'No AI suggestions available, please draft manually.',
        suggestedActions: [],
        taskSuggestions: [],
        tomorrowGoal: '',
        warnings: ['grokHandler is not a function'],
        sourceScope: String(req?.body?.sourceScope || 'unknown'),
        draft: null,
        audit: {
          fallback: true,
          reason: 'grokHandler is not a function',
          loggedAt: new Date().toISOString()
        }
      }));
      return;
    }

    return await handlerFn(req, res);
  } catch (err) {
    const message = err?.message ? String(err.message) : 'grok_handler_failed';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      ok: false,
      mode: String(req?.body?.mode || 'staff-plan'),
      summary: 'No AI suggestions available, please draft manually.',
      suggestedActions: [],
      taskSuggestions: [],
      tomorrowGoal: '',
      warnings: [message],
      sourceScope: String(req?.body?.sourceScope || 'unknown'),
      draft: null,
      audit: {
        fallback: true,
        reason: message,
        loggedAt: new Date().toISOString()
      }
    }));
  }
};
