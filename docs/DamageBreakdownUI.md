# Damage Breakdown UI

The Damage Breakdown system provides a detailed view of all damage dealt by the player, categorized by source. This allows for fine-grained analysis of build performance and skill effectiveness.

## Core Logic

A new damage tracking system was implemented to attribute every point of damage to a specific category.

### 1. Data Structure
The `Player` interface was expanded to include:
- `damageBreakdown: Record<string, number>`: Stores cumulative damage per source.
- `DamageSource`: A union type defining all valid attribution categories.

### 2. Attribution Mapping
Damage is attributed across all combat systems:
- **Projectiles**: Main weapon fire and class-specific projectiles.
- **Shockwaves**: Area-of-effect blasts from legendary perks like Kinetic Tsunami or Terror Pulse.
- **Nanites**: Damage-over-time and jump damage from the Hive-Mother class.
- **Fire/Ice Turrets**: Elemental damage from activated map turrets.
- **Auras**: Proximity damage from Radiation Core.
- **Collision**: Indirect damage dealt via contact effects (e.g., Soul Link).
- **Epicenter**: Damage dealt within localized crystalline spikes.
- **Bolts**: Arcing electrical damage from Kinetic/Static bolts and Zombie-triggered effects.
- **Wall Impact**: Damage calculated from the increased multipliers when projectiles bounce off geometry (specifically tracked for the Malware Prime class or Sandbox skill).

## UI Presentation

A new **DAMAGE** tab was added to the Stats Menu (Hotkey: `C`).

### Features:
- **Total Damage Counter**: Real-time display of cumulative damage dealt during the mission.
- **Source Breakdown**: A list of all active damage sources, sorted by contribution.
- **Visual Progress Bars**: Color-coded bars showing the percentage contribution of each source relative to total damage.
- **Dynamic Updates**: The list automatically populates as new damage sources are triggered.

### Color Mapping:
- **Projectile**: Emerald Green
- **Shockwave**: Royal Blue
- **Nanite Swarm**: Purple
- **Fire Turret**: Orange
- **Ice Turret**: Cyan
- **Radiation Aura**: Mint
- **Collision / Wall Impact**: Red/Crimson
- **Epicenter**: Orange
- **Bolts**: Sky Blue
