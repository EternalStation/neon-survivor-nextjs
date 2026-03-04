# Система перезарядок (Cooldowns)

## Обзор

Все кулдауны работают через единый **timestamp-механизм** (`gameTime` в секундах) с централизованной функцией `getCdMod`. Утилиты находятся в [`CooldownUtils.ts`](../../src/logic/utils/CooldownUtils.ts).

---

## Унифицированный механизм (timestamp)

**Все** скиллы и способности используют единый паттерн:

- `lastUsed: number` — `gameTime` в момент использования.
- `baseCD: number` — базовый кулдаун в секундах (из `GAME_CONFIG.SKILLS`).
- Готовность: `isOnCooldown(lastUsed, baseCD, cdMod, now)` → `false` если готов.

**POI/турели** (`MapPOI.cooldown`) — используют countdown (секунды), это отдельная система, не затронутая централизацией.

---

## Функции CooldownUtils.ts

```typescript
getCdMod(state, player): number
// Возвращает множитель кулдауна: NEURAL_OVERCLOCK × (1 - cooldownReduction - temporalMonolithBonus)
// Минимальный cdMod: 0.1 (10% базового CD)

isOnCooldown(lastUsed, baseCD, cdMod, now): boolean
// true если кулдаун ещё не истёк

getRemainingCD(lastUsed, baseCD, cdMod, now): number
// Оставшееся время в секундах (0 = готов)

getCDProgress(lastUsed, baseCD, cdMod, now): number
// 1.0 = только что использован, 0.0 = готов (для прогресс-баров HUD)
```

---

## Формула cdMod

```typescript
const monolithBonus = temporalMonolithBuff > gameTime ? 0.2 : 0;
const totalReduction = Math.min(0.9, cooldownReduction + monolithBonus);
cdMod = (NEURAL_OVERCLOCK ? 0.7 : 1.0) * (1 - totalReduction);
```

**Источники `cooldownReduction`** (аккумулируются через `+=` в `PlayerStats.ts`):
- KineticBattery lvl 4: `+0.25% * multiplier` за каждую минуту.
- ChronoPlating lvl 3 / TemporalMonolith: `+0.25% * multiplier` за каждую минуту.

**Источники temporalMonolithBonus:**
- TemporalMonolith пассивный: +20% CDR пока `player.temporalMonolithBuff > gameTime` (активируется при получении урона).

---

## Базовые значения перезарядок

Все базовые CD хранятся в `GAME_CONFIG.SKILLS`:

| Константа | Значение | Применение |
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

## Жизненный цикл активного скилла

```
castSkill() вызван
  └─ isOnCooldown(skill.lastUsed, skill.baseCD, getCdMod(), now)? → прерывание
  └─ эффект применяется
  └─ skill.baseCD = GAME_CONFIG.SKILLS.X_COOLDOWN  (для ComWave — вычисляется динамически)
  └─ skill.lastUsed = now
  └─ skill.inUse = true  (если есть duration-эффект)
  └─ skill.duration = X  (если есть duration-эффект)

каждый кадр (PlayerLogic.ts)
  └─ skill.duration > 0?
      └─ skill.duration -= 1/60
      └─ skill.duration <= 0 → skill.inUse = false
```

---

## Отображение в HUD (`PlayerStatus.tsx`)

Все виджеты используют единые утилиты:

```typescript
const cdMod = getCdMod(gameState, player);
const progress = getCDProgress(skill.lastUsed, skill.baseCD, cdMod, now);   // для высоты оверлея
const remaining = getRemainingCD(skill.lastUsed, skill.baseCD, cdMod, now); // для текста
```

- **Активные скиллы:** `progress * 100%` высота оверлея, `Math.ceil(remaining)` текст.
- **stormstrike:** `lastCosmicStrikeTime` + `COSMIC_COOLDOWN`.
- **eventhorizon:** `lastBlackholeUse` + `BLACKHOLE_COOLDOWN`.
- **Kinetic Battery виджет:** `lastKineticShockwave` + `KINETIC_ZAP_COOLDOWN`.

---

## Решённые архитектурные проблемы

1. ~~Три системы времени~~ — всё на `gameTime` (секунды).
2. ~~`cdMod` дублируется в 5+ местах~~ — единая `getCdMod()` в `CooldownUtils.ts`.
3. ~~Cosmic Strike не учитывает `cooldownReduction`~~ — теперь через `getCdMod()`.
4. ~~Базовые CD хардкод в логике~~ — вынесены в `GAME_CONFIG.SKILLS`.
5. ~~KineticBattery особый статус~~ — убрано исключение `if (skill.type === 'KineticBattery') return`.
6. ~~`cooldownReduction` не работало~~ — теперь учитывается везде через `getCdMod()`.

**Остаётся:** `MapPOI.cooldown` (турели/оверклок) использует countdown — это сознательное решение, POI не взаимодействует с CDR игрока.

---

## Связанные функции и сущности

- [`SkillLogic.ts`](../src/logic/player/SkillLogic.ts) — `castSkill()`, активация и установка cooldown
- [`PlayerLogic.ts`](../src/logic/player/PlayerLogic.ts) — тик убывания countdown (строки 43–66)
- [`PlayerStats.ts`](../src/logic/player/PlayerStats.ts) — `updatePlayerStats()`, сброс и вычисление `cooldownReduction`
- [`PlayerCombat.ts`](../src/logic/player/PlayerCombat.ts) — `triggerKineticBatteryZap()`, timestamp cooldown
- [`ProjectileLogic.ts`](../src/logic/combat/ProjectileLogic.ts) — blackhole и Death Mark cooldowns
- [`ProjectileSpawning.ts`](../src/logic/combat/ProjectileSpawning.ts) — Cosmic Strike, Date.now() cooldown
- [`TurretLogic.ts`](../src/logic/mission/TurretLogic.ts) — POI cooldown (countdown-тип)
- [`PlayerStatus.tsx`](../src/components/hud/PlayerStatus.tsx) — отображение cooldowns в HUD
- [`GameConfig.ts`](../src/logic/core/GameConfig.ts) — `GAME_CONFIG.SKILLS` (частичный конфиг CD)
- [`BlueprintLogic.ts`](../src/logic/upgrades/BlueprintLogic.ts) — `isBuffActive()`, источник `NEURAL_OVERCLOCK`
- [`types.ts`](../src/logic/core/types.ts) — интерфейс `ActiveSkill`, поля `cooldownReduction`, `blackholeCooldown`, `lastCosmicStrikeTime`
