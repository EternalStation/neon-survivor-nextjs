# NECROTIC SURGE (Ghost Horde)

**Type:** Game Event | **Duration:** 30 seconds

## Mechanics

**Trigger:**
- Randomly triggered by the Director after 10 minutes of gameplay.
- Announced with the "Ghost Horde" audio cue.

**Behavior:**
- During the event, every enemy killed has a 100% chance to be added to a respawn queue.
- After a 3-second delay, the killed enemy respawns as a **Ghost** (Necrotic Zombie).

**Ghost Properties:**
- **Appearance:** Neon cyan/blue palette with glitch effects.
- **Stats:** 50% of the original enemy's Max HP, original speed.
- **Spawn Logic:** Ghosts spawn at a random distant location outside the player's view (1200-1500px), not at the place of death.
- **Loot/XP:** Ghosts provide 50% XP reward on death but do not drop items (meteorites, flux, etc.).
- **Single Respawn:** A Ghost cannot respawn again if it dies. Only regular enemies trigger the initial respawn.

## Implementation Details

- `DirectorLogic.ts` — Manages event timing and spawning of ghost entities.
- `DeathLogic.ts` — Handles the queueing of killed enemies and prevents infinite respawn loops.
- `EnemySpawnLogic.ts` — Provides the distant spawn position logic.
