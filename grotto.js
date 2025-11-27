// grotto.js - Logic for the Grotto Modal
// v1.0.9

import { GAME_ASSETS } from './assets.js';
document.addEventListener('DOMContentLoaded', () => {

    const grottoButton = document.getElementById('grotto-button');
    const grottoModal = document.getElementById('grotto-modal');
    const closeGrottoButton = document.getElementById('close-grotto-button');
    const grottoDisplayImage = document.getElementById('grotto-display-image');
    const grottoMenuItems = document.querySelectorAll('.grotto-menu-item');

    if (!grottoButton || !grottoModal || !closeGrottoButton || !grottoDisplayImage || grottoMenuItems.length === 0) {
        console.error("Grotto modal elements not found! Check your HTML IDs.");
        return;
    }
    grottoButton.disabled = false;
    grottoButton.addEventListener('click', () => {
        grottoModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    closeGrottoButton.addEventListener('click', () => {
        grottoModal.classList.add('closing');
        setTimeout(() => {
            grottoModal.classList.add('hidden');
            grottoModal.classList.remove('closing'); 
        }, 300);
    });

    grottoMenuItems.forEach(button => {
        button.addEventListener('click', () => {
            const eggKey = button.dataset.eggKey;
            const newImageURL = GAME_ASSETS[eggKey];
            if (newImageURL) {
                grottoDisplayImage.src = newImageURL;
            } else {
                console.warn(`Grotto: Could not find asset key "${eggKey}" in GAME_ASSETS.`);
            }
            grottoMenuItems.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
});