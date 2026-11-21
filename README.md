# GrantFinder
An open catalog of scholarships, grants, and educational opportunities.

## Запуск через Make

Выполняйте команды из корня проекта. Для бэкенда нужен работающий Docker Engine с Compose, для фронтенда — Node.js и npm.

| Команда | Что запускает |
| --- | --- |
| `make backend` | PostgreSQL, миграции и Go API через Docker Compose. API по умолчанию доступен на `http://localhost:8080`. |
| `make frontend` | Vite в текущем терминале. Зависимости устанавливаются при первом запуске и при изменении файлов пакетов. Откройте адрес из вывода Vite, обычно `http://localhost:5173`. |
| `make up` или `make` | Сначала бэкенд в фоне, затем фронтенд в текущем терминале. |

Чтобы остановить фронтенд, нажмите Ctrl+C в его терминале. Команда `make down` останавливает сервисы Compose и сохраняет данные PostgreSQL в томе.

Настройки подключения к базе находятся в файле `.env` в корне. При первом запуске бэкенда Make создаёт его из [.env.example](.env.example). Имя пользователя, пароль и имя базы задаются через `PGUSER`, `PGPASSWORD` и `PGDATABASE`. Для подключения с компьютера используются `PGHOST` и `PGPORT`. Внутри сети Compose API и миграции подключаются к `db:5432`. Порт API задаётся отдельно через `API_PORT`.

## Локальный запуск backend

Из корня репозитория выполните в PowerShell при первом запуске:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
Invoke-RestMethod http://localhost:8080/health
```

Compose поднимает PostgreSQL 16, применяет SQL-миграции через Goose и запускает Gin API. Ответ `{"status":"ok"}` означает, что API подключился к базе через sqlx. Если база недоступна после запуска, проверка вернёт HTTP 503. Для другого порта измените `API_PORT` в `.env` и в адресе запроса.

## Карточки каталога

`GET /api/v1/scholarships` возвращает HTTP 200 и JSON-массив карточек с полями `id`, `title`, `organizer`, `country`, `education_level`, `funding_type` и `deadline`. Карточки отсортированы по названию по возрастанию, при совпадении названий — по возрастанию ID. Дата подачи имеет формат `YYYY-MM-DD`, неизвестная дата передаётся как `null`. Для пустого каталога ответ — `[]`.

Все параметры поиска необязательны. `q` ищет подстроку в названии без учёта регистра. `country` и `funding_type` принимают точное значение из карточки, а `education_level` — один уровень, например `Магистратура`. Если у программы несколько уровней, достаточно совпадения с одним из них. Пустые параметры пропускаются. При сочетании параметров действуют все условия одновременно.

Для запроса из React соберите строку параметров с помощью `URLSearchParams`. Пример поиска с двумя фильтрами:

```js
const params = new URLSearchParams({
  q: 'daad',
  country: 'Германия',
  education_level: 'Магистратура',
})
const response = await fetch(`/api/v1/scholarships?${params}`)
if (!response.ok) throw new Error(`HTTP ${response.status}`)
const cards = await response.json()
```

Ответ на новой базе:

```json
[
  {
    "id": 3,
    "title": "DAAD Scholarships",
    "organizer": "Deutscher Akademischer Austauschdienst (DAAD)",
    "country": "Германия",
    "education_level": "Магистратура, Докторантура, Исследования",
    "funding_type": "Зависит от программы",
    "deadline": null
  }
]
```

Если в том же запросе выбрать страну `Япония`, API вернёт HTTP 200 и `[]`.

### Детали программы

`GET /api/v1/scholarships/:id` принимает ID из карточки каталога. При успехе API возвращает HTTP 200 и JSON-объект со всеми полями карточки, а также `description`, `requirements`, `funding_details` и `official_url`. Если ID указан в неверном формате или выходит за диапазон от 1 до 9223372036854775807, API возвращает HTTP 400. Если программы с таким ID нет, ответ — HTTP 404.

Для перехода из каталога подставьте `card.id` в путь запроса. Например, на новой базе `GET /api/v1/scholarships/3` возвращает:

```json
{
  "id": 3,
  "title": "DAAD Scholarships",
  "organizer": "Deutscher Akademischer Austauschdienst (DAAD)",
  "country": "Германия",
  "education_level": "Магистратура, Докторантура, Исследования",
  "funding_type": "Зависит от программы",
  "deadline": null,
  "description": "Стипендии и исследовательские гранты для обучения и научной работы в университетах Германии. Сроки подачи зависят от конкретной программы и трека.",
  "requirements": "Соответствующий диплом о высшем образовании\nЗнание английского или немецкого языка\nМотивационное письмо и пакет документов выбранной программы",
  "funding_details": "Ежемесячная стипендия, медицинская страховка и дополнительные выплаты в зависимости от конкретной программы DAAD.",
  "official_url": "https://www.daad-kyrgyzstan.org/ru/poisk-finansirovaniya/baza-dannyh-stipendialnyh-programm/"
}
```

Кнопка «Официальный сайт» на странице программы открывает `official_url` из этого ответа. Значение `deadline: null` можно показать как «Срок не указан».

| Запрос | HTTP | Тело ошибки |
| --- | --- | --- |
| Детали с некорректным ID, например `/api/v1/scholarships/abc` | 400 | `{"error":"invalid scholarship ID"}` |
| Детали отсутствующей программы | 404 | `{"error":"scholarship not found"}` |
| Ошибка чтения каталога | 500 | `{"error":"could not load scholarships"}` |
| Ошибка чтения деталей | 500 | `{"error":"could not load scholarship"}` |

## Локальный запуск frontend

Запустите backend по инструкции выше. В отдельном терминале из корня репозитория выполните команды для React и Vite (Node.js 22.12+ или ветка 20.x начиная с 20.19).

```powershell
cd frontend
npm ci
npm run dev
```

Откройте адрес из вывода Vite (обычно `http://localhost:5173`). При загрузке страницы браузер запрашивает `GET /health` на том же адресе. Dev-прокси Vite передаёт запрос в backend на порту `API_PORT` из корневого `.env` (по умолчанию 8080). При ответе `{"status":"ok"}` внизу страницы появится «Соединение с API установлено». После изменения порта перезапустите Vite.

Для production-сборки выполните в каталоге `frontend`:

```powershell
npm run build
```

Готовые статические файлы находятся в `frontend/dist/`. В режиме разработки Vite проксирует `/health` и `/api` в backend. При публикации настройте веб-сервер так, чтобы запросы к `/health` и `/api/*` также передавались в backend с сохранением пути и параметров.

## База данных

Миграции находятся в `backend/migrations`. Первая создаёт таблицу `scholarships`. Для новой миграции добавьте файл со следующим номером и секциями `-- +goose Up` и `-- +goose Down`. Пересоберите образ и проверьте состояние:

```powershell
docker compose up --build -d
docker compose run --rm migrate /app/migrate status
```

Команда `docker compose down` останавливает платформу. Данные сохраняются в именованном томе PostgreSQL. Локальные настройки берутся из `.env`, образец для разработки хранится в `.env.example`.
