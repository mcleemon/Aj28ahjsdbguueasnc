// audioManager.js - v1.0.0
import { GAME_ASSETS } from './assets.js';

class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this.isMuted = false;
        this.initialized = false;

        // Default volume levels
        this.volumes = {
            sfx: 1.0,
            music: 0.5
        };
    }

    // Initialize and preload all sounds
    init() {
        if (this.initialized) return;
        
        console.log("[Audio] Initializing...");
        
        // Load SFX
        this.loadSound('click', GAME_ASSETS.sfxClick);
        this.loadSound('spin', GAME_ASSETS.sfxReelSpin);
        this.loadSound('stop', GAME_ASSETS.sfxReelStop);
        this.loadSound('winSmall', GAME_ASSETS.sfxWinSmall);
        this.loadSound('winBig', GAME_ASSETS.sfxWinMedium);
        this.loadSound('scatter', GAME_ASSETS.sfxScatter);
        this.loadSound('bonus', GAME_ASSETS.sfxBonusTrigger);

        // Load Music
        this.loadMusic('bgm_reel', GAME_ASSETS.bgmReel);

        this.initialized = true;
        
        // Attempt to unlock audio context on first interaction
        window.addEventListener('click', () => this.unlockAudio(), { once: true });
        window.addEventListener('touchstart', () => this.unlockAudio(), { once: true });
    }

    loadSound(key, url) {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        // Clone node allows playing the same sound multiple times quickly (like reel stops)
        this.sounds[key] = audio;
    }

    loadMusic(key, url) {
        const audio = new Audio();
        audio.src = url;
        audio.loop = true;
        audio.preload = 'auto';
        this.music[key] = audio;
    }

    unlockAudio() {
        // Dummy play to unlock browser audio restrictions
        const dummy = new Audio();
        dummy.play().then(() => {}).catch(() => {});
    }

    playSound(key) {
        if (this.isMuted || !this.sounds[key]) return;

        // Create a clone to allow overlapping sounds (e.g., multiple clicks)
        const soundClone = this.sounds[key].cloneNode();
        soundClone.volume = this.volumes.sfx;
        
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // console.warn(`[Audio] Play failed for ${key}:`, error);
            });
        }
    }

    playMusic(key, fade = false) {
        if (this.isMuted || !this.music[key]) return;
        if (this.currentMusic === this.music[key]) return; // Already playing

        // Stop current music
        this.stopMusic(fade);

        this.currentMusic = this.music[key];
        this.currentMusic.volume = fade ? 0 : this.volumes.music;
        this.currentMusic.currentTime = 0;
        
        const playPromise = this.currentMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`[Audio] Music failed for ${key}:`, error);
            });
        }

        if (fade) {
            this.fadeIn(this.currentMusic);
        }
    }

    stopMusic(fade = false) {
        if (!this.currentMusic) return;
        
        const musicToStop = this.currentMusic;
        this.currentMusic = null;

        if (fade) {
            this.fadeOut(musicToStop);
        } else {
            musicToStop.pause();
            musicToStop.currentTime = 0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic(false);
        } else {
            // Resume music if needed (optional logic)
        }
        return this.isMuted;
    }

    // --- Fade Effects ---
    fadeIn(audio) {
        let vol = 0;
        const interval = 50; // ms
        const step = this.volumes.music / (1000 / interval); // 1 second fade
        
        const fade = setInterval(() => {
            if (!audio || audio.paused) {
                clearInterval(fade);
                return;
            }
            vol += step;
            if (vol >= this.volumes.music) {
                vol = this.volumes.music;
                clearInterval(fade);
            }
            audio.volume = vol;
        }, interval);
    }

    fadeOut(audio) {
        let vol = audio.volume;
        const interval = 50;
        const step = vol / (500 / interval); // 0.5 second fade
        
        const fade = setInterval(() => {
            vol -= step;
            if (vol <= 0) {
                vol = 0;
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fade);
            } else {
                audio.volume = vol;
            }
        }, interval);
    }
}

// Create and export a single instance
export const audioManager = new AudioManager();