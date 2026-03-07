# Aigis Orbital Vortex Speed Adjustment

## Change Summary
Adjusted the orbital velocity formula for enemies pulled into the Aigis class's Orbital Vortex active skill, following user feedback to perfectly match the desired rotation speed.

## Details
In `src/logic/enemies/EnemyIndividualUpdate.ts`:
- The previous base orbital rotation rate logic resulted in roughly 72 degrees per 2 seconds, which was deemed too fast for the early game.
- Updated the `circlesIn2s` multiplier. The formula changed from:
  `const circlesIn2s = Math.max(0.1, 0.2 + 0.32 * Math.log(Math.max(1, pullBase)));`
  to:
  `const circlesIn2s = Math.max(0.02, 0.07 + 0.2 * Math.log(Math.max(1, pullBase)));`

This results in a much smoother, slower ~20 degree rotation over the vortex's 2-second duration in early stages, while appropriately scaling with increased pull power from resonance and upgrades.
