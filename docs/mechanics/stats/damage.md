# Урон (Damage)

**Тип:** [PlayerStats](../stat-formula.md) (`player.dmg`)

## Формула

```
Damage = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × dmgAtkBuffMult × curseMult
```

`dmgAtkBuffMult` = 1.3 в Arena 1 при уровне арены ≥ 1 (1.6 с Surge).

## Применение

Значение `Damage` вычисляется перед каждым выстрелом:

```
dmg = calcStat(player.dmg, state.dmgAtkBuffMult)
```

Затем передаётся в функцию спавна снаряда. Крит-множитель применяется поверх:

| Источник крита | Шанс | Множитель урона |
|---|---|---|
| [ComCrit L1](../legendary-upgrades/comcrit.md) | 15% | ×2.0 |
| [ComCrit L4: Mega-Crit](../legendary-upgrades/comcrit.md) | 25% | ×3.5 |

Крит не изменяет stat `dmg` — он применяется к итоговому значению `calcStat(dmg)` при создании снаряда.

## hexMult: объединённые источники

Поле `dmg.hexMult` является суммой двух независимых бонусов:

```
dmg.hexMult = calculateLegendaryBonus('dmg_pct_per_kill') + calculateLegendaryBonus('dmg_pct_per_hp')
```

## Легендарные источники

### [STORM OF STEEL (EcoDMG)](../legendary-upgrades/ecodmg.md)

| Уровень | Поле | Формула |
|---------|------|---------|
| 1 | `hexFlat` | `souls_since_L1 × 0.1 × HexMultiplier` |
| 3 | `hexMult` (часть `dmg_pct_per_kill`) | `souls_since_L3 × 0.05 × HexMultiplier` (в %) |

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) — уровни 1 и 2

| Уровень | Поле | Формула |
|---------|------|---------|
| 1 | `hexMult` (часть `dmg_pct_per_kill`) | `totalArmor × 0.01 × HexMultiplier` |
| 2 | `hexMult` (часть `dmg_pct_per_hp`) | `(MaxHP / 100) × 1.0 × HexMultiplier` |

При Armor=500 и L1: `dmg.hexMult += 5%` (500 × 0.01).
При MaxHP=2 000 и L2: `dmg.hexMult += 20%` (2000 / 100 × 1.0).

Оба значения суммируются в одном поле `hexMult`.

## Связанные функции и сущности

- [Формула PlayerStats](../stat-formula.md)
- [Скорость атаки](attack-speed.md) — определяет, как часто применяется Damage
- [Броня](armor.md) — ChronoPlating L1 использует Armor как источник для dmg.hexMult
- [HP](hp.md) — ChronoPlating L2 использует MaxHP как источник для dmg.hexMult
- [STORM OF STEEL](../legendary-upgrades/ecodmg.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)
- [SHATTERED FATE (ComCrit)](../legendary-upgrades/comcrit.md) — мультипликатор поверх Damage
