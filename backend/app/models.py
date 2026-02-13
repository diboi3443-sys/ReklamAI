"""
ReklamAI v2.0 — Database Models (SQLAlchemy ORM)
Works with both PostgreSQL and SQLite.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


# Use String(36) for UUIDs — works on both SQLite and PostgreSQL
GUID = String(36)



# ── Helper ──
def gen_uuid():
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════
# USER
# ═══════════════════════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), default="")
    avatar_url = Column(Text, default="")
    role = Column(String(20), default="user")  # user | admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Relations
    credit_account = relationship("CreditAccount", back_populates="user", uselist=False)
    generations = relationship("Generation", back_populates="user")
    boards = relationship("Board", back_populates="owner")


# ═══════════════════════════════════════════════════════════════
# CREDIT ACCOUNT
# ═══════════════════════════════════════════════════════════════
class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id = Column(GUID, primary_key=True, default=gen_uuid)
    owner_id = Column(GUID, ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Float, default=0.0)
    total_earned = Column(Float, default=0.0)
    total_spent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Relations
    user = relationship("User", back_populates="credit_account")
    transactions = relationship("CreditTransaction", back_populates="account")


# ═══════════════════════════════════════════════════════════════
# CREDIT TRANSACTION (ledger)
# ═══════════════════════════════════════════════════════════════
class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(GUID, primary_key=True, default=gen_uuid)
    account_id = Column(GUID, ForeignKey("credit_accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)  # positive = credit, negative = debit
    type = Column(String(30), nullable=False)  # reserve | finalize | refund | topup
    generation_id = Column(GUID, ForeignKey("generations.id"), nullable=True)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)

    # Relations
    account = relationship("CreditAccount", back_populates="transactions")


# ═══════════════════════════════════════════════════════════════
# AI MODEL
# ═══════════════════════════════════════════════════════════════
class AIModel(Base):
    __tablename__ = "models"

    id = Column(GUID, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    provider = Column(String(50), default="kie")  # kie | local | replicate
    provider_model_id = Column(String(200), default="")
    category = Column(String(50), default="image")  # image | video | voice | text
    is_active = Column(Boolean, default=True)
    price_multiplier = Column(Float, default=1.0)
    config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)

    # Relations
    generations = relationship("Generation", back_populates="model")


# ═══════════════════════════════════════════════════════════════
# PRESET
# ═══════════════════════════════════════════════════════════════
class Preset(Base):
    __tablename__ = "presets"

    id = Column(GUID, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), default="image")
    description = Column(Text, default="")
    defaults = Column(JSON, default=dict)  # { credits, aspect_ratio, duration, ... }
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════════
# BOARD
# ═══════════════════════════════════════════════════════════════
class Board(Base):
    __tablename__ = "boards"

    id = Column(GUID, primary_key=True, default=gen_uuid)
    owner_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Relations
    owner = relationship("User", back_populates="boards")


# ═══════════════════════════════════════════════════════════════
# GENERATION
# ═══════════════════════════════════════════════════════════════
class Generation(Base):
    __tablename__ = "generations"

    id = Column(GUID, primary_key=True, default=gen_uuid)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    model_id = Column(GUID, ForeignKey("models.id"), nullable=True)

    # Request
    prompt = Column(Text, default="")
    negative_prompt = Column(Text, default="")
    preset_slug = Column(String(100), default="")
    model_slug = Column(String(100), default="")
    aspect_ratio = Column(String(20), default="16:9")
    duration = Column(Integer, default=10)
    input_image_url = Column(Text, default="")
    reference_image_url = Column(Text, default="")
    params = Column(JSON, default=dict)  # extra params (seed, strength, etc.)

    # Status
    status = Column(String(30), default="queued", index=True)
    # queued | processing | succeeded | failed | cancelled
    progress = Column(Integer, default=0)  # 0-100%

    # Result
    result_url = Column(Text, default="")
    result_urls = Column(JSON, default=list)  # for batch results
    thumbnail_url = Column(Text, default="")
    error_message = Column(Text, default="")

    # Provider
    provider_task_id = Column(String(200), default="", index=True)
    provider_response = Column(JSON, default=dict)

    # Cost
    credits_reserved = Column(Float, default=0.0)
    credits_final = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime, default=_utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relations
    user = relationship("User", back_populates="generations")
    model = relationship("AIModel", back_populates="generations")
