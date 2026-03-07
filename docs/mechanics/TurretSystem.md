# Turret System

Turrets are stationary defense structures located within arenas that can be activated or repaired by the player using the interaction key (default **[E]**).

## 1. Interaction Mechanics
- **Interaction Key**: Dynamically mapped to the user's "Interact" keybind.
- **Activation Range**: **Radius + 200px** (Approximately **320px - 380px** depending on turret level).
- **Activation Logic**: requires the player to be within range and have sufficient **Meteorite Dust**.
- **Input Responsiveness**: The system uses a buffered input lock to ensure the interaction is registered correctly even on high refresh rate monitors (144Hz+).

## 2. Activation Costs
Turrets use a recursive cost scaling system based on the number of times they have been utilized.
- **Base Cost**: 2 Meteorite Dust.
- **Scaling**: Cost doubles with each subsequent activation ($2^n \times \text{Base}$).
- **Overheat**: After the duration expires, the turret enters a **60-second cooldown** period.

## 3. Turret Variants

### 🔥 Fire Turret
High-velocity offensive turret focusing on single-target DPS.
- **Level 1-2**: Rapid fire projectiles.
- **Level 3+**: Projectiles apply **Burn DoT** (5% of damage per second). Size increased by 1.5x.
- **Level 6**: Secondary **Rear Flame Cone** activated, dealing area damage in a 45° arc behind the turret.

### ❄️ Ice Turret
Crowd control turret that slows and freezes enemies.
- **Slow Effect**: Targets are slowed by **70%**.
- **Level 3-5**: Deploys an **Ice Bomb** from the rear every 2 seconds that freezes targets in a 200px radius.
- **Level 6**: Frontal fire expands into a **120° wide cone**, providing massive area control.

### ✚ Heal Turret
Defensive support turret that restores player health.
- **Healing**: Restores **5% + (1% per level)** of Player's Max HP per second while in range.
- **Level 3+**: If the player is at full HP, the healing is converted into **Shield Chunks** (expiring in 60s).
- **Level 6**: Deploys a mobile **Heal Drone** that follows the player for 30 seconds, providing healing even after leaving the turret's proximity.

## 4. Technical Specifications
- **Base Range**: 800px (Scales by 10% per level).
- **Duration**: Active for **30 seconds** per 
- **Base HP Estimation**: Damage scales based on a "minutes-elapsed" estimated enemy HP pool to maintain relevance in late-game sessions.
