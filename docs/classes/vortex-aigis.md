# Vortex `aigis`

## Characteristics
| Parameter | Meaning |
|----------|----------|
| HP | +20% |
| HP Regeneration | +50% |

---

## Ability: Magnetic Vortex

**Trigger:** each player's shot → chance check for each ring level independently.

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
**Duration:** 5 seconds  

### Mechanics

On activation, the player bends the environment around them, creating a massive gravitational wind.

1. **Projectile Overdrive:** 
   - All player projectiles' orbital speed increases by **400%**. 
   - If projectiles are merged into solid rings, they visually light up and pulsate instead of spinning faster.
   - **Visuals:** A wind-like aura swirls around the player, indicating the orbit space.

2. **Environmental Bending (Enemies & Projectiles):**
   - Applies a continuous **clockwise rotational pull** to all nearby enemies and enemy projectiles.
   - **Pull Strength Scaling:** Starts slow and scales based on the player's **maximum meteorites**. 
     - *Late-Game Cap:* The pull strength has a maximum cap so that in the late game it doesn't over-accelerate entities and become uncontrollably fast.
   - **Wall Slam (Collision Damage):** Players can use this clockwise pull strategically near map boundaries. If an orbiting enemy is dragged into a wall, they take massive collision damage based on their orbital velocity.
   - **Projectile Deflection:** Bends the trajectories of enemy projectiles (like diamonds), forcing them into orbit and protecting the player from direct hits.