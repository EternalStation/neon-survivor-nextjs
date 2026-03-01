# Чит-коды (Cheat Codes)

## Назначение

Система отладочных кодов для тестирования игрового состояния без прохождения. Позволяет вызывать боссов, получать ресурсы, спавнить легендарные улучшения и управлять временем.

## Триггеры

- Коды вводятся посимвольно через клавиатуру во время активной игровой сессии.
- Буфер накапливает последние 40 символов; проверка выполняется по суффиксу (`endsWith`).
- Дополнительно имеется ручной ввод через CheatPanel (`CheatPanel.tsx`), включающий поиск по чит-кодам и блок «Недавно использованные» (до 3 штук).
- Ввод блокируется при открытых окнах: настройки, feedback modal, admin console, а также во время диалога экстракции (`extractionStatus: 'requested' | 'waiting'`).
- Коды регистронезависимы (все символы приводятся к нижнему регистру).
- После распознавания кода буфер сбрасывается.

---

## Ресурсы

| Код | Эффект |
|-----|--------|
| `yy` или `ko` | +5100 Dust |
| `kp` | +1000 Void Flux (с плавающим числом и звуком) |
| `rmo` | +100 к базовой броне (`arm.base`) и +10 к множителю брони (`arm.mult`) |

---

## Прогресс игрока

| Код | Эффект |
|-----|--------|
| `lvl`, `l1`, `lp` | XP → до следующего уровня (level up), разблокирует порталы (`portalsUnlocked = true`), открывает предупреждение о портале через 0.5 с |
| `k1` | Убивает игрока (HP → 0, `gameOver = true`), причина смерти: `SIMULATION TERMINATED (DEBUG)` |
| `cs2` | Удваивает текущий `chassisResonanceBonus`: 1-е нажатие → 0.5, затем 0.5→1→2→4→... Эффекты резонанса: EventHorizon — Pull Strength; Malware — bounce DMG/Speed/Range; StormStrike — AOE radius; HiveMother — Infection Rate и Swarm DMG. |

---

## Легендарные улучшения (`Y`-серия)

Коды применяют легендарное улучшение на уровне 5, открывают Matrix-меню для размещения.

| Код | Тип улучшения | Название |
|-----|--------------|---------|
| `y1` | EcoDMG | [STORM OF STEEL](./legendary-upgrades/ecodmg.md) |
| `y2` | EcoXP | [NEURAL HARVEST](./legendary-upgrades/ecoxp.md) |
| `y3` | EcoHP | [ESSENCE SYPHON](./legendary-upgrades/ecohp.md) |
| `y4` | CombShield | [AEGIS PROTOCOL](./legendary-upgrades/combshield.md) |
| `y5` | ComLife | [CRIMSON FEAST](./legendary-upgrades/comlife.md) |
| `y6` | ComCrit | [SHATTERED FATE](./legendary-upgrades/comcrit.md) |
| `y7` | ComWave | [TERROR PULSE](./legendary-upgrades/comwave.md) |
| `y8` | RadiationCore | [RADIATION CORE](./legendary-upgrades/radiationcore.md) |
| `y9` | DefPuddle | [TOXIC SWAMP](./legendary-upgrades/defpuddle.md) |
| `y0` | DefEpi | [EPICENTER](./legendary-upgrades/defepi.md) |
| `y-` | KineticBattery | [KINETIC BATTERY](./legendary-upgrades/kineticbattery.md) |
| `y=` | ChronoPlating | [CHRONO PLATING](./legendary-upgrades/chronoplating.md) |

---

## Чертежи (`O`-серия)

Код `o1`–`o12` — выбрасывает чертёж в радиусе 300 px от игрока.

| Код | Тип чертежа |
|-----|------------|
| `o1` | METEOR_SHOWER |
| `o2` | NEURAL_OVERCLOCK |
| `o3` | STASIS_FIELD |
| `o4` | PERK_RESONANCE |
| `o5` | ARENA_SURGE |
| `o6` | QUANTUM_SCRAPPER |
| `o7` | MATRIX_OVERDRIVE |
| `o8` | TEMPORAL_GUARD |
| `o9` | DIMENSIONAL_GATE |
| `o10` | SECTOR_UPGRADE_ECO |
| `o11` | SECTOR_UPGRADE_COM |
| `o12` | SECTOR_UPGRADE_DEF |

`o20` — добавляет в инвентарь уже исследованный чертёж `DIMENSIONAL_GATE` (status: `ready`).

---

## Метеориты (`M`-серия)

| Код | Редкость | Действие |
|-----|---------|---------|
| `m1` | anomalous | Спавн в мире (100 px от игрока) |
| `m2` | radiant | Спавн в мире |
| `m3` | abyss | Спавн в мире |
| `m4` | eternal | Спавн в мире |
| `m5` | divine | Спавн в мире |
| `m6` | singularity | Спавн в мире |
| `mi1`–`mi6` | те же редкости | Помещает метеорит прямо в инвентарь (`isNew = true`) |

> **Примечание:** Скриншот документации указывает `m1...m9`, но в коде реализованы только 6 редкостей (m1–m6).

---

## Боссы (`B`-серия)

Формат: `b[номер_формы][уровень]`

| Форма | Номер |
|-------|-------|
| circle | 1 |
| triangle | 2 |
| square | 3 |
| diamond | 4 |
| pentagon | 5 |

Уровни: 1–5.

**Примеры:**
- `b11` — Boss Circle Lvl 1
- `b15` — Boss Circle Lvl 5
- `b51` — Boss Pentagon Lvl 1
- `b55` — Boss Pentagon Lvl 5

**Быстрый спавн (максимальный уровень):** `v1`–`v5` — спавн босса соответствующей формы на уровне 4 (Max Tier).

**Устаревший формат:** `v[форма]-[уровень]` (например, `v1-1`) — аналогично b-серии, поддерживается.

---

## Враги (`E`-серия)

| Код | Эффект |
|-----|--------|
| `e1` | Спавн 5 врагов-кругов (circle) |
| `e2` | Спавн 5 врагов-треугольников (triangle) |
| `e3` | Спавн 5 врагов-квадратов (square) |
| `e4` | Спавн 5 врагов-ромбов (diamond) |
| `e5` | Спавн 5 врагов-пятиугольников (pentagon) |
| `e6` или `sni` | Спавн редкого врага Snitch |
| `z3` | Спавн Void Burrower (червь) |
| `gli` | Спавн Prism Glitcher (только если не существует) |

---

## События (`Z`-серия)

| Код | Событие |
|-----|--------|
| `z1` | Legion Formation — активирует событие `legion_formation` на 600 с |
| `z2` | Necrotic Surge (Horde) — активирует событие `necrotic_surge` на 30 с |

---

## Турели (`TUR`-серия)

Формат: `turf[N]`, `turi[N]`, `turh[N]` или сокращённо `tf[N]`, `ti[N]`, `th[N]`.

| Тип | Ключ |
|-----|------|
| Огонь (fire) | `f` |
| Лёд (ice) | `i` |
| Лечение (heal) | `h` |

Уровень: 1–6. Радиус турели: `120 × (1 + (level − 1) × 0.1)`.

**Пример:** `turf3` или `tf3` — огненная турель уровня 3.

---

## Прыжок по времени (`T`-серия)

Формат: `t[минуты]`. Доступные значения: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60.

**Пример:** `t20` — прыгнуть вперёд на 20 минут игрового времени.

---

## Порталы

| Код | Эффект |
|-----|--------|
| `por` | Сбрасывает портал в состояние `closed`, таймер → 10.1 с (быстрое переоткрытие) |
| `lvl` / `l1` / `lp` | Дополнительно открывает порталы (`portalsUnlocked = true`) |

---

## Служебные

| Код | Эффект |
|-----|--------|
| `bug` | Открывает Admin Console |
| `i15` | Запускает тестовый сценарий «Fake Portal Troll» (записывает `fakePortalTriggerTime` в историю ассистента) |

---

## Альтернативы и ошибки

- Если буфер не совпадает ни с одним суффиксом — ничего не происходит, буфер продолжает накапливаться.
- Для `gli`: если Glitcher уже живёт среди врагов — спавн пропускается, буфер сбрасывается.
- Для `o20`: если в инвентаре нет свободного слота — чертёж не добавляется (без уведомления пользователя).
- Для `mi1–mi6`: если инвентарь полон — метеорит не добавляется.
- Для легендарных улучшений: если тип не найден в `LEGENDARY_UPGRADES` — ничего не применяется.

---

## Связанные функции и сущности

- [Легендарные улучшения (список)](./legendary-upgrades/) — все 12 улучшений, применяемых через Y-серию
- [Броня](./stats/armor.md) — затрагивается кодом `rmo`
- [HP](./stats/hp.md) — затрагивается кодом `k1`
- [XP](./stats/xp-gain.md) — затрагивается кодом `lvl`
