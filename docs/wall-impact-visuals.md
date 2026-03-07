# Wall Impact Visuals Update

Updated the wall impact effects to provide better feedback when the player hits a map boundary.

## Changes

1.  **Shockwave Geometry**: The wall impact shockwave is now a **180-degree half-circle** instead of a full circle.
2.  **Directionality**: The shockwave and impact particles are now directed **into the arena** (away from the wall) based on the collision normal.
3.  **Increased Radius**: The impact range (and visual shockwave radius) has been increased from **250px to 300px**, allowing the wall bounce damage to hit enemies slightly further away.

## Implementation Details

-   Modified `Particle` interface in both `types.ts` and `ParticleLogic.ts` to support `startAngle` and `endAngle`.
-   Updated `spawnParticles` to constrain particle emission within the specified arc if provided.
-   Updated `EffectRenderer.ts` to render `shockwave_circle` as an arc if `startAngle` is defined.
-   Calculated the correct arc range in `PlayerMovement.ts` using the `collisionNormalAngle` of the hex wall.
