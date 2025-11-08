// mimic.js
// v1.0.0
import { GAME_ASSETS } from './assets.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GET ELEMENTS ---
    const mimicModal = document.getElementById('mimic-modal');
    const openMimicButton = document.getElementById('scroll-mimic-button');
    const closeMimicButton = document.getElementById('close-mimic-button');
    const feedButton = document.getElementById('feed-mimic-button');

    const stageText = document.getElementById('mimic-stage-text');
    const progressBarInner = document.getElementById('mimic-progress-bar-inner');
    const progressText = document.getElementById('mimic-progress-text');
    const costText = document.getElementById('mimic-cost-text');
    const attemptsText = document.getElementById('mimic-attempts-text');
    const resultText = document.getElementById('mimic-result-text');

    // --- 2. GET SHARED STATE & FUNCTIONS ---
    let gameState = window.gameState;
    const saveGame = window.saveGameGlobal;
    const formatNumber = window.refreshGameUI; // Re-using formatNumber from main script

    // --- 3. CONSTANTS ---
    const FEEDS_PER_REWARD = 25;
    const MAX_FEEDS_PER_DAY = 3;
    const BASE_COST = 10000;
    const COST_PER_STAGE = 1000;

    // --- 4. CORE FUNCTIONS ---

    /**
     * Calculates the cost for the *current* feed.
     */
    function getMimicCost() {
        return BASE_COST + ((gameState.mimicStage - 1) * COST_PER_STAGE);
    }

    /**
     * Checks if it's a new day and resets daily attempts if necessary.
     */
    function checkDailyReset() {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        if (gameState.mimicLastFeedDate !== today) {
            gameState.mimicFeedsToday = 0;
            gameState.mimicLastFeedDate = today;
            // No save needed here, will be saved on next feed.
        }
    }

    /**
     * Updates all text and buttons in the modal.
     */
    function updateMimicUI() {
        if (!gameState) gameState = window.gameState;

        const cost = getMimicCost();
        const feedsLeft = MAX_FEEDS_PER_DAY - gameState.mimicFeedsToday;

        stageText.innerText = `Mimic Stage: ${gameState.mimicStage}`;
        progressText.innerText = `${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD}`;
        progressBarInner.style.width = `${(gameState.mimicFeedProgress / FEEDS_PER_REWARD) * 100}%`;

        attemptsText.innerText = `Daily Feeds Remaining: ${feedsLeft} / ${MAX_FEEDS_PER_DAY}`;

        // Re-using the formatNumber function from script.js
        const dustIconHtml = `<img src="${GAME_ASSETS.iconCrystalDust}" class="inline-icon" alt="Dust">`;
        costText.innerHTML = `Cost: ${typeof formatNumber === 'function' ? formatNumber(cost) : cost} ${dustIconHtml}`;

        // Disable button if no attempts or not enough dust
        if (feedsLeft <= 0) {
            feedButton.disabled = true;
            resultText.innerText = "The Mimic is full. Come back tomorrow.";
        } else if (gameState.dust < cost) {
            feedButton.disabled = true;
            resultText.innerText = "Not enough dust!";
        } else {
            feedButton.disabled = false;
            resultText.innerText = "The Mimic looks hungry...";
        }
    }

    /**
     * The main logic when the "Feed" button is clicked.
     */
    function onFeedMimic() {
        // Double-check all conditions
        checkDailyReset(); // Check just in case
        const cost = getMimicCost();
        const feedsLeft = MAX_FEEDS_PER_DAY - gameState.mimicFeedsToday;

        if (feedsLeft <= 0 || gameState.dust < cost) {
            updateMimicUI(); // Update UI to show why it failed
            return;
        }

        // --- 1. Pay the Cost ---
        gameState.dust -= cost;
        gameState.mimicFeedsToday++;
        gameState.mimicFeedProgress++;

        resultText.innerText = `The Mimic chews... (${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD})`;

        // --- 2. Check for Reward ---
        if (gameState.mimicFeedProgress >= FEEDS_PER_REWARD) {

            // Calculate Reward: 1 gem, +1 every 10 stages
            const gemReward = gameState.mimicStage;
            gameState.gemShards += gemReward;

            // Show reward message
            const gemIconHtml = `<img src="${GAME_ASSETS.iconGem}" class="inline-icon" alt="Gem">`;
            resultText.innerHTML = `It spits out ${gemReward} ${gemIconHtml}!`;

            // Reset & Advance
            gameState.mimicFeedProgress = 0;
            gameState.mimicStage++;

        }

        // --- 3. Save and Update ---
        if (typeof saveGame === 'function') {
            saveGame();
        }
        updateMimicUI();

        // Also update the main dust counter in the header
        if (window.refreshGameUI) {
            window.refreshGameUI();
        }
    }

    // --- 5. EVENT LISTENERS ---

    openMimicButton.addEventListener('click', () => {
        if (!gameState) gameState = window.gameState;

        checkDailyReset(); // Check and reset daily counter if needed
        updateMimicUI();   // Update UI with correct data
        mimicModal.classList.remove('hidden');
    });

    closeMimicButton.addEventListener('click', () => {
        mimicModal.classList.add('closing');
        setTimeout(() => {
            mimicModal.classList.add('hidden');
            mimicModal.classList.remove('closing');
        }, 300); // 300ms matches CSS animation
    });

    feedButton.addEventListener('click', onFeedMimic);

});