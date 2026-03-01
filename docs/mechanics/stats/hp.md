# Максимальное HP

**Тип:** [PlayerStats](../stat-formula.md) (`player.hp`)

## Формула

```
MaxHP = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × hpRegenBuffMult × curseMult
```

`hpRegenBuffMult` = 1.3 в Arena 2 при уровне арены ≥ 1 (1.6 с Surge).

## Применение

- `player.curHp` ограничивается значением `MaxHP`: `player.curHp = Math.min(maxHp, player.curHp + regenAmount)`
- При получении урона `curHp` снижается; при смерти (`curHp ≤ 0`) — game over (если нет Temporal Guard).

## Легендарные источники

### [ESSENCE SYPHON (EcoHP)](../legendary-upgrades/ecohp.md)

| Уровень | Поле | Формула |
|---------|------|---------|
| 1 | `hexFlat` | `souls_since_L1 × 0.1 × HexMultiplier` |
| 3 | `hexMult` | `souls_since_L3 × 0.1 × HexMultiplier` (в %) |

При 1 000 убийств с L1 и HexMult=1.0: +100 к базе HP.
При 1 000 убийств с L3 и HexMult=1.0: дополнительно +100% к результату первого тира.

### [TOXIC SWAMP (DefPuddle)](../legendary-upgrades/defpuddle.md) — уровень 3

**Триггер:** игрок находится внутри области кислотной лужи (буфф `player.buffs.puddleRegen === true`)

| Поле | Значение |
|------|---------|
| `hexMult` += | +25% MaxHP |

Эффект стакается с другими `hexMult` источниками аддитивно.

## Связанные функции и сущности

- [Формула PlayerStats](../stat-formula.md)
- [Регенерация HP](regen.md) — исцеление ограничено MaxHP
- [Броня](armor.md) — снижает входящий урон до curHp
- [ESSENCE SYPHON](../legendary-upgrades/ecohp.md)
- [TOXIC SWAMP](../legendary-upgrades/defpuddle.md)
