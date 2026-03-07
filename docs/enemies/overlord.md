# Overlord (Anomaly Boss) Mechanics

The Overlord is a massive, high-priority boss that spawns through infernal breaches. It is characterized by its overwhelming Heat Aura and phased evolution.

## 1. Physical Specifications
- **Name**: Overlord (Abomination)
- **Visual Scale**: 80% of original Abomination size (Reduced for better tactical visibility).
- **Movement Speed**: 84% of the player's base speed.
- **Particle System**: Surrounded by a high-intensity orbit of 180 particles.
- **Health Scaling**: Base HP scales significantly with mission time and "Anomaly Generation" (Boss level).

## 2. Core Ability: HEAT AURA (Infernal Combustion)
The Overlord emits a constant, lethal heat aura that damages anything in its vicinity.

- **Base Radius**: 390px + (10px * Boss Level).
- **Base Damage**: 5% of Player's Max HP per second + (1% * Boss Level).
- **Damage Frequency**: Ticks every **60 frames (1 second)**.
- **Attribution**: Damage is recorded as "Infernal Combustion" in the system logs.

## 3. Phased Evolution
As the Overlord's HP decreases, it enters more dangerous stages of existence.

### Phase 1: Dormant Entropy (>66% HP)
- Standard Heat Aura behavior.
- Passive movement towards the player.

### Phase 2: Active Decay (<= 60% HP)
- **Entropy Spread**: The aura radius begins to grow continuously from its current base by **5 pixels every second**.

### Phase 3: Total Meltdown (<= 30% HP)
- **Entropy Overload**: Aura damage grows dynamically from its current base by **0.5% of Player Max HP every second** the boss remains alive.
- **Rapid Reconstruction**: The Overlord harnesses local energy to heal for **1% of its Max HP every second**.

## 4. Summary Table

| Mechanic | Phase 1 | Phase 2 (<= 60%) | Phase 3 (<= 30%) |
| :--- | :--- | :--- | :--- |
| **Aura Radius** | Base | Base + (5px/s growth) | Base + (5px/s growth) |
| **Aura Damage** | Base | Base | Base + (0.5%/s growth) |
| **Regeneration** | 0% | 0% | 1% Max HP / second |
| **Visual Effects** | Standard | Phase Marker @ 60% | Phase Marker @ 30% |
