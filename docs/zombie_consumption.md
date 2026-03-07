# Zombie Consumption & Chrono Devourer Logic

## Overview
Added the logic for the Chrono Devourer legendary skill and refined zombie consumption mechanics to handle bosses and elites properly.

## Changes

### 1. Boss Interaction Refinement
- Zombies can no longer one-shot bosses.
- When clinging to a boss, zombies deal **5% max HP damage every 1 second**.
- Each such hit costs the zombie **1 heart** (life).
- After the 5-second consume timer, the zombie deals a large burst of **20% max HP damage** and dies (losing its remaining 3 hearts).

### 2. Chrono Devourer Cooldown Reduction
- Implemented the Chrono Devourer passive: **Every successful consumption reduces active skill cooldowns by 0.03s**.
- This applies to:
  - All **Legendary Active Skills** (stored in `player.activeSkills`).
  - All **Class-specific skills** (e.g., Storm Strike, Sandbox, Orbital Vortex, Blackhole, Hive Mother cone, Kinetic Shockwave, etc.).
  - **Dash cooldown**.
  - **Death Mark cooldown**.

### 3. Visuals & Feedback
- The floating text for a successful consumption is now **"Successfully consumed it"**.
- The font size for this text has been decreased to **10** (a ~50-60% reduction from default) to reduce visual clutter during mass consumption events.
- Added consistent green particles and SFX for boss consumption events.

### 4. Code Maintenance
- Fixed several property typos in the cooldown reduction logic.
- Updated the `Player` interface in `types.ts` to include missing tracking fields for class skills.
