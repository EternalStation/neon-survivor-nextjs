# Attack Speed

**Type:** [PlayerStats](../stat-formula.md) (`player.atk`)

## Formula

```
atkValue = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × dmgAtkBuffMult × curseMult
```

`dmgAtkBuffMult` = 1.3 in Arena 1 at arena level ≥ 1 (1.6 with Surge).

## Convert to shot frequency

The resulting `atkValue` is converted to the number of shots per second:

```
shotsPerSec = max(0.1, 2.64 × ln(atkValue / 100) - 1.25)
```

| atkValue | shotsPerSec (approx.) |
|----------|-------------------|
| 100 | ~0.1 (minimum) |
| 150 | ~1.07 |
| 200 | ~1.58 |
| 400 | ~2.73 |
| 1,000 | ~4.57 |

Interval between shots: `atkDelay = 1 / shotsPerSec` (in seconds).

## Legendary sources

### [STORM OF STEEL (EcoDMG)](../legendary-upgrades/ecodmg.md)

| Level | Field | Formula |
|---------|------|---------|
| 2 | `hexFlat` | `souls_since_L2 × 0.1 × HexMultiplier` |
| 4 | `hexMult` | `souls_since_L4 × 0.05 × HexMultiplier` (in %) |

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) - level 1

| Level | Field | Formula |
|---------|------|---------|
| 1 | `hexMult` | `totalArmor × 0.01 × HexMultiplier` (in %) |

With Armor=500 and L1: `atk.hexMult += 5%`.

## Additional

The buff `player.buffs.systemSurge` (Storm-Strike class buff) adds the value `surge.atk` to `atk.hexMult` for the duration of the buff.

## Related functions and entities

- [Formula PlayerStats](../stat-formula.md)
- [Damage](damage.md) - applied with each shot
- [Armor](armor.md) - ChronoPlating L1 uses Armor as a source for atk.hexMult
- [STORM OF STEEL](../legendary-upgrades/ecodmg.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)