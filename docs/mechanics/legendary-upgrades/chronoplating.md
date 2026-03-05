# CHRONO PLATING (Chrono Plating)

**Category:** Defensive | **Arena:** 2 (pool: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Perks by level

| Level | Perk |
|---------|------|
| 1 | 1% of your armor increased your DMG% |
| 2 | 1% of your armor increased your HP% |
| 3 | 0.25% Coldon reduction every minute |
| 4 | 1% of your armor increased your HP/sec% |
| 5 | MAX LEVEL |

## Mechanics

**L1 - Armor → Damage:**
```
dmg.hexMult += totalArmor × 0.01 × HexMultiplier (added to dmg_pct_per_kill)
```

**L2 - Armor → HP:**
```
hp.hexMult += totalArmor × 0.01 × HexMultiplier (added to hp_pct_per_kill)
```

**L3 — 0.25% Cooldown reduction every minute:**
Every minute since L3, the `player.cooldownReduction` parameter is increased by 0.0025.
```
player.cooldownReduction += minutes * 0.0025;
```

**L4 - Armor → HP/sec:**
```
reg.hexMult += totalArmor × 0.01 × HexMultiplier (added to reg_pct_per_kill)
```

## Features affected

- [Damage](../stats/damage.md) — L1 (`dmg.hexMult` via armor)
- [Health](../stats/health.md) - L2 (`hp.hexMult` via armor)
- [Recharge](../stats/cooldown.md) — L3: time-scaling CDR
- [HP Regeneration](../stats/regen.md) - L4: percentage regeneration through armor

##UI Improvements

- **L3: Accumulated CDR** — The UI now displays the total accumulated cooldown reduction since reaching Level 3. Example: `0.25% Cooldown reduction every minute (1.25% total)`.
- **L1, L2, L4: Actual Armor Bonus** — The UI now shows the exact percentage bonus being granted based on your current armor. Example: `1% of your Armor increased your DMG% (+15.0% actual)`.
- **Actual Cooldowns** — Any perk mentioning a cooldown (CD) will now show the actual cooldown after accounting for the player's total Cooldown Reduction. Example: `(6.4s actual)`.