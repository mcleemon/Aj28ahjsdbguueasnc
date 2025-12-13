// loader.js
// v1.0.7 (Smart Asset Loading for DIVs)

// 1. Import the asset map
import { GAME_ASSETS } from './assets.js';

// 2. Preload all assets from the map
function preloadAssets() {
    const imageUrls = Object.values(GAME_ASSETS);
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// 3. This function runs when the HTML content is ready
function populateAssets() {
    // A. Handle standard [data-asset-key] elements
    // This now works for BOTH <img> tags and <div> tags
    const assetElements = document.querySelectorAll('[data-asset-key]');
    assetElements.forEach(el => {
        const key = el.dataset.assetKey;
        if (GAME_ASSETS[key]) {
            if (el.tagName === 'IMG') {
                el.src = GAME_ASSETS[key];
            } else {
                // If it's a DIV, use background-image
                el.style.backgroundImage = `url('${GAME_ASSETS[key]}')`;
            }
        } else {
            console.warn(`[Loader] Asset key not found: ${key}`);
        }
    });

    // B. Handle specific [data-asset-bg-key] elements (Always Background)
    const bgElements = document.querySelectorAll('[data-asset-bg-key]');
    bgElements.forEach(el => {
        const key = el.dataset.assetBgKey;
        if (GAME_ASSETS[key]) {
            el.style.backgroundImage = `url('${GAME_ASSETS[key]}')`;
        } else {
            console.warn(`[Loader] Background asset key not found: ${key}`);
        }
    });
}

// 4. Run the functions
preloadAssets();
document.addEventListener('DOMContentLoaded', populateAssets);