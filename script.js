document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const batteryStatus = document.getElementById('battery-status');
    const golemEgg = document.getElementById('golem-egg');
    const eggOverlay = document.getElementById('egg-overlay');
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
    const gemShardsCounter = document.getElementById('gem-shards-counter');
    const particleContainer = document.getElementById('particle-container');
    const shopButton = document.getElementById('shop-button'); // For future use
    const friendsButton = document.getElementById('friends-button'); // For future use
    const buyEnergyButton = document.getElementById('buy-energy-button');
    const energyLevelText = document.getElementById('energy-level');
    const energyEffectText = document.getElementById('energy-effect');
    const multiplierButton = document.getElementById('multiplier-button');
    const multiplierText = document.getElementById('multiplier-text');
    const temporaryMessage = document.getElementById('temporary-message');

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
        energyRechargeUntilTimestamp: 0, // Energy per second
        energyLevel: 1,
        energyBaseCost: 5000
    };

    // Add this new constant at the top of your script.js
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
    function createParticle() {
        if (document.hidden) return; // Performance saver: don't run if tab isn't visible
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 3 + 3}s`;
        particle.style.animationDelay = `${Math.random() * 4}s`;
        particleContainer.appendChild(particle);
        setTimeout(() => { particle.remove(); }, 7000); // Clean up the particle after it has faded
    }
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
        // If no date is provided, use the current date as a default
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

    function createParticle() {
        if (document.hidden) return; // Performance saver: don't run if tab isn't visible
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 3 + 3}s`;
        particle.style.animationDelay = `${Math.random() * 4}s`;
        particleContainer.appendChild(particle);
        setTimeout(() => { particle.remove(); }, 7000); // Clean up the particle after it has faded
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
        // Update header
        dustCounter.innerText = formatNumber(gameState.dust);
        gemShardsCounter.innerText = formatNumber(gameState.gemShards);
        const batteryPercent = (gameState.currentBattery / gameState.batteryCapacity) * 100;
        batteryStatus.innerText = `${Math.floor(batteryPercent)}%`;

        // Update egg progress text
        progressText.innerText = `${formatNumber(gameState.hatchProgress)} / ${formatNumber(gameState.hatchGoal)}`;

        // --- DYNAMIC ENERGY BAR IN MULTIPLIER BUTTON ---
        const energyBar = multiplierButton.querySelector('.energy-bar-fill');
        if (energyBar) {
            let energyPercent = (gameState.tapEnergy / gameState.maxTapEnergy) * 100;

            if (gameState.tapEnergy === 0 && gameState.energyRechargeUntilTimestamp > 0) {
                const remainingSeconds = Math.round((gameState.energyRechargeUntilTimestamp - Date.now()) / 1000);
                energyPercent = ((3600 - remainingSeconds) / 3600) * 100;
                multiplierText.innerText = `Full in ${formatTime(remainingSeconds)}`;
            } else {
                multiplierText.innerText = `Multiplier: x${gameState.tapMultiplier}`;
            }
            energyBar.style.width = `${energyPercent}%`;
        }

        // Update crack overlay
        const progressPercent = Math.min(100, (gameState.hatchProgress / gameState.hatchGoal) * 100);
        eggOverlay.className = 'egg-overlay';
        if (progressPercent >= 75) eggOverlay.classList.add('egg-cracked-3');
        else if (progressPercent >= 50) eggOverlay.classList.add('egg-cracked-2');
        else if (progressPercent >= 25) eggOverlay.classList.add('egg-cracked-1');

        // Update frenzy glow
        eggOverlay.classList.remove('frenzy-ready', 'frenzy-active');
        if (gameState.isFrenzyMode) {
            eggOverlay.classList.add('frenzy-active');
        } else if (Date.now() > gameState.frenzyCooldownUntil) {
            eggOverlay.classList.add('frenzy-ready');
        }

        // --- Update Shop Modals ---
        // Chisel
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = `+${formatWithCommas(gameState.dustPerTap)}`;
        if (gameState.chiselLevel >= 20) {
            buyChiselButton.innerText = "Max Level";
            buyChiselButton.disabled = true;
        } else {
            const cost = getChiselCost();
            buyChiselButton.innerText = `Upgrade (Cost: ${formatNumber(cost)})`;
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
            buyDroneButton.innerText = `Upgrade (Cost: ${formatNumber(cost)})`;
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
            buyBatteryButton.innerText = `Upgrade (Cost: ${formatNumber(cost)})`;
            buyBatteryButton.disabled = gameState.dust < cost;
        }

        // Recharge
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

        // Energy Core
        energyLevelText.innerText = gameState.energyLevel;
        energyEffectText.innerText = `+${formatWithCommas(gameState.maxTapEnergy)} Max`;
        if (gameState.energyLevel >= 10) {
            buyEnergyButton.innerText = "Max Level";
            buyEnergyButton.disabled = true;
        } else {
            const cost = getEnergyCost();
            buyEnergyButton.innerText = `Upgrade (Cost: ${formatNumber(cost)})`;
            buyEnergyButton.disabled = gameState.dust < cost;
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

        // --- NEW REWARD LOGIC ---
        // Use modulo to loop through the 28-day reward track
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
                gameState.gemShards += rewardInfo.amount; // <<< ADD THIS LINE
                rewardText = `${rewardInfo.label}!`;
                break;
            case 'recharge':
                // Give a free recharge by reducing the "used" count (can go negative)
                gameState.dailyRechargesUsed -= rewardInfo.amount;
                rewardText = `${rewardInfo.label}!`;
                break;
        }

        // Update and show the reward modal
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

        // This is the key change: Calculate a base reward that includes the multiplier
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
        gameState.isFrenzyMode = false;
    }

    function endFrenzyMode() {
        clearInterval(frenzyInterval);

        multiplierButton.disabled = false;

        gameState.isFrenzyMode = false;
        gameState.frenzyCooldownUntil = Date.now() + 60000; // 1 minute cooldown
        frenzyTimerContainer.classList.add('hidden');
        updateUI();
    }

    // --- EVENT LISTENERS ---
    golemEgg.addEventListener('click', () => {
        // --- ENERGY LOGIC: Only applies if NOT in Frenzy Mode ---
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
            if (gameState.tapEnergy === 0) {
                const ONE_HOUR_IN_MS = 3600 * 1000;
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
                handleGeodeEvent(); // Geode event already calls updateUI() and returns
                return;
            }
            if (Math.random() < 0.10) {
                isCritical = true;
                dustEarned *= 2;
            }
        }

        // 5. UPDATE GAME STATE & VISUALS (This part is unchanged)
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

        const rect = golemEgg.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        clickEffectContainer.appendChild(effect);
        setTimeout(() => { effect.remove(); }, 1000);
        updateUI();
    });

    upgradeButton.addEventListener('click', () => upgradeModal.classList.remove('hidden'));
    closeUpgradeButton.addEventListener('click', () => upgradeModal.classList.add('hidden'));
    calendarButton.addEventListener('click', () => {
        renderStreakCalendar();
        calendarModal.classList.remove('hidden');
    });
    closeRewardButton.addEventListener('click', () => loginRewardModal.classList.add('hidden'));
    closeCalendarButton.addEventListener('click', () => calendarModal.classList.add('hidden'));

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
        if (gameState.energyLevel >= 10) return; // Let's set a max level of 10 for now
        const cost = getEnergyCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.energyLevel++;
            gameState.maxTapEnergy = 2000 + ((gameState.energyLevel - 1) * 500); // e.g., +500 max energy per level
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
                gameState.tapMultiplier = 50;
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

    const energyBarFill = document.createElement('div');
    energyBarFill.className = 'energy-bar-fill';
    multiplierButton.prepend(energyBarFill);

    // ADD THIS LINE to start the particle effects
    setInterval(createParticle, 250);
    setInterval(gameLoop, 1000);
    setInterval(saveGame, 3000);
});