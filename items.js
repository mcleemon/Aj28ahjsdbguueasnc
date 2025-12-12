// items.js - v1.7.0
// Added manual 'dustCost' and 'matCost' for every item

export const MATERIAL_TIERS = [
    { id: 'wood_scraps', name: "Wood Scraps", dropFloor: 1, icon: 'matWood' },      
    { id: 'copper_ore', name: "Copper Ore", dropFloor: 101, icon: 'matCopper' },    
    { id: 'iron_ore', name: "Iron Ore", dropFloor: 201, icon: 'matIron' }, 
    { id: 'steel', name: "Steel", dropFloor: 301, icon: 'matSteel' },                  
    { id: 'silver_ore', name: "Silver Ore", dropFloor: 401, icon: 'matSilver' },       
    { id: 'gold_ore', name: "Gold Ore", dropFloor: 501, icon: 'matGold' },           
    { id: 'obsidian_shard', name: "Obsidian Shard", dropFloor: 601, icon: 'matObsidian' }, 
    { id: 'platinum_ore', name: "Platinum Ore", dropFloor: 701, icon: 'matPlatinum' },     
    { id: 'mithril_ore', name: "Mithril Ore", dropFloor: 801, icon: 'matMithril' },       
    { id: 'orichalcum_ore', name: "Orichalcum Ore", dropFloor: 901, icon: 'matOrichalcum' },  
    { id: 'adamantite_ore', name: "Adamantite Ore", dropFloor: 1001, icon: 'matAdamantite' },  
    { id: 'rune_essence', name: "Rune Ore", dropFloor: 1101, icon: 'matRune' },    
    { id: 'dragon_scale', name: "Dragon Scale", dropFloor: 1201, icon: 'matDragon' },    
    { id: 'void_dust', name: "Void Dust", dropFloor: 1301, icon: 'matVoid' },          
    { id: 'celestial_shard', name: "Celestial Shard", dropFloor: 1401, icon: 'matCelestial' }  
];

// Composite Recipes (Fuel for High Tiers)
const RECIPE_T11 = [{ id: 'wood_scraps', count: 2000 }];
const RECIPE_T12 = [{ id: 'copper_ore', count: 2000 }];
const RECIPE_T13 = [{ id: 'iron_ore', count: 2000 }];
const RECIPE_T14 = [{ id: 'wood_scraps', count: 3000 }, { id: 'copper_ore', count: 3000 }];
const RECIPE_T15 = [{ id: 'wood_scraps', count: 5000 }, { id: 'copper_ore', count: 5000 }, { id: 'iron_ore', count: 5000 }];

export const WEAPON_DB = [
    { id: 'rusty_sword', name: "Rusty Sword", damage: 30, tier: 0, icon: 'swordRusty', dustCost: 0, matCost: 0 },
    { id: 'wood_sword', name: "Wooden Sword", damage: 80, tier: 1, icon: 'swordWood', matReq: 'wood_scraps', dustCost: 2500, matCost: 20 },
    { id: 'copper_sword', name: "Copper Sword", damage: 150, tier: 2, icon: 'swordCopper', matReq: 'copper_ore', dustCost: 50000, matCost: 40 },
    { id: 'iron_sword', name: "Iron Sword", damage: 215, tier: 3, icon: 'swordIron', matReq: 'iron_ore', dustCost: 150000, matCost: 60 },
    { id: 'steel_sword', name: "Steel Sword", damage: 280, tier: 4, icon: 'swordSteel', matReq: 'steel', dustCost: 300000, matCost: 80 },
    { id: 'silver_sword', name: "Silver Sword", damage: 350, tier: 5, icon: 'swordSilver', matReq: 'silver_ore', dustCost: 500000, matCost: 100 },
    { id: 'gold_sword', name: "Golden Sword", damage: 415, tier: 6, icon: 'swordGold', matReq: 'gold_ore', dustCost: 750000, matCost: 120 },
    { id: 'obsidian_sword', name: "Obsidian Sword", damage: 480, tier: 7, icon: 'swordObsidian', matReq: 'obsidian_shard', dustCost: 1200000, matCost: 150 },
    { id: 'platinum_sword', name: "Platinum Sword", damage: 550, tier: 8, icon: 'swordPlatinum', matReq: 'platinum_ore', dustCost: 2000000, matCost: 200 },
    { id: 'mithril_sword', name: "Mithril Sword", damage: 615, tier: 9, icon: 'swordMithril', matReq: 'mithril_ore', dustCost: 3500000, matCost: 250 },
    { id: 'orichalcum_sword', name: "Orichalcum Sword", damage: 680, tier: 10, icon: 'swordOrichalcum', matReq: 'orichalcum_ore', dustCost: 5000000, matCost: 300 },
    { id: 'adamantite_sword', name: "Adamantite Sword", damage: 750, tier: 11, icon: 'swordAdamantite', matReq: 'adamantite_ore', extraMats: RECIPE_T11, dustCost: 10000000, matCost: 400 },
    { id: 'rune_sword', name: "Rune Sword", damage: 815, tier: 12, icon: 'swordRune', matReq: 'rune_essence', extraMats: RECIPE_T12, dustCost: 20000000, matCost: 500 },
    { id: 'dragon_sword', name: "Dragon Sword", damage: 880, tier: 13, icon: 'swordDragon', matReq: 'dragon_scale', extraMats: RECIPE_T13, dustCost: 35000000, matCost: 600 },
    { id: 'void_sword', name: "Void Sword", damage: 940, tier: 14, icon: 'swordVoid', matReq: 'void_dust', extraMats: RECIPE_T14, dustCost: 75000000, matCost: 800 },
    { id: 'celestial_sword', name: "Celestial Sword", damage: 1000, tier: 15, icon: 'swordCelestial', matReq: 'celestial_shard', extraMats: RECIPE_T15, dustCost: 150000000, matCost: 1000 }
];

export const ARMOR_DB = [
    { id: 'tattered_shirt', name: "Tattered Shirt", defense: 10, tier: 0, icon: 'armorShirt', dustCost: 0, matCost: 0 },
    { id: 'wood_armor', name: "Wooden Armor", defense: 60, tier: 1, icon: 'armorWood', matReq: 'wood_scraps', dustCost: 2500, matCost: 20 },
    { id: 'copper_armor', name: "Copper Armor", defense: 130, tier: 2, icon: 'armorCopper', matReq: 'copper_ore', dustCost: 50000, matCost: 40 },
    { id: 'iron_armor', name: "Iron Armor", defense: 195, tier: 3, icon: 'armorIron', matReq: 'iron_ore', dustCost: 150000, matCost: 60 },
    { id: 'steel_armor', name: "Steel Armor", defense: 260, tier: 4, icon: 'armorSteel', matReq: 'steel', dustCost: 300000, matCost: 80 },
    { id: 'silver_armor', name: "Silver Armor", defense: 330, tier: 5, icon: 'armorSilver', matReq: 'silver_ore', dustCost: 500000, matCost: 100 },
    { id: 'gold_armor', name: "Golden Armor", defense: 395, tier: 6, icon: 'armorGold', matReq: 'gold_ore', dustCost: 750000, matCost: 120 },
    { id: 'obsidian_armor', name: "Obsidian Armor", defense: 460, tier: 7, icon: 'armorObsidian', matReq: 'obsidian_shard', dustCost: 1200000, matCost: 150 },
    { id: 'platinum_armor', name: "Platinum Armor", defense: 530, tier: 8, icon: 'armorPlatinum', matReq: 'platinum_ore', dustCost: 2000000, matCost: 200 },
    { id: 'mithril_armor', name: "Mithril Armor", defense: 595, tier: 9, icon: 'armorMithril', matReq: 'mithril_ore', dustCost: 3500000, matCost: 250 },
    { id: 'orichalcum_armor', name: "Orichalcum Armor", defense: 660, tier: 10, icon: 'armorOrichalcum', matReq: 'orichalcum_ore', dustCost: 5000000, matCost: 300 },
    { id: 'adamantite_armor', name: "Adamantite Armor", defense: 730, tier: 11, icon: 'armorAdamantite', matReq: 'adamantite_ore', extraMats: RECIPE_T11, dustCost: 10000000, matCost: 400 },
    { id: 'rune_armor', name: "Rune Armor", defense: 795, tier: 12, icon: 'armorRune', matReq: 'rune_essence', extraMats: RECIPE_T12, dustCost: 20000000, matCost: 500 },
    { id: 'dragon_armor', name: "Dragon Armor", defense: 860, tier: 13, icon: 'armorDragon', matReq: 'dragon_scale', extraMats: RECIPE_T13, dustCost: 35000000, matCost: 600 },
    { id: 'void_armor', name: "Void Armor", defense: 920, tier: 14, icon: 'armorVoid', matReq: 'void_dust', extraMats: RECIPE_T14, dustCost: 75000000, matCost: 800 },
    { id: 'celestial_armor', name: "Celestial Armor", defense: 980, tier: 15, icon: 'armorCelestial', matReq: 'celestial_shard', extraMats: RECIPE_T15, dustCost: 150000000, matCost: 1000 }
];