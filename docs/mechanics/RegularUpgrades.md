# Regular Upgrades

Regular upgrades are the primary method of increasing player power upon leveling up. When a player levels up (or opens a reward from specific enemies like the Snitch), they are presented with a choice of up to three upgrades.

## Pool Generation

The upgrade pool is drawn from the `UPGRADE_TYPES` constant. To ensure variety, the game prevents the same upgrade ID from appearing too frequently by tracking `shownUpgradeIds` and resetting when the available pool is exhausted.

## Rarity Scaling

The effectiveness of an upgrade is determined by its rarity. Each rarity has a multiplier applied to the base value:

| Rarity | Multiplier | Color |
| :--- | :--- | :--- |
| Scrap | 0.5x | #7FFF00 |
| Anomalous | 1.0x | #00C0C0 |
| Quantum | 2.5x | #00FFFF |
| Astral | 4.5x | #7B68EE |
| Radiant | 9.0x | #FFD700 |
| Abyss | 18.0x | #8B0000 |
| Eternal | 35.0x | #B8860B |
| Divine | 60.0x | #FFFFFF |
| Singularity | 95.0x | #E942FF |

## Base Stat Values

The final value of an upgrade is calculated as: `Math.round(BaseValue × RarityMultiplier)`.

| ID | Name | Description | Base Value |
| :--- | :--- | :--- | :--- |
| `dmg_f` | Damage | Increases base power. | 15 |
| `dmg_m` | Damage Multiplier | Boosts total power %. | 15 |
| `atk_s` | Attack Speed | Reduces firing delay. | 30 |
| `hp_f` | Max Health | Increases HP capacity. | 100 |
| `hp_m` | Health Multiplier | Boosts HP capacity %. | 60 |
| `reg_f` | Health Regen | Flat HP/sec. | 2 |
| `reg_m` | Regen Multiplier | Boosts regen %. | 30 |
| `xp_f` | Exp Per Kill | Flat XP bonus. | 20 |
| `xp_m` | Exp Multiplier | Boosts XP gain %. | 10 |
| `arm_f` | Armor | Flat reduction. | 15 |
| `arm_m` | Armor Multiplier | Boosts armor %. | 15 |

## Application Logic

- **Flat Upgrades**: Added directly to the player's `flat` stat value.
- **Multiplier Upgrades**: Added to the player's `mult` stat value (as a percentage).
- **Health**: When `hp_f` or `hp_m` is increased, the player's `curHp` is also increased by the same amount to maintain current health percentage relative to the new maximum.
- **Healing**: A special `heal` upgrade exists that recovers 50 HP (limited by MaxHP).
