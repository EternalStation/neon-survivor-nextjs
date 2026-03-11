# Void `eventhorizon`

## Characteristics
| Parameter | Meaning |
|----------|----------|
| Armor | +30% |
| Movement speed | +10% |

---

## Active ability: Void Singularity (Black Hole)

**Key:** `E` (configurable via `classAbility` in keybinds)

### Two-phase mechanism (Ancient Apparition style from Dota 2)

**Phase 1 - first press:**
- If the cooldown is complete, a **marker** (Void Marker) is launched in the direction of the cursor at a speed of 500 px/s
- The marker flies in outer space, we see it as a mini-singularity with a purple glow
- Maximum marker lifetime: Dynamic, same as normal bullet range distance (default ~3.5s), then it disappears and the Cooldown begins
...
**Phase 2 - press again:**
- While the marker is in flight → pressing `E` will spawn a **black hole** at the current marker position
- The marker disappears, the cooldown begins

| Parameter | Meaning |
|----------|----------|
| Cooldown | 10 sec (starts after black hole spawns OR marker reaches max range) |
| Cooldown with NEURAL_OVERCLOCK | 7 sec (×0.7) |
| Marker speed | 800 px/s |
| Max. life marker | Bullet Range Distance / 800 |
| Black hole duration | 3 sec |
| Black hole radius | 400px |

### Black hole damage per second by enemy type
| Type | Condition | Damage |
|-----|---------|------|
| Regular | >80px from center | 50% maxHP/sec |
| Regular | ≤80px (core) | instant destruction |
| Worm segment | ≤80px (core) | instant destruction |
| Elite/Rare (not Snitch) | — | 25% maxHP/sec |
| [Snitch](../enemies/snitch.md) | >80px | no damage (pull only) |
| [Snitch](../enemies/snitch.md) | ≤80px (core) | instant destruction |
| Boss | — | 10% maxHP/sec |

All enemies in the zone receive the `voidAmplified = true` flag.

---

## HUD indicator

| State | Color icons | Hint |
|-----------|------------|-----------|
| Done (press E) | Purple (themeColor) | glow |
| The marker flies (press E again) | Bright Purple (#a855f7) | pulsating |
| Cooldown | Gray | timer in seconds |

---

## Changed files
- `src/logic/core/types.ts` — fields `voidMarkerActive`, `voidMarkerX/Y/Vx/Vy`, `voidMarkerSpawnTime` on Player
- `src/logic/utils/Keybinds.ts` - `classAbility: 'KeyE'`
- `src/logic/combat/ProjectileLogic.ts` - passive hit trigger removed
- `src/hooks/useGameInput.ts` - handling of pressing `classAbility`
- `src/hooks/useGameLogic.ts` - updating the marker position every frame
- `src/logic/rendering/renderers/PlayerRenderer.ts` - `renderVoidMarker()`
- `src/logic/rendering/GameRenderer.ts` - call `renderVoidMarker`
- `src/components/hud/PlayerStatus.tsx` — updated HUD status

---

## Scaling
| Parameter | Formula | Fixed |
|----------|---------|:-----------:|
| Attraction | `(0.66 + resonance×0.85) × classCurseMult` | |
| Cooldown (NEURAL_OVERCLOCK) | ×0.7 | |
| Field radius | | 400px |
| Duration | | 3 sec |
| Core Radius (Instant Kill) | | 80px |
| Damage % by enemy type | | fixed |