# Neon Survivor - Project Library & Navigation (INDEX.md)

This is the authoritative map of all documentation for Neon Survivor. Follow the structural logic below to find relevant mechanics, classes, and system behaviors.

> **Rule**: If a file is added or changed, this index MUST be updated immediately.

---

## 1. Character Classes

| File | Description |
| :--- | :--- |
| [classes/Malware.md](classes/Malware.md) | **Malware**: Manual aiming, infinite ricochets, and stacking damage bonuses. |
| [classes/VoidEventhorizon.md](classes/VoidEventhorizon.md) | **Void**: Singularity-based crowd control with % maximum HP damage. |
| [classes/RayStormstrike.md](classes/RayStormstrike.md) | **Ray**: Periodic orbital strikes with high base area-of-effect damage. |
| [classes/VortexAigis.md](classes/VortexAigis.md) | **Vortex**: Orbital projectile rings providing multi-layered passive defense and damage. |
| [classes/HiveMother.md](classes/HiveMother.md) | **Hive-Mother**: Nanite infection logic, DoT, and jumping host mechanics. |

---

## 2. Core Mechanics & Stats

### Base Stats & Formulas
| File | Description |
| :--- | :--- |
| [mechanics/StatFormula.md](mechanics/StatFormula.md) | The universal `PlayerStats` formula: HexMultipliers, Souls, and global modifiers. |
| [mechanics/LootSystem.md](mechanics/LootSystem.md) | **Loot & Resources**: Enemy drop rates, Flux/Dust acquisition, and item rewards. |
| [mechanics/DamageReduction.md](mechanics/DamageReduction.md) | Collision and Projectile reduction scaling, linear summation, and 80% caps. |
| [mechanics/DashAbility.md](mechanics/DashAbility.md) | Dash mechanics: Distance (240px), Cooldown (4s), and cyan particle effects. |

### Stat Modules
| File | Description |
| :--- | :--- |
| [mechanics/stats/Hp.md](mechanics/stats/Hp.md) | **Max HP**: Calculation formula including base stats and economic perks. |
| [mechanics/stats/Armor.md](mechanics/stats/Armor.md) | **Armor**: Logarithmic DR formula with a 95% cap and source-specific stacking. |
| [mechanics/stats/Damage.md](mechanics/stats/Damage.md) | **Projectile Damage**: Base multipliers and level-based scaling. |
| [mechanics/stats/AttackSpeed.md](mechanics/stats/AttackSpeed.md) | **Attack Speed**: Logarithmic conversion to shots/sec (ATS). |
| [mechanics/stats/Regen.md](mechanics/stats/Regen.md) | **HP Regeneration**: Flat and percentage-based recovery formulas. |
| [mechanics/stats/XpGain.md](mechanics/stats/XpGain.md) | **XP Gain**: Experience distribution logic and Arena 0 multipliers. |
| [mechanics/stats/CollisionReduction.md](mechanics/stats/CollisionReduction.md) | Specific reduction against physical enemy contact (Aegis Protocol). |
| [mechanics/stats/CooldownReduction.md](mechanics/stats/CooldownReduction.md) | **CDR**: Skill cooldown reduction scaling and time-based modifiers. |

---

## 3. Upgrades & Fusions

### Legendary Upgrades (By Arena)
| Category | File | Description |
| :--- | :--- | :--- |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/EcoDmg.md](mechanics/legendary-upgrades/EcoDmg.md) | **Storm of Steel**: Kill-scaling Damage and Attack Speed. |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/EcoXp.md](mechanics/legendary-upgrades/EcoXp.md) | **Neural Harvest**: Soul-based XP and resource thresholds. |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/EcoHp.md](mechanics/legendary-upgrades/EcoHp.md) | **Essence Syphon**: Kill-scaling Max HP and Regeneration. |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/CombShield.md](mechanics/legendary-upgrades/CombShield.md) | **Aegis Protocol**: Armor and specialized damage reduction. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/ComLife.md](mechanics/legendary-upgrades/ComLife.md) | **Crimson Feast**: Lifesteal, Overheal shields, and Zombie mechanics. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/ComCrit.md](mechanics/legendary-upgrades/ComCrit.md) | **Shattered Fate**: Execution thresholds and Death Marks. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/ComWave.md](mechanics/legendary-upgrades/ComWave.md) | **Terror Pulse**: Active AoE shockwave and Fear status. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/RadiationCore.md](mechanics/legendary-upgrades/RadiationCore.md) | **Radiation Core**: Constant MaxHP/sec aura with global decay (L4). |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/DefPuddle.md](mechanics/legendary-upgrades/DefPuddle.md) | **Toxic Swamp**: Acid DoT, slow, and area-based HP/Regen buffs. |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/DefEpi.md](mechanics/legendary-upgrades/DefEpi.md) | **Epicenter**: Invulnerability channel and damage reduction. |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/KineticBattery.md](mechanics/legendary-upgrades/KineticBattery.md) | **Kinetic Battery**: Armor-based shockwaves and temporary shielding. |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/ChronoPlating.md](mechanics/legendary-upgrades/ChronoPlating.md) | **Chrono Plating**: Armor conversion to offensive stats. |

### Fusions & UI
| File | Description |
| :--- | :--- |
| [mechanics/legendary-upgrades/Fusions.md](mechanics/legendary-upgrades/Fusions.md) | Detailed rules for combining L4 perks into Legendary Master Skills. |
| [mechanics/legendary-upgrades/FusionMenu.md](mechanics/legendary-upgrades/FusionMenu.md) | **Fusion Forge**: Visual features, sorting logic, and card interactions. |
| [mechanics/legendary-upgrades/FusionAssets.md](mechanics/legendary-upgrades/FusionAssets.md) | High-fidelity icon paths and naming conventions for fusion skills. |
| [mechanics/legendary-upgrades/GravitationalHarvest.md](mechanics/legendary-upgrades/GravitationalHarvest.md) | Specialized fusion involving singularity and resource collection. |

---

## 4. Enemies & Bosses

| File | Description |
| :--- | :--- |
| [enemies/EliteTriangle.md](enemies/EliteTriangle.md) | **Elite Triangle**: Tactical dash with 0.5s telegraph and high-speed wobbling. |
| [enemies/Snitch.md](enemies/Snitch.md) | **Quantum Snitch**: Rare evasive target with 1HP and tactical teleportation. |
| [enemies/Overlord.md](enemies/Overlord.md) | **The Anomaly**: Multi-phase evolution, HP regeneration, and heat auras. |
| [mechanics/PentagonBoss.md](mechanics/PentagonBoss.md) | **Pentagon Boss**: Rocket transformations and area-denial fire trails. |
| [mechanics/BossSizeAndVisuals.md](mechanics/BossSizeAndVisuals.md) | Scaling multipliers and visual padding to prevent overlap with the Overlord. |
| [mechanics/EnemyVisuals.md](mechanics/EnemyVisuals.md) | **4-Layer Rendering**: Core, Ring, Body, Outline. Neon era color palettes. |
| [mechanics/EnemyHpBars.md](mechanics/EnemyHpBars.md) | HP bar rendering logic for Elites and Boss stage separators (33%/66%). |

---

## 5. Environment & Systems

| File | Description |
| :--- | :--- |
| [mechanics/TurretSystem.md](mechanics/TurretSystem.md) | Interaction radius (350px), cost scaling, and turret variants (Fire/Ice/Heal). |
| [mechanics/MenuAnimation.md](mechanics/MenuAnimation.md) | Scanning effect, "DECRYPTING" animations, and 0.5s-1.0s initial delay. |
| [mechanics/MatrixSectorColors.md](mechanics/MatrixSectorColors.md) | Unified purple palette for Sector 01-03 identifiers. |
| [mechanics/Cooldown.md](mechanics/Cooldown.md) | Description of the three disparate cooldown systems used in the game. |
| [mechanics/CheatCodes.md](mechanics/CheatCodes.md) | Debug protocols for resources, bosses, and time manipulation. |
| [mechanics/LeaderboardRounding.md](mechanics/LeaderboardRounding.md) | Consistent integer and decimal rounding for score submissions. |

---

## 6. Knowledge Base Status

| Status | Meaning |
| :--- | :--- |
| ✅ Documented | Confirmed by reading source code. |
| ⚠️ Assumption | Requires functional verification in-game. |
| 🔲 Scheduled | Planned for future documentation. |

**Current Coverage**:
- Classes: 5/5
- Core Stats: 8/8
- Legendary Upgrades: 12/12
- Bosses: 3 Major variants
- Systems: 6 Modules