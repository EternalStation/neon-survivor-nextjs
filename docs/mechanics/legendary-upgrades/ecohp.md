# ESSENCE SYPHON (EcoHP)

**Категория:** Economic | **Арена:** 0 (пул: CombShield, EcoDMG, EcoXP, EcoHP)

## Перки по уровням

| Уровень | Перк | Ключ |
|---------|------|------|
| 1 | +0.1 Max HP за каждое убийство (flat) | `hp_per_kill` |
| 2 | +0.03 HP/sec за каждое убийство (flat) | `reg_per_kill` |
| 3 | +0.1% Max HP за каждое убийство (%) | `hp_pct_per_kill` |
| 4 | +0.03% HP/sec за каждое убийство (%) | `reg_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Механика

Kill-scaling: бонусы пересчитываются каждый кадр:

```
hp.hexFlat   += souls_since_L1 × 0.1 × HexMultiplier
reg.hexFlat  += souls_since_L2 × 0.03 × HexMultiplier
hp.hexMult   += souls_since_L3 × 0.1 × HexMultiplier   (в %)
reg.hexMult  += souls_since_L4 × 0.03 × HexMultiplier  (в %)
```

## Затронутые характеристики

- [HP](../stats/hp.md) — hexFlat (L1) и hexMult (L3)
- [Регенерация HP](../stats/regen.md) — hexFlat (L2) и hexMult (L4)
