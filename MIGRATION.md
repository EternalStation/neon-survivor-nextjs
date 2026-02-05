# Миграция на Next.js - Инструкция

## ✅ Что уже сделано

### Backend API (100% готов)
- ✅ `/api/auth/register` - Регистрация пользователей
- ✅ `/api/auth/login` - Вход в систему
- ✅ `/api/auth/verify` - Проверка JWT токена
- ✅ `/api/leaderboard/global` - Глобальная таблица лидеров
- ✅ `/api/leaderboard/daily` - Дневная таблица
- ✅ `/api/leaderboard/weekly` - Недельная таблица
- ✅ `/api/runs` - Сохранение игровых сессий
- ✅ `/api/health` - Health check

### Инфраструктура
- ✅ Подключение к Neon PostgreSQL
- ✅ JWT аутентификация
- ✅ TypeScript типизация
- ✅ Environment variables (.env.local)

## 🔄 Что нужно сделать

### 1. Перенести игровые компоненты

Скопируйте из старого проекта `Game/src/`:

```bash
# Компоненты React
Game/src/components/ → neon-survivor-nextjs/src/components/

# Игровая логика
Game/src/logic/ → neon-survivor-nextjs/src/lib/game/

# Хуки
Game/src/hooks/ → neon-survivor-nextjs/src/hooks/

# Статические файлы (assets, audio, sprites)
Game/public/ → neon-survivor-nextjs/public/
```

### 2. Обновить главную страницу

Замените содержимое `src/app/page.tsx` на игровой canvas:

```typescript
'use client';

import { useGameLoop } from '@/hooks/useGame';
import { GameCanvas } from '@/components/GameCanvas';
// ... остальные импорты

export default function Home() {
  const gameState = useGameLoop(true);
  
  return (
    <main>
      <GameCanvas gameState={gameState} />
      {/* UI компоненты */}
    </main>
  );
}
```

### 3. Обновить API вызовы в клиенте

Замените URL в fetch запросах:

```typescript
// Старое
fetch('http://localhost:3001/api/auth/login', ...)

// Новое
fetch('/api/auth/login', ...)
```

### 4. Настроить CORS (если нужно)

Если будете тестировать с другого домена, добавьте в `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ],
      },
    ];
  },
};
```

## 🚀 Запуск

### Development
```bash
cd neon-survivor-nextjs
npm run dev
```
Откройте http://localhost:3000

### Production Build
```bash
npm run build
npm run start
```

### Деплой на Vercel
```bash
npm install -g vercel
vercel
```

## 📝 Важные изменения

### Пути импортов
- Используйте `@/` алиас вместо относительных путей
- `import { Component } from '@/components/Component'`

### API Routes
- Все в `src/app/api/`
- Автоматически становятся serverless functions
- Нет нужды в Express middleware

### Environment Variables
- `.env.local` для локальной разработки
- В Vercel добавьте через UI: Settings → Environment Variables

## 🎯 Преимущества

1. **Один проект** вместо двух (Game + server)
2. **Автоматический деплой** - push в git = деплой
3. **Serverless** - масштабируется автоматически
4. **TypeScript** - полная типизация везде
5. **Оптимизация** - встроенная в Next.js

## 🔍 Проверка работоспособности

Тест API:
```bash
# Health check
curl http://localhost:3000/api/health

# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Leaderboard
curl http://localhost:3000/api/leaderboard/global
```

## ❓ FAQ

**Q: Можно ли использовать старый сервер параллельно?**  
A: Да, но лучше полностью перейти на Next.js

**Q: Нужно ли менять базу данных?**  
A: Нет, используется та же Neon PostgreSQL

**Q: Как деплоить?**  
A: Просто `git push` в GitHub и подключите Vercel

**Q: Работает ли с существующими пользователями?**  
A: Да, та же БД = те же пользователи и данные
