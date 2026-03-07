# Orbit Assistant: AFK Logic Refactor

## Overview
The AFK (Away From Keyboard) detection logic for the Orbit Assistant has been refactored to be more robust and fulfill player expectations regarding coordinate-based inactivity.

## Changes
### 1. Coordinate-Based Detection
Previously, AFK status was determined solely by checking if movement keys (WASD/Arrows) were being pressed. This caused several issues:
- Players using controllers or joysticks were incorrectly flagged as AFK.
- Players running into walls were not flagged as AFK despite being stationary.
- The logic now uses the player's world coordinates. If the player stays within a 5-unit radius for too long, they are considered stationary.

### 2. In-Game Time Tracking
The AFK timer strictly ticks only during active gameplay and uses the real-time delta (`dt`) ONLY when the game is not paused (`!gameState.current.isPaused`).
- **Improved Behavior**: This ensures players are not penalized for being stationary while navigating pause menus, Upgrade Menus, or the Module Matrix. The previous attempt evaluated the menu time, which clashed with typical player expectations. 
- **Rationale**: Players expect "Pilot here?" prompts only if they are actively idling within the arena and not responding to combat. The timer accurately respects `gameState.current.isPaused` flags.

### 3. Stability Fixes
- Fixed an issue where the AFK strike could trigger while the player was actively moving if their input method wasn't keyboard-based.
- Ensured that movement detected via coordinate changes correctly resets the AFK phases.

## AFK Phases
1. **Pilot here?**: Triggers after 10 seconds of stationarity.
2. **Control yoke feedback warning**: Triggers after 16 seconds.
3. **Lock-in Phase**: Triggers after 22 seconds. Orbital strike coordinates are locked.
4. **Strike Execution**: After a 10-second warning sequence, an orbital laser is deployed at the last known coordinates.
