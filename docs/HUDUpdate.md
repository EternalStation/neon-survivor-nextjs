# HUD Update: Enemy HP Display

## Overview
Added a new UI element to the top-left HUD panel that displays the HP of the current minute's enemy types. This provides players with a tactical overview of enemy scaling throughout the game.

## Changes

### Logic (`src/logic/enemies/EnemySpawnLogic.ts`)
- Implemented `getCurrentMinuteEnemyHp(gameTime, extractionPowerMult)` to calculate the base HP for a normal enemy of the current minute's type.
- The calculation accounts for:
    - Base HP scaling ($60 \times 1.2^{minutes}$)
    - Difficulty multiplier
    - Cycle HP multiplier (jumps every 5 minutes)
    - Shape-specific HP multiplier (Circle, Triangle, etc.)
    - Extraction Rage multiplier (if active)

### HUD (`src/components/hud/TopLeftPanel.tsx`)
- Updated the top-left layout to display the "HP" value to the right of the total kill count.
- Styled the HP display with a subtle red glow consistent with the game's aesthetic.
- The value updates in real-time as the game progresses or when extraction rage is triggered.

## Rules Compliance
- No comments were left in the modified code.
- All Russian translations were left untouched.
- No `any` or `unknown` types were introduced.
- File modularity was maintained.
