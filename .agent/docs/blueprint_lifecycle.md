# Blueprint Lifecycle System

## Overview
Blueprints in Neon Survivor have a complete lifecycle from discovery to deployment to eventual breakdown and recycling. This document explains how the system works.

## Blueprint States

Blueprints can be in one of four states:

1. **`ready`** - Blueprint has been researched and is ready to deploy
2. **`researching`** - Blueprint is currently being decrypted (30-60 second timer)
3. **`active`** - Blueprint has been deployed and is currently providing its buff
4. **`broken`** - Blueprint has expired and can be recycled for dust

## Blueprint Types

### Time-Based Blueprints
These blueprints provide a buff for a specific duration:
- **Meteor Shower** - 300s (5 minutes)
- **Neural Overclock** - 180s (3 minutes)
- **Stasis Field** - 120s (2 minutes)
- **Perk Resonance** - 180s (3 minutes)
- **Arena Surge** - 300s (5 minutes)
- **Matrix Overdrive** - 300s (5 minutes)
- **Temporal Guard** - 300s (5 minutes)

### Charge-Based Blueprints
These blueprints provide a buff for a specific number of uses:
- **Quantum Scrapper** - 50 uses (recycling meteorites)
- **Dimensional Gate** - 1 use (unlocks portals permanently)

### Permanent Blueprints
These blueprints provide permanent upgrades:
- **Sector Override: ECO** - Permanent +30% EXP and Soul Harvest
- **Sector Override: COM** - Permanent +30% DMG and Attack Speed
- **Sector Override: DEF** - Permanent +30% Max HP and Regen

## Lifecycle Flow

### 1. Discovery
- Blueprints drop from Elite enemies (15% chance)
- Only spawn after 10 minutes of gameplay
- Appear as special meteorites with divine rarity

### 2. Research
- Right-click a blueprint in inventory to start research
- Research takes 30-60 seconds (random)
- Blueprint moves to the Blueprint Archive
- Status changes from `ready` → `researching`

### 3. Deployment
- Click a researched blueprint to open deployment modal
- Pay the dust cost to activate
- Status changes from `ready` → `active`
- Buff is added to `activeBlueprintBuffs` or `activeBlueprintCharges`

### 4. Expiration
- **Time-based**: When `gameTime >= activeBlueprintBuffs[type]`
- **Charge-based**: When `activeBlueprintCharges[type] <= 0`
- Status automatically changes from `active` → `broken`
- Sound effect plays ("impact")

### 5. Recycling
- Click a broken blueprint to open modal
- Click "RECYCLE" button to scrap it
- Receive +5 dust
- Blueprint is removed from archive
- Slot becomes available for new blueprints

## Visual Indicators

### Blueprint Icons
- **Normal**: `Blueprint.png` - Blue/cyan holographic blueprint
- **Broken**: `BlueprintBroken.png` - Grayscale/damaged blueprint

### Status Colors
- **Ready**: Blue border, normal blueprint icon
- **Researching**: Yellow countdown timer overlay
- **Active**: Blue glow, "ON" label, sepia filter
- **Broken**: Grayscale filter, broken icon, recycle button

## Code Implementation

### Key Files
1. **`BlueprintLogic.ts`** - Core logic for blueprint lifecycle
   - `activateBlueprint()` - Deploys a blueprint
   - `updateBlueprints()` - Checks for expiration and marks as broken
   - `scrapBlueprint()` - Recycles broken blueprints for dust
   - `isBuffActive()` - Checks if a blueprint buff is currently active

2. **`BlueprintBay.tsx`** - UI component for blueprint archive
   - Displays 8 blueprint slots
   - Shows research progress timers
   - Handles activation modal
   - Shows recycle button for broken blueprints

3. **`types.ts`** - Type definitions
   - `Blueprint` interface with `status` field
   - `BlueprintType` enum
   - `activeBlueprintBuffs` and `activeBlueprintCharges` in GameState

### State Management
```typescript
// Time-based buffs
gameState.activeBlueprintBuffs: Partial<Record<BlueprintType, number>>
// Maps blueprint type to end timestamp

// Charge-based buffs
gameState.activeBlueprintCharges: Partial<Record<BlueprintType, number>>
// Maps blueprint type to remaining uses

// Blueprint archive
gameState.blueprints: (Blueprint | null)[]
// 10 slots total, 8 available, 2 locked
```

### Expiration Logic
The `updateBlueprints()` function runs every frame and:
1. Checks if time-based buffs have expired
2. Checks if charge-based buffs have run out
3. Marks expired blueprints as `broken`
4. Removes buff from active buffs/charges

### Charge Consumption
Charges are decremented when the blueprint's effect is used:
- **Quantum Scrapper**: Decremented in `RecycleLogic.ts` when recycling meteorites
- **Dimensional Gate**: One-time use, immediately marked as active

## Example Flow: Quantum Scrapper

1. **Drop**: Elite enemy drops Quantum Scrapper blueprint
2. **Pickup**: Player collects it into inventory
3. **Research**: Player right-clicks to research (30-60s timer)
4. **Deploy**: Player pays 50 dust to activate
5. **Use**: Each meteorite recycled has 25% chance to refund double dust
6. **Consumption**: Charge decreases from 50 → 49 → 48... → 0
7. **Expiration**: When charges reach 0, status becomes `broken`
8. **Recycle**: Player clicks to recycle for +5 dust
9. **Removal**: Blueprint removed from archive, slot freed

## Example Flow: Temporal Guard

1. **Drop**: Elite enemy drops Temporal Guard blueprint
2. **Pickup**: Player collects it into inventory
3. **Research**: Player right-clicks to research (30-60s timer)
4. **Deploy**: Player pays 100 dust to activate
5. **Active**: For 300 seconds, player has death protection
6. **Trigger**: If player takes lethal damage, teleports to safety with 1.5s immunity
7. **Expiration**: After 300 seconds, buff expires and status becomes `broken`
8. **Recycle**: Player clicks to recycle for +5 dust
9. **Removal**: Blueprint removed from archive, slot freed

## Notes

- Players can only have 8 blueprints in the archive at once
- Duplicate blueprints cannot be activated simultaneously
- Broken blueprints cannot be re-activated
- Recycling is the only way to remove broken blueprints
- Permanent blueprints (Sector Overrides, Dimensional Gate) remain in `active` state forever
