# AEGIS PROTOCOL (CombShield)

**Category:** Economic | **Arena:** 0 (pool: CombShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.1 Armor per kill (flat) | `arm_per_kill` |
| 2 | +0.1% collision damage reduction per kill | `col_red_per_kill` |
| 3 | +0.1% reduction in projectile damage per kill | `proj_red_per_kill` |
| 4 | +0.05% Armor per kill (%) | `arm_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Mechanics

Kill-scaling: bonuses are recalculated every frame:

```
arm.hexFlat += souls_since_L1 × 0.1 × HexMultiplier
col_red_pct = souls_since_L2 × 0.1 × HexMultiplier (in %)
proj_red_pct = souls_since_L3 × 0.1 × HexMultiplier (in %)
arm.hexMult += souls_since_L4 × 0.05 × HexMultiplier (in %)
```

Collision damage reduction (`col_red_per_kill`) and projectile damage reduction (`proj_red_per_kill`) each have a cap of **80%**.

## Features affected

- [Armor](../stats/armor.md) - hexFlat (L1) and hexMult (L4)
- [Collision Damage Reduction](../stats/collision-reduction.md) - L2