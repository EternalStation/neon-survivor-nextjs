# Maximum HP

**Type:** [PlayerStats](../stat-formula.md) (`player.hp`)

## Formula

```
MaxHP = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × hpRegenBuffMult × curseMult
```

`hpRegenBuffMult` = 1.3 in Arena 2 at arena level ≥ 1 (1.6 with Surge).

## Application

- `player.curHp` is limited by the value of `MaxHP`: `player.curHp = Math.min(maxHp, player.curHp + regenAmount)`
- When receiving damage, `curHp` decreases; upon death (`curHp ≤ 0`) - game over (if there is no Temporal Guard).

## Legendary sources

### [ESSENCE SYPHON (EcoHP)](../legendary-upgrades/ecohp.md)

| Level | Field | Formula |
|---------|------|---------|
| 1 | `hexFlat` | `souls_since_L1 × 0.1 × HexMultiplier` |
| 3 | `hexMult` | `souls_since_L3 × 0.1 × HexMultiplier` (in %) |

With 1,000 kills with L1 and HexMult=1.0: +100 to base HP.
With 1,000 kills with L3 and HexMult=1.0: additional +100% to the result of the first tier.

### [TOXIC SWAMP (DefPuddle)](../legendary-upgrades/defpuddle.md) - level 3

**Trigger:** player is inside an acid puddle area (buff `player.buffs.puddleRegen === true`)

| Field | Meaning |
|-----------|---------|
| `hexMult` += | +25% MaxHP |

The effect stacks additively with other `hexMult` sources.

## Related functions and entities

- [Formula PlayerStats](../stat-formula.md)
- [HP Regeneration](regen.md) - healing is limited to MaxHP
- [Armor](armor.md) - reduces incoming damage to curHp
- [ESSENCE SYPHON](../legendary-upgrades/ecohp.md)
- [TOXIC SWAMP](../legendary-upgrades/defpuddle.md)