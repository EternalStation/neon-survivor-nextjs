# Hive-Mother `hivemother`

## Characteristics
| Parameter | Meaning |
|----------|----------|
| Experience | +15% |
| Damage | +10% |

---

## Ability: Nanite Swarm

**Trigger:** Active ability fires a cone-shaped spray originating from the player toward the cursor's current world position. After 0.4s the spray reaches its destination and forms a lingering nanite cloud. Nanites drift slowly inside the cloud and latch onto any enemy that enters the cloud radius. During dissipation the cloud expands outward while fading.

### Phase 1: Spray (0–0.4s)
| Parameter | Meaning |
|----------|----------|
| Shape | Widening cone from player to cursor position |
| Distance | Cursor world position (no fixed cap) |
| Tip Spread | 40% of cloud radius |

### Phase 2: Cloud (0.4s–3s)
| Parameter | Meaning |
|----------|----------|
| Cloud Radius | 200px |
| Total Duration | 3s |
| Dissipation | Cloud expands up to 2.2× radius while fading to transparent |
| Nanite Drift Speed | 0.3–1.0 units/frame (capped at 1.5) |
| Nanite Containment | Pulled back toward center when >70% radius |
| Multi-Infection | Each cloud hit applies a separate group of 3 (+1 per 10 lvls) nanites. |

### Nanite Targeting
| Parameter | Meaning |
|----------|----------|
| Target Condition | Enemy must be inside cloud radius |
| Latch Speed | 12 units/frame homing toward target |
| Nanite Lifetime | 180 frames (≈3s) |
| Target Dies | Nanite returns to idle drift, seeks new target |

### Infection (DoT)
| Parameter | Meaning |
|----------|----------|
| Stack Mechanism | Each "spit" (cloud hit) creates its own nanite group on the enemy. |
| Damage/sec | Total damage = `groupCount × 5% × (1 + resonance) × player.dmg` |
| Indicator | Each group triggers its own floating damage number. |
| Slow | Infected enemies are **permanently slowed by 30%**. |
| Tick | every 60 frames (1 sec) for each individual group |
| Fractional balance | buffered in `infectionAccumulator`, applied when ≥1 |

### Nanite jumps when the host dies
| Parameter | Meaning |
|-------------------------|----------|
| Chance | 30% |
| Target search radius | 400px |
| Nanite Speed | 12 units/frame |
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
| Tick frequency | | 60 frames (1s) |
| Nanite Speed | | 12 units/frame |
| Nanite Lifetime | | ≈2 sec |
| Cloud Radius | | 200px |
| Cloud Duration | | 3s |
| Spray Duration | | 0.4s |
| Nanite Lifetime (skill) | | 180 frames |
