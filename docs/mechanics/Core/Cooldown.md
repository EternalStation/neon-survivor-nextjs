# Cooldowns system

## Review

All cooldowns work through a single **timestamp mechanism** (`gameTime` in seconds) with a centralized `getCdMod` function. The utilities are located in [`CooldownUtils.ts`](../../src/logic/utils/CooldownUtils.ts).

---

## Unified mechanism (timestamp)

**All** skills and abilities use a single pattern:

- `lastUsed: number` - `gameTime` at the time of use.
- `baseCD: number` - base cooldown in seconds (from `GAME_CONFIG.SKILLS`).
- Ready: `isOnCooldown(lastUsed, baseCD, cdMod, now)` → `false` if ready.

**POI/turrets** (`MapPOI.cooldown`) - use countdown (seconds), this is a separate system not affected by centralization.

---

## CooldownUtils.ts functions

```typescript
getCdMod(state, player): number
// Returns the cooldown multiplier: NEURAL_OVERCLOCK × (1 - cooldownReduction - temporalMonolithBonus)
// Minimum cdMod: 0.1 (10% of base CD)

isOnCooldown(lastUsed, baseCD, cdMod, now): boolean
// true if the cooldown has not yet expired

getRemainingCD(lastUsed, baseCD, cdMod, now): number
// Remaining time in seconds (0 = ready)

getCDProgress(lastUsed, baseCD, cdMod, now): number
// 1.0 = just used, 0.0 = ready (for HUD progress bars)
```

---

## cdMod formula

```typescript
const monolithBonus = temporalMonolithBuff > gameTime ? 0.2 : 0;
const totalReduction = Math.min(0.9, cooldownReduction + monolithBonus);
cdMod = (NEURAL_OVERCLOCK ? 0.7 : 1.0) * (1 - totalReduction);
```

**Sources of `cooldownReduction`** (accumulated via `+=` in `PlayerStats.ts`):
- KineticBattery lvl 4: `+0.25% * multiplier` for every minute.
- ChronoPlating lvl 3 / TemporalMonolith: `+0.25% * multiplier` for each minute.

**Sources temporalMonolithBonus:**
- TemporalMonolith passive: +20% CDR while `player.temporalMonolithBuff > gameTime` (activated when taking damage).

---

## Basic cooldown values

All base CDs are stored in `GAME_CONFIG.SKILLS`:

| Constant | Meaning | Application |
|---|---|---|
| `PUDDLE_COOLDOWN` | 25s | DefPuddle (Toxic Swamp) |
| `EPI_COOLDOWN` | 30s | DefEpi (Epicenter) |
| `MONOLITH_COOLDOWN` | 30s | TemporalMonolith |
| `WAVE_COOLDOWN` | 30s | ComWave (Terror Pulse) |
| `WAVE_COOLDOWN_LVL4` | 20s | ComWave lvl 4+ |
| `KINETIC_ZAP_COOLDOWN` | 5.0s | Kinetic Battery zap |
| `BLACKHOLE_COOLDOWN` | 10s | Event Horizon blackhole |
| `COSMIC_COOLDOWN` | 8s | Cosmic Strike (stormstrike) |
| `DEATH_MARK_COOLDOWN` | 10s | Death Mark (ComCrit lvl 3) |

---

## Life cycle of an active skill

```
castSkill() called
  └─ isOnCooldown(skill.lastUsed, skill.baseCD, getCdMod(), now)? → interrupt
  └─ effect applied
  └─ skill.baseCD = GAME_CONFIG.SKILLS.X_COOLDOWN (for ComWave - calculated dynamically)
  └─ skill.lastUsed = now
  └─ skill.inUse = true (if there is a duration effect)
  └─ skill.duration = X (if there is a duration effect)

every frame (PlayerLogic.ts)
  └─ skill.duration > 0?
      └─ skill.duration -= 1/60
      └─ skill.duration <= 0 → skill.inUse = false
```

---

## Display in HUD (`PlayerStatus.tsx`)

All widgets use the same utilities:

```typescript
const cdMod = getCdMod(gameState, player);
const progress = getCDProgress(skill.lastUsed, skill.baseCD, cdMod, now);   // for overlay height
const remaining = getRemainingCD(skill.lastUsed, skill.baseCD, cdMod, now); // for text
```

- **Active skills:** `progress * 100%` overlay height, `Math.ceil(remaining)` text.
- **stormstrike:** `lastCosmicStrikeTime` + `COSMIC_COOLDOWN`.
- **eventhorizon:** `lastBlackholeUse` + `BLACKHOLE_COOLDOWN`.
- **Kinetic Battery widget:** `lastKineticShockwave` + `KINETIC_ZAP_COOLDOWN`.

---

## Architectural issues resolved

1. ~~Three time systems~~ - all on `gameTime` (seconds).
2. ~~`cdMod` is duplicated in 5+ places~~ - single `getCdMod()` in `CooldownUtils.ts`.
3. ~~Cosmic Strike does not take into account `cooldownReduction`~~ - now via `getCdMod()`.
4. ~~Basic CD hardcode in logic~~ - moved to `GAME_CONFIG.SKILLS`.5. ~~KineticBattery special status~~ - exception `if (skill.type === 'KineticBattery') return` has been removed.
6. ~~`cooldownReduction` did not work~~ - now taken into account everywhere via `getCdMod()`.

**Remains:** `MapPOI.cooldown` (turrets/overclock) uses countdown - this is a conscious decision, POI does not interact with the player's CDR.

---

## Related functions and entities

- [`SkillLogic.ts`](../src/logic/player/SkillLogic.ts) — `castSkill()`, activation and installation of cooldown
- [`PlayerLogic.ts`](../src/logic/player/PlayerLogic.ts) — countdown descending tick (lines 43–66)
- [`PlayerStats.ts`](../src/logic/player/PlayerStats.ts) — `updatePlayerStats()`, reset and calculation of `cooldownReduction`
- [`PlayerCombat.ts`](../src/logic/player/PlayerCombat.ts) — `triggerKineticBatteryZap()`, timestamp cooldown
- [`ProjectileLogic.ts`](../src/logic/combat/ProjectileLogic.ts) — blackhole and Death Mark cooldowns
- [`ProjectileSpawning.ts`](../src/logic/combat/ProjectileSpawning.ts) — Cosmic Strike, Date.now() cooldown
- [`TurretLogic.ts`](../src/logic/mission/TurretLogic.ts) — POI cooldown (countdown type)
- [`PlayerStatus.tsx`](../src/components/hud/PlayerStatus.tsx) — display cooldowns in the HUD
- [`GameConfig.ts`](../src/logic/core/GameConfig.ts) — `GAME_CONFIG.SKILLS` (partial CD config)
- [`BlueprintLogic.ts`](../src/logic/upgrades/BlueprintLogic.ts) - `isBuffActive()`, source `NEURAL_OVERCLOCK`
- [`types.ts`](../src/logic/core/types.ts) — `ActiveSkill` interface, `cooldownReduction`, `blackholeCooldown`, `lastCosmicStrikeTime` fields