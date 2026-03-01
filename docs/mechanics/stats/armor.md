# Броня (Armor)

**Тип:** [PlayerStats](../stat-formula.md) (`player.arm`)

## Формула расчёта

### Шаг 1 — суммарная броня

```
Armor = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × curseMult
```

`arenaMult` = 1.0 (броня не усиливается баффом арены).

### Шаг 2 — конвертация в Damage Reduction

```
DR = min(0.95, 0.0945 × log10(Armor / 2 + 1) ^ 1.4)
```

| Armor | DR (прим.) | Входящий урон (%) |
|-------|-----------|-----------------|
| 16 | ~9% | ~91% |
| 100 | ~19% | ~81% |
| 1 000 | ~39% | ~61% |
| 10 000 | ~62% | ~38% |
| 50 000 | ~82% | ~18% |
| 200 000 | ~90% | ~10% |
| 328 000 | 95% (кап) | 5% |

### Шаг 3 — применение к входящему урону

```
DamageAfterArmor = RawDamage × (1 - DR)
```

Броня применяется к контактному урону от врагов, от стен (10% MaxHP) и к любому физическому урону без флага True Damage.

## Легендарные источники

### [AEGIS PROTOCOL (CombShield)](../legendary-upgrades/combshield.md)

| Уровень | Поле | Формула |
|---------|------|---------|
| 1 | `hexFlat` | `souls_since_L1 × 0.1 × HexMultiplier` |
| 4 | `hexMult` | `souls_since_L4 × 0.05 × HexMultiplier` (в %) |

При 1 000 убийств с L1 и HexMult=1.0: +100 к базе брони.

### [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md) — уровень 3

**Триггер:** `player.curHp < MaxHP × 0.5`

| Поле | Значение |
|------|---------|
| `hexMult2` | +100% (условно) |

Добавляется аддитивно к `hexMult` в формуле второго тира. Деактивируется, как только HP ≥ 50%.

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) — уровень 3

**Триггер:** каждые 5 минут с момента достижения L3

Каждые 5 минут текущее значение `Armor` (после calcStat) добавляется в `player.chronoArmorBonus`, которое входит в `hexFlat` следующего кадра:

```
arm.hexFlat = souls×0.1 (CombShield) + player.chronoArmorBonus
```

Это создаёт накопительное удвоение брони:

| Время от L3 | Множитель Armor (к начальному значению на момент L3) |
|---|---|
| 0 мин | ×1.0 |
| 5 мин | ×2.0 |
| 10 мин | ×4.0 |
| 15 мин | ×8.0 |

Реальный рост выше из-за параллельного накопления CombShield и KineticBattery бонусов.

## Производные эффекты Armor

Броня используется как база для нескольких других механик:

| Механика | Формула |
|---------|---------|
| [Kinetic Battery L1: шоквейв](../legendary-upgrades/kineticbattery.md) | `shockDmg = calcStat(arm) × 1.0` |
| [Kinetic Battery L2: щит](../legendary-upgrades/kineticbattery.md) | `shieldAmount = calcStat(arm) × 1.0` |
| [Chrono Plating L1: Урон и ATS](../legendary-upgrades/chronoplating.md) | `dmg.hexMult += totalArmor × 0.01`, `atk.hexMult += totalArmor × 0.01` |
| [Chrono Plating L4: Regen](../legendary-upgrades/chronoplating.md) | `regenAmount += totalArmor × 0.005 / 60` |

## Связанные функции и сущности

- [Формула PlayerStats](../stat-formula.md)
- [Снижение урона от столкновений](collision-reduction.md) — применяется после DR от брони
- [Регенерация HP](regen.md) — ChronoPlating L4 конвертирует Armor в Regen
- [Урон](damage.md) — ChronoPlating L1 конвертирует Armor в Damage%
- [Скорость атаки](attack-speed.md) — ChronoPlating L1 конвертирует Armor в ATS%
- [AEGIS PROTOCOL](../legendary-upgrades/combshield.md)
- [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)
