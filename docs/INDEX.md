# Neon Survivor - Knowledge Base (docs_v3)

A single table of contents of documentation on the actual behavior of the system.
Source of truth: source code. Comments are not used in the code.

---

## Character classes

> Description of each class: characteristics, main ability, what improves, what is fixed.

| File | Description |
|-----------|---------|
| [classes/malware.md](classesalware.md) | Malware - manual aiming, endless ricochets, increasing damage. |
| [classes/void-eventhorizon.md](classesoid-eventhorizon.md) | Void - a singularity with attraction and damage as a % of the enemy's maximum HP. |
| [classes/ray-stormstrike.md](classesay-stormstrike.md) | Ray - periodic orbital strike over an area, high base damage. |
| [classes/vortex-aigis.md](classesortex-aigis.md) | Vortex - orbital rings of projectiles, multi-layered passive damage. |
| [classes/hive-mother.md](classesive-mother.md) | Hive-Mother - chain infection with nanites, DoT and jump when the host dies. |

---

## Views

> Screens and modals that display class data.

| File | Description |
|-----------|---------|
| [VitalMireImplementation.md](VitalMireImplementation.md) | Vital Mire Implementation |
| [leaderboard_damage_tab.md](leaderboard_damage_tab.md) | Leaderboard Damage Analysis Tab |
| [fusion-skill-damage-tracking.md](fusion-skill-damage-tracking.md) | Fused Skill Damage Tracking Logic |
| [view/class-selection.md](viewlass-selection.md) | Class selection screen before the start of the session: cards, badges, navigation. |
| [view/stats-menu.md](view/stats-menu.md) | Modal window of stats in the game: characteristics, radar, threat forecast. |
| [DamageBreakdownUI.md](DamageBreakdownUI.md) | Damage Attribution tab: source breakdown, visual progress bars, real-time counters. |
| [DamageAttributionRefinement.md](DamageAttributionRefinement.md) | Damage Attribution Refinement: Projectile grouping, Malware bonuses, and filtered Collision damage. |

---

## Mechanics

### Characteristics (Stats)

> Calculation formulas, sources of bonuses and legendary improvements that affect each characteristic.

| File | Description |
|-----------|---------|
| [mechanics/stat-formula.md](mechanicstat-formula.md) | Universal formula PlayerStats: fields, multipliers, HexMultiplier, Souls. |
| [mechanics/stats/hp.md](mechanicstats/hp.md) | Max HP: Formula, EcoHP, DefPuddle L3. |
| [mechanics/stats/armor.md](mechanicstats/armor.md) | Armor: DR formula, cap 95%, CombShield, KineticBattery L3, ChronoPlating L3. |
| [mechanics/stats/damage.md](mechanicstats/damage.md) | Projectile Damage: Formula, EcoDMG, ChronoPlating L1 and L2. |
| [mechanics/stats/attack-speed.md](mechanicstats/attack-speed.md) | Attack speed: logarithmic conversion to shots/sec, EcoDMG, ChronoPlating L1. |
| [mechanics/stats/regen.md](mechanicstats/regen.md) | HP regeneration: formula, EcoHP, DefPuddle L3, ChronoPlating L4 (outside formula). |
| [mechanics/stats/xp-gain.md](mechanicstats/xp-gain.md) | Experience per kill: structure, Arena 0 buff, EcoXP. |
| [mechanics/stats/collision-reduction.md](mechanicstats/collision-reduction.md) | Collision damage reduction: cap 80%, CombShield L2. |
| [mechanics/stats/cooldown-reduction.md](mechanicstats/cooldown-reduction.md) | Skill cooldown reduction: KineticBattery L4, time-scaling. |

### Cooldowns

| File | Description |
|-----------|---------|
| [mechanics/cooldown.md](mechanics/cooldown.md) | Three cooldown systems: countdown, gameTime-timestamp, Date.now(). cdMod formula, skill life cycle, HUD, architectural issues and centralization plan. |

### Cheat codes

| File | Description |
|-----------|---------|
| [mechanics/cheat-codes.md](mechanics/cheat-codes.md) | All debug codes: resources, bosses, improvements, time, turrets, events. |
| [mechanics/LeaderboardRounding.md](mechanics/LeaderboardRounding.md) | Leaderboard Rounding: Consistent integer and 2-decimal rounding for submission data. |
| [KeybindRefinement.md](KeybindRefinement.md) | Keybind Refinement: Separated Class Ability (Q) and numerical Skill bar (1-6). |

### Assistant (ORBIT)

| File | Description |
|-----------|---------|
| [mechanics/orbit_afk_refactor.md](mechanics/orbit_afk_refactor.md) | AFK Logic refactor: Coordinate-based detection and real-time tracking behavior. |


---

### Legendary upgrades

> Each improvement: category, arena, perks by level, mechanics of work, links to affected characteristics.

**Arena 0 (Economic):**

| File | Description |
|-----------|---------|
| [mechanics/legendary-upgrades/ecodmg.md](mechanicsegendary-upgrades/ecodmg.md) | STORM OF STEEL - kill-scaling Damage and Attack Speed ​​(flat L1/L2, % L3/L4). |
| [mechanics/legendary-upgrades/ecoxp.md](mechanicsegendary-upgrades/ecoxp.md) | NEURAL HARVEST - kill-scaling XP, threshold Dust (L2) and Flux (L3). |
| [mechanics/legendary-upgrades/ecohp.md](mechanicsegendary-upgrades/ecohp.md) | ESSENCE SYPHON - kill-scaling MaxHP and Regen (flat L1/L2, % L3/L4). |
| [mechanics/legendary-upgrades/combshield.md](mechanicsegendary-upgrades/combshield.md) | AEGIS PROTOCOL - kill-scaling Armor + Collision/Projectile Reduction. |**Arena 1 (Combat):**

| File | Description |
|-----------|---------|
| [mechanics/legendary-upgrades/comlife.md](mechanicsegendary-upgrades/comlife.md) | CRIMSON FEAST - Lifesteal 3% (L1), Overheal shield (L2), HP% damage (L3), Zombie (L4). |
| [mechanics/legendary-upgrades/comcrit.md](mechanicsegendary-upgrades/comcrit.md) | SHATTERED FATE - crit 15%/×2 (L1), Execute (L2), Death Mark (L3), Mega-Crit 25%/×3.5 (L4). |
| [ShatteredFateRework.md](ShatteredFateRework.md) | Detailed documentation on the hit-based execution and Death Mark rework for Shattered Fate. |
| [mechanics/legendary-upgrades/comwave.md](mechanicsegendary-upgrades/comwave.md) | TERROR PULSE - active AoE shockwave 200/350% damage, Fear (L2), cooldown 30→20s. |
| [mechanics/legendary-upgrades/radiationcore.md](mechanicsegendary-upgrades/radiationcore.md) | RADIATION CORE - constant aura 500px (5–10% MaxHP/sec), healing (L2), missing HP scaling (L3), global decay (L4). |

**Arena 2 (Defense):**

| File | Description |
|-----------|---------|
| [mechanics/legendary-upgrades/defpuddle.md](mechanicsegendary-upgrades/defpuddle.md) | TOXIC SWAMP - acid puddle DoT 5% HP/sec, slow (L2), +25% HP and Regen in the puddle (L3). |
| [mechanics/legendary-upgrades/defepi.md](mechanicsegendary-upgrades/defepi.md) | EPICENTER - 10s spike channel with immobilization, -50% damage (L2), 3s invulnerability (L3). |
| [mechanics/legendary-upgrades/kineticbattery.md](mechanicsegendary-upgrades/kineticbattery.md) | KINETIC BATTERY - shockwave 100% Armor (L1), shield = Armor (L2), +100% Armor at HP<50% (L3), CDR (L4). |
| [mechanics/legendary-upgrades/chronoplating.md](mechanicsegendary-upgrades/chronoplating.md) | CHRONO PLATING - Armor→DMG+ATS (L1), HP→DMG (L2), double Armor every 5 min (L3), Armor→Regen (L4). |

---

##Enemies

> Unique enemies: behavior, phases, triggers, interaction with mechanics.

| File | Description |
|-----------|---------|
| [enemies/snitch.md](enemies/snitch.md) | Quantum Snitch - evasive rare target, 1 HP, orbital behavior, tactical teleports, spawn cycle every 2 minutes. |
| [enemies/overlord.md](enemies/overlord.md) | Overlord (Anomaly Boss) - Infernal Heat Aura with HP-based phased evolution and regeneration. |
| [mechanics/PentagonBossUpdate.md](mechanics/PentagonBossUpdate.md) | Pentagon Boss: Rocket transformation, fire trails, and Level 2/3 Rocket Barrage mechanics. |
| [mechanics/BossHitboxOptimization.md](mechanics/BossHitboxOptimization.md) | Boss Hitbox Optimization: Increased base size (110px) and collision padding to align with visual models. |

---

## Knowledge base status

| Status | Meaning |
|--------|---------|
| ✅ Documented | Behavior confirmed by reading source code |
| ⚠️ Assumption | The behavior is assumed; requires verification |
| 🔲 Scheduled | File planned, no content yet |

Current coverage: classes (5/5), class representations (2/2), stats (9 files), legendary upgrades (12/12), cooldowns (1 file), cheat codes (1 file), enemies (1 file).