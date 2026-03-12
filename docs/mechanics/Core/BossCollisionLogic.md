# Boss Collision Logic

Specialized collision handling protocols for Boss-tier entities to prevent late-game imbalances and instant kills.

## Mechanism

Collisions between the Player and a Boss are handled with a specialized damage and knockback protocol to prevent "damage stacking" and ensure tactical longevity.

### Damage Capping

When a Boss collides with the Player:
1.  **Boss Damage**: The boss takes exactly **20% of its Maximum HP** as collision damage. This ensures the boss cannot be one-shotted by high-frequency contact while still remaining susceptible to collision-based strategies.
2.  **Player Damage**: The player takes **7.5% of the Boss's current HP** as damage. This maintains the high risk of approaching boss entities.

### Knockback Protocol

To prevent continuous damage stacking and provide visual feedback for the impact:
- **Displacement**: The boss is pushed back by a significant force (Knockback Power: 45) in the opposite direction of the collision angle.
- **Safety Buffer**: The boss receives a very brief internal cooldown on collision damage to prevent physics-induced multi-hits in a single frame.

## Interaction with Stages

Collision damage respects the **Boss Stages** system. If a collision reduces the boss's HP past a 66% or 33% threshold, the boss will correctly transition to the next stage, trigger its 1-second immunity, and repel any further immediate damage.
