// heroMenu.js - v2.6.0
// Visual Fix: Aligned Item Boxes with Smithy Standards (54px Contain)

import { HERO_STATE, recalculateHeroStats, getItemByUid } from './hero.js';
import { GAME_ASSETS } from './assets.js';
import { WEAPON_DB, ARMOR_DB } from './items.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const heroButton = document.getElementById('hero-menu-button');
    const heroModal = document.getElementById('hero-modal');
    const closeHeroButton = document.getElementById('close-hero-button');
    const menuHeroAtk = document.getElementById('menu-hero-atk');
    const menuHeroDef = document.getElementById('menu-hero-def');
    const heroDisplayImage = document.getElementById('hero-display-image');
    const weaponSlot = document.getElementById('slot-weapon');
    const armorSlot = document.getElementById('slot-armor');

    // Equip Modal
    const equipModal = document.getElementById('equip-select-modal');
    const closeEquipButton = document.getElementById('close-equip-select-button');
    const equipList = document.getElementById('equip-list');
    const equipTitle = document.getElementById('equip-select-title');

    if (!heroButton || !heroModal) return;

    // --- HELPER FUNCTIONS ---
    function getWeaponDamage(baseDmg, level) {
        return Math.floor(baseDmg * (1 + (level * 0.5)));
    }

    function getArmorDefense(baseDef, level) {
        return Math.floor(baseDef * (1 + (level * 0.5)));
    }

    function updateHeroMenu() {
        if (menuHeroAtk) menuHeroAtk.innerText = HERO_STATE.baseAttack;
        if (menuHeroDef) menuHeroDef.innerText = HERO_STATE.defense || 0;
        if (heroDisplayImage) heroDisplayImage.style.backgroundImage = `url(${GAME_ASSETS.warrior})`;

        updateSlotVisual(weaponSlot, 'mainHand');
        updateSlotVisual(armorSlot, 'body');
    }

    function updateSlotVisual(slotEl, type) {
        const itemUid = HERO_STATE.equipment[type];
        const itemInstance = getItemByUid(itemUid);

        // Reset if empty
        if (!itemInstance) {
            slotEl.style.borderColor = '#555';
            slotEl.style.boxShadow = 'inset 0 0 10px #000';
            const badge = slotEl.querySelector('.slot-level-badge');
            if (badge) badge.innerText = '';
            const nameEl = slotEl.querySelector('.slot-item-name');
            if (nameEl) nameEl.innerText = 'Empty';
            const iconDiv = slotEl.querySelector('.slot-icon');
            if (iconDiv) {
                iconDiv.style.backgroundImage = '';
                iconDiv.style.width = '';
                iconDiv.style.height = '';
            }
            return;
        }

        // Find Database info
        let dbItem = null;
        if (type === 'mainHand') dbItem = WEAPON_DB.find(w => w.id === itemInstance.id);
        else dbItem = ARMOR_DB.find(a => a.id === itemInstance.id);

        // Styling
        const isStarter = dbItem && dbItem.tier === 0;
        slotEl.style.borderColor = isStarter ? '#555' : '#3498db';
        slotEl.style.boxShadow = isStarter ? 'inset 0 0 10px #000' : '0 0 10px #3498db';

        // Badge (+Level)
        let badge = slotEl.querySelector('.slot-level-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'slot-level-badge';
            badge.style.cssText = 'position:absolute; top:2px; right:4px; font-size:10px; color:#2ecc71; font-weight:bold;';
            slotEl.appendChild(badge);
        }
        badge.innerText = itemInstance.level > 0 ? `+${itemInstance.level}` : '';

        // Name
        let nameEl = slotEl.querySelector('.slot-item-name');
        if (!nameEl) {
            nameEl = document.createElement('span');
            nameEl.className = 'slot-item-name';
            slotEl.appendChild(nameEl);
        }
        nameEl.innerText = dbItem ? dbItem.name : "Unknown";

        // Icon Fix: Force Size & Center
        const iconDiv = slotEl.querySelector('.slot-icon');
        if (iconDiv && dbItem && dbItem.icon && GAME_ASSETS[dbItem.icon]) {
            iconDiv.style.backgroundImage = `url('${GAME_ASSETS[dbItem.icon]}')`;
            iconDiv.style.backgroundSize = 'contain';
            iconDiv.style.backgroundRepeat = 'no-repeat';
            iconDiv.style.backgroundPosition = 'center';
            // Force sizing to fill the box comfortably
            iconDiv.style.width = '50px';
            iconDiv.style.height = '50px';
        }
    }

    // --- EQUIP SELECTION LOGIC ---
    function openEquipSelect(slotType) {
        window.openModalGlobal('equip-select-modal');
        closeEquipButton.style.backgroundImage = `url(${GAME_ASSETS.backButton})`;
        equipList.innerHTML = "";

        const isWeapon = slotType === 'mainHand';
        equipTitle.innerText = isWeapon ? "EQUIP WEAPON" : "EQUIP ARMOR";

        const currentEquippedUid = HERO_STATE.equipment[slotType];

        // 1. Filter Inventory
        const availableItems = HERO_STATE.gearInventory
            .map(instance => {
                const dbItem = isWeapon
                    ? WEAPON_DB.find(w => w.id === instance.id)
                    : ARMOR_DB.find(a => a.id === instance.id);
                return { instance, dbItem };
            })
            .filter(obj => obj.dbItem !== undefined);

        // 2. Sort
        availableItems.sort((a, b) => {
            if (b.dbItem.tier !== a.dbItem.tier) return b.dbItem.tier - a.dbItem.tier;
            return b.instance.level - a.instance.level;
        });

        if (availableItems.length === 0) {
            equipList.innerHTML = "<div style='color:#777; margin-top:20px;'>No items found.</div>";
            return;
        }

        availableItems.forEach(({ instance, dbItem }) => {
            const isEquipped = (instance.uid === currentEquippedUid);
            const itemDiv = document.createElement('div');
            itemDiv.className = `forge-item ${isEquipped ? 'equipped' : ''}`;

            // Center Alignment
            itemDiv.style.alignItems = "center";
            itemDiv.style.textAlign = "center";

            // Image Source
            let imgUrl = GAME_ASSETS.iconCrystalDust;
            if (dbItem.icon && GAME_ASSETS[dbItem.icon]) {
                imgUrl = GAME_ASSETS[dbItem.icon];
            }

            // Stats
            let statDisplay = "";
            if (isWeapon) {
                const dmg = getWeaponDamage(dbItem.damage, instance.level);
                statDisplay = `DMG: ${dmg}`;
            } else {
                const def = getArmorDefense(dbItem.defense, instance.level);
                statDisplay = `DEF: ${def}`;
            }

            const btnText = isEquipped ? "EQUIPPED" : "EQUIP";
            const btnState = isEquipped ? "disabled" : "";
            const levelText = instance.level > 0 ? `<span style="color:#2ecc71; font-weight:bold;">(+${instance.level})</span>` : '';

            // VISUAL FIX: Use the forge-icon-box style from Smithy
            itemDiv.innerHTML = `
                <div class="forge-icon-box" style="margin: 0 auto 5px auto; background-image: url('${imgUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; border: 2px solid #444;">
                </div>
                <div class="forge-details" style="width:100%; margin-bottom:10px; text-align: center;">
                    <span class="forge-name" style="font-size:16px;">${dbItem.name} ${levelText}</span>
                    <span class="forge-stats" style="font-size:12px; color:#ccc;">${statDisplay}</span>
                </div>
                <button class="equip-btn" style="width:100%;" ${btnState}>${btnText}</button>
            `;

            if (!isEquipped) {
                itemDiv.querySelector('button').addEventListener('click', () => {
                    handleEquip(instance.uid, slotType);
                });
            }

            equipList.appendChild(itemDiv);
        });
    }

    function handleEquip(uid, slotType) {
        HERO_STATE.equipment[slotType] = uid;
        recalculateHeroStats();

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.refreshGameUI) window.refreshGameUI();

        updateHeroMenu();

        // Close modal
        equipModal.classList.add('closing');
        setTimeout(() => {
            equipModal.classList.add('hidden');
            equipModal.classList.remove('closing');
        }, 300);
    }

    // --- EVENT LISTENERS ---
    heroButton.addEventListener('click', () => {
        updateHeroMenu();
        window.openModalGlobal('hero-modal');
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