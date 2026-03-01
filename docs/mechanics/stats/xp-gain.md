# Опыт за убийство (XP Gain)

**Тип:** `{ base: number; flat: number; mult: number }` (без hexFlat/hexMult)

## Отличие от PlayerStats

В отличие от боевых характеристик, `player.xp_per_kill` не является полным `PlayerStats` (нет полей `hexFlat`, `hexMult`). Бонусы от легендарных улучшений применяются через отдельный механизм в логике убийств.

## Масштабирование арены

В Arena 0 при уровне арены ≥ 1 действует `xpSoulBuffMult`:
- Базовое значение: 1.3 (+30%)
- С Surge: 1.6 (+60%)

`xpSoulBuffMult` применяется к числу soul-очков, начисляемых за убийство (`state.killCount`), что косвенно ускоряет kill-scaling всех легендарных улучшений.

## Легендарные источники

### [NEURAL HARVEST (EcoXP)](../legendary-upgrades/ecoxp.md) — уровни 1 и 4

| Уровень | Эффект | Ключ расчёта |
|---------|--------|-------------|
| 1 | +0.1 XP за каждое убийство × HexMultiplier | `xp_per_kill` |
| 4 | +0.1% XP за каждое убийство × HexMultiplier | `xp_pct_per_kill` |

Формула бонуса: `souls_since_Lx × 0.1 × HexMultiplier`.

## Открытые вопросы

Точная точка применения бонусов `xp_per_kill` и `xp_pct_per_kill` из `calculateLegendaryBonus` к `player.xp.current` требует верификации в логике начисления XP.

## Связанные функции и сущности

- [Формула PlayerStats](../stat-formula.md)
- [NEURAL HARVEST](../legendary-upgrades/ecoxp.md)
