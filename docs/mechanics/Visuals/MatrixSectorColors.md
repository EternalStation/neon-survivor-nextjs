# Matrix Sector Colors Update

The visual representation of Sectors in the **Module Matrix** (Hex Grid) has been updated to use a unified purple color palette, improving consistency with the Recalibrate and Inventory modules.

## Sector Color Mapping

| Sector | Code | Old Color | New Color | Palette |
| :--- | :--- | :--- | :--- | :--- |
| **Sector 01** (Economic) | `SEC-01` | Yellow (`#fbbf24`) | Light Purple (`#e9d5ff`) | `e9d5ff` |
| **Sector 02** (Combat) | `SEC-02` | Red (`#ef4444`) | Purple (`#c084fc`) | `c084fc` |
| **Sector 03** (Defensive) | `SEC-03` | Blue (`#3b82f6`) | Deep Purple (`#a855f7`) | `a855f7` |

## Changes
- Updated `HexGrid.tsx` sector definitions to use the new hex codes.
- Verified that perk filters in `InventoryPanel.tsx` and `RecalibrateInterface.tsx` correctly reference these colors for sector-based highlights.
- Ensured that the background glow of the integrated pods on the grid matches the new color scheme.
