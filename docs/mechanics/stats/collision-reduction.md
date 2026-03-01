# Снижение урона от столкновений (Collision Reduction)

**Тип:** вычисляется inline (не PlayerStats)

## Применение

Снижение урона от столкновений применяется **после** [брони](armor.md) при каждом контакте с врагом:

```
colRedRaw = calculateLegendaryBonus(state, 'col_red_per_kill')     // в %
colRedMult = 1 - min(80, colRedRaw) / 100
reducedDmg = dmgAfterArmor × colRedMult
```

Кап: **80%** (не более 80% снижения от столкновений).

## Легендарный источник

### [AEGIS PROTOCOL (CombShield)](../legendary-upgrades/combshield.md) — уровень 2

| Уровень | Формула |
|---------|---------|
| 2 | `souls_since_L2 × 0.1 × HexMultiplier` (в %) |

При 500 убийствах с L2 и HexMult=1.0: `colRedRaw = 50%` → `colRedMult = 0.50` → урон от столкновений снижается в 2 раза (после брони).

## Связанные функции и сущности

- [Броня](armor.md) — применяется до Collision Reduction
- [AEGIS PROTOCOL](../legendary-upgrades/combshield.md)
