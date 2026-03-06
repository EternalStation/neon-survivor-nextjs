# Interact Keybind and POI Interaction Update

## Changes Overview

### 1. New "Interact" Keybind
- Added a customizable **Interact** keybind to the settings.
- **Default Key**: `E` (`KeyE`).
- Used for interacting with Points of Interest (POIs) such as Turrets, Anomaly Boss Circles, and Overclock stations.

### 2. Turret Interaction Overhaul
- **Instant Activation**: Turrets can now be activated immediately by pressing the **Interact** key while standing within their range.
- **Hold Removed**: The previous mechanic of standing near a turret to "charge" it has been removed in favor of instant activation.
- **Cost**: Activation still consumes Meteorite Dust based on the current usage level.

### 3. Boss Summoning (Anomaly Circles)
- **Manual Trigger**: Anomaly boss circles now require a press of the **Interact** key to start the summoning process.
- **Countdown**: Once triggered, a **5-second countdown** begins. The boss will spawn automatically at the end of this countdown.
- **Mobility**: The player no longer needs to stay within the circle once the summoning has been initiated.

### 4. Overclock POI
- **Instant Activation**: Overclock stations now trigger instantly upon pressing the **Interact** key while in range.

## Perk Balance Adjustments

### EcoDMG (Storm of Steel)
- **Level 1**: Reduced DMG per kill from `+0.1` to `+0.05`.
- **Level 2**: Reduced Attack Speed (ATC) per kill from `+0.05` to `+0.02`.
- **Level 4**: Replaced soul-based AOE with **Player Level scaling**.
    - **New Mechanic**: `0.5% * Player Level` chance to deal **100px AOE** damage on hit.

### Aegis Protocol (CombShield)
- **Level 1**: Increased flat Armor per kill from `+0.01` to `+0.05`.
- **Level 4**: Reduced Armor % scaling from `+0.05%` to `+0.02%` per kill.

## Technical Implementation
- Modified `src/logic/utils/Keybinds.ts` to include the new bind.
- Updated `src/hooks/useGameInput.ts` and `src/hooks/useGame.ts` for input processing.
- Refactored `src/logic/mission/TurretLogic.ts` and `src/logic/enemies/EnemySystemLogic.ts` for new POI behaviors.
- Updated `src/lib/uiTranslations.ts` and `src/components/KeybindSettings.tsx` for UI support.
