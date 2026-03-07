# Enemy Health Bars Update

- Modified `src/logic/rendering/renderers/EnemyRenderer.ts` to ensure that health bars are:
  1. Rendered for elite enemies, bosses, and unique enemies (zombies, worms, glitchers, and meteorite drops).
  2. Always anchored to the absolute top visually, regardless of the enemy's rotation.
  3. Reversing the context rotation before rendering the bar so it doesn't spin around with enemies that use `rotationPhase` (like circling elites or spinning worms).

HP bars are dynamically scaled based on whether the entity is a standard/elite/unique or a boss. Boss bars are drawn slightly wider and thicker.
