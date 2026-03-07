# Necro-Kinetic Engine: Ally Protection Fix

## Issue Summary
Player-owned zombies (spawned by the Necro-Kinetic Engine / BloodForgedCapacitor) were being targeted and killed by the player's own kinetic bolts and area effects. This occurred because several targeting and damage logic components lacked checks for `isZombie` or `isFriendly` flags.

## Changes Made

### 1. Unified Targeting Protection (`src/logic/player/PlayerCombat.ts`)
Updated the following functions to exclude zombies and friendly units from their targeting search:
- `triggerKineticBatteryZap`: Both initial target selection and subsequent chain lightning search now skip allies.
- `triggerZombieZap`: Target selection (for the green bolt triggered by zombie consumption) now skips other allies.
- `triggerKineticBolt`: Filter for nearest targets now excludes allies.
- `triggerStaticBolt`: Filter for nearest targets now excludes allies.
- `handleEnemyContact`: Reflection damage from the `epicenter` (when using `GravitationalHarvest`) now skips allies.

### 2. Area Effect Filter Updates (`src/hooks/useAreaEffectLogic.ts`)
Updated all harmful area effects to ensure they do not affect friendly units or zombies. This includes:
- `temporal_freeze_wave`
- `puddle` (Irradiated Mire)
- `epicenter` (Defensive Epicenter / Gravity Anchor)
- `blackhole` (Event Horizon)
- `storm_laser`
- `orbital_strike`

### 3. Zombie Metadata Enhancement (`src/logic/mission/DeathLogic.ts`)
- Added `isFriendly: true` to the zombie object during creation. This ensures that any logic checking for `isFriendly` (in addition to `isZombie`) will correctly recognize them as allies.

### 4. Robust Death Logic Guard (`src/logic/mission/DeathLogic.ts`)
- Added an early exit at the top of `handleEnemyDeath` for units marked as `isFriendly` or `isZombie`. This prevents allies from triggering enemy-death events (like soul rewards, kill count increments, or score updates) even if they are accidentally killed or expire.

## Refined Behavior (V2)

### 1. Anti-Dogpiling (Unique Target Locking)
Implemented a target locking system using a new `beingConsumedBy` field on the `Enemy` interface:
- **Search Filtering**: Zombies now skip any enemy already being consumed by another zombie.
- **Lock Acquisition**: When a zombie successfully reaches its target and enters the `clinging` state, it marks that enemy with its own `id`.
- **Lock Release**: The lock is guaranteed to be released if the target dies prematurely, if the zombie is killed, or if the consumption process completes normally.

### 2. Zap Logic Restriction
To prevent "premature" green bolts and excessive zapping:
- **Contact Zaps Removed**: Shocks no longer trigger when a zombie simply bumps into an enemy during its search or while eating another target.
- **Consumption Requirement**: Green Kinetic Bolts are now strictly tied to the successful completion of the eating timer (3 seconds for normals, 5 seconds for elites). If the enemy dies before this timer (e.g., killed by player), no bolt is spawned.

## Results
Player zombies are now immune to damage from the player's kinetic battery shocks, green bolts, and all area-of-effect abilities. They correctly choose unique targets, avoiding dogpiling, and only trigger their powerful green feedback bolts once they have fully consumed their prey.
