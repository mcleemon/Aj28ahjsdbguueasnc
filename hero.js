// hero.js - v2.0.0
// Implements Instance-Based Inventory (UIDs)
// Automatic Migration for old save files included

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
    inventory: {}, // Keeps materials (e.g., 'wood_scraps': 100)
    gearInventory: [], // NEW: Stores unique item objects [{uid: 123, id: 'rusty_sword', level: 0}]
    equipment: {
        mainHand: null, // Will store UID (number), not string ID
        body: null      // Will store UID (number)
    },

    // Legacy fields (kept temporarily for migration safety, but unused)
    ownedItems: [],
    itemLevels: {}
};

const MAX_LEVEL = 1000;

// --- UTILITY: GENERATE UNIQUE ID ---
export function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// --- MIGRATION: CONVERT OLD SAVES TO NEW SYSTEM ---
function migrateToUidSystem() {
    // Only run if we have old data but no new data
    if ((HERO_STATE.ownedItems && HERO_STATE.ownedItems.length > 0) && HERO_STATE.gearInventory.length === 0) {
        console.log("Migrating Save File to UID System...");

        // 1. Convert Owned Items to Gear Instances
        HERO_STATE.ownedItems.forEach(itemId => {
            const level = (HERO_STATE.itemLevels && HERO_STATE.itemLevels[itemId]) || 0;
            const newUid = generateUID();

            // Add to new inventory
            HERO_STATE.gearInventory.push({
                uid: newUid,
                id: itemId,
                level: level
            });

            // 2. Update Equipment links
            // If this item ID was equipped in the old system, equip its new UID
            if (HERO_STATE.equipment.mainHand === itemId) {
                HERO_STATE.equipment.mainHand = newUid;
            }
            if (HERO_STATE.equipment.body === itemId) {
                HERO_STATE.equipment.body = newUid;
            }
        });

        // 3. Clear legacy data to prevent double migration
        HERO_STATE.ownedItems = [];
        console.log("Migration Complete. New Inventory:", HERO_STATE.gearInventory);
    }
}

// --- HELPER: FIND ITEM BY UID ---
export function getItemByUid(uid) {
    if (!HERO_STATE.gearInventory) return null;
    return HERO_STATE.gearInventory.find(i => i.uid === uid);
}

// --- STATS RECALCULATION ---
export function recalculateHeroStats() {
    const globalLevel = (window.gameState && window.gameState.globalLevel) ? window.gameState.globalLevel : 1;

    let totalAttack = 10 + ((HERO_STATE.level - 1) * 2);
    let totalDefense = 0 + ((HERO_STATE.level - 1) * 1);
    let totalHP = 150 + ((HERO_STATE.level - 1) * 10);

    // 1. MAIN HAND LOOKUP
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
            // SAFETY: Item doesn't exist anymore? Unequip it.
            console.warn("Equipped weapon missing. Unequipping.");
            HERO_STATE.equipment.mainHand = null;
        }
    }

    // 2. BODY ARMOR LOOKUP
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
            // SAFETY: Item doesn't exist anymore? Unequip it.
            console.warn("Equipped armor missing. Unequipping.");
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
        if (HERO_STATE.level % 100 === 0) {
            HERO_STATE.critChance += 0.02;
        }
        recalculateHeroStats();
        HERO_STATE.currentHP = HERO_STATE.maxHP;
        leveledUp = true;
    }
    return leveledUp;
}

export function getHeroData() {
    return { ...HERO_STATE };
}

export function loadHeroData(savedData) {
    if (!savedData) return;
    Object.assign(HERO_STATE, savedData);

    // Ensure new structures exist if loading extremely old save
    if (!HERO_STATE.gearInventory) HERO_STATE.gearInventory = [];
    if (!HERO_STATE.inventory) HERO_STATE.inventory = {};

    // RUN MIGRATION
    migrateToUidSystem();

    // Safety check for starting gear if totally empty
    if (HERO_STATE.gearInventory.length === 0) {
        console.log("Fresh Start: Giving Starter Gear");
        const swordUid = generateUID();
        const shirtUid = generateUID() + 1;

        HERO_STATE.gearInventory.push({ uid: swordUid, id: 'rusty_sword', level: 0 });
        HERO_STATE.gearInventory.push({ uid: shirtUid, id: 'tattered_shirt', level: 0 });

        HERO_STATE.equipment.mainHand = swordUid;
        HERO_STATE.equipment.body = shirtUid;
    }

    if (typeof HERO_STATE.defense === 'undefined') HERO_STATE.defense = 0;
    recalculateHeroStats();
}