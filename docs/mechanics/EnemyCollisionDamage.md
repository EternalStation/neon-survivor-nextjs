# Enemy Collision Damage

Standardized collision damage calculation for all enemies.

## Mechanics

All enemies (Normal, Elite, Bosses, and Overlords) now use a unified collision damage formula to ensure fairness and transparency.

- **Formula**: `Raw Damage = Enemy Current HP * 0.075`
- **Current HP**: The damage is always calculated based on the enemy's HP at the exact moment of impact.
- **Consistency**: 
    - This rule applies to all standard shapes (Circle, Triangle, Square, Diamond, Pentagon).
    - It applies to Elite variants and all Boss tiers.
    - Anomaly bosses (Overlords) also follow this 7.5% rule.
    - Minions and Linked enemies are standardized to this formula as well.

## Damage Modifiers

Once the Raw Damage is calculated, it is filtered through the player's defense systems:
1. **Armor**: Reduction based on the player's Armor stat.
2. **Collision Reduction**: Linear percentage reduction (e.g., from Aegis Protocol).
3. **Shields**: Remaining damage is absorbed by various shield layers before affecting the core health.
