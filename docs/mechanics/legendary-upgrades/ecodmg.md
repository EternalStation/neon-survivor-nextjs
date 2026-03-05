# STORM OF STEEL (EcoDMG)

**Category:** Economic | **Arena:** 0 (pool: CombShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.1 DMG per kill (flat) | `dmg_per_kill` |
| 2 | +0.1 ATC per kill (flat) | `ats_per_kill` |
| 3 | +0.05% DMG per kill (%) | `dmg_pct_per_kill` |
| 4 | +0.05% ATC per kill (%) | `ats_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Mechanics

Kill-scaling: each kill from the moment the level is activated adds accumulation points (souls). The final bonus is recalculated every frame:

```
dmg.hexFlat += souls_since_L1 × 0.1 × HexMultiplier
atc.hexFlat += souls_since_L2 × 0.1 × HexMultiplier
dmg.hexMult += souls_since_L3 × 0.05 × HexMultiplier (in %)
atc.hexMult += souls_since_L4 × 0.05 × HexMultiplier (in %)
```

HexMultiplier is scaled by the quality of connected meteorites (see [formula](../stat-formula.md#hexmultiplier-scaling-through-meteorites)).

## Features affected

- [Damage](../stats/damage.md) - hexFlat (L1) and part of hexMult (L3)
- [Attack speed (ATC)](../stats/attack-speed.md) - hexFlat (L2) and hexMult (L4)