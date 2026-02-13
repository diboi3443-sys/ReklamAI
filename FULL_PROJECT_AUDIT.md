# Полный аудит проекта ReklamAI

## 🔍 Найденные проблемы и слабые места

### 1. Конфигурация видео-моделей в БД
**Проблема**: Видео-модели могут иметь неправильную конфигурацию `capabilities`.

**Требования для видео-моделей**:
```json
{
  "family": "veo3|runway|luma",  // НЕ "market" для специальных API
  "model_identifier": "correct-kie-identifier",
  "requires_callback": true
}
```

**Решение**: Выполнить SQL миграцию `20240205000002_verify_video_models.sql`

---

### 2. Status Endpoint для специальных API
**Проблема**: В `status/index.ts` (строка 160) всегда используется `MARKET_ENDPOINTS.statusPath`:
```typescript
const statusEndpointPath = MARKET_ENDPOINTS.statusPath;
```

**Почему это может работать**: Market API `/api/v1/jobs/recordInfo` может работать для всех моделей, так как KIE хранит все задачи в единой системе.

**Рекомендация**: Оставить как есть (Market API для статуса более надежен).

---

### 3. Environment Variables / Secrets

**Обязательные переменные в Supabase Edge Functions**:
- `SUPABASE_URL` - URL Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key
- `KIE_API_KEY` - API ключ KIE.ai
- `KIE_BASE_URL` (опционально) - по умолчанию `https://api.kie.ai`

**Проверка в Supabase Dashboard**:
1. Settings → Edge Functions → Secrets
2. Убедитесь, что все переменные установлены

---

### 4. Права API ключа KIE.ai

**Проблема**: API ключ может не иметь доступа к специальным API.

**Проверка**: https://kie.ai/api-key
- Market API ✓
- Veo3 API ✓ (для Veo3 моделей)
- Runway API ✓ (для Runway моделей)
- Luma API ✓ (для Luma моделей)

---

### 5. RLS Policies для таблицы assets

**Потенциальная проблема**: При создании asset записи может быть ошибка из-за RLS.

**Проверка**: В логах Edge Function ищите:
```
[STATUS] ❌ Failed to create asset record
```

**Решение**: Убедитесь, что service_role может создавать assets.

---

## ✅ Что работает правильно

### 1. Edge Functions структура
- `generate` - правильно создает задачи и резервирует кредиты
- `status` - правильно проверяет статус и скачивает результаты
- `download` - правильно создает signed URLs

### 2. KIE API интеграция
- Endpoints правильно настроены для всех API families
- Payload builder создает правильные payload для каждого типа модели
- KIE Client обрабатывает разные форматы ответов

### 3. Frontend интеграция
- `edge.ts` правильно вызывает Edge Functions
- `WorkspacePage.tsx` правильно обрабатывает генерацию
- `models.ts` правильно загружает модели из БД

### 4. CORS
- Все Edge Functions имеют правильные CORS headers

---

## 📋 Чеклист перед деплоем

### 1. База данных
- [ ] Выполнить `20240205000000_fix_key_column_and_video_models.sql`
- [ ] Выполнить `20240205000002_verify_video_models.sql`
- [ ] Проверить, что видео-модели имеют правильный `family`

### 2. Supabase Edge Functions
- [ ] Secrets установлены: `KIE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Edge Functions развернуты: `supabase functions deploy --all`

### 3. KIE.ai
- [ ] API ключ имеет доступ к нужным API
- [ ] Баланс на аккаунте достаточный

### 4. Frontend
- [ ] `VITE_SUPABASE_URL` установлен
- [ ] `VITE_SUPABASE_ANON_KEY` установлен
- [ ] Сборка выполнена: `npm run build`

---

## 🔧 SQL для проверки моделей

```sql
-- Проверить все видео модели
SELECT 
  key,
  title,
  capabilities->>'family' as api_family,
  capabilities->>'model_identifier' as model_identifier,
  capabilities->>'requires_callback' as requires_callback,
  is_enabled
FROM models
WHERE modality = 'video' 
  AND provider = 'kie'
ORDER BY key;

-- Проверить модели без family
SELECT key, title, capabilities
FROM models
WHERE modality = 'video' 
  AND provider = 'kie'
  AND (capabilities->>'family' IS NULL OR capabilities->>'family' = '');

-- Проверить модели без model_identifier
SELECT key, title, capabilities
FROM models
WHERE provider = 'kie'
  AND (capabilities->>'model_identifier' IS NULL OR capabilities->>'model_identifier' = '');
```

---

## 🚀 Команды для деплоя

### 1. Deploy Edge Functions
```bash
cd /Users/gg/Desktop/ReklamAI-Final
npx supabase functions deploy generate --no-verify-jwt
npx supabase functions deploy status --no-verify-jwt
npx supabase functions deploy download --no-verify-jwt
npx supabase functions deploy upload --no-verify-jwt
npx supabase functions deploy provider-webhook --no-verify-jwt
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Deploy to server
Загрузить содержимое папки `deploy-ready/` в `public_html/`

---

## 🐛 Отладка

### Логи Edge Functions
1. Supabase Dashboard → Edge Functions → [function] → Logs
2. Ищите:
   - `[GENERATE]` - логи генерации
   - `[STATUS]` - логи статуса
   - `[KIE]` - логи KIE API

### Типичные ошибки

**502 Bad Gateway**:
- Проверьте логи Edge Function
- Проверьте `api_family` модели
- Проверьте `model_identifier`

**400 Bad Request**:
- Проверьте PostgREST запросы
- Убедитесь, что `key` убран из select

**422 Model not supported**:
- Проверьте `model_identifier` в БД
- Проверьте права API ключа
