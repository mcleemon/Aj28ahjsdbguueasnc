document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM ELEMENTS ---
    const dustCounter = document.getElementById('dust-counter');
    const golemEgg = document.getElementById('golem-egg');
    const hatchProgressBar = document.getElementById('hatch-progress-bar');
    const progressText = document.getElementById('progress-text');
    const clickEffectContainer = document.getElementById('click-effect-container'); // Get the container
    
    // Shop Elements
    const shopButton = document.getElementById('shop-button');
    const shopModal = document.getElementById('shop-modal');
    const closeShopButton = document.getElementById('close-shop-button');
    
    // Chisel Elements
    const buyChiselButton = document.getElementById('buy-chisel-button');
    const chiselLevelText = document.getElementById('chisel-level');
    const chiselEffectText = document.getElementById('chisel-effect');
    const chiselCostText = document.getElementById('chisel-cost');
    
    // Drone Elements
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
            gameState = Object.assign(gameState, JSON.parse(savedState));
        }
    }
    
    function updateUI() {
        dustCounter.innerText = Math.floor(gameState.dust);
        
        const progressPercent = (gameState.hatchProgress / gameState.hatchGoal) * 100;
        hatchProgressBar.style.width = `${progressPercent}%`;
        progressText.innerText = `${Math.floor(gameState.hatchProgress)} / ${gameState.hatchGoal}`;

        chiselLevelText.innerText = gameState.chiselLevel;
        chiselEffectText.innerText = gameState.dustPerTap;
        chiselCostText.innerText = getChiselCost();
        
        droneLevelText.innerText = gameState.droneLevel;
        droneEffectText.innerText = gameState.dustPerSecond;
        droneCostText.innerText = getDroneCost();
    }
    
    function getChiselCost() {
        return Math.floor(gameState.chiselBaseCost * Math.pow(1.5, gameState.chiselLevel - 1));
    }
    
    function getDroneCost() {
        return Math.floor(gameState.droneBaseCost * Math.pow(1.8, gameState.droneLevel));
    }
    
    function autoMine() {
        if (gameState.hatchProgress < gameState.hatchGoal) {
             gameState.hatchProgress += gameState.dustPerSecond;
        }
       
        gameState.dust += gameState.dustPerSecond;
        updateUI();
    }

    // --- EVENT LISTENERS ---

    golemEgg.addEventListener('click', () => {
        // Old logic
        if (gameState.hatchProgress < gameState.hatchGoal) {
            gameState.hatchProgress += gameState.dustPerTap;
        }
        gameState.dust += gameState.dustPerTap;
        
        tg.HapticFeedback.impactOccurred('light');
        updateUI();

        // NEW --> Floating Number Effect
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.innerText = `+${gameState.dustPerTap}`;
        effect.style.left = `${Math.random() * 60 + 20}%`; 
        clickEffectContainer.appendChild(effect);
        setTimeout(() => {
            effect.remove();
        }, 1000);
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
            saveGame();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
        }
    });
    
    buyDroneButton.addEventListener('click', () => {
        const cost = getDroneCost();
        if (gameState.dust >= cost) {
            gameState.dust -= cost;
            gameState.droneLevel++;
            gameState.dustPerSecond++;
            updateUI();
            saveGame();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    // --- INITIALIZE GAME ---
    loadGame();
    updateUI();
    
    setInterval(autoMine, 1000); 
    setInterval(saveGame, 5000); 
});