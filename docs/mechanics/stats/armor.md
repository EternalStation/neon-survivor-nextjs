# Armor

**Type:** [PlayerStats](../stat-formula.md) (`player.arm`)

## Calculation formula

### Step 1 - total armor

```
Armor = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × curseMult
```

`arenaMult` = 1.0 (armor is not enhanced by the arena buff).

### Step 2 - Convert to Damage Reduction

```
DR = min(0.95, 0.0945 × log10(Armor / 2 + 1) ^ 1.4)
```

| Armor | DR (approx.) | Incoming Damage (%) |
|-------|----------|-----------------|
| 16 | ~9% | ~91% |
| 100 | ~19% | ~81% |
| 1,000 | ~39% | ~61% |
| 10,000 | ~62% | ~38% |
| 50,000 | ~82% | ~18% |
| 200,000 | ~90% | ~10% |
| 328,000 | 95% (cap) | 5% |

### Step 3 - Apply to Incoming Damage

```
DamageAfterArmor = RawDamage × (1 - DR)
```

Armor applies to contact damage from enemies, from walls (10% MaxHP) and to any physical damage without the True Damage flag.

## Legendary sources

### [AEGIS PROTOCOL (CombShield)](../legendary-upgrades/combshield.md)

| Level | Field | Formula |
|---------|------|---------|
| 1 | `hexFlat` | `souls_since_L1 × 0.1 × HexMultiplier` |
| 4 | `hexMult` | `souls_since_L4 × 0.05 × HexMultiplier` (in %) |

With 1,000 kills with L1 and HexMult=1.0: +100 to armor base.

### [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md) - level 3

**Trigger:** `player.curHp < MaxHP × 0.5`

| Field | Meaning |
|-----------|---------|
| `hexMult2` | +100% (conditional) |

Added additively to `hexMult` in the second tier formula. Deactivated as soon as HP ≥ 50%.

### [CHRONO PLATING](../legendary-upgrades/chronoplating.md) - level 3

**Trigger:** every 5 minutes since reaching L3

Every 5 minutes, the current `Armor` value (after calcStat) is added to `player.chronoArmorBonus`, which is included in the `hexFlat` of the next frame:

```
arm.hexFlat = souls×0.1 (CombShield) + player.chronoArmorBonus
```

This creates a cumulative armor doubling:

| Time from L3 | Armor multiplier (to initial value at L3) |
|---|---|
| 0 min | ×1.0 |
| 5 min | ×2.0 |
| 10 min | ×4.0 |
| 15 min | ×8.0 |

The actual growth is higher due to the parallel accumulation of CombShield and KineticBattery bonuses.

## Armor derivative effects

Armor is used as a base for several other mechanics:

| Mechanics | Formula |
|---------|---------|
| [Kinetic Battery L1: shockwave](../legendary-upgrades/kineticbattery.md) | `shockDmg = calcStat(arm) × 1.0` |
| [Kinetic Battery L2: shield](../legendary-upgrades/kineticbattery.md) | `shieldAmount = calcStat(arm) × 1.0` |
| [Chrono Plating L1: Damage and ATS](../legendary-upgrades/chronoplating.md) | `dmg.hexMult += totalArmor × 0.01`, `atk.hexMult += totalArmor × 0.01` |
| [Chrono Plating L4: Regen](../legendary-upgrades/chronoplating.md) | `regenAmount += totalArmor × 0.005 / 60` |

## Related functions and entities

- [Formula PlayerStats](../stat-formula.md)
- [Collision damage reduction](collision-reduction.md) - applied after armor DR
- [HP Regeneration](regen.md) - ChronoPlating L4 converts Armor to Regen
- [Damage](damage.md) - ChronoPlating L1 converts Armor to Damage%
- [Attack speed](attack-speed.md) - ChronoPlating L1 converts Armor to ATS%
- [AEGIS PROTOCOL](../legendary-upgrades/combshield.md)
- [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md)
- [CHRONO PLATING](../legendary-upgrades/chronoplating.md)