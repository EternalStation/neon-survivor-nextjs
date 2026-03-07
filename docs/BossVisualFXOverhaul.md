# Boss Visual FX Overhaul

## Overview
Complete visual overhaul of boss enemy rendering. Bosses (circle, triangle, square, diamond, pentagon) now feature dramatic distortion effects, warping geometry, and layered visual FX that make them look terrifying and distinct from regular enemies.

## Changes

### New File: `src/logic/rendering/renderers/BossVisualFX.ts`
A dedicated visual effects module for boss enemies containing:

#### Distorted Boss Shapes (`drawDistortedBossShape`)
Instead of plain geometric shapes, boss outlines now **warp and morph in real-time**:
- **Circle bosses**: Organic, pulsating boundary with noise-driven spikes
- **Triangle bosses**: Jagged, unstable edges with outward-facing spikes
- **Square bosses**: Wobbling, corrupted edges that never sit still
- **Diamond bosses**: Shimmering, distorted facets
- **Pentagon bosses**: Warping vertices with edge spikes

Each shape is subdivided into many segments, and each segment is displaced by layered sine-wave noise + spike functions that scale with boss tier.

#### 6 Layered Distortion Effects (`renderBossDistortion`)
1. **Glitch Frame** — Random horizontal slice displacements with cyan/magenta coloring, simulating digital corruption
2. **Corruption Tendrils** — Animated energy tendrils radiating outward from the boss body, increasing with tier
3. **Void Rift** — A pulsing dark hole at the boss center with rotating dashed energy rings
4. **Chromatic Aberration** — RGB color-split ghost outlines of the boss shape, offset and rotating
5. **Scanline Distortion** — A traveling bright scanline beam + CRT-style horizontal lines
6. **Eye of Chaos** — A glowing red eye at the boss core (tier 2+) with iris details (tier 4+)

#### Afterglow (`renderBossAfterglow`)
A pulsing radial glow + orbiting energy particles around the boss, using the boss's palette colors.

### Modified: `src/logic/rendering/renderers/BossRenderer.ts`

#### `renderBossBodyPre` — Enhanced Boss Aura
- **4-layer pulsing aura** (red, dark crimson, orange-red, hot pink) instead of single red aura
- **Flickering intensity** that randomly drops to 40% for an unstable energy feel
- **Enhanced trails** now fill with semi-transparent color in addition to stroking
- Layer sizes and opacity scale with boss tier

#### `renderBossBodyPost` — Enhanced Inner Chaos
- More chaos blobs that scale with tier
- **Corruption veins** — Red lines radiating from center that slowly rotate
- **Dark energy core** — Pulsating radial gradient at the boss center

### Modified: `src/logic/rendering/renderers/EnemyRenderer.ts`
- Integrated `BossVisualFX` imports
- Bosses now use `drawDistortedBossShape` instead of the regular `drawShapePath`
- Boss trail pre-rendering also uses distorted shapes
- `renderBossDistortion` and `renderBossAfterglow` are called after body rendering

## Visual Effect Scaling
All effects scale based on:
- **Boss Tier** (1-5): Higher tiers = more tendrils, more intense chromatic split, more chaos blobs, eye of chaos activation
- **Game Time**: Chaos level increases as the game progresses
- **Unique seed per boss**: Each boss instance has slightly different glitch timings via `e.id`
