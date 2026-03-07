# Necro-Kinetic Engine (Blood-Forged Capacitor) Fix

## Problem
After merging **Kinetic Battery** and **Crimson Feast** (Lifesteal) into the **Necro-Kinetic Engine**, zombies stopped spawning. This was due to a hardcoded level check in `DeathLogic.ts` that only looked for the base `ComLife` hex and did not account for its fusions.

## Fix Implementation

### 1. Unified Level Checking
- Updated `DeathLogic.ts` to use `getHexLevel(state, 'ComLife')` instead of a manual find in `moduleSockets.hexagons`.
- Since `getHexLevel` in `LegendaryLogic.ts` already handles inheritance (returning level 5 for fusions like `BloodForgedCapacitor` and `ChronoDevourer`), this fixes zombie spawning for all relevant fusions.

### 2. Verified Necro-Kinetic Mechanics
- **Lifesteal from Shockwaves**: Confirmed that `processPendingZaps` in `PlayerCombat.ts` correctly applies lifesteal when the Necro-Kinetic Engine is active.
- **Zombie Consumption Bolts**: Verified that `updateZombie` in `UniqueEnemyLogic.ts` correctly triggers Green Kinetic Bolts (20% Armor DMG, 3 targets) on successful enemy consumption.

### 3. Code Cleanup
- Removed all comments from modified files (`DeathLogic.ts`, `PlayerCombat.ts`, etc.) to maintain project standards.
