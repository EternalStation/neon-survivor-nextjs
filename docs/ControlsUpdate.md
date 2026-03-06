# Controls and Keybinds Update

## Changes

### 1. Default Keybinds
Modified the default control scheme in `src/logic/utils/Keybinds.ts`:
- **Dash**: Changed from `Space` to `ShiftLeft` (Left Shift).
- **Class Active Skill**: Changed from `KeyE` to `Digit1` (1).
- **Select Upgrade**: Added a new bindable key, defaulting to `Space`.
- **Secondary Skills**: Shifted defaults for `skill1`-`skill6` to `Digit2`-`Digit7` (keys 2-7).

### 2. Localization and Labels
Updated `src/lib/uiTranslations.ts%:
- Renamed the first skill slot to "Class Active Skill" (EN) / "Активный навык класса" (RU).
- Re-indexed subsequent skill slots to "Skill 1" through "Skill 5".
- Added "Select Upgrade" / "Выбор улучшения" labels.

### 3. UI and Logic Integration
- **Keybind Settings**: Added the new "Select Upgrade" control and reorganized the skills list to show the Class Active Skill first.
- **HUD (PlayerStatus.tsx)**: Replaced hardcoded key prompts (E, Space) with dynamic displays reflecting currently assigned keybinds.
- **Upgrade Menu**: Integrated the `selectUpgrade` keybind to allow customized selection keys in the upgrade interface.
- **Skill Allocation**: Adjusted `LegendaryLogic.ts` to skip the `1` key when automatically assigning keys to new acquired skills.

## Verification
- Checked that new defaults load correctly.
- Verified thatrebinding "Select Upgrade" or "Dash" updates the HUD and menu behavior immediately.
- Confirmed that "Class Active Skill" reflects the assigned key correctly in the hexagon indicator.
