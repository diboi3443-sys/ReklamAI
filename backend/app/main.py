"""
ReklamAI v2.0 — Main Application
FastAPI server entry point. Registers all routers and startup events.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routes.auth import router as auth_router
from app.routes.generate import router as generate_router
from app.routes.webhook import router as webhook_router
from app.routes.boards import router as boards_router
from app.routes.files import router as files_router
from app.inngest_client import inngest_client, process_generation_fn
import inngest.fast_api

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    # Create tables on startup (dev only; use Alembic in production).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅  DB tables created / verified")

    # Seed models & presets (idempotent)
    from app.seed import seed_database
    from app.database import async_session
    async with async_session() as db:
        await seed_database(db)

    yield
    # Shutdown
    await engine.dispose()
    print("🛑  DB connection closed")


app = FastAPI(
    title="ReklamAI API",
    description="Backend for ReklamAI 2.0 (RF Stable Edition)",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──
_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True if "*" not in _origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth_router)
app.include_router(generate_router)
app.include_router(webhook_router)
app.include_router(boards_router)
app.include_router(files_router)

# ── Inngest ──
inngest.fast_api.serve(app, inngest_client, [process_generation_fn])


# ── Root ──
@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "2.0.0",
        "status": "running 🚀",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
