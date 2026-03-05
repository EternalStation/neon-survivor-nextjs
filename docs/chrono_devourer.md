# Legendary Merge: Chrono Devourer

## Overview
The **Chrono Devourer** is a powerful fusion of **Chrono Plating** and **Crimson Feast** (Com Life). It combines defensive temporal manipulation with aggressive biological consumption.

## Requirements
- **Chrono Plating** at Level 5
- **Crimson Feast** (Com Life) at Level 5

## Performance
- **Active Skill**: Explodes all active shields, dealing massive AOE damage based on the sum of current **Armor + Shield** value. (1.5x Multiplier).
- **Zombie Perk**: All zombies spawned by the player have a **10% chance** to instantly consume an enemy on their first bite (instant kill for non-bosses, instant massive damage for others).
- **Temporal Acceleration**: Successfully consuming an enemy grants the player **+10% Cooldown Recovery Speed** for 1 second.
- **Inherited Perks**: Inherits all level 1-4 perks from both parent Legendaries:
  - Lifesteal from projectiles.
  - Overheal converted to shields.
  - Bonus damage based on enemy max HP.
  - Zombie spawn chance on kill.
  - Armor-scaling damage bonus.
  - Armor-scaling HP bonus.
  - Armor-scaling HP/sec bonus.
  - Passive cooldown reduction over time.

## Implementation Details
- Added to `LegendaryLogic.ts` as a Fusion type.
- Active skill logic implemented in `SkillLogic.ts`.
- Merge condition and execution added to `LegendaryMergeLogic.ts`.
- UI Integration in `HexGrid.tsx` via a dedicated "INITIATE CHRONO-DEVOURER" protocol button.
- Combat logic for zombie consumption and CDR buff integrated into `UniqueEnemyLogic.ts`.
- Player stat calculation updated in `PlayerStats.ts`.
- Russian and English translations added to `uiTranslations.ts`.