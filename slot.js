// slot.js - v1.3.5 (Fixes payline animation lag)
import { GAME_ASSETS } from './assets.js';
document.addEventListener('DOMContentLoaded', () => {

    // --- GET SHARED STATE & FUNCTIONS ---

    const gameState = window.gameState;
    const saveGame = window.saveGameGlobal;
    const formatNumber = window.formatNumberGlobal;
    const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : { HapticFeedback: { impactOccurred: () => { }, notificationOccurred: () => { } } };

    // --- GET DOM ELEMENTS ---

    const slotScreen = document.getElementById('slot-screen');
    const slotBackButton = document.getElementById('slot-back-button');
    const slotSpinButton = document.getElementById('slot-spin-button');
    const reelColumns = document.querySelectorAll('.slot-reel-column');
    const openSlotButton = document.getElementById('scroll-slot-button');
    const slotWinDisplay = document.getElementById('slot-win-display');

    // --- SLOT CONSTANTS & DEFINITIONS ---

    const BET_COST = 1000;
    const SYMBOL_HEIGHT = 100;
    const SYMBOLS = {
        SEVEN: { id: 'seven', name: "7", payout: [3000, 30000], isBar: false },
        CHERRY: { id: 'cherry', name: "🍒", payout: [1500, 7500], isBar: false },
        MONEY: { id: 'money', name: "💰", payout: [300, 3000], isBar: false },
        BELL: { id: 'bell', name: "🔔", payout: [75, 1500], isBar: false },
        MELON: { id: 'melon', name: "🍉", payout: [0, 600], isBar: false },
        PLUM: { id: 'plum', name: "🍑", payout: [0, 600], isBar: false },
        BAR_3: { id: 'bar3', name: "BARx3", payout: [0, 300], isBar: true },
        BAR_2: { id: 'bar2', name: "BARx2", payout: [0, 150], isBar: true },
        BAR_1: { id: 'bar1', name: "BARx1", payout: [0, 75], isBar: true },
    };

    // Reel Strips

    const REEL_STRIPS = [
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2
        ],
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3
        ],
        [
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2
        ]
    ];

    const REEL_LENGTH = REEL_STRIPS[0].length; // 15
    const PAYLINES = [
        [0, 1, 2], // Line 1: Top Row
        [3, 4, 5], // Line 2: Middle Row
        [6, 7, 8], // Line 3: Bottom Row
        [0, 4, 8], // Line 4: Standard Diagonal \
        [6, 4, 2], // Line 5: Standard Diagonal /
        [0, 4, 2], // Line 6: "A" Shape (Chevron)
        [6, 4, 8],  // Line 7: "V" Shape (Chevron)
        [3, 7, 5], // Line 8: "V" Shape (Chevron)
        [3, 1, 5]  // Line 9: "A" Shape (Chevron)
    ];

    let isSpinning = false;
    let finalReelStops = [0, 0, 0];
    let paylineAnimationInterval = null;

    // --- CORE FUNCTIONS ---

    function openSlotGame() {
        if (isSpinning) return;
        if (!slotScreen || !slotSpinButton) {
            console.error("Slot elements not found!");
            return;
        }
        console.log("Opening 3x3 Slot Machine...");
        populateReels();

        const spinSpan = slotSpinButton.querySelector('span');
        spinSpan.innerHTML = `SPIN<br>${formatNumber(BET_COST)} <img src="${GAME_ASSETS.iconCrystalDust}" class="inline-icon" alt="Dust">`;

        slotScreen.classList.remove('hidden');
        slotScreen.classList.remove('closing');
    }

    function closeSlotGame() {
        if (isSpinning) return;
        slotScreen.classList.add('closing');
        setTimeout(() => {
            slotScreen.classList.add('hidden');
        }, 300);
    }

    function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    function populateReels() {
        if (!reelColumns) return;
        reelColumns.forEach((column, i) => {
            const strip = column.querySelector('.slot-reel-strip');
            if (!strip) return;
            const baseStrip = REEL_STRIPS[i];      // 15 symbols
            const fullStrip = [
                ...baseStrip,
                ...baseStrip,
                ...baseStrip,
                ...baseStrip
            ];                                     // 60 symbols
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

    function checkForAnticipation(stop1, stop2) {
        for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
            const s1_index = (stop1 + rowOffset) % REEL_LENGTH;
            const s2_index = (stop2 + rowOffset) % REEL_LENGTH;
            const s1 = REEL_STRIPS[0][s1_index];
            const s2 = REEL_STRIPS[1][s2_index];
            if (s1.id === s2.id) {
                return true;
            }
            if (s1.isBar && s2.isBar) {
                return true;
            }
        }
        return false;
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
            return 1000; // 1.0s (Fast)
        } else if (winAmount <= 1000) {
            return 3000; // 3.0s (Medium)
        } else if (winAmount <= 7500) {
            return 6000; // 6.0s (Long)
        } else {
            return 8000; // 8.0s (Extra Long)
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
        let startTime = null;
        const startAmount = 0;
        element.innerHTML = formatSlotWinNumber(0); // Start at "0.00"
        element.classList.add('visible');
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / duration, 1);
            let currentAmount = startAmount + (targetAmount - startAmount) * easeOut(progress);
            element.innerHTML = formatSlotWinNumber(currentAmount);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.innerHTML = formatSlotWinNumber(targetAmount);
                setTimeout(() => {
                    element.classList.remove('visible');
                }, 1200);
            }
        }
        requestAnimationFrame(step);
    }

    function highlightPayline(indices, stopResults) {
        document.querySelectorAll('.symbol-icon-wrapper.win').forEach(el => el.classList.remove('win'));
        if (!indices || !stopResults) return;
        indices.forEach(gridIndex => {
            const reelIndex = gridIndex % 3;
            const rowIndex = Math.floor(gridIndex / 3);
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
        if (window.refreshGameUI) window.refreshGameUI();
        const stopResults = [
            Math.floor(Math.random() * REEL_LENGTH),
            Math.floor(Math.random() * REEL_LENGTH),
            Math.floor(Math.random() * REEL_LENGTH)
        ];
        finalReelStops = [...stopResults];
        const isAnticipation = checkForAnticipation(stopResults[0], stopResults[1]);
        const reelDurations = [500, 800, 1100];
        const pauseDurations = [200, isAnticipation ? 1000 : 300];
        for (let i = 0; i < 3; i++) {
            const stripEl = reelColumns[i].querySelector('.slot-reel-strip');
            stripEl.style.transition = 'none';
            stripEl.classList.add('slot-spinning');
        }

        // Reel 1
        await wait(reelDurations[0]);
        stopReel(0, stopResults[0]);
        tg.HapticFeedback.impactOccurred('light');
        await wait(pauseDurations[0]);

        // Reel 2
        await wait(reelDurations[1]);
        stopReel(1, stopResults[1]);
        tg.HapticFeedback.impactOccurred('light');
        if (isAnticipation) {
            tg.HapticFeedback.impactOccurred('heavy');
        }
        await wait(pauseDurations[1]);

        // Reel 3
        await wait(reelDurations[2]);
        stopReel(2, stopResults[2]);
        tg.HapticFeedback.impactOccurred('medium');
        await wait(100);

        const { totalWinnings, winningPaylines } = checkWins(stopResults);
        if (totalWinnings > 0) {
            gameState.dust += totalWinnings;
            tg.HapticFeedback.notificationOccurred('success');
            if (saveGame) saveGame();
            if (window.refreshGameUI) window.refreshGameUI();
            startPaylineAnimation(winningPaylines, stopResults);
            const animDuration = getWinAnimationDuration(totalWinnings);
            animateWinCounter(slotWinDisplay, totalWinnings, animDuration);
        } else {
            tg.HapticFeedback.notificationOccurred('warning');
        }
        await new Promise(res => setTimeout(res, 350));
        isSpinning = false;
        slotSpinButton.disabled = false;
    }

    function checkWins(stopResults) {
        let totalWinnings = 0;
        const winningPaylines = [];
        const finalGrid = [];
        for (let i = 0; i < 3; i++) {
            const baseStrip = REEL_STRIPS[i];
            const rand = stopResults[i];
            const s1 = baseStrip[rand];                     // Top row
            const s2 = baseStrip[(rand + 1) % REEL_LENGTH]; // Middle row
            const s3 = baseStrip[(rand + 2) % REEL_LENGTH]; // Bottom row
            finalGrid[i + 0] = s1; // Col i, Row 0
            finalGrid[i + 3] = s2; // Col i, Row 1
            finalGrid[i + 6] = s3; // Col i, Row 2
        }
        for (const line of PAYLINES) {
            let paylineWin = 0;
            const lineIndices = [line[0], line[1], line[2]];
            const s1 = finalGrid[lineIndices[0]];
            const s2 = finalGrid[lineIndices[1]];
            const s3 = finalGrid[lineIndices[2]];
            if (s1.id === s2.id && s2.id === s3.id) {
                paylineWin = s1.payout[1];
                winningPaylines.push(lineIndices);
            } else if (s1.id === s2.id && s1.payout[0] > 0) {
                paylineWin = s1.payout[0];
                winningPaylines.push([lineIndices[0], lineIndices[1]]);
            } else if (paylineWin === 0 && s1.isBar && s2.isBar && s3.isBar) {
                paylineWin = 30;
                winningPaylines.push(lineIndices);
            }
            totalWinnings += paylineWin;
        }
        return { totalWinnings, winningPaylines };
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
    populateReels();

});