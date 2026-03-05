# Ray `stormstrike`

## Characteristics
| Parameter | Meaning |
|----------|----------|
| Damage | +50% |
| Attack Speed ​​| −20% |

---

## Ability: Storm Circle (E)

**Trigger:** pressing E when charge > 0.

| Parameter | Meaning |
|----------|----------|
| Maximum Charge | 10 sec |
| CD before reloading | 3 sec (after use) |
| Lasers per 1 sec charge | 4 |
| Lasers for 10 sec charge | 12 (linear) |
| Damage per 1 sec charge | 10% from `player.dmg` |
| Damage per 10 sec charge | 150% of `player.dmg` (linear) |
| Laser Hit Delay | 0.25 sec (visual marker) |
| Minimum ring radius | 50px from player |
| Maximum ring radius | 350px (scaled by resonance) |
| AOE of each laser | 60px (scaled by resonance) |

**Laser positions:** random angle (0–360°), random distance [50px, strikeRadius].

**AoE:** All enemies within the laser's radius take full damage at the same time.

---

## Movement speed

| Charge | Speed ​​Modifier |
|-------|---------------------|
| 0 sec (0%) | −20% |
| 5 sec (50%) | 0% |
| 10 sec (100%) | +20% |

Scaling is linear in charge time.

---

## Charging

| Stage | Behavior |
|------|-----------|
| After use | 3 second CD, charging does not start |
| Charging | Starts automatically after CD |
| Visual progress | Nonlinear (√(t/10)) - fast at the beginning, slower at the end |

The actual values ​​of damage and the number of lasers are tied to the actual seconds of charge (linear), the visual bar is filled according to the square root curve.

---

## Scaling

| Parameter | Formula | Fixed |
|----------|---------|:-----------:|
| Number of lasers | `max(4, round(4 + (t−1) × 8/9))` | |
| Laser Damage | `(0.1 + (t−1) × 1.4/9) × player.dmg` | |
| Speed ​​| `−20% + (t/10) × 40%` | |
| Ring radius | `350 × (1 + resonance × 0.25)` | |
| AOE laser | `60 × (1 + resonance × 0.25)` | |

`t` — charge seconds (0–10), `resonance` — chassis resonance from meteorites (coefficient 0.25 = slow scaling).