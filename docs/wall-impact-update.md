# Wall Impact Mechanic Update

## New Functionality
- **Visual Feedback**: A cyan/red expanding shockwave ring now appears whenever the player hits a map boundary. This ring visually matches the 250px damage radius to enemies.
- **Damage Buff**: The damage dealt to enemies by the wall impact shockwave has been changed to mirror the damage taken by the player.
  - **Normal**: Player takes 10% Max HP; Enemies take 10% of Player's Max HP.
  - **Escalated (Wall Incompetence)**: Player takes 30% Max HP; Enemies take 30% of Player's Max HP.

## Technical Details
- Modified `src/logic/player/PlayerMovement.ts` to sync player damage and enemy shockwave damage.
- Updated `src/logic/effects/ParticleLogic.ts` to include `maxLife` for better visual progress calculation in the renderer.
- Implemented `shockwave_circle` particle type to represent the area of effect on wall impact.
