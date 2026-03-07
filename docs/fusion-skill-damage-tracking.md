# Fusion Skill Damage Tracking

## Overview

All 12 fusion legendary skills now have their damage correctly tracked in the Damage Attribution tab of the Stats Menu. When two base skills are fused, any damage output transitions to a fusion-specific `DamageSource` key rather than remaining attributed to the parent skills.

**Key Rule**: Old accumulated damage from base skills remains visible (frozen) in the Stats Menu after fusion. The recording logic routes all NEW damage to the fusion source. Both the old base rows and new fusion rows coexist.

---

## Grouping System

Every legendary/fusion skill with multiple damage sub-types is displayed as a **grouped parent row** with expandable children:

| Parent Label | Children | Icon |
|---|---|---|
| **Projectile** | Base Impact, Crit Bonus, Death Mark, Wall Increased DMG | Class icon |
| **Crimson Feast** | LVL 3 (Bonus Damage), LVL 4 (Zombies) | `ComLife.png` |
| **Shattered Fate** | Execute | `ComCrit.png` |
| **Toxic Swamp** | LVL 1 (Acid DOT), LVL 4 (AMP Bonus) | `DefPuddle.png` |
| **Epicenter** | LVL 1 (Pulse), LVL 4 (Execute) | `DefEpi.png` |
| **Kinetic Battery** | LVL 1 (Chain Data), Static Bolt | `DefBattery.png` |
| **Xeno Alchemist** | Acid Refinery | `THE XENO-ALCHEMIST.png` |
| **Irradiated Mire** | Acid Mire, Radiant Aura | `THE IRRADIATED MIRE.png` |
| **Gravity Anchor** | Anchor Pulse, Execute Blast | `THE GRAVITY ANCHOR.png` |
| **Temporal Monolith** | Freeze Wave, Shatter AOE | `THE TEMPORAL MONOLITH.png` |
| **Shattered Capacitor** | Arc Bolt, Bleed DOT | `THE SHATTERED CAPACITOR.png` |

Single-source fusions (Neural Singularity, Kinetic Tsunami, etc.) show as standalone rows with their fusion icon.

Children are only shown when there are 2+ active sub-types. If only one child has damage, just the parent row is displayed.

All rows (groups + standalone) are sorted by total damage, highest first.

---

## Gradient Bars (Arena Fusion Colors)

Fusion skill damage bars use a dual-color **linear gradient** representing both parent arenas:
- **ECO** (Economic): `#4ade80` green
- **COM** (Combat): `#ef4444` red
- **DEF** (Defence): `#3b82f6` blue

| Fusion Source | Arena 1 → Arena 2 | Gradient |
|---|---|---|
| Xeno Alchemist | ECO → DEF | green → blue |
| Irradiated Mire | DEF → COM | blue → red |
| Neural Singularity | ECO → COM | green → red |
| Kinetic Tsunami | ECO → COM | green → red |
| Neutron Star | ECO → COM | green → red |
| Gravitational Harvest | ECO → DEF | green → blue |
| Gravity Anchor | ECO → DEF | green → blue |
| Temporal Monolith | ECO → DEF | green → blue |
| Shattered Capacitor | COM → DEF | red → blue |
| Necro-Kinetic Engine | COM → DEF | red → blue |

---

## Fusion Icons

All fusion skills now use their dedicated PNGs from `/assets/Fusions/`:
- `THE XENO-ALCHEMIST.png`
- `THE IRRADIATED MIRE.png`
- `THE NEURAL SINGULARITY.png`
- `THE KINETIC TSUNAMI.png`
- `THE NEUTRON STAR.png`
- `THE GRAVITATIONAL HARVEST.png`
- `THE GRAVITY ANCHOR.png`
- `THE TEMPORAL MONOLITH.png`
- `THE SHATTERED CAPACITOR.png`
- `THE NECRO-KINETIC ENGINE.png`

Base legendary skills use their `/assets/hexes/` icons (e.g., `ComLife.png`, `DefEpi.png`).

---

## Files Modified

### `src/logic/core/types.ts`
- Added fusion-specific DamageSource entries
- Renamed `'Necro-Kinetic (Bolt)'` → `'Necro-Kinetic Engine'`

### `src/hooks/useAreaEffectLogic.ts`
- Puddle/epicenter damage routes to fusion sources when fusion is active
- Execute threshold damage now routes to Gravity Anchor / Gravitational Harvest

### `src/logic/player/PlayerCombat.ts`
- Radiation aura, reflection, and zap damage route to fusion sources
- BloodForgedCapacitor zaps record as `'Necro-Kinetic Engine'`

### `src/logic/mission/DeathLogic.ts`
- Temporal Monolith and Gravity Anchor explosions tracked

### `src/logic/enemies/EnemyIndividualUpdate.ts`
- Bleed damage tracked for Shattered Capacitor

### `src/logic/combat/ProjectilePlayerLogic.ts`
- Shockwave damage routes to Neural Singularity / Kinetic Tsunami

### `src/components/StatsMenu.tsx`
- Removed hex-based filtering (old damage stays visible, frozen)
- Comprehensive groupMap with parent rows + child breakdowns
- All fusion icons switched to `/assets/Fusions/` PNGs
- Gradient bars for all fusions
- Groups and standalone rows sorted by total damage
