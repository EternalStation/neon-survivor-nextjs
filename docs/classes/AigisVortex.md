# Vortex `aigis`

## Characteristics
| Parameter | Meaning |
|----------|----------|
| HP | +30% |
| HP Regeneration | +15% |
| Strength Pull | 1.0 (Scalable) |

---

## Performance Metrics (UI)
| Metric | Value | Type | Description |
|--------|-------|------|-------------|
| Active CD | 20s | Static | Recharge time |
| Duration | 2s | Static | Active duration |
| Strength Pull | 1% | Resonant | Vortex suction power (formerly Vortex Power) |
| Orbit II | 15% | Resonant | Chance to spawn Ring II |
| Orbit III | 10% | Resonant | Chance to spawn Ring III |
| Orbit IV | 5% | Resonant | Chance to spawn Ring IV |

### Rings
| Level | Radius | Base Chance | Chance formula |
|---------|--------|:-----------:|--------------|
| Ring I | 125px | 100% | always |
| Ring II | 190px | 15% | `0.15 × (1+resonance) × classCurseMult` |
| Ring III | 255px | 10% | `0.10 × (1+resonance) × classCurseMult` |
| Ring IV | 320px | 5% | `0.05 × (1+resonance) × classCurseMult` |

### Orbital motion of projectiles (before merger)
```
orbitAngle += 0.05 rad/frame
x = player.x + cos(orbitAngle) × orbitDist
y = player.y + sin(orbitAngle) × orbitDist
```
The data is stored in `player.aigisRings[radius] = { count, totalDmg }`.

### Merger/Dissolution
| Event | Threshold | Result |
|---------|:-----:|----------|
| Merge | ≥200 shells | all projectiles → 1 object `isRing: true` |
| Decay | <190 shells | 1 object → 190 orbital shells |

### Ring Damage
- Affected area: annulus ±10px from `ringRadius` (width 20px).
- Damage per hit: `avgDmg = totalDmg / count`; on each hit `count -= 1`, `totalDmg -= avgDmg`.
- Loss when touching a wall: **5 count/frame**.

---

## Scaling
| Parameter | Formula | Fixed |
|----------|---------|:-----------:|
| Chance Ring II–IV | `base × (1+resonance) × classCurseMult` | |
| Orbit radii | | 125/190/255/320px |
| Merge Threshold | | 200 |
| Decay threshold | | 190 |
| Annulus width | | 20px |
| Lost by the wall | | 5/frame |

---

## Active Skill (E): Orbital Vortex
- **Cooldown:** 20s (Static)
- **Recharge Delay:** 1s (Starts after duration ends)
- **Duration:** 2s (Static)
- **Total Cycle:** 23s
- **Key:** `E` (configurable via `classAbility` in keybinds)

### Mechanics

On activation, the player bends the environment around them, creating a massive gravitational wind.

1. **Projectile Overdrive:**
   - All player projectiles' orbital speed increases by **400%**.
   - If projectiles are merged into solid rings, they visually light up and pulsate instead of spinning faster.
   - **Visuals:** A wind-like aura swirls around the player.

2. **Meteorite Slingshot Physics:**
   - The vortex behavior scales dynamically with **Vortex Power** (resonance/strength).
   - **Low Power (starting strength):** Enemies are trapped in a tight **inner rim orbit (~120px)** and are not flung outward. Spin intensity is reduced — enemies orbit but without high tangential force.
   - **High Power (resonance > 1.4):** The vortex becomes violent. Enemies are pulled inward then **slung outward aggressively** at high velocity, creating area denial.
   - **Uniform Rotation:** Rotation speed follows the formula: **$0.2 + 0.32 \cdot \ln(Strength)$** (Circles per 2s).
   - **Inward Pull:** When far from the player (>180px), enemies are rapidly pulled towards the center.
   - **Outward Sling:** Once enemies reach the inner proximity threshold, the radial force flips to push them away.
   - **Inertial Drift:** Enemies maintain built-up kinetic energy for 1.5 seconds after leaving the 800px vortex field, gradually fading out before regaining control.
   - **Wall Slam:** Orbiting enemies dragged into walls take massive damage (**10% of Max HP** for high-speed impacts). This damage is explicitly attributed to **Orbital Vortex** in the damage breakdown.

3. **Projectile Deflection:**
   - **Active:** Enemy bullets entering the 800px field are bent into the clockwise orbit, with intensity scaling based on **Vortex Power**.
   - **Passive:** The magnetic rings (180px–330px) provide a subtle course-correction for enemy projectiles even when the skill is inactive.

4. **Vortex Progression:** Every kill permanently increases **Vortex Power** by 0.0003.

### Visuals
| State | Appearance |
|-------|-----------|
| Active | Golden amber gravitational field pulsates around the player with rotating wind-trail arcs |
| Pulsating Rings | Aigis rings light up and pulsate rapidly during the effect |
| Floater | "ORBITAL VORTEX" text displayed on activation |

---

## Implementation Notes
- `GameConfig.ts` — `ORBITAL_VORTEX_COOLDOWN`, `ORBITAL_VORTEX_DURATION`
- `types.ts` — `orbitalVortexUntil` on Player state
- `useGameInput.ts` — input handling for `aigis` class ability
- `EnemyIndividualUpdate.ts` — clockwise pull physics and wall damage
- `ProjectilePlayerLogic.ts` — speed multipliers and visual intensity flags for Aigis bullets
- `ProjectileEnemyLogic.ts` — trajectory bending for enemy bullets
- `PlayerRenderer.ts` — wind aura rendering
- `ProjectileRenderer.ts` — pulsating visuals for Aigis rings
- `PlayerStatus.tsx` — cooldown indicator in HUD
