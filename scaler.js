// scaler.js
// v1.0.0
// Implements the "Option 3: Hybrid" scaling advice.

function resizeGame() {
    const gameWrapper = document.getElementById('game-wrapper');
    if (!gameWrapper) return;

    // This is your game's "design" resolution.
    // We use 400px as the width, based on your max-width.
    const baseWidth = 400;
    // We'll use a common tall phone height (like iPhone X) as the base.
    const baseHeight = 912; 

    const scale = Math.min(
        window.innerWidth / baseWidth,
        window.innerHeight / baseHeight
    );

    gameWrapper.style.transform = `scale(${scale})`;
}

// Run on load and resize
window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);

// Also run as soon as possible
document.addEventListener('DOMContentLoaded', resizeGame);