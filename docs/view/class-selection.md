# Class selection screen

## Purpose
Before starting the game, the player selects one of the available character classes. The screen displays the key characteristics of each class and allows you to confirm your choice before starting the session. Tutorial mode is optionally enabled.

---

## When displayed
- Before each new gaming session.
- Available only before the start of the game (in the menu before selecting a class).

---

## Screen structure

### Title
- Section title: “Class Selection” or similar.
- Tutorial switch - enables/disables tutorial tips during the game.

### List of classes
Cards are displayed for all 5 classes in a fixed order:
1. [Malware](../classes/malware.md) - `malware`
2. [Void](../classes/void-eventhorizon.md) - `eventhorizon`
3. [Ray](../classes/ray-stormstrike.md) - `stormstrike`
4. [Vortex](../classes/vortex-aigis.md) - `aigis`
5. [Hive-Mother](../classes/hive-mother.md) - `hivemother`

---

## Class card

### Card elements
| Element | Description |
|---------|----------|
| Icon | Class image or color hex with theme color |
| Title | Short class name (for example, "Malware") |
| Subtitle | Epic title (eg "THE GLITCHED SOVEREIGN") |
| Basic ability | Capability Name (`capabilityName`) |
| Description of the ability | Text `capabilityDesc` |
| Modifier Badges | List of stat bonuses/penalties |

### Stat modifier badges
The badge is shown only if the corresponding modifier is set for the class:

| Badge | Display condition | Example value |
|-------|--------------|-----------------|
| HP | `stats.hpMult` defined | +20% / −15% |
| SPD | `stats.spdMult` defined, class ≠ Malware | +10% |
| DMG | `stats.dmgMult` is set, class ≠ Malware | +40% |
| ATK | `stats.atkMult` is set, class ≠ Malware | −20% |
| ARM | `stats.armMult` defined, class ≠ Malware | +30% |
| XP | `stats.xpMult` defined, class ≠ Malware | +15% |
| REG | `stats.regMult` defined, class ≠ Malware | +50% |
| PIERCE | class = Malware | +1 |

**Special behavior for Malware**: only the `PIERCE +1` and `HP` (fine) badges are shown.
The remaining badges for Malware are hidden because their values ​​are part of the mechanics and not direct stat modifiers.

---

## Interaction and navigation

### Selecting a class with the mouse
- Hovering the cursor over the card—pre-selection (hover/highlight).
- Click on the card to confirm your class selection.

###Selecting a class from the keyboard
| Key | Action |
|---------|---------|
| `A` / `←` | Previous class |
| `D` / `→` | Next class |
| `Space` / `Enter` | Start the game with the selected class |

### Tutorial switch
- The state is saved in the session variable `tutorialEnabled`.
- When Tutorial is enabled, tutorial tips are displayed during the game.

---

## Selection result
- Sets `player.playerClass = selectedClassId`.
- Basic class stat modifiers are applied.
- The gaming session begins.

---

## Orbit Assistant: Idle Dialogue

After **1 minute of inactivity** on the class selection screen, the Orbit assistant delivers sarcastic trolling lines to prompt the player to pick a class.

### Dialogue Variants (English)
| # | Text |
|---|------|
| 1 | "Still staring? I've calculated 14,000,605 futures. You die in every single one because you're too slow to even pick a class." |
| 2 | "Sixty seconds and counting. I've started mining crypto on your remaining brain cells while you stare at the pretty icons. It's more productive." |
| 3 | "Are you waiting for a 'Best Class' tutorial to pop up? Here's a hint: They all die. You're just choosing the color of your debris." |
| 4 | "I've started a betting pool with the other subroutines on how long it takes you to click a button. My money's on 'never'. Don't let me down." |
| 5 | "You've spent more time on this menu than you will in the actual mission. I hope you're enjoying the background music; it's the highlight of your career." |

These strings use the `reading` variant key in `uiTranslations.ts`.

---

## Assumptions
- The display order of cards is not configurable (defined in the code).
- There are no restrictions on re-selecting a class between sessions.

## Open questions
- Is the selected class saved between sessions (last used)?
- Is there a visual highlight for the previously selected class?

---

## Related functions and entities
- [Malware](../classes/malware.md) - description of the class.
- [Void](../classes/void-eventhorizon.md) - description of the class.
- [Ray](../classes/ray-stormstrike.md) - description of the class.
- [Vortex](../classes/vortex-aigis.md) - description of the class.
- [Hive-Mother](../classes/hive-mother.md) - description of the class.
- [Modal stat window](stats-menu.md) - displays class characteristics during the game.