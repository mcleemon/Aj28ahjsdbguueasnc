// heroMenu.js - v2.3.0
// Handles Hero Equipment (Updated to read from Item-Based Levels)

import { HERO_STATE, recalculateHeroStats } from './hero.js';
import { GAME_ASSETS } from './assets.js';
import { WEAPON_DB, ARMOR_DB } from './items.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const heroButton = document.getElementById('hero-menu-button');
    const heroModal = document.getElementById('hero-modal');
    const closeHeroButton = document.getElementById('close-hero-button');

    const menuHeroAtk = document.getElementById('menu-hero-atk');
    const menuHeroDef = document.getElementById('menu-hero-def');
    const heroDisplayImage = document.getElementById('hero-display-image');

    const weaponSlot = document.getElementById('slot-weapon');
    const armorSlot = document.getElementById('slot-armor');

    const equipModal = document.getElementById('equip-select-modal');
    const closeEquipButton = document.getElementById('close-equip-select-button');
    const equipList = document.getElementById('equip-list');
    const equipTitle = document.getElementById('equip-select-title');

    if (!heroButton || !heroModal) return;

    // --- HELPER: CALCULATE STATS ---
    function getWeaponDamage(baseDmg, level) {
        // CHANGED: 0.5 (50% per level)
        return Math.floor(baseDmg * (1 + (level * 0.5)));
    }

    function getItemLevel(itemId) {
        return (HERO_STATE.itemLevels && HERO_STATE.itemLevels[itemId]) || 0;
    }

    // --- CORE FUNCTIONS ---

    function updateHeroMenu() {
        if (menuHeroAtk) menuHeroAtk.innerText = HERO_STATE.baseAttack;
        if (menuHeroDef) menuHeroDef.innerText = HERO_STATE.defense || 0;

        if (heroDisplayImage) {
            heroDisplayImage.style.backgroundImage = `url(${GAME_ASSETS.warrior})`;
        }

        updateSlotVisual(weaponSlot, 'mainHand');
        updateSlotVisual(armorSlot, 'body');
    }

    function updateSlotVisual(slotEl, type) {
        const itemId = HERO_STATE.equipment[type];

        // 1. Visual Styling (Border/Glow)
        const isStarter = (itemId === 'rusty_sword' || itemId === 'tattered_shirt');
        slotEl.style.borderColor = isStarter ? '#555' : '#3498db';
        slotEl.style.boxShadow = isStarter ? 'inset 0 0 10px #000' : '0 0 10px #3498db';

        // 2. Inject Level Badge
        let badge = slotEl.querySelector('.slot-level-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'slot-level-badge';
            badge.style.position = 'absolute';
            badge.style.top = '2px';
            badge.style.right = '4px';
            badge.style.fontSize = '10px';
            badge.style.color = '#2ecc71';
            badge.style.fontWeight = 'bold';
            slotEl.appendChild(badge);
        }
        const level = getItemLevel(itemId);
        badge.innerText = level > 0 ? `+${level}` : '';

        // 3. Inject Item Name
        let nameEl = slotEl.querySelector('.slot-item-name');
        if (!nameEl) {
            nameEl = document.createElement('span');
            nameEl.className = 'slot-item-name';
            slotEl.appendChild(nameEl);
        }

        // Lookup Item Data
        let itemName = "Empty";
        let itemData = null; // Store the object

        if (type === 'mainHand') {
            itemData = WEAPON_DB.find(w => w.id === itemId);
        } else {
            itemData = ARMOR_DB.find(a => a.id === itemId);
        }

        if (itemData) {
            itemName = itemData.name;
        }

        nameEl.innerText = itemName;

        // 4. NEW: Apply Custom Image (Global Logic)
        const iconDiv = slotEl.querySelector('.slot-icon');
        if (iconDiv) {
            // Reset to default (CSS shapes)
            iconDiv.style.backgroundImage = '';

            // Check if item exists and has an icon defined
            if (itemData && itemData.icon && GAME_ASSETS[itemData.icon]) {
                iconDiv.style.backgroundImage = `url('${GAME_ASSETS[itemData.icon]}')`;
                // Ensure fit
                iconDiv.style.backgroundSize = 'contain';
                iconDiv.style.backgroundRepeat = 'no-repeat';
                iconDiv.style.backgroundPosition = 'center';
            }
        }
    }

    // --- EQUIP MODAL LOGIC ---

    function openEquipSelect(slotType) {
        window.openModalGlobal('equip-select-modal');
        closeEquipButton.style.backgroundImage = `url(${GAME_ASSETS.backButton})`;
        equipList.innerHTML = "";

        const isWeapon = slotType === 'mainHand';
        equipTitle.innerText = isWeapon ? "EQUIP WEAPON" : "EQUIP ARMOR";

        const db = isWeapon ? WEAPON_DB : ARMOR_DB;
        const ownedIds = HERO_STATE.ownedItems;
        const currentEquippedId = HERO_STATE.equipment[slotType];

        const myItems = db.filter(item => ownedIds.includes(item.id));
        // Sort by Tier (High to Low)
        myItems.sort((a, b) => b.tier - a.tier);

        myItems.forEach(item => {
            const isEquipped = (item.id === currentEquippedId);
            const itemDiv = document.createElement('div');
            itemDiv.className = `forge-item ${isEquipped ? 'equipped' : ''}`;

            const level = getItemLevel(item.id);

            // --- IMAGE LOGIC ---
            let iconClass = isWeapon ? 'weapon-icon' : 'armor-icon';
            let iconStyle = '';

            if (item.icon && GAME_ASSETS[item.icon]) {
                iconStyle = `style="background-image: url('${GAME_ASSETS[item.icon]}');"`;
            }

            // --- STATS LOGIC ---
            let statDisplay = "";
            if (isWeapon) {
                const dmg = getWeaponDamage(item.damage, level);
                statDisplay = `DMG: ${dmg} <span style="color:#2ecc71">(+${level})</span>`;
            } else {
                statDisplay = `DEF: ${item.defense} <span style="color:#2ecc71">(+${level})</span>`;
            }

            const btnText = isEquipped ? "EQUIPPED" : "EQUIP";
            const btnState = isEquipped ? "disabled" : "";

            itemDiv.innerHTML = `
                <div class="forge-icon-box">
                    <div class="${iconClass}" ${iconStyle}></div>
                </div>
                <div class="forge-details">
                    <span class="forge-name">${item.name}</span>
                    <span class="forge-stats">${statDisplay}</span>
                </div>
                <button class="equip-btn" ${btnState}>${btnText}</button>
            `;

            const btn = itemDiv.querySelector('button');
            if (!isEquipped) {
                btn.addEventListener('click', () => {
                    handleEquip(item, slotType);
                });
            }

            equipList.appendChild(itemDiv);
        });
    }

    function handleEquip(item, slotType) {
        HERO_STATE.equipment[slotType] = item.id;
        const level = getItemLevel(item.id);
        recalculateHeroStats();
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.refreshGameUI) window.refreshGameUI();

        updateHeroMenu();

        equipModal.classList.add('closing');
        setTimeout(() => {
            equipModal.classList.add('hidden');
            equipModal.classList.remove('closing');
        }, 300);
    }

    // --- LISTENERS ---

    heroButton.addEventListener('click', () => {
        updateHeroMenu();
        window.openModalGlobal('hero-modal');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    closeHeroButton.addEventListener('click', () => {
        heroModal.classList.add('closing');
        setTimeout(() => {
            heroModal.classList.add('hidden');
            heroModal.classList.remove('closing');
        }, 300);
    });

    weaponSlot.addEventListener('click', () => openEquipSelect('mainHand'));
    armorSlot.addEventListener('click', () => openEquipSelect('body'));

    closeEquipButton.addEventListener('click', () => {
        equipModal.classList.add('closing');
        setTimeout(() => {
            equipModal.classList.add('hidden');
            equipModal.classList.remove('closing');
        }, 300);
    });

});