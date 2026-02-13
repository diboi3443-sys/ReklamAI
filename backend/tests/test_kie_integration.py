"""
ReklamAI v2.0 — KIE.ai Integration Tests
Tests the generation flow, webhook processing, and KIE client with mocked external calls.
"""
import os
import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport

# Force SQLite for tests BEFORE importing app
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["KIE_API_KEY"] = "test-kie-key"
os.environ["KIE_BASE_URL"] = "https://mock-kie.example.com"
os.environ["INNGEST_DEV"] = "1"

from app.main import app  # noqa: E402
from app.database import engine, Base, async_session  # noqa: E402
from app.models import Generation, CreditAccount  # noqa: E402
from sqlalchemy import select  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def auth_headers(client: AsyncClient, email: str = "kie@test.com") -> dict:
    """Register a user and return Authorization headers."""
    reg = await client.post("/auth/register", json={
        "email": email,
        "password": "password123",
        "full_name": "KIE Test User",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ════════════════════════════════════════════════
# GENERATION: Create (with mocked Inngest)
# ════════════════════════════════════════════════
@pytest.mark.asyncio
@patch("app.routes.generate.inngest_client")
async def test_create_generation(mock_inngest, client: AsyncClient):
    """Test creating a generation with mocked Inngest dispatch."""
    # Mock inngest_client.send() to do nothing
    mock_inngest.send = AsyncMock()

    headers = await auth_headers(client, "gen_create@test.com")

    res = await client.post("/api/generate", headers=headers, json={
        "prompt": "A beautiful sunset over Moscow",
        "preset_slug": "text-to-video",
        "model_slug": "kling-v2",
        "aspect_ratio": "16:9",
        "duration": 10,
    })
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["status"] == "queued"
    assert data["prompt"] == "A beautiful sunset over Moscow"
    assert data["preset_slug"] == "text-to-video"
    assert data["model_slug"] == "kling-v2"
    assert data["credits_reserved"] > 0
    assert "id" in data

    # Verify Inngest was called
    mock_inngest.send.assert_called_once()
    event = mock_inngest.send.call_args[0][0]
    assert event.name == "reklamai/generation.requested"
    assert event.data["generation_id"] == data["id"]
    assert event.data["payload"]["model"] == "kling-v2"


@pytest.mark.asyncio
@patch("app.routes.generate.inngest_client")
async def test_create_generation_deducts_credits(mock_inngest, client: AsyncClient):
    """Verify that creating a generation deducts credits."""
    mock_inngest.send = AsyncMock()
    headers = await auth_headers(client, "credits_test@test.com")

    # Check initial balance
    credits_res = await client.get("/api/credits", headers=headers)
    initial_balance = credits_res.json()["balance"]

    # Create a generation
    await client.post("/api/generate", headers=headers, json={
        "prompt": "Test",
        "model_slug": "kling-v2",
    })

    # Check balance after
    credits_res = await client.get("/api/credits", headers=headers)
    new_balance = credits_res.json()["balance"]

    assert new_balance < initial_balance


@pytest.mark.asyncio
async def test_create_generation_no_auth(client: AsyncClient):
    """Unauthenticated users cannot create generations."""
    res = await client.post("/api/generate", json={"prompt": "test"})
    assert res.status_code == 401


@pytest.mark.asyncio
@patch("app.routes.generate.inngest_client")
async def test_get_generation_status(mock_inngest, client: AsyncClient):
    """Test fetching a single generation by ID."""
    mock_inngest.send = AsyncMock()
    headers = await auth_headers(client, "status@test.com")

    # Create
    create_res = await client.post("/api/generate", headers=headers, json={
        "prompt": "Status test",
        "model_slug": "kling-v2",
    })
    gen_id = create_res.json()["id"]

    # Get status
    res = await client.get(f"/api/generations/{gen_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == gen_id
    assert res.json()["status"] == "queued"


@pytest.mark.asyncio
async def test_get_generation_not_found(client: AsyncClient):
    """Non-existent generation returns 404."""
    headers = await auth_headers(client, "notfound@test.com")
    res = await client.get("/api/generations/fake-id-123", headers=headers)
    assert res.status_code == 404


# ════════════════════════════════════════════════
# WEBHOOK: KIE.ai Callbacks
# ════════════════════════════════════════════════
@pytest.mark.asyncio
@patch("app.routes.generate.inngest_client")
async def test_webhook_success(mock_inngest, client: AsyncClient):
    """Test webhook for successful generation completion."""
    mock_inngest.send = AsyncMock()
    headers = await auth_headers(client, "webhook_ok@test.com")

    # Create a generation
    create_res = await client.post("/api/generate", headers=headers, json={
        "prompt": "Webhook test",
        "model_slug": "kling-v2",
    })
    gen_id = create_res.json()["id"]

    # Simulate: worker sets provider_task_id
    async with async_session() as db:
        result = await db.execute(select(Generation).where(Generation.id == gen_id))
        gen = result.scalar_one()
        gen.provider_task_id = "kie-task-12345"
        gen.status = "processing"
        await db.commit()

    # Simulate KIE.ai webhook callback (success)
    webhook_res = await client.post("/webhook/kie", json={
        "task_id": "kie-task-12345",
        "status": "completed",
        "output": {
            "video_url": "https://cdn.kie.ai/results/video_123.mp4",
            "thumbnail_url": "https://cdn.kie.ai/results/thumb_123.jpg",
            "urls": ["https://cdn.kie.ai/results/video_123.mp4"],
        },
    })
    assert webhook_res.status_code == 200
    data = webhook_res.json()
    assert data["ok"] is True
    assert data["status"] == "succeeded"

    # Verify generation was updated
    status_res = await client.get(f"/api/generations/{gen_id}", headers=headers)
    gen_data = status_res.json()
    assert gen_data["status"] == "succeeded"
    assert gen_data["result_url"] == "https://cdn.kie.ai/results/video_123.mp4"
    assert gen_data["thumbnail_url"] == "https://cdn.kie.ai/results/thumb_123.jpg"


@pytest.mark.asyncio
@patch("app.routes.generate.inngest_client")
async def test_webhook_failure_refunds_credits(mock_inngest, client: AsyncClient):
    """Test that webhook failure refunds reserved credits."""
    mock_inngest.send = AsyncMock()
    headers = await auth_headers(client, "webhook_fail@test.com")

    # Check initial balance
    credits_res = await client.get("/api/credits", headers=headers)
    initial_balance = credits_res.json()["balance"]

    # Create generation (deducts credits)
    create_res = await client.post("/api/generate", headers=headers, json={
        "prompt": "Will fail",
        "model_slug": "kling-v2",
    })
    gen_id = create_res.json()["id"]
    reserved = create_res.json()["credits_reserved"]

    # Verify balance was deducted
    credits_res = await client.get("/api/credits", headers=headers)
    after_create = credits_res.json()["balance"]
    assert after_create < initial_balance

    # Simulate: worker sets provider_task_id
    async with async_session() as db:
        result = await db.execute(select(Generation).where(Generation.id == gen_id))
        gen = result.scalar_one()
        gen.provider_task_id = "kie-fail-task-999"
        gen.status = "processing"
        await db.commit()

    # Simulate KIE.ai webhook callback (failure)
    webhook_res = await client.post("/webhook/kie", json={
        "task_id": "kie-fail-task-999",
        "status": "failed",
        "error": "Model overloaded, please retry",
    })
    assert webhook_res.status_code == 200
    assert webhook_res.json()["status"] == "failed"

    # Verify credits were refunded
    credits_res = await client.get("/api/credits", headers=headers)
    after_refund = credits_res.json()["balance"]
    assert after_refund == initial_balance  # full refund

    # Verify generation status
    status_res = await client.get(f"/api/generations/{gen_id}", headers=headers)
    assert status_res.json()["status"] == "failed"
    assert "overloaded" in status_res.json()["error_message"]


@pytest.mark.asyncio
@patch("app.routes.generate.inngest_client")
async def test_webhook_processing_progress(mock_inngest, client: AsyncClient):
    """Test webhook for progress updates during processing."""
    mock_inngest.send = AsyncMock()
    headers = await auth_headers(client, "webhook_prog@test.com")

    # Create + set task_id
    create_res = await client.post("/api/generate", headers=headers, json={
        "prompt": "Progress test",
        "model_slug": "kling-v2",
    })
    gen_id = create_res.json()["id"]

    async with async_session() as db:
        result = await db.execute(select(Generation).where(Generation.id == gen_id))
        gen = result.scalar_one()
        gen.provider_task_id = "kie-progress-task"
        await db.commit()

    # Simulate progress update
    webhook_res = await client.post("/webhook/kie", json={
        "task_id": "kie-progress-task",
        "status": "processing",
        "progress": 45,
    })
    assert webhook_res.status_code == 200
    assert webhook_res.json()["status"] == "processing"

    # Verify progress
    status_res = await client.get(f"/api/generations/{gen_id}", headers=headers)
    assert status_res.json()["progress"] == 45


@pytest.mark.asyncio
async def test_webhook_unknown_task(client: AsyncClient):
    """Webhook with unknown task_id returns not found."""
    res = await client.post("/webhook/kie", json={
        "task_id": "nonexistent-task-id",
        "status": "completed",
    })
    assert res.status_code == 200
    assert res.json()["ok"] is False


@pytest.mark.asyncio
async def test_webhook_missing_task_id(client: AsyncClient):
    """Webhook without task_id returns 400."""
    res = await client.post("/webhook/kie", json={
        "status": "completed",
    })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_webhook_invalid_json(client: AsyncClient):
    """Webhook with invalid JSON returns 400."""
    res = await client.post(
        "/webhook/kie",
        content=b"not json",
        headers={"Content-Type": "application/json"},
    )
    assert res.status_code == 400


# ════════════════════════════════════════════════
# KIE CLIENT: Mocked HTTP
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_kie_client_create_task():
    """Test KIEClient.create_task with mocked httpx."""
    from app.kie_client import KIEClient

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "task_id": "mock-task-id-123",
        "status": "queued",
    }

    with patch("httpx.AsyncClient") as mock_client_class:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_client_class.return_value = mock_instance

        kie = KIEClient()
        result = await kie.create_task(
            model_id="kling-v2",
            prompt="Test prompt",
            aspect_ratio="16:9",
        )

        assert result["task_id"] == "mock-task-id-123"
        mock_instance.post.assert_called_once()
        call_args = mock_instance.post.call_args
        assert "kling-v2" in str(call_args)


@pytest.mark.asyncio
async def test_kie_client_create_task_error():
    """Test KIEClient handles API errors."""
    from app.kie_client import KIEClient

    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"

    with patch("httpx.AsyncClient") as mock_client_class:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_client_class.return_value = mock_instance

        kie = KIEClient()
        with pytest.raises(Exception, match="KIE API error 500"):
            await kie.create_task(model_id="kling-v2", prompt="Test")


@pytest.mark.asyncio
async def test_kie_client_get_status():
    """Test KIEClient.get_task_status with mocked httpx."""
    from app.kie_client import KIEClient

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "task_id": "check-me-123",
        "status": "processing",
        "progress": 60,
    }

    with patch("httpx.AsyncClient") as mock_client_class:
        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_client_class.return_value = mock_instance

        kie = KIEClient()
        result = await kie.get_task_status("check-me-123")

        assert result["status"] == "processing"
        assert result["progress"] == 60
        mock_instance.get.assert_called_once()


# ════════════════════════════════════════════════
# FULL FLOW: Create → Webhook → Verify
# ════════════════════════════════════════════════
@pytest.mark.asyncio
@patch("app.routes.generate.inngest_client")
async def test_full_generation_flow(mock_inngest, client: AsyncClient):
    """
    E2E test: create generation → simulate KIE processing → webhook success → verify.
    """
    mock_inngest.send = AsyncMock()
    headers = await auth_headers(client, "e2e@test.com")

    # 1. Create generation
    create_res = await client.post("/api/generate", headers=headers, json={
        "prompt": "A cat wearing a top hat, cinematic",
        "model_slug": "kling-v2",
        "preset_slug": "text-to-video",
        "aspect_ratio": "16:9",
        "duration": 5,
    })
    assert create_res.status_code in (200, 201)
    gen_id = create_res.json()["id"]

    # 2. Verify initial state
    status_res = await client.get(f"/api/generations/{gen_id}", headers=headers)
    assert status_res.json()["status"] == "queued"

    # 3. Simulate worker setting task_id
    async with async_session() as db:
        result = await db.execute(select(Generation).where(Generation.id == gen_id))
        gen = result.scalar_one()
        gen.provider_task_id = "kie-e2e-task"
        gen.status = "processing"
        gen.progress = 0
        await db.commit()

    # 4. Webhook: progress update
    await client.post("/webhook/kie", json={
        "task_id": "kie-e2e-task",
        "status": "processing",
        "progress": 50,
    })

    status_res = await client.get(f"/api/generations/{gen_id}", headers=headers)
    assert status_res.json()["status"] == "processing"
    assert status_res.json()["progress"] == 50

    # 5. Webhook: completion
    await client.post("/webhook/kie", json={
        "task_id": "kie-e2e-task",
        "status": "completed",
        "output": {
            "video_url": "https://cdn.kie.ai/cat_tophat.mp4",
            "thumbnail_url": "https://cdn.kie.ai/cat_tophat_thumb.jpg",
        },
    })

    # 6. Verify final state
    final_res = await client.get(f"/api/generations/{gen_id}", headers=headers)
    final = final_res.json()
    assert final["status"] == "succeeded"
    assert final["result_url"] == "https://cdn.kie.ai/cat_tophat.mp4"
    assert final["thumbnail_url"] == "https://cdn.kie.ai/cat_tophat_thumb.jpg"

    # 7. Verify it shows in generations list
    list_res = await client.get("/api/generations", headers=headers)
    assert list_res.json()["total"] == 1
    assert list_res.json()["items"][0]["id"] == gen_id

    # 8. Verify status filter works
    succeeded_res = await client.get("/api/generations?status=succeeded", headers=headers)
    assert succeeded_res.json()["total"] == 1

    processing_res = await client.get("/api/generations?status=processing", headers=headers)
    assert processing_res.json()["total"] == 0
