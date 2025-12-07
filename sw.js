// sw.js - Service Worker
// Version: 1.0.0
// Strategy: Stale-While-Revalidate for Core, Cache-First for Assets

const CACHE_NAME = 'reel-rpg-v1';

// 1. CORE ASSETS (Download these immediately on install)
// These are the skeleton of your game.
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
    './mining.js'
];

// --- INSTALL EVENT (Runs once when new SW is detected) ---
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching Core Assets');
            return cache.addAll(CORE_ASSETS);
        })
    );
    // Force this SW to become active immediately
    self.skipWaiting();
});

// --- ACTIVATE EVENT (Runs when SW starts up) ---
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                // Delete old cache versions if name doesn't match current
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // Claim control of all open clients immediately
    return self.clients.claim();
});

// --- FETCH EVENT (Intersects every network request) ---
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // STRATEGY A: Cache First for Game Assets (Images/Audio)
    // If it's a GitHub raw image or sound file, we want to save it forever.
    if (requestUrl.hostname.includes('github.com') || requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|mp3|wav)$/)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse; // Return from cache
                }
                // If not in cache, fetch it from network and save it
                return fetch(event.request).then((networkResponse) => {
                    // Check if valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                        return networkResponse;
                    }
                    
                    // Clone response (streams can only be consumed once)
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                });
            })
        );
        return;
    }

    // STRATEGY B: Stale-While-Revalidate for Core Files (HTML/JS/CSS)
    // Serve cached version instantly, but check network for updates in background.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Update the cache with the new version
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Network failed? That's fine, we hopefully returned cachedResponse.
            });

            // Return cached response immediately if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});