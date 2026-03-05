# Feature: Orbital Vortex (Aigis Active Skill)

Implemented a new active skill for the **Aigis (Vortex)** class to enhance its thematic "magnetic field" combat style.

## Skill Specifications
- **Name:** Orbital Vortex
- **Cooldown:** 20 seconds (Scalable by Cooldown Reduction)
- **Duration:** 2 seconds
- **Keybind:** [E]

## Mechanics
1. **Projectile Overdrive:**
   - All orbiting projectiles (including Rings) spin **400% faster** during the active duration.
   - Merged rings pulse with high-intensity golden energy.
2. **Meteorite Slingshot Physics:**
   - Enemies are no longer just spun in place. The vortex now acts as a gravitational "slingshot".
   - **Inward Pull:** When far from the player, enemies are pulled inwards towards the center of the vortex.
   - **Outward Sling:** Once enemies reach a proximity threshold (~180px), the radial force flips to push them outwards.
   - **High Angular Velocity:** Tangential speed is increased to provide a high-energy "spin-up" feel.
   - **Exit Inertia:** Enemies now maintain their vortex momentum for 1.5 seconds after exiting the 800px radius or the skill duration ending, allowing for massive "pass-by" attacks.
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
