# Neon Survivor - Project Library & Navigation (INDEX.md)

This is the authoritative map of all documentation for Neon Survivor. Follow the structural logic below to find relevant mechanics, classes, and system behaviors.

> **Rule**: If a file is added or changed, this index MUST be updated immediately.

---

## 1. Character Classes

| File | Description |
| :--- | :--- |
| [classes/malware.md](classes/malware.md) | **Malware**: Manual aiming, infinite ricochets, and stacking damage bonuses. |
| [classes/void-eventhorizon.md](classes/void-eventhorizon.md) | **Void**: Singularity-based crowd control with % maximum HP damage. |
| [classes/ray-stormstrike.md](classes/ray-stormstrike.md) | **Ray**: Periodic orbital strikes with high base area-of-effect damage. |
| [classes/vortex-aigis.md](classes/vortex-aigis.md) | **Vortex**: Orbital projectile rings providing multi-layered passive defense and damage. |
| [classes/hive-mother.md](classes/hive-mother.md) | **Hive-Mother**: Nanite infection logic, DoT, and jumping host mechanics. |

---

## 2. Core Mechanics & Stats

### Base Stats & Formulas
| File | Description |
| :--- | :--- |
| [mechanics/stat-formula.md](mechanics/stat-formula.md) | The universal `PlayerStats` formula: HexMultipliers, Souls, and global modifiers. |
| [mechanics/damage_reduction.md](mechanics/damage_reduction.md) | Collision and Projectile reduction scaling, linear summation, and 80% caps. |
| [mechanics/dash-ability.md](mechanics/dash-ability.md) | Dash mechanics: Distance (240px), Cooldown (4s), and cyan particle effects. |

### Stat Modules
| File | Description |
| :--- | :--- |
| [mechanics/stats/hp.md](mechanics/stats/hp.md) | **Max HP**: Calculation formula including base stats and economic perks. |
| [mechanics/stats/armor.md](mechanics/stats/armor.md) | **Armor**: Logarithmic DR formula with a 95% cap and source-specific stacking. |
| [mechanics/stats/damage.md](mechanics/stats/damage.md) | **Projectile Damage**: Base multipliers and level-based scaling. |
| [mechanics/stats/attack-speed.md](mechanics/stats/attack-speed.md) | **Attack Speed**: Logarithmic conversion to shots/sec (ATS). |
| [mechanics/stats/regen.md](mechanics/stats/regen.md) | **HP Regeneration**: Flat and percentage-based recovery formulas. |
| [mechanics/stats/xp-gain.md](mechanics/stats/xp-gain.md) | **XP Gain**: Experience distribution logic and Arena 0 multipliers. |
| [mechanics/stats/collision-reduction.md](mechanics/stats/collision-reduction.md) | Specific reduction against physical enemy contact (Aegis Protocol). |
| [mechanics/stats/cooldown-reduction.md](mechanics/stats/cooldown-reduction.md) | **CDR**: Skill cooldown reduction scaling and time-based modifiers. |

---

## 3. Upgrades & Fusions

### Legendary Upgrades (By Arena)
| Category | File | Description |
| :--- | :--- | :--- |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/ecodmg.md](mechanics/legendary-upgrades/ecodmg.md) | **Storm of Steel**: Kill-scaling Damage and Attack Speed. |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/ecoxp.md](mechanics/legendary-upgrades/ecoxp.md) | **Neural Harvest**: Soul-based XP and resource thresholds. |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/ecohp.md](mechanics/legendary-upgrades/ecohp.md) | **Essence Syphon**: Kill-scaling Max HP and Regeneration. |
| **Arena 0 (Eco)** | [mechanics/legendary-upgrades/combshield.md](mechanics/legendary-upgrades/combshield.md) | **Aegis Protocol**: Armor and specialized damage reduction. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/comlife.md](mechanics/legendary-upgrades/comlife.md) | **Crimson Feast**: Lifesteal, Overheal shields, and Zombie mechanics. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/comcrit.md](mechanics/legendary-upgrades/comcrit.md) | **Shattered Fate**: Execution thresholds and Death Marks. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/comwave.md](mechanics/legendary-upgrades/comwave.md) | **Terror Pulse**: Active AoE shockwave and Fear status. |
| **Arena 1 (Combat)** | [mechanics/legendary-upgrades/radiationcore.md](mechanics/legendary-upgrades/radiationcore.md) | **Radiation Core**: Constant MaxHP/sec aura with global decay (L4). |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/defpuddle.md](mechanics/legendary-upgrades/defpuddle.md) | **Toxic Swamp**: Acid DoT, slow, and area-based HP/Regen buffs. |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/defepi.md](mechanics/legendary-upgrades/defepi.md) | **Epicenter**: Invulnerability channel and damage reduction. |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/kineticbattery.md](mechanics/legendary-upgrades/kineticbattery.md) | **Kinetic Battery**: Armor-based shockwaves and temporary shielding. |
| **Arena 2 (Defense)** | [mechanics/legendary-upgrades/chronoplating.md](mechanics/legendary-upgrades/chronoplating.md) | **Chrono Plating**: Armor conversion to offensive stats. |

### Fusions & UI
| File | Description |
| :--- | :--- |
| [mechanics/legendary-upgrades/fusions.md](mechanics/legendary-upgrades/fusions.md) | Detailed rules for combining L4 perks into Legendary Master Skills. |
| [mechanics/legendary-upgrades/FusionMenu.md](mechanics/legendary-upgrades/FusionMenu.md) | **Fusion Forge**: Visual features, sorting logic, and card interactions. |
| [mechanics/legendary-upgrades/FusionAssets.md](mechanics/legendary-upgrades/FusionAssets.md) | High-fidelity icon paths and naming conventions for fusion skills. |
| [mechanics/legendary-upgrades/gravitationalharvest.md](mechanics/legendary-upgrades/gravitationalharvest.md) | Specialized fusion involving singularity and resource collection. |

---

## 4. Enemies & Bosses

| File | Description |
| :--- | :--- |
| [enemies/snitch.md](enemies/snitch.md) | **Quantum Snitch**: Rare evasive target with 1HP and tactical teleportation. |
| [enemies/overlord.md](enemies/overlord.md) | **The Anomaly**: Multi-phase evolution, HP regeneration, and heat auras. |
| [mechanics/PentagonBoss.md](mechanics/PentagonBoss.md) | **Pentagon Boss**: Rocket transformations and area-denial fire trails. |
| [mechanics/BossSizeAndVisuals.md](mechanics/BossSizeAndVisuals.md) | Scaling multipliers and visual padding to prevent overlap with the Overlord. |
| [mechanics/enemy_visuals.md](mechanics/enemy_visuals.md) | **4-Layer Rendering**: Core, Ring, Body, Outline. Neon era color palettes. |
| [mechanics/enemy_hp_bars.md](mechanics/enemy_hp_bars.md) | HP bar rendering logic for Elites and Boss stage separators (33%/66%). |

---

## 5. Environment & Systems

| File | Description |
| :--- | :--- |
| [mechanics/TurretSystem.md](mechanics/TurretSystem.md) | Interaction radius (350px), cost scaling, and turret variants (Fire/Ice/Heal). |
| [mechanics/MenuAnimation.md](mechanics/MenuAnimation.md) | Scanning effect, "DECRYPTING" animations, and 1s initial delay. |
| [mechanics/MatrixSectorColors.md](mechanics/MatrixSectorColors.md) | Unified purple palette for Sector 01-03 identifiers. |
| [mechanics/cooldown.md](mechanics/cooldown.md) | Description of the three disparate cooldown systems used in the game. |
| [mechanics/cheat-codes.md](mechanics/cheat-codes.md) | Debug protocols for resources, bosses, and time manipulation. |
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