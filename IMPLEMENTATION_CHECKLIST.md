# ✅ ЧЕКЛИСТ: Что нужно для реализации функций Higgsfield

## 🔧 1. ИНСТРУМЕНТЫ И БИБЛИОТЕКИ

### Backend (Python)

#### Уже установлено ✅:
- FastAPI
- SQLAlchemy (async)
- Pydantic
- httpx
- Inngest SDK
- python-jose (JWT)
- bcrypt

#### Нужно добавить:

```bash
# Feature Extraction (для Reference Anchor)
opencv-python>=4.8.0          # Обработка изображений
mediapipe>=0.10.0              # Face landmarks, pose detection
pillow>=10.0.0                # Работа с изображениями
numpy>=1.24.0                 # Математические операции

# Machine Learning (опционально, для Soul ID)
torch>=2.0.0                   # PyTorch (если собственная модель)
transformers>=4.30.0           # Hugging Face (если собственная модель)
diffusers>=0.21.0              # Stable Diffusion (если собственная модель)

# Video Processing (для Multi-Shot, Transitions)
ffmpeg-python>=0.2.0          # Обёртка для FFmpeg
moviepy>=1.0.3                # Видео обработка (альтернатива)

# Vector Database (опционально, для Soul ID embeddings)
pgvector>=0.2.0               # Если используем PostgreSQL с векторами

# Image Processing
scikit-image>=0.21.0          # Дополнительная обработка изображений

# Utilities
python-multipart>=0.0.6       # Загрузка файлов (если ещё нет)
aiofiles>=23.0.0              # Асинхронная работа с файлами
```

**Установка:**
```bash
cd backend
pip install opencv-python mediapipe pillow numpy ffmpeg-python moviepy python-multipart aiofiles
# Опционально:
pip install torch transformers diffusers pgvector scikit-image
```

---

### Frontend (TypeScript/React)

#### Уже установлено ✅:
- React 18
- Vite
- shadcn/ui компоненты
- react-router-dom
- framer-motion

#### Нужно добавить:

```bash
# Canvas для рисования (Inpaint, Draw to Video)
npm install react-canvas-draw fabric
npm install @types/fabric --save-dev

# Image Processing (клиентская сторона)
npm install react-image-crop
npm install file-saver  # Для скачивания файлов

# Video Player (лучший предпросмотр)
npm install react-player

# Drag and Drop (загрузка файлов)
npm install react-dropzone

# Image Gallery (для Soul ID training images)
npm install react-image-gallery
```

**Установка:**
```bash
npm install react-canvas-draw fabric react-image-crop file-saver react-player react-dropzone react-image-gallery
npm install @types/fabric --save-dev
```

---

## 🗄️ 2. БАЗА ДАННЫХ

### Миграции Alembic

**Создать новые таблицы:**
```bash
cd backend
alembic revision --autogenerate -m "add_reference_anchors"
alembic revision --autogenerate -m "add_soul_ids"
alembic revision --autogenerate -m "add_camera_presets"
alembic revision --autogenerate -m "add_multi_shot_generations"
```

**Структура новых таблиц** (см. `HIGGSFIELD_ANALYSIS.md`):
- `reference_anchors` - Reference Anchor System
- `soul_ids` - Soul ID System
- `multi_references` - Multi-Reference System
- `camera_presets` - Virtual Camera System
- `multi_shot_generations` - Multi-Shot Generation

**Расширить существующие:**
- `generations` - добавить поля для keyframes, audio, resolution

---

## 🔑 3. API КЛЮЧИ И СЕРВИСЫ

### Обязательные (уже есть):
- ✅ KIE.ai API Key (`KIE_API_KEY`)
- ✅ Inngest Event Key (`INNGEST_EVENT_KEY`)

### Нужно получить (опционально):

#### Вариант A: Готовые API (быстрее, но платно)
```bash
# Feature Extraction
FACE_PLUS_PLUS_API_KEY=...      # Face++ для face detection
# Или
AWS_ACCESS_KEY_ID=...            # AWS Rekognition
AWS_SECRET_ACCESS_KEY=...

# Training (Soul ID)
REPLICATE_API_TOKEN=...          # Replicate для LoRA training

# Video/Audio
RUNWAY_API_KEY=...               # Runway API (если KIE.ai не поддерживает)
KLING_API_KEY=...                # Kling API напрямую
ELEVENLABS_API_KEY=...           # ElevenLabs для синтеза речи
```

#### Вариант B: Собственные модели (сложнее, но бесплатно)
- Установить PyTorch
- Скачать модели с Hugging Face
- Развернуть на GPU сервере

---

## 💾 4. ХРАНИЛИЩЕ (STORAGE)

### Вариант A: Локальное хранилище (для разработки)
```bash
# Создать директории
mkdir -p backend/uploads/anchors
mkdir -p backend/uploads/soul_ids
mkdir -p backend/uploads/generations
mkdir -p backend/uploads/training_images
```

**Настройка в `.env`:**
```bash
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

### Вариант B: S3 (для продакшена)
```bash
# AWS S3
AWS_S3_BUCKET=reklamai-uploads
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Или другой S3-совместимый (MinIO, DigitalOcean Spaces)
```

**Библиотека:**
```bash
pip install boto3  # Для AWS S3
# Или
pip install minio  # Для MinIO
```

---

## 🎬 5. FFMPEG (для видео обработки)

### Установка на сервере:

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Docker:**
```dockerfile
# В Dockerfile добавить:
RUN apt-get update && apt-get install -y ffmpeg
```

**Проверка:**
```bash
ffmpeg -version
```

---

## 🧪 6. ТЕСТИРОВАНИЕ

### Проверить возможности KIE.ai:

**Создать скрипт:** `backend/scripts/test_kie_capabilities.py`

```python
# Проверить:
# 1. Поддерживает ли keyframe interpolation?
# 2. Поддерживает ли audio generation?
# 3. Поддерживает ли face training?
# 4. Какие параметры принимает extra_params?
```

**Запустить:**
```bash
cd backend
python scripts/test_kie_capabilities.py
```

---

## 📁 7. СТРУКТУРА ПРОЕКТА

### Новые директории:

```bash
backend/
├── app/
│   ├── routes/
│   │   ├── anchors.py          # Reference Anchor API
│   │   ├── soul_ids.py         # Soul ID API
│   │   ├── camera.py           # Camera Presets API
│   │   └── multi_shot.py       # Multi-Shot API
│   ├── services/
│   │   ├── feature_extraction.py  # Извлечение признаков
│   │   ├── training.py            # Soul ID training
│   │   └── video_processing.py    # FFmpeg обработка
│   └── utils/
│       ├── face_detection.py      # Face landmarks
│       └── image_processing.py    # Обработка изображений
├── uploads/                      # Локальное хранилище
│   ├── anchors/
│   ├── soul_ids/
│   └── training_images/
└── scripts/
    └── test_kie_capabilities.py

frontend/
├── src/
│   ├── components/
│   │   ├── anchors/
│   │   │   ├── AnchorManager.tsx
│   │   │   └── AnchorSelector.tsx
│   │   ├── soul-id/
│   │   │   ├── SoulIDTrainer.tsx
│   │   │   └── SoulIDGallery.tsx
│   │   ├── camera/
│   │   │   └── CameraSettings.tsx
│   │   └── multi-shot/
│   │       └── StoryboardEditor.tsx
│   └── lib/
│       ├── anchors.ts           # Anchor API client
│       ├── soul-id.ts           # Soul ID API client
│       └── video.ts             # Video utilities
```

---

## 🔐 8. ENVIRONMENT VARIABLES

### Добавить в `.env`:

```bash
# Feature Extraction
FEATURE_EXTRACTION_PROVIDER=mediapipe  # mediapipe | faceplusplus | aws

# Face++ (если используем)
FACE_PLUS_PLUS_API_KEY=
FACE_PLUS_PLUS_API_SECRET=

# AWS Rekognition (если используем)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Training (Soul ID)
TRAINING_PROVIDER=replicate  # replicate | local
REPLICATE_API_TOKEN=

# Storage
STORAGE_TYPE=local  # local | s3
STORAGE_PATH=./uploads
AWS_S3_BUCKET=
AWS_S3_REGION=

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg  # Путь к FFmpeg

# Vector Database (опционально)
USE_VECTOR_DB=false  # true | false
VECTOR_DB_URL=postgresql+asyncpg://...
```

---

## 🚀 9. DEPLOYMENT ИНФРАСТРУКТУРА

### Для продакшена:

1. **GPU сервер** (если используем собственные модели):
   - NVIDIA GPU с CUDA
   - PyTorch с CUDA support

2. **FFmpeg на сервере**:
   - Установить на VPS
   - Проверить доступность в Docker

3. **Storage**:
   - S3 bucket или локальное хранилище с бэкапами
   - CDN для быстрой доставки контента

4. **Background Jobs**:
   - Inngest уже настроен ✅
   - Добавить новые функции в `inngest_client.py`

---

## 📝 10. ДОКУМЕНТАЦИЯ

### Создать:

1. **API Documentation** (Swagger/OpenAPI):
   - Автоматически через FastAPI ✅
   - Добавить описания новых endpoints

2. **User Guide**:
   - Как создать Reference Anchor
   - Как тренировать Soul ID
   - Как использовать Multi-Shot

3. **Developer Guide**:
   - Архитектура системы
   - Как добавить новую модель
   - Как расширить функционал

---

## ✅ БЫСТРЫЙ СТАРТ (Минимальный набор)

### Для начала работы достаточно:

1. **Установить библиотеки:**
```bash
# Backend
cd backend
pip install opencv-python mediapipe pillow numpy ffmpeg-python python-multipart aiofiles

# Frontend
npm install react-canvas-draw react-dropzone react-player
```

2. **Создать миграции:**
```bash
cd backend
alembic revision --autogenerate -m "add_reference_anchors"
alembic revision --autogenerate -m "add_soul_ids"
alembic upgrade head
```

3. **Создать директории:**
```bash
mkdir -p backend/uploads/{anchors,soul_ids,training_images}
```

4. **Добавить в `.env`:**
```bash
STORAGE_TYPE=local
STORAGE_PATH=./uploads
FEATURE_EXTRACTION_PROVIDER=mediapipe
```

5. **Проверить FFmpeg:**
```bash
ffmpeg -version
```

---

## 🎯 ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ

### Неделя 1: Подготовка
- [ ] Установить все библиотеки
- [ ] Создать миграции БД
- [ ] Настроить storage
- [ ] Проверить FFmpeg
- [ ] Протестировать возможности KIE.ai

### Неделя 2-3: Reference Anchor
- [ ] Создать таблицу `reference_anchors`
- [ ] Реализовать feature extraction (MediaPipe)
- [ ] Backend API для anchors
- [ ] Frontend компонент

### Неделя 4-5: Multi-Reference
- [ ] Расширить систему для нескольких референсов
- [ ] UI для выбора референсов

### Неделя 6-9: Soul ID
- [ ] Создать таблицу `soul_ids`
- [ ] Реализовать training pipeline
- [ ] Backend API
- [ ] Frontend компонент

---

## ❓ ВОПРОСЫ ДЛЯ ПРИНЯТИЯ РЕШЕНИЙ

1. **Feature Extraction:**
   - MediaPipe (бесплатно, локально) ✅ Рекомендую
   - Face++ API (платно, но точнее)
   - AWS Rekognition (платно, масштабируемо)

2. **Training (Soul ID):**
   - Replicate API (быстро, но платно)
   - Собственная модель (сложно, но бесплатно)

3. **Storage:**
   - Локальное (для dev) ✅ Начать с этого
   - S3 (для prod) ✅ Перейти позже

4. **Vector DB:**
   - JSON в PostgreSQL (проще) ✅ Начать с этого
   - pgvector (быстрее для поиска) ✅ Перейти позже

---

## 📞 СЛЕДУЮЩИЕ ШАГИ

1. **Решить:** Какие API использовать (MediaPipe vs Face++, Replicate vs собственная модель)
2. **Установить:** Минимальный набор библиотек
3. **Создать:** Миграции БД
4. **Начать:** Reference Anchor System (Фаза 1)

---

**Готов начать?** Скажи, с чего начинаем! 🚀
