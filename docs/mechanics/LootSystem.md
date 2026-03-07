# Loot & Resource Rewards

This document describes the rules for enemy drops, resource acquisition, and rare item spawning in Neon Survivor.

## 1. Resource Types

- **Void Flux (Isotopes)**: Primary currency for permanent upgrades and blueprint research.
- **Dust**: Secondary resource used for meteorite recalibration and some research activations.
- **Souls**: Tracking metric for legendary skill scaling and XP calculation.
- **Meteorites**: Equipment items containing stat-boosting perks.
- **Blueprints**: Rare tactical archives and technology unlocks.

---

## 2. Drop Logic (by Enemy Rank)

Rewards are determined by the rank of the defeated enemy. **Note**: Entities marked as "Minions" (spawned by bosses or elites) have significantly reduced rewards compared to standalone enemies.

### Bosses (The Anomaly, Stage Hazards)
- **Void Flux**: 50–130+ (Scales with game time).
- **Dust**: Guaranteed 10 (Multiplied by refinery bonuses).
- **Souls**: 30–50+ (Scales with progressive intervals).
- **Blueprints**: High drop probability (Stage 1 bosses always drop a Dimensional Gate if not owned).

### True Elites (Pentagons, Elite Variants)
- **Void Flux**: 15–30+ (Scales with game time).
- **Dust**: 3% chance for 5.
- **Souls**: 10 (5 for Pentagons).
- **Blueprints**: 15% drop probability (After 10:00 minutes).

### Elite Minions (Spawned by Elites)
- **Void Flux**: **None**.
- **Dust**: 3% chance for 1.
- **Souls**: 2.
- **XP**: 3x base multiplier.

### Regular Enemies (Circles, Triangles, etc.)
- **Void Flux**: None.
- **Dust**: 3% chance for 1.
- **Souls**: 1.
- **XP**: 1x base multiplier.

---

## 3. Global Modifiers

### Refinery Bonuses (Xeno-Alchemist)
If the **Xeno-Alchemist** upgrade is active and either the player or the enemy is within a toxic puddle at the moment of death, all Resource rewards (Flux, Dust, XP) are multiplied by **4.0x**.

### Eco-Protocol (Arena 0)
Arena 0 modifiers (`xpSoulBuffMult`) apply a global multiplier to Soul counts, which indirectly accelerates all kill-based scaling mechanics.

---

## 4. Rare Item Spawning

### Meteorites
- **Drop Rate**: Base chance of 5%, boosted by `met_drop_per_kill` and the **Meteor Shower** blueprint (+50%).
- **Quality**: Randomly determined (Broken/Damaged/New). 5% chance to be **Corrupted** (higher min/max perk ranges but riskier).

### Blueprints
- **Requirement**: Must spend at least 10 minutes in the mission.
- **Drop Source**: Only from **True Elite** enemies or **Bosses**.
- **Selection**: Randomly chosen from the available technology pool.
