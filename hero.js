// hero.js - v1.4.0
// Includes Force Recalculation to fix Stat Desync

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
    currentBlock: 0,
    lastRegenTime: Date.now(),
    maxFloor: 1,
    inventory: {},
    itemLevels: {},
    equipment: {
        mainHand: 'rusty_sword',
        body: 'tattered_shirt'
    },
    ownedItems: ['rusty_sword', 'tattered_shirt']
};

const MAX_LEVEL = 1000;

// --- NEW HELPER: FORCE STAT UPDATE ---
export function recalculateHeroStats() {
    const globalLevel = (window.gameState && window.gameState.globalLevel) ? window.gameState.globalLevel : 1;

    let totalAttack = 10 + ((HERO_STATE.level - 1) * 2);
    let totalDefense = 0 + ((HERO_STATE.level - 1) * 1);
    let totalHP = 150 + ((HERO_STATE.level - 1) * 10);

    const weaponId = HERO_STATE.equipment.mainHand;
    const weapon = WEAPON_DB.find(w => w.id === weaponId);
    if (weapon) {
        const lvl = (HERO_STATE.itemLevels && HERO_STATE.itemLevels[weaponId]) || 0;
        const weaponDmg = Math.floor(weapon.damage * (1 + (lvl * 0.5)));
        totalAttack += weaponDmg;
    }

    const armorId = HERO_STATE.equipment.body;
    const armor = ARMOR_DB.find(a => a.id === armorId);
    if (armor) {
        const lvl = (HERO_STATE.itemLevels && HERO_STATE.itemLevels[armorId]) || 0;
        const armorDef = Math.floor(armor.defense * (1 + (lvl * 0.5)));
        totalDefense += armorDef;
    }

    HERO_STATE.baseAttack = totalAttack;
    HERO_STATE.defense = totalDefense;
    HERO_STATE.maxHP = totalHP;

    if (HERO_STATE.currentHP > HERO_STATE.maxHP) HERO_STATE.currentHP = HERO_STATE.maxHP;

    HERO_STATE.maxEnergy = Math.min(250, 50 + (globalLevel * 2));

    console.log(`Stats Recalculated: ATK ${totalAttack} | DEF ${totalDefense} | HP ${totalHP} | MAX ENERGY ${HERO_STATE.maxEnergy} (Global Lv.${globalLevel})`);
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
    if (!HERO_STATE.itemLevels) HERO_STATE.itemLevels = {};
    if (typeof HERO_STATE.defense === 'undefined') HERO_STATE.defense = 0;
    recalculateHeroStats();
}