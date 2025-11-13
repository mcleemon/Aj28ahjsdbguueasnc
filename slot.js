// slot.js - v1.5.0
import { GAME_ASSETS } from './assets.js';
document.addEventListener('DOMContentLoaded', () => {

    // --- GET SHARED STATE & FUNCTIONS ---

    const gameState = window.gameState;
    const saveGame = window.saveGameGlobal;
    const formatNumber = window.formatNumberGlobal;
    const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : { HapticFeedback: { impactOccurred: () => { }, notificationOccurred: () => { } } };

    // --- GET DOM ELEMENTS ---

    const bodyEl = document.body;
    const slotScreen = document.getElementById('slot-screen');
    const slotBackButton = document.getElementById('slot-back-button');
    const slotSpinButton = document.getElementById('slot-spin-button');
    const reelColumns = document.querySelectorAll('.slot-reel-column');
    const openSlotButton = document.getElementById('scroll-slot-button');
    const slotWinDisplay = document.getElementById('slot-win-display');
    const gameContainer = document.querySelector('.game-container');
    const slotDustAmountEl = document.getElementById('slot-dust-amount');
    const slotLevelTextEl = document.getElementById('slot-level-text');
    const slotLevelBarInnerEl = document.getElementById('slot-level-bar-inner');
    const slotBetValueEl = document.getElementById('slot-bet-value');
    const slotLastWinEl = document.getElementById('slot-last-win');

    // --- SLOT CONSTANTS & DEFINITIONS (5x3) ---

    const BET_COST = 1000;
    const SYMBOL_HEIGHT = 80;
    const EXP_PER_LEVEL = 100;
    const EXP_FOR_SPIN = 1;
    const EXP_FOR_WIN = 10;

    // Payout array [3-in-a-row, 4-in-a-row, 5-in-a-row]
    const SYMBOLS = {
        SEVEN: { id: 'seven', name: "7", payout: [3000, 10000, 30000], isBar: false },
        CHERRY: { id: 'cherry', name: "🍒", payout: [1500, 5000, 7500], isBar: false },
        MONEY: { id: 'money', name: "💰", payout: [300, 1000, 3000], isBar: false },
        BELL: { id: 'bell', name: "🔔", payout: [75, 500, 1500], isBar: false },
        MELON: { id: 'melon', name: "🍉", payout: [50, 200, 600], isBar: false },
        PLUM: { id: 'plum', name: "🍑", payout: [50, 200, 600], isBar: false },
        BAR_3: { id: 'bar3', name: "BARx3", payout: [40, 150, 300], isBar: true },
        BAR_2: { id: 'bar2', name: "BARx2", payout: [30, 100, 150], isBar: true },
        BAR_1: { id: 'bar1', name: "BARx1", payout: [20, 50, 75], isBar: true },
    };

    const ANY_BAR_PAYOUT = [10, 30, 50]; // Payout for 3, 4, or 5 mixed bars

    // --- REEL STRIPS 5 ---
    const REEL_STRIPS = [
        // Reel 1
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2
        ],
        // Reel 2
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3
        ],
        // Reel 3
        [
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2
        ],
        // Reel 4
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2
        ],
        // Reel 5
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3
        ]
    ];

    const REEL_LENGTH = REEL_STRIPS[0].length; // 15

    // --- 5x3 GRID LAYOUT ---
    // [ 0] [ 1] [ 2] [ 3] [ 4]
    // [ 5] [ 6] [ 7] [ 8] [ 9]
    // [10] [11] [12] [13] [14]

    // --- PAYLINES REPLACED ---
    const PAYLINES = [
        [5, 6, 7, 8, 9], // Line 1: Middle Row
        [0, 1, 2, 3, 4], // Line 2: Top Row
        [10, 11, 12, 13, 14], // Line 3: Bottom Row
        [0, 6, 12, 8, 4], // Line 4: "V" shape
        [10, 6, 2, 8, 14], // Line 5: "A" shape
        [0, 1, 7, 13, 14], // Line 6: Zig-zag
        [10, 11, 7, 3, 4], // Line 7: Zig-zag
        [5, 1, 2, 3, 9], // Line 8: Bridge
        [5, 11, 12, 13, 9]  // Line 9: Valley
    ];

    let isSpinning = false;
    let finalReelStops = [0, 0, 0, 0, 0];
    let paylineAnimationInterval = null;
    let currentWinAnimationId = null; // Stores the requestAnimationFrame ID
    let skipWinAnimation = null;      // Stores the "skip" function

    // --- CORE FUNCTIONS ---

    function checkSlotLevelUp() {
        const currentLevel = gameState.slot_level || 1;
        const currentExp = gameState.slot_exp || 0;
        const expNeeded = currentLevel * EXP_PER_LEVEL;
        if (currentExp >= expNeeded) {
            gameState.slot_level++;
            gameState.slot_exp -= expNeeded;
            const levelUpReward = 10000 + ((gameState.slot_level - 1) * 2500);
            gameState.dust += levelUpReward;
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    function syncSlotUI() {
        if (slotDustAmountEl) {
            slotDustAmountEl.innerText = formatNumber(gameState.dust);
        }
        if (slotLevelTextEl && slotLevelBarInnerEl) {
            const level = gameState.slot_level || 1;
            const exp = gameState.slot_exp || 0;
            const expNeeded = level * EXP_PER_LEVEL;
            const expPercent = Math.max(0, Math.min(100, (exp / expNeeded) * 100));
            slotLevelTextEl.innerText = `Lv. ${level}`;
            slotLevelBarInnerEl.style.width = `${expPercent}%`;
        }
    }

    function openSlotGame() {
        if (isSpinning) return;
        if (!slotScreen || !slotSpinButton) {
            console.error("Slot elements not found!");
            return;
        }
        console.log("Opening 5x3 Slot Machine...");
        populateReels();
        bodyEl.style.backgroundImage = `url('${GAME_ASSETS.slotBackground}')`;
        gameContainer.classList.add('hidden');
        syncSlotUI();
        if (slotBetValueEl) {
            slotBetValueEl.innerText = BET_COST.toLocaleString('en-US');
        }
        if (slotLastWinEl) {
            slotLastWinEl.innerText = (gameState.slot_last_win || 0).toLocaleString('en-US');
        }
        const spinSpan = slotSpinButton.querySelector('span');
        spinSpan.innerHTML = `SPIN<br>`;
        slotScreen.classList.remove('hidden');
        slotScreen.classList.remove('closing');
    }

    function closeSlotGame() {
        if (isSpinning) return;
        bodyEl.style.backgroundImage = `url('${GAME_ASSETS.background}')`;
        gameContainer.classList.remove('hidden');
        slotScreen.classList.add('hidden');
        slotScreen.classList.remove('closing');
        if (window.refreshGameUI) {
            window.refreshGameUI();
        }
    }

    function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    function populateReels() {
        if (!reelColumns) return;
        reelColumns.forEach((column, i) => {
            const strip = column.querySelector('.slot-reel-strip');
            if (!strip) return;
            const baseStrip = REEL_STRIPS[i];
            const fullStrip = [
                ...baseStrip, ...baseStrip, ...baseStrip, ...baseStrip
            ];
            strip.innerHTML = '';
            strip.style.transition = 'none';
            const startIndex = REEL_LENGTH * 3;
            const startY = -(startIndex * SYMBOL_HEIGHT);
            strip.style.transform = `translateY(${startY}px)`;
            fullStrip.forEach(symbol => {
                const div = document.createElement('div');
                div.className = 'slot-symbol';
                const span = document.createElement('span');
                span.className = 'symbol-icon-wrapper';
                span.innerText = symbol.name;
                div.appendChild(span);
                strip.appendChild(div);
            });
        });
    }

    function stopReel(reelIndex, stopIndex) {
        const stripEl = reelColumns[reelIndex].querySelector('.slot-reel-strip');
        stripEl.classList.remove('slot-spinning');
        stripEl.style.transition = 'none';
        const landingIndex = REEL_LENGTH + stopIndex;
        const landingY = -(landingIndex * SYMBOL_HEIGHT);
        stripEl.style.transform = `translateY(${landingY}px)`;
    }

    function getWinAnimationDuration(winAmount) {
        if (winAmount <= 0) return 0;
        if (winAmount <= 100) {
            return 1000;
        } else if (winAmount <= 1000) {
            return 3000;
        } else if (winAmount <= 7500) {
            return 6000;
        } else {
            return 8000;
        }
    }

    function formatSlotWinNumber(num) {
        const iconUrl = GAME_ASSETS.iconCrystalDust;
        const numberString = num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `<img src="${iconUrl}" class="slot-win-icon" alt="Dust"> ${numberString}`;
    }

    function animateWinCounter(element, targetAmount, duration = 1500) {
        if (!element) return;
        if (currentWinAnimationId) {
            cancelAnimationFrame(currentWinAnimationId);
            currentWinAnimationId = null;
        }
        skipWinAnimation = null;
        let startTime = null;
        const startAmount = 0;
        element.innerHTML = formatSlotWinNumber(0);
        element.classList.add('visible');
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        function finishAnimation() {
            element.innerHTML = formatSlotWinNumber(targetAmount);
            element.classList.add('visible');
            currentWinAnimationId = null;
            skipWinAnimation = null;
            setTimeout(() => {
                element.classList.remove('visible');
            }, 1200);
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / duration, 1);
            let currentAmount = startAmount + (targetAmount - startAmount) * easeOut(progress);
            element.innerHTML = formatSlotWinNumber(currentAmount);
            if (progress < 1) {
                currentWinAnimationId = requestAnimationFrame(step);
            } else {
                finishAnimation();
            }
        }
        skipWinAnimation = () => {
            if (currentWinAnimationId) {
                cancelAnimationFrame(currentWinAnimationId);
            }
            finishAnimation();
        };
        currentWinAnimationId = requestAnimationFrame(step);
    }

    function highlightPayline(indices, stopResults) {
        document.querySelectorAll('.symbol-icon-wrapper.win').forEach(el => el.classList.remove('win'));
        if (!indices || !stopResults) return;
        indices.forEach(gridIndex => {
            const reelIndex = gridIndex % 5;
            const rowIndex = Math.floor(gridIndex / 5);
            const stripEl = reelColumns[reelIndex].querySelector('.slot-reel-strip');
            const stopIndex = stopResults[reelIndex];
            const domSymbolIndex = REEL_LENGTH + stopIndex + rowIndex;
            const symbolBox = stripEl.children[domSymbolIndex];
            if (symbolBox) {
                const iconWrapper = symbolBox.querySelector('.symbol-icon-wrapper');
                if (iconWrapper) {
                    iconWrapper.classList.add('win');
                }
            }
        });
    }

    function startPaylineAnimation(winningPaylines, stopResults) {
        if (paylineAnimationInterval) {
            clearInterval(paylineAnimationInterval);
        }
        if (!winningPaylines || winningPaylines.length === 0) return;
        if (winningPaylines.length === 1) {
            highlightPayline(winningPaylines[0], stopResults);
            return;
        }
        let currentLineIndex = 0;
        highlightPayline(winningPaylines[currentLineIndex], stopResults);
        currentLineIndex = 1;
        paylineAnimationInterval = setInterval(() => {
            highlightPayline(winningPaylines[currentLineIndex], stopResults);
            currentLineIndex = (currentLineIndex + 1) % winningPaylines.length;
        }, 800);
    }

    async function spinReels() {
        if (skipWinAnimation) {
            skipWinAnimation();
        }
        if (isSpinning) return;
        if (gameState.dust < BET_COST) {
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        isSpinning = true;
        slotSpinButton.disabled = true;

        if (paylineAnimationInterval) {
            clearInterval(paylineAnimationInterval);
            paylineAnimationInterval = null;
        }
        document.querySelectorAll('.symbol-icon-wrapper.win').forEach(el => el.classList.remove('win'));
        gameState.dust -= BET_COST;
        gameState.slot_exp = (gameState.slot_exp || 0) + EXP_FOR_SPIN;
        if (window.refreshGameUI) window.refreshGameUI();
        const stopResults = [
            Math.floor(Math.random() * REEL_LENGTH),
            Math.floor(Math.random() * REEL_LENGTH),
            Math.floor(Math.random() * REEL_LENGTH),
            Math.floor(Math.random() * REEL_LENGTH),
            Math.floor(Math.random() * REEL_LENGTH)
        ];
        finalReelStops = [...stopResults];
        const reelDurations = [500, 501, 502, 503, 504];
        const pauseDurations = [200, 200, 200, 200];
        for (let i = 0; i < 5; i++) {
            const stripEl = reelColumns[i].querySelector('.slot-reel-strip');
            stripEl.style.transition = 'none';
            stripEl.classList.add('slot-spinning');
        }
        await wait(reelDurations[0]); stopReel(0, stopResults[0]); tg.HapticFeedback.impactOccurred('light'); await wait(pauseDurations[0]);
        await wait(reelDurations[1]); stopReel(1, stopResults[1]); tg.HapticFeedback.impactOccurred('light'); await wait(pauseDurations[1]);
        await wait(reelDurations[2]); stopReel(2, stopResults[2]); tg.HapticFeedback.impactOccurred('medium'); await wait(pauseDurations[2]);
        await wait(reelDurations[3]); stopReel(3, stopResults[3]); tg.HapticFeedback.impactOccurred('medium'); await wait(pauseDurations[3]);
        await wait(reelDurations[4]); stopReel(4, stopResults[4]); tg.HapticFeedback.impactOccurred('heavy');
        await wait(100);
        const { totalWinnings, winningPaylines } = checkWins(stopResults);
        if (totalWinnings > 0) {
            gameState.dust += totalWinnings;
            gameState.slot_exp = (gameState.slot_exp || 0) + EXP_FOR_WIN;
            tg.HapticFeedback.notificationOccurred('success');
            if (saveGame) saveGame();
            if (window.refreshGameUI) window.refreshGameUI();
            if (slotLastWinEl) {
                slotLastWinEl.innerText = totalWinnings.toLocaleString('en-US');
            }
            gameState.slot_last_win = totalWinnings;
            startPaylineAnimation(winningPaylines, stopResults);
            const animDuration = getWinAnimationDuration(totalWinnings);
            animateWinCounter(slotWinDisplay, totalWinnings, animDuration);
        } else {
            tg.HapticFeedback.notificationOccurred('warning');
        }
        await new Promise(res => setTimeout(res, 350));
        checkSlotLevelUp();
        syncSlotUI();
        isSpinning = false;
        slotSpinButton.disabled = false;
    }

    function checkWins(stopResults) {
        let totalWinnings = 0;
        const winningPaylines = [];

        // Grid indices are row-major:
        // [ 0] [ 1] [ 2] [ 3] [ 4]
        // [ 5] [ 6] [ 7] [ 8] [ 9]
        // [10] [11] [12] [13] [14]
        const finalGrid = [];
        for (let i = 0; i < 5; i++) {
            const baseStrip = REEL_STRIPS[i];
            const rand = stopResults[i];

            const s1 = baseStrip[rand];                     // Top row
            const s2 = baseStrip[(rand + 1) % REEL_LENGTH]; // Middle row
            const s3 = baseStrip[(rand + 2) % REEL_LENGTH]; // Bottom row

            finalGrid[i + 0] = s1;  // Col i, Row 0
            finalGrid[i + 5] = s2;  // Col i, Row 1
            finalGrid[i + 10] = s3; // Col i, Row 2
        }

        for (const line of PAYLINES) {
            // line is [0, 1, 2, 3, 4] or [5, 6, 7, 8, 9] etc.
            const s1 = finalGrid[line[0]];
            const s2 = finalGrid[line[1]];
            const s3 = finalGrid[line[2]];
            const s4 = finalGrid[line[3]];
            const s5 = finalGrid[line[4]];

            let paylineWin = 0;
            let winningIndices = [];

            // Check for normal symbol wins (left-to-right)
            if (s1.id === s2.id && s2.id === s3.id && s3.id === s4.id && s4.id === s5.id) {
                // 5-of-a-kind
                paylineWin = s1.payout[2]; // 5x payout
                winningIndices = [line[0], line[1], line[2], line[3], line[4]];
            } else if (s1.id === s2.id && s2.id === s3.id && s3.id === s4.id) {
                // 4-of-a-kind
                paylineWin = s1.payout[1]; // 4x payout
                winningIndices = [line[0], line[1], line[2], line[3]];
            } else if (s1.id === s2.id && s2.id === s3.id) {
                // 3-of-a-kind
                paylineWin = s1.payout[0]; // 3x payout
                winningIndices = [line[0], line[1], line[2]];
            }

            if (paylineWin === 0) {
                if (s1.isBar && s2.isBar && s3.isBar && s4.isBar && s5.isBar) {
                    // 5 "Any Bar"
                    paylineWin = ANY_BAR_PAYOUT[2];
                    winningIndices = [line[0], line[1], line[2], line[3], line[4]];
                } else if (s1.isBar && s2.isBar && s3.isBar && s4.isBar) {
                    // 4 "Any Bar"
                    paylineWin = ANY_BAR_PAYOUT[1];
                    winningIndices = [line[0], line[1], line[2], line[3]];
                } else if (s1.isBar && s2.isBar && s3.isBar) {
                    // 3 "Any Bar"
                    paylineWin = ANY_BAR_PAYOUT[0];
                    winningIndices = [line[0], line[1], line[2]];
                }
            }

            if (paylineWin > 0) {
                totalWinnings += paylineWin;
                winningPaylines.push(winningIndices);
            }
        }

        const uniqueWinningPaylines = Array.from(new Set(winningPaylines.map(JSON.stringify)), JSON.parse);
        return { totalWinnings, winningPaylines: uniqueWinningPaylines };
    }


    // --- INITIALIZATION & LISTENERS ---
    if (openSlotButton) {
        openSlotButton.addEventListener('click', openSlotGame);
    }
    if (slotBackButton) {
        slotBackButton.addEventListener('click', closeSlotGame);
    }
    if (slotSpinButton) {
        slotSpinButton.addEventListener('click', spinReels);
        if (GAME_ASSETS.levelUpButton) {
            slotSpinButton.style.backgroundImage = `url(${GAME_ASSETS.levelUpButton})`;
        }
    }
    if (slotBackButton && GAME_ASSETS.closeButton) {
        slotBackButton.style.backgroundImage = `url(${GAME_ASSETS.closeButton})`;
    }
    if (slotScreen) {
        slotScreen.addEventListener('click', () => {
            if (skipWinAnimation) {
                skipWinAnimation();
            }
        });
    }
    populateReels();

});