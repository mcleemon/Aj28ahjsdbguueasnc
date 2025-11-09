// blackjack.js
// v1.1.6 - Adds Insurance mechanic
import { GAME_ASSETS } from './assets.js';
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GET ALL ELEMENTS ---

    // Screen containers
    const gameContainer = document.querySelector('.game-container');
    const blackjackScreen = document.getElementById('blackjack-screen');

    // --- THIS IS NEW ---
    // Get the MAIN game's dust counter
    const mainDustCounter = document.getElementById('dust-counter');

    // Blackjack-specific elements
    const blackjackButton = document.getElementById('scroll-blackjack-button');
    const backButton = document.getElementById('blackjack-back-button');
    const messageEl = document.getElementById('blackjack-message');

    // (rest of your elements... dealerHandEl, playerScoreEl, etc.)
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
    let playerHands = []; // Renamed to plural
    let playerScores = []; // Renamed to plural
    let handBets = [];
    let currentHandIndex = 0; // NEW: Tracks which hand we're playing
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


    // --- 4. CORE GAME STATE FUNCTIONS ---

    function loadGameState() {
        try {
            if (window.gameState) {
                gameState = window.gameState; // use shared state
            } else {
                const savedState = localStorage.getItem('golemEggGameState');
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
                // Call the main script's save function
                // This version handles Cloud Storage and Checksums!
                window.saveGameGlobal();
            } else {
                // Fallback just in case (the old, buggy way)
                console.warn("Global save function not found. Falling back to local-only save.");
                gameState.lastSavedTimestamp = Date.now();
                localStorage.setItem('golemEggGameState', JSON.stringify(gameState));
            }
        } catch (e) {
            console.error("Failed to save game state from Blackjack:", e);
        }
    }



    // --- 5. UI FUNCTIONS ---

    function updateBlackjackUI() {
        loadGameState();

        // 1. Update Dust Counter
        dustAmountEl.innerText = formatNumber(gameState.dust);

        // 2. Update Level and EXP Bar
        const level = gameState.blackjack_level;
        const exp = gameState.blackjack_exp;
        const expNeeded = level * EXP_PER_LEVEL;
        const expPercent = (exp / expNeeded) * 100;

        levelTextEl.innerText = `Lv. ${level}`;
        levelBarInnerEl.style.width = `${expPercent}%`;

        // 3. Update Bet buttons
        chipButtons.forEach(button => {
            const betValue = parseInt(button.dataset.bet);
            // Use classes instead of .disabled property
            if (gameState.dust < (currentBet + betValue)) {
                button.classList.add('disabled');
            } else {
                button.classList.remove('disabled');
            }
        });

        // 4. Update Deal button
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
        // 1. Get Start and End positions
        const startRect = chipButton.getBoundingClientRect();
        const stackRect = document.getElementById('bet-stack-area').getBoundingClientRect();
        const containerRect = blackjackScreen.getBoundingClientRect();

        // 2. Create the chip
        const flyingChip = document.createElement('img');
        flyingChip.src = chipButton.src;
        flyingChip.className = 'flying-chip';

        // 3. Set start position
        const startX = startRect.left - containerRect.left + (startRect.width - 60) / 2;
        const startY = startRect.top - containerRect.top + (startRect.height - 60) / 2;
        flyingChip.style.left = `${startX}px`;
        flyingChip.style.top = `${startY}px`;

        // 4. Calculate end position (center of the stack)
        const endX = stackRect.left - containerRect.left + (stackRect.width - 60) / 2;
        const endY = stackRect.top - containerRect.top + (stackRect.height - 60) / 2;

        // 5. Calculate travel distance
        const travelX = endX - startX;
        const travelY = endY - startY;

        // 6. Add to DOM and animate
        const animationContainer = document.getElementById('blackjack-animation-container');
        if (animationContainer) {
            animationContainer.appendChild(flyingChip);
        }

        // --- THIS IS THE MODIFIED PART ---
        // We wait 10ms for it to render, then send it to its final spot.
        setTimeout(() => {
            // Add a random offset to make a "messy" stack
            const offsetX = (Math.random() - 0.5) * 30; // +/- 15px
            const offsetY = (Math.random() - 0.5) * 10; // +/- 5px
            const rotation = (Math.random() - 0.5) * 20; // +/- 10 degrees

            flyingChip.style.transform = `translate(${travelX + offsetX}px, ${travelY + offsetY}px) rotate(${rotation}deg) scale(0.9)`;
            // NO opacity change, and NO .remove() timeout
        }, 10);
    }

    // --- 6. SCREEN TOGGLING ---

    function toggleScreen(showMainGame) {
        if (showMainGame) {
            gameContainer.classList.remove('hidden');
            blackjackScreen.classList.add('hidden');

            // --- THIS IS THE FIX ---
            // Manually update the main screen's UI
            if (mainDustCounter) {
                mainDustCounter.innerText = formatNumber(gameState.dust);
            }
            // --- END OF FIX ---

        } else {
            loadGameState();
            updateBlackjackUI();
            resetGame();
            gameContainer.classList.add('hidden');
            blackjackScreen.classList.remove('hidden');
        }
    }

    // --- 7. "CARD FACTORY" (Option B) ---

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

        // --- ADD THIS LOOP ---
        for (let i = 0; i < 6; i++) {
            // --- (This is your old code, just indented) ---
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
        playerHands = []; // Updated to plural
        playerScores = []; // Added this
        handBets = [];
        currentHandIndex = 0; // Added this
        dealerHand = [];

        // Clear hands on table
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

        btnDouble.classList.add('hidden'); // This is the fix
        btnDouble.disabled = true;
        btnSplit.classList.add('hidden'); // This is the fix
        btnSplit.disabled = true;

        messageEl.innerText = "PLACE MULTIPLE CHIPS";
        updateBlackjackUI();
    }

    function startGame() {
        gameState.dust -= currentBet;
        saveGameState();
        syncDustCounters();


        // Reset game state
        buildDeck();
        shuffleDeck();
        playerHands = [[dealCard(), dealCard()]]; // Now an array of hands
        playerScores = [0]; // One score for our one hand
        handBets = [currentBet];
        currentHandIndex = 0;
        dealerHand = [dealCard(), dealCard()];

        // Show/Hide buttons
        chipBettingRow.classList.add('hidden');
        actionButtonRow.classList.add('playing-phase');

        btnDeal.classList.add('hidden');
        btnClearBet.classList.add('hidden');

        btnHit.classList.remove('hidden');
        btnStand.classList.remove('hidden');

        btnHit.disabled = false;
        btnStand.disabled = false;
        btnDouble.classList.remove('hidden'); // Ensure it's visible
        btnSplit.classList.remove('hidden'); // Ensure it's visible

        // --- PHASE 2: Enable Double Button ---
        if (gameState.dust >= currentBet) {
            btnDouble.disabled = false;
        } else {
            btnDouble.disabled = true;
        }

        // --- PHASE 3: Enable Split Button ---
        const firstCard = playerHands[0][0];
        const secondCard = playerHands[0][1];
        if (firstCard.rank === secondCard.rank && gameState.dust >= currentBet) {
            btnSplit.disabled = false;
        } else {
            btnSplit.disabled = true;
        }

        messageEl.innerHTML = `YOUR TURN. BET: ${formatNumber(currentBet)} ${dustIconHtml}`;

        renderHands(true); // Cards are dealt, dealer's 1st card is visible

        const allCards = document.querySelectorAll('#blackjack-screen .card');
        allCards.forEach(card => card.classList.add('dealing'));

        setTimeout(() => {
            allCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.remove('dealing');
                }, index * 100); // Staggered deal
            });
        }, 10);

        // --- NEW INSURANCE LOGIC ---
        const dealerUpCard = dealerHand[0]; // Get the dealer's visible card

        if (dealerUpCard.rank === 'A') {
            // Dealer has an Ace - Offer Insurance
            messageEl.innerText = "Dealer has an Ace.";

            // Hide normal buttons
            btnHit.classList.add('hidden');
            btnStand.classList.add('hidden');
            btnDouble.classList.add('hidden');
            btnSplit.classList.add('hidden');

            // Show insurance buttons
            insuranceRow.classList.remove('hidden');

            // Disable 'Yes' if player can't afford it
            const insuranceCost = currentBet / 2;
            if (gameState.dust < insuranceCost) {
                btnInsuranceYes.disabled = true;
            } else {
                btnInsuranceYes.disabled = false;
            }

        } else {
            // Dealer does NOT have an Ace - Continue as normal

            // Check for immediate Blackjack
            playerScores[0] = calculateHandScore(playerHands[0]);
            if (playerScores[0] === 21) {
                messageEl.innerText = "Blackjack!";
                endGame(true, true);
            }
        }
    }

    // Renders the cards on the table
    function renderHands(hideDealerCard = false) {
        // Clear old cards
        playerHandEl.innerHTML = ''; // This is our main container
        dealerHandEl.innerHTML = '';

        // Redraw player hands
        playerHands.forEach((hand, index) => {
            // Create a new div for this specific hand
            const handDiv = document.createElement('div');
            handDiv.classList.add('split-hand');
            handDiv.dataset.handIndex = index;
            if (index === currentHandIndex && playerHands.length > 1) {
                handDiv.classList.add('active-hand'); // Highlight the current hand
            }

            // Add cards to this hand's div
            hand.forEach(card => {
                handDiv.appendChild(createCardElement(card));
            });

            // Add this hand's div to the main container
            playerHandEl.appendChild(handDiv);
        });

        // Update the main score display for the CURRENTLY active hand
        playerScores[currentHandIndex] = calculateHandScore(playerHands[currentHandIndex]);
        playerScoreEl.innerText = playerScores[currentHandIndex];

        // Redraw dealer hand
        if (hideDealerCard) {
            dealerScoreEl.innerText = '??'; // Hide score
            dealerHandEl.appendChild(createCardElement(dealerHand[0]));
            dealerHandEl.appendChild(createCardElement(dealerHand[1], true)); // The hidden card
        } else {
            dealerScore = calculateHandScore(dealerHand);
            dealerScoreEl.innerText = dealerScore;
            dealerHand.forEach(card => {
                dealerHandEl.appendChild(createCardElement(card));
            });
        }
    }

    function playerHit() {
        // --- 1. Disable all play buttons IMMEDIATELY ---
        btnDouble.disabled = true;
        btnSplit.disabled = true;
        btnHit.disabled = true;   // <-- NEW
        btnStand.disabled = true; // <-- NEW

        let hand = playerHands[currentHandIndex];
        const newCard = dealCard();
        hand.push(newCard);

        const newCardEl = createCardElement(newCard);
        newCardEl.classList.add('dealing'); // Add animation class
        const handDiv = playerHandEl.querySelector(`.split-hand[data-hand-index="${currentHandIndex}"]`);
        handDiv.appendChild(newCardEl);

        // This is the animation duration from your CSS (400ms) + a 100ms buffer
        const animationTime = 500;

        // Trigger the animation
        setTimeout(() => {
            newCardEl.classList.remove('dealing');
        }, 10);

        // Update score
        playerScores[currentHandIndex] = calculateHandScore(hand);
        playerScoreEl.innerText = playerScores[currentHandIndex];

        if (playerScores[currentHandIndex] > 21) {
            // --- 2. THIS IS THE BUST FIX ---
            messageEl.innerText = "Bust on this hand!";

            // Wait for the animation to finish, THEN call playerStand
            setTimeout(() => {
                playerStand();
            }, animationTime);

        } else {
            // --- 3. NOT A BUST ---
            // Wait for the animation to finish, then re-enable buttons
            setTimeout(() => {
                btnHit.disabled = false;
                btnStand.disabled = false;
            }, animationTime);
        }
    }

    function playerStand() {
        // Check if there are more hands to play
        if (currentHandIndex < playerHands.length - 1) {
            // Move to the next hand
            currentHandIndex++;
            messageEl.innerText = `Playing Hand ${currentHandIndex + 1}`;

            // Re-enable Hit/Stand
            btnHit.disabled = false;
            btnStand.disabled = false;

            // No Doubling After Splitting
            btnDouble.disabled = true;

            // Check if new hand can be Split
            const firstCard = playerHands[currentHandIndex][0];
            const secondCard = playerHands[currentHandIndex][1];
            if (firstCard.rank === secondCard.rank && gameState.dust >= currentBet) {
                btnSplit.disabled = false;
            } else {
                btnSplit.disabled = true;
            }

            renderHands(true);
        } else {
            // Last hand finished, start dealer's turn
            btnHit.classList.add('hidden');
            btnStand.classList.add('hidden');
            btnDouble.classList.add('hidden');
            btnSplit.classList.add('hidden');
            // Use our new flip animation function
            revealDealerHand(false); // false = game does NOT end
        }
    }

    function playerSplit() {
        // 1. Check if player can afford it
        if (gameState.dust < currentBet) {
            messageEl.innerText = "Not enough dust to split.";
            return;
        }

        // 2. Pay for the new hand
        gameState.dust -= currentBet;
        saveGameState();

        // 3. Get the current hand and the two cards
        let handToSplit = playerHands[currentHandIndex];
        let card1 = handToSplit[0];
        let card2 = handToSplit[1];

        // 4. Create the two new hands
        let newHand1 = [card1, dealCard()];
        let newHand2 = [card2, dealCard()];

        // 5. Replace the old hand with the two new hands
        // This line is complex: it replaces 1 item at currentHandIndex
        // with 2 new items (newHand1, newHand2)
        playerHands.splice(currentHandIndex, 1, newHand1, newHand2);

        // 6. Reset scores for the split hands
        playerScores.splice(currentHandIndex, 1, 0, 0);

        // 6b. Replace the one bet with two separate bets
        handBets.splice(currentHandIndex, 1, currentBet, currentBet);

        // 7. Hide split/double, show hit/stand
        // 7. Update buttons
        btnSplit.disabled = true; // Can't split a split (for now)
        btnHit.disabled = false;
        btnStand.disabled = false;

        // Check if new hand can be doubled
        if (gameState.dust >= currentBet) {
            btnDouble.disabled = true;
        } else {
            btnDouble.disabled = true;
        }

        messageEl.innerText = `Split! Playing Hand ${currentHandIndex + 1}`;

        // 8. Re-render the UI
        renderHands(true);
        const allCards = document.querySelectorAll('#blackjack-screen .card');
        allCards.forEach(card => card.classList.add('dealing'));

        setTimeout(() => {
            allCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.remove('dealing');
                }, index * 100); // Staggered deal
            });
        }, 10);
    }

    function playerDouble() {
        // Safety check: can they afford it?
        if (gameState.dust < currentBet) {
            messageEl.innerText = "Not enough dust to double!";
            return;
        }

        // 1. Subtract the additional bet
        gameState.dust -= currentBet;
        saveGameState();
        handBets[currentHandIndex] = currentBet * 2;
        messageEl.innerText = `Doubled bet for this hand. One card...`;

        // 2. Disable all buttons
        btnHit.disabled = true;
        btnStand.disabled = true;
        btnDouble.disabled = true;
        btnSplit.disabled = true;

        // 3. Deal ONE card
        let hand = playerHands[currentHandIndex];
        const newCard = dealCard();
        hand.push(newCard);

        // --- NEW ANIMATION LOGIC ---
        // 4. Create the new card element
        const newCardEl = createCardElement(newCard);
        newCardEl.classList.add('dealing'); // Add dealing class

        // 5. Find the correct hand-div to append to
        const handDiv = playerHandEl.querySelector(`.split-hand[data-hand-index="${currentHandIndex}"]`);
        handDiv.appendChild(newCardEl);

        // 6. Trigger the animation for just this new card
        setTimeout(() => {
            newCardEl.classList.remove('dealing');
        }, 10);
        // --- END OF NEW LOGIC ---

        // 7. Update score manually
        playerScores[currentHandIndex] = calculateHandScore(hand);
        playerScoreEl.innerText = playerScores[currentHandIndex];

        // 8. Automatically stand (move to next hand or dealer)
        setTimeout(playerStand, 1000);
    }

    // --- NEW FUNCTION for Card Flip ---
    // --- NEW FUNCTION for Card Flip (CORRECTED) ---
    function revealDealerHand(gameEnds = false) {
        dealerScore = calculateHandScore(dealerHand);
        dealerScoreEl.innerText = dealerScore;

        // 1. Find the hidden card element
        const hiddenCardEl = dealerHandEl.querySelector('.hidden-card');

        if (hiddenCardEl) {
            // 2. Create the new face-up card
            // (dealerHand[1] is the card that was hidden)
            const faceUpCard = createCardElement(dealerHand[1]);
            // This class makes it start faded out and fade in *after* 0.3s
            faceUpCard.classList.add('is-fading-in');

            // 3. Make the hidden card fade out
            hiddenCardEl.classList.add('is-fading-out');

            // 4. Wait for the fade-out (0.3s) to finish
            setTimeout(() => {
                // 5. AT THE HALFWAY POINT:
                // Instantly replace the (now invisible) hidden card
                // with the (still invisible) face-up card.
                hiddenCardEl.replaceWith(faceUpCard);

                // The 'is-fading-in' class on the new card will
                // now take over and fade it in *in the correct spot*.

                // 6. Continue the game
                if (!gameEnds) {
                    messageEl.innerText = "Dealer's turn...";
                    setTimeout(dealerTurn, 1000);
                }
            }, 300); // 300ms MUST match the 'fade-out-fast' animation time

        } else {
            // Fallback in case it was already revealed
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
            // --- NEW LOGIC: Manually add one card ---
            const newCard = dealCard();
            dealerHand.push(newCard);

            // 1. Create new card element
            const newCardEl = createCardElement(newCard);
            newCardEl.classList.add('dealing');

            // 2. Append it
            dealerHandEl.appendChild(newCardEl);

            // 3. Trigger animation
            setTimeout(() => {
                newCardEl.classList.remove('dealing');
            }, 10);

            // 4. Update score manually
            dealerScore = calculateHandScore(dealerHand);
            dealerScoreEl.innerText = dealerScore;
            // --- END OF NEW LOGIC ---

            setTimeout(dealerTurn, 1000);
        } else {
            endGame(); // endGame will not re-render, which is fine
        }
    }

    function handleInsuranceYes() {
        // 1. Calculate and pay for the insurance
        insuranceBet = currentBet / 2;
        gameState.dust -= insuranceBet;
        saveGameState();

        // 2. Hide the insurance row
        insuranceRow.classList.add('hidden');

        // 3. Check what happens next
        resolveInsurance();
    }

    function handleInsuranceNo() {
        // 1. Set insurance to zero
        insuranceBet = 0;

        // 2. Hide the insurance row
        insuranceRow.classList.add('hidden');

        // 3. Check what happens next
        resolveInsurance();
    }

    function resolveInsurance() {
        const dealerHiddenCard = dealerHand[1]; // Get the dealer's face-down card

        // SCENARIO 1: DEALER HAS BLACKJACK
        if (dealerHiddenCard.value === 10) {
            revealDealerHand(true);

            if (insuranceBet > 0) {
                // Player bought insurance and won
                const winnings = insuranceBet * 2;
                const totalReturn = winnings + insuranceBet; // Winnings + original bet back
                gameState.dust += totalReturn;
                messageEl.innerHTML = `Dealer has Blackjack! You win ${formatNumber(winnings)} ${dustIconHtml} from insurance.`;
            } else {
                // Player did not buy insurance and loses
                messageEl.innerHTML = "Dealer has Blackjack! You lose.";
            }

            // The hand is over. Let endGame handle the main bet loss.
            window.isGameDirty = true;
            endGame(false, false); // false = player didn't win, false = not player blackjack

        } else {
            // SCENARIO 2: DEALER DOES NOT HAVE BLACKJACK
            if (insuranceBet > 0) {
                // Player bought insurance and lost it
                messageEl.innerHTML = `Dealer doesn't have Blackjack. You lose insurance. Your turn.`;
            } else {
                // Player declined, game continues
                messageEl.innerHTML = `Dealer doesn't have Blackjack. Your turn.`;
            }

            // The game continues. Show the normal play buttons.
            btnHit.classList.remove('hidden');
            btnStand.classList.remove('hidden');
            btnDouble.classList.remove('hidden');
            btnSplit.classList.remove('hidden');

            // Now, run the check for player's Blackjack that we skipped earlier
            playerScores[0] = calculateHandScore(playerHands[0]);
            if (playerScores[0] === 21) {
                messageEl.innerText = "Blackjack!";
                endGame(true, true);
            }
        }
    }

    function endGame(playerWon, isBlackjack = false) {
        // Hide game buttons
        btnHit.classList.add('hidden');
        btnStand.classList.add('hidden');
        btnDouble.classList.add('hidden');
        btnSplit.classList.add('hidden');

        dealerScore = calculateHandScore(dealerHand);
        let finalMessage = '';
        let totalWinnings = 0;
        let totalProfit = 0;
        let totalExpGained = 0;

        // Loop through each hand the player played
        playerHands.forEach((hand, index) => {
            // --- THIS IS THE FIX ---
            const betForThisHand = handBets[index]; // Get the bet for *this* hand
            // --- END OF FIX ---

            const handScore = calculateHandScore(hand);
            let handResultMsg = (playerHands.length > 1) ? `Hand ${index + 1}: ` : '';
            let handWinnings = 0;
            let handExp = EXP_FOR_PLAY;

            // Check for forced blackjack (only possible on first hand)
            if (index === 0 && isBlackjack) {
                handWinnings = Math.floor(betForThisHand * 2.5); // Use betForThisHand
                handResultMsg = `Blackjack! You Win ${formatNumber(handWinnings)} ${dustIconHtml}`;
                handExp += EXP_FOR_BLACKJACK;
            }
            // Check for forced player bust
            else if (handScore > 21) {
                handResultMsg += `Bust (${handScore}). You lose. `;
                handWinnings = 0; // You already paid the bet
            }
            // Check dealer bust
            else if (dealerScore > 21) {
                handWinnings = betForThisHand * 2; // Use betForThisHand
                handResultMsg += `Dealer busts! You win ${formatNumber(handWinnings)} ${dustIconHtml}`;
                handExp += EXP_FOR_WIN;
            }
            // Compare hands
            else if (handScore > dealerScore) {
                handWinnings = betForThisHand * 2; // Use betForThisHand
                handResultMsg += `You win (${handScore} vs ${dealerScore})! ${formatNumber(handWinnings)} ${dustIconHtml}`;
                handExp += EXP_FOR_WIN;
            } else if (handScore < dealerScore) {
                handResultMsg += `You lose (${handScore} vs ${dealerScore}). `;
                handWinnings = 0;
            } else {
                // This is the "Push" (tie) case
                handWinnings = betForThisHand; // Use betForThisHand
                handResultMsg += `Push (${handScore} vs ${dealerScore}). Bet returned ${formatNumber(handWinnings)} ${dustIconHtml}`;
            }

            finalMessage += handResultMsg + "<br>";
            totalWinnings += handWinnings;
            totalExpGained += handExp;
        });

        // Add the total winnings back to dust
        gameState.dust += totalWinnings;

        // Add EXP and check for level up
        gameState.blackjack_exp += totalExpGained;
        const expNeeded = (gameState.blackjack_level + 1) * EXP_PER_LEVEL; // <-- FORMULA FIX

        if (gameState.blackjack_exp >= expNeeded) {
            gameState.blackjack_level++; // e.g., Level 0 -> 1
            gameState.blackjack_exp -= expNeeded; // Reset EXP bar, keep overflow

            // --- 1. NEW DUST REWARD ---
            // 10k, 15k, 20k...
            const levelUpReward = 10000 + ((gameState.blackjack_level - 1) * 5000);
            gameState.dust += levelUpReward;

            let levelUpMessage = ` (Level Up to ${gameState.blackjack_level}!)<br>+${formatNumber(levelUpReward)} ${dustIconHtml} Reward!`;

            // --- 2. NEW GEM REWARD ---
            if (gameState.blackjack_level % 5 === 0) {
                const gemReward = gameState.blackjack_level / 5; // Lv 5=1, Lv 10=2
                gameState.gemShards += gemReward;

                // We can re-use the GAME_ASSETS import
                const gemIconHtml = `<img src="${GAME_ASSETS.iconGem}" class="inline-icon" alt="Gem">`;
                levelUpMessage += `<br>+${gemReward} ${gemIconHtml} Bonus!`;
            }

            finalMessage += levelUpMessage; // Add all messages
        }

        messageEl.innerHTML = finalMessage; // Use .innerHTML for the <br>
        saveGameState();

        // Wait 3.5 seconds, then reset for next bet
        setTimeout(() => {
            resetGame();
        }, 3500);
    }

    // --- 10. ATTACH EVENT LISTENERS ---

    blackjackButton.addEventListener('click', () => {
        toggleScreen(false);
    });

    backButton.addEventListener('click', () => {
        saveGameState();
        toggleScreen(true);

        // ADD THIS NEW LINE:
        if (window.refreshGameUI) {
            window.refreshGameUI(); // Tell the main script to update!
        }
    });

    btnClearBet.addEventListener('click', clearBet);

    chipButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 1. Check if the button is visually disabled
            if (button.classList.contains('disabled')) {
                return; // Do nothing
            }

            // 2. Add the bet value
            const betValue = parseInt(button.dataset.bet);
            currentBet += betValue;

            // 3. Call the animation!
            animateBet(button);

            // 4. Update the UI (which will update the 'Deal' button)
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