# ESSENCE SYPHON (EcoHP)

**Category:** Economic | **Arena:** 0 (pool: CombShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.1 Max HP per kill (flat) | `hp_per_kill` |
| 2 | +0.03 HP/sec per kill (flat) | `reg_per_kill` |
| 3 | +0.1% Max HP per kill (%) | `hp_pct_per_kill` |
| 4 | +0.03% HP/sec per kill (%) | `reg_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Mechanics

Kill-scaling: bonuses are recalculated every frame:

```
hp.hexFlat += souls_since_L1 × 0.1 × HexMultiplier
reg.hexFlat += souls_since_L2 × 0.03 × HexMultiplier
hp.hexMult += souls_since_L3 × 0.1 × HexMultiplier (in %)
reg.hexMult += souls_since_L4 × 0.03 × HexMultiplier (in %)
```

## Features affected

- [HP](../stats/hp.md) - hexFlat (L1) and hexMult (L3)
- [HP Regeneration](../stats/regen.md) - hexFlat (L2) and hexMult (L4)