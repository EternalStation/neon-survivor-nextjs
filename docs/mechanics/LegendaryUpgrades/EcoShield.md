# AEGIS PROTOCOL (EcoShield)

**Category:** Economic | **Arena:** 0 (pool: EcoShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.3 Armor per kill (logarithmic sum) | `arm_per_kill` |
| 2 | +0.2% Collision Damage Reduction per kill (logarithmic sum) | `col_red_per_kill` |
| 3 | +0.2% Projectile Damage Reduction per kill (logarithmic sum) | `proj_red_per_kill` |
| 4 | +0.3% Armor per kill (logarithmic sum) | `arm_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Mechanics

Kill-scaling: bonuses are recalculated using a logarithmic approach to ensure diminishing returns at high kill counts.
The base value for each perk is scaled using the `getLogarithmicSum` algorithm.

```
bonus = getLogarithmicSum(total_kills_since_perkLevel, base_multiplier)
```

First kill grants roughly the full base multiplier, scaling down to ~0.005 after 100,000 kills.

Collision damage reduction (`col_red_per_kill`) and projectile damage reduction (`proj_red_per_kill`) each have a cap of **80%**.

## Features affected

- [Armor](../stats/Armor.md) - hexFlat (L1) and hexMult (L4)
- [Collision Damage Reduction](../stats/CollisionReduction.md) - L2
- [Projectile Damage Reduction](../stats/ProjectileReduction.md) - L3