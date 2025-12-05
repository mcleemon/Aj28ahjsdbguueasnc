// reel-game.js - v1.0.6

import { GAME_ASSETS } from './assets.js';
import { audioManager } from './audioManager.js';
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
    const reelGameWinTitleEl = document.getElementById('reel-game-win-title');
    const reelGameWinNumberEl = document.getElementById('reel-game-win-number');
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
    const reelGameOverlay = document.getElementById('reel-game-overlay');
    const reelGameOverlayText = document.getElementById('reel-game-overlay-text');
    const reelGameOverlayTitle = document.getElementById('reel-game-overlay-title');
    const reelGameFreeSpinsCounterEl = document.getElementById('reel-game-free-spins-counter');

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
        CHERRY: { id: 'cherry', name: "🍒", payout: [2.5, 40, 400, 2000], isBar: false },
        MONEY: { id: 'money', name: "💰", payout: [2.5, 30, 100, 750], isBar: false },
        BELL: { id: 'bell', name: "🔔", payout: [2.5, 30, 100, 750], isBar: false },
        MELON: { id: 'melon', name: "🍉", payout: [0, 10, 40, 150], isBar: false },
        PLUM: { id: 'plum', name: "🍑", payout: [0, 10, 40, 150], isBar: false },
        BAR_3: { id: 'bar3', name: "J", payout: [0, 5, 25, 100], isBar: false },
        BAR_2: { id: 'bar2', name: "K", payout: [0, 5, 25, 100], isBar: false },
        BAR_1: { id: 'bar1', name: "Q", payout: [0, 5, 25, 100], isBar: false },
        WILD: { id: 'wild', name: 'WILD', payout: [0, 0, 0, 0], isBar: false },
        SCATTER: { id: 'scatter', name: 'SCATTER', payout: [0, 0, 0, 0], isBar: false }
    };

    // --- REEL STRIPS 5 (NOW 72 SYMBOLS EACH) ---
    const REEL_STRIPS = [
        // Reel 1 (NO WILDS, 1 SCATTER)
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.SCATTER, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_2, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.BAR_3
        ],
        // Reel 2 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.WILD, SYMBOLS.BAR_1, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.SCATTER, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3
        ],
        // Reel 3 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.WILD, SYMBOLS.BAR_3, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.SCATTER, SYMBOLS.BAR_3
        ],
        // Reel 4 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.WILD, SYMBOLS.BAR_3, SYMBOLS.WILD,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.SCATTER, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3
        ],
        // Reel 5 (2 WILDS, 1 SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.WILD, SYMBOLS.BAR_1, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.SCATTER, SYMBOLS.BAR_3
        ]
    ];

    const BONUS_REEL_STRIPS = [
        // Reel 1 (NO WILDS, NO SCATTER)
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_2, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.BAR_3
        ],
        // Reel 2 (2 WILDS, NO SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.WILD, SYMBOLS.BAR_1, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3
        ],
        // Reel 3 (2 WILDS, NO SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.WILD, SYMBOLS.BAR_3, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.MONEY, SYMBOLS.PLUM, SYMBOLS.CHERRY, SYMBOLS.BELL,
            SYMBOLS.BAR_2, SYMBOLS.MELON, SYMBOLS.BAR_3, SYMBOLS.BAR_1, SYMBOLS.MONEY,
            SYMBOLS.PLUM, SYMBOLS.SEVEN, SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_1, SYMBOLS.BAR_3
        ],
        // Reel 4 (2 WILDS, NO SCATTER)
        [
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.WILD, SYMBOLS.BAR_3, SYMBOLS.WILD,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_1, SYMBOLS.BAR_3,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.SEVEN, SYMBOLS.BAR_1, SYMBOLS.CHERRY, SYMBOLS.BAR_2, SYMBOLS.BELL,
            SYMBOLS.PLUM, SYMBOLS.BAR_3, SYMBOLS.MONEY, SYMBOLS.MELON, SYMBOLS.BAR_1,
            SYMBOLS.CHERRY, SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.PLUM, SYMBOLS.BAR_2,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3
        ],
        // Reel 5 (2 WILDS, NO SCATTER)
        [
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.WILD, SYMBOLS.BAR_1, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_2, SYMBOLS.WILD,
            SYMBOLS.BAR_1, SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.PLUM, SYMBOLS.MONEY,
            SYMBOLS.CHERRY, SYMBOLS.BAR_3, SYMBOLS.MELON, SYMBOLS.SEVEN, SYMBOLS.BAR_1,
            SYMBOLS.BELL, SYMBOLS.BAR_2, SYMBOLS.CHERRY, SYMBOLS.PLUM, SYMBOLS.BAR_3,
            SYMBOLS.BAR_1, SYMBOLS.BAR_1, SYMBOLS.BAR_3
        ]
    ];

    const REEL_LENGTH = REEL_STRIPS[0].length; // 72

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
    let freeSpinsTotalWin = 0;
    let skipBonusWinAnimation = null;

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

        reelRewardProgressBarEl.style.transform = `scaleX(${Math.max(0, percent) / 100})`;
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
        if (isFreeSpins) {
            if (isSpinning) {
                spinSpan.innerHTML = `STOP<br><span class="spin-subtext">${freeSpinsRemaining} remaining</span>`;
            } else {
                spinSpan.innerHTML = `FREE SPIN<br><span class="spin-subtext">${freeSpinsRemaining} remaining</span>`;
            }
        } else if (isAutoSpinning) {
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
            const hasNoTickets = !isSpinning && !isAutoSpinning && (gameState.reelTickets || 0) === 0;
            btnUseTicket.disabled = (isSpinning || isAutoSpinning || isFreeSpins) || hasNoTickets;
        }

        if (reelGameSpinButton && !isAutoSpinning) {
            if (isTicketMode && (gameState.reelTickets || 0) === 0 && !isFreeSpins) {
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
        if (isFreeSpins) {
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
        audioManager.init(); // Ensure audio is ready
        audioManager.playMusic('bgmReel', true); // Start music with fade
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
        if (reelGameFreeSpinsCounterEl) {
            reelGameFreeSpinsCounterEl.classList.add('hidden');
        }
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
        audioManager.stopMusic(true); // Fade out music
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

    function showReelOverlay(text) {
        if (!reelGameOverlay || !reelGameOverlayText) return;
        reelGameOverlayText.innerText = text;
        reelGameOverlay.classList.add('visible');
    }

    function hideReelOverlay() {
        if (!reelGameOverlay) return;
        reelGameOverlay.classList.remove('visible');
    }

    function animateBonusTotalWin(titleElement, numberElement, targetAmount) {
        if (!titleElement || !numberElement) return new Promise(res => res());
        return new Promise(resolve => {
            let startTime = null;
            const duration = 2000;
            const startAmount = 0;
            let currentTier = 0;

            // Tiers
            const TIERS = [
                { limit: 0, text: "YOU WIN!", class: "win-tier-1" },
                { limit: 500000, text: "BIG WIN!", class: "win-tier-2" },
                { limit: 5000000, text: "MEGA WIN!", class: "win-tier-3" },
                { limit: 25000000, text: "MASSIVE WIN!", class: "win-tier-4" }
            ];

            numberElement.innerText = `0`;
            numberElement.classList.remove('large-number');
            titleElement.innerText = TIERS[0].text;
            titleElement.className = TIERS[0].class;

            const easeOut = (t) => 1 - Math.pow(1 - t, 3);

            function finishAnimation() {
                numberElement.innerText = targetAmount.toLocaleString('en-US');
                if (targetAmount >= 10000000) {
                    numberElement.classList.add('large-number');
                }
                let finalTier = TIERS[0];
                for (let i = TIERS.length - 1; i >= 0; i--) {
                    if (targetAmount >= TIERS[i].limit) {
                        finalTier = TIERS[i];
                        break;
                    }
                }
                titleElement.innerText = finalTier.text;
                titleElement.className = finalTier.class;
                skipBonusWinAnimation = null;
                resolve();
            }

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                let progress = Math.min(elapsed / duration, 1);
                let currentAmount = Math.round(startAmount + (targetAmount - startAmount) * easeOut(progress));
                if (currentAmount >= 10000000) {
                    numberElement.classList.add('large-number');
                } else {
                    numberElement.classList.remove('large-number');
                }
                let newTier = currentTier;
                for (let i = TIERS.length - 1; i >= 0; i--) {
                    if (currentAmount >= TIERS[i].limit) {
                        newTier = i;
                        break;
                    }
                }
                if (newTier !== currentTier) {
                    currentTier = newTier;
                    titleElement.innerText = TIERS[currentTier].text;
                    titleElement.className = TIERS[currentTier].class;
                }
                numberElement.innerText = currentAmount.toLocaleString('en-US');
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    finishAnimation();
                }
            }
            skipBonusWinAnimation = () => {
                finishAnimation();
            };
            requestAnimationFrame(step);
        });
    }

    function populateReels() {
        if (!reelGameColumns) return;
        const activeStrips = isFreeSpins ? BONUS_REEL_STRIPS : REEL_STRIPS;
        reelGameColumns.forEach((column, i) => {
            const strip = column.querySelector('.reel-game-strip');
            if (!strip) return;
            const baseStrip = activeStrips[i];
            const currentReelLength = baseStrip.length;
            const fullStrip = [
                ...baseStrip, ...baseStrip, ...baseStrip, ...baseStrip
            ];
            strip.innerHTML = '';
            strip.style.transition = 'none';
            const startIndex = currentReelLength * 3;
            const startY = -(startIndex * SYMBOL_HEIGHT);
            strip.style.transform = `translateY(${startY}px)`;

            fullStrip.forEach(symbol => {
                const div = document.createElement('div');
                div.className = 'reel-game-symbol';
                const span = document.createElement('span');
                span.className = `symbol-icon-wrapper symbol-${symbol.id}`;
                span.innerText = symbol.name;
                div.appendChild(span);
                strip.appendChild(div);
            });
        });
    }

    function stopReel(reelIndex, stopIndex) {
        audioManager.playSound('stop');
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
        const titleElement = document.getElementById('reel-game-win-title');
        const numberElement = document.getElementById('reel-game-win-number');

        if (!element || !titleElement || !numberElement) return;
        if (currentWinAnimationId) {
            cancelAnimationFrame(currentWinAnimationId);
            currentWinAnimationId = null;
        }
        skipWinAnimation = null;
        let startTime = null;
        const startAmount = 0;
        let currentTier = 0;
        const TIERS = [
            { limit: 0, text: "YOU WIN!", class: "win-tier-1" },
            { limit: 500000, text: "BIG WIN!", class: "win-tier-2" },
            { limit: 5000000, text: "MEGA WIN!", class: "win-tier-3" },
            { limit: 25000000, text: "MASSIVE WIN!", class: "win-tier-4" }
        ];

        numberElement.innerHTML = formatReelGameWinNumber(0);
        numberElement.classList.remove('large-number');
        titleElement.innerText = TIERS[0].text;
        titleElement.className = TIERS[0].class;
        element.classList.add('visible');

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);

        function finishAnimation() {
            numberElement.innerHTML = formatReelGameWinNumber(targetAmount);
            if (targetAmount >= 10000000) {
                numberElement.classList.add('large-number');
            }
            let finalTier = TIERS[0];
            for (let i = TIERS.length - 1; i >= 0; i--) {
                if (targetAmount >= TIERS[i].limit) {
                    finalTier = TIERS[i];
                    break;
                }
            }
            titleElement.innerText = finalTier.text;
            titleElement.className = finalTier.class;

            currentWinAnimationId = null;
            skipWinAnimation = null;
            setTimeout(() => {
                element.classList.remove('visible');
            }, 1200); // Hide after 1.2s
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / duration, 1);
            let currentAmount = startAmount + (targetAmount - startAmount) * easeOut(progress);
            if (currentAmount >= 10000000) {
                numberElement.classList.add('large-number');
            } else {
                numberElement.classList.remove('large-number');
            }
            let newTier = currentTier;
            for (let i = TIERS.length - 1; i >= 0; i--) {
                if (currentAmount >= TIERS[i].limit) {
                    newTier = i;
                    break;
                }
            }

            if (newTier !== currentTier) {
                currentTier = newTier;
                titleElement.innerText = TIERS[currentTier].text;
                titleElement.className = TIERS[currentTier].class;
            }

            numberElement.innerHTML = formatReelGameWinNumber(currentAmount);

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

    function isScatterVisible(reelIndex, stopIndex) {
        const activeStrips = isFreeSpins ? BONUS_REEL_STRIPS : REEL_STRIPS;
        const strip = activeStrips[reelIndex];
        const reelLength = strip.length;
        const s1 = strip[stopIndex % reelLength];
        const s2 = strip[(stopIndex + 1) % reelLength];
        const s3 = strip[(stopIndex + 2) % reelLength];
        if (s1.id === 'scatter' || s2.id === 'scatter' || s3.id === 'scatter') {
            return true;
        }
        return false;
    }

    async function spinReels() {
        if (skipWinAnimation) {
            skipWinAnimation();
        }
        if (isSpinning && !isFreeSpins) return;
        if (isFreeSpins) {
        } else if (isTicketMode) {
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
        audioManager.playSound('spin');
        clearBetTimers();
        if (!isAutoSpinning) {
            reelGameSpinButton.disabled = true;
        }
        checkBetButtonStates();
        if (paylineAnimationInterval) {
            clearInterval(paylineAnimationInterval);
        }
        document.querySelectorAll('.symbol-icon-wrapper.win').forEach(el => el.classList.remove('win'));
        reelGameColumns.forEach(col => col.classList.remove('reel-column-hunting'));
        if (isFreeSpins) {
        } else if (isTicketMode) {
            gameState.reelTickets = (gameState.reelTickets || 1) - 1;
            gameState.reelRewardProgress = (gameState.reelRewardProgress || 0) + 100000;
        } else {
            gameState.dust -= currentTotalBet;
            gameState.reelRewardProgress = (gameState.reelRewardProgress || 0) + currentTotalBet;
        }
        if (saveGame) saveGame();
        gameState.slot_exp = (gameState.slot_exp || 0) + EXP_FOR_SPIN;
        if (window.refreshGameUI) window.refreshGameUI();
        syncReelGameUI();
        const activeStrips = isFreeSpins ? BONUS_REEL_STRIPS : REEL_STRIPS;
        const currentReelLength = activeStrips[0].length;
        const stopResults = [
            Math.floor(Math.random() * currentReelLength),
            Math.floor(Math.random() * currentReelLength),
            Math.floor(Math.random() * currentReelLength),
            Math.floor(Math.random() * currentReelLength),
            Math.floor(Math.random() * currentReelLength)
        ];
        finalReelStops = [...stopResults];
        const reelDurations = [200, 200, 200, 200, 200];
        const pauseDurations = [50, 50, 50, 50];
        const TENSION_DELAY_MS = 1000;
        let scatterCount = 0;
        for (let i = 0; i < 5; i++) {
            const stripEl = reelGameColumns[i].querySelector('.reel-game-strip');
            stripEl.style.transition = 'none';
            stripEl.classList.add('reel-game-spinning');
        }
        await wait(reelDurations[0]);
        stopReel(0, stopResults[0]);
        tg.HapticFeedback.impactOccurred('light');
        if (isScatterVisible(0, stopResults[0])) scatterCount++;
        await wait(pauseDurations[0]);
        await wait(reelDurations[1]);
        stopReel(1, stopResults[1]);
        tg.HapticFeedback.impactOccurred('light');
        if (isScatterVisible(1, stopResults[1])) scatterCount++;
        await wait(pauseDurations[1]);
        if (scatterCount >= 2 && !isFreeSpins) {
            reelGameColumns[2].classList.add('reel-column-hunting');
            audioManager.playSound('scatter');
            await wait(TENSION_DELAY_MS);
        }
        await wait(reelDurations[2]);
        stopReel(2, stopResults[2]);
        tg.HapticFeedback.impactOccurred('medium');
        if (isScatterVisible(2, stopResults[2])) scatterCount++;
        await wait(pauseDurations[2]);
        if (scatterCount >= 2 && !isFreeSpins) {
            reelGameColumns[3].classList.add('reel-column-hunting');
            audioManager.playSound('scatter');
            await wait(TENSION_DELAY_MS);
        }
        await wait(reelDurations[3]);
        stopReel(3, stopResults[3]);
        tg.HapticFeedback.impactOccurred('medium');
        if (isScatterVisible(3, stopResults[3])) scatterCount++;
        await wait(pauseDurations[3]);
        if (scatterCount >= 2 && !isFreeSpins) {
            reelGameColumns[4].classList.add('reel-column-hunting');
            audioManager.playSound('scatter');
            await wait(TENSION_DELAY_MS);
        }
        await wait(reelDurations[4]);
        stopReel(4, stopResults[4]);
        tg.HapticFeedback.impactOccurred('heavy');
        await wait(100);
        const { totalWinnings, winningPaylines, freeSpinsToAward } = checkWins(stopResults);
        if (totalWinnings > 0) {
            const multiplier = totalWinnings / currentTotalBet;

            if (multiplier >= 5) {
                audioManager.playSound('winBig'); // Big win sound
            } else {
                audioManager.playSound('winSmall'); // Normal win sound
            }
            if (isFreeSpins) {
                freeSpinsTotalWin += totalWinnings;
            } else if (freeSpinsToAward > 0) {
                freeSpinsTotalWin = totalWinnings;
            } else {
                gameState.dust += totalWinnings;
            }
            gameState.slot_exp = (gameState.slot_exp || 0) + EXP_FOR_WIN;
            tg.HapticFeedback.notificationOccurred('success');
            if (saveGame) saveGame();
            if (window.refreshGameUI) window.refreshGameUI();
            if (reelGameLastWinEl) {
                reelGameLastWinEl.innerText = totalWinnings.toLocaleString('en-US');
            }
            gameState.slot_last_win = totalWinnings;
            if (freeSpinsToAward === 0) {
                startPaylineAnimation(winningPaylines, stopResults);
                const animDuration = getWinAnimationDuration(totalWinnings);
                animateWinCounter(reelGameWinDisplay, totalWinnings, animDuration);
            } else {
                startPaylineAnimation(winningPaylines, stopResults);
            }
        } else {
            tg.HapticFeedback.notificationOccurred('warning');
        }
        await new Promise(res => setTimeout(res, 350));
        checkReelGameLevelUp();
        syncReelGameUI();
        if (freeSpinsToAward > 0) {
            freeSpinsTotalWin = totalWinnings;
            triggerFreeSpins(freeSpinsToAward);
            return;
        }
        isSpinning = false;
        if (isTicketMode && (gameState.reelTickets || 0) === 0 && !isFreeSpins) {
            isTicketMode = false;
            btnUseTicket.classList.remove('active');
            currentTotalBet = lastDustBet;
        }
        updateBetDisplays();
        updateReelRewardUI();
        setTimeout(() => {
            reelGameColumns.forEach(col => col.classList.remove('reel-column-hunting'));
        }, 1000);
    }

    function checkWins(stopResults) {
        let totalWinnings = 0;
        const winningPaylines = [];
        const finalGrid = [];
        const activeStrips = isFreeSpins ? BONUS_REEL_STRIPS : REEL_STRIPS;
        const reelLength = activeStrips[0].length;
        let scatterCount = 0;
        for (let i = 0; i < 5; i++) {
            const baseStrip = activeStrips[i];
            const rand = stopResults[i];
            const s1 = baseStrip[rand % reelLength];
            const s2 = baseStrip[(rand + 1) % reelLength];
            const s3 = baseStrip[(rand + 2) % reelLength];
            finalGrid[i + 0] = s1;
            finalGrid[i + 5] = s2;
            finalGrid[i + 10] = s3;
            if (s1.id === 'scatter') scatterCount++;
            if (s2.id === 'scatter') scatterCount++;
            if (s3.id === 'scatter') scatterCount++;
        }
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
        let freeSpinsToAward = 0;
        if (!isFreeSpins) {
            if (scatterCount === 3) {
                freeSpinsToAward = 15;
            } else if (scatterCount === 4) {
                freeSpinsToAward = 30;
            } else if (scatterCount >= 5) {
                freeSpinsToAward = 50;
            }
        }
        return { totalWinnings, winningPaylines: uniqueWinningPaylines, freeSpinsToAward };
    }

    async function triggerFreeSpins(spinsAwarded) {
        console.log(`FREE SPINS TRIGGERED! ${spinsAwarded} spins awarded.`);
        audioManager.playSound('bonus');
        tg.HapticFeedback.notificationOccurred('success');
        showReelOverlay(`YOU WIN ${spinsAwarded} FREE SPINS!`);
        if (reelGameFreeSpinsCounterEl) reelGameFreeSpinsCounterEl.classList.remove('hidden');
        await wait(2500);
        hideReelOverlay();
        await wait(500);
        isFreeSpins = true;
        isAutoSpinning = true;
        freeSpinsRemaining = spinsAwarded;
        populateReels();
        for (let i = spinsAwarded; i > 0; i--) {
            freeSpinsRemaining = i;
            if (reelGameFreeSpinsCounterEl) reelGameFreeSpinsCounterEl.innerText = `Free Spins: ${i}`;
            updateSpinButtonText();
            await spinReels();
            await wait(1000);
        }
        isSpinning = true;
        freeSpinsRemaining = 0;
        updateSpinButtonText();
        showReelOverlay("");
        reelGameOverlayTitle.innerText = "";
        reelGameOverlayText.innerText = "0";
        await animateBonusTotalWin(reelGameOverlayTitle, reelGameOverlayText, freeSpinsTotalWin);
        skipBonusWinAnimation = null;
        await wait(2000);
        hideReelOverlay();
        await wait(500);
        gameState.dust += freeSpinsTotalWin;
        isFreeSpins = false;
        isAutoSpinning = false;
        isSpinning = false;
        populateReels();
        updateBetDisplays();
        syncReelGameUI();
        if (window.refreshGameUI) window.refreshGameUI();
        if (reelGameFreeSpinsCounterEl) reelGameFreeSpinsCounterEl.classList.add('hidden');
    }

    function handleSpinClick() {
        audioManager.playSound('click');
        if (isFreeSpins) return;

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
    window.dev_triggerFreeSpins = triggerFreeSpins;
    window.openReelGame = openReelGame; // Ensure this is exposed too
    populateReels();

});