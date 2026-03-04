# Система перезарядок (Cooldowns)

## Обзор

В проекте существуют **три несовместимых механизма** хранения состояния перезарядки. Это ключевая проблема при централизации. Документ описывает каждый механизм, формулу модификаторов и точки приложения, необходимые для рефакторинга.

---

## Типы перезарядок

### 1. Countdown-таймер (убывающий счётчик)

**Используется в:** активные скиллы (`ActiveSkill`), турели (`POI`).

**Поля состояния:**
- `ActiveSkill.cooldown` — текущее значение (секунды), убывает каждый кадр.
- `ActiveSkill.cooldownMax` — максимальное значение, устанавливается при активации.
- `POI.cooldown` — аналогичный счётчик турели.

**Тик убывания:**

```
// PlayerLogic.ts:44–65 — для ActiveSkill
skill.cooldown -= 1 / 60; // каждый кадр
if (skill.cooldown < 0) skill.cooldown = 0;

// TurretLogic.ts:48–50 — для POI
turret.cooldown -= step;
if (turret.cooldown < 0) turret.cooldown = 0;
```

**Проверка готовности:** `skill.cooldown <= 0`

**Установка при активации:** `skill.cooldown = baseCD * cdMod` (см. [Снижение кулдауна](stats/cooldown-reduction.md)).

---

### 2. Timestamp-based (gameTime, секунды)

**Используется в:** Kinetic Battery, Event Horizon (blackhole), Death Mark.

**Поля состояния (тип `Player`):**
- `player.lastKineticShockwave?: number` — gameTime последнего zap-удара.
- `player.blackholeCooldown?: number` — gameTime, когда blackhole снова доступна (timestamp «готовности», не «последнего использования»).
- `owner.lastDeathMark?: number` — gameTime последней метки смерти.

**Единица измерения:** `state.gameTime` (секунды с начала игры).

**Проверка готовности:**
```typescript
// Kinetic Battery (PlayerCombat.ts:392)
now < player.lastKineticShockwave + (5.0 * cdMod)  // NOT ready

// Event Horizon blackhole (ProjectileLogic.ts:658)
!owner.blackholeCooldown || now >= owner.blackholeCooldown  // ready

// Death Mark (ProjectileLogic.ts:707)
!owner.lastDeathMark || state.gameTime - owner.lastDeathMark > dmCooldown  // ready
```

**Установка при активации:**
```typescript
// Kinetic Battery — сохраняет gameTime активации
player.lastKineticShockwave = now;

// Event Horizon — сохраняет gameTime ГОТОВНОСТИ (now + duration * cdMod)
owner.blackholeCooldown = now + cooldownDuration;  // cooldownDuration = 10 * cdMod
```

> **Внимание:** Kinetic Battery и blackhole используют разные паттерны хранения даже в одной системе координат.

---

### 3. Timestamp-based (Date.now(), миллисекунды)

**Используется в:** Cosmic Strike (класс `stormstrike`).

**Поля состояния:**
- `player.lastCosmicStrikeTime?: number` — `Date.now()` (мс) последнего удара.

**Единица измерения:** системное время в миллисекундах.

**Проверка готовности (ProjectileSpawning.ts:127):**
```typescript
const cooldown = 8000 * cdMod; // 8000 ms
if (now - player.lastCosmicStrikeTime >= cooldown)
```

> **Проблема несоответствия:** эта система изолирована от `gameTime`. Не зависит от паузы игры. Применяет `cdMod` только частично (только `NEURAL_OVERCLOCK`, без `cooldownReduction`).

---

## Формула cdMod

Документация компонентов и источников: [Снижение кулдауна](stats/cooldown-reduction.md).

```typescript
const cdMod = (isBuffActive(state, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0) * (1 - (player.cooldownReduction || 0));
```

---

## Места вычисления cdMod

| Файл | Строка | Применение |
|---|---|---|
| `SkillLogic.ts` | 14 | Активные скиллы (DefPuddle, DefEpi, ComWave и вариации) |
| `PlayerCombat.ts` | 391 | Kinetic Battery zap (triggerKineticBatteryZap) |
| `ProjectileLogic.ts` | ~650 | Event Horizon blackhole |
| `ProjectileLogic.ts` | ~705 | Death Mark (Shattered Fate) |
| `ProjectileSpawning.ts` | 125 | Cosmic Strike — **только NEURAL_OVERCLOCK**, без cooldownReduction |
| `PlayerStatus.tsx` | 75, 268 | HUD — отображение полос перезарядки |

> **Проблема:** `cdMod` не является централизованной функцией. Дублируется в 5+ местах. Если добавить новый источник `cooldownReduction`, его нужно будет добавить в каждое место вручную.

---

## Базовые значения перезарядок

Значения документированы в соответствующих файлах способностей. Хранение в коде: часть вынесена в `GAME_CONFIG.SKILLS`, часть — хардкод в логике (известная архитектурная проблема, см. п. 4 ниже).

| Скилл / Способность | Документация |
|---|---|
| DefPuddle (Toxic Swamp) | [defpuddle.md](legendary-upgrades/defpuddle.md) |
| DefEpi (Epicenter) | [defepi.md](legendary-upgrades/defepi.md) |
| ComWave (Terror Pulse) | [comwave.md](legendary-upgrades/comwave.md) |
| Kinetic Battery zap | [kineticbattery.md](legendary-upgrades/kineticbattery.md) |
| Event Horizon blackhole | [void-eventhorizon.md](../classes/void-eventhorizon.md) |
| Cosmic Strike (stormstrike) | [ray-stormstrike.md](../classes/ray-stormstrike.md) |

---

## Жизненный цикл активного скилла (countdown-тип)

```
castSkill() вызван
  └─ skill.cooldown > 0? → прерывание (не готов)
  └─ cdMod вычисляется локально
  └─ эффект применяется
  └─ skill.cooldownMax = baseCD * cdMod
  └─ skill.cooldown = skill.cooldownMax
  └─ skill.inUse = true

каждый кадр (PlayerLogic.ts)
  └─ skill.type === 'KineticBattery'? → пропуск (своя логика)
  └─ skill.cooldown -= 1/60
  └─ skill.cooldown < 0 → 0
  └─ skill.duration > 0?
      └─ skill.duration -= 1/60
      └─ skill.duration <= 0 → skill.inUse = false
  └─ skill.cooldown <= 0 && нет duration → skill.inUse = false
```

---

## Отображение в HUD (`PlayerStatus.tsx`)

### Активные скиллы (countdown-тип)
- Полоса заполнения: `skill.cooldown / skill.cooldownMax` (высота от низа иконки).
- Текст: `Math.ceil(skill.cooldown)` секунд.
- Иконка: непрозрачность 0.5 в перезарядке, 1.0 — готов.

### Класс-способность (Class Capability)
- **stormstrike:** вычисляет `(nowMs - lastCosmicStrikeTime) / (8000 * cdMod)`. Применяет cdMod **без cooldownReduction**.
- **eventhorizon:** вычисляет `(blackholeCooldown - nowSec) / (10 * cdMod)`. Применяет cdMod **без cooldownReduction**.

> **Проблема:** HUD заново вычисляет `cdMod` независимо от логики — ещё одна точка дублирования.

### Kinetic Battery (отдельный виджет)
- Также вычисляет `cdMod` локально с полной формулой (с `cooldownReduction`).

---

## Известные архитектурные проблемы

1. **Три системы времени:** countdown (секунды от 0), gameTime-timestamp (секунды от старта игры), Date.now()-timestamp (мс системного времени). Нельзя унифицировать проверки.

2. **cdMod дублируется в 5+ местах.** Отсутствует функция `getCdMod(state, player)`.

3. **Cosmic Strike не учитывает `cooldownReduction`.** Дополнительный источник снижения перезарядки на неё не влияет.

4. **Базовые значения CD частично в конфиге, частично хардкод.** DefPuddle (25), DefEpi (30), KineticBattery zap (5.0), blackhole (10) — захардкожены в логике.

5. **KineticBattery имеет особый статус** — исключена из стандартного тика countdown (`if (skill.type === 'KineticBattery') return;`), управляет своим cooldown через timestamp-механизм.

6. **`cooldownReduction` накапливается за один кадр.** Сбрасывается в 0 в начале `updatePlayerStats()`, затем устанавливается источниками. При нескольких источниках последний перезапишет предыдущего (не суммируется).

---

## Что нужно для централизации

### Минимальный набор для реализации:

**a) Функция `getCdMod(state: GameState, player: Player): number`**
- Инкапсулирует: `NEURAL_OVERCLOCK` и `cooldownReduction`.
- Вызывается везде вместо дублированного выражения.

**b) Перевод `cooldownReduction` в аддитивное накопление**
- Заменить прямое присваивание на `+=` и вынести сброс в начало кадра.

**c) Вынести хардкод базовых CD в `GAME_CONFIG.SKILLS`**
- DefPuddle: 25 → `GAME_CONFIG.SKILLS.PUDDLE_COOLDOWN`
- DefEpi: 30 → `GAME_CONFIG.SKILLS.EPI_COOLDOWN`
- KineticBattery zap: 5.0 → `GAME_CONFIG.SKILLS.KINETIC_COOLDOWN`
- Event Horizon: 10 → `GAME_CONFIG.SKILLS.BLACKHOLE_COOLDOWN`
- Cosmic Strike: 8000 → `GAME_CONFIG.SKILLS.COSMIC_COOLDOWN_MS`

**d) Применить `cooldownReduction` к Cosmic Strike**
- Сейчас `ProjectileSpawning.ts:125` не использует `player.cooldownReduction`.

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
