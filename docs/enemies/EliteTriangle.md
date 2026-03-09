# Elite Triangle

The Elite Triangle is an advanced variant of the standard triangle enemy, featuring a tactical dash ability and enhanced mobility.

## Mechanics

### 1. Approach Phase
The Elite Triangle moves toward the player at its standard movement speed. It monitors its distance to the player to trigger its primary skill.

### 2. Cast & Warning Phase
When the Elite Triangle is within **600 units** of the player and its skill is off cooldown, it enters a **0.7-second cast state**.
- **Movement**: The enemy stops completely and vibrates during this phase.
- **Telegraph**: A pulsing red triangle expands and contracts around the enemy, serving as a visual warning.
- **Audio**: A warning sound effect triggers at the start of the cast.

### 3. Tactical Dash
After the cast phase, the Elite Triangle locks onto a target position (overshooting the player by 300 units) and performs a high-speed rush for up to **1.5 seconds**.
- **Speed**: Movement speed is fixed at **10**, matching the Elite Circle's rush intensity.
- **Pattern**: The rush follow a sine-wave "wobble" trajectory while homing toward the locked point.
- **Termination**: The dash ends when the enemy reach the locked point or the 1.5s timer expires.

### 4. Cooldown
After completing a dash, the Elite Triangle enters a cooldown period of **4 to 6 seconds** (randomized) before it can initiate another cast and dash sequence.
