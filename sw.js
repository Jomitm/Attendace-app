/**
 * Service Worker - Offline Caching
 * Ensures the website loads instantly even on slow/no internet.
 */

const CACHE_NAME = 'crwi-attendance-v3';
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
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap'
];

// Install Event - Cache Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Fetch Event - Serve from Cache, Fallback to Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
