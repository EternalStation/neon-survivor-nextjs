# Regular Upgrade Stat Matrix

This document provides a comprehensive overview of all regular upgrades, including their base values, global multipliers, and final calculated stats across all rarity tiers.

## 1. Rarity Multiplier Table

These multipliers are applied to the **Effective Base Value** of each upgrade type.

| Rarity | Multiplier |
| :--- | :--- |
| Scrap       | 0.5x  |
| Anomalous   | 1.0x  |
| Quantum     | 2.5x  |
| Astral      | 4.5x  |
| Radiant     | 9.0x  |
| Abyss       | 18.0x |
| Eternal     | 35.0x |
| Divine      | 60.0x |
| Singularity | 95.0x |

---

## 2. Base Upgrade Values & Modifiers

Certain upgrade types have additional global multipliers (e.g., HP x2 balance adjustment).

| Upgrade ID | Stat Name | Original Base | Global Multiplier | Effective Base Value |
| :--- | :--- | :--- | :--- | :--- |
| `dmg_f` | Damage            | 15 | 1.0x | 15 |
| `dmg_m` | Damage Multiplier | 15 | 1.0x | 15 |
| `atk_s` | Attack Speed      | 30 | 1.0x | 30 |
| `hp_f`  | Max Health        | 50 | 2.0x | 100|
| `hp_m`  | Health Multiplier | 30 | 2.0x | 60 |
| `reg_f` | Health Regen      | 2  | 1.0x | 2  |
| `reg_m` | Regen Multiplier  | 30 | 1.0x | 30 |
| `xp_f`  | Exp Per Kill      | 20 | 1.0x | 20 |
| `xp_m`  | Exp Multiplier    | 10 | 1.0x | 10 |
| `arm_f` | Armor             | 15 | 1.0x | 15 |
| `arm_m` | Armor Multiplier  | 15 | 1.0x | 15 |

---

## 3. Comprehensive Stat Matrix

The table below shows the final rounded stat gains (`Effective Base * Rarity Multiplier`).

| Rarity (Mult) | DMG / ARM | ATS / REG% | XP | XP% | HP | HP% | REG |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Scrap (0.5x)** | 8 | 15 | 10 | 5 | 50 | 30 | 1 |
| **Anomalous (1.0x)** | 15 | 30 | 20 | 10 | 100 | 60 | 2 |
| **Quantum (2.5x)** | 38 | 75 | 50 | 25 | 250 | 150 | 5 |
| **Astral (4.5x)** | 68 | 135 | 90 | 45 | 450 | 270 | 9 |
| **Radiant (9.0x)** | 135 | 270 | 180 | 90 | 900 | 540 | 18 |
| **Abyss (18.0x)** | 270 | 540 | 360 | 180 | 1800 | 1080 | 36 |
| **Eternal (35.0x)** | 525 | 1050 | 700 | 350 | 3500 | 2100 | 70 |
| **Divine (60.0x)** | 900 | 1800 | 1200 | 600 | 6000 | 3600 | 120 |
| **Singularity (95.0x)** | 1425 | 2850 | 1900 | 950 | 9500 | 5700 | 190 |
