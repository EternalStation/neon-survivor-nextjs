# План миграции на VPS + Coolify

## Контекст

### Текущий хостинг
- **Web**: Vercel (Next.js, автодеплой из GitHub)
- **БД**: Neon PostgreSQL (serverless, подключение через `@neondatabase/serverless`)
- **Desktop**: Electron, обращается к web API через `VITE_API_URL`

### Целевой хостинг
- **VPS**: Hetzner (рекомендуется CX22: 2 vCPU, 4 GB RAM, 40 GB SSD, ~€4.5/мес)
- **Оболочка**: Coolify (self-hosted PaaS, аналог Vercel/Railway)
- **БД**: 2 экземпляра PostgreSQL в Docker на том же VPS (управляются через Coolify)
  - `viod-nexus_main` — production
  - `viod-nexus_stage` — staging
- **Neon** полностью удаляется

### Окружения

| | Staging                         | Production        |
|---|---------------------------------|-------------------|
| Ветка | `stage`                         | `main`            |
| Домен | `stage.yourdomain.com`          | `yourdomain.com`  |
| БД | `viod-nexus_stage`              | `viod-nexus_main` |
| Автодеплой | push в `stage`                  | push в `main`     |
| Назначение | Тестирование, проверка миграций | Боевой сервер     |

### Предпосылки
- Prisma + tRPC уже внедрены (см. plan-prisma-trpc.md)
- `@neondatabase/serverless` заменён на `@prisma/client` с обычным PostgreSQL
- Приложение запускается через `next start` (standalone mode)

---

## Этап 1: Подготовка Next.js к Docker

### 1.1 Настройка standalone output

Обновить `apps/web/next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@neon-survivor/shared', '@neon-survivor/db', '@neon-survivor/api'],
  // ... остальные настройки
}
```

`output: 'standalone'` создаёт минимальный бандл, который не требует `node_modules` и подходит для Docker.

### 1.2 Создание Dockerfile

Создать `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY . .
RUN pnpm --filter @neon-survivor/db db:generate
RUN pnpm --filter @neon-survivor/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
```

### 1.3 Создание .dockerignore

Создать `.dockerignore` в корне монорепо:

```
node_modules
.next
out
dist
.git
*.md
apps/desktop
```

### 1.4 Локальная проверка

Перед деплоем проверить что Docker-образ собирается и запускается:

```bash
docker build -f apps/web/Dockerfile -t neon-survivor-web .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="test-secret" \
  neon-survivor-web
```

---

## Этап 2: Аренда и настройка VPS

### 2.1 Выбор VPS

Рекомендуемые провайдеры:
- **Hetzner** (CX22, €4.51/мес) — лучшее соотношение цена/производительность в Европе
- **Contabo** — дешевле, но менее стабильный
- **DigitalOcean** ($6/мес) — привычный интерфейс

При заказе:
- ОС: **Ubuntu 24.04 LTS**
- Регион: ближайший к целевой аудитории
- SSH-ключ: добавить при создании

### 2.2 Базовая настройка сервера

Подключиться по SSH и выполнить:

```bash
# Обновление системы
apt update && apt upgrade -y

# Настройка файрвола
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw allow 8000   # Coolify UI
ufw enable

# Создание swap (если RAM <= 4GB)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2.3 Установка Coolify

Одна команда:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

После установки:
1. Открыть `http://<IP-сервера>:8000`
2. Создать аккаунт администратора
3. Привязать домен к Coolify dashboard (опционально)

---

## Этап 3: Настройка Coolify

### 3.1 Подключение GitHub

В Coolify dashboard:
1. Settings → Git → Add GitHub App
2. Авторизовать доступ к репозиторию `neon-survivor-nextjs`

### 3.2 Создание PostgreSQL (2 экземпляра)

#### Production БД

1. В Coolify: Resources → New → Database → PostgreSQL
2. Настройки:
   - Имя ресурса: `postgres-production`
   - Версия: 16
   - Имя БД: `viod-nexus`
   - Пользователь: `viod-nexus`
   - Пароль: сгенерировать надёжный
   - Порт: `5432` (по умолчанию)
3. Запустить
4. Скопировать внутренний connection string: `postgresql://viod-nexus:<pass>@postgres-production:5432/viod-nexus`

#### Staging БД

1. В Coolify: Resources → New → Database → PostgreSQL
2. Настройки:
   - Имя ресурса: `postgres-staging`
   - Версия: 16
   - Имя БД: `viod-nexus_stage`
   - Пользователь: `viod-nexus_stage`
   - Пароль: сгенерировать другой надёжный пароль
   - Порт: `5433` (отличается от production!)
3. Запустить
4. Скопировать внутренний connection string: `postgresql://viod-nexus_stage:<pass>@postgres-staging:5433/viod-nexus_stage`

> **Важно**: Coolify автоматически изолирует контейнеры по сетям. Staging-приложение не сможет случайно подключиться к production БД, если правильно настроены переменные окружения.

### 3.3 Создание приложений (2 экземпляра)

#### Production приложение

1. Resources → New → Application
2. Источник: GitHub → выбрать репозиторий
3. Ветка: **main**
4. Build Pack: **Dockerfile**
5. Dockerfile path: `apps/web/Dockerfile`
6. Environment Variables:
   - `DATABASE_URL` = connection string от `postgres-production`
   - `JWT_SECRET` = сгенерировать (минимум 32 символа)
   - `NODE_ENV` = `production`
7. Порт: `3000`
8. Домен: `yourdomain.com`
9. Включить **Auto Deploy** на push в `main`

#### Staging приложение

1. Resources → New → Application
2. Источник: GitHub → выбрать тот же репозиторий
3. Ветка: **stage**
4. Build Pack: **Dockerfile**
5. Dockerfile path: `apps/web/Dockerfile`
6. Environment Variables:
   - `DATABASE_URL` = connection string от `postgres-staging`
   - `JWT_SECRET` = другой секрет (отличается от production!)
   - `NODE_ENV` = `production` (Next.js оптимизации нужны и на staging)
7. Порт: `3000`
8. Домен: `stage.yourdomain.com`
9. Включить **Auto Deploy** на push в `stage`

> **Зачем разные JWT_SECRET?** Токены, выпущенные на staging, не должны работать на production и наоборот. Это защита от случайного использования staging-токенов в бою.

### 3.4 Workflow разработки

```
feature-branch → PR в stage → автодеплой на stage.yourdomain.com
                                   ↓ (проверка)
                 PR из stage в main → автодеплой на yourdomain.com
```

1. Разработка ведётся в feature-ветках
2. PR мержится в `stage` → Coolify автоматически деплоит на staging
3. Проверка на staging (ручная + автотесты)
4. Когда staging стабилен → PR из `stage` в `main`
5. Merge в `main` → Coolify автоматически деплоит на production

---

## Этап 4: Миграция данных из Neon

> **Принцип**: данные из Neon мигрируют **только в production БД**. Staging БД начинает жизнь пустой (или с seed-данными).

### 4.1 Применение Prisma-миграций на обеих БД

Сначала накатить схему на обе базы:

```bash
# Staging (можно делать первой — безопасно)
DATABASE_URL="postgresql://viod-nexus_stage:pass@<VPS-IP>:5433/viod-nexus_stage" \
  pnpm --filter @neon-survivor/db prisma migrate deploy

# Production
DATABASE_URL="postgresql://viod-nexus:pass@<VPS-IP>:5432/viod-nexus" \
  pnpm --filter @neon-survivor/db prisma migrate deploy
```

> **Порядок важен**: всегда сначала staging, потом production. Если миграция сломает схему — лучше узнать это на staging.

### 4.2 Seed-данные для staging (опционально)

Создать скрипт `packages/db/seed.ts` с тестовыми данными для staging:

```bash
DATABASE_URL="postgresql://viod-nexus_stage:pass@<VPS-IP>:5433/viod-nexus_stage" \
  pnpm --filter @neon-survivor/db prisma db seed
```

Это позволит тестировать с предсказуемыми данными, не рискуя production.

### 4.3 Экспорт данных из Neon (только для production)

На локальной машине:

```bash
# Получить connection string из Neon Dashboard
pg_dump "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" \
  --data-only \
  --no-owner \
  --no-privileges \
  -f neon-data-dump.sql
```

Флаг `--data-only` — потому что схема уже создана через Prisma-миграции.

### 4.4 Импорт данных в production БД

```bash
psql "postgresql://viod-nexus:pass@<VPS-IP>:5432/viod-nexus" < neon-data-dump.sql
```

### 4.5 Проверка данных (production)

```bash
psql "postgresql://viod-nexus:pass@<VPS-IP>:5432/viod-nexus" -c "
  SELECT 'players' as tbl, COUNT(*) FROM players
  UNION ALL
  SELECT 'game_runs', COUNT(*) FROM game_runs
  UNION ALL
  SELECT 'feedbacks', COUNT(*) FROM feedbacks;
"
```

Сравнить количество записей с Neon.

---

## Этап 5: Настройка домена и DNS

### 5.1 DNS-записи

Добавить A-записи у регистратора домена:

```
# Production
Тип: A
Имя: @ (или yourdomain.com)
Значение: <IP VPS>
TTL: 300

# Staging
Тип: A
Имя: stage
Значение: <IP VPS>
TTL: 300
```

Опционально для www:
```
Тип: CNAME
Имя: www
Значение: yourdomain.com
```

### 5.2 SSL

Coolify автоматически выпустит Let's Encrypt сертификаты для обоих доменов (`yourdomain.com` и `stage.yourdomain.com`).

---

## Этап 6: Обновление Electron-клиента

### 6.1 Обновить API URL

В `apps/desktop/.env` (и в production-конфигурации):

```
VITE_API_URL=https://yourdomain.com/api
```

> **Внимание**: Electron-клиент всегда указывает на **production**. Для тестирования десктопа со staging — использовать локальную dev-сборку с `VITE_API_URL=https://stage.yourdomain.com/api`.

Убедиться что CORS-заголовки в `next.config.ts` разрешают запросы с десктопа (текущая настройка `Access-Control-Allow-Origin: *` подходит, но в продакшене лучше указать конкретный origin или оставить `*` так как Electron не имеет origin).

---

## Этап 7: Бэкапы PostgreSQL

### 7.1 Скрипт автоматического бэкапа (только production)

Создать `/opt/backup-db.sh` на VPS:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

# Бэкап ТОЛЬКО production БД
docker exec -t <postgres-production-container> \
  pg_dump -U viod-nexus viod-nexus \
  | gzip > "$BACKUP_DIR/viod-nexus_$TIMESTAMP.sql.gz"

# Удалить бэкапы старше 14 дней
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
```

> **Почему не бэкапим staging?** Staging-данные воспроизводимы (seed + ручное тестирование). Бэкап staging — пустая трата дискового пространства.

### 7.2 Cron-задача

```bash
chmod +x /opt/backup-db.sh
crontab -e
# Добавить:
0 3 * * * /opt/backup-db.sh
```

Бэкап каждый день в 3:00 ночи, хранение 14 дней.

### 7.3 Внешнее хранение (опционально)

Для критичных данных — отправлять бэкапы в S3-совместимое хранилище (Backblaze B2, ~$0.005/GB/мес):

```bash
# Установить rclone
curl https://rclone.org/install.sh | bash
rclone config  # настроить B2 провайдер

# Добавить в конец backup-db.sh:
rclone copy "$BACKUP_DIR/viod-nexus_$TIMESTAMP.sql.gz" b2:neon-survivor-backups/
```

---

## Этап 8: Безопасная работа с Prisma-миграциями

### 8.1 Правило: сначала staging, потом production

Любые изменения схемы БД проходят через staging:

```bash
# 1. Разработка: создание миграции локально
pnpm --filter @neon-survivor/db prisma migrate dev --name add_new_field

# 2. Commit и push в stage
git add .
git commit -m "feat: add new_field to players"
git push origin stage

# 3. Coolify деплоит staging → миграция применяется на staging БД
#    Проверить что staging работает корректно

# 4. PR из stage в main → merge
#    Coolify деплоит production → миграция применяется на production БД
```

### 8.2 Опасные миграции (удаление/переименование колонок)

Для деструктивных миграций (DROP COLUMN, RENAME и т.д.):

1. Проверить на staging что данные не теряются
2. Сделать **ручной бэкап production** перед деплоем:
   ```bash
   ssh vps "/opt/backup-db.sh"
   ```
3. Только после этого мержить в `main`

### 8.3 Откат при сбое

Если миграция на production сломала приложение:

1. Coolify → Production app → откатить на предыдущий деплой (Rollback)
2. Восстановить БД из последнего бэкапа:
   ```bash
   gunzip -c /opt/backups/postgres/viod-nexus_LATEST.sql.gz \
     | docker exec -i <postgres-production-container> \
       psql -U viod-nexus viod-nexus
   ```
3. Разобраться с проблемой на staging, починить, повторить деплой

---

## Этап 9: Удаление Vercel и Neon

### 9.1 Проверка перед удалением

- [ ] **Production** сервер работает стабильно минимум 3-5 дней
- [ ] **Staging** сервер работает, деплой из `stage` проходит
- [ ] Все API-эндпоинты отвечают корректно на обоих окружениях
- [ ] Desktop-клиент подключается и отправляет данные (production)
- [ ] Бэкапы production работают
- [ ] SSL работает на обоих доменах
- [ ] Домены резолвятся на VPS

### 9.2 Удаление Vercel

1. Vercel Dashboard → Project Settings → Delete Project
2. Удалить Vercel GitHub integration (если не используется для других проектов)

### 9.3 Удаление Neon

1. Neon Dashboard → Project Settings → Delete Project
2. Убедиться что локальный `neon-data-dump.sql` сохранён как финальная копия

### 9.4 Очистка кода

Удалить из `apps/web/package.json`:
```
"@neondatabase/serverless": "^1.0.2"
```

Удалить файл `apps/web/src/lib/Db.ts` (если ещё не удалён на этапе Prisma).

---

## Финальная архитектура

```
VPS (Hetzner CX22, ~€4.5/мес)
├── Coolify (управление)
├── PostgreSQL 16 "postgres-production" (:5432)
│   └── БД: viod-nexus
├── PostgreSQL 16 "postgres-staging" (:5433)
│   └── БД: viod-nexus_stage
├── Next.js "production" (Docker, автодеплой из main)
│   └── https://yourdomain.com
├── Next.js "staging" (Docker, автодеплой из stage)
│   └── https://stage.yourdomain.com
└── Cron-бэкапы production → /opt/backups/ (+ опц. Backblaze B2)

Клиенты:
├── Браузер → https://yourdomain.com (production)
├── Браузер → https://stage.yourdomain.com (тестирование)
└── Electron → https://yourdomain.com/api/trpc (production)

Workflow:
  feature → stage (автодеплой staging) → main (автодеплой production)
```

---

## Оценка стоимости

| Статья | Vercel + Neon (сейчас) | VPS + Coolify (после) |
|---|---|---|
| Хостинг web | $0-20/мес (Vercel) | €4.5/мес (Hetzner, оба окружения) |
| БД | $0-19/мес (Neon) | $0 (2x PostgreSQL на VPS) |
| SSL | бесплатно | бесплатно (Let's Encrypt) |
| Домен | $10-15/год | $10-15/год |
| Бэкапы | — | $0-1/мес (B2, опц.) |
| **Итого** | **$0-39/мес** | **~$5/мес фиксировано** |

> Staging и production работают на одном VPS. Для проекта текущего масштаба CX22 (2 vCPU, 4 GB RAM) достаточно для обоих окружений. При росте нагрузки — staging можно перенести на отдельный дешёвый VPS.

---

## Чеклист выполнения

### Подготовка
- [ ] Добавить `output: 'standalone'` в next.config.ts
- [ ] Создать Dockerfile и .dockerignore
- [ ] Протестировать Docker-сборку локально

### VPS и Coolify
- [ ] Арендовать VPS (Hetzner CX22)
- [ ] Настроить сервер (firewall, swap)
- [ ] Установить Coolify
- [ ] Подключить GitHub к Coolify

### Базы данных
- [ ] Создать PostgreSQL `postgres-production` (порт 5432)
- [ ] Создать PostgreSQL `postgres-staging` (порт 5433)
- [ ] Применить Prisma-миграции на staging БД
- [ ] Применить Prisma-миграции на production БД

### Приложения
- [ ] Создать staging-приложение в Coolify (ветка `stage`)
- [ ] Создать production-приложение в Coolify (ветка `main`)
- [ ] Настроить env-переменные staging (`DATABASE_URL`, `JWT_SECRET`)
- [ ] Настроить env-переменные production (`DATABASE_URL`, `JWT_SECRET`)
- [ ] Убедиться что `JWT_SECRET` отличается между окружениями

### Миграция данных
- [ ] Экспортировать данные из Neon (`pg_dump`)
- [ ] Импортировать данные в production PostgreSQL
- [ ] Проверить количество записей (players, game_runs, feedbacks)
- [ ] Создать seed-скрипт для staging (опционально)

### DNS и SSL
- [ ] Настроить DNS: A-запись `@` → VPS IP (production)
- [ ] Настроить DNS: A-запись `stage` → VPS IP (staging)
- [ ] Проверить SSL на `yourdomain.com`
- [ ] Проверить SSL на `stage.yourdomain.com`

### Electron
- [ ] Обновить `VITE_API_URL` на production-домен

### Бэкапы и безопасность
- [ ] Настроить автоматические бэкапы production БД
- [ ] Проверить восстановление из бэкапа (тест на staging)
- [ ] Создать ветку `stage` в git (если не существует)

### Финальная проверка
- [ ] Staging работает, деплой из `stage` проходит
- [ ] Production работает, деплой из `main` проходит
- [ ] Desktop-клиент подключается к production
- [ ] Полный цикл: feature → stage → проверка → main → проверка
- [ ] Стабильная работа 3-5 дней

### Очистка
- [ ] Удалить проект в Vercel
- [ ] Удалить проект в Neon
- [ ] Удалить `@neondatabase/serverless` из зависимостей
