# Recalibration Filter & Version Display Update

## 1. terminology Update
The auto-lock filters in the Recalibration module and Inventory Panel have been updated to use the new terminology:
- **Eco** -> **Exis**
- **Com** -> **Apex**
- **Def** -> **Bastion**

### Changes in `uiTranslations.ts`:
- Updated `recalibrate.legendary` and `recalibrate.combos` in English.
- Updated `matrix.ecoLeg`, `matrix.comLeg`, `matrix.defLeg` and `matrix.combo...` in English.
- English pairings now display as **EXIS-EXIS**, **EXIS-APEX**, etc.

### Changes in `RecalibrateInterface.tsx`:
- Updated the filter dropdown logic to set values matching the new terminology.
- Simplified the version display.

## 2. Version Display Update
The version display in the Recalibrate module and Meteorite Tooltip has been redesigned:
- The "VERSION" label has been removed.
- A stylized "V" now appears to the left of the version number (e.g., **V 1.0**).
- The "V" and number are aligned to the bottom right of the header section.

### Affected Files:
- `src/components/modules/RecalibrateInterface.tsx`: Updated the header info section.
- `src/components/MeteoriteTooltip.tsx`: Updated the header section.
