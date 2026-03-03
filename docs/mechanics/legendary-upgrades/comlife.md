# CRIMSON FEAST (ComLife)

**Category:** Combat | **Arena:** 1 (pool: RadiationCore, ComLife, ComCrit, ComWave)

## Perks by Level

| Level | Perk |
|-------|------|
| 1 | 3% Lifesteal of DMG dealt by your Projectiles |
| 2 | Overheal becomes Shield (5s Static) |
| 3 | +2% additional DMG to your Projectiles from Enemy Max HP (Non-Bosses) |
| 4 | 10% Zombie Spawn Chance (5s Delay, Feasters) |
| 5 | MAX LEVEL |

## Mechanics

**L1 — Lifesteal (3% of Projectile DMG):**
```
heal = damageAmount × 0.03
```
Applied inline in `ProjectileLogic.ts` when a bullet deals damage. Restores `damageAmount × 0.03` HP to the player (owner), capped at MaxHP. **Shockwaves do NOT trigger lifesteal unless Blood-Forged Capacitor is active.**

**L2 — Overheal Shield (Static 5s):**
- If lifesteal heal would exceed MaxHP, the overflow is stored as a shield chunk.
- Conversion is **1:1** — no efficiency multiplier.
- Duration: **5 seconds, static** (not affected by any multiplier or upgrade).
- Shield is stored in `player.shieldChunks` with `source: 'lifesteal'`.

**L3 — Max HP Projectile Damage Bonus:**
- When a player projectile hits a non-boss: `bonus_damage = enemy.maxHp × 0.02`.
- Applied to `damageAmount` in `ProjectileLogic.ts` before final damage is dealt.
- Does NOT apply to enemies with the `boss` flag.

**L4 — Zombie Spawn:**
- 10% chance on each kill to spawn a friendly Zombie (Feasters type).
- Spawn delay: 5 seconds after the kill.

## Affected Files

- `ProjectileLogic.ts` — Lifesteal heal, overheal shield push, and Lvl 3 bonus damage.
- `calculateLegendaryBonus` — Returns `lifesteal` stat used for any future references.
- `DeathLogic.ts` — Zombie spawn logic on kill.
