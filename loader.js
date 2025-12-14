// loader.js
// Features: Asset Loading + Anti-Save Protection (Friend's Fix)

import { GAME_ASSETS } from './assets.js';

// 1. Preload images into memory
function preloadAssets() {
    const imageUrls = Object.values(GAME_ASSETS);
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// 2. Apply Protections (The Fix)
function hardenElement(el) {
    // Disable Dragging (Native HTML)
    el.setAttribute('draggable', 'false');
    
    // Disable Context Menu (JS Event)
    el.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    // Disable Drag Start (JS Event)
    el.ondragstart = function(e) {
        e.preventDefault();
        return false;
    };

    // Force Inline CSS (Overrides anything else)
    el.style.webkitUserDrag = 'none';
    el.style.webkitTouchCallout = 'none';
    el.style.userSelect = 'none';
    el.style.touchAction = 'manipulation';
}

// 3. Populate HTML with Assets
function populateAssets() {
    // Handle standard [data-asset-key] (Images or Divs)
    const assetElements = document.querySelectorAll('[data-asset-key]');
    assetElements.forEach(el => {
        const key = el.dataset.assetKey;
        if (GAME_ASSETS[key]) {
            if (el.tagName === 'IMG') {
                el.src = GAME_ASSETS[key];
            } else {
                el.style.backgroundImage = `url('${GAME_ASSETS[key]}')`;
            }
            hardenElement(el); // <--- APPLY PROTECTION
        }
    });

    // Handle background-only elements
    const bgElements = document.querySelectorAll('[data-asset-bg-key]');
    bgElements.forEach(el => {
        const key = el.dataset.assetBgKey;
        if (GAME_ASSETS[key]) {
            el.style.backgroundImage = `url('${GAME_ASSETS[key]}')`;
            hardenElement(el); // <--- APPLY PROTECTION
        }
    });

    // Extra Sweep: Protect ANY image tag in the document
    document.querySelectorAll('img').forEach(img => {
        hardenElement(img);
    });
}

// Run
preloadAssets();
document.addEventListener('DOMContentLoaded', populateAssets);