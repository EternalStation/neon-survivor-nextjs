# Cooldown Reduction

**Type:** `player.cooldownReduction` — plain number (0.0 … 1.0)

## Application

Used as a multiplier for cooldowns of active skills:

```
cdMod = (neuralOverclockActive ? 0.7 : 1.0) × (1 - player.cooldownReduction)
effectiveCooldown = baseCooldown × cdMod
```

`cdMod` = 1.0 if both sources are missing.

## Legendary source

### [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md) - level 4

**Trigger:** every minute since reaching L4

| Formula |
|---------|
| `player.cooldownReduction = minutesSinceL4 × 0.0025` |

| Time from L4 | Cooldown Reduction | cdMod |
|---|---|---|
| 0 min | 0% | 1.00 |
| 10 min | 2.5% | 0.975 |
| 40 min | 10% | 0.90 |
| 100 min | 25% | 0.75 |

The value accumulates indefinitely, but is practically limited by the length of the gaming session.

## Scope

Cooldown reduction affects all active skills:
- [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md): shockwave cooldown (5s base)
- [TOXIC SWAMP (DefPuddle)](../legendary-upgrades/defpuddle.md): puddle cooldown (25s base)
- [EPICENTER (DefEpi)](../legendary-upgrades/defepi.md): cooldown of spikes (30s base)
- [TERROR PULSE (ComWave)](../legendary-upgrades/comwave.md): wave cooldown (30s / 20s)

Blueprint NEURAL_OVERCLOCK(`neuralOverclockActive`) reduces by an additional 30% (0.7 multiplier), regardless of `cooldownReduction`.

## Related functions and entities

- [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md)
- [TOXIC SWAMP](../legendary-upgrades/defpuddle.md)
- [EPICENTER](../legendary-upgrades/defepi.md)
- [TERROR PULSE](../legendary-upgrades/comwave.md)