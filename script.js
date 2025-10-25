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
    if (typeof tg.requestFullscreen === 'function') tg.requestFullscreen();
    if (typeof tg.enableClosingConfirmation === 'function') {
        tg.enableClosingConfirmation();
    }
    try {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {

            // Load the user's name (like before)
            if (tg.initDataUnsafe.user.first_name) {
                const playerNameElement = document.getElementById('player-name');
                if (playerNameElement) {
                    playerNameElement.innerText = tg.initDataUnsafe.user.first_name;
                }
            }

            // --- NEW: Load Profile Picture ---
            if (tg.initDataUnsafe.user.photo_url) {
                const avatarFrame = document.querySelector('.avatar-frame');
                if (avatarFrame) {
                    // Set the background image of the div to the user's photo
                    avatarFrame.style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
                }
            }
            // --- END OF NEW CODE ---
        }
    } catch (error) {
        console.error("Failed to load user info:", error);
    }

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
    const closeCalendarButton = document.getElementById('close-calendar-button');
    const buyChiselButton = document.getElementById('buy-chisel-button');
    const chiselLevelText = document.getElementById('chisel-level');
    const chiselEffectText = document.getElementById('chisel-effect');
    const buyDroneButton = document.getElementById('buy-drone-button');
    const droneLevelText = document.getElementById('drone-level');
    const droneEffectText = document.getElementById('drone-effect');
    const buyBatteryButton = document.getElementById('buy-battery-button');
    const batteryLevelText = document.getElementById('battery-level');
    const batteryCapacityText = document.getElementById('battery-capacity');
    const temporaryMessage = document.getElementById('temporary-message');
    const offlineProgressModal = document.getElementById('offline-progress-modal');
    const particleContainer = document.getElementById('particle-container');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const slotPopup = document.getElementById("slot-popup");
    const loginStreakText = document.getElementById('login-streak-text');
    const loginRewardText = document.getElementById('login-reward-text');

    // --- MINI SLOT ELEMENTS ---
    const slotOverlay = document.getElementById("slot-overlay");
    const slotMachine = document.querySelector(".slot-machine");
    const slotSpinBtn = document.getElementById("slot-spin-btn");
    const slotResult = document.getElementById("slot-result");
    const slotReels = document.querySelectorAll(".symbols");

    let slotActive = false;
    let frenzyAccumulatedDust = 0;
    let saveTimer = null;
    let hatchHoldTimer = null;
    let activeTreasureBox = null;
    const MIN_TAPS_BETWEEN_SPINS = 50;

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
        gemShards: 0,
        checksum: null,
        lastSavedTimestamp: Date.now(),
        batteryLevel: 1,
        batteryCapacity: 3600,
        batteryBaseCost: 1000,
        geodesFoundToday: 0,
        rechargeBaseCost: 1000,
        droneCooldownEndTimestamp: 0,
        isFrenzyMode: false,
        frenzyCooldownUntil: 0,
        tapsSinceLastSpin: 0,
        lastTapTimestamp: 0 // ✨ ADD THIS LINE
    };

    // --- Default Egg configuration ---
    const DEFAULT_EGG_LEVELS = [
        { level: 1, tapsRequired: 1000, rewardDust: 2500 },
        { level: 2, tapsRequired: 5000, rewardDust: 12000 },
        { level: 3, tapsRequired: 10000, rewardDust: 30000 },
        { level: 4, tapsRequired: 25000, rewardDust: 75000 },
        { level: 5, tapsRequired: 50000, rewardDust: 160000 },
        { level: 6, tapsRequired: 100000, rewardDust: 350000 },
        { level: 7, tapsRequired: 250000, rewardDust: 900000 },
        { level: 8, tapsRequired: 500000, rewardDust: 2000000 },
        { level: 9, tapsRequired: 750000, rewardDust: 3500000 },
        { level: 10, tapsRequired: 1000000, rewardDust: 5000000 }
    ];

    // --- Add egg data to gameState ---
    gameState.egg = {
        name: "Default Egg",
        level: 1,
        progress: 0,
        goal: DEFAULT_EGG_LEVELS[0].tapsRequired,
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
        { type: 'dust', amount: 15000 },
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
        num = Math.floor(Number(num) || 0);
        if (num < 1000) return num.toString();

        const suffixes = ["", "K", "M", "B", "T", "Q"];
        const tier = Math.floor(Math.log10(num) / 3);

        if (tier === 0) return num;

        const scaled = num / Math.pow(1000, tier);
        const formatted = scaled.toFixed(1).replace(/\.0$/, '');

        return `${formatted}${suffixes[tier]}`;
    }

    function formatBatteryTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        return `${hours}:${minutes}`;
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

    function formatCooldownTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    // --- CORE FUNCTIONS ---
    function saveGame() {
        try {
            // We still use localStorage for the backup, which is fine
            const currentSave = localStorage.getItem('golemEggGameState');
            if (currentSave) {
                localStorage.setItem('golemEggGameState_previous', currentSave);
            }

            gameState.lastSavedTimestamp = Date.now();
            gameState.checksum = generateChecksum(gameState);
            const saveString = JSON.stringify(gameState);

            // --- NEW CLOUD STORAGE LOGIC ---
            if (tg && tg.CloudStorage) {
                // 1. Save the main file to the cloud
                tg.CloudStorage.setItem('golemEggGameState', saveString, (err) => {
                    if (err) {
                        console.error("Cloud save failed:", err);
                        // Fallback: save to localStorage if cloud fails
                        localStorage.setItem('golemEggGameState', saveString);
                    } else {
                        // console.log("Game saved to cloud!");
                    }
                });
            } else {
                // Fallback: save to localStorage if cloud isn't available
                localStorage.setItem('golemEggGameState', saveString);
            }
            // --- END NEW LOGIC ---

        } catch (error) {
            console.error("Failed to save game:", error);
        }
    }
    // We add a 'callback' argument. This is the code that will run
    // AFTER we finish loading.
    function loadGame(onLoadComplete) {

        // This is your old helper function, it's still useful.
        const tryLoadingState = (savedJSON) => {
            if (!savedJSON) return false;
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

        // --- NEW CLOUD STORAGE LOGIC ---
        if (tg && tg.CloudStorage) {
            // 1. Try to get the cloud save file
            tg.CloudStorage.getItem('golemEggGameState', (err, cloudSaveString) => {
                let isNew = true;
                if (err) {
                    console.warn("Cloud load failed, trying localStorage...", err);
                    // If cloud fails, try to load from localStorage as a backup
                    isNew = !tryLoadingState(localStorage.getItem('golemEggGameState'));
                } else if (tryLoadingState(cloudSaveString)) {
                    // 2. Success! We loaded from the cloud.
                    isNew = false;
                    console.log("Game loaded from cloud.");
                } else {
                    // 3. Cloud data was empty or corrupt, try localStorage backup
                    console.warn("Cloud data corrupt, trying localStorage...");
                    isNew = !tryLoadingState(localStorage.getItem('golemEggGameState_previous'));
                }

                // --- Handle offline progress (moved from old function) ---
                if (!isNew) {
                    const now = Date.now();
                    const timePassedInSeconds = Math.floor((now - gameState.lastSavedTimestamp) / 1000);
                    if (timePassedInSeconds > 300) {
                        offlineProgressModal.classList.remove('hidden');
                    }
                    gameState.dustPerTap = gameState.chiselLevel || 1;
                }

                // 4. Finally, run the callback function with the result
                onLoadComplete(isNew);
            });
        } else {
            // --- FALLBACK: No CloudStorage, use old localStorage logic ---
            console.log("No cloud storage, using localStorage.");
            let isNew = true;
            try {
                if (tryLoadingState(localStorage.getItem('golemEggGameState'))) {
                    isNew = false;
                } else if (tryLoadingState(localStorage.getItem('golemEggGameState_previous'))) {
                    console.warn("Main save corrupt, loaded backup.");
                    isNew = false;
                }
                if (!isNew) {
                    const now = Date.now();
                    const timePassedInSeconds = Math.floor((now - gameState.lastSavedTimestamp) / 1000);
                    if (timePassedInSeconds > 300) {
                        offlineProgressModal.classList.remove('hidden');
                    }
                    gameState.dustPerTap = gameState.chiselLevel || 1;
                }
            } catch (error) {
                console.error("Critical error during local load:", error);
            }
            // Run the callback with the result
            onLoadComplete(isNew);
        }
    }
    function updateUI() {
        dustCounter.innerText = formatNumber(gameState.dust);
        gemShardsCounter.innerText = formatNumber(gameState.gemShards);
        // show egg progress and level instead of old hatch progress
        progressText.innerText = `${formatWithCommas(gameState.egg.progress)} / ${formatWithCommas(gameState.egg.goal)}`;
        const eggLevelText = document.getElementById('egg-level-text');
        if (eggLevelText) eggLevelText.innerText = `Lv. ${gameState.egg.level}`;
        // --- New Drone Cooldown UI ---
        if (gameState.droneLevel === 0) {
            batteryStatus.innerText = '--:--';
            batteryStatus.classList.remove('claimable');
        } else {
            const now = Date.now();
            if (now >= gameState.droneCooldownEndTimestamp) {
                // Cooldown is finished, ready to claim
                batteryStatus.innerText = 'Claim';
                batteryStatus.classList.add('claimable');
            } else {
                // Cooldown is active, show the timer
                const timeLeftInSeconds = Math.ceil((gameState.droneCooldownEndTimestamp - now) / 1000);
                batteryStatus.innerText = formatCooldownTime(timeLeftInSeconds);
                batteryStatus.classList.remove('claimable');
            }
        }

        // Chisel
        const chiselNextEffect = document.getElementById('chisel-next-effect');
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = `+${formatWithCommas(gameState.dustPerTap)}`;
        if (gameState.chiselLevel >= 10) {
            buyChiselButton.innerText = "Max Level";
            buyChiselButton.disabled = true;
            chiselNextEffect.parentElement.style.display = 'none';
        }
        else {
            const cost = getChiselCost();
            const nextEffect = gameState.dustPerTap + 1;
            chiselNextEffect.innerText = `+${formatWithCommas(nextEffect)} Dust/Tap`;
            chiselNextEffect.parentElement.style.display = 'block';
            buyChiselButton.innerHTML = `Upgrade <span class="dust-amount-color">${formatNumber(cost)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
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
            buyDroneButton.innerHTML = `Upgrade <span class="dust-amount-color">${formatNumber(cost)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
            buyDroneButton.disabled = gameState.dust < cost;
        }

        // Battery
        const batteryNextCapacity = document.getElementById('battery-next-capacity');
        batteryLevelText.innerText = gameState.batteryLevel;
        batteryCapacityText.innerText = `${Number(gameState.batteryCapacity / 3600).toFixed(1)} Hours`;

        // This is the NEW check for the drone's level
        if (gameState.droneLevel === 0) {
            buyBatteryButton.innerText = "Requires Drone";
            buyBatteryButton.disabled = true;
            batteryNextCapacity.parentElement.style.display = 'none';
        }
        // This is the existing check for max level
        else if (gameState.batteryLevel >= batteryLevels.length) {
            buyBatteryButton.innerText = "Max Level";
            buyBatteryButton.disabled = true;
            batteryNextCapacity.parentElement.style.display = 'none';
        }
        // This is the existing check for cost
        else {
            const cost = getBatteryCost();
            const nextCapacitySeconds = batteryLevels[gameState.batteryLevel];
            const nextCapacityText = `${Number(nextCapacitySeconds / 3600).toFixed(1)} Hours`;
            batteryNextCapacity.innerText = nextCapacityText;
            batteryNextCapacity.parentElement.style.display = 'block';
            buyBatteryButton.innerHTML = `Upgrade <span class="dust-amount-color">${formatNumber(cost)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
            buyBatteryButton.disabled = gameState.dust < cost;
        }

        progressText.innerText = `${formatWithCommas(gameState.egg.progress)} / ${formatWithCommas(gameState.egg.goal)}`;
        eggLevelText.innerText = `Lv. ${gameState.egg.level}`;

        // --- Handle Ready to Hatch overlay & egg shaking ---
        const hatchOverlay = document.getElementById('hatch-overlay');

        if (gameState.egg.progress >= gameState.egg.goal) {
            hatchOverlay.classList.add('active');
            hatchOverlay.classList.remove('hidden');
            golemEgg.classList.add('egg-frenzy'); // ✨ ADD THIS LINE
        } else {
            hatchOverlay.classList.remove('active');
            hatchOverlay.classList.add('hidden');
            // Only remove the shaking class if we are NOT in frenzy mode
            if (!gameState.isFrenzyMode) {
                golemEgg.classList.remove('egg-frenzy');
            }
        }
    }
    function getChiselCost() { return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1)); }
    function getDroneCost() { return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel)); }
    function getBatteryCost() { return Math.floor(gameState.batteryBaseCost * Math.pow(2.2, gameState.batteryLevel - 1)); }
    function gameLoop() {
        updateUI();
    }

    function handleDailyLogin() {
        const today = formatDate();
        if (gameState.lastLoginDate === today) return;
        gameState.geodesFoundToday = 0;
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
                rewardText = `<span class="dust-amount-color">${formatNumber(rewardInfo.amount)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
                break;
            case 'gem_shard':
                gameState.gemShards += rewardInfo.amount;
                rewardText = `${rewardInfo.label}!`;
                break;
        }
        // Use our new elements to display the info
        loginStreakText.innerText = `Streak: ${gameState.loginStreak} Day(s)`;
        loginRewardText.innerHTML = rewardText;
        // --- End of new lines ---
        loginRewardModal.classList.remove('hidden');
        tg.HapticFeedback.notificationOccurred('success');
    }
    function updateCalendarModal() {
        const streakCount = document.getElementById('calendar-streak-count');
        // We now target the new element for the value
        const nextRewardValue = document.getElementById('next-reward-value');

        streakCount.innerHTML = `${gameState.loginStreak} <span class="streak-unit-font">Day${gameState.loginStreak === 1 ? '' : 's'}</span>`;

        const nextRewardIndex = (gameState.loginStreak) % dailyRewards.length;
        const rewardInfo = dailyRewards[nextRewardIndex];
        let rewardText = '';

        if (rewardInfo.type === 'dust') {
            // This creates the HTML for a blue number and the image icon
            rewardText = `<span class="dust-amount-color">${formatWithCommas(rewardInfo.amount)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
        } else {
            rewardText = rewardInfo.label; // Other rewards stay as text
        }

        // We MUST use .innerHTML now to display the image
        nextRewardValue.innerHTML = rewardText;
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

        // Fixed base reward (you can tune this easily)
        const baseReward = 1000;

        if (prizeRoll < 0.01) {
            // 🎇 EPIC GEODE!
            rarity = "EPIC GEODE!";
            rarityClass = 'epic';
            reward = baseReward * 500; // 500k dust
            rewardText = `+ ${formatNumber(reward)} Dust & 💠 1 Gem Shard!`;
            gameState.gemShards += 1;
            gameState.dust += reward;

        } else if (prizeRoll < 0.05) {
            // 💎 Rare Geode!
            rarity = "Rare Geode!";
            rarityClass = 'rare';
            reward = baseReward * 50; // 50k dust
            rewardText = `+ ${formatNumber(reward)} Dust!`;
            gameState.dust += reward;

        } else if (prizeRoll < 0.20) {
            // 🟣 Uncommon Geode!
            rarity = "Uncommon Geode!";
            rarityClass = 'uncommon';
            reward = baseReward * 10; // 10k dust
            rewardText = `+ ${formatNumber(reward)} Dust!`;
            gameState.dust += reward;

        } else {
            // ⚪ Common Geode
            rarity = "Common Geode";
            rarityClass = 'common';
            reward = baseReward * 3; // 3k dust
            rewardText = `+ ${formatNumber(reward)} Dust!`;
            gameState.dust += reward;
        }

        // ✨ Visual feedback
        const geodeMessage = document.createElement('div');
        geodeMessage.className = `geode-effect ${rarityClass}`;
        geodeMessage.innerHTML = `${rarity}<br>${rewardText}`;
        document.body.appendChild(geodeMessage);

        setTimeout(() => {
            geodeMessage.remove();
        }, 3000);

        // 🔔 Feedback
        tg?.HapticFeedback?.notificationOccurred('success');
    }

    function startFrenzyMode() {
        if (gameState.isFrenzyMode || Date.now() < gameState.frenzyCooldownUntil) return;

        golemEgg.classList.add('egg-frenzy');
        gameState.isFrenzyMode = true;
        frenzyAccumulatedDust = 0;

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
        frenzyTimerContainer.classList.add('hidden');
        gameState.isFrenzyMode = false;
        gameState.frenzyCooldownUntil = Date.now() + 120000; // 2-minute cooldown
        if (frenzyAccumulatedDust > 0) {
            const iconHtml = `<img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Dust">`;
            temporaryMessage.innerHTML = `You got ${formatWithCommas(frenzyAccumulatedDust)} ${iconHtml}`;

            // 1. Make it visible and fade it IN
            temporaryMessage.classList.remove('hidden'); // Removes display:none
            temporaryMessage.classList.add('show');     // Fades opacity to 1

            // 2. Set a timer to fade it OUT after 2.7s
            setTimeout(() => {
                temporaryMessage.classList.remove('show'); // Fades opacity to 0
            }, 2700); // 2.7 seconds

            // 3. Set a final timer to HIDE it after 3s total
            setTimeout(() => {
                temporaryMessage.classList.add('hidden'); // Sets display:none
            }, 3000); // 3 seconds
        }
        particleSystem.mode = "normal";
        startParticleLoop(particleSystem.baseRate);
        updateUI();
    }

    // --- EVENT LISTENERS ---
    golemEgg.addEventListener('click', () => {
        clearTimeout(saveTimer); // Clear any existing save timer
        saveTimer = setTimeout(saveGame, 3000); // Set a new 3-second timer
        const now = Date.now();
        const COOLDOWN_DURATION = 100; // 1000ms / 5 taps per second = 200ms

        // Check if enough time has passed since the last successful tap.
        if (now - gameState.lastTapTimestamp < COOLDOWN_DURATION) {
            return; // If not, ignore this tap and do nothing else.
        }
        // If the tap is allowed, update the timestamp to the current time.
        gameState.lastTapTimestamp = now;
        // ✨ --- NEW GUARD CLAUSE --- ✨
        // If the egg is ready to hatch, stop all tap actions immediately.
        if (gameState.egg.progress >= gameState.egg.goal) {
            return; // Do nothing.
        }
        let dustEarned = gameState.dustPerTap;
        let isCritical = false;

        // --- FRENZY / CRITICAL / GEODE EVENTS ---
        if (gameState.isFrenzyMode) {
            isCritical = true;
            dustEarned *= 2;
            frenzyAccumulatedDust += dustEarned;
        } else {
            // 0.5% chance to trigger frenzy mode
            if (Date.now() > gameState.frenzyCooldownUntil && Math.random() < 0.005) {
                startFrenzyMode();
                return;
            }
            // small chance to spawn a geode
            if (Math.random() < getGeodeChance()) {
                handleGeodeEvent();
                return;
            }
            // 10% chance of critical tap (double dust + wobble)
            if (Math.random() < 0.10) {
                isCritical = true;
                dustEarned *= 2;
                golemEgg.classList.add('egg-wobble');
                setTimeout(() => golemEgg.classList.remove('egg-wobble'), 500);
            }
        }

        // --- MINI-SLOT TRIGGER WITH TAP COOLDOWN ---
        if (!slotActive && !gameState.isFrenzyMode) {
            gameState.tapsSinceLastSpin = (gameState.tapsSinceLastSpin || 0) + 1;
            const SPIN_BASE_CHANCE = 0.02; // 2% base chance per eligible tap sequence
            const roll = Math.random();
            if (gameState.tapsSinceLastSpin >= MIN_TAPS_BETWEEN_SPINS && roll < SPIN_BASE_CHANCE) {
                gameState.tapsSinceLastSpin = 0;
                spawnTreasureBox();
            }
        }

        // --- MAIN GAMEPLAY: EGG LEVEL PROGRESSION ---
        // The 'dustEarned' variable already has the correct value,
        // whether it's a normal, critical, or frenzy tap.
        // So we use it for everything.

        // --- Progress and rewards ---
        if (gameState.egg.progress < gameState.egg.goal) {
            gameState.egg.progress += dustEarned; // Use the correct value
            if (gameState.egg.progress > gameState.egg.goal) {
                gameState.egg.progress = gameState.egg.goal;
            }
            // Gain dust equal to the correct value
            gameState.dust += dustEarned;
            updateUI();
        }

        // --- HAPTIC FEEDBACK ---
        if (isCritical) {
            tg.HapticFeedback.notificationOccurred('warning');
        } else {
            tg.HapticFeedback.impactOccurred('light');
        }

        // --- TAP EFFECT VISUAL ---
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.innerText = `+${formatNumber(dustEarned)}`;
        if (isCritical) effect.classList.add('critical');
        effect.style.left = `${Math.random() * 60 + 20}%`;
        clickEffectContainer.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    });

    // New, more reliable save event for mobile devices
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame();
        }
    });

    // --- New: Press and Hold to Hatch Logic ---

    function startHatchHold() {
        // Only start the timer if the egg is actually ready to hatch
        if (gameState.egg.progress >= gameState.egg.goal) {
            // After 5 seconds (5000 milliseconds), call the hatchEgg function
            hatchHoldTimer = setTimeout(hatchEgg, 5000);
        }
    }

    function cancelHatchHold() {
        // If the player lets go, clear the timer to prevent hatching
        clearTimeout(hatchHoldTimer);
    }

    // Add listeners for both mouse and touch screens
    golemEgg.addEventListener('mousedown', startHatchHold);
    golemEgg.addEventListener('mouseup', cancelHatchHold);
    golemEgg.addEventListener('mouseleave', cancelHatchHold); // Also cancel if mouse leaves the egg

    golemEgg.addEventListener('touchstart', startHatchHold);
    golemEgg.addEventListener('touchend', cancelHatchHold);

    // Prevent the context menu on all images
    document.querySelectorAll('img').forEach(image => {
        image.addEventListener('contextmenu', event => event.preventDefault());
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
        updateCalendarModal();
        calendarModal.classList.remove('hidden');
    });
    closeCalendarButton.addEventListener('click', () => {
        calendarModal.classList.add('closing');
        setTimeout(() => {
            calendarModal.classList.add('hidden');
            calendarModal.classList.remove('closing');
        }, 300);
    });
    buyChiselButton.addEventListener('click', () => {
        if (gameState.chiselLevel >= 10) return; // reduced max to 10
        const cost = getChiselCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.chiselLevel++;
            gameState.dustPerTap = gameState.chiselLevel; // keep synced with chisel level
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
            // ✨ NEW: Start the first cooldown cycle if this is the first drone
            if (gameState.droneLevel === 1) {
                gameState.droneCooldownEndTimestamp = Date.now() + (gameState.batteryCapacity * 1000);
            }
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
            // ✨ NEW: Reset the cooldown with the new, longer duration
            gameState.droneCooldownEndTimestamp = Date.now() + (gameState.batteryCapacity * 1000);
            updateUI();
            tg.HapticFeedback.notificationOccurred('success');
        }
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
        const win = (
            slotSymbols[r1].name === slotSymbols[r2].name &&
            slotSymbols[r2].name === slotSymbols[r3].name
        );

        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred(win ? 'success' : 'warning');
        }

        let rewardDisplayHtml = '';

        if (win) {
            const winningSymbolName = slotSymbols[r1].name;

            if (winningSymbolName === 'crystaldust') {
                // 🔹 Fixed Crystal Dust reward
                const dustReward = 30000;
                gameState.dust += dustReward;
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;

            } else if (winningSymbolName === 'geode') {
                // 🔹 Geode win gives dust + geodes
                const dustReward = 100000;
                const rareGeodesWon = 3;
                gameState.dust += dustReward;
                gameState.geodesFoundToday = (gameState.geodesFoundToday || 0) + rareGeodesWon;
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;

            } else if (winningSymbolName === 'gem') {
                // 🔹 Gem win gives gem shards
                const gemReward = 5;
                gameState.gemShards += gemReward;
                rewardDisplayHtml = `${gemReward} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/gem.png?raw=true" class="slot-icon-small">`;
            }

            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";

        } else {
            // ❌ Lose case
            let dustReward = 5000;
            gameState.dust += dustReward;
            const rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;
            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";
        }

        // Show result
        slotResult.classList.remove("hidden");
        slotResult.classList.add("show");

        // Allow click to close slot overlay
        slotOverlay.addEventListener("click", () => {
            closeSlot();
        }, { once: true });
    }

    function hatchEgg() {
        const currentLevelIndex = gameState.egg.level - 1;
        const config = DEFAULT_EGG_LEVELS[currentLevelIndex] || DEFAULT_EGG_LEVELS[DEFAULT_EGG_LEVELS.length - 1];

        // Give dust reward
        gameState.dust += config.rewardDust;

        // Level up
        if (gameState.egg.level < 10) {
            gameState.egg.level++;
        } else {
            // Loop at level 10 forever
            gameState.egg.level = 10;
        }

        // Reset progress to 0 and update new goal
        const newConfig = DEFAULT_EGG_LEVELS[Math.min(gameState.egg.level - 1, DEFAULT_EGG_LEVELS.length - 1)];
        gameState.egg.progress = 0;
        gameState.egg.goal = newConfig.tapsRequired;

        // UI feedback
        // --- Show Level-Up Reward Popup ---
        const levelupPopup = document.getElementById('levelup-popup');
        levelupPopup.innerHTML = `
  <div class="levelup-title">🌟 Level Up! 🌟</div>
  <div class="levelup-reward">
    +${formatWithCommas(config.rewardDust)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon">
  </div>
`;
        levelupPopup.classList.remove('hidden');
        levelupPopup.classList.add('show');

        // Hide after 2.5s
        setTimeout(() => {
            levelupPopup.classList.remove('show');
            setTimeout(() => levelupPopup.classList.add('hidden'), 600);
        }, 2500);
        tg.HapticFeedback.notificationOccurred('success');
        document.getElementById('hatch-overlay').classList.add('hidden');

        saveGame();
    }

    // This is the existing block for the "Welcome Back" modal
    offlineProgressModal.addEventListener('click', (event) => {
        offlineProgressModal.classList.add('closing');
        setTimeout(() => {
            offlineProgressModal.classList.add('hidden');
            offlineProgressModal.classList.remove('closing');
        }, 300);
    });

    // ADD THE NEW CODE FOR THE DAILY LOGIN MODAL RIGHT HERE
    loginRewardModal.addEventListener('click', (event) => {
        loginRewardModal.classList.add('closing');
        setTimeout(() => {
            loginRewardModal.classList.add('hidden');
            loginRewardModal.classList.remove('closing');
        }, 300);
    });

    // --- New Drone Claim Event Listener ---
    const batteryDisplayContainer = batteryStatus.parentElement;
    batteryDisplayContainer.addEventListener('click', () => {
        // 1. First, check if the player even owns a drone.
        if (gameState.droneLevel === 0) return;

        // 2. Then, check if the cooldown is actually finished.
        const now = Date.now();
        if (now < gameState.droneCooldownEndTimestamp) {
            // Optional: Give feedback that it's not ready yet.
            console.log("Drone reward is not ready yet.");
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        // 3. Calculate the reward. It's the drone's power multiplied by the full cooldown duration.
        const dustEarned = gameState.dustPerSecond * gameState.batteryCapacity;
        gameState.dust += dustEarned;

        // 4. Give the player satisfying feedback!
        tg.HapticFeedback.notificationOccurred('success');

        // Get the exact position of the dust counter on the screen
        const dustCounterRect = dustCounter.getBoundingClientRect();

        const effect = document.createElement('div');
        effect.className = 'drone-claim-effect'; // Use our new, specific class
        effect.innerText = `+${formatNumber(dustEarned)}`;
        effect.style.left = `${dustCounterRect.left + dustCounterRect.width / 2}px`;
        effect.style.top = `${dustCounterRect.top + dustCounterRect.height / 2}px`;
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 4000);


        // 5. IMPORTANT: Reset the cooldown for the next cycle.
        gameState.droneCooldownEndTimestamp = now + (gameState.batteryCapacity * 1000);

        // 6. Instantly update the UI to show the new timer.
        updateUI();
    });

    // --- INITIALIZE GAME ---

    loadGame((isNewPlayer) => {
        // This is all your old code, just moved inside
        if (typeof gameState.tapsSinceLastSpin !== 'number') {
            gameState.tapsSinceLastSpin = MIN_TAPS_BETWEEN_SPINS;
        }
        if (isNewPlayer) {
            saveGame(); // Save the new game to the cloud
        }

        handleDailyLogin();
        updateUI();
        setInterval(gameLoop, 1000);
        setInterval(saveGame, 5000);
        // We keep the idle save timer we made
        window.addEventListener('beforeunload', saveGame);
        particleSpawnInterval = setInterval(spawnParticle, 500);

        console.log("Game initialized.");
    });
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

            // 💎 Add gems
            case 'g':
                console.log('[DEV] +10 Gems');
                gameState.gems = (gameState.gems || 0) + 10;
                updateUI?.();
                break;

            // ✨ Add crystal dust
            case 'c':
                console.log('[DEV] +1000 Crystal Dust');
                gameState.dust = (gameState.dust || 0) + 1000;
                updateUI?.();
                break;

            // 🧰 Spawn treasure box manually
            case 't':
                console.log('[DEV] Spawning treasure box manually...');
                spawnTreasureBox();
                gameState.tapsSinceLastSpin = 0;
                break;

            // 📅 Force daily login    
            case 'l':
                console.log('[DEV] Forcing Daily Login...');
                // Temporarily reset the last login date to trigger the function
                gameState.lastLoginDate = null;
                handleDailyLogin();
                saveGame(); // Optional: save the new login state
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