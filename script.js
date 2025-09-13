// Get the Telegram Web App object
const tg = window.Telegram.WebApp;

// Get user data
const user = tg.initDataUnsafe?.user;

// Set the user's name in the HTML
if (user) {
    document.getElementById('user-name').innerText = user.first_name || 'Guest';
}

// Add an event listener to the button
document.getElementById('test-button').addEventListener('click', () => {
    // Send a haptic feedback to the user's phone
    tg.HapticFeedback.notificationOccurred('success');
    
    // You can also send data back to your bot, but we'll do that later
    alert("Button clicked! Haptic feedback sent.");
});