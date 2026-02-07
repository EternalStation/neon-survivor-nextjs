import {
    audioCtx,
    getMusicVolume,
    getSfxVolume,
    setMusicVolume as setBaseMusicVolume,
    setSfxVolume as setBaseSfxVolume,
    getSfxGain,
    initMasterGains,
    masterMusicGain
} from './AudioBase';
import { loadSfxAssets } from './SfxLogic';

export { audioCtx, getMusicVolume, getSfxVolume, getSfxGain };

// Audio State
let isBgmPlaying = false;
let savedMusicVolume = 0.425; // For restoring after ducking

// Simple BGM System - Single looping track
let bgmBuffer: AudioBuffer | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGain: GainNode | null = null;

// Caching System
const audioCache = new Map<string, AudioBuffer>();

// Boss Ambience System
let bossAmbienceOsc: OscillatorNode | null = null;
let bossAmbienceGain: GainNode | null = null;
let isBossAmbiencePlaying = false;

const BGM_TRACKS: Record<number | string, string> = {
    'menu': '/Background.mp3',                    // Now contains 'Economic' music physically
    0: '/audio/EconomicArenaBackground.mp3',      // Now contains 'Menu' music physically
    1: '/audio/CombatArenaBackground.mp3',
    2: '/audio/DefensiveArenaBackgound.mp3',
    'evacuation': '/audio/Evacuation.mp3'
};

let currentTrackId: number | string | null = null;

export function setMusicVolume(vol: number) {
    setBaseMusicVolume(vol);
    savedMusicVolume = vol;
    // Update live volume if not currently fading/ducked
    if (bgmGain && audioCtx && isBgmPlaying) {
        // We use setTargetAtTime for smoother volume changes
        bgmGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
    }
}

export function setSfxVolume(vol: number) {
    setBaseSfxVolume(vol);
}

// Duck volume by 15% for stats menu / matrix
export function duckMusic() {
    const duckedVolume = savedMusicVolume * 0.85; // 15% reduction
    if (bgmGain && audioCtx) {
        bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
        bgmGain.gain.linearRampToValueAtTime(duckedVolume, audioCtx.currentTime + 0.1);
    }
}

// Restore volume to previous setting
export function restoreMusic() {
    if (bgmGain && audioCtx) {
        bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
        bgmGain.gain.linearRampToValueAtTime(savedMusicVolume, audioCtx.currentTime + 0.1);
    }
}

// Pause music (for ESC menu)
export function pauseMusic() {
    if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
    }
}

// Resume music (from ESC menu)
export function resumeMusic() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Preload all music tracks
export async function preloadMusic() {
    if (!audioCtx) return;

    const tracks = Object.values(BGM_TRACKS);
    console.log("Preloading Audio Assets...", tracks);

    const loadPromises = tracks.map(async (url) => {
        if (audioCache.has(url)) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const decodedBuffer = await audioCtx!.decodeAudioData(arrayBuffer);
            audioCache.set(url, decodedBuffer);
        } catch (e) {
            console.error(`Failed to preload ${url}:`, e);
        }
    });

    await Promise.all(loadPromises);
    console.log("Audio Assets Preloaded.");
}

export async function startBGM(arenaId: number | string = 0) {
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => { });
    }

    // Init Master Gains if needed
    initMasterGains();

    isBgmPlaying = true;
    // 7s fade in for initial start as requested by user
    await switchBGM(arenaId, 7.0);

    // Load SFX Assets
    await loadSfxAssets();
}

export function startMenuMusic() {
    // Menu music standard fade (Reverted per user request)
    startBGMWrapped('menu', 2.0);
}

async function startBGMWrapped(trackId: number | string, fadeDuration: number) {
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => { });
    }
    initMasterGains();
    isBgmPlaying = true;
    await switchBGM(trackId, fadeDuration);
    await loadSfxAssets();
}


// Fade out current music manually (for portal transition)
export function fadeOutMusic(duration: number = 0.5) {
    if (bgmGain && audioCtx && audioCtx.state === 'running') {
        // Cancel any pending scheduled changes
        bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
        bgmGain.gain.setValueAtTime(bgmGain.gain.value, audioCtx.currentTime);

        if (duration <= 0.1) {
            bgmGain.gain.setValueAtTime(0, audioCtx.currentTime + 0.05);
        } else {
            bgmGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
        }

        // Stop the source after fade
        const s = bgmSource;
        const ms = duration * 1000 + 50;
        setTimeout(() => {
            if (s === bgmSource && s) {
                try { s.stop(); } catch (e) { }
                bgmSource = null;
                isBgmPlaying = false;
            }
        }, ms);
    }
}

export async function switchBGM(arenaId: number | string, fadeInDuration: number = 0.5) {
    if (currentTrackId === arenaId && bgmSource && isBgmPlaying) return;

    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => { });
    }

    // Ensure BGM system is flagged active so playBgmLoop can run
    isBgmPlaying = true;

    if (bgmSource) {
        // Quick fade out old one first to avoid popping
        const fadeOutTime = 0.5;
        if (bgmGain && audioCtx && bgmGain.gain.value > 0.01) {
            bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
            bgmGain.gain.setValueAtTime(bgmGain.gain.value, audioCtx.currentTime);
            bgmGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeOutTime);

            const oldSource = bgmSource;
            setTimeout(() => {
                try { oldSource.stop(); } catch (e) { }
            }, fadeOutTime * 1000 + 100);
        } else {
            try { bgmSource.stop(); } catch (e) { }
        }
    }

    currentTrackId = arenaId;
    const trackUrl = BGM_TRACKS[arenaId] || BGM_TRACKS[0];

    // GET FROM CACHE OR LOAD
    if (audioCtx) {
        let buffer = audioCache.get(trackUrl);
        if (!buffer) {
            try {
                const response = await fetch(trackUrl);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await audioCtx.decodeAudioData(arrayBuffer);
                audioCache.set(trackUrl, buffer);
            } catch (e) {
                console.error(`Failed to load BGM track ${trackUrl}:`, e);
                return;
            }
        }
        bgmBuffer = buffer;
        playBgmLoop(fadeInDuration);
    }
}

function playBgmLoop(fadeInDuration: number = 0.5) {
    if (!bgmBuffer || !isBgmPlaying || !audioCtx) return;

    // Safety check if source already running (race conditions)
    if (bgmSource) {
        try { bgmSource.stop(); } catch (e) { }
    }

    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = bgmBuffer;
    bgmSource.loop = true; // Seamless loop per user preference/standard

    bgmGain = audioCtx.createGain();

    // Handle Fade In
    bgmGain.gain.value = 0;
    bgmGain.gain.setValueAtTime(0, audioCtx.currentTime);

    // Ramp to protected saved volume
    bgmGain.gain.linearRampToValueAtTime(savedMusicVolume, audioCtx.currentTime + fadeInDuration);

    if (!masterMusicGain) return;
    bgmSource.connect(bgmGain);
    bgmGain.connect(masterMusicGain as AudioNode);

    bgmSource.start(0);
}


// No longer needed - kept for compatibility
export function updateBGMPhase(_gameTime: number) {
    // Music just loops continuously, no phase changes
}

export function stopBGM() {
    isBgmPlaying = false;
    currentTrackId = null;
    if (bgmSource) {
        try { bgmSource.stop(); } catch (e) { }
        bgmSource = null;
    }
}

export function startBossAmbience() {
    if (!audioCtx || isBossAmbiencePlaying) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }

    const masterSfxGainRef = getSfxGain();
    if (!masterSfxGainRef) return;

    isBossAmbiencePlaying = true;
    const t = audioCtx.currentTime;

    bossAmbienceOsc = audioCtx.createOscillator();
    bossAmbienceGain = audioCtx.createGain();

    bossAmbienceOsc.type = 'sawtooth';
    bossAmbienceOsc.frequency.setValueAtTime(55, t);

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.5;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(bossAmbienceOsc.frequency);
    lfo.start(t);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    bossAmbienceGain.gain.setValueAtTime(0, t);
    bossAmbienceGain.gain.linearRampToValueAtTime(0.3, t + 2.0);

    bossAmbienceOsc.connect(filter);
    filter.connect(bossAmbienceGain);
    bossAmbienceGain.connect(masterSfxGainRef as AudioNode);

    bossAmbienceOsc.start(t);
}

export function stopBossAmbience() {
    if (!audioCtx || !isBossAmbiencePlaying || !bossAmbienceGain) return;

    isBossAmbiencePlaying = false;
    const t = audioCtx.currentTime;

    bossAmbienceGain.gain.cancelScheduledValues(t);
    bossAmbienceGain.gain.setValueAtTime(bossAmbienceGain.gain.value, t);
    bossAmbienceGain.gain.linearRampToValueAtTime(0, t + 2.0);

    const oldOsc = bossAmbienceOsc;
    setTimeout(() => {
        if (oldOsc) {
            try { oldOsc.stop(); } catch (e) { }
        }
    }, 2100);

    bossAmbienceOsc = null;
    bossAmbienceGain = null;
}

// Portal Ambience System
let portalAmbienceOscs: OscillatorNode[] = [];
let portalAmbienceGain: GainNode | null = null;
let isPortalAmbiencePlaying = false;

export function startPortalAmbience() {
    if (!audioCtx || isPortalAmbiencePlaying) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }

    const masterSfxGainRef = getSfxGain();
    if (!masterSfxGainRef) return;

    isPortalAmbiencePlaying = true;
    const t = audioCtx.currentTime;

    portalAmbienceGain = audioCtx.createGain();
    portalAmbienceGain.gain.value = 0;
    portalAmbienceGain.gain.linearRampToValueAtTime(0.2, t + 1.0);
    portalAmbienceGain.connect(masterSfxGainRef as AudioNode);

    const freqs = [880, 1108, 1320, 1760];
    portalAmbienceOscs = freqs.map((f, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;

        const lfo = audioCtx.createOscillator();
        lfo.frequency.value = 4 + Math.random() * 2;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 15;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);
        lfo.start(t);

        const oscGain = audioCtx.createGain();
        oscGain.gain.value = 1 / freqs.length;
        osc.connect(oscGain);
        oscGain.connect(portalAmbienceGain!);
        osc.start(t);
        return osc;
    });
}

export function stopPortalAmbience() {
    if (!audioCtx || !isPortalAmbiencePlaying || !portalAmbienceGain) return;

    isPortalAmbiencePlaying = false;
    const t = audioCtx.currentTime;

    portalAmbienceGain.gain.cancelScheduledValues(t);
    portalAmbienceGain.gain.setValueAtTime(portalAmbienceGain.gain.value, t);
    portalAmbienceGain.gain.linearRampToValueAtTime(0, t + 0.5);

    setTimeout(() => {
        portalAmbienceOscs.forEach(o => {
            try { o.stop(); } catch (e) { }
        });
        portalAmbienceOscs = [];
    }, 600);
}

export function stopAllLoops() {
    stopBossAmbience();
    stopPortalAmbience();
}

export { playShootDing, playUpgradeSfx, playSfx } from './SfxLogic';
export type { SfxType } from './SfxLogic';
