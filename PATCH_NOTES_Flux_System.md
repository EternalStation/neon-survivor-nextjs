# Patch Notes: Flux System & Recalibration Update

## 🌌 New Currency: Void Flux
A new unstable isotope, **Void Flux**, has been detected in the simulation. It is the primary resource for manipulating Meteorite data.

### **Drop Mechanics**
Void Flux is simpler than standard matter and physically manifests when powerful entities are destroyed.
*   **Sources**:
    *   **Bosses**: Guaranteed large cache.
    *   **Elite Enemies**: Guaranteed small cache.
*   **Time Scaling**:
    *   As the simulation progresses, enemies accumulate more Flux.
    *   **Boss Drop Formula**: `50 + (5 × Minutes Survived)` (+/- Random Variance)
    *   **Elite Drop Formula**: `10 + (1.5 × Minutes Survived)` (+/- Random Variance)
    *   *Example*: A Boss at 20 minutes drops ~150 Flux (3x more than at spawn).

### **Collection**
*   Flux drops as physical **Purple Orbs** in the world.
*   These orbs are **magnetic** and will be pulled to the player when nearby.

---

## 🔧 System: Recalibration Station
The Recalibration Station allows you to modify and perfect your Meteorites using Void Flux.

### **1. Quality Optimization (Polishing)**
Upgrade the physical condition of a Meteorite to enhance its stat ranges.
*   **Progression**: `Broken` → `Damaged` → `New`
*   **Cost**: `50 + (Rarity Tier × 30) + Version Tax`
*   **Effect**:
    *   Permanently increases all current perk values by **+3**.
    *   Shifts the potential min/max roll range of the perk by **+3**.

### **2. Perk Reconfiguration (Reroll Type)**
Scramble the type of perks on a Meteorite (e.g., change "+5% Fire Rate" to "+8% Damage").
*   **Cost**: `(5 + (Rarity Tier × 3) + Version Tax) × 2^(Locked Perks)`
*   **Mechanic**:
    *   Rerolls all unlocked perks.
    *   **Locking**: You can "Lock" specific perks you want to keep.
    *   **Cost Penalty**: Each locked perk **DOUBLES** the Flux cost.

### **3. Value Tuning (Reroll Value)**
Keep the perk types but attempt to roll better numbers within their range.
*   **Cost**: Same as Reconfiguration.
*   **Mechanic**:
    *   Rerolls the *values* of all unlocked perks.
    *   **Safety Net**: If the RNG rolls the exact same number, it forces a +1/-1 change to ensure *something* happens.

---

## 📊 Economy Math Reference

### **Version Tax**
Every time you modify a Meteorite, its **Version** (e.g., v1.0 -> v1.1) increases.
*   **Tax Formula**: `(Current Version - 1.0) * 10` Flux.
*   *Design Intent*: Infinitely re-rolling the same item becomes progressively more expensive, encouraging the hunt for fresh "base" Meteorites.

### **Rarity Tiers (Cost Scaling)**
Higher tier items are harder to stabilize.
1.  **Anomalous** (Tier 0)
2.  **Radiant** (Tier 1)
3.  **Abyss** (Tier 2)
4.  **Eternal** (Tier 3)
5.  **Divine** (Tier 4)
6.  **Singularity** (Tier 5)
