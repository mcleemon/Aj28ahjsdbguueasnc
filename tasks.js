// tasks.js - v2.6.0
// Features: Correct Asset Icons for Smithing Tasks

import { GAME_ASSETS } from './assets.js';
import { HERO_STATE } from './hero.js';
import { DUNGEON_STATE } from './dungeon.js';
import { getMiningState, getItemLevel, isItemUnlocked } from './mining.js';

// --- CONFIGURATION: THE TASK DATABASE ---
const TASK_DB = [
    // --- 📅 DAILY & REPEATABLE ---
    {
        id: 'daily_mimic',
        category: 'daily',
        title: "Mimic Friend",
        desc: "Feed the Mimic today",
        icon: 'mimicClose',
        rewardDust: 5000,
        isCompleted: () => (window.gameState.mimicFeedsToday || 0) > 0,
        isDaily: true
    },

    // --- ⚔️ COMBAT & PROGRESSION ---
    {
        id: 't1_hero_5',
        category: 'combat',
        title: "Rookie Rising",
        desc: "Reach Global Hero Level 5",
        icon: 'warrior',
        rewardDust: 5000,
        isCompleted: () => (window.gameState.globalLevel || 1) >= 5
    },
    {
        id: 't1_floor_10',
        category: 'combat',
        title: "First Blood",
        desc: "Reach Floor 10",
        icon: 'warrior',
        rewardDust: 2500,
        isCompleted: () => DUNGEON_STATE.floor >= 10
    },
    {
        id: 't2_floor_20',
        category: 'combat',
        title: "Dungeon Explorer",
        desc: "Reach Floor 20",
        icon: 'warrior',
        rewardDust: 10000,
        isCompleted: () => DUNGEON_STATE.floor >= 20
    },
    {
        id: 't3_hero_20',
        category: 'combat',
        title: "Seasoned Veteran",
        desc: "Reach Global Hero Level 20",
        icon: 'warrior',
        rewardGem: 3,
        isCompleted: () => (window.gameState.globalLevel || 1) >= 20
    },
    {
        id: 't3_floor_50',
        category: 'combat',
        title: "Deep Delver",
        desc: "Reach Floor 50",
        icon: 'warrior',
        rewardDust: 100000,
        isCompleted: () => DUNGEON_STATE.floor >= 50
    },

    // --- 🏰 DUNGEON MASTERY ---
    {
        id: 't4_floor_100',
        category: 'combat',
        title: "Centurion",
        desc: "Reach Floor 100",
        icon: 'warrior',
        rewardDust: 250000,
        rewardGem: 5,
        isCompleted: () => DUNGEON_STATE.floor >= 100
    },
    {
        id: 't5_floor_200',
        category: 'combat',
        title: "Double Century",
        desc: "Reach Floor 200",
        icon: 'warrior',
        rewardDust: 500000,
        isCompleted: () => DUNGEON_STATE.floor >= 200
    },
    {
        id: 't5_floor_300',
        category: 'combat',
        title: "Spartan",
        desc: "Reach Floor 300",
        icon: 'warrior',
        rewardDust: 1000000,
        rewardGem: 10,
        isCompleted: () => DUNGEON_STATE.floor >= 300
    },
    {
        id: 't5_floor_400',
        category: 'combat',
        title: "Quad Century",
        desc: "Reach Floor 400",
        icon: 'warrior',
        rewardDust: 2000000,
        isCompleted: () => DUNGEON_STATE.floor >= 400
    },
    {
        id: 't5_floor_500',
        category: 'combat',
        title: "Half Millennium",
        desc: "Reach Floor 500",
        icon: 'warrior',
        rewardDust: 3000000,
        isCompleted: () => DUNGEON_STATE.floor >= 500
    },
    {
        id: 't5_floor_600',
        category: 'combat',
        title: "Depth Walker",
        desc: "Reach Floor 600",
        icon: 'warrior',
        rewardDust: 5000000,
        isCompleted: () => DUNGEON_STATE.floor >= 600
    },
    {
        id: 't5_floor_700',
        category: 'combat',
        title: "Lucky Seven",
        desc: "Reach Floor 700",
        icon: 'warrior',
        rewardDust: 7500000,
        rewardGem: 15,
        isCompleted: () => DUNGEON_STATE.floor >= 700
    },
    {
        id: 't5_floor_800',
        category: 'combat',
        title: "Octo Guard",
        desc: "Reach Floor 800",
        icon: 'warrior',
        rewardDust: 10000000,
        isCompleted: () => DUNGEON_STATE.floor >= 800
    },
    {
        id: 't5_floor_900',
        category: 'combat',
        title: "Nearing The Edge",
        desc: "Reach Floor 900",
        icon: 'warrior',
        rewardDust: 15000000,
        isCompleted: () => DUNGEON_STATE.floor >= 900
    },
    {
        id: 't5_floor_1000',
        category: 'combat',
        title: "Millennium",
        desc: "Reach Floor 1000",
        icon: 'warrior',
        rewardDust: 20000000,
        rewardGem: 20,
        isCompleted: () => DUNGEON_STATE.floor >= 1000
    },
    {
        id: 't5_floor_1100',
        category: 'combat',
        title: "Beyond Limits",
        desc: "Reach Floor 1100",
        icon: 'warrior',
        rewardDust: 25000000,
        isCompleted: () => DUNGEON_STATE.floor >= 1100
    },
    {
        id: 't5_floor_1200',
        category: 'combat',
        title: "Void Walker",
        desc: "Reach Floor 1200",
        icon: 'warrior',
        rewardDust: 30000000,
        rewardGem: 25,
        isCompleted: () => DUNGEON_STATE.floor >= 1200
    },
    {
        id: 't5_floor_1300',
        category: 'combat',
        title: "Abyssal King",
        desc: "Reach Floor 1300",
        icon: 'warrior',
        rewardDust: 40000000,
        isCompleted: () => DUNGEON_STATE.floor >= 1300
    },
    {
        id: 't5_floor_1400',
        category: 'combat',
        title: "Celestial Gate",
        desc: "Reach Floor 1400",
        icon: 'warrior',
        rewardDust: 50000000,
        isCompleted: () => DUNGEON_STATE.floor >= 1400
    },
    {
        id: 't5_floor_1500',
        category: 'combat',
        title: "God of Dungeons",
        desc: "Reach Floor 1500",
        icon: 'warrior',
        rewardDust: 75000000,
        rewardGem: 50,
        isCompleted: () => DUNGEON_STATE.floor >= 1500
    },

    // --- ⛏️ MINING & ECONOMY ---
    {
        id: 'mine_cap_2',
        category: 'mining',
        title: "Industrialist",
        desc: "Upgrade Mining Capacity to Level 2",
        icon: 'mineEntrance',
        rewardDust: 10000,
        isCompleted: () => getMiningState().siloLevel >= 2
    },
    {
        id: 'mine_cap_3',
        category: 'mining',
        title: "Mass Storage",
        desc: "Upgrade Mining Capacity to Level 3",
        icon: 'mineEntrance',
        rewardDust: 50000,
        isCompleted: () => getMiningState().siloLevel >= 3
    },
    // --- ITEM MILESTONES (Level 10 Goals) ---
    {
        id: 'mine_item1_10',
        category: 'mining',
        title: "Sharp Tools",
        desc: "Upgrade Pickaxe to Level 10",
        icon: 'miningItem1',
        rewardDust: 2500,
        isCompleted: () => getItemLevel(1) >= 10
    },
    {
        id: 'mine_item2_10',
        category: 'mining',
        title: "Safety First",
        desc: "Upgrade Helmet to Level 10",
        icon: 'miningItem2',
        rewardDust: 10000,
        isCompleted: () => getItemLevel(2) >= 10
    },
    {
        id: 'mine_item3_10',
        category: 'mining',
        title: "Crew Chief",
        desc: "Upgrade Worker to Level 10",
        icon: 'miningItem3',
        rewardDust: 25000,
        isCompleted: () => getItemLevel(3) >= 10
    },
    {
        id: 'mine_item4_10',
        category: 'mining',
        title: "Demolitionist",
        desc: "Upgrade Dynamite to Level 10",
        icon: 'miningItem4',
        rewardDust: 50000,
        isCompleted: () => getItemLevel(4) >= 10
    },
    {
        id: 'mine_item5_10',
        category: 'mining',
        title: "Logistics",
        desc: "Upgrade Minecart to Level 10",
        icon: 'miningItem5',
        rewardDust: 100000,
        isCompleted: () => getItemLevel(5) >= 10
    },
    {
        id: 'mine_item6_10',
        category: 'mining',
        title: "Power Surge",
        desc: "Upgrade Power Cell to Level 10",
        icon: 'miningItem6',
        rewardDust: 250000,
        isCompleted: () => getItemLevel(6) >= 10
    },
    {
        id: 'mine_item7_10',
        category: 'mining',
        title: "Heavy Metal",
        desc: "Upgrade Driller to Level 10",
        icon: 'miningItem7',
        rewardDust: 500000,
        isCompleted: () => getItemLevel(7) >= 10
    },
    {
        id: 'mine_item8_10',
        category: 'mining',
        title: "Core Stability",
        desc: "Upgrade Nexus Core to Level 10",
        icon: 'miningItem8',
        rewardDust: 1000000,
        isCompleted: () => getItemLevel(8) >= 10
    },

    // --- ⚒️ SMITHING & GEAR (UPDATED ICONS) ---
    // TIER 1: WOOD
    { id: 't1_craft_sword', category: 'smithing', title: "Wood Smith", desc: "Own a Wooden Sword", icon: 'swordWood', rewardDust: 100, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'wood_sword') },
    { id: 't1_craft_armor', category: 'smithing', title: "Wood Guard", desc: "Own Wooden Armor", icon: 'armorWood', rewardDust: 100, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'wood_armor') },
    { id: 't1_max_sword', category: 'smithing', title: "Wooden Blade Master", desc: "Own a Wooden Sword +10", icon: 'swordWood', rewardGem: 1, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'wood_sword' && i.level >= 10) },
    { id: 't1_max_armor', category: 'smithing', title: "Wooden Armor Master", desc: "Own Wooden Armor +10", icon: 'armorWood', rewardGem: 1, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'wood_armor' && i.level >= 10) },

    // TIER 2: COPPER
    { id: 't2_craft_sword', category: 'smithing', title: "Copper Smith", desc: "Own a Copper Sword", icon: 'swordCopper', rewardDust: 1000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'copper_sword') },
    { id: 't2_craft_armor', category: 'smithing', title: "Copper Guard", desc: "Own Copper Armor", icon: 'armorCopper', rewardDust: 1000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'copper_armor') },
    { id: 't2_max_sword', category: 'smithing', title: "Copper Blade Master", desc: "Own a Copper Sword +10", icon: 'swordCopper', rewardGem: 2, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'copper_sword' && i.level >= 10) },
    { id: 't2_max_armor', category: 'smithing', title: "Copper Armor Master", desc: "Own Copper Armor +10", icon: 'armorCopper', rewardGem: 2, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'copper_armor' && i.level >= 10) },

    // TIER 3: IRON
    { id: 't3_craft_sword', category: 'smithing', title: "Iron Smith", desc: "Own an Iron Sword", icon: 'swordIron', rewardDust: 10000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'iron_sword') },
    { id: 't3_craft_armor', category: 'smithing', title: "Iron Guard", desc: "Own Iron Armor", icon: 'armorIron', rewardDust: 10000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'iron_armor') },
    { id: 't3_max_sword', category: 'smithing', title: "Iron Blade Master", desc: "Own an Iron Sword +10", icon: 'swordIron', rewardGem: 3, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'iron_sword' && i.level >= 10) },
    { id: 't3_max_armor', category: 'smithing', title: "Iron Armor Master", desc: "Own Iron Armor +10", icon: 'armorIron', rewardGem: 3, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'iron_armor' && i.level >= 10) },

    // TIER 4: STEEL
    { id: 't4_craft_sword', category: 'smithing', title: "Steel Smith", desc: "Own a Steel Sword", icon: 'swordSteel', rewardDust: 25000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'steel_sword') },
    { id: 't4_craft_armor', category: 'smithing', title: "Steel Guard", desc: "Own Steel Armor", icon: 'armorSteel', rewardDust: 25000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'steel_armor') },
    { id: 't4_max_sword', category: 'smithing', title: "Steel Blade Master", desc: "Own a Steel Sword +10", icon: 'swordSteel', rewardGem: 4, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'steel_sword' && i.level >= 10) },
    { id: 't4_max_armor', category: 'smithing', title: "Steel Armor Master", desc: "Own Steel Armor +10", icon: 'armorSteel', rewardGem: 4, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'steel_armor' && i.level >= 10) },

    // TIER 5: SILVER
    { id: 't5_craft_sword', category: 'smithing', title: "Silver Smith", desc: "Own a Silver Sword", icon: 'swordSilver', rewardDust: 50000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'silver_sword') },
    { id: 't5_craft_armor', category: 'smithing', title: "Silver Guard", desc: "Own Silver Armor", icon: 'armorSilver', rewardDust: 50000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'silver_armor') },
    { id: 't5_max_sword', category: 'smithing', title: "Silver Blade Master", desc: "Own a Silver Sword +10", icon: 'swordSilver', rewardGem: 5, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'silver_sword' && i.level >= 10) },
    { id: 't5_max_armor', category: 'smithing', title: "Silver Armor Master", desc: "Own Silver Armor +10", icon: 'armorSilver', rewardGem: 5, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'silver_armor' && i.level >= 10) },

    // TIER 6: GOLD
    { id: 't6_craft_sword', category: 'smithing', title: "Gold Smith", desc: "Own a Golden Sword", icon: 'swordGold', rewardDust: 75000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'gold_sword') },
    { id: 't6_craft_armor', category: 'smithing', title: "Gold Guard", desc: "Own Golden Armor", icon: 'armorGold', rewardDust: 75000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'gold_armor') },
    { id: 't6_max_sword', category: 'smithing', title: "Gold Blade Master", desc: "Own a Golden Sword +10", icon: 'swordGold', rewardGem: 5, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'gold_sword' && i.level >= 10) },
    { id: 't6_max_armor', category: 'smithing', title: "Gold Armor Master", desc: "Own Golden Armor +10", icon: 'armorGold', rewardGem: 5, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'gold_armor' && i.level >= 10) },

    // TIER 7: OBSIDIAN
    { id: 't7_craft_sword', category: 'smithing', title: "Obsidian Smith", desc: "Own an Obsidian Sword", icon: 'swordObsidian', rewardDust: 100000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'obsidian_sword') },
    { id: 't7_craft_armor', category: 'smithing', title: "Obsidian Guard", desc: "Own Obsidian Armor", icon: 'armorObsidian', rewardDust: 100000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'obsidian_armor') },
    { id: 't7_max_sword', category: 'smithing', title: "Obsidian Blade Master", desc: "Own an Obsidian Sword +10", icon: 'swordObsidian', rewardGem: 6, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'obsidian_sword' && i.level >= 10) },
    { id: 't7_max_armor', category: 'smithing', title: "Obsidian Armor Master", desc: "Own Obsidian Armor +10", icon: 'armorObsidian', rewardGem: 6, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'obsidian_armor' && i.level >= 10) },

    // TIER 8: PLATINUM
    { id: 't8_craft_sword', category: 'smithing', title: "Platinum Smith", desc: "Own a Platinum Sword", icon: 'swordPlatinum', rewardDust: 150000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'platinum_sword') },
    { id: 't8_craft_armor', category: 'smithing', title: "Platinum Guard", desc: "Own Platinum Armor", icon: 'armorPlatinum', rewardDust: 150000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'platinum_armor') },
    { id: 't8_max_sword', category: 'smithing', title: "Platinum Blade Master", desc: "Own a Platinum Sword +10", icon: 'swordPlatinum', rewardGem: 7, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'platinum_sword' && i.level >= 10) },
    { id: 't8_max_armor', category: 'smithing', title: "Platinum Armor Master", desc: "Own Platinum Armor +10", icon: 'armorPlatinum', rewardGem: 7, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'platinum_armor' && i.level >= 10) },

    // TIER 9: MITHRIL
    { id: 't9_craft_sword', category: 'smithing', title: "Mithril Smith", desc: "Own a Mithril Sword", icon: 'swordMithril', rewardDust: 250000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'mithril_sword') },
    { id: 't9_craft_armor', category: 'smithing', title: "Mithril Guard", desc: "Own Mithril Armor", icon: 'armorMithril', rewardDust: 250000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'mithril_armor') },
    { id: 't9_max_sword', category: 'smithing', title: "Mithril Blade Master", desc: "Own a Mithril Sword +10", icon: 'swordMithril', rewardGem: 8, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'mithril_sword' && i.level >= 10) },
    { id: 't9_max_armor', category: 'smithing', title: "Mithril Armor Master", desc: "Own Mithril Armor +10", icon: 'armorMithril', rewardGem: 8, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'mithril_armor' && i.level >= 10) },

    // TIER 10: ORICHALCUM
    { id: 't10_craft_sword', category: 'smithing', title: "Orichalcum Smith", desc: "Own an Orichalcum Sword", icon: 'swordOrichalcum', rewardDust: 400000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'orichalcum_sword') },
    { id: 't10_craft_armor', category: 'smithing', title: "Orichalcum Guard", desc: "Own Orichalcum Armor", icon: 'armorOrichalcum', rewardDust: 400000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'orichalcum_armor') },
    { id: 't10_max_sword', category: 'smithing', title: "Orichalcum Blade Master", desc: "Own Orichalcum Sword +10", icon: 'swordOrichalcum', rewardGem: 10, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'orichalcum_sword' && i.level >= 10) },
    { id: 't10_max_armor', category: 'smithing', title: "Orichalcum Armor Master", desc: "Own Orichalcum Armor +10", icon: 'armorOrichalcum', rewardGem: 10, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'orichalcum_armor' && i.level >= 10) },

    // TIER 11: ADAMANTITE
    { id: 't11_craft_sword', category: 'smithing', title: "Adamantite Smith", desc: "Own an Adamantite Sword", icon: 'swordAdamantite', rewardDust: 600000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'adamantite_sword') },
    { id: 't11_craft_armor', category: 'smithing', title: "Adamantite Guard", desc: "Own Adamantite Armor", icon: 'armorAdamantite', rewardDust: 600000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'adamantite_armor') },
    { id: 't11_max_sword', category: 'smithing', title: "Adamantite Blade Master", desc: "Own Adamantite Sword +10", icon: 'swordAdamantite', rewardGem: 12, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'adamantite_sword' && i.level >= 10) },
    { id: 't11_max_armor', category: 'smithing', title: "Adamantite Armor Master", desc: "Own Adamantite Armor +10", icon: 'armorAdamantite', rewardGem: 12, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'adamantite_armor' && i.level >= 10) },

    // TIER 12: RUNE
    { id: 't12_craft_sword', category: 'smithing', title: "Rune Smith", desc: "Own a Rune Sword", icon: 'swordRune', rewardDust: 1000000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'rune_sword') },
    { id: 't12_craft_armor', category: 'smithing', title: "Rune Guard", desc: "Own Rune Armor", icon: 'armorRune', rewardDust: 1000000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'rune_armor') },
    { id: 't12_max_sword', category: 'smithing', title: "Rune Blade Master", desc: "Own a Rune Sword +10", icon: 'swordRune', rewardGem: 15, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'rune_sword' && i.level >= 10) },
    { id: 't12_max_armor', category: 'smithing', title: "Rune Armor Master", desc: "Own Rune Armor +10", icon: 'armorRune', rewardGem: 15, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'rune_armor' && i.level >= 10) },

    // TIER 13: DRAGON
    { id: 't13_craft_sword', category: 'smithing', title: "Dragon Smith", desc: "Own a Dragon Sword", icon: 'swordDragon', rewardDust: 2500000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'dragon_sword') },
    { id: 't13_craft_armor', category: 'smithing', title: "Dragon Guard", desc: "Own Dragon Armor", icon: 'armorDragon', rewardDust: 2500000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'dragon_armor') },
    { id: 't13_max_sword', category: 'smithing', title: "Dragon Blade Master", desc: "Own a Dragon Sword +10", icon: 'swordDragon', rewardGem: 20, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'dragon_sword' && i.level >= 10) },
    { id: 't13_max_armor', category: 'smithing', title: "Dragon Armor Master", desc: "Own Dragon Armor +10", icon: 'armorDragon', rewardGem: 20, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'dragon_armor' && i.level >= 10) },

    // TIER 14: VOID
    { id: 't14_craft_sword', category: 'smithing', title: "Void Smith", desc: "Own a Void Sword", icon: 'swordVoid', rewardDust: 4000000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'void_sword') },
    { id: 't14_craft_armor', category: 'smithing', title: "Void Guard", desc: "Own Void Armor", icon: 'armorVoid', rewardDust: 4000000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'void_armor') },
    { id: 't14_max_sword', category: 'smithing', title: "Void Blade Master", desc: "Own a Void Sword +10", icon: 'swordVoid', rewardGem: 25, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'void_sword' && i.level >= 10) },
    { id: 't14_max_armor', category: 'smithing', title: "Void Armor Master", desc: "Own Void Armor +10", icon: 'armorVoid', rewardGem: 25, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'void_armor' && i.level >= 10) },

    // TIER 15: CELESTIAL
    { id: 't15_craft_sword', category: 'smithing', title: "Celestial Smith", desc: "Own a Celestial Sword", icon: 'swordCelestial', rewardDust: 8000000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'celestial_sword') },
    { id: 't15_craft_armor', category: 'smithing', title: "Celestial Guard", desc: "Own Celestial Armor", icon: 'armorCelestial', rewardDust: 8000000, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'celestial_armor') },
    { id: 't15_max_sword', category: 'smithing', title: "Celestial Blade Master", desc: "Own a Celestial Sword +10", icon: 'swordCelestial', rewardGem: 50, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'celestial_sword' && i.level >= 10) },
    { id: 't15_max_armor', category: 'smithing', title: "Celestial Armor Master", desc: "Own Celestial Armor +10", icon: 'armorCelestial', rewardGem: 50, isCompleted: () => HERO_STATE.gearInventory.some(i => i.id === 'celestial_armor' && i.level >= 10) },

    // --- 🎲 MINIGAMES ---
    // BLACKJACK
    {
        id: 't2_blackjack_3',
        category: 'minigame',
        title: "Card Shark",
        desc: "Reach Blackjack Level 3",
        icon: 'iconBlackjack',
        rewardDust: 50000,
        isCompleted: () => (window.gameState.blackjack_level || 0) >= 3
    },
    {
        id: 't4_blackjack_10',
        category: 'minigame',
        title: "Casino King",
        desc: "Reach Blackjack Level 10",
        icon: 'iconBlackjack',
        rewardDust: 250000,
        isCompleted: () => (window.gameState.blackjack_level || 0) >= 10
    },
    {
        id: 't5_blackjack_25',
        category: 'minigame',
        title: "High Roller",
        desc: "Reach Blackjack Level 25",
        icon: 'iconBlackjack',
        rewardDust: 1000000,
        rewardGem: 5,
        isCompleted: () => (window.gameState.blackjack_level || 0) >= 25
    },
    {
        id: 't6_blackjack_50',
        category: 'minigame',
        title: "Card Counter",
        desc: "Reach Blackjack Level 50",
        icon: 'iconBlackjack',
        rewardDust: 5000000,
        rewardGem: 15,
        isCompleted: () => (window.gameState.blackjack_level || 0) >= 50
    },

    // SLOTS / REEL
    {
        id: 't1_slot_5',
        category: 'minigame',
        title: "Spinner",
        desc: "Reach Slot Level 5",
        icon: 'iconSlot',
        rewardDust: 50000,
        isCompleted: () => (window.gameState.slot_level || 0) >= 5
    },
    {
        id: 't2_slot_10',
        category: 'minigame',
        title: "Jackpot Hunter",
        desc: "Reach Slot Level 10",
        icon: 'iconSlot',
        rewardDust: 250000,
        isCompleted: () => (window.gameState.slot_level || 0) >= 10
    },
    {
        id: 't3_slot_25',
        category: 'minigame',
        title: "Slot Machine Pro",
        desc: "Reach Slot Level 25",
        icon: 'iconSlot',
        rewardDust: 1000000,
        rewardGem: 5,
        isCompleted: () => (window.gameState.slot_level || 0) >= 25
    },
    {
        id: 't4_slot_50',
        category: 'minigame',
        title: "Reel King",
        desc: "Reach Slot Level 50",
        icon: 'iconSlot',
        rewardDust: 5000000,
        rewardGem: 15,
        isCompleted: () => (window.gameState.slot_level || 0) >= 50
    },
    // SPIN COUNT TASKS
    {
        id: 't1_spins_100',
        category: 'minigame',
        title: "Feeling Lucky",
        desc: "Spin the Reel 100 Times",
        icon: 'iconSlot',
        rewardDust: 100000,
        isCompleted: () => (window.gameState.stats ? window.gameState.stats.totalReelSpins : 0) >= 100
    },
    {
        id: 't3_spins_1000',
        category: 'minigame',
        title: "Dizzy Spells",
        desc: "Spin the Reel 1,000 Times",
        icon: 'iconSlot',
        rewardDust: 1000000,
        rewardGem: 10,
        isCompleted: () => (window.gameState.stats ? window.gameState.stats.totalReelSpins : 0) >= 1000
    }
];

// Define Category Display Order & Titles
const CATEGORIES = {
    'daily': '📅 DAILY',
    'combat': '⚔️ COMBAT',
    'mining': '⛏️ MINING CAMP',
    'smithing': '⚒️ BLACKSMITH',
    'minigame': '🎲 LUCK'
};

document.addEventListener('DOMContentLoaded', () => {

    const tasksButton = document.getElementById('tasks-button');
    const tasksModal = document.getElementById('tasks-modal');
    const closeTasksButton = document.getElementById('close-tasks-button');
    const taskListContainer = document.querySelector('.task-list');

    if (!tasksButton || !tasksModal || !closeTasksButton) {
        console.error("Tasks modal elements not found!");
        return;
    }

    if (!window.gameState) window.gameState = {};
    if (!window.gameState.claimedTasks) window.gameState.claimedTasks = [];
    if (!window.gameState.dailyClaims) window.gameState.dailyClaims = {};

    // --- RENDER FUNCTION ---
    function renderTasks() {
        taskListContainer.innerHTML = ""; // Clear existing

        for (const [catKey, catTitle] of Object.entries(CATEGORIES)) {
            let tasksInCat = TASK_DB.filter(t => t.category === catKey);
            if (tasksInCat.length === 0) continue;

            tasksInCat.sort((a, b) => {
                // Get today's date string (YYYY-MM-DD)
                const today = new Date().toISOString().split('T')[0];

                let aClaimed = false;
                let bClaimed = false;

                // CHECK A: Is it daily? Check dailyClaims. Otherwise, check claimedTasks.
                if (a.isDaily) aClaimed = (window.gameState.dailyClaims[a.id] === today);
                else aClaimed = window.gameState.claimedTasks.includes(a.id);

                // CHECK B: Do the same for B
                if (b.isDaily) bClaimed = (window.gameState.dailyClaims[b.id] === today);
                else bClaimed = window.gameState.claimedTasks.includes(b.id);

                return aClaimed - bClaimed;
            });

            const header = document.createElement('h3');
            header.innerText = catTitle;
            header.style.marginTop = "20px";
            header.style.marginBottom = "10px";
            header.style.borderBottom = "1px solid #555";
            header.style.paddingBottom = "5px";
            taskListContainer.appendChild(header);

            tasksInCat.forEach(task => {
                renderSingleTask(task, taskListContainer);
            });
        }
    }

    function renderSingleTask(task, container) {
        const today = new Date().toISOString().split('T')[0];
        let isClaimed = false;
        if (task.isDaily) {
            isClaimed = (window.gameState.dailyClaims[task.id] === today);
        } else {
            isClaimed = window.gameState.claimedTasks.includes(task.id);
        }
        const itemDiv = document.createElement('div');
        itemDiv.className = 'task-item';

        // Icon Logic
        let iconSrc = "";
        if (GAME_ASSETS[task.icon]) {
            iconSrc = GAME_ASSETS[task.icon];
        } else {
            iconSrc = GAME_ASSETS.iconCrystalDust;
        }

        // --- REWARD LABEL ---
        let rewardsHTML = "";
        if (task.rewardDust) {
            const val = window.formatNumberGlobal(task.rewardDust);
            rewardsHTML += `<span style="color:#87CEEB; font-weight:bold;">${val} Dust</span>`;
        }
        if (task.rewardGem) {
            if (rewardsHTML !== "") rewardsHTML += ` <span style="color:#fff; font-size:10px;">+</span> `;
            rewardsHTML += `<span style="color:#FFD700; font-weight:bold;">${task.rewardGem} Gems</span>`;
        }

        // Check Completion
        let completed = false;
        try {
            completed = task.isCompleted();
        } catch (e) {
            console.warn(`Task check failed for ${task.id}`, e);
        }

        let btnText = "GO";
        let btnDisabled = true;

        if (isClaimed) {
            btnText = "DONE";
            btnDisabled = true;
            itemDiv.style.opacity = "0.5";
        } else if (completed) {
            btnText = "CLAIM";
            btnDisabled = false;
            itemDiv.style.borderColor = "#ffd700";
            itemDiv.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.2)";
        } else {
            btnText = "LOCKED";
            btnDisabled = true;
        }

        // --- UPDATED LAYOUT (No Black Box) ---
        itemDiv.innerHTML = `
            <div style="
                width: 50px; 
                height: 50px; 
                background: transparent;
                border: none;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                margin-right: 2px; 
                flex-shrink: 0;
            ">
                <img src="${iconSrc}" class="task-icon" alt="Icon" style="width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));">
            </div>
            <div style="flex-grow: 1; text-align: left; display:flex; flex-direction:column; justify-content:center; overflow:hidden;">
                <span class="task-title" style="margin-bottom:2px; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${task.title}</span>
                <span class="task-desc" style="font-size:10px; color:#aaa; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${task.desc}</span>
                <div style="font-size:11px;">
                    <span style="color:#fff; font-weight:bold; margin-right:4px;">Reward:</span>
                    ${rewardsHTML}
                </div>
            </div>
            <button class="task-claim-button" data-id="${task.id}" ${btnDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;

        const btn = itemDiv.querySelector('button');
        if (!isClaimed && completed) {
            btn.classList.add('task-ready');
            btn.addEventListener('click', () => {
                handleClaimTask(task);
            });
        }

        container.appendChild(itemDiv);
    }

    function handleClaimTask(task) {
        if (task.rewardDust) {
            window.gameState.dust += task.rewardDust;
        }
        if (task.rewardGem) {
            window.gameState.gemShards += task.rewardGem;
        }

        const today = new Date().toISOString().split('T')[0];

        if (task.isDaily) {
            // If Daily: Save TODAY'S DATE to the daily object
            window.gameState.dailyClaims[task.id] = today;
        } else {
            // If Normal: Save ID to the permanent list
            window.gameState.claimedTasks.push(task.id);
        }

        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.refreshGameUI) window.refreshGameUI();

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        renderTasks();
    }

    // --- LISTENERS ---

    tasksButton.disabled = false;
    tasksButton.addEventListener('click', () => {
        renderTasks();
        tasksModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    closeTasksButton.addEventListener('click', () => {
        tasksModal.classList.add('closing');
        setTimeout(() => {
            tasksModal.classList.add('hidden');
            tasksModal.classList.remove('closing');
        }, 300);
    });
});