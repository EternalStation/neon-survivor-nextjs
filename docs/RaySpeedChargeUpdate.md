# Ray (Stormstrike) Speed Charge Update

Implemented dynamic movement speed scaling for Ray based on his Storm Circle lightning charge level.

## Mechanic Details
- **Zero Charge (0%):** Movement speed is decreased by **10%** (0.9x multiplier).
- **Near Zero Point (5% Charge):** Movement speed returns to **normal** (1.0x multiplier).
- **Full Charge (100%):** Movement speed is increased by **10%** (1.1x multiplier).

The scaling is piecewise linear:
1. From 0% to 5% charge, the speed multiplier ramps linearly from **0.9** to **1.0**.
2. From 5% to 100% charge, the speed multiplier ramps linearly from **1.0** to **1.1**.

## Implementation Details
- **`PlayerStats.ts`**: The speed modifier is now calculated here and applied to `player.speed`. This ensures the stat is synchronized across all systems (movement and UI).
- **`PlayerMovement.ts`**: Removed the redundant local `stormMod` calculation.
- **`PlayerLogic.ts`**: Re-ordered function calls to ensure `updatePlayerStats` runs before `handlePlayerMovement`, so movement always uses the up-to-date speed value.
- **`StatsMenu.tsx`**: Updated the UI to show the base speed and the dynamic charge-based percentage modifier when playing as Ray.

## Verification Checklist
- [x] Speed is -10% when the skill is just used (0% charge).
- [x] Speed hits 100% (neutral) at 5% charge (0.5 seconds of recharge).
- [x] Speed reaches +10% at max charge (10 seconds).
- [x] Stats menu accurately reflects the current charge-based multiplier.
