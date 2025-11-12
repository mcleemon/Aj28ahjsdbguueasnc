// scaler.js
// v1.0.0

function resizeGame() {
    const gameWrapper = document.getElementById('game-wrapper');
    if (!gameWrapper) return;
    const baseWidth = 400;
    const baseHeight = 912; 
    const scale = Math.min(
        window.innerWidth / baseWidth,
        window.innerHeight / baseHeight
    );
    gameWrapper.style.transform = `scale(${scale})`;
}

window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);
document.addEventListener('DOMContentLoaded', resizeGame);