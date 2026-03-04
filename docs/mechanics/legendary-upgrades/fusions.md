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
| **THE GRAVITY ANCHOR** | Aegis Protocol + Epicenter | Defensive / Defensive | BASTION / BASTION |
| **THE TEMPORAL MONOLITH** | Aegis Protocol + Chrono Plating | Defensive / Defensive | BASTION / BASTION |
| **THE NEUTRON STAR** | Essence Syphon + Radiation Core | Economic / Combat | EXIS / APEX |

---

## THE NEUTRON STAR

A stellar collapse between **Essence Syphon** (EcoHP) and **Radiation Core**. It pulls everything into its inescapable reach, converting matter into pure gravitational force.

### Passive Perks
Inherits all perks from **Essence Syphon** (Lvl 1-4) and **Radiation Core** (Lvl 1-4):
- **Essence Syphon Traits**:
    - +0.1 Max HP per kill
    - +0.03 HP/sec per kill
    - +0.1% Max HP per kill
    - +0.03% HP/sec per kill
- **Radiation Core Traits**:
    - 5% of Player's MAX HP/sec to enemies (500px)
    - 0.2% MAX HP/sec heals player per enemy in aura
    - +1% Aura DMG per 1% of your Missing HP
    - 2.0% of MAX HP/sec enemies lose map-wide

### Fusion Mechanics: [EVENT HORIZON]
- **Gravitational Intensity**: Radiation Aura damage is increased by **2% for every 100 Max HP** you have. (Multiplicative: e.g., 5% * 1.02, not 5% + 2%).
- **Stellar Harvest**: 0.01% Aura DMG increase for every enemy killed by your Radiant Aura.
- **Double Souls**: Essence Syphon soul counts are doubled for the purpose of its scaling perks.

---

## THE BLOOD-FORGED CAPACITOR

A dark resonance between **Crimson Feast** and **Kinetic Battery**. 20% of your armour dealth to 2 nearby enemies on projectile hit. 15% dmg of your armour applied as bleeding to your enemeis on hit for 3 seconds.

### Passive Perks
Inherits all perks from **Crimson Feast** (Lvl 1-4) and **Kinetic Battery** (Lvl 1-4).

### Fusion Mechanics: Kinetic Bolt
- **Arcing Energy**: 20% of your armour dealth to 2 nearby enemies on projectile hit.
- **Bleed Status**: 15% dmg of your armour applied as bleeding to your enemeis on hit for 3 seconds.

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

---

## THE GRAVITY ANCHOR

A structural collapse between **Aegis Protocol** and **Epicenter**. Crushes enemies under the weight of your armor.

### Passive Perks
Inherits all perks from **Aegis Protocol** (Lvl 1-4) and **Epicenter** (Lvl 1-4).

### Fusion Mechanics: Armor Crush
- **Weight of the Bastion**: The Epicenter spikes now deal continuous bonus damage equal to **25% of your Total Armor per second**.
- **Shatter Point**: Enemies executed within the Epicenter violently explode, dealing **10% of their Maximum HP as damage** to all other enemies within a 200px radius.

---

## THE TEMPORAL MONOLITH

A timeless monolith forged from raw endurance. It does not just absorb blows; it converts their kinetic energy into localized temporal accelerations.

### Passive Perks
Inherits all perks from **Aegis Protocol** (Lvl 1-4) and **Chrono Plating** (Lvl 1-4).

### Fusion Mechanics: Chrono-Kinetic Conversion
- **Temporal Acceleration**: Taking any damage increases your **Cooldown Recovery Speed by 20% for 1.0 second**. This effect refreshes on every hit taken, allowing for rapid skill cycling during intense combat.

### Active Skill: Stasis Burst
Releases a wave of temporal energy that freezes time itself around you.
- **Frozen Prison**: Freezes all enemies within a **400px radius for 4.0 seconds**.
- **Temporal Shatter**: If an enemy dies while frozen by this skill, it violently shatters, dealing **25% of its Maximum HP as AOE damage** to all other enemies within a 200px radius.

