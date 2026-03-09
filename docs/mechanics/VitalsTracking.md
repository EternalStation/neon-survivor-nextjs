# Vitals Tracking System

## Purpose

Balance and difficulty analysis system that tracks three key metrics throughout a gameplay session:

1. **Average HP Percentage** – reveals whether the player is consistently at high health (indicative of excessive healing) or frequently low (difficulty too high).
2. **Incoming Damage Sources** – breakdown of all damage taken by the player, by category.
3. **Healing Sources** – breakdown of all health recovered during the session, by source.

## Data Stored (Player interface, `types.ts`)

| Field | Type | Description |
|---|---|---|
| `avgHpAccumulator` | `number` | Sum of HP% samples across all frames |
| `avgHpSampleCount` | `number` | Number of frames sampled |
| `incomingDamageBreakdown` | `Record<string, number>` | Damage taken per source label |
| `healingBreakdown` | `Record<string, number>` | Healing received per source label |

## Average HP Calculation

Sampled every frame in `updatePlayerStats` (`PlayerStats.ts`) after the regen update. The running average is:

```
avgHp = avgHpAccumulator / avgHpSampleCount
```

The value is expressed as a percentage (0–100).

## Incoming Damage Sources

Tracked in `applyDamageToPlayer` (`CombatUtils.ts`) for every point of damage that passes through to `curHp`. The source label is resolved via:

- `options.incomingDamageSource` if explicitly provided — always the enemy type label
- Otherwise falls back based on `options.sourceType`:
  - `'collision'` → `'Collision'`
  - `'projectile'` → `'Projectile'`
  - `'other'` → `'Special Attack'`

Enemy type labels are derived from `e.shape` (capitalized), with `' Boss'` appended for boss enemies. Enemy projectiles carry `sourceShape` on the `Bullet` object, set at spawn time via `spawnEnemyBullet`.

### Known Source Labels

| Label | Origin | File |
|---|---|---|
| `Circle` | Circle enemy body contact | `PlayerCombat.ts` |
| `Triangle` | Triangle enemy body contact | `PlayerCombat.ts` |
| `Square` | Square enemy body contact | `PlayerCombat.ts` |
| `Diamond` | Diamond enemy body contact or elite laser | `PlayerCombat.ts`, `EliteEnemyLogic.ts` |
| `Pentagon` | Pentagon enemy body contact | `PlayerCombat.ts` |
| `Hexagon` | Hexagon enemy body contact | `PlayerCombat.ts` |
| `Minion` | Minion body contact | `PlayerCombat.ts` |
| `Abomination Boss` | Anomaly (Overlord) burn aura | `EnemyIndividualUpdate.ts` |
| `Triangle Boss` | Triangle boss body contact | `PlayerCombat.ts` |
| `Diamond Boss` | Diamond boss laser fence, orbital beam, beam attacks | `BossLogicPart2.ts` |
| `Pentagon Boss` | Pentagon boss body contact, phalanx drones, soul drain | `PlayerCombat.ts`, `EnemyIndividualUpdate.ts`, `BossLogicPart2.ts` |
| `Wall Impact` | Player hitting arena walls | `PlayerMovement.ts` |

## Healing Sources

Tracked via `recordHealing(player, source, amount)` (`DamageTracking.ts`). Only the actual healed amount (clamped to max HP) is recorded.

### Registered Healing Sites

| Source Label | File | Trigger |
|---|---|---|
| `Regeneration` | `PlayerStats.ts` | Passive HP regen every frame |
| `Radiation Aura` | `PlayerCombat.ts` | Radiation Core LVL 2+ aura heal per enemy |
| `Lifesteal` | `PlayerCombat.ts` | Blood Forged Capacitor LVL 5 zap heal |
| `Lifesteal` | `ProjectilePlayerLogic.ts` | ComLife / Blood Forged projectile lifesteal |
| `Vital Spark` | `LootLogic.ts` | Picking up a Vital Spark meteorite |
| `Heal Turret` | `TurretLogic.ts` | Heal POI turret beam |
| `Heal Drone` | `TurretLogic.ts` | Heal drone ally proximity heal |
| `Upgrade Heal` | `UpgradeLogic.ts` | Selecting the "Heal" upgrade card |

## UI Display

Data is shown in the **Threat tab** of the Stats Menu (`StatsMenu.tsx`), below the existing Threat Progression charts, in a section called **VITALS ANALYSIS** rendered by the `VitalsAnalysis` component (`src/components/stats/VitalsAnalysis.tsx`).

The AVG HP % value is color-coded:
- Green: ≥ 70%
- Yellow: 40–69%
- Red: < 40%

Each incoming/healing source is shown as a labeled bar with percentage share of total.
