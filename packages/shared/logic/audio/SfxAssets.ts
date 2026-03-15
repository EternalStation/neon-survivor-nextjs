import { audioCtx } from './AudioBase';

export let shootBuffer: AudioBuffer | null = null;
export let laserBuffer: AudioBuffer | null = null;
export let iceBuffer: AudioBuffer | null = null;
export let ghostBuffer: AudioBuffer | null = null;
export let alertBuffer: AudioBuffer | null = null;
export let shipDepartureBuffer: AudioBuffer | null = null;
export let robotVoiceBuffer: AudioBuffer | null = null;
export let transitionBuffer: AudioBuffer | null = null;

export async function loadSfxAssets() {
    if (!audioCtx) return;

    if (!ghostBuffer) {
        try {
            const response = await fetch('/assets/audio/Ghost.mp3');
            const arrayBuffer = await response.arrayBuffer();
            ghostBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
    if (!shootBuffer) {
        try {
            const response = await fetch('/assets/audio/PleasantNeonDing.wav');
            const arrayBuffer = await response.arrayBuffer();
            shootBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
    if (!laserBuffer) {
        try {
            const response = await fetch('/assets/audio/Laser.flac');
            const arrayBuffer = await response.arrayBuffer();
            laserBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
    if (!iceBuffer) {
        try {
            const response = await fetch('/assets/audio/DefEpi.wav');
            const arrayBuffer = await response.arrayBuffer();
            iceBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
    if (!alertBuffer) {
        try {
            const response = await fetch('/assets/audio/Alert.mp3');
            const arrayBuffer = await response.arrayBuffer();
            alertBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
    if (!shipDepartureBuffer) {
        try {
            const response = await fetch('/assets/audio/ShipDeparture.mp3');
            const arrayBuffer = await response.arrayBuffer();
            shipDepartureBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
    if (!robotVoiceBuffer) {
        try {
            const response = await fetch('/assets/audio/RobotVoice.mp3');
            const arrayBuffer = await response.arrayBuffer();
            robotVoiceBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
    if (!transitionBuffer) {
        try {
            const response = await fetch('/assets/audio/Transition.mp3');
            const arrayBuffer = await response.arrayBuffer();
            transitionBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) { }
    }
}
