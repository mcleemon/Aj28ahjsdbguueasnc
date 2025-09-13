document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const streakCounter = document.getElementById('streak-counter');
    const golemEgg = document.getElementById('golem-egg');
    // ... (other game elements)

    // Buttons
    const shopButton = document.getElementById('shop-button');
    const calendarButton = document.getElementById('calendar-button');

    // Modals & Modal Content
    const shopModal = document.getElementById('shop-modal');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const calendarModal = document.getElementById('calendar-modal');
    const closeRewardButton = document.getElementById('close-reward-button');
    const rewardStreak = document.getElementById('reward-streak');
    const rewardAmount = document.getElementById('reward-amount');
    const closeCalendarButton = document.getElementById('close-calendar-button');
    const calendarStreakLabel = document.getElementById('calendar-streak-label');
    const streakGrid = document.getElementById('streak-grid');
    // ... (shop item elements are the same)

    // --- GAME STATE ---
    let gameState = {
        dust: 0,
        dustPerTap: 1,
        hatchProgress: 0,
        hatchGoal: 10000,
        chiselLevel: 1,
        chiselBaseCost: 100,
        dustPerSecond: 0,
        droneLevel: 0,
        droneBaseCost: 250,
        lastLoginDate: null, // Still need this to check for new days
        loginStreak: 0,
    };

    // --- FUNCTIONS ---

    function saveGame() {
        localStorage.setItem('golemEggGameState', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedState = localStorage.getItem('golemEggGameState');
        if (savedState) {
            gameState = Object.assign(gameState, JSON.parse(savedState));
        }
    }

    function updateUI() {
        dustCounter.innerText = Math.floor(gameState.dust);
        streakCounter.innerText = gameState.loginStreak;
        // ... (rest of UI update logic for progress bar and shop is the same)
    }

    // Helper to get date as YYYY-MM-DD
    function getTodayDateString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function handleDailyLogin() {
        const today = getTodayDateString();
        const lastLogin = gameState.lastLoginDate;

        if (lastLogin === today) return; // Already logged in today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getTodayDateString.call(yesterday);

        if (lastLogin === yesterdayStr) {
            gameState.loginStreak++; // Streak continues
        } else {
            gameState.loginStreak = 1; // Streak broken or first login
        }

        const reward = 100 * gameState.loginStreak;
        gameState.dust += reward;
        gameState.lastLoginDate = today;

        // Show reward modal
        rewardStreak.innerText = gameState.loginStreak;
        rewardAmount.innerText = reward;
        loginRewardModal.classList.remove('hidden');
        tg.HapticFeedback.notificationOccurred('success');
        
        updateUI();
        saveGame();
    }
    
    // NEW SIMPLIFIED CALENDAR RENDER
    function renderStreakCalendar() {
        streakGrid.innerHTML = ''; // Clear previous grid
        calendarStreakLabel.innerText = gameState.loginStreak;

        // Lets show 14 days for example
        for (let i = 1; i <= 14; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'streak-day';
            dayCell.innerText = i;

            if (i < gameState.loginStreak) {
                // Days in the past that were completed
                dayCell.classList.add('completed');
            } else if (i === gameState.loginStreak) {
                // Today's streak day
                dayCell.classList.add('current');
            }
            // Future days have the default style
            
            streakGrid.appendChild(dayCell);
        }
    }

    // --- (Other functions like getChiselCost, autoMine, etc. are here and unchanged) ---
    // --- EVENT LISTENERS ---
    
    calendarButton.addEventListener('click', () => {
        renderStreakCalendar(); // Call the new function
        calendarModal.classList.remove('hidden');
    });
    
    // ... (rest of event listeners are the same)
    closeRewardButton.addEventListener('click', () => loginRewardModal.classList.add('hidden'));
    closeCalendarButton.addEventListener('click', () => calendarModal.classList.add('hidden'));


    // --- INITIALIZE GAME ---
    loadGame();
    handleDailyLogin();
    updateUI();
    // ... (setInterval loops are the same)
});