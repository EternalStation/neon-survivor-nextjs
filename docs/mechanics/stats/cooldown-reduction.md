# Снижение кулдауна (Cooldown Reduction)

**Тип:** `player.cooldownReduction` — plain number (0.0 … 1.0)

## Применение

Применяется как множитель кулдаунов активных навыков:

```
cdMod = (neuralOverclockActive ? 0.7 : 1.0) × (1 - player.cooldownReduction)
effectiveCooldown = baseCooldown × cdMod
```

`cdMod` = 1.0 при отсутствии обоих источников.

## Легендарный источник

### [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md) — уровень 4

**Триггер:** каждую минуту с момента достижения L4

| Формула |
|---------|
| `player.cooldownReduction = minutesSinceL4 × 0.0025` |

| Время от L4 | Cooldown Reduction | cdMod |
|---|---|---|
| 0 мин | 0% | 1.00 |
| 10 мин | 2.5% | 0.975 |
| 40 мин | 10% | 0.90 |
| 100 мин | 25% | 0.75 |

Значение накапливается неограниченно, но практически ограничено длиной игровой сессии.

## Область действия

Снижение кулдауна действует на все активные навыки:
- [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md): кулдаун шоквейва (5s base)
- [TOXIC SWAMP (DefPuddle)](../legendary-upgrades/defpuddle.md): кулдаун лужи (25s base)
- [EPICENTER (DefEpi)](../legendary-upgrades/defepi.md): кулдаун шипов (30s base)
- [TERROR PULSE (ComWave)](../legendary-upgrades/comwave.md): кулдаун волны (30s / 20s)

Blueprint NEURAL_OVERCLOCK (`neuralOverclockActive`) снижает дополнительно на 30% (множитель 0.7), независимо от `cooldownReduction`.

## Связанные функции и сущности

- [KINETIC BATTERY](../legendary-upgrades/kineticbattery.md)
- [TOXIC SWAMP](../legendary-upgrades/defpuddle.md)
- [EPICENTER](../legendary-upgrades/defepi.md)
- [TERROR PULSE](../legendary-upgrades/comwave.md)
