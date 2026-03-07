# Damage Attribution Refinement

## Changes Summary
Refined the damage attribution system in the Stats Menu to provide more accurate and visually clear feedback for players.

### 1. Collision Damage Refinement
- **Player Stats**: The "Collision Damage" label in the Threat Analysis section was updated to "Collision Damage (including your damage reduction)". 
- **Calculation**: The displayed collision damage value now dynamically accounts for the player's current Armor and Legendary reduction perks (like "col_red_per_kill"), showing the actual net damage taken.
- **Scope**: Verified that 'Collision' damage in attribution only counts physical contact between the player and enemies.

### 2. New Damage Sources & Grouping
- **Wall Shockwave**: Successfully separated as a distinct damage source. It now has its own row in the attribution menu with a brick icon (`🧱`).
- **Malware Wall Bonus**: Successfully isolated ricochet damage for the Malware class. It uses the class icon (`MalwarePrime.png`) and correctly accounts for the +20% damage per bounce logic.
- **Aegis Rings**: Added a new damage source for the Aegis class to track damage from orbiting projectiles and rings. It uses the `AigisVortex.PNG` icon.
- **Projectile Grouping**: Consolidated several legendary and class-specific bonuses under the "Projectile" umbrella:
    - Base Impact
    - Crit Bonus (Shattered Fate)
    - Death Mark (Shattered Fate)
    - Execution (Shattered Fate)
    - Steel Storm (Storm of Steel LVL 4)
    - Crimson Feast (LVL 3 Bonus)
    - Acid AMP (Toxic Puddle LVL 4 Bonus)

### 3. Visual & UI Enhancements
- **Consolidated Mapping**: Centralized icon and color mapping in `src/utils/damageMapping.ts`, removing redundant hardcoded values in `StatsMenu.tsx`.
- **Standalone Icons**: Added specific icons for common standalone sources like Turrets and Shockwaves.

### 4. Database & API Support
- **Skill Damage History**: Updated the `game_runs` table and related API endpoints (POST /api/runs and various GET /api/leaderboard routes) to support the `class_skill_dmg_history` column. This ensures that per-minute skill damage is correctly stored and displayed in global statistics.
- **Radar Chart Fix**: Ensured that `radar_counts` keys are handled case-insensitively in logic and UI.

## Impact
Players can now better understand which exact upgrades and mechanics are contributing to their damage output, especially regarding ricochets and legendary procs.
