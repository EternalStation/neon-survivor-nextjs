# Reducing damage from collisions (Collision Reduction)

**Type:** calculated inline (not PlayerStats)

## Application

Collision damage reduction is applied **after** [armor](armor.md) every time you make contact with an enemy:

```ts
colRedRaw = calculateLegendaryBonus(state, 'col_red_per_kill')
colRedMult = 1 - getDefenseReduction(colRedRaw, 0.80)
reducedDmg = dmgAfterArmor × colRedMult
```

The same logarithmic function is used as for [armor](armor.md), but with a cap of **80%**.

Cap: **80%**.

## Legendary source

### [AEGIS PROTOCOL (CombShield)](../legendary-upgrades/combshield.md) - level 2

| Level | Formula |
|---------|---------|
| 2 | `souls_since_L2 × 0.15 × HexMultiplier` |

At 500,000 kills with L2 and HexMultiplier = 1.0:
- `colRedRaw = 75,000`
- `Reduction ≈ 80% (Cap)`

## Progression example (with L2 AEGIS PROTOCOL, Multiplier = 1.0)

| Murders (souls) | Ratio(colRedRaw) | Damage reduction (%) |
|------------------|-----------------------|-------------------|
| 1,000 | 150 | ~22% |
| 10,000 | 1,500 | ~41% |
| 50,000 | 7,500 | ~55% |
| 100,000 | 15,000 | ~62% |
| 250,000 | 37,500 | ~72% |
| 500,000 | 75,000 | **80% (Cap)** |
| 1,000,000 | 150,000 | 80% |

*Note: Meteorites (HexMultiplier) greatly speed up this process.*

## Related functions and entities

- [Armor](armor.md) - applied before Collision Reduction
- [AEGIS PROTOCOL](../legendary-upgrades/combshield.md)