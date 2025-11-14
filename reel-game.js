// reel-game.js - v1.0.1
import { GAME_ASSETS } from './assets.js';
document.addEventListener('DOMContentLoaded', () => {

    // --- STATE & FUNCTIONS ---
    const gameState = window.gameState;
    const saveGame = window.saveGameGlobal;
    const formatNumber = window.formatNumberGlobal;
    const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : { HapticFeedback: { impactOccurred: () => { }, notificationOccurred: () => { } } };

    // --- DOM ELEMENTS ---
    const bodyEl = document.body;
    const reelGameScreen = document.getElementById('reel-game-screen');
    const reelGameBackButton = document.getElementById('reel-game-back-button');
    const reelGameSpinButton = document.getElementById('reel-game-spin-button');
    const reelGameColumns = document.querySelectorAll('.reel-game-column');
    const openReelGameButton = document.getElementById('scroll-slot-button');
    const reelGameWinDisplay = document.getElementById('reel-game-win-display');
    const gameContainer = document.querySelector('.game-container');
    const reelGameDustAmountEl = document.getElementById('reel-game-dust-amount');
    const reelGameLevelTextEl = document.getElementById('reel-game-level-text');
    const reelGameLevelBarInnerEl = document.getElementById('reel-game-level-bar-inner');
    const reelGameBetValueEl = document.getElementById('reel-game-bet-value');
    const reelGameLastWinEl = document.getElementById('reel-game-last-win');
    const btnBetDecrease = document.getElementById('reel-game-bet-decrease');
    const btnBetIncrease = document.getElementById('reel-game-bet-increase');
    const btnBetMax = document.getElementById('btn-bet-max');
    const reelGameTicketAmountEl = document.getElementById('reel-game-ticket-amount');
    const btnUseTicket = document.getElementById('btn-use-ticket');

    // --- REEL GAME CONSTANTS (5x3) ---
    const SYMBOL_HEIGHT = 80;
    const EXP_PER_LEVEL = 100;
    const EXP_FOR_SPIN = 1;
    const EXP_FOR_WIN = 10;

    // Payout array [2x, 3x, 4x, 5x] multipliers
    const SYMBOLS = {
        SEVEN: { id: 'seven', name: "7", payout: [10, 100, 1000, 5000], isBar: false },
        CHERRY: { id: 'cherry', name: "🍒", payout: [5, 40, 400, 2000], isBar: false },
        MONEY: { id: 'money', name: "💰", payout: [5, 30, 100, 750], isBar: false },
        BELL: { id: 'bell', name: "🔔", payout: [5, 30, 100, 750], isBar: false },
        MELON: { id: 'melon', name: "🍉", payout: [0, 5, 40, 150], isBar: false },
        PLUM: { id: 'plum', name: "🍑", payout: [0, 5, 40, 150], isBar: false },
        BAR_3: { id: 'bar3', name: "J", payout: [0, 5, 25, 100], isBar: false },
        BAR_2: { id: 'bar2', name: "K", payout: [0, 5, 40, 150], isBar: false },
        BAR_1: { id: 'bar1', name: "Q", payout: [0, 5, 25, 100], isBar: false }
    };

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

    // --- PAYLINES ---
    const PAYLINES = [
        [5, 6, 7, 8, 9], // Line 1: Middle Row
        [0, 1, 2, 3, 4], // Line 2: Top Row
        [10, 11, 12, 13, 14], // Line 3: Bottom Row
        [0, 6, 12, 8, 4], // Line 4: "V" shape
        [10, 6, 2, 8, 14], // Line 5: "A" shape
        [0, 1, 7, 13, 14], // Line 6: Zig-zag
        [10, 11, 7, 3, 4], // Line 7: Zig-zag
        [5, 1, 2, 3, 9], // Line 8: Bridge
        [5, 11, 12, 13, 9],  // Line 9: Valley
        [5, 11, 7, 3, 9],  // Line 10
    ];

    const PAYLINE_COUNT = PAYLINES.length;
    const MIN_BET = 1000;
    const MAX_BET = 50000;
    const BET_INCREMENT = 1000;

    let currentTotalBet = MIN_BET;
    let currentBetPerLine = currentTotalBet / PAYLINE_COUNT;
    let isSpinning = false;
    let finalReelStops = [0, 0, 0, 0, 0];
    let paylineAnimationInterval = null;
    let currentWinAnimationId = null;
    let skipWinAnimation = null;
    let isAutoSpinning = false;
    let autoSpinHoldTimer = null;
    let betHoldTimer = null;
    let betRepeatTimer = null;
    let isTicketMode = false;
    let lastDustBet = MIN_BET;

    // --- CORE FUNCTIONS ---
    function checkReelGameLevelUp() {
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

    function syncReelGameUI() {
        if (reelGameDustAmountEl) {
            reelGameDustAmountEl.innerText = formatNumber(gameState.dust);
        }
        if (reelGameTicketAmountEl) {
            reelGameTicketAmountEl.innerText = formatNumber(gameState.reelTickets || 0);
        }
        if (reelGameLevelTextEl && reelGameLevelBarInnerEl) {
            const level = gameState.slot_level || 1;
            const exp = gameState.slot_exp || 0;
            const expNeeded = level * EXP_PER_LEVEL;
            const expPercent = Math.max(0, Math.min(100, (exp / expNeeded) * 100));
            reelGameLevelTextEl.innerText = `Lv. ${level}`;
            reelGameLevelBarInnerEl.style.width = `${expPercent}%`;
        }
    }

    function updateSpinButtonText() {
        const spinSpan = reelGameSpinButton.querySelector('span');
        if (!spinSpan) return;

        if (isAutoSpinning) {
            spinSpan.innerHTML = "STOP";
        } else if (isTicketMode) {
            spinSpan.innerHTML = `SPIN<br><span class="spin-subtext">1 Reel Ticket</span>`;
        } else {
            spinSpan.innerHTML = `SPIN ${formatNumber(currentTotalBet)}<br><span class="spin-subtext">Hold for Auto</span>`;
        }
    }

    function clearBetTimers() {
        if (betHoldTimer) {
            clearTimeout(betHoldTimer);
            betHoldTimer = null;
        }
        if (betRepeatTimer) {
            clearInterval(betRepeatTimer);
            betRepeatTimer = null;
        }
    }

    function checkBetButtonStates() {
        if (!btnBetDecrease || !btnBetIncrease) return;
        const isBettingDisabled = isSpinning || isAutoSpinning || isTicketMode;
        btnBetDecrease.disabled = (currentTotalBet <= MIN_BET) || isBettingDisabled;
        btnBetIncrease.disabled = (currentTotalBet >= MAX_BET) || isBettingDisabled;
        if (btnBetMax) {
            btnBetMax.disabled = (currentTotalBet === MAX_BET) || isBettingDisabled;
        }
        if (btnUseTicket) {
            const hasNoTickets = !isSpinning && !isAutoSpinning && (gameState.reelTickets || 0) === 0;
            btnUseTicket.disabled = (isSpinning || isAutoSpinning) || hasNoTickets;
        }
        if (reelGameSpinButton && !isAutoSpinning) {
            if (isTicketMode && (gameState.reelTickets || 0) === 0) {
                reelGameSpinButton.disabled = true;
            }
            else if (!isSpinning) {
                reelGameSpinButton.disabled = false;
            }
        }
    }

    function updateBetDisplays() {
        currentBetPerLine = currentTotalBet / PAYLINE_COUNT;
        if (reelGameBetValueEl) {
            reelGameBetValueEl.innerText = currentTotalBet.toLocaleString('en-US');
        }
        updateSpinButtonText();
        checkBetButtonStates();
    }

    function decreaseBet(isRepeating = false) {
        if (isSpinning || isAutoSpinning) {
            clearBetTimers();
            return;
        }
        if (currentTotalBet > MIN_BET) {
            currentTotalBet -= BET_INCREMENT;
            updateBetDisplays();
            if (!isRepeating) {
                tg.HapticFeedback.impactOccurred('light');
            }
        } else {
            clearBetTimers();
        }
    }

    function increaseBet(isRepeating = false) {
        if (isSpinning || isAutoSpinning) {
            clearBetTimers();
            return;
        }
        if (currentTotalBet < MAX_BET) {
            currentTotalBet += BET_INCREMENT;
            updateBetDisplays();
            if (!isRepeating) {
                tg.HapticFeedback.impactOccurred('light');
            }
        } else {
            clearBetTimers();
        }
    }

    function setBetMax() {
        if (isSpinning || isAutoSpinning || currentTotalBet === MAX_BET) return;

        currentTotalBet = MAX_BET;
        updateBetDisplays();
        tg.HapticFeedback.impactOccurred('medium');
    }

    function toggleTicketMode() {
        if (isSpinning || isAutoSpinning) return;
        isTicketMode = !isTicketMode;
        tg.HapticFeedback.impactOccurred('medium');
        if (isTicketMode) {
            btnUseTicket.classList.add('active');
            lastDustBet = currentTotalBet;
            currentTotalBet = 100000;
        } else {
            btnUseTicket.classList.remove('active');
            currentTotalBet = lastDustBet;
        }
        updateBetDisplays();
    }

    function handleBetHoldStart(betFunction) {
        betFunction(false);
        clearBetTimers();
        betHoldTimer = setTimeout(() => {
            betRepeatTimer = setInterval(() => {
                betFunction(true);
            }, 100);
        }, 400);
    }

    function handleBetHoldEnd() {
        clearBetTimers();
    }

    function startAutoSpin() {
        if (isAutoSpinning || isSpinning) return;
        isAutoSpinning = true;
        updateSpinButtonText();
        tg.HapticFeedback.notificationOccurred('success');
        autoSpinLoop();
    }

    function stopAutoSpin() {
        isAutoSpinning = false;
        updateSpinButtonText();
        tg.HapticFeedback.notificationOccurred('warning');
    }

    async function autoSpinLoop() {
        if (!isAutoSpinning) {
            return;
        }
        if (isSpinning) {
            setTimeout(autoSpinLoop, 500);
            return;
        }
        if (gameState.dust < currentTotalBet) {
            stopAutoSpin();
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        await spinReels();
        await wait(500);
        autoSpinLoop();
    }

    function openReelGame() {
        if (isSpinning) return;
        if (!reelGameScreen || !reelGameSpinButton) {
            console.error("Reel game elements not found!");
            return;
        }
        const miniSlotOverlay = document.getElementById('slot-overlay');
        if (miniSlotOverlay) {
            miniSlotOverlay.classList.add('hidden');
        }
        console.log("Opening 5x3 Reel Game...");
        populateReels();
        bodyEl.style.backgroundImage = `url('${GAME_ASSETS.slotBackground}')`;
        gameContainer.classList.add('hidden');
        syncReelGameUI();
        isAutoSpinning = false;
        currentTotalBet = MIN_BET;
        updateBetDisplays();
        if (reelGameLastWinEl) {
            reelGameLastWinEl.innerText = (gameState.slot_last_win || 0).toLocaleString('en-US');
        }
        reelGameScreen.classList.remove('hidden');
        reelGameScreen.classList.remove('closing');
    }

    function closeReelGame() {
        if (isAutoSpinning) {
            stopAutoSpin();
        }
        if (isSpinning) return;
        bodyEl.style.backgroundImage = `url('${GAME_ASSETS.background}')`;
        gameContainer.classList.remove('hidden');
        reelGameScreen.classList.add('hidden');
        reelGameScreen.classList.remove('closing');
        if (window.refreshGameUI) {
            window.refreshGameUI();
        }
    }

    function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    function populateReels() {
        if (!reelGameColumns) return;
        reelGameColumns.forEach((column, i) => {
            const strip = column.querySelector('.reel-game-strip');
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
                div.className = 'reel-game-symbol';
                const span = document.createElement('span');
                span.className = 'symbol-icon-wrapper';
                span.innerText = symbol.name;
                div.appendChild(span);
                strip.appendChild(div);
            });
        });
    }

    function stopReel(reelIndex, stopIndex) {
        const stripEl = reelGameColumns[reelIndex].querySelector('.reel-game-strip');
        stripEl.classList.remove('reel-game-spinning');
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

    function formatReelGameWinNumber(num) {
        const iconUrl = GAME_ASSETS.iconCrystalDust;
        const numberString = num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `<img src="${iconUrl}" class="reel-game-win-icon" alt="Dust"> ${numberString}`;
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
        element.innerHTML = formatReelGameWinNumber(0);
        element.classList.add('visible');
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        function finishAnimation() {
            element.innerHTML = formatReelGameWinNumber(targetAmount);
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
            element.innerHTML = formatReelGameWinNumber(currentAmount);
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
            const stripEl = reelGameColumns[reelIndex].querySelector('.reel-game-strip');
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
        if (isTicketMode) { 
            if ((gameState.reelTickets || 0) < 1) { 
                tg.HapticFeedback.notificationOccurred('error');
                return;
            } 
        } else { 
            if (gameState.dust < currentTotalBet) { 
                tg.HapticFeedback.notificationOccurred('error'); 
                return;
            } 
        } 
        isSpinning = true;
        clearBetTimers();
        if (!isAutoSpinning) {
            reelGameSpinButton.disabled = true;
        }
        checkBetButtonStates();
        if (paylineAnimationInterval) {
            clearInterval(paylineAnimationInterval);
            paylineAnimationInterval = null;
        }
        document.querySelectorAll('.symbol-icon-wrapper.win').forEach(el => el.classList.remove('win'));
        if (isTicketMode) { 
            gameState.reelTickets = (gameState.reelTickets || 1) - 1; 
        } else { 
            gameState.dust -= currentTotalBet; 
        } 
        gameState.slot_exp = (gameState.slot_exp || 0) + EXP_FOR_SPIN;
        if (window.refreshGameUI) window.refreshGameUI();
        syncReelGameUI();
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
            const stripEl = reelGameColumns[i].querySelector('.reel-game-strip');
            stripEl.style.transition = 'none';
            stripEl.classList.add('reel-game-spinning');
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
            if (reelGameLastWinEl) {
                reelGameLastWinEl.innerText = totalWinnings.toLocaleString('en-US');
            }
            gameState.slot_last_win = totalWinnings;
            startPaylineAnimation(winningPaylines, stopResults);
            const animDuration = getWinAnimationDuration(totalWinnings);
            animateWinCounter(reelGameWinDisplay, totalWinnings, animDuration);
        } else {
            tg.HapticFeedback.notificationOccurred('warning');
        }
        await new Promise(res => setTimeout(res, 350));
        checkReelGameLevelUp();
        syncReelGameUI();
        isSpinning = false;
        if (!isAutoSpinning) {
            reelGameSpinButton.disabled = false;
        }
        if (isTicketMode && (gameState.reelTickets || 0) === 0) {
            isTicketMode = false;
            btnUseTicket.classList.remove('active');
            currentTotalBet = lastDustBet;
            updateBetDisplays();
        } else {
            checkBetButtonStates();
        }
    }

    function checkWins(stopResults) {
        let totalWinnings = 0;
        const winningPaylines = [];
        const finalGrid = [];
        for (let i = 0; i < 5; i++) {
            const baseStrip = REEL_STRIPS[i];
            const rand = stopResults[i];
            const s1 = baseStrip[rand];
            const s2 = baseStrip[(rand + 1) % REEL_LENGTH];
            const s3 = baseStrip[(rand + 2) % REEL_LENGTH];
            finalGrid[i + 0] = s1;
            finalGrid[i + 5] = s2;
            finalGrid[i + 10] = s3;
        }

        for (const line of PAYLINES) {
            const s1 = finalGrid[line[0]];
            const s2 = finalGrid[line[1]];
            const s3 = finalGrid[line[2]];
            const s4 = finalGrid[line[3]];
            const s5 = finalGrid[line[4]];
            let winMultiplier = 0;
            let winningIndices = [];
            if (s1.id === s2.id && s2.id === s3.id && s3.id === s4.id && s4.id === s5.id) {
                winMultiplier = s1.payout[3];
                winningIndices = [line[0], line[1], line[2], line[3], line[4]];
            } else if (s1.id === s2.id && s2.id === s3.id && s3.id === s4.id) {
                winMultiplier = s1.payout[2];
                winningIndices = [line[0], line[1], line[2], line[3]];
            } else if (s1.id === s2.id && s2.id === s3.id) {
                winMultiplier = s1.payout[1];
                winningIndices = [line[0], line[1], line[2]];
            } else if (s1.id === s2.id && s1.payout[0] > 0) {
                winMultiplier = s1.payout[0];
                winningIndices = [line[0], line[1]];
            }
            if (winMultiplier > 0) {
                const paylineWinInDust = winMultiplier * currentBetPerLine;
                totalWinnings += paylineWinInDust;
                winningPaylines.push(winningIndices);
            }
        }
        const uniqueWinningPaylines = Array.from(new Set(winningPaylines.map(JSON.stringify)), JSON.parse);
        return { totalWinnings, winningPaylines: uniqueWinningPaylines };
    }

    function handleSpinClick() {
        if (isAutoSpinning) {
            stopAutoSpin();
            return;
        }
        if (isSpinning) {
            if (skipWinAnimation) {
                skipWinAnimation();
            }
            return;
        }
        spinReels();
    }

    function handleSpinHoldStart() {
        if (isAutoSpinning || isSpinning) return;
        clearBetTimers();
        checkBetButtonStates();
        if (autoSpinHoldTimer) clearTimeout(autoSpinHoldTimer);
        autoSpinHoldTimer = setTimeout(startAutoSpin, 1000);
    }

    function handleSpinHoldEnd() {
        if (autoSpinHoldTimer) {
            clearTimeout(autoSpinHoldTimer);
            autoSpinHoldTimer = null;
        }
        if (!isSpinning && !isAutoSpinning) {
            checkBetButtonStates();
        }
    }

    // --- INITIALIZATION & LISTENERS ---
    if (openReelGameButton) {
        openReelGameButton.addEventListener('click', openReelGame);
    }
    if (reelGameBackButton) {
        reelGameBackButton.addEventListener('click', closeReelGame);
    }
    if (reelGameSpinButton) {
        reelGameSpinButton.addEventListener('click', handleSpinClick);
        reelGameSpinButton.addEventListener('mousedown', handleSpinHoldStart);
        reelGameSpinButton.addEventListener('touchstart', handleSpinHoldStart, { passive: true });
        reelGameSpinButton.addEventListener('mouseup', handleSpinHoldEnd);
        reelGameSpinButton.addEventListener('mouseleave', handleSpinHoldEnd);
        reelGameSpinButton.addEventListener('touchend', handleSpinHoldEnd);
        if (GAME_ASSETS.levelUpButton) {
            reelGameSpinButton.style.backgroundImage = `url(${GAME_ASSETS.levelUpButton})`;
        }
    }
    if (reelGameBackButton && GAME_ASSETS.closeButton) {
        reelGameBackButton.style.backgroundImage = `url(${GAME_ASSETS.closeButton})`;
    }
    if (reelGameScreen) {
        reelGameScreen.addEventListener('click', () => {
            if (skipWinAnimation) {
                skipWinAnimation();
            }
        });
    }
    const allStopEvents = ['mouseup', 'mouseleave', 'touchend'];
    if (btnBetDecrease) {
        btnBetDecrease.addEventListener('mousedown', () => handleBetHoldStart(decreaseBet));
        btnBetDecrease.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleBetHoldStart(decreaseBet);
        }, { passive: false });
        allStopEvents.forEach(event => btnBetDecrease.addEventListener(event, handleBetHoldEnd));
    }
    if (btnBetIncrease) {
        btnBetIncrease.addEventListener('mousedown', () => handleBetHoldStart(increaseBet));
        btnBetIncrease.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleBetHoldStart(increaseBet);
        }, { passive: false });
        allStopEvents.forEach(event => btnBetIncrease.addEventListener(event, handleBetHoldEnd));
    }

    if (btnBetMax) {
        btnBetMax.addEventListener('click', setBetMax);
    }

    if (btnBetMax) {
        btnBetMax.addEventListener('click', setBetMax);
    }

    if (btnUseTicket) {
        btnUseTicket.addEventListener('click', toggleTicketMode);
    }

    populateReels();

});