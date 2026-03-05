# Cheat Codes

## Purpose

Debug code system for testing game state without passing. Allows you to summon bosses, obtain resources, spawn legendary upgrades and manage time.

## Triggers

- Codes are entered character by character through the keyboard during an active gaming session.
- The buffer accumulates the last 40 characters; the check is performed on the suffix (`endsWith`).
- **`kkk`** - opens **Cheat Panel** (graphical interface with search and history).
- **`bug`** - opens **Admin Console** (admin console).
- Input is blocked when windows are open: settings, feedback modal, admin console, as well as during the extraction dialog (`extractionStatus: 'requested' | 'waiting'`).
- Codes are case-insensitive (all characters are converted to lowercase).
- After the code is recognized, the buffer is reset.

---

## Resources

| Code | Effect |
|----------|--------|
| `yy` or `ko` | +5100 Dust |
| `kp` | +1000 Void Flux (with floating number and sound) |
| `rmo` | +100 to base armor (`arm.base`) and +10 to armor multiplier (`arm.mult`) |

---

## Player progress

| Code | Effect |
|----------|--------|
| `lvl`, `l1`, `lp` | XP → to the next level (level up), unlocks portals (`portalsUnlocked = true`), opens a warning about the portal after 0.5 s |
| `k1` | Kills the player (HP → 0, `gameOver = true`), cause of death: `SIMULATION TERMINATED (DEBUG)` |
| `cs2` | Doubles the current `chassisResonanceBonus`: 1st press → 0.5, then 0.5→1→2→4→... Resonance effects: EventHorizon - Pull Strength; Malware - bounce DMG/Speed/Range; StormStrike - AOE radius; HiveMother - Infection Rate and Swarm DMG. |

---

## Legendary improvements (`Y`-series)

Codes apply the legendary upgrade at level 5, open the Matrix menu for placement.

| Code | Upgrade Type | Title |
|-----|--------------|---------|
| `y1` | EcoDMG | [STORM OF STEEL](./legendary-upgrades/ecodmg.md) |
| `y2` | EcoXP | [NEURAL HARVEST](./legendary-upgrades/ecoxp.md) |
| `y3` | EcoHP | [ESSENCE SYPHON](./legendary-upgrades/ecohp.md) |
| `y4` | CombShield | [AEGIS PROTOCOL](./legendary-upgrades/combshield.md) |
| `y5` | ComLife | [CRIMSON FEAST](./legendary-upgrades/comlife.md) |
| `y6` | ComCrit | [SHATTERED FATE](./legendary-upgrades/comcrit.md) |
| `y7` | ComWave | [TERROR PULSE](./legendary-upgrades/comwave.md) |
| `y8` | RadiationCore | [RADIATION CORE](./legendary-upgrades/radiationcore.md) |
| `y9` | DefPuddle | [TOXIC SWAMP](./legendary-upgrades/defpuddle.md) |
| `y0` | DefEpi | [EPICENTER](./legendary-upgrades/defepi.md) |
| `y-` | KineticBattery | [KINETIC BATTERY](./legendary-upgrades/kineticbattery.md) |
| `y=` | Chrono Plating | [CHRONO PLATING](./legendary-upgrades/chronoplating.md) |

---

## Drawings (`O`-series)

Code `o1`–`o12` - throws out a blueprint within a radius of 300 px from the player.

| Code | Drawing Type |
|-----|-----------|
| `o1` | METEOR_SHOWER |
| `o2` | NEURAL_OVERCLOCK |
| `o3` | STASIS_FIELD |
| `o4` | PERK_RESONANCE |
| `o5` | ARENA_SURGE |
| `o6` | QUANTUM_SCRAPPER |
| `o7` | MATRIX_OVERDRIVE |
| `o8` | TEMPORAL_GUARD |
| `o9` | DIMENSIONAL_GATE |
| `o10` | SECTOR_UPGRADE_ECO |
| `o11` | SECTOR_UPGRADE_COM |
| `o12` | SECTOR_UPGRADE_DEF |

`o20` - adds the already researched drawing `DIMENSIONAL_GATE` (status: `ready`) to the inventory.

---

## Meteorites (`M`-series)

| Code | Rarity | Action |
|----------|---------|---------|
| `m1` | abnormal | Spawn in the world (100 px from the player) |
| `m2` | radiant | Spawn in the world |
| `m3` | abyss | Spawn in the world |
| `m4` | eternal | Spawn in the world |
| `m5` | divine | Spawn in the world |
| `m6` | singularity | Spawn in the world |
| `mi1`–`mi6` | the same rarities | Places the meteorite directly into inventory (`isNew = true`) |

> **Note:** The documentation screenshot indicates `m1...m9`, but only 6 rarities (m1–m6) are implemented in the code.

---

## Bosses (`B`-series)

Format: `b[form_number][level]`

| Form | Number |
|-------|-------|
| circle | 1 |
| triangle | 2 |
| square | 3 |
| diamond | 4 |
| pentagon | 5 |

Levels: 1–5.

**Examples:**- `b11` — Boss Circle Lvl 1
- `b15` — Boss Circle Lvl 5
- `b51` — Boss Pentagon Lvl 1
- `b55` — Boss Pentagon Lvl 5

**Fast spawn (maximum level):** `v1`–`v5` - spawns a boss of the corresponding form at level 4 (Max Tier).

**Legacy format:** `v[form]-[level]` (e.g. `v1-1`) - similar to b-series, supported.

---

## Enemies (`E`-series)

| Code | Effect |
|----------|--------|
| `e1` | Spawn 5 circle enemies (circle) |
| `e2` | Spawn 5 triangle enemies |
| `e3` | Spawn 5 square enemies |
| `e4` | Spawn 5 diamond enemies |
| `e5` | Spawn 5 pentagon enemies |
| `e6` or `sni` | Rare enemy Snitch spawn |
| `z3` | Spawn Void Burrower (worm) |
| `gli` | Spawn Prism Glitcher (only if does not exist) |

---

## Events (`Z`-series)

| Code | Event |
|----------|--------|
| `z1` | Legion Formation - activates the `legion_formation` event for 600 seconds |
| `z2` | Necrotic Surge (Horde) - activates the `necrotic_surge` event for 30 sec |

---

## Turrets (`TUR`-series)

Format: `turf[N]`, `turi[N]`, `turh[N]` or abbreviated `tf[N]`, `ti[N]`, `th[N]`.

| Type | Key |
|-----|------|
| Fire | `f` |
| Ice | `i` |
| Treatment (heal) | `h` |

Level: 1–6. Turret radius: `120 × (1 + (level − 1) × 0.1)`.

**Example:** `turf3` or `tf3` is a level 3 fire turret.

---

## Time jump (`T`-series)

Format: `t[minutes]`. Available values: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60.

**Example:** `t20` - jump forward 20 minutes of game time.

---

## Portals

| Code | Effect |
|----------|--------|
| `por` | Resets the portal to the `closed` state, timer → 10.1 s (fast re-opening) |
| `lvl` / `l1` / `lp` | Additionally opens portals (`portalsUnlocked = true`) |

---

## Service

| Code | Effect |
|----------|--------|
| `bug` | Opens Admin Console |
| `i15` | Runs the "Fake Portal Troll" test script (writes `fakePortalTriggerTime` to the assistant's history) |

---

## Alternatives and errors

- If the buffer does not match any suffix, nothing happens, the buffer continues to accumulate.
- For `gli`: if Glitcher already lives among enemies, spawn is skipped and the buffer is reset.
- For `o20`: if there is no free slot in the inventory, the drawing is not added (without notifying the user).
- For `mi1–mi6`: if the inventory is full, the meteorite is not added.
- For legendary upgrades: if the type is not found in `LEGENDARY_UPGRADES`, nothing is applied.

---

## Related functions and entities

- [Legendary upgrades (list)](./legendary-upgrades/) - all 12 upgrades applied through the Y-series
- [Armor](./stats/armor.md) - affected by the `rmo` code
- [HP](./stats/hp.md) - affected by code `k1`
- [XP](./stats/xp-gain.md) - affected by the `lvl` code