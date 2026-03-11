# Universal stat formula (PlayerStats)

## PlayerStats structure

Combat characteristics (`hp`, `dmg`, `atk`, `reg`, `arm`) are stored in the `PlayerStats` format:

| Field | Type | Source |
|------|-----|---------|
| `base` | number | Base class value |
| `flat` | number | Additive bonuses from regular upgrades |
| `mult` | % | Percentage bonuses from regular upgrades |
| `hexFlat` | number | Additive Bonuses from Legendary Upgrades |
| `hexMult` | % | First Percentage Bonus from Legendary Upgrades |
| `hexMult2` | % | Second percentage bonus from legendary upgrades |

## Calculation formula

```
Total = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × arenaMult × curseMult
```

- `hexMult` and `hexMult2` are summed additively within one tier before being applied to the base.
- `arenaMult` and `curseMult` are external global multipliers.

## arenaMult by characteristics

`arenaMult` is only applied if the player **is in the corresponding arena** AND that arena is **unlocked** (blueprint `SECTOR_UPGRADE_*` has been applied at least once).

| Characteristics | Variable | SECTOR_UPGRADE_* only | SECTOR_UPGRADE_* + ARENA_SURGE |
|---|---|---|---|
| [HP](stats/hp.md), [Regen](stats/regen.md) | `hpRegenBuffMult` (Arena 2, DEF) | 1.3 (+30%) | 1.6 (+60%) |
| [Damage](stats/damage.md), [Attack speed](stats/attack-speed.md) | `dmgAtkBuffMult` (Arena 1, COM) | 1.3 (+30%) | 1.6 (+60%) |
| [XP](stats/xp-gain.md), Soul Yield | `xpSoulBuffMult` (Arena 0, ECO) | 1.3 (+30%) | 1.6 (+60%) |

> **ARENA_SURGE** - a separate Blueprint (cost 50 dust, duration 300 s / 5 min), which **doubles the arena bonus**: base +30% turns into +60%. Not part of SECTOR_UPGRADE_* - this is a temporary booster on top of an already unlocked arena.

### How the arena level increases

`state.arenaLevels` - counter `Record<number, number>`, starts `{ 0: 0, 1: 0, 2: 0 }`.
It can only be improved by using blueprints:

| Blueprint | Arena | Effect |
|---|---|---|
| `SECTOR_UPGRADE_ECO` | [0] Economic | `arenaLevels[0] += 1` |
| `SECTOR_UPGRADE_COM` | [1] Combat | `arenaLevels[1] += 1` |
| `SECTOR_UPGRADE_DEF` | [2] Defense | `arenaLevels[2] += 1` |

### Arena level cap

**No cap** - the counter grows unlimitedly. However, the logic only uses the `>= 1` check:

```ts
// PlayerStats.ts
state.hpRegenBuffMult = (state.currentArena === 2 && currentArenaLevel >= 1) ? activeArenaMult: 1.0;
```

Levels 2, 3 and above **do not provide any additional effect**. Reusing the same `SECTOR_UPGRADE_*` is a waste of blueprint.

## curseMult

`curseMult = state.assistant.history.curseIntensity` (default 1.0).
Set by a progression system based on dialogues with an AI assistant.

## HexMultiplier (scaling through meteorites)

Kill-scaling bonuses of legendary upgrades are multiplied by the HexMultiplier of that upgrade:

```
HexMultiplier = 1 + total_efficiency_of_4_linked_meteorite_slots
```

This value is dynamically recalculated for each legendary upgrade separately, depending on the composition and quality of the connected meteorites.

## Souls mechanics (kills as a scaling resource)

### What is Souls

`state.killCount` is a global counter that increases every time an enemy is killed. This is “souls”. It is **game-wide**, does not reset, and is not shared between legendary upgrades.

How many souls does an enemy give upon death:

| Enemy Type | Souls |
|---|---|
| Regular | +1 |
| Elite (Pentagon) | +5 |
| Elite (others) | +10 |
| Worm Head | +50 |
| All × Eco Buff | `× xpSoulBuffMult` |

### How Souls are counted for each hex level

Each hex stores `killsAtLevel: Record<number, number>` - a snapshot of `state.killCount` at the time each level was obtained:

- `killsAtLevel[1]` is fixed when **player selects hex** (first gain)
- `killsAtLevel[N]` is fixed when **player raises hex to level N**This means souls for level N are counted **from scratch from the moment this level is taken**, and not from the beginning of the game.

### Bonus calculation formula (Logarithmic Scaling)

Legendary economic upgrades use a logarithmic approach to ensure diminishing returns at high kill counts.

```
rawSouls = state.killCount - killsAtLevel[lvl]
souls = rawSouls × soulDrainMult
bonus = getLogarithmicSum(souls) × HexMultiplier × baseCoefficient
```

- `getLogarithmicSum(S)`: Initial kills grant ~100% of the `baseCoefficient`. Growth rate decreases over time (logarithmic derivative), reaching a floor of ~0.5% growth rate after 100,000 souls.
- `soulDrainMult`: Debuff from Circle Boss Lvl 4.
- `HexMultiplier`: 1 + total meteorite efficiency.
- `baseCoefficient`: The value defined in the perk (e.g. 1.0 for DMG, 0.4 for Regen).

### Tactical UI Display (Matrix Module)

When viewing legendary augmentations in the Matrix, the **Augmentation Data** shows real-time marginal growth:

1. **Flexible Base** (Left): Displays the current value of `baseCoefficient × f'(souls) × soulDrainMult`. This represents the "stat per kill" adjusted for current diminishing returns.
2. **Multiplier** (Middle): Displays the `HexMultiplier` (e.g. `x 1.75`).
3. **Real Growth** (Right): Displays the final product `FlexibleBase × Multiplier`. This is the actual stat increase the player will receive on the **next single kill**.

### Fallback logic (error protection)

```ts
// LegendaryLogic.ts
const startKills = kl[lvl] ?? hex.killsAtAcquisition ?? state.killCount;
```

Priority: `killsAtLevel[lvl]` → `killsAtAcquisition` → `state.killCount` (=0 souls, last resort).

###soulDrainMult

Reset to `1.0` every game frame by the host. Circle Boss Lvl 4 during life overwrites it with a value of < 1.0, reducing the accumulation of souls. After the boss is killed, it returns to 1.0.

## Related files

- [HP](stats/hp.md) — Maximum health
- [Armor](stats/armor.md) - Armor and Damage Reduction
- [Damage](stats/damage.md) — Base damage of projectiles
- [Attack speed](stats/attack-speed.md) — Shot frequency
- [Regeneration](stats/regen.md) - HP recovery
- [Experience per kill](stats/xp-gain.md) - XP accumulation
- [Collision Damage Reduction](stats/collision-reduction.md) - Protection against contact damage
- [Cooldown reduction](stats/cooldown-reduction.md) - Acceleration of active skills