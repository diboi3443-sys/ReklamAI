"""
ReklamAI v2.0 — Pydantic Schemas (Request / Response)
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ═══════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════
# CREDITS
# ═══════════════════════════════════════════════════
class CreditBalanceResponse(BaseModel):
    balance: float
    total_earned: float
    total_spent: float


# ═══════════════════════════════════════════════════
# GENERATION
# ═══════════════════════════════════════════════════
class GenerateRequest(BaseModel):
    prompt: str = ""
    negative_prompt: str = ""
    preset_slug: str = ""
    model_slug: str = ""
    aspect_ratio: str = "16:9"
    duration: int = 10
    input_image_url: str = ""
    reference_image_url: str = ""
    params: dict = {}


class GenerationResponse(BaseModel):
    id: str
    status: str
    prompt: str
    progress: int
    result_url: str
    result_urls: list
    thumbnail_url: str
    error_message: str
    credits_reserved: float
    credits_final: float
    preset_slug: str = ""
    model_slug: str = ""
    aspect_ratio: str = "16:9"
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GenerationListResponse(BaseModel):
    items: List[GenerationResponse]
    total: int


# ═══════════════════════════════════════════════════
# MODEL
# ═══════════════════════════════════════════════════
class AIModelResponse(BaseModel):
    id: str
    name: str
    slug: str
    provider: str = "kie"
    provider_model_id: str = ""
    category: str
    is_active: bool
    price_multiplier: float
    config: dict = {}

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════
# PRESET
# ═══════════════════════════════════════════════════
class PresetResponse(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    description: str
    defaults: dict = {}
    is_active: bool

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════
# WEBHOOK (from KIE.ai)
# ═══════════════════════════════════════════════════
class WebhookPayload(BaseModel):
    task_id: str
    status: str
    output: Optional[dict] = None
    error: Optional[str] = None


# ═══════════════════════════════════════════════════
# BOARD
# ═══════════════════════════════════════════════════
class BoardCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""


class BoardResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    is_pinned: bool
    items_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
