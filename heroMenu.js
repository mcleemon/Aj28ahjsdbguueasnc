// heroMenu.js - v2.2.0
// Handles Hero Equipment & Item Selection

import { HERO_STATE } from './hero.js';
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

    // Main Slots
    const weaponSlot = document.getElementById('slot-weapon');
    const armorSlot = document.getElementById('slot-armor');

    // Equip Select Modal Elements
    const equipModal = document.getElementById('equip-select-modal');
    const closeEquipButton = document.getElementById('close-equip-select-button');
    const equipList = document.getElementById('equip-list');
    const equipTitle = document.getElementById('equip-select-title');

    if (!heroButton || !heroModal || !equipModal) {
        console.warn("Hero Menu elements not found. Check HTML IDs.");
        return;
    }

    // --- HELPER: CALCULATE STATS ---
    function getWeaponDamage(baseDmg, level) {
        // +10% damage per plus level
        return Math.floor(baseDmg * (1 + (level * 0.1)));
    }

    // --- CORE FUNCTIONS ---

    function updateHeroMenu() {
        // 1. Update Text Stats
        if (menuHeroAtk) menuHeroAtk.innerText = HERO_STATE.baseAttack; 
        if (menuHeroDef) menuHeroDef.innerText = HERO_STATE.defense || 0;

        // 2. Update Avatar
        if (heroDisplayImage) {
            heroDisplayImage.style.backgroundImage = `url(${GAME_ASSETS.warrior})`;
        }

        // 3. Update Slots Visuals
        updateSlotVisual(weaponSlot, 'mainHand');
        updateSlotVisual(armorSlot, 'body');
    }

    function updateSlotVisual(slotEl, type) {
        const itemId = HERO_STATE.equipment[type];
        const isStarter = (itemId === 'rusty_sword' || itemId === 'tattered_shirt');
        
        // Reset Styles
        slotEl.style.borderColor = isStarter ? '#555' : '#3498db';
        slotEl.style.boxShadow = isStarter ? 'inset 0 0 10px #000' : '0 0 10px #3498db';

        // Inject Level Badge if Weapon
        if (type === 'mainHand') {
            const level = HERO_STATE.equipmentLevels[type] || 0;
            // We find the existing label or create it, but actually the HTML has specific structure.
            // Let's just use the border color to denote rarity for now.
            
            // If you want to show "+4" inside the box, we can inject it:
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
            badge.innerText = level > 0 ? `+${level}` : '';
        }
    }

    // --- EQUIP MODAL LOGIC ---

    function openEquipSelect(slotType) {
        equipModal.classList.remove('hidden');
        closeEquipButton.style.backgroundImage = `url(${GAME_ASSETS.backButton})`;
        equipList.innerHTML = ""; // Clear list

        // 1. Identify Context
        const isWeapon = slotType === 'mainHand';
        equipTitle.innerText = isWeapon ? "WEAPON" : "ARMOR";
        
        const db = isWeapon ? WEAPON_DB : ARMOR_DB;
        const ownedIds = HERO_STATE.ownedItems;
        const currentEquippedId = HERO_STATE.equipment[slotType];

        // 2. Filter Owned Items
        // We map the DB items to find matches in ownedItems
        const myItems = db.filter(item => ownedIds.includes(item.id));

        // 3. Sort by Tier (High to Low)
        myItems.sort((a, b) => b.tier - a.tier);

        // 4. Render Cards
        myItems.forEach(item => {
            const isEquipped = (item.id === currentEquippedId);
            const itemDiv = document.createElement('div');
            
            // Reusing 'forge-item' class for the card look
            itemDiv.className = `forge-item ${isEquipped ? 'equipped' : ''}`;
            // Override width for this specific list if needed, or rely on CSS
            
            // Icon & Stats
            const iconClass = isWeapon ? 'weapon-icon' : 'armor-icon';
            
            // Calculate Stats for display
            let statDisplay = "";
            if (isWeapon) {
                // Show Potential Damage (Base + Current Sharpen Level)
                // Note: Sharpen level is tied to the SLOT, not the item in this system
                const level = HERO_STATE.equipmentLevels.mainHand || 0;
                const dmg = getWeaponDamage(item.damage, level);
                statDisplay = `DMG: ${dmg} <span style="color:#2ecc71">(+${level})</span>`;
            } else {
                statDisplay = `DEF: ${item.defense}`;
            }

            // Button State
            const btnText = isEquipped ? "EQUIPPED" : "EQUIP";
            const btnState = isEquipped ? "disabled" : "";

            itemDiv.innerHTML = `
                <div class="forge-icon-box"><div class="${iconClass}"></div></div>
                <div class="forge-details">
                    <span class="forge-name">${item.name}</span>
                    <span class="forge-stats">${statDisplay}</span>
                </div>
                <button class="equip-btn" ${btnState}>${btnText}</button>
            `;

            // Handle Click
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
        // 1. Update State
        HERO_STATE.equipment[slotType] = item.id;

        // 2. Recalculate Hero Stats
        if (slotType === 'mainHand') {
            // Weapon: Recalculate Attack based on Item Base + Sharpen Level
            const level = HERO_STATE.equipmentLevels.mainHand || 0;
            HERO_STATE.baseAttack = getWeaponDamage(item.damage, level);
        } else {
            // Armor: Update Defense directly
            HERO_STATE.defense = item.defense;
        }

        // 3. Visual Feedback & Save
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        
        // Save via global scope if available
        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.refreshGameUI) window.refreshGameUI(); // Updates main UI bars

        // 4. Refresh Menus
        updateHeroMenu(); // Update the background panel
        
        // Close Modal
        equipModal.classList.add('closing');
        setTimeout(() => {
            equipModal.classList.add('hidden');
            equipModal.classList.remove('closing');
        }, 300);
    }

    // --- LISTENERS ---

    heroButton.addEventListener('click', () => {
        updateHeroMenu();
        heroModal.classList.remove('hidden');
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

    // Open Equipment Selector
    weaponSlot.addEventListener('click', () => openEquipSelect('mainHand'));
    armorSlot.addEventListener('click', () => openEquipSelect('body'));

    // Close Equipment Selector
    closeEquipButton.addEventListener('click', () => {
        equipModal.classList.add('closing');
        setTimeout(() => {
            equipModal.classList.add('hidden');
            equipModal.classList.remove('closing');
        }, 300);
    });

});