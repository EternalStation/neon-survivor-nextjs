# Temporal Monolith Refinement

## Skill Functionality
- **Freeze Duration**: All enemies caught in the wave are now frozen for exactly 4 seconds (base), scaling with resonance/multiplier.
- **Cooldown**: Fixed to 18 seconds via `GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN`.
- **Boss Compatibility**: Verified and enhanced. Bosses can now be frozen, and their massive size scales the subsequent explosion radius.

## Shatter Mechanics (Temporal Shatter)
- **Radius Scaling**: The explosion radius now scales with the size of the unit that died. Large bosses now cause massive 400px+ explosions.
- **Damage**: Deals 25% of the exploded enemy's Max HP as AOE damage to all nearby hostiles.
- **Visuals**: 
  - Added "TEMPORAL SHATTER" floating combat text.
  - Added intensive blue shard particle bursts upon shattering.
  - Improved `temporal_burst` visual duration and impact.

## HUD & Fusion Improvements
- **Fusion Logic**: Fixed a bug where the skill might not appear in the active skill bar after merging `CombShield` and `ChronoPlating`.
- **Keybinding**: Logic refined to properly assign the next available hotkey (1-5) to the new skill.
- **Duplicates**: Added logic to prevent duplicate skill icons if the fusion is triggered multiple times.

## Visual Feedback
- **Freeze Wave**: Added a central shockwave and flash when the skill is cast.
- **Enemy Feedback**: Frozen enemies now emit frost shards to clearly indicate their state.
