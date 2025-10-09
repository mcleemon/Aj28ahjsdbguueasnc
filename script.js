document.addEventListener('DOMContentLoaded', () => {
    const tg = (window.Telegram && window.Telegram.WebApp)
        ? window.Telegram.WebApp
        : {
            expand: () => { },
            HapticFeedback: {
                notificationOccurred: () => { },
                impactOccurred: () => { }
            }
        };
    if (typeof tg.expand === 'function') tg.expand();

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
    const offlineDustAmount = document.getElementById('offline-dust-amount');
    const offlineTimePassed = document.getElementById('offline-time-passed');
    const particleContainer = document.getElementById('particle-container');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const slotPopup = document.getElementById("slot-popup");

    // --- MINI SLOT ELEMENTS ---
    const slotOverlay = document.getElementById("slot-overlay");
    const slotMachine = document.querySelector(".slot-machine");
    const slotSpinBtn = document.getElementById("slot-spin-btn");
    const slotResult = document.getElementById("slot-result");
    const slotReels = document.querySelectorAll(".symbols");

    let slotActive = false;
    let activeTreasureBox = null;
    const MIN_TAPS_BETWEEN_SPINS = 10;

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
        energyBaseCost: 5000,
        tapsSinceLastSpin: 0
    };

    const slotSymbols = [
        { name: "crystaldust", img: "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" },
        { name: "geode", img: "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/geode.png?raw=true" },
        { name: "gem", img: "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/gem.png?raw=true" }
    ];

    const weightedSlotProbabilities = [];
    // 70% chance for Crystal Dust (index 0)
    for (let i = 0; i < 70; i++) { weightedSlotProbabilities.push(0); }
    // 25% chance for Geode (index 1)
    for (let i = 0; i < 25; i++) { weightedSlotProbabilities.push(1); }
    // 5% chance for Gem (index 2)
    for (let i = 0; i < 5; i++) { weightedSlotProbabilities.push(2); }
    function populateReel(reel) {
        reel.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const div = document.createElement("div");
            div.className = "symbol";
            const symbol = slotSymbols[i % slotSymbols.length];
            const img = document.createElement("img");
            img.src = symbol.img;
            img.alt = symbol.name;
            img.className = "slot-icon";
            div.appendChild(img);
            reel.appendChild(div);
        }
    }
    slotReels.forEach(populateReel);

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
    let particleSpawnInterval = null;
    const batteryLevels = [3600, 7200, 14400, 21600];
    const CHECKSUM_SALT = "golem_egg_super_secret_key_v2";

    const particleSystem = {
        baseRate: 500,         
        frenzyRateMultiplier: 1 / 3, 
        currentInterval: null, 
        mode: "normal"          
    };

    function startParticleLoop(rate) {
        if (particleSystem.currentInterval) {
            clearInterval(particleSystem.currentInterval);
        }
        particleSystem.currentInterval = setInterval(spawnParticle, rate);
    }

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
    function openSlot() {
        removeTreasureBox();
        if (slotActive) return;
        slotActive = true;
        slotOverlay.classList.add('banner-only');
        slotOverlay.classList.remove('hidden');
        slotPopup.classList.remove("hidden");
        setTimeout(() => {
            slotPopup.classList.add("show");
        }, 10);
        setTimeout(() => {
            slotPopup.classList.remove("show");
            setTimeout(() => slotPopup.classList.add("hidden"), 500);
            slotOverlay.classList.remove('banner-only');
            slotResult.classList.add("hidden");
            slotSpinBtn.disabled = false;
        }, 2000);
    }
    function closeSlot() {
        const container = document.querySelector(".slot-machine-container");
        container.classList.add("fade-out");

        setTimeout(() => {
            slotOverlay.classList.add("hidden");
            container.classList.remove("fade-out");
            slotActive = false;
        }, 1000);
    }
    function removeTreasureBox() {
        if (!activeTreasureBox) return;
        try {
            if (activeTreasureBox._tbClickHandler) {
                activeTreasureBox.removeEventListener('click', activeTreasureBox._tbClickHandler);
            }
        } catch (e) {
        }
        if (activeTreasureBox._particleInterval) {
            clearInterval(activeTreasureBox._particleInterval);
            activeTreasureBox._particleInterval = null;
        }
        activeTreasureBox.remove();
        activeTreasureBox = null;
    }

    function isAnyModalOpen() {
        const modals = document.querySelectorAll('.modal');
        for (const modal of modals) {
            const style = window.getComputedStyle(modal);
            if (style.display !== 'none' && style.visibility !== 'hidden' && !modal.classList.contains('hidden')) {
                return true;
            }
        }
        return false;
    }

    function spawnTreasureParticle(box) {
        if (!box) return;
        const container = document.querySelector('.game-container');
        if (!container) return;
        const particle = document.createElement('div');
        particle.className = 'treasure-particle';
        container.appendChild(particle);
        const boxRect = box.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const xOffset = (Math.random() - 0.5) * boxRect.width;
        const startX = boxRect.left - containerRect.left + boxRect.width / 2 + xOffset - 5;
        const startY = boxRect.top - containerRect.top + boxRect.height * 0.2;
        particle.style.left = `${Math.round(startX)}px`;
        particle.style.top = `${Math.round(startY)}px`;
        const size = 6 + Math.random() * 6;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        setTimeout(() => {
            try { particle.remove(); } catch (e) { }
        }, 5000);
    }

    function spawnTreasureBox() {
        if (activeTreasureBox || slotActive || gameState.isFrenzyMode) return;
        if (isAnyModalOpen()) return;
        const container = document.querySelector('.game-container');
        if (!container) return;
        const box = document.createElement('div');
        box.className = 'treasure-box';
        const inner = document.createElement('div');
        inner.className = 'treasure-box-inner';
        const img = document.createElement('img');
        img.src = 'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/treasurebox.png?raw=true';
        img.alt = 'Treasure Box';
        inner.appendChild(img);
        box.appendChild(inner);
        const clickHandler = (e) => {
            e.stopPropagation();
            removeTreasureBox();
            openSlot();
        };
        box._tbClickHandler = clickHandler;
        box.addEventListener('click', clickHandler, { passive: true });
        container.appendChild(box);
        activeTreasureBox = box;
        const header = document.querySelector('.header-container');
        const bottomBar = document.querySelector('.button-bar');
        const containerRect = container.getBoundingClientRect();
        const headerRect = header ? header.getBoundingClientRect() : { bottom: containerRect.top + 60 };
        const bottomRect = bottomBar ? bottomBar.getBoundingClientRect() : { top: containerRect.bottom - 100 };
        const safeTopMin = Math.max(headerRect.bottom - containerRect.top + 8, 50);
        const safeTopMax = Math.max(bottomRect.top - containerRect.top - 8 - box.clientHeight, safeTopMin + 20);
        const safeLeftMin = 16;
        const safeLeftMax = Math.max(container.clientWidth - 16 - box.clientWidth, safeLeftMin + 20);
        const randTop = safeTopMin + Math.random() * Math.max(0, safeTopMax - safeTopMin);
        const randLeft = safeLeftMin + Math.random() * Math.max(0, safeLeftMax - safeLeftMin);
        box.style.left = `${randLeft + box.clientWidth / 2}px`;
        box.style.top = `${randTop + box.clientHeight / 2}px`;
        box._particleInterval = setInterval(() => {
            if (!box.parentElement) {
                clearInterval(box._particleInterval);
                box._particleInterval = null;
                return;
            }
            spawnTreasureParticle(box);
        }, 700);
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
                offlineDustAmount.innerText = formatNumber(dustEarnedOffline);
                offlineTimePassed.innerText = `${Math.floor(batteryDrain / 60)} minutes`;
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
        const energyPercent = (gameState.tapEnergy / gameState.maxTapEnergy) * 100;
        energyBarFill.style.width = `${energyPercent}%`;
        if (gameState.tapEnergy === 0 && gameState.energyRechargeUntilTimestamp > 0) {
            const remainingSeconds = Math.round((gameState.energyRechargeUntilTimestamp - Date.now()) / 1000);
            energyText.innerText = `Full in ${formatTime(remainingSeconds)}`;
            multiplierButton.textContent = 'Recharging...';
        } else {
            energyText.innerText = `${Math.floor(gameState.tapEnergy)} / ${gameState.maxTapEnergy}`;
            multiplierButton.innerHTML = `Multiplier: <span id="multiplier-text">x${gameState.tapMultiplier}</span>`;
        }

        // Chisel
        const chiselNextEffect = document.getElementById('chisel-next-effect');
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = `+${formatWithCommas(gameState.dustPerTap)}`;
        if (gameState.chiselLevel >= 20) {
            buyChiselButton.innerText = "Max Level";
            buyChiselButton.disabled = true;
            chiselNextEffect.parentElement.style.display = 'none'; 
            const cost = getChiselCost();
            const nextEffect = gameState.dustPerTap + 1;
            chiselNextEffect.innerText = `+${formatWithCommas(nextEffect)} Dust/Tap`; 
            chiselNextEffect.parentElement.style.display = 'block'; 
            buyChiselButton.innerText = `Upgrade (Cost: ${formatNumber(cost)})`; 
            buyChiselButton.disabled = gameState.dust < cost;
        }

        // Drone
        const droneNextEffect = document.getElementById('drone-next-effect');
        droneLevelText.innerText = gameState.droneLevel;
        droneEffectText.innerText = `+${formatNumber(gameState.dustPerSecond)}`;
        if (gameState.droneLevel >= 10) {
            buyDroneButton.innerText = "Max Level";
            buyDroneButton.disabled = true;
            droneNextEffect.parentElement.style.display = 'none';
        } else {
            const cost = getDroneCost();
            const nextEffect = gameState.dustPerSecond + 1;
            droneNextEffect.innerText = `+${formatNumber(nextEffect)} Dust/Sec`;
            droneNextEffect.parentElement.style.display = 'block';
            buyDroneButton.innerText = `Upgrade (Cost: ${formatNumber(cost)})`;
            buyDroneButton.disabled = gameState.dust < cost;
        }

        // Battery
        const batteryNextCapacity = document.getElementById('battery-next-capacity');
        batteryLevelText.innerText = gameState.batteryLevel;
        batteryCapacityText.innerText = `${Number(gameState.batteryCapacity / 3600).toFixed(1)} Hours`;
        if (gameState.batteryLevel >= batteryLevels.length) {
            buyBatteryButton.innerText = "Max Level";
            buyBatteryButton.disabled = true;
            batteryNextCapacity.parentElement.style.display = 'none';
        } else {
            const cost = getBatteryCost();
            const nextCapacitySeconds = batteryLevels[gameState.batteryLevel];
            const nextCapacityText = `${Number(nextCapacitySeconds / 3600).toFixed(1)} Hours`;
            batteryNextCapacity.innerText = nextCapacityText; 
            batteryNextCapacity.parentElement.style.display = 'block'; 
            buyBatteryButton.innerText = `Upgrade (Cost: ${formatNumber(cost)})`; 
            buyBatteryButton.disabled = gameState.dust < cost;
        }

        // Energy Core
        const energyNextEffect = document.getElementById('energy-next-effect');
        energyLevelText.innerText = gameState.energyLevel;
        energyEffectText.innerText = `+${formatWithCommas(gameState.maxTapEnergy)} Max`;

        if (gameState.energyLevel >= 10) {
            buyEnergyButton.innerText = "Max Level";
            buyEnergyButton.disabled = true;
            energyNextEffect.parentElement.style.display = 'none'; 
        } else {
            const cost = getEnergyCost();
            const nextEffect = 2000 + (gameState.energyLevel * 500);
            energyNextEffect.innerText = `+${formatWithCommas(nextEffect)} Max`;
            energyNextEffect.parentElement.style.display = 'block';
            buyEnergyButton.innerHTML = `Upgrade<br>(Cost: ${formatNumber(cost)})`;
            buyEnergyButton.disabled = gameState.dust < cost;
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
            gameState.tapEnergy = gameState.maxTapEnergy;
            gameState.energyRechargeUntilTimestamp = 0;
        }
        updateUI();
    }
    function handleDailyLogin() {
        const today = formatDate();
        if (gameState.lastLoginDate === today) return;
        gameState.geodesFoundToday = 0;
        gameState.dailyRechargesUsed = 0;
        gameState.currentBattery = gameState.batteryCapacity;
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
                gameState.dailyRechargesUsed -= rewardInfo.amount;
                rewardText = `${rewardInfo.label}!`;
                break;
        }
        rewardStreak.innerText = gameState.loginStreak;
        rewardAmount.innerHTML = rewardText;
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
        return 0.03;
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
        golemEgg.classList.add('egg-wobble');
        setTimeout(() => {
            golemEgg.classList.remove('egg-wobble');
        }, 500);
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
        clearInterval(particleSpawnInterval);
        particleSystem.mode = "frenzy";
        const frenzyRate = particleSystem.baseRate * particleSystem.frenzyRateMultiplier;
        startParticleLoop(frenzyRate);
        updateUI();
    }
    function endFrenzyMode() {
        clearInterval(frenzyInterval);
        golemEgg.classList.remove('egg-frenzy');
        multiplierButton.disabled = false;
        gameState.isFrenzyMode = false;
        gameState.frenzyCooldownUntil = Date.now() + 60000;
        frenzyTimerContainer.classList.add('hidden');
        particleSystem.mode = "normal";
        startParticleLoop(particleSystem.baseRate);
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
            const ONE_HOUR_IN_MS = 3600 * 1000;
            if (gameState.tapEnergy === 0) {
                gameState.energyRechargeUntilTimestamp = Date.now() + ONE_HOUR_IN_MS;
            } else if (gameState.energyRechargeUntilTimestamp === 0) {
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
                }, 500);
            }
        }

        // --- MINI SLOT TRIGGER WITH TAP COOLDOWN ---
        if (!slotActive && !gameState.isFrenzyMode) {
            // Count this tap toward the cooldown (only successful taps reach here)
            gameState.tapsSinceLastSpin = (gameState.tapsSinceLastSpin || 0) + 1;
            const chanceMap = { 1: 0.01, 10: 0.015, 20: 0.02, 50: 0.03 };
            const chance = (chanceMap[gameState.tapMultiplier] || 0);
            const roll = Math.random();
            if (gameState.tapsSinceLastSpin >= MIN_TAPS_BETWEEN_SPINS && roll < chance) {
                gameState.tapsSinceLastSpin = 0;
                spawnTreasureBox();
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

    settingsButton.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    const closeSettingsButton = document.getElementById('close-settings-button');
    closeSettingsButton.addEventListener('click', () => {
        settingsModal.classList.add('closing');
        setTimeout(() => {
            settingsModal.classList.add('hidden');
            settingsModal.classList.remove('closing');
        }, 300);
    });

    upgradeButton.addEventListener('click', () => upgradeModal.classList.remove('hidden'));
    closeUpgradeButton.addEventListener('click', () => {
        upgradeModal.classList.add('closing');
        setTimeout(() => {
            upgradeModal.classList.add('hidden');
            upgradeModal.classList.remove('closing');
        }, 300);
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
                gameState.tapMultiplier = 20;
                break;
            case 20:
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

    function spawnParticle() {
        const wrapper = document.createElement('div');
        wrapper.className = 'glow-wrapper';
        const particle = document.createElement('div');
        particle.className = 'glow-particle';
        if (gameState.isFrenzyMode) {
            particle.classList.add('frenzy');
        }
        const brightness = 0.8 + Math.random() * 0.8;
        particle.style.filter = `brightness(${brightness})`;
        const angle = Math.random() * Math.PI * 2;
        const radius = 70 + Math.random() * 15;
        const x = Math.cos(angle) * radius + particleContainer.clientWidth / 2;
        const y = Math.sin(angle) * radius + particleContainer.clientHeight / 2;
        wrapper.style.left = `${x}px`;
        wrapper.style.top = `${y}px`;
        wrapper.appendChild(particle);
        particleContainer.appendChild(wrapper);
        setTimeout(() => wrapper.remove(), 5100);
    }

    slotSpinBtn.addEventListener("click", () => {
        slotSpinBtn.disabled = true;
        if (!slotActive) return;
        slotReels.forEach(r => {
            r.classList.add("spinning");
            r.style.transform = "translateY(0)";
        });
        const results = [
            weightedSlotProbabilities[Math.floor(Math.random() * weightedSlotProbabilities.length)],
            weightedSlotProbabilities[Math.floor(Math.random() * weightedSlotProbabilities.length)],
            weightedSlotProbabilities[Math.floor(Math.random() * weightedSlotProbabilities.length)]
        ];
        setTimeout(() => stopReel(0, results[0]), 1000);
        setTimeout(() => stopReel(1, results[1]), 2000);
        const tensionDelay = (slotSymbols[results[0]] === slotSymbols[results[1]]) ? 3500 : 2500;
        setTimeout(() => {
            stopReel(2, results[2]);
            handleSlotResult(results);
        }, tensionDelay);
    });

    function stopReel(index, stopIndex) {
        const reel = slotReels[index];
        reel.classList.remove("spinning");
        reel.style.filter = "none";
        reel.style.transform = `translateY(${-100 * stopIndex}px)`;
    }

    function handleSlotResult(results) {
        const [r1, r2, r3] = results;
        const win = (slotSymbols[r1].name === slotSymbols[r2].name && slotSymbols[r2].name === slotSymbols[r3].name);

        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred(win ? 'success' : 'warning');
        }
        if (win) {
            const winningSymbolName = slotSymbols[r1].name;
            let rewardDisplayHtml = '';
            if (winningSymbolName === 'crystaldust') {
                let dustReward = 0;
                switch (gameState.tapMultiplier) {
                    case 1: dustReward = 5000; break;
                    case 10: dustReward = 10000; break;
                    case 20: dustReward = 20000; break;
                    case 50: dustReward = 50000; break;
                    default: dustReward = 5000;
                }
                gameState.dust += dustReward;
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;
            } else if (winningSymbolName === 'geode') {
                let dustReward = 0;
                switch (gameState.tapMultiplier) {
                    case 1: dustReward = 10000; break;
                    case 10: dustReward = 50000; break;
                    case 20: dustReward = 100000; break;
                    case 50: dustReward = 500000; break;
                    default: dustReward = 10000;
                }
                gameState.dust += dustReward;
                const rareGeodesWon = 5;
                gameState.geodesFoundToday += rareGeodesWon;
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;
            } else if (winningSymbolName === 'gem') {
                let gemReward = 0;
                switch (gameState.tapMultiplier) {
                    case 1: gemReward = 1; break;
                    case 10: gemReward = 3; break;
                    case 20: gemReward = 5; break;
                    case 50: gemReward = 10; break;
                    default: gemReward = 1;
                }
                gameState.gemShards += gemReward;
                rewardDisplayHtml = `${gemReward} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/gem.png?raw=true" class="slot-icon-small">`;
            }
            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";
        } else {
            let dustReward = 0;
            switch (gameState.tapMultiplier) {
                case 1: dustReward = 500; break;
                case 10: dustReward = 1000; break;
                case 20: dustReward = 2000; break;
                case 50: dustReward = 5000; break;
                default: dustReward = 500;
            }
            gameState.dust += dustReward;

            const rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;

            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";
        }

        slotResult.classList.remove("hidden");
        slotResult.classList.add("show");

        slotOverlay.addEventListener("click", () => {
            closeSlot();
        }, { once: true });
    }

    offlineProgressModal.addEventListener('click', (event) => {
        offlineProgressModal.classList.add('closing');
        setTimeout(() => {
            offlineProgressModal.classList.add('hidden');
            offlineProgressModal.classList.remove('closing');
        }, 300);
    });

    // --- INITIALIZE GAME ---

    const isNewPlayer = loadGame();
    if (typeof gameState.tapsSinceLastSpin !== 'number') {
        gameState.tapsSinceLastSpin = MIN_TAPS_BETWEEN_SPINS;
    }
    if (isNewPlayer) {
        saveGame();
    }
    handleDailyLogin();
    updateUI();
    setInterval(gameLoop, 1000);
    setInterval(saveGame, 3000);
    particleSpawnInterval = setInterval(spawnParticle, 500);
    // === DEVELOPER CHEATS ===
    document.addEventListener('keydown', (e) => {
        if (!e.key) return;
        const key = e.key.toLowerCase();
        switch (key) {
            // 🌀 Force open slot machine
            case 's':
                console.log('[DEV] Forcing Spin-to-Win...');
                openSlot();
                break;

            // 🔋 Fill Drone Battery
            case 'b':
                console.log('[DEV] Drone battery filled to max.');
                gameState.currentBattery = gameState.batteryCapacity;
                updateUI?.();
                break;

            // ⚡ Toggle Frenzy Mode
            case 'f':
                if (!gameState.isFrenzyMode) {
                    console.log('[DEV] Frenzy Mode START');
                    startFrenzyMode();
                } else {
                    console.log('[DEV] Frenzy Mode END');
                    endFrenzyMode();
                }
                break;

            // 🔋 Refill energy instantly
            case 'e':
                console.log('[DEV] Energy refilled to max.');
                gameState.tapEnergy = gameState.maxTapEnergy;
                updateUI?.();
                break;

            // 🪫 Drain energy instantly
            case 'd':
                console.log('[DEV] Energy drained to 0.');
                gameState.tapEnergy = 0;
                gameState.energyRechargeUntilTimestamp = Date.now() + 10000; // 10s recharge
                updateUI?.();
                break;

            // 💎 Add gems
            case 'g':
                console.log('[DEV] +10 Gems');
                gameState.gems = (gameState.gems || 0) + 10;
                updateUI?.();
                break;

            // ✨ Add crystal dust
            case 'c':
                console.log('[DEV] +1000 Crystal Dust');
                gameState.crystalDust = (gameState.crystalDust || 0) + 1000;
                updateUI?.();
                break;

            // 🧰 Spawn treasure box manually
            case 't':
                console.log('[DEV] Spawning treasure box manually...');
                spawnTreasureBox();
                break;

            // 🔄 Reset all progress
            case 'r':
                console.log('[DEV] Soft reset');
                if (confirm('⚠️ Are you sure you want to reset your save?')) {
                    localStorage.clear();
                    location.reload();
                }
                break;

            default:
                // no-op for other keys
                break;
        }
    });
});