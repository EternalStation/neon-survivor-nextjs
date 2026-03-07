# Turret and Worm Updates

## Turret Freeze Logic
- **Freeze Stacking Fix**: Modified ice turret projectiles to use a non-stacking freeze duration. The freeze effect now refreshes to a maximum of 3 seconds instead of accumulating indefinitely.
- **Affected Files**: `src/logic/combat/ProjectilePlayerLogic.ts`

## Worm Enemy Visuals
- **Restored Original Design**: Restored the complex and eldritch "crazy scary" design for the Void Burrower from history (March 2nd commit).
- **Head Design**: Features jagged mandibles with teeth, an armored skull shape with 5 distinct eyes (spider-like), and a dark fill.
- **Segment Design**: Uses armored diamond segments with rotating animations and internal core details.
- **Burrowing Feedback**: Includes an underground ripple effect for better locational awareness when burrowed.
- **Affected Files**: `src/logic/rendering/renderers/UniqueEnemyRenderer.ts`
