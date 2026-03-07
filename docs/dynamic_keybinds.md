# Dynamic Keybind Implementation for Turret and Overlord Interaction

This update ensures that the turret activation and Overlord summoning (via anomaly interaction) keys are dynamically linked to the user's "Interact" keybind set in the settings.

## Changes

### 1. Game State Synchronization
- Added a `keybinds` property to the `GameState` interface to store the user's current keybind configuration.
- Initialized the `keybinds` property in the `createInitialGameState` function using the current settings.
- Implemented a synchronization mechanism in the `useGame` hook that listens for `keybindsChanged` events and updates the `GameState` in real-time when the user modifies their controls.

### 2. UI and Label Updates
- Modified `PoiRenderer.ts` to replace hardcoded "PRESS [E]" labels with dynamic labels.
- The interaction prompt for Anomalies (to summon the Overlord) now displays the correctly bound key: `PRESS [{KEY}] TO SUMMON`.
- The character displayed at the center of the turret repair/activation icon now dynamically shows the currently bound interaction key.

### 3. Logic Consistency
- Verified and ensured that the turret and anomaly interaction logic correctly utilizes the `interactPressed` flag, which is driven by the dynamic keybind system.
- Confirmed that other interactive elements like the Portal and Dash also use their respective dynamic keybinds.
