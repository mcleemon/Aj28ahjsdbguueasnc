import { GAME_ASSETS } from './assets.js';
import { HERO_STATE, grantHeroExp, getHeroData, loadHeroData } from './hero.js';
import { DUNGEON_STATE, hitMonster, calculateRewards, increaseFloor, getDungeonData, loadDungeonData, refreshMonsterVisuals } from './dungeon.js';
import { MATERIAL_TIERS, WEAPON_DB, ARMOR_DB } from './items.js';

document.addEventListener('DOMContentLoaded', () => {
    const tg = (window.Telegram && window.Telegram.WebApp)
        ? window.Telegram.WebApp
        : {
            expand: () => { },
            HapticFeedback: {
                notificationOccurred: () => { },
                impactOccurred: () => { }
            },
            BackButton: { show: () => { }, hide: () => { }, onClick: () => { } }
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
            //if (typeof tg.requestFullscreen === 'function') {
            //    tg.requestFullscreen();
            //}
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
    // --- TELEGRAM NAVIGATION & SAFETY SYSTEM ---
    try {
        tg.expand();
        if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();

        if (tg.BackButton) {
            tg.BackButton.onClick(() => {
                if (modalStack.length > 0) {
                    const lastModalId = modalStack.pop();
                    if (lastModalId === 'smithy-modal') {
                        document.getElementById('close-smithy-button').click();
                    }
                    else if (lastModalId === 'hero-modal') {
                        document.getElementById('close-hero-button').click();
                    }
                    else if (lastModalId === 'bag-modal') {
                        document.getElementById('close-bag-button').click();
                    }
                    else if (lastModalId === 'equip-select-modal') {
                        document.getElementById('close-equip-select-button').click();
                    }
                    else {
                        const m = document.getElementById(lastModalId);
                        if (m) m.classList.add('hidden');
                    }
                    if (modalStack.length === 0) tg.BackButton.hide();
                }
            });
        }
    } catch (e) {
        console.warn("Telegram API setup warning:", e);
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'reelRpgData') {
            try {
                const newState = JSON.parse(event.newValue);
                if (newState && typeof newState.dust !== 'undefined') {
                    gameState.dust = newState.dust;
                    if (typeof updateUI === 'function') updateUI();
                }
            } catch (err) {
                console.warn('Failed to sync gameState from Blackjack:', err);
            }
        }
    });

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const gemShardsCounter = document.getElementById('gem-shards-counter');
    const monsterImage = document.getElementById('monster-image');
    const monsterHpBar = document.getElementById('monster-hp-bar');
    const monsterHpText = document.getElementById('monster-hp-text');
    const monsterName = document.getElementById('monster-name');
    const heroHpBar = document.getElementById('hero-hp-bar');
    const heroHpText = document.getElementById('hero-hp-text');
    const heroEnergyBar = document.getElementById('hero-energy-bar');
    const heroEnergyText = document.getElementById('hero-energy-text');
    const heroLimitBar = document.getElementById('hero-limit-bar');
    const heroLimitText = document.getElementById('hero-limit-text');
    const heroXpBar = document.getElementById('hero-xp-bar');
    const heroXpText = document.getElementById('hero-xp-text');
    const heroLevelText = document.getElementById('hero-level');
    const heroStatsText = document.getElementById('hero-stats-text');
    const deathModal = document.getElementById('death-modal');
    const reviveButton = document.getElementById('revive-button');
    const clickEffectContainer = document.getElementById('click-effect-container');
    const loginRewardModal = document.getElementById('login-reward-modal');
    const headerCalendarButton = document.getElementById('header-calendar-button');
    const calendarModal = document.getElementById('calendar-modal');
    const cheatModal = document.getElementById('cheat-modal');
    const closeCalendarButton = document.getElementById('close-calendar-button');
    const offlineProgressModal = document.getElementById('offline-progress-modal');
    const particleContainer = document.getElementById('particle-container');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const loginStreakText = document.getElementById('login-streak-text');
    const loginRewardText = document.getElementById('login-reward-text');
    const btnAuto = document.getElementById('btn-auto-toggle');
    const btnBoss = document.getElementById('btn-boss-toggle');
    const btnAdvance = document.getElementById('btn-advance');
    const btnSelectArea = document.getElementById('select-area-button');
    const gameBody = document.body;
    const sceneTransition = document.getElementById('scene-transition');
    const lobbyStatusText = document.getElementById('lobby-status-text');
    const monsterIntentEl = document.getElementById('monster-intent');
    const bossVictoryModal = document.getElementById('boss-victory-modal');
    const victoryContinueBtn = document.getElementById('victory-continue-btn');
    const victoryLeaveBtn = document.getElementById('victory-leave-btn');
    const bagModal = document.getElementById('bag-modal');
    const closeBagButton = document.getElementById('close-bag-button');
    const bagGrid = document.getElementById('bag-grid');
    const headerBagButton = document.getElementById('header-bag-button');
    const combatLog = document.getElementById('combat-log-box');
    const dungeonModal = document.getElementById('dungeon-selector-modal');
    const closeDungeonButton = document.getElementById('close-dungeon-button');
    const dungeonList = document.getElementById('dungeon-list');
    const autoCombatBtn = document.getElementById('auto-combat-btn');

    // --- MINI SLOT ELEMENTS ---
    const slotOverlay = document.getElementById("slot-overlay");
    const slotMachine = document.querySelector(".slot-machine");
    const slotReels = document.querySelectorAll(".symbols");

    window.isGameDirty = false;
    let isTransitioning = false;
    let slotActive = false;
    let isAutoCombat = false;
    let autoCombatTimer = null;
    let isAutoBoss = false;
    let combatInterval = null;
    let mobKillCount = 0;
    const MOBS_TO_BOSS = 10;
    let modalStack = [];

    // --- GAME STATE ---
    if (!window.gameState) {
        window.gameState = {
            /// --- DUNGEONS ---
            inDungeon: false,

            // --- CURRENCIES ---
            dust: 0,
            gemShards: 0,
            reelTickets: 0,

            // --- SYSTEM VARS ---
            lastLoginDate: null,
            loginStreak: 0,
            checksum: null,
            lastSavedTimestamp: Date.now(),

            // --- MINIGAME: BLACKJACK ---
            blackjack_level: 1,
            blackjack_exp: 0,

            // --- MINIGAME: SLOT / REEL ---
            slot_level: 1,
            slot_exp: 0,
            slot_last_win: 0,
            reelRewardProgress: 0,
            reelRewardClaims: [false, false, false, false, false],
            reelRewardResetTime: 0,

            // --- MINIGAME: MIMIC ---
            mimicStage: 1,
            mimicFeedProgress: 0,
            mimicFeedsToday: 0,
            mimicLastFeedDate: null
        };
    }

    let gameState = window.gameState;
    let isGameLoaded = false;
    const slotSymbols = {
        sword: { name: 'sword', label: 'SWORD', color: '#e74c3c' },
        ulti: { name: 'ulti', label: 'ULTI', color: '#f1c40f' },
        miss: { name: 'miss', label: 'MISS', color: '#95a5a6' }
    };

    const weightedSlotProbabilities = [
        ...Array(70).fill('sword'),
        ...Array(20).fill('miss'),
        ...Array(10).fill('ulti')
    ];

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

    let particleSpawnInterval = null;
    const CHECKSUM_SALT = "golem_egg_super_secret_key_v2";

    // --- HELPER FUNCTIONS ---

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modalStack.push(modalId);
            if (tg.BackButton) tg.BackButton.show();
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('closing');
            }, 300);
            const index = modalStack.indexOf(modalId);
            if (index > -1) {
                modalStack.splice(index, 1);
            }
        }
        if (modalStack.length === 0 && tg.BackButton) {
            tg.BackButton.hide();
        }
    }

    window.openModalGlobal = openModal;
    window.closeModalGlobal = closeModal;

    function triggerScreenShake(intensity = 'heavy') {
        const container = document.querySelector('.game-container');
        if (!container) return;
        container.classList.remove('shake-heavy', 'zoom-hit');
        void container.offsetWidth;
        container.classList.add('shake-heavy');
        if (intensity === 'critical') {
            container.classList.add('zoom-hit');
        }
        setTimeout(() => {
            container.classList.remove('shake-heavy', 'zoom-hit');
        }, 500);
    }

    function populateReel(reel) {
        reel.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const symbolKey = weightedSlotProbabilities[Math.floor(Math.random() * weightedSlotProbabilities.length)];
            const symbolData = slotSymbols[symbolKey];

            const el = document.createElement("div");
            el.classList.add("slot-symbol-text");
            el.innerText = symbolData.label;
            el.style.color = symbolData.color;
            reel.appendChild(el);
        }
    }

    slotReels.forEach(populateReel);

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

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = formatNumber(Math.floor(progress * (end - start) + start));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
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
            gs: state.gemShards,
            bjl: state.blackjack_level,
            bjx: state.blackjack_exp,
            hl: state.hero ? state.hero.level : 1,
            df: state.dungeon ? state.dungeon.floor : 1
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
        if (slotActive) return;
        slotActive = true;
        slotOverlay.classList.remove('hidden');
        slotOverlay.classList.remove('banner-only');
        slotResult.classList.add("hidden");
        slotResult.classList.remove("show");
        const container = document.querySelector(".slot-machine-container");
        container.classList.remove("fade-out");
    }

    function closeSlot() {
        slotOverlay.classList.add("hidden");
        slotActive = false;
        const container = document.querySelector(".slot-machine-container");
        if (container) container.classList.remove("fade-out");
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

    // --- CORE FUNCTIONS ---

    function startCombatLoop() {
        if (combatInterval) clearInterval(combatInterval);
        if (combatLog) combatLog.innerText = `HUNTING: ${DUNGEON_STATE.monsterName}`;
        combatInterval = setInterval(() => {
            if (!gameState.inDungeon || HERO_STATE.currentHP <= 0) return;
            if (!isAutoCombat) {
                if (combatLog) combatLog.innerText = "PAUSED";
                return;
            }

            const damage = Math.floor(HERO_STATE.baseAttack * (0.9 + Math.random() * 0.2));
            const isDead = hitMonster(damage);
            spawnFloatingText(`-${damage}`, '#fff', 40, 50);
            monsterImage.classList.add('monster-hit-flash');
            setTimeout(() => monsterImage.classList.remove('monster-hit-flash'), 100);
            const slash = document.createElement('div');
            slash.className = 'slash-effect animate';
            const wrapper = document.querySelector('.monster-wrapper');
            if (wrapper) wrapper.appendChild(slash);
            setTimeout(() => slash.remove(), 300);
            if (!isDead) {
                const mobDmg = Math.max(1, DUNGEON_STATE.attack - (HERO_STATE.defense || 0));
                HERO_STATE.currentHP -= mobDmg;

                spawnFloatingText(`-${mobDmg}`, '#e74c3c', 60, 50);
                triggerScreenShake('light');

                if (HERO_STATE.currentHP <= 0) {
                    HERO_STATE.currentHP = 0;
                    handlePlayerDeath();
                }
            } else {
                handleMonsterDeath();
            }

            updateUI();
        }, 1000);
    }

    function spawnFloatingText(text, color, topPct, leftPct) {
        const el = document.createElement('div');
        el.className = 'click-effect';
        el.innerText = text;
        el.style.color = color;
        el.style.fontSize = "24px";
        el.style.top = `${topPct}%`;
        el.style.left = `${leftPct}%`;
        clickEffectContainer.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    function handleMonsterDeath() {
        monsterImage.classList.remove('monster-die');
        void monsterImage.offsetWidth;
        monsterImage.classList.add('monster-die');
        const currentFloor = DUNGEON_STATE.floor;
        const isBoss = (currentFloor % 10 === 0);
        const rewards = calculateRewards();
        gameState.dust += rewards.dustReward;
        grantHeroExp(rewards.xpReward);
        spawnFloatingText(`+${formatNumber(rewards.dustReward)} Dust`, '#87CEEB', 30, 50);

        if (isBoss) {
            const isFirstKill = currentFloor > (HERO_STATE.maxFloor || 1);
            if (isFirstKill) {
                HERO_STATE.maxFloor = currentFloor;
                gameState.gemShards += 1; 
            }

            const vDust = document.getElementById('victory-dust-amount');
            const vXp = document.getElementById('victory-xp-amount');
            const vGemCard = document.getElementById('victory-card-gem');
            const vGemAmt = document.getElementById('victory-gem-amount');
            const vMatCard = document.getElementById('victory-card-mat');
            const vMatAmt = document.getElementById('victory-mat-amount');
            const vMatLabel = document.getElementById('victory-mat-label');
            const vMatIcon = document.getElementById('victory-mat-icon-box');

            if (vDust) vDust.innerText = formatNumber(rewards.dustReward);
            if (vXp) vXp.innerText = formatNumber(rewards.xpReward);
            if (vGemCard) {
                if (isFirstKill) {
                    vGemCard.classList.remove('hidden');
                    if (vGemAmt) vGemAmt.innerText = "1";
                } else {
                    vGemCard.classList.add('hidden');
                }
            }

            if (rewards.loot && vMatCard) {
                vMatCard.classList.remove('hidden');
                if (vMatAmt) vMatAmt.innerText = rewards.loot.amount;
                if (vMatLabel) vMatLabel.innerText = rewards.loot.name;
                if (!HERO_STATE.inventory[rewards.loot.id]) HERO_STATE.inventory[rewards.loot.id] = 0;
                HERO_STATE.inventory[rewards.loot.id] += rewards.loot.amount;
                vMatIcon.className = 'loot-icon-wrapper';
                if (rewards.loot.id.includes('wood')) vMatIcon.classList.add('mat-wood');
                else if (rewards.loot.id.includes('copper')) vMatIcon.classList.add('mat-copper');
                else vMatIcon.classList.add('mat-iron');
            }

            bossVictoryModal.classList.remove('hidden');

            setTimeout(() => {
                if (!bossVictoryModal.classList.contains('hidden')) {
                    bossVictoryModal.classList.add('hidden');
                    nextFloor();
                }
            }, 1500);

        } else {
            mobKillCount++;
            if (rewards.loot) {
                if (!HERO_STATE.inventory[rewards.loot.id]) HERO_STATE.inventory[rewards.loot.id] = 0;
                HERO_STATE.inventory[rewards.loot.id] += rewards.loot.amount;
                spawnFloatingText(`+${rewards.loot.amount} ${rewards.loot.name}`, '#fff', 25, 50);
            }
            if (currentFloor % 10 === 9 && mobKillCount >= MOBS_TO_BOSS) {
                if (isAutoBoss) {
                    nextFloor();
                } else {
                    mobKillCount = 0;
                    spawnNewMonster();
                    if (btnAdvance) btnAdvance.classList.remove('hidden');
                }
            }
            else if (mobKillCount >= MOBS_TO_BOSS) {
                nextFloor();
            }
            else {
                spawnNewMonster();
            }
        }
        saveGame();
    }

    function nextFloor() {
        increaseFloor();
        mobKillCount = 0;
        if (btnAdvance) btnAdvance.classList.add('hidden');
        spawnNewMonster();
        if (combatLog) combatLog.innerText = `ADVANCING TO FLOOR ${DUNGEON_STATE.floor}`;
    }

    function refreshDungeonStats() {
        const floor = DUNGEON_STATE.floor;
        DUNGEON_STATE.maxHP = Math.floor(50 * Math.pow(1.15, floor - 1));
        DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
        DUNGEON_STATE.attack = Math.floor(5 + (floor * 1.5));
        refreshMonsterVisuals();
    }

    function spawnNewMonster() {
        monsterImage.classList.remove('monster-die', 'monster-invisible');
        monsterImage.classList.add('monster-appear');
        DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
        setTimeout(() => monsterImage.classList.remove('monster-appear'), 500);
        updateUI();
    }

    function handlePlayerDeath() {
        HERO_STATE.currentHP = HERO_STATE.maxHP;
        if (DUNGEON_STATE.floor > 1) {
            DUNGEON_STATE.floor--;
        }
        isAutoBoss = false;
        mobKillCount = 0;
        spawnFloatingText("DEFEATED!", "#ff0000", 50, 50);
        tg.HapticFeedback.notificationOccurred('error');
        if (combatLog) combatLog.innerText = "DEFEATED - FALLING BACK";
        refreshDungeonStats();
        DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
        refreshDungeonStats();
        spawnNewMonster();
        updateControlButtons();
    }

    function saveGameIfDirty() {
        if (window.isGameDirty) {
            saveGame();
        }
    }

    function saveGame() {
        if (!isGameLoaded) {
            console.warn("Save blocked: Game not fully loaded yet.");
            return;
        }
        try {
            const currentSave = localStorage.getItem('reelRpgData');
            if (currentSave) {
                localStorage.setItem('reelRpgData_backup', currentSave);
            }
            gameState.lastSavedTimestamp = Date.now();
            gameState.hero = getHeroData();
            gameState.dungeon = getDungeonData();
            gameState.checksum = generateChecksum(gameState);
            const saveString = JSON.stringify(gameState);
            if (tg && tg.CloudStorage && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                tg.CloudStorage.setItem('reelRpgData', saveString, (err) => {
                    if (err) {
                        console.error("Cloud save failed:", err);
                        localStorage.setItem('reelRpgData', saveString);
                    } else {
                    }
                });
            } else {
                localStorage.setItem('reelRpgData', saveString);
            }
            window.isGameDirty = false;
        } catch (error) {
            console.error("Failed to save game:", error);
        }
    }

    function preloadImages() {
        const imageUrls = Object.values(GAME_ASSETS);
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
                if (!savedState || !savedState.checksum) {
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

        const applyLoadedState = (isNew) => {
            if (gameState.hero) {
                loadHeroData(gameState.hero);
                if (!HERO_STATE.equipment) {
                    HERO_STATE.equipment = { mainHand: 'rusty_sword', body: 'tattered_shirt' };
                }
                if (!HERO_STATE.equipmentLevels) {
                    HERO_STATE.equipmentLevels = { mainHand: 0, body: 0 };
                }
                if (!HERO_STATE.inventory) {
                    HERO_STATE.inventory = {};
                }
                if (!HERO_STATE.ownedItems) {
                    HERO_STATE.ownedItems = ['rusty_sword', 'tattered_shirt'];
                }
                console.log("Hero Data Loaded:", HERO_STATE);
            }
            if (gameState.dungeon) {
                loadDungeonData(gameState.dungeon);
                refreshMonsterVisuals();
                console.log("Dungeon Data Loaded:", gameState.dungeon);
            }
            gameState.inDungeon = false;
            HERO_STATE.limitGauge = 0;
            DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
            if (!isNew) {
                const now = Date.now();
                const timePassedInSeconds = Math.floor((now - gameState.lastSavedTimestamp) / 1000);
                const energyRegenAmount = Math.floor(timePassedInSeconds / 60);
                if (energyRegenAmount > 0) {
                    HERO_STATE.energy = Math.min(HERO_STATE.energy + energyRegenAmount, HERO_STATE.maxEnergy);
                }
                if (timePassedInSeconds > 300) {
                    offlineProgressModal.classList.remove('hidden');
                }
            }
            isGameLoaded = true;
            onLoadComplete(isNew);
        };

        if (tg && tg.CloudStorage && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            tg.CloudStorage.getItem('reelRpgData', (err, cloudSaveString) => {
                let isNew = true;
                if (err) {
                    console.warn("Cloud load failed, trying localStorage...", err);
                    isNew = !tryLoadingState(localStorage.getItem('reelRpgData'));
                } else if (tryLoadingState(cloudSaveString)) {
                    isNew = false;
                    console.log("Game loaded from cloud.");
                } else {
                    console.warn("Cloud data corrupt, trying localStorage...");
                    isNew = !tryLoadingState(localStorage.getItem('reelRpgData_backup'));
                }
                applyLoadedState(isNew);
            });
        } else {
            console.log("No cloud storage, using localStorage.");
            let isNew = true;
            try {
                if (tryLoadingState(localStorage.getItem('reelRpgData'))) {
                    isNew = false;
                } else if (tryLoadingState(localStorage.getItem('reelRpgData_backup'))) {
                    console.warn("Main save corrupt, loaded backup.");
                    isNew = false;
                }
            } catch (error) {
                console.error("Critical error during local load:", error);
            }
            applyLoadedState(isNew);
        }
    }

    function triggerTransition(callback) {
        if (isTransitioning) return;
        isTransitioning = true;
        sceneTransition.classList.add('active');
        sceneTransition.classList.remove('curtain-out');
        sceneTransition.classList.add('curtain-in');
        setTimeout(() => {
            if (callback) callback();
            setTimeout(() => {
                sceneTransition.classList.remove('curtain-in');
                sceneTransition.classList.add('curtain-out');
                setTimeout(() => {
                    sceneTransition.classList.remove('active');
                    isTransitioning = false;
                }, 400);

            }, 500);
        }, 400);
    }

    function showCombatLog(message, typeClass) {
        if (!combatLog) return;
        combatLog.className = '';
        if (typeClass) combatLog.classList.add(typeClass);
        combatLog.innerHTML = message;
        setTimeout(() => {
            combatLog.innerHTML = "";
            combatLog.className = '';
        }, 2000);
    }

    function updateUI() {
        dustCounter.innerText = formatNumber(gameState.dust);
        gemShardsCounter.innerText = formatNumber(gameState.gemShards);
        const monsterHpPercent = (DUNGEON_STATE.currentHP / DUNGEON_STATE.maxHP) * 100;
        monsterHpBar.style.width = `${monsterHpPercent}%`;
        monsterHpText.innerText = `${formatNumber(DUNGEON_STATE.currentHP)} / ${formatNumber(DUNGEON_STATE.maxHP)} HP`;
        monsterName.innerText = DUNGEON_STATE.monsterName;
        if (monsterIntentEl) {
            monsterIntentEl.className = 'intent-badge';
            monsterIntentEl.classList.add(DUNGEON_STATE.currentStance);
            if (DUNGEON_STATE.currentStance === 'aggressive') monsterIntentEl.innerText = "⚔️";
            else if (DUNGEON_STATE.currentStance === 'spiked') monsterIntentEl.innerText = "🛡️";
            else if (DUNGEON_STATE.currentStance === 'enraged') monsterIntentEl.innerText = "⚠️";
        }
        if (!monsterImage.classList.contains('monster-die') && !monsterImage.classList.contains('monster-invisible')) {
            const assetKey = DUNGEON_STATE.monsterAsset || "eggDefault";
            monsterImage.style.backgroundImage = `url(${GAME_ASSETS[assetKey]})`;
        }

        const xpPercent = (HERO_STATE.currentExp / HERO_STATE.expToNextLevel) * 100;
        heroXpBar.style.width = `${xpPercent}%`;
        heroXpText.innerText = `XP: ${formatNumber(HERO_STATE.currentExp)} / ${formatNumber(HERO_STATE.expToNextLevel)}`;
        heroLevelText.innerText = `Hero Lv. ${HERO_STATE.level}`;
        heroStatsText.innerText = `ATK: ${HERO_STATE.baseAttack} | CRIT: ${(HERO_STATE.critChance * 100).toFixed(0)}%`;
        const heroHpPercent = (HERO_STATE.currentHP / HERO_STATE.maxHP) * 100;
        heroHpBar.style.width = `${heroHpPercent}%`;
        heroHpText.innerText = `${Math.ceil(HERO_STATE.currentHP)} / ${HERO_STATE.maxHP} HP`;
        const energyPercent = (HERO_STATE.energy / HERO_STATE.maxEnergy) * 100;
        heroEnergyBar.style.width = `${energyPercent}%`;
        heroEnergyText.innerText = `${Math.floor(HERO_STATE.energy)} / ${HERO_STATE.maxEnergy} Energy`
        const limitPercent = (HERO_STATE.limitGauge / HERO_STATE.maxLimit) * 100;
        heroLimitBar.style.width = `${limitPercent}%`;
        const limitBarContainer = heroLimitBar.parentElement;

        if (HERO_STATE.limitGauge >= HERO_STATE.maxLimit) {
            heroLimitText.innerText = "LIMIT BREAK READY!";
            heroLimitText.classList.add('limit-ready-text');
            limitBarContainer.classList.add('limit-ready');
        } else {
            heroLimitText.innerText = "LIMIT GAUGE";
            heroLimitText.classList.remove('limit-ready-text');
            limitBarContainer.classList.remove('limit-ready');
        }
    }

    function renderDungeonList() {
        dungeonList.innerHTML = "";
        const stages = [
            { id: 1, name: "Slime Plains", start: 1, end: 10 },
            { id: 2, name: "Copper Mines", start: 11, end: 20 },
            { id: 3, name: "Iron Fortress", start: 21, end: 30 },
            { id: 4, name: "Silver Ruins", start: 31, end: 40 },
            { id: 5, name: "Golden City", start: 41, end: 50 },
            { id: 6, name: "Obsidian Cave", start: 51, end: 60 },
            // Add more as needed...
        ];

        const currentMax = HERO_STATE.maxFloor || 1;
        stages.forEach(stage => {
            const isLocked = currentMax < stage.start;
            const btn = document.createElement('button');
            btn.className = `stage-btn ${isLocked ? 'locked' : ''}`;
            btn.disabled = isLocked;
            const lockIcon = isLocked ? '<div class="lock-icon">🔒</div>' : '';
            const costDisplay = isLocked ? '' : `<div class="stage-cost">5⚡</div>`;
            btn.innerHTML = `
                ${lockIcon}
                <div class="stage-info">
                    <span class="stage-title">${stage.name}</span>
                    <span class="stage-range">Floors ${stage.start} - ${stage.end}</span>
                </div>
                ${costDisplay}
            `;
            if (!isLocked) {
                btn.addEventListener('click', () => {
                    enterStage(stage.start);
                });
            }
            dungeonList.appendChild(btn);
        });
    }

    function enterStage(startFloor) {
        if (isTransitioning) return;
        if (HERO_STATE.energy < 5) {
            tg.HapticFeedback.notificationOccurred('error');
            const warning = document.createElement('div');
            warning.className = 'click-effect';
            warning.innerText = "Need 5 Energy!";
            warning.style.color = "#FFD700";
            warning.style.top = "55%"; warning.style.left = "50%";
            document.body.appendChild(warning);
            setTimeout(() => warning.remove(), 1500);
            return;
        }

        HERO_STATE.energy -= 5;
        DUNGEON_STATE.floor = startFloor;
        DUNGEON_STATE.currentStance = 'aggressive';
        DUNGEON_STATE.maxHP = Math.floor(50 * Math.pow(1.15, startFloor - 1));
        DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
        DUNGEON_STATE.attack = Math.floor(5 + (startFloor * 1.5));
        monsterImage.classList.remove('monster-die', 'monster-invisible', 'monster-appear');
        dungeonModal.classList.add('hidden');
        triggerTransition(() => {
            gameState.inDungeon = true;
            refreshMonsterVisuals();
            updateUI();
            tg.HapticFeedback.impactOccurred('medium');
        });
    }

    function populateBag() {
        bagGrid.className = 'bag-list-wrapper';
        bagGrid.innerHTML = "";
        const ownedIds = HERO_STATE.ownedItems || [];
        const inventory = HERO_STATE.inventory || {};

        // --- HELPER: RENDER SECTION ---

        function renderSection(title, items, type) {
            if (items.length === 0) return;
            const titleEl = document.createElement('div');
            titleEl.className = 'bag-section-title';
            titleEl.innerText = title;
            bagGrid.appendChild(titleEl);
            const gridEl = document.createElement('div');
            gridEl.className = 'bag-section-grid';
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'bag-item';
                let iconHTML = '';
                let countHTML = '';
                let clickName = item.name;
                if (type === 'weapon') {
                    iconHTML = `<div class="weapon-icon" style="transform:scale(0.7)"></div>`;
                    const lvl = (HERO_STATE.itemLevels && HERO_STATE.itemLevels[item.id]) || 0;
                    if (lvl > 0) countHTML = `<span class="bag-item-count" style="color:#2ecc71">+${lvl}</span>`;
                }
                else if (type === 'armor') {
                    iconHTML = `<div class="armor-icon" style="transform:scale(0.8)"></div>`;
                }
                else if (type === 'material') {
                    let colorClass = 'mat-iron';
                    const nameLower = item.name.toLowerCase();
                    if (nameLower.includes('wood')) colorClass = 'mat-wood';
                    else if (nameLower.includes('copper')) colorClass = 'mat-copper';
                    else if (nameLower.includes('silver')) colorClass = 'mat-silver';
                    else if (nameLower.includes('gold')) colorClass = 'mat-gold';
                    else if (nameLower.includes('obsidian')) colorClass = 'mat-obsidian';
                    else if (nameLower.includes('dragon') || nameLower.includes('void')) colorClass = 'mat-mythic';

                    iconHTML = `<div class="bag-item-icon ${colorClass}" title="${item.name}"></div>`;
                    countHTML = `<span class="bag-item-count">${formatNumber(item.qty)}</span>`;
                }

                itemDiv.innerHTML = `${iconHTML}${countHTML}`;
                itemDiv.addEventListener('click', () => {
                    const nameDisplay = document.createElement('div');
                    nameDisplay.className = 'click-effect';
                    nameDisplay.innerText = clickName;
                    nameDisplay.style.fontSize = "12px";
                    nameDisplay.style.width = "100%";
                    nameDisplay.style.textAlign = "center";
                    nameDisplay.style.top = "50%";
                    nameDisplay.style.left = "50%";
                    itemDiv.appendChild(nameDisplay);
                    setTimeout(() => nameDisplay.remove(), 1000);
                });

                gridEl.appendChild(itemDiv);
            });

            bagGrid.appendChild(gridEl);
        }

        const myWeapons = WEAPON_DB.filter(w => ownedIds.includes(w.id));
        const myArmor = ARMOR_DB.filter(a => ownedIds.includes(a.id));
        const myMaterials = [];
        MATERIAL_TIERS.forEach(tier => {
            const qty = inventory[tier.id];
            if (qty > 0) {
                myMaterials.push({ ...tier, qty: qty });
            }
        });

        if (myWeapons.length === 0 && myArmor.length === 0 && myMaterials.length === 0) {
            bagGrid.innerHTML = '<div class="bag-empty-message">Your bag is empty.<br>Defeat monsters to find loot!</div>';
            return;
        }

        renderSection("WEAPONS", myWeapons, 'weapon');
        renderSection("ARMOR", myArmor, 'armor');
        renderSection("MATERIALS", myMaterials, 'material');
    }

    window.refreshGameUI = updateUI;
    window.saveGameGlobal = saveGame;
    window.formatNumberGlobal = formatNumber;
    function gameLoop() {
        const now = Date.now();
        const REGEN_COOLDOWN = 60000;
        if (!HERO_STATE.lastRegenTime) HERO_STATE.lastRegenTime = now;
        if (HERO_STATE.energy < HERO_STATE.maxEnergy) {
            if (now - HERO_STATE.lastRegenTime > REGEN_COOLDOWN) {
                HERO_STATE.energy++;
                HERO_STATE.lastRegenTime = now;
            }
        } else {
            HERO_STATE.lastRegenTime = now;
        }

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
                rewardText = `<span class="dust-amount-color">${formatNumber(rewardInfo.amount)}</span> <img src="${GAME_ASSETS.iconCrystalDust}" class="inline-icon" alt="Crystal Dust">`;
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
            rewardText = `<span class="dust-amount-color">${formatWithCommas(rewardInfo.amount)}</span> <img src="${GAME_ASSETS.iconCrystalDust}" class="inline-icon" alt="Crystal Dust">`;
        } else {
            rewardText = rewardInfo.label;
        }
        nextRewardValue.innerHTML = rewardText;
    }

    // --- EVENT LISTENERS ---

    if (btnAuto) {
        btnAuto.addEventListener('click', () => {
            isAutoCombat = !isAutoCombat;
            updateControlButtons();
            if (isAutoCombat) {
                startCombatLoop();
            } else {
                if (combatInterval) clearInterval(combatInterval);
            }
            tg.HapticFeedback.impactOccurred('medium');
        });
    }

    if (btnBoss) {
        btnBoss.addEventListener('click', () => {
            if (!isAutoCombat) return;
            isAutoBoss = !isAutoBoss;
            updateControlButtons();
            tg.HapticFeedback.impactOccurred('light');
        });
    }

    if (btnAdvance) {
        btnAdvance.addEventListener('click', () => {
            btnAdvance.classList.add('hidden');
            nextFloor();
            tg.HapticFeedback.notificationOccurred('success');
        });
    }

    if (btnSelectArea) {
        btnSelectArea.addEventListener('click', () => {
            renderDungeonList();
            dungeonModal.classList.remove('hidden');
        });
    }

    function updateControlButtons() {
        if (isAutoCombat) {
            btnAuto.classList.add('active');
            btnAuto.innerText = "ON";
            btnBoss.disabled = false;
        } else {
            btnAuto.classList.remove('active');
            btnAuto.innerText = "AUTO";
            btnBoss.disabled = true;
            isAutoBoss = false;
        }

        if (isAutoBoss) {
            btnBoss.classList.add('active');
            btnBoss.innerText = "ON";
        } else {
            btnBoss.classList.remove('active');
            btnBoss.innerText = "BOSS";
        }
    }

    if (autoCombatBtn) {
        autoCombatBtn.addEventListener('click', () => {
            isAutoCombat = !isAutoCombat;

            if (isAutoCombat) {
                autoCombatBtn.classList.add('active');
                autoCombatBtn.innerText = "ON";
                if (!btnActionAttack.disabled) {
                    runAutoCombat();
                }
            } else {
                autoCombatBtn.classList.remove('active');
                autoCombatBtn.innerText = "AUTO";
                if (autoCombatTimer) clearTimeout(autoCombatTimer);
            }

            tg.HapticFeedback.impactOccurred('medium');
        });
    }

    if (headerBagButton) {
        headerBagButton.addEventListener('click', () => {
            populateBag();
            openModal('bag-modal');
            tg.HapticFeedback.impactOccurred('light');
        });
    }

    if (closeBagButton) {
        closeBagButton.addEventListener('click', () => {
            bagModal.classList.add('closing');
            setTimeout(() => {
                bagModal.classList.add('hidden');
                bagModal.classList.remove('closing');
            }, 300);
        });
    }

    victoryContinueBtn.addEventListener('click', () => {
        bossVictoryModal.classList.add('hidden');
        tg.HapticFeedback.impactOccurred('light');
        updateUI();
        const monsterImage = document.getElementById('monster-image');
        monsterImage.classList.remove('monster-invisible');
        monsterImage.classList.add('monster-appear');

        setTimeout(() => {
            monsterImage.classList.remove('monster-appear');
        }, 500);
    });

    victoryLeaveBtn.addEventListener('click', () => {
        bossVictoryModal.classList.add('hidden');

        triggerTransition(() => {
            gameState.inDungeon = false;
            HERO_STATE.limitGauge = 0;
            HERO_STATE.currentBlock = 0;
            saveGame();
            updateUI();
        });
    });

    closeDungeonButton.addEventListener('click', () => {
        dungeonModal.classList.add('hidden');
    });

    reviveButton.addEventListener('click', () => {
        deathModal.classList.add('hidden');
        triggerTransition(() => {
            HERO_STATE.currentHP = 1;
            DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
            DUNGEON_STATE.currentStance = 'aggressive';
            HERO_STATE.limitGauge = 0;
            gameState.inDungeon = false;
            saveGame();
            updateUI();
        });
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

    if (headerCalendarButton) {
        headerCalendarButton.addEventListener('click', () => {
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

    function spawnParticle() {
        const wrapper = document.createElement('div');
        wrapper.className = 'glow-wrapper';
        const particle = document.createElement('div');
        particle.className = 'glow-particle';
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

    function initCheats() {
        window.addEventListener('keydown', (e) => {
            if (!e.key) return;
            const key = e.key.toLowerCase();
            switch (key) {
                // 🌀 Force open slot machine
                case 's':
                    console.log('[DEV] Forcing Spin-to-Win...');
                    openSlot();
                    break;

                // 💎 Add gems
                case 'g':
                    console.log('[DEV] +10 Gem Shards');
                    gameState.gemShards = (gameState.gemShards || 0) + 10;
                    updateUI();
                    break;

                // ✨ Add crystal dust
                case 'c':
                    console.log('[DEV] +1M Crystal Dust (for testing)');
                    gameState.dust = (gameState.dust || 0) + 1000000;
                    updateUI();
                    break;

                // --- SET DUST TO ZERO ---
                case 'z':
                    console.log('[DEV] Setting Crystal Dust to 0...');
                    gameState.dust = 0;
                    updateUI();
                    break;

                // --- HEAL MONSTER ---
                case 'h':
                    console.log('[DEV] Healing Monster...');
                    DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
                    updateUI();
                    break;

                case 'p':
                    HERO_STATE.baseAttack += 50;
                    console.log(`[DEV] Attack INCREASED: ${HERO_STATE.baseAttack}`);
                    const upMsg = document.createElement('div');
                    upMsg.className = 'click-effect';
                    upMsg.innerText = `ATK UP! (${HERO_STATE.baseAttack})`;
                    upMsg.style.color = "#00ff00";
                    upMsg.style.top = "50%"; upMsg.style.left = "50%";
                    if (document.getElementById('click-effect-container')) {
                        document.getElementById('click-effect-container').appendChild(upMsg);
                    } else {
                        document.body.appendChild(upMsg);
                    }
                    setTimeout(() => upMsg.remove(), 1000);
                    updateUI();
                    break;

                // --- O: POWER DOWN (-50 ATK) ---
                case 'o':
                    HERO_STATE.baseAttack = Math.max(1, HERO_STATE.baseAttack - 50);
                    console.log(`[DEV] Attack DECREASED: ${HERO_STATE.baseAttack}`);
                    const downMsg = document.createElement('div');
                    downMsg.className = 'click-effect';
                    downMsg.innerText = `ATK DOWN... (${HERO_STATE.baseAttack})`;
                    downMsg.style.color = "#ff0000";
                    downMsg.style.top = "50%"; downMsg.style.left = "50%";
                    if (document.getElementById('click-effect-container')) {
                        document.getElementById('click-effect-container').appendChild(downMsg);
                    } else {
                        document.body.appendChild(downMsg);
                    }
                    setTimeout(() => downMsg.remove(), 1000);
                    updateUI();
                    break;

                // --- ADD REEL TICKET BY 1 ---
                case 'v':
                    console.log('[DEV] +1 Reel Ticket');
                    gameState.reelTickets = (gameState.reelTickets || 0) + 1;
                    window.isGameDirty = true;
                    const reelGameTicketAmountEl = document.getElementById('reel-game-ticket-amount');
                    if (reelGameTicketAmountEl) {
                        reelGameTicketAmountEl.innerText = formatNumber(gameState.reelTickets);
                    }
                    updateUI();
                    break;

                case 'b': // 'b' for Bonus
                    console.log('[DEV] Forcing Free Spins Bonus...');
                    if (typeof window.openReelGame === 'function' && typeof window.dev_triggerFreeSpins === 'function') {
                        const reelScreen = document.getElementById('reel-game-screen');
                        if (reelScreen && reelScreen.classList.contains('hidden')) {
                            console.log('[DEV] Reel game is closed, opening it first...');
                            window.openReelGame();
                            setTimeout(() => {
                                window.dev_triggerFreeSpins(15);
                            }, 500);
                        } else {
                            window.dev_triggerFreeSpins(15);
                        }
                    } else {
                        console.log('[DEV] Reel game functions not found. Open the reel game at least once.');
                    }

                // 📅 Force daily login    
                case 'l':
                    console.log('[DEV] Forcing Daily Login...');
                    gameState.lastLoginDate = null;
                    handleDailyLogin();
                    saveGame();
                    break;

                // M: Mimic Force Feed
                case 'm':
                    if (window.dev_forceFeed) {
                        window.dev_forceFeed();
                    } else {
                        console.log('[DEV] Mimic modal must be loaded to use this cheat.');
                    }
                    break;

                // N: Next Mimic Reward (sets to 24/25)
                case 'n':
                    if (window.dev_setNextReward) {
                        window.dev_setNextReward();
                    } else {
                        console.log('[DEV] Mimic modal must be loaded to use this cheat.');
                    }
                    break;

                case 'k':
                    if (window.dev_resetFeeds) {
                        window.dev_resetFeeds();
                    } else {
                        console.log('[DEV] Mimic modal must be loaded to use this cheat.');
                    }
                    break;


                // 🔄 Reset all progress
                case 'r':
                    console.log('[DEV] Soft reset requested...');
                    console.log('[DEV] Resetting progress... (Bypassing confirm for testing)');
                    try {
                        localStorage.clear();
                        console.log('[DEV] LocalStorage cleared.');
                        if (tg && tg.CloudStorage && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                            tg.CloudStorage.removeItem('reelRpgData', (err, removed) => {
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

                // 🔋 Set Energy to 1 (Test "Last Hit" scenario)
                case 'e':
                    console.log('[DEV] Setting Energy to 1...');
                    HERO_STATE.energy = 1;
                    updateUI();
                    break;

                // 🪫 Set Energy to 0 (Test "Out of Energy" scenario)
                case '0':
                    console.log('[DEV] Draining all Energy...');
                    HERO_STATE.energy = 0;
                    updateUI();
                    break;

                // ⚡ Restore Full Energy (Reset test)
                case 'q': // 'Q' for Quick Fill
                    console.log('[DEV] Restoring Full Energy...');
                    HERO_STATE.energy = HERO_STATE.maxEnergy;
                    updateUI();
                    break;
            }
        });
    }

    // --- INITIALIZE GAME ---

    loadGame((isNewPlayer) => {
        if (isNewPlayer) {
            console.log("New player detected, starting fresh game state.");
            gameState.blackjack_level = 0;
            gameState.blackjack_exp = 0;
            gameState.mimicStage = 1;
            gameState.mimicFeedProgress = 0;
            gameState.mimicFeedsToday = 0;
            gameState.mimicLastFeedDate = null;
            const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
            gameState.reelRewardProgress = 0;
            gameState.reelRewardClaims = [false, false, false, false, false];
            gameState.reelRewardResetTime = sevenDaysFromNow;
            saveGame();
        } else {
            if (typeof gameState.blackjack_level === 'undefined') gameState.blackjack_level = 0;
            if (typeof gameState.blackjack_exp === 'undefined') gameState.blackjack_exp = 0;
            if (typeof gameState.slot_level === 'undefined') gameState.slot_level = 1;
            if (typeof gameState.slot_exp === 'undefined') gameState.slot_exp = 0;
            if (typeof gameState.slot_last_win === 'undefined') gameState.slot_last_win = 0;
            if (typeof gameState.mimicStage === 'undefined') {
                gameState.mimicStage = 1;
                gameState.mimicFeedProgress = 0;
                gameState.mimicFeedsToday = 0;
                gameState.mimicLastFeedDate = null;
            }
            if (typeof gameState.reelRewardProgress === 'undefined') {
                const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
                gameState.reelRewardProgress = 0;
                gameState.reelRewardClaims = [false, false, false, false, false];
                gameState.reelRewardResetTime = sevenDaysFromNow;
            }
        }

        try {
            console.log("Initial UI Update...");
            updateUI();
        } catch (e) {
            console.error("Error updating UI on load:", e);
        }

        try {
            handleDailyLogin();
        } catch (e) {
            console.warn("Error handling daily login:", e);
        }

        if (typeof tg.ready === 'function') {
            tg.ready();
        }
        initCheats();
        setInterval(gameLoop, 1000);
        setInterval(saveGameIfDirty, 5000);
        window.addEventListener('beforeunload', saveGame);
        if (particleContainer) {
            particleSpawnInterval = setInterval(spawnParticle, 500);
        }

        console.log("Game initialized.");
        gameState.inDungeon = true;
        refreshDungeonStats();
        updateControlButtons();
        startCombatLoop();
        preloadImages();
        setTimeout(updateUI, 100);
    });
});