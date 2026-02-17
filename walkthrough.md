# Turret Upgrades & Advanced Mechanics Walkthrough

This update implements advanced scaling, specialized mechanics, and visual upgrades for the Fire, Ice, and Heal turrets. It also includes new cheat codes for rapid testing and deployment.

## 🚀 New Features

### 🔫 Firing Mechanics
- **Infinite Scaling**: Turret damage, fire rate, and range now scale infinitely based on their level (`turretUses`).
- **Visual Scaling**: Turrets physically grow in size (+10% per level) and gain a golden elite trim at Level 6.

### 🔥 Fire Turret
- **Base**: Rapid fire dual-shot.
- **Level 3 (Burn)**: Projectiles apply a **Burn DoT** that stacks infinitely. Each stack deals 5% of the enemy's Max HP per second.
- **Level 6 (Flamethrower)**: Gains a rear-facing high-frequency flamethrower stream (10hz) that applies burn stacks to enemies behind the turret.

### ❄️ Ice Turret
- **Base**: Wide-area ice mist that slows enemies. Slow stacks additively up to 100%.
- **Freeze**: When an enemy reaches 100% slow, they become **FROZEN** (cannot move or attack) for several seconds.
- **Level 3 (Freeze Bomb)**: Periodically fires a heavy freeze bomb to the rear. On impact, it explodes in a 200px radius, instantly freezing all affected enemies for 5 seconds.
- **Level 6 (Giant Cone)**: The main ice mist cone expands to a massive 120-degree arc.

### ✚ Heal Turret
- **Base**: Heals the player while within range. Scaling increases heal percentage per level.
- **Level 3 (Overheal)**: Healing the player beyond Max HP converts the excess into a temporary shield chunk (1-minute duration).
- **Level 6 (Heal Drone)**: Deployment now spawns a mobile **Heal Drone** that follows the player for 30 seconds, providing continuous healing even when outside the turret's reach.

---

## 🛠️ Testing & Verification

### ⌨️ Cheat Codes
Use these shortcuts to spawn leveled turrets within 100px of the player:
- **Fire**: `tf1` to `tf6` (or `turf1` to `turf6`)
- **Ice**: `ti1` to `ti6` (or `turi1` to `turi6`)
- **Heal**: `th1` to `th6` (or `turh1` to `turh6`)

### ✅ Verification Steps
1. **Burn Stacking**: Spawn a `tf3` turret. Observe enemies gaining red particles and taking increasing damage over time.
2. **Freeze Bomb**: Spawn a `ti3` turret. Look for the large blue projectile firing backward and the resulting "FROZEN" text and ice effects on enemies.
3. **Heal Drone**: Spawn a `th6` turret. Verify a small green diamond drone appears and follows you, showing local healing numbers.
4. **Visual Progression**: Compare a `tf1` turret to a `tf6` turret. The `tf6` should be significantly larger, pulse intensely, and have a golden base trim.

## 📂 Core Logic Files
- `TurretLogic.ts`: Core update loop, variant logic, and ally spawning.
- `ProjectileLogic.ts`: Impact handling for Burn, Freeze, and Bomb effects.
- `EnemyLogic.ts`: Damage-over-time processing and Thaw timer logic.
- `SfxLogic.ts`: Added `shatter` and `turret-fire` audio.
- `types.ts`: Updated interfaces for `Ally`, `Enemy` status, and `MapPOI` extensions.
