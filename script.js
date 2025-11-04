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
    try {
        const gameBackgroundColor = '#1a1a1a';
        if (tg.setHeaderColor) {
            tg.setHeaderColor(gameBackgroundColor);
        }
        if (tg.setBackgroundColor) {
            tg.setBackgroundColor(gameBackgroundColor);
        }
    } catch (e) {
        console.error("Failed to set native Telegram colors:", e);
    }
    try {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            if (typeof tg.requestFullscreen === 'function') {
                tg.requestFullscreen();
            }
            if (typeof tg.enableClosingConfirmation === 'function') {
                tg.enableClosingConfirmation();
            }
            if (tg.initDataUnsafe.user.first_name) {
                const playerNameElement = document.getElementById('player-name');
                if (playerNameElement) {
                    playerNameElement.innerText = tg.initDataUnsafe.user.first_name;
                }
            }
            if (tg.initDataUnsafe.user.photo_url) {
                const avatarFrame = document.querySelector('.avatar-frame');
                if (avatarFrame) {
                    avatarFrame.style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
                }
            }
        }
    } catch (error) {
        console.error("Failed to load user info:", error);
    }

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const gemShardsCounter = document.getElementById('gem-shards-counter');
    const batteryStatus = document.getElementById('battery-status');
    const golemEgg = document.getElementById('golem-egg');
    const hatchProgressValue = document.getElementById('hatch-progress-value');
    const eggLevelValue = document.getElementById('egg-level-value');
    const levelUpContainer = document.getElementById('level-up-container');
    const levelUpButton = document.getElementById('level-up-button');
    const levelUpCostText = document.getElementById('level-up-cost');
    const clickEffectContainer = document.getElementById('click-effect-container');
    const frenzyTimerContainer = document.getElementById('frenzy-timer-container');
    const frenzyTimer = document.getElementById('frenzy-timer');
    const upgradeButton = document.getElementById('upgrade-button');
    const upgradeModal = document.getElementById('upgrade-modal');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const scrollCalendarButton = document.getElementById('scroll-calendar-button');
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

    let isGameDirty = false; //
    let slotActive = false;
    let frenzyAccumulatedDust = 0;
    let activeTreasureBox = null;
    let activeGeodeBox = null;
    const MIN_TAPS_BETWEEN_SPINS = 150;
    const MIN_TAPS_BETWEEN_GEODES = 120;
    const DUST_FEE_GROWTH_RATE = 1.003;

    const EGG_NAMES = [
        "Default Egg", "Copper Egg", "Iron Egg", "Silver Egg", "Golden Egg",
        "Obsidian Egg", "Sapphire Egg", "Emerald Egg", "Ruby Egg", "Diamond Egg"
    ];

    const EGG_TIERS = {
        "Default Egg": { maxLevel: 10, baseTaps: 100, tapsPerLevel: 25, baseCost: 100 },
        "Copper Egg": { maxLevel: 20, baseTaps: 500, tapsPerLevel: 50, baseCost: 1000 },
        "Iron Egg": { maxLevel: 30, baseTaps: 1500, tapsPerLevel: 100, baseCost: 5000 },
        "Silver Egg": { maxLevel: 40, baseTaps: 4500, tapsPerLevel: 200, baseCost: 25000 },
        "Golden Egg": { maxLevel: 50, baseTaps: 12500, tapsPerLevel: 300, baseCost: 125000 },
        "Obsidian Egg": { maxLevel: 60, baseTaps: 27500, tapsPerLevel: 450, baseCost: 625000 },
        "Sapphire Egg": { maxLevel: 70, baseTaps: 55000, tapsPerLevel: 650, baseCost: 3125000 },
        "Emerald Egg": { maxLevel: 80, baseTaps: 100000, tapsPerLevel: 900, baseCost: 15625000 },
        "Ruby Egg": { maxLevel: 90, baseTaps: 175000, tapsPerLevel: 1200, baseCost: 78125000 },
        "Diamond Egg": { maxLevel: 100, baseTaps: 300000, tapsPerLevel: 1500, baseCost: 390625000 }
    };

    // --- NEW: EGG IMAGE MAPPING ---
    const EGG_IMAGES = {
        "Default Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/1defaultegg.png?raw=true",
        "Copper Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/2copperegg.png?raw=true",
        "Iron Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/3ironegg.png?raw=true",
        "Silver Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/4silveregg.png?raw=true",
        "Golden Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/5goldenegg.png?raw=true",
        "Obsidian Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/6obisidianegg.png?raw=true",
        "Sapphire Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/7sapphireegg.png?raw=true",
        "Emerald Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/8emeraldegg.png?raw=true",
        "Ruby Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/9rubyegg.png?raw=true",
        "Diamond Egg": "https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/10diamondegg.png?raw=true"
    };

    // --- GAME STATE ---
    let gameState = {
        dust: 0,
        dustPerTap: 1,
        chiselLevel: 1,
        chiselBaseCost: 100,
        egg: {
            name: "Default Egg",
            level: 1,
            progress: 0,
            goal: 100
        },
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
        tapsSinceLastGeode: 0,
        lastTapTimestamp: 0
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
        { type: 'dust', amount: 5000 },
        { type: 'dust', amount: 10000 },
        { type: 'dust', amount: 15000 },
        { type: 'dust', amount: 20000 },
        { type: 'dust', amount: 25000 },
        { type: 'dust', amount: 30000 },
        { type: 'gem_shard', amount: 1, label: '1 Gem Shard' }, // Milestone Day 7

        // Week 2
        { type: 'dust', amount: 35000 },
        { type: 'dust', amount: 40000 },
        { type: 'dust', amount: 45000 },
        { type: 'dust', amount: 50000 },
        { type: 'dust', amount: 55000 },
        { type: 'dust', amount: 60000 },
        { type: 'gem_shard', amount: 2, label: '2 Gem Shards' }, // Milestone Day 14

        // Week 3
        { type: 'dust', amount: 65000 },
        { type: 'dust', amount: 70000 },
        { type: 'dust', amount: 75000 },
        { type: 'dust', amount: 80000 },
        { type: 'dust', amount: 85000 },
        { type: 'dust', amount: 90000 },
        { type: 'gem_shard', amount: 3, label: '3 Gem Shards' }, // Milestone Day 21

        // Week 4
        { type: 'dust', amount: 95000 },
        { type: 'dust', amount: 100000 },
        { type: 'dust', amount: 120000 },
        { type: 'dust', amount: 150000 },
        { type: 'dust', amount: 300000 },
        { type: 'dust', amount: 500000 },
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
            dl: state.droneLevel,
            gs: state.gemShards,
            el: state.egg.level,
            ep: state.egg.progress,
            bl: state.batteryLevel
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

    function removeGeodeBox() {
        if (!activeGeodeBox) return;
        try {
            if (activeGeodeBox._geoClickHandler) {
                activeGeodeBox.removeEventListener('click', activeGeodeBox._geoClickHandler);
            }
        } catch (e) {
        }
        activeGeodeBox.remove();
        activeGeodeBox = null;
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

    function spawnGeode() {
        if (activeGeodeBox || slotActive || gameState.isFrenzyMode) return;
        if (isAnyModalOpen()) return;
        const container = document.querySelector('.game-container');
        if (!container) return;
        const box = document.createElement('div');
        box.className = 'geode-box';
        const inner = document.createElement('div');
        inner.className = 'geode-box-inner';
        const img = document.createElement('img');
        img.src = 'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/geode.png?raw=true';
        img.alt = 'Geode';
        inner.appendChild(img);
        box.appendChild(inner);
        const clickHandler = (e) => {
            e.stopPropagation();
            removeGeodeBox();
            handleGeodeEvent();
        };
        box._geoClickHandler = clickHandler;
        box.addEventListener('click', clickHandler, { passive: true });
        container.appendChild(box);
        activeGeodeBox = box;
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
            const currentSave = localStorage.getItem('golemEggGameState');
            if (currentSave) {
                localStorage.setItem('golemEggGameState_previous', currentSave);
            }

            gameState.lastSavedTimestamp = Date.now();
            gameState.checksum = generateChecksum(gameState);
            const saveString = JSON.stringify(gameState);
            if (tg && tg.CloudStorage && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                tg.CloudStorage.setItem('golemEggGameState', saveString, (err) => {
                    if (err) {
                        console.error("Cloud save failed:", err);
                        localStorage.setItem('golemEggGameState', saveString);
                    } else {
                    }
                });
            } else {
                localStorage.setItem('golemEggGameState', saveString);
            }

        } catch (error) {
            console.error("Failed to save game:", error);
        }
    }

    // --- NEW: Helper function to set the egg image ---
    function setEggImage(eggName) {
        const url = EGG_IMAGES[eggName] || EGG_IMAGES["Default Egg"];
        golemEgg.style.backgroundImage = `url(${url})`;
    }

    // --- IMAGE PRELOADER FUNCTION --- 
    function preloadImages() {
        const imageUrls = [
            // Main UI & Background
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/background.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/1defaultegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/settingbutton.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/closebutton2.png?raw=true',

            // Icons
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust2.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust3.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/gem.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/battery.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/geode.png?raw=true',

            // Bottom Buttons
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/buttons2.png?raw=true',
            `https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/buttons5.png?raw=true`,

            // Scroll Menu Icons
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/calendaricon.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/rouletteicon.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/sloticon.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/fishingicon.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/tetrisicon.png?raw=true',

            // Modals & Frames
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/modalframe.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/modalframe2.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/upgradeinsideframe.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/buttons.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/welcome.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/dailylogin.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/welcomeback.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/calendar.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/dailystreak.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/shopitemframe.png?raw=true',

            // Settings Modal
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/connectwallet.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/achievement.png?raw=true',

            // Objects & Popups
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/treasurebox.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/buttons4.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/spintowin.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/minislotframe.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/levelupbutton.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/evolveicon.png?raw=true',

            // --- NEW EGG IMAGES FOR PRELOAD ---
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/1defaultegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/2copperegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/3ironegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/4silveregg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/5goldenegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/6obisidianegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/7sapphireegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/8emeraldegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/9rubyegg.png?raw=true',
            'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/10diamondegg.png?raw=true'
        ];

        console.log(`[Preloader] Starting to preload ${imageUrls.length} images...`);
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    function loadGame(onLoadComplete) {
        const tryLoadingState = (savedJSON) => {
            try {
                if (!savedJSON) return false;
                const savedState = JSON.parse(savedJSON);
                if (!savedState || !savedState.checksum || !savedState.egg) {
                    console.warn("Save file is missing critical data.");
                    return false;
                }
                const expectedChecksum = generateChecksum(savedState);
                if (savedState.checksum === expectedChecksum) {
                    gameState = Object.assign(gameState, savedState);
                    gameState.isFrenzyMode = false;
                    return true;
                }
                console.warn("Checksum mismatch. Save file is invalid.");
                return false;
            } catch (e) {
                console.error("Failed to parse or validate save file, it's corrupt:", e);
                return false;
            }
        };

        if (tg && tg.CloudStorage && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            tg.CloudStorage.getItem('golemEggGameState', (err, cloudSaveString) => {
                let isNew = true;
                if (err) {
                    console.warn("Cloud load failed, trying localStorage...", err);
                    isNew = !tryLoadingState(localStorage.getItem('golemEggGameState'));
                } else if (tryLoadingState(cloudSaveString)) {
                    isNew = false;
                    console.log("Game loaded from cloud.");
                } else {
                    console.warn("Cloud data corrupt, trying localStorage...");
                    isNew = !tryLoadingState(localStorage.getItem('golemEggGameState_previous'));
                }
                if (!isNew) {
                    const now = Date.now();
                    const timePassedInSeconds = Math.floor((now - gameState.lastSavedTimestamp) / 1000);
                    if (timePassedInSeconds > 300) {
                        offlineProgressModal.classList.remove('hidden');
                    }
                    gameState.dustPerTap = gameState.chiselLevel || 1;
                }
                onLoadComplete(isNew);
            });
        } else {
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
            onLoadComplete(isNew);
        }
    }

    function updateUI() {
        // --- 1. ALWAYS UPDATE TOP STATS ---
        dustCounter.innerText = formatNumber(gameState.dust);
        gemShardsCounter.innerText = formatNumber(gameState.gemShards);
        if (gameState.droneLevel === 0) {
            batteryStatus.innerText = '--:--';
            batteryStatus.classList.remove('claimable');
        } else {
            const now = Date.now();
            if (now >= gameState.droneCooldownEndTimestamp) {
                batteryStatus.innerText = 'Claim';
                batteryStatus.classList.add('claimable');
            } else {
                const timeLeftInSeconds = Math.ceil((gameState.droneCooldownEndTimestamp - now) / 1000);
                batteryStatus.innerText = formatCooldownTime(timeLeftInSeconds);
                batteryStatus.classList.remove('claimable');
            }
        }

        // --- 3. UPDATE EGG LEVEL DISPLAY ---
        const config = getCurrentEggConfig();
        gameState.egg.goal = getTapGoal();
        const displayProgress = Math.min(gameState.egg.progress, gameState.egg.goal);
        if (hatchProgressValue) {
            hatchProgressValue.innerText = `${formatWithCommas(displayProgress)} / ${formatWithCommas(gameState.egg.goal)}`;
        }
        if (eggLevelValue) {
            eggLevelValue.innerText = `Lv. ${gameState.egg.level} / ${config.maxLevel}`;
        }
        levelUpContainer.classList.add('hidden');
        if (!gameState.isFrenzyMode) {
            golemEgg.classList.remove('egg-frenzy');
        }
        const isProgressBarFull = gameState.egg.progress >= gameState.egg.goal;
        const isAtMaxLevelForCurrentEgg = gameState.egg.level >= config.maxLevel;
        const currentEggIndex = EGG_NAMES.indexOf(gameState.egg.name);
        const isLastEgg = currentEggIndex >= EGG_NAMES.length - 1;
        if (isAtMaxLevelForCurrentEgg && isLastEgg && isProgressBarFull) {
            levelUpContainer.classList.remove('hidden');
            const mainButtonTextElement = levelUpButton.querySelector('.level-up-text');
            if (mainButtonTextElement) mainButtonTextElement.innerText = "Max Level";
            levelUpCostText.innerText = "";
            levelUpButton.disabled = true;
            golemEgg.classList.remove('egg-frenzy');
        } else if (isProgressBarFull) {
            levelUpContainer.classList.remove('hidden');
            golemEgg.classList.add('egg-frenzy');
            const mainButtonTextElement = levelUpButton.querySelector('.level-up-text');
            if (isAtMaxLevelForCurrentEgg && !isLastEgg) {
                if (mainButtonTextElement) mainButtonTextElement.innerText = "EVOLVE!";
            } else {
                if (mainButtonTextElement) mainButtonTextElement.innerText = "LEVEL UP!";
            }
            const cost = getDustFee();
            levelUpCostText.innerHTML = `
            ${formatNumber(cost)}
            <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Dust">
        `;
            levelUpButton.disabled = gameState.dust < cost;
        }

        // --- 5. UPDATE UPGRADE SHOP ---
        const chiselNextEffect = document.getElementById('chisel-next-effect');
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = `+${formatWithCommas(gameState.dustPerTap)}`;
        if (gameState.chiselLevel >= 10) {
            buyChiselButton.innerText = "Max Level";
            buyChiselButton.disabled = true;
            if (chiselNextEffect && chiselNextEffect.parentElement) {
                chiselNextEffect.parentElement.style.display = 'none';
            }
        } else {
            const cost = getChiselCost();
            const nextChiselLevelEffect = gameState.dustPerTap + 1;
            if (chiselNextEffect) {
                chiselNextEffect.innerText = `+${formatWithCommas(nextChiselLevelEffect)} Dust/Tap`;
                if (chiselNextEffect.parentElement) {
                    chiselNextEffect.parentElement.style.display = 'block';
                }
            }
            buyChiselButton.innerHTML = `Upgrade <span class="dust-amount-color">${formatNumber(cost)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
            buyChiselButton.disabled = gameState.dust < cost;
        }
        const droneNextEffect = document.getElementById('drone-next-effect');
        droneLevelText.innerText = gameState.droneLevel;
        droneEffectText.innerText = `+${formatNumber(gameState.dustPerSecond)}`;
        if (gameState.droneLevel >= 10) {
            buyDroneButton.innerText = "Max Level";
            buyDroneButton.disabled = true;
            if (droneNextEffect && droneNextEffect.parentElement) {
                droneNextEffect.parentElement.style.display = 'none';
            }
        } else {
            const cost = getDroneCost();
            const nextEffect = gameState.dustPerSecond + 1;
            if (droneNextEffect) {
                droneNextEffect.innerText = `+${formatNumber(nextEffect)} Dust/Sec`;
                if (droneNextEffect.parentElement) {
                    droneNextEffect.parentElement.style.display = 'block';
                }
            }
            buyDroneButton.innerHTML = `Upgrade <span class="dust-amount-color">${formatNumber(cost)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
            buyDroneButton.disabled = gameState.dust < cost;
        }
        const batteryNextCapacity = document.getElementById('battery-next-capacity');
        batteryLevelText.innerText = gameState.batteryLevel;
        batteryCapacityText.innerText = `${Number(gameState.batteryCapacity / 3600).toFixed(1)} Hours`;
        if (gameState.droneLevel === 0) {
            buyBatteryButton.innerText = "Requires Drone";
            buyBatteryButton.disabled = true;
            if (batteryNextCapacity && batteryNextCapacity.parentElement) {
                batteryNextCapacity.parentElement.style.display = 'none';
            }
        } else if (gameState.batteryLevel >= batteryLevels.length) {
            buyBatteryButton.innerText = "Max Level";
            buyBatteryButton.disabled = true;
            if (batteryNextCapacity && batteryNextCapacity.parentElement) {
                batteryNextCapacity.parentElement.style.display = 'none';
            }
        } else {
            const cost = getBatteryCost();
            const nextCapacitySeconds = batteryLevels[gameState.batteryLevel];
            const nextCapacityText = `${Number(nextCapacitySeconds / 3600).toFixed(1)} Hours`;
            if (batteryNextCapacity) {
                batteryNextCapacity.innerText = nextCapacityText;
                if (batteryNextCapacity.parentElement) {
                    batteryNextCapacity.parentElement.style.display = 'block';
                }
            }
            buyBatteryButton.innerHTML = `Upgrade <span class="dust-amount-color">${formatNumber(cost)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
            buyBatteryButton.disabled = gameState.dust < cost;
        }
    }

    function getChiselCost() { return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1)); }
    function getDroneCost() { return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel)); }
    function getBatteryCost() { return Math.floor(gameState.batteryBaseCost * Math.pow(2.2, gameState.batteryLevel - 1)); }
    function getCurrentEggConfig() {
        const eggName = gameState.egg?.name || "Default Egg";
        return EGG_TIERS[eggName] || EGG_TIERS["Default Egg"];
    }
    function getTapGoal() {
        const config = getCurrentEggConfig();
        const currentLevel = gameState.egg?.level || 1;
        const levelMultiplier = Math.max(0, currentLevel - 1);
        const tapGoal = config.baseTaps + (config.tapsPerLevel * levelMultiplier);
        return Math.floor(tapGoal);
    }
    function getDustFee() {
        const config = getCurrentEggConfig();
        const currentLevel = gameState.egg?.level || 1;
        if (currentLevel >= config.maxLevel) {
            const currentEggIndex = EGG_NAMES.indexOf(gameState.egg.name);
            const nextEggIndex = currentEggIndex + 1;
            if (nextEggIndex < EGG_NAMES.length) {
                const nextEggName = EGG_NAMES[nextEggIndex];
                const nextEggConfig = EGG_TIERS[nextEggName];
                return nextEggConfig.baseCost;
            }
        }
        const dustFee = config.baseCost * Math.pow(DUST_FEE_GROWTH_RATE, currentLevel);
        return Math.max(1, Math.floor(dustFee));
    }
    function gameLoop() {
        updateUI();
    }

    function handleDailyLogin() {
        const today = formatDate();
        if (gameState.lastLoginDate === today) return;
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
        loginStreakText.innerText = `Streak: ${gameState.loginStreak} Day(s)`;
        loginRewardText.innerHTML = rewardText;
        updateUI();
        loginRewardModal.classList.remove('hidden');
        tg.HapticFeedback.notificationOccurred('success');
    }
    function updateCalendarModal() {
        const streakCount = document.getElementById('calendar-streak-count');
        const nextRewardValue = document.getElementById('next-reward-value');
        streakCount.innerHTML = `${gameState.loginStreak} <span class="streak-unit-font">Day${gameState.loginStreak === 1 ? '' : 's'}</span>`;
        const nextRewardIndex = (gameState.loginStreak) % dailyRewards.length;
        const rewardInfo = dailyRewards[nextRewardIndex];
        let rewardText = '';
        if (rewardInfo.type === 'dust') {
            rewardText = `<span class="dust-amount-color">${formatWithCommas(rewardInfo.amount)}</span> <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Crystal Dust">`;
        } else {
            rewardText = rewardInfo.label;
        }
        nextRewardValue.innerHTML = rewardText;
    }
    function getGeodeChance() {
        return 0.03;
    }
    function handleGeodeEvent() {
        const prizeRoll = Math.random();
        let reward = 0;
        let rarity = '';
        let rarityClass = '';
        let rewardText = '';
        const baseReward = 1000;

        if (prizeRoll < 0.02) {
            // 🎇 EPIC GEODE!
            rarity = "EPIC GEODE!";
            rarityClass = 'epic';
            reward = baseReward * 500; // 500k dust
            rewardText = `+ ${formatNumber(reward)} Dust & 💠 3 Gem Shard!`;
            gameState.gemShards += 3;
            gameState.dust += reward;

        } else if (prizeRoll < 0.10) {
            // 💎 Rare Geode!
            rarity = "Rare Geode!";
            rarityClass = 'rare';
            reward = baseReward * 100;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
            gameState.dust += reward;

        } else if (prizeRoll < 0.20) {
            // 🟣 Uncommon Geode!
            rarity = "Uncommon Geode!";
            rarityClass = 'uncommon';
            reward = baseReward * 50;
            rewardText = `+ ${formatNumber(reward)} Dust!`;
            gameState.dust += reward;

        } else {
            // ⚪ Common Geode
            rarity = "Common Geode";
            rarityClass = 'common';
            reward = baseReward * 5; // 5k dust
            rewardText = `+ ${formatNumber(reward)} Dust!`;
            gameState.dust += reward;
        }

        const geodeMessage = document.createElement('div');
        geodeMessage.className = `geode-effect ${rarityClass}`;
        geodeMessage.innerHTML = `${rarity}<br>${rewardText}`;
        document.body.appendChild(geodeMessage);
        setTimeout(() => {
            geodeMessage.remove();
        }, 4000);
        updateUI();
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
        gameState.frenzyCooldownUntil = Date.now() + 180000;
        if (frenzyAccumulatedDust > 0) {
            const iconHtml = `<img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="inline-icon" alt="Dust">`;
            temporaryMessage.innerHTML = `Got ${formatWithCommas(frenzyAccumulatedDust)} ${iconHtml}`;
            temporaryMessage.classList.remove('hidden');
            temporaryMessage.classList.add('show');
            setTimeout(() => {
                temporaryMessage.classList.remove('show');
            }, 2700);
            setTimeout(() => {
                temporaryMessage.classList.add('hidden');
            }, 3000);
        }
        particleSystem.mode = "normal";
        startParticleLoop(particleSystem.baseRate);
        updateUI();
    }

    // --- EVENT LISTENERS ---
    levelUpButton.addEventListener('click', () => {
        const config = getCurrentEggConfig();
        const cost = getDustFee();
        let isEvolving = false;

        if (!gameState.egg || gameState.egg.level > config.maxLevel) {
            console.log("Cannot level up: Already at max level or egg state invalid.");
            return;
        }
        if (gameState.egg.progress < gameState.egg.goal) {
            console.log("Cannot level up: Progress bar not full.");
            return;
        }
        if (gameState.dust < cost) {
            tg.HapticFeedback.notificationOccurred('error');
            console.log("Cannot level up: Not enough dust.");
            return;
        }

        gameState.dust -= cost;
        gameState.egg.level++;
        gameState.egg.progress = 0;

        // --- PRESTIGE (UNLOCKING NEXT EGG) ---
        if (gameState.egg.level > config.maxLevel) {
            isEvolving = true;
            const currentEggIndex = EGG_NAMES.indexOf(gameState.egg.name);
            const nextEggIndex = currentEggIndex + 1;
            if (nextEggIndex < EGG_NAMES.length) {
                const newEggName = EGG_NAMES[nextEggIndex];
                console.log(`PRESTIGE! Unlocking ${newEggName}`);
                gameState.egg.name = newEggName;
                gameState.egg.level = 1;
                gameState.egg.progress = 0;
                setEggImage(newEggName);

                // --- APPLY THE +5 TAP POWER BONUS 
                gameState.dustPerTap = gameState.chiselLevel + (nextEggIndex * 5);
                tg.HapticFeedback.notificationOccurred('success');

            } else {
                console.log("Congratulations! Reached max level on the final egg!");
                gameState.egg.level = config.maxLevel;
                gameState.egg.progress = 0;
            }

        } else if (gameState.egg.level === config.maxLevel) {
            console.log(`Reached Max Level ${config.maxLevel} for ${gameState.egg.name}. Next level up will prestige.`);
            if (gameState.egg.progress !== 0) gameState.egg.progress = 0;
        }

        gameState.egg.goal = getTapGoal();

        // --- DYNAMIC POPUP IMAGE LOGIC ---
        const levelupPopup = document.getElementById('levelup-popup');
        const popupImage = levelupPopup.querySelector('img');

        if (isEvolving) {
            popupImage.src = 'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/evolveicon.png?raw=true';
            popupImage.alt = 'Evolve!';
        } else {
            popupImage.src = 'https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/levelupicon.png?raw=true';
            popupImage.alt = 'Level Up!';
        }
        // --- END OF DYNAMIC LOGIC ---

        levelupPopup.classList.remove('hidden');
        levelupPopup.classList.add('show');
        spawnFireworkParticles();
        setTimeout(() => {
            levelupPopup.classList.remove('show');
            setTimeout(() => levelupPopup.classList.add('hidden'), 600);
        }, 2500);

        tg.HapticFeedback.notificationOccurred('success');
        saveGame();
        updateUI();
        isGameDirty = true;
    });

    golemEgg.addEventListener('click', () => {
        let isOvercharge = false;
        const now = Date.now();
        const COOLDOWN_DURATION = 100;
        if (now - gameState.lastTapTimestamp < COOLDOWN_DURATION) {
            return;
        }
        gameState.lastTapTimestamp = now;
        let dustEarned = gameState.dustPerTap;
        let isCritical = false;

        // --- FRENZY / CRITICAL / GEODE EVENTS ---
        if (gameState.isFrenzyMode) {
            isCritical = true;
            dustEarned *= 2;
            frenzyAccumulatedDust += dustEarned;
        } else {
            if (Date.now() > gameState.frenzyCooldownUntil && Math.random() < 0.005 && gameState.egg.progress < gameState.egg.goal) {
                startFrenzyMode();
                return;
            }
            gameState.tapsSinceLastGeode = (gameState.tapsSinceLastGeode || 0) + 1;
            const geodeRoll = Math.random();
            if (gameState.tapsSinceLastGeode >= MIN_TAPS_BETWEEN_GEODES && geodeRoll < getGeodeChance()) {
                gameState.tapsSinceLastGeode = 0;
                spawnGeode();
                return;
            }
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
            const SPIN_BASE_CHANCE = 0.02;
            const roll = Math.random();
            if (gameState.tapsSinceLastSpin >= MIN_TAPS_BETWEEN_SPINS && roll < SPIN_BASE_CHANCE) {
                gameState.tapsSinceLastSpin = 0;
                spawnTreasureBox();
            }
        }

        if (!gameState.isFrenzyMode && gameState.egg.progress >= gameState.egg.goal) {
            isOvercharge = true;
            dustEarned *= 0.25;
        }

        // --- MAIN GAMEPLAY: EGG LEVEL PROGRESSION (NEW HYBRID MODEL) ---
        gameState.dust += dustEarned;
        if (gameState.egg && gameState.egg.progress < gameState.egg.goal) {
            const tapPower = gameState.dustPerTap || 1;
            gameState.egg.progress += tapPower;
            if (gameState.egg.progress > gameState.egg.goal) {
                gameState.egg.progress = gameState.egg.goal;
            }
        }

        updateUI();
        isGameDirty = true;
        if (isCritical) {
            tg.HapticFeedback.notificationOccurred('warning');
        } else {
            tg.HapticFeedback.impactOccurred('light');
        }
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.innerText = `+${formatNumber(dustEarned)}`;
        if (isCritical) effect.classList.add('critical');
        if (isOvercharge) {
            effect.classList.add('overcharge');
        }
        effect.style.left = `${Math.random() * 60 + 20}%`;
        clickEffectContainer.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGame();
        }
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

    upgradeButton.addEventListener('click', () => {
        updateUI();
        upgradeModal.classList.remove('hidden');
    });
    closeUpgradeButton.addEventListener('click', () => {
        upgradeModal.classList.add('closing');
        setTimeout(() => {
            upgradeModal.classList.add('hidden');
            upgradeModal.classList.remove('closing');
        }, 300);
    });
    if (scrollCalendarButton) {
        scrollCalendarButton.addEventListener('click', () => {
            updateCalendarModal();
            calendarModal.classList.remove('hidden');
        });
    }
    closeCalendarButton.addEventListener('click', () => {
        calendarModal.classList.add('closing');
        setTimeout(() => {
            calendarModal.classList.add('hidden');
            calendarModal.classList.remove('closing');
        }, 300);
    });
    buyChiselButton.addEventListener('click', () => {
        if (gameState.chiselLevel >= 10) return;
        const cost = getChiselCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.chiselLevel++;
            const currentEggIndex = EGG_NAMES.indexOf(gameState.egg.name);
            gameState.dustPerTap = gameState.chiselLevel + (currentEggIndex * 5);
            updateUI();
            isGameDirty = true;
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
            if (gameState.droneLevel === 1) {
                gameState.droneCooldownEndTimestamp = Date.now() + (gameState.batteryCapacity * 1000);
            }
            updateUI();
            isGameDirty = true;
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
            gameState.droneCooldownEndTimestamp = Date.now() + (gameState.batteryCapacity * 1000);
            updateUI();
            isGameDirty = true;
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

    function spawnFireworkParticles() {
        const popupElement = document.getElementById('levelup-popup');
        const container = document.querySelector('.egg-image-wrapper');
        if (!popupElement || !container) return;
        const particleCount = 15;
        const containerRect = container.getBoundingClientRect();
        const popupRect = popupElement.getBoundingClientRect();
        const startXBase = popupRect.left - containerRect.left + (popupRect.width / 2);
        const startYBase = popupRect.top - containerRect.top + (popupRect.height * 0.8);
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            const startX = startXBase + (Math.random() - 0.5) * 30;
            const startY = startYBase + (Math.random() - 0.5) * 20;
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            const angle = (Math.random() - 0.5) * (Math.PI / 2);
            const travelDistance = 150 + Math.random() * 60;
            const endX = Math.sin(angle) * travelDistance;
            const endY = -Math.cos(angle) * travelDistance;
            const duration = 1.2 + Math.random() * 0.6;
            const delay = Math.random() * 0.2;
            particle.style.setProperty('--firework-x', `${endX}px`);
            particle.style.setProperty('--firework-y', `${endY}px`);
            particle.style.animation = `firework-shoot ${duration}s ease-out ${delay}s forwards`;
            container.appendChild(particle);
            setTimeout(() => {
                particle.remove();
            }, (duration + delay) * 1000 + 100);
        }
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
                const dustReward = 50000;
                gameState.dust += dustReward;
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;
            } else if (winningSymbolName === 'geode') {
                const dustReward = 100000;
                gameState.dust += dustReward;
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;
            } else if (winningSymbolName === 'gem') {
                const gemReward = 5;
                gameState.gemShards += gemReward;
                rewardDisplayHtml = `${gemReward} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/gem.png?raw=true" class="slot-icon-small">`;
            }
            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";
        } else {
            let dustReward = 10000;
            gameState.dust += dustReward;
            const rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="https://github.com/mcleemon/Aj28ahjsdbguueasnc/blob/main/images/crystaldust.png?raw=true" class="slot-icon-small">`;
            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";
        }
        updateUI();
        isGameDirty = true;
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

    loginRewardModal.addEventListener('click', (event) => {
        loginRewardModal.classList.add('closing');
        setTimeout(() => {
            loginRewardModal.classList.add('hidden');
            loginRewardModal.classList.remove('closing');
        }, 300);
    });

    const batteryDisplayContainer = batteryStatus.parentElement;
    batteryDisplayContainer.addEventListener('click', () => {
        if (gameState.droneLevel === 0) return;
        const now = Date.now();
        if (now < gameState.droneCooldownEndTimestamp) {
            console.log("Drone reward is not ready yet.");
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        const dustEarned = gameState.dustPerSecond * gameState.batteryCapacity;
        gameState.dust += dustEarned;
        tg.HapticFeedback.notificationOccurred('success');
        const dustCounterRect = dustCounter.getBoundingClientRect();
        const effect = document.createElement('div');
        effect.className = 'drone-claim-effect';
        effect.innerText = `+${formatNumber(dustEarned)}`;
        effect.style.left = `${dustCounterRect.left + dustCounterRect.width / 2}px`;
        effect.style.top = `${dustCounterRect.top + dustCounterRect.height / 2}px`;
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 4000);
        gameState.droneCooldownEndTimestamp = now + (gameState.batteryCapacity * 1000);
        updateUI();
        isGameDirty = true;
    });

    // --- INITIALIZE GAME ---

    loadGame((isNewPlayer) => {
        if (typeof gameState.tapsSinceLastSpin !== 'number') {
            gameState.tapsSinceLastSpin = MIN_TAPS_BETWEEN_SPINS;
        }
        if (typeof gameState.tapsSinceLastGeode !== 'number') {
            gameState.tapsSinceLastGeode = MIN_TAPS_BETWEEN_GEODES;
        }
        if (!gameState.egg || typeof gameState.egg.level !== 'number') {
            gameState.egg = { name: "Default Egg", level: 1, progress: 0, goal: 100 };
        }
        const config = getCurrentEggConfig();
        if (gameState.egg.level > config.maxLevel) {
            gameState.egg.level = config.maxLevel;
            gameState.egg.progress = 0;
        }
        gameState.egg.goal = getTapGoal();
        if (gameState.egg.progress > gameState.egg.goal) {
            gameState.egg.progress = gameState.egg.goal;
        }
        if (isNewPlayer) {
            console.log("New player detected, starting fresh game state.");
            gameState.egg = {
                name: "Default Egg",
                level: 1,
                progress: 0,
                goal: getTapGoal()
            };
            saveGame();
        }

        setEggImage(gameState.egg.name);
        handleDailyLogin();
        updateUI();
        if (typeof tg.ready === 'function') {
            tg.ready();
        }
        setInterval(gameLoop, 1000);
        function saveGameIfDirty() {
            if (isGameDirty) {
                saveGame();
                isGameDirty = false;
            }
        }
        setInterval(saveGameIfDirty, 5000);
        window.addEventListener('beforeunload', saveGame);
        particleSpawnInterval = setInterval(spawnParticle, 500);

        console.log("Game initialized.");
        preloadImages();
    });

    // === DEVELOPER CHEATS ===
    window.addEventListener('keydown', (e) => {
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
                console.log('[DEV] +10 Gem Shards');
                gameState.gemShards = (gameState.gemShards || 0) + 10;
                updateUI();
                break;

            // ✨ Add crystal dust
            case 'c':
                console.log('[DEV] +1000 Crystal Dust');
                gameState.dust = (gameState.dust || 0) + 1000;
                updateUI();
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
                gameState.lastLoginDate = null;
                handleDailyLogin();
                saveGame();
                break;

            // 🔄 Reset all progress
            case 'r':
                console.log('[DEV] Soft reset requested...');
                console.log('[DEV] Resetting progress... (Bypassing confirm for testing)');
                try {
                    localStorage.clear();
                    console.log('[DEV] LocalStorage cleared.');
                    if (tg && tg.CloudStorage && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                        tg.CloudStorage.removeItem('golemEggGameState', (err, removed) => {
                            console.log('[DEV] Reloading page after cloud attempt...');
                            location.reload();
                        });
                    } else {
                        console.log('[DEV] Reloading page...');
                        location.reload();
                    }
                } catch (e) {
                    console.error('[DEV] Error during reset:', e);
                    location.reload();
                }
                break;
        }
    });
});