import { audioCtx, getSfxVolume, getSfxGain } from './AudioBase';

// Shoot System
let shootBuffer: AudioBuffer | null = null;
let laserBuffer: AudioBuffer | null = null;
let iceBuffer: AudioBuffer | null = null;

// Ghost System
let ghostBuffer: AudioBuffer | null = null;
let alertBuffer: AudioBuffer | null = null;
let shipDepartureBuffer: AudioBuffer | null = null;

export async function loadSfxAssets() {
    if (!audioCtx) return;

    if (!ghostBuffer) {
        try {
            const response = await fetch('/audio/Ghost.mp3');
            const arrayBuffer = await response.arrayBuffer();
            ghostBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Failed to load ghost sfx:`, e);
        }
    }
    if (!shootBuffer) {
        try {
            const response = await fetch('/audio/pleasant_neon_ding.wav');
            const arrayBuffer = await response.arrayBuffer();
            shootBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Failed to load shoot ding:`, e);
        }
    }

    if (!laserBuffer) {
        try {
            const response = await fetch('/audio/Laser.flac'); // User provided file
            const arrayBuffer = await response.arrayBuffer();
            laserBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Failed to load laser sfx:`, e);
        }
    }

    if (!iceBuffer) {
        try {
            const response = await fetch('/audio/DefEpi.wav'); // Ice Sound
            const arrayBuffer = await response.arrayBuffer();
            iceBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Failed to load ice sfx:`, e);
        }
    }

    if (!alertBuffer) {
        try {
            const response = await fetch('/audio/Alert.mp3');
            const arrayBuffer = await response.arrayBuffer();
            alertBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Failed to load alert sfx:`, e);
        }
    }

    if (!shipDepartureBuffer) {
        try {
            const response = await fetch('/audio/ShipDeparture.mp3');
            const arrayBuffer = await response.arrayBuffer();
            shipDepartureBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Failed to load ship departure sfx:`, e);
        }
    }
}

export function playShootDing() {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const t = audioCtx.currentTime;
    const sfxVolume = getSfxVolume();
    const masterSfxGain = getSfxGain();
    if (!masterSfxGain) return;

    // "Cosmic Photon" - Sci-fi, laser-like, but smooth
    // Lowered pitch variant (Octave down)

    // 1. The Core Beam (Sine Sweep)
    const osc1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    osc1.type = 'sine';
    // Start mid, drop low
    osc1.frequency.setValueAtTime(750, t);
    osc1.frequency.exponentialRampToValueAtTime(150, t + 0.15);

    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(sfxVolume * 0.25, t + 0.01);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc1.connect(g1);
    g1.connect(masterSfxGain as AudioNode);
    osc1.start(t);
    osc1.stop(t + 0.15);

    // 2. The Energy Trail (Triangle Detune)
    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(760, t); // Slight detune start
    osc2.frequency.exponentialRampToValueAtTime(300, t + 0.2); // Slower drop

    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(sfxVolume * 0.15, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc2.connect(g2);
    g2.connect(masterSfxGain as AudioNode);
    osc2.start(t);
    osc2.stop(t + 0.2);
}

export async function playUpgradeSfx(rarityId: string) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const masterSfxGain = getSfxGain();
    if (!masterSfxGain) return;

    console.log(`[Audio] Selection SFX: ${rarityId} (Context: ${audioCtx.state})`);
    const t = audioCtx.currentTime + 0.05; // 50ms scheduling buffer
    const tone = (freq: number, type: OscillatorType, dur: number, vol: number, startTime: number) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(vol, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        osc.connect(g); g.connect(masterSfxGain as AudioNode);
        osc.start(startTime); osc.stop(startTime + dur);
    };

    // Rarity frequency map
    const rarityMap: Record<string, number> = {
        'junk': 110,
        'broken': 146.83,
        'common': 220,
        'uncommon': 293.66,
        'rare': 440,
        'epic': 587.33,
        'legendary': 880,
        'mythical': 1174.66,
        'ancient': 1760,
        'divine': 220 // Base for divine chord
    };

    const baseFreq = rarityMap[rarityId] || 440;

    if (rarityId === 'divine') {
        // Massive Divine Impact
        const chord = [55, 110, 220, 330, 440, 554, 659, 880, 1320]; // Rich A major stack
        chord.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = i < 3 ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(f, t);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, t);
            filter.frequency.exponentialRampToValueAtTime(100, t + 2.0);

            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.2, t + 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

            osc.connect(filter);
            filter.connect(g);
            g.connect(masterSfxGain as AudioNode);
            osc.start(t);
            osc.stop(t + 4.0);
        });

        // Divine "Aaaa" Choir Formants stack
        [600, 1040, 2250, 2450].forEach(f => {
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            const g = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220 + Math.random() * 2, t);
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(f, t);
            filter.Q.value = 10;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.1, t + 0.5);
            g.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
            osc.connect(filter); filter.connect(g); g.connect(masterSfxGain as AudioNode);
            osc.start(t); osc.stop(t + 3.5);
        });

    } else {
        // Universal Indexed Pluck
        const isLow = ['junk', 'broken', 'common'].includes(rarityId);
        const type = isLow ? 'sawtooth' : 'triangle';
        const decay = isLow ? 0.4 : 1.0;
        const volume = isLow ? 0.15 : 0.25;

        // Main Pluck
        tone(baseFreq, type, decay, volume, t);

        // Harmonic / Octave
        if (!isLow) {
            tone(baseFreq * 2, 'sine', decay * 1.5, volume * 0.5, t + 0.05);
            tone(baseFreq * 1.5, 'sine', decay * 1.2, volume * 0.3, t + 0.1);
        } else {
            // "Dirty" subtle noise for junk/broken
            tone(baseFreq * 0.5, 'sawtooth', 0.2, 0.05, t);
        }
    }
}

export type SfxType = 'shoot' | 'laser' | 'ice-loop' | 'level' | 'rare-spawn' | 'rare-kill' | 'rare-despawn' | 'spawn' | 'smoke-puff' | 'wall-shock' | 'merge-start' | 'merge-complete' | 'stun-disrupt' | 'warning' | 'recycle' | 'socket-place' | 'impact' | 'sonic-wave' | 'zombie-rise' | 'lock-on' | 'ghost-horde' | 'zombie-consume' | 'alert' | 'ship-departure';

export function playSfx(type: SfxType) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
        return;
    }

    const sfxVolume = getSfxVolume();
    const masterSfxGain = getSfxGain();
    if (!masterSfxGain) return;
    const t = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g);
    g.connect(masterSfxGain as AudioNode);

    if (type === 'lock-on') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.05);
        g.gain.setValueAtTime(0.15 * sfxVolume, t);
        g.gain.linearRampToValueAtTime(0, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
        return;
    }

    if (type === 'alert') {
        if (alertBuffer) {
            // Play 2 times with a slight gap
            const playOnce = (delay: number) => {
                const source = audioCtx.createBufferSource();
                source.buffer = alertBuffer;
                source.connect(masterSfxGain as AudioNode);
                source.start(t + delay);
            };
            playOnce(0);
            playOnce(0.8); // 0.8s later
        }
        return;
    }

    if (type === 'ship-departure') {
        if (shipDepartureBuffer) {
            const source = audioCtx.createBufferSource();
            source.buffer = shipDepartureBuffer;
            source.connect(masterSfxGain as AudioNode);
            source.start(t);
        }
        return;
    }

    if (type === 'shoot') {
        playShootDing();
        return;
    }
    else if (type === 'laser') {
        if (laserBuffer) {
            const source = audioCtx.createBufferSource();
            source.buffer = laserBuffer;
            source.connect(masterSfxGain as AudioNode);
            // Play only the first 1 second
            source.start(t, 0, 1.0);
        }
        return;
    }
    else if (type === 'ice-loop') {
        if (iceBuffer) {
            const source = audioCtx.createBufferSource();
            source.buffer = iceBuffer;
            source.connect(masterSfxGain as AudioNode);
            source.loop = true;

            // Randomize Pitch/Rate so multiple layers sound distinct (0.8x to 1.2x)
            const randomRate = 0.8 + Math.random() * 0.4;
            source.playbackRate.value = randomRate;

            // Play 1 second slice
            source.start(t, 0, 1.0);
        }
        return;
    }
    else if (type === 'level') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.linearRampToValueAtTime(880, t + 0.5);
        g.gain.setValueAtTime(0.1, t);
        osc.start(t);
        osc.stop(t + 0.5);
    }
    else if (type === 'impact') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
    }
    else if (type === 'rare-spawn') {
        // Alert Sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.1);
        osc.frequency.linearRampToValueAtTime(600, t + 0.2);
        g.gain.setValueAtTime(0.15, t); // Increased by 50% from 0.1
        g.gain.linearRampToValueAtTime(0, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
    }
    else if (type === 'rare-kill') {
        // Jackpot Sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1100, t + 0.1);
        osc.frequency.setValueAtTime(1320, t + 0.2);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.6);
    }
    else if (type === 'rare-despawn') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.5);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
    }
    else if (type === 'spawn') {
        // VOID Cosmic Collapse - "The Connection"

        // 1. Deep Sub-Bass Swell
        const osc1 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(40, t);
        osc1.frequency.linearRampToValueAtTime(60, t + 0.8);

        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.4, t + 0.2);
        g1.gain.linearRampToValueAtTime(0, t + 1.0);

        osc1.connect(g1);
        g1.connect(masterSfxGain as AudioNode);
        osc1.start(t);
        osc1.stop(t + 1.0);

        // 2. High Ethereal Sweep
        const osc2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        const filter2 = audioCtx.createBiquadFilter();

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, t);

        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(200, t);
        filter2.frequency.exponentialRampToValueAtTime(2000, t + 0.9);
        filter2.Q.value = 10;

        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.08, t + 0.5);
        g2.gain.linearRampToValueAtTime(0, t + 0.9);

        osc2.connect(filter2);
        filter2.connect(g2);
        g2.connect(masterSfxGain as AudioNode);
        osc2.start(t);
        osc2.stop(t + 1.0);

        // 3. The "Snap"
        const snapOsc = audioCtx.createOscillator();
        const snapGain = audioCtx.createGain();
        const snapFilter = audioCtx.createBiquadFilter();

        snapOsc.type = 'sawtooth';
        snapOsc.frequency.setValueAtTime(1200, t + 0.9);
        snapOsc.frequency.exponentialRampToValueAtTime(100, t + 1.0);

        snapFilter.type = 'highpass';
        snapFilter.frequency.value = 500;

        snapGain.gain.setValueAtTime(0, t + 0.9);
        snapGain.gain.linearRampToValueAtTime(0.3, t + 0.92);
        snapGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

        snapOsc.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(masterSfxGain as AudioNode);
        snapOsc.start(t + 0.9);
        snapOsc.stop(t + 1.2);
    }
    else if (type === 'smoke-puff') {
        const count = 5;
        for (let i = 0; i < count; i++) {
            const noiseOsc = audioCtx.createOscillator();
            const noiseGain = audioCtx.createGain();
            noiseOsc.type = 'sawtooth';
            noiseOsc.frequency.setValueAtTime(50 + Math.random() * 100, t);
            noiseOsc.frequency.exponentialRampToValueAtTime(10, t + 0.5);

            noiseGain.gain.setValueAtTime(0.05, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            noiseOsc.connect(noiseGain);
            noiseGain.connect(masterSfxGain as AudioNode);
            noiseOsc.start(t);
            noiseOsc.stop(t + 0.5);
        }
    }
    else if (type === 'wall-shock') {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        osc1.type = 'square';
        osc1.frequency.setValueAtTime(150, t);
        osc1.frequency.exponentialRampToValueAtTime(40, t + 0.2);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(158, t);
        osc2.frequency.exponentialRampToValueAtTime(45, t + 0.2);

        const noiseCount = 10;
        for (let i = 0; i < noiseCount; i++) {
            const noise = audioCtx.createOscillator();
            const ng = audioCtx.createGain();
            noise.type = 'square';
            noise.frequency.setValueAtTime(2000 + Math.random() * 3000, t);
            ng.gain.setValueAtTime(0.08 * sfxVolume, t);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            noise.connect(ng);
            ng.connect(masterSfxGain as AudioNode);
            noise.start(t);
            noise.stop(t + 0.05);
        }

        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4 * sfxVolume, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc1.connect(g);
        osc2.connect(g);
        g.connect(masterSfxGain as AudioNode);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.3);
        osc2.stop(t + 0.3);
    }
    else if (type === 'merge-start') {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(150, t + 0.5);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.2, t + 0.1);
        g.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.connect(g);
        g.connect(masterSfxGain as AudioNode);
        osc.start(t);
        osc.stop(t + 0.5);
    }
    else if (type === 'warning') {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            const startT = t + i * 0.4;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, startT);
            osc.frequency.exponentialRampToValueAtTime(440, startT + 0.2);
            g.gain.setValueAtTime(0, startT);
            g.gain.linearRampToValueAtTime(0.3 * sfxVolume, startT + 0.05);
            g.gain.linearRampToValueAtTime(0, startT + 0.3);
            osc.connect(g);
            g.connect(masterSfxGain as AudioNode);
            osc.start(startT);
            osc.stop(startT + 0.3);
        }
    }
    else if (type === 'merge-complete') {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.5);
        g.gain.setValueAtTime(0.1, t);
        g.gain.linearRampToValueAtTime(0, t + 0.6);
        osc.connect(g);
        g.connect(masterSfxGain as AudioNode);
        osc.start(t);
        osc.stop(t + 0.6);
    }
    else if (type === 'stun-disrupt') {
        const osc1 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, t);
        osc1.frequency.exponentialRampToValueAtTime(100, t + 0.5);
        g1.gain.setValueAtTime(0.2, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc1.connect(g1); g1.connect(masterSfxGain as AudioNode);
        osc1.start(t); osc1.stop(t + 0.5);

        const count = 5;
        for (let i = 0; i < count; i++) {
            const noise = audioCtx.createOscillator();
            const ng = audioCtx.createGain();
            noise.type = 'sawtooth';
            noise.frequency.setValueAtTime(50 + Math.random() * 200, t);
            ng.gain.setValueAtTime(0.05, t);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            noise.connect(ng); ng.connect(masterSfxGain as AudioNode);
            noise.start(t); noise.stop(t + 0.3);
        }
    }
    else if (type === 'recycle') {
        for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50 + Math.random() * 50, t);
            osc.frequency.linearRampToValueAtTime(20, t + 0.4);

            g.gain.setValueAtTime(0.1, t);
            g.gain.linearRampToValueAtTime(0, t + 0.4);

            osc.connect(g); g.connect(masterSfxGain as AudioNode);
            osc.start(t); osc.stop(t + 0.4);
        }

        for (let i = 0; i < 5; i++) {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200 + Math.random() * 800, t);
            g.gain.setValueAtTime(0.05, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            osc.connect(g); g.connect(masterSfxGain as AudioNode);
            osc.start(t + Math.random() * 0.1);
            osc.stop(t + 0.2);
        }
    }
    else if (type === 'socket-place') {
        const osc1 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(150, t);
        osc1.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        g1.gain.setValueAtTime(0.3, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc1.connect(g1); g1.connect(masterSfxGain as AudioNode);
        osc1.start(t); osc1.stop(t + 0.1);

        const osc2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, t);
        osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
        g2.gain.setValueAtTime(0.05, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc2.connect(g2); g2.connect(masterSfxGain as AudioNode);
        osc2.start(t); osc2.stop(t + 0.2);
    }
    else if (type === 'sonic-wave') {
        const osc1 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, t);
        osc1.frequency.exponentialRampToValueAtTime(100, t + 0.6);

        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.3 * sfxVolume, t + 0.05);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        const osc2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1200, t);
        osc2.frequency.linearRampToValueAtTime(880, t + 0.3);

        g2.gain.setValueAtTime(0.1 * sfxVolume, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc1.connect(g1); g1.connect(masterSfxGain as AudioNode);
        osc2.connect(g2); g2.connect(masterSfxGain as AudioNode);

        osc1.start(t); osc1.stop(t + 0.6);
        osc2.start(t); osc2.stop(t + 0.3);
    }
    else if (type === 'zombie-rise') {
        const base = 60 + Math.random() * 20;
        for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(base + i * 10, t);
            osc.frequency.linearRampToValueAtTime(base - 20, t + 0.8);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.15, t + 0.1);
            g.gain.linearRampToValueAtTime(0, t + 0.8);
            osc.connect(g); g.connect(masterSfxGain as AudioNode);
            osc.start(t); osc.stop(t + 0.8);
        }
    }
    else if (type === 'ghost-horde') {
        if (ghostBuffer) {
            const source = audioCtx.createBufferSource();
            source.buffer = ghostBuffer;
            source.connect(masterSfxGain as AudioNode);
            source.start(t);
        }
    }
    else if (type === 'zombie-consume') {
        playShootDing();
    }
}

export function playTypewriterClick() {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const t = audioCtx.currentTime;
    const sfxVolume = getSfxVolume();
    const masterSfxGain = getSfxGain();
    if (!masterSfxGain) return;

    // High pitched short click
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(3500 + Math.random() * 500, t);

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(sfxVolume * 0.05, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(g);
    g.connect(masterSfxGain as AudioNode);
    osc.start(t);
    osc.stop(t + 0.05);
}
