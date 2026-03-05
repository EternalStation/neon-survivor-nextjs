# Hive-Mother `hivemother`

## Characteristics
| Parameter | Meaning |
|----------|----------|
| Experience | +15% |
| Damage | +10% |

---

## Ability: Nanite Swarm

**Trigger:** Active ability fires a cone of nanites in a spray animation (45 frames). After the spray phase completes, each nanite pivots toward the current cursor position and flies straight at it. On contact the enemy becomes infected.

### Infection (DoT)
| Parameter | Meaning |
|----------|----------|
| Damage/sec | `player.dmg × 40% × (1 + resonance) × classCurseMult` |
| Tick ​​| every 30 frames (0.5 sec at 60 FPS) |
| Damage per tick | `infectionDmg/2` |
| Fractional balance | buffered in `infectionAccumulator`, applied when ≥1 |

### Nanite jumps when the host dies
| Parameter | Meaning |
|-------------------------|----------|
| Chance | 30% |
| Target search radius | 400px |
| Nanite Speed ​​| 12 units/frame |
| Jitter | ±4.0 |
| Nanite Lifetime | ≈2 sec |
| Death of the target before hitting | nanite is destroyed (`life = 0`) |

---

## Scaling
| Parameter | Formula | Fixed |
|----------|---------|:-----------:|
| Infection Damage/sec | `player.dmg × 40% × (1+resonance) × classCurseMult` | |
| Jump Chance | | 30% |
| Jump radius | | 400px |
| Tick ​​frequency | | 30 frames |
| Nanite Speed ​​| | 12 units/frame |
| Nanite Lifetime | | ≈2 sec |