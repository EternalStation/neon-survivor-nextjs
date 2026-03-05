# Vortex `aigis`

## Characteristics
| Parameter | Meaning |
|----------|----------|
| HP | +4% |
| HP Regeneration | +10% |
| Vortex Power | 1.0 (Scalable) |

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

## Active Skill: Orbital Vortex

**Cooldown:** 20 seconds  
**Duration:** 2 seconds  

### Mechanics

On activation, the player bends the environment around them, creating a massive gravitational wind.

1. **Projectile Overdrive:** 
   - All player projectiles' orbital speed increases by **400%**. 
   - If projectiles are merged into solid rings, they visually light up and pulsate instead of spinning faster.
   - **Visuals:** A wind-like aura swirls around the player, indicating the orbit space.

2. **Meteorite Slingshot Physics:**
   - The vortex functions as a gravitational slingshot. Enemies are no longer just spun in place; they are pulled into the field and then slung outwards at high velocities.
   - **Inward Pull:** When far from the player (>180px), enemies are rapidly pulled towards the center of the vortex.
   - **Outward Sling:** Once enemies reach the inner proximity threshold, the radial force flips to push them away. This creates a high-energy "swing" maneuver.
    - **Inertial Drift:** Enemies maintain their built-up kinetic energy for 1.5 seconds after leaving the 800px vortex field, gradually fading out before regaining control.
    - **Wall Slam:** Orbiting enemies dragged into walls take massive damage (10% of Max HP for high-speed impacts).
    - **Projectile Deflection (Active):** Enemy bullets entering the 800px field are bent into the clockwise orbit, with intensity scaling based on **Vortex Power**.
    - **Passive Deflection:** The magnetic rings (180px - 330px) provide a subtle course-correction for enemy projectiles even when the skill is inactive.
    - **Vortex Progression:** Every kill permanently increases **Vortex Power** by 0.0003, ensuring the pull and spin forces scale into the late game.