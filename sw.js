// sw.js - Service Worker
// Version: 1.0.4 (Force Cache Update)
// Strategy: Cache-First for Assets (GitHub), Stale-While-Revalidate for Core

const CACHE_NAME = 'reel-rpg-v1.0.4'; // <--- BUMPED VERSION

// 1. CORE ASSETS (Local files)
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './reel-game.css',
    './blackjack.css',
    './script.js',
    './assets.js',
    './loader.js',
    './scaler.js',
    './hero.js',
    './dungeon.js',
    './items.js',
    './smithy.js',
    './shop.js',
    './tasks.js',
    './heroMenu.js',
    './blackjack.js',
    './mimic.js',
    './audioManager.js',
    './reel-game.js',
    './mining.js',
    './achievements.js' // Added achievements.js which was missing in previous list
];

// --- INSTALL EVENT ---
self.addEventListener('install', (event) => {
    console.log(`[Service Worker] Installing ${CACHE_NAME}...`);
    // Force this SW to become the active one immediately, skipping the "waiting" phase
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching Core Assets');
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// --- ACTIVATE EVENT ---
self.addEventListener('activate', (event) => {
    console.log(`[Service Worker] Activating ${CACHE_NAME}...`);
    // Force this SW to claim control of all clients immediately
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim()) // <--- IMPORTANT: Take control immediately
    );
});

// --- FETCH EVENT ---
self.addEventListener('fetch', (event) => {
    // 1. Ignore non-GET requests
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // 2. Ignore non-HTTP (extensions, data uris)
    if (!requestUrl.protocol.startsWith('http')) return;

    // STRATEGY A: Cache First for Game Assets (GitHub Images/Audio)
    // We check for github.com OR common media extensions
    if (requestUrl.hostname.includes('github.com') || requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|mp3|wav)$/)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // Hit? Return it immediately (Zero Lag)
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Miss? Fetch from network
                return fetch(event.request).then((networkResponse) => {
                    // Check if valid response
                    // Note: We allow type 'opaque' (status 0) or 'cors' for external images
                    if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                        return networkResponse;
                    }
                    
                    // Clone and Cache
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }).catch(err => {
                    console.warn("[Service Worker] Fetch failed for asset:", event.request.url);
                });
            })
        );
        return;
    }

    // STRATEGY B: Network First (with Cache Fallback) for HTML/JS/CSS
    // Ideally, for development, we want Network First to see your code changes.
    // For production, Stale-While-Revalidate is better.
    // Let's use Stale-While-Revalidate: Use cache, but update in background.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Network failed?
            });

            // Return cached response immediately if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});