"""
ReklamAI v2.0 — KIE.ai Client
Handles communication with the KIE.ai API for AI generation.
"""
import httpx
from typing import Optional
from app.config import get_settings

settings = get_settings()


class KIEClient:
    """Async HTTP client for KIE.ai API."""

    def __init__(self):
        self.base_url = settings.kie_base_url
        self.api_key = settings.kie_api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_task(
        self,
        model_id: str,
        prompt: str,
        negative_prompt: str = "",
        aspect_ratio: str = "16:9",
        duration: int = 10,
        input_image_url: str = "",
        reference_image_url: str = "",
        webhook_url: str = "",
        extra_params: dict | None = None,
    ) -> dict:
        """
        Отправляет задачу на генерацию в KIE.ai.
        Возвращает { task_id, status, ... }.
        """
        payload = {
            "model": model_id,
            "input": {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "aspect_ratio": aspect_ratio,
                "duration": str(duration),
                "image_url": input_image_url,
                "image_reference_url": reference_image_url,
                **(extra_params or {}),
            },
        }

        if webhook_url:
            payload["webhook"] = webhook_url

        # Remove empty values
        payload["input"] = {k: v for k, v in payload["input"].items() if v}

        import logging
        logger = logging.getLogger("uvicorn")
        logger.info(f"[KIE] Sending task: model={model_id}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/jobs/createTask",
                json=payload,
                headers=self.headers,
            )

        if response.status_code != 200:
            error_detail = response.text
            logger.error(f"[KIE] Error {response.status_code}: {error_detail}")
            raise Exception(f"KIE API error {response.status_code}: {error_detail}")

        data = response.json()
        logger.info(f"[KIE] Task created: {data.get('task_id', data.get('taskId', 'unknown'))}")
        return data

    async def get_task_status(self, task_id: str) -> dict:
        """
        Проверяет статус задачи в KIE.ai.
        """
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Note: request uses query param taskId
            response = await client.get(
                f"{self.base_url}/api/v1/jobs/recordInfo",
                params={"taskId": task_id},
                headers=self.headers,
            )

        if response.status_code != 200:
            raise Exception(f"KIE status error {response.status_code}: {response.text}")

        return response.json()

    async def cancel_task(self, task_id: str) -> dict:
        """
        Отменяет задачу в KIE.ai.
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/tasks/{task_id}/cancel",
                headers=self.headers,
            )
        return response.json()


# Singleton
kie_client = KIEClient()
