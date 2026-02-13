# ReklamAI v2.0

AI-powered content generation platform for images, videos, and audio using KIE.ai API.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python) + SQLAlchemy + Inngest (background jobs)
- **Database**: PostgreSQL / SQLite
- **AI Provider**: [KIE.ai](https://kie.ai) Market API

## ✨ Features

- 🎨 **21 AI Models**: 9 image, 9 video, 3 audio models
- 💳 **Credit System**: Reserve, finalize, refund with transaction ledger
- 🔐 **JWT Auth**: Secure authentication with bcrypt password hashing
- ⚡ **Background Processing**: Inngest handles long-running generation tasks
- 🌍 **i18n**: Russian and English support
- 🎨 **Themes**: Dark/Light mode
- 📱 **Responsive**: Mobile-first design

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ (or SQLite for dev)

### Local Development

1. **Clone and install**:
   ```bash
   git clone https://github.com/diboi3443-sys/ReklamAI.git
   cd ReklamAI
   npm install
   ```

2. **Backend setup**:
   ```bash
   cd backend
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your KIE_API_KEY
   uvicorn app.main:app --reload
   ```

3. **Frontend setup**:
   ```bash
   # In project root
   cp .env.example .env
   # Edit .env: VITE_API_URL=http://localhost:8000
   npm run dev
   ```

4. **Inngest (for background jobs)**:
   ```bash
   docker run -p 8288:8288 inngest/inngest:latest
   ```

## 📚 Documentation

- **[DEPLOY.md](./DEPLOY.md)** — Full deployment guide (Vercel, Railway, VPS in Russia)
- **[.env.example](./.env.example)** — Environment variables reference

## 🎯 Supported Models

### Image Models
- FLUX.1, Flux 2, Flux Kontext
- SDXL, Seedream 3.0
- GPT Image (4o), Ideogram, Recraft V3, Grok Imagine

### Video Models
- Kling v2, Kling v2 Pro
- Runway Gen-4 Turbo, Gen-3a Turbo
- Luma Ray 2, Veo 3
- Seedance 1.0, Wan 2.1, Hailuo

### Audio Models
- ElevenLabs TTS, ElevenLabs Sound FX
- Suno V4 Music

## 🔧 Configuration

See [DEPLOY.md](./DEPLOY.md) for production deployment instructions.

**Required Environment Variables:**
- `KIE_API_KEY` — Your KIE.ai API key
- `JWT_SECRET` — Random string for JWT signing
- `DATABASE_URL` — PostgreSQL connection string
- `VITE_API_URL` — Backend API URL (for frontend)

## 📝 License

Private project — All rights reserved
