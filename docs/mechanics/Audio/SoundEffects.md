# Sound Effects
Sound Effects (SFX) provide tactile feedback for combat, interactions, and system events. The system is designed for high-performance audio synthesis and sample playback.

## Audio Engine
- **Synthesis**: Real-time WebAudio oscillators for dynamic tones (pulses, sweeps, alarms).
- **Samples**: Pre-loaded high-fidelity buffers for complex mechanical sounds.
- **Modulation**: Exponential ramps and LFO-driven frequency shifts for organic "neon tech" textures.

## Asset Management
Secondary SFX assets are pre-loaded via the `SfxAssets` module to ensure zero-latency playback upon first trigger.
- **Combat**: Pleasantly synthesized "neon dings" for projectile firing.
- **Systems**: Diagnostic alerts, portal ambience, and ship departure sequences.
- **Rarity**: Tier-specific audio cues for upgrade selection (Ancient/Divine tiers feature multi-layered chord synthesis).

## Spatialization & Ducking
While current implementation is globally balanced, the engine supports volume ducking during cinematic transitions or critical alert protocols.
