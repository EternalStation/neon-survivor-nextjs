# NEURAL HARVEST (EcoXP)

**Category:** Economic | **Arena:** 0 (pool: CombShield, EcoDMG, EcoXP, EcoHP)

## Perks by level

| Level | Perk | Key |
|---------|------|------|
| 1 | +0.1 XP per kill | `xp_per_kill` |
| 2 | +1 Dust every 50 kills | (threshold, DeathLogic) |
| 3 | +5 Flux every 10 kills | (threshold, DeathLogic) |
| 4 | +0.1% XP per kill | `xp_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Mechanics

**L1 and L4** - kill-scaling: `souls_since_Lx × 0.1 × HexMultiplier`.

**L2 — Dust Extraction** (threshold):
- Every 50 souls accumulated since L2 → +1 Dust × HexMultiplier
- Accrued at the moment of killing when crossing the threshold

**L3 - Flux Extraction** (threshold):
- Every 10 souls accumulated since L3 → +5 Flux × HexMultiplier
- Accrued at the moment of killing when crossing the threshold

## Features affected

- [Experience per kill](../stats/xp-gain.md) — L1 (flat) and L4 (%)