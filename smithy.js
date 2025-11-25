// smithy.js - v1.2.0
// Handles Crafting (Weapons & Armor) and Upgrading (Sharpen)

import { HERO_STATE } from './hero.js';
import { GAME_ASSETS } from './assets.js';
// IMPORT ARMOR_DB
import { WEAPON_DB, ARMOR_DB, MATERIAL_TIERS } from './items.js';

document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const craftButton = document.getElementById('craft-button');
    const smithyModal = document.getElementById('smithy-modal');
    const closeSmithyButton = document.getElementById('close-smithy-button');

    // Views
    const hubView = document.getElementById('smithy-hub');
    const forgeView = document.getElementById('smithy-forge'); // Weapons
    const armorView = document.getElementById('smithy-forge-armor'); // Armor (New)
    const sharpenView = document.getElementById('smithy-sharpen');

    // Buttons & Lists
    const openForgeBtn = document.getElementById('open-forge-btn');
    const openArmorBtn = document.getElementById('open-armor-btn'); // New
    const openSharpenBtn = document.getElementById('open-sharpen-btn');

    const forgeList = document.getElementById('forge-list');
    const armorList = document.getElementById('armor-list'); // New

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

    // --- STATE HELPERS ---

    function getCurrentWeapon() {
        return WEAPON_DB.find(w => w.id === HERO_STATE.equipment.mainHand);
    }

    function getWeaponLevel() {
        return HERO_STATE.equipmentLevels.mainHand || 0;
    }

    function getWeaponDamage(baseDmg, level) {
        // +10% damage per plus level
        return Math.floor(baseDmg * (1 + (level * 0.1)));
    }

    // --- FORGE WEAPON LOGIC ---

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

    // --- FORGE ARMOR LOGIC (NEW) ---

    function renderArmorList() {
        armorList.innerHTML = "";
        const ownedIds = HERO_STATE.ownedItems;
        // Calculate highest tier armor owned
        const highestTierOwned = ARMOR_DB.reduce((max, item) => {
            return ownedIds.includes(item.id) ? Math.max(max, item.tier) : max;
        }, 0);

        ARMOR_DB.filter(i => i.tier > 0).forEach(item => {
            renderCraftCard(item, highestTierOwned, armorList, 'armor');
        });
    }

    // --- SHARED RENDER FUNCTION ---
    function renderCraftCard(item, highestTierOwned, container, type) {
        const ownedIds = HERO_STATE.ownedItems;
        const isOwned = ownedIds.includes(item.id);
        const isNext = item.tier === highestTierOwned + 1;
        const isTooFar = item.tier > highestTierOwned + 1;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'forge-item';

        if (isTooFar) {
            itemDiv.classList.add('blackout');
        } else {
            let actionBtn = "";

            // ICON SELECTION
            const iconClass = type === 'weapon' ? 'weapon-icon' : 'armor-icon';
            const statLabel = type === 'weapon' ? 'Base DMG' : 'Defense';
            const statValue = type === 'weapon' ? item.damage : item.defense;

            if (isOwned) {
                actionBtn = `<button class="forge-btn" disabled>OWNED</button>`;
            } else {
                const dustCost = item.tier * 1000;
                const matReq = MATERIAL_TIERS.find(m => m.id === item.matReq);
                const matCount = matReq ? 5 : 0;

                const haveDust = window.gameState.dust >= dustCost;
                const haveMats = (HERO_STATE.inventory[item.matReq] || 0) >= matCount;
                const canCraft = haveDust && haveMats;

                let matClass = 'mat-iron';
                if (matReq) {
                    if (matReq.name.toLowerCase().includes('wood')) matClass = 'mat-wood';
                    if (matReq.name.toLowerCase().includes('copper')) matClass = 'mat-copper';
                }

                actionBtn = `<button class="forge-btn" ${canCraft ? '' : 'disabled'} data-id="${item.id}">CRAFT</button>`;

                const formattedDust = window.formatNumberGlobal ? window.formatNumberGlobal(dustCost) : dustCost;

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
                        if (type === 'weapon') craftWeapon(item, dustCost, matCount);
                        else craftArmor(item, dustCost, matCount);
                    });
                }
            }

            if (isOwned) {
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

    function craftWeapon(item, dustCost, matCount) {
        window.gameState.dust -= dustCost;
        HERO_STATE.inventory[item.matReq] -= matCount;
        HERO_STATE.ownedItems.push(item.id);

        // Equip
        HERO_STATE.equipment.mainHand = item.id;
        HERO_STATE.equipmentLevels.mainHand = 0;
        HERO_STATE.baseAttack = item.damage;

        finishCrafting('weapon');
    }

    function craftArmor(item, dustCost, matCount) {
        window.gameState.dust -= dustCost;
        HERO_STATE.inventory[item.matReq] -= matCount;
        HERO_STATE.ownedItems.push(item.id);

        // Equip
        HERO_STATE.equipment.body = item.id;
        HERO_STATE.equipmentLevels.body = 0;
        HERO_STATE.defense = item.defense; // Update Defense Stat

        finishCrafting('armor');
    }

    function finishCrafting(type) {
        if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');

        if (type === 'weapon') renderForgeList();
        else renderArmorList();

        if (window.refreshGameUI) window.refreshGameUI();
    }

    // --- SHARPEN LOGIC (Only for Weapons currently) ---

    function updateSharpenUI() {
        const weapon = getCurrentWeapon();
        const level = getWeaponLevel();

        if (!weapon) return;

        sharpenName.innerHTML = `${weapon.name}`;
        sharpenStatCurrent.innerText = `+${level}`;
        sharpenStatNext.innerText = `+${level + 1}`;

        const currentDmg = getWeaponDamage(weapon.damage, level);
        const nextDmg = getWeaponDamage(weapon.damage, level + 1);

        sharpenChance.innerHTML = `DAMAGE: <span style="color:#fff">${currentDmg}</span> ➜ <span style="color:#2ecc71">${nextDmg}</span>`;
        sharpenChance.style.fontSize = "14px";
        sharpenChance.style.color = "#aaa";

        // Costs
        let chance = 100;
        let dust = 100;
        let mats = 1;

        if (level >= 4) chance = 85;
        if (level >= 5) chance = 70;
        if (level >= 6) chance = 55;
        if (level >= 7) chance = 40;
        if (level >= 8) chance = 10;
        if (level >= 9) chance = 2;

        dust = Math.floor(100 * Math.pow(1.5, level));
        mats = Math.floor(1 + (level / 2));

        sharpenCostDust.innerText = dust;
        sharpenCostMat.innerText = mats;

        let matClass = 'mat-iron';
        if (weapon.matReq) {
            if (weapon.matReq.toLowerCase().includes('wood')) matClass = 'mat-wood';
            if (weapon.matReq.toLowerCase().includes('copper')) matClass = 'mat-copper';
        }
        sharpenMatIcon.className = `bag-item-icon ${matClass} icon-small-circle`;

        const haveDust = window.gameState.dust >= dust;
        const haveMats = (HERO_STATE.inventory[weapon.matReq] || 0) >= mats;

        doSharpenBtn.disabled = false;
        if (level >= 10) {
            doSharpenBtn.disabled = true;
            doSharpenBtn.innerText = "MAX LEVEL";
        } else if (!haveDust || !haveMats) {
            doSharpenBtn.disabled = true;
            doSharpenBtn.innerText = "NOT ENOUGH";
        } else {
            doSharpenBtn.innerText = `SHARPEN (${chance}%)`;
            doSharpenBtn.onclick = () => performSharpen(chance, dust, mats, weapon.matReq);
        }
    }

    function performSharpen(chance, dustCost, matCost, matId) {
        window.gameState.dust -= dustCost;
        HERO_STATE.inventory[matId] -= matCost;

        const roll = Math.random() * 100;
        const success = roll < chance;

        if (success) {
            HERO_STATE.equipmentLevels.mainHand++;
            const weapon = getCurrentWeapon();
            const newDmg = getWeaponDamage(weapon.damage, HERO_STATE.equipmentLevels.mainHand);
            HERO_STATE.baseAttack = newDmg;

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
        smithyModal.classList.remove('hidden');
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
            switchView('hub');
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
        updateSharpenUI();
        switchView('sharpen');
    });

    function switchView(view) {
        currentView = view;

        hubView.classList.add('hidden');
        forgeView.classList.add('hidden');
        armorView.classList.add('hidden');
        sharpenView.classList.add('hidden');

        if (view === 'hub') {
            hubView.classList.remove('hidden');
            closeSmithyButton.style.backgroundImage = `url(${GAME_ASSETS.closeButton})`;
        }
        else {
            closeSmithyButton.style.backgroundImage = `url(${GAME_ASSETS.backButton})`;

            if (view === 'forge') forgeView.classList.remove('hidden');
            if (view === 'armor') armorView.classList.remove('hidden');
            if (view === 'sharpen') sharpenView.classList.remove('hidden');
        }
    }

});