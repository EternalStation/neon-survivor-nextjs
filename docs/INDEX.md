# Neon Survivor — База знаний (docs_v3)

Единое оглавление документации по фактическому поведению системы.
Источник истины: исходный код. Комментарии в коде не используются.

---

## Классы персонажа

> Описание каждого класса: характеристики, основная способность, что улучшается, что фиксировано.

| Файл | Описание |
|------|---------|
| [classes/malware.md](classesalware.md) | Malware — ручное прицеливание, бесконечные рикошеты, нарастающий урон. |
| [classes/void-eventhorizon.md](classesoid-eventhorizon.md) | Void — сингулярность с притяжением и уроном в % от максимального HP врага. |
| [classes/ray-stormstrike.md](classesay-stormstrike.md) | Ray — периодический орбитальный удар по площади, высокий базовый урон. |
| [classes/vortex-aigis.md](classesortex-aigis.md) | Vortex — орбитальные кольца из снарядов, многослойный пассивный урон. |
| [classes/hive-mother.md](classesive-mother.md) | Hive-Mother — цепная инфекция с нанитами, DoT и прыжок при смерти носителя. |

---

## Представления (View)

> Экраны и модальные окна, в которых отображаются данные о классах.

| Файл | Описание |
|------|---------|
| [view/class-selection.md](viewlass-selection.md) | Экран выбора класса до старта сессии: карточки, бейджи, навигация. |
| [view/stats-menu.md](viewtats-menu.md) | Модальное окно статов в игре: характеристики, радар, прогноз угрозы. |

---

## Механики

### Характеристики (Stats)

> Формулы расчёта, источники бонусов и легендарные улучшения, влияющие на каждую характеристику.

| Файл | Описание |
|------|---------|
| [mechanics/stat-formula.md](mechanicstat-formula.md) | Универсальная формула PlayerStats: поля, множители, HexMultiplier, Souls. |
| [mechanics/stats/hp.md](mechanicstats/hp.md) | Максимальное HP: формула, EcoHP, DefPuddle L3. |
| [mechanics/stats/armor.md](mechanicstats/armor.md) | Броня: формула DR, кап 95%, CombShield, KineticBattery L3, ChronoPlating L3. |
| [mechanics/stats/damage.md](mechanicstats/damage.md) | Урон снарядов: формула, EcoDMG, ChronoPlating L1 и L2. |
| [mechanics/stats/attack-speed.md](mechanicstats/attack-speed.md) | Скорость атаки: логарифмическая конвертация в shots/sec, EcoDMG, ChronoPlating L1. |
| [mechanics/stats/regen.md](mechanicstats/regen.md) | Регенерация HP: формула, EcoHP, DefPuddle L3, ChronoPlating L4 (вне формулы). |
| [mechanics/stats/xp-gain.md](mechanicstats/xp-gain.md) | Опыт за убийство: структура, Arena 0 буфф, EcoXP. |
| [mechanics/stats/collision-reduction.md](mechanicstats/collision-reduction.md) | Снижение урона от столкновений: кап 80%, CombShield L2. |
| [mechanics/stats/cooldown-reduction.md](mechanicstats/cooldown-reduction.md) | Снижение кулдауна навыков: KineticBattery L4, время-scaling. |

### Чит-коды

| Файл | Описание |
|------|---------|
| [mechanics/cheat-codes.md](mechanics/cheat-codes.md) | Все отладочные коды: ресурсы, боссы, улучшения, время, турели, события. |

---

### Легендарные улучшения

> Каждое улучшение: категория, арена, перки по уровням, механика работы, ссылки на затронутые характеристики.

**Арена 0 (Economic):**

| Файл | Описание |
|------|---------|
| [mechanics/legendary-upgrades/ecodmg.md](mechanicsegendary-upgrades/ecodmg.md) | STORM OF STEEL — kill-scaling Damage и Attack Speed (flat L1/L2, % L3/L4). |
| [mechanics/legendary-upgrades/ecoxp.md](mechanicsegendary-upgrades/ecoxp.md) | NEURAL HARVEST — kill-scaling XP, пороговые Dust (L2) и Flux (L3). |
| [mechanics/legendary-upgrades/ecohp.md](mechanicsegendary-upgrades/ecohp.md) | ESSENCE SYPHON — kill-scaling MaxHP и Regen (flat L1/L2, % L3/L4). |
| [mechanics/legendary-upgrades/combshield.md](mechanicsegendary-upgrades/combshield.md) | AEGIS PROTOCOL — kill-scaling Armor + Collision/Projectile Reduction. |

**Арена 1 (Combat):**

| Файл | Описание |
|------|---------|
| [mechanics/legendary-upgrades/comlife.md](mechanicsegendary-upgrades/comlife.md) | CRIMSON FEAST — Lifesteal 3% (L1), Overheal-щит (L2), HP%-урон (L3), Zombie (L4). |
| [mechanics/legendary-upgrades/comcrit.md](mechanicsegendary-upgrades/comcrit.md) | SHATTERED FATE — крит 15%/×2 (L1), Execute (L2), Death Mark (L3), Mega-Crit 25%/×3.5 (L4). |
| [mechanics/legendary-upgrades/comwave.md](mechanicsegendary-upgrades/comwave.md) | TERROR PULSE — активный AoE шоквейв 200/350% урона, Fear (L2), кулдаун 30→20s. |
| [mechanics/legendary-upgrades/radiationcore.md](mechanicsegendary-upgrades/radiationcore.md) | RADIATION CORE — постоянная аура 500px (5–10% MaxHP/sec), хил (L2), missing HP scaling (L3), global decay (L4). |

**Арена 2 (Defense):**

| Файл | Описание |
|------|---------|
| [mechanics/legendary-upgrades/defpuddle.md](mechanicsegendary-upgrades/defpuddle.md) | TOXIC SWAMP — кислотная лужа DoT 5% HP/sec, замедление (L2), +25% HP и Regen в луже (L3). |
| [mechanics/legendary-upgrades/defepi.md](mechanicsegendary-upgrades/defepi.md) | EPICENTER — канал шипов 10s с иммобилизацией, -50% урона (L2), неуязвимость 3s (L3). |
| [mechanics/legendary-upgrades/kineticbattery.md](mechanicsegendary-upgrades/kineticbattery.md) | KINETIC BATTERY — шоквейв 100% Armor (L1), щит = Armor (L2), +100% Armor при HP<50% (L3), CDR (L4). |
| [mechanics/legendary-upgrades/chronoplating.md](mechanicsegendary-upgrades/chronoplating.md) | CHRONO PLATING — Armor→DMG+ATS (L1), HP→DMG (L2), удвоение Armor каждые 5 мин (L3), Armor→Regen (L4). |

---

## Статус базы знаний

| Статус | Значение |
|--------|---------|
| ✅ Задокументировано | Поведение подтверждено чтением исходного кода |
| ⚠️ Допущение | Поведение предположено; требует верификации |
| 🔲 Запланировано | Файл планируется, содержимого ещё нет |

Текущее покрытие: классы (5/5), представления классов (2/2), характеристики (9 файлов), легендарные улучшения (12/12), чит-коды (1 файл).
