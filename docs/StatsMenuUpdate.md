# Stats Menu UI Update

Reordered the stats in the **System Diagnostics** tab to prioritize fundamental player attributes and updated specific stat displays for better clarity.

## Changes

### 1. Stat Reordering
- Moved **Health**, **Regeneration**, **Damage**, and **Attack Speed** to the top of the list, before defensive and utility stats like Armor.
- This ensures the most critical combat values are immediately visible to the player.

### 2. Attack Speed Display Refinement
- Removed the `x 100%` multiplier display from the **Attack Speed** calculation row.
- This aligns with current balance changes where Attack Speed is treated as a flat score scaling rather than a percentage-based multiplier in the UI breakdown.

### 3. Code Quality & Compliance
- Removed all developer comments from `StatsMenu.tsx` per project rules.
- Fixed prop-drilling for translation context to resolve linting errors.
- Verified file length remains well under the 800-line limit.
