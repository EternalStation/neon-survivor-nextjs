#TERROR PULSE (ComWave)

**Category:** Combat | **Arena:** 1 (pool: RadiationCore, ComLife, ComCrit, ComWave)

## Perks by level

| Level | Perk |
|---------|------|
| 1 | Active skill: 200% Wave DMG, radius 1500px, cooldown 30s |
| 2 | Wave causes Fear on enemies for 1.5s |
| 3 | 350% Wave DMG (radius 1500px) |
| 4 | Cooldown reduced to 20s |
| 5 | MAX LEVEL |

## Mechanics

**Active Skill** (key 1-5): When activated, instantly deals damage to all enemies in a radius.

```
waveDmg = calcStat(player.dmg) × damageMult
```

| Condition | damageMult |
|---------|-----------|
| L1–L2 | 2.0 (200%) |
| L3+ | 3.5 (350%) |

Damage is applied by hitscan (instantly) to all enemies within `distance < 1500px`.

**L2 - Fear:** Each enemy in radius gets `fearedUntil = gameTime + 1.5s`. Afraid = don't attack/flee.

**Cooldown:** base 30s. From L4 - 20s. [Cooldown Reduction](../stats/cooldown-reduction.md) is further scaled.

## Features affected

- [Damage](../stats/damage.md) — `calcStat(dmg)` is the base damage of the wave
- [Cooldown reduction](../stats/cooldown-reduction.md) - applies to wave cooldown