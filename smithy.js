// smithy.js - v2.8.0
// Features: Forge, Armor, Sharpen (Fixed Animation & Alignment), Salvage, Transmute

import { HERO_STATE, recalculateHeroStats, generateUID } from './hero.js';
import { GAME_ASSETS } from './assets.js';
import { WEAPON_DB, ARMOR_DB, MATERIAL_TIERS } from './items.js';
import { incrementStat } from './achievements.js';

// --- CONFIGURATION ---
const TIER_COSTS = {
    1: 250, 2: 50000, 3: 150000, 4: 300000, 5: 500000,
    6: 750000, 7: 1200000, 8: 2000000, 9: 3500000, 10: 5000000,
    11: 10000000, 12: 20000000, 13: 35000000, 14: 75000000, 15: 150000000
};

// Transmute Logic: Base Ratio 1
const TRANSMUTE_RECIPES = [
    { from: 'copper_ore', to: 'wood_scraps', ratio: 1, cost: 10000 },
    { from: 'iron_ore', to: 'copper_ore', ratio: 1, cost: 10000 },
    { from: 'steel', to: 'iron_ore', ratio: 1, cost: 10000 },
    { from: 'silver_ore', to: 'steel', ratio: 1, cost: 25000 },
    { from: 'gold_ore', to: 'silver_ore', ratio: 1, cost: 25000 },
    { from: 'obsidian_shard', to: 'gold_ore', ratio: 1, cost: 50000 },
    { from: 'platinum_ore', to: 'obsidian_shard', ratio: 1, cost: 50000 },
    { from: 'mithril_ore', to: 'platinum_ore', ratio: 1, cost: 75000 },
    { from: 'orichalcum_ore', to: 'mithril_ore', ratio: 1, cost: 75000 },
    { from: 'adamantite_ore', to: 'orichalcum_ore', ratio: 1, cost: 100000 },
    { from: 'rune_essence', to: 'adamantite_ore', ratio: 1, cost: 100000 },
    { from: 'dragon_scale', to: 'rune_essence', ratio: 1, cost: 150000 },
    { from: 'void_dust', to: 'dragon_scale', ratio: 1, cost: 200000 },
    { from: 'celestial_shard', to: 'void_dust', ratio: 1, cost: 250000 }
];

const MAX_DAILY_TRANSMUTES = 10;

// --- HELPERS ---
function getForgeCost(tier) {
    if (tier === 0) return 0;
    return TIER_COSTS[tier] || (tier * 10000000);
}

function getDailyTransmuteKey() {
    const d = new Date();
    return `transmute_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getTransmuteState() {
    const key = getDailyTransmuteKey();
    if (!window.gameState.dailyTransmute) window.gameState.dailyTransmute = {};
    if (window.gameState.dailyTransmute.dateKey !== key) {
        window.gameState.dailyTransmute = { dateKey: key, counts: {} };
    }
    return window.gameState.dailyTransmute;
}

function getWeaponDamage(baseDmg, level) {
    return Math.floor(baseDmg * (1 + (level * 0.5)));
}

function getArmorDefense(baseDef, level) {
    return Math.floor(baseDef * (1 + (level * 0.5)));
}

function getItemIconUrl(iconKey) {
    return GAME_ASSETS[iconKey] || GAME_ASSETS.iconCrystalDust;
}

function getMatIconUrl(matId) {
    const mat = MATERIAL_TIERS.find(m => m.id === matId);
    if (mat && mat.icon && GAME_ASSETS[mat.icon]) {
        return GAME_ASSETS[mat.icon];
    }
    return GAME_ASSETS.iconCrystalDust;
}

function getMatClass(matId) {
    if (!matId) return 'mat-iron';
    if (matId.includes('wood')) return 'mat-wood';
    if (matId.includes('copper')) return 'mat-copper';
    if (matId.includes('silver')) return 'mat-silver';
    if (matId.includes('gold')) return 'mat-gold';
    if (matId.includes('obsidian')) return 'mat-obsidian';
    if (matId.includes('dragon') || matId.includes('void') || matId.includes('celestial')) return 'mat-mythic';
    return 'mat-iron';
}

function getSalvageValue(item, level) {
    if (item.tier === 0) return { dust: 0, materials: [] };
    const baseCost = item.dustCost !== undefined ? item.dustCost : getForgeCost(item.tier);
    let totalUpgradeCost = 0;
    for (let i = 0; i < level; i++) {
        totalUpgradeCost += Math.floor(baseCost * (1 + (i * 0.2)));
    }
    const dustRefund = Math.floor((baseCost * 0.25) + (totalUpgradeCost * 0.5));
    const materials = [];
    if (item.matReq) {
        const baseMatCount = item.matCost || 50;
        const amount = Math.floor(baseMatCount * 0.25);
        if (amount > 0) materials.push({ id: item.matReq, count: amount });
    }
    if (item.extraMats) {
        item.extraMats.forEach(mat => {
            const amount = Math.floor(mat.count * 0.25);
            if (amount > 0) materials.push({ id: mat.id, count: amount });
        });
    }
    return { dust: dustRefund, materials: materials };
}

// --- ANIMATION HELPER ---
function spawnSmithySparks(container) {
    for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'smithy-spark';
        const tx = (Math.random() - 0.5) * 150;
        const ty = (Math.random() - 0.5) * 150;
        spark.style.setProperty('--tx', `${tx}px`);
        spark.style.setProperty('--ty', `${ty}px`);
        spark.style.left = '50%';
        spark.style.top = '50%';
        spark.style.animation = `spark-fly 0.6s ease-out forwards`;
        container.appendChild(spark);
    }
    // Cleanup sparks
    setTimeout(() => {
        const sparks = container.querySelectorAll('.smithy-spark');
        sparks.forEach(s => s.remove());
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM ELEMENTS
    const craftButton = document.getElementById('craft-button');
    const smithyModal = document.getElementById('smithy-modal');
    const closeSmithyButton = document.getElementById('close-smithy-button');

    const hubView = document.getElementById('smithy-hub');
    const forgeView = document.getElementById('smithy-forge');
    const armorView = document.getElementById('smithy-forge-armor');
    const sharpenSelectView = document.getElementById('smithy-sharpen-select');
    const sharpenView = document.getElementById('smithy-sharpen');
    const dismantleView = document.getElementById('smithy-dismantle');
    const transmuteView = document.getElementById('smithy-transmute');

    const openForgeBtn = document.getElementById('open-forge-btn');
    const openArmorBtn = document.getElementById('open-armor-btn');
    const openSharpenBtn = document.getElementById('open-sharpen-btn');
    const openDismantleBtn = document.getElementById('open-dismantle-btn');
    const openTransmuteBtn = document.getElementById('open-transmute-btn');

    const forgeList = document.getElementById('forge-list');
    const armorList = document.getElementById('armor-list');
    const sharpenList = document.getElementById('sharpen-list');
    const dismantleList = document.getElementById('dismantle-list');
    const transmuteList = document.getElementById('transmute-list');

    const sharpenName = document.getElementById('sharpen-item-name');
    const sharpenStatCurrent = document.getElementById('sharpen-stat-current');
    const sharpenStatNext = document.getElementById('sharpen-stat-next');
    const sharpenChance = document.getElementById('sharpen-chance');
    const sharpenCostDust = document.getElementById('sharpen-cost-dust');
    const sharpenCostMat = document.getElementById('sharpen-cost-mat');
    const sharpenMatIcon = document.getElementById('sharpen-mat-icon');
    const doSharpenBtn = document.getElementById('do-sharpen-btn');
    const sharpenMsg = document.getElementById('sharpen-msg');
    const sharpenItemIcon = document.getElementById('sharpen-item-icon');

    const confirmModal = document.getElementById('craft-confirmation-modal');
    const confirmYesBtn = document.getElementById('confirm-craft-yes');
    const confirmNoBtn = document.getElementById('confirm-craft-no');
    const confirmText = document.getElementById('confirmation-text');

    let selectedInstanceForUpgrade = null;
    let pendingCraftData = null;
    let pendingDismantleUid = null;
    let currentView = 'hub';

    function switchView(view) {
        currentView = view;
        hubView.classList.add('hidden');
        forgeView.classList.add('hidden');
        armorView.classList.add('hidden');
        sharpenSelectView.classList.add('hidden');
        sharpenView.classList.add('hidden');
        if (dismantleView) dismantleView.classList.add('hidden');
        if (transmuteView) transmuteView.classList.add('hidden');

        if (view === 'hub') {
            hubView.classList.remove('hidden');
            closeSmithyButton.style.backgroundImage = `url(${GAME_ASSETS.closeButton})`;
        } else {
            closeSmithyButton.style.backgroundImage = `url(${GAME_ASSETS.backButton})`;
            if (view === 'forge') forgeView.classList.remove('hidden');
            if (view === 'armor') armorView.classList.remove('hidden');
            if (view === 'sharpenSelect') sharpenSelectView.classList.remove('hidden');
            if (view === 'sharpen') sharpenView.classList.remove('hidden');
            if (view === 'dismantle') dismantleView.classList.remove('hidden');
            if (view === 'transmute') transmuteView.classList.remove('hidden');
        }
    }

    function renderCraftList(container, db, type) {
        container.innerHTML = "";
        const craftableItems = db.filter(i => i.tier > 0);
        craftableItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'forge-item';

            const imgUrl = getItemIconUrl(item.icon);

            const statLabel = type === 'weapon' ? 'Base DMG' : 'Base DEF';
            const statValue = type === 'weapon' ? item.damage : item.defense;
            const dustCost = item.dustCost !== undefined ? item.dustCost : getForgeCost(item.tier);
            const mainMatCount = item.matCost !== undefined ? item.matCost : 50;
            const haveDust = window.gameState.dust >= dustCost;
            let canCraft = haveDust;
            let ingredientsHTML = `<span class="recipe-item ${haveDust ? '' : 'missing'}"><img src="${GAME_ASSETS.iconCrystalDust}" class="icon-small" alt="Dust"> ${window.formatNumberGlobal(dustCost)}</span>`;

            if (item.matReq) {
                const qty = (HERO_STATE.inventory[item.matReq] || 0);
                if (qty < mainMatCount) canCraft = false;
                const matImg = getMatIconUrl(item.matReq);
                ingredientsHTML += `<span class="recipe-item ${qty >= mainMatCount ? '' : 'missing'}"><img src="${matImg}" class="icon-small" style="width:18px; height:18px; object-fit:contain;"> ${mainMatCount}</span>`;
            }
            if (item.extraMats) {
                item.extraMats.forEach(mat => {
                    const qty = (HERO_STATE.inventory[mat.id] || 0);
                    if (qty < mat.count) canCraft = false;
                    const displayCount = mat.count >= 1000 ? (mat.count / 1000) + 'K' : mat.count;
                    const matImg = getMatIconUrl(mat.id);
                    ingredientsHTML += `<span class="recipe-item ${qty >= mat.count ? '' : 'missing'}"><img src="${matImg}" class="icon-small" style="width:18px; height:18px; object-fit:contain;"> ${displayCount}</span>`;
                });
            }

            itemDiv.innerHTML = `
                <div class="forge-header-row">
                    <div class="forge-icon-box" style="background-image: url('${imgUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; border: 2px solid #444;"></div>
                    <div class="forge-details"><span class="forge-name">${item.name}</span><span class="forge-stats">${statLabel}: ${statValue}</span></div>
                    <button class="forge-btn" ${canCraft ? '' : 'disabled'}>CRAFT</button>
                </div>
                <div class="recipe-row">${ingredientsHTML}</div>
            `;
            itemDiv.querySelector('.forge-btn').addEventListener('click', () => {
                if (!canCraft) return;
                pendingCraftData = { item, dustCost, mainMatCount, type };
                pendingDismantleUid = null;
                if (confirmText) confirmText.innerText = `Craft ${item.name}?`;
                if (confirmModal) confirmModal.classList.remove('hidden');
            });
            container.appendChild(itemDiv);
        });
    }

    function executeCraft(item, dustCost, mainMatCount) {
        if (window.gameState.dust < dustCost) return;
        window.gameState.dust -= dustCost;
        if (item.matReq) HERO_STATE.inventory[item.matReq] -= mainMatCount;
        if (item.extraMats) item.extraMats.forEach(mat => HERO_STATE.inventory[mat.id] -= mat.count);
        incrementStat('totalCrafts', 1);
        HERO_STATE.gearInventory.push({ uid: generateUID(), id: item.id, level: 0 });
        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        if (currentView === 'forge') renderCraftList(forgeList, WEAPON_DB, 'weapon');
        if (currentView === 'armor') renderCraftList(armorList, ARMOR_DB, 'armor');
        if (window.refreshGameUI) window.refreshGameUI();
        showCraftFeedback(item);
    }

    function renderTransmuteList() {
        if (!transmuteList) return;
        transmuteList.innerHTML = "";
        const dailyState = getTransmuteState();

        TRANSMUTE_RECIPES.forEach(recipe => {
            const fromItem = MATERIAL_TIERS.find(m => m.id === recipe.from);
            const toItem = MATERIAL_TIERS.find(m => m.id === recipe.to);
            if (!fromItem || !toItem) return;

            const fromImg = getItemIconUrl(fromItem.icon);
            const toImg = getItemIconUrl(toItem.icon);

            const myQty = HERO_STATE.inventory[recipe.from] || 0;
            const currentUses = dailyState.counts[recipe.from] || 0;
            const remaining = MAX_DAILY_TRANSMUTES - currentUses;

            const canAfford = myQty >= 1 && window.gameState.dust >= recipe.cost;
            const isLimitReached = remaining <= 0;
            const btnDisabled = !canAfford || isLimitReached;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'forge-item';

            let limitText = isLimitReached
                ? `<span style="color:#e74c3c">Max Daily Limit</span>`
                : `<span style="color:#aaa">Daily: ${remaining} left</span>`;

            itemDiv.innerHTML = `
                <div class="forge-details" style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; width:100%;">
                    <div style="display:flex; flex-direction:column; justify-content:center; gap:2px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom: 2px;">
                            <div class="bag-item-icon" style="background-image: url('${fromImg}'); background-size: contain; background-repeat: no-repeat; background-position: center; border: none; width: 30px; height: 30px;"></div>
                            <span style="font-size:12px; color:#aaa;">➜</span>
                            <div class="bag-item-icon" style="background-image: url('${toImg}'); background-size: contain; background-repeat: no-repeat; background-position: center; border: none; width: 30px; height: 30px;"></div>
                        </div>
                        <span class="forge-name" style="font-size:13px; margin:0;">${fromItem.name} ➜ ${toItem.name}</span>
                        <div style="font-size:10px;">
                            <span style="color:${myQty > 0 ? '#aaa' : '#e74c3c'}">Have: ${window.formatNumberGlobal(myQty)}</span>
                            <span style="color:#555; margin: 0 4px;">|</span>
                            ${limitText}
                        </div>
                    </div>
                    <button class="forge-btn" style="min-width:80px; height:36px; font-size:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 0; margin-left: auto;" ${btnDisabled ? 'disabled' : ''}>
                        <span>CONVERT</span>
                        <div style="display:flex; align-items:center; gap:3px; margin-top:1px;">
                            <img src="${GAME_ASSETS.iconCrystalDust}" style="width:9px; height:9px;">
                            <span style="color:${window.gameState.dust < recipe.cost ? '#e74c3c' : '#87CEEB'}; font-size:9px;">${window.formatNumberGlobal(recipe.cost)}</span>
                        </div>
                    </button>
                </div>
            `;

            itemDiv.querySelector('button').onclick = () => {
                const liveState = getTransmuteState();
                const liveUses = liveState.counts[recipe.from] || 0;

                if (HERO_STATE.inventory[recipe.from] >= 1 && window.gameState.dust >= recipe.cost && liveUses < MAX_DAILY_TRANSMUTES) {
                    window.gameState.dust -= recipe.cost;
                    HERO_STATE.inventory[recipe.from]--;

                    const roll = Math.random();
                    const amount = roll < 0.65 ? 1 : 2;

                    if (!HERO_STATE.inventory[recipe.to]) HERO_STATE.inventory[recipe.to] = 0;
                    HERO_STATE.inventory[recipe.to] += amount;

                    if (!liveState.counts[recipe.from]) liveState.counts[recipe.from] = 0;
                    liveState.counts[recipe.from]++;

                    if (window.saveGameGlobal) window.saveGameGlobal();
                    renderTransmuteList();
                    if (window.refreshGameUI) window.refreshGameUI();

                    if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                }
            };

            transmuteList.appendChild(itemDiv);
        });
    }

    function renderDismantleList() {
        dismantleList.innerHTML = "";
        const salvageableItems = HERO_STATE.gearInventory.filter(instance => {
            const isEquipped = (instance.uid === HERO_STATE.equipment.mainHand || instance.uid === HERO_STATE.equipment.body);
            return !isEquipped;
        });
        if (salvageableItems.length === 0) {
            dismantleList.innerHTML = "<div style='color:#777; margin-top:20px; text-align:center;'>No salvageable items found.<br>Unequip items first.</div>";
            return;
        }
        salvageableItems.sort((a, b) => a.level - b.level);
        salvageableItems.forEach(instance => {
            const dbItem = WEAPON_DB.find(w => w.id === instance.id) || ARMOR_DB.find(a => a.id === instance.id);
            if (!dbItem) return;

            const imgUrl = getItemIconUrl(dbItem.icon);

            const refund = getSalvageValue(dbItem, instance.level);
            let matsHTML = '';
            refund.materials.forEach(mat => {
                const displayCount = mat.count >= 1000 ? (mat.count / 1000) + 'K' : mat.count;
                const matImg = getMatIconUrl(mat.id);
                matsHTML += `<span class="recipe-item" style="color:#ffd700;"><img src="${matImg}" class="icon-small" style="width:18px; height:18px; object-fit:contain;"> +${displayCount}</span>`;
            });
            const itemDiv = document.createElement('div');
            itemDiv.className = 'forge-item';
            const levelText = instance.level > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${instance.level})</span>` : '';
            itemDiv.innerHTML = `
            <div class="forge-header-row">
                <div class="forge-icon-box" style="background-image: url('${imgUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
                <div class="forge-details" style="text-align:left;"><span class="forge-name">${dbItem.name} ${levelText}</span></div>
                <button class="forge-btn" style="background:#c0392b; border-color:#e74c3c; border-bottom-color:#922b21;">SCRAP</button>
            </div>
            <div class="recipe-row" style="margin-top:8px; padding-top:8px; border-top:1px solid #444;"><span style="font-size:10px; color:#aaa; margin-right:5px;">GET:</span><span class="recipe-item" style="color:#87CEEB;"><img src="${GAME_ASSETS.iconCrystalDust}" class="icon-small" alt="Dust"> +${window.formatNumberGlobal(refund.dust)}</span>${matsHTML}</div>`;
            itemDiv.querySelector('button').addEventListener('click', () => {
                pendingDismantleUid = instance.uid;
                pendingCraftData = null;
                if (confirmText) {
                    let matListText = refund.materials.map(m => `+${window.formatNumberGlobal(m.count)} ${m.id.replace('_', ' ')}`).join('<br>');
                    confirmText.innerHTML = `Salvage <b>${dbItem.name}</b>?<br><br><span style="color:#00ffff">+${window.formatNumberGlobal(refund.dust)} Dust</span><br><span style="color:#ffd700">${matListText}</span>`;
                }
                if (confirmModal) confirmModal.classList.remove('hidden');
            });
            dismantleList.appendChild(itemDiv);
        });
    }

    function executeDismantle(uid) {
        const index = HERO_STATE.gearInventory.findIndex(i => i.uid === uid);
        if (index === -1) return;
        const instance = HERO_STATE.gearInventory[index];
        const dbItem = WEAPON_DB.find(w => w.id === instance.id) || ARMOR_DB.find(a => a.id === instance.id);
        const refund = getSalvageValue(dbItem, instance.level);
        window.gameState.dust += refund.dust;
        refund.materials.forEach(mat => {
            if (!HERO_STATE.inventory[mat.id]) HERO_STATE.inventory[mat.id] = 0;
            HERO_STATE.inventory[mat.id] += mat.count;
        });
        HERO_STATE.gearInventory.splice(index, 1);
        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        renderDismantleList();
        if (window.refreshGameUI) window.refreshGameUI();
    }

    function renderSharpenSelection() {
        sharpenList.innerHTML = "";
        const upgradeableItems = HERO_STATE.gearInventory.map(instance => {
            const dbItem = WEAPON_DB.find(w => w.id === instance.id) || ARMOR_DB.find(a => a.id === instance.id);
            return { instance, dbItem };
        }).filter(obj => obj.dbItem && obj.dbItem.tier > 0);
        upgradeableItems.sort((a, b) => b.instance.level - a.instance.level);
        if (upgradeableItems.length === 0) {
            sharpenList.innerHTML = "<div style='color:#777; margin-top:20px; text-align:center;'>No items to upgrade.</div>";
            return;
        }
        upgradeableItems.forEach(({ instance, dbItem }) => {
            const itemDiv = document.createElement('div');
            const isEquipped = (instance.uid === HERO_STATE.equipment.mainHand || instance.uid === HERO_STATE.equipment.body);
            itemDiv.className = `forge-item ${isEquipped ? 'equipped' : ''}`;
            const levelText = instance.level > 0 ? `<span style="color:#2ecc71;">(+${instance.level})</span>` : '';

            const imgUrl = getItemIconUrl(dbItem.icon);

            itemDiv.innerHTML = `
                <div class="forge-icon-box" style="margin: 0 auto 10px auto; background-image: url('${imgUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; border: 2px solid #444;">
                </div>
                <div class="forge-details" style="text-align:center;">
                    <span class="forge-name" style="font-size:14px;">${dbItem.name} ${levelText}</span>
                </div>
                <button class="forge-btn" style="background:#e67e22; border-color:#d35400; border-bottom-color:#a04000; width:100%;">SELECT</button>
            `;

            itemDiv.querySelector('button').addEventListener('click', () => {
                selectedInstanceForUpgrade = instance;
                switchView('sharpen');
                updateSharpenUI(instance, dbItem);
            });
            sharpenList.appendChild(itemDiv);
        });
    }

    function updateSharpenUI(instance, dbItem) {
        if (!instance || !dbItem) return;
        const level = instance.level;
        const isWeapon = WEAPON_DB.some(w => w.id === dbItem.id);
        sharpenName.innerHTML = `${dbItem.name} <span style="color:#2ecc71">+${level}</span>`;
        sharpenStatCurrent.innerText = `+${level}`;
        sharpenStatNext.innerText = `+${level + 1}`;

        const imgUrl = getItemIconUrl(dbItem.icon);
        sharpenItemIcon.style.backgroundImage = `url('${imgUrl}')`;
        sharpenItemIcon.style.backgroundSize = "contain";
        sharpenItemIcon.style.backgroundRepeat = "no-repeat";
        sharpenItemIcon.style.backgroundPosition = "center";

        // FIX: Force margin to 0 to align center, and ensure class uses existing CSS for size
        sharpenItemIcon.className = 'forge-icon-box';
        sharpenItemIcon.style.margin = '0';

        let currentStat = isWeapon ? getWeaponDamage(dbItem.damage, level) : getArmorDefense(dbItem.defense, level);
        let nextStat = isWeapon ? getWeaponDamage(dbItem.damage, level + 1) : getArmorDefense(dbItem.defense, level + 1);
        sharpenChance.innerHTML = `${isWeapon ? "DAMAGE" : "DEFENSE"}: <span style="color:#fff">${currentStat}</span> ➜ <span style="color:#2ecc71">${nextStat}</span>`;
        let chance = 100;
        if (level === 4) chance = 80;
        if (level === 5) chance = 70;
        if (level === 6) chance = 50;
        if (level === 7) chance = 20;
        if (level === 8) chance = 5;
        if (level === 9) chance = 1;
        const baseForgeCost = getForgeCost(dbItem.tier);
        const dust = Math.floor(baseForgeCost * (1 + (level * 0.2)));
        let mats = level >= 9 ? 10 : level >= 6 ? 6 : level >= 3 ? 4 : 2;
        sharpenCostDust.innerText = window.formatNumberGlobal(dust);
        sharpenCostMat.innerText = mats;

        if (dbItem.matReq) {
            const matImg = getMatIconUrl(dbItem.matReq);
            sharpenMatIcon.style.backgroundImage = `url('${matImg}')`;
            sharpenMatIcon.style.backgroundSize = "contain";
            sharpenMatIcon.style.backgroundRepeat = "no-repeat";
            sharpenMatIcon.style.backgroundPosition = "center";
            sharpenMatIcon.className = "bag-item-icon icon-small-circle";
        }

        const canAfford = window.gameState.dust >= dust && (HERO_STATE.inventory[dbItem.matReq] || 0) >= mats;
        doSharpenBtn.disabled = level >= 10 || !canAfford;
        doSharpenBtn.innerText = level >= 10 ? "MAX LEVEL" : (!canAfford ? "NOT ENOUGH" : `SHARPEN (${chance}%)`);

        doSharpenBtn.onclick = null; // Clear just to be safe

        if (!doSharpenBtn.disabled) {
            doSharpenBtn.onclick = () => performSharpen(chance, dust, mats, dbItem.matReq, instance);
        }
    }

    function performSharpen(chance, dustCost, matCost, matId, instance) {
        if (instance.level >= 10) return;

        // Deduct resources
        window.gameState.dust -= dustCost;
        HERO_STATE.inventory[matId] -= matCost;

        // Lock Button
        const btn = document.getElementById('do-sharpen-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "FORGING...";
        }
        if (sharpenMsg) sharpenMsg.innerText = "";

        // Determine Success
        const roll = Math.random() * 100;
        const success = roll < chance;

        if (window.saveGameGlobal) window.saveGameGlobal();

        // Animation
        const container = document.querySelector('.sharpen-icon-frame');
        const hammer = document.createElement('div');
        hammer.className = 'smithy-hammer';
        hammer.innerText = '🔨';
        container.appendChild(hammer);

        requestAnimationFrame(() => hammer.classList.add('striking'));

        // Impact Effect (420ms)
        setTimeout(() => {
            spawnSmithySparks(container);
            container.classList.add('shake-vertical');
            if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
            setTimeout(() => container.classList.remove('shake-vertical'), 200);
        }, 420);

        // Result (700ms)
        setTimeout(() => {
            hammer.remove();
            const dbItem = WEAPON_DB.find(w => w.id === instance.id) || ARMOR_DB.find(a => a.id === instance.id);

            if (success) {
                instance.level++;
                recalculateHeroStats();
                sharpenMsg.innerText = "SUCCESS!";
                sharpenMsg.className = "sharpen-msg msg-success";
                if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                showCraftFeedback(dbItem, instance.level);

            } else {
                sharpenMsg.innerText = "FAILED...";
                sharpenMsg.className = "sharpen-msg msg-fail";
                if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }

            if (window.saveGameGlobal) window.saveGameGlobal();
            if (window.refreshGameUI) window.refreshGameUI();
            updateSharpenUI(instance, dbItem);
            setTimeout(() => sharpenMsg.innerText = "", 2000);
        }, 700);
    }

    // --- CRAFTING & UPGRADE FEEDBACK VISUALS (Epic Version) ---
    function showCraftFeedback(item, level = null) {
        // 1. Inject Styles (Updated with 'Tap to Continue' styling)
        if (!document.getElementById('craft-feedback-style')) {
            const style = document.createElement('style');
            style.id = 'craft-feedback-style';
            style.innerHTML = `
            .craft-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                background-color: rgba(0, 0, 0, 0.85);
                z-index: 2000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.5s ease-out;
                backdrop-filter: blur(4px);
                cursor: pointer; /* Show pointer to indicate clickable */
            }
            .craft-overlay.show {
                opacity: 1;
            }
            .craft-overlay.fade-out {
                opacity: 0;
            }
            
            .craft-sunburst {
                position: absolute;
                top: 50%; left: 50%;
                width: 500px; height: 500px;
                background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
                transform: translate(-50%, -50%);
                z-index: -1;
                animation: sunburst-spin 10s linear infinite;
                pointer-events: none;
            }
            
            .craft-img-glow {
                width: 120px; height: 120px;
                background-size: contain; background-repeat: no-repeat; background-position: center;
                filter: drop-shadow(0 0 20px #ffd700);
                margin-bottom: 20px;
                transform: scale(0.5);
                transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .craft-overlay.show .craft-img-glow {
                transform: scale(1.2);
            }

            .craft-text-success {
                font-family: 'Lilita One', cursive;
                font-size: 42px;
                color: #2ecc71;
                text-shadow: 0 0 10px #00ff00, 2px 2px 0 #000;
                letter-spacing: 2px;
                margin-bottom: 5px;
                transform: translateY(20px);
                transition: transform 0.5s ease-out;
            }
            .craft-overlay.show .craft-text-success {
                transform: translateY(0);
            }

            .craft-text-name {
                font-family: 'Graduate', serif;
                font-size: 20px;
                color: #fff;
                text-shadow: 1px 1px 2px #000;
                background: rgba(255, 255, 255, 0.1);
                padding: 5px 15px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .craft-tap-hint {
                position: absolute;
                bottom: 10%;
                font-family: 'Nunito', sans-serif;
                font-size: 12px;
                color: #888;
                animation: pulse-text 2s infinite;
                pointer-events: none;
            }

            @keyframes sunburst-spin {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            @keyframes pulse-text {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
        `;
            document.head.appendChild(style);
        }

        // 2. Create Elements
        const overlay = document.createElement('div');
        overlay.className = 'craft-overlay';

        const sunburst = document.createElement('div');
        sunburst.className = 'craft-sunburst';

        const img = document.createElement('div');
        img.className = 'craft-img-glow';
        img.style.backgroundImage = `url('${getItemIconUrl(item.icon)}')`;

        const successText = document.createElement('div');
        successText.className = 'craft-text-success';
        successText.innerText = "SUCCESS!";

        const nameText = document.createElement('div');
        nameText.className = 'craft-text-name';

        if (level !== null && level !== undefined) {
            nameText.innerHTML = `${item.name} <span style="color:#2ecc71">+${level}</span>`;
        } else {
            nameText.innerText = item.name;
        }

        const hintText = document.createElement('div');
        hintText.className = 'craft-tap-hint';
        hintText.innerText = "- Tap anywhere to continue -";

        overlay.appendChild(sunburst);
        overlay.appendChild(img);
        overlay.appendChild(successText);
        overlay.appendChild(nameText);
        overlay.appendChild(hintText);
        document.body.appendChild(overlay);

        // 3. Reveal Animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });
        });

        // 4. Click to Dismiss Logic
        const dismiss = () => {
            // Prevent double-clicking causing errors
            if (overlay.classList.contains('fade-out')) return;

            overlay.classList.remove('show');
            overlay.classList.add('fade-out');

            // Wait for CSS transition (0.5s) then remove
            setTimeout(() => {
                overlay.remove();
            }, 500);
        };

        // Add listeners to the entire overlay
        overlay.addEventListener('click', dismiss);
        overlay.addEventListener('touchstart', dismiss, { passive: true });
    }

    craftButton.addEventListener('click', () => { window.openModalGlobal('smithy-modal'); switchView('hub'); });
    closeSmithyButton.addEventListener('click', () => {
        if (currentView === 'hub') {
            smithyModal.classList.add('closing');
            setTimeout(() => { smithyModal.classList.add('hidden'); smithyModal.classList.remove('closing'); }, 300);
        } else if (currentView === 'sharpen') {
            switchView('sharpenSelect');
        } else {
            switchView('hub');
        }
    });
    if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', () => {
            if (pendingCraftData) executeCraft(pendingCraftData.item, pendingCraftData.dustCost, pendingCraftData.mainMatCount);
            else if (pendingDismantleUid) executeDismantle(pendingDismantleUid);
            confirmModal.classList.add('hidden');
        });
        confirmNoBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
    }
    openForgeBtn.addEventListener('click', () => { renderCraftList(forgeList, WEAPON_DB, 'weapon'); switchView('forge'); });
    openArmorBtn.addEventListener('click', () => { renderCraftList(armorList, ARMOR_DB, 'armor'); switchView('armor'); });
    openSharpenBtn.addEventListener('click', () => { renderSharpenSelection(); switchView('sharpenSelect'); });
    if (openDismantleBtn) openDismantleBtn.addEventListener('click', () => { renderDismantleList(); switchView('dismantle'); });
    if (openTransmuteBtn) openTransmuteBtn.addEventListener('click', () => { renderTransmuteList(); switchView('transmute'); });
});