# Keybinds and POI Activation Update

## 1. Customizable Movement Keybinds
Players can now customize their movement keys in the settings menu. The following systems have been updated to support this:
- **Player Movement**: The core movement logic now uses the custom keys if default movement is disabled.
- **UI Navigation**: Directional navigation in the following menus now reflects the user's custom keybinds:
    - `UpgradeMenu`
    - `ArenaSelection`
    - `LegendarySelectionMenu`
    - `DeathScreen` (Tab switching)

## 2. Overclock POI Activation
The "Overclock" Point of Interest (POI) has been reworked for better flow:
- **Automatic Activation**: Players no longer need to press an interact key to activate the Overclock.
- **Stay-to-Activate**: Staying within the POI radius fills an activation bar. Once it reaches 100% (takes approximately 3 seconds), the Overclock effect is triggered automatically.
- **Decay**: If the player leaves the radius before activation is complete, the progress slowly decays.

## 3. Critical Hit Balance
- **Base Crit Chance**: Reduced from 15% to 5% (`CRIT_BASE_CHANCE` in `GameConfig.ts`).
- **Legendary Upgrades**: Updated `Shattered Fate` (ComCrit) to provide +5% Crit Chance to align with the new base value.
## 4. Overlord & Anomaly POI Updates
- **Overlord Visual Fix**: Fixed an issue where the Overlord (Abomination) boss appeared as a circle. It now correctly renders as a distorted bull-like head.
- **Anomaly Data Label**: Added a detailed tactical label to the Anomaly summon point.
    - **Calculated Stats**: Shows HP, Burn damage, and Collision damage adjusted for the player's current armor and reductions.
    - **Summon Prompt**: Replaced the large floating "E" with a standard summon prompt at the ritual area.
    - **Label Placement**: Data box is now anchored to the summon point rather than the boss.
