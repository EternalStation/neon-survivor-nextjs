# TOXIC SWAMP (DefPuddle)

**Category:** Defensive | **Arena:** 2 (pool: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Perks by level

| Level | Perk |
|---------|------|
| 1 | Active Skill: Acid Pool deals 5% of enemy's MaxHP/sec, duration 10s |
| 2 | Acid slows enemies by 20%, +20% damage taken |
| 3 | While the player is in a puddle: +25% MaxHP and +25% Regen/sec |
| 4 | Slow increases to 40%, +40% damage taken |
| 5 | MAX LEVEL |

## Mechanics

**Cooldown:** 25s base (scaled by [Cooldown Reduction](../stats/cooldown-reduction.md)).

**L1 - DoT of puddles:**
- A puddle is created in the player's position.
- Each enemy in the zone receives: `5% × enemy.maxHp/sec` tick damage.
- Duration: 10 seconds.

**L3 - Player Buff:**
While `player.buffs.puddleRegen === true` (player is in a puddle):
- `hp.hexMult += 25` → MaxHP increases by 25%
- `reg.hexMult += 25` → Regen increases by 25%

These bonuses are temporary: only applied in frames when the buff is active.

## Features affected

- [HP](../stats/hp.md) — L3: `hp.hexMult += 25%` (while in a puddle)
- [HP Regeneration](../stats/regen.md) — L3: `reg.hexMult += 25%` (while in a puddle)
- [Cooldown reduction](../stats/cooldown-reduction.md) - applies to the cooldown of the puddle