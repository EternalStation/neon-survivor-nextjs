# RADIATION CORE (Radiation Core)

**Category:** Combat | **Arena:** 1 (pool: RadiationCore, ComLife, ComCrit, ComWave)

## Perks by level

| Level | Perk |
|---------|------|
| 1 | Damage Aura 500px: 5%–10% of player's MaxHP/sec (closer = more) |
| 2 | Healing: 0.2% MaxHP/sec for each enemy in the aura |
| 3 | +1% aura damage for every 1% of player's HP missed |
| 4 | Global Decay: All enemies lose 2% of their MaxHP/sec |
| 5 | MAX LEVEL |

## Mechanics

It ticks every 10 frames (~6 times per second).

**L1 - Damage Aura:**
```
distFactor = 1 - (distance / 500)
auraPct = minDmgPct + distFactor × (maxDmgPct - minDmgPct)
tickDmg = playerMaxHp × auraPct / 6 (per tick, taking into account 6 ticks/sec)
```

Where `minDmgPct = 0.05 × dmgAmp` and `maxDmgPct = 0.10 × dmgAmp`, `dmgAmp = 1.0 × HexMultiplier`.

**L2 - Heal for aura:**
```
healPerEnemy = playerMaxHp × (0.002 × HexMultiplier) / 6
totalHeal = healPerEnemy × enemiesInAuraCount
```

**L3 - Missing HP scaling:**
```
missing = 1 - (curHp / maxHp)
dmgAmp += missing (every 1% missing HP → +1% to dmgAmp)
```

**L4 - Global Decay (no range limitation):**
```
tickDmg += (enemy.maxHp × 0.02 × dmgAmp) / 6
```

Applies to **all** enemies on the map regardless of distance.

## Features affected

- [HP](../stats/hp.md) — `playerMaxHp = calcStat(player.hp)` is the aura damage base; healing restores curHp

Radiation Core **does not change** PlayerStats is a periodic damage source independent of `player.dmg`.