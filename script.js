// 1. IMPORT THE ASSET MAP AT THE VERY TOP
import { GAME_ASSETS } from './assets.js';
import { HERO_STATE, grantHeroExp, calculateHeroDamage, getHeroData, loadHeroData } from './hero.js';
import { DUNGEON_STATE, hitMonster, advanceFloor, rollMonsterStance, getDungeonData, loadDungeonData, refreshMonsterVisuals } from './dungeon.js';
import { MATERIAL_TIERS, WEAPON_DB, ARMOR_DB } from './items.js';

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
    const temporaryMessage = document.getElementById('temporary-message');
    const offlineProgressModal = document.getElementById('offline-progress-modal');
    const particleContainer = document.getElementById('particle-container');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const loginStreakText = document.getElementById('login-streak-text');
    const loginRewardText = document.getElementById('login-reward-text');
    const dungeonButton = document.getElementById('dungeon-button');
    const runButton = document.getElementById('run-button');
    const gameBody = document.body;
    const sceneTransition = document.getElementById('scene-transition');
    const victoryMessage = document.getElementById('victory-message');
    const lobbyStatusText = document.getElementById('lobby-status-text');
    const heroImage = document.getElementById('hero-image');
    const heroLobbyName = document.getElementById('hero-lobby-name');
    const combatActionsContainer = document.getElementById('combat-actions');
    const btnActionAttack = document.getElementById('btn-action-attack');
    const btnActionDefend = document.getElementById('btn-action-defend');
    const btnActionHeal = document.getElementById('btn-action-heal');
    const monsterIntentEl = document.getElementById('monster-intent');
    const bossVictoryModal = document.getElementById('boss-victory-modal');
    const victoryDustAmount = document.getElementById('victory-dust-amount');
    const victoryXpAmount = document.getElementById('victory-xp-amount');
    const victoryGemAmount = document.getElementById('victory-gem-amount');
    const victoryContinueBtn = document.getElementById('victory-continue-btn');
    const victoryLeaveBtn = document.getElementById('victory-leave-btn');
    const bagModal = document.getElementById('bag-modal');
    const closeBagButton = document.getElementById('close-bag-button');
    const bagGrid = document.getElementById('bag-grid');
    const headerBagButton = document.getElementById('header-bag-button');

    // --- MINI SLOT ELEMENTS ---
    const slotOverlay = document.getElementById("slot-overlay");
    const slotMachine = document.querySelector(".slot-machine");
    const slotSpinBtn = document.getElementById("slot-spin-btn");
    const slotResult = document.getElementById("slot-result");
    const slotReels = document.querySelectorAll(".symbols");

    window.isGameDirty = false;
    let isTransitioning = false;
    let slotActive = false;

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
    const slotSymbols = {
        sword: { name: 'sword', label: 'SWORD', color: '#e74c3c' }, // Red
        ulti: { name: 'ulti', label: 'ULTI', color: '#f1c40f' }, // Gold
        miss: { name: 'miss', label: 'MISS', color: '#95a5a6' }  // Grey
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

    function triggerScreenShake(intensity = 'heavy') {
        const container = document.querySelector('.game-container');
        container.classList.remove('shake-heavy', 'zoom-hit');
        void container.offsetWidth;
        container.classList.add('shake-heavy');
        if (intensity === 'critical') {
            container.classList.add('zoom-hit');
        }
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
            sl: state.swordLevel,
            al: state.armorLevel,
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
        slotSpinBtn.disabled = false;
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

    function performCombatSpin(results) {
        const [r1, r2, r3] = results;
        const s1 = slotSymbols[r1].name;
        const s2 = slotSymbols[r2].name;
        const s3 = slotSymbols[r3].name;
        let actionPower = 0;
        let outcomeText = "";
        let outcomeSymbol = "";

        if (s1 === 'miss' && s2 === 'miss' && s3 === 'miss') {
            actionPower = 0;
            outcomeText = "MISS!";
            outcomeSymbol = "Miss";
        }
        else if (s1 === 'ulti' && s2 === 'ulti' && s3 === 'ulti') {
            actionPower = 3.0;
            outcomeText = "ULTIMATE!!!";
            outcomeSymbol = "Ulti";
        }
        else if (s1 === 'sword') {
            outcomeSymbol = "Sword";
            if (s2 === 'sword') {
                if (s3 === 'sword') {
                    actionPower = 1.5;
                    outcomeText = "CRITICAL HIT!";
                } else {
                    actionPower = 1.0;
                    outcomeText = "Good Hit";
                }
            } else {
                actionPower = 0.5;
                outcomeText = "Weak Hit";
            }
        }
        else {
            actionPower = 0;
            outcomeText = "FAILED SPIN";
            outcomeSymbol = "Miss";
        }

        const baseVal = HERO_STATE.baseAttack;
        let finalValue = actionPower === 0 ? 0 : Math.floor(baseVal * actionPower);
        HERO_STATE.currentBlock = 0;
        window.combatPendingDamage = 0;
        let msg = "";
        if (gameState.combatMode === 'attack') {
            if (DUNGEON_STATE.currentStance === 'spiked') {
                finalValue = Math.floor(finalValue * 0.5);
                if (finalValue > 0) outcomeText += " (RESISTED)";
            }
            if (finalValue === 0) {
                msg = `${outcomeText}`;
            } else {
                msg = `${outcomeText}<br>-${finalValue} DMG`;
                window.combatPendingDamage = finalValue;
            }
        }
        else if (gameState.combatMode === 'defend') {
            if (finalValue === 0) {
                msg = "GUARD FAILED";
            } else {
                finalValue = Math.floor(finalValue * 1.5);
                HERO_STATE.currentBlock = finalValue;
                msg = `${outcomeText}<br>+${finalValue} BLOCK`;
            }
        }
        else if (gameState.combatMode === 'heal') {
            if (finalValue === 0) {
                msg = "HEAL FAILED";
            } else {
                HERO_STATE.currentHP = Math.min(HERO_STATE.currentHP + finalValue, HERO_STATE.maxHP);
                msg = `${outcomeText}<br>+${finalValue} HP`;
            }
        }

        slotResult.innerHTML = msg;
        slotResult.className = "slot-result show";
        if (outcomeSymbol === "Ulti") slotResult.classList.add('win');
        setTimeout(() => {
            closeSlot();
            setTimeout(() => {
                if (finalValue > 0) {
                    if (gameState.combatMode === 'attack') {
                        const isDead = hitMonster(window.combatPendingDamage);
                        const isCrit = actionPower >= 1.5;
                        triggerScreenShake(isCrit ? 'critical' : 'heavy');
                        monsterImage.classList.add('monster-hit-flash');
                        setTimeout(() => monsterImage.classList.remove('monster-hit-flash'), 250);
                        tg.HapticFeedback.impactOccurred(isCrit ? 'heavy' : 'medium');
                        const effect = document.createElement('div');
                        effect.className = 'click-effect heavy-damage';
                        effect.innerText = `-${window.combatPendingDamage}`;
                        effect.style.top = '40%'; effect.style.left = '50%';
                        clickEffectContainer.appendChild(effect);
                        setTimeout(() => effect.remove(), 1200);
                        const slash = document.createElement('div');
                        slash.className = 'slash-effect animate';
                        const wrapper = document.querySelector('.monster-wrapper');
                        if (wrapper) wrapper.appendChild(slash);
                        setTimeout(() => slash.remove(), 300);
                        if (isDead) {
                            updateUI();
                            handleMonsterDeath();
                            return;
                        }
                    }
                    else if (gameState.combatMode === 'defend') {
                        triggerScreenShake('medium');
                        const effect = document.createElement('div');
                        effect.className = 'click-effect';
                        effect.innerText = `SHIELD UP!`;
                        effect.style.color = "#3498db";
                        effect.style.fontSize = "24px";
                        effect.style.fontWeight = "bold";
                        effect.style.top = '40%'; effect.style.left = '50%';
                        clickEffectContainer.appendChild(effect);
                        setTimeout(() => effect.remove(), 1000);
                    }
                    else if (gameState.combatMode === 'heal') {
                        const effect = document.createElement('div');
                        effect.className = 'click-effect';
                        effect.innerText = `+${finalValue} HP`;
                        effect.style.color = "#2ecc71";
                        effect.style.fontSize = "24px";
                        effect.style.fontWeight = "bold";
                        effect.style.top = '40%'; effect.style.left = '50%';
                        clickEffectContainer.appendChild(effect);
                        setTimeout(() => effect.remove(), 1000);
                    }
                } else {
                    const effect = document.createElement('div');
                    effect.className = 'click-effect';
                    effect.innerText = outcomeText;
                    effect.style.color = "#aaa";
                    effect.style.top = '40%'; effect.style.left = '50%';
                    clickEffectContainer.appendChild(effect);
                    setTimeout(() => effect.remove(), 1000);
                    tg.HapticFeedback.notificationOccurred('error');
                }
                updateUI();
                setTimeout(() => {
                    monsterTurn();
                }, 1200);

            }, 150);
        }, 1200);
    }

    function monsterTurn() {
        let damage = DUNGEON_STATE.attack;

        // === 1. CHECK MONSTER STANCE BUFFS ===
        if (DUNGEON_STATE.currentStance === 'enraged') {
            damage = Math.floor(damage * 1.5);
        }

        const defense = HERO_STATE.defense || 0;
        const mitigation = 300 / (300 + defense);
        damage = Math.floor(damage * mitigation);
        if (damage < 1) damage = 1;

        // --- 2. CHECK PLAYER BLOCK ---
        if (HERO_STATE.currentBlock > 0) {
            const blocked = Math.min(damage, HERO_STATE.currentBlock);
            damage -= blocked;

            const blockEffect = document.createElement('div');
            blockEffect.className = 'click-effect';
            blockEffect.innerText = `Blocked ${blocked}!`;
            blockEffect.style.color = "#3498db";
            blockEffect.style.fontSize = "20px";
            blockEffect.style.fontWeight = "bold";
            blockEffect.style.top = '60%';
            blockEffect.style.left = '50%';
            clickEffectContainer.appendChild(blockEffect);
            setTimeout(() => blockEffect.remove(), 1000);

            HERO_STATE.currentBlock = 0;
        }

        // --- 3. APPLY DAMAGE ---
        if (damage > 0) {
            HERO_STATE.currentHP -= damage;
            const chargeAmount = damage * 0.5;
            HERO_STATE.limitGauge = Math.min(HERO_STATE.limitGauge + chargeAmount, HERO_STATE.maxLimit);
            if (HERO_STATE.limitGauge >= HERO_STATE.maxLimit) {
                tg.HapticFeedback.notificationOccurred('success');
            }

            tg.HapticFeedback.notificationOccurred('error');
            triggerScreenShake(DUNGEON_STATE.currentStance === 'enraged' ? 'heavy' : 'medium');

            const effect = document.createElement('div');
            effect.className = 'click-effect';
            effect.style.color = '#e74c3c';
            effect.style.fontWeight = "bold";
            effect.style.fontSize = DUNGEON_STATE.currentStance === 'enraged' ? "45px" : "32px";
            effect.innerText = `-${damage}`;
            effect.style.top = '75%';
            effect.style.left = '50%';
            document.body.appendChild(effect);
            setTimeout(() => effect.remove(), 1000);
        }

        // --- 4. CHECK DEATH ---
        if (HERO_STATE.currentHP <= 0) {
            HERO_STATE.currentHP = 0;
            updateUI();
            setTimeout(handlePlayerDeath, 500);
            return;
        }

        // --- 5. TELEGRAPH NEXT MOVE (CLEANED) ---
        const nextStance = rollMonsterStance();
        const intentEl = document.getElementById('monster-intent');
        const warningMsg = document.getElementById('temporary-message');

        if (intentEl) {
            intentEl.className = 'intent-badge';
            intentEl.classList.remove('aggressive', 'spiked', 'enraged');
        }

        warningMsg.classList.remove('show', 'hidden');
        warningMsg.classList.add('hidden');

        if (nextStance === 'enraged') {
            if (intentEl) { intentEl.classList.add('enraged'); intentEl.innerText = "⚠️"; }
            warningMsg.innerText = "ENEMY IS ENRAGED! DEFEND!";
            warningMsg.style.color = "#ff3333";
            warningMsg.classList.remove('hidden');
            warningMsg.classList.add('show');
            triggerScreenShake('heavy');
            tg.HapticFeedback.notificationOccurred('warning');
            setTimeout(() => warningMsg.classList.add('hidden'), 2000);
        }
        else if (nextStance === 'spiked') {
            if (intentEl) { intentEl.classList.add('spiked'); intentEl.innerText = "🛡️"; }
            warningMsg.innerText = "ENEMY RAISED SHIELDS";
            warningMsg.style.color = "#cccccc";
            warningMsg.classList.remove('hidden');
            warningMsg.classList.add('show');
            setTimeout(() => warningMsg.classList.add('hidden'), 1500);
        }
        else {
            if (intentEl) { intentEl.classList.add('aggressive'); intentEl.innerText = "⚔️"; }
        }

        updateUI();
    }

    function handleMonsterDeath() {
        const monsterImage = document.getElementById('monster-image');

        if (monsterImage.classList.contains('monster-die')) return;

        // 1. Trigger Death Animation
        monsterImage.classList.remove('monster-idle', 'monster-hit-flash');
        monsterImage.classList.add('monster-die');

        // 2. Wait for Fade Out
        setTimeout(() => {
            // Check if boss (based on previous floor count)
            const wasBoss = (DUNGEON_STATE.floor) % 10 === 0;

            // Get Rewards (Includes Loot now!)
            const rewards = advanceFloor();

            // --- APPLY REWARDS ---
            gameState.dust += rewards.dustReward;
            grantHeroExp(rewards.xpReward);

            // Handle Inventory Drop
            let lootText = "";
            if (rewards.loot) {
                // Initialize inventory slot if it doesn't exist
                if (!HERO_STATE.inventory[rewards.loot.id]) {
                    HERO_STATE.inventory[rewards.loot.id] = 0;
                }
                // Add item
                HERO_STATE.inventory[rewards.loot.id] += rewards.loot.amount;

                // Format text for display
                lootText = `<br><span style="color:#ffd700; font-size:16px;">Found: ${rewards.loot.name}!</span>`;

                // Haptic for rare loot
                tg.HapticFeedback.notificationOccurred('success');
            }

            saveGame();

            // Visual Cleanup
            monsterImage.classList.add('monster-invisible');
            monsterImage.classList.remove('monster-die');

            if (wasBoss) {
                // === BOSS VICTORY ===
                setTimeout(() => {
                    const bonusGems = 1;
                    gameState.gemShards += bonusGems;

                    bossVictoryModal.classList.remove('hidden');
                    tg.HapticFeedback.notificationOccurred('success');

                    animateValue(victoryDustAmount, 0, rewards.dustReward, 1500);
                    animateValue(victoryXpAmount, 0, rewards.xpReward, 1500);
                    animateValue(victoryGemAmount, 0, bonusGems, 500);

                    // Note: We aren't showing materials in the Boss Modal yet, 
                    // but they are added to inventory above.

                    for (let i = 0; i < 10; i++) setTimeout(spawnParticle, i * 100);
                }, 400);

            } else {
                // === STANDARD VICTORY ===

                // Update Victory Text to include LOOT
                victoryMessage.innerHTML = `VICTORY!<br>
                    <span style="font-size:20px; color:#fff;">+${formatNumber(rewards.dustReward)} Dust</span>
                    ${lootText}`; // <--- Add Loot Text Here

                victoryMessage.classList.remove('hidden');

                requestAnimationFrame(() => {
                    victoryMessage.classList.add('show');
                });

                setTimeout(() => {
                    victoryMessage.classList.remove('show');

                    setTimeout(() => {
                        victoryMessage.classList.add('hidden');
                        updateUI();

                        monsterImage.classList.remove('monster-invisible');
                        monsterImage.classList.add('monster-appear');

                        setTimeout(() => {
                            monsterImage.classList.remove('monster-appear');
                        }, 500);

                    }, 300);
                }, 2000);
            }
        }, 800);
    }

    function handlePlayerDeath() {
        deathModal.classList.remove('hidden');
        tg.HapticFeedback.notificationOccurred('error');
    }

    function saveGameIfDirty() {
        if (window.isGameDirty) {
            saveGame();
        }
    }

    function saveGame() {
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
            // 1. Load Hero Data
            if (gameState.hero) {
                loadHeroData(gameState.hero);

                // === SAFETY CHECK: FIX MISSING DATA ===
                // Even if we don't support old saves, this prevents crashes on load
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

            // 2. Load Dungeon Data
            if (gameState.dungeon) {
                loadDungeonData(gameState.dungeon);
                refreshMonsterVisuals();
                console.log("Dungeon Data Loaded:", gameState.dungeon);
            }

            gameState.inDungeon = false;
            HERO_STATE.limitGauge = 0; // Reset limit break too

            // 3. Handle Offline Progress
            if (!isNew) {
                const now = Date.now();
                const timePassedInSeconds = Math.floor((now - gameState.lastSavedTimestamp) / 1000);

                // Energy Regen
                const energyRegenAmount = Math.floor(timePassedInSeconds / 60);
                if (energyRegenAmount > 0) {
                    HERO_STATE.energy = Math.min(HERO_STATE.energy + energyRegenAmount, HERO_STATE.maxEnergy);
                }

                // Show Welcome Back if away for > 5 minutes
                if (timePassedInSeconds > 300) {
                    offlineProgressModal.classList.remove('hidden');
                }
            }

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
        dustCounter.innerText = formatNumber(gameState.dust);
        gemShardsCounter.innerText = formatNumber(gameState.gemShards);
        if (gameState.inDungeon) {
            document.body.classList.remove('home-mode');
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
            if (combatActionsContainer) combatActionsContainer.classList.remove('hidden');
            runButton.classList.remove('hidden');
        } else {
            document.body.classList.add('home-mode');
            heroLobbyName.innerText = `Warrior Lv. ${HERO_STATE.level}`;
            heroImage.style.backgroundImage = `url(${GAME_ASSETS.warrior})`;
            if (combatActionsContainer) combatActionsContainer.classList.add('hidden');
            runButton.classList.add('hidden');
            if (HERO_STATE.currentHP < HERO_STATE.maxHP) {
                dungeonButton.innerText = "REST & HEAL";
                dungeonButton.classList.add('heal-mode');
            } else {
                dungeonButton.innerText = "ENTER DUNGEON";
                dungeonButton.classList.remove('heal-mode');
            }
        }

        const xpPercent = (HERO_STATE.currentExp / HERO_STATE.expToNextLevel) * 100;
        heroXpBar.style.width = `${xpPercent}%`;
        heroXpText.innerText = `XP: ${formatNumber(HERO_STATE.currentExp)} / ${formatNumber(HERO_STATE.expToNextLevel)}`;
        heroLevelText.innerText = `Hero Lv. ${HERO_STATE.level}`;
        heroStatsText.innerText = `ATK: ${HERO_STATE.baseAttack} | CRIT: ${(HERO_STATE.critChance * 100).toFixed(0)}%`;

        if (lobbyStatusText) {
            lobbyStatusText.innerText = `HP: ${Math.ceil(HERO_STATE.currentHP)}/${HERO_STATE.maxHP} | Energy: ${Math.floor(HERO_STATE.energy)}/${HERO_STATE.maxEnergy}`;
        }

        const heroHpPercent = (HERO_STATE.currentHP / HERO_STATE.maxHP) * 100;
        heroHpBar.style.width = `${heroHpPercent}%`;
        heroHpText.innerText = `${Math.ceil(HERO_STATE.currentHP)} / ${HERO_STATE.maxHP} HP`;
        const energyPercent = (HERO_STATE.energy / HERO_STATE.maxEnergy) * 100;
        heroEnergyBar.style.width = `${energyPercent}%`;
        heroEnergyText.innerText = `${Math.floor(HERO_STATE.energy)} / ${HERO_STATE.maxEnergy} Energy`

        // === LIMIT GAUGE UI ===
        const limitPercent = (HERO_STATE.limitGauge / HERO_STATE.maxLimit) * 100;
        heroLimitBar.style.width = `${limitPercent}%`;

        const limitBarContainer = heroLimitBar.parentElement;

        if (HERO_STATE.limitGauge >= HERO_STATE.maxLimit) {
            heroLimitText.innerText = "LIMIT BREAK READY!";
            heroLimitText.classList.add('limit-ready-text');
            limitBarContainer.classList.add('limit-ready');
            if (slotSpinBtn) {
                slotSpinBtn.innerText = "LIMIT BREAK!";
                slotSpinBtn.classList.add('limit-active');
            }
        } else {
            heroLimitText.innerText = "LIMIT GAUGE";
            heroLimitText.classList.remove('limit-ready-text');
            limitBarContainer.classList.remove('limit-ready');
            if (slotSpinBtn) {
                slotSpinBtn.innerText = "SPIN";
                slotSpinBtn.classList.remove('limit-active');
            }
        }
    }

    function populateBag() {
        // 1. Reset the container class to handle vertical stacking
        bagGrid.className = 'bag-list-wrapper';
        bagGrid.innerHTML = "";

        const ownedIds = HERO_STATE.ownedItems || [];
        const inventory = HERO_STATE.inventory || {};

        // --- HELPER: RENDER SECTION ---
        function renderSection(title, items, type) {
            if (items.length === 0) return;

            // Create Title
            const titleEl = document.createElement('div');
            titleEl.className = 'bag-section-title';
            titleEl.innerText = title;
            bagGrid.appendChild(titleEl);

            // Create Grid
            const gridEl = document.createElement('div');
            gridEl.className = 'bag-section-grid';

            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'bag-item';

                let iconHTML = '';
                let countHTML = '';
                let clickName = item.name;

                // VISUAL LOGIC
                if (type === 'weapon') {
                    iconHTML = `<div class="weapon-icon" style="transform:scale(0.7)"></div>`;
                    // Optional: Show "+Level" if you want
                    const lvl = (item.id === HERO_STATE.equipment.mainHand) ? (HERO_STATE.equipmentLevels.mainHand || 0) : 0;
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

                // Click to show name
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

        // --- PREPARE DATA ---

        // 1. WEAPONS (Filter DB by Owned IDs)
        // Filter out 'rusty_sword' if you don't want to show starter gear, 
        // otherwise keep it.
        const myWeapons = WEAPON_DB.filter(w => ownedIds.includes(w.id));

        // 2. ARMOR
        const myArmor = ARMOR_DB.filter(a => ownedIds.includes(a.id));

        // 3. MATERIALS (Convert inventory object to array)
        const myMaterials = [];
        MATERIAL_TIERS.forEach(tier => {
            const qty = inventory[tier.id];
            if (qty > 0) {
                myMaterials.push({ ...tier, qty: qty });
            }
        });

        // --- RENDER ---

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

    if (headerBagButton) {
        headerBagButton.addEventListener('click', () => {
            populateBag();
            bagModal.classList.remove('hidden');
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
    });

    victoryLeaveBtn.addEventListener('click', () => {
        bossVictoryModal.classList.add('hidden');
        triggerTransition(() => {
            gameState.inDungeon = false;
            HERO_STATE.limitGauge = 0;
            saveGame();
            updateUI();
        });
    });

    dungeonButton.addEventListener('click', () => {
        if (HERO_STATE.currentHP < HERO_STATE.maxHP) {
            HERO_STATE.currentHP = HERO_STATE.maxHP;
            tg.HapticFeedback.notificationOccurred('success');
            const effect = document.createElement('div');
            effect.className = 'click-effect';
            effect.innerText = "FULL HP!";
            effect.style.color = "#00ff00";
            effect.style.top = "60%"; effect.style.left = "50%";
            clickEffectContainer.appendChild(effect);
            setTimeout(() => effect.remove(), 1000);
            updateUI();
        }
        else {
            const DUNGEON_COST = 5;
            if (HERO_STATE.energy < DUNGEON_COST) {
                tg.HapticFeedback.notificationOccurred('error');
                const warning = document.createElement('div');
                warning.className = 'click-effect';
                warning.innerText = "Need 5 Energy!";
                warning.style.color = "#FFD700";
                warning.style.fontSize = "20px";
                warning.style.fontWeight = "bold";
                warning.style.top = "55%";
                warning.style.left = "50%";
                if (clickEffectContainer) clickEffectContainer.appendChild(warning);
                else document.body.appendChild(warning);
                setTimeout(() => warning.remove(), 1500);
                heroEnergyBar.parentElement.style.transform = "translateX(-5px)";
                setTimeout(() => heroEnergyBar.parentElement.style.transform = "translateX(5px)", 50);
                setTimeout(() => heroEnergyBar.parentElement.style.transform = "none", 100);
                return;
            }

            HERO_STATE.energy -= DUNGEON_COST;
            triggerTransition(() => {
                gameState.inDungeon = true;
                updateUI();
                tg.HapticFeedback.impactOccurred('medium');
            });
        }
    });

    runButton.addEventListener('click', () => {
        triggerTransition(() => {
            DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
            HERO_STATE.limitGauge = 0;
            gameState.inDungeon = false;
            saveGame();
            updateUI();
            tg.HapticFeedback.impactOccurred('light');
        });
    });

    reviveButton.addEventListener('click', () => {
        deathModal.classList.add('hidden');
        triggerTransition(() => {
            HERO_STATE.currentHP = 1;
            DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
            HERO_STATE.limitGauge = 0;
            gameState.inDungeon = false;
            saveGame();
            updateUI();
        });
    });

    // --- COMBAT ACTIONS ---
    function handleCombatAction(mode) {
        gameState.combatMode = mode;
        window.isCombatSpin = true;
        openSlot();
        updateUI();
    }

    if (btnActionAttack) btnActionAttack.addEventListener('click', () => handleCombatAction('attack'));
    if (btnActionDefend) btnActionDefend.addEventListener('click', () => handleCombatAction('defend'));
    if (btnActionHeal) btnActionHeal.addEventListener('click', () => handleCombatAction('heal'));

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

    slotSpinBtn.addEventListener("click", () => {
        slotSpinBtn.disabled = true;
        if (!slotActive) return;
        slotReels.forEach(r => {
            populateReel(r);
            r.classList.add("spinning");
            r.style.transform = "translateY(0)";
        });

        let r1, r2, r3;
        if (HERO_STATE.limitGauge >= HERO_STATE.maxLimit) {
            console.log("LIMIT BREAK ACTIVATED!");
            r1 = 'ulti';
            r2 = 'ulti';
            r3 = 'ulti';
            HERO_STATE.limitGauge = 0;
        }
        else {
            // === STANDARD RNG LOGIC ===
            r1 = weightedSlotProbabilities[Math.floor(Math.random() * weightedSlotProbabilities.length)];

            if (r1 === 'ulti') {
                r2 = 'ulti'; r3 = 'ulti';
            } else if (r1 === 'miss') {
                r2 = 'miss'; r3 = 'miss';
            } else {
                r2 = weightedSlotProbabilities[Math.floor(Math.random() * weightedSlotProbabilities.length)];
                r3 = weightedSlotProbabilities[Math.floor(Math.random() * weightedSlotProbabilities.length)];
            }
        }

        const results = [r1, r2, r3];

        // --- TIMING (Fast) ---
        const baseDelay = 200;
        setTimeout(() => stopReel(0, 0, results[0]), baseDelay * 1);
        setTimeout(() => stopReel(1, 1, results[1]), baseDelay * 2);
        const isTension = (r1 === r2);
        const finalDelay = isTension ? (baseDelay * 4) : (baseDelay * 3);
        setTimeout(() => {
            stopReel(2, 2, results[2]);
            handleSlotResult(results);
        }, finalDelay);
    });

    function stopReel(reelIndex, stopIndex, symbolKey) {
        const reel = slotReels[reelIndex];
        reel.classList.remove("spinning");
        reel.innerHTML = "";
        const symbolData = slotSymbols[symbolKey];
        const el = document.createElement("div");
        el.classList.add("slot-symbol-text");
        el.innerText = symbolData.label;
        el.style.color = symbolData.color;
        reel.appendChild(el);

        reel.style.transform = "translateY(0)";
    }

    function handleSlotResult(results) {
        if (window.isCombatSpin) {
            window.isCombatSpin = false;
            performCombatSpin(results);
            return;
        }
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
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="${GAME_ASSETS.iconCrystalDust}" class="slot-icon-small">`;
            } else if (winningSymbolName === 'geode') {
                const dustReward = 100000;
                gameState.dust += dustReward;
                rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="${GAME_ASSETS.iconCrystalDust}" class="slot-icon-small">`;
            } else if (winningSymbolName === 'gem') {
                const gemReward = 5;
                gameState.gemShards += gemReward;
                rewardDisplayHtml = `${gemReward} <img src="${GAME_ASSETS.iconGem}" class="slot-icon-small">`;
            }
            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";
        } else {
            let dustReward = 10000;
            gameState.dust += dustReward;
            const rewardDisplayHtml = `${formatWithCommas(dustReward)} <img src="${GAME_ASSETS.iconCrystalDust}" class="slot-icon-small">`;
            slotResult.innerHTML = `You Win!<br>${rewardDisplayHtml}`;
            slotResult.className = "slot-result win";
        }
        updateUI();
        window.isGameDirty = true;
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

        setInterval(gameLoop, 1000);
        setInterval(saveGameIfDirty, 5000);
        window.addEventListener('beforeunload', saveGame);
        if (particleContainer) {
            particleSpawnInterval = setInterval(spawnParticle, 500);
        }

        console.log("Game initialized.");
        preloadImages();
        setTimeout(updateUI, 100);
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

            // --- HEAL MONSTER (Was Set Hatch Progress) ---
            case 'h':
                console.log('[DEV] Healing Monster...');
                DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
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
});