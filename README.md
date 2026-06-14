# Proji Growth Score - MVP

Квиз-диагностика бизнеса. Сегментация + 12 вопросов -> Score 0-100 -> профиль зрелости и CTA на разбор.
Ответы, контакты, UTM-метки и Lead Score сохраняются в Google Sheets.

---

## Быстрый старт (День 1)

```bash
npm install
npm run dev
# открыть http://localhost:3000
# дашборд: http://localhost:3000/dashboard
```

---

## Деплой на Vercel (День 2)

### 1. Залить на GitHub

```bash
git init
git add .
git commit -m "init: proji growth score mvp"
# создать репо на github.com, затем:
git remote add origin https://github.com/ВАШ_ЮЗЕР/proji-growth-score.git
git push -u origin main
```

### 2. Подключить к Vercel

1. Зайти на [vercel.com](https://vercel.com) → New Project
2. Импортировать репозиторий с GitHub
3. Нажать Deploy (настройки по умолчанию работают)
4. Получить URL вида `proji-growth-score.vercel.app`

> Чтобы прикрепить домен sun.org.kz — в Vercel: Settings → Domains → Add → следовать инструкции

---

## Подключить Google Sheets (сохранение ответов)

### Шаг 1: Создать Service Account

1. Открыть [console.cloud.google.com](https://console.cloud.google.com)
2. Создать проект (или использовать существующий)
3. APIs & Services → Enable APIs → включить **Google Sheets API**
4. IAM & Admin → Service Accounts → Create Service Account
   - Имя: `proji-sheets`
   - Роль: не нужна
5. После создания: Keys → Add Key → JSON → скачать файл

### Шаг 2: Создать таблицу

1. Открыть [sheets.google.com](https://sheets.google.com) → создать новую таблицу
2. Поделиться таблицей с email сервисного аккаунта (из JSON файла, поле `client_email`) — дать права **Редактора**
3. Скопировать ID таблицы из URL:
   `https://docs.google.com/spreadsheets/d/`**`ВОТ_ЭТО_ID`**`/edit`

### Шаг 3: Добавить заголовки в таблицу

API сам обновляет первую строку Sheet1. Если хотите добавить заголовки вручную, используйте:
```
Дата | Score | Уровень | Lead Score | Продажи | Автоматизация | Данные | Команда | AI | Сильная зона | Слабые зоны | Сфера | Размер команды | Модель продаж | Стадия | Город | Имя | Компания | Телефон | Email | UTM Source | UTM Medium | UTM Campaign | UTM Content | UTM Term | Referrer | Landing Path | Device | Language | Ответы (JSON)
```

### Шаг 4: Добавить переменные в Vercel

Vercel → Settings → Environment Variables:

| Переменная | Значение |
|---|---|
| `GOOGLE_SHEET_ID` | ID таблицы из шага 2 |
| `GOOGLE_CLIENT_EMAIL` | `client_email` из JSON файла |
| `GOOGLE_PRIVATE_KEY` | `private_key` из JSON файла (вставить полностью, включая `-----BEGIN...`) |

После добавления — сделать Redeploy.

---

## UTM-трекинг

Добавляйте UTM-метки к ссылкам в WhatsApp и рекламе:

```
https://sun.org.kz/?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=launch
https://sun.org.kz/?utm_source=google&utm_medium=cpc&utm_campaign=kz_b2b
```

В таблице будет видно, какой канал даёт больше прохождений.

Сохраняются также:
- `utm_content`
- `utm_term`
- `referrer`
- путь лендинга
- устройство
- язык браузера

---

## Дашборд

Откройте:

```
http://localhost:3000/dashboard
```

Дашборд показывает:
- сколько людей прошло квиз;
- сколько оставили контакт;
- средний Growth Score;
- средний Lead Score;
- источники трафика;
- города и сферы;
- зоны, которые проседают чаще всего;
- горячие лиды для follow-up.

---

## Структура проекта

```
app/
  page.tsx          # Лендинг (главная)
  quiz/page.tsx     # Сегментация + квиз (12 вопросов) + контакт
  result/page.tsx   # Страница результата
  dashboard/page.tsx # Дашборд
  api/submit/       # API: сохранение в Google Sheets
  api/dashboard/    # API: агрегаты для дашборда
lib/
  quiz.ts           # Вопросы, алгоритм Score, Lead Score
```

---

## Кастомизация

**Изменить вопросы** → `lib/quiz.ts`, массив `QUESTIONS`

**Изменить CTA-ссылку** → `app/result/page.tsx`, строка с `href="https://proji.kz"`

**Цвета** → `app/globals.css`, CSS-переменные в `:root`
