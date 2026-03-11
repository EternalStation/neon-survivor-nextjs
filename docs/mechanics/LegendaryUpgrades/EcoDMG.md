# STORM OF STEEL (EcoDMG)

**Category:** Economic | **Arena:** 0 (pool: EcoShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.3 Projectile DMG per kill (logarithmic sum) | `dmg_per_kill` |
| 2 | +0.3 Shots/sec (ATS) per kill (logarithmic sum) | `ats_per_kill` |
| 3 | +0.3% Projectile DMG per kill (logarithmic sum) | `dmg_pct_per_kill` |
| 4 | +0.5% AOE Chance per Player Level (100px) | `aoe_per_level` |
| 5 | MAX LEVEL | — |

## Mechanics

Kill-scaling: bonuses are recalculated using a logarithmic approach to ensure diminishing returns at high kill counts.
The base value for each perk is scaled using the `getLogarithmicSum` algorithm.

```
bonus = getLogarithmicSum(total_kills_since_perkLevel, base_multiplier)
```

First kill grants roughly the full base multiplier, scaling down to ~0.005 after 100,000 kills.

HexMultiplier is scaled by the quality of connected meteorites (see [formula](../StatFormula.md#hexmultiplier-scaling-through-meteorites)).

## Features affected

- [Damage](../stats/Damage.md) - hexFlat (L1) and part of hexMult (L3)
- [Attack Speed (ATS)](../stats/AttackSpeed.md) - hexFlat (L2)
- [Collision Damage Reduction](../stats/CollisionReduction.md) - L2