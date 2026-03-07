# Turret Interaction Range Fix

## Description
This updates the range logic for interacting with turrets to resolve an issue where players standing at the edge of the visual radius could see the "E" prompt but could not activate the turret when pressing the key.

## Changes
- **Logic Sync**: Updated `TurretLogic.ts` interaction check from a hardcoded `200` to `turret.radius + 100`.
- **UI Sync**: Updated `PoiRenderer.ts` visibility check for the "E" prompt from a hardcoded `200` to `poi.radius + 100`.
- **Result**: The "E" keybind prompt now appears exactly when the player enters the interaction trigger volume, ensuring that if the prompt is visible on screen, the player is guaranteed to be in range to activate the turret.
