# Boss Hitbox & Collision Optimization

To improve the player experience, especially for the **Aigis** class and overall combat "feel," we have optimized boss hitboxes and collision detection.

## 1. Increased Boss Base Size
The logical base size for all boss enemies (including the Overlord/Abomination) has been increased:
- **Old Base Size**: 80px
- **New Base Size**: 110px

This change ensures that hitboxes better align with the large visual models and their high-tier distortion effects.

## 2. Generous Hit Detection
Collision logic for player projectiles has been adjusted to be more forgiving for boss encounters:
- **Normal Bullets vs Bosses**: The hit radius now includes a **+35px** padding (up from +10px).
- **Aigis Magnetic Rings vs Bosses**: The hit radius for orbital rings now includes a **+40px** padding (up from +20px).

## 3. Aigis "Dead Zone" Fix
The **Aigis** inner orbit (radius 125px) previously had a "dead zone" when the player was near the center of a boss, because the boss hitbox (80px + 20px padding = 100px) was too small to intersect with the 125px ring.

With the new base size (110px) and increased padding (+40px), the boss's effective hit radius for rings is now **150px**. This ensures that the 125px magnetic orbit **always hits** the boss when the player is close to its center, resolving the issue where bullets appeared "inside" the model without dealing damage.

## 4. Technical Adjustments
- Updated `EnemySpawnLogic.ts` for base size constants.
- Updated `ProjectilePlayerLogic.ts` for hit radius and spatial query range (increased to +250px) to ensure large bosses are always correctly detected by proximity queries.
