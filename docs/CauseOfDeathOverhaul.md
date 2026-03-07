# Cause of Death String Overhaul & Boss Identity Updates

## Overview
Replaced the "Fatal Event" terminology on the end-of-run screen (Death Screen) with "Cause of Death" to match standard nomenclature. Additionally completely refactored how boss death causes are recorded and displayed on the leaderboard, ensuring clarity between regular bosses and the summoned hell boss.

## Specific Changes

- **Death Screen Component (`src/components/DeathScreen.tsx`)**
  - Updated the summary label `Fatal Event` to `Cause of Death`.

- **Summoned Hell Boss Naming (`src/logic/enemies/EnemyIndividualUpdate.ts` & `PlayerCombat.ts`)**
  - Re-asserted the official naming for the summoned hell boss as **Overlord**.
  - All occurrences of *Abomination Burn* have been formally updated to **Overlord Burn**.
  - Confirmed and retained `Overlord (Lvl X)` stringing for Anomaly core damage events.

- **Regular Boss String Formatting (`src/logic/player/PlayerCombat.ts` & `BossLogicPart2.ts` & `EnemyIndividualUpdate.ts`)**
  - Regular bosses are strictly named after their shapes appended with their respective level (e.g. `Diamond Boss Level 4 Collision`).
  - Cleared all instances where `OVERLORD` incorrectly prefixed normal boss attack patterns.
  - Granular beam & link abilities for regular bosses have been rewritten dynamically (e.g. `Diamond Boss Level X Beam Attack` and `Pentagon Boss Level X Parasitic Soul Link`).
  - Collision causes of death involving normal bosses dynamically retrieve `bossTier` to display detailed breakdown.
