# Chrono Devourer Rework

## Overview
The "Chrono Devourer" fusion has been reworked from an active/passive hybrid skill to a fully passive aura-like component based on user request. 

## Changes Made
- **Removed Active Skill**: Ripped out the active skill functionality from `SkillLogic.ts` that previously exploded all shields for an AOE attack and removed Chrono Devourer from the `ACTIVE_LEGENDARIES` list to stop tracking it as a bindable active action in the player's HUD.
- **Removed Percentage Buff System**: In `PlayerStats.ts`, removed the tracking of `chronoDevourerBuffTime` which used to alter the global percentage `cooldownReduction` stat, since that was identified as causing erratic jumps in cooldown calculations visually and mathematically.
- **Implemented Flat Cooldown Reductions (Including Class Skills)**: Replaced the logic inside `UniqueEnemyLogic.ts`. When a zombie consumes an enemy, it now iterates through all `player.activeSkills` (from hexes) AND targets primary class skill cooldown trackers (like Malware's Sandbox, Event Horizon's Black Hole, etc.) to decrease their recorded `lastUsed` or `cooldownEnd` timestamps by exactly **0.03 seconds**. This ensures the passive reduction applies to all abilities on the player's bar.
- **Localization/Description Updates**: Modified English UI strings in `LegendaryLogic.ts` and `uiTranslations.ts` to reflect these changes (removed mention of the Active shield explosion and updated the zombie kill reward description from "20% Cooldown Recovery Speed for 1s" to "reduce all active skill cooldowns by 0.03s"). Russian translations were intentionally preserved as requested.
- **Post-Test Confirmation**: Verified the logic using temporary 2.0s values on the "Malware" class, confirming that both active hex skills and the Sandbox class skill correctly receive the reduction. Reverted to the production value of 0.03s after confirmation.
