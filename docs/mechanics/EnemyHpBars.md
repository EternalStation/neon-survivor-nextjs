# Enemy Health Bars Update

- Modified `src/logic/rendering/renderers/EnemyRenderer.ts` to ensure that health bars are:
  1. Rendered for elite enemies and unique enemies (zombies, worms, glitchers, and meteorite drops).
  2. Bosses no longer have individual health bars under them, as they have a main health bar at the top of the screen to reduce visual clutter and redundancy.
  3. Always anchored to the absolute top visually, regardless of the enemy's rotation.
  4. Reversing the context rotation before rendering the bar so it doesn't spin around with enemies that use `rotationPhase` (like circling elites or spinning worms).

HP bars are dynamically scaled for elite and unique entities. Boss bars previously drawn under the boss have been removed.

## Main Boss HUD Health Bar
- Updated `src/components/hud/BossStatus.tsx` to improve the primary boss health bar:
  1. Added stage separators at exactly **33.33%** and **66.66%** to help players track boss phase transitions.
  2. Enhanced separator visuals: replaced simple lines with high-fidelity markers featuring glow effects and "architectural" notches (Red glow markers at the top/bottom and a White central indicator).
  3. Separators are now applied consistently to all bosses, not just anomaly variants.

