// AudioBase.ts - SSR Safe version
export let audioCtx: AudioContext;

if (typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
}

// Shared State
let musicVolume = 0.425;
let sfxVolume = 0.5;
export let masterMusicGain: GainNode | null = null;
export let masterSfxGain: GainNode | null = null;

export const getMusicVolume = () => musicVolume;
export const getSfxVolume = () => sfxVolume;

export function setMusicVolume(vol: number) {
    musicVolume = Math.max(0, Math.min(1, vol));
    if (masterMusicGain && audioCtx) {
        masterMusicGain.gain.setValueAtTime(musicVolume, audioCtx.currentTime);
    }
}

export function setSfxVolume(vol: number) {
    sfxVolume = Math.max(0, Math.min(1, vol));
    if (masterSfxGain && audioCtx) {
        masterSfxGain.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
    }
}

export function initMasterGains() {
    if (!audioCtx) return;
    if (!masterMusicGain) {
        masterMusicGain = audioCtx.createGain();
        masterMusicGain.gain.value = musicVolume;
        masterMusicGain.connect(audioCtx.destination);
    }
    if (!masterSfxGain) {
        masterSfxGain = audioCtx.createGain();
        masterSfxGain.gain.value = sfxVolume;
        masterSfxGain.connect(audioCtx.destination);
    }
}

export function getSfxGain(): GainNode | null {
    if (!audioCtx) return null;
    if (!masterSfxGain) {
        masterSfxGain = audioCtx.createGain();
        masterSfxGain.gain.value = sfxVolume;
        masterSfxGain.connect(audioCtx.destination);
    }
    return masterSfxGain;
}

export function getMusicGain(): GainNode | null {
    if (!audioCtx) return null;
    if (!masterMusicGain) {
        masterMusicGain = audioCtx.createGain();
        masterMusicGain.gain.value = musicVolume;
        masterMusicGain.connect(audioCtx.destination);
    }
    return masterMusicGain;
}
