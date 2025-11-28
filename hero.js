// hero.js - v1.2.0 (Cleaned)
// Manages player stats, HP, and Experience.
// Removed duplicate logic and standardized Item Levels.

export const HERO_STATE = {
    level: 1,
    currentExp: 0,
    expToNextLevel: 100,
    baseAttack: 10,
    defense: 0,
    critChance: 0.10,
    currentHP: 150,
    maxHP: 150,
    energy: 50,
    maxEnergy: 50,
    limitGauge: 0,
    maxLimit: 100,
    currentBlock: 0,
    lastRegenTime: Date.now(),
    maxFloor: 1,
    
    // Inventory & Equipment
    inventory: {},
    
    // This replaces the old "equipmentLevels". 
    // It maps ItemID -> Level (e.g., 'copper_sword': 5)
    itemLevels: {}, 
    
    // Default Equipment
    equipment: {
        mainHand: 'rusty_sword',
        body: 'tattered_shirt'
    },
    
    ownedItems: ['rusty_sword', 'tattered_shirt']
};

export function grantHeroExp(amount) {
    HERO_STATE.currentExp += amount;
    let leveledUp = false;

    if (HERO_STATE.currentExp >= HERO_STATE.expToNextLevel) {
        HERO_STATE.currentExp -= HERO_STATE.expToNextLevel;
        HERO_STATE.level++;
        HERO_STATE.expToNextLevel = Math.floor(HERO_STATE.expToNextLevel * 1.5);
        
        // Stat Increases on Level Up
        HERO_STATE.baseAttack += 2;
        HERO_STATE.maxHP += 20;
        HERO_STATE.currentHP = HERO_STATE.maxHP;
        
        leveledUp = true;
    }
    return leveledUp;
}

// --- SAVE/LOAD HELPERS ---

export function getHeroData() {
    return { ...HERO_STATE };
}

export function loadHeroData(savedData) {
    if (!savedData) return;
    
    // Merge saved data into state
    Object.assign(HERO_STATE, savedData);

    // Compatibility Check:
    // If we loaded an old save that lacks 'itemLevels', initialize it.
    if (!HERO_STATE.itemLevels) {
        HERO_STATE.itemLevels = {};
    }
}