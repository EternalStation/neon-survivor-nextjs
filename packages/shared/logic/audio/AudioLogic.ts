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
import { loadSfxAssets } from './SfxAssets';

export { audioCtx, getMusicVolume, getSfxVolume, getSfxGain };

let isBgmPlaying = false;
let isPaused = false;
let savedMusicVolume = 0.425;

let bgmBuffer: AudioBuffer | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGain: GainNode | null = null;

let menuSource: AudioBufferSourceNode | null = null;
let menuGain: GainNode | null = null;
let isMenuMusicPlaying = false;

const audioCache = new Map<string, AudioBuffer>();

let bossAmbienceOsc: OscillatorNode | null = null;
let bossAmbienceGain: GainNode | null = null;
let isBossAmbiencePlaying = false;
let playbackSessionId = 0;

export const BPM_FOLDERS = ['80BPM', '100BPM', '120BPM', '140BPM', '160BPM'];

export const INITIAL_TRACKS: Record<string, string[]> = {
    '80BPM': [
        '/assets/audio/80BPM/Crush Protocol 80 BPM.mp3',
        '/assets/audio/80BPM/Grinding In The Grid 80BPM.mp3',
        '/assets/audio/80BPM/Rain on Chrome 80BPM.mp3',
        '/assets/audio/80BPM/Violet Datastream 80BPM.mp3',
        '/assets/audio/80BPM/Violet Datastream v2 80BPM .mp3'
    ],
    '100BPM': [
        '/assets/audio/100BPM/Defensive Arena 100PBM.mp3',
        '/assets/audio/100BPM/Event Horizon Hymn 100BPM.mp3',
        '/assets/audio/100BPM/Iron Cathedral 100BPM.mp3'
    ],
    '120BPM': [
        '/assets/audio/120BPM/Economic Arena 120BPM.mp3'
    ],
    '140BPM': [
        '/assets/audio/140BPM/Combat Arena 140BPM.mp3',
        '/assets/audio/140BPM/Neon Blood Circuit 140BPM.mp3'
    ],
    '160BPM': [
        '/assets/audio/160BPM/Digital Siege Protocol 160BPM.mp3'
    ],
};

let currentBpmFolder = '120BPM';
let currentPlaylist: string[] = [];
let currentIndex = 0;
let likedTracks: Set<string> = new Set();
let isLikedOnlyMode = false;

let trackStartTime = 0;
let trackOffset = 0;
let trackDuration = 0;

const LIKED_STORAGE_KEY = 'neon_survivor_liked_tracks';

function loadLikedTracks() {
    if (typeof window === 'undefined') return;
    try {
        const stored = localStorage.getItem(LIKED_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                likedTracks = new Set(parsed);
            }
        }
    } catch (e) { }
}

function saveLikedTracks() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(Array.from(likedTracks)));
    } catch (e) { }
}

loadLikedTracks();

export function setMusicVolume(vol: number) {
    setBaseMusicVolume(vol);
    savedMusicVolume = vol;
    if (bgmGain && audioCtx && isBgmPlaying) {
        bgmGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
    }
    if (menuGain && audioCtx && isMenuMusicPlaying) {
        menuGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
    }
}

export function setSfxVolume(vol: number) {
    setBaseSfxVolume(vol);
}

export function duckMusic() {
    const duckedVolume = savedMusicVolume * 0.85;
    if (bgmGain && audioCtx) {
        bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
        bgmGain.gain.linearRampToValueAtTime(duckedVolume, audioCtx.currentTime + 0.1);
    }
}

export function restoreMusic() {
    if (bgmGain && audioCtx) {
        bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
        bgmGain.gain.linearRampToValueAtTime(savedMusicVolume, audioCtx.currentTime + 0.1);
    }
}

export function pauseMusic() {
    if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
    }
}

export function resumeMusic() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function toggleBGM() {
    if (!isBgmPlaying) return;
    isPaused = !isPaused;
    if (isPaused) {
        if (bgmSource) {
            try { bgmSource.stop(); } catch (e) { }
            bgmSource = null;
        }
    } else {
        playCurrentTrack(trackOffset + (audioCtx ? audioCtx.currentTime - trackStartTime : 0));
    }
}

export async function preloadMusic() {
    if (!audioCtx) return;
    const allTracks = Object.values(INITIAL_TRACKS).flat();
    allTracks.push('/Background.mp3');

    for (const url of allTracks) {
        if (audioCache.has(url)) continue;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            audioCache.set(url, decodedBuffer);
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) { }
    }
    await loadSfxAssets();
}

export async function startBGM() {
    stopMenuMusic();
    if (isBgmPlaying) return;
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => { });
    }
    initMasterGains();
    isBgmPlaying = true;
    isPaused = false;

    updatePlaylist();
    await playCurrentTrack();
    await loadSfxAssets();
}

export async function startMenuMusic() {
    if (isMenuMusicPlaying) return;
    stopBGM();
    
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
    }
    initMasterGains();
    isMenuMusicPlaying = true;

    const menuUrl = '/Background.mp3';
    let buffer = audioCache.get(menuUrl);
    
    if (!buffer && audioCtx) {
        try {
            const response = await fetch(menuUrl);
            const arrayBuffer = await response.arrayBuffer();
            buffer = await audioCtx.decodeAudioData(arrayBuffer);
            audioCache.set(menuUrl, buffer);
        } catch (e) {
            isMenuMusicPlaying = false;
            return;
        }
    }

    if (!buffer || !audioCtx || !masterMusicGain) return;

    menuSource = audioCtx.createBufferSource();
    menuSource.buffer = buffer;
    menuSource.loop = true;

    menuGain = audioCtx.createGain();
    menuGain.gain.value = savedMusicVolume;

    menuSource.connect(menuGain);
    menuGain.connect(masterMusicGain);

    menuSource.start(0);
}

export function stopMenuMusic() {
    isMenuMusicPlaying = false;
    if (menuSource) {
        try { menuSource.stop(); } catch (e) {}
        menuSource = null;
    }
}

function updatePlaylist() {
    const tracks = INITIAL_TRACKS[currentBpmFolder] || [];
    if (isLikedOnlyMode) {
        currentPlaylist = tracks.filter(t => likedTracks.has(t));
    } else {
        currentPlaylist = tracks;
    }

    if (currentPlaylist.length === 0 && !isLikedOnlyMode) {
        currentPlaylist = ['/Background.mp3'];
    }

    currentIndex = 0;
}

async function playCurrentTrack(offset = 0) {
    if (!audioCtx) return;

    if (bgmSource) {
        try { bgmSource.stop(); } catch (e) { }
        bgmSource = null;
    }

    if (isMenuMusicPlaying) {
        stopMenuMusic();
        isBgmPlaying = true;
    }

    if (!isBgmPlaying) return;
    
    isPaused = false;

    playbackSessionId++;
    const currentSessionId = playbackSessionId;

    const trackUrl = currentPlaylist[currentIndex];
    if (!trackUrl) {
        trackDuration = 0;
        trackOffset = 0;
        return;
    }

    let buffer = audioCache.get(trackUrl);
    if (!buffer) {
        try {
            const response = await fetch(trackUrl);
            const arrayBuffer = await response.arrayBuffer();
            buffer = await audioCtx.decodeAudioData(arrayBuffer);
            audioCache.set(trackUrl, buffer);
        } catch (e) {
            return;
        }
    }

    if (currentSessionId !== playbackSessionId) return;

    bgmBuffer = buffer;
    trackDuration = buffer.duration;
    trackOffset = offset;
    trackStartTime = audioCtx.currentTime;

    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = buffer;

    bgmSource.onended = () => {
        if (isBgmPlaying && audioCtx && Math.abs((audioCtx.currentTime - trackStartTime) + trackOffset - trackDuration) < 0.2) {
            skipTrack(1);
        }
    };

    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = savedMusicVolume;

    if (!masterMusicGain) return;
    bgmSource.connect(bgmGain);
    bgmGain.connect(masterMusicGain);

    bgmSource.start(0, offset);
}

export function skipTrack(direction: number = 1) {
    if (currentPlaylist.length === 0) return;
    currentIndex = (currentIndex + direction + currentPlaylist.length) % currentPlaylist.length;
    playCurrentTrack();
}

export function setBpmFolder(folder: string) {
    if (currentBpmFolder === folder) return;
    currentBpmFolder = folder;
    updatePlaylist();
    playCurrentTrack();
}

export function playTrackByIndex(index: number) {
    if (index < 0 || index >= currentPlaylist.length) return;
    currentIndex = index;
    playCurrentTrack();
}

export function toggleLikedOnly(enabled: boolean) {
    isLikedOnlyMode = enabled;
    updatePlaylist();
    playCurrentTrack();
}

export function toggleLikeCurrent() {
    const trackUrl = currentPlaylist[currentIndex];
    if (!trackUrl) return;
    if (likedTracks.has(trackUrl)) {
        likedTracks.delete(trackUrl);
    } else {
        likedTracks.add(trackUrl);
    }
    saveLikedTracks();
}

export function getPlaybackInfo() {
    const trackUrl = currentPlaylist[currentIndex] || '';
    const title = trackUrl.split('/').pop()?.replace('.mp3', '').replace('.wav', '') || 'No Track';
    const elapsed = isBgmPlaying && audioCtx ? (audioCtx.currentTime - trackStartTime) + trackOffset : 0;

    return {
        title,
        url: trackUrl,
        folder: currentBpmFolder,
        elapsed,
        duration: trackDuration,
        isLiked: likedTracks.has(trackUrl),
        isLikedOnly: isLikedOnlyMode,
        isPaused,
        bpmFolders: BPM_FOLDERS,
        playlist: currentPlaylist.map(t => ({
            url: t,
            title: t.split('/').pop()?.replace('.mp3', '').replace('.wav', '') || 'Track',
            isLiked: likedTracks.has(t)
        })),
        currentIndex
    };
}

export function stopBGM() {
    isBgmPlaying = false;
    if (bgmSource) {
        try { bgmSource.stop(); } catch (e) { }
        bgmSource = null;
    }
}

export function startBossAmbience() {
    if (!audioCtx || isBossAmbiencePlaying) return;
    const masterSfxGainRef = getSfxGain();
    if (!masterSfxGainRef) return;
    isBossAmbiencePlaying = true;
    const t = audioCtx.currentTime;
    bossAmbienceOsc = audioCtx.createOscillator();
    bossAmbienceGain = audioCtx.createGain();
    bossAmbienceOsc.type = 'sawtooth';
    bossAmbienceOsc.frequency.setValueAtTime(55, t);
    bossAmbienceOsc.frequency.linearRampToValueAtTime(110, t + 10.0);
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
    bossAmbienceGain.gain.linearRampToValueAtTime(0.2, t + 1.0);
    bossAmbienceOsc.connect(filter);
    filter.connect(bossAmbienceGain);
    bossAmbienceGain.connect(masterSfxGainRef);
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

let portalAmbienceOscs: OscillatorNode[] = [];
let portalAmbienceGain: GainNode | null = null;
let isPortalAmbiencePlaying = false;

export function startPortalAmbience() {
    if (!audioCtx || isPortalAmbiencePlaying) return;
    const masterSfxGainRef = getSfxGain();
    if (!masterSfxGainRef) return;
    isPortalAmbiencePlaying = true;
    const t = audioCtx.currentTime;
    portalAmbienceGain = audioCtx.createGain();
    portalAmbienceGain.gain.value = 0;
    portalAmbienceGain.gain.linearRampToValueAtTime(0.2, t + 1.0);
    portalAmbienceGain.connect(masterSfxGainRef);
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
