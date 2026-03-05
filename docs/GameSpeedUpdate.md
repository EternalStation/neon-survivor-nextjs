# Game Speed Update

## Changes
- Updated the default game speed from 100% (1.0x) to **120% (1.2x)** for a more dynamic starting experience.
- The game speed setting continues to persist in `localStorage`. If a player manually adjusts the speed in the settings menu, their preference will be saved and used instead of the default.

## Implementation Details
- Modified `createInitialGameState` in `GameState.ts` to use `1.2` as the fallback if no saved speed is found.
- Updated the `gameSpeedMult` state initialization in `useGame.ts` to default to `1.2`.
- Updated `SettingsMenu.tsx` default props and initial local state to align with the new 1.2 default.
