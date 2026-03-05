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

## Open questions

The exact point of application of bonuses `xp_per_kill` and `xp_pct_per_kill` from `calculateLegendaryBonus` to `player.xp.current` requires verification in the XP calculation logic.

## Related functions and entities

- [Formula PlayerStats](../stat-formula.md)
- [NEURAL HARVEST](../legendary-upgrades/ecoxp.md)