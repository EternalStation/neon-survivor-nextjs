# План внедрения Prisma + tRPC

## Контекст текущего состояния

### Структура монорепо (Turborepo + pnpm)
```
neon-survivor/
  apps/web/          — Next.js (порт 3000)
  apps/desktop/      — Electron (Vite, обращается к web API)
  packages/shared/   — общий код (game logic, UI компоненты)
```

### Текущий стек БД
- Драйвер: `@neondatabase/serverless` (raw SQL, без ORM)
- Клиент: `apps/web/src/lib/Db.ts` — Proxy-обёртка над `neon()`
- Авторизация: `apps/web/src/lib/Auth.ts` — JWT (jsonwebtoken + bcryptjs)
- Таблицы: `players`, `game_runs`, `feedbacks` (схема нигде не описана декларативно)

### Текущие API-роуты (14 штук, все в `apps/web/src/app/api/`)
| Роут | Метод | Назначение |
|---|---|---|
| `auth/register` | POST | Регистрация |
| `auth/login` | POST | Логин |
| `auth/verify` | GET | Проверка JWT |
| `runs` | POST | Сохранение игрового забега |
| `runs/[id]` | DELETE | Удаление забега |
| `runs/me/all` | DELETE | Удаление всех забегов пользователя |
| `leaderboard/global` | GET | Глобальный лидерборд |
| `leaderboard/daily` | GET | Лидерборд за день |
| `leaderboard/weekly` | GET | Лидерборд за неделю |
| `leaderboard/patches` | GET | Список патч-версий |
| `leaderboard/patch/[version]` | GET | Лидерборд по патчу |
| `feedback` | GET/POST/PUT | CRUD фидбека |
| `health` | GET | Проверка здоровья |
| `admin/migrate-overlord` | GET | Одноразовая миграция данных |

### Проблемы текущей реализации
1. Схема БД нигде не описана — восстанавливается только из raw SQL
2. ALTER TABLE хаки дублируются в 4+ роутах (leaderboard/global, daily, weekly, patch)
3. Нет типизации результатов SQL-запросов
4. `feedbacks` таблица создаётся на лету (`CREATE TABLE IF NOT EXISTS` при каждом запросе)
5. Desktop-клиент дублирует fetch-логику без типов

---

## Этап 1: Создание пакета `packages/db` с Prisma

### 1.1 Инициализация пакета

Создать `packages/db/` в монорепо:

```
packages/db/
  package.json
  tsconfig.json
  prisma/
    schema.prisma
  src/
    index.ts        — экспорт PrismaClient
```

**package.json:**
```json
{
  "name": "@neon-survivor/db",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:pull": "prisma db pull"
  },
  "dependencies": {
    "@prisma/client": "^6"
  },
  "devDependencies": {
    "prisma": "^6",
    "typescript": "^5"
  }
}
```

### 1.2 Написание Prisma-схемы

Файл `packages/db/prisma/schema.prisma` — на основе текущих raw SQL запросов:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Player {
  id           Int        @id @default(autoincrement())
  username     String     @unique @db.VarChar(255)
  passwordHash String     @map("password_hash") @db.VarChar(255)
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz
  lastLogin    DateTime?  @map("last_login") @db.Timestamptz
  gameRuns     GameRun[]
  feedbacks    Feedback[]

  @@map("players")
}

model GameRun {
  id                      Int      @id @default(autoincrement())
  playerId                Int      @map("player_id")
  score                   Decimal  @db.Decimal
  survivalTime            Float    @map("survival_time")
  kills                   Int
  bossKills               Int      @default(0) @map("boss_kills")
  classUsed               String   @map("class_used") @db.VarChar(100)
  patchVersion            String   @map("patch_version") @db.VarChar(50)
  damageDealt             Decimal  @default(0) @map("damage_dealt") @db.Decimal
  damageTaken             Decimal  @default(0) @map("damage_taken") @db.Decimal
  damageBlocked           Decimal  @default(0) @map("damage_blocked") @db.Decimal
  damageBlockedArmor      Decimal  @default(0) @map("damage_blocked_armor") @db.Decimal
  damageBlockedCollision  Decimal  @default(0) @map("damage_blocked_collision") @db.Decimal
  damageBlockedProjectile Decimal  @default(0) @map("damage_blocked_projectile") @db.Decimal
  damageBlockedShield     Decimal  @default(0) @map("damage_blocked_shield") @db.Decimal
  radarCounts             Json     @default("{}") @map("radar_counts")
  meteoritesCollected     Int      @default(0) @map("meteorites_collected")
  portalsUsed             Int      @default(0) @map("portals_used")
  arenaTimes              Json     @default("{\"0\":0,\"1\":0,\"2\":0}") @map("arena_times")
  legendaryHexes          Json     @default("[]") @map("legendary_hexes")
  hexLevelupOrder         Json     @default("[]") @map("hex_levelup_order")
  snitchesCaught          Int      @default(0) @map("snitches_caught")
  deathCause              String   @default("Unknown") @map("death_cause") @db.VarChar(100)
  finalStats              Json     @default("{}") @map("final_stats")
  blueprints              Json     @default("[]")
  damageBreakdown         Json     @default("{}") @map("damage_breakdown")
  classSkillDmgHistory    Json     @default("[]") @map("class_skill_dmg_history")
  avgHpPercent            Decimal  @default(100) @map("avg_hp_percent") @db.Decimal
  incomingDamageBreakdown Json     @default("{}") @map("incoming_damage_breakdown")
  healingBreakdown        Json     @default("{}") @map("healing_breakdown")
  completedAt             DateTime @default(now()) @map("completed_at") @db.Timestamptz

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@map("game_runs")
}

model Feedback {
  id        Int      @id @default(autoincrement())
  playerId  Int?     @map("player_id")
  username  String   @db.VarChar(255)
  type      String   @db.VarChar(50)
  message   String   @db.Text
  status    String   @default("Pending") @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  player Player? @relation(fields: [playerId], references: [id], onDelete: SetNull)

  @@map("feedbacks")
}
```

### 1.3 Экспорт клиента

Файл `packages/db/src/index.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
```

### 1.4 Интеграция с Turborepo

Обновить `pnpm-workspace.yaml` — уже содержит `packages/*`, ничего менять не нужно.

Обновить `turbo.json` — добавить задачу `db:generate`:

```json
{
  "tasks": {
    "db:generate": {
      "cache": false
    },
    "build": {
      "dependsOn": ["^build", "^db:generate"],
      "outputs": [".next/**", "out/**", "dist/**"]
    }
  }
}
```

### 1.5 Первичная синхронизация с существующей БД

Порядок действий:
1. `cd packages/db`
2. `pnpm prisma db pull` — интроспекция текущей Neon БД (проверить что schema.prisma совпадает)
3. Сравнить с написанной схемой, скорректировать при необходимости
4. `pnpm prisma generate` — сгенерировать клиент
5. `pnpm prisma migrate dev --name init` — создать базовую миграцию (baseline)

**ВАЖНО**: Так как БД уже содержит данные, использовать `prisma migrate dev --create-only` и затем `prisma migrate resolve --applied` для baseline.

### 1.6 Удаление ALTER TABLE хаков

После создания Prisma-схемы удалить все блоки `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` из:
- `apps/web/src/app/api/leaderboard/global/route.ts`
- `apps/web/src/app/api/leaderboard/daily/route.ts`
- `apps/web/src/app/api/leaderboard/weekly/route.ts`
- `apps/web/src/app/api/leaderboard/patch/[version]/route.ts`
- `apps/web/src/app/api/runs/route.ts`

Также удалить `CREATE TABLE IF NOT EXISTS` из:
- `apps/web/src/app/api/feedback/route.ts`

Также удалить `apps/web/src/app/api/admin/migrate-overlord/route.ts` (одноразовая миграция, больше не нужна)

---

## Этап 2: Создание пакета `packages/api` с tRPC

### 2.1 Инициализация пакета

```
packages/api/
  package.json
  tsconfig.json
  src/
    index.ts          — экспорт appRouter и типа AppRouter
    trpc.ts           — инициализация tRPC, контексты, middleware
    context.ts        — создание контекста (JWT, prisma)
    routers/
      auth.ts         — register, login, verify
      runs.ts         — submit, delete, deleteAll
      leaderboard.ts  — global, daily, weekly, byPatch, patches
      feedback.ts     — list, create, updateStatus
```

**package.json:**
```json
{
  "name": "@neon-survivor/api",
  "private": true,
  "main": "src/index.ts",
  "dependencies": {
    "@neon-survivor/db": "workspace:*",
    "@trpc/server": "^11",
    "bcryptjs": "^3",
    "jsonwebtoken": "^9",
    "zod": "^3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2",
    "@types/jsonwebtoken": "^9",
    "typescript": "^5"
  }
}
```

### 2.2 Инициализация tRPC

Файл `packages/api/src/trpc.ts`:

```ts
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
```

Файл `packages/api/src/context.ts`:

```ts
import { prisma } from '@neon-survivor/db'
import type { JWTPayload } from './utils/auth'

export interface Context {
  prisma: typeof prisma
  user: JWTPayload | null
}

export function createContext(user: JWTPayload | null): Context {
  return { prisma, user }
}
```

### 2.3 Маппинг API-роутов → tRPC-процедуры

| Текущий роут | tRPC-процедура | Тип |
|---|---|---|
| `POST /api/auth/register` | `auth.register` | mutation (public) |
| `POST /api/auth/login` | `auth.login` | mutation (public) |
| `GET /api/auth/verify` | `auth.verify` | query (public) |
| `POST /api/runs` | `runs.submit` | mutation (protected) |
| `DELETE /api/runs/[id]` | `runs.delete` | mutation (protected) |
| `DELETE /api/runs/me/all` | `runs.deleteAll` | mutation (protected) |
| `GET /api/leaderboard/global` | `leaderboard.global` | query (public) |
| `GET /api/leaderboard/daily` | `leaderboard.daily` | query (public) |
| `GET /api/leaderboard/weekly` | `leaderboard.weekly` | query (public) |
| `GET /api/leaderboard/patches` | `leaderboard.patches` | query (public) |
| `GET /api/leaderboard/patch/[ver]` | `leaderboard.byPatch` | query (public) |
| `GET /api/feedback` | `feedback.list` | query (public) |
| `POST /api/feedback` | `feedback.create` | mutation (protected) |
| `PUT /api/feedback` | `feedback.updateStatus` | mutation (public*) |
| `GET /api/health` | `health.check` | query (public) |

*feedback.updateStatus должен стать protected (admin), в текущей реализации проверка отсутствует.

### 2.4 Пример роутера (runs)

```ts
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const runsRouter = router({
  submit: protectedProcedure
    .input(z.object({
      score: z.number(),
      survivalTime: z.number(),
      kills: z.number(),
      bossKills: z.number().default(0),
      classUsed: z.string(),
      patchVersion: z.string(),
      damageDealt: z.number().default(0),
      damageTaken: z.number().default(0),
      damageBlocked: z.number().default(0),
      damageBlockedArmor: z.number().default(0),
      damageBlockedCollision: z.number().default(0),
      damageBlockedProjectile: z.number().default(0),
      damageBlockedShield: z.number().default(0),
      radarCounts: z.record(z.number()).default({}),
      meteoritesCollected: z.number().default(0),
      portalsUsed: z.number().default(0),
      arenaTimes: z.record(z.number()).default({}),
      legendaryHexes: z.array(z.string()).default([]),
      hexLevelupOrder: z.array(z.string()).default([]),
      snitchesCaught: z.number().default(0),
      deathCause: z.string().default('Unknown'),
      finalStats: z.record(z.unknown()).default({}),
      blueprints: z.array(z.unknown()).default([]),
      damageBreakdown: z.record(z.number()).default({}),
      classSkillDmgHistory: z.array(z.unknown()).default([]),
      avgHpPercent: z.number().default(100),
      incomingDamageBreakdown: z.record(z.number()).default({}),
      healingBreakdown: z.record(z.number()).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.prisma.gameRun.create({
        data: {
          playerId: ctx.user.id,
          ...input,
        },
        select: { id: true, score: true, completedAt: true, survivalTime: true },
      })

      // Вычисление ранга (аналог текущей логики)
      // ...

      return { run, rank }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.prisma.gameRun.findUniqueOrThrow({
        where: { id: input.id },
        select: { playerId: true },
      })
      if (run.playerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      await ctx.prisma.gameRun.delete({ where: { id: input.id } })
    }),

  deleteAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.prisma.gameRun.deleteMany({
        where: { playerId: ctx.user.id },
      })
    }),
})
```

### 2.5 Корневой роутер

Файл `packages/api/src/index.ts`:

```ts
import { router } from './trpc'
import { authRouter } from './routers/auth'
import { runsRouter } from './routers/runs'
import { leaderboardRouter } from './routers/leaderboard'
import { feedbackRouter } from './routers/feedback'

export const appRouter = router({
  auth: authRouter,
  runs: runsRouter,
  leaderboard: leaderboardRouter,
  feedback: feedbackRouter,
})

export type AppRouter = typeof appRouter
```

### 2.6 Подключение к Next.js

Установить в `apps/web`:
```bash
pnpm add @trpc/server @trpc/client @trpc/next @trpc/react-query @tanstack/react-query
```

Создать catch-all route handler `apps/web/src/app/api/trpc/[trpc]/route.ts`:

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@neon-survivor/api'
import { createContext } from '@neon-survivor/api/context'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(/* extract JWT from req headers */),
  })

export { handler as GET, handler as POST }
```

Создать клиентскую обёртку `apps/web/src/lib/trpc.ts`:

```ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@neon-survivor/api'

export const trpc = createTRPCReact<AppRouter>()
```

### 2.7 Подключение к Electron (Desktop)

Desktop-клиент использует vanilla tRPC client (без React Query):

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@neon-survivor/api'

const apiClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL}/trpc`,
      headers: () => ({
        Authorization: `Bearer ${getToken()}`,
      }),
    }),
  ],
})
```

Это даёт полную типизацию запросов в Electron без дублирования кода.

---

## Этап 3: Миграция существующих роутов

### 3.1 Стратегия: параллельная работа

Не удалять старые роуты сразу. Вместо этого:
1. Создать tRPC-роутеры
2. Переключить клиентский код на tRPC
3. Убедиться что всё работает
4. Удалить старые `app/api/*` роуты (кроме `api/trpc/`)

### 3.2 Порядок миграции роутов

1. **health** — самый простой, для проверки что tRPC работает
2. **auth** (register, login, verify) — фундамент
3. **leaderboard** (global, daily, weekly, patches, byPatch) — read-only, безопасно
4. **runs** (submit, delete, deleteAll) — write-операции
5. **feedback** (list, create, updateStatus)

### 3.3 Миграция клиентского кода

Найти все `fetch('/api/...')` вызовы в `apps/web/` и `apps/desktop/` и заменить на tRPC-вызовы.

Для web (React):
```ts
// Было:
const res = await fetch('/api/leaderboard/global')
const data = await res.json()

// Стало:
const data = trpc.leaderboard.global.useQuery({ limit: 100 })
```

Для desktop (vanilla):
```ts
// Было:
const res = await fetch(`${API_URL}/leaderboard/global`)

// Стало:
const data = await apiClient.leaderboard.global.query({ limit: 100 })
```

---

## Этап 4: Зависимости — что установить, что удалить

### Установить
| Пакет | Куда |
|---|---|
| `prisma` (dev) | `packages/db` |
| `@prisma/client` | `packages/db` |
| `@trpc/server` | `packages/api` |
| `zod` | `packages/api` |
| `bcryptjs` + types | `packages/api` (перенести из web) |
| `jsonwebtoken` + types | `packages/api` (перенести из web) |
| `@trpc/server` | `apps/web` |
| `@trpc/client` | `apps/web` |
| `@trpc/react-query` | `apps/web` |
| `@tanstack/react-query` | `apps/web` |
| `@trpc/client` | `apps/desktop` |

### Удалить
| Пакет | Откуда |
|---|---|
| `@neondatabase/serverless` | `apps/web` |
| `bcryptjs` + types | `apps/web` (перенесено в api) |
| `jsonwebtoken` + types | `apps/web` (перенесено в api) |

---

## Этап 5: Удаление старого кода

После полной миграции удалить:
- `apps/web/src/lib/Db.ts` — Neon-клиент
- `apps/web/src/lib/Auth.ts` — перенесена в `packages/api`
- Все файлы в `apps/web/src/app/api/` КРОМЕ `api/trpc/[trpc]/route.ts`

---

## Финальная структура файлов

```
packages/
  db/
    prisma/
      schema.prisma
      migrations/
    src/
      index.ts
    package.json
  api/
    src/
      index.ts
      trpc.ts
      context.ts
      utils/
        auth.ts
      routers/
        auth.ts
        runs.ts
        leaderboard.ts
        feedback.ts
    package.json
  shared/
    (без изменений)
apps/
  web/
    src/
      app/api/trpc/[trpc]/route.ts    — единственный API-роут
      lib/trpc.ts                      — tRPC React client
  desktop/
    (использует @trpc/client напрямую)
```

---

## Чеклист выполнения

- [ ] Создать `packages/db` с Prisma-схемой
- [ ] Выполнить `prisma db pull` и сверить схему с реальной БД
- [ ] Выполнить baseline-миграцию
- [ ] Создать `packages/api` с tRPC-роутерами
- [ ] Перенести auth-логику (JWT, bcrypt) в `packages/api`
- [ ] Подключить tRPC handler в Next.js (`/api/trpc/[trpc]`)
- [ ] Создать tRPC-клиент для web
- [ ] Создать tRPC-клиент для desktop
- [ ] Мигрировать роуты по одному (health → auth → leaderboard → runs → feedback)
- [ ] Переключить клиентский код на tRPC-вызовы
- [ ] Удалить старые API-роуты
- [ ] Удалить `@neondatabase/serverless`, `Db.ts`, `Auth.ts`
- [ ] Удалить все ALTER TABLE хаки
- [ ] Обновить `turbo.json` (db:generate в dependsOn)
- [ ] Протестировать web + desktop
