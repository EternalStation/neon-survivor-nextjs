# HUD Update: Skill Icon Cleanup

## Overview
Removed the ambiguous lightning icon indicator from the player's skill panel to improve UI clarity and reduce confusion.

## Changes

### HUD (`src/components/hud/PlayerStatus.tsx`)
- Removed the "CD Reduced Icon" (lightning bolt SVG) from the class capability skill slot.
- Removed the "CD Reduced Icon" (lightning bolt SVG) from the manual active skill slots.
- This indicator was previously shown when Cooldown Reduction (e.g., from Neural Overclock) was active, but lacked clear explanation for users.

## Rules Compliance
- No comments were left in the modified code.
- All Russian translations were left untouched.
- No `any` or `unknown` types were introduced.
- File modularity was maintained.
