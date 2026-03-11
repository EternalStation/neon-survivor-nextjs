# CHRONO PLATING (Chrono Plating)

**Category:** Defensive | **Arena:** 2 (pool: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Perks by level

| Level | Perk |
|---------|------|
| 1 | 10% of all dmg dealt to you is dealt over 6 seconds |
| 2 | 400px Zone Slow enemies and their projectiles by 50% if you stay in one place for 2 seconds |
| 3 | +0.25% Cooldown reduction every minute survived |
| 4 | 1% of your armour increases your HP/sec % |
| 5 | MAX LEVEL |

## Mechanics

**L1 - Time Loop:**
- 10% of any damage taken is stored in a `timeLoopPool`.
- This percentage scales with **Meteorite Multipliers**.
- This pool is drained over the next 6 seconds (1/360th per frame at 60fps).
- The player takes damage for the drained amount as a "Time Loop" effect.
- The initial impact damage is reduced by the amount stored in the pool.

**L2 - Stasis Field:**
- Tracking starts when the player is stationary and not stunned.
- After 2.0 seconds of immobility, a 400px "Time Zone" is activated at the player's position.
- This 400px radius is **STATIC** and does not scale with meteorites.
- While inside/while field is active:
    - Player receives +50% Armor bonus (`hexMult`).
    - Enemies within the 400px zone are slowed by 40%.
    - Enemy projectiles passing through the 400px zone are slowed by 40%.
- Moving or being stunned resets the timer and deactivates the field.

**L3 — 0.25% Cooldown reduction every minute survived:**
- Every minute since acquisition of L3, the `player.cooldownReduction` parameter is increased by 0.0025.
- This bonus scales with the Hex Multiplier (if applicable).
```
player.cooldownReduction += minutes * 0.0025 * multiplier;
```

**L4 - Temporal Vitality:**
- Your total Armor (after all calculations) provides a percentage bonus to your HP Regeneration.
```
reg.hexMult += totalArmor × 0.01 × HexMultiplier
```

## Features affected

- [Recharge](../stats/cooldown.md) — L3: time-scaling CDR
- [HP Regeneration](../stats/regen.md) - L4: percentage regeneration through armor
- [Health](../stats/health.md) - L1: damage delay and recovery
- [Defense](../stats/damage-reduction.md) - L2: stationary armor boost

##UI Improvements

- **L3: Accumulated CDR** — The UI now displays the total accumulated cooldown reduction since reaching Level 3. Example: `0.25% Cooldown reduction every minute (1.25% total)`.
- **L1, L2, L4: Actual Armor Bonus** — The UI now shows the exact percentage bonus being granted based on your current armor. Example: `1% of your Armor increased your DMG% (+15.0% actual)`.
- **Actual Cooldowns** — Any perk mentioning a cooldown (CD) will now show the actual cooldown after accounting for the player's total Cooldown Reduction. Example: `(6.4s actual)`.