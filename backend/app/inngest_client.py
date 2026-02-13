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

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{kie_base}/api/v1/jobs/createTask",
                        json=payload,
                        headers=headers,
                    )

                if response.status_code != 200:
                    logger.error(f"[INNGEST] KIE API Error: {response.status_code} — {response.text}")
                    return {"error": f"HTTP {response.status_code}", "raw": response.text}

                data = response.json()
                logger.info(f"[INNGEST] KIE response: {data}")
                
                # Extract task_id
                task_id = data.get("taskId") or data.get("task_id") or data.get("id")
                if not task_id and "data" in data and data["data"]:
                    task_id = data["data"].get("taskId") or data["data"].get("id")
                
                return {
                    "task_id": task_id,
                    "raw": data,
                    "error": data.get("msg") if data.get("code") != 200 else None
                }
            except Exception as e:
                logger.error(f"[INNGEST] KIE Call Exception: {e}")
                return {"error": str(e)}

        kie_result = await step.run("call-kie-api", call_kie)
        task_id = kie_result.get("task_id", "")
        
        if not task_id:
            error_msg = kie_result.get("error") or "Unknown KIE Error"
            raise Exception(f"Failed to create KIE task: {error_msg}")

        # Save provider_task_id to DB so webhook and status can find this generation
        async def save_task_id() -> dict:
            from app.database import async_session
            from app.models import Generation
            from sqlalchemy import select
            async with async_session() as db:
                result = await db.execute(
                    select(Generation).where(Generation.id == generation_id)
                )
                gen = result.scalar_one_or_none()
                if gen:
                    gen.provider_task_id = task_id
                    gen.status = "processing"
                    await db.commit()
                return {"saved": True}

        await step.run("save-task-id", save_task_id)

        # Step 2: Poll for completion
        # Poll up to 60 times (10 minutes)
        from datetime import timedelta
        final_status = None
        for poll_idx in range(60):
            await step.sleep(f"wait-10s-{poll_idx}", timedelta(seconds=10))
            
            # Check status — each step must have a unique name
            async def check_kie() -> dict:
                from app.kie_client import kie_client
                return await kie_client.get_task_status(task_id)

            status_response = await step.run(f"check-kie-status-{poll_idx}", check_kie)
            
            kie_data = status_response.get("data", {})
            # KIE uses 'state' string: 'generating', 'success', 'fail'
            kie_state = kie_data.get("state")
            
            status = "processing"
            if kie_state == "success":
                status = "succeeded"
            elif kie_state in ["fail", "cancel"]:
                status = "failed"
            
            logger.info(f"[INNGEST] Polling task {task_id}: {status} (KIE state: {kie_state})")
            
            if status in ["succeeded", "failed"]:
                # Extract result URL from resultJson (it's a stringified JSON)
                result_url = ""
                result_urls = []
                
                result_json_str = kie_data.get("resultJson")
                if result_json_str:
                    try:
                        import json
                        result_data = json.loads(result_json_str)
                        result_urls = result_data.get("resultUrls") or []
                        if result_urls:
                            result_url = result_urls[0]
                    except:
                        pass
                
                # Fallbacks
                if not result_url:
                    result_url = kie_data.get("resultUrl") or kie_data.get("url") or ""
                if not result_urls and result_url:
                    result_urls = [result_url]
                
                final_status = {
                    "status": status,
                    "result_url": result_url,
                    "result_urls": result_urls,
                    "error": kie_data.get("failMsg") or kie_data.get("error") if status == "failed" else None
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
                    gen.credits_final = gen.credits_reserved  # finalize cost
                    
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
