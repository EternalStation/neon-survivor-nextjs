# Pentecost (Pentagon) Boss Update

## Visual Enhancements
- All 'minion' and 'long_drone' enemies now use a high-fidelity rocket/arrow visual instead of a simple circle.
- Rockets now feature dynamic fire trails when moving at speed, using a palette of white, amber, and orange for a realistic propulsion effect.
- **Boss Size Scale**: The Pentagon Boss size has been reduced by 30% (from base 77 to 54) to improve clarity and precision.

## Pentecost Boss Mechanics (Levels 2 & 3)
- **Rocket Barrage**: Pentecost Bosses at Levels 2 and 3 now spawn specialized rocket drones.
    - **Level 2**: Spawns 3 rockets every 7.5 seconds targeting the player.
    - **Level 3**: Spawns 5 rockets every 5.0 seconds with a wider spread.
- These rockets function as projectiles that move in a fixed direction and explode upon impact with the player, dealing significant collision damage.
- The rockets are integrated into the Soul Link system, allowing the boss to share damage with them while they are in flight.

## Pentagon Minions (Normal and Elite)
- **Visuals**:
    - **Normal**: Simple arrow-shaped enemies.
    - **Elite**: A larger, more powerful version of the standard minion, maintaining identical aerodynamic geometry but with increased scale.
- **Elite Pentagon (Lead)**: Maintains a perfect pentagonal geometry but is significantly larger than standard units. It is distinguishable by its intense cyan energy aura and periodic electrical reactor sparks.
- **Spawn Rates**: 
    - Spawns 3 minions every 15 seconds (reduced for balance).
    - Initial spawn delay is preserved for tactical buildup.
- **Behavior**:
    - **Formation**: Minions orbit the lead Pentagon and wait.
    - **Aggressive Response**: If a player enters within 350 units of the leader, the orbit breaks and all current minions launch an attack.
    - **Sacrifice Protocol**: If the lead Pentagon survives for 60 seconds, it enters a terminal phase:
        - It launches all waiting minions one-by-one every 1.0 seconds.
        - Once all minions are dispatched, the lead Pentagon suicides in a large explosion.
- **Abilities**:
    - **Elite Minions**: These are stronger, faster, and apply a **stun** on collision.

## Pentagon Boss (Level 4)
- **Visuals**: Uses high-fidelity phalanx rocket rendering with propulsion trails.
- **Phalanx Formation**: Spawns 8 rocket drones in a horizontal row.
- **Charge Attack**: After an alignment and lock-on phase, the entire row charges forward toward the player's last known position, dealing massive area-of-effect damage.

## Movement Refinement (All Pentagons)
- **Smooth Locality**: Pentagon movement now utilizes velocity interpolation (smoothing) for more fluid transitions between states (forward, strafe, retreat).
- **Retreat Speed**: The 'keep distance' logic now operates at a reduced speed (0.85x instead of 1.5x) when moving away from the player. This allows aggressive players to better close the gap while still maintaining the tactical 'distance-keeper' identity of the enemy.
- **Improved Catchability**: Players can now more reliably outrun or catch Pentagons that are attempting to maintain distance, preventing them from simply vanishing off-screen at high speeds.
