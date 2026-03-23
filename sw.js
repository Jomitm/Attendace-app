/**
 * Service Worker - Offline Caching
 * Ensures the website loads instantly even on slow/no internet.
 */

// bump this version whenever static assets change so clients reload fresh copies
const CACHE_NAME = 'crwi-attendance-v20';
const RUNTIME_CACHE = 'crwi-attendance-runtime';
const OFFLINE_URL = './offline.html';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/main.css',
    './js/app.js',
    './js/ui.js',
    './js/modules/auth.js',
    './js/modules/attendance.js',
    './js/modules/db.js',
    './js/modules/reports.js',
    './js/modules/leaves.js',
    './js/modules/calendar.js',
    './js/modules/analytics.js',
    './js/modules/activity.js',
    './js/modules/simulation.js',
    './js/modules/tour.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './offline.html'
];

// Install Event - Cache Assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                await cache.addAll(ASSETS_TO_CACHE);
            } catch (error) {
                // Best-effort precache if addAll fails (e.g., one bad request)
                await Promise.all(
                    ASSETS_TO_CACHE.map(async (url) => {
                        try {
                            await cache.add(url);
                        } catch (_) {
                            // ignore individual failures
                        }
                    })
                );
            }
        })()
    );
});

// Fetch Event - Serve from Cache, Fallback to Network
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    const isSameOrigin = requestUrl.origin === self.location.origin;

    // Navigation requests: network-first, fallback to offline shell
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const networkResponse = await fetch(event.request);
                    const cache = await caches.open(RUNTIME_CACHE);
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    const cache = await caches.open(CACHE_NAME);
                    const cachedOffline = await cache.match(OFFLINE_URL);
                    return cachedOffline || caches.match(event.request);
                }
            })()
        );
        return;
    }

    // Static assets: stale-while-revalidate for same-origin assets
    if (isSameOrigin && ['style', 'script', 'image', 'font'].includes(event.request.destination)) {
        event.respondWith(
            (async () => {
                const cached = await caches.match(event.request);
                const fetchPromise = (async () => {
                    try {
                        const response = await fetch(event.request);
                        const cache = await caches.open(RUNTIME_CACHE);
                        if (response && (response.ok || response.type === 'opaque')) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    } catch (error) {
                        return cached;
                    }
                })();
                return cached || fetchPromise;
            })()
        );
        return;
    }

    // Cross-origin static assets (e.g., fonts/icons): stale-while-revalidate
    if (!isSameOrigin && ['style', 'script', 'image', 'font'].includes(event.request.destination)) {
        event.respondWith(
            (async () => {
                const cached = await caches.match(event.request);
                const fetchPromise = (async () => {
                    try {
                        const response = await fetch(event.request, { mode: 'no-cors' });
                        const cache = await caches.open(RUNTIME_CACHE);
                        if (response) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    } catch (error) {
                        return cached;
                    }
                })();
                return cached || fetchPromise;
            })()
        );
        return;
    }

    // Default: cache-first, then network, with runtime caching
    event.respondWith(
        (async () => {
            const cached = await caches.match(event.request);
            if (cached) {
                return cached;
            }
            try {
                const response = await fetch(event.request);
                const cache = await caches.open(RUNTIME_CACHE);
                if (response && (response.ok || response.type === 'opaque')) {
                    cache.put(event.request, response.clone());
                }
                return response;
            } catch (error) {
                return cached;
            }
        })()
    );
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                    return undefined;
                })
            );
            await self.clients.claim();
        })()
    );
});




