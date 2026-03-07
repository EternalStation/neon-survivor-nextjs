# Neutron Star Aura Color Update

## Overview
Updated the visual appearance of the "Neutron Star" fusion aura to incorporate a blend of green and yellow colors. Previously, the aura effect was purely green before fusion, and the particle effects were purely yellow after fusion, while the actual aura circle was missing a dedicated visual representation for Neutron Star in the renderer.

## Changes Made
- **logic/rendering/renderers/PlayerRenderer.ts**
  - Updated the `PlayerRenderer` to account for `NeutronStar` (and `IrradiatedMire`) levels alongside `RadiationCore`.
  - Added a distinct radial gradient color stop logic for `NeutronStar` to feature a yellowish-green mixture (`rgba(250, 204, 21, 0.16)` center, transitioning through green).
  - Ensured the aura circle renders accurately with the `666` radius corresponding to the upgraded fusion state.
- **logic/player/PlayerCombat.ts**
  - Altered the background aura particle spawner (`type: 'bubble'`).
  - Instead of forcing the particle color to be purely yellow (`#facc15`) when `neutronLvl > 0`, there is now a 30% chance for yellow particles and a 70% chance for green particles (`#bef264`), creating a subtle mixed aura effect visually.
