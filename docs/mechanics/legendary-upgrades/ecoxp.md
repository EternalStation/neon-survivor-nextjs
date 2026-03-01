# NEURAL HARVEST (EcoXP)

**Категория:** Economic | **Арена:** 0 (пул: CombShield, EcoDMG, EcoXP, EcoHP)

## Перки по уровням

| Уровень | Перк | Ключ |
|---------|------|------|
| 1 | +0.1 XP за каждое убийство | `xp_per_kill` |
| 2 | +1 Dust каждые 50 убийств | (threshold, DeathLogic) |
| 3 | +5 Flux каждые 10 убийств | (threshold, DeathLogic) |
| 4 | +0.1% XP за каждое убийство | `xp_pct_per_kill` |
| 5 | MAX LEVEL | — |

## Механика

**L1 и L4** — kill-scaling: `souls_since_Lx × 0.1 × HexMultiplier`.

**L2 — Dust Extraction** (пороговый):
- Каждые 50 душ накопленных с момента L2 → +1 Dust × HexMultiplier
- Начисляется в момент убийства при пересечении порога

**L3 — Flux Extraction** (пороговый):
- Каждые 10 душ накопленных с момента L3 → +5 Flux × HexMultiplier
- Начисляется в момент убийства при пересечении порога

## Затронутые характеристики

- [Опыт за убийство](../stats/xp-gain.md) — L1 (flat) и L4 (%)
