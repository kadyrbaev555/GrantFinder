# GrantFinder API

Backend отдаёт данные каталога в формате JSON. По умолчанию API доступен на `http://localhost:8080`, как его запустить — в [README](../README.md#быстрый-старт).

| Метод и путь | Что возвращает |
| --- | --- |
| `GET /health` | `{"status":"ok"}`, если API подключён к базе, иначе HTTP 503 |
| `GET /api/v1/scholarships` | список карточек с поиском и фильтрами |
| `GET /api/v1/scholarships/:id` | все данные одной программы |

## Каталог: `GET /api/v1/scholarships`

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

## Детали программы: `GET /api/v1/scholarships/:id`

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

## Проверка состояния: `GET /health`

Ответ `{"status":"ok"}` и HTTP 200 означают, что API работает и подключился к PostgreSQL. Если база недоступна, ответ — HTTP 503. Frontend вызывает этот маршрут при загрузке страницы и показывает статус соединения внизу.
