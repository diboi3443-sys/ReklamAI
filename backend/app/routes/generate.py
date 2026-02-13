"""
ReklamAI v2.0 — Generation Routes
Create, list, and check status of AI generations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models import User, Generation, CreditAccount, CreditTransaction, AIModel, Preset
from app.schemas import (
    GenerateRequest, GenerationResponse, GenerationListResponse,
    CreditBalanceResponse, AIModelResponse, PresetResponse,
)
from app.auth import get_current_user
from app.rate_limit import rate_limit_generate
from app.inngest_client import inngest_client
import inngest

router = APIRouter(prefix="/api", tags=["generation"])


# ── Credits ──
@router.get("/credits", response_model=CreditBalanceResponse)
async def get_credits(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить баланс кредитов."""
    result = await db.execute(
        select(CreditAccount).where(CreditAccount.owner_id == user.id)
    )
    account = result.scalar_one_or_none()
    if not account:
        return CreditBalanceResponse(balance=0, total_earned=0, total_spent=0)
    return CreditBalanceResponse(
        balance=account.balance,
        total_earned=account.total_earned,
        total_spent=account.total_spent,
    )


# ── Generate ──
@router.post("/generate", response_model=GenerationResponse, status_code=201)
async def create_generation(
    req: GenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rl=Depends(rate_limit_generate),
):
    """Создать новую генерацию (фото/видео/голос/текст)."""

    # 1. Estimate cost based on model's price_multiplier
    estimated_cost = 1.0  # base cost
    ai_model = None
    if req.model_slug:
        model_result = await db.execute(
            select(AIModel).where(AIModel.slug == req.model_slug)
        )
        ai_model = model_result.scalar_one_or_none()
        if ai_model:
            estimated_cost = ai_model.price_multiplier
        else:
            # Model not found in DB — use fallback
            estimated_cost = 5.0

    # 2. Lock and check credits (SELECT ... FOR UPDATE prevents race conditions)
    result = await db.execute(
        select(CreditAccount)
        .where(CreditAccount.owner_id == user.id)
        .with_for_update()
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=402, detail="Кредитный аккаунт не найден")

    if account.balance < estimated_cost:
        raise HTTPException(
            status_code=402,
            detail=f"Недостаточно кредитов. Нужно: {estimated_cost}, Баланс: {account.balance}",
        )

    # 3. Reserve credits (row is locked, safe from concurrent writes)
    account.balance -= estimated_cost
    account.total_spent += estimated_cost

    tx = CreditTransaction(
        account_id=account.id,
        amount=-estimated_cost,
        type="reserve",
    )
    db.add(tx)

    # 3. Create generation record
    generation = Generation(
        user_id=user.id,
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        preset_slug=req.preset_slug,
        model_slug=req.model_slug,
        aspect_ratio=req.aspect_ratio,
        duration=req.duration,
        input_image_url=req.input_image_url,
        reference_image_url=req.reference_image_url,
        params=req.params,
        status="queued",
        credits_reserved=estimated_cost,
    )
    db.add(generation)
    await db.flush()

    # Link transaction to generation
    tx.generation_id = generation.id

    await db.commit()
    await db.refresh(generation)

    # 4. Build KIE payload using the model's provider_model_id
    kie_model_id = req.model_slug or "kling-v2"
    if req.model_slug:
        # Try to use the provider_model_id from the DB model
        if not ai_model:
            model_result2 = await db.execute(
                select(AIModel).where(AIModel.slug == req.model_slug)
            )
            ai_model = model_result2.scalar_one_or_none()
        if ai_model and ai_model.provider_model_id:
            kie_model_id = ai_model.provider_model_id

    kie_payload = {
        "model": kie_model_id,
        "input": {
            "prompt": req.prompt,
            "negative_prompt": req.negative_prompt,
            "aspect_ratio": req.aspect_ratio,
            "duration": str(req.duration),
        },
    }
    # Remove empty values
    kie_payload["input"] = {k: v for k, v in kie_payload["input"].items() if v}

    if req.input_image_url:
        kie_payload["input"]["image_url"] = req.input_image_url
    if req.reference_image_url:
        kie_payload["input"]["image_reference_url"] = req.reference_image_url

    await inngest_client.send(inngest.Event(
        name="reklamai/generation.requested",
        data={
            "generation_id": generation.id,
            "payload": kie_payload,
        },
    ))

    return GenerationResponse.model_validate(generation)


# ── Status ──
@router.get("/generations/{generation_id}", response_model=GenerationResponse)
async def get_generation(
    generation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить статус генерации по ID."""
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Генерация не найдена")
    return GenerationResponse.model_validate(gen)


# ── List ──
@router.get("/generations", response_model=GenerationListResponse)
async def list_generations(
    limit: int = 20,
    offset: int = 0,
    status: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список генераций пользователя."""
    query = select(Generation).where(Generation.user_id == user.id)

    if status:
        query = query.where(Generation.status == status)

    query = query.order_by(desc(Generation.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    items = result.scalars().all()

    # Count total
    from sqlalchemy import func
    count_q = select(func.count()).select_from(Generation).where(Generation.user_id == user.id)
    if status:
        count_q = count_q.where(Generation.status == status)
    count_res = await db.execute(count_q)
    total = count_res.scalar()

    return GenerationListResponse(
        items=[GenerationResponse.model_validate(g) for g in items],
        total=total,
    )


# ── Models (public) ──────────────────────────────────
@router.get("/models", response_model=list[AIModelResponse])
async def list_models(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Return all active AI models (public, no auth required)."""
    query = select(AIModel).where(AIModel.is_active == True)
    if category:
        query = query.where(AIModel.category == category)
    query = query.order_by(AIModel.name)
    result = await db.execute(query)
    return [AIModelResponse.model_validate(m) for m in result.scalars().all()]


# ── Presets (public) ──────────────────────────────────
@router.get("/presets", response_model=list[PresetResponse])
async def list_presets(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Return all active presets (public, no auth required)."""
    query = select(Preset).where(Preset.is_active == True)
    if category:
        query = query.where(Preset.category == category)
    query = query.order_by(Preset.name)
    result = await db.execute(query)
    return [PresetResponse.model_validate(p) for p in result.scalars().all()]
