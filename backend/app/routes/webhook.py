"""
ReklamAI v2.0 — Webhook Routes
Receives callbacks from KIE.ai when a generation is complete.
"""
import hashlib
import hmac
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

import logging

from app.config import get_settings
from app.database import async_session
from app.models import Generation, CreditAccount, CreditTransaction

logger = logging.getLogger("uvicorn")
router = APIRouter(prefix="/webhook", tags=["webhook"])

_settings = get_settings()


def _verify_webhook_signature(body_bytes: bytes, signature: str | None) -> bool:
    """Verify HMAC-SHA256 webhook signature if a secret is configured."""
    secret = _settings.webhook_secret
    if not secret:
        # No secret configured — skip verification (dev mode)
        return True
    if not signature:
        return False
    expected = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/kie")
async def kie_webhook(request: Request):
    """
    Вебхук от KIE.ai — вызывается когда генерация завершена.
    Обновляет статус генерации и финализирует кредиты.
    """
    body_bytes = await request.body()

    # Verify webhook signature (if WEBHOOK_SECRET is set)
    signature = request.headers.get("X-Webhook-Signature")
    if not _verify_webhook_signature(body_bytes, signature):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    try:
        import json
        body = json.loads(body_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    task_id = body.get("task_id", "")
    status = body.get("status", "")
    output = body.get("output", {})
    error = body.get("error", "")

    logger.info(f"[WEBHOOK] Received: task_id={task_id}, status={status}")

    if not task_id:
        raise HTTPException(status_code=400, detail="Missing task_id")

    async with async_session() as db:
        # Find generation by provider_task_id
        result = await db.execute(
            select(Generation).where(Generation.provider_task_id == task_id)
        )
        gen = result.scalar_one_or_none()

        if not gen:
            logger.warning(f"[WEBHOOK] Generation not found for task_id={task_id}")
            return {"ok": False, "reason": "generation_not_found"}

        # Update generation
        now = datetime.now(timezone.utc)

        if status == "completed" or status == "succeeded":
            gen.status = "succeeded"
            gen.completed_at = now
            gen.provider_response = body

            # Extract result URLs
            if isinstance(output, dict):
                gen.result_url = output.get("video_url", "") or output.get("image_url", "")
                urls = output.get("urls", [])
                if urls:
                    gen.result_urls = urls
                    gen.result_url = urls[0] if not gen.result_url else gen.result_url
                gen.thumbnail_url = output.get("thumbnail_url", "")

            # Finalize credits (refund difference if any)
            gen.credits_final = gen.credits_reserved  # same cost for now

        elif status == "failed" or status == "error":
            gen.status = "failed"
            gen.completed_at = now
            gen.error_message = error or str(body)
            gen.provider_response = body

            # Refund credits
            credit_result = await db.execute(
                select(CreditAccount).where(CreditAccount.owner_id == gen.user_id)
            )
            account = credit_result.scalar_one_or_none()
            if account and gen.credits_reserved > 0:
                account.balance += gen.credits_reserved
                account.total_spent -= gen.credits_reserved

                refund_tx = CreditTransaction(
                    account_id=account.id,
                    amount=gen.credits_reserved,
                    type="refund",
                    generation_id=gen.id,
                )
                db.add(refund_tx)

            gen.credits_final = 0

        elif status == "processing":
            gen.status = "processing"
            progress = body.get("progress", 0)
            if progress:
                gen.progress = int(progress)

        await db.commit()

    logger.info(f"[WEBHOOK] Updated generation {gen.id} -> {gen.status}")
    return {"ok": True, "generation_id": gen.id, "status": gen.status}
