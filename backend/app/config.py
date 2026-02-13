"""
ReklamAI v2.0 — Configuration
Loads settings from environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ──
    app_name: str = "ReklamAI API"
    debug: bool = False
    secret_key: str = "change-me-in-production"

    # ── Database ──
    database_url: str = "postgresql+asyncpg://reklamai_user:reklamai_password@db:5432/reklamai_db"

    # ── Inngest ──
    inngest_event_key: str = "local"  # Required for Inngest Cloud (production)
    inngest_signing_key: str = ""  # Required for Inngest Cloud (production)
    inngest_base_url: str | None = None  # Optional, for local dev

    # ── Auth (JWT) ──
    jwt_secret: str = "super-secret-jwt-key-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # ── KIE.ai ──
    kie_api_key: str = ""
    kie_base_url: str = "https://api.kie.ai"

    # ── Supabase (Legacy, for migration period) ──
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    # Warn about critical missing configuration
    import logging
    logger = logging.getLogger("uvicorn")
    if not s.kie_api_key:
        logger.warning("⚠️  KIE_API_KEY not set — AI generations will fail!")
    if s.jwt_secret == "super-secret-jwt-key-change-me":
        logger.warning("⚠️  JWT_SECRET is default — change for production!")
    return s
