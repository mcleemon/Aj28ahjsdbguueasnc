// loader.js
// v1.2.0 (Clean Loader - No Ghost Logic)

import { GAME_ASSETS } from './assets.js';

function initLoader() {
    const loadingScreen = document.getElementById('loading-screen');
    const barFill = document.getElementById('loading-bar-fill');
    const percentText = document.getElementById('loading-percent');
    
    // 1. Get all assets to load
    const imageUrls = Object.values(GAME_ASSETS);
    const totalAssets = imageUrls.length;
    let loadedCount = 0;

    function updateProgress() {
        loadedCount++;
        const percent = Math.floor((loadedCount / totalAssets) * 100);
        
        if (barFill) barFill.style.width = `${percent}%`;
        if (percentText) percentText.innerText = `${percent}%`;

        if (loadedCount >= totalAssets) {
            console.log("[Loader] All assets loaded!");
            finishLoading();
        }
    }

    function assetLoaded() {
        updateProgress();
    }

    console.log(`[Loader] Starting pre-load of ${totalAssets} assets...`);
    
    if (totalAssets === 0) {
        finishLoading();
        return;
    }

    imageUrls.forEach(url => {
        const img = new Image();
        img.onload = assetLoaded;
        img.onerror = assetLoaded; 
        img.src = url;
    });
}

function finishLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            populateAssets();
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 300);
    }
}

// 3. Populate DOM (Standard)
function populateAssets() {
    // Images
    const imgElements = document.querySelectorAll('[data-asset-key]');
    imgElements.forEach(el => {
        const key = el.dataset.assetKey;
        if (GAME_ASSETS[key]) {
            el.src = GAME_ASSETS[key];
            // Removed: pointer-events logic
        }
    });

    // Backgrounds (Divs)
    const bgElements = document.querySelectorAll('[data-asset-bg-key]');
    bgElements.forEach(el => {
        const key = el.dataset.assetBgKey;
        if (GAME_ASSETS[key]) {
            el.style.backgroundImage = `url('${GAME_ASSETS[key]}')`;
        }
    });
}

document.addEventListener('DOMContentLoaded', initLoader);