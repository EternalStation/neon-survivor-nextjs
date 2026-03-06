# EcoDMG (Storm of Steel) Balance & Mechanic Update

The per-kill bonuses for the EcoDMG legendary hex (Storm of Steel) and its derived fusions (Kinetic Tsunami, Soul-Shatter Core) have been adjusted to align with the new economic balance standards. Additionally, the Level 4 perk has been redesigned.

## Changes:

| Tier | Pre-Update Value | Post-Update Value | Description |
| :--- | :--- | :--- | :--- |
| **LVL 1** | +0.1 DMG per kill | **+0.05 DMG** per kill | Flat damage scaling reduced |
| **LVL 2** | +0.1 ATC per kill | **+0.02 ATC** per kill | Flat attack speed scaling reduced |
| **LVL 3** | +0.05% DMG per kill | **+0.05% DMG** per kill | (Remains unchanged) |
| **LVL 4** | Soul-based AOE Chance | **0.5% * Player Lvl** Chance | Now scales with Player Level instead of souls. Deals **100px AOE** damage on hit. |

## Rationale
Following the similar adjustments to **EcoXP** (Neural Harvest) and **EcoHP** (Essence Syphon), **EcoDMG** has been brought into the same scaling curve. The Level 4 change removes the reliance on massive soul counts and provides a more predictable power spike based on your mission progression (Player Level).

## Files Modified:
- `src/logic/upgrades/LegendaryLogic.ts`: Updated bonus calculation logic.
- `src/lib/uiTranslations.ts`: Updated English perk descriptions.
- `src/logic/combat/ProjectilePlayerLogic.ts`: (Used and verified existing implementation)
- `src/components/StatsMenu.tsx`: (Verified display compatibility)
