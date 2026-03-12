# Neon Survivor - Project Library & Navigation (Index.md)

This is the authoritative map of all documentation for Neon Survivor. Follow the structural logic below to find relevant mechanics, classes, and system behaviors.

> **Rule**: If a file is added or changed, this index MUST be updated immediately.

---

## 1. Character Classes

| File | Description |
| :--- | :--- |
| [Classes/Malware.md](Classes/Malware.md) | **Malware**: Manual aiming, infinite ricochets, and stacking damage bonuses. |
| [Classes/EventHorizonVoid.md](Classes/EventHorizonVoid.md) | **Void**: Singularity-based crowd control with % maximum HP damage. |
| [Classes/StormstrikeRay.md](Classes/StormstrikeRay.md) | **Ray**: Periodic orbital strikes with high base area-of-effect damage. |
| [Classes/AigisVortex.md](Classes/AigisVortex.md) | **Vortex**: Orbital projectile rings providing multi-layered passive defense and damage. |
| [Classes/HiveMother.md](Classes/HiveMother.md) | **Hive-Mother**: Nanite infection logic, DoT, and jumping host mechanics. |

---

## 2. Core Mechanics & Stats

### Base Stats & Formulas
| File | Description |
| :--- | :--- |
| [Mechanics/Stats/StatFormula.md](Mechanics/Stats/StatFormula.md) | The universal `PlayerStats` formula: HexMultipliers, Souls, and global modifiers. |
| [Mechanics/Systems/MeteoriteSystem.md](Mechanics/Systems/MeteoriteSystem.md) | **Meteorites**: Acquisition rates (1%), Rarity pools, and Recalibration logic. |
| [Mechanics/Core/DamageReduction.md](Mechanics/Core/DamageReduction.md) | Collision and Projectile reduction scaling, linear summation, and 80% caps. |
| [Mechanics/Core/RegularUpgradeMatrix.md](Mechanics/Core/RegularUpgradeMatrix.md) | **Calculated Stats**: Matrix of all regular upgrade values across all rarity tiers. |
| [Mechanics/Abilities/DashAbility.md](Mechanics/Abilities/DashAbility.md) | Dash mechanics: Distance (240px), Cooldown (4s), and cyan particle effects. |
| [Mechanics/Systems/SkillDamageTracking.md](Mechanics/Systems/SkillDamageTracking.md) | Class-specific filtering of active skill damage for the leaderboard. |
| [Mechanics/Systems/SkillSlotRules.md](Mechanics/Systems/SkillSlotRules.md) | **Skill Slots**: Rules for the 6-slot limit and conditional legendary upgrade pooling. |
| [Mechanics/LootSystem.md](Mechanics/LootSystem.md) | **Loot & Resources**: Enemy drop rates, Flux/Dust acquisition, and item rewards. |
| [Mechanics/EnemyCollisionDamage.md](Mechanics/EnemyCollisionDamage.md) | **Collision Damage**: Standardized 7.5% current HP calculation for all enemies. |
| [Mechanics/RegularUpgrades.md](Mechanics/RegularUpgrades.md) | **Regular Upgrades**: Pool generation, rarity scaling, and base stat values. |

### Stat Modules
| File | Description |
| :--- | :--- |
| [Mechanics/Stats/Hp.md](Mechanics/Stats/Hp.md) | **Max HP**: Calculation formula including base stats and economic perks. |
| [Mechanics/Stats/Armor.md](Mechanics/Stats/Armor.md) | **Armor**: Logarithmic DR formula with a 95% cap and source-specific stacking. |
| [Mechanics/Stats/Damage.md](Mechanics/Stats/Damage.md) | **Projectile Damage**: Base multipliers and level-based scaling. |
| [Mechanics/Stats/AttackSpeed.md](Mechanics/Stats/AttackSpeed.md) | **Attack Speed**: Logarithmic conversion to shots/sec (ATS). |
| [Mechanics/Stats/Regen.md](Mechanics/Stats/Regen.md) | **HP Regeneration**: Flat and percentage-based recovery formulas. |
| [Mechanics/Stats/XpGain.md](Mechanics/Stats/XpGain.md) | **XP Gain**: Experience distribution logic and Arena 0 multipliers. |
| [Mechanics/Stats/CollisionReduction.md](Mechanics/Stats/CollisionReduction.md) | Specific reduction against physical enemy contact (Aegis Protocol). |
| [Mechanics/Stats/CooldownReduction.md](Mechanics/Stats/CooldownReduction.md) | **CDR**: Skill cooldown reduction scaling and time-based modifiers. |

---

## 3. Upgrades & Fusions

### Legendary Upgrades (By Arena)
| Category | File | Description |
| :--- | :--- | :--- |
| **Arena 0 (Eco)** | [Mechanics/LegendaryUpgrades/EcoDMG.md](Mechanics/LegendaryUpgrades/EcoDMG.md) | **Storm of Steel**: Kill-scaling Damage and Attack Speed. |
| **Arena 0 (Eco)** | [Mechanics/LegendaryUpgrades/EcoXP.md](Mechanics/LegendaryUpgrades/EcoXP.md) | **Neural Harvest**: Soul-based XP and resource thresholds. |
| **Arena 0 (Eco)** | [Mechanics/LegendaryUpgrades/EcoHP.md](Mechanics/LegendaryUpgrades/EcoHP.md) | **Essence Syphon**: Kill-scaling Max HP and Regeneration. |
| **Arena 0 (Eco)** | [Mechanics/LegendaryUpgrades/EcoShield.md](Mechanics/LegendaryUpgrades/EcoShield.md) | **Aegis Protocol**: Armor and specialized damage reduction. |
| **Arena 1 (Combat)** | [Mechanics/LegendaryUpgrades/ComLife.md](Mechanics/LegendaryUpgrades/ComLife.md) | **Crimson Feast**: Lifesteal, Overheal shields, and Zombie mechanics. |
| **Arena 1 (Combat)** | [Mechanics/LegendaryUpgrades/ComCrit.md](Mechanics/LegendaryUpgrades/ComCrit.md) | **Shattered Fate**: Execution thresholds and Death Marks. |
| **Arena 1 (Combat)** | [Mechanics/LegendaryUpgrades/ComWave.md](Mechanics/LegendaryUpgrades/ComWave.md) | **Terror Pulse**: Active AoE shockwave and Fear status. |
| **Arena 1 (Combat)** | [Mechanics/LegendaryUpgrades/ComRadiation.md](Mechanics/LegendaryUpgrades/ComRadiation.md) | **Com Radiation**: Constant MaxHP/sec aura with global decay (L4). |
| **Arena 2 (Defense)** | [Mechanics/LegendaryUpgrades/DefPuddle.md](Mechanics/LegendaryUpgrades/DefPuddle.md) | **Toxic Swamp**: Acid DoT, slow, and area-based HP/Regen buffs. |
| **Arena 2 (Defense)** | [Mechanics/LegendaryUpgrades/DefEpi.md](Mechanics/LegendaryUpgrades/DefEpi.md) | **Epicenter**: Invulnerability channel and damage reduction. |
| **Arena 2 (Defense)** | [Mechanics/LegendaryUpgrades/DefBattery.md](Mechanics/LegendaryUpgrades/DefBattery.md) | **Def Battery**: Armor-based shockwaves and temporary shielding. |
| **Arena 2 (Defense)** | [Mechanics/LegendaryUpgrades/DefPlatting.md](Mechanics/LegendaryUpgrades/DefPlatting.md) | **Chrono Plating**: 10% Delayed Damage, 400px Stasis Field (50% slow), and armor-scaled regeneration. |

### Fusions & UI
| File | Description |
| :--- | :--- |
| [Mechanics/LegendaryUpgrades/Fusions.md](Mechanics/LegendaryUpgrades/Fusions.md) | Detailed rules for combining L4 perks into Legendary Master Skills. |
| [Mechanics/LegendaryUpgrades/FusionMenu.md](Mechanics/LegendaryUpgrades/FusionMenu.md) | **Fusion Forge**: Visual features, sorting logic, and card interactions. |
| [Mechanics/LegendaryUpgrades/FusionAssets.md](Mechanics/LegendaryUpgrades/FusionAssets.md) | High-fidelity icon paths and naming conventions for fusion skills. |
| [Mechanics/LegendaryUpgrades/GravitationalHarvest.md](Mechanics/LegendaryUpgrades/GravitationalHarvest.md) | Specialized fusion involving singularity and resource collection. |

---

## 4. Enemies & Bosses

| File | Description |
| :--- | :--- |
| [Enemies/EliteTriangle.md](Enemies/EliteTriangle.md) | **Elite Triangle**: Tactical dash with 0.5s telegraph and high-speed wobbling. |
| [Enemies/Snitch.md](Enemies/Snitch.md) | **Quantum Snitch**: Rare evasive target with 1HP and tactical teleportation. |
| [Enemies/Overlord.md](Enemies/Overlord.md) | **The Anomaly**: Multi-phase evolution, HP regeneration, and heat auras. |
| [Enemies/PentagonBoss.md](Enemies/PentagonBoss.md) | **Pentagon Boss**: Rocket transformations and area-denial fire trails. |
| [Enemies/DiamondBoss.md](Enemies/DiamondBoss.md) | **Diamond Boss**: Focused beam attacks, orbital satellite strikes, and pentagonal electric fences. |
| [Mechanics/Visuals/BossSizeAndVisuals.md](Mechanics/Visuals/BossSizeAndVisuals.md) | Scaling multipliers and visual padding to prevent overlap with the Overlord. |
| [Mechanics/Visuals/EnemyVisuals.md](Mechanics/Visuals/EnemyVisuals.md) | **4-Layer Rendering**: Core, Ring, Body, Outline. Neon era color palettes. |
| [Mechanics/Visuals/EnemyHpBars.md](Mechanics/Visuals/EnemyHpBars.md) | HP bar rendering logic for Elites and Boss stage separators (33%/66%). |

---

## 5. Environment & Systems

| File | Description |
| :--- | :--- |
| [Mechanics/Systems/TurretSystem.md](Mechanics/Systems/TurretSystem.md) | Interaction radius (350px), cost scaling, and turret variants (Fire/Ice/Heal). |
| [Mechanics/Audio/MusicPlayer.md](Mechanics/Audio/MusicPlayer.md) | **Music Player**: BPM folders, track skipping, and persistent liked tracks. |
| [Mechanics/Audio/SoundEffects.md](Mechanics/Audio/SoundEffects.md) | **Sound Effects**: Real-time synthesis, asset loading, and rarity-tier audio cues. |
| [Mechanics/UI/MainMenuVisuals.md](Mechanics/UI/MainMenuVisuals.md) | **Main Menu**: Multi-layer canvas with stars, autonomous "Troll" drone, and cinematic Eye Dive transition. |
| [Mechanics/UI/MenuAnimation.md](Mechanics/UI/MenuAnimation.md) | **Upgrade Menu**: Scanning effect, "DECRYPTING" animations, and 0.5s-1.0s initial delay. |
| [Mechanics/Visuals/MatrixSectorColors.md](Mechanics/Visuals/MatrixSectorColors.md) | Unified purple palette for Sector 01-03 identifiers. |
| [Mechanics/Core/Cooldown.md](Mechanics/Core/Cooldown.md) | Description of the three disparate cooldown systems used in the game. |
| [Mechanics/Debug/CheatCodes.md](Mechanics/Debug/CheatCodes.md) | Debug protocols for resources, bosses, and time manipulation. |
| [Mechanics/Systems/LeaderboardRounding.md](Mechanics/Systems/LeaderboardRounding.md) | Consistent integer and decimal rounding for score submissions. |
| [Mechanics/Systems/BlueprintSystem.md](Mechanics/Systems/BlueprintSystem.md) | **Blueprints**: Discovery, Decryption, Activation rules, and stackable Scrapper charges. |
| [Mechanics/Systems/NecroticSurge.md](Mechanics/Systems/NecroticSurge.md) | **Necrotic Surge**: Ghost Horde event logic, ghost stats, and spawn rules. |

---

## 6. Rules & Guidelines

| File | Description |
| :--- | :--- |
| [Rules/Gemini.md](Rules/Gemini.md) | **Gemini**: Primary project rules, constraints, and operational protocols. |
| [Rules/Agents.md](Rules/Agents.md) | **Agents**: Multi-agent coordination rules and logic. |
| [Rules/Claude.md](Rules/Claude.md) | **Claude**: Specialized system prompts and behavior guidelines. |

---

## 7. Marketing & Assets

| File | Description |
| :--- | :--- |
| [../posts/SocialMediaPlaybook.md](../posts/SocialMediaPlaybook.md) | **Social Media**: Strategies and prompts for game promotion/content. |
| [../public/assets/MeteoriteReference.md](../public/assets/MeteoriteReference.md) | **Meteorites**: Visual guide and generation prompts for all rarity tiers. |

---

## 8. Knowledge Base Status

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
- Systems: 7 Modules
