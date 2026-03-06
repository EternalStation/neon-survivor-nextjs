# Ray Class Metric Update - Strike Radius

## Overview
Added a new performance metric to the Ray (Stormstrike) class description menu: **Strike Radius**.

## Changes
- **Strike Radius**: Added performance metrics for the Ray class.
  - **Max Radius**: 250px (Base), scales 1:1 with resonance.
  - **Min Radius**: 50px (Base), scales 1:1 with resonance.
  - **Laser AOE**: Updated base to 50px (previously 60px), scales 1:1 with resonance.
  - **UI Layout**: Metrics reordered to show:
    - Left Column: Recharge, Max Lasers, Laser AOE.
    - Right Column: Min DMG, Max DMG, Strike Radius.
  - **Scaling**: All relevant metrics scale fully with Octave Resonance.
  - **Description**: Lasers now strike between the inner and outer rings, both of which expand as you gain resonance.

## Files Modified
- `src/logic/core/classes.ts`: Added the metric to the `stormstrike` class definition.
- `src/lib/uiTranslations.ts`: Added the metric label and description to the English translations.
