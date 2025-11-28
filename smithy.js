// smithy.js - v1.3.0
// Handles Crafting and Item-Based Sharpening

import { HERO_STATE } from './hero.js';
import { GAME_ASSETS } from './assets.js';
import { WEAPON_DB, ARMOR_DB, MATERIAL_TIERS } from './items.js';

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
        return Math.floor(baseDmg * (1 + (level * 0.1)));
    }

    function getArmorDefense(baseDef, level) {
        return Math.floor(baseDef * (1 + (level * 0.1)));
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
        const isTooFar = item.tier > highestTierOwned + 1;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'forge-item';

        if (isTooFar) {
            itemDiv.classList.add('blackout');
        } else {
            const iconClass = type === 'weapon' ? 'weapon-icon' : 'armor-icon';
            const statLabel = type === 'weapon' ? 'Base DMG' : 'Base DEF';
            const statValue = type === 'weapon' ? item.damage : item.defense;

            let actionBtn = "";
            if (isOwned) {
                actionBtn = `<button class="forge-btn" disabled>OWNED</button>`;
            } else {
                // Cost Logic
                const dustCost = item.tier * 1000;
                const matReq = MATERIAL_TIERS.find(m => m.id === item.matReq);
                const matCount = matReq ? 5 : 0;
                const haveDust = window.gameState.dust >= dustCost;
                const haveMats = (HERO_STATE.inventory[item.matReq] || 0) >= matCount;
                const canCraft = haveDust && haveMats;
                const formattedDust = window.formatNumberGlobal ? window.formatNumberGlobal(dustCost) : dustCost;

                let matClass = 'mat-iron';
                if (matReq) {
                    if (matReq.name.toLowerCase().includes('wood')) matClass = 'mat-wood';
                    if (matReq.name.toLowerCase().includes('copper')) matClass = 'mat-copper';
                }

                actionBtn = `<button class="forge-btn" ${canCraft ? '' : 'disabled'}>CRAFT</button>`;
            }

            // Render
            if (!isOwned) {
                // Re-calc costs for display
                const dustCost = item.tier * 1000;
                const formattedDust = window.formatNumberGlobal ? window.formatNumberGlobal(dustCost) : dustCost;
                const matReq = MATERIAL_TIERS.find(m => m.id === item.matReq);
                const matCount = matReq ? 5 : 0;
                const haveDust = window.gameState.dust >= dustCost;
                const haveMats = (HERO_STATE.inventory[item.matReq] || 0) >= matCount;
                let matClass = 'mat-iron';
                if (matReq) {
                    if (matReq.name.toLowerCase().includes('wood')) matClass = 'mat-wood';
                    if (matReq.name.toLowerCase().includes('copper')) matClass = 'mat-copper';
                }

                itemDiv.innerHTML = `
                    <div class="forge-icon-box"><div class="${iconClass}"></div></div>
                    <div class="forge-details">
                        <span class="forge-name">${item.name}</span>
                        <span class="forge-stats">${statLabel}: ${statValue}</span>
                        <div class="recipe-row">
                            <span class="recipe-item ${haveDust ? '' : 'missing'}">
                                <img src="${GAME_ASSETS.iconCrystalDust}" class="icon-small" alt="Dust">
                                ${formattedDust}
                            </span>
                            <span class="recipe-item ${haveMats ? '' : 'missing'}">
                                <div class="bag-item-icon ${matClass} icon-small-circle"></div> 
                                ${matCount}
                            </span>
                        </div>
                    </div>
                    ${actionBtn}
                `;

                const btn = itemDiv.querySelector('.forge-btn');
                if (btn && !btn.disabled) {
                    btn.addEventListener('click', () => {
                        if (type === 'weapon') craftItem(item, dustCost, matCount, 'weapon');
                        else craftItem(item, dustCost, matCount, 'armor');
                    });
                }
            } else {
                itemDiv.innerHTML = `
                    <div class="forge-icon-box"><div class="${iconClass}"></div></div>
                    <div class="forge-details">
                        <span class="forge-name">${item.name}</span>
                        <span class="forge-stats" style="color:#2ecc71">In Inventory</span>
                    </div>
                    ${actionBtn}
                `;
            }
        }
        container.appendChild(itemDiv);
    }

    function craftItem(item, dustCost, matCount, type) {
        window.gameState.dust -= dustCost;
        HERO_STATE.inventory[item.matReq] -= matCount;
        HERO_STATE.ownedItems.push(item.id);

        // Initial Stats
        if (!HERO_STATE.itemLevels) HERO_STATE.itemLevels = {};
        HERO_STATE.itemLevels[item.id] = 0;

        // Auto Equip Logic
        if (type === 'weapon') {
            HERO_STATE.equipment.mainHand = item.id;
            HERO_STATE.baseAttack = item.damage;
            renderForgeList();
        } else {
            HERO_STATE.equipment.body = item.id;
            HERO_STATE.defense = item.defense;
            renderArmorList();
        }

        if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        if (window.refreshGameUI) window.refreshGameUI();
    }

    // --- SHARPEN SELECTION LOGIC ---

    function renderSharpenSelection() {
        sharpenList.innerHTML = "";
        const ownedIds = HERO_STATE.ownedItems;

        // Combine DBs to find owned items
        const allItems = [...WEAPON_DB, ...ARMOR_DB];
        const myItems = allItems.filter(i => ownedIds.includes(i.id) && i.tier > 0);

        myItems.forEach(item => {
            // Determine Type
            const isWeapon = WEAPON_DB.some(w => w.id === item.id);
            const type = isWeapon ? 'weapon' : 'armor';

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
                updateSharpenUI();
            });

            sharpenList.appendChild(itemDiv);
        });
    }

    // --- SHARPEN ACTION LOGIC ---

    function updateSharpenUI() {
        if (!selectedItemForUpgrade) return;
        const item = selectedItemForUpgrade;
        const level = getItemLevel(item.id);
        const isWeapon = WEAPON_DB.some(w => w.id === item.id);

        // Header
        sharpenName.innerHTML = `${item.name}`;
        sharpenStatCurrent.innerText = `+${level}`;
        sharpenStatNext.innerText = `+${level + 1}`;

        // Update Icon Class
        sharpenItemIcon.className = isWeapon ? 'weapon-icon' : 'armor-icon';

        // Stats & Info
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

        // Costs Curve
        let chance = 100;
        if (level >= 4) chance = 85;
        if (level >= 5) chance = 70;
        if (level >= 6) chance = 55;
        if (level >= 7) chance = 40;
        if (level >= 8) chance = 10;
        if (level >= 9) chance = 2;

        const dust = Math.floor(100 * Math.pow(1.5, level));
        const mats = Math.floor(1 + (level / 2));

        sharpenCostDust.innerText = dust;
        sharpenCostMat.innerText = mats;

        // Mat Icon
        let matClass = 'mat-iron';
        if (item.matReq) {
            if (item.matReq.toLowerCase().includes('wood')) matClass = 'mat-wood';
            if (item.matReq.toLowerCase().includes('copper')) matClass = 'mat-copper';
        }
        sharpenMatIcon.className = `bag-item-icon ${matClass} icon-small-circle`;

        // Buttons
        const haveDust = window.gameState.dust >= dust;
        const haveMats = (HERO_STATE.inventory[item.matReq] || 0) >= mats;

        doSharpenBtn.disabled = false;
        if (level >= 10) {
            doSharpenBtn.disabled = true;
            doSharpenBtn.innerText = "MAX LEVEL";
        } else if (!haveDust || !haveMats) {
            doSharpenBtn.disabled = true;
            doSharpenBtn.innerText = "NOT ENOUGH";
        } else {
            doSharpenBtn.innerText = `SHARPEN (${chance}%)`;
            doSharpenBtn.onclick = () => performSharpen(chance, dust, mats, item.matReq, item.id, isWeapon);
        }
    }

    function performSharpen(chance, dustCost, matCost, matId, itemId, isWeapon) {
        window.gameState.dust -= dustCost;
        HERO_STATE.inventory[matId] -= matCost;

        const roll = Math.random() * 100;
        const success = roll < chance;

        if (success) {
            // Success: Increment Level
            HERO_STATE.itemLevels[itemId] = (HERO_STATE.itemLevels[itemId] || 0) + 1;

            // Recalculate Hero Stats (if equipped)
            const equippedId = isWeapon ? HERO_STATE.equipment.mainHand : HERO_STATE.equipment.body;
            if (itemId === equippedId) {
                const newLevel = HERO_STATE.itemLevels[itemId];
                if (isWeapon) {
                    const base = selectedItemForUpgrade.damage;
                    HERO_STATE.baseAttack = getWeaponDamage(base, newLevel);
                } else {
                    const base = selectedItemForUpgrade.defense;
                    HERO_STATE.defense = getArmorDefense(base, newLevel);
                }
            }

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