# AEGIS PROTOCOL (CombShield)

**Категория:** Economic | **Арена:** 0 (пул: CombShield, EcoDMG, EcoXP, EcoHP)

## Перки по уровням

| Уровень | Перк | Ключ |
|---------|------|------|
| 1 | +0.1 Armor за каждое убийство (flat) | `arm_per_kill` |
| 2 | +0.1% снижение урона от столкновений за убийство | `col_red_per_kill` |
| 3 | +0.1% снижение урона от снарядов за убийство | `proj_red_per_kill` |
| 4 | +0.05% Armor за каждое убийство (%) | `arm_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Механика

Kill-scaling: бонусы пересчитываются каждый кадр:

```
arm.hexFlat     += souls_since_L1 × 0.1 × HexMultiplier
col_red_pct     = souls_since_L2 × 0.1 × HexMultiplier   (в %)
proj_red_pct    = souls_since_L3 × 0.1 × HexMultiplier   (в %)
arm.hexMult     += souls_since_L4 × 0.05 × HexMultiplier  (в %)
```

Снижение урона от столкновений (`col_red_per_kill`) и от снарядов (`proj_red_per_kill`) имеют кап **80%** каждый.

## Затронутые характеристики

- [Броня](../stats/armor.md) — hexFlat (L1) и hexMult (L4)
- [Снижение урона от столкновений](../stats/collision-reduction.md) — L2
