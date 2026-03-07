# Pentecost (Pentagon) Boss Update

## Visual Enhancements
- All 'minion' and 'long_drone' enemies now use a high-fidelity rocket/arrow visual instead of a simple circle.
- Rockets now feature dynamic fire trails when moving at speed, using a palette of white, amber, and orange for a realistic propulsion effect.

## Pentecost Boss Mechanics (Levels 2 & 3)
- **Rocket Barrage**: Pentecost Bosses at Levels 2 and 3 now spawn specialized rocket drones.
    - **Level 2**: Spawns 3 rockets every 7.5 seconds targeting the player.
    - **Level 3**: Spawns 5 rockets every 5.0 seconds with a wider spread.
- These rockets function as projectiles that move in a fixed direction and explode upon impact with the player, dealing significant collision damage.
- The rockets are integrated into the Soul Link system, allowing the boss to share damage with them while they are in flight.

## Logic Updates
- Refactored `EnemyIndividualUpdate.ts` to support "Free Rockets" that don't require the boss to be in a specific phalanx state to move and attack.
- Optimized `BossSkillRenderer.ts` to dynamically enable trails based on enemy velocity.
