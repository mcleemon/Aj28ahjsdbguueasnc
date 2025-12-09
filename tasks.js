// tasks.js
// v2.4.0 - UI Polish & Reward Colors

import { GAME_ASSETS } from './assets.js';
import { HERO_STATE } from './hero.js';
import { DUNGEON_STATE } from './dungeon.js';
import { getMiningState, getItemLevel, isItemUnlocked } from './mining.js';

// --- CONFIGURATION: THE TASK DATABASE ---
const TASK_DB = [
    // --- 📅 DAILY & REPEATABLE ---
    {
        id: 'daily_mimic',
        category: 'daily',
        title: "Mimic Friend",
        desc: "Feed the Mimic today",
        icon: 'mimicClose',
        rewardDust: 5000,
        isCompleted: () => (window.gameState.mimicFeedsToday || 0) > 0,
        isDaily: true 
    },

    // --- ⚔️ COMBAT & PROGRESSION ---
    {
        id: 't1_hero_5',
        category: 'combat',
        title: "Rookie Rising",
        desc: "Reach Global Hero Level 5",
        icon: 'warrior',
        rewardDust: 5000,
        isCompleted: () => (window.gameState.globalLevel || 1) >= 5
    },
    {
        id: 't1_floor_10',
        category: 'combat',
        title: "First Blood",
        desc: "Reach Dungeon Floor 10",
        icon: 'warrior',
        rewardDust: 2500,
        isCompleted: () => DUNGEON_STATE.floor >= 10
    },
    {
        id: 't2_floor_20',
        category: 'combat',
        title: "Dungeon Explorer",
        desc: "Reach Dungeon Floor 20",
        icon: 'warrior',
        rewardDust: 10000,
        isCompleted: () => DUNGEON_STATE.floor >= 20
    },
    {
        id: 't3_hero_20',
        category: 'combat',
        title: "Seasoned Veteran",
        desc: "Reach Global Hero Level 20",
        icon: 'warrior',
        rewardGem: 3,
        isCompleted: () => (window.gameState.globalLevel || 1) >= 20
    },
    {
        id: 't3_floor_50',
        category: 'combat',
        title: "Deep Delver",
        desc: "Reach Dungeon Floor 50",
        icon: 'warrior',
        rewardDust: 100000,
        isCompleted: () => DUNGEON_STATE.floor >= 50
    },

    // --- 🏰 DUNGEON MASTERY ---
    {
        id: 't4_floor_100',
        category: 'combat',
        title: "Centurion",
        desc: "Reach Dungeon Floor 100",
        icon: 'warrior',
        rewardDust: 250000,
        rewardGem: 5, 
        isCompleted: () => DUNGEON_STATE.floor >= 100
    },
    {
        id: 't5_floor_200',
        category: 'combat',
        title: "Double Century",
        desc: "Reach Dungeon Floor 200",
        icon: 'warrior',
        rewardDust: 500000,
        isCompleted: () => DUNGEON_STATE.floor >= 200
    },
    {
        id: 't5_floor_300',
        category: 'combat',
        title: "Spartan",
        desc: "Reach Dungeon Floor 300",
        icon: 'warrior',
        rewardDust: 1000000,
        rewardGem: 10,
        isCompleted: () => DUNGEON_STATE.floor >= 300
    },
    {
        id: 't5_floor_400',
        category: 'combat',
        title: "Quad Century",
        desc: "Reach Dungeon Floor 400",
        icon: 'warrior',
        rewardDust: 2000000,
        isCompleted: () => DUNGEON_STATE.floor >= 400
    },
    {
        id: 't5_floor_500',
        category: 'combat',
        title: "Half Millennium",
        desc: "Reach Dungeon Floor 500",
        icon: 'warrior',
        rewardDust: 3000000,
        isCompleted: () => DUNGEON_STATE.floor >= 500
    },
    {
        id: 't5_floor_600',
        category: 'combat',
        title: "Depth Walker",
        desc: "Reach Dungeon Floor 600",
        icon: 'warrior',
        rewardDust: 5000000,
        isCompleted: () => DUNGEON_STATE.floor >= 600
    },
    {
        id: 't5_floor_700',
        category: 'combat',
        title: "Lucky Seven",
        desc: "Reach Dungeon Floor 700",
        icon: 'warrior',
        rewardDust: 7500000,
        rewardGem: 15,
        isCompleted: () => DUNGEON_STATE.floor >= 700
    },
    {
        id: 't5_floor_800',
        category: 'combat',
        title: "Octo Guard",
        desc: "Reach Dungeon Floor 800",
        icon: 'warrior',
        rewardDust: 10000000,
        isCompleted: () => DUNGEON_STATE.floor >= 800
    },
    {
        id: 't5_floor_900',
        category: 'combat',
        title: "Nearing The Edge",
        desc: "Reach Dungeon Floor 900",
        icon: 'warrior',
        rewardDust: 15000000,
        isCompleted: () => DUNGEON_STATE.floor >= 900
    },
    {
        id: 't5_floor_1000',
        category: 'combat',
        title: "Millennium",
        desc: "Reach Dungeon Floor 1000",
        icon: 'warrior',
        rewardDust: 20000000,
        rewardGem: 20,
        isCompleted: () => DUNGEON_STATE.floor >= 1000
    },
    {
        id: 't5_floor_1100',
        category: 'combat',
        title: "Beyond Limits",
        desc: "Reach Dungeon Floor 1100",
        icon: 'warrior',
        rewardDust: 25000000,
        isCompleted: () => DUNGEON_STATE.floor >= 1100
    },
    {
        id: 't5_floor_1200',
        category: 'combat',
        title: "Void Walker",
        desc: "Reach Dungeon Floor 1200",
        icon: 'warrior',
        rewardDust: 30000000,
        rewardGem: 25,
        isCompleted: () => DUNGEON_STATE.floor >= 1200
    },
    {
        id: 't5_floor_1300',
        category: 'combat',
        title: "Abyssal King",
        desc: "Reach Dungeon Floor 1300",
        icon: 'warrior',
        rewardDust: 40000000,
        isCompleted: () => DUNGEON_STATE.floor >= 1300
    },
    {
        id: 't5_floor_1400',
        category: 'combat',
        title: "Celestial Gate",
        desc: "Reach Dungeon Floor 1400",
        icon: 'warrior',
        rewardDust: 50000000,
        isCompleted: () => DUNGEON_STATE.floor >= 1400
    },
    {
        id: 't5_floor_1500',
        category: 'combat',
        title: "God of Dungeons",
        desc: "Reach Dungeon Floor 1500",
        icon: 'warrior',
        rewardDust: 75000000,
        rewardGem: 50,
        isCompleted: () => DUNGEON_STATE.floor >= 1500
    },

    // --- ⛏️ MINING & ECONOMY ---
    {
        id: 't1_mine_unlock',
        category: 'mining',
        title: "Breaking Ground",
        desc: "Unlock the Pickaxe (Mining)",
        icon: 'miningItem1',
        rewardDust: 1000, 
        isCompleted: () => isItemUnlocked(1)
    },
    {
        id: 't2_pickaxe_10',
        category: 'mining',
        title: "Efficient Miner",
        desc: "Upgrade Pickaxe to Level 10",
        icon: 'miningItem1',
        rewardGem: 1,
        isCompleted: () => getItemLevel(1) >= 10
    },
    {
        id: 't3_helmet_20',
        category: 'mining',
        title: "Safety First",
        desc: "Upgrade Helmet (Mining) to Lv 20",
        icon: 'miningItem2',
        rewardDust: 75000,
        isCompleted: () => getItemLevel(2) >= 20
    },
    {
        id: 't3_silo_2',
        category: 'mining',
        title: "Industrialist",
        desc: "Upgrade Mining Silo to Level 2",
        icon: 'mineEntrance',
        rewardGem: 2,
        isCompleted: () => getMiningState().siloLevel >= 2
    },
    {
        id: 't4_unlock_drill',
        category: 'mining',
        title: "Heavy Machinery",
        desc: "Unlock the Driller (Mining Tier 7)",
        icon: 'miningItem7',
        rewardGem: 5,
        isCompleted: () => isItemUnlocked(7)
    },

    // --- ⚒️ SMITHING & GEAR ---
    {
        id: 't1_craft_wood',
        category: 'smithing',
        title: "Apprentice Smith",
        desc: "Own a Wooden Sword",
        icon: 'weapon-icon',
        rewardDust: 1500,
        isCompleted: () => HERO_STATE.ownedItems.includes('wood_sword')
    },
    {
        id: 't2_craft_iron',
        category: 'smithing',
        title: "Iron Will",
        desc: "Craft an Iron Sword",
        icon: 'weapon-icon',
        rewardDust: 20000,
        isCompleted: () => HERO_STATE.ownedItems.includes('iron_sword')
    },
    {
        id: 't4_craft_gold',
        category: 'smithing',
        title: "Midas Touch",
        desc: "Craft a Golden Sword",
        icon: 'weapon-icon',
        rewardDust: 500000,
        isCompleted: () => HERO_STATE.ownedItems.includes('gold_sword')
    },

    // --- 🎲 MINIGAMES (Casino) ---
    {
        id: 't2_blackjack_3',
        category: 'minigame',
        title: "Card Shark",
        desc: "Reach Blackjack Level 3",
        icon: 'iconBlackjack',
        rewardDust: 50000,
        isCompleted: () => (window.gameState.blackjack_level || 0) >= 3
    },
    {
        id: 't4_blackjack_10',
        category: 'minigame',
        title: "Casino King",
        desc: "Reach Blackjack Level 10",
        icon: 'iconBlackjack',
        rewardDust: 1000000,
        isCompleted: () => (window.gameState.blackjack_level || 0) >= 10
    }
];

// Define Category Display Order & Titles
const CATEGORIES = {
    'daily': '📅 DAILY ACTIVITY',
    'combat': '⚔️ COMBAT & DUNGEON',
    'mining': '⛏️ MINING CAMP',
    'smithing': '⚒️ BLACKSMITH',
    'minigame': '🎲 CASINO & LUCK'
};

document.addEventListener('DOMContentLoaded', () => {

    const tasksButton = document.getElementById('tasks-button');
    const tasksModal = document.getElementById('tasks-modal');
    const closeTasksButton = document.getElementById('close-tasks-button');
    const taskListContainer = document.querySelector('.task-list');

    if (!tasksButton || !tasksModal || !closeTasksButton) {
        console.error("Tasks modal elements not found!");
        return;
    }

    if (!window.gameState) window.gameState = {};
    if (!window.gameState.claimedTasks) window.gameState.claimedTasks = [];

    // --- RENDER FUNCTION ---
    function renderTasks() {
        taskListContainer.innerHTML = ""; // Clear existing

        for (const [catKey, catTitle] of Object.entries(CATEGORIES)) {
            let tasksInCat = TASK_DB.filter(t => t.category === catKey);
            if (tasksInCat.length === 0) continue;

            tasksInCat.sort((a, b) => {
                const aClaimed = window.gameState.claimedTasks.includes(a.id);
                const bClaimed = window.gameState.claimedTasks.includes(b.id);
                return aClaimed - bClaimed;
            });

            const header = document.createElement('h3');
            header.innerText = catTitle;
            header.style.marginTop = "20px";
            header.style.marginBottom = "10px";
            header.style.borderBottom = "1px solid #555";
            header.style.paddingBottom = "5px";
            taskListContainer.appendChild(header);

            tasksInCat.forEach(task => {
                renderSingleTask(task, taskListContainer);
            });
        }
    }

    function renderSingleTask(task, container) {
        const isClaimed = window.gameState.claimedTasks.includes(task.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'task-item';
        
        let iconSrc = "";
        if (GAME_ASSETS[task.icon]) {
            iconSrc = GAME_ASSETS[task.icon];
        } else {
            iconSrc = GAME_ASSETS.iconCrystalDust; 
        }

        // --- NEW REWARD LABEL GENERATOR (White Label + Gold Gems) ---
        let rewardsHTML = "";
        if (task.rewardDust) {
            const val = window.formatNumberGlobal(task.rewardDust);
            rewardsHTML += `<span style="color:#87CEEB; font-weight:bold;">${val} Dust</span>`;
        }
        if (task.rewardGem) {
            if (rewardsHTML !== "") rewardsHTML += ` <span style="color:#fff; font-size:10px;">+</span> `;
            // Changed to #FFD700 (Gold) for Gems
            rewardsHTML += `<span style="color:#FFD700; font-weight:bold;">${task.rewardGem} Gems</span>`;
        }

        let completed = false;
        try {
            completed = task.isCompleted();
        } catch(e) {
            console.warn(`Task check failed for ${task.id}`, e);
        }

        let btnText = "GO";
        let btnDisabled = true;

        if (isClaimed) {
            btnText = "DONE";
            btnDisabled = true;
            itemDiv.style.opacity = "0.5";
        } else if (completed) {
            btnText = "CLAIM";
            btnDisabled = false;
            itemDiv.style.borderColor = "#ffd700"; 
            itemDiv.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.2)";
        } else {
            btnText = "LOCKED";
            btnDisabled = true;
        }

        // --- REDESIGNED LAYOUT (Smithy Style) ---
        // Used inline styles to enforce consistency without needing CSS file update
        itemDiv.innerHTML = `
            <div style="
                width: 50px; 
                height: 50px; 
                background: #111; 
                border: 2px solid #444; 
                border-radius: 6px; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                margin-right: 15px; 
                flex-shrink: 0;
            ">
                <img src="${iconSrc}" class="task-icon" alt="Icon" style="width: 36px; height: 36px; margin:0;">
            </div>
            <div style="flex-grow: 1; text-align: left; display:flex; flex-direction:column; justify-content:center; overflow:hidden;">
                <span class="task-title" style="margin-bottom:2px; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${task.title}</span>
                <span class="task-desc" style="font-size:10px; color:#aaa; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${task.desc}</span>
                <div style="font-size:11px;">
                    <span style="color:#fff; font-weight:bold; margin-right:4px;">Reward:</span>
                    ${rewardsHTML}
                </div>
            </div>
            <button class="task-claim-button" data-id="${task.id}" ${btnDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;

        const btn = itemDiv.querySelector('button');
        if (!isClaimed && completed) {
            btn.classList.add('task-ready'); 
            btn.addEventListener('click', () => {
                handleClaimTask(task);
            });
        }

        container.appendChild(itemDiv);
    }

    function handleClaimTask(task) {
        if (task.rewardDust) {
            window.gameState.dust += task.rewardDust;
        }
        if (task.rewardGem) {
            window.gameState.gemShards += task.rewardGem;
        }

        if (!task.isDaily) {
            window.gameState.claimedTasks.push(task.id);
        } else {
            window.gameState.claimedTasks.push(task.id);
        }

        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.refreshGameUI) window.refreshGameUI();
        
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        
        renderTasks();
    }

    // --- LISTENERS ---

    tasksButton.disabled = false;
    tasksButton.addEventListener('click', () => {
        renderTasks(); 
        tasksModal.classList.remove('hidden');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    });

    closeTasksButton.addEventListener('click', () => {
        tasksModal.classList.add('closing');
        setTimeout(() => {
            tasksModal.classList.add('hidden');
            tasksModal.classList.remove('closing'); 
        }, 300);
    });
});