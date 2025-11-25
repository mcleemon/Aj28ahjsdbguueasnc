// loader.js
// v1.0.6

// 1. Import the asset map
import { GAME_ASSETS } from './assets.js';

// 2. Preload all assets from the map
function preloadAssets() {
    const imageUrls = Object.values(GAME_ASSETS);
    // console.log(`[Loader] Preloading ${imageUrls.length} assets...`);
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// 3. This function runs when the HTML content is ready
function populateAssets() {
    // console.log("[Loader] Populating assets...");
    // Find all <img> tags with [data-asset-key]
    const imgElements = document.querySelectorAll('[data-asset-key]');
    imgElements.forEach(el => {
        const key = el.dataset.assetKey;
        if (GAME_ASSETS[key]) {
            el.src = GAME_ASSETS[key];
        } else {
            console.warn(`[Loader] <img> asset key not found: ${key}`);
        }
    });

    // Find all elements with [data-asset-bg-key] for backgrounds
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