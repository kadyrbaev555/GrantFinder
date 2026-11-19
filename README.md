# GrantFinder
An open catalog of scholarships, grants, and educational opportunities.

[Задачи backend для MVP](docs/backend-mvp.md)

## Локальный запуск backend

Из корня репозитория выполните в PowerShell при первом запуске:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
Invoke-RestMethod http://localhost:8080/health
```

Compose поднимает PostgreSQL 16, применяет SQL-миграции через Goose и запускает Gin API. Ответ `{"status":"ok"}` означает, что API подключился к базе через sqlx. Если база недоступна после запуска, проверка вернёт HTTP 503. Для другого порта измените `API_PORT` в `.env` и в адресе запроса.

## База данных

Миграции находятся в `backend/migrations`. Первая создаёт таблицу `scholarships`. Для новой миграции добавьте файл со следующим номером и секциями `-- +goose Up` и `-- +goose Down`. Пересоберите образ и проверьте состояние:

```powershell
docker compose up --build -d
docker compose run --rm migrate /app/migrate status
```

Команда `docker compose down` останавливает платформу. Данные сохраняются в именованном томе PostgreSQL. Локальные настройки берутся из `.env`, образец для разработки хранится в `.env.example`.
