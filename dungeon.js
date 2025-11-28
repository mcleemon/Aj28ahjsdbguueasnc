// dungeon.js - v1.2.0
// Manages Monster stats, visuals, and LOOT DROPS

import { MATERIAL_TIERS } from './items.js';

export const DUNGEON_STATE = {
    floor: 1,
    monsterName: "Slime",
    monsterAsset: "blueslime",
    currentHP: 50,
    maxHP: 50,
    attack: 5,
    currentStance: 'aggressive'
};

const MONSTER_TIERS = [
    { name: "Slime", asset: "blueslime" },          // Floor 1-9
    { name: "Copper Golem", asset: "eggCopper" },    // Floor 10-19
    { name: "Iron Golem", asset: "eggIron" },        // Floor 20-29
    { name: "Silver Knight", asset: "eggSilver" },   // Floor 30-39
    { name: "Golden King", asset: "eggGolden" },     // Floor 40-49
    { name: "Obsidian Beast", asset: "eggObsidian" },// Floor 50-59
    { name: "Sapphire Drake", asset: "eggSapphire" },// Floor 60-69
    { name: "Emerald Walker", asset: "eggEmerald" }, // Floor 70-79
    { name: "Ruby Demon", asset: "eggRuby" },        // Floor 80-89
    { name: "Diamond God", asset: "eggDiamond" }     // Floor 90+
];

export function refreshMonsterVisuals() {
    // Calculate correct tier based on current floor
    const tierIndex = Math.min(Math.floor((DUNGEON_STATE.floor - 1) / 10), MONSTER_TIERS.length - 1);
    const monsterType = MONSTER_TIERS[tierIndex];

    // Force update the state
    DUNGEON_STATE.monsterAsset = monsterType.asset;

    // Update Name if needed
    if (DUNGEON_STATE.floor % 10 === 0) {
        DUNGEON_STATE.monsterName = `BOSS: ${monsterType.name}`;
    } else {
        DUNGEON_STATE.monsterName = `${monsterType.name} Lv.${DUNGEON_STATE.floor}`;
    }
}

export function hitMonster(damageAmount) {
    DUNGEON_STATE.currentHP -= damageAmount;
    if (DUNGEON_STATE.currentHP < 0) DUNGEON_STATE.currentHP = 0;
    return DUNGEON_STATE.currentHP <= 0;
}

// 1. Calculate Rewards (Passive - Does NOT change floor)
export function calculateRewards() {
    const floor = DUNGEON_STATE.floor;
    const isBoss = (floor % 10 === 0);

    // Loot Logic
    let lootDrop = null;
    // Boss = 100%, Normal = 70%
    const dropChance = isBoss ? 1.0 : 0.70;

    if (Math.random() <= dropChance) {
        let material = MATERIAL_TIERS[0];
        // Find highest tier available for this floor
        for (const mat of MATERIAL_TIERS) {
            if (floor >= mat.dropFloor) {
                material = mat;
            } else {
                break;
            }
        }
        // Quantity: Boss = 2, Normal = 1
        const qty = isBoss ? 2 : 1;
        lootDrop = { id: material.id, name: material.name, amount: qty };
    }

    return {
        dustReward: floor * 150,
        xpReward: floor * 10,
        loot: lootDrop
    };
}

// 2. Increase Floor (Active - Actually moves you)
export function increaseFloor() {
    DUNGEON_STATE.floor++;
    DUNGEON_STATE.currentStance = 'aggressive';

    // Stats Scaling (Original Formula Preserved)
    DUNGEON_STATE.maxHP = Math.floor(50 * Math.pow(1.15, DUNGEON_STATE.floor - 1));
    DUNGEON_STATE.currentHP = DUNGEON_STATE.maxHP;
    DUNGEON_STATE.attack = Math.floor(5 + (DUNGEON_STATE.floor * 1.5));

    // Update Visuals
    refreshMonsterVisuals();
}

export function rollMonsterStance() {
    const rand = Math.random();
    if (rand < 0.7) {
        DUNGEON_STATE.currentStance = 'aggressive';
    } else if (rand < 0.9) {
        DUNGEON_STATE.currentStance = 'spiked';
    } else {
        DUNGEON_STATE.currentStance = 'enraged';
    }
    return DUNGEON_STATE.currentStance;
}

export function getDungeonData() {
    return { ...DUNGEON_STATE };
}

export function loadDungeonData(savedData) {
    if (!savedData) return;
    Object.assign(DUNGEON_STATE, savedData);
}