# STORM OF STEEL (EcoDMG)

**Категория:** Economic | **Арена:** 0 (пул: CombShield, EcoDMG, EcoXP, EcoHP)

## Перки по уровням

| Уровень | Перк | Ключ |
|---------|------|------|
| 1 | +0.1 DMG за каждое убийство (flat) | `dmg_per_kill` |
| 2 | +0.1 ATS за каждое убийство (flat) | `ats_per_kill` |
| 3 | +0.05% DMG за каждое убийство (%) | `dmg_pct_per_kill` |
| 4 | +0.05% ATS за каждое убийство (%) | `ats_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Механика

Kill-scaling: каждое убийство с момента активации уровня добавляет очки накопления (souls). Итоговый бонус пересчитывается каждый кадр:

```
dmg.hexFlat    += souls_since_L1 × 0.1 × HexMultiplier
atk.hexFlat    += souls_since_L2 × 0.1 × HexMultiplier
dmg.hexMult    += souls_since_L3 × 0.05 × HexMultiplier   (в %)
atk.hexMult    += souls_since_L4 × 0.05 × HexMultiplier   (в %)
```

HexMultiplier масштабируется качеством подключённых метеоритов (см. [формулу](../stat-formula.md#hexmultiplier-масштабирование-через-метеориты)).

## Затронутые характеристики

- [Урон](../stats/damage.md) — hexFlat (L1) и часть hexMult (L3)
- [Скорость атаки](../stats/attack-speed.md) — hexFlat (L2) и hexMult (L4)
