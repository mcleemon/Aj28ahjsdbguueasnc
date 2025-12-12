// mining.js - v1.2.0
// Features: Balanced Economy, Level 50 Cap, Cooldown Logic
// Fixes: "Instant Full Silo" on first purchase

import { GAME_ASSETS } from './assets.js';
import { incrementStat } from './achievements.js';

// --- CONFIGURATION ---
export const CLAIM_COOLDOWN_MS = 60 * 60 * 1000; // 1 Hour

export const MINING_ITEMS = [
    // LEFT SIDE (Labor - Lower Cost Scaling)
    { id: 1, name: "Pickaxe", baseCost: 1000, basePPH: 150, costMult: 1.12, icon: 'miningItem1' },
    { id: 2, name: "Helmet", baseCost: 25000, basePPH: 400, costMult: 1.13, icon: 'miningItem2', reqId: 1 },
    { id: 3, name: "Worker", baseCost: 120000, basePPH: 850, costMult: 1.14, icon: 'miningItem3', reqId: 2 },
    { id: 4, name: "Dynamite Crate", baseCost: 500000, basePPH: 2000, costMult: 1.15, icon: 'miningItem4', reqId: 3 },

    // RIGHT SIDE (Tech - Higher Cost Scaling)
    { id: 5, name: "Minecart", baseCost: 600000, basePPH: 5000, costMult: 1.16, icon: 'miningItem5', reqId: 4 },
    { id: 6, name: "Power Cell", baseCost: 1600000, basePPH: 12000, costMult: 1.16, icon: 'miningItem6', reqId: 5 },
    { id: 7, name: "Driller", baseCost: 4000000, basePPH: 25000, costMult: 1.17, icon: 'miningItem7', reqId: 6 },
    { id: 8, name: "Nexus Core", baseCost: 10000000, basePPH: 50000, costMult: 1.18, icon: 'miningItem8', reqId: 7 }
];

export const SILO_LEVELS = [
    { level: 1, hours: 2, cost: 0 },
    { level: 2, hours: 4, cost: 250000 },
    { level: 3, hours: 6, cost: 5000000 },
    { level: 4, hours: 12, cost: 25000000 },
    { level: 5, hours: 18, cost: 300000000 }
];

// --- CORE FUNCTIONS ---

export function getMiningState() {
    if (!window.gameState.mining) {
        window.gameState.mining = {
            siloLevel: 1,
            lastClaimTime: Date.now(),
            upgrades: {} 
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
    const mult = item.costMult || 1.15;
    if (level === 0) {
        return Math.floor(item.baseCost * 2);
    }
    return Math.floor(item.baseCost * Math.pow(mult, level));
}

export function calculatePPH(itemId, level) {
    const item = MINING_ITEMS.find(i => i.id === itemId);
    if (!item) return 0;
    if (level <= 0) return 0;
    return Math.floor(item.basePPH * Math.pow(level, 0.95));
}

export function getItemPPH(itemId) {
    const level = getItemLevel(itemId);
    return calculatePPH(itemId, level);
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
    if (!item.reqId) return true;
    const reqLevel = getItemLevel(item.reqId);
    return reqLevel >= 10;
}

export function getSiloCapacity() {
    const mining = getMiningState();
    const lvlData = SILO_LEVELS.find(s => s.level === mining.siloLevel) || SILO_LEVELS[0];
    const pph = getTotalPPH();
    return pph * lvlData.hours;
}

export function getMinedAmount() {
    const mining = getMiningState();
    const now = Date.now();
    const elapsedHours = (now - mining.lastClaimTime) / (1000 * 60 * 60);
    const pph = getTotalPPH();
    const rawGenerated = Math.floor(pph * elapsedHours);
    const cap = getSiloCapacity();
    return Math.min(rawGenerated, cap);
}

// --- COOLDOWN HELPER ---
export function getClaimCooldown() {
    const mining = getMiningState();
    const now = Date.now();
    const elapsed = now - mining.lastClaimTime;
    const remaining = CLAIM_COOLDOWN_MS - elapsed;
    return remaining > 0 ? remaining : 0;
}

// --- ACTIONS ---

export function buyMiningUpgrade(itemId) {
    const level = getItemLevel(itemId);
    if (level >= 50) return false;
    
    // FIX: Check PPH before upgrade
    const oldPPH = getTotalPPH();
    
    const cost = getNextCost(itemId);
    if (window.gameState.dust >= cost) {
        window.gameState.dust -= cost;
        const mining = getMiningState();
        if (!mining.upgrades[itemId]) mining.upgrades[itemId] = 0;
        mining.upgrades[itemId]++;
        incrementStat('totalMiningUpgrades', 1);
        
        // FIX: If this is the FIRST time we have production, RESET the clock.
        // This prevents the "Day 1 -> Day 3" instant fill bug.
        if (oldPPH === 0 && getTotalPPH() > 0) {
            console.log("First Mining Upgrade Purchased: Resetting Claim Timer.");
            mining.lastClaimTime = Date.now();
        }
        
        if (window.saveGameGlobal) window.saveGameGlobal();
        return true;
    }
    return false;
}

export function claimSilo() {
    // FIX: Enforce 1 Hour Cooldown
    if (getClaimCooldown() > 0) {
        return -1; // Code -1 means "Cooldown Active"
    }

    const amount = getMinedAmount();
    if (amount <= 0) return 0;
    
    window.gameState.dust += amount;
    const mining = getMiningState();
    mining.lastClaimTime = Date.now();

    if (window.saveGameGlobal) window.saveGameGlobal();
    return amount;
}

export function buySiloUpgrade() {
    const mining = getMiningState();
    const nextLvl = mining.siloLevel + 1;
    const upgradeData = SILO_LEVELS.find(s => s.level === nextLvl);

    if (!upgradeData) return false;

    if (window.gameState.dust >= upgradeData.cost) {
        window.gameState.dust -= upgradeData.cost;
        mining.siloLevel++;
        incrementStat('totalMiningUpgrades', 1);
        if (window.saveGameGlobal) window.saveGameGlobal();
        return true;
    }
    return false;
}