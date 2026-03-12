# NEURAL HARVEST (EcoXP)

**Category:** Economic | **Arena:** 0 (pool: EcoShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.3 XP per kill (logarithmic sum) | `xp_per_kill` |
| 2 | +0.4 Dust per kill (logarithmic sum) | `dust_per_kill` |
| 3 | +0.3 Flux per kill (logarithmic sum) | `flux_per_kill` |
| 4 | +0.3% XP per kill (logarithmic sum) | `xp_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Mechanics

Kill-scaling: bonuses are recalculated using a logarithmic approach to ensure diminishing returns at high kill counts.
The base value for each perk is scaled using the `getLogarithmicSum` algorithm.

```
bonus = getLogarithmicSum(total_kills_since_perkLevel, base_multiplier)
```

First kill grants roughly the full base multiplier, scaling down to ~0.005 after 100,000 kills.

## Features affected

- [Experience Gain](../stats/XpGain.md) — L1 (flat) and L4 (%)