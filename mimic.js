// mimic.js
// v1.0.4
import { GAME_ASSETS } from './assets.js';
import { incrementStat } from './achievements.js';

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
    let wobbleTimer = null;

    // --- 3. CONSTANTS ---
    const FEEDS_PER_REWARD = 25;
    const MAX_FEEDS_PER_DAY = 3;
    const BASE_COST = 50000;
    const COST_PER_STAGE = 5000;

    // --- 4. CORE FUNCTIONS ---
    function getMimicCost() {
        return BASE_COST + ((gameState.mimicStage - 1) * COST_PER_STAGE);
    }

    function checkDailyReset() {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        if (gameState.mimicLastFeedDate !== today) {
            gameState.mimicFeedsToday = 0;
            gameState.mimicLastFeedDate = today;
        }
    }

    function updateMimicUI() {
        if (!gameState) gameState = window.gameState;
        const cost = getMimicCost();
        const feedsLeft = MAX_FEEDS_PER_DAY - gameState.mimicFeedsToday;
        stageText.innerText = `Mimic Stage: ${gameState.mimicStage}`;
        progressText.innerText = `${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD}`;
        progressBarInner.style.width = `${(gameState.mimicFeedProgress / FEEDS_PER_REWARD) * 100}%`;
        attemptsText.innerText = `Daily Feeds Remaining: ${feedsLeft} / ${MAX_FEEDS_PER_DAY}`;
        const dustIconHtml = `<img src="${GAME_ASSETS.iconCrystalDust}" class="inline-icon" alt="Dust">`;
        costText.innerHTML = `Cost: ${typeof formatNumber === 'function' ? formatNumber(cost) : cost} ${dustIconHtml}`;
        const nextReward = gameState.mimicStage;
        const gemIconHtml_reward = `<img src="${GAME_ASSETS.iconGem}" class="inline-icon" alt="Gem">`;
        rewardText.innerHTML = `Next Reward: <span class="gem-reward-amount">${nextReward} ${gemIconHtml_reward}</span>`;
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

    function onFeedMimic() {
        checkDailyReset();
        const cost = getMimicCost();
        const feedsLeft = MAX_FEEDS_PER_DAY - gameState.mimicFeedsToday;
        if (feedsLeft <= 0 || gameState.dust < cost) {
            updateMimicUI();
            return;
        }
        gameState.dust -= cost;
        gameState.mimicFeedsToday++;
        gameState.mimicFeedProgress++;
        incrementStat('totalMimicFeeds', 1);
        mimicImage.classList.remove('monster-wobble');
        void mimicImage.offsetWidth;
        mimicImage.classList.add('monster-wobble');
        if (wobbleTimer) clearTimeout(wobbleTimer);
        wobbleTimer = setTimeout(() => mimicImage.classList.remove('monster-wobble'), 500);
        resultText.innerText = `The Mimic chews... (${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD})`;
        if (gameState.mimicFeedProgress >= FEEDS_PER_REWARD) {
            updateMimicUI();
            const gemReward = gameState.mimicStage;
            playMimicRewardAnimation(gemReward);

        } else {
            resultText.innerText = `The Mimic chews... (${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD})`;
            if (typeof saveGame === 'function') saveGame();
            updateMimicUI();
            if (window.refreshGameUI) window.refreshGameUI();
        }
    }

    function playMimicRewardAnimation(gemReward) {
        feedButton.disabled = true;
        resultText.innerText = "The Mimic is waking up...";

        // FIX: Use backgroundImage instead of src
        setTimeout(() => {
            mimicImage.style.backgroundImage = `url('${GAME_ASSETS.mimicOpen}')`;

            setTimeout(() => {
                // Preload mouth image logic adapted for Divs
                const mouthUrl = GAME_ASSETS.mimicMouth;
                const tempImg = new Image();
                tempImg.src = mouthUrl;

                tempImg.onload = () => {
                    mimicImage.style.backgroundImage = `url('${mouthUrl}')`;
                    mimicRewardGem.classList.remove('hidden');

                    setTimeout(() => {
                        const gemIconHtml = `<div class="inline-icon bg-icon" style="background-image: url('${GAME_ASSETS.iconGem}');"></div>`;
                        resultText.innerHTML = `It spits out ${gemReward} ${gemIconHtml}`;
                        gameState.gemShards += gemReward;
                        gameState.mimicFeedProgress = 0;
                        gameState.mimicStage++;
                        if (typeof saveGame === 'function') saveGame();
                        if (window.refreshGameUI) window.refreshGameUI();

                        setTimeout(() => {
                            mimicRewardGem.classList.add('hidden');
                            setTimeout(() => {
                                mimicImage.style.backgroundImage = `url('${GAME_ASSETS.mimicClose}')`;
                                updateMimicUI();
                            }, 300);
                        }, 2000);
                    }, 300);
                };
            }, 1000);
        }, 500);
    }

    // --- 5. EVENT LISTENERS ---

    openMimicButton.addEventListener('click', () => {
        if (!gameState) gameState = window.gameState;
        checkDailyReset();
        updateMimicUI();
        mimicModal.classList.remove('hidden');
    });

    closeMimicButton.addEventListener('click', () => {
        mimicModal.classList.add('closing');
        setTimeout(() => {
            mimicModal.classList.add('hidden');
            mimicModal.classList.remove('closing');
        }, 300);
    });

    feedButton.addEventListener('click', onFeedMimic);

    // --- 6. DEV CHEAT FUNCTIONS ---

    function dev_forceFeed() {
        console.log('[DEV] Forcing Mimic Feed...');
        const cost = getMimicCost();
        if (gameState.dust < cost) {
            console.log('[DEV] Not enough dust, adding 1M...');
            gameState.dust += 1000000;
        }
        gameState.dust -= cost;
        if (gameState.mimicFeedsToday >= MAX_FEEDS_PER_DAY) {
            console.log(`[DEV] Daily limit was ${gameState.mimicFeedsToday}, feeding anyway.`);
        }
        gameState.mimicFeedsToday++;
        gameState.mimicFeedProgress++;
        if (gameState.mimicFeedProgress >= FEEDS_PER_REWARD) {
            console.log('[DEV] Triggering reward animation...');
            const gemReward = gameState.mimicStage;
            playMimicRewardAnimation(gemReward);
        } else {
            resultText.innerText = `[DEV] Fed... (${gameState.mimicFeedProgress} / ${FEEDS_PER_REWARD})`;
            if (typeof saveGame === 'function') saveGame();
            updateMimicUI();
            if (window.refreshGameUI) window.refreshGameUI();
        }
    }

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

    window.dev_forceFeed = dev_forceFeed;
    window.dev_setNextReward = dev_setNextReward;
    window.dev_resetFeeds = dev_resetFeeds;

});