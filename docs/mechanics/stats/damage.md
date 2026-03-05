# Damage

**Type:** [PlayerStats](../stat-formula.md) (`player.dmg`)

## Formula

```
Damage = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × dmgAtkBuffMult × curseMult
```

`dmgAtkBuffMult` = 1.3 in Arena 1 at arena level ≥ 1 (1.6 with Surge).

## Application

The `Damage` value is calculated before each shot:

```
dmg = calcStat(player.dmg, state.dmgAtkBuffMult)
```

Then passed to the projectile spawn function. The crit multiplier is applied on top of:

| Source of crit | Chance | Damage Multiplier |
|---|---|---|
| [ComCrit L1](../legendary-upgrades/comcrit.md) | 15% | ×2.0 |
| [ComCrit L4: Mega-Crit](../legendary-upgrades/comcrit.md) | 25% | ×3.5 |

The crit does not change the stat `dmg` - it is applied to the final `calcStat(dmg)` value when creating the projectile.

## hexMult: combined sources

The `dmg.hexMult` field is the sum of two independent bonuses:

```
dmg.hexMult = calculateLegendaryBonus('dmg_pct_per_kill') + calculateLegendaryBonus('dmg_pct_per_hp')
```

## Legendary sources

### [STORM OF STEEL (EcoDMG)](../legendary-upgrades/ecodmg.md)

| Level | Field | Formula |
|---------|------|---------|
| 1 | `hexFlat` | `souls_since_L1 × 0.1 × HexMultiplier` |
| 3 | `hexMult` (part of `dmg_pct_per_kill`) | `souls_since_L3 × 0.05 × HexMultiplier` (in %) |

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) - levels 1 and 2

| Level | Field | Formula |
|---------|------|---------|
| 1 | `hexMult` (part of `dmg_pct_per_kill`) | `totalArmor × 0.01 × HexMultiplier` |
| 2 | `hexMult` (part of `dmg_pct_per_hp`) | `(MaxHP/100) × 1.0 × HexMultiplier` |

With Armor=500 and L1: `dmg.hexMult += 5%` (500 × 0.01).
With MaxHP=2,000 and L2: `dmg.hexMult += 20%` (2000 / 100 × 1.0).

Both values ​​are summed into one `hexMult` field.

## Related functions and entities

- [Formula PlayerStats](../stat-formula.md)
- [Attack speed](attack-speed.md) - determines how often Damage is applied
- [Armor](armor.md) - ChronoPlating L1 uses Armor as a source for dmg.hexMult
- [HP](hp.md) — ChronoPlating L2 uses MaxHP as a source for dmg.hexMult
- [STORM OF STEEL](../legendary-upgrades/ecodmg.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)
- [SHATTERED FATE (ComCrit)](../legendary-upgrades/comcrit.md) - multiplier on top of Damage