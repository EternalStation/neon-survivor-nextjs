# Recalibrate Station

The Recalibrate Station allows players to optimize their collected meteorites by repairing structural integrity and refining perk configurations.

## 1. Meteorite Repair
Meteorites dropped in the world often have degraded structural integrity. Players can spend **Isotopes (Flux)** to improve a meteorite's quality.

- **Broken → Damaged**: Increases base perk values and ranges.
- **Damaged → New**: Reaches maximum potential for the current rarity tier.
- **Integrity Max**: Once a meteorite reaches "New" quality, it cannot be further repaired.

## 2. Perk Recalibration
Players can modify the perks of an installed meteorite to better suit their build.

### Reroll Perk Types
- **Function**: Replaces the selected perks with new random perks from the rarity-specific pool.
- **Cost**: Scaled based on the meteorite's version and the number of locked slots.
- **Locking**: Players can lock specific perks to prevent them from being changed. Locking a perk increases the total cost of the reroll.

### Reroll Perk Values
- **Function**: Keeps the current perk IDs but randomized their specific percentage values within their defined [Min-Max] range.
- **Cost**: Generally lower than rerolling types but still scales with locks.

## 3. Auto-Lock Filter System
The Auto-Lock system automates the search for specific high-value perk combinations.

- **Operation**: Players can define a filter for each perk slot (Level 1-6). 
- **Filter Parameters**: Based on keywords such as specific Sectors (e.g., Sector-01), Arenas (e.g., Economic), or Forge types (e.g., Exis).
- **Auto-Reroll**: When "Auto-Reroll" is active, the station will continuously perform "Reroll Perk Types" until all enabled filters are simultaneously satisfied.
- **Safety**: Auto-roll automatically stops if the player runs out of Isotopes or manually intervenes.

## 4. Visual Feedback
- **Spinning Interface**: During recalibration, values and keywords cycle rapidly to provide visual feedback of the randomization process.
- **Highlighting**: Keywords like Sector names, Arenas, and Quality statuses are color-coded (Purple for Sectors, Gold/Red/Blue for Arenas) to aid in quick identification.
- **Efficiency Index**: Each perk displays its current percentage relative to its maximum possible value, with color-coded indicators (Red < 30%, Yellow < 70%, Green >= 70%).
