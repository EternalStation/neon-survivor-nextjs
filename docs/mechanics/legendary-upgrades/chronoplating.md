# CHRONO PLATING (ChronoPlating)

**Категория:** Defensive | **Арена:** 2 (пул: KineticBattery, DefPuddle, DefEpi, ChronoPlating)

## Перки по уровням

| Уровень | Перк |
|---------|------|
| 1 | DMG% и ATS% увеличиваются на 1% от суммарной Armor |
| 2 | +1% DMG за каждые 100 MaxHP |
| 3 | Удвоение Armor каждые 5 минут |
| 4 | HP/sec увеличивается на 0.5% от суммарной Armor |
| 5 | MAX LEVEL |

## Механика

**L1 — Armor → Damage и ATS:**
```
dmg.hexMult += totalArmor × 0.01 × HexMultiplier   (добавляется к dmg_pct_per_kill)
atk.hexMult += totalArmor × 0.01 × HexMultiplier   (добавляется к ats_pct_per_kill)
```

**L2 — HP → Damage:**
```
dmg.hexMult += (MaxHP / 100) × 1.0 × HexMultiplier   (добавляется к dmg_pct_per_hp)
```

**L3 — Удвоение Armor каждые 5 минут:**

Каждые 5 минут с момента L3 текущее `calcStat(arm)` добавляется к `player.chronoArmorBonus`:
```
player.chronoArmorBonus += calcStat(player.arm)
arm.hexFlat += player.chronoArmorBonus   (каждый кадр)
```

Это создаёт накопительный рост: к базе Armor добавляется всё большее значение, которое само участвует в следующем удвоении.

**L4 — Armor → Regen (вне формулы):**
```
regenAmount += totalArmor × 0.005 / 60   (добавляется к curHp каждый кадр)
```

Этот бонус добавляется **после** calcStat и **не** умножается на `hpRegenBuffMult` или `curseMult`.

## Затронутые характеристики

- [Урон](../stats/damage.md) — L1 (`dmg.hexMult` через armor) и L2 (`dmg.hexMult` через HP)
- [Скорость атаки](../stats/attack-speed.md) — L1 (`atk.hexMult` через armor)
- [Броня](../stats/armor.md) — L3: время-scaling удвоение через `chronoArmorBonus`
- [Регенерация HP](../stats/regen.md) — L4: post-formula добавление через armor
