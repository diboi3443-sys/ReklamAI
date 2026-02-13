# Отладка ошибки 502 при генерации видео

## Проблема
Ошибка `502 Bad Gateway` при попытке генерации видео через Edge Function `generate`.

## Возможные причины

### 1. Неправильная конфигурация модели в БД
Проверьте в Supabase SQL Editor:
```sql
SELECT 
  key,
  title,
  capabilities->>'family' as api_family,
  capabilities->>'model_identifier' as model_identifier,
  capabilities->>'requires_callback' as requires_callback
FROM models
WHERE modality = 'video' 
  AND provider = 'kie'
  AND is_enabled = true;
```

**Требования:**
- `api_family` должен быть: `veo3`, `runway`, `luma` (НЕ `market`)
- `model_identifier` должен соответствовать идентификатору из KIE docs
- `requires_callback` должен быть `true` для специальных API

### 2. Неправильный endpoint
Проверьте, что endpoint соответствует API family:
- Veo3: `/api/v1/veo/generate`
- Runway: `/api/v1/runway/generate`
- Luma: `/api/v1/modify/generate`

### 3. Неправильный payload
Проверьте логи Edge Function в Supabase Dashboard:
- Откройте `Edge Functions` → `generate` → `Logs`
- Найдите запрос с ошибкой
- Проверьте `Request body` и `Response`

### 4. Проблемы с API ключом
Проверьте права API ключа:
- Откройте https://kie.ai/api-key
- Убедитесь, что ключ имеет доступ к:
  - Market API (для обычных моделей)
  - Veo3 API (для Veo3)
  - Runway API (для Runway)
  - Luma API (для Luma)

## Как проверить

### 1. Проверка конфигурации модели
```sql
-- Найдите модель, которая не работает
SELECT * FROM models WHERE key = 'your-model-key';

-- Проверьте capabilities
SELECT 
  key,
  capabilities
FROM models
WHERE modality = 'video';
```

### 2. Проверка логов Edge Function
1. Откройте Supabase Dashboard
2. Перейдите в `Edge Functions` → `generate`
3. Откройте вкладку `Logs`
4. Найдите последний запрос с ошибкой
5. Проверьте:
   - Request body (какой payload отправлен)
   - Response (какая ошибка от KIE API)
   - Console logs (детальная информация)

### 3. Тестирование через скрипт
Запустите тестовый скрипт:
```bash
npm run test:video
```

## Решения

### Решение 1: Обновить конфигурацию модели
Если `api_family` неправильный:
```sql
UPDATE models
SET capabilities = jsonb_set(
  capabilities,
  '{family}',
  '"veo3"'  -- или 'runway', 'luma'
)
WHERE key = 'your-model-key';
```

### Решение 2: Проверить model_identifier
Убедитесь, что `model_identifier` правильный:
- Veo3: `veo3` или `veo-3`
- Runway: `gen3a_turbo`, `gen4_turbo`
- Luma: `dream-machine`, `ray-2`

### Решение 3: Проверить payload
Убедитесь, что payload правильный для каждого API:
- Veo3: `{ model: "veo3", prompt: "...", aspect_ratio: "...", duration: ... }`
- Runway: `{ model: "gen3a_turbo", prompt: "...", image: "...", duration: ... }`
- Luma: `{ model: "dream-machine", prompt: "...", imageUrl: "...", aspect_ratio: "..." }`

## Детальная информация об ошибке

После обновления Edge Function, ошибка 502 теперь включает:
- `modelKey`: ключ модели из БД
- `modelIdentifier`: идентификатор, отправленный в KIE
- `apiFamily`: семейство API
- `endpointPath`: путь endpoint
- `hint`: подсказки для решения

Проверьте эти поля в ответе ошибки для точной диагностики.
