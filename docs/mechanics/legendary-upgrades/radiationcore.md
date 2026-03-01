# RADIATION CORE (RadiationCore)

**Категория:** Combat | **Арена:** 1 (пул: RadiationCore, ComLife, ComCrit, ComWave)

## Перки по уровням

| Уровень | Перк |
|---------|------|
| 1 | Аура урона 500px: 5%–10% MaxHP игрока/sec (ближе = больше) |
| 2 | Исцеление: 0.2% MaxHP/sec за каждого врага в ауре |
| 3 | +1% урона ауры за каждый 1% пропущенного HP игрока |
| 4 | Global Decay: все враги теряют 2% своего MaxHP/sec |
| 5 | MAX LEVEL |

## Механика

Тикает каждые 10 кадров (~6 раз в секунду).

**L1 — Аура урона:**
```
distFactor = 1 - (distance / 500)
auraPct = minDmgPct + distFactor × (maxDmgPct - minDmgPct)
tickDmg = playerMaxHp × auraPct / 6   (за тик, с учётом 6 тиков/сек)
```

Где `minDmgPct = 0.05 × dmgAmp` и `maxDmgPct = 0.10 × dmgAmp`, `dmgAmp = 1.0 × HexMultiplier`.

**L2 — Хил за ауру:**
```
healPerEnemy = playerMaxHp × (0.002 × HexMultiplier) / 6
totalHeal = healPerEnemy × enemiesInAuraCount
```

**L3 — Missing HP scaling:**
```
missing = 1 - (curHp / maxHp)
dmgAmp += missing   (каждый 1% пропущенного HP → +1% к dmgAmp)
```

**L4 — Global Decay (без ограничения по дальности):**
```
tickDmg += (enemy.maxHp × 0.02 × dmgAmp) / 6
```

Применяется ко **всем** врагам на карте независимо от дистанции.

## Затронутые характеристики

- [HP](../stats/hp.md) — `playerMaxHp = calcStat(player.hp)` является базой урона ауры; исцеление восстанавливает curHp

Radiation Core **не изменяет** PlayerStats — это периодический источник урона, независимый от `player.dmg`.
