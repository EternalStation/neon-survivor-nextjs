# Shield Bar Scaling and Code Cleanup

## Changes Overview

### 1. Shield Bar Capacity Calculation
The shield bar's maximum capacity (`dynamicMaxShield`) has been adjusted to provide a more accurate and intuitive representation of the player's defensive status:
- **Armor Scaling**: The `KineticBattery` legendary now contributes to shield capacity at a **1:1 ratio** with the player's armor value (`player.arm`), instead of the previous 5x multiplier. This ensures the shield bar fills up as expected based on armor gains.
- **Overheal Limit**: The `ComLife` legendary's overheal capacity has been reduced to **0.5x of Max HP** (down from 1.0x). This makes the shield bar more responsive and prevents it from being dominated by excessive overheal values.
- **Dynamic Response**: The bar now dynamically scales to the maximum of calculated capacity or current total shield, ensuring it never overflows or looks empty when a lot of shield is present.

### 2. Code Cleanup (Rule 2 Compliance)
- All comments (single-line and multi-line) have been removed from `src/components/hud/PlayerStatus.tsx`.
- The file structure was audited to ensure no residue comments or non-functional code remains.

### 3. Visual Consistency
- Fixed JSX structure for class skills and active skills display on the HUD.
- Ensured hexagon border containers are correctly rendered for all skill slots.
