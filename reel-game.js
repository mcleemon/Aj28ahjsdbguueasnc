// reel-game.js - v1.0.2
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
    const btnSet1k = document.getElementById('btn-set-1k');
    const btnSet5k = document.getElementById('btn-set-5k');
    const btnSet10k = document.getElementById('btn-set-10k');
    const reelRewardTimerValueEl = document.getElementById('reel-reward-timer-value');
    const reelRewardProgressBarEl = document.getElementById('reel-reward-progress-bar');
    const reelRewardClaimButtons = document.querySelectorAll('.reel-reward-claim-button');
    const reelRewardMilestoneEls = [
        document.getElementById('reel-milestone-0'),
        document.getElementById('reel-milestone-1'),
        document.getElementById('reel-milestone-2'),
        document.getElementById('reel-milestone-3'),
        document.getElementById('reel-milestone-4'),
    ];

    // --- REEL GAME CONSTANTS (5x3) ---
    const SYMBOL_HEIGHT = 80;
    const EXP_PER_LEVEL = 100;
    const EXP_FOR_SPIN = 1;
    const EXP_FOR_WIN = 10;
    const REEL_REWARD_MILESTONES = [500000, 4500000, 20000000, 50000000, 75000000];
    const REEL_REWARD_PRIZES = [
        { type: 'gem', amount: 15 },
        { type: 'gem', amount: 50 },
        { type: 'gem', amount: 85 },
        { type: 'gem', amount: 100 },
        { type: 'gem', amount: 250 }
    ];

    const REEL_REWARD_TEXT = ["15 Gems", "50 Gems", "85 Gems", "100 Gems", "250 Gems"];
    const REEL_REWARD_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Payout array [2x, 3x, 4x, 5x] multipliers
    const SYMBOLS = {
        SEVEN: { id: 'seven', name: "7", payout: [10, 100, 1000, 5000], isBar: false },
        CHERRY: { id: 'cherry', name: "🍒", payout: [5, 40, 400, 2000], isBar: false },
        MONEY: { id: 'money', name: "💰", payout: [5, 30, 100, 750], isBar: false },
        BELL: { id: 'bell', name: "🔔", payout: [5, 30, 100, 750], isBar: false },
        MELON: { id: 'melon', name: "🍉", payout: [5, 10, 40, 150], isBar: false },
        PLUM: { id: 'plum', name: "🍑", payout: [5, 10, 40, 150], isBar: false },
        BAR_3: { id: 'bar3', name: "J", payout: [0, 5, 25, 100], isBar: false },
        BAR_2: { id: 'bar2', name: "K", payout: [0, 5, 25, 100], isBar: false },
        BAR_1: { id: 'bar1', name: "Q", payout: [0, 5, 25, 100], isBar: false },
        WILD: { id: 'wild', name: 'WLD', payout: [0, 0, 0, 0], isBar: false },
        SCATTER: { id: 'scatter', name: 'SCT', payout: [0, 0, 0, 0], isBar: false }
    };

    // --- REEL STRIPS 5 (NOW 18 SYMBOLS EACH) ---
    const REEL_STRIPS = [
        // Reel 1 (NO WILDS, 1 SCATTER)
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.SCATTER, SYMBOLS.BAR_1, SYMBOLS.BAR_3
        ],
        // Reel 2 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.WILD, SYMBOLS.SCATTER, SYMBOLS.WILD
        ],
        // Reel 3 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.WILD, SYMBOLS.SCATTER, SYMBOLS.WILD
        ],
        // Reel 4 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.WILD, SYMBOLS.SCATTER, SYMBOLS.WILD
        ],
        // Reel 5 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.WILD, SYMBOLS.SCATTER, SYMBOLS.WILD
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
    let currentBetIncrement = 1000;

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
    let reelRewardTimerInterval = null;
    let isFreeSpins = false;
    let freeSpinsRemaining = 0;

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

    function updateReelRewardUI() {
        if (!reelRewardProgressBarEl || !reelRewardClaimButtons) return;
        const progress = gameState.reelRewardProgress || 0;
        const claims = gameState.reelRewardClaims || [false, false, false, false, false];
        const milestones = REEL_REWARD_MILESTONES;
        const milestonePercentages = [10, 30, 50, 70, 90];
        let percent = 0;

        if (progress >= milestones[4]) {
            percent = 100;
        } else if (progress >= milestones[3]) {
            const basePercent = milestonePercentages[3];
            const segmentWidth = milestonePercentages[4] - milestonePercentages[3];
            const segmentStart = milestones[3];
            const segmentEnd = milestones[4];
            const progressInSegment = (progress - segmentStart) / (segmentEnd - segmentStart);
            percent = basePercent + (progressInSegment * segmentWidth);
        } else if (progress >= milestones[2]) {
            const basePercent = milestonePercentages[2];
            const segmentWidth = milestonePercentages[3] - milestonePercentages[2];
            const segmentStart = milestones[2];
            const segmentEnd = milestones[3];
            const progressInSegment = (progress - segmentStart) / (segmentEnd - segmentStart);
            percent = basePercent + (progressInSegment * segmentWidth);
        } else if (progress >= milestones[1]) {
            const basePercent = milestonePercentages[1];
            const segmentWidth = milestonePercentages[2] - milestonePercentages[1];
            const segmentStart = milestones[1];
            const segmentEnd = milestones[2];
            const progressInSegment = (progress - segmentStart) / (segmentEnd - segmentStart);
            percent = basePercent + (progressInSegment * segmentWidth);
        } else if (progress >= milestones[0]) {
            const basePercent = milestonePercentages[0];
            const segmentWidth = milestonePercentages[1] - milestonePercentages[0];
            const segmentStart = milestones[0];
            const segmentEnd = milestones[1];
            const progressInSegment = (progress - segmentStart) / (segmentEnd - segmentStart);
            percent = basePercent + (progressInSegment * segmentWidth);
        } else {
            percent = (progress / milestones[0]) * milestonePercentages[0];
        }

        reelRewardProgressBarEl.style.width = `${Math.max(0, percent)}%`;
        for (let i = 0; i < milestones.length; i++) {
            const milestoneCost = milestones[i];
            const milestoneEl = reelRewardMilestoneEls[i];
            const button = reelRewardClaimButtons[i];
            if (!milestoneEl || !button) continue;

            const star = milestoneEl.querySelector('.reel-reward-star');
            const treasure = milestoneEl.querySelector('.reel-reward-treasure');
            if (!treasure) continue;

            if (claims[i]) {
                // CLAIMED
                button.disabled = true;
                button.innerText = "CLAIMED!";
                button.classList.remove('claimable');
                button.classList.add('claimed');
                if (star) star.classList.add('completed');

                treasure.classList.remove('wobbling');
                treasure.classList.add('claimed');

            } else if (progress >= milestoneCost) {
                // READY TO CLAIM
                button.disabled = false;
                button.innerText = REEL_REWARD_TEXT[i];
                button.classList.add('claimable');
                button.classList.remove('claimed');
                if (star) star.classList.add('completed');

                treasure.classList.add('wobbling');
                treasure.classList.remove('claimed');

            } else {
                // NOT REACHED
                button.disabled = true;
                button.innerText = REEL_REWARD_TEXT[i];
                button.classList.remove('claimable');
                button.classList.remove('claimed');
                if (star) star.classList.remove('completed');

                treasure.classList.remove('wobbling');
                treasure.classList.remove('claimed');
            }
        }
    }

    function handleClaimReelReward(e) {
        const milestoneIndex = parseInt(e.target.dataset.milestone, 10);
        if (isNaN(milestoneIndex) || gameState.reelRewardClaims[milestoneIndex]) {
            return;
        }
        const progress = gameState.reelRewardProgress || 0;
        const milestoneCost = REEL_REWARD_MILESTONES[milestoneIndex];
        if (progress >= milestoneCost) {
            gameState.reelRewardClaims[milestoneIndex] = true;
            const prize = REEL_REWARD_PRIZES[milestoneIndex];
            if (prize.type === 'gem') {
                gameState.gemShards = (gameState.gemShards || 0) + prize.amount;
            }
            tg.HapticFeedback.notificationOccurred('success');
            if (saveGame) saveGame();
            updateReelRewardUI();
            if (window.refreshGameUI) window.refreshGameUI();
        }
    }

    function updateRewardTimer() {
        if (!reelRewardTimerValueEl) return;
        const now = Date.now();
        const resetTime = gameState.reelRewardResetTime || 0;
        let timeLeft = resetTime - now;
        if (timeLeft <= 0) {
            reelRewardTimerValueEl.innerText = "0D 0H 0M";
            return;
        }
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        timeLeft -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        timeLeft -= hours * (1000 * 60 * 60);
        const minutes = Math.floor(timeLeft / (1000 * 60));
        reelRewardTimerValueEl.innerText = `${days}D ${hours}H ${minutes}M`;
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
        } else if (isFreeSpins) {
            // --- THIS IS THE NEW PART ---
            spinSpan.innerHTML = `FREE SPIN<br><span class="spin-subtext">${freeSpinsRemaining} remaining</span>`;
            // ---
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

        // Bet buttons are disabled if spinning, in ticket mode, OR in free spins
        const isBettingDisabled = isSpinning || isAutoSpinning || isTicketMode || isFreeSpins;

        btnBetDecrease.disabled = (currentTotalBet <= MIN_BET) || isBettingDisabled;
        btnBetIncrease.disabled = (currentTotalBet >= MAX_BET) || isBettingDisabled;

        if (btnBetMax) {
            btnBetMax.disabled = isBettingDisabled;
            if (!isBettingDisabled) {
                if (currentTotalBet === MAX_BET) {
                    btnBetMax.innerText = "MIN BET";
                } else {
                    btnBetMax.innerText = "MAX BET";
                }
            }
        }

        if (btnSet1k && btnSet5k && btnSet10k) {
            btnSet1k.disabled = isBettingDisabled;
            btnSet5k.disabled = isBettingDisabled;
            btnSet10k.disabled = isBettingDisabled;
        }

        if (btnUseTicket) {
            // "Use Ticket" button is also disabled during free spins
            const hasNoTickets = !isSpinning && !isAutoSpinning && (gameState.reelTickets || 0) === 0;
            btnUseTicket.disabled = (isSpinning || isAutoSpinning || isFreeSpins) || hasNoTickets;
        }

        if (reelGameSpinButton && !isAutoSpinning) {
            if (isTicketMode && (gameState.reelTickets || 0) === 0 && !isFreeSpins) {
                reelGameSpinButton.disabled = true;
            }
            // Re-enable spin button if not spinning (and not out of tickets)
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
            currentTotalBet -= currentBetIncrement;
            if (currentTotalBet < MIN_BET) {
                currentTotalBet = MIN_BET;
            }
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
            currentTotalBet += currentBetIncrement;
            if (currentTotalBet > MAX_BET) {
                currentTotalBet = MAX_BET;
            }
            updateBetDisplays();
            if (!isRepeating) {
                tg.HapticFeedback.impactOccurred('light');
            }
        } else {
            clearBetTimers();
        }
    }

    function setBetIncrement(newIncrement, clickedButton) {
        if (isSpinning || isAutoSpinning || isTicketMode) return;
        currentBetIncrement = newIncrement;
        if (currentTotalBet % newIncrement !== 0) {
            currentTotalBet = newIncrement;
        }
        currentTotalBet = Math.max(MIN_BET, Math.min(MAX_BET, currentTotalBet));
        if (btnSet1k) btnSet1k.classList.remove('active');
        if (btnSet5k) btnSet5k.classList.remove('active');
        if (btnSet10k) btnSet10k.classList.remove('active');
        if (clickedButton) clickedButton.classList.add('active');
        updateBetDisplays();
        tg.HapticFeedback.impactOccurred('medium');
    }

    function handleBetMaxMinClick() {
        if (isSpinning || isAutoSpinning || isTicketMode) return;
        if (currentTotalBet === MAX_BET) {
            currentTotalBet = MIN_BET;
            tg.HapticFeedback.impactOccurred('medium');
        } else {
            currentTotalBet = MAX_BET;
            tg.HapticFeedback.impactOccurred('medium');
        }
        updateBetDisplays();
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
        if (Date.now() > (gameState.reelRewardResetTime || 0)) {
            gameState.reelRewardProgress = 0;
            gameState.reelRewardClaims = [false, false, false, false, false];
            gameState.reelRewardResetTime = Date.now() + REEL_REWARD_DURATION_MS;
            if (saveGame) saveGame();
        }
        updateReelRewardUI();
        if (reelRewardTimerInterval) clearInterval(reelRewardTimerInterval);
        updateRewardTimer();
        reelRewardTimerInterval = setInterval(updateRewardTimer, 60000);
        reelRewardClaimButtons.forEach(button => {
            button.addEventListener('click', handleClaimReelReward);
        });
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
        if (reelRewardTimerInterval) clearInterval(reelRewardTimerInterval);
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

        // --- 1. MODIFIED FUND CHECK ---
        if (isFreeSpins) {
            // It's a free spin, no cost check needed
        } else if (isTicketMode) {
            if ((gameState.reelTickets || 0) < 1) {
                tg.HapticFeedback.notificationOccurred('error');
                return; // Not enough tickets
            }
        } else { // Normal Dust Mode
            if (gameState.dust < currentTotalBet) {
                tg.HapticFeedback.notificationOccurred('error');
                return; // Not enough dust
            }
        }
        // ---

        isSpinning = true;
        clearBetTimers();
        if (!isAutoSpinning) {
            reelGameSpinButton.disabled = true;
        }
        checkBetButtonStates();

        if (paylineAnimationInterval) {
            clearInterval(paylineAnimationInterval);
        }
        document.querySelectorAll('.symbol-icon-wrapper.win').forEach(el => el.classList.remove('win'));

        // --- 2. MODIFIED COST SUBTRACTION ---
        if (isFreeSpins) {
            freeSpinsRemaining--; // Use one free spin
        } else if (isTicketMode) {
            gameState.reelTickets = (gameState.reelTickets || 1) - 1;
            gameState.reelRewardProgress = (gameState.reelRewardProgress || 0) + 100000;
        } else {
            gameState.dust -= currentTotalBet;
            gameState.reelRewardProgress = (gameState.reelRewardProgress || 0) + currentTotalBet;
        }
        // ---

        gameState.slot_exp = (gameState.slot_exp || 0) + EXP_FOR_SPIN;
        if (window.refreshGameUI) window.refreshGameUI();
        syncReelGameUI();

        // --- (This part is the same) ---
        const stopResults = [
            Math.floor(Math.random() * REEL_STRIPS[0].length),
            Math.floor(Math.random() * REEL_STRIPS[0].length),
            Math.floor(Math.random() * REEL_STRIPS[0].length),
            Math.floor(Math.random() * REEL_STRIPS[0].length),
            Math.floor(Math.random() * REEL_STRIPS[0].length)
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
        // --- (End of same part) ---

        // --- 3. MODIFIED WIN CHECK ---
        const { totalWinnings, winningPaylines, triggerFreeSpins } = checkWins(stopResults);

        if (totalWinnings > 0) {
            gameState.dust += totalWinnings; // Add winnings
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

        // --- 4. NEW: TRIGGER FREE SPINS (if found) ---
        if (triggerFreeSpins) {
            triggerFreeSpins();
        }
        // ---

        await new Promise(res => setTimeout(res, 350));
        checkReelGameLevelUp();
        syncReelGameUI();
        isSpinning = false;

        // --- 5. MODIFIED END-OF-SPIN LOGIC ---
        if (isFreeSpins && freeSpinsRemaining === 0) {
            // Last free spin was just used, end the mode
            isFreeSpins = false;
            // We could show a "Free Spins Ended! Total Win: X" popup here
            console.log("FREE SPINS ENDED!");
        }

        if (isTicketMode && (gameState.reelTickets || 0) === 0 && !isFreeSpins) {
            isTicketMode = false;
            btnUseTicket.classList.remove('active');
            currentTotalBet = lastDustBet;
        }

        // This will re-enable the spin button and fix all text
        updateBetDisplays();
        updateReelRewardUI();
        // ---
    }

    function checkWins(stopResults) {
        let totalWinnings = 0;
        const winningPaylines = [];
        const finalGrid = [];
        const reelLength = REEL_STRIPS[0].length; // This is now 18
        let scatterCount = 0; // <-- NEW: To count scatters

        // 1. Build the 5x3 grid of symbols that landed
        for (let i = 0; i < 5; i++) {
            const baseStrip = REEL_STRIPS[i];
            const rand = stopResults[i];
            const s1 = baseStrip[rand % reelLength];
            const s2 = baseStrip[(rand + 1) % reelLength];
            const s3 = baseStrip[(rand + 2) % reelLength];
            finalGrid[i + 0] = s1;
            finalGrid[i + 5] = s2;
            finalGrid[i + 10] = s3;

            // --- NEW: Count scatters as we build the grid ---
            if (s1.id === 'scatter') scatterCount++;
            if (s2.id === 'scatter') scatterCount++;
            if (s3.id === 'scatter') scatterCount++;
            // ---
        }

        // 2. Check each payline for wins (This logic is the same)
        for (const line of PAYLINES) {
            const symbolsOnLine = [
                finalGrid[line[0]],
                finalGrid[line[1]],
                finalGrid[line[2]],
                finalGrid[line[3]],
                finalGrid[line[4]]
            ];

            let winSymbol = symbolsOnLine[0];
            let matchLength = 0;
            let winningIndices = [];

            for (const symbol of symbolsOnLine) {
                if (symbol.id !== 'wild' && symbol.id !== 'scatter') {
                    winSymbol = symbol;
                    break;
                }
            }

            if (symbolsOnLine.every(s => s.id === 'wild')) {
                winSymbol = SYMBOLS.SEVEN;
            }

            for (let i = 0; i < symbolsOnLine.length; i++) {
                const symbol = symbolsOnLine[i];
                if (symbol.id === winSymbol.id || symbol.id === 'wild') {
                    matchLength++;
                    winningIndices.push(line[i]);
                } else {
                    break;
                }
            }

            let winMultiplier = 0;
            if (matchLength === 5) {
                winMultiplier = winSymbol.payout[3];
            } else if (matchLength === 4) {
                winMultiplier = winSymbol.payout[2];
            } else if (matchLength === 3) {
                winMultiplier = winSymbol.payout[1];
            } else if (matchLength === 2) {
                winMultiplier = winSymbol.payout[0];
            }

            if (winMultiplier > 0) {
                const paylineWinInDust = winMultiplier * currentBetPerLine;
                totalWinnings += paylineWinInDust;
                winningPaylines.push(winningIndices);
            }
        }

        const uniqueWinningPaylines = Array.from(new Set(winningPaylines.map(JSON.stringify)), JSON.parse);

        // 3. --- NEW: Check for Scatter Wins ---
        // This happens *after* payline wins and *only if not already in free spins*
        if (!isFreeSpins && scatterCount >= 3) {
            // We don't return winnings, we return a signal to trigger the bonus
            return { totalWinnings, winningPaylines: uniqueWinningPaylines, triggerFreeSpins: true };
        }

        return { totalWinnings, winningPaylines: uniqueWinningPaylines, triggerFreeSpins: false };
    }

    function triggerFreeSpins() {
        isFreeSpins = true;
        freeSpinsRemaining = 15; // You win 15 free spins

        // Disable all betting controls
        checkBetButtonStates();

        // Update the spin button text
        updateSpinButtonText();

        tg.HapticFeedback.notificationOccurred('success');

        // We could show a "15 FREE SPINS!" popup here later
        console.log("FREE SPINS TRIGGERED!");
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
        btnBetMax.addEventListener('click', handleBetMaxMinClick);
    }

    if (btnUseTicket) {
        btnUseTicket.addEventListener('click', toggleTicketMode);
    }

    if (btnSet1k) {
        btnSet1k.addEventListener('click', () => setBetIncrement(1000, btnSet1k));
    }
    if (btnSet5k) {
        btnSet5k.addEventListener('click', () => setBetIncrement(5000, btnSet5k));
    }
    if (btnSet10k) {
        btnSet10k.addEventListener('click', () => setBetIncrement(10000, btnSet10k));
    }

    populateReels();

});