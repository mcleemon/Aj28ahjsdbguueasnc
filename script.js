document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const golemEgg = document.getElementById('golem-egg');
    const hatchProgressBar = document.getElementById('hatch-progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Shop Elements
    const shopButton = document.getElementById('shop-button');
    const shopModal = document.getElementById('shop-modal');
    const closeShopButton = document.getElementById('close-shop-button');
    
    // Chisel Elements
    const buyChiselButton = document.getElementById('buy-chisel-button');
    const chiselLevelText = document.getElementById('chisel-level');
    const chiselEffectText = document.getElementById('chisel-effect');
    const chiselCostText = document.getElementById('chisel-cost');
    
    // NEW --> Drone Elements
    const buyDroneButton = document.getElementById('buy-drone-button');
    const droneLevelText = document.getElementById('drone-level');
    const droneEffectText = document.getElementById('drone-effect');
    const droneCostText = document.getElementById('drone-cost');

    // --- GAME STATE ---
    let gameState = {
        dust: 0,
        dustPerTap: 1,
        hatchProgress: 0,
        hatchGoal: 10000,
        chiselLevel: 1,
        chiselBaseCost: 100,
        // NEW --> Drone State
        dustPerSecond: 0,
        droneLevel: 0,
        droneBaseCost: 250,
    };

    // --- FUNCTIONS ---

    function saveGame() {
        localStorage.setItem('golemEggGameState', JSON.stringify(gameState));
    }

    function loadGame() {
        const savedState = localStorage.getItem('golemEggGameState');
        if (savedState) {
            // Use Object.assign to merge saved state with defaults,
            // which prevents errors if we add new properties later.
            gameState = Object.assign(gameState, JSON.parse(savedState));
        }
    }
    
    function updateUI() {
        dustCounter.innerText = Math.floor(gameState.dust);
        
        const progressPercent = (gameState.hatchProgress / gameState.hatchGoal) * 100;
        hatchProgressBar.style.width = `${progressPercent}%`;
        progressText.innerText = `${Math.floor(gameState.hatchProgress)} / ${gameState.hatchGoal}`;

        // Update Chisel Shop UI
        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = gameState.dustPerTap;
        chiselCostText.innerText = getChiselCost();
        
        // NEW --> Update Drone Shop UI
        droneLevelText.innerText = gameState.droneLevel;
        droneEffectText.innerText = gameState.dustPerSecond;
        droneCostText.innerText = getDroneCost();
    }
    
    function getChiselCost() {
        return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1));
    }
    
    // NEW --> Function to calculate drone cost
    function getDroneCost() {
        return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel));
    }
    
    // NEW --> Function for passive dust generation
    function autoMine() {
        gameState.dust += gameState.dustPerSecond;
        gameState.hatchProgress += gameState.dustPerSecond;
        
        if (gameState.hatchProgress >= gameState.hatchGoal) {
            // We'll add a better win state later
            gameState.hatchProgress = gameState.hatchGoal;
        }

        updateUI();
        // We save the game every 5 seconds from here instead of every second to save resources
    }


    // --- EVENT LISTENERS ---

    golemEgg.addEventListener('click', () => {
        gameState.dust += gameState.dustPerTap;
        gameState.hatchProgress += gameState.dustPerTap;
        
        tg.HapticFeedback.impactOccurred('light');

        if (gameState.hatchProgress >= gameState.hatchGoal) {
            gameState.hatchProgress = gameState.hatchGoal;
        }

        updateUI();
    });

    shopButton.addEventListener('click', () => shopModal.classList.remove('hidden'));
    closeShopButton.addEventListener('click', () => shopModal.classList.add('hidden'));

    buyChiselButton.addEventListener('click', () => {
        const cost = getChiselCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.chiselLevel++;
            gameState.dustPerTap++;
            updateUI();
        } else {
            tg.HapticFeedback.notificationOccurred('error');
        }
    });
    
    // NEW --> Buy Drone event listener
    buyDroneButton.addEventListener('click', () => {
        const cost = getDroneCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.droneLevel++;
            gameState.dustPerSecond++; // Simple linear increase for now
            updateUI();
        } else {
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    // --- INITIALIZE GAME ---
    loadGame();
    updateUI();
    
    // NEW --> Start the auto-mining and auto-saving loops
    setInterval(autoMine, 1000); // Generate dust every second
    setInterval(saveGame, 5000); // Save the game every 5 seconds
});