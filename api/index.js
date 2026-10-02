// api/index.js - the single counted Vercel Serverless Function for /api/*.
//
// Hobby plan caps deployments at 12 functions; the 13 endpoint files are
// underscore-prefixed (api/_*.js, which Vercel does not count) and dispatched
// from here. vercel.json rewrites each /api/<route> to
// /api/index?route=<route>; resolveRoute() also accepts the original
// /api/<route> path form, so routing works whether or not the platform
// preserves the rewrite's query string.
//
// Before delegating, req.url is rewritten back to the canonical
// /api/<route>[?<query>] and req.query is re-derived from it, so handlers
// (which read req.query) see exactly the parameters they saw when they were
// standalone functions.

import aiBriefing from './_ai-briefing.js';
import aiInsights from './_ai-insights.js';
import authLogin from './_auth-login.js';
import authSetPassword from './_auth-set-password.js';
import calendarFeed from './_calendar-feed.js';
import calendarToken from './_calendar-token.js';
import feastProxy from './_feast-proxy.js';
import heroSelect from './_hero-select.js';
import telegramGenerateLink from './_telegram-generate-link.js';
import telegramRegisterWebhook from './_telegram-register-webhook.js';
import telegramScheduler from './_telegram-scheduler.js';
import telegramSend from './_telegram-send.js';
import telegramWebhook from './_telegram-webhook.js';

export const ROUTES = {
    'ai-briefing': aiBriefing,
    'ai-insights': aiInsights,
    'auth-login': authLogin,
    'auth-set-password': authSetPassword,
    'calendar-feed': calendarFeed,
    'calendar-token': calendarToken,
    'feast-proxy': feastProxy,
    'hero-select': heroSelect,
    'telegram-generate-link': telegramGenerateLink,
    'telegram-register-webhook': telegramRegisterWebhook,
    'telegram-scheduler': telegramScheduler,
    'telegram-send': telegramSend,
    'telegram-webhook': telegramWebhook
};

// Pure: split a request URL into { route, query } where `query` is the
// original query string with the `route` marker removed. Accepts both
// canonical paths (/api/auth-login?x=1) and rewritten ones
// (/api/index?route=auth-login&x=1). An explicit path always wins over a
// query-string route so ?route= cannot hijack a real endpoint.
export function resolveRoute(reqUrl) {
    const raw = typeof reqUrl === 'string' ? reqUrl : '';
    const qIndex = raw.indexOf('?');
    const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    const query = qIndex === -1 ? '' : raw.slice(qIndex + 1);

    const segments = path.split('/').filter(Boolean);
    let route = '';
    if (segments[0] === 'api') {
        if (segments[1] === 'index') route = segments[2] || '';
        else route = segments[1] || '';
    }
    if (route === 'index') route = '';

    const kept = [];
    if (query) {
        for (const part of query.split('&')) {
            const eq = part.indexOf('=');
            const key = eq === -1 ? part : part.slice(0, eq);
            if (key === 'route') {
                if (!route) {
                    try {
                        route = decodeURIComponent(eq === -1 ? '' : part.slice(eq + 1));
                    } catch {
                        route = '';
                    }
                }
            } else {
                kept.push(part);
            }
        }
    }

    return { route, query: kept.join('&') };
}

export default function handler(req, res) {
    const { route, query } = resolveRoute(req && req.url);
    const target = ROUTES[route];

    if (typeof target !== 'function') {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Not found', route: route || null }));
        return;
    }

    // Canonical URL for the handler (handlers may inspect it in the future;
    // today they read req.query, which we also re-derive below).
    req.url = '/api/' + route + (query ? '?' + query : '');

    try {
        const parsed = {};
        for (const [key, value] of new URLSearchParams(query)) parsed[key] = value;
        req.query = { ...(req.query || {}), ...parsed };
    } catch {
        // Keep whatever the runtime provided.
    }

    return target(req, res);
}
