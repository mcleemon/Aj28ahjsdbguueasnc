// smithy.js - v1.7.0
// Fixes "renderSharpenSelection is not defined"
// Implements Vertical Economy (Composite Recipes + High Cost Upgrades)

import { HERO_STATE, recalculateHeroStats } from './hero.js';
import { GAME_ASSETS } from './assets.js';
import { WEAPON_DB, ARMOR_DB, MATERIAL_TIERS } from './items.js';

// --- COST CONFIGURATION (Crypto Economy) ---
const TIER_COSTS = {
    1: 250,          // Wood
    2: 50000,        // Copper
    3: 150000,       // Iron
    4: 300000,       // Steel
    5: 500000,       // Silver
    6: 750000,       // Gold
    7: 1200000,      // Obsidian
    8: 2000000,      // Platinum
    9: 3500000,      // Mithril
    10: 5000000,     // Orichalcum
    11: 10000000,    // Adamantite
    12: 20000000,    // Rune
    13: 35000000,    // Dragon
    14: 75000000,    // Void
    15: 150000000    // Celestial
};

function getForgeCost(tier) {
    if (tier === 0) return 0;
    return TIER_COSTS[tier] || (tier * 10000000);
}

document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const craftButton = document.getElementById('craft-button');
    const smithyModal = document.getElementById('smithy-modal');
    const closeSmithyButton = document.getElementById('close-smithy-button');

    // Views
    const hubView = document.getElementById('smithy-hub');
    const forgeView = document.getElementById('smithy-forge');
    const armorView = document.getElementById('smithy-forge-armor');
    const sharpenSelectView = document.getElementById('smithy-sharpen-select');
    const sharpenView = document.getElementById('smithy-sharpen');

    // Buttons & Lists
    const openForgeBtn = document.getElementById('open-forge-btn');
    const openArmorBtn = document.getElementById('open-armor-btn');
    const openSharpenBtn = document.getElementById('open-sharpen-btn');

    const forgeList = document.getElementById('forge-list');
    const armorList = document.getElementById('armor-list');
    const sharpenList = document.getElementById('sharpen-list');

    // Sharpen UI Elements
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

    let selectedItemForUpgrade = null;

    // --- STATE HELPERS ---

    function getItemLevel(itemId) {
        if (!HERO_STATE.itemLevels) HERO_STATE.itemLevels = {};
        return HERO_STATE.itemLevels[itemId] || 0;
    }

    function getWeaponDamage(baseDmg, level) {
        // Upgrade Scaling: 50% per level
        return Math.floor(baseDmg * (1 + (level * 0.5)));
    }

    function getArmorDefense(baseDef, level) {
        // Upgrade Scaling: 50% per level
        return Math.floor(baseDef * (1 + (level * 0.5)));
    }

    function getMatClass(matId) {
        if (matId.includes('wood')) return 'mat-wood';
        if (matId.includes('copper')) return 'mat-copper';
        if (matId.includes('silver')) return 'mat-silver';
        if (matId.includes('gold')) return 'mat-gold';
        if (matId.includes('obsidian')) return 'mat-obsidian';
        if (matId.includes('dragon') || matId.includes('void') || matId.includes('celestial')) return 'mat-mythic';
        return 'mat-iron';
    }

    // --- RENDER FUNCTIONS ---

    function renderForgeList() {
        forgeList.innerHTML = "";
        const ownedIds = HERO_STATE.ownedItems;
        const highestTierOwned = WEAPON_DB.reduce((max, item) => {
            return ownedIds.includes(item.id) ? Math.max(max, item.tier) : max;
        }, 0);

        WEAPON_DB.filter(i => i.tier > 0).forEach(item => {
            renderCraftCard(item, highestTierOwned, forgeList, 'weapon');
        });
    }

    function renderArmorList() {
        armorList.innerHTML = "";
        const ownedIds = HERO_STATE.ownedItems;
        const highestTierOwned = ARMOR_DB.reduce((max, item) => {
            return ownedIds.includes(item.id) ? Math.max(max, item.tier) : max;
        }, 0);

        ARMOR_DB.filter(i => i.tier > 0).forEach(item => {
            renderCraftCard(item, highestTierOwned, armorList, 'armor');
        });
    }

    function renderCraftCard(item, highestTierOwned, container, type) {
        const ownedIds = HERO_STATE.ownedItems;
        const isOwned = ownedIds.includes(item.id);

        // --- REMOVED "isTooFar" LOGIC ---
        // We now render the full card for every item, regardless of tier gap.

        const itemDiv = document.createElement('div');
        itemDiv.className = 'forge-item';

        const iconClass = type === 'weapon' ? 'weapon-icon' : 'armor-icon';
        const statLabel = type === 'weapon' ? 'Base DMG' : 'Base DEF';
        const statValue = type === 'weapon' ? item.damage : item.defense;

        // --- MAIN COST ---
        const mainMatCount = 50;
        const dustCost = getForgeCost(item.tier);

        const haveDust = window.gameState.dust >= dustCost;
        const formattedDust = window.formatNumberGlobal ? window.formatNumberGlobal(dustCost) : dustCost;

        let canCraft = haveDust;
        let ingredientsHTML = "";

        // A. Dust
        ingredientsHTML += `
            <span class="recipe-item ${haveDust ? '' : 'missing'}">
                <img src="${GAME_ASSETS.iconCrystalDust}" class="icon-small" alt="Dust">
                ${formattedDust}
            </span>`;

        // B. Main Material
        if (item.matReq) {
            const qty = (HERO_STATE.inventory[item.matReq] || 0);
            const haveIt = qty >= mainMatCount;
            if (!haveIt) canCraft = false;

            let matClass = getMatClass(item.matReq);
            ingredientsHTML += `
                <span class="recipe-item ${haveIt ? '' : 'missing'}">
                    <div class="bag-item-icon ${matClass} icon-small-circle"></div> 
                    ${mainMatCount}
                </span>`;
        }

        // C. Extra Materials (Composite Recipe)
        if (item.extraMats) {
            item.extraMats.forEach(mat => {
                const qty = (HERO_STATE.inventory[mat.id] || 0);
                const haveIt = qty >= mat.count;
                if (!haveIt) canCraft = false;

                let matClass = getMatClass(mat.id);
                const displayCount = mat.count >= 1000 ? (mat.count / 1000) + 'K' : mat.count;

                ingredientsHTML += `
                    <span class="recipe-item ${haveIt ? '' : 'missing'}">
                        <div class="bag-item-icon ${matClass} icon-small-circle"></div> 
                        ${displayCount}
                    </span>`;
            });
        }

        let actionBtn = "";
        if (isOwned) {
            actionBtn = `<button class="forge-btn" disabled>OWNED</button>`;
        } else {
            actionBtn = `<button class="forge-btn" ${canCraft ? '' : 'disabled'}>CRAFT</button>`;
        }

        // Render the Full Card
        itemDiv.innerHTML = `
            <div class="forge-icon-box"><div class="${iconClass}"></div></div>
            <div class="forge-details">
                <span class="forge-name">${item.name}</span>
                <span class="forge-stats">${statLabel}: ${statValue}</span>
                <div class="recipe-row" style="flex-wrap: wrap;">
                    ${ingredientsHTML}
                </div>
            </div>
            ${actionBtn}
        `;

        // Attach Listener
        if (!isOwned) {
            const btn = itemDiv.querySelector('.forge-btn');
            if (btn && !btn.disabled) {
                btn.addEventListener('click', () => {
                    if (type === 'weapon') craftItem(item, dustCost, mainMatCount, 'weapon');
                    else craftItem(item, dustCost, mainMatCount, 'armor');
                });
            }
        } else {
            // If owned, simple layout (optional override for owned items)
            itemDiv.innerHTML = `
                <div class="forge-icon-box"><div class="${iconClass}"></div></div>
                <div class="forge-details">
                    <span class="forge-name">${item.name}</span>
                    <span class="forge-stats" style="color:#2ecc71">In Inventory</span>
                </div>
                ${actionBtn}
            `;
        }

        container.appendChild(itemDiv);
    }

    function craftItem(item, dustCost, mainMatCount, type) {
        // Deduct Dust
        window.gameState.dust -= dustCost;

        // Deduct Main Material
        if (item.matReq) {
            HERO_STATE.inventory[item.matReq] -= mainMatCount;
        }

        // Deduct Extra Materials (Composite)
        if (item.extraMats) {
            item.extraMats.forEach(mat => {
                HERO_STATE.inventory[mat.id] -= mat.count;
            });
        }

        HERO_STATE.ownedItems.push(item.id);

        if (!HERO_STATE.itemLevels) HERO_STATE.itemLevels = {};
        HERO_STATE.itemLevels[item.id] = 0;
        if (window.saveGameGlobal) window.saveGameGlobal();
        if (type === 'weapon') {
            HERO_STATE.equipment.mainHand = item.id;
            recalculateHeroStats();
            renderForgeList();
        } else {
            HERO_STATE.equipment.body = item.id;
            recalculateHeroStats();
            renderArmorList();
        }

        if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        if (window.refreshGameUI) window.refreshGameUI();
    }

    // --- SHARPEN UI ---

    function renderSharpenSelection() {
        sharpenList.innerHTML = "";
        const ownedIds = HERO_STATE.ownedItems;
        const allItems = [...WEAPON_DB, ...ARMOR_DB];
        const myItems = allItems.filter(i => ownedIds.includes(i.id) && i.tier > 0);

        myItems.forEach(item => {
            const isWeapon = WEAPON_DB.some(w => w.id === item.id);
            const itemDiv = document.createElement('div');
            itemDiv.className = 'forge-item';
            const iconClass = isWeapon ? 'weapon-icon' : 'armor-icon';
            const level = getItemLevel(item.id);

            let statDisplay = "";
            if (isWeapon) {
                const dmg = getWeaponDamage(item.damage, level);
                statDisplay = `DMG: ${dmg} <span style="color:#2ecc71">(+${level})</span>`;
            } else {
                const def = getArmorDefense(item.defense, level);
                statDisplay = `DEF: ${def} <span style="color:#2ecc71">(+${level})</span>`;
            }

            itemDiv.innerHTML = `
                <div class="forge-icon-box"><div class="${iconClass}"></div></div>
                <div class="forge-details">
                    <span class="forge-name">${item.name}</span>
                    <span class="forge-stats">${statDisplay}</span>
                </div>
                <button class="forge-btn" style="background: #e67e22; border-color:#d35400; border-bottom-color:#a04000;">SELECT</button>
            `;

            itemDiv.querySelector('button').addEventListener('click', () => {
                selectedItemForUpgrade = item;
                switchView('sharpen');
                if (window.saveGameGlobal) window.saveGameGlobal();
                updateSharpenUI();
            });

            sharpenList.appendChild(itemDiv);
        });
    }

    function updateSharpenUI() {
        if (!selectedItemForUpgrade) return;
        const item = selectedItemForUpgrade;
        const level = getItemLevel(item.id);
        const isWeapon = WEAPON_DB.some(w => w.id === item.id);

        sharpenName.innerHTML = `${item.name}`;
        sharpenStatCurrent.innerText = `+${level}`;
        sharpenStatNext.innerText = `+${level + 1}`;
        sharpenItemIcon.className = isWeapon ? 'weapon-icon' : 'armor-icon';

        let currentStat = 0;
        let nextStat = 0;
        let label = "";

        if (isWeapon) {
            currentStat = getWeaponDamage(item.damage, level);
            nextStat = getWeaponDamage(item.damage, level + 1);
            label = "DAMAGE";
        } else {
            currentStat = getArmorDefense(item.defense, level);
            nextStat = getArmorDefense(item.defense, level + 1);
            label = "DEFENSE";
        }

        sharpenChance.innerHTML = `${label}: <span style="color:#fff">${currentStat}</span> ➜ <span style="color:#2ecc71">${nextStat}</span>`;
        sharpenChance.style.fontSize = "14px";
        sharpenChance.style.color = "#aaa";

        // --- SUCCESS RATES ---
        let chance = 100;
        if (level === 4) chance = 80;
        if (level === 5) chance = 70;
        if (level === 6) chance = 50;
        if (level === 7) chance = 20;
        if (level === 8) chance = 5;
        if (level === 9) chance = 1;

        // --- UPGRADE COST ---
        const baseForgeCost = getForgeCost(item.tier);
        const dust = Math.floor(baseForgeCost * (1 + (level * 0.2)));

        // Material Cost Curve (2 -> 10)
        let mats = 2;
        if (level >= 3) mats = 4;
        if (level >= 6) mats = 6;
        if (level >= 9) mats = 10;

        sharpenCostDust.innerText = window.formatNumberGlobal ? window.formatNumberGlobal(dust) : dust;
        sharpenCostMat.innerText = mats;

        // Mat Icon Style
        let matClass = 'mat-iron';
        if (item.matReq) {
            matClass = getMatClass(item.matReq);
        }
        sharpenMatIcon.className = `bag-item-icon ${matClass} icon-small-circle`;

        const haveDust = window.gameState.dust >= dust;
        const haveMats = (HERO_STATE.inventory[item.matReq] || 0) >= mats;

        doSharpenBtn.disabled = false;

        // Clone button to remove old listeners
        doSharpenBtn.onclick = null;

        if (level >= 10) {
            doSharpenBtn.disabled = true;
            doSharpenBtn.innerText = "MAX LEVEL";
        } else if (!haveDust || !haveMats) {
            doSharpenBtn.disabled = true;
            doSharpenBtn.innerText = "NOT ENOUGH";
        } else {
            doSharpenBtn.disabled = false;
            doSharpenBtn.innerText = `SHARPEN (${chance}%)`;
            // Assign new click handler
            doSharpenBtn.onclick = () => performSharpen(chance, dust, mats, item.matReq, item.id, isWeapon);
        }
    }

    function performSharpen(chance, dustCost, matCost, matId, itemId, isWeapon) {
        window.gameState.dust -= dustCost;
        HERO_STATE.inventory[matId] -= matCost;

        const roll = Math.random() * 100;
        const success = roll < chance;

        if (success) {
            HERO_STATE.itemLevels[itemId] = (HERO_STATE.itemLevels[itemId] || 0) + 1;
            recalculateHeroStats();
            sharpenMsg.innerText = "SUCCESS!";
            sharpenMsg.className = "sharpen-msg msg-success";
            if (window.Telegram) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        } else {
            sharpenMsg.innerText = "FAILED...";
            sharpenMsg.className = "sharpen-msg msg-fail";
            if (window.Telegram) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }

        updateSharpenUI();
        if (window.refreshGameUI) window.refreshGameUI();
        setTimeout(() => sharpenMsg.innerText = "", 2000);
    }

    // --- NAVIGATION ---

    let currentView = 'hub';

    craftButton.addEventListener('click', () => {
        window.openModalGlobal('smithy-modal');
        switchView('hub');
    });

    closeSmithyButton.addEventListener('click', () => {
        if (currentView === 'hub') {
            smithyModal.classList.add('closing');
            setTimeout(() => {
                smithyModal.classList.add('hidden');
                smithyModal.classList.remove('closing');
            }, 300);
        } else {
            if (currentView === 'sharpen') {
                renderSharpenSelection();
                switchView('sharpenSelect');
            } else {
                switchView('hub');
            }
        }
    });

    openForgeBtn.addEventListener('click', () => {
        renderForgeList();
        switchView('forge');
    });

    openArmorBtn.addEventListener('click', () => {
        renderArmorList();
        switchView('armor');
    });

    openSharpenBtn.addEventListener('click', () => {
        renderSharpenSelection();
        switchView('sharpenSelect');
    });

    function switchView(view) {
        currentView = view;
        hubView.classList.add('hidden');
        forgeView.classList.add('hidden');
        armorView.classList.add('hidden');
        sharpenSelectView.classList.add('hidden');
        sharpenView.classList.add('hidden');

        if (view === 'hub') {
            hubView.classList.remove('hidden');
            closeSmithyButton.style.backgroundImage = `url(${GAME_ASSETS.closeButton})`;
        }
        else {
            closeSmithyButton.style.backgroundImage = `url(${GAME_ASSETS.backButton})`;
            if (view === 'forge') forgeView.classList.remove('hidden');
            if (view === 'armor') armorView.classList.remove('hidden');
            if (view === 'sharpenSelect') sharpenSelectView.classList.remove('hidden');
            if (view === 'sharpen') sharpenView.classList.remove('hidden');
        }
    }
});