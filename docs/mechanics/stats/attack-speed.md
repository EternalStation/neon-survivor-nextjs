# Скорость атаки (Attack Speed)

**Тип:** [PlayerStats](../stat-formula.md) (`player.atk`)

## Формула

```
atkValue = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × dmgAtkBuffMult × curseMult
```

`dmgAtkBuffMult` = 1.3 в Arena 1 при уровне арены ≥ 1 (1.6 с Surge).

## Конвертация в частоту выстрелов

Итоговое `atkValue` преобразуется в количество выстрелов в секунду:

```
shotsPerSec = max(0.1, 2.64 × ln(atkValue / 100) - 1.25)
```

| atkValue | shotsPerSec (прим.) |
|----------|-------------------|
| 100 | ~0.1 (минимум) |
| 150 | ~1.07 |
| 200 | ~1.58 |
| 400 | ~2.73 |
| 1 000 | ~4.57 |

Интервал между выстрелами: `atkDelay = 1 / shotsPerSec` (в секундах).

## Легендарные источники

### [STORM OF STEEL (EcoDMG)](../legendary-upgrades/ecodmg.md)

| Уровень | Поле | Формула |
|---------|------|---------|
| 2 | `hexFlat` | `souls_since_L2 × 0.1 × HexMultiplier` |
| 4 | `hexMult` | `souls_since_L4 × 0.05 × HexMultiplier` (в %) |

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) — уровень 1

| Уровень | Поле | Формула |
|---------|------|---------|
| 1 | `hexMult` | `totalArmor × 0.01 × HexMultiplier` (в %) |

При Armor=500 и L1: `atk.hexMult += 5%`.

## Дополнительно

Буфф `player.buffs.systemSurge` (классовый буфф Storm-Strike) добавляет к `atk.hexMult` значение `surge.atk` на время действия баффа.

## Связанные функции и сущности

- [Формула PlayerStats](../stat-formula.md)
- [Урон](damage.md) — применяется при каждом выстреле
- [Броня](armor.md) — ChronoPlating L1 использует Armor как источник для atk.hexMult
- [STORM OF STEEL](../legendary-upgrades/ecodmg.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)
