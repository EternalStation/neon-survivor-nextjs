# Damage Reduction Mechanics

This document outlines how damage reduction is calculated and displayed in the system.

## 1. Armor
Armor provides diminishing returns based on the logarithmic formula in `MathUtils.getDefenseReduction`.
- **Formula**: `0.0945 * Math.pow(Math.log10(Armor / 2 + 1), 1.4)`
- **Cap**: Default 95%.

## 2. Collision & Projectile Reduction (Legendary)
Recent updates have standardized these bonuses to be linear percentages to match their descriptions and provide better transparency to the player.
- **Source**: Aegis Protocol (`CombShield`) Perk 2 (Collision) and Perk 3 (Projectile).
- **Scaling**: `0.01%` per soul (multiplied by Resonance and Soul Drain Multipliers).
- **Calculation**: Linear summation, capped at `80%`.
- **Implementation**: These values are divided by 100 and applied directly to the damage after armor calculation.

## 3. Calculation Order
1. **Raw Damage** is received.
2. **Armor Reduction** is applied based on the player's total Armor stat.
3. **Source-Specific Reduction** (Collision or Projectile) is applied to the remaining damage.
4. **Shield Chunks** absorb the remaining damage starting from the earliest expiring chunk.
5. **Final Damage** is subtracted from basic HP.

## 4. Soul Drain Multiplier
Economic perks (like Aegis Protocol) scale with "Souls". The rate of soul harvesting is affected by:
- **Resonance Synergy**: Multiplier from surrounding meteorites.
- **Soul Drain Multiplier**: Global player stat that increases the effective number of souls per kill.
Tooltips and Stat Menus now consistently incorporate both multipliers.
