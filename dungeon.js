// dungeon.js - v2.4.0
// Features: Level Gap Penalty (Anti-Farming), 4.5x Def, Tiered Dust, Scaled Gems

import { MATERIAL_TIERS } from './items.js';
import { HERO_STATE } from './hero.js';

export const DUNGEON_STATE = {
    floor: 1,
    monsterName: "Slime",
    monsterAsset: "blueslime",
    currentHP: 60,
    maxHP: 60,
    attack: 2,
    defense: 0,
    currentStance: 'aggressive'
};

const MONSTER_TYPES = [
    { name: "Slime", asset: "blueslime" },              // Zone 1
    { name: "Copper Golem", asset: "eggCopper" },       // Zone 2
    { name: "Iron Golem", asset: "eggIron" },           // Zone 3
    { name: "Steel Automaton", asset: "eggIron" },      // Zone 4
    { name: "Silver Knight", asset: "eggSilver" },      // Zone 5
    { name: "Golden King", asset: "eggGolden" },        // Zone 6
    { name: "Obsidian Beast", asset: "eggObsidian" },   // Zone 7
    { name: "Platinum Drake", asset: "eggSilver" },     // Zone 8
    { name: "Mithril Golem", asset: "eggSapphire" },    // Zone 9
    { name: "Orichalcum Sentry", asset: "eggEmerald" }, // Zone 10
    { name: "Adamantite Titan", asset: "eggDiamond" },  // Zone 11
    { name: "Rune Guardian", asset: "eggSapphire" },    // Zone 12
    { name: "Elder Dragon", asset: "eggRuby" },         // Zone 13
    { name: "Void Walker", asset: "eggObsidian" },      // Zone 14
    { name: "Celestial God", asset: "eggDiamond" }      // Zone 15
];

const TIER_PREFIXES = ["", "Veteran", "Elite", "Master", "Ancient", "Mythic", "Eternal", "Omega", "Godly", "Primordial"];

export function refreshMonsterVisuals() {
    const floor = DUNGEON_STATE.floor;
    let zoneIndex = Math.floor((floor - 1) / 100);
    if (zoneIndex >= MONSTER_TYPES.length) zoneIndex = MONSTER_TYPES.length - 1;

    const monsterType = MONSTER_TYPES[zoneIndex];
    const prefixIndex = Math.floor(((floor - 1) % 100) / 10);
    const prefix = TIER_PREFIXES[prefixIndex] || "Infinite";

    DUNGEON_STATE.monsterAsset = monsterType.asset;

    const baseName = `${prefix} ${monsterType.name}`.trim();
    if (floor % 10 === 0) {
        DUNGEON_STATE.monsterName = `BOSS: ${baseName}`;
    } else {
        DUNGEON_STATE.monsterName = `${baseName} Lv.${floor}`;
    }
}

export function hitMonster(damageAmount) {
    DUNGEON_STATE.currentHP -= damageAmount;
    if (DUNGEON_STATE.currentHP < 0) DUNGEON_STATE.currentHP = 0;
    return DUNGEON_STATE.currentHP <= 0;
}

export function calculateRewards() {
    const floor = DUNGEON_STATE.floor;
    const isBoss = (floor % 10 === 0);

    // --- LEVEL GAP PENALTY CALCULATION (Dust Only) ---
    const heroLvl = HERO_STATE.level;
    const mobLvl = floor;
    const gap = heroLvl - mobLvl;

    let dustPenaltyMult = 1.0; // Default: 100% Rewards

    if (gap >= 50) {
        // Extreme Gap: 90% Dust Reduction
        dustPenaltyMult = 0.1;
    }
    else if (gap >= 30) {
        // Major Gap: 60% Dust Reduction
        dustPenaltyMult = 0.4;
    }

    // --- ITEM DROPS (Standard Logic - No Penalty) ---
    let lootDrop = null;

    // Calculate Standard Chance based on Floor Depth
    let chance = 0.70;
    if (floor > 500) chance = 0.40;
    if (floor > 1000) chance = 0.15;

    // Bosses always guarantee a drop
    const finalDropChance = isBoss ? 1.0 : chance;

    if (Math.random() <= finalDropChance) {
        for (let i = MATERIAL_TIERS.length - 1; i >= 0; i--) {
            if (floor >= MATERIAL_TIERS[i].dropFloor) {
                lootDrop = {
                    id: MATERIAL_TIERS[i].id,
                    name: MATERIAL_TIERS[i].name,
                    amount: isBoss ? 3 : 1
                };
                break;
            }
        }
    }

    // --- DUST REWARD (With Penalty) ---
    let dustMultiplier = 15;
    if (floor > 500) dustMultiplier = 10;
    if (floor > 1000) dustMultiplier = 5;

    let rawDust = Math.floor(floor * dustMultiplier);
    const dustReward = Math.floor(rawDust * dustPenaltyMult);

    // --- GEM REWARDS ---
    let gemRewardAmount = 0;
    if (isBoss) {
        if (floor <= 200) gemRewardAmount = 1;
        else if (floor <= 500) gemRewardAmount = 2;
        else if (floor <= 1000) gemRewardAmount = 3;
        else gemRewardAmount = 5;
    }

    return {
        dustReward: dustReward,
        xpReward: Math.floor(floor * 10 + Math.pow(floor, 1.1)),
        gemReward: gemRewardAmount,
        loot: lootDrop
    };
}

export function increaseFloor() {
    DUNGEON_STATE.floor++;
    calculateStatsForFloor(DUNGEON_STATE.floor);
}

export function calculateStatsForFloor(floor) {
    DUNGEON_STATE.currentStance = 'aggressive';

    // 1. HP SCALING (x40 - Fast Paced)
    let hp = 100 + (floor * 40);

    // ATK SCALING
    let atk = 5 + (floor * 4);

    // Tutorial Scaler
    if (floor <= 100) {
        const scale = 0.5 + (0.5 * (floor / 100));
        hp = Math.floor(hp * scale);
        atk = Math.floor(atk * scale);
    }

    DUNGEON_STATE.maxHP = Math.max(50, hp);
    DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
    DUNGEON_STATE.attack = Math.max(1, atk);

    // 2. DEFENSE (x3.5 - Balanced Wall)
    let def = Math.floor(floor * 3.5);
    if (floor < 10) def = 0;

    DUNGEON_STATE.defense = def;

    refreshMonsterVisuals();
}

export function rollMonsterStance() {
    const rand = Math.random();
    if (rand < 0.7) DUNGEON_STATE.currentStance = 'aggressive';
    else if (rand < 0.9) DUNGEON_STATE.currentStance = 'spiked';
    else DUNGEON_STATE.currentStance = 'enraged';
    return DUNGEON_STATE.currentStance;
}

export function getDungeonData() { return { ...DUNGEON_STATE }; }
export function loadDungeonData(savedData) {
    if (!savedData) return;
    Object.assign(DUNGEON_STATE, savedData);
}