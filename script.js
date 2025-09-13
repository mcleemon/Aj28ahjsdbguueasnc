document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand(); // Make the app full screen

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const golemEgg = document.getElementById('golem-egg');
    const hatchProgressBar = document.getElementById('hatch-progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Shop Elements
    const shopButton = document.getElementById('shop-button');
    const shopModal = document.getElementById('shop-modal');
    const closeShopButton = document.getElementById('close-shop-button');
    const buyChiselButton = document.getElementById('buy-chisel-button');
    const chiselLevelText = document.getElementById('chisel-level');
    const chiselEffectText = document.getElementById('chisel-effect');
    const chiselCostText = document.getElementById('chisel-cost');

    // --- GAME STATE ---
    let gameState = {
        dust: 0,
        dustPerTap: 1,
        hatchProgress: 0,
        hatchGoal: 10000,
        chiselLevel: 1,
        chiselBaseCost: 100,
    };

    // --- FUNCTIONS ---

    // Function to save game state to Telegram's cloud storage or local storage
    function saveGame() {
        // For now, we use localStorage. Later, we can explore Telegram's CloudStorage.
        localStorage.setItem('golemEggGameState', JSON.stringify(gameState));
    }

    // Function to load game state
    function loadGame() {
        const savedState = localStorage.getItem('golemEggGameState');
        if (savedState) {
            gameState = JSON.parse(savedState);
        }
    }
    
    // Function to update all UI elements from game state
    function updateUI() {
        dustCounter.innerText = Math.floor(gameState.dust);
        
        // Update progress bar
        const progressPercent = (gameState.hatchProgress / gameState.hatchGoal) * 100;
        hatchProgressBar.style.width = `${progressPercent}%`;
        progressText.innerText = `${Math.floor(gameState.hatchProgress)} / ${gameState.hatchGoal}`;

        // Update shop UI
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = gameState.dustPerTap;
        chiselCostText.innerText = getChiselCost();
    }
    
    // Function to calculate the cost of the next chisel upgrade
    function getChiselCost() {
        return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1));
    }

    // --- EVENT LISTENERS ---

    // When the egg is tapped
    golemEgg.addEventListener('click', () => {
        gameState.dust += gameState.dustPerTap;
        gameState.hatchProgress += gameState.dustPerTap;
        
        // Vibrate for feedback
        tg.HapticFeedback.impactOccurred('light');

        if (gameState.hatchProgress >= gameState.hatchGoal) {
            alert("Congratulations! The egg is hatching... To be continued!");
            // Here you would reset or move to the next phase in a future version
            gameState.hatchProgress = gameState.hatchGoal;
        }

        updateUI();
        saveGame(); // Save on every click to be safe
    });

    // Shop open/close events
    shopButton.addEventListener('click', () => shopModal.classList.remove('hidden'));
    closeShopButton.addEventListener('click', () => shopModal.classList.add('hidden'));

    // Buy Chisel event
    buyChiselButton.addEventListener('click', () => {
        const cost = getChiselCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.chiselLevel++;
            gameState.dustPerTap++; // Simple linear increase for now
            
            updateUI();
            saveGame();
        } else {
            alert("Not enough Crystal Dust!");
        }
    });

    // --- INITIALIZE GAME ---
    loadGame();
    updateUI();
});