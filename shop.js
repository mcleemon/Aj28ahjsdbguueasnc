// shop.js

// === SHOP ITEM DATA ===
// We define all our shop items here.
// 'id' is for the purchase logic later.
// 'currency' is 'stars' (for Telegram Stars) or 'gems'.
const SHOP_ITEMS = {
    "bundles": [
        {
            id: "bundle_small",
            title: "Small Bundle",
            img: "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true", // Placeholder image
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

    // --- 1. Get All the Elements ---
    const shopButton = document.getElementById('new-shop-button');
    const shopModal = document.getElementById('shop-modal');
    const closeShopButton = document.getElementById('close-shop-button');

    // --- Safety Check ---
    if (!shopButton || !shopModal || !closeShopButton) {
        console.error("Shop elements not found! Check your HTML IDs.");
        return;
    }

    // --- 2. Activate the Main Shop Button ---
    // This removes the "disabled" attribute, making it clickable!
    shopButton.disabled = false;

    // --- 3. Add Open Listener ---
    shopButton.addEventListener('click', () => {
        shopModal.classList.remove('hidden');

        // Haptic feedback (if Telegram WebApp is available)
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    // --- 4. Add Close Listener ---
    closeShopButton.addEventListener('click', () => {
        // We re-use the 'closing' animation class from your main style.css
        shopModal.classList.add('closing');

        // Wait for the animation to finish before hiding it
        setTimeout(() => {
            shopModal.classList.add('hidden');
            shopModal.classList.remove('closing');
        }, 300); // 300ms matches your .closing animation
    });

});