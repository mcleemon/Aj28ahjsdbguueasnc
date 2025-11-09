// mimic.js
// v1.0.0
import { GAME_ASSETS } from './assets.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GET ELEMENTS ---
    const mimicModal = document.getElementById('mimic-modal');
    const openMimicButton = document.getElementById('scroll-mimic-button');
    const closeMimicButton = document.getElementById('close-mimic-button');
    const feedButton = document.getElementById('feed-mimic-button');
    const mimicImage = document.getElementById('mimic-image');
    const mimicRewardGem = document.getElementById('mimic-reward-gem');

    const stageText = document.getElementById('mimic-stage-text');
    const progressBarInner = document.getElementById('mimic-progress-bar-inner');
    const progressText = document.getElementById('mimic-progress-text');
    const costText = document.getElementById('mimic-cost-text');
    const attemptsText = document.getElementById('mimic-attempts-text');
    const rewardText = document.getElementById('mimic-reward-text');
    const resultText = document.getElementById('mimic-result-text');

    // --- 2. GET SHARED STATE & FUNCTIONS ---
    let gameState = window.gameState;
    const saveGame = window.saveGameGlobal;
    const formatNumber = window.formatNumberGlobal;

    // --- 3. CONSTANTS ---
    const FEEDS_PER_REWARD = 25;
    const MAX_FEEDS_PER_DAY = 3;
    const BASE_COST = 50000;
    const COST_PER_STAGE = 5000;

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

        const nextReward = gameState.mimicStage;
        const gemIconHtml_reward = `<img src="${GAME_ASSETS.iconGem}" class="inline-icon" alt="Gem">`;
        rewardText.innerHTML = `Next Reward: <span class="gem-reward-amount">${nextReward} ${gemIconHtml_reward}</span>`;

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
        mimicImage.classList.add('egg-wobble'); // Re-use the egg animation
        setTimeout(() => mimicImage.classList.remove('egg-wobble'), 500); // 500ms = 0.5s

        resultText.innerText = `The Mimic chews... (${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD})`;

        // ... (inside onFeedMimic, after mimicFeedProgress++)

        // --- 2. Check for Reward ---
        if (gameState.mimicFeedProgress >= FEEDS_PER_REWARD) {
            // It's a reward!
            // First, update the bar to show 25/25
            updateMimicUI();

            // Then, play the animation which will handle the reset
            const gemReward = gameState.mimicStage;
            playMimicRewardAnimation(gemReward);

        } else {
            // Not a reward, just a normal feed
            resultText.innerText = `The Mimic chews... (${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD})`;

            // --- 3. Save and Update ---
            if (typeof saveGame === 'function') saveGame();
            updateMimicUI();
            if (window.refreshGameUI) window.refreshGameUI();
        }
    }

    function playMimicRewardAnimation(gemReward) {
        // 1. Disable button, show waking text
        feedButton.disabled = true;
        resultText.innerText = "The Mimic is waking up...";

        // --- STEP 1: Pause ---
        setTimeout(() => {
            // 2. Show Open Eye (Instant)
            mimicImage.src = GAME_ASSETS.mimicOpen;

            // --- STEP 2: Wait 1 sec ---
            setTimeout(() => {

                // 3. --- THIS IS THE FIX ---
                // Preload the mouth image *before* showing it
                const mouthImg = new Image();
                mouthImg.onload = () => {
                    // --- STEP 4: (Runs ONLY after image is loaded) ---
                    // Now we can show the mouth and gem at the same time
                    mimicImage.src = mouthImg.src; // Instant swap
                    mimicRewardGem.classList.remove('hidden'); // Start gem fade-in

                    // --- STEP 5: Wait for gem to fade in ---
                    setTimeout(() => {
                        // 4. Show Reward Text
                        const gemIconHtml = `<img src="${GAME_ASSETS.iconGem}" class="inline-icon" alt="Gem">`;
                        resultText.innerHTML = `It spits out ${gemReward} ${gemIconHtml}`;

                        // 5. Update Game State
                        gameState.gemShards += gemReward;
                        gameState.mimicFeedProgress = 0;
                        gameState.mimicStage++;
                        if (typeof saveGame === 'function') saveGame();
                        if (window.refreshGameUI) window.refreshGameUI();

                        // --- STEP 6: Wait to read reward ---
                        setTimeout(() => {
                            // --- HIDE THE GEM ---
                            mimicRewardGem.classList.add('hidden');

                            // --- STEP 7: Wait for gem to fade out ---
                            setTimeout(() => {
                                // 6. Back to default (Instant)
                                mimicImage.src = GAME_ASSETS.mimicClose;
                                // 7. Re-enable UI
                                updateMimicUI(); // This shows new cost/stage and re-enables button
                            }, 300); // 0.3s gem fade-out
                        }, 2000); // 2s to read reward
                    }, 300); // 0.3s gem fade-in
                };

                // This triggers the .onload event above
                mouthImg.src = GAME_ASSETS.mimicMouth;

            }, 1000); // 1s pause on open eye
        }, 500); // 0.5s pause before starting
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

    // --- 6. DEV CHEAT FUNCTIONS ---

    /**
     * Cheat function to force a feed, bypassing cost and daily limits.
     * Adds 1M dust if the player can't afford it.
     */
    function dev_forceFeed() {
        console.log('[DEV] Forcing Mimic Feed...');

        // 1. Give dust if needed
        const cost = getMimicCost();
        if (gameState.dust < cost) {
            console.log('[DEV] Not enough dust, adding 1M...');
            gameState.dust += 1000000;
        }

        // 2. Pay cost
        gameState.dust -= cost;

        // 3. Bypass daily limit
        if (gameState.mimicFeedsToday >= MAX_FEEDS_PER_DAY) {
            console.log(`[DEV] Daily limit was ${gameState.mimicFeedsToday}, feeding anyway.`);
        }
        gameState.mimicFeedsToday++; // Still increment to test UI text

        // 4. Add Progress
        gameState.mimicFeedProgress++;

        // 5. Check for Reward
        if (gameState.mimicFeedProgress >= FEEDS_PER_REWARD) {
            // It's a reward! Let the animation handle the reset.
            console.log('[DEV] Triggering reward animation...');
            const gemReward = gameState.mimicStage;
            playMimicRewardAnimation(gemReward); // This handles the save/reset
        } else {
            // Not a reward, just update and save
            resultText.innerText = `[DEV] Fed... (${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD})`;
            if (typeof saveGame === 'function') saveGame();
            updateMimicUI();
            if (window.refreshGameUI) window.refreshGameUI();
        }
    }

    /**
     * Cheat function to set the progress bar to 24/25.
     */
    function dev_setNextReward() {
        console.log(`[DEV] Setting Mimic Feed to ${FEEDS_PER_REWARD - 1}/${FEEDS_PER_REWARD}`);
        gameState.mimicFeedProgress = FEEDS_PER_REWARD - 1;
        updateMimicUI();
    }

    function dev_resetFeeds() {
        console.log('[DEV] Resetting daily mimic feeds to 0...');
        gameState.mimicFeedsToday = 0;
        updateMimicUI();
    }

    // Expose cheat functions to the global window
    window.dev_forceFeed = dev_forceFeed;
    window.dev_setNextReward = dev_setNextReward;
    window.dev_resetFeeds = dev_resetFeeds;

});