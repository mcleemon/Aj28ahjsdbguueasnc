// grotto.js - Logic for the Grotto Modal

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get All the Elements ---
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
    
    // --- 2. Activate the Main Grotto Button ---
    grottoButton.disabled = false;

    // --- 3. Add Open Listener ---
    grottoButton.addEventListener('click', () => {
        grottoModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    // --- 4. Add Close Listener ---
    closeGrottoButton.addEventListener('click', () => {
        grottoModal.classList.add('closing');
        setTimeout(() => {
            grottoModal.classList.add('hidden');
            grottoModal.classList.remove('closing'); 
        }, 300); // 300ms matches your .closing animation
    });

    // --- 5. Add Scroll Menu Click Listeners ---
    grottoMenuItems.forEach(button => {
        button.addEventListener('click', () => {
            // Get the new image URL from the button's "data-egg-image" attribute
            const newImage = button.dataset.eggImage;
            
            // Set the main display image's src to the new URL
            grottoDisplayImage.src = newImage;

            // Handle the "active" class
            // 1. Remove "active" from all buttons
            grottoMenuItems.forEach(btn => btn.classList.remove('active'));
            // 2. Add "active" to the one that was just clicked
            button.classList.add('active');
        });
    });
});