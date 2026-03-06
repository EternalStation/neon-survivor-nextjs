# Aegis Protocol (CombShield) Balance Update

The per-kill bonuses for the Aegis Protocol (CombShield) legendary hex have been adjusted to bring its scaling closer to the established economic and defensive standards.

## Changes:

| Level | Feature | Previous Value | New Value | Change |
| :--- | :--- | :--- | :--- | :--- |
| **LVL 1** | Armor per kill (Flat) | +0.01 | **+0.05** | +400% |
| **LVL 2** | Collision DMG Reduction % | +0.01% | +0.01% | (Unchanged) |
| **LVL 3** | Projectile DMG Reduction % | +0.01% | +0.01% | (Unchanged) |
| **LVL 4** | Armor % per kill | +0.05% | **+0.02%** | -60% |

## Rationale
The flat Armor per kill was significantly lower than other flat bonuses (+0.01 vs +0.1 or +0.05), making it feel unrewarding early on. It has been increased to +0.05. Conversely, the percentage scaling at Level 4 was slightly too high for late-game armor stacking and was reduced to +0.02% to match the new scaling curves of other legendary hexes.

## Files Modified:
- `src/logic/upgrades/LegendaryLogic.ts`: Updated bonus calculation logic.
- `src/lib/uiTranslations.ts`: Updated English perk descriptions.
