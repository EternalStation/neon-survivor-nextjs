# Keybind and Skill Numbering Refinement

## Context
Players reported a mismatch between displayed keybinds and actual input for active skills. Specifically, while the first acquired skill was triggered by the '1' key, the UI displayed '2', and the settings menu labels were confusingly offset.

## Changes

### 1. Default Keybind Modernization
Updated `src/logic/utils/Keybinds.ts` to implement a more standardized control scheme:
- **Class Active Skill**: Moved from `Digit1` to `KeyQ`.
- **Active Skills 1-6**: Shifted from `Digit2-Digit7` to `Digit1-Digit6`.
- This separates the Class Ability from the numeric skill bar, allowing acquired skills to start at `1`.

### 2. Skill Allocation Logic Fix
Modified `src/logic/upgrades/LegendaryLogic.ts` and `src/logic/upgrades/LegendaryMergeLogic.ts`:
- Expanded `availableKeys` to include `'1'`.
- First acquired active skills will now be correctly assigned the `'1'` badge, matching the input index.

### 3. Settings UI Clarification
Updated `src/components/KeybindSettings.tsx` and `src/lib/uiTranslations.ts`:
- Added `skill7` (labeling "Skill 6") to the English translation.
- Renamed labels to be more intuitive: "Active Class Skill" followed by "Skill 1" through "Skill 6".
- Ensured the settings menu correctly maps these labels to the underlying keybind IDs.

## Result
- **Class Ability** is on **Q** by default.
- **First acquired skill** is on **1** and shows **1** in the HUD.
- Keybind settings clearly distinguish between the Class Ability and acquired Skills.
