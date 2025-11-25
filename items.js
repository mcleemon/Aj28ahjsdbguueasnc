// items.js - v1.0.0
// Defines the Equipment Database and Material Tiers

export const MATERIAL_TIERS = [
    { id: 'wood_scraps', name: "Wood Scraps", dropFloor: 1 },      // T1
    { id: 'copper_ore', name: "Copper Ore", dropFloor: 11 },       // T2
    { id: 'iron_ore', name: "Iron Ore", dropFloor: 31 },           // T3
    { id: 'coal', name: "Coal", dropFloor: 51 },                   // T4 (Used for Steel)
    { id: 'silver_ore', name: "Silver Ore", dropFloor: 71 },       // T5
    { id: 'gold_ore', name: "Gold Ore", dropFloor: 91 },           // T6
    { id: 'obsidian_shard', name: "Obsidian Shard", dropFloor: 111 }, // T7
    { id: 'platinum_ore', name: "Platinum Ore", dropFloor: 131 },  // T8
    { id: 'mithril_ore', name: "Mithril Ore", dropFloor: 151 },    // T9
    { id: 'orichalcum_ore', name: "Orichalcum Ore", dropFloor: 171 }, // T10
    { id: 'adamantite_ore', name: "Adamantite Ore", dropFloor: 191 }, // T11
    { id: 'rune_essence', name: "Rune Essence", dropFloor: 211 },  // T12
    { id: 'dragon_scale', name: "Dragon Scale", dropFloor: 231 },  // T13
    { id: 'void_dust', name: "Void Dust", dropFloor: 251 },        // T14
    { id: 'celestial_shard', name: "Celestial Shard", dropFloor: 271 } // T15
];

export const WEAPON_DB = [
    { id: 'rusty_sword', name: "Rusty Sword", damage: 10, tier: 0 },
    { id: 'wood_sword', name: "Wooden Sword", damage: 25, tier: 1, matReq: 'wood_scraps' },
    { id: 'copper_sword', name: "Copper Sword", damage: 50, tier: 2, matReq: 'copper_ore' },
    { id: 'iron_sword', name: "Iron Sword", damage: 100, tier: 3, matReq: 'iron_ore' },
    { id: 'steel_sword', name: "Steel Sword", damage: 200, tier: 4, matReq: 'coal' },
    { id: 'silver_sword', name: "Silver Sword", damage: 400, tier: 5, matReq: 'silver_ore' },
    { id: 'gold_sword', name: "Golden Sword", damage: 800, tier: 6, matReq: 'gold_ore' },
    { id: 'obsidian_sword', name: "Obsidian Sword", damage: 1500, tier: 7, matReq: 'obsidian_shard' },
    { id: 'platinum_sword', name: "Platinum Sword", damage: 3000, tier: 8, matReq: 'platinum_ore' },
    { id: 'mithril_sword', name: "Mithril Sword", damage: 6000, tier: 9, matReq: 'mithril_ore' },
    { id: 'orichalcum_sword', name: "Orichalcum Sword", damage: 12000, tier: 10, matReq: 'orichalcum_ore' },
    { id: 'adamantite_sword', name: "Adamantite Sword", damage: 25000, tier: 11, matReq: 'adamantite_ore' },
    { id: 'rune_sword', name: "Rune Sword", damage: 50000, tier: 12, matReq: 'rune_essence' },
    { id: 'dragon_sword', name: "Dragon Sword", damage: 100000, tier: 13, matReq: 'dragon_scale' },
    { id: 'void_sword', name: "Void Sword", damage: 250000, tier: 14, matReq: 'void_dust' },
    { id: 'celestial_sword', name: "Celestial Sword", damage: 500000, tier: 15, matReq: 'celestial_shard' }
];

export const ARMOR_DB = [
    { id: 'tattered_shirt', name: "Tattered Shirt", defense: 0, tier: 0 },
    { id: 'wood_armor', name: "Wooden Armor", defense: 30, tier: 1, matReq: 'wood_scraps' }, // Was 10
    { id: 'copper_armor', name: "Copper Armor", defense: 75, tier: 2, matReq: 'copper_ore' }, // Was 25
    { id: 'iron_armor', name: "Iron Armor", defense: 150, tier: 3, matReq: 'iron_ore' }, // Was 50
    { id: 'steel_armor', name: "Steel Armor", defense: 250, tier: 4, matReq: 'coal' }, // Was 80
    { id: 'silver_armor', name: "Silver Armor", defense: 350, tier: 5, matReq: 'silver_ore' }, // Was 120
    { id: 'gold_armor', name: "Golden Armor", defense: 500, tier: 6, matReq: 'gold_ore' }, // Was 180
    { id: 'obsidian_armor', name: "Obsidian Armor", defense: 700, tier: 7, matReq: 'obsidian_shard' },
    { id: 'platinum_armor', name: "Platinum Armor", defense: 950, tier: 8, matReq: 'platinum_ore' },
    { id: 'mithril_armor', name: "Mithril Armor", defense: 1250, tier: 9, matReq: 'mithril_ore' },
    { id: 'orichalcum_armor', name: "Orichalcum Armor", defense: 1600, tier: 10, matReq: 'orichalcum_ore' },
    { id: 'adamantite_armor', name: "Adamantite Armor", defense: 2000, tier: 11, matReq: 'adamantite_ore' },
    { id: 'rune_armor', name: "Rune Armor", defense: 2500, tier: 12, matReq: 'rune_essence' },
    { id: 'dragon_armor', name: "Dragon Armor", defense: 3200, tier: 13, matReq: 'dragon_scale' },
    { id: 'void_armor', name: "Void Armor", defense: 4200, tier: 14, matReq: 'void_dust' },
    { id: 'celestial_armor', name: "Celestial Armor", defense: 6000, tier: 15, matReq: 'celestial_shard' }
];