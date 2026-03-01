# KINETIC BATTERY (KineticBattery)

**Категория:** Defensive | **Арена:** 2 (пул: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Перки по уровням

| Уровень | Перк |
|---------|------|
| 1 | Шоквейв при контакте: 100% Armor DMG на 10 целей, кулдаун 5s |
| 2 | Щит = 100% от суммарной Armor. Обновляется каждую минуту |
| 3 | HP < 50%: Armor увеличивается на 100% |
| 4 | +0.25% Cooldown Reduction за каждую минуту с момента L4 |
| 5 | MAX LEVEL |

## Механика

**L1 — Шоквейв при контакте (и при ударе о стену):**
```
shockDmg = calcStat(player.arm) × 1.0   (100% суммарной Armor)
```
Цепной: поражает до 10 ближайших врагов последовательно. Кулдаун: `5s × cdMod`.

**L2 — Щит:**
```
shieldAmount = calcStat(player.arm) × 1.0
```
Щит обновляется каждые 60 секунд игрового времени (`kineticShieldTimer`). При получении урона щит поглощает его первым. Хранится в `player.shieldChunks` с `source: 'kinetic'`.

**L3 — Условная Armor:**
- Если `player.curHp < MaxHP × 0.5`:
  ```
  arm.hexMult2 += 100 × HexMultiplier
  ```
- Добавляется в hexMult2 (второй тир множителя Armor).

**L4 — CDR (время-scaling):**
```
player.cooldownReduction = minutesSince_L4_acquisition × 0.0025
```
0.25% за каждую минуту с момента достижения L4. Накапливается неограниченно.

## Затронутые характеристики

- [Броня](../stats/armor.md) — L3: `arm.hexMult2 += 100%` при HP < 50%; L2 и L1 используют `calcStat(arm)` как базу щита и урона
- [Снижение кулдауна](../stats/cooldown-reduction.md) — L4: накопительный CDR
