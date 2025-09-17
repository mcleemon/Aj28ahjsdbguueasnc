document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const geodeCounter = document.getElementById('geode-counter');
    const batteryStatus = document.getElementById('battery-status');
    const golemEgg = document.getElementById('golem-egg');
    const eggOverlay = document.getElementById('egg-overlay');
    const progressText = document.getElementById('progress-text');
    const clickEffectContainer = document.getElementById('click-effect-container');
    const frenzyTimerContainer = document.getElementById('frenzy-timer-container');
    const frenzyTimer = document.getElementById('frenzy-timer');
    const shopButton = document.getElementById('shop-button');
    const calendarButton = document.getElementById('calendar-button');
    const shopModal = document.getElementById('shop-modal');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const calendarModal = document.getElementById('calendar-modal');
    const cheatModal = document.getElementById('cheat-modal');
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
    const buyRechargeButton = document.getElementById('buy-recharge-button');
    const rechargeCountText = document.getElementById('recharge-count');
    const rechargeCostText = document.getElementById('recharge-cost');

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
        currentBattery: 3600,
        dailyRechargesUsed: 0,
        rechargeBaseCost: 1000,
        isFrenzyMode: false,
        frenzyCooldownUntil: 0,
    };

    let frenzyInterval = null;
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
        
        if (timePassedInSeconds > 0) {
            const batteryDrain = Math.min(gameState.currentBattery, timePassedInSeconds);
            gameState.currentBattery -= batteryDrain;
            
            const dustEarnedOffline = batteryDrain * gameState.dustPerSecond;

            if (dustEarnedOffline > 0) {
                gameState.dust += dustEarnedOffline;
                if (gameState.hatchProgress < gameState.hatchGoal) {
                    gameState.hatchProgress += dustEarnedOffline;
                }
                alert(`Welcome back!\n\nYour drone used ${Math.floor(batteryDrain / 60)} minutes of battery and collected ${formatNumber(dustEarnedOffline)} Crystal Dust.`);
            }
        }
    }

    function updateUI() {
        dustCounter.innerText = formatWithCommas(gameState.dust);
        geodeCounter.innerText = gameState.geodesFoundToday;
        progressText.innerText = `${formatWithCommas(gameState.hatchProgress)} / ${formatNumber(gameState.hatchGoal)}`;
        const progressPercent = Math.min(100, (gameState.hatchProgress / gameState.hatchGoal) * 100);
        eggOverlay.className = 'egg-overlay';
        if (progressPercent >= 75) { eggOverlay.classList.add('egg-cracked-3'); }
        else if (progressPercent >= 50) { eggOverlay.classList.add('egg-cracked-2'); }
        else if (progressPercent >= 25) { eggOverlay.classList.add('egg-cracked-1'); }
        
        const batteryPercent = (gameState.currentBattery / gameState.batteryCapacity) * 100;
        batteryStatus.innerText = `${Math.floor(batteryPercent)}%`;

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

        const rechargesLeft = 3 - gameState.dailyRechargesUsed;
        rechargeCountText.innerText = rechargesLeft;
        const rechargeCost = getRechargeCost();
        rechargeCostText.innerText = formatNumber(rechargeCost);

        if (rechargesLeft <= 0) {
            buyRechargeButton.innerText = "No Recharges Left";
            buyRechargeButton.disabled = true;
        } else {
            buyRechargeButton.innerText = `Recharge (Cost: ${formatNumber(rechargeCost)})`;
            buyRechargeButton.disabled = gameState.dust < rechargeCost || gameState.currentBattery >= gameState.batteryCapacity;
        }

        eggOverlay.classList.remove('frenzy-ready', 'frenzy-active');
        if (gameState.isFrenzyMode) {
            eggOverlay.classList.add('frenzy-active');
        } else if (Date.now() > gameState.frenzyCooldownUntil) {
            eggOverlay.classList.add('frenzy-ready');
        }
    }
    
    function getChiselCost() { return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1)); }
    function getDroneCost() { return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel)); }
    function getBatteryCost() { return Math.floor(gameState.batteryBaseCost * Math.pow(2.2, gameState.batteryLevel - 1)); }
    function getRechargeCost() { return Math.floor(gameState.rechargeBaseCost * Math.pow(2.5, gameState.dailyRechargesUsed)); }

    function gameLoop() {
        if (gameState.dustPerSecond > 0 && gameState.currentBattery > 0) {
            gameState.currentBattery -= 1;
        }
        
        let dustFromDrones = 0;
        if (gameState.currentBattery > 0) {
            dustFromDrones = gameState.dustPerSecond;
        }

        if (dustFromDrones > 0) {
            gameState.dust += dustFromDrones;
            if (gameState.hatchProgress < gameState.hatchGoal) {
                gameState.hatchProgress += dustFromDrones;
                if (gameState.hatchProgress > gameState.hatchGoal) {
                    gameState.hatchProgress = gameState.hatchGoal;
                }
            }
        }
        updateUI();
    }

    function handleDailyLogin() {
        const today = getTodayDateString();
        if (gameState.lastLoginDate === today) return;

        gameState.geodesFoundToday = 0;
        gameState.dailyRechargesUsed = 0;
        gameState.currentBattery = gameState.batteryCapacity;

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
        // This function is missing from the provided script, so I will add it back
        // based on our last stable version.
        gameState.geodesFoundToday++;
        const prizeRoll = Math.random();
        let reward = 0;
        let rarity = '';
        let rarityClass = '';
        let rewardText = '';
        if (prizeRoll < 0.01) {
            rarity = "EPIC GEODE!";
            rarityClass = 'epic';
            reward = gameState.dustPerTap * 1000;
            rewardText = `+ 1 Gem Shard! (🎁 ${formatNumber(reward)})`;
        } else if (prizeRoll < 0.05) {
            rarity = "Rare Geode!";
            rarityClass = 'rare';
            reward = gameState.dustPerTap * 40;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        } else if (prizeRoll < 0.20) {
            rarity = "Uncommon Geode!";
            rarityClass = 'uncommon';
            reward = gameState.dustPerTap * 10;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        } else {
            rarity = "Common Geode";
            rarityClass = 'common';
            reward = gameState.dustPerTap * 3;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        }
        gameState.dust += reward;
        if (gameState.hatchProgress < gameState.hatchGoal) {
            gameState.hatchProgress += reward;
        }
        const geodeEffect = document.createElement('div');
        geodeEffect.className = `geode-effect ${rarityClass}`;
        geodeEffect.innerHTML = `${rarity}<br>${rewardText}`;
        geodeEffect.style.left = `${Math.random() * 40 + 30}%`;
        clickEffectContainer.appendChild(geodeEffect);
        setTimeout(() => { geodeEffect.remove(); }, 2000);
        tg.HapticFeedback.notificationOccurred('success');
    }

    function startFrenzyMode() {
        if (gameState.isFrenzyMode || Date.now() < gameState.frenzyCooldownUntil) return;

        gameState.isFrenzyMode = true;
        let timeLeft = 15;

        frenzyTimerContainer.classList.remove('hidden');
        frenzyTimer.innerText = `${timeLeft}s`;
        
        tg.HapticFeedback.notificationOccurred('success');

        frenzyInterval = setInterval(() => {
            timeLeft--;
            frenzyTimer.innerText = `${timeLeft}s`;
            if (timeLeft <= 0) {
                endFrenzyMode();
            }
        }, 1000);
        updateUI();
    }

    function endFrenzyMode() {
        clearInterval(frenzyInterval);
        gameState.isFrenzyMode = false;
        gameState.frenzyCooldownUntil = Date.now() + 60000; // 1 minute cooldown
        frenzyTimerContainer.classList.add('hidden');
        updateUI();
    }

    // --- EVENT LISTENERS ---
    golemEgg.addEventListener('click', () => {
        let dustEarned = gameState.dustPerTap;
        let isCritical = false;

        if (gameState.isFrenzyMode) {
            isCritical = true;
            dustEarned *= 2;
        } else {
            if (Date.now() > gameState.frenzyCooldownUntil && Math.random() < 0.005) {
                startFrenzyMode();
                return;
            }
            if (Math.random() < getGeodeChance()) {
                handleGeodeEvent();
                updateUI();
                return;
            }
            if (Math.random() < 0.10) { 
                isCritical = true;
                dustEarned *= 2;
            }
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
    buyRechargeButton.addEventListener('click', () => {
        const rechargesLeft = 3 - gameState.dailyRechargesUsed;
        if (rechargesLeft <= 0) return;
        const cost = getRechargeCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.dailyRechargesUsed++;
            gameState.currentBattery += gameState.batteryCapacity * 0.5;
            if (gameState.currentBattery > gameState.batteryCapacity) {
                gameState.currentBattery = gameState.batteryCapacity;
            }
            updateUI();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
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