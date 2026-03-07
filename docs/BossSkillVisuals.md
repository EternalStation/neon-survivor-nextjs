# Boss Skill Visual Effects

## Overview
Added comprehensive visual effects for all boss skill abilities that were previously invisible or had placeholder visuals.

## Changes

### New File: `src/logic/rendering/renderers/BossSkillRenderer.ts`

#### Circle Boss Level 4 — Soul Suck (`renderCircleSoulSuck`)
- **3 wobbling energy streams** from player to boss using sine-wave displacement
- **Yellow particle stream** (gold/amber) flowing from player toward boss — 8-16 particles with wobble
- **Golden core glow** on the boss that grows as the drain progresses (`soulSuckCoreSize`)
- **Player drain aura** — pulsating amber ring around the player showing HP being drained
- All effects scale with drain progress (0% to 100%)

#### Square Boss Level 3/4 — Orbital Shields (`renderOrbitalShield`)
- **Replaced blue circles** with curved **shield-wing/cone shapes**
- Convex curved body using quadratic Bezier curves — looks like a deflector shield segment
- Gradient fill from transparent edges to bright cyan center
- **Glowing edge highlight** (white inner line) with pulsating energy sparks
- Shields face outward from the parent boss
- Cyan shadow glow with 15px blur

#### Diamond Boss Level 2 — Beam Charge-Up (`renderDiamondBeamChargeUp`)
- **Tracking dashed line** (dotted laser guide) that follows the player during beamState 1
- **Orbiting energy orbs** that converge inward as charge progresses
- **Growing core glow** at the diamond's center during charge
- For Level 4 dual lasers: **two tracking lines** shown at 45° spread angle

#### Diamond Boss Level 3 — Satellite Orbital Strike (`renderDiamondSatelliteStrike`)
- **Warning phase** (satelliteState 1):
  - Animated dashed circle contracting on each target
  - Orbiting spark particles around targets (era-palette colored)
  - Crosshair targeting reticle
- **Strike phase** (satelliteState 2):
  - Full vertical laser beam from sky to ground (800px tall)
  - Bright white core beam inside wider colored beam
  - Ground impact explosion with radial gradient
  - All effects fade out as strike ends

#### Pentagon Boss Level 2 — Soul Links (`renderPentagonSoulLinks`)
- **Wobbly connecting lines** from boss to nearby enemies using sine-wave displacement
- **Era-palette colored**: green before 15min, blue 15-30min, purple 30-45min, etc.
- **Two rendering layers**: outer glow (thick, low opacity) + inner detail (thin, higher opacity)
- **Glowing node** at each connected enemy
- **Traveling energy particles** along each link

#### Pentagon Boss Level 3 — Parasite Health Drain (`renderPentagonParasiteLink`)
- **3-layer chaotic wobbling link** from boss to player (distinguished from soul links)
- Red/crimson color scheme (vs era-palette for soul links)
- Higher frequency wobble + chaos noise for more aggressive look
- **Red drain particles** flowing from player to boss
- **Red glow** around player (damage indicator)
- **Green glow** around boss (healing indicator)

#### Pentagon Boss Level 4 — Phalanx Drones (`renderPhalanxDrone`)
- **Replaced circles** with rocket/missile shapes:
  - Arrow-shaped body with pointed nose cone
  - Two swept-back wings
  - Three stacked chevron/arrow markers on the fuselage
  - Glowing amber nose light
- **Fire trail** during charge phase (phalanxState 3):
  - 8-segment rocket exhaust with radial gradient (white → amber → orange → transparent)
  - Flickering flame intensity
  - Core flame triangle at the tail

### Modified: `src/logic/rendering/renderers/EnemyRenderer.ts`
- All new skill renderers integrated into pre-effects pass
- Phalanx drones and orbital shields intercepted before generic shape rendering
- Orbital shields skip the standard shape path entirely
