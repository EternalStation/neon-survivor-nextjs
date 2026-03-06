# Bug Fix: Area Effect Collision Detection (Lasers & Bosses)

## Issue
Large enemies (Bosses, Anomalies) were frequently not taking damage from skill-based area effects like Stormstrike Lasers, Orbital Strikes, and Blackholes.

## Root Cause
The hit detection logic used `Math.hypot(e.x - effect.x, e.y - effect.y) < effect.radius`, which only checked if the exact center of the enemy was within the effect radius. This ignored the enemy's physical size (`e.size`), making it disproportionately difficult to hit larger targets.

## Resolution
Updated the collision checks in `useGameLogic.ts` to use `effect.radius + e.size`:
- `storm_laser`: Increased hit reliability for large targets.
- `orbital_strike`: Corrected area check to include enemy hitbox.
- `blackhole`: Corrected grab and damage radius for large entities.

## Impact
Players using the Ray (Stormstrike) class or other area-of-effect skills will now find them significantly more reliable against bosses and elite enemies.
