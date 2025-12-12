// achievements.js
// v1.0.0 - Lifetime Stats & Ribbons

import { GAME_ASSETS } from './assets.js';

// --- STATS TRACKING HELPER ---
// Call this function from anywhere in your game to update stats!
export function incrementStat(statKey, amount = 1) {
    if (!window.gameState.stats) window.gameState.stats = {};
    if (!window.gameState.stats[statKey]) window.gameState.stats[statKey] = 0;

    window.gameState.stats[statKey] += amount;

    // Optional: Check achievements immediately? 
    // Usually better to check only when opening the menu for performance.
}

// --- CONFIGURATION: ACHIEVEMENT DATABASE ---
const ACHIEVEMENTS = [];

// Helper to generate tiers easily
function createTieredAch(idBase, category, titleBase, descTemplate, statKey, tiers, icon) {
    tiers.forEach((goal, index) => {
        ACHIEVEMENTS.push({
            id: `${idBase}_${index + 1}`,
            category: category,
            title: `${titleBase} ${toRoman(index + 1)}`,
            desc: descTemplate.replace('XX', goal.toLocaleString()),
            target: goal,
            statKey: statKey,
            icon: icon,
            rewardGem: Math.floor(1 + (index * 2)) // Reward scales: 1, 3, 5, 7...
        });
    });
}

function toRoman(num) {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num - 1] || num;
}

// --- 1. COMBAT ACHIEVEMENTS (Massive List) ---
createTieredAch('kill', 'combat', 'Slayer', 'Defeat XX Monsters', 'totalKills',
    [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000], '⚔️');

createTieredAch('boss', 'combat', 'Boss Hunter', 'Defeat XX Bosses', 'totalBossKills',
    [1, 5, 10, 25, 50, 100, 250, 500, 1000], '💀');

createTieredAch('clicks', 'combat', 'Furious Slasher', 'Perform XX Attacks', 'totalClicks',
    [1000, 5000, 10000, 50000, 100000, 500000, 1000000], '👆');

// --- 2. WEALTH ACHIEVEMENTS ---
createTieredAch('earn_dust', 'economy', 'Dust Tycoon', 'Collect XX Total Dust', 'totalDustEarned',
    [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000], '💎');

createTieredAch('craft', 'economy', 'Blacksmith', 'Craft XX Items', 'totalCrafts',
    [1, 5, 10, 25, 50, 100], '⚒️');

// --- 3. LUCK ACHIEVEMENTS ---
createTieredAch('gamble', 'luck', 'High Roller', 'Play XX Minigames', 'totalMinigamesPlayed',
    [5, 25, 50, 100, 500, 1000], '🎲');

createTieredAch('feed', 'luck', 'Feeder', 'Feed Mimic XX Times', 'totalMimicFeeds',
    [1, 5, 10, 25, 50, 100], '🥩');

createTieredAch('reel_spin', 'luck', 'Spin to Win', 'Spin Slots XX Times', 'totalReelSpins',
    [10, 50, 100, 500, 1000, 5000], '🎰');

createTieredAch('reel_win', 'luck', 'Jackpot Hunter', 'Win XX Dust in Slots', 'totalReelWinnings',
    [10000, 100000, 1000000, 10000000, 50000000], '💰');

createTieredAch('mining_up', 'economy', 'Driller', 'Perform XX Mining Upgrades', 'totalMiningUpgrades', [1, 5, 10, 25, 50, 100, 200], '⛏️');

document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const openBtn = document.getElementById('achievement-button'); // Inside Settings
    const closeBtn = document.getElementById('close-achievements-button');
    const modal = document.getElementById('achievements-modal');
    const listContainer = document.getElementById('achievement-list');
    const tabs = document.querySelectorAll('.ach-tab');

    let currentFilter = 'all';

    // Initialize Stats if missing
    if (window.gameState && !window.gameState.stats) {
        window.gameState.stats = {
            totalKills: 0,
            totalBossKills: 0,
            totalClicks: 0,
            totalDustEarned: 0,
            totalCrafts: 0,
            totalMinigamesPlayed: 0,
            totalMimicFeeds: 0
        };
    }
    // Initialize Claimed Array
    if (window.gameState && !window.gameState.claimedAchievements) {
        window.gameState.claimedAchievements = [];
    }

    function render() {
        listContainer.innerHTML = "";

        // Filter
        let filtered = ACHIEVEMENTS;
        if (currentFilter !== 'all') {
            filtered = ACHIEVEMENTS.filter(a => a.category === currentFilter);
        }

        // Sort: Claimable -> In Progress -> Completed/Claimed
        filtered.sort((a, b) => {
            const aStat = window.gameState.stats[a.statKey] || 0;
            const bStat = window.gameState.stats[b.statKey] || 0;
            const aDone = aStat >= a.target;
            const bDone = bStat >= b.target;
            const aClaimed = window.gameState.claimedAchievements.includes(a.id);
            const bClaimed = window.gameState.claimedAchievements.includes(b.id);

            if (aClaimed && !bClaimed) return 1;
            if (!aClaimed && bClaimed) return -1;
            if (aDone && !bDone) return -1;
            if (!aDone && bDone) return 1;
            return 0;
        });

        filtered.forEach(ach => {
            const currentVal = window.gameState.stats[ach.statKey] || 0;
            const isCompleted = currentVal >= ach.target;
            const isClaimed = window.gameState.claimedAchievements.includes(ach.id);
            const percent = Math.min(100, (currentVal / ach.target) * 100);

            const div = document.createElement('div');
            div.className = `ach-ribbon ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`;

            let btnHTML = `<button class="ach-btn">Locked</button>`;

            if (isClaimed) {
                btnHTML = `<button class="ach-btn done">DONE</button>`;
            } else if (isCompleted) {
                btnHTML = `<button class="ach-btn claimable">CLAIM</button>`;
            } else {
                btnHTML = `<button class="ach-btn">${Math.floor(percent)}%</button>`;
            }

            div.innerHTML = `
                <div class="ach-progress-bg" style="width: ${percent}%"></div>
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                    <span class="ach-title">${ach.title}</span>
                    <span class="ach-desc">${ach.desc} <span style="color:#aaa">(${window.formatNumberGlobal(currentVal)} / ${window.formatNumberGlobal(ach.target)})</span></span>
                </div>
                <div style="z-index:2; text-align:right;">
                    <div style="font-size:10px; color:#FFD700; margin-bottom:2px;">+${ach.rewardGem} Gems</div>
                    ${btnHTML}
                </div>
            `;

            if (isCompleted && !isClaimed) {
                const btn = div.querySelector('button');
                btn.onclick = () => claimAchievement(ach);
            }

            listContainer.appendChild(div);
        });
    }

    function claimAchievement(ach) {
        window.gameState.claimedAchievements.push(ach.id);
        window.gameState.gemShards += ach.rewardGem;

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        if (window.saveGameGlobal) window.saveGameGlobal();
        if (window.refreshGameUI) window.refreshGameUI();

        render();
    }

    // Listeners
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            render();
            window.openModalGlobal('achievements-modal');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.closeModalGlobal('achievements-modal');
        });
    }

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.tab;
            render();
        });
    });
});