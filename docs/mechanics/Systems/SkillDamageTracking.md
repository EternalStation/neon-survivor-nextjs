# Skill Damage Tracking

## Overview
The "Active Skill Damage" metric provides a class-specific analysis of damage dealt exclusively by unique class mechanics. This prevents "pollution" of class statistics by generic damage sources such as Legendary Hexes (e.g., *Kinetic Tsunami*, *Neural Singularity*) or universal environment interactions, allowing the leaderboard to accurately reflect the internal power scaling of each chassis.

## Filtering Logic
Damage is recorded throughout the run via `recordDamage()`. While every source contributes to the `damageBreakdown` (visible in the Stats Menu), only a filtered subset is aggregated into the `currentMinuteClassSkillDamage` and `class_skill_dmg_history`. 

The filtering is **context-sensitive** and depends on the player's selected chassis:

| Chassis | Included Damage Sources |
| :--- | :--- |
| **Malware** | `Malware Wall Bonus` (Ricochet multipliers) |
| **Zenith** | `Storm Circle` (Orbital Lasers) |
| **Hive Mother** | `Nanite Swarm` (Both passive on-hit and active spitter) |
| **Aegis** | `Orbital Vortex`, `Wall Shockwave`, `Aegis Rings` |
| **Oblivion** | `Void Singularity` |

## Specialized Attribution
To ensure the accuracy of these metrics, some complex interactions are explicitly attributed to skills:

### 1. Aegis Vortex Wall Impacts
When **The Orbital Vortex** is active, enemies pulled into walls take impact damage. This damage is calculated as **10% of Max HP** (up to 100% of current HP if lethal) and is recorded as `Orbital Vortex` damage. 

### 2. Malware Bounce Scaling
Standard projectile damage is split between the "Base" and the "Wall Bonus". When a Malware projectile ricochets off a wall or a Sandbox face, the damage increase granted by the bounce (e.g., +20% per bounce) is isolated and recorded as `Malware Wall Bonus`.

## Visualization
This data is used to generate two key metrics in the **Leaderboard Statistics** view:

### 1. Average Active Skill Damage per Minute (Log Scale)
A line chart showing the progression of damage over time. Use of a logarithmic scale ($log_{10}(v + 1)$) allows for meaningful comparisons between low-damage early-game states and high-damage late-game synergies across different classes.

### 2. Average Growth from Median
This metric calculates how much a chassis deviates from the "typical" performance of all classes at any given minute.
- **Calculation**: For every minute, a "Global Median Damage" is calculated across all runs/classes.
- **Deviation**: The class's average damage at that minute is compared to the median: $Growth = (Current / Median) - 1$.
- **Aggregation**: These relative deviations are averaged over the class's active minutes to produce a final percentage (e.g., `+15.2% vs Median`). This provides a clear indicator of which classes are "Overperformers" or "Underperformers" relative to the current global meta.
