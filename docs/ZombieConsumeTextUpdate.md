# Zombie Consumption Text Update

Updated the floating text for zombie consumption to be smaller and less intrusive during gameplay.

## Changes

### 1. Floating Number System
- Added `fontSize` property to the `FloatingNumber` interface in `src/logic/core/types.ts`.
- Updated `spawnFloatingNumber` in `src/logic/effects/ParticleLogic.ts` to accept an optional `fontSize` parameter.
- Modified `renderFloatingNumbers` in `src/logic/rendering/renderers/EffectRenderer.ts` to use this custom font size if provided, falling back to defaults otherwise.

### 2. Zombie Logic
- Updated `src/logic/enemies/UniqueEnemyLogic.ts` to use a font size of **12px** for zombie consumption messages ("CONSUMED", "BOSS CONSUMED", "ELITE CONSUMED").
- This represents an approximately **45% reduction** in size from the original 22px "alert" font size.

## Visual Impact
The green consumption text now appears significanty smaller on screen, improving visual clarity when multiple zombies are active.
