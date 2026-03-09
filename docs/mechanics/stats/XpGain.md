# Experience per kill (XP Gain)

**Type:** `{ base: number; flat: number; mult: number }` (without hexFlat/hexMult)

## Difference from PlayerStats

Unlike combat stats, `player.xp_per_kill` is not the full `PlayerStats` (there are no `hexFlat`, `hexMult` fields). Bonuses from legendary upgrades are applied through a separate mechanism in the kill logic.

## Arena scaling

In Arena 0, when arena level ≥ 1, `xpSoulBuffMult` works:
- Base value: 1.3 (+30%)
- With Surge: 1.6 (+60%)

`xpSoulBuffMult` is applied to the number of soul points awarded per kill (`state.killCount`), which indirectly speeds up the kill-scaling of all legendary upgrades.

## Legendary sources

### [NEURAL HARVEST (EcoXP)](../legendary-upgrades/ecoxp.md) - levels 1 and 4

| Level | Effect | Calculation Key |
|---------|--------|------------|
| 1 | +0.1 XP per kill × HexMultiplier | `xp_per_kill` |
| 4 | +0.1% XP per kill × HexMultiplier | `xp_pct_per_kill` |

Bonus formula: `souls_since_Lx × 0.1 × HexMultiplier`.

## Level Requirements

The XP required for the first level up is **369**. Each subsequent level increases the required amount by **10%** compounding.

| Player Level | XP Needed for Next |
|--------------|-------------------|
| 1            | 369               |
| 2            | 406               |
| 3            | 447               |
| 4            | 492               |

## Starting State

The game initializes with the player at **Level 1** and **0 / 369 XP**.

> [!NOTE]
> Previously, a bug existed where the player would erroneously start with a full XP bar (369/369), causing an immediate level up on the first frame or kill. This has been corrected to start at 0.

## Open questions

The exact point of application of bonuses `xp_per_kill` and `xp_pct_per_kill` from `calculateLegendaryBonus` to `player.xp.current` requires verification in the XP calculation logic.

## Related functions and entities

- [Formula PlayerStats](../stat-formula.md)
- [NEURAL HARVEST](../legendary-upgrades/ecoxp.md)