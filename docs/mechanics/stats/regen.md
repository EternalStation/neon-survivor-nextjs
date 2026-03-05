# HP regeneration (Regen)

**Type:** [PlayerStats](../stat-formula.md) (`player.reg`)

## Formula

```
Regen = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × hpRegenBuffMult × curseMult
```

`hpRegenBuffMult` = 1.3 in Arena 2 at arena level ≥ 1 (1.6 with Surge).

## Application

Each game frame (60 FPS):

```
regenAmount = calcStat(player.reg, hpRegenBuffMult, curseMult) / 60
player.curHp = Math.min(maxHp, player.curHp + regenAmount)
```

Regeneration is completely disabled when the `player.healingDisabled` debuff is active (applied by Circle Boss Lvl 4). In this case `regenAmount = 0`.

## Legendary sources

### [ESSENCE SYPHON (EcoHP)](../legendary-upgrades/ecohp.md)

| Level | Field | Formula |
|---------|------|---------|
| 2 | `hexFlat` | `souls_since_L2 × 0.03 × HexMultiplier` (HP/sec) |
| 4 | `hexMult` | `souls_since_L4 × 0.03 × HexMultiplier` (in %) |

### [TOXIC SWAMP (DefPuddle)](../legendary-upgrades/defpuddle.md) - level 3

**Trigger:** `player.buffs.puddleRegen === true` (player in acid zone)

| Field | Meaning |
|-----------|---------|
| `hexMult` += | +25% Regen |

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) - level 4

**Applies outside of formula** - added directly to `regenAmount` after calculation:

```
regenAmount += totalArmor × 0.005 / 60
```

Where `totalArmor = calcStat(player.arm)`. This bonus is **not** taken into account in `hpRegenBuffMult` and `curseMult`, as it is added after they are applied.

## Related functions and entities

- [Formula PlayerStats](../stat-formula.md)
- [HP](hp.md) - regeneration is limited to maxHp
- [Armor](armor.md) - ChronoPlating L4 converts Armor to Regen
- [ESSENCE SYPHON](../legendary-upgrades/ecohp.md)
- [TOXIC SWAMP](../legendary-upgrades/defpuddle.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)