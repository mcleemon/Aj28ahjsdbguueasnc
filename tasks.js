// tasks.js - Logic for the Tasks Modal

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get All the Elements ---
    const tasksButton = document.getElementById('tasks-button');
    const tasksModal = document.getElementById('tasks-modal');
    const closeTasksButton = document.getElementById('close-tasks-button');

    // --- Safety Check ---
    if (!tasksButton || !tasksModal || !closeTasksButton) {
        console.error("Tasks modal elements not found! Check your HTML IDs.");
        return;
    }
    
    // --- 2. Activate the Main Tasks Button ---
    // This removes the "disabled" attribute, making it clickable!
    tasksButton.disabled = false;

    // --- 3. Add Open Listener ---
    tasksButton.addEventListener('click', () => {
        tasksModal.classList.remove('hidden');
        
        // Haptic feedback
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    // --- 4. Add Close Listener ---
    closeTasksButton.addEventListener('click', () => {
        tasksModal.classList.add('closing');
        
        // Wait for the animation to finish before hiding it
        setTimeout(() => {
            tasksModal.classList.add('hidden');
            tasksModal.classList.remove('closing'); 
        }, 300); // 300ms matches your .closing animation
    });

});