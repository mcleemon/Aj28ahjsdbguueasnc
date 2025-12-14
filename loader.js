// loader.js
// v1.0.8 (Smart Asset Loading + Protection)

import { GAME_ASSETS } from './assets.js';

// 1. Preload assets
function preloadAssets() {
    const imageUrls = Object.values(GAME_ASSETS);
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// 2. Main Loading Function
function populateAssets() {
    // Handle standard [data-asset-key] elements
    const assetElements = document.querySelectorAll('[data-asset-key]');
    assetElements.forEach(el => {
        const key = el.dataset.assetKey;
        if (GAME_ASSETS[key]) {
            // SMART CHECK: Is it an IMG or a DIV?
            if (el.tagName === 'IMG') {
                el.src = GAME_ASSETS[key];
                // Apply "Ghost" protection to static images
                el.style.pointerEvents = 'none'; 
            } else {
                // It's a DIV (The Protected Button)
                el.style.backgroundImage = `url('${GAME_ASSETS[key]}')`;
                el.style.backgroundSize = 'contain';
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundPosition = 'center';
            }
        }
    });

    // Handle background-only elements (Keep existing logic)
    const bgElements = document.querySelectorAll('[data-asset-bg-key]');
    bgElements.forEach(el => {
        const key = el.dataset.assetBgKey;
        if (GAME_ASSETS[key]) {
            el.style.backgroundImage = `url('${GAME_ASSETS[key]}')`;
        }
    });
}

preloadAssets();
document.addEventListener('DOMContentLoaded', populateAssets);