document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS (ALL OF THEM) ---
    const dustCounter = document.getElementById('dust-counter');
    const streakCounter = document.getElementById('streak-counter');
    const golemEgg = document.getElementById('golem-egg');
    const hatchProgressBar = document.getElementById('hatch-progress-bar');
    const progressText = document.getElementById('progress-text');
    const clickEffectContainer = document.getElementById('click-effect-container');

    // Buttons
    const shopButton = document.getElementById('shop-button');
    const calendarButton = document.getElementById('calendar-button');

    // Modals
    const shopModal = document.getElementById('shop-modal');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const calendarModal = document.getElementById('calendar-modal');
    const closeShopButton = document.getElementById('close-shop-button');
    const closeRewardButton = document.getElementById('close-reward-button');
    const closeCalendarButton = document.getElementById('close-calendar-button');
    
    // Reward Modal Content
    const rewardStreak = document.getElementById('reward-streak');
    const rewardAmount = document.getElementById('reward-amount');

    // Calendar Modal Content
    const calendarStreakLabel = document.getElementById('calendar-streak-label');
    const streakGrid = document.getElementById('streak-grid');

    // Shop Item: Chisel
    const buyChiselButton = document.getElementById('buy-chisel-button');
    const chiselLevelText = document.getElementById('chisel-level');
    const chiselEffectText = document.getElementById('chisel-effect');
    const chiselCostText = document.getElementById('chisel-cost');

    // Shop Item: Drone
    const buyDroneButton = document.getElementById('buy-drone-button');
    const droneLevelText = document.getElementById('drone-level');
    const droneEffectText = document.getElementById('drone-effect');
    const droneCostText = document.getElementById('drone-cost');

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
        lastLoginDate: null,
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
        
        const progressPercent = (gameState.hatchProgress / gameState.hatchGoal) * 100;
        hatchProgressBar.style.width = `${progressPercent}%`;
        progressText.innerText = `${Math.floor(gameState.hatchProgress)} / ${gameState.hatchGoal}`;

        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = gameState.dustPerTap;
        chiselCostText.innerText = getChiselCost();
        
        droneLevelText.innerText = gameState.droneLevel;
        droneEffectText.innerText = gameState.dustPerSecond;
        droneCostText.innerText = getDroneCost();
    }
    
    function getChiselCost() {
        return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1));
    }
    
    function getDroneCost() {
        return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel));
    }
    
    function autoMine() {
        if (gameState.hatchProgress < gameState.hatchGoal) {
             gameState.hatchProgress += gameState.dustPerSecond;
        }
        gameState.dust += gameState.dustPerSecond;
        updateUI();
    }
    
    function getTodayDateString() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function handleDailyLogin() {
        const today = getTodayDateString();
        if (gameState.lastLoginDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getTodayDateString.call(yesterday);

        if (gameState.lastLoginDate === yesterdayStr) {
            gameState.loginStreak++;
        } else {
            gameState.loginStreak = 1;
        }

        const reward = 100 * gameState.loginStreak;
        gameState.dust += reward;
        gameState.lastLoginDate = today;

        rewardStreak.innerText = gameState.loginStreak;
        rewardAmount.innerText = reward;
        loginRewardModal.classList.remove('hidden');
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    function renderStreakCalendar() {
        streakGrid.innerHTML = '';
        calendarStreakLabel.innerText = gameState.loginStreak;

        for (let i = 1; i <= 28; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'streak-day';
            dayCell.innerText = i;
            if (i < gameState.loginStreak) {
                dayCell.classList.add('completed');
            } else if (i === gameState.loginStreak) {
                dayCell.classList.add('current');
            }
            streakGrid.appendChild(dayCell);
        }
    }

    // --- EVENT LISTENERS ---

    golemEgg.addEventListener('click', () => {
        if (gameState.hatchProgress < gameState.hatchGoal) {
            gameState.hatchProgress += gameState.dustPerTap;
        }
        gameState.dust += gameState.dustPerTap;
        
        tg.HapticFeedback.impactOccurred('light');
        updateUI();

        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.innerText = `+${gameState.dustPerTap}`;
        effect.style.left = `${Math.random() * 60 + 20}%`; 
        clickEffectContainer.appendChild(effect);
        setTimeout(() => { effect.remove(); }, 1000);
    });

    shopButton.addEventListener('click', () => shopModal.classList.remove('hidden'));
    closeShopButton.addEventListener('click', () => shopModal.classList.add('hidden'));
    calendarButton.addEventListener('click', () => {
        renderStreakCalendar();
        calendarModal.classList.remove('hidden');
    });
    closeRewardButton.addEventListener('click', () => loginRewardModal.classList.add('hidden'));
    closeCalendarButton.addEventListener('click', () => calendarModal.classList.add('hidden'));

    buyChiselButton.addEventListener('click', () => {
        const cost = getChiselCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.chiselLevel++;
            gameState.dustPerTap++;
            updateUI();
            saveGame();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
        }
    });
    
    buyDroneButton.addEventListener('click', () => {
        const cost = getDroneCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.droneLevel++;
            gameState.dustPerSecond++;
            updateUI();
            saveGame();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    // --- INITIALIZE GAME ---
    loadGame();
    handleDailyLogin();
    updateUI();
    
    setInterval(autoMine, 1000); 
    setInterval(saveGame, 5000);
});