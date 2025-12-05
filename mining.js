// mining.js - v1.0.0
// Features: Exponential Cost (1.15x), Progressive Unlocks, Silo Logic
// Target Economy: ~5 Billion Dust to Max, ~10.7M PPH Max

import { GAME_ASSETS } from './assets.js';

// --- CONFIGURATION ---
export const MINING_ITEMS = [
    // LEFT SIDE (Labor)
    { id: 1, name: "Rusty Pickaxe", baseCost: 100, basePPH: 10, icon: 'miningItem1' },
    { id: 2, name: "Safety Helmet", baseCost: 500, basePPH: 50, icon: 'miningItem2', reqId: 1 },
    { id: 3, name: "Goblin Worker", baseCost: 2500, basePPH: 250, icon: 'miningItem3', reqId: 2 },
    { id: 4, name: "Dynamite Crate", baseCost: 10000, basePPH: 1500, icon: 'miningItem4', reqId: 3 },

    // RIGHT SIDE (Tech)
    { id: 5, name: "Minecart Rail", baseCost: 30000, basePPH: 8000, icon: 'miningItem5', reqId: 4 },
    { id: 6, name: "Ventilation", baseCost: 100000, basePPH: 25000, icon: 'miningItem6', reqId: 5 },
    { id: 7, name: "Mana Drill", baseCost: 200000, basePPH: 60000, icon: 'miningItem7', reqId: 6 },
    { id: 8, name: "Nexus Core", baseCost: 350000, basePPH: 120000, icon: 'miningItem8', reqId: 7 }
];

export const SILO_LEVELS = [
    { level: 1, hours: 4, cost: 0 },
    { level: 2, hours: 6, cost: 250000 },
    { level: 3, hours: 8, cost: 1000000 },
    { level: 4, hours: 12, cost: 10000000 },
    { level: 5, hours: 24, cost: 100000000 }
];

// --- CORE FUNCTIONS ---

export function getMiningState() {
    if (!window.gameState.mining) {
        window.gameState.mining = {
            siloLevel: 1,
            lastClaimTime: Date.now(),
            upgrades: {} // Format: { 1: 5, 2: 0 } (ItemId: Level)
        };
    }
    return window.gameState.mining;
}

export function getItemLevel(itemId) {
    const mining = getMiningState();
    return mining.upgrades[itemId] || 0;
}

export function getNextCost(itemId) {
    const item = MINING_ITEMS.find(i => i.id === itemId);
    if (!item) return 0;
    const level = getItemLevel(itemId);
    
    // Formula: Base * (1.15 ^ Level)
    return Math.floor(item.baseCost * Math.pow(1.15, level));
}

export function getItemPPH(itemId) {
    const item = MINING_ITEMS.find(i => i.id === itemId);
    if (!item) return 0;
    const level = getItemLevel(itemId);
    
    // Formula: Linear (Base * Level)
    return item.basePPH * level;
}

export function getTotalPPH() {
    let total = 0;
    MINING_ITEMS.forEach(item => {
        total += getItemPPH(item.id);
    });
    return total;
}

export function isItemUnlocked(itemId) {
    const item = MINING_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    
    // First item is always unlocked
    if (!item.reqId) return true;

    // Check if previous item is Level 10+
    const reqLevel = getItemLevel(item.reqId);
    return reqLevel >= 10;
}

export function getSiloCapacity() {
    const mining = getMiningState();
    const lvlData = SILO_LEVELS.find(s => s.level === mining.siloLevel) || SILO_LEVELS[0];
    
    const pph = getTotalPPH();
    // Capacity = PPH * Hours
    return pph * lvlData.hours;
}

export function getMinedAmount() {
    const mining = getMiningState();
    const now = Date.now();
    const elapsedHours = (now - mining.lastClaimTime) / (1000 * 60 * 60);
    
    const pph = getTotalPPH();
    const rawGenerated = Math.floor(pph * elapsedHours);
    
    // Apply Silo Cap
    const cap = getSiloCapacity();
    return Math.min(rawGenerated, cap);
}

// --- ACTIONS ---

export function buyMiningUpgrade(itemId) {
    const cost = getNextCost(itemId);
    
    if (window.gameState.dust >= cost) {
        window.gameState.dust -= cost;
        const mining = getMiningState();
        
        // Init level if undefined
        if (!mining.upgrades[itemId]) mining.upgrades[itemId] = 0;
        
        mining.upgrades[itemId]++;
        
        // Save
        if (window.saveGameGlobal) window.saveGameGlobal();
        return true;
    }
    return false;
}

export function claimSilo() {
    const amount = getMinedAmount();
    if (amount <= 0) return 0;

    window.gameState.dust += amount;
    
    // Reset Timer
    const mining = getMiningState();
    mining.lastClaimTime = Date.now();
    
    if (window.saveGameGlobal) window.saveGameGlobal();
    return amount;
}

export function buySiloUpgrade() {
    const mining = getMiningState();
    const nextLvl = mining.siloLevel + 1;
    const upgradeData = SILO_LEVELS.find(s => s.level === nextLvl);

    if (!upgradeData) return false; // Max level

    if (window.gameState.dust >= upgradeData.cost) {
        window.gameState.dust -= upgradeData.cost;
        mining.siloLevel++;
        if (window.saveGameGlobal) window.saveGameGlobal();
        return true;
    }
    return false;
}