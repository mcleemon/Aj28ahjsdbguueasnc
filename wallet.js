// wallet.js
// Handles TON Connect logic for Forge Hero (v1.1 - Variable Fix)

// 1. configuration
const MANIFEST_URL = 'https://mcleemon.github.io/Aj28ahjsdbguueasnc/tonconnect-manifest.json';

export let tonConnectUI = null;
export let userWalletAddress = null;

// 2. Initialize the Wallet System
export async function initWallet() {
    // FIX: Check for 'TON_CONNECT_UI' (All Caps) which is the correct global from CDN
    if (!window.TON_CONNECT_UI) {
        console.error("TON Connect SDK not loaded.");
        return;
    }

    try {
        // FIX: Use the correct namespace to create the instance
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: MANIFEST_URL
        });

        // Restore connection if saved
        const currentWallet = tonConnectUI.wallet;
        if (currentWallet) {
            handleWalletConnection(currentWallet);
        }

        // Listen for changes (Connect/Disconnect)
        tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                handleWalletConnection(wallet);
            } else {
                handleWalletDisconnection();
            }
        });

    } catch (error) {
        console.error("Wallet Init Failed:", error);
    }
}

// 3. Handle User Action (Clicking the Button)
export async function toggleWalletConnection() {
    if (!tonConnectUI) {
        console.error("Wallet not initialized.");
        return;
    }

    try {
        if (tonConnectUI.connected) {
            // If connected, ask to disconnect
            const confirmDisconnect = confirm("Disconnect your wallet?");
            if (confirmDisconnect) {
                await tonConnectUI.disconnect();
            }
        } else {
            // If disconnected, open the connect modal
            await tonConnectUI.openModal();
        }
    } catch (error) {
        console.error("Wallet Error:", error);
    }
}

// 4. Internal Helpers
function handleWalletConnection(wallet) {
    // Get the address (raw format)
    const rawAddress = wallet.account.address;
    userWalletAddress = rawAddress;
    
    // Save to game state (so we can use it for Airdrops later)
    if (window.gameState) {
        window.gameState.walletAddress = rawAddress;
        window.isGameDirty = true; // Force a save
    }

    // Update the UI Button
    updateWalletButton(true, rawAddress);
    
    console.log("[Wallet] Connected:", rawAddress);
}

function handleWalletDisconnection() {
    userWalletAddress = null;
    
    if (window.gameState) {
        window.gameState.walletAddress = null;
        window.isGameDirty = true;
    }

    // Reset UI Button
    updateWalletButton(false);
    console.log("[Wallet] Disconnected");
}

function updateWalletButton(isConnected, address) {
    const btn = document.getElementById('wallet-connect-button');
    if (!btn) return;

    if (isConnected) {
        // Visuals: Make it look "Active" (Green border or similar)
        btn.style.filter = "drop-shadow(0 0 5px #00ff00)";
        btn.style.border = "2px solid #00ff00";
        btn.style.borderRadius = "12px";
    } else {
        // Visuals: Reset to normal
        btn.style.filter = "none";
        btn.style.border = "none";
    }
}