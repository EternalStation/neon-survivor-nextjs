# Feature: Orbital Vortex (Aigis Active Skill)

Implemented a new active skill for the **Aigis (Vortex)** class to enhance its thematic "magnetic field" combat style.

## Skill Specifications
- **Active Skill (E):** Orbital Vortex
  - **Cooldown:** 20s (Static)
  - **Recharge Delay:** 1s (Starts after skill duration ends)
  - **Duration:** 2s (Static)

## Mechanics
1. **Projectile Overdrive:**
   - All orbiting projectiles (including Rings) spin **400% faster** during the active duration.
   - Merged rings pulse with high-intensity golden energy.
2. **Uniform Rotation Physics:**
   - **Fixed Cycle Time:** At base strength (1% in UI / 1.0), enemies hit by the vortex complete exactly **0.2 circles** in the 2-second duration.
   - **Logarithmic Scaling:** Spin speed scales logarithmically according to the formula: **$0.2 + 0.32 \cdot \ln(Strength)$**.
   - **Growth Examples:** 
     - **1% Strength (1.0):** 0.2 circles in 2s.
     - **10% Strength (10.0):** ~0.94 circles in 2s (~0.47 circles per second).
     - **100% Strength (100.0):** ~1.67 circles in 2s (~0.84 circles per second).
   - **Diminishing Returns:** The logarithmic model ensures that while the vortex grows more powerful, the rotation speed doesn't become visually chaotic at extremely high kill counts.
   - **Radial Compensation:** Higher tangential speed at larger radii keeps the rotation period uniform ($v = \omega \cdot R$).
   - **Exit Inertia:** Momentum is preserved for 1.5s after exit.
3. **Recharge Protocol:**
   - **Recharge Delay:** After the 2s duration ends, the skill enters a 1-second **Locked** state (reloading) before the 20-second cooldown begins ticking.
   - **Cooldown:** 20 seconds (Static).
   - **Total Cycle Time:** 23 seconds.
21. **Strength Pull Scaling:**
    - The Aigis class now features a permanent progression stat called **Strength Pull**.
    - Every enemy killed increases this power by **0.0003** (+0.3 per 1000 kills).
    - Strength Pull directly scales the pull strength, spin speed, and projectile deflection of the skill.
22. **Passive Projectile Ring Deflection:**
    - Even when the skill is inactive, the Aigis's magnetic orbits (180px - 330px) provide a **passive course-correction** for incoming enemy projectiles, subtly bending them away from the player.
23. **Wall Slam Damage:**
    - Enemies caught in the orbital pull that collide with walls take **10% of Max HP** as collision damage (Bosses take massive impact damage).

## Visuals
- **Wind Aura:** A golden amber gravitational field pulsates around the player with rotating wind-trail arcs.
- **Pulsating Rings:** Aigis rings light up and pulsate rapidly during the effect.
- **Floaters:** Triggers "ORBITAL VORTEX" text on activation.

## Implementation Details
- `GameConfig.ts`: Added `ORBITAL_VORTEX_COOLDOWN` and `ORBITAL_VORTEX_DURATION`.
- `types.ts`: Added `orbitalVortexUntil` to Player state.
- `useGameInput.ts`: Added input handling for the `aigis` class ability.
- `EnemyIndividualUpdate.ts`: Implemented the clockwise pull physics and wall damage.
- `ProjectilePlayerLogic.ts`: Handled speed multipliers and visual intensity flags for Aigis bullets.
- `ProjectileEnemyLogic.ts`: Implemented trajectory bending for enemy bullets.
- `PlayerRenderer.ts`: Added the wind aura rendering logic.
- `ProjectileRenderer.ts`: Integrated pulsating visuals for Aigis rings.
- `PlayerStatus.tsx`: Added the cooldown indicator to the HUD.
- `classes.ts` & `uiTranslations.ts`: Updated class descriptions and metrics.
