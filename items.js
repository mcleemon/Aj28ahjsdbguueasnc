// items.js - v1.6.0
// Balanced for "130 Floor Lifespan" Rule
// T1 Base: 80 -> T15 Base: 1000

export const MATERIAL_TIERS = [
    { id: 'wood_scraps', name: "Wood Scraps", dropFloor: 1, icon: 'buttonBag' },      // T1
    { id: 'copper_ore', name: "Copper Ore", dropFloor: 101 },        // T2
    { id: 'iron_ore', name: "Iron Ore", dropFloor: 201 },            // T3
    { id: 'coal', name: "Coal", dropFloor: 301 },                    // T4
    { id: 'silver_ore', name: "Silver Ore", dropFloor: 401 },        // T5
    { id: 'gold_ore', name: "Gold Ore", dropFloor: 501 },            // T6
    { id: 'obsidian_shard', name: "Obsidian Shard", dropFloor: 601 }, // T7
    { id: 'platinum_ore', name: "Platinum Ore", dropFloor: 701 },    // T8
    { id: 'mithril_ore', name: "Mithril Ore", dropFloor: 801 },      // T9
    { id: 'orichalcum_ore', name: "Orichalcum Ore", dropFloor: 901 }, // T10
    { id: 'adamantite_ore', name: "Adamantite Ore", dropFloor: 1001 }, // T11
    { id: 'rune_essence', name: "Rune Essence", dropFloor: 1101 },   // T12
    { id: 'dragon_scale', name: "Dragon Scale", dropFloor: 1201 },   // T13
    { id: 'void_dust', name: "Void Dust", dropFloor: 1301 },         // T14
    { id: 'celestial_shard', name: "Celestial Shard", dropFloor: 1401 } // T15
];

// Composite Recipes (Fuel for High Tiers)
const RECIPE_T11 = [{ id: 'wood_scraps', count: 2000 }];
const RECIPE_T12 = [{ id: 'copper_ore', count: 2000 }];
const RECIPE_T13 = [{ id: 'iron_ore', count: 2000 }];
const RECIPE_T14 = [{ id: 'wood_scraps', count: 3000 }, { id: 'copper_ore', count: 3000 }];
const RECIPE_T15 = [{ id: 'wood_scraps', count: 5000 }, { id: 'copper_ore', count: 5000 }, { id: 'iron_ore', count: 5000 }];

export const WEAPON_DB = [
    { id: 'rusty_sword', name: "Rusty Sword", damage: 30, tier: 0, icon: 'buttonBag' },
    { id: 'wood_sword', name: "Wooden Sword", damage: 80, tier: 1, matReq: 'wood_scraps' },
    { id: 'copper_sword', name: "Copper Sword", damage: 150, tier: 2, matReq: 'copper_ore' },
    { id: 'iron_sword', name: "Iron Sword", damage: 215, tier: 3, matReq: 'iron_ore' },
    { id: 'steel_sword', name: "Steel Sword", damage: 280, tier: 4, matReq: 'coal' },
    { id: 'silver_sword', name: "Silver Sword", damage: 350, tier: 5, matReq: 'silver_ore' },
    { id: 'gold_sword', name: "Golden Sword", damage: 415, tier: 6, matReq: 'gold_ore' },
    { id: 'obsidian_sword', name: "Obsidian Sword", damage: 480, tier: 7, matReq: 'obsidian_shard' },
    { id: 'platinum_sword', name: "Platinum Sword", damage: 550, tier: 8, matReq: 'platinum_ore' },
    { id: 'mithril_sword', name: "Mithril Sword", damage: 615, tier: 9, matReq: 'mithril_ore' },
    { id: 'orichalcum_sword', name: "Orichalcum Sword", damage: 680, tier: 10, matReq: 'orichalcum_ore' },
    { id: 'adamantite_sword', name: "Adamantite Sword", damage: 750, tier: 11, matReq: 'adamantite_ore', extraMats: RECIPE_T11 },
    { id: 'rune_sword', name: "Rune Sword", damage: 815, tier: 12, matReq: 'rune_essence', extraMats: RECIPE_T12 },
    { id: 'dragon_sword', name: "Dragon Sword", damage: 880, tier: 13, matReq: 'dragon_scale', extraMats: RECIPE_T13 },
    { id: 'void_sword', name: "Void Sword", damage: 940, tier: 14, matReq: 'void_dust', extraMats: RECIPE_T14 },
    { id: 'celestial_sword', name: "Celestial Sword", damage: 1000, tier: 15, matReq: 'celestial_shard', extraMats: RECIPE_T15 }
];

export const ARMOR_DB = [
    { id: 'tattered_shirt', name: "Tattered Shirt", defense: 10, tier: 0, icon: 'buttonBag' },
    { id: 'wood_armor', name: "Wooden Armor", defense: 80, tier: 1, matReq: 'wood_scraps' },
    { id: 'copper_armor', name: "Copper Armor", defense: 150, tier: 2, matReq: 'copper_ore' },
    { id: 'iron_armor', name: "Iron Armor", defense: 215, tier: 3, matReq: 'iron_ore' },
    { id: 'steel_armor', name: "Steel Armor", defense: 280, tier: 4, matReq: 'coal' },
    { id: 'silver_armor', name: "Silver Armor", defense: 350, tier: 5, matReq: 'silver_ore' },
    { id: 'gold_armor', name: "Golden Armor", defense: 415, tier: 6, matReq: 'gold_ore' },
    { id: 'obsidian_armor', name: "Obsidian Armor", defense: 480, tier: 7, matReq: 'obsidian_shard' },
    { id: 'platinum_armor', name: "Platinum Armor", defense: 550, tier: 8, matReq: 'platinum_ore' },
    { id: 'mithril_armor', name: "Mithril Armor", defense: 615, tier: 9, matReq: 'mithril_ore' },
    { id: 'orichalcum_armor', name: "Orichalcum Armor", defense: 680, tier: 10, matReq: 'orichalcum_ore' },
    { id: 'adamantite_armor', name: "Adamantite Armor", defense: 750, tier: 11, matReq: 'adamantite_ore', extraMats: RECIPE_T11 },
    { id: 'rune_armor', name: "Rune Armor", defense: 815, tier: 12, matReq: 'rune_essence', extraMats: RECIPE_T12 },
    { id: 'dragon_armor', name: "Dragon Armor", defense: 880, tier: 13, matReq: 'dragon_scale', extraMats: RECIPE_T13 },
    { id: 'void_armor', name: "Void Armor", defense: 940, tier: 14, matReq: 'void_dust', extraMats: RECIPE_T14 },
    { id: 'celestial_armor', name: "Celestial Armor", defense: 1000, tier: 15, matReq: 'celestial_shard', extraMats: RECIPE_T15 }
];