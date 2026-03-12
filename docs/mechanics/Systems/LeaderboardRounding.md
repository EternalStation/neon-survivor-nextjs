# Leaderboard Rounding Update

## Overview
Implemented a consistent rounding mechanism for player statistics submitted to the leaderboard to prevent floating-point precision errors and ensure all logged records use clean integers where appropriate.

## Changes

### 1. Kill Count Rounding
- Modified `DeathLogic.ts` to use `Math.ceil()` when incrementing `killCount` and `score`. This ensures that even fractional soul counts (from buffs/multipliers) are always rounded up to the next integer.
- This addresses issues where kill counts could be logged as long decimals (e.g., `27805.34534637477`).

### 2. Leaderboard Preparation
- Updated `leaderboard.ts` to apply `Math.ceil()` to `kills`, `bossKills`, `meteoritesCollected`, `portalsUsed`, and `snitchesCaught` during the run data preparation phase.
- Applied `Math.ceil()` to acquisition and level-up kill counts for Legendary Hexes (`legendaryHexes` and `hexLevelupOrder`).
- Rounded `arenaTimes` to 2 decimal places.
- Updated `safeIntString()` utility to use `Math.ceil()` before converting large numbers (like damage dealt/taken) to strings.
- Changed `calculateScore()` to return a `Math.ceil()`-rounded total.

### 3. Technical Implementation
- Ensured all numeric values in the root of the leaderboard JSON are either integers or limited to 2 decimal places.
- Removed floating-point values from critical scoring metrics.

## Rationale
Floating-point arithmetic in JavaScript can sometimes lead to very precise decimals when small multipliers are applied over long durations (e.g., `0.0003` per kill). By rounding up ("Ceil"), we provide a consistent and player-friendly representation of their performance on the global leaderboard.
