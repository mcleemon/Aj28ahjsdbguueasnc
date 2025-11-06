// grotto.js - Logic for the Grotto Modal
// v1.0.3 - Upgraded to use assets.js map

// 1. Import the asset map
import { GAME_ASSETS } from './assets.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 2. Get All the Elements ---
    const grottoButton = document.getElementById('grotto-button');
    const grottoModal = document.getElementById('grotto-modal');
    const closeGrottoButton = document.getElementById('close-grotto-button');
    
    // Grotto-specific elements
    const grottoDisplayImage = document.getElementById('grotto-display-image');
    const grottoMenuItems = document.querySelectorAll('.grotto-menu-item');

    // --- Safety Check ---
    if (!grottoButton || !grottoModal || !closeGrottoButton || !grottoDisplayImage || grottoMenuItems.length === 0) {
        console.error("Grotto modal elements not found! Check your HTML IDs.");
        return;
    }
    
    // --- 3. Activate the Main Grotto Button ---
    grottoButton.disabled = false;

    // --- 4. Add Open Listener ---
    grottoButton.addEventListener('click', () => {
        grottoModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    // --- 5. Add Close Listener ---
    closeGrottoButton.addEventListener('click', () => {
        grottoModal.classList.add('closing');
        setTimeout(() => {
            grottoModal.classList.add('hidden');
            grottoModal.classList.remove('closing'); 
        }, 300); // 300ms matches your .closing animation
    });

    // --- 6. Add Scroll Menu Click Listeners (UPGRADED) ---
    grottoMenuItems.forEach(button => {
        button.addEventListener('click', () => {
            // Get the asset KEY from the button's "data-egg-key" attribute
            const eggKey = button.dataset.eggKey;
            
            // Get the REAL URL from our asset map
            const newImageURL = GAME_ASSETS[eggKey];
            
            if (newImageURL) {
                // Set the main display image's src to the new URL
                grottoDisplayImage.src = newImageURL;
            } else {
                console.warn(`Grotto: Could not find asset key "${eggKey}" in GAME_ASSETS.`);
            }

            // Handle the "active" class
            // 1. Remove "active" from all buttons
            grottoMenuItems.forEach(btn => btn.classList.remove('active'));
            // 2. Add "active" to the one that was just clicked
            button.classList.add('active');
        });
    });
});