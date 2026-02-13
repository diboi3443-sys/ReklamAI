"""
ReklamAI v2.0 — Inngest Client
Background task processing for video/image generation using Inngest.
"""
import logging
import httpx
import inngest
import inngest.fast_api
from datetime import datetime, timezone

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("uvicorn")

# ── Inngest Client ──
inngest_client = inngest.Inngest(
    app_id="reklamai",
    event_key=settings.inngest_event_key or "local",
    event_api_base_url=settings.inngest_base_url,
    logger=logger,
    is_production=not settings.debug,
)


# ── Generation Function ──
@inngest_client.create_function(
    fn_id="process-generation",
    trigger=inngest.TriggerEvent(event="reklamai/generation.requested"),
    retries=3,
)
async def process_generation_fn(
    ctx: inngest.Context,
) -> dict:
    step = ctx.step
    logger.info("[INNGEST] Starting process_generation_fn")
    try:
        logger.info(f"[INNGEST] Event data keys: {list(ctx.event.data.keys())}")
        generation_id = ctx.event.data["generation_id"]
        payload = ctx.event.data.get("payload", {})

        logger.info(f"[INNGEST] Processing generation {generation_id}")

        # Step 1: Send to KIE.ai
        async def call_kie() -> dict:
            kie_base = settings.kie_base_url
            kie_key = settings.kie_api_key
            headers = {
                "Authorization": f"Bearer {kie_key}",
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{kie_base}/api/v1/jobs/createTask",
                    json=payload,
                    headers=headers,
                )

            if response.status_code != 200:
                raise Exception(f"KIE error: {response.status_code} — {response.text}")

            data = response.json()
            logger.info(f"[INNGEST] KIE response: {data}")
            
            # Extract task_id using various possible keys
            task_id = data.get("taskId") or data.get("task_id") or data.get("id")
            if not task_id and "data" in data:
                task_id = data["data"].get("taskId") or data["data"].get("id")
            
            # Ensure we return a strict dict with task_id for the next step
            return {
                "task_id": task_id,
                "raw": data
            }

        kie_result = await step.run("call-kie-api", call_kie)
        task_id = kie_result.get("task_id", "")

        # Step 2: Poll for completion
        # Poll up to 60 times (10 minutes)
        from datetime import timedelta
        final_status = None
        for _ in range(60):
            await step.sleep("wait-10s", timedelta(seconds=10))
            
            # Check status
            async def check_kie() -> dict:
                from app.kie_client import kie_client
                return await kie_client.get_task_status(task_id)

            status_response = await step.run("check-kie-status", check_kie)
            
            # Map KIE status code to internal status
            # 0: Processing, 1: Success, 2: Failed, 3: Canceled
            kie_data = status_response.get("data", {})
            kie_status = kie_data.get("status")
            
            status = "processing"
            if kie_status == 1:
                status = "succeeded"
            elif kie_status in [2, 3]:
                status = "failed"
            
            logger.info(f"[INNGEST] Polling task {task_id}: {status} (KIE code: {kie_status})")
            
            if status in ["succeeded", "failed"]:
                # Extract result URL
                result_url = kie_data.get("resultUrl") or kie_data.get("url") or ""
                # KIE might return a list of URLs
                result_urls = kie_data.get("resultUrls") or ([result_url] if result_url else [])
                
                final_status = {
                    "status": status,
                    "result_url": result_url,
                    "result_urls": result_urls,
                    "error": kie_data.get("error") if status == "failed" else None
                }
                break
        
        if not final_status:
            raise Exception("Generation timed out after 10 minutes")

        # Step 3: Update generation in DB
        async def update_db() -> dict:
            from app.database import async_session
            from app.models import Generation, CreditAccount, CreditTransaction
            from sqlalchemy import select
            
            async with async_session() as db:
                result = await db.execute(
                    select(Generation).where(Generation.id == generation_id)
                )
                gen = result.scalar_one_or_none()
                
                if not gen:
                    return {"status": "not_found"}

                now = datetime.now(timezone.utc)
                kie_status = final_status.get("status")
                
                if kie_status == "succeeded":
                    gen.status = "succeeded"
                    gen.completed_at = now
                    gen.result_url = final_status.get("result_url") or ""
                    gen.result_urls = final_status.get("result_urls") or []
                    gen.provider_response = final_status
                    # Credits already reserved, nothing to do
                    
                elif kie_status == "failed":
                    gen.status = "failed"
                    gen.completed_at = now
                    gen.error_message = final_status.get("error") or "Unknown error"
                    gen.provider_response = final_status
                    
                    # Refund credits
                    res = await db.execute(
                        select(CreditAccount).where(CreditAccount.owner_id == gen.user_id)
                    )
                    account = res.scalar_one_or_none()
                    if account and gen.credits_reserved > 0:
                        account.balance += gen.credits_reserved
                        account.total_spent -= gen.credits_reserved
                        
                        refund = CreditTransaction(
                            account_id=account.id,
                            amount=gen.credits_reserved,
                            type="refund",
                            generation_id=gen.id,
                        )
                        db.add(refund)
                        gen.credits_final = 0

                await db.commit()
                return {"id": gen.id, "status": gen.status}

        result = await step.run("update-db", update_db)
        return result

    except Exception as e:
        import traceback
        logger.error(f"[INNGEST] Error processing generation: {e}")
        logger.error(traceback.format_exc())
        raise e
