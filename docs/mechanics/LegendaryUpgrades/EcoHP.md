# ESSENCE SYPHON (EcoHP)

**Category:** Economic | **Arena:** 0 (pool: EcoShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.3 Max HP per kill (logarithmic sum) | `hp_per_kill` |
| 2 | +0.4 HP/sec per kill (logarithmic sum) | `reg_per_kill` |
| 3 | +0.3% Max HP per kill (logarithmic sum) | `hp_pct_per_kill` |
| 4 | +0.4% HP/sec per kill (logarithmic sum) | `reg_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Mechanics

Kill-scaling: bonuses are recalculated using a logarithmic approach to ensure diminishing returns at high kill counts.
The base value for each perk is scaled using the `getLogarithmicSum` algorithm.

```
bonus = getLogarithmicSum(total_kills_since_perkLevel, base_multiplier)
```

First kill grants roughly the full base multiplier, scaling down to ~0.005 after 100,000 kills.

## Features affected

- [HP](../stats/Hp.md) - hexFlat (L1) and hexMult (L3)
- [HP Regeneration](../stats/Regen.md) - hexFlat (L2) and hexMult (L4)