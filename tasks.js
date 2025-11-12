// tasks.js - Logic for the Tasks Modal

document.addEventListener('DOMContentLoaded', () => {

    const tasksButton = document.getElementById('tasks-button');
    const tasksModal = document.getElementById('tasks-modal');
    const closeTasksButton = document.getElementById('close-tasks-button');
    if (!tasksButton || !tasksModal || !closeTasksButton) {
        console.error("Tasks modal elements not found! Check your HTML IDs.");
        return;
    }
    
    tasksButton.disabled = false;
    tasksButton.addEventListener('click', () => {
        tasksModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    closeTasksButton.addEventListener('click', () => {
        tasksModal.classList.add('closing');
        setTimeout(() => {
            tasksModal.classList.add('hidden');
            tasksModal.classList.remove('closing'); 
        }, 300);
    });
});