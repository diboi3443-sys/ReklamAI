# Быстрое исправление ошибки 502 при генерации видео

## Шаг 1: Проверьте логи Edge Function

1. Откройте Supabase Dashboard
2. Перейдите в `Edge Functions` → `generate`
3. Откройте вкладку `Logs`
4. Найдите последний запрос с ошибкой 502
5. Проверьте:
   - Какая модель использовалась
   - Какой payload был отправлен
   - Какая ошибка от KIE API

## Шаг 2: Проверьте конфигурацию модели

Выполните в Supabase SQL Editor:

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

**Проверьте:**
- `api_family` должен быть: `veo3`, `runway`, или `luma` (НЕ `market`)
- `model_identifier` должен соответствовать идентификатору из KIE docs
- `requires_callback` должен быть `true` для специальных API

## Шаг 3: Автоматическое исправление

Выполните скрипт `supabase/migrations/20240205000002_verify_video_models.sql` в Supabase SQL Editor.

Он автоматически:
- Проверит все видео модели
- Исправит отсутствующие `api_family`
- Исправит отсутствующие `model_identifier`
- Установит `requires_callback = true` для специальных API

## Шаг 4: Проверьте права API ключа

1. Откройте https://kie.ai/api-key
2. Убедитесь, что ваш API ключ имеет доступ к:
   - **Veo3 API** (для Veo3 моделей)
   - **Runway API** (для Runway моделей)
   - **Luma API** (для Luma моделей)

## Шаг 5: Повторное тестирование

После исправления попробуйте снова создать видео. Ошибка 502 теперь будет содержать больше информации:
- `modelKey`: ключ модели
- `modelIdentifier`: идентификатор, отправленный в KIE
- `apiFamily`: семейство API
- `endpointPath`: путь endpoint
- `hint`: подсказки для решения

## Частые проблемы

### Проблема 1: api_family = 'market' для специальных моделей
**Решение:** Обновите в БД:
```sql
UPDATE models
SET capabilities = jsonb_set(capabilities, '{family}', '"veo3"')
WHERE key = 'your-model-key';
```

### Проблема 2: Неправильный model_identifier
**Решение:** Проверьте документацию KIE и обновите:
```sql
UPDATE models
SET capabilities = jsonb_set(capabilities, '{model_identifier}', '"correct-identifier"')
WHERE key = 'your-model-key';
```

### Проблема 3: requires_callback = false
**Решение:** Установите в true:
```sql
UPDATE models
SET capabilities = jsonb_set(capabilities, '{requires_callback}', 'true')
WHERE key = 'your-model-key';
```

