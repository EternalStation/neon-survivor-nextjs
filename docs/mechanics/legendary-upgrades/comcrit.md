# SHATTERED FATE (ComCrit)

**Category:** Combat | **Arena:** 1 (pool: RadiationCore, ComLife, ComCrit, ComWave)

## Perks by Level

| Level | Perk |
|-------|------|
| 1 | +15% Crit Chance — shots deal 200% damage on crit |
| 2 | HP < 50%: 10% Execute chance on non-bosses |
| 3 | Death Mark: every 10s, marks an enemy — all attacks deal 300% DMG to it for 3s |
| 4 | Boss HP < 40%: 5% Execute chance on bosses |
| 5 | MAX LEVEL (Mergeable into THE SOUL-SHATTER CORE) |

## Mechanics

**L1 — Crit:**
```
CRIT_BASE_CHANCE = 0.15   (+15% crit chance)
CRIT_BASE_MULT   = 2.0    (×2 damage on crit)
```

**L2 — Execute (non-bosses, HP < 50%):**
- On every hit: 10% chance to instantly kill an enemy below 50% HP.
- Does NOT work on bosses.
- `EXECUTE_THRESHOLD = 0.5`
- `EXECUTE_CHANCE    = 0.10`

**L3 — Death Mark:**
- Cooldown: 10 seconds (reduced by Neural Overclock buff).
- On the next hit after cooldown: marks the target with `deathMarkExpiry = gameTime + 3`.
- While marked, ALL hits deal `max(critMult, 3.0)` multiplier instead of normal damage.
- Visual: purple particles + sound cue on marking.
- `DEATH_MARK_MULT     = 3.0`
- `DEATH_MARK_COOLDOWN = 10`
- `DEATH_MARK_DURATION = 3`

**L4 — Boss Execute (HP < 40%):**
- On every hit on a boss: 5% chance to instantly execute when below 40% HP.
- Displays "BOSS EXEC" floating number in red.
- `BOSS_EXECUTE_THRESHOLD = 0.4`
- `BOSS_EXECUTE_CHANCE    = 0.05`

## Fusion

ComCrit at Level 5 can be merged with **Storm of Steel (EcoDMG)** to create **THE SOUL-SHATTER CORE**, which inherits all 4 perks above.
