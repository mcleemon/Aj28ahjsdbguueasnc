document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const golemEgg = document.getElementById('golem-egg');
    // ... (other game elements)
    const streakCounter = document.getElementById('streak-counter');
    
    // Buttons
    const shopButton = document.getElementById('shop-button');
    const calendarButton = document.getElementById('calendar-button');

    // Modals
    const shopModal = document.getElementById('shop-modal');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const calendarModal = document.getElementById('calendar-modal');
    
    // Reward Modal Elements
    const closeRewardButton = document.getElementById('close-reward-button');
    const rewardStreak = document.getElementById('reward-streak');
    const rewardAmount = document.getElementById('reward-amount');

    // Calendar Modal Elements
    const closeCalendarButton = document.getElementById('close-calendar-button');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarDays = document.getElementById('calendar-days');
    
    // ... (shop item elements)

    // --- GAME STATE ---
    let gameState = {
        dust: 0,
        dustPerTap: 1,
        // ... (other game state properties)
        lastLoginDate: null, // e.g., "2025-09-13"
        loginStreak: 0,
        attendance: [], // e.g., ["2025-09-11", "2025-09-12"]
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
        // ... (update other UI elements)
    }
    
    // --- NEW: DAILY LOGIN & CALENDAR LOGIC ---

    // Helper function to get date in YYYY-MM-DD format
    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function handleDailyLogin() {
        const today = getTodayDateString();
        const lastLogin = gameState.lastLoginDate;

        if (lastLogin === today) {
            // Already logged in today, do nothing.
            return;
        }

        let reward = 0;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getTodayDateString.call(yesterday);

        if (lastLogin === yesterdayStr) {
            // Consecutive day
            gameState.loginStreak++;
        } else {
            // Streak broken or first login
            gameState.loginStreak = 1;
        }

        // Calculate reward and show modal
        reward = 100 * gameState.loginStreak;
        gameState.dust += reward;
        
        rewardStreak.innerText = gameState.loginStreak;
        rewardAmount.innerText = reward;
        loginRewardModal.classList.remove('hidden');
        tg.HapticFeedback.notificationOccurred('success');

        // Update state
        gameState.lastLoginDate = today;
        if (!gameState.attendance.includes(today)) {
            gameState.attendance.push(today);
        }
        
        updateUI();
        saveGame();
    }
    
    function renderCalendar() {
        calendarDays.innerHTML = ''; // Clear old calendar days
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();

        calendarMonthYear.innerText = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            calendarDays.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.innerText = i;
            
            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (gameState.attendance.includes(dayString)) {
                dayCell.classList.add('checked-in');
            }
            if (i === new Date().getDate()) {
                dayCell.classList.add('current-day');
            }
            
            calendarDays.appendChild(dayCell);
        }
    }

    // --- (Other functions like getChiselCost, autoMine, etc. are here) ---

    // --- EVENT LISTENERS ---
    
    // Modal buttons
    shopButton.addEventListener('click', () => shopModal.classList.remove('hidden'));
    calendarButton.addEventListener('click', () => {
        renderCalendar();
        calendarModal.classList.remove('hidden');
    });

    closeRewardButton.addEventListener('click', () => loginRewardModal.classList.add('hidden'));
    closeCalendarButton.addEventListener('click', () => calendarModal.classList.add('hidden'));

    // ... (other event listeners for egg clicks and shop purchases)

    // --- INITIALIZE GAME ---
    loadGame();
    handleDailyLogin(); // Check for daily reward as soon as the game loads
    updateUI();
    
    // ... (setInterval loops for auto-mining and saving)
});