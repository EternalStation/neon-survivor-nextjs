# EPICENTER (DefEpi)

**Category:** Defensive | **Arena:** 2 (pool: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Perks by level

| Level | Perk |
|---------|------|
| 1 | Active Skill: Throws a spike zone for 10s. The player can move. 50% slowdown of enemies, damage 25%/sec from player damage. Cooldown 30s. Huge damage (25%) is multiplied by meteorites. |
| 2 | Gravity Core: Pulls enemies inside with the force of a black hole (Event Horizon). |
| 3 | Radius increases by 20% for 10 seconds (multiplied by meteorites). |
| 4 | Schism Protocol: Kills enemies below 5% HP (kill threshold multiplied by meteorites). |
| 5 | MAX LEVEL |

## Mechanics

**Active skill:** when activated, an `epicenter` area is created (the player is free).

- Spikes deal damage to all enemies by pulsing every 0.5s: `player.dmg × 0.25 (base) / sec`.
- Enemies in the area are slowed by 50%.

**L2 - Gravitational core:**
- Enemies inside are drawn towards the center.

**L3 — Radius growth:**
- Over time (up to 10s), the radius of the zone increases by 20% (base).

**L4 - Execution:**
- All non-boss enemies die instantly if their HP drops below 5% (base). Multiplied by meteorites.

**Cooldown:** 30s base (scaled by [Cooldown Reduction](../stats/cooldown-reduction.md)).

---

**Note:** The lesion area is synchronized with the visual ellipse (0.6 perspective distortion in the Y axis). Further growth of the radius on L3 is correctly displayed visually.