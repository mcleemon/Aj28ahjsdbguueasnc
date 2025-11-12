// shop.js
// v1.0.7 - Upgraded to use assets.js map

import { GAME_ASSETS } from './assets.js';

// === SHOP ITEM DATA ===
// 'id' is for the purchase logic later.
// 'currency' is 'stars' (for Telegram Stars) or 'gems'.
const SHOP_ITEMS = {
    "bundles": [
        {
            id: "bundle_small",
            title: "Small Bundle",
            img: GAME_ASSETS.iconCrystalDust, 
            description: "10,000 Dust",
            price: 1.99,
            currency: "stars"
        }
        // ... we'll add more items here later
    ],
    "dust": [
        // ...
    ]
};

document.addEventListener('DOMContentLoaded', () => {

    const shopButton = document.getElementById('new-shop-button');
    const shopModal = document.getElementById('shop-modal');
    const closeShopButton = document.getElementById('close-shop-button');
    const goldPassModal = document.getElementById('gold-pass-modal');
    const silverPassModal = document.getElementById('silver-pass-modal');
    const openGoldPassButton = document.querySelector('.shop-item-vertical .shop-item-card:first-child');
    const openSilverPassButton = document.querySelector('.shop-item-vertical .shop-item-card:last-child');
    const closeGoldPassButton = document.getElementById('close-gold-pass-button');
    const closeSilverPassButton = document.getElementById('close-silver-pass-button');

    if (!shopButton || !shopModal || !closeShopButton) {
        console.error("Shop elements not found! Check your HTML IDs.");
        return;
    }

    if (!goldPassModal || !silverPassModal || !openGoldPassButton || !openSilverPassButton || !closeGoldPassButton || !closeSilverPassButton) {
        console.error("Pass modal elements not found! Check your HTML IDs.");
        return;
    }

    shopButton.disabled = false;
    shopButton.addEventListener('click', () => {
        shopModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    openGoldPassButton.addEventListener('click', () => {
        goldPassModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    openSilverPassButton.addEventListener('click', () => {
        silverPassModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    closeShopButton.addEventListener('click', () => {
        shopModal.classList.add('closing');
        setTimeout(() => {
            shopModal.classList.add('hidden');
            shopModal.classList.remove('closing');
        }, 300);
    });

    closeGoldPassButton.addEventListener('click', () => {
        goldPassModal.classList.add('closing');
        setTimeout(() => {
            goldPassModal.classList.add('hidden');
            goldPassModal.classList.remove('closing');
        }, 300);
    });

    closeSilverPassButton.addEventListener('click', () => {
        silverPassModal.classList.add('closing');
        setTimeout(() => {
            silverPassModal.classList.add('hidden');
            silverPassModal.classList.remove('closing');
        }, 300);
    });

});