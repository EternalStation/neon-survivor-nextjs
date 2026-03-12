# Boss Stages

Protocol for high-tier boss encounters featuring threshold-based state transitions and adaptive difficulty scaling.

## Mechanism

All bosses (Circle, Square, Triangle, Diamond, Pentagon, and Abomination) utilize a unified 3-stage progression system based on Health Point thresholds.

### Stage Thresholds

- **Stage 1**: 100% - 66% HP. Standard behavior and skill cooldowns.
- **Stage 2**: 66% - 33% HP. Triggered when HP drops below 66%.
- **Stage 3**: 33% - 0% HP. Triggered when HP drops below 33%.

## Stage Transitions

When a boss crosses a health threshold (66% or 33%), it immediately enters a **Stage Transition Phase**:

1.  **Invulnerability**: The boss becomes immune to all damage for 1.0 seconds.
2.  **Visual Pulse**: Triggers an intense visual pulse and shockwave particles.
3.  **Auditory Cue**: Plays a distinct resonance sound.

## Adaptive Difficulty

As a boss enters higher stages, its threat level increases through skill optimization:

- **Skill Cooldowns**: Most skill cooldowns are reduced by 25% in Stage 2 and up to 50% in Stage 3.
- **Intensity**: Specific skills may fire more projectiles or cover larger areas (e.g., Diamond Boss Satellite Strike count increases).
- **Core Pulse**: The boss's visual pulse frequency increases proportional to its current stage, signaling its heightened state of aggression.
