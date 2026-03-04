# Снижение урона от столкновений (Collision Reduction)

**Тип:** вычисляется inline (не PlayerStats)

## Применение

Снижение урона от столкновений применяется **после** [брони](armor.md) при каждом контакте с врагом:

```ts
colRedRaw = calculateLegendaryBonus(state, 'col_red_per_kill')
colRedMult = 1 - getDefenseReduction(colRedRaw, 0.80)
reducedDmg = dmgAfterArmor × colRedMult
```

Используется та же логарифмическая функция, что и для [брони](armor.md), но с капом **80%**.

Кап: **80%**.

## Легендарный источник

### [AEGIS PROTOCOL (CombShield)](../legendary-upgrades/combshield.md) — уровень 2

| Уровень | Формула |
|---------|---------|
| 2 | `souls_since_L2 × 0.15 × HexMultiplier` |

При 500 000 убийствах с L2 и HexMultiplier = 1.0:
- `colRedRaw = 75,000`
- `Reduction ≈ 80% (Кап)`

## Пример прогрессии (с L2 AEGIS PROTOCOL, Multiplier = 1.0)

| Убийства (souls) | Коэффициент (colRedRaw) | Снижение урона (%) |
|------------------|------------------------|-------------------|
| 1,000            | 150                    | ~22%              |
| 10,000           | 1,500                  | ~41%              |
| 50,000           | 7,500                  | ~55%              |
| 100,000          | 15,000                 | ~62%              |
| 250,000          | 37,500                 | ~72%              |
| 500,000          | 75,000                 | **80% (Кап)**     |
| 1,000,000        | 150,000                | 80%               |

*Примечание: Метеориты (HexMultiplier) значительно ускоряют этот процесс.*

## Связанные функции и сущности

- [Броня](armor.md) — применяется до Collision Reduction
- [AEGIS PROTOCOL](../legendary-upgrades/combshield.md)
