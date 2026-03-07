# Turret Activation Radius Update

## Description
This update increases the turret activation radius to match the turret's attack/influence range (`TURRET_RANGE`), allowing players to activate turrets from a distance rather than needing to be directly on top of the turret button.

## Changes
- **Turret Range Integration**: Exported `TURRET_RANGE` from `TurretLogic.ts` to be used globally.
- **Initial Radius Update**: Updated the initial `radius` for turret POIs in `MapLogic.ts` to `800` (the default `TURRET_RANGE`).
- **Dynamic Radius Scaling**: Turret `radius` now scales correctly with turret levels, using `TURRET_RANGE` as the base.
- **Improved Range Checks**: Updated turret attack and healing logic to use the dynamic `radius` property, ensuring consistent scaling of the turret's influence area.
- **Visual Feedback**: The interaction prompt ('E') and the range indicators in the game view now correctly reflect the larger activation and effect zones.
