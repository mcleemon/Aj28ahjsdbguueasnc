// blackjack.js
// v1.1.23 (Fixed Win Target & Bet Animation)
import { GAME_ASSETS } from './assets.js';
import { incrementStat } from './achievements.js';
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GET ALL ELEMENTS ---

    // Screen containers
    const bodyEl = document.body;
    const gameContainer = document.querySelector('.game-container');
    const blackjackScreen = document.getElementById('blackjack-screen');
    const gameWrapper = document.getElementById('game-wrapper');

    // Get the MAIN game's dust counter
    const mainDustCounter = document.getElementById('dust-counter');

    // Blackjack-specific elements
    const blackjackButton = document.getElementById('scroll-blackjack-button');
    const backButton = document.getElementById('blackjack-back-button');
    const messageEl = document.getElementById('blackjack-message');

    // Hand containers
    const dealerHandEl = document.getElementById('dealer-hand');
    const dealerScoreEl = document.getElementById('dealer-score');
    const playerHandEl = document.getElementById('player-hand');
    const playerScoreEl = document.getElementById('player-score');

    // Status Bar Elements
    const dustAmountEl = document.getElementById('blackjack-dust-amount');
    const levelTextEl = document.getElementById('blackjack-level-text');
    const levelBarInnerEl = document.getElementById('level-bar-inner');

    // Control buttons
    const chipBettingRow = document.getElementById('chip-betting-row');
    const chipButtons = document.querySelectorAll('.chip-button');
    const actionButtonRow = document.getElementById('action-button-row');
    const btnClearBet = document.getElementById('btn-clear-bet');
    const btnDeal = document.getElementById('btn-deal');
    const btnHit = document.getElementById('btn-hit');
    const btnStand = document.getElementById('btn-stand');
    const btnDouble = document.getElementById('btn-double');
    const btnSplit = document.getElementById('btn-split');
    const insuranceRow = document.getElementById('insurance-row');
    const btnInsuranceYes = document.getElementById('btn-insurance-yes');
    const btnInsuranceNo = document.getElementById('btn-insurance-no');


    // --- 2. GAME VARIABLES ---
    let gameState = window.gameState || {};
    let deck = [];
    let playerHands = [];
    let playerScores = [];
    let handBets = [];
    let currentHandIndex = 0;
    let dealerHand = [];
    let dealerScore = 0;
    let insuranceBet = 0;
    let currentBet = 0;
    const EXP_PER_LEVEL = 100;
    const EXP_FOR_WIN = 10;
    const EXP_FOR_BLACKJACK = 25;
    const EXP_FOR_PLAY = 1;

    const dustIconHtml = `<img src="${GAME_ASSETS.iconCrystalDust}" class="inline-icon" alt="Dust">`;

    // --- 3. HELPER FUNCTIONS ---

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

    function syncDustCounters() {
        if (dustAmountEl) {
            dustAmountEl.innerText = formatNumber(gameState.dust);
        }
    }

    function getGameScale() {
        if (!gameWrapper) return 1;
        const rect = gameWrapper.getBoundingClientRect();
        if (gameWrapper.offsetWidth === 0) return 1; 
        return rect.width / gameWrapper.offsetWidth;
    }

    // --- 4. CORE GAME STATE FUNCTIONS ---

    function loadGameState() {
        try {
            if (window.gameState) {
                gameState = window.gameState;
            } else {
                const savedState = localStorage.getItem('reelRpgData');
                if (savedState) {
                    gameState = JSON.parse(savedState);
                } else {
                    gameState = { dust: 0, blackjack_level: 1, blackjack_exp: 0 };
                }
            }
        } catch (e) {
            console.error("Failed to load game state for Blackjack:", e);
            gameState = { dust: 0, blackjack_level: 1, blackjack_exp: 0 };
        }
    }

    function saveGameState() {
        try {
            if (window.saveGameGlobal) {
                window.saveGameGlobal();
            } else {
                console.warn("Global save function not found. Falling back to local-only save.");
                gameState.lastSavedTimestamp = Date.now();
                localStorage.setItem('reelRpgData', JSON.stringify(gameState));
            }
        } catch (e) {
            console.error("Failed to save game state from Blackjack:", e);
        }
    }

    // --- 5. UI FUNCTIONS ---

    function updateBlackjackUI() {
        loadGameState();
        dustAmountEl.innerText = formatNumber(gameState.dust);
        const level = gameState.blackjack_level;
        const exp = gameState.blackjack_exp;
        const expNeeded = (level + 1) * EXP_PER_LEVEL;
        const expPercent = (exp / expNeeded) * 100;
        levelTextEl.innerText = `Lv. ${level}`;
        levelBarInnerEl.style.width = `${expPercent}%`;
        chipButtons.forEach(button => {
            const betValue = parseInt(button.dataset.bet);
            if (gameState.dust < (currentBet + betValue)) {
                button.classList.add('disabled');
            } else {
                button.classList.remove('disabled');
            }
        });
        if (currentBet > 0) {
            btnDeal.innerText = `Deal ${formatNumber(currentBet)}`;
            btnDeal.disabled = false;
            btnClearBet.disabled = false;
        } else {
            btnDeal.innerText = "Place a Bet";
            btnDeal.disabled = true;
            btnClearBet.disabled = true;
        }
    }

    function animateBet(chipButton) {
        const currentScale = getGameScale();

        // 1. Get Screen Rects
        const startRect = chipButton.getBoundingClientRect();
        const stackRect = document.getElementById('bet-stack-area').getBoundingClientRect();
        const containerRect = blackjackScreen.getBoundingClientRect();

        // 2. Create the chip
        const flyingChip = document.createElement('img');
        flyingChip.src = chipButton.src;
        flyingChip.className = 'flying-chip';

        // 3. Calculate Start Position (Relative to Blackjack Screen)
        // Divide by scale to convert "Screen Pixels" back to "Game Pixels"
        const startX = (startRect.left - containerRect.left) / currentScale + (startRect.width / currentScale - 60) / 2;
        const startY = (startRect.top - containerRect.top) / currentScale + (startRect.height / currentScale - 60) / 2;
        
        flyingChip.style.left = `${startX}px`;
        flyingChip.style.top = `${startY}px`;

        // 4. Calculate End Position
        const endX = (stackRect.left - containerRect.left) / currentScale + (stackRect.width / currentScale - 60) / 2;
        const endY = (stackRect.top - containerRect.top) / currentScale + (stackRect.height / currentScale - 60) / 2;

        // 5. Add to DOM
        const animationContainer = document.getElementById('blackjack-animation-container');
        if (animationContainer) {
            animationContainer.appendChild(flyingChip);
        }
        
        // 6. Animate
        // Force reflow to ensure start position is rendered
        void flyingChip.offsetWidth;

        // Calculate deltas
        const moveX = endX - startX;
        const moveY = endY - startY;
        const randomRot = (Math.random() - 0.5) * 360;

        flyingChip.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        flyingChip.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${randomRot}deg) scale(0.9)`;
    }

    // --- 6. SCREEN TOGGLING ---

    function toggleScreen(showMainGame) {
        if (showMainGame) {
            gameContainer.classList.remove('hidden');
            blackjackScreen.classList.add('hidden');
            bodyEl.style.backgroundImage = `url('${GAME_ASSETS.background}')`;
            if (mainDustCounter) {
                mainDustCounter.innerText = formatNumber(gameState.dust);
            }
        } else {
            loadGameState();
            updateBlackjackUI();
            resetGame();
            bodyEl.style.backgroundImage = `url('${GAME_ASSETS.blackjackBackground}')`;
            gameContainer.classList.add('hidden');
            blackjackScreen.classList.remove('hidden');
        }
    }

    // --- 7. CARD FACTORY ---

    function createCardElement(card, isHidden = false) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('card');
        if (isHidden) {
            cardEl.classList.add('hidden-card');
            cardEl.style.backgroundImage = `url('${GAME_ASSETS.cardCover}')`;
            return cardEl;
        }
        let suitSymbol = '', suitClass = '';
        switch (card.suit) {
            case 'Spades': suitSymbol = '♠'; suitClass = 'card-spades'; break;
            case 'Clubs': suitSymbol = '♣'; suitClass = 'card-clubs'; break;
            case 'Hearts': suitSymbol = '♥'; suitClass = 'card-hearts'; break;
            case 'Diamonds': suitSymbol = '♦'; suitClass = 'card-diamonds'; break;
        }
        cardEl.classList.add(suitClass);
        const rankEl = document.createElement('span');
        rankEl.classList.add('rank');
        rankEl.innerText = card.rank;
        const suitEl = document.createElement('span');
        suitEl.classList.add('suit');
        suitEl.innerText = suitSymbol;
        cardEl.appendChild(rankEl);
        cardEl.appendChild(suitEl);
        return cardEl;
    }

    // --- 8. BLACKJACK CORE LOGIC ---

    function buildDeck() {
        deck = [];
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let i = 0; i < 6; i++) {
            for (let suit of suits) {
                for (let rank of ranks) {
                    let value = parseInt(rank);
                    if (['J', 'Q', 'K'].includes(rank)) value = 10;
                    if (rank === 'A') value = 11;
                    deck.push({ suit, rank, value });
                }
            }
        }
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function dealCard() {
        return deck.pop();
    }

    function calculateHandScore(hand) {
        let score = 0;
        let aceCount = 0;
        for (let card of hand) {
            score += card.value;
            if (card.rank === 'A') aceCount++;
        }
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return score;
    }

    // --- 9. GAME FLOW FUNCTIONS ---

    function clearBet() {
        currentBet = 0;
        document.getElementById('blackjack-animation-container').innerHTML = '';
        updateBlackjackUI();
    }

    function resetGame() {
        currentBet = 0;
        insuranceBet = 0;
        document.getElementById('blackjack-animation-container').innerHTML = '';
        playerHands = [];
        playerScores = [];
        handBets = [];
        currentHandIndex = 0;
        dealerHand = [];
        playerHandEl.innerHTML = '';
        dealerHandEl.innerHTML = '';
        playerScoreEl.innerText = '0';
        dealerScoreEl.innerText = '0';
        chipBettingRow.classList.remove('hidden');
        actionButtonRow.classList.remove('playing-phase');
        btnDeal.classList.remove('hidden');
        btnClearBet.classList.remove('hidden');
        btnHit.classList.add('hidden');
        btnStand.classList.add('hidden');
        btnDouble.classList.add('hidden');
        btnDouble.disabled = true;
        btnSplit.classList.add('hidden');
        btnSplit.disabled = true;
        messageEl.innerText = "PLACE MULTIPLE CHIPS";
        updateBlackjackUI();
    }

    function startGame() {
        if (currentBet <= 0 || isNaN(currentBet)) {
            console.error("Invalid Bet");
            return;
        }
        if (gameState.dust < currentBet) {
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        gameState.dust -= currentBet;
        incrementStat('totalMinigamesPlayed', 1);
        saveGameState();
        syncDustCounters();
        buildDeck();
        shuffleDeck();
        playerHands = [[dealCard(), dealCard()]];
        playerScores = [0];
        handBets = [currentBet];
        currentHandIndex = 0;
        dealerHand = [dealCard(), dealCard()];
        chipBettingRow.classList.add('hidden');
        actionButtonRow.classList.add('playing-phase');
        btnDeal.classList.add('hidden');
        btnClearBet.classList.add('hidden');
        btnHit.classList.remove('hidden');
        btnStand.classList.remove('hidden');
        btnHit.disabled = false;
        btnStand.disabled = false;
        btnDouble.classList.remove('hidden');
        btnSplit.classList.remove('hidden');

        if (gameState.dust >= currentBet) {
            btnDouble.disabled = false;
        } else {
            btnDouble.disabled = true;
        }

        const firstCard = playerHands[0][0];
        const secondCard = playerHands[0][1];
        if (firstCard.rank === secondCard.rank && gameState.dust >= currentBet) {
            btnSplit.disabled = false;
        } else {
            btnSplit.disabled = true;
        }

        messageEl.innerHTML = `YOUR TURN. BET: ${formatNumber(currentBet)} ${dustIconHtml}`;
        renderHands(true);
        const allCards = document.querySelectorAll('#blackjack-screen .card');
        allCards.forEach(card => card.classList.add('dealing'));
        setTimeout(() => {
            allCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.remove('dealing');
                }, index * 100);
            });
        }, 10);

        // --- INSURANCE LOGIC ---
        const dealerUpCard = dealerHand[0];
        if (dealerUpCard.rank === 'A') {
            messageEl.innerText = "Dealer has an Ace.";
            btnHit.classList.add('hidden');
            btnStand.classList.add('hidden');
            btnDouble.classList.add('hidden');
            btnSplit.classList.add('hidden');
            insuranceRow.classList.remove('hidden');
            const insuranceCost = currentBet / 2;
            if (gameState.dust < insuranceCost) {
                btnInsuranceYes.disabled = true;
            } else {
                btnInsuranceYes.disabled = false;
            }
        } else {
            playerScores[0] = calculateHandScore(playerHands[0]);
            if (playerScores[0] === 21) {
                messageEl.innerText = "Blackjack!";
                endGame(true, true);
            }
        }
    }

    function renderHands(hideDealerCard = false) {
        playerHandEl.innerHTML = '';
        dealerHandEl.innerHTML = '';
        playerHands.forEach((hand, index) => {
            const handDiv = document.createElement('div');
            handDiv.classList.add('split-hand');
            handDiv.dataset.handIndex = index;
            if (index === currentHandIndex && playerHands.length > 1) {
                handDiv.classList.add('active-hand');
            }
            hand.forEach(card => {
                handDiv.appendChild(createCardElement(card));
            });
            playerHandEl.appendChild(handDiv);
        });
        playerScores[currentHandIndex] = calculateHandScore(playerHands[currentHandIndex]);
        playerScoreEl.innerText = playerScores[currentHandIndex];
        if (hideDealerCard) {
            dealerScoreEl.innerText = '??';
            dealerHandEl.appendChild(createCardElement(dealerHand[0]));
            dealerHandEl.appendChild(createCardElement(dealerHand[1], true));
        } else {
            dealerScore = calculateHandScore(dealerHand);
            dealerScoreEl.innerText = dealerScore;
            dealerHand.forEach(card => {
                dealerHandEl.appendChild(createCardElement(card));
            });
        }
    }

    function playerHit() {
        btnDouble.disabled = true;
        btnSplit.disabled = true;
        btnHit.disabled = true;
        btnStand.disabled = true;
        let hand = playerHands[currentHandIndex];
        const newCard = dealCard();
        hand.push(newCard);
        const newCardEl = createCardElement(newCard);
        newCardEl.classList.add('dealing');
        const handDiv = playerHandEl.querySelector(`.split-hand[data-hand-index="${currentHandIndex}"]`);
        handDiv.appendChild(newCardEl);
        const animationTime = 500;
        setTimeout(() => {
            newCardEl.classList.remove('dealing');
        }, 10);
        playerScores[currentHandIndex] = calculateHandScore(hand);
        playerScoreEl.innerText = playerScores[currentHandIndex];
        if (playerScores[currentHandIndex] > 21) {
            messageEl.innerText = "Bust on this hand!";
            setTimeout(() => {
                playerStand();
            }, animationTime);
        } else {
            setTimeout(() => {
                btnHit.disabled = false;
                btnStand.disabled = false;
            }, animationTime);
        }
    }

    function playerStand() {
        if (currentHandIndex < playerHands.length - 1) {
            currentHandIndex++;
            messageEl.innerText = `Playing Hand ${currentHandIndex + 1}`;
            btnHit.disabled = false;
            btnStand.disabled = false;
            btnDouble.disabled = true;
            const firstCard = playerHands[currentHandIndex][0];
            const secondCard = playerHands[currentHandIndex][1];
            if (firstCard.rank === secondCard.rank && gameState.dust >= currentBet) {
                btnSplit.disabled = false;
            } else {
                btnSplit.disabled = true;
            }

            renderHands(true);
        } else {
            btnHit.classList.add('hidden');
            btnStand.classList.add('hidden');
            btnDouble.classList.add('hidden');
            btnSplit.classList.add('hidden');
            revealDealerHand(false);
        }
    }

    function playerSplit() {
        if (gameState.dust < currentBet) {
            messageEl.innerText = "Not enough dust to split.";
            return;
        }
        gameState.dust -= currentBet;
        saveGameState();
        let handToSplit = playerHands[currentHandIndex];
        let card1 = handToSplit[0];
        let card2 = handToSplit[1];
        let newHand1 = [card1, dealCard()];
        let newHand2 = [card2, dealCard()];
        playerHands.splice(currentHandIndex, 1, newHand1, newHand2);
        playerScores.splice(currentHandIndex, 1, 0, 0);
        handBets.splice(currentHandIndex, 1, currentBet, currentBet);
        btnSplit.disabled = true;
        btnHit.disabled = false;
        btnStand.disabled = false;
        if (gameState.dust >= currentBet) {
            btnDouble.disabled = true;
        } else {
            btnDouble.disabled = true;
        }
        messageEl.innerText = `Split! Playing Hand ${currentHandIndex + 1}`;
        renderHands(true);
        const allCards = document.querySelectorAll('#blackjack-screen .card');
        allCards.forEach(card => card.classList.add('dealing'));
        setTimeout(() => {
            allCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.remove('dealing');
                }, index * 100);
            });
        }, 10);
    }

    function playerDouble() {
        if (gameState.dust < currentBet) {
            messageEl.innerText = "Not enough dust to double!";
            return;
        }
        gameState.dust -= currentBet;
        saveGameState();
        handBets[currentHandIndex] = currentBet * 2;
        messageEl.innerText = `Doubled bet for this hand. One card...`;
        btnHit.disabled = true;
        btnStand.disabled = true;
        btnDouble.disabled = true;
        btnSplit.disabled = true;
        let hand = playerHands[currentHandIndex];
        const newCard = dealCard();
        hand.push(newCard);
        const newCardEl = createCardElement(newCard);
        newCardEl.classList.add('dealing');
        const handDiv = playerHandEl.querySelector(`.split-hand[data-hand-index="${currentHandIndex}"]`);
        handDiv.appendChild(newCardEl);
        setTimeout(() => {
            newCardEl.classList.remove('dealing');
        }, 10);
        playerScores[currentHandIndex] = calculateHandScore(hand);
        playerScoreEl.innerText = playerScores[currentHandIndex];
        setTimeout(playerStand, 1000);
    }

    function revealDealerHand(gameEnds = false) {
        dealerScore = calculateHandScore(dealerHand);
        dealerScoreEl.innerText = dealerScore;
        const hiddenCardEl = dealerHandEl.querySelector('.hidden-card');
        if (hiddenCardEl) {
            const faceUpCard = createCardElement(dealerHand[1]);
            faceUpCard.classList.add('is-fading-in');
            hiddenCardEl.classList.add('is-fading-out');
            setTimeout(() => {
                hiddenCardEl.replaceWith(faceUpCard);
                if (!gameEnds) {
                    messageEl.innerText = "Dealer's turn...";
                    setTimeout(dealerTurn, 1000);
                }
            }, 300);
        } else {
            if (!gameEnds) {
                messageEl.innerText = "Dealer's turn...";
                setTimeout(dealerTurn, 1000);
            }
        }
    }

    function dealerTurn() {
        dealerScore = calculateHandScore(dealerHand);
        let isSoft17 = false;
        if (dealerScore === 17) {
            let aceCount = 0;
            for (let card of dealerHand) {
                if (card.rank === 'A') aceCount++;
            }
            if (aceCount > 0 && (dealerScore - 10 * aceCount < 7)) {
                isSoft17 = true;
            }
        }

        if (dealerScore < 17 || isSoft17) {
            const newCard = dealCard();
            dealerHand.push(newCard);
            const newCardEl = createCardElement(newCard);
            newCardEl.classList.add('dealing');
            dealerHandEl.appendChild(newCardEl);
            setTimeout(() => {
                newCardEl.classList.remove('dealing');
            }, 10);
            dealerScore = calculateHandScore(dealerHand);
            dealerScoreEl.innerText = dealerScore;
            setTimeout(dealerTurn, 1000);
        } else {
            endGame();
        }
    }

    function handleInsuranceYes() {
        insuranceBet = currentBet / 2;
        gameState.dust -= insuranceBet;
        saveGameState();
        insuranceRow.classList.add('hidden');
        resolveInsurance();
    }

    function handleInsuranceNo() {
        insuranceBet = 0;
        insuranceRow.classList.add('hidden');
        resolveInsurance();
    }

    function resolveInsurance() {
        const dealerHiddenCard = dealerHand[1];
        if (dealerHiddenCard.value === 10) {
            revealDealerHand(true);
            if (insuranceBet > 0) {
                const winnings = insuranceBet * 2;
                const totalReturn = winnings + insuranceBet;
                gameState.dust += totalReturn;
                messageEl.innerHTML = `Dealer has Blackjack! You win ${formatNumber(winnings)} ${dustIconHtml} from insurance.`;
            } else {
                messageEl.innerHTML = "Dealer has Blackjack! You lose.";
            }
            window.isGameDirty = true;
            endGame(false, false);
        } else {
            if (insuranceBet > 0) {
                messageEl.innerHTML = `Dealer doesn't have Blackjack. You lose insurance. Your turn.`;
            } else {
                messageEl.innerHTML = `Dealer doesn't have Blackjack. Your turn.`;
            }
            btnHit.classList.remove('hidden');
            btnStand.classList.remove('hidden');
            btnDouble.classList.remove('hidden');
            btnSplit.classList.remove('hidden');
            playerScores[0] = calculateHandScore(playerHands[0]);
            if (playerScores[0] === 21) {
                messageEl.innerText = "Blackjack!";
                endGame(true, true);
            }
        }
    }

    function endGame(playerWon, isBlackjack = false) {
        btnHit.classList.add('hidden');
        btnStand.classList.add('hidden');
        btnDouble.classList.add('hidden');
        btnSplit.classList.add('hidden');
        dealerScore = calculateHandScore(dealerHand);
        let finalMessage = '';
        let totalWinnings = 0;
        let totalExpGained = 0;
        playerHands.forEach((hand, index) => {
            const betForThisHand = handBets[index];
            const handScore = calculateHandScore(hand);
            let handResultMsg = (playerHands.length > 1) ? `Hand ${index + 1}: ` : '';
            let handWinnings = 0;
            let handExp = EXP_FOR_PLAY;
            if (index === 0 && isBlackjack) {
                handWinnings = Math.floor(betForThisHand * 2.5);
                handResultMsg = `Blackjack! You Win ${formatNumber(handWinnings)} ${dustIconHtml}`;
                handExp += EXP_FOR_BLACKJACK;
            }
            else if (handScore > 21) {
                handResultMsg += `Bust (${handScore}). You lose. `;
                handWinnings = 0;
            }
            else if (dealerScore > 21) {
                handWinnings = betForThisHand * 2;
                handResultMsg += `Dealer busts! You win ${formatNumber(handWinnings)} ${dustIconHtml}`;
                handExp += EXP_FOR_WIN;
            }
            else if (handScore > dealerScore) {
                handWinnings = betForThisHand * 2;
                handResultMsg += `You win (${handScore} vs ${dealerScore})! ${formatNumber(handWinnings)} ${dustIconHtml}`;
                handExp += EXP_FOR_WIN;
            } else if (handScore < dealerScore) {
                handResultMsg += `You lose (${handScore} vs ${dealerScore}). `;
                handWinnings = 0;
            } else {
                handWinnings = betForThisHand;
                handResultMsg += `Push (${handScore} vs ${dealerScore}). Bet returned ${formatNumber(handWinnings)} ${dustIconHtml}`;
            }
            finalMessage += handResultMsg + "<br>";
            totalWinnings += handWinnings;
            totalExpGained += handExp;
        });

        gameState.dust += totalWinnings;
        gameState.blackjack_exp += totalExpGained;
        const expNeeded = (gameState.blackjack_level + 1) * EXP_PER_LEVEL;
        if (gameState.blackjack_exp >= expNeeded) {
            gameState.blackjack_level++;
            gameState.blackjack_exp -= expNeeded;
            const levelUpReward = 10000 + ((gameState.blackjack_level - 1) * 5000);
            gameState.dust += levelUpReward;
            let levelUpMessage = ` (Level Up to ${gameState.blackjack_level}!)<br>+${formatNumber(levelUpReward)} ${dustIconHtml} Reward!`;
            if (gameState.blackjack_level % 5 === 0) {
                const gemReward = gameState.blackjack_level / 5;
                gameState.gemShards += gemReward;
                const gemIconHtml = `<img src="${GAME_ASSETS.iconGem}" class="inline-icon" alt="Gem">`;
                levelUpMessage += `<br>+${gemReward} ${gemIconHtml} Bonus!`;
            }
            finalMessage += levelUpMessage;
        }
        messageEl.innerHTML = finalMessage;
        saveGameState();
        
        // --- CHIP WIN ANIMATION FIX ---
        setTimeout(() => {
            const allCards = document.querySelectorAll('#blackjack-screen .card');
            const allChips = document.querySelectorAll('#blackjack-animation-container .flying-chip');
            const currentScale = getGameScale();
            const containerRect = blackjackScreen.getBoundingClientRect();

            // 1. Fade out cards (Keep existing behavior)
            allCards.forEach(card => {
                card.classList.remove('is-fading-in');
                card.classList.add('clearing-table');
            });

            // 2. Determine Chip Destination
            let targetTop, targetLeft;

            if (totalWinnings > 0) {
                // PLAYER WINS: Fly to Bottom Center (Player Area)
                // We target the controls area/stack area
                targetLeft = (blackjackScreen.offsetWidth / 2) - 30; // Center
                targetTop = blackjackScreen.offsetHeight - 150; // Controls area
            } else {
                // DEALER WINS: Fly Up (Dealer Area)
                targetTop = -200; // Fly off top
                targetLeft = (blackjackScreen.offsetWidth / 2) - 30; 
            }

            // 3. Animate Chips
            allChips.forEach((chip, index) => {
                setTimeout(() => {
                    chip.style.transition = 'all 0.6s ease-in';
                    chip.style.top = `${targetTop}px`;
                    chip.style.left = `${targetLeft}px`;
                    chip.style.opacity = '0'; 
                    chip.style.transform = 'scale(0.5)';
                }, index * 50);
            });

            // 4. Reset Game after animation finishes
            setTimeout(() => {
                resetGame();
            }, 1000); 
        }, 2500);
    }

    // --- 10. ATTACH EVENT LISTENERS ---

    blackjackButton.addEventListener('click', () => {
        toggleScreen(false);
    });

    backButton.addEventListener('click', () => {
        saveGameState();
        toggleScreen(true);
        if (window.refreshGameUI) {
            window.refreshGameUI();
        }
    });

    btnClearBet.addEventListener('click', clearBet);
    chipButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('disabled')) {
                return;
            }
            const betValue = parseInt(button.dataset.bet);
            currentBet += betValue;
            animateBet(button);
            updateBlackjackUI();
        });
    });

    btnDeal.addEventListener('click', startGame);
    btnHit.addEventListener('click', playerHit);
    btnStand.addEventListener('click', playerStand);
    btnDouble.addEventListener('click', playerDouble);
    btnSplit.addEventListener('click', playerSplit);
    btnInsuranceYes.addEventListener('click', handleInsuranceYes);
    btnInsuranceNo.addEventListener('click', handleInsuranceNo);

});