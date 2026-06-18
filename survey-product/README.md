# Survey Product MVP

Отдельный продукт для генерации AI-опросников и записи ответов в PostgreSQL.

## Структура
- `app/` — интерфейс и API-роуты
- `lib/db.ts` — Postgres helper
- `lib/llm.ts` — вызов Groq API

## MVP
1. Генерация опросника по промпту и сохранение в Postgres
2. Прохождение опроса респондентом + запись контактов и времени ответа
3. Просмотр ответов
4. Простые правила-флаги: быстрый ответ, дубликат контакта

## Запуск
1. `cd survey-product`
2. `npm install`
3. `DATABASE_URL=... GROQ_API_KEY=... npm run dev`
