# Boss Sizes and Visual Refinement

This document describes the changes made to boss sizes and visual effects to improve gameplay clarity and aesthetics.

## 1. Size Scaling
The base size for bosses has been reduced by **30%** to prevent them from overwhelming the screen and to make their hitboxes more precise.

- **Normal Bosses (Circle, Triangle, Square, Diamond)**: Base size reduced from `110` to `77`.
- **Pentagon Boss**: Proportionately reduced. Its base size is now `54` (from `77`).
- **Overlord (Anomaly Boss)**: remains at its original size (`110` base, resulting in `88` actual size) to maintain its intimidating presence as a supreme threat.

## 2. Visual Cleanup
To reduce visual clutter while maintaining the "glitch" aesthetic, several secondary effects have been removed from boss rendering:

- **Scanlines**: Horizontal distortion lines on top of bosses have been removed.
- **Glitch Slices**: Colored rectangular slices on top of the boss body have been removed.
- **Tendrils**: External corruption lines extending from the boss have been removed.
- **Dashed Rings**: Void rift rings around the boss have been removed.
- **Chromatic Outlines**: Offset RGB outlines have been removed.

The **Glitch Structure** (the core distorted/warped shape of the boss) and the **Eye of Chaos** remain active, ensuring the bosses still feel like corrupted entities without being obscured by messy line effects.

## 3. Level-Based Sizing
Bosses now scale in size dynamically based on their Level (Tier). This progression visually represents their growing threat level as the mission progresses.

- **Baseline**: Level 2 is established as the **Standard Size** (1.0x multiplier).
- **Level 1 (Tier 1)**: `0.8x` Standard Size. These are more manageable early-game encounters.
- **Level 2 (Tier 2)**: `1.0x` Standard Size. The baseline for boss encounters.
- **Level 3 (Tier 3)**: `1.2x` Standard Size. Significant presence increase as the game progresses.
- **Level 4 (Tier 4)**: `1.4x` Standard Size. Monumental threats that dominate the arena.

This scaling applies to all regular shaped bosses (Circle, Triangle, Square, Diamond, Pentagon). Anomaly bosses maintain their own specialized scaling logic.
