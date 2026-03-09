#QuantumSnitch

**Classification:** Evasion Specialist
**Threat:** Unique
**ID:** `snitch`

---

## Purpose

Rare unique enemy target of high value. Does not cause damage to the player, but when killed, activates the `rareRewardActive` flag and is tracked in the `snitchCaught` counter. The main task is to survive 30 seconds and disappear.

---

## Characteristics

| Parameter | Meaning |
|----------|---------|
| HP | 1 |
| Size | 18px |
| Speed ​​| ×0.7 player speed |
| Damage to player | 0% (does not attack) |
| Type | `isRare: true`, `rareReal: true` |
| Life time | 30 seconds from spawn |
| Color (base) | Yellow (`#FACC15`, `#EAB308`, `#CA8A04`) |

---

## Spawn cycle

### Triggers
- Triggered via the `manageRareSpawnCycles` function.
- First spawn: **5 minutes (300 seconds)** from the start of the game.
- Each subsequent cycle: `300 + (cycle × 120)` seconds.
- Condition: only when `rareSpawnActive === false` (no active Snitch).
- Does not spawn during portals and when extraction is active (`extractionStatus !== 'none'`).

### Spawn point
- Random position ~1100–1250 px from the player within the current arena.
- If a valid position is not found, a random point within the arena.

---

## Behavior (two phases)

### Phase 0 - Orbital (rarePhase === 0)

**Precondition:** the initial phase immediately after spawn.

1. Snitch orbits around the player's position at a distance of **~1100 px**.
2. The orbital angle slowly shifts by `+0.005 rad/frame`.
3. Speed ​​= `player.speed × 0.8`.
4. If the orbital target is outside the map, reduce the orbital radius (to 400 px minimum) until an acceptable point is found.
5. Transition to Phase 1: distance to the nearest player < **500 px**.
   - The color changes to orange (`#f97316`, `#ea580c`, `#c2410c`).

### Phase 1 - Active Evasion (rarePhase === 1)

**Precondition:** the player has moved < 500 px.

1. Moves to a random blocked target 500–800 px from the player.
2. When reaching the goal (`dist < 50 px`) - selects a new random point.
3. **Tactical teleport** at a distance < 350 px from the player (if cooldown ≥ 0):
   - Swaps position with the nearest normal enemy (excluding bosses, legionnaires and other Snitch).
   - Spawns smoke particles (gray) at both points.
   - Teleport cooldown: **4 seconds**.
   - If there is no suitable enemy - a random blink at 800–1000 px from the player (`forceTeleport` fallback).
4. **Panic:** within 1 second after the teleport, the speed doubles.
5. **Retreat:** at a distance < 250 px - moves directly **away** from the player at double speed.

### General traffic rules (both phases)

- When hit outside the map (`!isInMap`) - moves to the center of the arena or is pushed away from the wall along the normal.
- Checking proximity to walls: if < 200 px - immediate teleport to a valid point (> 300 px from the walls).
- Upon contact with **Elite Square** (`isElite && shape === 'square'`) - the central color changes to green (`#4ade80`), signaling "informing".

---

## Lifecycle

| Event | Condition | Result |
|---------|---------|---------|
| Death by timer | 30 seconds have passed | `e.dead = true`, `rareSpawnActive = false`, sound `rare-despawn` |
| Death by Damage | `hp ≤ 0` | `rareSpawnActive = false`, `snitchCaught++`, `rareRewardActive = true`, event `snitch_kill`, sound `rare-kill` |

---

## Interaction with Blackhole (Void class)

**Problem (fixed):** Previously, Snitch had `isRare: true` and in the [Void Singularity](../classes/VoidEventhorizon.md) code it fell into the Elite/Rare branch (25% maxHp/sec). With HP=1 it took **4 seconds** to die, while blackhole only exists for **3 seconds** - Snitch always survived.

**Bugfix:** Snitch has been removed from both damage paths (Elite/Rare and drag). Dies **only** when actually pulled into the core:
- In the blackhole core (≤ 80 px): **instant death**.
- Outside the core (80–400 px): no damage is applied - you need to reach the Snitch to the center of the funnel.
- Pull speed (`bhPullSpeed`) works normally and pulls Snitch towards the center.

---## Interaction with other mechanics

| Mechanics | Behavior |
|---------|---------|
| blackhole attraction (`bhPullSpeed`) | Effects as on any enemy - additional speed to the center of BH |
| `isZombie` (Hive-Mother) | Zombie does not hunt Snitch (`isZombie` filter), but may accidentally encounter |
| Freezing (`frozen`) | Operates as standard |
| Slowdown (`slowFactor`) | Operates as standard |
| `isNeutral` | Not installed → Snitch is a legitimate target |

---

## Related functions and entities

- [Void Singularity (blackhole)](../classes/VoidEventhorizon.md#active-ability-void-singularity-black-hole) - active ability, interaction fixed
- `spawnRareEnemy` - Snitch spawn function
- `manageRareSpawnCycles` - management of spawn cycles
- `updateSnitch` - the logic of the behavior of each frame
- `handleEnemyDeath` → branch `isRare && rareReal` - handling death and rewards