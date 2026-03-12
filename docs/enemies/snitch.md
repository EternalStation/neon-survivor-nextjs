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
2. The orbital angle is jittery, shifting by `+0.01 + sin(t*5)*0.005` rad/frame.
3. Speed = `player.speed × 1.1`.
4. Transition to Phase 1: distance to player < **550 px** or any active skill detected within 150px of radius.
   - The color changes to orange (`#f97316`, `#ea580c`, `#c2410c`).
   - Spawns 2 **Quantum Decoys** upon transition.

### Phase 1 - Active Evasion (rarePhase === 1)

**Precondition:** the player has moved < 550 px or skill detected.

1. **Quantum Resources**:
   - `Blink Charges`: 3 charges, recharges 1 every 3.0s.
2. Moves to a random target 600–1000 px from the player.
   - When reaching the goal (`dist < 50 px`) - selects a new random point.
3. **Quantum Dash (Short Teleport)**:
   - Within 320 px of player and has `Blink Charges` > 0: Performs a short teleport (450px) away from player.
   - 1.0s internal cooldown.
4. **Tactical Teleport (Swap)**:
   - Within 250 px of player or detecting skills (Black Hole, Storm Zone, etc) within area + 150px.
   - Swaps position with the furthest normal enemy (> 700 px from player).
   - Spawns decoys at old position with 40% probability.
5. **Panic:** within 1.2 seconds after any teleport, the speed increases by 40%.
6. **Retreat:** at a distance < 220 px - moves directly **away** from the player at 2.8x speed.
7. **Quantum Jitter**: Occasionally jitters by 12px (visual glitch).

### Quantum Decoys
- Non-colliding, 15px size snitch "shadows".
- HP = 1.
- Survive for 2.5 seconds.
- Move away from the player at 80% snitch speed.

### General traffic rules (both phases)

- When hit outside the map (`!isInMap`) - pushed away from the wall along the normal.
- Proximity to walls (< 180 px): Immediate short blink to a safe location.
- Upon contact with **Elite Square** (`isElite && shape === 'square'`) - the palette changes to green (`#4ade80`), signaling "informing".


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