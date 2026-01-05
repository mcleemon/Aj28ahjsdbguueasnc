import { GAME_ASSETS } from './assets.js';
import { HERO_STATE, grantHeroExp, getHeroData, loadHeroData, recalculateHeroStats } from './hero.js';
import { DUNGEON_STATE, hitMonster, calculateRewards, increaseFloor, getDungeonData, loadDungeonData, refreshMonsterVisuals, calculateStatsForFloor } from './dungeon.js';
import { MATERIAL_TIERS, WEAPON_DB, ARMOR_DB } from './items.js';
import { getMiningState, getItemLevel, getNextCost, getItemPPH, calculatePPH, getTotalPPH, isItemUnlocked, getSiloCapacity, getMinedAmount, buyMiningUpgrade, claimSilo, buySiloUpgrade, getClaimCooldown, MINING_ITEMS, SILO_LEVELS } from './mining.js';
import { incrementStat } from './achievements.js';
import { initWallet, toggleWalletConnection } from './wallet.js';

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
    if (typeof tg.ready === 'function') {
        tg.expand();
        tg.ready();
    }
    try {
        const user = tg.initDataUnsafe?.user;
        const startParam = tg.initDataUnsafe?.start_param; // Gets the "ref_123" value

        if (user && startParam && startParam.startsWith('ref_')) {
            const referrerId = startParam.split('_')[1];
            const myId = user.id.toString();

            // Prevent self-referral (can't invite yourself)
            if (referrerId && referrerId !== myId) {
                console.log(`[Referral] Detected invite from: ${referrerId}`);

                // Wait for API to load, then register
                setTimeout(() => {
                    if (window.api && window.api.registerReferral) {
                        window.api.registerReferral(referrerId, myId);
                    }
                }, 1000);
            }
        }
    } catch (e) {
        console.error("Referral check failed:", e);
    }
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

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, { passive: false });

    window.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    }, { passive: false });

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
    const btnAttack = document.getElementById('btn-attack-toggle');
    const btnAuto = document.getElementById('btn-auto-toggle');
    const btnFast = document.getElementById('btn-fast-toggle');
    const btnSelectArea = document.getElementById('select-area-button');
    const gameBody = document.body;
    const sceneTransition = document.getElementById('scene-transition');
    const lobbyStatusText = document.getElementById('lobby-status-text');
    const monsterIntentEl = document.getElementById('monster-intent');
    const bossVictoryModal = document.getElementById('boss-victory-modal');
    const bagModal = document.getElementById('bag-modal');
    const closeBagButton = document.getElementById('close-bag-button');
    const bagGrid = document.getElementById('bag-grid');
    const headerBagButton = document.getElementById('header-bag-button');
    const dungeonModal = document.getElementById('dungeon-selector-modal');
    const closeDungeonButton = document.getElementById('close-dungeon-button');
    const dungeonList = document.getElementById('dungeon-list');
    const dungeonBackButton = document.getElementById('dungeon-back-button');
    const dungeonTitle = document.getElementById('dungeon-title');
    const defeatCountdown = document.getElementById('defeat-countdown');
    const limitBarContainer = heroLimitBar.parentElement;
    const scrollMenu = document.getElementById('main-scroll-menu');
    const scrollLeftBtn = document.getElementById('scroll-arrow-left');
    const scrollRightBtn = document.getElementById('scroll-arrow-right');
    const energyTimerText = document.getElementById('energy-timer');
    const prismStoneCounter = document.getElementById('void-stone-counter');

    // --- MINING DOM ELEMENTS ---
    const miningModal = document.getElementById('mining-modal');
    const openMiningButton = document.getElementById('scroll-mining-button');
    const closeMiningButton = document.getElementById('close-mining-button');
    const miningTotalPphDisplay = document.getElementById('mining-total-pph-display');
    const miningSiloTimer = document.getElementById('mining-silo-timer');
    const siloCapacityBarInner = document.getElementById('silo-capacity-bar-inner');
    const siloAmountText = document.getElementById('silo-amount-text');
    const btnClaimSilo = document.getElementById('btn-claim-silo');
    const miningSiloClickArea = document.getElementById('mining-silo-click-area');

    // Upgrade Panel Elements
    const miningUpgradePanel = document.getElementById('mining-upgrade-panel');
    const upgradeName = document.getElementById('upgrade-name');
    const upgradeLevelLabel = document.getElementById('upgrade-level-label');
    const upgradePphPreview = document.getElementById('upgrade-pph-preview');
    const upgradeCostDisplay = document.getElementById('upgrade-cost-display');
    const btnBuyMiningUpgrade = document.getElementById('btn-buy-mining-upgrade');

    window.isGameDirty = false;
    let isTransitioning = false;
    let combatMode = null;
    let isLimitBreakQueued = false;
    let currentMiningSelection = null;

    // --- COMBAT LOOP VARIABLES ---
    let combatLoopId = null;
    let lastFrameTime = 0;
    let combatTimer = 0;
    const COMBAT_RATE = 1000;
    const MAX_LAG_CATCHUP = 3000;
    let isPlayerTurn = true;
    let combatSpeedMultiplier = 1.0;
    const BASE_COMBAT_RATE = 1000;
    let modalStack = [];

    // --- GAME STATE ---
    if (!window.gameState) {
        window.gameState = {
            /// --- DUNGEONS ---
            inDungeon: false,

            // --- CURRENCIES ---
            dust: 0,
            gemShards: 0,
            prismStones: 0,
            reelTickets: 0,

            // --- SYSTEM VARS ---
            lastLoginDate: null,
            loginStreak: 0,
            checksum: null,
            lastSavedTimestamp: Date.now(),
            globalLevel: 1,
            globalExp: 0,

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
            mimicLastFeedDate: null,

            // --- REFERRAL SYSTEM ---
            totalPlayTime: 0,       // Tracks minutes played
            referralQualified: false, // Has this player met the Lvl 10 requirement?
        };
    }

    let gameState = window.gameState;
    let isGameLoaded = false;

    const dailyRewards = [
        // Week 1
        { type: 'dust', amount: 5000 },
        { type: 'dust', amount: 10000 },
        { type: 'dust', amount: 15000 },
        { type: 'dust', amount: 20000 },
        { type: 'dust', amount: 25000 },
        { type: 'dust', amount: 30000 },
        { type: 'gem_shard', amount: 10, label: '10 Gem Shards' },

        // Week 2
        { type: 'dust', amount: 35000 },
        { type: 'dust', amount: 40000 },
        { type: 'dust', amount: 45000 },
        { type: 'dust', amount: 50000 },
        { type: 'dust', amount: 55000 },
        { type: 'dust', amount: 60000 },
        { type: 'gem_shard', amount: 25, label: '25 Gem Shards' },

        // Week 3
        { type: 'dust', amount: 65000 },
        { type: 'dust', amount: 70000 },
        { type: 'dust', amount: 75000 },
        { type: 'dust', amount: 80000 },
        { type: 'dust', amount: 85000 },
        { type: 'dust', amount: 90000 },
        { type: 'gem_shard', amount: 50, label: '50 Gem Shards' },

        // Week 4
        { type: 'dust', amount: 95000 },
        { type: 'dust', amount: 100000 },
        { type: 'dust', amount: 120000 },
        { type: 'dust', amount: 150000 },
        { type: 'dust', amount: 300000 },
        { type: 'dust', amount: 500000 },
        { type: 'gem_shard', amount: 100, label: '100 Gem Shards' },
    ];

    let particleSpawnInterval = null;
    const CHECKSUM_SALT = "v9#zLp!2&Xq@9mK$5nB*7wR#4sY^8tF@1";

    // --- HELPER FUNCTIONS ---

    function createOfflineOverlay() {
        if (document.getElementById('offline-lock-overlay')) return document.getElementById('offline-lock-overlay');

        const overlay = document.createElement('div');
        overlay.id = 'offline-lock-overlay';

        // Styles to block EVERYTHING
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-color: rgba(0, 0, 0, 0.95); z-index: 99999;
            display: none; flex-direction: column; justify-content: center; align-items: center;
            color: #fff; font-family: Arial, sans-serif; text-align: center;
        `;

        overlay.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 20px;">📡</div>
            <h2 style="color: #ff5555; margin-bottom: 10px;">CONNECTION LOST</h2>
            <p style="color: #ccc; max-width: 80%;">
                This game requires an active internet connection for security verification.
            </p>
            <div class="loader" style="margin-top: 20px; border: 4px solid #333; border-top: 4px solid #fff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;

        document.body.appendChild(overlay);
        return overlay;
    }

    const offlineOverlay = createOfflineOverlay();
    let isOffline = false;

    function handleConnectionChange() {
        // 1. Check browser status
        const browserOnline = navigator.onLine;

        if (!browserOnline) {
            goOffline("No Internet Connection");
        } else {
            // 2. Double check with a real ping
            checkRealConnection();
        }
    }

    async function checkRealConnection() {
        try {
            // Updated: Ping your own index path on GitHub
            // Method 'HEAD' means "Just check headers, don't download the whole page" (Fast)
            const response = await fetch('./?' + Date.now(), {
                method: 'HEAD',
                cache: 'no-store'
            });

            // If the fetch didn't crash, we are online!
            goOnline();
        } catch (e) {
            // If the fetch failed (network error), we are offline.
            goOffline("Server Unreachable");
        }
    }

    function goOffline(reason) {
        if (isOffline) return;
        isOffline = true;
        console.log(`[Network] Going Offline: ${reason}`);

        // Show the blocker
        if (offlineOverlay) offlineOverlay.style.display = 'flex';

        // PAUSE THE GAME LOOPS
        if (combatLoopId) {
            cancelAnimationFrame(combatLoopId);
            combatLoopId = null;
        }
    }

    function goOnline() {
        if (!isOffline) return;
        isOffline = false;
        console.log(`[Network] Back Online`);

        // Hide the blocker
        if (offlineOverlay) offlineOverlay.style.display = 'none';

        // RESUME THE GAME
        if (combatMode) {
            startCombatLoop();
        }

        // Force a save immediately to sync state
        saveGame();
    }

    // Listeners
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    // Check immediately on load
    handleConnectionChange();

    // Heartbeat: Check every 10 seconds
    setInterval(handleConnectionChange, 10000);

    const cyrb53 = function (str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    };

    function fitMiningToScreen() {
        const panel = document.querySelector('.mining-panel');
        if (!panel) return;
        panel.style.transform = 'scale(1)';
        const screenHeight = window.innerHeight;
        const panelHeight = panel.offsetHeight;
        const padding = 40;
        if (panelHeight + padding > screenHeight) {
            const scale = screenHeight / (panelHeight + padding);
            panel.style.transform = `scale(${scale})`;
        } else {
            panel.style.transform = 'scale(1)';
        }
    }

    window.addEventListener('resize', () => {
        if (!document.getElementById('mining-modal').classList.contains('hidden')) {
            fitMiningToScreen();
        }
    });

    function spawnBossConfetti() {
        const container = document.createElement('div');
        container.className = 'fullscreen-confetti-container';
        document.body.appendChild(container);
        for (let i = 0; i < 50; i++) {
            const paper = document.createElement('div');
            paper.className = 'falling-confetti';
            paper.style.left = Math.random() * 100 + 'vw';
            paper.style.backgroundColor = ['#FFD700', '#C0C0C0', '#FF69B4', '#00BFFF'][Math.floor(Math.random() * 4)];
            paper.style.animationDelay = (Math.random() * 1.5) + 's';
            paper.style.setProperty('--sway', (Math.random() - 0.5) * 200 + 'px');

            container.appendChild(paper);
        }

        setTimeout(() => container.remove(), 3500);
    }

    function grantGlobalExp(amount) {
        gameState.globalExp += amount;

        let bracket = Math.ceil(gameState.globalLevel / 10);
        let multiplier = Math.min(100, bracket * 10);
        let xpNeeded = gameState.globalLevel * multiplier;

        while (gameState.globalExp >= xpNeeded) {
            gameState.globalExp -= xpNeeded;
            gameState.globalLevel++;

            recalculateHeroStats(gameState.globalLevel);
            HERO_STATE.energy += HERO_STATE.maxEnergy;
            spawnIconTextAtElement(
                'player-info',
                '<span style="font-size:24px; text-shadow:0 0 5px #000;">Level Up!</span>',
                '#FFD700',
                2500,
                false
            );

            if (window.Telegram) tg.HapticFeedback.notificationOccurred('success');

            bracket = Math.ceil(gameState.globalLevel / 10);
            multiplier = Math.min(100, bracket * 10);
            xpNeeded = gameState.globalLevel * multiplier;
        }

        const playerLevelEl = document.getElementById('player-level');
        if (playerLevelEl) playerLevelEl.innerText = `Lv. ${gameState.globalLevel}`;

        updateUI();
    }

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

    function triggerScreenShake(intensity = 'heavy', targetId = null) {
        const container = targetId
            ? document.getElementById(targetId)
            : document.querySelector('.game-container');
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
        // Select Critical Data Only to prevent lag
        const criticalData = [
            Math.floor(state.dust || 0),
            Math.floor(state.gemShards || 0),
            state.globalLevel || 1,
            state.blackjack_level || 0,
            state.mimicStage || 1,
            // Deep properties need safety checks
            (state.hero ? state.hero.level : 1),
            (state.dungeon ? state.dungeon.floor : 1),
            // Add Inventory counts (prevents item injection)
            (state.hero && state.hero.gearInventory ? state.hero.gearInventory.length : 0)
        ];

        // Convert to a stable string with a separator
        const dataString = criticalData.join('|');

        // Hash it with Salt
        const hash1 = cyrb53(dataString, 12345);
        const hash2 = cyrb53(dataString + CHECKSUM_SALT, 67890);

        return `${hash1.toString(16)}-${hash2.toString(16)}`;
    }

    function formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
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

    // --- MINING SYSTEM LOGIC ---

    function updateMiningUI() {
        if (miningModal.classList.contains('hidden')) return;
        const miningState = getMiningState();
        const totalPPH = getTotalPPH();
        miningTotalPphDisplay.innerText = `${formatNumber(totalPPH)}/hr`;
        const currentMined = getMinedAmount();
        const capacity = getSiloCapacity();
        const percentFull = Math.min(100, (currentMined / capacity) * 100);
        siloCapacityBarInner.style.width = `${percentFull}%`;
        const siloBadge = document.getElementById('silo-level-badge');
        if (siloBadge) {
            siloBadge.innerText = `Lv.${miningState.siloLevel}`;
        }
        const centerContainer = document.querySelector('.mining-center-silo');
        if (centerContainer) {
            if (currentMiningSelection === 'silo') {
                centerContainer.classList.add('selected');
            } else {
                centerContainer.classList.remove('selected');
            }
        }
        const siloImg = document.getElementById('mining-silo-image');
        if (siloImg) {
            siloImg.classList.remove('silo-glow-low', 'silo-glow-med', 'silo-glow-full');
            if (percentFull >= 100) {
                siloImg.classList.add('silo-glow-full');
            } else if (percentFull >= 50) {
                siloImg.classList.add('silo-glow-med');
            } else {
                siloImg.classList.add('silo-glow-low');
            }
        }
        siloAmountText.innerText = `${formatNumber(currentMined)} / ${formatNumber(capacity)}`;
        if (currentMined >= capacity) {
            miningSiloTimer.innerText = "FULL";
            miningSiloTimer.style.color = "#ff5555";
        } else {
            const pph = getTotalPPH();
            if (pph > 0) {
                const remaining = capacity - currentMined;
                const hoursLeft = remaining / pph;
                const minutesLeft = Math.floor(hoursLeft * 60);
                const h = Math.floor(minutesLeft / 60);
                const m = minutesLeft % 60;
                miningSiloTimer.innerText = `${h}h ${m}m`;
                miningSiloTimer.style.color = "#fff";
            } else {
                miningSiloTimer.innerText = "Active";
            }
        }

        document.querySelectorAll('.mining-slot').forEach(slot => {
            const id = parseInt(slot.dataset.id);
            if (!id) return;
            const level = getItemLevel(id);
            const unlocked = isItemUnlocked(id);
            const badge = slot.querySelector('.mining-lvl-badge');
            const itemData = MINING_ITEMS.find(i => i.id === id);
            let labelEl = slot.querySelector('.mining-slot-label');
            if (!labelEl && itemData) {
                labelEl = document.createElement('div');
                labelEl.className = 'mining-slot-label';
                labelEl.innerText = itemData.name;
                slot.appendChild(labelEl);
            }
            const imgEl = slot.querySelector('img');
            if (imgEl) {
                imgEl.classList.remove('anim-swing', 'anim-bob', 'anim-breathe', 'anim-pulse-red', 'anim-rock', 'anim-spin', 'anim-shake', 'anim-float-glow', 'anim-pulse-glow');
                if (unlocked) {
                    if (id === 1) imgEl.classList.add('anim-swing');
                    if (id === 2) imgEl.classList.add('anim-bob');
                    if (id === 3) imgEl.classList.add('anim-breathe');
                    if (id === 4) imgEl.classList.add('anim-pulse-red');
                    if (id === 5) imgEl.classList.add('anim-rock');
                    if (id === 6) imgEl.classList.add('anim-pulse-glow');
                    if (id === 7) imgEl.classList.add('anim-shake');
                    if (id === 8) imgEl.classList.add('anim-float-glow');
                }
            }
            if (!unlocked) {
                slot.classList.add('locked');
                badge.innerText = "Locked";
                if (labelEl) labelEl.style.display = 'none';
            } else {
                slot.classList.remove('locked');
                badge.innerText = `Lv.${level}`;
                if (labelEl) labelEl.style.display = 'block';
            }
            if (currentMiningSelection === id) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });

        miningUpgradePanel.classList.remove('hidden');

        if (currentMiningSelection) {
            if (miningUpgradePanel.querySelector('.upgrade-placeholder-text')) {
                miningUpgradePanel.querySelector('.upgrade-placeholder-text').remove();
            }
            Array.from(miningUpgradePanel.children).forEach(child => child.style.display = 'flex');
            updateUpgradePanel();
        } else {
            Array.from(miningUpgradePanel.children).forEach(child => child.style.display = 'none');
            let placeholder = miningUpgradePanel.querySelector('.upgrade-placeholder-text');
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'upgrade-placeholder-text';
                placeholder.innerText = "SELECT A FACILITY TO UPGRADE";
                miningUpgradePanel.appendChild(placeholder);
            }
            placeholder.style.display = 'block';
        }

        const cooldownMs = getClaimCooldown();

        if (cooldownMs > 0) {
            // CASE 1: COOLDOWN ACTIVE (Real-time Timer)
            const totalSeconds = Math.ceil(cooldownMs / 1000);
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            const timeString = `${m}:${s.toString().padStart(2, '0')}`; // Format: 59:05

            btnClaimSilo.disabled = true;
            btnClaimSilo.querySelector('span').innerText = timeString;
            btnClaimSilo.style.filter = "grayscale(100%)";
            btnClaimSilo.style.opacity = "0.7";
        }
        else if (currentMined > 0) {
            // CASE 2: READY TO CLAIM
            btnClaimSilo.disabled = false;
            btnClaimSilo.querySelector('span').innerText = "CLAIM";
            btnClaimSilo.style.filter = "none";
            btnClaimSilo.style.opacity = "1";
        }
        else {
            // CASE 3: EMPTY
            btnClaimSilo.disabled = true;
            btnClaimSilo.querySelector('span').innerText = "EMPTY";
            btnClaimSilo.style.filter = "grayscale(100%)";
            btnClaimSilo.style.opacity = "0.7";
        }
    }

    function updateUpgradePanel() {
        const MAX_ITEM_LEVEL = 50;
        const MAX_SILO_LEVEL = 5;
        if (currentMiningSelection === 'silo') {
            const currentLvl = getMiningState().siloLevel;
            const nextLvl = currentLvl + 1;
            upgradeName.innerText = "Mining Site";
            const statLabel = document.getElementById('upgrade-stat-label');
            if (statLabel) statLabel.innerText = "CAPACITY";
            if (currentLvl >= MAX_SILO_LEVEL) {
                upgradeLevelLabel.innerText = "MAX LEVEL";
                upgradeLevelLabel.style.color = "#ffd700";
                const currentData = SILO_LEVELS.find(s => s.level === currentLvl);
                upgradePphPreview.innerHTML = `<span style="font-size:16px; color:#fff;">${currentData.hours} Hours</span>`;
                upgradeCostDisplay.innerText = "---";
                btnBuyMiningUpgrade.disabled = true;
                btnBuyMiningUpgrade.querySelector('span').innerText = "MAXED OUT";
            } else {
                const nextData = SILO_LEVELS.find(s => s.level === nextLvl);
                const currentData = SILO_LEVELS.find(s => s.level === currentLvl);
                upgradeLevelLabel.innerText = `Level ${currentLvl} ➜ ${nextLvl}`;
                upgradeLevelLabel.style.color = "#ccc";
                upgradePphPreview.innerHTML = `
                    <span style="font-size:11px; color:#aaa;">${currentData.hours}h</span> 
                    <span style="color:#666; margin:0 4px;">➜</span> 
                    <span style="font-size:16px; color:#00ffff; font-weight:bold;">${nextData.hours}h Cap</span>
                `;
                upgradeCostDisplay.innerText = formatNumber(nextData.cost);
                const canAfford = window.gameState.dust >= nextData.cost;
                btnBuyMiningUpgrade.disabled = !canAfford;
                btnBuyMiningUpgrade.querySelector('span').innerText = "UPGRADE";
            }
            return;
        }
        const item = MINING_ITEMS.find(i => i.id === currentMiningSelection);
        if (!item) return;
        const level = getItemLevel(item.id);
        upgradeName.innerText = item.name;
        const statLabel = document.getElementById('upgrade-stat-label');
        if (statLabel) statLabel.innerText = "PPH";
        if (level >= MAX_ITEM_LEVEL) {
            upgradeLevelLabel.innerText = "MAX LEVEL (50)";
            upgradeLevelLabel.style.color = "#ffd700";
            const currentPPH = calculatePPH(item.id, level);
            upgradePphPreview.innerHTML = `<span style="font-size:16px; color:#fff;">${formatNumber(currentPPH)} PPH</span>`;
            upgradeCostDisplay.innerText = "---";
            btnBuyMiningUpgrade.disabled = true;
            btnBuyMiningUpgrade.querySelector('span').innerText = "MAXED OUT";
        } else {
            const cost = getNextCost(item.id);
            const currentPPH = calculatePPH(item.id, level);
            const nextPPH = calculatePPH(item.id, level + 1);
            upgradeLevelLabel.innerText = `Level ${level} ➜ ${level + 1}`;
            upgradeLevelLabel.style.color = "#ccc";
            upgradePphPreview.innerHTML = `
                <span style="font-size:11px; color:#aaa;">${formatNumber(currentPPH)}</span> 
                <span style="color:#666; margin:0 4px;">➜</span> 
                <span style="font-size:16px; color:#2ecc71; font-weight:bold;">${formatNumber(nextPPH)}</span>
            `;
            upgradeCostDisplay.innerText = formatNumber(cost);
            const canAfford = window.gameState.dust >= cost;
            btnBuyMiningUpgrade.disabled = !canAfford;
            btnBuyMiningUpgrade.querySelector('span').innerText = "UPGRADE";
        }
    }

    function selectMiningItem(id) {
        if (typeof id === 'number' && !isItemUnlocked(id)) {
            if (window.Telegram) tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        currentMiningSelection = id;
        updateMiningUI();
        if (window.Telegram) tg.HapticFeedback.impactOccurred('light');
    }

    function handleMiningPurchase() {
        let success = false;
        if (currentMiningSelection === 'silo') {
            success = buySiloUpgrade();
        } else {
            success = buyMiningUpgrade(currentMiningSelection);
        }

        if (success) {
            spawnFloatingText("UPGRADED!", "#00ffff", 50, 50, 'mining-modal');
            updateMiningUI();
            updateUI();
            if (window.Telegram) tg.HapticFeedback.notificationOccurred('success');
        } else {
            if (window.Telegram) tg.HapticFeedback.notificationOccurred('error');
        }
    }

    function executeLimitBreakSequence() {
        HERO_STATE.limitGauge = 0;
        isLimitBreakQueued = false;
        updateUI();
        if (combatLoopId) cancelAnimationFrame(combatLoopId);
        const container = document.querySelector('.game-container');
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'flash-overlay';
        document.body.appendChild(flashOverlay);
        if (container) {
            container.classList.remove('shake-heavy');
            void container.offsetWidth;
            container.classList.add('shake-heavy');
            setTimeout(() => {
                container.classList.remove('shake-heavy');
            }, 500);
        }
        const baseDmg = HERO_STATE.baseAttack * 10;
        const monsterDef = DUNGEON_STATE.defense || 0;
        const actualDamage = Math.max(0, baseDmg - monsterDef);
        const isDead = hitMonster(actualDamage);
        spawnFloatingText(`LIMIT BREAK! -${actualDamage}`, '#ff00ff', 30, 50, 'click-effect-container');
        setTimeout(() => flashOverlay.remove(), 200);
        if (window.saveGameGlobal) window.saveGameGlobal();
        setTimeout(() => {
            const healAmount = Math.floor(HERO_STATE.maxHP * 0.5);
            HERO_STATE.currentHP = Math.min(HERO_STATE.maxHP, HERO_STATE.currentHP + healAmount);
            spawnFloatingText(`+${formatNumber(healAmount)} HP`, '#2ecc71', 50, 50, 'hero-effect-container');
            updateUI();
            setTimeout(() => {
                if (combatMode === 'manual_break') {
                    combatMode = null;
                    updateControlButtons();
                }

                if (isDead) {
                    handleMonsterDeath();
                    isPlayerTurn = true;
                    combatLoopId = requestAnimationFrame(performCombatStep);
                } else {
                    isPlayerTurn = false;
                    combatLoopId = requestAnimationFrame(performCombatStep);
                }

            }, 500);
        }, 500);
    }

    function spawnIconTextAtElement(elementId, htmlContent, color, duration = 1500, moveUp = true) {
        // --- 1. NEW CHECK: Stop text if Minigames are open ---
        const reelScreen = document.getElementById('reel-game-screen');
        const blackjackScreen = document.getElementById('blackjack-screen');

        // If Reel Screen exists and is NOT hidden, stop here.
        if (reelScreen && !reelScreen.classList.contains('hidden')) return;

        // If Blackjack Screen exists and is NOT hidden, stop here.
        if (blackjackScreen && !blackjackScreen.classList.contains('hidden')) return;
        // -----------------------------------------------------

        const target = document.getElementById(elementId);
        if (!target) return;

        const rect = target.getBoundingClientRect();

        // Safety check: If the target is hidden (width/height is 0), don't spawn
        if (rect.width === 0 || rect.height === 0) return;

        const el = document.createElement('div');
        el.innerHTML = htmlContent;
        el.style.position = 'fixed';
        el.style.left = `${rect.left + rect.width / 2}px`;
        el.style.top = `${rect.top + rect.height / 2}px`;
        el.style.transform = 'translate(-50%, -20%) scale(0.5)';
        el.style.opacity = '0';

        // Layering (Behind modals, above game UI)
        el.style.zIndex = '95';

        el.style.pointerEvents = 'none';
        el.style.color = color;
        el.style.fontFamily = "'Lilita One', cursive";
        el.style.fontSize = '20px';
        el.style.textShadow = '0 0 3px #000, 1px 1px 2px #000';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '5px';
        el.style.whiteSpace = 'nowrap';
        el.style.willChange = 'transform, opacity';
        el.style.transition = `transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out`;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            void el.offsetWidth;
            el.style.opacity = '1';
            if (moveUp) {
                el.style.transform = 'translate(-50%, 5px) scale(1.2)';
            } else {
                el.style.transform = 'translate(-50%, -50%) scale(1.3)';
            }
        });

        setTimeout(() => {
            el.style.transition = `opacity 0.5s ease-out, transform 0.5s ease-in`;
            el.style.opacity = '0';
            el.style.transform = moveUp
                ? 'translate(-50%, -30px) scale(1.0)'
                : 'translate(-50%, -50%) scale(1.5)';
        }, duration - 500);

        setTimeout(() => {
            el.remove();
        }, duration);
    }

    function chargeLimitGauge() {
        if (HERO_STATE.limitGauge >= HERO_STATE.maxLimit) return;
        const heroLvl = HERO_STATE.level;
        const mobLvl = DUNGEON_STATE.floor;
        const gap = heroLvl - mobLvl;
        let chargeAmount = 1.0;
        if (gap >= 50) {
            chargeAmount = 0.1;
        } else if (gap >= 25) {
            chargeAmount = 0.5;
        }
        HERO_STATE.limitGauge = Math.min(HERO_STATE.maxLimit, HERO_STATE.limitGauge + chargeAmount);
        if (HERO_STATE.limitGauge >= HERO_STATE.maxLimit) {
            if (window.saveGameGlobal) window.saveGameGlobal();
        }
    }

    function startCombatLoop() {
        if (combatLoopId) cancelAnimationFrame(combatLoopId);
        lastFrameTime = performance.now();
        combatTimer = 0;
        isPlayerTurn = true;

        combatLoopId = requestAnimationFrame(performCombatStep);
    }

    function performCombatStep(currentTime) {
        combatLoopId = requestAnimationFrame(performCombatStep);
        if (!gameState.inDungeon || HERO_STATE.currentHP <= 0 || (!combatMode && isPlayerTurn) || HERO_STATE.energy <= 0) {
            if (HERO_STATE.energy <= 0 && combatMode) {
                updateUI();
            }
            return;
        }

        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        if (deltaTime > MAX_LAG_CATCHUP) {
            combatTimer = 0;
            return;
        }
        const currentCombatRate = BASE_COMBAT_RATE / combatSpeedMultiplier;
        combatTimer += deltaTime;
        while (combatTimer >= currentCombatRate) {
            if (isPlayerTurn) {
                if (isLimitBreakQueued) {
                    executeLimitBreakSequence();
                    return;
                }
                performHeroAttack();
            } else {
                performMonsterAttack();
            }
            combatTimer -= currentCombatRate;
        }
    }

    function performHeroAttack() {
        if (DUNGEON_STATE.currentHP <= 0) return;
        chargeLimitGauge();
        if (isPlayerTurn) incrementStat('totalClicks', 1);
        const baseDmg = HERO_STATE.baseAttack;
        const monsterDef = DUNGEON_STATE.defense || 0;
        const actualDamage = Math.max(0, baseDmg - monsterDef);
        const isDead = hitMonster(actualDamage);
        const dmgColor = actualDamage <= 0 ? '#aaa' : '#fff';
        const dmgText = actualDamage <= 0 ? '0' : `-${actualDamage}`;
        spawnFloatingText(dmgText, dmgColor, 40, 50, 'click-effect-container');
        if (!isDead && monsterImage) {
            monsterImage.classList.remove('monster-wobble');
            void monsterImage.offsetWidth;
            monsterImage.classList.add('monster-wobble');
            setTimeout(() => monsterImage.classList.remove('monster-wobble'), 500);
        }
        const slash = document.createElement('div');
        slash.className = 'slash-effect animate';
        const wrapper = document.querySelector('.monster-wrapper');
        if (wrapper) wrapper.appendChild(slash);
        setTimeout(() => slash.remove(), 300);
        updateUI();
        if (isDead) {
            handleMonsterDeath();
            isPlayerTurn = true;
        } else {
            isPlayerTurn = false;
        }
    }

    function performMonsterAttack() {
        if (DUNGEON_STATE.currentHP <= 0) return;
        chargeLimitGauge();
        const mobDmg = Math.max(0, DUNGEON_STATE.attack - (HERO_STATE.defense || 0));
        if (mobDmg > 0) {
            HERO_STATE.currentHP -= mobDmg;
            spawnFloatingText(`-${mobDmg}`, '#e74c3c', 50, 50, 'hero-effect-container');
            triggerScreenShake('light', 'hero-ui-wrapper');
        } else {
            spawnFloatingText("Block", '#3498db', 50, 50, 'hero-effect-container');
        }
        updateUI();
        if (HERO_STATE.currentHP <= 0) {
            HERO_STATE.currentHP = 0;
            handlePlayerDeath();
            isPlayerTurn = true;
        } else {
            isPlayerTurn = true;
        }
    }

    function spawnFloatingText(text, color, topPct, leftPct, targetId = 'click-effect-container') {
        const container = document.getElementById(targetId);
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'click-effect';
        el.innerText = text;
        el.style.color = color;
        el.style.fontSize = targetId === 'hero-effect-container' ? "20px" : "24px";
        el.style.top = `${topPct}%`;
        el.style.left = `${leftPct}%`;

        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    function handleMonsterDeath() {
        const previousCombatMode = combatMode;
        monsterImage.classList.remove('monster-die');
        void monsterImage.offsetWidth;
        monsterImage.classList.add('monster-die');
        if (HERO_STATE.energy > 0) {
            HERO_STATE.energy -= 1;
            grantGlobalExp(1);
        }

        if (HERO_STATE.energy <= 0) {
            HERO_STATE.energy = 0;
            if (combatMode) {
                combatMode = null;
                updateControlButtons();
                spawnFloatingText("OUT OF ENERGY", "#ff0000", 50, 50);
            }
        }

        const currentFloor = DUNGEON_STATE.floor;
        const isBoss = (currentFloor % 10 === 0);
        const rewards = calculateRewards();
        incrementStat('totalKills', 1);
        incrementStat('totalDustEarned', rewards.dustReward);
        if (isBoss) incrementStat('totalBossKills', 1);
        gameState.dust += rewards.dustReward;
        grantHeroExp(rewards.xpReward);
        spawnIconTextAtElement(
            'dust-counter',
            `<img src="${GAME_ASSETS.iconCrystalDust}" style="width:18px; vertical-align:middle;"> +${formatNumber(rewards.dustReward)}`,
            '#87CEEB',
            2500,
            true
        );

        if (isBoss) {
            const isFirstKill = currentFloor > (HERO_STATE.maxFloor || 1);

            if (isFirstKill) {
                HERO_STATE.maxFloor = currentFloor;
                const gemsEarned = rewards.gemReward || 1;
                gameState.gemShards += gemsEarned;
                spawnFloatingText(`+${gemsEarned} Gems!`, '#e74c3c', 40, 50);
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
                    if (vGemAmt) vGemAmt.innerText = (rewards.gemReward || 1).toString();
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
            } else if (vMatCard) {
                vMatCard.classList.add('hidden');
            }

            spawnBossConfetti();
            if (!bossVictoryModal.querySelector('.spotlight-beam')) {
                const beamLeft = document.createElement('div');
                beamLeft.className = 'spotlight-beam spotlight-left';
                const beamRight = document.createElement('div');
                beamRight.className = 'spotlight-beam spotlight-right';
                const panel = bossVictoryModal.querySelector('.boss-victory-panel');
                panel.style.overflow = 'visible';
                panel.appendChild(beamLeft);
                panel.appendChild(beamRight);
            }

            bossVictoryModal.classList.remove('hidden');
            setTimeout(() => {
                if (!bossVictoryModal.classList.contains('hidden')) {
                    bossVictoryModal.classList.add('hidden');

                    // FIX: Use 'previousCombatMode' instead of 'combatMode'
                    if (previousCombatMode === 'push') {
                        nextFloor();
                    } else {
                        spawnNewMonster();
                    }
                    saveGame();
                }
            }, 3000);

        } else {
            if (rewards.loot) {
                if (!HERO_STATE.inventory[rewards.loot.id]) HERO_STATE.inventory[rewards.loot.id] = 0;
                HERO_STATE.inventory[rewards.loot.id] += rewards.loot.amount;
                let iconHTML = '';
                const itemData = MATERIAL_TIERS.find(m => m.id === rewards.loot.id);
                const hasCustomIcon = itemData && itemData.icon && GAME_ASSETS[itemData.icon];
                if (hasCustomIcon) {
                    const imgUrl = GAME_ASSETS[itemData.icon];
                    iconHTML = `<div style="
                        width: 24px; 
                        height: 24px; 
                        background-image: url('${imgUrl}'); 
                        background-size: contain; 
                        background-repeat: no-repeat; 
                        background-position: center;
                    "></div>`;
                } else {
                    let matClass = 'mat-iron';
                    const id = rewards.loot.id;
                    if (id.includes('wood')) matClass = 'mat-wood';
                    else if (id.includes('copper')) matClass = 'mat-copper';
                    else if (id.includes('silver')) matClass = 'mat-silver';
                    else if (id.includes('gold')) matClass = 'mat-gold';
                    else if (id.includes('obsidian')) matClass = 'mat-obsidian';
                    else if (id.includes('dragon') || id.includes('void')) matClass = 'mat-mythic';

                    iconHTML = `<div class="bag-item-icon ${matClass} icon-small-circle" style="width:20px; height:20px;"></div>`;
                }
                spawnIconTextAtElement(
                    'header-bag-button',
                    `${iconHTML} +${rewards.loot.amount}`,
                    '#fff',
                    2000,
                    false
                );
            }

            if (previousCombatMode === 'push') {
                nextFloor();
            } else {
                spawnNewMonster();
            }
        }
        saveGame();
    }

    function nextFloor() {
        increaseFloor();
        spawnNewMonster();
    }

    function refreshDungeonStats() {
        calculateStatsForFloor(DUNGEON_STATE.floor);
    }

    function spawnNewMonster() {
        monsterImage.classList.remove('monster-die', 'monster-invisible');
        monsterImage.classList.add('monster-appear');
        DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
        setTimeout(() => monsterImage.classList.remove('monster-appear'), 500);
        updateUI();
    }

    function handlePlayerDeath() {
        combatMode = null;
        updateControlButtons();
        combatSpeedMultiplier = 1.0;
        if (btnFast) {
            btnFast.innerText = "FAST";
            btnFast.classList.remove('active');
        }
        if (deathModal) deathModal.classList.remove('hidden');
        let timeLeft = 3;
        if (defeatCountdown) defeatCountdown.innerText = timeLeft;
        const timerId = setInterval(() => {
            timeLeft--;
            if (defeatCountdown) defeatCountdown.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerId);
                performRetreat();
            }
        }, 1000);
    }

    function performRetreat() {
        if (deathModal) deathModal.classList.add('hidden');
        HERO_STATE.currentHP = HERO_STATE.maxHP;
        const isCheckpoint = (DUNGEON_STATE.floor - 1) % 10 === 0;
        if (DUNGEON_STATE.floor > 1 && !isCheckpoint) {
            DUNGEON_STATE.floor--;
        }
        combatMode = 'farm';
        refreshDungeonStats();
        spawnNewMonster();
        updateControlButtons();
        startCombatLoop();

        if (window.Telegram) tg.HapticFeedback.notificationOccurred('warning');
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

    // --- SECURITY: ADVANCED SANITY CHECKS ---
    // --- SECURITY: THE "UNIVERSAL AUDIT" SYSTEM ---
    // CONFIGURATION: Adjust these numbers if you change game balance
    const SECURITY_LIMITS = {
        dust: {
            base_buffer: 500000000,       // 500M Free allowance (Shop/Codes/Gifts)
            per_global_level: 20000000,   // Max dust possible per hero level
            per_monster_kill: 100000,     // Max dust per kill (High tier buffer)
            per_casino_level: 100000000,  // Wealth per casino level (Blackjack/Slots)
            per_task: 10000000,           // Max dust per completed task
            per_minigame_play: 200000     // Max dust per minigame play
        },
        gems: {
            base_buffer: 250000,           // 50k Gems Free allowance
            per_global_level: 5000,       // Gems earned leveling up
            per_mimic_stage: 200,         // Gems per mimic stage
            per_achievement: 50,          // Gems per achievement
            per_task: 100,                // Gems per task
            per_boss_kill: 50             // Gems per boss kill
        }
    };

    function validateSaveData(data) {
        if (!data) return true; // New player is safe

        let isSus = false;
        const violations = [];

        // --- 1. SYSTEM INTEGRITY CHECKS ---
        if ((data.dust || 0) < 0 || (data.gemShards || 0) < 0) {
            violations.push("Negative Currency");
            isSus = true;
        }
        if (!Number.isFinite(data.dust) || !Number.isFinite(data.gemShards)) {
            violations.push("Infinite/NaN Currency");
            isSus = true;
        }

        // --- 2. PREPARE DATA ---
        const stats = data.stats || {};
        const heroLevel = data.globalLevel || 1;
        const casinoLevels = (data.blackjack_level || 0) + (data.slot_level || 0);
        const taskCount = data.claimedTasks ? data.claimedTasks.length : 0;
        const achCount = data.claimedAchievements ? data.claimedAchievements.length : 0;

        // --- 3. AUDIT CRYSTAL DUST (The Wealth Check) ---
        let maxDust = SECURITY_LIMITS.dust.base_buffer;
        maxDust += heroLevel * SECURITY_LIMITS.dust.per_global_level;
        maxDust += (stats.totalKills || 0) * SECURITY_LIMITS.dust.per_monster_kill;
        maxDust += casinoLevels * SECURITY_LIMITS.dust.per_casino_level;
        maxDust += taskCount * SECURITY_LIMITS.dust.per_task;
        maxDust += (stats.totalMinigamesPlayed || 0) * SECURITY_LIMITS.dust.per_minigame_play;
        maxDust += (stats.totalMiningUpgrades || 0) * 50000000;
        maxDust += (stats.totalCrafts || 0) * 10000000;
        maxDust += (stats.totalReelWinnings || 0) * 1.5;
        maxDust += (stats.totalDustPurchased || 0);

        if ((data.dust || 0) > (maxDust * 3)) {
            violations.push(`Extreme Wealth Audit Failed: Has ${formatNumberGlobal(data.dust)} (Limit: ${formatNumberGlobal(maxDust)})`);
            isSus = true;
        }

        // --- 4. AUDIT GEM SHARDS (The Airdrop Check) ---
        let maxGems = SECURITY_LIMITS.gems.base_buffer;
        maxGems += heroLevel * SECURITY_LIMITS.gems.per_global_level;
        maxGems += (data.mimicStage || 1) * SECURITY_LIMITS.gems.per_mimic_stage;
        maxGems += achCount * SECURITY_LIMITS.gems.per_achievement;
        maxGems += taskCount * SECURITY_LIMITS.gems.per_task;
        maxGems += (stats.totalBossKills || 0) * SECURITY_LIMITS.gems.per_boss_kill;
        maxGems += (stats.totalGemsPurchased || 0);

        if ((data.gemShards || 0) > (maxGems * 3)) {
            violations.push(`Extreme Gem Audit Failed: Has ${data.gemShards} (Limit: ${maxGems})`);
            isSus = true;
        }

        // --- 5. THE PUNISHMENT BLOCK (Scare & Snitch) ---
        if (isSus) {
            console.warn("⚠️ SECURITY ALERT: Save File Flagged ⚠️");
            console.table(violations);

            // A. THE SCARE: Show the Cheat Modal visually
            setTimeout(() => {
                const cheatModal = document.getElementById('cheat-modal');
                if (cheatModal) {
                    const msg = cheatModal.querySelector('p');
                    // Scary but vague message
                    if (msg) msg.innerHTML = "Abnormal game data detected.<br>Your account has been flagged for review.";
                    cheatModal.classList.remove('hidden');
                }
            }, 2000); // Wait 2 seconds so game loads first, then popup appears

            // B. THE SNITCH: Send report (if you have the function)
            if (typeof reportCheater === 'function') {
                reportCheater(data, violations);
            }

            // Return TRUE so they can keep playing (and we can track them)
            // Return FALSE if you want to ban them immediately
            return true;
        }

        return true; // Save File is Clean
    }

    function reportCheater(data, violations) {
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const report = {
            id: user ? user.id : "Anonymous",
            name: user ? user.username : "Unknown",
            violations: violations,
            dust: data.dust,
            gems: data.gemShards,
            time: new Date().toISOString()
        };

        // Log to console for now (Screen capture proof)
        console.error("CHEAT REPORT GENERATED:", JSON.stringify(report, null, 2));
    }

    function loadGame(onLoadComplete) {
        const tryLoadingState = (savedJSON) => {
            try {
                if (!savedJSON) return false;
                const savedState = JSON.parse(savedJSON);

                // 1. CHECKSUM CHECK (Existing)
                if (!savedState || !savedState.checksum) {
                    console.warn("Save file is missing critical data.");
                    return false;
                }
                const expectedChecksum = generateChecksum(savedState);
                if (savedState.checksum !== expectedChecksum) {
                    console.warn("Checksum mismatch. Save file is invalid.");
                    return false;
                }

                // 2. NEW: SANITY CHECK (The Logic Gate)
                if (!validateSaveData(savedState)) {
                    console.error("Sanity Check Failed! Save file contains impossible values.");
                    // Action: You can either reset the save OR load a backup
                    // For now, let's treat it as corrupt -> return false to trigger new game/backup
                    return false;
                }

                gameState = Object.assign(gameState, savedState);
                gameState.isFrenzyMode = false;
                return true;
            } catch (e) {
                console.error("Failed to parse or validate save file, it's corrupt:", e);
                return false;
            }
        };

        const applyLoadedState = (isNew) => {
            // FIX: Always call loadHeroData, defaulting to empty object if null
            // This triggers the "Fresh Start" logic in hero.js
            loadHeroData(gameState.hero || {});

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
                let timePassedInSeconds = Math.floor((now - gameState.lastSavedTimestamp) / 1000);

                if (timePassedInSeconds < -60) {
                    console.error("Future timestamp detected! Resetting offline time.");
                    timePassedInSeconds = 0;
                }

                if (timePassedInSeconds < 0) {
                    console.warn("Time Travel Detected. Resetting timestamp.");
                    timePassedInSeconds = 0;
                }

                const MAX_OFFLINE_SECONDS = 24 * 60 * 60;
                if (timePassedInSeconds > MAX_OFFLINE_SECONDS) {
                    console.log(`Capping offline time from ${timePassedInSeconds} to ${MAX_OFFLINE_SECONDS}`);
                    timePassedInSeconds = MAX_OFFLINE_SECONDS;
                }

                const energyRegenAmount = Math.floor(timePassedInSeconds / 60);
                if (energyRegenAmount > 0) {
                    HERO_STATE.energy = Math.min(HERO_STATE.energy + energyRegenAmount, HERO_STATE.maxEnergy);
                }
                if (timePassedInSeconds > 300) {
                    offlineProgressModal.classList.remove('hidden');
                }
                const minedOffline = getMinedAmount();
                if (minedOffline > 0) {
                    const welcomeTitle = document.getElementById('welcome-back-title');
                    if (welcomeTitle) {
                        const msg = document.createElement('div');
                        msg.innerHTML = `<br>Miner Collecting:<br><span style="color:#00ffff; font-size:24px;">+${formatNumber(minedOffline)} Dust</span>`;
                        msg.style.textAlign = 'center';
                        msg.style.color = '#fff';
                        welcomeTitle.parentNode.appendChild(msg);
                    }
                }
            }
            isGameLoaded = true;
            recalculateHeroStats(gameState.globalLevel);
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

    function updateUI() {
        const playerLevelEl = document.getElementById('player-level');
        if (playerLevelEl) {
            playerLevelEl.innerText = `Lv. ${gameState.globalLevel}`;
        }
        dustCounter.innerText = formatNumber(gameState.dust);
        gemShardsCounter.innerText = formatNumber(gameState.gemShards);
        if (prismStoneCounter) {
            prismStoneCounter.innerText = formatNumber(gameState.prismStones || 0);
        }
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
        heroStatsText.innerText = `ATK: ${HERO_STATE.baseAttack} | DEF: ${HERO_STATE.defense || 0}`;
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

    // --- DUNGEON NAVIGATION LOGIC ---

    const ZONE_DATA = [
        { name: "Slime Plains", start: 1, mat: "Wood" },
        { name: "Copper Canyon", start: 101, mat: "Copper" },
        { name: "Iron Fortress", start: 201, mat: "Iron" },
        { name: "Smoldering Foundry", start: 301, mat: "Steel" },
        { name: "Moonlit Ruins", start: 401, mat: "Silver" },
        { name: "Golden City", start: 501, mat: "Gold" },
        { name: "Volcanic Depths", start: 601, mat: "Obsidian" },
        { name: "Platinum Peaks", start: 701, mat: "Platinum" },
        { name: "Ancient Mines", start: 801, mat: "Mithril" },
        { name: "Sunken Temple", start: 901, mat: "Orichalcum" },
        { name: "Crystal Core", start: 1001, mat: "Adamantite" },
        { name: "Arcane Library", start: 1101, mat: "Rune" },
        { name: "Dragon's Lair", start: 1201, mat: "Dragon" },
        { name: "The Void Expanse", start: 1301, mat: "Void" },
        { name: "Celestial Throne", start: 1401, mat: "Celestial" }
    ];

    function renderDungeonList() {
        dungeonList.innerHTML = "";
        if (dungeonBackButton) dungeonBackButton.classList.add('hidden');
        if (closeDungeonButton) closeDungeonButton.classList.remove('hidden');
        if (dungeonTitle) dungeonTitle.innerText = "WORLD MAP";
        if (dungeonBackButton) dungeonBackButton.onclick = null;
        const currentMax = HERO_STATE.maxFloor || 1;
        ZONE_DATA.forEach((zone, index) => {
            const isLocked = currentMax < zone.start;
            const btn = document.createElement('button');
            btn.className = `stage-btn ${isLocked ? 'locked' : ''}`;
            btn.disabled = isLocked;
            const lockIcon = isLocked ? '<div class="lock-icon">🔒</div>' : '';
            const arrowIcon = isLocked ? '' : '<div style="font-size:20px; color:#aaa; font-weight:bold;">▶</div>';
            btn.innerHTML = `
                ${lockIcon}
                <div class="stage-info">
                    <span class="stage-title">${zone.name}</span>
                    <span class="stage-range">Area ${index + 1} • Level ${zone.start}-${zone.start + 99}</span>
                    <span style="font-size:10px; color:#aaa;">Drop: ${zone.mat}</span>
                </div>
                ${arrowIcon}
            `;

            if (!isLocked) {
                btn.addEventListener('click', () => {
                    renderFloorBrackets(zone);
                });
            }
            dungeonList.appendChild(btn);
        });
    }

    function renderFloorBrackets(zone) {
        dungeonList.innerHTML = "";
        if (dungeonTitle) dungeonTitle.innerText = zone.name.toUpperCase();
        if (dungeonBackButton) dungeonBackButton.classList.remove('hidden');
        if (closeDungeonButton) closeDungeonButton.classList.add('hidden');

        if (dungeonBackButton) {
            dungeonBackButton.onclick = () => {
                renderDungeonList();
            };
        }
        const currentMax = HERO_STATE.maxFloor || 1;
        for (let i = 0; i < 10; i++) {
            const bracketStart = zone.start + (i * 10);
            const bracketEnd = bracketStart + 9;
            const isLocked = currentMax < (bracketStart - 1);
            const btn = document.createElement('button');
            btn.className = `stage-btn ${isLocked ? 'locked' : ''}`;
            btn.disabled = isLocked;
            const lockIcon = isLocked ? '<div class="lock-icon">🔒</div>' : '';
            const costDisplay = '';
            let statusText = isLocked
                ? '<span class="stage-range">Locked</span>'
                : '<span class="stage-range" style="color:#2ecc71; font-weight:bold;">Ready</span>';
            btn.innerHTML = `
                ${lockIcon}
                <div class="stage-info">
                    <span class="stage-title">Level ${bracketStart} - ${bracketEnd}</span>
                    ${statusText}
                </div>
                ${costDisplay}
            `;

            if (!isLocked) {
                btn.addEventListener('click', () => {
                    enterStage(bracketStart);
                });
            }
            dungeonList.appendChild(btn);
        }
    }

    function enterStage(startFloor) {
        if (isTransitioning) return;
        combatMode = null;
        updateControlButtons();
        DUNGEON_STATE.floor = startFloor;
        calculateStatsForFloor(startFloor);
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

        // --- 1. PREPARE MATERIALS ---
        const inventory = HERO_STATE.inventory || {};
        const myMaterials = [];
        MATERIAL_TIERS.forEach(tier => {
            const qty = inventory[tier.id];
            if (qty > 0) {
                myMaterials.push({ ...tier, qty: qty });
            }
        });

        // --- 2. PREPARE & GROUP GEAR ---
        const groupedGear = {};

        HERO_STATE.gearInventory.forEach(instance => {
            const groupKey = `${instance.id}_${instance.level}`;
            if (!groupedGear[groupKey]) {
                groupedGear[groupKey] = {
                    id: instance.id,
                    level: instance.level,
                    count: 0,
                    instance: instance
                };
            }
            groupedGear[groupKey].count++;
        });

        const gearArray = Object.values(groupedGear);
        const myWeapons = gearArray.filter(g => WEAPON_DB.some(w => w.id === g.id));
        const myArmor = gearArray.filter(g => ARMOR_DB.some(a => a.id === g.id));

        const getTier = (id, db) => { const i = db.find(x => x.id === id); return i ? i.tier : 0; };
        myWeapons.sort((a, b) => getTier(b.id, WEAPON_DB) - getTier(a.id, WEAPON_DB));
        myArmor.sort((a, b) => getTier(b.id, ARMOR_DB) - getTier(a.id, ARMOR_DB));

        // --- RENDER FUNCTION ---
        function renderSection(title, items, type) {
            if (items.length === 0) return;
            const titleEl = document.createElement('div');
            titleEl.className = 'bag-section-title';
            titleEl.innerText = title;
            bagGrid.appendChild(titleEl);

            const gridEl = document.createElement('div');
            gridEl.className = 'bag-section-grid';

            items.forEach(group => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'bag-item';

                // Lookup Info
                let dbItem;
                if (type === 'weapon') dbItem = WEAPON_DB.find(x => x.id === group.id);
                else if (type === 'armor') dbItem = ARMOR_DB.find(x => x.id === group.id);
                else dbItem = group;

                const itemName = dbItem ? dbItem.name : "Unknown";

                // --- VISUAL FIX: MATCH SMITHY SIZING ---
                // We force the specific style string here to ensure it "contains" correctly
                let iconUrl = GAME_ASSETS.iconCrystalDust; // Fallback
                if (dbItem.icon && GAME_ASSETS[dbItem.icon]) {
                    iconUrl = GAME_ASSETS[dbItem.icon];
                }

                // Explicit styling to match Smithy (54px, contain, center)
                const iconStyle = `
                    width: 54px; 
                    height: 54px; 
                    background-image: url('${iconUrl}'); 
                    background-size: contain; 
                    background-repeat: no-repeat; 
                    background-position: center;
                    margin-bottom: 2px;
                `;

                const iconHTML = `<div class="bag-item-icon" style="${iconStyle}"></div>`;

                // Labels & Counts
                let countHTML = '';
                let levelHTML = '';

                if (type === 'material') {
                    countHTML = `<span class="bag-item-count">${formatNumber(group.qty)}</span>`;
                } else {
                    if (group.level > 0) levelHTML = `<span style="color:#2ecc71; font-size:10px; font-weight:bold; position:absolute; top:4px; left:4px; text-shadow:1px 1px 0 #000;">+${group.level}</span>`;
                    if (group.count > 1) countHTML = `<span class="bag-item-count">x${group.count}</span>`;
                }

                itemDiv.innerHTML = `${levelHTML}${iconHTML}<span class="bag-item-name">${itemName}</span>${countHTML}`;

                itemDiv.addEventListener('click', () => {
                    const nameDisplay = document.createElement('div');
                    nameDisplay.className = 'click-effect';
                    nameDisplay.innerText = itemName;
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
            const timePassed = now - HERO_STATE.lastRegenTime;
            const timeRemaining = Math.max(0, REGEN_COOLDOWN - timePassed);
            const secondsLeft = Math.ceil(timeRemaining / 1000);
            if (energyTimerText) {
                const secStr = secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft;
                energyTimerText.innerText = `Refilling 1 Energy in 0:${secStr}`;
                energyTimerText.style.color = "#FFD700";
            }
            if (heroEnergyBar) heroEnergyBar.classList.add('refilling');
            if (timePassed >= REGEN_COOLDOWN) {
                HERO_STATE.energy++;
                HERO_STATE.lastRegenTime = now;
                updateUI();
            }
        } else {
            HERO_STATE.lastRegenTime = now;
            if (energyTimerText) {
                energyTimerText.innerText = "Energy Full";
                energyTimerText.style.color = "#888";
            }
            if (heroEnergyBar) heroEnergyBar.classList.remove('refilling');
        }
        if (!miningModal.classList.contains('hidden')) {
            updateMiningUI();
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
        saveGame();
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

    if (btnFast) {
        btnFast.addEventListener('click', () => {
            // Cycle Logic: 1.0 -> 1.5 -> 2.0 -> 3.0 -> 1.0
            if (combatSpeedMultiplier === 1.0) {
                combatSpeedMultiplier = 1.5;
                btnFast.innerText = "x1.5";
                btnFast.classList.add('active');
            } else if (combatSpeedMultiplier === 1.5) {
                combatSpeedMultiplier = 2.0;
                btnFast.innerText = "x2.0";
            } else if (combatSpeedMultiplier === 2.0) {
                combatSpeedMultiplier = 3.0;
                btnFast.innerText = "x3.0";
            } else {
                combatSpeedMultiplier = 1.0;
                btnFast.innerText = "FAST";
                btnFast.classList.remove('active');
            }

            if (window.Telegram) tg.HapticFeedback.impactOccurred('medium');
        });
    }

    if (scrollMenu && scrollLeftBtn && scrollRightBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            scrollMenu.scrollBy({ left: -150, behavior: 'smooth' });
            if (window.Telegram) tg.HapticFeedback.impactOccurred('light');
        });

        scrollRightBtn.addEventListener('click', () => {
            scrollMenu.scrollBy({ left: 150, behavior: 'smooth' });
            if (window.Telegram) tg.HapticFeedback.impactOccurred('light');
        });
    }

    // --- MINING LISTENERS ---
    if (openMiningButton) {
        openMiningButton.addEventListener('click', () => {
            updateMiningUI();
            openModal('mining-modal');
            setTimeout(fitMiningToScreen, 50);
        });
    }

    if (closeMiningButton) {
        closeMiningButton.addEventListener('click', () => {
            closeModal('mining-modal');
        });
    }

    document.querySelectorAll('.mining-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const id = parseInt(slot.dataset.id);
            if (id) selectMiningItem(id);
        });
    });

    if (miningSiloClickArea) {
        miningSiloClickArea.addEventListener('click', () => {
            currentMiningSelection = 'silo';
            updateMiningUI();
        });
    }

    if (btnClaimSilo) {
        btnClaimSilo.addEventListener('click', (e) => {
            e.stopPropagation();

            // Try to claim
            const result = claimSilo();

            if (result === -1) {
                // RESULT -1: Cooldown is active
                const cooldownMs = getClaimCooldown();
                const minutesLeft = Math.ceil(cooldownMs / 60000);

                // Show Error Feedback
                if (window.Telegram) tg.HapticFeedback.notificationOccurred('error');
                spawnFloatingText(`Wait ${minutesLeft}m`, "#ff5555", 50, 50); // Red Text

                // Force UI update to show the countdown on button immediately
                updateMiningUI();
            }
            else if (result > 0) {
                // RESULT > 0: Success
                spawnFloatingText(`+${formatNumber(result)} DUST`, "#ffd700", 50, 50);
                updateUI();
                updateMiningUI();
                if (window.Telegram) tg.HapticFeedback.notificationOccurred('success');
            }
        });
    }

    if (btnBuyMiningUpgrade) {
        btnBuyMiningUpgrade.addEventListener('click', handleMiningPurchase);
    }

    limitBarContainer.addEventListener('click', (e) => {
        if (HERO_STATE.limitGauge < HERO_STATE.maxLimit) return;
        if (isLimitBreakQueued || isTransitioning) return;
        isLimitBreakQueued = true;
        heroLimitText.innerText = "QUEUED...";
        if (window.Telegram) tg.HapticFeedback.impactOccurred('heavy');
        if (!combatMode) {
            combatMode = 'manual_break';
            startCombatLoop();
        }
    });

    if (btnAttack) {
        btnAttack.addEventListener('click', () => {
            const isBossFloor = DUNGEON_STATE.floor % 10 === 0;
            if (combatMode === 'push' && isBossFloor && DUNGEON_STATE.currentHP > 0) {
                tg.HapticFeedback.notificationOccurred('error');
                return;
            }

            if (combatMode === 'farm') {
                combatMode = null;
            } else {
                combatMode = 'farm';
                startCombatLoop();
            }
            updateControlButtons();
            tg.HapticFeedback.impactOccurred('medium');
        });
    }

    if (btnAuto) {
        btnAuto.addEventListener('click', () => {
            const isBossFloor = DUNGEON_STATE.floor % 10 === 0;
            if (combatMode === 'push' && isBossFloor && DUNGEON_STATE.currentHP > 0) {
                tg.HapticFeedback.notificationOccurred('error');
                return;
            }

            if (combatMode === 'push') {
                combatMode = null;
            } else {
                combatMode = 'push';
                startCombatLoop();
            }
            updateControlButtons();
            tg.HapticFeedback.impactOccurred('medium');
        });
    }

    if (btnSelectArea) {
        btnSelectArea.addEventListener('click', () => {
            renderDungeonList();
            dungeonModal.classList.remove('hidden');
        });
    }

    function updateControlButtons() {
        if (btnAttack) btnAttack.classList.remove('active');
        if (btnAuto) btnAuto.classList.remove('active');

        if (combatMode === 'farm') {
            if (btnAttack) btnAttack.classList.add('active');
        } else if (combatMode === 'push') {
            if (btnAuto) btnAuto.classList.add('active');
        }
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

    closeDungeonButton.addEventListener('click', () => {
        dungeonModal.classList.add('hidden');
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // Player minimized the game: Save & Sleep
            console.log("[System] Game Hidden - Pausing Engine...");
            saveGame();

            // Stop the heavy combat loop to save battery
            if (combatLoopId) {
                cancelAnimationFrame(combatLoopId);
                combatLoopId = null;
            }
        } else {
            // Player returned: Wake Up
            console.log("[System] Game Visible - Resuming...");

            // Refresh the UI to catch up on any timers (like Mining)
            if (window.refreshGameUI) window.refreshGameUI();

            // Resume combat ONLY if we were actually fighting
            if (combatMode && !combatLoopId) {
                startCombatLoop();
            }
        }
    });

    // Initialize Wallet when game starts
    initWallet();

    settingsButton.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    // Add Listener for the Wallet Button inside Settings
    const walletBtn = document.getElementById('wallet-connect-button');
    if (walletBtn) {
        // SAFETY FIX: Remove old listeners by cloning the button
        // This prevents the wallet from opening twice if the script re-runs
        const newBtn = walletBtn.cloneNode(true);
        walletBtn.parentNode.replaceChild(newBtn, walletBtn);

        newBtn.addEventListener('click', () => {
            toggleWalletConnection();
        });
    }

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
                // --- WOOD CHEAT ---
                case 'w':
                    if (!HERO_STATE.inventory['gold_ore']) HERO_STATE.inventory['gold_ore'] = 0;
                    HERO_STATE.inventory['gold_ore'] += 1000;
                    console.log('[DEV] +1000 Gold Ore');
                    spawnFloatingText("+1000 Gold Ore", "#ffd900ff", 50, 50);
                    updateUI();
                    break;

                // --- COPPER CHEAT ---
                case 'i': // 'i' for Iron/Ingot/Item (since 'c' is crystal dust)
                    if (!HERO_STATE.inventory['copper_ore']) HERO_STATE.inventory['copper_ore'] = 0;
                    HERO_STATE.inventory['copper_ore'] += 1000;
                    console.log('[DEV] +1000 Copper Ore');
                    spawnFloatingText("+1000 Copper", "#b87333", 60, 50);
                    updateUI();
                    break;

                // --- TEST 1: EARLY GAME (Floor 99) ---
                case '1':
                    console.log('[DEV] Jumping to Early Game (Floor 99)...');
                    DUNGEON_STATE.floor = 99;
                    DUNGEON_STATE.currentHP = 0; // Kill current mob to force update
                    HERO_STATE.currentHP = HERO_STATE.maxHP; // Heal Hero
                    updateUI();
                    spawnFloatingText("JUMP: FLOOR 99", "#fff", 50, 50);
                    break;

                // --- TEST 2: MID GAME (Floor 599) ---
                case '2':
                    console.log('[DEV] Jumping to Mid Game (Floor 599)...');
                    DUNGEON_STATE.floor = 599;
                    DUNGEON_STATE.currentHP = 0;

                    // Buff Hero so you don't die instantly
                    HERO_STATE.baseAttack = 8000;
                    HERO_STATE.currentHP = HERO_STATE.maxHP;

                    // Reset Max Floor so you get the "First Kill" Gem Reward
                    HERO_STATE.maxFloor = 500;

                    updateUI();
                    spawnFloatingText("JUMP: FLOOR 599", "#fff", 50, 50);
                    break;

                // --- TEST 3: END GAME (Floor 1199) ---
                case '3':
                    console.log('[DEV] Jumping to End Game (Floor 1199)...');
                    DUNGEON_STATE.floor = 1199;
                    DUNGEON_STATE.currentHP = 0;

                    // God Mode Hero
                    HERO_STATE.baseAttack = 25000;
                    HERO_STATE.currentHP = HERO_STATE.maxHP;

                    // Reset Max Floor
                    HERO_STATE.maxFloor = 1100;

                    updateUI();
                    spawnFloatingText("JUMP: FLOOR 1199", "#fff", 50, 50);
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
                    break;

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

    // --- COMRADES / REFERRAL SYSTEM LOGIC ---

    // 1. Playtime Tracker (Runs every 60 seconds)
    // This tracks how long the player has actually played the game.
    setInterval(() => {
        if (typeof gameState.totalPlayTime === 'undefined') gameState.totalPlayTime = 0;
        gameState.totalPlayTime++; // Add 1 minute

        // Save every 5 minutes just to be safe
        if (gameState.totalPlayTime % 5 === 0) window.isGameDirty = true;

        // Check if they now qualify for the reward
        checkQualification();
    }, 60000);

    // 2. Qualification Checker
    // Checks: Is Level >= 10? AND Played >= 60 Minutes?
    function checkQualification() {
        if (gameState.referralQualified) return; // Already qualified, stop checking.

        const isLevelHighEnough = gameState.globalLevel >= 10;
        const isPlayedLongEnough = (gameState.totalPlayTime || 0) >= 60; // 60 Minutes

        if (isLevelHighEnough && isPlayedLongEnough) {
            console.log("[System] Player Qualified! Sending signal to server...");

            // Get Telegram User ID
            const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
            if (user && window.api) {
                // Send the signal to Cloudflare
                window.api.qualifyPlayer(user.id);

                // Mark as done so we don't spam the server
                gameState.referralQualified = true;
                saveGame();
            }
        }
    }

    // 3. UI: Button & Modal Logic
    const btnComrades = document.getElementById('comrades-button');
    const comradesModal = document.getElementById('comrades-modal');
    const btnCloseComrades = document.getElementById('close-comrades-button');
    const btnInviteFriend = document.getElementById('invite-friend-btn');
    const comradesList = document.getElementById('comrades-list');

    if (btnComrades) {
        btnComrades.addEventListener('click', () => {
            openModal('comrades-modal'); // Uses your existing modal system
            loadComradesList();
        });
    }

    if (btnCloseComrades) {
        btnCloseComrades.addEventListener('click', () => {
            closeModal('comrades-modal');
        });
    }

    // 4. "Invite Friend" Button Logic
    if (btnInviteFriend) {
        btnInviteFriend.addEventListener('click', () => {
            const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

            // USE REAL ID inside Telegram, OR "12345" if testing on computer
            const myId = user ? user.id : "12345";

            // YOUR NEW BOT NAME (No @ symbol)
            const botUsername = "ForgeHeroBot";

            // Generate the link: t.me/ForgeHeroBot/app?startapp=ref_12345
            const shareUrl = `https://t.me/${botUsername}/app?startapp=ref_${myId}`;
            const shareText = `Play Forge Hero with me! 🛡️ Get 10,000 Dust + 10 GEMS FREE! 💎⚔️`;

            // Open the Telegram Share Screen
            const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

            if (window.Telegram?.WebApp?.openTelegramLink) {
                window.Telegram.WebApp.openTelegramLink(fullUrl);
            } else {
                window.open(fullUrl, '_blank');
            }
        });
    }

    // 5. Load & Render the Friend List (UPDATED WITH CLAIM BUTTONS)
    async function loadComradesList() {
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

        if (!user || !window.api) {
            comradesList.innerHTML = '<div style="color:#aaa; font-style:italic;">Connect via Telegram to see recruits.</div>';
            return;
        }

        comradesList.innerHTML = '<div style="color:#aaa;">Loading data...</div>';

        // Fetch from Cloudflare
        const data = await window.api.getFriendList(user.id);

        if (!data || !data.friends || data.friends.length === 0) {
            comradesList.innerHTML = '<div style="color:#666; font-style: italic; margin-top: 20px;">No recruits yet... invite a friend!</div>';
            return;
        }

        // Clear loading text
        comradesList.innerHTML = "";

        // Build the list
        data.friends.forEach((friend, index) => {
            const status = friend.status; // 'pending', 'qualified', or 'claimed'
            const shortId = friend.new_user_id.toString().slice(-4);
            const friendId = friend.new_user_id.toString();

            // Create the row container
            const div = document.createElement('div');

            // Stagger Animation (Juicy Entry)
            div.style.animation = `slideInComrade 0.3s ease-out forwards ${index * 0.1}s`;
            div.style.opacity = '0'; // Start invisible for animation

            // Base Style
            div.style.cssText = `
                display: flex; justify-content: space-between; align-items: center;
                background: linear-gradient(90deg, #222 0%, #1a1a1a 100%);
                padding: 12px; border-radius: 8px; border: 1px solid #444;
                margin-bottom: 8px; position: relative; transform: translateX(-20px);
            `;

            // --- DYNAMIC BUTTON LOGIC ---
            let buttonHTML = '';

            if (status === 'claimed') {
                // STATE 3: Already Claimed
                div.style.borderColor = '#3e8e41'; // Green Border
                buttonHTML = `
                    <button disabled style="
                        background: transparent; border: 1px solid #3e8e41; color: #3e8e41;
                        padding: 5px 10px; border-radius: 6px; font-weight: bold; font-size: 10px;
                        cursor: default; opacity: 0.7;">
                        CLAIMED ✅
                    </button>
                `;
            }
            else if (status === 'qualified') {
                // STATE 2: Ready to Claim (Golden Button)
                div.style.borderColor = '#ffd700'; // Gold Border
                div.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.1)';
                buttonHTML = `
                    <button class="claim-btn-${friendId}" style="
                        background: linear-gradient(to bottom, #f1c40f, #d35400);
                        border: 1px solid #f39c12; color: #fff; text-shadow: 1px 1px 0 #000;
                        padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 11px;
                        cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                        CLAIM REWARD 🎁
                    </button>
                `;
            }
            else {
                // STATE 1: Training (Pending)
                buttonHTML = `
                    <div style="text-align:right;">
                        <div style="font-size:10px; color:#666; font-style:italic;">Training...</div>
                        <div style="font-size:9px; color:#444;">Lvl 10 Required</div>
                    </div>
                `;
            }

            // Fill the row HTML
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="font-size:24px;">${status === 'qualified' ? '✅' : (status === 'claimed' ? '💰' : '⏳')}</div>
                    <div style="text-align:left;">
                        <div style="font-weight:bold; color:#fff; font-size:14px; font-family:'Nunito', sans-serif;">Player ...${shortId}</div>
                    </div>
                </div>
                <div>${buttonHTML}</div>
            `;

            comradesList.appendChild(div);

            // --- ATTACH CLICK LISTENER FOR CLAIM BUTTON ---
            if (status === 'qualified') {
                const btn = div.querySelector(`.claim-btn-${friendId}`);
                if (btn) {
                    btn.onclick = async () => {
                        // 1. Disable button immediately to prevent double-clicks
                        btn.disabled = true;
                        btn.innerText = "CLAIMING...";

                        // 2. Call API
                        const success = await window.api.claimReferralReward(user.id, friendId);

                        if (success) {
                            // 3. Give Rewards (10k Dust + 10 Gems)
                            gameState.dust += 10000;
                            gameState.gemShards += 10;

                            // 4. Visual Feedback
                            spawnFloatingText("+10,000 Dust!", "#00ffff", 50, 50);
                            setTimeout(() => spawnFloatingText("+10 Gems!", "#ffd700", 40, 50), 200);

                            if (window.Telegram) tg.HapticFeedback.notificationOccurred('success');

                            // 5. Update UI & Save
                            updateUI();
                            saveGame();

                            // 6. Refresh List to show "Claimed" state
                            loadComradesList();
                        } else {
                            // Reset if failed
                            btn.disabled = false;
                            btn.innerText = "TRY AGAIN";
                            if (window.Telegram) tg.HapticFeedback.notificationOccurred('error');
                        }
                    };
                }
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
            if (typeof gameState.globalLevel === 'undefined') gameState.globalLevel = 1;
            if (typeof gameState.globalExp === 'undefined') gameState.globalExp = 0;
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

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registered with scope: ', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000); // Check every hour

                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker == null) {
                        return;
                    }
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('[System] New content is available; please refresh.');
                                // Optional: Show a toast notification to the user to reload
                            } else {
                                console.log('[System] Content is cached for offline use.');
                            }
                        }
                    };
                };
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });

    // Refresh page when new SW takes control
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
    });
}