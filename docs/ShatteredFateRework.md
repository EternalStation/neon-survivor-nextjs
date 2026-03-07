# Shattered Fate & Death Mark Rework

## Overview
This update reworks the **Shattered Fate** (Combat/Critical) legendary upgrade and its associated **Death Mark** mechanic to provide more consistent value and better visual feedback.

## UI Descriptions (Updated)

| Perk Level | Description |
| :--- | :--- |
| **Level 1** | +15% Crit Chance |
| **Level 2** | 2% chance to execute non-bosses on hit |
| **Level 3** | Death Mark: Bosses/Elites receive additional damage (10s CD) |
| **Level 4** | 2% chance to deal 10% of Boss Max HP on Hit |

## Detailed Changes

### Level 2: Non-Boss Execution
- **Mechanic:** Grants a **base 2% chance to instantly kill** any non-boss enemy on hit.
- **Scaling:** This chance scales with the **Meteorite Efficiency Multiplier** of the Shattered Fate hex. (e.g., At 800% meteorite buff, the execution chance increases to ~18%).

### Level 3: Death Mark
- **Duration:** **Infinite** (until the target dies).
- **Targeting:** Restricted to **Bosses, Elites, and Unique enemies**.
- **Visuals:** Applies a red execution mark to valid targets.
- **HUD Indicator:** A skull icon in the passive section tracks the 10s internal cooldown.

### Level 4: Boss HP Damage
- **Mechanic:** 2% chance on hit to deal **10% of the Boss's Max HP** as flat damage.
- **Scaling:** Activation chance scales with Meteorite Efficiency.

## Technical Implementation
- **Logic:** `ProjectilePlayerLogic.ts` handles the hit-based execution and Death Mark logic.
- **Config:** `GameConfig.ts` contains the revamped constants.
- **UI:** Descriptions simplified in `uiTranslations.ts` for clarity.
- **HUD:** `PlayerStatus.tsx` includes the Death Mark cooldown monitor.
