// sw.js - Service Worker
// Version: 1.0.2 (Fixed Chrome Extension Error)
// Strategy: Stale-While-Revalidate for Core, Cache-First for Assets

const CACHE_NAME = 'reel-rpg-v1.0.2'; // Bumping version to force update

// 1. CORE ASSETS
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

// --- INSTALL EVENT ---
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting();
});

// --- ACTIVATE EVENT ---
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// --- FETCH EVENT ---
self.addEventListener('fetch', (event) => {
    // FIX 1: Ignore non-GET requests (POST, HEAD, etc.)
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // FIX 2: Ignore non-HTTP requests (Chrome Extensions, file://, data:, etc.)
    if (!requestUrl.protocol.startsWith('http')) return;

    // STRATEGY A: Cache First for Game Assets (Images/Audio)
    if (requestUrl.hostname.includes('github.com') || requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|mp3|wav)$/)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                        return networkResponse;
                    }
                    
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
                // Network failed? That's fine, return cached response if present.
            });

            return cachedResponse || fetchPromise;
        })
    );
});