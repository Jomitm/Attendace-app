import { defineConfig, loadEnv } from 'vite';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { readBuildMeta } = require('./scripts/build-meta.cjs');
const buildMeta = readBuildMeta(process.cwd());
const __dirname = dirname(fileURLToPath(import.meta.url));

function readBody(req) {
    return new Promise((resolveBody, rejectBody) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8').trim();
            if (!raw) {
                resolveBody({});
                return;
            }
            try {
                resolveBody(JSON.parse(raw));
            } catch (err) {
                rejectBody(err);
            }
        });
        req.on('error', rejectBody);
    });
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

function createAssistantDevPlugin(runtimeEnv) {
    return {
        name: 'assistant-dev-api',
        configureServer(server) {
            const handlerPath = resolve(__dirname, './api/assistant.js');
            const handler = require(handlerPath);
            server.middlewares.use(async (req, res, next) => {
                const url = String(req.url || '').split('?')[0];
                if (url !== '/ai/assistant' && url !== '/api/assistant') {
                    next();
                    return;
                }

                try {
                    if (req.method === 'GET') {
                        sendJson(res, 200, {
                            ok: true,
                            route: '/ai/assistant',
                            backendRoute: '/api/assistant',
                            configured: !!String(runtimeEnv.OPENROUTER_API_KEY || '').trim(),
                            modes: ['staff-plan', 'checkout-summary', 'admin-report'],
                            defaultModel: String(runtimeEnv.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim()
                        });
                        return;
                    }

                    if (req.method !== 'POST') {
                        res.setHeader('Allow', 'GET, POST');
                        sendJson(res, 405, { ok: false, error: 'Method not allowed' });
                        return;
                    }

                    const body = await readBody(req);
                    req.body = body;
                    await handler(req, res);
                } catch (err) {
                    sendJson(res, 500, { ok: false, error: err?.message || 'Assistant dev route failed' });
                }
            });
        }
    };
}

export default defineConfig({
    root: './',
    plugins: (() => {
        const runtimeEnv = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
        Object.assign(process.env, runtimeEnv);
        return [createAssistantDevPlugin({ ...process.env, ...runtimeEnv })];
    })(),
    define: {
        __APP_BUILD_META__: JSON.stringify(buildMeta)
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: './index.html',
            },
        },
    },
    server: {
        port: 3000,
    },
});
