// hero.js - v2.1.0
// Fixed: Starter Gear initialization for new saves

import { WEAPON_DB, ARMOR_DB } from './items.js';

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
    lastRegenTime: Date.now(),
    maxFloor: 1,

    // --- NEW INVENTORY SYSTEM ---
    inventory: {}, 
    gearInventory: [], 
    equipment: {
        mainHand: null,
        body: null      
    },

    // Legacy fields
    ownedItems: [],
    itemLevels: {}
};

const MAX_LEVEL = 1000;

export function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function migrateToUidSystem() {
    if ((HERO_STATE.ownedItems && HERO_STATE.ownedItems.length > 0) && HERO_STATE.gearInventory.length === 0) {
        console.log("Migrating Save File to UID System...");
        HERO_STATE.ownedItems.forEach(itemId => {
            const level = (HERO_STATE.itemLevels && HERO_STATE.itemLevels[itemId]) || 0;
            const newUid = generateUID();
            HERO_STATE.gearInventory.push({ uid: newUid, id: itemId, level: level });
            if (HERO_STATE.equipment.mainHand === itemId) HERO_STATE.equipment.mainHand = newUid;
            if (HERO_STATE.equipment.body === itemId) HERO_STATE.equipment.body = newUid;
        });
        HERO_STATE.ownedItems = [];
    }
}

export function getItemByUid(uid) {
    if (!HERO_STATE.gearInventory) return null;
    return HERO_STATE.gearInventory.find(i => i.uid === uid);
}

export function recalculateHeroStats() {
    const globalLevel = (window.gameState && window.gameState.globalLevel) ? window.gameState.globalLevel : 1;

    let totalAttack = 10 + ((HERO_STATE.level - 1) * 2);
    let totalDefense = 0 + ((HERO_STATE.level - 1) * 1);
    let totalHP = 150 + ((HERO_STATE.level - 1) * 10);

    const weaponUid = HERO_STATE.equipment.mainHand;
    if (weaponUid) {
        const weaponInstance = getItemByUid(weaponUid);
        if (weaponInstance) {
            const weaponDB = WEAPON_DB.find(w => w.id === weaponInstance.id);
            if (weaponDB) {
                const lvl = weaponInstance.level || 0;
                totalAttack += Math.floor(weaponDB.damage * (1 + (lvl * 0.5)));
            }
        } else {
            HERO_STATE.equipment.mainHand = null;
        }
    }

    const armorUid = HERO_STATE.equipment.body;
    if (armorUid) {
        const armorInstance = getItemByUid(armorUid);
        if (armorInstance) {
            const armorDB = ARMOR_DB.find(a => a.id === armorInstance.id);
            if (armorDB) {
                const lvl = armorInstance.level || 0;
                totalDefense += Math.floor(armorDB.defense * (1 + (lvl * 0.5)));
            }
        } else {
            HERO_STATE.equipment.body = null;
        }
    }

    HERO_STATE.baseAttack = totalAttack;
    HERO_STATE.defense = totalDefense;
    HERO_STATE.maxHP = totalHP;

    if (HERO_STATE.currentHP > HERO_STATE.maxHP) HERO_STATE.currentHP = HERO_STATE.maxHP;
    HERO_STATE.maxEnergy = Math.min(250, 50 + (globalLevel * 2));
}

export function grantHeroExp(amount) {
    if (HERO_STATE.level >= MAX_LEVEL) {
        HERO_STATE.currentExp = 0;
        return false;
    }
    HERO_STATE.currentExp += amount;
    let leveledUp = false;
    while (HERO_STATE.currentExp >= HERO_STATE.expToNextLevel) {
        if (HERO_STATE.level >= MAX_LEVEL) {
            HERO_STATE.currentExp = 0;
            break;
        }
        HERO_STATE.currentExp -= HERO_STATE.expToNextLevel;
        HERO_STATE.level++;
        HERO_STATE.expToNextLevel = 100 + (Math.pow(HERO_STATE.level, 2) * 12);
        if (HERO_STATE.level % 100 === 0) HERO_STATE.critChance += 0.02;
        recalculateHeroStats();
        HERO_STATE.currentHP = HERO_STATE.maxHP;
        leveledUp = true;
    }
    return leveledUp;
}

export function getHeroData() {
    return { ...HERO_STATE };
}

// FIX: Allow loading empty data (new game) so initialization logic runs
export function loadHeroData(savedData = {}) {
    Object.assign(HERO_STATE, savedData);

    if (!HERO_STATE.gearInventory) HERO_STATE.gearInventory = [];
    if (!HERO_STATE.inventory) HERO_STATE.inventory = {};

    migrateToUidSystem();

    // FRESH START CHECK
    if (HERO_STATE.gearInventory.length === 0) {
        console.log("Fresh Start: Giving Starter Gear");
        const swordUid = generateUID();
        const shirtUid = generateUID() + "1"; // Ensure different ID

        HERO_STATE.gearInventory.push({ uid: swordUid, id: 'rusty_sword', level: 0 });
        HERO_STATE.gearInventory.push({ uid: shirtUid, id: 'tattered_shirt', level: 0 });

        HERO_STATE.equipment.mainHand = swordUid;
        HERO_STATE.equipment.body = shirtUid;
    }

    if (typeof HERO_STATE.defense === 'undefined') HERO_STATE.defense = 0;
    recalculateHeroStats();
}