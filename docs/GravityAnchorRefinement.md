# Gravity Anchor Refinement

## Changes Made

### 1. Real-time Execution
- **Instant Response**: Execution logic has been moved out of the 0.5s damage pulse timer. Enemies inside the Gravity Anchor epicenter are now checked for the execution threshold every frame.
- **Improved UX**: Enemies no longer "sit" at low health waiting for the next pulse to die; they are executed the moment their health drops below the threshold (5% base, plus meteorite scaling).

### 2. Execution on Death
- **Universal Execution**: Any enemy that dies within a Gravity Anchor epicenter (whether from epicenter damage, player weapons, or other sources) is now correctly marked as **Executed**.
- **Explosion Triggering**: All enemies dying in the epicenter now trigger the Gravity Anchor's signature explosion (10% MAX HP AOE damage in a 200px radius), as per user requirements.

### 3. Threshold Calibration
- **Base Threshold**: The base execution threshold is confirmed at **5%** as requested.
- **Scalable Percent**: The percentage continues to scale with **Meteorite Efficiency** if the player has boosted the Gravity Anchor or Aegis Protocol.

### 4. UI & Documentation Updates
- **Threshold Calibration**: Verified and set all instances of the execution threshold to **5%** (calibrated from the previously requested 10%).
- **Legendary Description**: Updated the core description in `LegendaryLogic.ts` to explicitly state the 5% execution threshold and 2% armor scaling.
- **Fusion Menu Fixes**: Resolved a bug in `FusionMenu.tsx` where legendary descriptions and perks were hidden due to incorrect translation paths for fusion legendaries.
- **English Translations**: Ensured `uiTranslations.ts` correctly reflects all mechanics (5% threshold, 10% MAX HP explosion, 200px radius).

### 5. Technical Details
- Modified `src/hooks/useAreaEffectLogic.ts` to separate the high-frequency execution check from the lower-frequency damage pulse.
- Updated `src/logic/mission/DeathLogic.ts` to ensure that any death within a Gravity Anchor-enabled epicenter triggers the execution flag and associated particle/damage effects.
- Synced state handling to avoid double explosions or redundant calculations.
