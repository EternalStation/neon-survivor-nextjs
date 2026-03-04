# CHRONO PLATING (ChronoPlating)

**Категория:** Defensive | **Арена:** 2 (пул: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Перки по уровням

| Уровень | Перк |
|---------|------|
| 1 | 1% of your armour incresed your DMG% |
| 2 | 1% of your armour incresed your HP% |
| 3 | 0.25% Coldon reduction every minute |
| 4 | 1% of your armour incresed your HP/sec% |
| 5 | MAX LEVEL |

## Механика

**L1 — Armor → Damage:**
```
dmg.hexMult += totalArmor × 0.01 × HexMultiplier   (добавляется к dmg_pct_per_kill)
```

**L2 — Armor → HP:**
```
hp.hexMult += totalArmor × 0.01 × HexMultiplier   (добавляется к hp_pct_per_kill)
```

**L3 — 0.25% Cooldown reduction every minute:**
Каждую минуту с момента L3 параметр `player.cooldownReduction` увеличивается на 0.0025.
```
player.cooldownReduction += minutes * 0.0025;
```

**L4 — Armor → HP/sec:**
```
reg.hexMult += totalArmor × 0.01 × HexMultiplier   (добавляется к reg_pct_per_kill)
```

## Затронутые характеристики

- [Урон](../stats/damage.md) — L1 (`dmg.hexMult` через armor)
- [Здоровье](../stats/health.md) — L2 (`hp.hexMult` через armor)
- [Перезарядка](../stats/cooldown.md) — L3: время-scaling CDR
- [Регенерация HP](../stats/regen.md) — L4: процентная регенерация через armor

## UI Improvements

- **L3: Accumulated CDR** — The UI now displays the total accumulated cooldown reduction since reaching Level 3. Example: `0.25% Cooldown reduction every minute (1.25% total)`.
- **L1, L2, L4: Actual Armor Bonus** — The UI now shows the exact percentage bonus being granted based on your current armor. Example: `1% of your Armor increased your DMG% (+15.0% actual)`.
- **Actual Cooldowns** — Any perk mentioning a cooldown (CD) will now show the actual cooldown after accounting for the player's total Cooldown Reduction. Example: `(6.4s actual)`.
