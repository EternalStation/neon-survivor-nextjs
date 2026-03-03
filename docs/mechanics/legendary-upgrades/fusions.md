# LEGENDARY FUSIONS

Fusions are powerful legendary upgrades created by merging two specific Max Level (Lvl 5) legendaries.

## Current Fusions

| Fusion Name | Ingredients | Category | Forge |
|-------------|-------------|----------|-------|
| **THE XENO-ALCHEMIST** | Neural Harvest + Toxic Swamp | Economic / Defensive | EXIS / BASTION |
| **THE IRRADIATED MIRE** | Toxic Swamp + Radiation Core | Combat / Defensive | APEX / BASTION |
| **THE NEURAL SINGULARITY** | Neural Harvest + Terror Pulse | Economic / Combat | EXIS / APEX |
| **THE KINETIC TSUNAMI** | Storm of Steel + Terror Pulse | Economic / Combat | EXIS / APEX |
| **THE SOUL-SHATTER CORE** | Shattered Fate + Storm of Steel | Combat / Economic | APEX / EXIS |
| **THE BLOOD-FORGED CAPACITOR** | Crimson Feast + Kinetic Battery | Combat / Defensive | APEX / BASTION |

---

## THE BLOOD-FORGED CAPACITOR

A dark resonance between **Crimson Feast** and **Kinetic Battery**. Converts kinetic trauma into vital essence.

### Passive Perks
Inherits all perks from **Crimson Feast** (Lvl 1-4) and **Kinetic Battery** (Lvl 1-4):
- **Crimson Feast Traits**:
    - +3% Lifesteal
    - Overheal becomes Shield (200% efficiency, 3s)
    - +2% Enemy Max HP as DMG (Non-Bosses)
    - 10% Zombie Spawn Chance (5s Delay, Feasters)
- **Kinetic Battery Traits**:
    - On-hit Shockwave 10 targets (100% Armor DMG, 5s CD)
    - Gain Shield 100% Armor. 1 min Refresh
    - HP < 50%: ARMOR increased by 100%
    - Gain 0.25% Cooldown Reduction per minute

### Fusion Mechanics: Vital Resonance
- **Parasitic Pulse**: Damage dealt by **Kinetic Shockwaves** (from both passive trigger and active skills) now triggers your **Lifesteal** effect.
- **Consumption Feed**: Every time a **Friendly Zombie** consumes an enemy, there is a **5% chance** to immediately trigger a **Kinetic Shockwave** at the player's location.
- **Synergy**: The shockwaves triggered by zombies also benefit from the lifesteal effect, creating a feedback loop of healing and destruction.

---

---

## THE KINETIC TSUNAMI

A devastating fusion that combines the kill-scaling damage of **Storm of Steel** with the wave-clearing power of **Terror Pulse**.

### Passive Perks
Inherits all perks from **Storm of Steel** (Lvl 1-4) and **Terror Pulse** (Lvl 1-4):
- **Storm of Steel Traits**:
    - +0.1 DMG per kill
    - +0.1 ATC per kill
    - +0.05% DMG per kill
    - +0.05% ATC per kill
- **Terror Pulse Traits**:
    - 75% Player DMG wave in 1000 radius
    - 1.5s Fear to enemies hit (STATIC)
    - +1% Wave DMG per activation
    - +3% Move Speed after wave cast

### Active Skill: Sonic Avalanche
Releases a massive sonic wave.
- **Souls Scaling**: Wave damage is increased by **1% for every 100 souls** harvested since the acquisition of Storm of Steel.
- **Cooldown Reduction**: Wave cooldown is permanently reduced by **0.01s for every enemy killed by the wave**.

---

## THE NEURAL SINGULARITY

A mind-bending fusion that combines the resource harvesting of **Neural Harvest** with the crowd control of **Terror Pulse**.

### Passive Perks
Inherits all perks from **Neural Harvest** (Lvl 1-4) and **Terror Pulse** (Lvl 1-4):
- **Neural Harvest Traits**:
    - +0.1 XP per kill
    - +0.05 Dust per kill
    - +0.1 Flux per kill
    - +0.1% XP per kill
- **Terror Pulse Traits**:
    - 75% Player DMG wave in 1000 radius
    - 1.5s Fear to enemies hit (STATIC)
    - +1% Wave DMG per activation
    - +3% Move Speed after wave cast

### Active Skill: Cognitive Shockwave
Releases a massive wave of fear.
- **Enlightenment Scaling**: **0.1s additional fear to wave for every 500xp/kill stat**.
- **Veteran Scaling**: Wave cooldown is reduced by **0.02s for every 1 Player Level**.

---

## THE SOUL-SHATTER CORE

A critical fusion of **Shattered Fate** and **Storm of Steel**. Extends critical lethality through soul harvesting.

### Passive Perks
Inherits all perks from **Shattered Fate** (Lvl 1-4) and **Storm of Steel** (Lvl 1-4):
- **Shattered Fate Traits**:
    - +15% Crit Chance
    - HP < 50%: 10% Execute
    - 300% Death Mark DMG
    - 25% Mega-Crit Chance
- **Storm of Steel Traits**:
    - +0.1 DMG per kill
    - +0.1 ATC per kill
    - +0.05% DMG per kill
    - +0.05% ATC per kill

### Fusion Mechanics: Soul Reaping
- **Soul Calibration**: Every **500 Souls** collected since acquisition grants a permanent **+1% Crit Chance** and **+5% Crit Damage** (No Cap).
- **Executive Privilege**: Every **Execute** grants **5x Souls** from that kill specifically for this upgrade's scaling.
- **Amplification**: Fully compatible with meteorite efficiency boosts across both Combat and Economic sectors.

---

## Technical Details

### Space-Saving UI
To prevent interface clutter, **Merged Legendaries (Fusions)** do not display the "SYSTEM CAPABILITY" (Lore) block in their details view. Only the active skill specifications and specific perk data are shown.

### Dynamic Tooltips
Fusions calculate and display current power levels in their descriptions and perks:
- **Kinetic Tsunami**: `(Actually +X% bonus based on Y souls)`
- **Neural Singularity**: `(Actually +X.Xs fear and -X.Xs CD)`
