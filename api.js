// api.js v3.0
// Handles communication between the Game and the Cloudflare Backend

(function () {
    // KEEP YOUR EXISTING URL HERE!
    const API_BASE_URL = "https://forge-hero-backend.forge-hero-dev.workers.dev";

    window.api = {

        /**
         * Claim the reward for a specific friend
         */
        async claimReferralReward(referrerId, friendId) {
            try {
                const response = await fetch(`${API_BASE_URL}/claim`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referrerId, friendId })
                });
                const data = await response.json();
                return data.status === 'success';
            } catch (error) {
                console.error("[API] Claim Error:", error);
                return false;
            }
        },
        
        /**
         * Register a new referral (Friend Joins)
         */
        async registerReferral(referrerId, newUserId) {
            console.log(`[API] Registering: ${newUserId} invited by ${referrerId}`);
            try {
                await fetch(`${API_BASE_URL}/invite`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referrerId, newUserId })
                });
            } catch (error) { console.error("[API] Error:", error); }
        },

        /**
         * NEW: Tell server this player has qualified (Lvl 10 + 1 Hour)
         */
        async qualifyPlayer(userId) {
            console.log(`[API] Sending Qualification for: ${userId}`);
            try {
                await fetch(`${API_BASE_URL}/qualify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
            } catch (error) { console.error("[API] Qualify Error:", error); }
        },

        /**
         * Get Friend List
         */
        async getFriendList(userId) {
            try {
                const response = await fetch(`${API_BASE_URL}/friends?userId=${userId}`);
                if (!response.ok) return { friends: [] };
                return await response.json();
            } catch (error) {
                console.error("[API] Get Friends Error:", error);
                return { friends: [] };
            }
        }
    };
})();