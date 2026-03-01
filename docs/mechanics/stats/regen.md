# Регенерация HP (Regen)

**Тип:** [PlayerStats](../stat-formula.md) (`player.reg`)

## Формула

```
Regen = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × hpRegenBuffMult × curseMult
```

`hpRegenBuffMult` = 1.3 в Arena 2 при уровне арены ≥ 1 (1.6 с Surge).

## Применение

Каждый игровой кадр (60 FPS):

```
regenAmount = calcStat(player.reg, hpRegenBuffMult, curseMult) / 60
player.curHp = Math.min(maxHp, player.curHp + regenAmount)
```

Регенерация полностью отключается при активном дебаффе `player.healingDisabled` (накладывается боссом Circle Boss Lvl 4). В этом случае `regenAmount = 0`.

## Легендарные источники

### [ESSENCE SYPHON (EcoHP)](../legendary-upgrades/ecohp.md)

| Уровень | Поле | Формула |
|---------|------|---------|
| 2 | `hexFlat` | `souls_since_L2 × 0.03 × HexMultiplier` (HP/sec) |
| 4 | `hexMult` | `souls_since_L4 × 0.03 × HexMultiplier` (в %) |

### [TOXIC SWAMP (DefPuddle)](../legendary-upgrades/defpuddle.md) — уровень 3

**Триггер:** `player.buffs.puddleRegen === true` (игрок в зоне кислоты)

| Поле | Значение |
|------|---------|
| `hexMult` += | +25% Regen |

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) — уровень 4

**Применяется вне формулы** — добавляется непосредственно к `regenAmount` после вычисления:

```
regenAmount += totalArmor × 0.005 / 60
```

Где `totalArmor = calcStat(player.arm)`. Этот бонус **не** учитывается в `hpRegenBuffMult` и `curseMult`, так как добавляется после их применения.

## Связанные функции и сущности

- [Формула PlayerStats](../stat-formula.md)
- [HP](hp.md) — regeneration ограничена maxHp
- [Броня](armor.md) — ChronoPlating L4 конвертирует Armor в Regen
- [ESSENCE SYPHON](../legendary-upgrades/ecohp.md)
- [TOXIC SWAMP](../legendary-upgrades/defpuddle.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)
