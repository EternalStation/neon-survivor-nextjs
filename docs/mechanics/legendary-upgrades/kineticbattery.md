# KINETIC BATTERY (KineticBattery)

**Category:** Defensive | **Arena:** 2 (pool: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Perks by level

| Level | Perk |
|---------|------|
| 1 | Shockwave on Contact: 100% Armor DMG on 10 targets, cooldown 8s |
| 2 | Shield = 100% of total Armor. Updated every minute |
| 3 | HP < 50%: Armor increases by 100% |
| 4 | Enemies hit by Shockwave (L1) are stunned for 0.5 sec |
| 5 | MAX LEVEL |

## Mechanics

**L1 - Shockwave on contact (and when hitting a wall):**
```
shockDmg = calcStat(player.arm) × 1.0 (100% total Armor)
```
Chain: Hit up to 10 nearby enemies in succession. Cooldown: `8s × cdMod`.

**L2 - Shield:**
```
shieldAmount = calcStat(player.arm) × 1.0
```
The shield is updated every 60 seconds of game time (`kineticShieldTimer`). When receiving damage, the shield absorbs it first. Stored in `player.shieldChunks` with `source: 'kinetic'`.

**L3 - Conditional Armor:**
- If `player.curHp < MaxHP × 0.5`:
  ```
  arm.hexMult2 += 100 × HexMultiplier
  ```
- Added to hexMult2 (second tier of the Armor multiplier).

**L4 - Stun:**
Upon reaching L4, all enemies hit by chain lightning (L1) are stunned for 0.5 seconds. The effect is applied to each of the 10 targets in the chain.

## Features affected

- [Armor](../stats/armor.md) - L3: `arm.hexMult2 += 100%` at HP < 50%; L2 and L1 use `calcStat(arm)` as shield and damage base
- Cooldown Reduction - Affects L1 (Shockwave) trigger frequency