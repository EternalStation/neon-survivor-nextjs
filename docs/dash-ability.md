# Dash Ability (Рывок)

Базовая способность, доступная всем классам. Активируется клавишей **Пробел** (Space).

## Механика

- Игрок совершает рывок в направлении движения (WASD / стик). Если игрок стоит — рывок происходит по `lastAngle` (последнее направление взгляда).
- Во время рывка стандартное управление движением заблокировано.
- Короткий период неуязвимости во время рывка (`INVINCIBLE_DURATION = 0.15s`).
- Если цель рывка выходит за границу карты, рывок прерывается.

## Параметры (GameConfig.DASH)

| Параметр            | Значение |
|---------------------|----------|
| DISTANCE            | 240 px   |
| DURATION            | 0.18 s   |
| COOLDOWN            | 4.0 s    |
| INVINCIBLE_DURATION | 0.15 s   |

## Состояние игрока (Player)

| Поле           | Тип    | Описание                                  |
|----------------|--------|-------------------------------------------|
| dashCooldown   | number | Текущий кулдаун (countdown в секундах)    |
| dashCooldownMax| number | Максимальный кулдаун                      |
| dashUntil      | number | gameTime когда рывок заканчивается        |
| dashVx / dashVy| number | Скорость рывка по осям (px/frame)         |

## Визуал

- В начале рывка: 8 cyan-частиц (`spawnParticles` тип `'spark'`)
- Во время рывка: 2 blue-частицы на каждый кадр
- SFX: `'dash'` (aliased to `'sonic-wave'`)

## HUD

В `PlayerStatus.tsx` отображается отдельная шестиугольная иконка с иконкой ⚡:
- Светится голубым когда готов к использованию
- Показывает countdown (цифры) во время кулдауна
- Лейбл `SPC` в углу

## Настройки

Биндинг dash доступен в KeybindSettings (ключ `dash`, по умолчанию `Space`).

## Файлы

| Файл | Роль |
|------|------|
| `src/logic/player/PlayerMovement.ts` | `triggerDash()` и обработка активного рывка в `handlePlayerMovement` |
| `src/logic/core/GameConfig.ts` | Константы `GAME_CONFIG.DASH` |
| `src/logic/core/types.ts` | Поля dash в интерфейсе `Player` |
| `src/logic/utils/Keybinds.ts` | Добавлен биндинг `dash: 'Space'` |
| `src/hooks/useGameInput.ts` | Обработка нажатия Space → вызов `triggerDash` |
| `src/components/hud/PlayerStatus.tsx` | HUD индикатор кулдауна |
| `src/components/KeybindSettings.tsx` | Строка настройки в меню биндов |
