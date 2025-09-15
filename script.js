document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const geodeCounter = document.getElementById('geode-counter'); // Changed from streakCounter
    const batteryStatus = document.getElementById('battery-status');
    const golemEgg = document.getElementById('golem-egg');
    const eggOverlay = document.getElementById('egg-overlay');
    const hatchProgressBar = document.getElementById('hatch-progress-bar');
    const progressText = document.getElementById('progress-text');
    const clickEffectContainer = document.getElementById('click-effect-container');
    const shopButton = document.getElementById('shop-button');
    const calendarButton = document.getElementById('calendar-button');
    const shopModal = document.getElementById('shop-modal');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const calendarModal = document.getElementById('calendar-modal');
    const cheatModal = document.getElementById('cheat-modal');
    // geodeRewardModal is no longer needed
    const closeShopButton = document.getElementById('close-shop-button');
    const closeRewardButton = document.getElementById('close-reward-button');
    const closeCalendarButton = document.getElementById('close-calendar-button');
    const rewardStreak = document.getElementById('reward-streak');
    const rewardAmount = document.getElementById('reward-amount');
    const calendarStreakLabel = document.getElementById('calendar-streak-label');
    const streakGrid = document.getElementById('streak-grid');
    const buyChiselButton = document.getElementById('buy-chisel-button');
    const chiselLevelText = document.getElementById('chisel-level');
    const chiselEffectText = document.getElementById('chisel-effect');
    const chiselCostText = document.getElementById('chisel-cost');
    const buyDroneButton = document.getElementById('buy-drone-button');
    const droneLevelText = document.getElementById('drone-level');
    const droneEffectText = document.getElementById('drone-effect');
    const droneCostText = document.getElementById('drone-cost');
    const buyBatteryButton = document.getElementById('buy-battery-button');
    const batteryLevelText = document.getElementById('battery-level');
    const batteryCapacityText = document.getElementById('battery-capacity');
    const batteryCostText = document.getElementById('battery-cost');

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
        checksum: null,
        lastSavedTimestamp: Date.now(),
        batteryLevel: 1,
        batteryCapacity: 3600,
        batteryBaseCost: 1000,
        geodesFoundToday: 0,
    };

    const batteryLevels = [3600, 7200, 14400, 21600];
    const CHECKSUM_SALT = "golem_egg_super_secret_key_v2";

    // --- HELPER FUNCTIONS ---
    function formatNumber(num) {
        num = Math.floor(num);
        if (num < 1000) return num.toString();
        const suffixes = ["", "K", "M", "B", "T"];
        const i = Math.floor(Math.log10(num) / 3);
        const shortNum = (num / Math.pow(1000, i)).toFixed(1);
        return shortNum.replace(/\.0$/, '') + suffixes[i];
    }
    function formatWithCommas(num) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function getTodayDateString() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    function generateChecksum(state) {
        const dataToHash = {
            dust: Math.floor(state.dust),
            dpt: state.dustPerTap,
            dps: state.dustPerSecond,
            cl: state.chiselLevel,
            dl: state.droneLevel
        };
        const stringToHash = JSON.stringify(dataToHash) + CHECKSUM_SALT;
        return btoa(stringToHash);
    }

    // --- CORE FUNCTIONS ---
    function saveGame() {
        try {
            const currentSave = localStorage.getItem('golemEggGameState');
            if (currentSave) {
                localStorage.setItem('golemEggGameState_previous', currentSave);
            }
            gameState.lastSavedTimestamp = Date.now();
            gameState.checksum = generateChecksum(gameState);
            localStorage.setItem('golemEggGameState', JSON.stringify(gameState));
        } catch (error) {
            console.error("Failed to save game:", error);
        }
    }
    function loadGame() {
        let isNew = true;
        try {
            const tryLoadingState = (stateKey) => {
                const savedJSON = localStorage.getItem(stateKey);
                if (!savedJSON) return false;
                isNew = false;
                const savedState = JSON.parse(savedJSON);
                const expectedChecksum = generateChecksum(savedState);
                if (savedState.checksum === expectedChecksum) {
                    gameState = Object.assign(gameState, savedState);
                    return true;
                }
                return false;
            };
            if (tryLoadingState('golemEggGameState')) {
                calculateOfflineProgress();
                return false;
            }
            console.warn("Main save file corrupt or tampered. Trying backup.");
            if (tryLoadingState('golemEggGameState_previous')) {
                calculateOfflineProgress();
                return false;
            }
            if (localStorage.getItem('golemEggGameState')) {
                console.error("Both save files are corrupt or have been tampered with.");
                cheatModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Critical error during game load:", error);
        }
        return isNew;
    }
    function calculateOfflineProgress() {
        const now = Date.now();
        const timePassedInSeconds = Math.floor((now - gameState.lastSavedTimestamp) / 1000);
        if (timePassedInSeconds > 1) {
            const offlineSecondsCapped = Math.min(timePassedInSeconds, gameState.batteryCapacity);
            const dustEarnedOffline = offlineSecondsCapped * gameState.dustPerSecond;
            if (dustEarnedOffline > 0) {
                gameState.dust += dustEarnedOffline;
                if (gameState.hatchProgress < gameState.hatchGoal) {
                    gameState.hatchProgress += dustEarnedOffline;
                }
                alert(`Welcome back!\n\nYour drone mined for ${Math.floor(offlineSecondsCapped / 60)} minutes and collected ${formatNumber(dustEarnedOffline)} Crystal Dust.`);
            }
        }
    }
    function updateUI() {
        dustCounter.innerText = formatWithCommas(gameState.dust);
        geodeCounter.innerText = gameState.geodesFoundToday; // Changed from streakCounter
        progressText.innerText = `${formatWithCommas(gameState.hatchProgress)} / ${formatNumber(gameState.hatchGoal)}`;
        const progressPercent = Math.min(100, (gameState.hatchProgress / gameState.hatchGoal) * 100);
        hatchProgressBar.style.width = `${progressPercent}%`;
        eggOverlay.className = 'egg-overlay';
        if (progressPercent >= 75) { eggOverlay.classList.add('egg-cracked-3'); }
        else if (progressPercent >= 50) { eggOverlay.classList.add('egg-cracked-2'); }
        else if (progressPercent >= 25) { eggOverlay.classList.add('egg-cracked-1'); }
        
        const chiselCost = getChiselCost();
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = `+${formatWithCommas(gameState.dustPerTap)}`;
        chiselCostText.innerText = formatNumber(chiselCost);
        buyChiselButton.disabled = gameState.dust < chiselCost;
        const droneCost = getDroneCost();
        droneLevelText.innerText = gameState.droneLevel;
        droneEffectText.innerText = `+${formatNumber(gameState.dustPerSecond)}`;
        droneCostText.innerText = formatNumber(droneCost);
        buyDroneButton.disabled = gameState.dust < droneCost;
        const batteryCapacityHours = gameState.batteryCapacity / 3600;
        batteryLevelText.innerText = gameState.batteryLevel;
        batteryCapacityText.innerText = `${Number(batteryCapacityHours.toFixed(1))} Hours`;
        if (gameState.batteryLevel >= batteryLevels.length) {
            buyBatteryButton.innerText = "Max Level";
            buyBatteryButton.disabled = true;
        } else {
            const batteryCost = getBatteryCost();
            buyBatteryButton.innerText = `Upgrade (Cost: ${formatNumber(batteryCost)})`;
            buyBatteryButton.disabled = gameState.dust < batteryCost;
        }
        batteryStatus.innerText = '100%';
    }
    function getChiselCost() {
        return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1));
    }
    function getDroneCost() {
        return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel));
    }
    function getBatteryCost() {
        return Math.floor(gameState.batteryBaseCost * Math.pow(2.2, gameState.batteryLevel - 1));
    }
    function gameLoop() {
        if (gameState.hatchProgress < gameState.hatchGoal) {
            gameState.hatchProgress += gameState.dustPerSecond;
        }
        if (gameState.hatchProgress > gameState.hatchGoal) {
            gameState.hatchProgress = gameState.hatchGoal;
        }
        gameState.dust += gameState.dustPerSecond;
        updateUI();
    }
    function handleDailyLogin() {
        const today = getTodayDateString();
        if (gameState.lastLoginDate === today) return;

        gameState.geodesFoundToday = 0; // Reset daily geode counter

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
            if (i < gameState.loginStreak) { dayCell.classList.add('completed'); }
            else if (i === gameState.loginStreak) { dayCell.classList.add('current'); }
            streakGrid.appendChild(dayCell);
        }
    }
    
    function getGeodeChance() {
        const count = gameState.geodesFoundToday;
        if (count < 10) return 0.03;
        if (count < 20) return 0.015;
        if (count < 30) return 0.005;
        return 0.001;
    }
    
    function handleGeodeEvent() {
        gameState.geodesFoundToday++;
        const prizeRoll = Math.random();
        let reward = 0;
        let rarity = '';
        let rarityClass = '';
        let rewardText = '';
        
        if (prizeRoll < 0.01) { // Epic
            rarity = "EPIC GEODE!";
            rarityClass = 'epic';
            reward = gameState.dustPerTap * 1000;
            rewardText = `+ 1 Gem Shard! (🎁 ${formatNumber(reward)})`;
        } else if (prizeRoll < 0.05) { // Rare
            rarity = "Rare Geode!";
            rarityClass = 'rare';
            reward = gameState.dustPerTap * 40;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        } else if (prizeRoll < 0.20) { // Uncommon
            rarity = "Uncommon Geode!";
            rarityClass = 'uncommon';
            reward = gameState.dustPerTap * 10;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        } else { // Common
            rarity = "Common Geode";
            rarityClass = 'common';
            reward = gameState.dustPerTap * 3;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        }
        
        gameState.dust += reward;
        if (gameState.hatchProgress < gameState.hatchGoal) {
            gameState.hatchProgress += reward;
        }
        
        // Create the floating geode notification
        const geodeEffect = document.createElement('div');
        geodeEffect.className = `geode-effect ${rarityClass}`;
        geodeEffect.innerHTML = `${rarity}<br>${rewardText}`;
        geodeEffect.style.left = `${Math.random() * 40 + 30}%`;
        clickEffectContainer.appendChild(geodeEffect);
        setTimeout(() => { geodeEffect.remove(); }, 2000);
        
        tg.HapticFeedback.notificationOccurred('success');
    }

    // --- EVENT LISTENERS ---
    golemEgg.addEventListener('click', () => {
        if (Math.random() < getGeodeChance()) {
            handleGeodeEvent();
        } else {
            let dustEarned = gameState.dustPerTap;
            let isCritical = false;
            if (Math.random() < 0.10) { 
                isCritical = true;
                dustEarned *= 2;
            }
            if (gameState.hatchProgress < gameState.hatchGoal) {
                gameState.hatchProgress += dustEarned;
            }
            gameState.dust += dustEarned;
            
            if (isCritical) {
                tg.HapticFeedback.notificationOccurred('warning');
            } else {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            const effect = document.createElement('div');
            effect.className = 'click-effect';
            effect.innerText = `+${formatNumber(dustEarned)}`;
            if (isCritical) {
                effect.classList.add('critical');
            }
            effect.style.left = `${Math.random() * 60 + 20}%`;
            clickEffectContainer.appendChild(effect);
            setTimeout(() => { effect.remove(); }, 1000);
        }
        updateUI();
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
            tg.HapticFeedback.notificationOccurred('success');
        }
    });
    buyDroneButton.addEventListener('click', () => {
        const cost = getDroneCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.droneLevel++;
            gameState.dustPerSecond++;
            updateUI();
            tg.HapticFeedback.notificationOccurred('success');
        }
    });
    buyBatteryButton.addEventListener('click', () => {
        if (gameState.batteryLevel >= batteryLevels.length) { return; }
        const cost = getBatteryCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.batteryLevel++;
            gameState.batteryCapacity = batteryLevels[gameState.batteryLevel - 1];
            updateUI();
            tg.HapticFeedback.notificationOccurred('success');
        }
    });
    
    // --- INITIALIZE GAME ---
    const isNewPlayer = loadGame();
    if (isNewPlayer) {
        saveGame();
    }
    handleDailyLogin();
    updateUI();
    
    setInterval(gameLoop, 1000);
    setInterval(saveGame, 3000);
});