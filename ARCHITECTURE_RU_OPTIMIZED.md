# ReklamAI — Оптимальная архитектура для быстрой работы в РФ

## Проблема: почему сейчас медленно

### Текущая цепочка запросов (generate)

Каждый раз когда пользователь из России нажимает «Сгенерировать», происходит следующее:

```
Браузер (Москва)
  → Supabase Edge Function (EU/US, ~150-300ms RTT)
    → [STEP 2] Auth check — запрос к auth.users
    → [STEP 4] Board access — SELECT boards
    → [STEP 4b] Board members — SELECT board_members
    → [STEP 5] Preset — SELECT presets
    → [STEP 5b] Model — SELECT models
    → [STEP 6] Admin settings — SELECT admin_settings
    → [STEP 8] INSERT generations (через REST API)
    → [STEP 9] RPC rpc_credit_reserve (с таймаутом 3 сек)
    → [STEP 10] UPDATE generations (reserved_credits)
    → [STEP 11] Signed URLs для файлов (1-5 запросов к Storage)
    → [STEP 12] KIE.ai API (внешний, ~200-500ms)
    → [BG] UPDATE generations + INSERT provider_tasks
```

**12+ последовательных запросов к БД**, каждый ≈150-300ms RTT из-за того что
Supabase хостится за границей. Итого: **2-5 секунд только на latency**, прежде
чем пользователь увидит ответ.

### Текущая цепочка запросов (status polling)

ProgressPage.tsx опрашивает каждые 2 секунды:

```
Браузер (Москва)
  → Supabase Edge Function (EU/US, ~150-300ms)
    → Auth check
    → SELECT generations
    → SELECT models (для capabilities)
    → KIE.ai status API (~200-500ms)
    → UPDATE provider_tasks
    → SELECT generations (повторно)
    → SELECT assets
    → Signed URL для preview
  ← Ответ обратно (~150-300ms)
```

**Каждый poll = 6-8 запросов к БД + 1 запрос к KIE + 2× международный RTT**.
При polling каждые 2 секунды и генерации видео на 2-3 минуты это 60-90 циклов.

### Итого потерь

| Операция | Текущая задержка | Причина |
|----------|-----------------|---------|
| Фронт → Edge Function | 150-300ms | Международный RTT |
| Edge Function → БД (×12) | 1800-3600ms | Каждый запрос через PostgREST |
| Edge Function → KIE.ai | 200-500ms | Внешний API |
| Ответ обратно | 150-300ms | Международный RTT |
| **ИТОГО generate** | **2.3-4.7 сек** | |
| **ИТОГО status (×1)** | **1.0-2.5 сек** | |
| Cold start Edge Function | +500-2000ms | Первый запрос после простоя |

---

## Целевая архитектура: всё в России

### Принцип: минимум международных хопов

Единственные запросы которые ОБЯЗАНЫ идти за границу — это вызовы KIE.ai API.
Всё остальное (БД, кеш, файлы, авторизация, фронт) должно быть в одном
дата-центре в Москве.

### Схема

```
┌─────────────────────────────────────────────────────┐
│  VPS в Москве (Selectel / Timeweb / Yandex Cloud)   │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐ │
│  │  Nginx   │──▸│ FastAPI   │──▸│   PostgreSQL 15  │ │
│  │ (static  │   │ (uvicorn  │   │   (БД, RPC,      │ │
│  │  + proxy)│   │  workers) │   │    атомарные      │ │
│  └──────────┘   └────┬─────┘   │    операции)       │ │
│       │              │         └──────────────────┘ │
│       │         ┌────┴─────┐   ┌──────────────────┐ │
│       │         │  Redis 7 │   │  MinIO / S3      │ │
│       │         │ (кеш +   │   │  (файлы,         │ │
│       │         │  Celery   │   │   outputs,       │ │
│       │         │  broker + │   │   uploads)       │ │
│       │         │  WebSocket│   └──────────────────┘ │
│       │         │  pub/sub) │                        │
│       │         └────┬─────┘                         │
│       │              │                               │
│       │         ┌────┴─────────┐                     │
│       │         │ Celery Worker │─── KIE.ai API ───▸ │
│       │         │ (фоновые     │    (международный)  │
│       │         │  задачи)     │                     │
│       │         └──────────────┘                     │
│                                                      │
└─────────────────────────────────────────────────────┘

Пользователь (Москва) ──▸ Nginx (Москва) ≈ 5-20ms RTT
```

### Стек

| Компонент | Технология | Зачем |
|-----------|-----------|-------|
| Reverse proxy + static | **Nginx** | Отдаёт SPA, проксирует API, SSL, gzip, кеш |
| API сервер | **FastAPI + uvicorn** (4+ workers) | Async Python, быстрый JSON, OpenAPI |
| Фоновые задачи | **Celery + Redis** | KIE.ai вызовы вынесены из request/response |
| Кеш | **Redis** | Сессии, модели, пресеты, rate-limit |
| БД | **PostgreSQL 15** | Та же схема что сейчас в Supabase |
| Файлы | **MinIO** (или Yandex Object Storage) | S3-совместимое хранилище |
| Авторизация | **JWT** (собственная) | Без зависимости от Supabase Auth |
| Real-time обновления | **WebSocket** (через FastAPI) | Замена polling каждые 2 сек |
| Хостинг | **Selectel** (или Timeweb Cloud) | Дата-центр в Москве |

---

## Конкретная логика работы

### 1. Генерация (generate)

**Было: 12 последовательных запросов за 2-5 сек**
**Стало: 1 запрос + фоновая задача, ответ за 50-150ms**

```
POST /api/v1/generate
  │
  ├─ [1] JWT проверка — из header, без запроса к БД (5ms)
  │
  ├─ [2] Валидация request body — Pydantic (1ms)
  │
  ├─ [3] Загрузка preset + model + admin_settings
  │      → Redis кеш (hit: 1ms, miss: 5ms к локальной PostgreSQL)
  │
  ├─ [4] Проверка доступа к board (если указан)
  │      → 1 SQL запрос к локальной БД (2-5ms)
  │
  ├─ [5] Резервирование кредитов
  │      → SQL функция rpc_credit_reserve (2-5ms, атомарная, с FOR UPDATE)
  │
  ├─ [6] INSERT generation (2-5ms)
  │
  ├─ [7] Celery task.delay() — отправка в очередь Redis (1ms)
  │
  └─ ОТВЕТ клиенту: { generationId, status: "queued" }

  Итого: 15-40ms (вместо 2-5 секунд)
```

**Celery Worker (фоновая задача):**

```
process_generation(generation_id, payload)
  │
  ├─ Подготовка signed URLs (если нужны) — локальный MinIO (5ms)
  │
  ├─ Вызов KIE.ai API (200-500ms) — единственный международный запрос
  │
  ├─ UPDATE generation SET provider_task_id, status = 'processing'
  │
  ├─ INSERT provider_tasks
  │
  └─ Redis PUBLISH → WebSocket уведомление клиенту
```

### 2. Отслеживание статуса

**Было: polling каждые 2 секунды (60-90 запросов за генерацию)**
**Стало: WebSocket push — 0 запросов от клиента, мгновенные обновления**

```
Вариант A: WebSocket (рекомендуемый)
──────────────────────────────────────
Клиент открывает WS: ws://api.reklamai.ru/ws?token=JWT

Celery Worker:
  │
  ├─ poll_kie_status(generation_id) — каждые 3 сек, серверный цикл
  │
  ├─ Если статус изменился:
  │    ├─ UPDATE generation в БД
  │    └─ Redis PUBLISH "status:{user_id}" → JSON
  │
  └─ FastAPI WS handler подписан на Redis → push клиенту

Клиент получает: { generationId, status, progress, previewUrl }


Вариант B: SSE (Server-Sent Events, проще)
───────────────────────────────────────────
GET /api/v1/generations/{id}/stream
  Content-Type: text/event-stream

  data: {"status":"processing","progress":30}
  data: {"status":"processing","progress":60}
  data: {"status":"succeeded","previewUrl":"..."}

Клиент: const es = new EventSource('/api/v1/generations/{id}/stream');
```

**Celery Beat (периодические задачи):**

```python
# Вместо того чтобы КАЖДЫЙ клиент поллил каждые 2 сек,
# ОДИН серверный процесс опрашивает KIE.ai для ВСЕХ активных генераций

@celery.task
def poll_active_generations():
    """Запускается каждые 3 секунды через Celery Beat."""
    active = db.query(Generation).filter(
        Generation.status.in_(['queued', 'processing'])
    ).all()

    for gen in active:
        status = kie_client.get_status(gen.provider_task_id)
        if status != gen.status:
            gen.status = status
            db.commit()
            redis.publish(f'status:{gen.user_id}', json.dumps({...}))
```

**Экономия трафика:**
- Было: N клиентов × 1 запрос/2 сек × M активных генераций
- Стало: 1 серверный процесс × 1 запрос/3 сек × M активных генераций

### 3. Авторизация

**Было: каждый запрос → Supabase Auth (150-300ms)**
**Стало: локальный JWT, 0ms на проверку**

```python
# Регистрация/логин → выдача JWT
POST /api/v1/auth/register  → bcrypt hash, INSERT user, return JWT
POST /api/v1/auth/login     → bcrypt verify, return JWT

# Каждый запрос → мгновенная проверка
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload["user_id"]
    # 0 запросов к БД, ~0.1ms
```

**Миграция существующих пользователей из Supabase:**

```sql
-- Одноразовый скрипт
INSERT INTO users (id, email, hashed_password, full_name, role, created_at)
SELECT
  id,
  email,
  encrypted_password,   -- Supabase хранит bcrypt hash
  raw_user_meta_data->>'full_name',
  COALESCE(raw_user_meta_data->>'role', 'user'),
  created_at
FROM auth.users;
```

### 4. Файловое хранилище

**Было: Supabase Storage (за границей)**
**Стало: MinIO на том же сервере или Yandex Object Storage**

```
# MinIO — S3-совместимый, бесплатный, ставится за 2 минуты
docker run -d \
  --name minio \
  -p 9000:9000 -p 9001:9001 \
  -v /data/minio:/data \
  minio/minio server /data --console-address ":9001"

# Три бакета:
# - uploads (входные файлы пользователей)
# - outputs (результаты генерации)
# - thumbnails (превью)

# Signed URLs для скачивания — идентичный API Supabase Storage
from minio import Minio
client = Minio("localhost:9000", access_key="...", secret_key="...")
url = client.presigned_get_object("outputs", path, expires=timedelta(hours=1))
```

### 5. Кеширование (Redis)

```python
# Модели, пресеты, admin_settings — меняются редко, читаются каждый запрос
# Кешируем на 5 минут

async def get_models_cached():
    cached = await redis.get("models:all")
    if cached:
        return json.loads(cached)  # 0.1ms

    models = await db.execute(select(Model).where(Model.is_active == True))
    result = [m.to_dict() for m in models.scalars()]
    await redis.setex("models:all", 300, json.dumps(result))  # TTL 5 мин
    return result

# Инвалидация — при обновлении через админку
async def update_model(model_id, data):
    await db.execute(update(Model)...)
    await redis.delete("models:all")  # Сброс кеша
```

---

## Инфраструктура

### Минимальный сервер (старт)

```
Selectel Cloud Server или Timeweb VDS:
  - CPU: 4 vCPU
  - RAM: 8 GB
  - SSD: 80 GB NVMe
  - Стоимость: ~2000-3000 руб/мес

На одном сервере:
  - Nginx (фронт + reverse proxy)
  - FastAPI (uvicorn, 4 workers)
  - PostgreSQL 15
  - Redis 7
  - Celery worker (2 процесса)
  - Celery Beat (1 процесс)
  - MinIO (файлы)
```

### Docker Compose (обновлённый)

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/var/www/html           # SPA фронтенд
      - ./certs:/etc/nginx/certs       # SSL
    depends_on:
      - api

  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    environment:
      DATABASE_URL: postgresql+asyncpg://reklamai:password@db:5432/reklamai
      REDIS_URL: redis://redis:6379/0
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: reklamai
      MINIO_SECRET_KEY: ${MINIO_SECRET}
      KIE_API_KEY: ${KIE_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }

  worker:
    build: ./backend
    command: celery -A app.worker.celery worker -c 2 --loglevel=info
    environment: *api-env  # Те же переменные
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }

  beat:
    build: ./backend
    command: celery -A app.worker.celery beat --loglevel=info
    environment: *api-env
    depends_on:
      - worker

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: reklamai
      POSTGRES_USER: reklamai
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U reklamai"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: reklamai
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET}

volumes:
  pgdata:
  minio_data:
```

### Масштабирование (когда вырастете)

```
Этап 1: Один VPS (до ~100 одновременных пользователей)
  Всё на одном сервере, 4 vCPU / 8 GB RAM

Этап 2: Разделение (100-1000 пользователей)
  VPS 1: Nginx + FastAPI + Celery
  VPS 2: PostgreSQL + Redis (managed или свой)
  Yandex Object Storage вместо MinIO

Этап 3: Горизонтальное масштабирование (1000+)
  2-3 VPS за балансировщиком (Nginx upstream / Yandex ALB)
  Managed PostgreSQL (Selectel / Yandex)
  Managed Redis (Yandex)
  CDN для статики (Yandex CDN / Selectel CDN)
```

---

## Сравнение задержек

| Операция | Сейчас (Supabase) | Новая архитектура | Ускорение |
|----------|-------------------|-------------------|-----------|
| Generate (ответ клиенту) | 2.3-4.7 сек | 50-150ms | **15-30×** |
| Status check (один) | 1.0-2.5 сек | 0ms (WebSocket push) | **∞** |
| Загрузка SPA | 300-800ms | 20-50ms | **10-15×** |
| Авторизация (JWT check) | 150-300ms | 0.1ms | **1500-3000×** |
| Загрузка моделей | 200-400ms | 1ms (Redis кеш) | **200-400×** |
| Signed URL для файла | 150-300ms | 5ms (локальный MinIO) | **30-60×** |
| Скачивание результата | 500-2000ms | 20-100ms | **10-25×** |

---

## План миграции (пошаговый)

### Фаза 1: Backend на FastAPI (1-2 недели)

1. Привести SQLAlchemy модели к текущей Supabase-схеме:
   - `profiles` вместо `users` (или адаптер)
   - Все те же таблицы: boards, board_members, presets, models, generations, assets, credit_accounts, credit_ledger, provider_tasks, admin_settings
2. Перенести кредитные SQL-функции (rpc_credit_reserve/finalize/refund) как есть
3. Реализовать API эндпоинты:
   - POST /api/v1/auth/register
   - POST /api/v1/auth/login
   - POST /api/v1/generate
   - GET /api/v1/generations/{id}
   - GET /api/v1/generations
   - GET /api/v1/credits
   - POST /api/v1/upload
   - POST /api/v1/download
   - GET /api/v1/models
   - GET /api/v1/presets
4. Celery worker для KIE.ai
5. Celery Beat для polling статусов

### Фаза 2: WebSocket + файлы (3-5 дней)

1. WebSocket endpoint для real-time обновлений
2. MinIO для файлового хранилища
3. Redis кеширование для моделей/пресетов

### Фаза 3: Фронтенд адаптация (3-5 дней)

1. Создать `api-client.ts` вместо `edge.ts`:
   - Все вызовы теперь идут на `/api/v1/...`
   - JWT хранится в httpOnly cookie или localStorage
2. Заменить Supabase Auth на собственную авторизацию
3. Заменить polling в ProgressPage на WebSocket
4. Обновить загрузку/скачивание файлов

### Фаза 4: Миграция данных (1 день)

1. Экспорт пользователей из Supabase Auth
2. Экспорт всех таблиц (pg_dump)
3. Импорт в локальную PostgreSQL
4. Миграция файлов из Supabase Storage в MinIO

### Фаза 5: Деплой (1 день)

1. Настройка VPS в Москве
2. Docker Compose up
3. SSL через Let's Encrypt + Nginx
4. DNS переключение
5. Мониторинг первые 48 часов

---

## Конфигурация Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name reklamai.ru;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # SPA фронтенд — отдаётся мгновенно с диска
    root /var/www/html;
    index index.html;

    # Статика — агрессивный кеш
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API — проксирование к FastAPI
    location /api/ {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # SPA fallback — все остальные маршруты → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Итог

Главный принцип: **данные и логика рядом с пользователем**.

Единственное что обязано ходить за границу — вызовы KIE.ai API.
Но даже они вынесены в фоновые Celery задачи, поэтому пользователь
не ждёт международного round trip.

Результат: генерация запускается за ~100ms вместо ~3 секунд,
статус приходит мгновенно через WebSocket вместо polling,
фронтенд грузится за 20-50ms вместо 300-800ms.
