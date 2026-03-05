# Feature: Orbital Vortex (Aigis Active Skill)

Implemented a new active skill for the **Aigis (Vortex)** class to enhance its thematic "magnetic field" combat style.

## Skill Specifications
- **Name:** Orbital Vortex
- **Cooldown:** 20 seconds (Scalable by Cooldown Reduction)
- **Duration:** 5 seconds
- **Keybind:** [E]

## Mechanics
1. **Projectile Overdrive:**
   - All orbiting projectiles (including Rings) spin **400% faster** during the active duration.
   - Merged rings pulse with high-intensity golden energy.
2. **Gravitational Bending (Clockwise Pull):**
   - Nearby enemies are subjected to a continuous clockwise orbital pull.
   - Pull strength scales with the number of **Maximum Meteorites** (souls) in inventory, capped at a late-game threshold.
3. **Projectile Deflection:**
   - Enemy projectiles (e.g., from Diamond enemies or Bosses) entering the vortex are bent clockwise, effectively deflecting them away from the player.
4. **Wall Slam Damage:**
   - Enemies caught in the orbital pull that collide with walls take **4% of Max HP** as collision damage per hit.

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
