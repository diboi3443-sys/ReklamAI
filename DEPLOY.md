# 🚀 ReklamAI v2.0 — Инструкция по деплою

## 📋 Быстрый старт

### 1. Push в GitHub

```bash
git push origin main
```

### 2. Деплой на Vercel (Frontend)

1. Зайди на [vercel.com](https://vercel.com)
2. **New Project** → Import из GitHub репозитория
3. Настройки:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (корень проекта)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables** (добавь в Vercel Dashboard):
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

5. Deploy → Frontend будет доступен на `https://your-project.vercel.app`

---

## ⚙️ Что нужно для работы

### Frontend (Vercel) — ✅ Готов после деплоя

После подключения к Vercel и добавления `VITE_API_URL` фронтенд будет работать, **НО**:
- ❌ Генерация не будет работать (нужен backend)
- ❌ Авторизация не будет работать (нужен backend)
- ✅ UI будет отображаться

### Backend (FastAPI) — Нужен отдельный хостинг

**Варианты деплоя backend:**

#### Вариант A: Railway / Render (рекомендуется для теста)

1. **Railway**:
   - Зайди на [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Выбери папку `backend/`
   - Добавь Environment Variables:
     ```
     DATABASE_URL=postgresql+asyncpg://... (Railway создаст автоматически)
     KIE_API_KEY=твой-ключ-от-kie.ai
     JWT_SECRET=случайная-строка-минимум-32-символа
     CORS_ORIGINS=https://your-project.vercel.app
     ```
   - Railway автоматически запустит `uvicorn app.main:app`

2. **Render**:
   - [render.com](https://render.com) → New Web Service
   - Connect GitHub → выбери `backend/`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables (те же, что выше)

3. Обнови `VITE_API_URL` в Vercel на URL от Railway/Render

#### Вариант B: VPS в РФ (reg.ru, ISPmanager, Timeweb и т.д.)

**Требования:**
- VPS с Ubuntu 20.04+ / Debian 11+
- Минимум 2GB RAM, 2 CPU cores
- PostgreSQL 15+ (или SQLite для теста)

**Шаги:**

1. **Подключись к VPS**:
   ```bash
   ssh root@your-vps-ip
   ```

2. **Установи зависимости**:
   ```bash
   apt update && apt install -y python3.11 python3-pip postgresql nginx git
   ```

3. **Клонируй репозиторий**:
   ```bash
   cd /var/www
   git clone https://github.com/diboi3443-sys/ReklamAI.git
   cd ReklamAI/backend
   ```

4. **Создай виртуальное окружение**:
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Настрой PostgreSQL** (или используй SQLite для теста):
   ```bash
   sudo -u postgres psql
   CREATE DATABASE reklamai_db;
   CREATE USER reklamai_user WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE reklamai_db TO reklamai_user;
   \q
   ```

6. **Создай `.env` файл**:
   ```bash
   cd /var/www/ReklamAI/backend
   cp .env.example .env
   nano .env
   ```
   
   Заполни:
   ```
   DATABASE_URL=postgresql+asyncpg://reklamai_user:your-password@localhost:5432/reklamai_db
   KIE_API_KEY=твой-ключ
   JWT_SECRET=случайная-строка-32-символа
   CORS_ORIGINS=https://your-project.vercel.app,http://your-vps-ip
   ```

7. **Запусти через systemd**:
   ```bash
   sudo nano /etc/systemd/system/reklamai-backend.service
   ```
   
   Содержимое:
   ```ini
   [Unit]
   Description=ReklamAI Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/ReklamAI/backend
   Environment="PATH=/var/www/ReklamAI/backend/venv/bin"
   ExecStart=/var/www/ReklamAI/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable reklamai-backend
   sudo systemctl start reklamai-backend
   sudo systemctl status reklamai-backend
   ```

8. **Настрой Nginx** (опционально, для HTTPS):
   ```nginx
   server {
       listen 80;
       server_name your-domain.ru;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## 🔧 Inngest (для фоновых задач генерации)

**Варианты:**

1. **Inngest Cloud** (рекомендуется):
   - Зарегистрируйся на [inngest.com](https://inngest.com)
   - Создай App → получи `INNGEST_EVENT_KEY` и `INNGEST_SIGNING_KEY`
   - Добавь в `.env` backend:
     ```
     INNGEST_EVENT_KEY=твой-ключ
     INNGEST_SIGNING_KEY=твой-signing-key
     ```
   - Inngest автоматически обнаружит функции через webhook

2. **Локальный Inngest Dev Server** (для теста):
   - На VPS запусти:
     ```bash
     docker run -p 8288:8288 inngest/inngest:latest
     ```
   - В `.env`:
     ```
     INNGEST_BASE_URL=http://localhost:8288
     INNGEST_EVENT_KEY=local
     ```

---

## ✅ Чеклист перед тестированием

- [ ] Frontend задеплоен на Vercel
- [ ] Backend задеплоен (Railway/Render/VPS)
- [ ] `VITE_API_URL` в Vercel указывает на backend URL
- [ ] `CORS_ORIGINS` в backend включает Vercel URL
- [ ] `KIE_API_KEY` добавлен в backend `.env`
- [ ] `JWT_SECRET` установлен (не дефолтный!)
- [ ] PostgreSQL/SQLite работает
- [ ] Inngest настроен (Cloud или локальный)
- [ ] Backend доступен по HTTP/HTTPS

---

## 🧪 Тестирование

1. Открой фронтенд на Vercel
2. Зарегистрируйся (создастся пользователь + кредитный аккаунт с 50 кредитами)
3. Попробуй создать генерацию:
   - Выбери модель (например, `flux-1` для изображений)
   - Введи prompt
   - Нажми Generate
4. Проверь в backend логах:
   ```bash
   sudo journalctl -u reklamai-backend -f
   ```
   Должны увидеть:
   - `[INNGEST] Starting process_generation_fn`
   - `[KIE] Sending task: model=flux-1`
   - Polling статуса

---

## 🐛 Troubleshooting

**Генерация не запускается:**
- Проверь `KIE_API_KEY` в backend
- Проверь логи Inngest (если используешь Cloud)
- Проверь, что backend доступен из интернета

**401 Unauthorized:**
- Проверь `JWT_SECRET` одинаковый на backend
- Проверь `CORS_ORIGINS` включает фронтенд URL

**Генерация зависает:**
- Проверь Inngest работает (Cloud dashboard или локальный)
- Проверь логи backend на ошибки KIE API

---

## 📝 Примечания

- **SQLite** можно использовать для теста (проще), но PostgreSQL нужен для production
- **Inngest Cloud** бесплатен до 25K событий/месяц
- **VPS в РФ**: reg.ru, timeweb.ru, beget.ru поддерживают все нужные технологии
- **HTTPS**: используй Let's Encrypt через certbot для VPS
