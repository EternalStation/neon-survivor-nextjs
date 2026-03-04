# Legendary Skill Merging & Forge Origins

This document describes the implementation of the legendary skill merging logic and the combined forge origin system.

## 1. Core Changes
- Added `forgedAt?: string[]` to the `LegendaryHex` interface in `src/logic/core/types.ts`.
- This property tracks which forge(s) a legendary skill originated from.

## 2. Configuration
- Base legendary upgrades in `LEGENDARY_UPGRADES` (`src/logic/upgrades/LegendaryLogic.ts`) now have initialized `forgedAt` values:
    - **Economic** upgrades: `['Exis']`
    - **Combat** upgrades: `['Apex']`
    - **Defensive** upgrades: `['Bastion']`

## 3. Merging Logic
- All `perform...Merge` functions in `src/logic/upgrades/LegendaryMergeLogic.ts` now use a `combineForgedAt` helper function.
- This function merges the `forgedAt` arrays of both source legendary skills, ensuring that a merged skill inherits all origins from its components.
- For example, merging an upgrade from **Exis** and one from **Bastion** results in a skill with `forgedAt: ['Exis', 'Bastion']`.

## 4. Efficiency & Synergy
- The `EfficiencyLogic.ts` has been updated with a `hasCategory` helper.
- Meteorite perks that require a specific category (e.g., `lvl1_com_eco`) now also check the `forgedAt` property of neighboring legendary hexes.
- A merged legendary skill now provides synergy bonuses for ALL categories corresponding to its forge origins. This significantly empowers merged skills by allowing them to activate more meteorite perks simultaneously.

## 5. UI Presentation
- The `LegendaryDetail.tsx` component now dynamically displays the forge origins.
- Skills with multiple origins show them combined (e.g., "EXIS / BASTION"), while single-origin skills maintain the traditional format (e.g., "EXIS FORGE").
