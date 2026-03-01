# Универсальная формула характеристик (PlayerStats)

## Структура PlayerStats

Боевые характеристики (`hp`, `dmg`, `atk`, `reg`, `arm`) хранятся в формате `PlayerStats`:

| Поле | Тип | Источник |
|------|-----|---------|
| `base` | число | Базовое значение класса |
| `flat` | число | Аддитивные бонусы от обычных улучшений |
| `mult` | % | Процентные бонусы от обычных улучшений |
| `hexFlat` | число | Аддитивные бонусы от легендарных улучшений |
| `hexMult` | % | Первый процентный бонус от легендарных улучшений |
| `hexMult2` | % | Второй процентный бонус от легендарных улучшений |

## Формула расчёта

```
Итог = (base + flat + hexFlat) × (1 + mult/100) × (1 + (hexMult + hexMult2)/100) × arenaMult × curseMult
```

- `hexMult` и `hexMult2` суммируются аддитивно внутри одного тира перед применением к базе.
- `arenaMult` и `curseMult` — внешние глобальные множители.

## arenaMult по характеристикам

`arenaMult` применяется только если игрок **находится в соответствующей арене** И эта арена **разблокирована** (blueprint `SECTOR_UPGRADE_*` был применён хотя бы раз).

| Характеристика | Переменная | Только SECTOR_UPGRADE_* | SECTOR_UPGRADE_* + ARENA_SURGE |
|---|---|---|---|
| [HP](stats/hp.md), [Regen](stats/regen.md) | `hpRegenBuffMult` (Arena 2, DEF) | 1.3 (+30%) | 1.6 (+60%) |
| [Урон](stats/damage.md), [Скорость атаки](stats/attack-speed.md) | `dmgAtkBuffMult` (Arena 1, COM) | 1.3 (+30%) | 1.6 (+60%) |
| [XP](stats/xp-gain.md), Soul Yield | `xpSoulBuffMult` (Arena 0, ECO) | 1.3 (+30%) | 1.6 (+60%) |

> **ARENA_SURGE** — отдельный Blueprint (стоимость 50 dust, длительность 300 с / 5 мин), который **удваивает бонус арены**: базовые +30% превращаются в +60%. Не является частью SECTOR_UPGRADE_* — это временный усилитель поверх уже разблокированной арены.

### Как повышается уровень арены

`state.arenaLevels` — счётчик `Record<number, number>`, стартует `{ 0: 0, 1: 0, 2: 0 }`.
Повышается только применением blueprints:

| Blueprint | Арена | Эффект |
|---|---|---|
| `SECTOR_UPGRADE_ECO` | [0] Economic | `arenaLevels[0] += 1` |
| `SECTOR_UPGRADE_COM` | [1] Combat | `arenaLevels[1] += 1` |
| `SECTOR_UPGRADE_DEF` | [2] Defense | `arenaLevels[2] += 1` |

### Кап уровня арены

**Капа нет** — счётчик растёт неограниченно. Однако в логике используется только проверка `>= 1`:

```ts
// PlayerStats.ts
state.hpRegenBuffMult = (state.currentArena === 2 && currentArenaLevel >= 1) ? activeArenaMult : 1.0;
```

Уровни 2, 3 и выше **не дают никакого дополнительного эффекта**. Повторное применение одного и того же `SECTOR_UPGRADE_*` — пустая трата blueprint.

## curseMult

`curseMult = state.assistant.history.curseIntensity` (по умолчанию 1.0).
Задаётся системой прогрессии на основе диалогов с ИИ-ассистентом.

## HexMultiplier (масштабирование через метеориты)

Kill-scaling бонусы легендарных улучшений умножаются на HexMultiplier данного улучшения:

```
HexMultiplier = 1 + суммарная_эффективность_4_связанных_слотов_метеоритов
```

Это значение динамически пересчитывается для каждого легендарного улучшения отдельно, в зависимости от состава и качества подключённых метеоритов.

## Механика Souls (убийства как ресурс масштабирования)

### Что такое Souls

`state.killCount` — глобальный счётчик, который растёт при каждом убийстве врага. Это и есть «souls». Он **общий для всей игры**, не сбрасывается и не разделён между легендарными улучшениями.

Сколько souls даёт враг при смерти:

| Тип врага | Souls |
|---|---|
| Обычный | +1 |
| Elite (Pentagon) | +5 |
| Elite (другие) | +10 |
| Worm Head | +50 |
| Все × Eco Buff | `× xpSoulBuffMult` |

### Как Souls отсчитываются для каждого уровня hex

Каждый hex хранит `killsAtLevel: Record<number, number>` — снимок `state.killCount` в момент получения каждого уровня:

- `killsAtLevel[1]` фиксируется когда **игрок выбирает hex** (первое получение)
- `killsAtLevel[N]` фиксируется когда **игрок повышает hex до уровня N**

Это значит souls для уровня N считаются **с нуля с момента взятия этого уровня**, а не с начала игры.

### Формула расчёта бонуса

```
rawSouls   = state.killCount - killsAtLevel[lvl]
souls      = rawSouls × soulDrainMult
bonus      = souls × HexMultiplier × coefficient
```

- `killsAtLevel[lvl]` — снимок killCount в момент получения уровня `lvl`
- `soulDrainMult` — дебафф от Circle Boss Lvl 4 (по умолчанию 1.0, сбрасывается каждый фрейм)
- `HexMultiplier` — бонус от метеоритов в слотах данного hex
- `coefficient` — уникален для каждого hex и уровня (например EcoDMG lvl1 = 0.1 урона за soul)

### Fallback логика (защита от ошибок)

```ts
// LegendaryLogic.ts
const startKills = kl[lvl] ?? hex.killsAtAcquisition ?? state.killCount;
```

Приоритет: `killsAtLevel[lvl]` → `killsAtAcquisition` → `state.killCount` (=0 souls, last resort).

### soulDrainMult

Сбрасывается в `1.0` каждый игровой фрейм хостом. Circle Boss Lvl 4 во время жизни перезаписывает его значением < 1.0, снижая накопление souls. После гибели босса возвращается к 1.0.

## Связанные файлы

- [HP](stats/hp.md) — Максимальное здоровье
- [Броня](stats/armor.md) — Броня и Damage Reduction
- [Урон](stats/damage.md) — Базовый урон снарядов
- [Скорость атаки](stats/attack-speed.md) — Частота выстрелов
- [Регенерация](stats/regen.md) — Восстановление HP
- [Опыт за убийство](stats/xp-gain.md) — Накопление XP
- [Снижение урона от столкновений](stats/collision-reduction.md) — Защита от контактного урона
- [Снижение кулдауна](stats/cooldown-reduction.md) — Ускорение активных навыков
