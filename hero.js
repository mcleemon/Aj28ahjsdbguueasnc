// hero.js - v1.1.1
// Manages player stats, HP, and Energy

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
    limitGauge: 0,
    maxLimit: 100,
    maxEnergy: 50,
    currentBlock: 0,
    lastRegenTime: Date.now(),
    inventory: {},
    equipmentLevels: {
        mainHand: 0,
        body: 0
    },
    ownedItems: ['rusty_sword', 'tattered_shirt']
};

export function rollMonsterStance() {
    const rand = Math.random();

    // 70% Aggressive (Standard)
    // 20% Spiked (Defense Up)
    // 10% Enraged (Double Damage)

    if (rand < 0.70) {
        DUNGEON_STATE.currentStance = 'aggressive';
    } else if (rand < 0.90) {
        DUNGEON_STATE.currentStance = 'spiked';
    } else {
        DUNGEON_STATE.currentStance = 'enraged';
    }

    return DUNGEON_STATE.currentStance;
}

export function grantHeroExp(amount) {
    HERO_STATE.currentExp += amount;
    let leveledUp = false;

    if (HERO_STATE.currentExp >= HERO_STATE.expToNextLevel) {
        HERO_STATE.currentExp -= HERO_STATE.expToNextLevel;
        HERO_STATE.level++;
        HERO_STATE.expToNextLevel = Math.floor(HERO_STATE.expToNextLevel * 1.5);
        HERO_STATE.baseAttack += 2;
        HERO_STATE.maxHP += 20;
        HERO_STATE.currentHP = HERO_STATE.maxHP;
        leveledUp = true;
    }
    return leveledUp;
}

export function calculateHeroDamage() {
    let damage = HERO_STATE.baseAttack;
    let isCrit = false;
    if (Math.random() < HERO_STATE.critChance) {
        damage = damage * 2;
        isCrit = true;
    }

    return { damage: Math.floor(damage), isCrit: isCrit };
}

// --- SAVE/LOAD HELPERS ---
export function getHeroData() {
    return { ...HERO_STATE };
}

export function loadHeroData(savedData) {
    if (!savedData) return;
    Object.assign(HERO_STATE, savedData);
}