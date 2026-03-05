# Modal stat window (StatsMenu)

## Purpose
Displays the player's current characteristics and difficulty forecast directly during the game session. Allows you to evaluate the effect of accumulated upgrades and see the dynamics of the threat.

---

## When displayed
- Opened manually by the player during a pause or in a special menu within the game.
- Not available on the class selection screen and outside the active session.

---

## Window structure

The window is divided into two tabs: **System** and **Threat**.

---

## System tab

Displays all the current characteristics of the player, taking into account all upgrades and class bonuses.

### Features displayed

| Parameter | Display condition |
|----------|--------------|
| Health (HP) | Always |
| Regeneration | Always |
| Damage | Always |
| Attack Speed ​​| Always; additionally shows the calculation of shots per second |
| Armor | Always; additionally shows % damage reduction |
| Movement Speed ​​| Always |
| Cooldown Reduction | Always |
| Collision Reduction | Always |
| Projectile Reduction | Always |
| Lifesteal | Only if active (value > 0) |
| XP Gain | Always |
| Meteorite Chance | Always |
| Pierce | Always (including class bonus [Malware](../classes/malware.md)) |

### Formula for calculating characteristics
```
Total = (Base + Flat + HexFlat)
        × (1 + NormalMult%)
        × (1 + HexMult%)
        × (1 + HexMult2%)
        × ArenaMult
```
Where:
- **Base** — base value of the characteristic.
- **Flat** - absolute increases from upgrades.
- **HexFlat** - absolute increases from hexagonal upgrades.
- **NormalMult** - total percentage bonus from normal upgrades.
- **HexMult / HexMult2** - percentage bonuses from hexagonal upgrades (two independent multipliers).
- **ArenaMult** - modifier depending on the arena conditions.

### Radar Chart (RadarChart)
- Visualizes the main characteristics in the form of a polygon.
- Displayed next to the characteristics table.
- The exact set of chart axes and their normalization require clarification.

---

## Threat tab

Displays a forecast for the growth of game difficulty over time.

### Contents

| Section | Description |
|--------|---------|
| HP of enemies in time | Logarithmic scale: how the health of enemies grows as the game progresses |
| Spawn speed | Linear scale: how the frequency of enemy spawns increases |
| Next Boss | Information about when the next boss will appear and what type |

---

## Communication with class data

- The window reflects the **final values** of characteristics, taking into account all class modifiers.
- Basic bonuses of each class are applied automatically and are visible in StatMenu without special marks.
- Example: [Malware](../classes/malware.md) will show `Pierce: 1` (from class) + additional penetration from upgrades.
- Example: [Void](../classes/void-eventhorizon.md) will show `Armor` taking into account +30% of the class.

Class mechanics (ricochets, singularity, rings) **do not appear** in this window - they are described in the class card on the [selection screen](class-selection.md).

---

## Assumptions
- The System and Threat tabs are switched within the same modal window.
- RadarChart is a separate component built into the System tab.

## Open questions
- What set of axes does RadarChart have? Does it match the list of characteristics or is it a subset?
- Is there a button to close the modal window or is it closed only by a key?
- Are the name and icon of the current class displayed in the window title?

---

## Related functions and entities
- [Class selection screen](class-selection.md) - initial selection of a class and display of its description.
- [Malware](../classes/malware.md) - a class that adds Pierce to the characteristics.
- [Void](../classes/void-eventhorizon.md) - a class with Armor and Speed ​​bonuses.
- [Ray](../classes/ray-stormstrike.md) - a class with Damage bonuses and an Attack Speed ​​penalty.
- [Vortex](../classes/vortex-aigis.md) - class with HP and Regeneration bonuses.
- [Hive-Mother](../classes/hive-mother.md) - a class with XP and Damage bonuses.