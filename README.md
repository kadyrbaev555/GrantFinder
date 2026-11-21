# GrantFinder
An open catalog of scholarships, grants, and educational opportunities.

[Задачи backend для MVP](docs/backend-mvp.md)

[Задачи frontend для MVP](docs/frontend-mvp.md)

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

Например, `GET /api/v1/scholarships?q=daad&country=Германия&education_level=Магистратура` возвращает карточку DAAD Scholarships.

### Детали программы

`GET /api/v1/scholarships/:id` принимает ID из карточки каталога. При успехе API возвращает HTTP 200 и JSON-объект со всеми полями карточки, а также `description`, `requirements`, `funding_details` и `official_url`. Если ID указан в неверном формате или выходит за диапазон от 1 до 9223372036854775807, API возвращает HTTP 400. Если программы с таким ID нет, ответ — HTTP 404.

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

Готовые статические файлы находятся в `frontend/dist/`. При публикации настройте веб-сервер так, чтобы он передавал запросы к `/health` в backend.

## База данных

Миграции находятся в `backend/migrations`. Первая создаёт таблицу `scholarships`. Для новой миграции добавьте файл со следующим номером и секциями `-- +goose Up` и `-- +goose Down`. Пересоберите образ и проверьте состояние:

```powershell
docker compose up --build -d
docker compose run --rm migrate /app/migrate status
```

Команда `docker compose down` останавливает платформу. Данные сохраняются в именованном томе PostgreSQL. Локальные настройки берутся из `.env`, образец для разработки хранится в `.env.example`.
