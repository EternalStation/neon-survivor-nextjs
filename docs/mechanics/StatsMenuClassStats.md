# Stats Menu: Base Stats & Class Stats Sections

## Summary
The System tab of the Stats Panel (opened via `C`) now has two clearly separated stat blocks.

## Changes

### `src/components/StatsMenu.tsx`
- Added a **"BASE STATS"** section divider above the existing stats table.
- Added a **"CLASS STATS"** block below the stats table, visible only when the player has a class assigned.

#### CLASS STATS block contents:
1. **Capability header row** — class icon + capability name (e.g., "QUANTUM FRAGMENTATION"), colored with the class theme color.
2. **Stat multipliers** — shows only non-zero multipliers from `PlayerClass.stats`:
   - `hpMult` → Health label
   - `spdMult` → Movement Speed label
   - `dmgMult` → Damage label
   - `atkMult` → Attack Speed label
   - `armMult` → Armor label
   - `xpMult` → XP Gain label
   - `regMult` → Regeneration label
   - `pierce` → Pierce label
   - Positive values colored with class theme color; negative values in red.
3. **Capability metrics** — each entry from `PlayerClass.capabilityMetrics` shown as a row with label, value+unit, and RESONANT/STATIC badges.

### `src/lib/uiTranslations.ts`
- Added `baseStats: 'BASE STATS'` and `classStats: 'CLASS STATS'` to `statsMenu.labels` in the EN translation.
- RU section is unchanged; the component falls back to English strings via type assertion.
