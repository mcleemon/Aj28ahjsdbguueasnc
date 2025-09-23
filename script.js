document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---

    const dustCounter = document.getElementById('dust-counter');
    const gemShardsCounter = document.getElementById('gem-shards-counter');
    const batteryStatus = document.getElementById('battery-status');
    const golemEgg = document.getElementById('golem-egg');
    const progressText = document.getElementById('progress-text');
    const clickEffectContainer = document.getElementById('click-effect-container');
    const frenzyTimerContainer = document.getElementById('frenzy-timer-container');
    const frenzyTimer = document.getElementById('frenzy-timer');
    const upgradeButton = document.getElementById('upgrade-button');
    const calendarButton = document.getElementById('calendar-button');
    const upgradeModal = document.getElementById('upgrade-modal');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const calendarModal = document.getElementById('calendar-modal');
    const cheatModal = document.getElementById('cheat-modal');
    const closeUpgradeButton = document.getElementById('close-upgrade-button');
    const closeRewardButton = document.getElementById('close-reward-button');
    const closeCalendarButton = document.getElementById('close-calendar-button');
    const rewardStreak = document.getElementById('reward-streak');
    const rewardAmount = document.getElementById('reward-amount');
    const calendarStreakLabel = document.getElementById('calendar-streak-label');
    const streakGrid = document.getElementById('streak-grid');
    const buyChiselButton = document.getElementById('buy-chisel-button');
    const chiselLevelText = document.getElementById('chisel-level');
    const chiselEffectText = document.getElementById('chisel-effect');
    const buyDroneButton = document.getElementById('buy-drone-button');
    const droneLevelText = document.getElementById('drone-level');
    const droneEffectText = document.getElementById('drone-effect');
    const buyBatteryButton = document.getElementById('buy-battery-button');
    const batteryLevelText = document.getElementById('battery-level');
    const batteryCapacityText = document.getElementById('battery-capacity');
    const buyRechargeButton = document.getElementById('buy-recharge-button');
    const rechargeCountText = document.getElementById('recharge-count');
    const energyBarFill = document.getElementById('energy-bar-fill');
    const energyText = document.getElementById('energy-text');
    const buyEnergyButton = document.getElementById('buy-energy-button');
    const energyLevelText = document.getElementById('energy-level');
    const energyEffectText = document.getElementById('energy-effect');
    const multiplierButton = document.getElementById('multiplier-button');
    const multiplierText = document.getElementById('multiplier-text');
    const temporaryMessage = document.getElementById('temporary-message');
    const offlineProgressModal = document.getElementById('offline-progress-modal');
    const closeOfflineButton = document.getElementById('close-offline-button');
    const offlineDustAmount = document.getElementById('offline-dust-amount');
    const offlineTimePassed = document.getElementById('offline-time-passed');

    // --- GAME STATE ---

    let gameState = {
        tapMultiplier: 1,
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
        gemShards: 0,
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
        tapEnergy: 2000,
        maxTapEnergy: 2000,
        energyRechargeUntilTimestamp: 0,
        energyLevel: 1,
        energyBaseCost: 5000
    };

    const dailyRewards = [

        // Week 1
        { type: 'dust', amount: 500 },
        { type: 'dust', amount: 750 },
        { type: 'dust', amount: 1000 },
        { type: 'dust', amount: 1250 },
        { type: 'dust', amount: 1500 },
        { type: 'dust', amount: 2000 },
        { type: 'gem_shard', amount: 1, label: '1 Gem Shard' }, // Milestone Day 7

        // Week 2
        { type: 'dust', amount: 2500 },
        { type: 'dust', amount: 2750 },
        { type: 'dust', amount: 3000 },
        { type: 'dust', amount: 3250 },
        { type: 'dust', amount: 3500 },
        { type: 'dust', amount: 4000 },
        { type: 'gem_shard', amount: 2, label: '2 Gem Shards' }, // Milestone Day 14

        // Week 3
        { type: 'dust', amount: 4500 },
        { type: 'dust', amount: 4750 },
        { type: 'dust', amount: 5000 },
        { type: 'dust', amount: 5250 },
        { type: 'dust', amount: 5500 },
        { type: 'dust', amount: 6000 },
        { type: 'gem_shard', amount: 3, label: '3 Gem Shards' }, // Milestone Day 21

        // Week 4
        { type: 'dust', amount: 7000 },
        { type: 'dust', amount: 7500 },
        { type: 'dust', amount: 8000 },
        { type: 'dust', amount: 9000 },
        { type: 'dust', amount: 10000 },
        { type: 'recharge', amount: 1, label: '1 Drone Recharge' },
        { type: 'gem_shard', amount: 5, label: '5 Gem Shards' }, // BIG Milestone Day 28
    ];

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

    function formatDate(date) {
        const d = date || new Date();
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

    function formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
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
                    gameState.isFrenzyMode = false;
                    if (gameState.hatchProgress > gameState.hatchGoal) {
                        gameState.hatchProgress = gameState.hatchGoal;
                    }
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
                    if (gameState.hatchProgress > gameState.hatchGoal) {
                        gameState.hatchProgress = gameState.hatchGoal;
                    }
                }
                // Update the modal text
                offlineDustAmount.innerText = formatNumber(dustEarnedOffline);
                offlineTimePassed.innerText = `${Math.floor(batteryDrain / 60)} minutes`;
                // Show the modal
                offlineProgressModal.classList.remove('hidden');
            }
        }
    }

    function updateUI() {
        dustCounter.innerText = formatWithCommas(gameState.dust);
        gemShardsCounter.innerText = formatNumber(gameState.gemShards);
        progressText.innerText = `${formatWithCommas(gameState.hatchProgress)} / ${formatNumber(gameState.hatchGoal)}`;
        const batteryPercent = (gameState.currentBattery / gameState.batteryCapacity) * 100;
        batteryStatus.innerText = `${Math.floor(batteryPercent)}%`;

        // Energy Bar & Multiplier Text
        const energyPercent = (gameState.tapEnergy / gameState.maxTapEnergy) * 100;
        energyBarFill.style.width = `${energyPercent}%`;
        if (gameState.tapEnergy === 0 && gameState.energyRechargeUntilTimestamp > 0) {
            const remainingSeconds = Math.round((gameState.energyRechargeUntilTimestamp - Date.now()) / 1000);
            energyText.innerText = `Full in ${formatTime(remainingSeconds)}`;
            multiplierText.innerText = 'Recharging...';
        } else {
            energyText.innerText = `${Math.floor(gameState.tapEnergy)} / ${gameState.maxTapEnergy}`;
            multiplierText.innerText = `x${gameState.tapMultiplier}`;
        }

        // Frenzy Glow
        eggOverlay.classList.remove('frenzy-ready', 'frenzy-active');
        if (gameState.isFrenzyMode) {
            eggOverlay.classList.add('frenzy-active');
        } else if (Date.now() > gameState.frenzyCooldownUntil) {
            eggOverlay.classList.add('frenzy-ready');
        }

        // --- UPDATE SHOP MODALS WITH NEW BUTTON TEXT ---
        // Chisel
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = `+${formatWithCommas(gameState.dustPerTap)}`;
        if (gameState.chiselLevel >= 20) {
            buyChiselButton.innerText = "Max Level";
            buyChiselButton.disabled = true;
        } else {
            const cost = getChiselCost();
            const nextEffect = gameState.dustPerTap + 1;
            buyChiselButton.innerText = `Next +${formatWithCommas(nextEffect)} (Cost: ${formatNumber(cost)})`;
            buyChiselButton.disabled = gameState.dust < cost;
        }

        // Drone
        droneLevelText.innerText = gameState.droneLevel;
        droneEffectText.innerText = `+${formatNumber(gameState.dustPerSecond)}`;
        if (gameState.droneLevel >= 10) {
            buyDroneButton.innerText = "Max Level";
            buyDroneButton.disabled = true;
        } else {
            const cost = getDroneCost();
            const nextEffect = gameState.dustPerSecond + 1;
            buyDroneButton.innerText = `Next +${formatNumber(nextEffect)} (Cost: ${formatNumber(cost)})`;
            buyDroneButton.disabled = gameState.dust < cost;
        }

        // Battery
        batteryLevelText.innerText = gameState.batteryLevel;
        batteryCapacityText.innerText = `${Number(gameState.batteryCapacity / 3600).toFixed(1)} Hours`;
        if (gameState.batteryLevel >= batteryLevels.length) {
            buyBatteryButton.innerText = "Max Level";
            buyBatteryButton.disabled = true;
        } else {
            const cost = getBatteryCost();
            const nextCapacitySeconds = batteryLevels[gameState.batteryLevel];
            const nextCapacityText = `${Number(nextCapacitySeconds / 3600).toFixed(1)} Hours`;
            buyBatteryButton.innerText = `Next ${nextCapacityText} (Cost: ${formatNumber(cost)})`;
            buyBatteryButton.disabled = gameState.dust < cost;
        }

        // Energy Core
        energyLevelText.innerText = gameState.energyLevel;
        energyEffectText.innerText = `+${formatWithCommas(gameState.maxTapEnergy)} Max`;
        if (gameState.energyLevel >= 10) {
            buyEnergyButton.innerText = "Max Level";
            buyEnergyButton.disabled = true;
        } else {
            const cost = getEnergyCost();
            const nextEffect = 2000 + (gameState.energyLevel * 500);
            buyEnergyButton.innerText = `Next +${formatWithCommas(nextEffect)} Max (Cost: ${formatNumber(cost)})`;
            buyEnergyButton.disabled = gameState.dust < cost;
        }

        // Recharge (No change)
        const rechargesLeft = 3 - gameState.dailyRechargesUsed;
        rechargeCountText.innerText = rechargesLeft;
        if (rechargesLeft <= 0) {
            buyRechargeButton.innerText = "No Recharges Left";
            buyRechargeButton.disabled = true;
        } else {
            const cost = getRechargeCost();
            buyRechargeButton.innerText = `Recharge (Cost: ${formatNumber(cost)})`;
            buyRechargeButton.disabled = gameState.dust < cost || gameState.currentBattery >= gameState.batteryCapacity;
        }
    }

    function getChiselCost() { return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1)); }
    function getDroneCost() { return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel)); }
    function getBatteryCost() { return Math.floor(gameState.batteryBaseCost * Math.pow(2.2, gameState.batteryLevel - 1)); }
    function getRechargeCost() { return Math.floor(gameState.rechargeBaseCost * Math.pow(2.5, gameState.dailyRechargesUsed)); }
    function getEnergyCost() {
        return Math.floor(gameState.energyBaseCost * Math.pow(2.0, gameState.energyLevel - 1));
    }

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
        if (gameState.energyRechargeUntilTimestamp > 0 && Date.now() >= gameState.energyRechargeUntilTimestamp) {
            gameState.tapEnergy = gameState.maxTapEnergy; // Fully recharge
            gameState.energyRechargeUntilTimestamp = 0; // Reset the timer
        }
        updateUI();
    }

    function handleDailyLogin() {
        const today = formatDate();
        if (gameState.lastLoginDate === today) return;

        // Reset daily limits
        gameState.geodesFoundToday = 0;
        gameState.dailyRechargesUsed = 0;
        gameState.currentBattery = gameState.batteryCapacity;

        // Check for streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);
        if (gameState.lastLoginDate === yesterdayStr) {
            gameState.loginStreak++;
        } else {
            gameState.loginStreak = 1;
        }
        gameState.lastLoginDate = today;
        const rewardIndex = (gameState.loginStreak - 1) % dailyRewards.length;
        const rewardInfo = dailyRewards[rewardIndex];
        let rewardText = '';

        // Grant the reward based on its type
        switch (rewardInfo.type) {
            case 'dust':
                gameState.dust += rewardInfo.amount;
                rewardText = `${formatNumber(rewardInfo.amount)} Crystal Dust!`;
                break;
            case 'gem_shard':
                gameState.gemShards += rewardInfo.amount;
                rewardText = `${rewardInfo.label}!`;
                break;
            case 'recharge':
                // Give a free recharge by reducing the "used" count (can go negative)
                gameState.dailyRechargesUsed -= rewardInfo.amount;
                rewardText = `${rewardInfo.label}!`;
                break;
        }
        rewardStreak.innerText = gameState.loginStreak;
        rewardAmount.innerHTML = rewardText; // Use .innerHTML to allow bolding if needed
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
            const visualDay = ((gameState.loginStreak - 1) % 28) + 1;
            if (i < visualDay) {
                dayCell.classList.add('completed');
            } else if (i === visualDay) {
                dayCell.classList.add('current');
            }
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
        const baseReward = gameState.dustPerTap * gameState.tapMultiplier;
        if (prizeRoll < 0.01) { // EPIC GEODE!
            rarity = "EPIC GEODE!";
            rarityClass = 'epic';
            reward = baseReward * 500;
            rewardText = `+ 1 Gem Shard! (🎁 ${formatNumber(reward)})`;
            gameState.gemShards++;
        } else if (prizeRoll < 0.05) { // Rare Geode!
            rarity = "Rare Geode!";
            rarityClass = 'rare';
            reward = baseReward * 20;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        } else if (prizeRoll < 0.20) { // Uncommon Geode!
            rarity = "Uncommon Geode!";
            rarityClass = 'uncommon';
            reward = baseReward * 5;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        } else { // Common Geode
            rarity = "Common Geode";
            rarityClass = 'common';
            reward = baseReward * 2;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
        }
        gameState.dust += reward;
        if (gameState.hatchProgress < gameState.hatchGoal) {
            gameState.hatchProgress += reward;
            if (gameState.hatchProgress > gameState.hatchGoal) {
                gameState.hatchProgress = gameState.hatchGoal;
            }
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
        golemEgg.classList.add('egg-frenzy');
        multiplierButton.disabled = true;
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
        golemEgg.classList.remove('egg-frenzy');
        multiplierButton.disabled = false;
        gameState.isFrenzyMode = false;
        gameState.frenzyCooldownUntil = Date.now() + 60000; // 1 minute cooldown
        frenzyTimerContainer.classList.add('hidden');
        updateUI();
    }

    // --- EVENT LISTENERS ---

    golemEgg.addEventListener('click', () => {
        if (!gameState.isFrenzyMode) {
            // 1. VALIDATE: Check if there's enough energy
            if (gameState.tapEnergy < gameState.tapMultiplier) {
                const message = (gameState.tapEnergy === 0)
                    ? 'Insufficient Energy'
                    : 'Reduce the multiplier!';
                temporaryMessage.innerText = message;
                temporaryMessage.classList.remove('hidden');
                setTimeout(() => temporaryMessage.classList.add('hidden'), 2500);
                tg.HapticFeedback.notificationOccurred('error');
                return;
            }

            // 2. CONSUME: Use energy based on the multiplier
            gameState.tapEnergy -= gameState.tapMultiplier;
            if (gameState.tapEnergy < 0) gameState.tapEnergy = 0;
            // Start the 1-hour countdown if energy just hit zero
            const ONE_HOUR_IN_MS = 3600 * 1000;
            if (gameState.tapEnergy === 0) {
                // If this tap depleted energy to zero, ALWAYS reset the timer
                gameState.energyRechargeUntilTimestamp = Date.now() + ONE_HOUR_IN_MS;
            } else if (gameState.energyRechargeUntilTimestamp === 0) {
                // Otherwise, if the timer hasn't started yet, start the hidden timer
                gameState.energyRechargeUntilTimestamp = Date.now() + ONE_HOUR_IN_MS;
            }
        }

        // --- REWARD LOGIC: Applies to ALL taps ---
        // 3. CALCULATE REWARD: Multiplier is applied first
        let dustEarned = gameState.dustPerTap * gameState.tapMultiplier;
        let isCritical = false;

        // 4. APPLY BONUSES: Frenzy and Criticals apply to the multiplied amount
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
                return;
            }
            if (Math.random() < 0.10) {
                isCritical = true;
                dustEarned *= 2;
                golemEgg.classList.add('egg-wobble');
                setTimeout(() => {
                    golemEgg.classList.remove('egg-wobble');
                }, 500); // Duration matches animation
            }
        }

        // 5. UPDATE GAME STATE & VISUALS 
        if (gameState.hatchProgress < gameState.hatchGoal) {
            gameState.hatchProgress += dustEarned;
            if (gameState.hatchProgress > gameState.hatchGoal) {
                gameState.hatchProgress = gameState.hatchGoal;
            }
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

    upgradeButton.addEventListener('click', () => upgradeModal.classList.remove('hidden'));
    closeUpgradeButton.addEventListener('click', () => {
        upgradeModal.classList.add('closing');
        setTimeout(() => {
            upgradeModal.classList.add('hidden');
            upgradeModal.classList.remove('closing');
        }, 300); // This duration must match your CSS animation time
    });
    calendarButton.addEventListener('click', () => {
        renderStreakCalendar();
        calendarModal.classList.remove('hidden');
    });

    closeRewardButton.addEventListener('click', () => {
        loginRewardModal.classList.add('closing');
        setTimeout(() => {
            loginRewardModal.classList.add('hidden');
            loginRewardModal.classList.remove('closing');
        }, 300);
    });
    closeCalendarButton.addEventListener('click', () => {
        calendarModal.classList.add('closing');
        setTimeout(() => {
            calendarModal.classList.add('hidden');
            calendarModal.classList.remove('closing');
        }, 300);
    });
    closeOfflineButton.addEventListener('click', () => {
        offlineProgressModal.classList.add('closing');
        setTimeout(() => {
            offlineProgressModal.classList.add('hidden');
            offlineProgressModal.classList.remove('closing');
        }, 300);
    });
    buyChiselButton.addEventListener('click', () => {
        if (gameState.chiselLevel >= 20) return;
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
        if (gameState.droneLevel >= 10) return;
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

    buyEnergyButton.addEventListener('click', () => {
        if (gameState.energyLevel >= 10) return;
        const cost = getEnergyCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.energyLevel++;
            gameState.maxTapEnergy = 2000 + ((gameState.energyLevel - 1) * 500);
            updateUI();
            tg.HapticFeedback.notificationOccurred('success');
        }
    });

    multiplierButton.addEventListener('click', () => {
        switch (gameState.tapMultiplier) {
            case 1:
                gameState.tapMultiplier = 10;
                break;
            case 10:
                gameState.tapMultiplier = 20; // Changed this line
                break;
            case 20:
                gameState.tapMultiplier = 50; // Added this new case
                break;
            case 50:
                gameState.tapMultiplier = 1;
                break;
            default:
                gameState.tapMultiplier = 1;
        }
        updateUI();
        tg.HapticFeedback.impactOccurred('light');
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