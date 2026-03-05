# Dash Ability

A basic ability available to all classes. Activated by the **Space** key.

## Mechanics

- The player makes a dash in the direction of movement (WASD / stick). If the player is standing, the dash occurs in `lastAngle` (last direction of view).
- During a dash, standard movement controls are locked.
- The player takes damage normally during a dash (no invulnerability).
- If the target of the dash goes beyond the border of the map, the dash is interrupted.

## Parameters (GameConfig.DASH)

| Parameter | Meaning |
|---------------------|----------|
| DISTANCE | 240px |
| DURATION | 0.18s |
| COOLDOWN | 4.0s |

## Player state

| Field | Type | Description |
|----------------|--------|------------------------------------------|
| dashCooldown | number | Current cooldown (countdown in seconds) |
| dashCooldownMax| number | Max cooldown |
| dashUntil | number | gameTime when the dash ends |
| dashVx / dashVy| number | Axes jerk speed (px/frame) |

## Visual

- At the beginning of the dash: 8 cyan particles (`spawnParticles` type `'spark'`)
- During dash: 2 blue particles per frame
- SFX: `'dash'` (aliased to `'sonic-wave'`)

## HUD

`PlayerStatus.tsx` displays a separate hexagonal icon with a ⚡ icon:
- Glows blue when ready to use
- Shows countdown (numbers) during cooldown
- `SPC` label in the corner

## Settings

The dash binding is available in KeybindSettings (key `dash`, default `Space`).

## Files

| File | Role |
|------|------|
| `src/logic/player/PlayerMovement.ts` | `triggerDash()` and handling active dash in `handlePlayerMovement` |
| `src/logic/core/GameConfig.ts` | Constants `GAME_CONFIG.DASH` |
| `src/logic/core/types.ts` | Dash fields in the `Player` interface |
| `src/logic/utils/Keybinds.ts` | Added `dash: 'Space'` binding |
| `src/hooks/useGameInput.ts` | Handling the Space press → calling `triggerDash` |
| `src/components/hud/PlayerStatus.tsx` | HUD cooldown indicator |
| `src/components/KeybindSettings.tsx` | Settings line in the binds menu |